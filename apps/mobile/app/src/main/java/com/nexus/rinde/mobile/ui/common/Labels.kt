package com.nexus.rinde.mobile.ui.common

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter

val EXPENSE_CATEGORIES = linkedMapOf(
    "FUEL" to "Combustible",
    "TOLL" to "Peaje",
    "FOOD" to "Alimentación",
    "LODGING" to "Hospedaje",
    "MAINTENANCE" to "Mantenimiento",
    "OTHER" to "Otro",
)

val INCIDENT_TYPES = linkedMapOf(
    "BREAKDOWN" to "Avería",
    "DELAY" to "Retraso",
    "OTHER" to "Otro",
)

fun categoryLabel(category: String): String = EXPENSE_CATEGORIES[category] ?: "Otro"

fun incidentTypeLabel(type: String): String = INCIDENT_TYPES[type] ?: "Otro"

fun deliveryMethodLabel(method: String): String = when (method) {
    "CASH" -> "Efectivo"
    "TRANSFER" -> "Transferencia"
    else -> "Otro medio"
}

fun settlementStatusLabel(status: String): String = when (status) {
    "OPEN" -> "Liquidación abierta"
    "CLOSED" -> "Liquidación cerrada"
    else -> "Sin liquidación generada"
}

fun vehicleStatusLabel(status: String): String = when (status) {
    "AVAILABLE" -> "Disponible"
    "IN_TRIP" -> "En viaje"
    "IN_MAINTENANCE" -> "En mantenimiento"
    else -> "Operativo"
}

fun incidentStatusLabel(status: String): String = when (status) {
    "OPEN" -> "Abierta"
    "IN_PROGRESS" -> "En atención"
    "CLOSED" -> "Cerrada"
    else -> "Reportada"
}

fun backendStatusLabel(status: String): String = when (status) {
    "SCHEDULED" -> "Programado"
    "ASSIGNED" -> "Asignado"
    "IN_ROUTE" -> "En ruta"
    "FINISHED" -> "Finalizado"
    "SETTLED" -> "Liquidado"
    "REGISTERED" -> "Registrado"
    "PENDING_SUPPORT" -> "Pendiente de sustento"
    "APPROVED" -> "Aprobado"
    "OBSERVED" -> "Observado"
    "LOCKED" -> "Bloqueado"
    "OPEN" -> "Abierta"
    "IN_PROGRESS" -> "En atención"
    "CLOSED" -> "Cerrada"
    else -> "En proceso"
}

fun queueStatusLabel(
    status: QueueItemStatus,
    isOnline: Boolean,
    isSyncing: Boolean,
): String = when (status) {
    QueueItemStatus.PENDING -> when {
        isSyncing -> "Enviando"
        !isOnline -> "En espera de señal"
        else -> "Pendiente de envío"
    }
    QueueItemStatus.PHOTO_PENDING -> when {
        isSyncing -> "Subiendo foto"
        !isOnline -> "Foto en espera de señal"
        else -> "Foto pendiente"
    }
    QueueItemStatus.REJECTED -> "Error al enviar"
    QueueItemStatus.SYNCED -> "Sincronizado"
}

fun formatMoney(currency: String, amount: BigDecimal): String {
    val code = currency.ifBlank { "PEN" }
    val scaled = amount.setScale(2, RoundingMode.HALF_UP).toPlainString()
    return "$code $scaled"
}

fun localTime(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
        .withZone(ZoneId.systemDefault())
        .format(Instant.parse(value))
}.getOrDefault(value)

fun formatIsoDate(value: String): String = runCatching {
    LocalDate.parse(value).format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
}.getOrDefault(value)

fun roleLabel(role: String): String = when (role) {
    "DRIVER" -> "Conductor"
    "OPERATIONS_MANAGER" -> "Operaciones"
    "ADMINISTRATOR" -> "Administrador"
    else -> role
}

fun formatSizeKb(bytes: Long): String {
    if (bytes <= 0L) return "0 KB"
    val kb = (bytes + 1023L) / 1024L
    return "$kb KB"
}

@Composable
fun NoticeText(text: String, error: Boolean = false) {
    Text(
        text = text,
        color = if (error) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
        style = MaterialTheme.typography.bodyLarge,
        modifier = Modifier
            .fillMaxWidth()
            .semantics { liveRegion = LiveRegionMode.Polite },
    )
}
