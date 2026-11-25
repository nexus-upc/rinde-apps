package com.nexus.rinde.mobile.ui.queue

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.formatSizeKb
import com.nexus.rinde.mobile.ui.common.incidentTypeLabel
import com.nexus.rinde.mobile.ui.common.queueStatusLabel

private enum class QueueFilter {
    ALL,
    EXPENSES,
    INCIDENTS,
}

@Composable
fun QueueScreen(
    state: QueueUiState,
    isOnline: Boolean,
    onRetryAll: () -> Unit,
    onRetrySingle: (String) -> Unit,
    onEditRejected: (QueueItemEntity) -> Unit,
    onDiscard: (String) -> Unit,
) {
    var selectedFilter by rememberSaveable { mutableStateOf(QueueFilter.ALL) }

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text("Cola sin conexión", style = MaterialTheme.typography.headlineSmall)
            Text(
                if (state.pendingCount == 0) {
                    "Sin registros pendientes"
                } else {
                    "${state.pendingCount} registro(s) en cola local"
                },
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        val statusText = when {
            !isOnline -> "Sin señal"
            state.activeSyncKeys.isNotEmpty() -> "Sincronizando"
            state.pendingCount > 0 -> "En espera"
            else -> "Al día"
        }
        Surface(
            color = MaterialTheme.colorScheme.surfaceContainer,
            shape = MaterialTheme.shapes.small,
        ) {
            Text(
                text = statusText,
                style = MaterialTheme.typography.labelLarge,
                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
            )
        }
    }

    Surface(
        color = MaterialTheme.colorScheme.surfaceContainer,
        shape = MaterialTheme.shapes.medium,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(
            text = "Los gastos e incidencias se conservan tras cerrar o reiniciar el teléfono y se envían con " +
                "clave única sin duplicarse.",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(14.dp),
        )
    }

    if (state.error.isNotBlank()) NoticeText(state.error, error = true)
    if (state.message.isNotBlank()) NoticeText(state.message)

    if (state.items.isEmpty()) {
        Text(
            "No tienes gastos ni incidencias pendientes de envío.",
            style = MaterialTheme.typography.bodyMedium,
        )
    } else {
        val expenseItems = state.items.filter { it.queueType == QueueItemType.EXPENSE }
        val incidentItems = state.items.filter { it.queueType == QueueItemType.INCIDENT }

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            FilterChip(
                selected = selectedFilter == QueueFilter.ALL,
                onClick = { selectedFilter = QueueFilter.ALL },
                label = { Text("Todos (${state.items.size})") },
            )
            FilterChip(
                selected = selectedFilter == QueueFilter.EXPENSES,
                onClick = { selectedFilter = QueueFilter.EXPENSES },
                label = { Text("Gastos (${expenseItems.size})") },
            )
            FilterChip(
                selected = selectedFilter == QueueFilter.INCIDENTS,
                onClick = { selectedFilter = QueueFilter.INCIDENTS },
                label = { Text("Incidencias (${incidentItems.size})") },
            )
        }

        val visibleItems = when (selectedFilter) {
            QueueFilter.ALL -> state.items
            QueueFilter.EXPENSES -> expenseItems
            QueueFilter.INCIDENTS -> incidentItems
        }

        if (visibleItems.isEmpty()) {
            Text(
                "No hay registros en esta categoría.",
                style = MaterialTheme.typography.bodyMedium,
            )
        } else {
            visibleItems.forEach { item ->
                QueueItemCard(
                    item = item,
                    isOnline = isOnline,
                    syncing = state.activeSyncKeys.contains(item.idempotencyKey),
                    busy = state.busy,
                    onRetrySingle = onRetrySingle,
                    onEditRejected = onEditRejected,
                    onDiscard = onDiscard,
                )
            }
        }

        if (state.retryableCount > 0) {
            Button(
                onClick = onRetryAll,
                enabled = !state.busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Reintentar todo (${state.retryableCount})")
            }
        }
    }
}

@Composable
private fun QueueItemCard(
    item: QueueItemEntity,
    isOnline: Boolean,
    syncing: Boolean,
    busy: Boolean,
    onRetrySingle: (String) -> Unit,
    onEditRejected: (QueueItemEntity) -> Unit,
    onDiscard: (String) -> Unit,
) {
    val badgeText = queueStatusLabel(item.queueStatus, isOnline, syncing)
    val tripLabel = item.tripCode.ifBlank { item.tripId.take(8) }
    val isIncident = item.queueType == QueueItemType.INCIDENT

    val cardTitle: String
    val cardDetail: String
    if (isIncident) {
        val payload = IncidentQueuePayload.fromJson(item.payloadJson)
        cardTitle = "Incidencia: ${incidentTypeLabel(payload.type)}"
        cardDetail = "Viaje $tripLabel | ${payload.description}"
    } else {
        val payload = ExpenseQueuePayload.fromJson(item.payloadJson)
        cardTitle = "Gasto: ${categoryLabel(payload.category)}"
        cardDetail = "Viaje $tripLabel | ${payload.currency} ${payload.amount.toPlainString()} | ${payload.expenseDate}"
    }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    cardTitle,
                    style = MaterialTheme.typography.titleMedium,
                )
                Text(
                    badgeText,
                    style = MaterialTheme.typography.labelLarge,
                    color = if (item.queueStatus == QueueItemStatus.REJECTED) {
                        MaterialTheme.colorScheme.error
                    } else {
                        MaterialTheme.colorScheme.primary
                    },
                )
            }

            Text(
                cardDetail,
                style = MaterialTheme.typography.bodyMedium,
            )

            if (!item.photoPath.isNullOrBlank()) {
                val sizePart = if (item.photoSizeBytes > 0L) {
                    " (${formatSizeKb(item.photoSizeBytes)})"
                } else {
                    ""
                }
                val defaultName = if (isIncident) "incidencia.jpg" else "comprobante.jpg"
                Text(
                    "Foto ${item.photoFileName ?: defaultName}$sizePart guardada en dispositivo",
                    style = MaterialTheme.typography.bodySmall,
                )
            } else {
                Text(
                    if (isIncident) "Sin foto adjunta" else "Sin comprobante adjunto",
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            if (item.queueStatus == QueueItemStatus.PHOTO_PENDING) {
                Text(
                    if (isIncident) {
                        "Incidencia registrada en el servidor, pendiente solo de subir la foto."
                    } else {
                        "Gasto sincronizado en el servidor, pendiente solo de subir la foto."
                    },
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            if (item.errorMessage.isNotBlank()) {
                Text(
                    item.errorMessage,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            if (item.queueStatus == QueueItemStatus.REJECTED) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    OutlinedButton(
                        onClick = { onEditRejected(item) },
                        enabled = !busy && !syncing,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Corregir")
                    }
                    TextButton(
                        onClick = { onDiscard(item.idempotencyKey) },
                        enabled = !busy && !syncing,
                    ) {
                        Text("Descartar")
                    }
                }
            } else {
                OutlinedButton(
                    onClick = { onRetrySingle(item.idempotencyKey) },
                    enabled = !busy && !syncing,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (syncing) "Enviando..." else "Reintentar envío")
                }
            }
        }
    }
}
