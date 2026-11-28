package com.nexus.rinde.mobile.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.formatIsoDate
import com.nexus.rinde.mobile.ui.common.roleLabel

@Composable
fun ProfileScreen(
    profileState: ProfileUiState,
    queueSummary: ProfileQueueSummary,
    isOnline: Boolean,
    isSyncing: Boolean,
    queueMessage: String,
    queueError: String,
    authBusy: Boolean,
    onRetry: () -> Unit,
    onSendNow: () -> Unit,
    onOpenNotificationSettings: () -> Unit,
    onRequestSignOut: () -> Unit,
) {
    if (profileState.loading && profileState.profile == null) {
        Text("Cargando perfil...", style = MaterialTheme.typography.bodyLarge)
    }

    if (profileState.error.isNotBlank()) {
        NoticeText(profileState.error, error = true)
        OutlinedButton(
            onClick = onRetry,
            enabled = !profileState.loading,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Reintentar")
        }
    }

    val profile = profileState.profile
    if (profile != null) {
        OutlinedCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text(
                        text = profile.fullName,
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.weight(1f),
                    )
                    Surface(
                        color = MaterialTheme.colorScheme.surfaceContainer,
                        shape = MaterialTheme.shapes.small,
                    ) {
                        Text(
                            text = roleLabel(profile.role),
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        )
                    }
                }
                if (profile.companyName.isNotBlank()) {
                    Text(
                        text = profile.companyName,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
        }

        OutlinedCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text("Datos de cuenta", style = MaterialTheme.typography.titleMedium)
                ProfileFieldRow(label = "Correo", value = profile.email)
                if (profile.licenseNumber.isNotBlank()) {
                    val licenseText = if (profile.licenseCategory.isNotBlank()) {
                        "${profile.licenseNumber} (${profile.licenseCategory})"
                    } else {
                        profile.licenseNumber
                    }
                    ProfileFieldRow(label = "Licencia", value = licenseText)
                    if (profile.licenseExpirationDate.isNotBlank()) {
                        ProfileFieldRow(
                            label = "Vencimiento",
                            value = formatIsoDate(profile.licenseExpirationDate),
                        )
                    }
                }
                if (profile.fleetNotice.isNotBlank()) {
                    NoticeText(profile.fleetNotice)
                    TextButton(
                        onClick = onRetry,
                        enabled = !profileState.loading,
                    ) {
                        Text("Reintentar")
                    }
                }
            }
        }
    } else if (!profileState.loading && profileState.error.isBlank()) {
        OutlinedCard(modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    "No pudimos cargar los datos de tu cuenta.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                OutlinedButton(
                    onClick = onRetry,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Reintentar")
                }
            }
        }
    }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Cola sin conexión", style = MaterialTheme.typography.titleMedium)
                Surface(
                    color = MaterialTheme.colorScheme.surfaceContainer,
                    shape = MaterialTheme.shapes.small,
                ) {
                    Text(
                        text = queueSummary.statusText,
                        style = MaterialTheme.typography.labelLarge,
                        color = if (queueSummary.pendingCount > 0) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        },
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                    )
                }
            }

            if (queueSummary.pendingCount == 0) {
                Text(
                    "No hay gastos ni incidencias pendientes de envío.",
                    style = MaterialTheme.typography.bodyMedium,
                )
            } else {
                Text(
                    if (isOnline) {
                        "Tus registros pendientes están listos para sincronizarse."
                    } else {
                        "Sin señal. Se enviarán cuando vuelva la conexión."
                    },
                    style = MaterialTheme.typography.bodyMedium,
                )
            }

            if (queueSummary.rejectedCount > 0) {
                Text(
                    "${queueSummary.rejectedCount} registro(s) requieren corrección en la pestaña Cola.",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall,
                )
            }

            if (queueError.isNotBlank()) NoticeText(queueError, error = true)
            if (queueMessage.isNotBlank()) NoticeText(queueMessage)

            if (queueSummary.pendingCount > 0) {
                Button(
                    onClick = onSendNow,
                    enabled = queueSummary.canSendNow,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text(if (isSyncing) "Enviando..." else "Enviar ahora")
                }
            }
        }
    }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Text("Notificaciones", style = MaterialTheme.typography.titleMedium)
            Text(
                "Configura los avisos del canal Asignación de viajes en los ajustes del sistema.",
                style = MaterialTheme.typography.bodyMedium,
            )
            OutlinedButton(
                onClick = onOpenNotificationSettings,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Ajustes de notificaciones")
            }
        }
    }

    OutlinedButton(
        onClick = onRequestSignOut,
        enabled = !authBusy,
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.error,
        ),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text("Cerrar sesión")
    }
}

@Composable
private fun ProfileFieldRow(label: String, value: String) {
    Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyLarge,
        )
    }
}
