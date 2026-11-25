package com.nexus.rinde.mobile.ui.expense

import android.app.DatePickerDialog
import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.nexus.rinde.mobile.ui.common.EXPENSE_CATEGORIES
import com.nexus.rinde.mobile.ui.common.NoticeText
import com.nexus.rinde.mobile.ui.common.categoryLabel
import com.nexus.rinde.mobile.ui.common.formatSizeKb
import java.time.LocalDate

@Composable
fun ExpenseFormScreen(
    state: ExpenseFormUiState,
    isOnline: Boolean,
    onCategoryChange: (String) -> Unit,
    onAmountChange: (String) -> Unit,
    onDateChange: (String) -> Unit,
    onTakePhoto: () -> Unit,
    onPickGallery: () -> Unit,
    onRemovePhoto: () -> Unit,
    onSave: () -> Unit,
    onCancel: () -> Unit,
) {
    val context = LocalContext.current
    var categoryExpanded by remember { mutableStateOf(false) }

    val subtitle = buildString {
        if (state.tripCode.isNotBlank()) append("Viaje ${state.tripCode}")
        if (state.tripRoute.isNotBlank()) {
            if (isNotEmpty()) append(" | ")
            append(state.tripRoute)
        }
    }

    Text(
        if (state.isEditing) "Corregir gasto" else "Registrar gasto",
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
                text = "Sin señal. El gasto y la foto se guardarán en el teléfono y se enviarán al recuperar conexión.",
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(14.dp),
            )
        }
    }

    if (state.error.isNotBlank()) {
        NoticeText(state.error, error = true)
    }

    Text("Categoría del gasto", style = MaterialTheme.typography.labelLarge)
    Box {
        OutlinedButton(
            onClick = { categoryExpanded = true },
            enabled = !state.saving,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(categoryLabel(state.category))
        }
        DropdownMenu(
            expanded = categoryExpanded,
            onDismissRequest = { categoryExpanded = false },
        ) {
            EXPENSE_CATEGORIES.forEach { (code, label) ->
                DropdownMenuItem(
                    text = { Text(label) },
                    onClick = {
                        onCategoryChange(code)
                        categoryExpanded = false
                    },
                )
            }
        }
    }

    OutlinedTextField(
        value = state.amount,
        onValueChange = onAmountChange,
        label = { Text("Monto (PEN)") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
        singleLine = true,
        enabled = !state.saving,
        modifier = Modifier.fillMaxWidth(),
    )

    OutlinedTextField(
        value = state.expenseDate,
        onValueChange = onDateChange,
        label = { Text("Fecha del gasto (AAAA-MM-DD)") },
        singleLine = true,
        enabled = !state.saving,
        trailingIcon = {
            IconButton(
                onClick = {
                    val baseDate = runCatching { LocalDate.parse(state.expenseDate) }
                        .getOrDefault(LocalDate.now())
                    DatePickerDialog(
                        context,
                        { _, year, month, dayOfMonth ->
                            onDateChange(LocalDate.of(year, month + 1, dayOfMonth).toString())
                        },
                        baseDate.year,
                        baseDate.monthValue - 1,
                        baseDate.dayOfMonth,
                    ).show()
                },
                enabled = !state.saving,
            ) {
                Icon(Icons.Default.DateRange, "Seleccionar fecha")
            }
        },
        modifier = Modifier.fillMaxWidth(),
    )

    Text("Foto del comprobante", style = MaterialTheme.typography.labelLarge)
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            if (state.compressingPhoto) {
                LinearProgressIndicator(Modifier.fillMaxWidth())
                Text("Preparando foto del comprobante...")
            } else if (state.hasPhoto) {
                val photoBitmap = remember(state.displayPhotoPath) {
                    state.displayPhotoPath?.let { path ->
                        runCatching { BitmapFactory.decodeFile(path) }.getOrNull()
                    }
                }
                if (photoBitmap != null) {
                    Image(
                        bitmap = photoBitmap.asImageBitmap(),
                        contentDescription = "Vista previa del comprobante",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(180.dp),
                    )
                }
                Text(
                    "Comprobante adjunto: ${state.displayPhotoName ?: "comprobante.jpg"}",
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
                    "La foto es opcional. Si guardas sin foto, el gasto quedará pendiente de " +
                        "sustento y podrás adjuntarla luego desde el detalle del viaje.",
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
        enabled = !state.saving && !state.compressingPhoto && state.amount.isNotBlank(),
        modifier = Modifier.fillMaxWidth(),
    ) {
        Text(if (state.isEditing) "Guardar y reintentar" else "Guardar gasto")
    }
    TextButton(
        onClick = onCancel,
        enabled = !state.saving,
    ) {
        Text("Cancelar")
    }
}
