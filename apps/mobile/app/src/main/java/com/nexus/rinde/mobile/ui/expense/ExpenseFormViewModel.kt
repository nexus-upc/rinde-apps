package com.nexus.rinde.mobile.ui.expense

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.ReceiptPhotoStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.ExpenseRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.time.LocalDate

data class ExpenseFormUiState(
    val editingKey: String? = null,
    val tripId: String = "",
    val tripCode: String = "",
    val tripRoute: String = "",
    val category: String = "FUEL",
    val amount: String = "",
    val expenseDate: String = LocalDate.now().toString(),
    val capturedPhoto: CapturedPhoto? = null,
    val existingPhotoPath: String? = null,
    val existingPhotoName: String? = null,
    val existingPhotoSizeBytes: Long = 0L,
    val removeExistingPhoto: Boolean = false,
    val compressingPhoto: Boolean = false,
    val saving: Boolean = false,
    val error: String = "",
) {
    val isEditing: Boolean get() = editingKey != null
    val hasPhoto: Boolean
        get() = capturedPhoto != null || (!removeExistingPhoto && !existingPhotoPath.isNullOrBlank())
    val displayPhotoPath: String?
        get() = capturedPhoto?.file?.absolutePath ?: if (!removeExistingPhoto) existingPhotoPath else null
    val displayPhotoName: String?
        get() = capturedPhoto?.fileName ?: if (!removeExistingPhoto) existingPhotoName else null
    val displayPhotoSizeBytes: Long
        get() = capturedPhoto?.sizeBytes ?: if (!removeExistingPhoto) existingPhotoSizeBytes else 0L
}

class ExpenseFormViewModel(
    private val expenseRepository: ExpenseRepository,
    private val photoStore: ReceiptPhotoStore,
) : ViewModel() {

    private val mutable = MutableStateFlow(ExpenseFormUiState())
    val state = mutable.asStateFlow()

    fun prepareNew(trip: Trip) {
        val current = mutable.value
        if (current.editingKey == null && current.tripId == trip.id && current.amount.isNotBlank()) {
            return
        }
        cleanupTempCapturedPhoto(current.capturedPhoto)
        mutable.value = ExpenseFormUiState(
            tripId = trip.id,
            tripCode = trip.code,
            tripRoute = "${trip.origin} a ${trip.destination}",
            expenseDate = LocalDate.now().toString(),
        )
    }

    fun prepareEdit(item: QueueItemEntity) {
        cleanupTempCapturedPhoto(mutable.value.capturedPhoto)
        val payload = ExpenseQueuePayload.fromJson(item.payloadJson)
        mutable.value = ExpenseFormUiState(
            editingKey = item.idempotencyKey,
            tripId = item.tripId,
            tripCode = item.tripCode,
            tripRoute = "",
            category = payload.category,
            amount = payload.amount.toPlainString(),
            expenseDate = payload.expenseDate,
            existingPhotoPath = item.photoPath,
            existingPhotoName = item.photoFileName,
            existingPhotoSizeBytes = item.photoSizeBytes,
            error = item.errorMessage,
        )
    }

    fun onCategoryChange(value: String) {
        mutable.update { it.copy(category = value, error = "") }
    }

    fun onAmountChange(value: String) {
        mutable.update { it.copy(amount = value, error = "") }
    }

    fun onDateChange(value: String) {
        mutable.update { it.copy(expenseDate = value, error = "") }
    }

    fun attachPhotoFromUri(uri: Uri, suggestedName: String? = null, tempCacheFileToDelete: java.io.File? = null) {
        viewModelScope.launch {
            mutable.update { it.copy(compressingPhoto = true, error = "") }
            try {
                val compressed = photoStore.compressFromUri(uri, suggestedName)
                val previous = mutable.value.capturedPhoto
                cleanupTempCapturedPhoto(previous)
                mutable.update {
                    it.copy(
                        capturedPhoto = compressed,
                        removeExistingPhoto = false,
                        compressingPhoto = false,
                    )
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: IllegalArgumentException) {
                mutable.update {
                    it.copy(
                        compressingPhoto = false,
                        error = e.message.orEmpty().ifBlank { "No pudimos procesar la foto." },
                    )
                }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(
                        compressingPhoto = false,
                        error = "No pudimos procesar la foto del comprobante.",
                    )
                }
            } finally {
                photoStore.deleteCacheFile(tempCacheFileToDelete)
            }
        }
    }

    fun removePhoto() {
        cleanupTempCapturedPhoto(mutable.value.capturedPhoto)
        mutable.update {
            it.copy(
                capturedPhoto = null,
                removeExistingPhoto = true,
                error = "",
            )
        }
    }

    fun resetForm(keepTrip: Trip?) {
        cleanupTempCapturedPhoto(mutable.value.capturedPhoto)
        mutable.value = ExpenseFormUiState(
            tripId = keepTrip?.id.orEmpty(),
            tripCode = keepTrip?.code.orEmpty(),
            tripRoute = keepTrip?.let { "${it.origin} a ${it.destination}" }.orEmpty(),
            expenseDate = LocalDate.now().toString(),
        )
    }

    fun save(
        session: SessionData,
        trip: Trip?,
        isOnline: Boolean,
        onSaved: (message: String, shouldTriggerSync: Boolean) -> Unit,
    ) {
        val current = mutable.value
        if (current.saving || current.compressingPhoto) return
        mutable.update { it.copy(saving = true, error = "") }
        viewModelScope.launch {
            try {
                if (current.editingKey != null) {
                    val existing = expenseRepository.findByKey(current.editingKey)
                        ?: throw IllegalArgumentException("El registro ya no está en la cola.")
                    expenseRepository.updateRejectedExpense(
                        existing = existing,
                        category = current.category,
                        rawAmount = current.amount,
                        rawDate = current.expenseDate,
                        newPhoto = current.capturedPhoto,
                        removeExistingPhoto = current.removeExistingPhoto,
                    )
                } else {
                    val targetTrip = trip
                        ?: throw IllegalArgumentException("Selecciona un viaje en ruta para registrar gastos.")
                    expenseRepository.enqueueNewExpense(
                        userId = session.userId,
                        trip = targetTrip,
                        category = current.category,
                        rawAmount = current.amount,
                        rawDate = current.expenseDate,
                        photo = current.capturedPhoto,
                    )
                }
                // Una vez persistido en la cola, el archivo le pertenece al repositorio
                mutable.value = ExpenseFormUiState(
                    tripId = trip?.id.orEmpty(),
                    tripCode = trip?.code.orEmpty(),
                    tripRoute = trip?.let { "${it.origin} a ${it.destination}" }.orEmpty(),
                    expenseDate = LocalDate.now().toString(),
                )
                val confirmation = if (isOnline) {
                    "Gasto guardado en la cola local. Enviando al servidor..."
                } else {
                    "Guardado en el teléfono, se enviará al recuperar señal."
                }
                onSaved(confirmation, isOnline)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: IllegalArgumentException) {
                mutable.update { it.copy(saving = false, error = e.message.orEmpty()) }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(
                        saving = false,
                        error = "No pudimos guardar el gasto en el teléfono.",
                    )
                }
            }
        }
    }

    private fun cleanupTempCapturedPhoto(photo: CapturedPhoto?) {
        if (photo != null) {
            photoStore.deletePhoto(photo.file.absolutePath)
        }
    }

    class Factory(
        private val expenseRepository: ExpenseRepository,
        private val photoStore: ReceiptPhotoStore,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            ExpenseFormViewModel(expenseRepository, photoStore) as T
    }
}
