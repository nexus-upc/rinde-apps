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
import java.time.Instant
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

fun categoryLabel(category: String): String = EXPENSE_CATEGORIES[category] ?: category

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
    else -> status
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
        else -> "Subiendo foto"
    }
    QueueItemStatus.REJECTED -> "Error al enviar"
    QueueItemStatus.SYNCED -> "Sincronizado"
}

fun localTime(value: String): String = runCatching {
    DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
        .withZone(ZoneId.systemDefault())
        .format(Instant.parse(value))
}.getOrDefault(value)

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
