package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.LocationQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.sync.SyncScheduler
import java.time.Instant
import java.time.temporal.ChronoUnit

class TripLocationRepository(
    private val queueStore: QueueStore,
    private val syncScheduler: SyncScheduler,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    suspend fun enqueueLocation(
        userId: String,
        tripId: String,
        tripCode: String,
        latitude: Double,
        longitude: Double,
        accuracyMeters: Double?,
        recordedAt: Instant,
    ): QueueItemEntity {
        val cleanInstant = recordedAt.truncatedTo(ChronoUnit.SECONDS)
        val recordedIso = cleanInstant.toString()
        val now = clock()
        val payload = LocationQueuePayload(
            latitude = latitude,
            longitude = longitude,
            accuracyMeters = accuracyMeters,
            recordedAt = recordedIso,
        )
        val entity = QueueItemEntity(
            idempotencyKey = "LOC-$tripId-$recordedIso",
            ownerUserId = userId,
            itemType = QueueItemType.LOCATION.name,
            tripId = tripId,
            tripCode = tripCode,
            payloadJson = payload.toJson(),
            status = QueueItemStatus.PENDING.name,
            createdAtEpochMs = cleanInstant.toEpochMilli(),
            updatedAtEpochMs = now,
        )
        queueStore.upsert(entity)
        trimTripQueueToLimit(userId, tripId)
        syncScheduler.scheduleWhenOnline()
        return entity
    }

    suspend fun discardPendingForTrip(userId: String, tripId: String) {
        queueStore.deleteByTripAndType(userId, tripId, QueueItemType.LOCATION)
    }

    private suspend fun trimTripQueueToLimit(userId: String, tripId: String) {
        val pendingForTrip = queueStore
            .findByTypeAndStatus(userId, QueueItemType.LOCATION, QueueItemStatus.PENDING)
            .filter { it.tripId == tripId }
            .sortedBy { it.createdAtEpochMs }
        val excess = pendingForTrip.size - MAX_POINTS_PER_TRIP
        if (excess > 0) {
            pendingForTrip.take(excess).forEach { oldest ->
                queueStore.deleteByKey(oldest.idempotencyKey)
            }
        }
    }

    companion object {
        const val MAX_POINTS_PER_TRIP = 200
        const val MAX_BATCH_SIZE = 50
    }
}
