package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.CachedTripDao
import com.nexus.rinde.mobile.data.local.CachedTripEntity
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Trip
import org.json.JSONObject
import java.io.IOException

data class TripsLoadResult(
    val trips: List<Trip>,
    val fromCache: Boolean,
)

class TripRepository(
    private val cachedTripDao: CachedTripDao,
    private val remoteFactory: (SessionData) -> RindeRemoteClient,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    suspend fun loadTrips(session: SessionData): TripsLoadResult {
        return try {
            val remoteTrips = remoteFactory(session).trips()
            val now = clock()
            cachedTripDao.deleteByUser(session.userId)
            cachedTripDao.upsertAll(
                remoteTrips.map { trip ->
                    CachedTripEntity(
                        ownerUserId = session.userId,
                        tripId = trip.id,
                        tripJson = trip.toJson().toString(),
                        updatedAtEpochMs = now,
                    )
                },
            )
            TripsLoadResult(trips = remoteTrips, fromCache = false)
        } catch (apiError: ApiException) {
            throw apiError
        } catch (ioError: IOException) {
            val cached = cachedTripDao.findByUser(session.userId)
                .mapNotNull { runCatching { Trip.from(JSONObject(it.tripJson)) }.getOrNull() }
            if (cached.isNotEmpty()) {
                TripsLoadResult(trips = cached, fromCache = true)
            } else {
                throw ioError
            }
        }
    }

    suspend fun loadTrip(session: SessionData, tripId: String): Trip {
        return try {
            val fresh = remoteFactory(session).trip(tripId)
            cachedTripDao.upsertAll(
                listOf(
                    CachedTripEntity(
                        ownerUserId = session.userId,
                        tripId = fresh.id,
                        tripJson = fresh.toJson().toString(),
                        updatedAtEpochMs = clock(),
                    ),
                ),
            )
            fresh
        } catch (apiError: ApiException) {
            throw apiError
        } catch (ioError: IOException) {
            cachedTripDao.findOne(session.userId, tripId)
                ?.let { runCatching { Trip.from(JSONObject(it.tripJson)) }.getOrNull() }
                ?: throw ioError
        }
    }

    suspend fun changeStatus(session: SessionData, tripId: String, action: String): Trip {
        val updated = remoteFactory(session).changeTripStatus(tripId, action)
        cachedTripDao.upsertAll(
            listOf(
                CachedTripEntity(
                    ownerUserId = session.userId,
                    tripId = updated.id,
                    tripJson = updated.toJson().toString(),
                    updatedAtEpochMs = clock(),
                ),
            ),
        )
        return updated
    }

    suspend fun loadRemoteExpenses(session: SessionData, tripId: String): List<Expense> =
        remoteFactory(session).expenses(tripId)

    suspend fun loadEvidenceBytes(session: SessionData, contentUrl: String): ByteArray =
        remoteFactory(session).downloadEvidenceBytes(contentUrl)
}
