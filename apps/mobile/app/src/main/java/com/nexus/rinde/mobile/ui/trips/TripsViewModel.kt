package com.nexus.rinde.mobile.ui.trips

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.ExpenseMerger
import com.nexus.rinde.mobile.data.repository.ExpenseRepository
import com.nexus.rinde.mobile.data.repository.TripExpenseDisplayItem
import com.nexus.rinde.mobile.data.repository.TripRepository
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

data class TripsUiState(
    val busy: Boolean = false,
    val trips: List<Trip> = emptyList(),
    val tripsFromCache: Boolean = false,
    val selectedTrip: Trip? = null,
    val remoteExpenses: List<Expense> = emptyList(),
    val displayExpenses: List<TripExpenseDisplayItem> = emptyList(),
    val error: String = "",
    val expenseError: String = "",
    val message: String = "",
    val viewingEvidenceTitle: String = "",
    val viewingEvidenceBytes: ByteArray? = null,
    val viewingEvidenceLocalPath: String? = null,
    val loadingEvidence: Boolean = false,
)

class TripsViewModel(
    private val tripRepository: TripRepository,
    private val expenseRepository: ExpenseRepository,
    private val syncEngine: OfflineSyncEngine,
    private val onSessionExpired: () -> Unit,
) : ViewModel() {

    private val mutable = MutableStateFlow(TripsUiState())
    val state = mutable.asStateFlow()

    private var activeSession: SessionData? = null
    private var tripQueueJob: Job? = null
    private var latestTripQueue: List<QueueItemEntity> = emptyList()
    private var latestActiveKeys: Set<String> = emptySet()

    fun bindSession(session: SessionData?) {
        if (session?.userId == activeSession?.userId && session?.token == activeSession?.token) {
            if (session == null) clearAll()
            return
        }
        activeSession = session
        if (session == null) {
            clearAll()
        } else {
            loadTrips()
        }
    }

    private fun clearAll() {
        tripQueueJob?.cancel()
        latestTripQueue = emptyList()
        mutable.value = TripsUiState()
    }

    fun loadTrips() {
        val session = activeSession ?: return
        if (mutable.value.busy) return
        val currentTripId = mutable.value.selectedTrip?.id
        viewModelScope.launch {
            mutable.update { it.copy(busy = true, error = "", message = "") }
            try {
                val result = tripRepository.loadTrips(session)
                mutable.update {
                    it.copy(
                        trips = result.trips,
                        tripsFromCache = result.fromCache,
                    )
                }
                if (currentTripId != null) {
                    loadTripDetailInternal(session, currentTripId)
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) {
                    onSessionExpired()
                } else {
                    mutable.update { it.copy(error = e.message.orEmpty()) }
                }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(error = "Sin conexión. Conéctate para consultar tus viajes actualizados.")
                }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun openTrip(tripId: String) {
        val session = activeSession ?: return
        if (mutable.value.busy) return
        val initialTrip = mutable.value.trips.firstOrNull { it.id == tripId }
        observeTripQueue(session.userId, tripId)
        viewModelScope.launch {
            mutable.update {
                it.copy(
                    busy = true,
                    selectedTrip = initialTrip,
                    remoteExpenses = emptyList(),
                    displayExpenses = emptyList(),
                    error = "",
                    expenseError = "",
                    message = "",
                )
            }
            try {
                loadTripDetailInternal(session, tripId)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) {
                    onSessionExpired()
                } else {
                    mutable.update { it.copy(error = e.message.orEmpty()) }
                }
            } catch (_: Exception) {
                if (initialTrip == null) {
                    mutable.update {
                        it.copy(error = "No pudimos cargar el detalle del viaje. Inténtalo de nuevo.")
                    }
                }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun refreshOpenTripExpenses() {
        val session = activeSession ?: return
        val tripId = mutable.value.selectedTrip?.id ?: return
        viewModelScope.launch {
            runCatching {
                loadExpensesOnly(session, tripId)
            }
        }
    }

    private fun observeTripQueue(userId: String, tripId: String) {
        tripQueueJob?.cancel()
        tripQueueJob = viewModelScope.launch {
            combine(
                expenseRepository.observeByTrip(userId, tripId),
                syncEngine.activeSyncKeys,
            ) { items, activeKeys ->
                items to activeKeys
            }.collectLatest { (items, activeKeys) ->
                latestTripQueue = items
                latestActiveKeys = activeKeys
                mutable.update { current ->
                    current.copy(
                        displayExpenses = ExpenseMerger.merge(
                            serverExpenses = current.remoteExpenses,
                            queueItems = items,
                            activeSyncKeys = activeKeys,
                        ),
                    )
                }
            }
        }
    }

    private suspend fun loadTripDetailInternal(session: SessionData, tripId: String) {
        val trip = tripRepository.loadTrip(session, tripId)
        mutable.update { it.copy(selectedTrip = trip, expenseError = "") }
        loadExpensesOnly(session, tripId)
    }

    private suspend fun loadExpensesOnly(session: SessionData, tripId: String) {
        try {
            val remote = tripRepository.loadRemoteExpenses(session, tripId)
            mutable.update { current ->
                current.copy(
                    remoteExpenses = remote,
                    expenseError = "",
                    displayExpenses = ExpenseMerger.merge(
                        serverExpenses = remote,
                        queueItems = latestTripQueue,
                        activeSyncKeys = latestActiveKeys,
                    ),
                )
            }
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (e: ApiException) {
            if (e.status == 401) throw e
            mutable.update { current ->
                current.copy(
                    remoteExpenses = emptyList(),
                    expenseError = e.message.orEmpty(),
                    displayExpenses = ExpenseMerger.merge(
                        serverExpenses = emptyList(),
                        queueItems = latestTripQueue,
                        activeSyncKeys = latestActiveKeys,
                    ),
                )
            }
        } catch (_: Exception) {
            mutable.update { current ->
                current.copy(
                    remoteExpenses = emptyList(),
                    expenseError = if (latestTripQueue.isEmpty()) {
                        "No pudimos consultar los gastos del servidor. Actualiza al recuperar señal."
                    } else {
                        "Sin conexión con el servidor. Se muestran tus registros guardados en el dispositivo."
                    },
                    displayExpenses = ExpenseMerger.merge(
                        serverExpenses = emptyList(),
                        queueItems = latestTripQueue,
                        activeSyncKeys = latestActiveKeys,
                    ),
                )
            }
        }
    }

    fun changeTripStatus(action: String) {
        val session = activeSession ?: return
        val trip = mutable.value.selectedTrip ?: return
        if (mutable.value.busy) return
        viewModelScope.launch {
            mutable.update { it.copy(busy = true, error = "", message = "") }
            try {
                require(
                    (action == "start" && trip.status == "ASSIGNED") ||
                        (action == "finish" && trip.status == "IN_ROUTE"),
                ) { "Actualiza el viaje para consultar su estado." }
                val updated = tripRepository.changeStatus(session, trip.id, action)
                mutable.update { current ->
                    current.copy(
                        selectedTrip = updated,
                        trips = current.trips.map { old -> if (old.id == updated.id) updated else old },
                        message = if (action == "start") "Viaje iniciado." else "Viaje finalizado.",
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) {
                    onSessionExpired()
                } else {
                    mutable.update { it.copy(error = e.message.orEmpty()) }
                }
            } catch (e: IllegalArgumentException) {
                mutable.update { it.copy(error = e.message.orEmpty()) }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(
                        error = "No recibimos confirmación del servidor. Comprueba la conexión y actualiza antes de repetir la operación.",
                    )
                }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun attachPhotoToExistingExpense(remoteId: String, photo: CapturedPhoto) {
        val session = activeSession ?: return
        val trip = mutable.value.selectedTrip ?: return
        val remoteExpense = mutable.value.remoteExpenses.firstOrNull { it.id == remoteId } ?: return
        viewModelScope.launch {
            mutable.update { it.copy(busy = true, error = "", message = "") }
            try {
                expenseRepository.enqueuePhotoForExistingExpense(
                    userId = session.userId,
                    trip = trip,
                    expense = remoteExpense,
                    photo = photo,
                )
                val syncResult = expenseRepository.syncAll(manual = true)
                when (syncResult) {
                    is SyncResult.SessionExpired -> {
                        onSessionExpired()
                        return@launch
                    }
                    is SyncResult.Completed -> {
                        if (syncResult.syncedCount > 0) {
                            mutable.update { it.copy(message = "Comprobante subido al servidor.") }
                            loadExpensesOnly(session, trip.id)
                        } else {
                            mutable.update {
                                it.copy(
                                    message = "Foto guardada en el dispositivo. Se subirá al recuperar señal.",
                                )
                            }
                        }
                    }
                    is SyncResult.NoSession -> Unit
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                mutable.update { it.copy(error = "No pudimos guardar el comprobante en la cola.") }
            } finally {
                mutable.update { it.copy(busy = false) }
            }
        }
    }

    fun viewEvidence(item: TripExpenseDisplayItem) {
        val title = "${item.currency} ${item.amount}"
        if (!item.localPhotoPath.isNullOrBlank()) {
            mutable.update {
                it.copy(
                    viewingEvidenceTitle = title,
                    viewingEvidenceLocalPath = item.localPhotoPath,
                    viewingEvidenceBytes = null,
                    loadingEvidence = false,
                )
            }
            return
        }
        val contentUrl = item.remoteEvidence?.contentUrl?.takeIf { it.isNotBlank() } ?: return
        val session = activeSession ?: return
        viewModelScope.launch {
            mutable.update {
                it.copy(
                    viewingEvidenceTitle = title,
                    viewingEvidenceLocalPath = null,
                    viewingEvidenceBytes = null,
                    loadingEvidence = true,
                )
            }
            try {
                val bytes = tripRepository.loadEvidenceBytes(session, contentUrl)
                mutable.update { it.copy(viewingEvidenceBytes = bytes, loadingEvidence = false) }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) {
                    dismissEvidenceDialog()
                    onSessionExpired()
                } else {
                    dismissEvidenceDialog()
                    mutable.update { it.copy(error = e.message.orEmpty()) }
                }
            } catch (_: Exception) {
                dismissEvidenceDialog()
                mutable.update {
                    it.copy(error = "No pudimos descargar la foto del comprobante.")
                }
            }
        }
    }

    fun dismissEvidenceDialog() {
        mutable.update {
            it.copy(
                viewingEvidenceTitle = "",
                viewingEvidenceBytes = null,
                viewingEvidenceLocalPath = null,
                loadingEvidence = false,
            )
        }
    }

    fun backToTrips() {
        if (mutable.value.busy) return
        tripQueueJob?.cancel()
        latestTripQueue = emptyList()
        mutable.update {
            it.copy(
                selectedTrip = null,
                remoteExpenses = emptyList(),
                displayExpenses = emptyList(),
                error = "",
                expenseError = "",
                message = "",
            )
        }
    }

    fun notifyMessage(text: String) {
        mutable.update { it.copy(message = text) }
    }

    class Factory(
        private val tripRepository: TripRepository,
        private val expenseRepository: ExpenseRepository,
        private val syncEngine: OfflineSyncEngine,
        private val onSessionExpired: () -> Unit,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            TripsViewModel(tripRepository, expenseRepository, syncEngine, onSessionExpired) as T
    }
}
