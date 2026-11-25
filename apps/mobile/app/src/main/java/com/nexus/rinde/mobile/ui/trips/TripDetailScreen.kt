package com.nexus.rinde.mobile.ui.trips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.TripExpenseDisplayItem
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.backendStatusLabel
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.localTime
import com.nexus.rinde.mobile.ui.common.queueStatusLabel

@Composable
fun TripDetailScreen(
    trip: Trip,
    busy: Boolean,
    isOnline: Boolean,
    expenseError: String,
    expenses: List<TripExpenseDisplayItem>,
    onRequestStatusChange: (String) -> Unit,
    onOpenExpenseForm: () -> Unit,
    onAttachPhotoToExpense: (remoteId: String) -> Unit,
    onViewEvidence: (TripExpenseDisplayItem) -> Unit,
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
        "IN_ROUTE" -> {
            Button(
                onClick = onOpenExpenseForm,
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Registrar gasto")
            }
            OutlinedButton(
                onClick = { onRequestStatusChange("finish") },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Finalizar viaje")
            }
        }
    }

    Text("Gastos del viaje", style = MaterialTheme.typography.titleLarge)
    if (expenseError.isNotEmpty()) {
        NoticeText(expenseError, error = expenses.isEmpty())
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

            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            "${item.currency} ${item.amount} / ${categoryLabel(item.category)}",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            statusText,
                            style = MaterialTheme.typography.labelMedium,
                            color = if (item.queueStatus == QueueItemStatus.REJECTED) {
                                MaterialTheme.colorScheme.error
                            } else {
                                MaterialTheme.colorScheme.primary
                            },
                        )
                    }
                    Text(item.date, style = MaterialTheme.typography.bodySmall)
                    if (item.observationReason.isNotBlank()) {
                        Text("Motivo: ${item.observationReason}", style = MaterialTheme.typography.bodySmall)
                    }
                    if (item.queueError.isNotBlank()) {
                        Text(
                            item.queueError,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }
                    if (!item.localPhotoName.isNullOrBlank()) {
                        Text(
                            "Comprobante local: ${item.localPhotoName}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    } else if (item.remoteEvidence != null) {
                        Text(
                            "Comprobante: ${item.remoteEvidence.fileName}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                    if (item.canAttachPhoto || item.hasAnyPhoto) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            if (item.canAttachPhoto && item.remoteId != null) {
                                OutlinedButton(
                                    onClick = { onAttachPhotoToExpense(item.remoteId) },
                                    enabled = !busy,
                                ) {
                                    Text("Adjuntar foto")
                                }
                            }
                            if (item.hasAnyPhoto) {
                                TextButton(onClick = { onViewEvidence(item) }) {
                                    Text("Ver comprobante")
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
