package com.nexus.rinde.mobile.ui.queue

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.formatSizeKb
import com.nexus.rinde.mobile.ui.common.queueStatusLabel

@Composable
fun QueueScreen(
    state: QueueUiState,
    isOnline: Boolean,
    onRetryAll: () -> Unit,
    onRetrySingle: (String) -> Unit,
    onEditRejected: (QueueItemEntity) -> Unit,
    onDiscard: (String) -> Unit,
) {
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
            text = "Los gastos se conservan tras cerrar o reiniciar el teléfono y se envían con " +
                "clave única sin duplicarse.",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(14.dp),
        )
    }

    if (state.error.isNotBlank()) NoticeText(state.error, error = true)
    if (state.message.isNotBlank()) NoticeText(state.message)

    if (state.items.isEmpty()) {
        Text(
            "No tienes registros pendientes de envío. Todos tus gastos confirmados aparecen en cada viaje.",
            style = MaterialTheme.typography.bodyMedium,
        )
    } else {
        state.items.forEach { item ->
            val payload = ExpenseQueuePayload.fromJson(item.payloadJson)
            val syncing = state.activeSyncKeys.contains(item.idempotencyKey)
            val badgeText = queueStatusLabel(item.queueStatus, isOnline, syncing)
            val tripLabel = item.tripCode.ifBlank { item.tripId.take(8) }

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
                            "Gasto: ${categoryLabel(payload.category)}",
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
                        "Viaje $tripLabel | ${payload.currency} ${payload.amount.toPlainString()} | ${payload.expenseDate}",
                        style = MaterialTheme.typography.bodyMedium,
                    )

                    if (!item.photoPath.isNullOrBlank()) {
                        val sizePart = if (item.photoSizeBytes > 0L) {
                            " (${formatSizeKb(item.photoSizeBytes)})"
                        } else {
                            ""
                        }
                        Text(
                            "Foto ${item.photoFileName ?: "comprobante.jpg"}$sizePart guardada en dispositivo",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    } else {
                        Text("Sin comprobante adjunto", style = MaterialTheme.typography.bodySmall)
                    }

                    if (item.queueStatus == QueueItemStatus.PHOTO_PENDING) {
                        Text(
                            "Gasto sincronizado en el servidor, pendiente solo de subir la foto.",
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
                                enabled = !state.busy && !syncing,
                                modifier = Modifier.weight(1f),
                            ) {
                                Text("Corregir")
                            }
                            TextButton(
                                onClick = { onDiscard(item.idempotencyKey) },
                                enabled = !state.busy && !syncing,
                            ) {
                                Text("Descartar")
                            }
                        }
                    } else {
                        OutlinedButton(
                            onClick = { onRetrySingle(item.idempotencyKey) },
                            enabled = !state.busy && !syncing,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (syncing) "Enviando..." else "Reintentar envío")
                        }
                    }
                }
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
