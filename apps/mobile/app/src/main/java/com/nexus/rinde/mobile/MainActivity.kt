package com.nexus.rinde.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.TripExpenseDisplayItem
import com.nexus.rinde.mobile.ui.auth.AuthViewModel
import com.nexus.rinde.mobile.ui.auth.SignInScreen
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.backendStatusLabel
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.localTime
import com.nexus.rinde.mobile.ui.common.queueStatusLabel
import com.nexus.rinde.mobile.ui.theme.RindeTheme
import com.nexus.rinde.mobile.ui.trips.TripsListScreen
import com.nexus.rinde.mobile.ui.trips.TripsViewModel
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            RindeTheme {
                RindeAppRoot()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun RindeAppRoot() {
    val container = (LocalContext.current.applicationContext as RindeApplication).container
    val authModel: AuthViewModel = viewModel(
        factory = AuthViewModel.Factory(container.sessionRepository),
    )
    val tripsModel: TripsViewModel = viewModel(
        factory = TripsViewModel.Factory(
            tripRepository = container.tripRepository,
            expenseRepository = container.expenseRepository,
            syncEngine = container.syncEngine,
            onSessionExpired = authModel::onSessionExpired,
        ),
    )
    val authState by authModel.state.collectAsStateWithLifecycle()
    val tripsState by tripsModel.state.collectAsStateWithLifecycle()
    val isOnline by container.networkMonitor.isOnline.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var confirmAction by remember { mutableStateOf("") }
    var confirmSignOutPending by remember { mutableIntStateOf(-1) }
    val scroll = rememberScrollState()

    LaunchedEffect(authState.session) {
        tripsModel.bindSession(authState.session)
    }

    LaunchedEffect(authState.error, tripsState.error) {
        if (authState.error.isNotBlank() || tripsState.error.isNotBlank()) {
            scroll.animateScrollTo(0)
        }
    }

    BackHandler(enabled = tripsState.selectedTrip != null && !tripsState.busy) {
        tripsModel.backToTrips()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        if (!authState.signedIn) {
                            "Rinde"
                        } else {
                            tripsState.selectedTrip?.code ?: "Mis viajes"
                        },
                    )
                },
                navigationIcon = {
                    if (tripsState.selectedTrip != null) {
                        IconButton(
                            onClick = tripsModel::backToTrips,
                            enabled = !tripsState.busy,
                        ) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver a mis viajes")
                        }
                    }
                },
                actions = {
                    if (authState.signedIn) {
                        IconButton(onClick = tripsModel::loadTrips, enabled = !tripsState.busy) {
                            Icon(Icons.Default.Refresh, "Actualizar datos")
                        }
                        TextButton(
                            onClick = {
                                scope.launch {
                                    val pending = authModel.pendingCountBeforeSignOut()
                                    if (pending > 0) {
                                        confirmSignOutPending = pending
                                    } else {
                                        authModel.confirmSignOut()
                                    }
                                }
                            },
                        ) {
                            Text("Salir")
                        }
                    }
                },
            )
        },
    ) { insets ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(insets)
                .verticalScroll(scroll)
                .padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            if (authState.restoring || authState.busy || tripsState.busy) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
            }
            if (!isOnline && authState.signedIn) {
                NoticeText("Sin señal. Los datos mostrados pueden corresponder a la última consulta.", error = false)
            }
            val topError = authState.error.ifBlank { tripsState.error }
            if (topError.isNotEmpty()) NoticeText(topError, error = true)
            val topMessage = authState.notice.ifBlank { tripsState.message }
            if (topMessage.isNotEmpty()) NoticeText(topMessage)

            if (authState.restoring) {
                Text("Verificando sesión...")
            } else if (!authState.signedIn) {
                SignInScreen(
                    busy = authState.busy,
                    prefillEmail = authState.prefillEmail,
                    onSubmit = authModel::signIn,
                )
            } else if (tripsState.selectedTrip == null) {
                TripsListScreen(
                    email = authState.session?.email.orEmpty(),
                    trips = tripsState.trips,
                    busy = tripsState.busy,
                    fromCache = tripsState.tripsFromCache,
                    onRefresh = tripsModel::loadTrips,
                    onOpenTrip = tripsModel::openTrip,
                )
            } else {
                val trip = tripsState.selectedTrip!!
                TripDetailBasicSection(
                    trip = trip,
                    busy = tripsState.busy,
                    isOnline = isOnline,
                    expenseError = tripsState.expenseError,
                    expenses = tripsState.displayExpenses,
                    onRequestStatusChange = { confirmAction = it },
                )
            }
            Spacer(Modifier.height(16.dp))
        }
    }

    if (confirmAction.isNotEmpty()) {
        val starting = confirmAction == "start"
        AlertDialog(
            onDismissRequest = { confirmAction = "" },
            title = { Text(if (starting) "¿Iniciar este viaje?" else "¿Finalizar este viaje?") },
            text = {
                Text(
                    if (starting) {
                        "Operaciones verá que estás en ruta."
                    } else {
                        "El viaje quedará finalizado y operaciones podrá revisar la liquidación."
                    },
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        tripsModel.changeTripStatus(confirmAction)
                        confirmAction = ""
                    },
                ) {
                    Text(if (starting) "Iniciar viaje" else "Finalizar viaje")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmAction = "" }) { Text("Cancelar") }
            },
        )
    }

    if (confirmSignOutPending > 0) {
        AlertDialog(
            onDismissRequest = { confirmSignOutPending = -1 },
            title = { Text("Registros pendientes de envío") },
            text = {
                Text(
                    "Tienes $confirmSignOutPending registro(s) pendiente(s) en la cola sin conexión. " +
                        "Se conservarán guardados en este dispositivo para tu cuenta y se enviarán " +
                        "cuando vuelvas a ingresar.",
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        confirmSignOutPending = -1
                        authModel.confirmSignOut()
                    },
                ) {
                    Text("Salir")
                }
            },
            dismissButton = {
                TextButton(onClick = { confirmSignOutPending = -1 }) { Text("Cancelar") }
            },
        )
    }
}

@Composable
private fun TripDetailBasicSection(
    trip: Trip,
    busy: Boolean,
    isOnline: Boolean,
    expenseError: String,
    expenses: List<TripExpenseDisplayItem>,
    onRequestStatusChange: (String) -> Unit,
) {
    Text(
        backendStatusLabel(trip.status),
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
    )
    Text("${trip.origin} a ${trip.destination}", style = MaterialTheme.typography.headlineMedium)
    Text("Salida: ${trip.departureDate}", style = MaterialTheme.typography.bodyLarge)
    if (trip.cargo.isNotBlank()) {
        Text("Carga", style = MaterialTheme.typography.titleMedium)
        Text(trip.cargo)
    }
    if (trip.weight.isNotBlank()) Text("Peso: ${trip.weight} kg")
    if (trip.startedAt.isNotBlank()) Text("Inicio: ${localTime(trip.startedAt)}")
    if (trip.finishedAt.isNotBlank()) Text("Finalización: ${localTime(trip.finishedAt)}")

    when (trip.status) {
        "ASSIGNED" -> Button(
            onClick = { onRequestStatusChange("start") },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Iniciar viaje")
        }
        "IN_ROUTE" -> OutlinedButton(
            onClick = { onRequestStatusChange("finish") },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Finalizar viaje")
        }
    }

    Text("Gastos del viaje", style = MaterialTheme.typography.titleLarge)
    if (expenseError.isNotEmpty()) {
        NoticeText(expenseError, error = true)
    }
    if (expenses.isEmpty() && expenseError.isEmpty()) {
        Text("Todavía no hay gastos registrados.")
    } else {
        expenses.forEach { item ->
            val statusText = when {
                item.queueStatus != null && item.queueStatus != QueueItemStatus.SYNCED ->
                    queueStatusLabel(item.queueStatus, isOnline, item.isSyncingNow)
                item.backendStatus.isNotBlank() -> backendStatusLabel(item.backendStatus)
                else -> "Registrado"
            }
            ListItem(
                headlineContent = {
                    Text("${item.currency} ${item.amount} / ${categoryLabel(item.category)}")
                },
                supportingContent = {
                    Column {
                        Text("${item.date} / $statusText")
                        if (item.observationReason.isNotBlank()) {
                            Text("Motivo: ${item.observationReason}")
                        } else if (item.queueError.isNotBlank()) {
                            Text("Detalle: ${item.queueError}")
                        }
                    }
                },
            )
        }
    }
}
