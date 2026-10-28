package com.nexus.rinde.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nexus.rinde.mobile.data.Expense
import com.nexus.rinde.mobile.data.Trip
import com.nexus.rinde.mobile.state.PilotViewModel
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { RindeTheme { PilotApp() } }
    }
}

@Composable
private fun RindeTheme(content: @Composable () -> Unit) {
    val scheme = if (isSystemInDarkTheme()) darkColorScheme(
        primary = Color(0xFFB4C5FF), onPrimary = Color(0xFF002A78),
        background = Color(0xFF101318), onBackground = Color(0xFFE2E2E9),
        surface = Color(0xFF101318), onSurface = Color(0xFFE2E2E9),
        surfaceContainer = Color(0xFF1C2027),
    ) else lightColorScheme(
        primary = Color(0xFF1D4ED8), onPrimary = Color.White,
        background = Color.White, onBackground = Color(0xFF0F172A),
        surface = Color.White, onSurface = Color(0xFF0F172A),
        surfaceContainer = Color(0xFFF1F5F9),
    )
    MaterialTheme(colorScheme = scheme, content = content)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PilotApp(model: PilotViewModel = viewModel()) {
    val state by model.state.collectAsStateWithLifecycle()
    var expenseOpen by rememberSaveable { mutableStateOf(false) }
    var confirmAction by remember { mutableStateOf("") }
    val scroll = rememberScrollState()
    LaunchedEffect(state.expenseSaved, state.signedIn) { expenseOpen = false }
    LaunchedEffect(state.error) { if (state.error.isNotBlank()) scroll.animateScrollTo(0) }
    BackHandler(state.trip != null && !state.busy) {
        if (expenseOpen) expenseOpen = false else model.back()
    }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (!state.signedIn) "Rinde" else state.trip?.code ?: "Mis viajes") },
                navigationIcon = {
                    if (state.trip != null) IconButton(onClick = {
                        if (expenseOpen) expenseOpen = false else model.back()
                    }, enabled = !state.busy) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Volver a mis viajes")
                    }
                },
                actions = {
                    if (state.signedIn) {
                        IconButton(onClick = model::refresh, enabled = !state.busy) {
                            Icon(Icons.Default.Refresh, "Actualizar datos")
                        }
                        TextButton(onClick = model::signOut) { Text("Salir") }
                    }
                },
            )
        },
    ) { insets ->
        Column(Modifier.fillMaxSize().padding(insets).imePadding()
            .verticalScroll(scroll).padding(horizontal = 24.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)) {
            if (state.busy) LinearProgressIndicator(Modifier.fillMaxWidth())
            if (state.error.isNotEmpty()) Notice(state.error, true)
            if (state.message.isNotEmpty()) Notice(state.message)
            if (!state.signedIn) {
                SignIn(state.busy, model::signIn)
            } else if (state.trip == null) {
                Text(state.email, style = MaterialTheme.typography.bodyMedium)
                Text("Tu próxima salida empieza aquí.", style = MaterialTheme.typography.headlineSmall)
                if (state.trips.isEmpty() && !state.busy) {
                    Text("Aún no tienes viajes asignados. Cuando operaciones te asigne uno, aparecerá aquí.")
                    OutlinedButton(onClick = model::refresh) { Text("Actualizar mis viajes") }
                }
                state.trips.forEach { trip -> TripRow(trip, !state.busy) { model.open(trip.id) } }
            } else {
                val trip = state.trip!!
                TripDetail(trip)
                when (trip.status) {
                    "ASSIGNED" -> Button(onClick = { confirmAction = "start" },
                        enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Iniciar viaje") }
                    "IN_ROUTE" -> {
                        if (!expenseOpen) Button(onClick = { expenseOpen = true },
                            enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Registrar gasto") }
                        OutlinedButton(onClick = { confirmAction = "finish" },
                            enabled = !state.busy, modifier = Modifier.fillMaxWidth()) { Text("Finalizar viaje") }
                    }
                }
                if (expenseOpen && trip.status == "IN_ROUTE") ExpenseForm(
                    trip.id, state.busy,
                    onCancel = { expenseOpen = false },
                    onSubmit = model::registerExpense,
                )
                Text("Gastos del viaje", style = MaterialTheme.typography.titleLarge)
                if (state.expenseError.isNotEmpty()) Notice(state.expenseError, true)
                else if (state.expenses.isEmpty()) Text("Todavía no hay gastos registrados.")
                else state.expenses.forEach { ExpenseRow(it) }
            }
            Spacer(Modifier.height(16.dp))
        }
    }
    if (confirmAction.isNotEmpty()) {
        val starting = confirmAction == "start"
        AlertDialog(
            onDismissRequest = { confirmAction = "" },
            title = { Text(if (starting) "¿Iniciar este viaje?" else "¿Finalizar este viaje?") },
            text = { Text(if (starting) "Operaciones verá que estás en ruta."
                else "El viaje quedará finalizado y operaciones podrá revisar la liquidación.") },
            confirmButton = { TextButton(onClick = {
                model.changeStatus(confirmAction)
                confirmAction = ""
            }) { Text(if (starting) "Iniciar viaje" else "Finalizar viaje") } },
            dismissButton = { TextButton(onClick = { confirmAction = "" }) { Text("Cancelar") } },
        )
    }
}

@Composable
private fun SignIn(busy: Boolean, onSubmit: (String, String, String) -> Unit) {
    var email by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var server by rememberSaveable { mutableStateOf(if (BuildConfig.DEBUG) "http://10.0.2.2:8000" else "") }
    var connectionOpen by rememberSaveable { mutableStateOf(false) }
    Spacer(Modifier.height(24.dp))
    Text("Tu viaje, a mano.", style = MaterialTheme.typography.headlineLarge)
    Text("Ingresa con la cuenta de conductor que te asignó tu empresa.")
    OutlinedTextField(email, { email = it }, label = { Text("Correo electrónico") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
        singleLine = true, enabled = !busy, modifier = Modifier.fillMaxWidth())
    OutlinedTextField(password, { password = it }, label = { Text("Contraseña") },
        visualTransformation = PasswordVisualTransformation(),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
        singleLine = true, enabled = !busy, modifier = Modifier.fillMaxWidth())
    Button(onClick = { onSubmit(server, email, password) },
        enabled = !busy && email.isNotBlank() && password.isNotBlank(),
        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp)) { Text("Ingresar") }
    TextButton(onClick = { connectionOpen = !connectionOpen }) { Text("Conexión de prueba") }
    if (connectionOpen) {
        OutlinedTextField(server, { server = it }, label = { Text("Servidor de Rinde") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
            singleLine = true, enabled = !busy, modifier = Modifier.fillMaxWidth())
        Text("En un teléfono usa la dirección del servidor de prueba. La dirección inicial corresponde al emulador de esta PC.",
            style = MaterialTheme.typography.bodySmall)
    }
}

@Composable
private fun TripRow(trip: Trip, enabled: Boolean, onClick: () -> Unit) {
    OutlinedCard(onClick = onClick, enabled = enabled, modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(statusLabel(trip.status), style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.primary)
            Text("${trip.origin} a ${trip.destination}", style = MaterialTheme.typography.titleLarge)
            Text("${trip.code} / ${trip.departureDate}", style = MaterialTheme.typography.bodyMedium)
            Text("Ver mi viaje", style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun TripDetail(trip: Trip) {
    Text(statusLabel(trip.status), style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary)
    Text("${trip.origin} a ${trip.destination}", style = MaterialTheme.typography.headlineMedium)
    Text("Salida: ${trip.departureDate}", style = MaterialTheme.typography.bodyLarge)
    if (trip.cargo.isNotBlank()) {
        Text("Carga", style = MaterialTheme.typography.titleMedium)
        Text(trip.cargo)
    }
    if (trip.weight.isNotBlank()) Text("Peso: ${trip.weight} kg")
    if (trip.startedAt.isNotBlank()) Text("Inicio: ${localTime(trip.startedAt)}")
    if (trip.finishedAt.isNotBlank()) Text("Finalización: ${localTime(trip.finishedAt)}")
}

private val categories = linkedMapOf(
    "FUEL" to "Combustible", "TOLL" to "Peaje", "FOOD" to "Alimentación",
    "LODGING" to "Hospedaje", "MAINTENANCE" to "Mantenimiento", "OTHER" to "Otro",
)

@Composable
private fun ExpenseForm(tripId: String, busy: Boolean, onCancel: () -> Unit,
    onSubmit: (String, String, String) -> Unit) {
    var category by rememberSaveable(tripId) { mutableStateOf("FUEL") }
    var amount by rememberSaveable(tripId) { mutableStateOf("") }
    var key by rememberSaveable(tripId) { mutableStateOf(UUID.randomUUID().toString()) }
    var expanded by remember { mutableStateOf(false) }
    Text("Nuevo gasto", style = MaterialTheme.typography.titleLarge)
    Box {
        OutlinedButton(onClick = { expanded = true }, enabled = !busy,
            modifier = Modifier.fillMaxWidth()) { Text("Tipo: ${categories[category]}") }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            categories.forEach { (code, label) -> DropdownMenuItem(
                text = { Text(label) }, onClick = {
                    if (category != code) key = UUID.randomUUID().toString()
                    category = code
                    expanded = false
                }) }
        }
    }
    OutlinedTextField(amount, {
        if (amount != it) key = UUID.randomUUID().toString()
        amount = it
    }, label = { Text("Monto en soles") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        singleLine = true, enabled = !busy, modifier = Modifier.fillMaxWidth())
    Text("Se guardará con la fecha de hoy y quedará pendiente de adjuntar comprobante.",
        style = MaterialTheme.typography.bodyMedium)
    Button(onClick = { onSubmit(category, amount, key) }, enabled = !busy && amount.isNotBlank(),
        modifier = Modifier.fillMaxWidth()) { Text("Guardar gasto") }
    TextButton(onClick = onCancel, enabled = !busy) { Text("Cancelar") }
}

@Composable
private fun ExpenseRow(expense: Expense) {
    ListItem(
        headlineContent = { Text("${expense.currency} ${expense.amount} / ${categories[expense.category] ?: expense.category}") },
        supportingContent = {
            Column {
                Text("${expense.date} / ${statusLabel(expense.status)}")
                if (expense.reason.isNotBlank()) Text("Motivo: ${expense.reason}")
            }
        },
    )
}

@Composable
private fun Notice(text: String, error: Boolean = false) {
    Text(text, color = if (error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
        style = MaterialTheme.typography.bodyLarge,
        modifier = Modifier.fillMaxWidth().semantics { liveRegion = LiveRegionMode.Polite })
}

private fun statusLabel(status: String): String = when (status) {
    "SCHEDULED" -> "Programado"
    "ASSIGNED" -> "Asignado"
    "IN_ROUTE" -> "En ruta"
    "FINISHED" -> "Finalizado"
    "SETTLED" -> "Liquidado"
    "REGISTERED" -> "Registrado"
    "PENDING_SUPPORT" -> "Pendiente de sustento"
    "APPROVED" -> "Aprobado"
    "OBSERVED" -> "Observado"
    else -> status
}

private fun localTime(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm").withZone(ZoneId.systemDefault()).format(Instant.parse(value))
}.getOrDefault(value)
