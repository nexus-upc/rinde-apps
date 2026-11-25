package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.CachedTripDao
import com.nexus.rinde.mobile.data.local.CachedTripEntity
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.remote.TripAdvance
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import org.json.JSONObject
import java.io.IOException

data class TripsLoadResult(
    val trips: List<Trip>,
    val fromCache: Boolean,
)

sealed class SettlementLookupResult {
    data class Available(val settlement: Settlement) : SettlementLookupResult()
    data object NotCreated : SettlementLookupResult()
}

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

    suspend fun loadVehicle(session: SessionData, vehicleId: String): VehicleSummary? {
        if (vehicleId.isBlank()) return null
        return try {
            remoteFactory(session).vehicle(vehicleId)
        } catch (apiError: ApiException) {
            if (apiError.status == 401) throw apiError
            null
        } catch (_: IOException) {
            null
        }
    }

    suspend fun loadAdvances(session: SessionData, tripId: String): List<TripAdvance> =
        remoteFactory(session).tripAdvances(tripId)

    suspend fun loadSettlement(session: SessionData, tripId: String): SettlementLookupResult {
        return try {
            val settlement = remoteFactory(session).tripSettlement(tripId)
            if (settlement != null) {
                SettlementLookupResult.Available(settlement)
            } else {
                SettlementLookupResult.NotCreated
            }
        } catch (apiError: ApiException) {
            if (apiError.status == 404 &&
                !apiError.message.orEmpty().contains("El viaje no existe", ignoreCase = true)
            ) {
                SettlementLookupResult.NotCreated
            } else {
                throw apiError
            }
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
