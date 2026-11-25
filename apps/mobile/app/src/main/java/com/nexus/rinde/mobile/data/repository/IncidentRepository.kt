package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.sync.SyncScheduler
import java.util.UUID

class IncidentRepository(
    private val queueStore: QueueStore,
    private val syncScheduler: SyncScheduler,
    private val deletePhotoFile: (String?) -> Unit,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    suspend fun findByKey(idempotencyKey: String): QueueItemEntity? =
        queueStore.findByKey(idempotencyKey)

    suspend fun enqueueNewIncident(
        userId: String,
        trip: Trip,
        type: String,
        rawDescription: String,
        photo: CapturedPhoto?,
    ): QueueItemEntity {
        require(trip.status == "IN_ROUTE") {
            "Solo puedes reportar incidencias durante un viaje en ruta."
        }
        val validType = InputRules.incidentType(type)
        val validDescription = InputRules.incidentDescription(rawDescription)
        val now = clock()
        val payload = IncidentQueuePayload(
            type = validType,
            description = validDescription,
        )
        val entity = QueueItemEntity(
            idempotencyKey = "INC-${UUID.randomUUID()}",
            ownerUserId = userId,
            itemType = QueueItemType.INCIDENT.name,
            tripId = trip.id,
            tripCode = trip.code,
            payloadJson = payload.toJson(),
            photoPath = photo?.file?.absolutePath,
            photoFileName = photo?.fileName,
            photoSizeBytes = photo?.sizeBytes ?: 0L,
            status = QueueItemStatus.PENDING.name,
            createdAtEpochMs = now,
            updatedAtEpochMs = now,
        )
        queueStore.upsert(entity)
        syncScheduler.scheduleWhenOnline()
        return entity
    }

    suspend fun updateRejectedIncident(
        existing: QueueItemEntity,
        type: String,
        rawDescription: String,
        newPhoto: CapturedPhoto?,
        removeExistingPhoto: Boolean,
    ): QueueItemEntity {
        val validType = InputRules.incidentType(type)
        val validDescription = InputRules.incidentDescription(rawDescription)
        val now = clock()
        val payload = IncidentQueuePayload(
            type = validType,
            description = validDescription,
        )

        if (newPhoto != null && existing.photoPath != null && existing.photoPath != newPhoto.file.absolutePath) {
            deletePhotoFile(existing.photoPath)
        }
        if (removeExistingPhoto && newPhoto == null) {
            deletePhotoFile(existing.photoPath)
        }

        val finalPhotoPath = when {
            newPhoto != null -> newPhoto.file.absolutePath
            removeExistingPhoto -> null
            else -> existing.photoPath
        }
        val finalPhotoName = when {
            newPhoto != null -> newPhoto.fileName
            removeExistingPhoto -> null
            else -> existing.photoFileName
        }
        val finalPhotoSize = when {
            newPhoto != null -> newPhoto.sizeBytes
            removeExistingPhoto -> 0L
            else -> existing.photoSizeBytes
        }

        val nextStatus = if (!existing.remoteId.isNullOrBlank() && !finalPhotoPath.isNullOrBlank()) {
            QueueItemStatus.PHOTO_PENDING
        } else {
            QueueItemStatus.PENDING
        }

        val updated = existing.copy(
            payloadJson = payload.toJson(),
            photoPath = finalPhotoPath,
            photoFileName = finalPhotoName,
            photoSizeBytes = finalPhotoSize,
            status = nextStatus.name,
            rejectionCode = "",
            errorMessage = "",
            retryCount = 0,
            nextRetryAtEpochMs = 0L,
            updatedAtEpochMs = now,
        )
        queueStore.upsert(updated)
        syncScheduler.scheduleWhenOnline()
        return updated
    }
}
