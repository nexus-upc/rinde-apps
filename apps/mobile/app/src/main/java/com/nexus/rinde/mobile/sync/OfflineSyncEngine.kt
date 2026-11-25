package com.nexus.rinde.mobile.sync

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.io.File
import java.io.IOException

sealed class SyncResult {
    data object NoSession : SyncResult()
    data object SessionExpired : SyncResult()
    data class Completed(
        val syncedCount: Int,
        val photoPendingCount: Int,
        val rejectedCount: Int,
        val retryPendingCount: Int,
    ) : SyncResult()
}

class OfflineSyncEngine(
    private val sessionStore: SessionStore,
    private val queueStore: QueueStore,
    private val remoteFactory: (SessionData) -> RindeRemoteClient,
    private val deletePhoto: (String?) -> Unit,
    private val clock: () -> Long = { System.currentTimeMillis() },
) {
    private val mutex = Mutex()
    private val mutableActiveKeys = MutableStateFlow<Set<String>>(emptySet())
    val activeSyncKeys: StateFlow<Set<String>> = mutableActiveKeys.asStateFlow()

    suspend fun syncNow(manual: Boolean = false): SyncResult = mutex.withLock {
        val session = sessionStore.read() ?: return@withLock SyncResult.NoSession
        val nowSeconds = clock() / 1000L
        if (session.isExpired(nowSeconds)) {
            return@withLock SyncResult.SessionExpired
        }
        val remote = remoteFactory(session)
        var syncedCount = 0
        var photoPendingCount = 0
        var rejectedCount = 0
        var retryPendingCount = 0

        try {
            val nowMs = clock()
            val pendingExpenses = queueStore
                .findByTypeAndStatus(session.userId, QueueItemType.EXPENSE, QueueItemStatus.PENDING)
                .filter { manual || it.nextRetryAtEpochMs <= nowMs }

            if (pendingExpenses.isNotEmpty()) {
                mutableActiveKeys.value = pendingExpenses.map { it.idempotencyKey }.toSet()
                val requests = pendingExpenses.map { entity ->
                    val payload = ExpenseQueuePayload.fromJson(entity.payloadJson)
                    SyncExpenseRequest(
                        tripId = entity.tripId,
                        category = payload.category,
                        amount = payload.amount,
                        currency = payload.currency,
                        expenseDate = payload.expenseDate,
                        idempotencyKey = entity.idempotencyKey,
                    )
                }

                try {
                    val response = remote.syncExpenses(requests)
                    val syncedByKey = response.items.associateBy { it.key }
                    val rejectedByKey = response.rejected.associateBy { it.idempotencyKey }

                    val updatedItems = pendingExpenses.map { item ->
                        val remoteExpense = syncedByKey[item.idempotencyKey]
                        val rejected = rejectedByKey[item.idempotencyKey]
                        when {
                            remoteExpense != null && !item.photoPath.isNullOrBlank() -> {
                                photoPendingCount++
                                item.copy(
                                    remoteId = remoteExpense.id,
                                    status = QueueItemStatus.PHOTO_PENDING.name,
                                    rejectionCode = "",
                                    errorMessage = "",
                                    retryCount = 0,
                                    nextRetryAtEpochMs = 0L,
                                    updatedAtEpochMs = clock(),
                                )
                            }
                            remoteExpense != null -> {
                                syncedCount++
                                item.copy(
                                    remoteId = remoteExpense.id,
                                    status = QueueItemStatus.SYNCED.name,
                                    rejectionCode = "",
                                    errorMessage = "",
                                    retryCount = 0,
                                    nextRetryAtEpochMs = 0L,
                                    updatedAtEpochMs = clock(),
                                )
                            }
                            rejected != null -> {
                                rejectedCount++
                                item.copy(
                                    status = QueueItemStatus.REJECTED.name,
                                    rejectionCode = rejected.code,
                                    errorMessage = rejected.reason.ifBlank {
                                        "El servidor rechazó el gasto."
                                    },
                                    updatedAtEpochMs = clock(),
                                )
                            }
                            else -> {
                                retryPendingCount++
                                scheduleRetry(
                                    item = item,
                                    message = "No recibimos confirmación del gasto. Reintentaremos pronto.",
                                    nowMs = clock(),
                                )
                            }
                        }
                    }
                    queueStore.upsertAll(updatedItems)
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (e: ApiException) {
                    if (e.status == 401) return@withLock SyncResult.SessionExpired
                    val updated = markPendingBatchError(pendingExpenses, e, clock())
                    retryPendingCount += updated.size
                    queueStore.upsertAll(updated)
                } catch (e: IOException) {
                    val updated = markPendingBatchError(pendingExpenses, e, clock())
                    retryPendingCount += updated.size
                    queueStore.upsertAll(updated)
                } catch (e: Exception) {
                    val updated = markPendingBatchError(pendingExpenses, e, clock())
                    retryPendingCount += updated.size
                    queueStore.upsertAll(updated)
                }
            }

            val photoPending = queueStore
                .findByTypeAndStatus(
                    session.userId,
                    QueueItemType.EXPENSE,
                    QueueItemStatus.PHOTO_PENDING,
                )
                .filter { manual || it.nextRetryAtEpochMs <= clock() }

            for (item in photoPending) {
                mutableActiveKeys.value = setOf(item.idempotencyKey)
                val remoteId = item.remoteId
                val path = item.photoPath
                val photoFile = path?.let(::File)

                if (remoteId.isNullOrBlank()) {
                    retryPendingCount++
                    queueStore.upsert(
                        item.copy(
                            status = QueueItemStatus.PENDING.name,
                            updatedAtEpochMs = clock(),
                        ),
                    )
                    continue
                }
                if (photoFile == null || !photoFile.exists()) {
                    rejectedCount++
                    queueStore.upsert(
                        item.copy(
                            status = QueueItemStatus.REJECTED.name,
                            rejectionCode = "PHOTO_MISSING",
                            errorMessage = "La foto local no está disponible. Adjúntala nuevamente.",
                            updatedAtEpochMs = clock(),
                        ),
                    )
                    continue
                }

                try {
                    remote.uploadExpenseEvidence(
                        expenseId = remoteId,
                        file = photoFile,
                        fileName = item.photoFileName ?: photoFile.name,
                        contentType = "image/jpeg",
                    )
                    deletePhoto(path)
                    syncedCount++
                    queueStore.upsert(
                        item.copy(
                            status = QueueItemStatus.SYNCED.name,
                            photoPath = null,
                            photoSizeBytes = 0L,
                            errorMessage = "",
                            rejectionCode = "",
                            retryCount = 0,
                            nextRetryAtEpochMs = 0L,
                            updatedAtEpochMs = clock(),
                        ),
                    )
                } catch (cancelled: CancellationException) {
                    throw cancelled
                } catch (e: ApiException) {
                    if (e.status == 401) return@withLock SyncResult.SessionExpired
                    if (e.status in 400..499) {
                        rejectedCount++
                        queueStore.upsert(
                            item.copy(
                                status = QueueItemStatus.REJECTED.name,
                                rejectionCode = "EVIDENCE_HTTP_${e.status}",
                                errorMessage = e.message.orEmpty()
                                    .ifBlank { "No pudimos guardar el comprobante en el servidor." },
                                updatedAtEpochMs = clock(),
                            ),
                        )
                    } else {
                        retryPendingCount++
                        queueStore.upsert(
                            scheduleRetry(
                                item = item,
                                message = friendlyError(e),
                                nowMs = clock(),
                            ),
                        )
                    }
                } catch (e: Exception) {
                    retryPendingCount++
                    queueStore.upsert(
                        scheduleRetry(
                            item = item,
                            message = friendlyError(e),
                            nowMs = clock(),
                        ),
                    )
                }
            }

            // Conservar solo historial reciente ya confirmado para evitar crecimiento indefinido
            queueStore.purgeOldSynced(session.userId, clock() - SYNCED_RETENTION_MS)
            SyncResult.Completed(
                syncedCount = syncedCount,
                photoPendingCount = photoPendingCount,
                rejectedCount = rejectedCount,
                retryPendingCount = retryPendingCount,
            )
        } finally {
            mutableActiveKeys.value = emptySet()
        }
    }

    private fun markPendingBatchError(
        items: List<QueueItemEntity>,
        error: Throwable,
        nowMs: Long,
    ): List<QueueItemEntity> {
        val message = friendlyError(error)
        return items.map { item -> scheduleRetry(item, message, nowMs) }
    }

    private fun scheduleRetry(
        item: QueueItemEntity,
        message: String,
        nowMs: Long,
    ): QueueItemEntity {
        val nextAttempt = item.retryCount + 1
        return item.copy(
            retryCount = nextAttempt,
            nextRetryAtEpochMs = nowMs + BackoffPolicyCalculator.delayMs(nextAttempt),
            errorMessage = message,
            updatedAtEpochMs = nowMs,
        )
    }

    private fun friendlyError(error: Throwable): String = when (error) {
        is ApiException -> error.message.orEmpty()
            .ifBlank { "No pudimos conectar con el servidor. Reintentaremos pronto." }
        is IOException -> "Sin conexión estable con el servidor. Reintentaremos al recuperar señal."
        else -> "No pudimos completar el envío. Reintentaremos pronto."
    }

    private companion object {
        const val SYNCED_RETENTION_MS = 7L * 24L * 60L * 60L * 1000L
    }
}
