package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.remote.EvidenceMetadata
import com.nexus.rinde.mobile.data.remote.Expense

data class TripExpenseDisplayItem(
    val idempotencyKey: String,
    val remoteId: String?,
    val category: String,
    val amount: String,
    val currency: String,
    val date: String,
    val backendStatus: String,
    val queueStatus: QueueItemStatus?,
    val isSyncingNow: Boolean,
    val observationReason: String,
    val queueError: String,
    val localPhotoPath: String?,
    val localPhotoName: String?,
    val remoteEvidence: EvidenceMetadata?,
) {
    val canAttachPhoto: Boolean
        get() = queueStatus == null && backendStatus == "PENDING_SUPPORT" && remoteId != null

    val hasAnyPhoto: Boolean
        get() = !localPhotoPath.isNullOrBlank() ||
            (remoteEvidence != null && remoteEvidence.contentUrl.isNotBlank())
}

object ExpenseMerger {
    fun merge(
        serverExpenses: List<Expense>,
        queueItems: List<QueueItemEntity>,
        activeSyncKeys: Set<String> = emptySet(),
    ): List<TripExpenseDisplayItem> {
        val expenseQueue = queueItems.filter { it.queueType == QueueItemType.EXPENSE }
        val byKey = expenseQueue.associateBy { it.idempotencyKey }
        val byRemoteId = expenseQueue
            .filter { !it.remoteId.isNullOrBlank() }
            .associateBy { it.remoteId!! }
        val matchedKeys = mutableSetOf<String>()

        val mergedRemote = serverExpenses.map { remote ->
            val matchedQueue = byKey[remote.key] ?: byRemoteId[remote.id]
            if (matchedQueue != null) matchedKeys.add(matchedQueue.idempotencyKey)

            val activeQueueStatus = matchedQueue?.queueStatus
                ?.takeIf { it != QueueItemStatus.SYNCED }
            TripExpenseDisplayItem(
                idempotencyKey = remote.key.ifBlank { matchedQueue?.idempotencyKey ?: remote.id },
                remoteId = remote.id,
                category = remote.category,
                amount = remote.amount,
                currency = remote.currency,
                date = remote.date,
                backendStatus = remote.status,
                queueStatus = activeQueueStatus,
                isSyncingNow = matchedQueue != null && activeSyncKeys.contains(matchedQueue.idempotencyKey),
                observationReason = remote.reason,
                queueError = if (activeQueueStatus != null) matchedQueue?.errorMessage.orEmpty() else "",
                localPhotoPath = if (activeQueueStatus != null) matchedQueue?.photoPath else null,
                localPhotoName = if (activeQueueStatus != null) matchedQueue?.photoFileName else null,
                remoteEvidence = remote.evidence,
            )
        }

        val queueOnly = expenseQueue
            .filter { item ->
                item.idempotencyKey !in matchedKeys &&
                    item.queueStatus != QueueItemStatus.SYNCED
            }
            .map { item ->
                val payload = ExpenseQueuePayload.fromJson(item.payloadJson)
                TripExpenseDisplayItem(
                    idempotencyKey = item.idempotencyKey,
                    remoteId = item.remoteId,
                    category = payload.category,
                    amount = payload.amount.toPlainString(),
                    currency = payload.currency,
                    date = payload.expenseDate,
                    backendStatus = "",
                    queueStatus = item.queueStatus,
                    isSyncingNow = activeSyncKeys.contains(item.idempotencyKey),
                    observationReason = "",
                    queueError = item.errorMessage,
                    localPhotoPath = item.photoPath,
                    localPhotoName = item.photoFileName,
                    remoteEvidence = null,
                )
            }

        return (queueOnly + mergedRemote).sortedWith(
            compareByDescending<TripExpenseDisplayItem> { it.date }
                .thenByDescending { it.queueStatus == QueueItemStatus.REJECTED }
                .thenByDescending { it.queueStatus != null },
        )
    }
}
