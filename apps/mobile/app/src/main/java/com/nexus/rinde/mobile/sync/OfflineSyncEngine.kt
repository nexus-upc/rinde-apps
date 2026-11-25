package com.nexus.rinde.mobile.sync

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.ReportIncidentRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import com.nexus.rinde.mobile.data.repository.PushDeviceRepository
import com.nexus.rinde.mobile.data.repository.PushSyncOutcome
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

private data class StepCounters(
    val syncedCount: Int = 0,
    val photoPendingCount: Int = 0,
    val rejectedCount: Int = 0,
    val retryPendingCount: Int = 0,
    val sessionExpired: Boolean = false,
) {
    operator fun plus(other: StepCounters) = StepCounters(
        syncedCount = syncedCount + other.syncedCount,
        photoPendingCount = photoPendingCount + other.photoPendingCount,
        rejectedCount = rejectedCount + other.rejectedCount,
        retryPendingCount = retryPendingCount + other.retryPendingCount,
        sessionExpired = sessionExpired || other.sessionExpired,
    )
}

class OfflineSyncEngine(
    private val sessionStore: SessionStore,
    private val queueStore: QueueStore,
    private val remoteFactory: (SessionData) -> RindeRemoteClient,
    private val deletePhoto: (String?) -> Unit,
    private val pushDeviceRepository: PushDeviceRepository? = null,
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

        try {
            if (pushDeviceRepository?.syncRegistrationIfNeeded(session) == PushSyncOutcome.SESSION_EXPIRED) {
                return@withLock SyncResult.SessionExpired
            }

            val expenseStep = syncPendingExpenses(remote, session.userId, manual)
            if (expenseStep.sessionExpired) return@withLock SyncResult.SessionExpired

            val expensePhotoStep = syncPendingExpensePhotos(remote, session.userId, manual)
            if (expensePhotoStep.sessionExpired) return@withLock SyncResult.SessionExpired

            val incidentStep = syncPendingIncidents(remote, session.userId, manual)
            if (incidentStep.sessionExpired) return@withLock SyncResult.SessionExpired

            val incidentPhotoStep = syncPendingIncidentPhotos(remote, session.userId, manual)
            if (incidentPhotoStep.sessionExpired) return@withLock SyncResult.SessionExpired

            val totals = expenseStep + expensePhotoStep + incidentStep + incidentPhotoStep

            // Conservar solo historial reciente ya confirmado para evitar crecimiento indefinido
            queueStore.purgeOldSynced(session.userId, clock() - SYNCED_RETENTION_MS)
            SyncResult.Completed(
                syncedCount = totals.syncedCount,
                photoPendingCount = totals.photoPendingCount,
                rejectedCount = totals.rejectedCount,
                retryPendingCount = totals.retryPendingCount,
            )
        } finally {
            mutableActiveKeys.value = emptySet()
        }
    }

    private suspend fun syncPendingExpenses(
        remote: RindeRemoteClient,
        userId: String,
        manual: Boolean,
    ): StepCounters {
        val nowMs = clock()
        val pendingExpenses = queueStore
            .findByTypeAndStatus(userId, QueueItemType.EXPENSE, QueueItemStatus.PENDING)
            .filter { manual || it.nextRetryAtEpochMs <= nowMs }

        if (pendingExpenses.isEmpty()) return StepCounters()

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

        var syncedCount = 0
        var photoPendingCount = 0
        var rejectedCount = 0
        var retryPendingCount = 0

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
            if (e.status == 401) return StepCounters(sessionExpired = true)
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

        return StepCounters(
            syncedCount = syncedCount,
            photoPendingCount = photoPendingCount,
            rejectedCount = rejectedCount,
            retryPendingCount = retryPendingCount,
        )
    }

    private suspend fun syncPendingExpensePhotos(
        remote: RindeRemoteClient,
        userId: String,
        manual: Boolean,
    ): StepCounters {
        val photoPending = queueStore
            .findByTypeAndStatus(userId, QueueItemType.EXPENSE, QueueItemStatus.PHOTO_PENDING)
            .filter { manual || it.nextRetryAtEpochMs <= clock() }

        var syncedCount = 0
        var rejectedCount = 0
        var retryPendingCount = 0

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
                if (e.status == 401) return StepCounters(sessionExpired = true)
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

        return StepCounters(
            syncedCount = syncedCount,
            rejectedCount = rejectedCount,
            retryPendingCount = retryPendingCount,
        )
    }

    private suspend fun syncPendingIncidents(
        remote: RindeRemoteClient,
        userId: String,
        manual: Boolean,
    ): StepCounters {
        val pendingIncidents = queueStore
            .findByTypeAndStatus(userId, QueueItemType.INCIDENT, QueueItemStatus.PENDING)
            .filter { manual || it.nextRetryAtEpochMs <= clock() }

        var syncedCount = 0
        var photoPendingCount = 0
        var rejectedCount = 0
        var retryPendingCount = 0

        for (item in pendingIncidents) {
            mutableActiveKeys.value = setOf(item.idempotencyKey)
            val payload = IncidentQueuePayload.fromJson(item.payloadJson)

            try {
                val remoteIncident = remote.reportIncident(
                    tripId = item.tripId,
                    request = ReportIncidentRequest(
                        type = payload.type,
                        description = payload.description,
                        evidenceUrl = null,
                        idempotencyKey = item.idempotencyKey,
                    ),
                )
                if (!item.photoPath.isNullOrBlank()) {
                    photoPendingCount++
                    queueStore.upsert(
                        item.copy(
                            remoteId = remoteIncident.id,
                            status = QueueItemStatus.PHOTO_PENDING.name,
                            rejectionCode = "",
                            errorMessage = "",
                            retryCount = 0,
                            nextRetryAtEpochMs = 0L,
                            updatedAtEpochMs = clock(),
                        ),
                    )
                } else {
                    syncedCount++
                    queueStore.upsert(
                        item.copy(
                            remoteId = remoteIncident.id,
                            status = QueueItemStatus.SYNCED.name,
                            rejectionCode = "",
                            errorMessage = "",
                            retryCount = 0,
                            nextRetryAtEpochMs = 0L,
                            updatedAtEpochMs = clock(),
                        ),
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) return StepCounters(sessionExpired = true)
                if (e.status in PERMANENT_INCIDENT_REJECTION_CODES) {
                    rejectedCount++
                    queueStore.upsert(
                        item.copy(
                            status = QueueItemStatus.REJECTED.name,
                            rejectionCode = "INCIDENT_HTTP_${e.status}",
                            errorMessage = e.message.orEmpty()
                                .ifBlank { defaultIncidentRejectionMessage(e.status) },
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

        return StepCounters(
            syncedCount = syncedCount,
            photoPendingCount = photoPendingCount,
            rejectedCount = rejectedCount,
            retryPendingCount = retryPendingCount,
        )
    }

    private suspend fun syncPendingIncidentPhotos(
        remote: RindeRemoteClient,
        userId: String,
        manual: Boolean,
    ): StepCounters {
        val photoPending = queueStore
            .findByTypeAndStatus(userId, QueueItemType.INCIDENT, QueueItemStatus.PHOTO_PENDING)
            .filter { manual || it.nextRetryAtEpochMs <= clock() }

        var syncedCount = 0
        var rejectedCount = 0
        var retryPendingCount = 0

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
                remote.uploadIncidentEvidence(
                    incidentId = remoteId,
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
                if (e.status == 401) return StepCounters(sessionExpired = true)
                if (e.status == 501 || e.status >= 500 || e.status == 408 || e.status == 429) {
                    // Conservar remoteId y la foto local para reintentar sin duplicar la incidencia
                    retryPendingCount++
                    val message = if (e.status == 501) {
                        "La incidencia se registró en el servidor; la subida de foto quedó pendiente hasta que el servicio la habilite."
                    } else {
                        friendlyError(e)
                    }
                    queueStore.upsert(
                        scheduleRetry(
                            item = item,
                            message = message,
                            nowMs = clock(),
                        ),
                    )
                } else {
                    rejectedCount++
                    queueStore.upsert(
                        item.copy(
                            status = QueueItemStatus.REJECTED.name,
                            rejectionCode = "INCIDENT_EVIDENCE_HTTP_${e.status}",
                            errorMessage = e.message.orEmpty()
                                .ifBlank { "No pudimos adjuntar la foto de la incidencia en el servidor." },
                            updatedAtEpochMs = clock(),
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

        return StepCounters(
            syncedCount = syncedCount,
            rejectedCount = rejectedCount,
            retryPendingCount = retryPendingCount,
        )
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

    private fun defaultIncidentRejectionMessage(status: Int): String = when (status) {
        400 -> "Los datos de la incidencia no son válidos."
        403 -> "Solo el conductor asignado al viaje puede reportar incidencias."
        404 -> "El viaje ya no está disponible para reportar incidencias."
        409 -> "Solo se puede reportar una incidencia cuando el viaje está en ruta."
        else -> "El servidor rechazó el reporte de la incidencia."
    }

    private fun friendlyError(error: Throwable): String = when (error) {
        is ApiException -> error.message.orEmpty()
            .ifBlank { "No pudimos conectar con el servidor. Reintentaremos pronto." }
        is IOException -> "Sin conexión estable con el servidor. Reintentaremos al recuperar señal."
        else -> "No pudimos completar el envío. Reintentaremos pronto."
    }

    private companion object {
        const val SYNCED_RETENTION_MS = 7L * 24L * 60L * 60L * 1000L
        val PERMANENT_INCIDENT_REJECTION_CODES = setOf(400, 403, 404, 409)
    }
}
