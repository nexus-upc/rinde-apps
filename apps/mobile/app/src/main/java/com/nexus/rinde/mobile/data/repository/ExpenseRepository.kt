package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.sync.OfflineSyncEngine
import com.nexus.rinde.mobile.sync.SyncResult
import com.nexus.rinde.mobile.sync.SyncScheduler
import kotlinx.coroutines.flow.Flow
import java.util.UUID

class ExpenseRepository(
    private val queueStore: QueueStore,
    private val syncEngine: OfflineSyncEngine,
    private val syncScheduler: SyncScheduler,
    private val deletePhotoFile: (String?) -> Unit,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>> =
        queueStore.observePendingAndRejected(userId)

    fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>> =
        queueStore.observeByTrip(userId, tripId)

    suspend fun findByKey(idempotencyKey: String): QueueItemEntity? =
        queueStore.findByKey(idempotencyKey)

    suspend fun enqueueNewExpense(
        userId: String,
        trip: Trip,
        category: String,
        rawAmount: String,
        rawDate: String,
        photo: CapturedPhoto?,
    ): QueueItemEntity {
        require(trip.status == "IN_ROUTE") {
            "Solo puedes registrar gastos durante un viaje en ruta."
        }
        val validAmount = InputRules.amount(rawAmount)
        val validDate = InputRules.expenseDate(rawDate).toString()
        val now = clock()
        val payload = ExpenseQueuePayload(
            category = category,
            amount = validAmount,
            currency = "PEN",
            expenseDate = validDate,
        )
        val entity = QueueItemEntity(
            idempotencyKey = UUID.randomUUID().toString(),
            ownerUserId = userId,
            itemType = QueueItemType.EXPENSE.name,
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

    suspend fun enqueuePhotoForExistingExpense(
        userId: String,
        trip: Trip,
        expense: Expense,
        photo: CapturedPhoto,
    ): QueueItemEntity {
        val now = clock()
        val key = expense.key.ifBlank { "EVIDENCE-${expense.id}" }
        val payload = ExpenseQueuePayload(
            category = expense.category,
            amount = InputRules.amount(expense.amount),
            currency = expense.currency.ifBlank { "PEN" },
            expenseDate = expense.date,
        )
        val existing = queueStore.findByKey(key)
        if (existing?.photoPath != null && existing.photoPath != photo.file.absolutePath) {
            deletePhotoFile(existing.photoPath)
        }
        val entity = QueueItemEntity(
            idempotencyKey = key,
            ownerUserId = userId,
            itemType = QueueItemType.EXPENSE.name,
            tripId = trip.id,
            tripCode = trip.code,
            payloadJson = payload.toJson(),
            photoPath = photo.file.absolutePath,
            photoFileName = photo.fileName,
            photoSizeBytes = photo.sizeBytes,
            remoteId = expense.id,
            status = QueueItemStatus.PHOTO_PENDING.name,
            createdAtEpochMs = existing?.createdAtEpochMs ?: now,
            updatedAtEpochMs = now,
        )
        queueStore.upsert(entity)
        syncScheduler.scheduleWhenOnline()
        return entity
    }

    suspend fun updateRejectedExpense(
        existing: QueueItemEntity,
        category: String,
        rawAmount: String,
        rawDate: String,
        newPhoto: CapturedPhoto?,
        removeExistingPhoto: Boolean,
    ): QueueItemEntity {
        val validAmount = InputRules.amount(rawAmount)
        val validDate = InputRules.expenseDate(rawDate).toString()
        val now = clock()
        val payload = ExpenseQueuePayload(
            category = category,
            amount = validAmount,
            currency = "PEN",
            expenseDate = validDate,
        )

        val nextKey = if (existing.rejectionCode == "DUPLICATE_KEY") {
            UUID.randomUUID().toString()
        } else {
            existing.idempotencyKey
        }
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

        val nextStatus = if (!existing.remoteId.isNullOrBlank() &&
            existing.rejectionCode != "DUPLICATE_KEY" &&
            !finalPhotoPath.isNullOrBlank()
        ) {
            QueueItemStatus.PHOTO_PENDING
        } else {
            QueueItemStatus.PENDING
        }

        val updated = existing.copy(
            idempotencyKey = nextKey,
            payloadJson = payload.toJson(),
            photoPath = finalPhotoPath,
            photoFileName = finalPhotoName,
            photoSizeBytes = finalPhotoSize,
            remoteId = if (nextKey != existing.idempotencyKey) null else existing.remoteId,
            status = nextStatus.name,
            rejectionCode = "",
            errorMessage = "",
            retryCount = 0,
            nextRetryAtEpochMs = 0L,
            updatedAtEpochMs = now,
        )
        if (nextKey != existing.idempotencyKey) {
            queueStore.deleteByKey(existing.idempotencyKey)
        }
        queueStore.upsert(updated)
        syncScheduler.scheduleWhenOnline()
        return updated
    }

    suspend fun retryItem(idempotencyKey: String): SyncResult {
        val item = queueStore.findByKey(idempotencyKey)
        if (item != null) {
            val resetStatus = when {
                item.queueStatus == QueueItemStatus.REJECTED && !item.remoteId.isNullOrBlank() &&
                    !item.photoPath.isNullOrBlank() -> QueueItemStatus.PHOTO_PENDING.name
                item.queueStatus == QueueItemStatus.REJECTED -> QueueItemStatus.PENDING.name
                else -> item.status
            }
            queueStore.upsert(
                item.copy(
                    status = resetStatus,
                    errorMessage = "",
                    rejectionCode = "",
                    nextRetryAtEpochMs = 0L,
                    updatedAtEpochMs = clock(),
                ),
            )
        }
        return syncEngine.syncNow(manual = true)
    }

    suspend fun discardItem(idempotencyKey: String) {
        val existing = queueStore.findByKey(idempotencyKey)
        deletePhotoFile(existing?.photoPath)
        queueStore.deleteByKey(idempotencyKey)
    }

    suspend fun syncAll(manual: Boolean): SyncResult = syncEngine.syncNow(manual = manual)
}
