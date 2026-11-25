package com.nexus.rinde.mobile.ui.trips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.remote.TripAdvance
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import com.nexus.rinde.mobile.data.repository.TripExpenseDisplayItem
import com.nexus.rinde.mobile.data.repository.TripFinancialSummary
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.backendStatusLabel
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.deliveryMethodLabel
import com.nexus.rinde.mobile.ui.common.formatMoney
import com.nexus.rinde.mobile.ui.common.localTime
import com.nexus.rinde.mobile.ui.common.queueStatusLabel
import com.nexus.rinde.mobile.ui.common.settlementStatusLabel
import com.nexus.rinde.mobile.ui.common.vehicleStatusLabel

@Composable
fun TripDetailScreen(
    trip: Trip,
    vehicle: VehicleSummary?,
    loadingFinancials: Boolean,
    advances: List<TripAdvance>,
    advancesError: String,
    settlementNotFound: Boolean,
    settlementError: String,
    financialSummary: TripFinancialSummary?,
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
    Text(
        "Código ${trip.code} | Salida: ${trip.departureDate}",
        style = MaterialTheme.typography.bodyLarge,
    )

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
                    text = if (vehicle != null) {
                        "Unidad asignada: ${vehicle.plateNumber}"
                    } else if (trip.vehicleId.isNotBlank()) {
                        "Unidad asignada"
                    } else {
                        "Sin unidad asignada"
                    },
                    style = MaterialTheme.typography.titleMedium,
                )
                if (vehicle != null && vehicle.status.isNotBlank()) {
                    Text(
                        vehicleStatusLabel(vehicle.status),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
            if (vehicle != null) {
                val modelLine = buildString {
                    append("${vehicle.brand} ${vehicle.model}".trim())
                    if (vehicle.modelYear != null) append(" (${vehicle.modelYear})")
                    if (vehicle.payloadCapacityKg.isNotBlank()) {
                        append(" | Capacidad ${vehicle.payloadCapacityKg} kg")
                    }
                }
                if (modelLine.isNotBlank()) {
                    Text(modelLine, style = MaterialTheme.typography.bodySmall)
                }
            }
            if (trip.cargo.isNotBlank()) {
                Text("Carga: ${trip.cargo}", style = MaterialTheme.typography.bodyMedium)
            }
            if (trip.weight.isNotBlank()) {
                Text("Peso: ${trip.weight} kg", style = MaterialTheme.typography.bodySmall)
            }
            if (trip.assignedAt.isNotBlank()) {
                Text("Asignación: ${localTime(trip.assignedAt)}", style = MaterialTheme.typography.bodySmall)
            }
            if (trip.overdueMaintenanceConfirmedBy.isNotBlank()) {
                Text(
                    "Asignado con confirmación de mantenimiento vencido.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
            if (trip.startedAt.isNotBlank()) {
                Text("Inicio: ${localTime(trip.startedAt)}", style = MaterialTheme.typography.bodySmall)
            }
            if (trip.finishedAt.isNotBlank()) {
                Text("Finalización: ${localTime(trip.finishedAt)}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }

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

    Text("Liquidación y saldo", style = MaterialTheme.typography.titleLarge)
    if (loadingFinancials && financialSummary == null) {
        LinearProgressIndicator(Modifier.fillMaxWidth())
        Text("Consultando adelantos y liquidación...", style = MaterialTheme.typography.bodySmall)
    } else {
        if (settlementError.isNotBlank()) {
            NoticeText(settlementError, error = false)
        }
        if (financialSummary != null) {
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            if (financialSummary.hasOfficialSettlement) {
                                "Resumen de liquidación"
                            } else {
                                "Resumen orientativo"
                            },
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Surface(
                            color = MaterialTheme.colorScheme.surfaceContainer,
                            shape = MaterialTheme.shapes.small,
                        ) {
                            Text(
                                text = settlementStatusLabel(financialSummary.settlementStatus),
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            )
                        }
                    }

                    if (!financialSummary.hasOfficialSettlement && settlementNotFound) {
                        Text(
                            "No existe liquidación generada para este viaje todavía. Se calcula un saldo orientativo con tus adelantos y gastos registrados.",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }

                    FinancialRow(
                        label = "Total de adelantos",
                        value = formatMoney(financialSummary.currency, financialSummary.advanceTotal),
                    )
                    if (financialSummary.hasOfficialSettlement) {
                        FinancialRow(
                            label = "Gastos aprobados",
                            value = formatMoney(financialSummary.currency, financialSummary.approvedExpensesTotal),
                        )
                        FinancialRow(
                            label = "Saldo de liquidación",
                            value = formatMoney(financialSummary.currency, financialSummary.balance),
                        )
                    } else {
                        FinancialRow(
                            label = "Gastos registrados del viaje",
                            value = formatMoney(financialSummary.currency, financialSummary.registeredExpensesTotal),
                        )
                        FinancialRow(
                            label = "Saldo orientativo",
                            value = formatMoney(financialSummary.currency, financialSummary.balance),
                        )
                    }
                    if (financialSummary.queuedExpensesCount > 0) {
                        FinancialRow(
                            label = "En cola sin conexión",
                            value = "${financialSummary.queuedExpensesCount} pendiente(s)",
                        )
                    }
                }
            }
        }
    }

    Text("Adelantos del viaje", style = MaterialTheme.typography.titleLarge)
    if (advancesError.isNotBlank()) {
        NoticeText(advancesError, error = false)
    } else if (!loadingFinancials && advances.isEmpty()) {
        Text("No hay adelantos registrados para este viaje.", style = MaterialTheme.typography.bodyMedium)
    } else {
        advances.forEach { advance ->
            OutlinedCard(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            "${advance.currency} ${advance.amount}",
                            style = MaterialTheme.typography.titleMedium,
                        )
                        Text(
                            deliveryMethodLabel(advance.deliveryMethod),
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                    if (advance.registeredAt.isNotBlank()) {
                        Text(
                            "Entregado: ${localTime(advance.registeredAt)}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
    }

    if (trip.statusChanges.isNotEmpty()) {
        Text("Historial de estados", style = MaterialTheme.typography.titleLarge)
        OutlinedCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                trip.statusChanges.forEach { change ->
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                    ) {
                        Text(
                            backendStatusLabel(change.status),
                            style = MaterialTheme.typography.bodyMedium,
                        )
                        Text(
                            localTime(change.changedAt),
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
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

@Composable
private fun FinancialRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium)
        Text(value, style = MaterialTheme.typography.titleSmall)
    }
}
