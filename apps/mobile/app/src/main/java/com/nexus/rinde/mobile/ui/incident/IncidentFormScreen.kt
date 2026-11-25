package com.nexus.rinde.mobile.ui.incident

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedCard
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.ui.common.INCIDENT_TYPES
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.formatSizeKb
import com.nexus.rinde.mobile.ui.common.incidentTypeLabel

@Composable
fun IncidentFormScreen(
    state: IncidentFormUiState,
    isOnline: Boolean,
    onTypeChange: (String) -> Unit,
    onDescriptionChange: (String) -> Unit,
    onTakePhoto: () -> Unit,
    onPickGallery: () -> Unit,
    onRemovePhoto: () -> Unit,
    onSave: () -> Unit,
    onCancel: () -> Unit,
) {
    var typeExpanded by remember { mutableStateOf(false) }

    val subtitle = buildString {
        if (state.tripCode.isNotBlank()) append("Viaje ${state.tripCode}")
        if (state.tripRoute.isNotBlank()) {
            if (isNotEmpty()) append(" | ")
            append(state.tripRoute)
        }
    }

    Text(
        if (state.isEditing) "Corregir incidencia" else "Reportar incidencia",
        style = MaterialTheme.typography.headlineSmall,
    )
    if (subtitle.isNotBlank()) {
        Text(subtitle, style = MaterialTheme.typography.bodyMedium)
    }

    if (!isOnline) {
        Surface(
            color = MaterialTheme.colorScheme.surfaceContainer,
            shape = MaterialTheme.shapes.medium,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                text = "Sin señal. La incidencia y la foto se guardarán en el teléfono y se enviarán al recuperar conexión.",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(14.dp),
            )
        }
    }

    if (state.error.isNotBlank()) {
        NoticeText(state.error, error = true)
    }

    Text("Tipo de incidencia", style = MaterialTheme.typography.labelLarge)
    Box {
        OutlinedButton(
            onClick = { typeExpanded = true },
            enabled = !state.saving,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(incidentTypeLabel(state.type))
        }
        DropdownMenu(
            expanded = typeExpanded,
            onDismissRequest = { typeExpanded = false },
        ) {
            INCIDENT_TYPES.forEach { (code, label) ->
                DropdownMenuItem(
                    text = { Text(label) },
                    onClick = {
                        onTypeChange(code)
                        typeExpanded = false
                    },
                )
            }
        }
    }

    OutlinedTextField(
        value = state.description,
        onValueChange = onDescriptionChange,
        label = { Text("Descripción de la incidencia") },
        minLines = 3,
        maxLines = 6,
        isError = state.exceedsMaxLength,
        supportingText = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    if (state.exceedsMaxLength) {
                        "Supera el máximo de 500 caracteres."
                    } else {
                        "Describe lo ocurrido durante el viaje."
                    },
                )
                Text("${state.descriptionLength}/${InputRules.INCIDENT_DESCRIPTION_MAX_LENGTH}")
            }
        },
        enabled = !state.saving,
        modifier = Modifier.fillMaxWidth(),
    )

    Text("Foto de evidencia (opcional)", style = MaterialTheme.typography.labelLarge)
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.compressingPhoto) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
                Text("Preparando foto de la incidencia...")
            } else if (state.hasPhoto) {
                val photoBitmap = remember(state.displayPhotoPath) {
                    state.displayPhotoPath?.let { path ->
                        runCatching { BitmapFactory.decodeFile(path) }.getOrNull()
                    }
                }
                if (photoBitmap != null) {
                    Image(
                        bitmap = photoBitmap.asImageBitmap(),
                        contentDescription = "Vista previa de la incidencia",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                    )
                }
                Text(
                    "Foto adjunta: ${state.displayPhotoName ?: "incidencia.jpg"}",
                    style = MaterialTheme.typography.titleSmall,
                )
                Text(
                    "Comprimido a ${formatSizeKb(state.displayPhotoSizeBytes)} | Listo para subir",
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    OutlinedButton(
                        onClick = onTakePhoto,
                        enabled = !state.saving,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Tomar otra")
                    }
                    OutlinedButton(
                        onClick = onPickGallery,
                        enabled = !state.saving,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Cambiar")
                    }
                }
                TextButton(
                    onClick = onRemovePhoto,
                    enabled = !state.saving,
                ) {
                    Text("Quitar foto")
                }
            } else {
                Text(
                    "Puedes adjuntar una foto desde la cámara o galería. Se guardará en la cola local y se enviará sin duplicar el reporte.",
                    style = MaterialTheme.typography.bodySmall,
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    OutlinedButton(
                        onClick = onTakePhoto,
                        enabled = !state.saving,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Tomar foto")
                    }
                    OutlinedButton(
                        onClick = onPickGallery,
                        enabled = !state.saving,
                        modifier = Modifier.weight(1f),
                    ) {
                        Text("Galería")
                    }
                }
            }
        }
    }

    Button(
        onClick = onSave,
        enabled = !state.saving &&
            !state.compressingPhoto &&
            state.description.isNotBlank() &&
            !state.exceedsMaxLength,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(if (state.isEditing) "Guardar y reintentar" else "Guardar incidencia")
    }
    TextButton(
        onClick = onCancel,
        enabled = !state.saving,
    ) {
        Text("Cancelar")
    }
}
