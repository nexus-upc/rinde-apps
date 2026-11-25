package com.nexus.rinde.mobile.ui.trips

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.ui.common.backendStatusLabel

@Composable
fun TripsListScreen(
    email: String,
    trips: List<Trip>,
    busy: Boolean,
    fromCache: Boolean,
    onRefresh: () -> Unit,
    onOpenTrip: (String) -> Unit,
) {
    Text(email, style = MaterialTheme.typography.bodyMedium)
    Text("Tu próxima salida empieza aquí.", style = MaterialTheme.typography.headlineSmall)
    if (fromCache) {
        Text(
            "Mostrando viajes guardados en el teléfono.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.primary,
        )
    }
    if (trips.isEmpty() && !busy) {
        Text("Aún no tienes viajes asignados. Cuando operaciones te asigne uno, aparecerá aquí.")
        OutlinedButton(onClick = onRefresh) {
            Text("Actualizar mis viajes")
        }
    }
    trips.forEach { trip ->
        OutlinedCard(
            onClick = { onOpenTrip(trip.id) },
            enabled = !busy,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(
                Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Text(
                    backendStatusLabel(trip.status),
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
                Text("${trip.origin} a ${trip.destination}", style = MaterialTheme.typography.titleLarge)
                Text("${trip.code} / ${trip.departureDate}", style = MaterialTheme.typography.bodyMedium)
                Text("Ver mi viaje", style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}
