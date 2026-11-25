package com.nexus.rinde.mobile.ui.queue

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.repository.ExpenseRepository
import com.nexus.rinde.mobile.sync.OfflineSyncEngine
import com.nexus.rinde.mobile.sync.SyncResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class QueueUiState(
    val items: List<QueueItemEntity> = emptyList(),
    val activeSyncKeys: Set<String> = emptySet(),
    val busy: Boolean = false,
    val message: String = "",
    val error: String = "",
) {
    val pendingCount: Int get() = items.size
    val retryableCount: Int
        get() = items.count {
            it.queueStatus == QueueItemStatus.PENDING || it.queueStatus == QueueItemStatus.PHOTO_PENDING
        }
}

class QueueViewModel(
    private val expenseRepository: ExpenseRepository,
    private val syncEngine: OfflineSyncEngine,
    private val onSessionExpired: () -> Unit,
    private val onSyncedCompleted: () -> Unit,
) : ViewModel() {

    private val mutable = MutableStateFlow(QueueUiState())
    val state = mutable.asStateFlow()

    private var observeJob: Job? = null
    private var currentUserId: String? = null

    fun bindSession(session: SessionData?) {
        if (session == null) {
            currentUserId = null
            observeJob?.cancel()
            mutable.value = QueueUiState()
            return
        }
        if (session.userId == currentUserId && observeJob != null) return
        currentUserId = session.userId
        observeJob?.cancel()
        observeJob = viewModelScope.launch {
            combine(
                expenseRepository.observePendingAndRejected(session.userId),
                syncEngine.activeSyncKeys,
            ) { list, activeKeys ->
                list to activeKeys
            }.collectLatest { (list, activeKeys) ->
                mutable.update { it.copy(items = list, activeSyncKeys = activeKeys) }
            }
        }
    }

    fun triggerSync(manual: Boolean) {
        if (currentUserId == null || mutable.value.busy) return
        viewModelScope.launch {
            mutable.update {
                it.copy(
                    busy = manual,
                    message = if (manual) "" else it.message,
                    error = if (manual) "" else it.error,
                )
            }
            try {
                when (val result = expenseRepository.syncAll(manual = manual)) {
                    is SyncResult.SessionExpired -> onSessionExpired()
                    is SyncResult.NoSession -> Unit
                    is SyncResult.Completed -> {
                        if (result.syncedCount > 0 || result.photoPendingCount > 0) {
                            onSyncedCompleted()
                        }
                        if (manual) {
                            val summary = when {
                                result.syncedCount > 0 && result.rejectedCount == 0 && result.retryPendingCount == 0 ->
                                    "Sincronización completa: ${result.syncedCount} registro(s) enviado(s)."
                                result.rejectedCount > 0 ->
                                    "Revisa los registros marcados con error en la cola."
                                result.retryPendingCount > 0 || result.photoPendingCount > 0 ->
                                    "Algunos registros quedaron pendientes por señal. Reintentaremos automáticamente."
                                else -> "No hay registros pendientes por enviar."
                            }
                            mutable.update { it.copy(message = summary) }
                        }
                    }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                if (manual) {
                    mutable.update { it.copy(error = "No pudimos completar la sincronización.") }
                }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun retrySingle(idempotencyKey: String) {
        if (mutable.value.busy) return
        viewModelScope.launch {
            mutable.update { it.copy(busy = true, message = "", error = "") }
            try {
                when (val result = expenseRepository.retryItem(idempotencyKey)) {
                    is SyncResult.SessionExpired -> onSessionExpired()
                    is SyncResult.NoSession -> Unit
                    is SyncResult.Completed -> {
                        if (result.syncedCount > 0 || result.photoPendingCount > 0) {
                            onSyncedCompleted()
                        }
                        if (result.syncedCount > 0) {
                            mutable.update { it.copy(message = "Registro sincronizado.") }
                        }
                    }
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                mutable.update { it.copy(error = "No pudimos reenviar el registro.") }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun discard(idempotencyKey: String) {
        viewModelScope.launch {
            expenseRepository.discardItem(idempotencyKey)
            mutable.update { it.copy(message = "Registro descartado de la cola local.") }
        }
    }

    class Factory(
        private val expenseRepository: ExpenseRepository,
        private val syncEngine: OfflineSyncEngine,
        private val onSessionExpired: () -> Unit,
        private val onSyncedCompleted: () -> Unit,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            QueueViewModel(expenseRepository, syncEngine, onSessionExpired, onSyncedCompleted) as T
    }
}
