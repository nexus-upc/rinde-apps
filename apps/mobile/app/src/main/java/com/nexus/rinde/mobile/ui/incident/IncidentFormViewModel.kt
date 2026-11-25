package com.nexus.rinde.mobile.ui.incident

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.data.local.PhotoAttachmentStore
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.IncidentRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.io.File

data class IncidentFormUiState(
    val editingKey: String? = null,
    val tripId: String = "",
    val tripCode: String = "",
    val tripRoute: String = "",
    val type: String = "BREAKDOWN",
    val description: String = "",
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
    val descriptionLength: Int get() = description.trim().length
    val exceedsMaxLength: Boolean get() = descriptionLength > InputRules.INCIDENT_DESCRIPTION_MAX_LENGTH
    val hasPhoto: Boolean
        get() = capturedPhoto != null || (!removeExistingPhoto && !existingPhotoPath.isNullOrBlank())
    val displayPhotoPath: String?
        get() = capturedPhoto?.file?.absolutePath ?: if (!removeExistingPhoto) existingPhotoPath else null
    val displayPhotoName: String?
        get() = capturedPhoto?.fileName ?: if (!removeExistingPhoto) existingPhotoName else null
    val displayPhotoSizeBytes: Long
        get() = capturedPhoto?.sizeBytes ?: if (!removeExistingPhoto) existingPhotoSizeBytes else 0L
}

class IncidentFormViewModel(
    private val incidentRepository: IncidentRepository,
    private val photoStore: PhotoAttachmentStore,
) : ViewModel() {

    private val mutable = MutableStateFlow(IncidentFormUiState())
    val state = mutable.asStateFlow()

    fun prepareNew(trip: Trip) {
        val current = mutable.value
        if (current.editingKey == null && current.tripId == trip.id && current.description.isNotBlank()) {
            return
        }
        cleanupTempCapturedPhoto(current.capturedPhoto)
        mutable.value = IncidentFormUiState(
            tripId = trip.id,
            tripCode = trip.code,
            tripRoute = "${trip.origin} a ${trip.destination}",
        )
    }

    fun prepareEdit(item: QueueItemEntity) {
        cleanupTempCapturedPhoto(mutable.value.capturedPhoto)
        val payload = IncidentQueuePayload.fromJson(item.payloadJson)
        mutable.value = IncidentFormUiState(
            editingKey = item.idempotencyKey,
            tripId = item.tripId,
            tripCode = item.tripCode,
            tripRoute = "",
            type = payload.type,
            description = payload.description,
            existingPhotoPath = item.photoPath,
            existingPhotoName = item.photoFileName,
            existingPhotoSizeBytes = item.photoSizeBytes,
            error = item.errorMessage,
        )
    }

    fun onTypeChange(value: String) {
        mutable.update { it.copy(type = value, error = "") }
    }

    fun onDescriptionChange(value: String) {
        mutable.update { it.copy(description = value, error = "") }
    }

    fun attachPhotoFromUri(uri: Uri, suggestedName: String? = null, tempCacheFileToDelete: File? = null) {
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
                        error = "No pudimos procesar la foto de la incidencia.",
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
        mutable.value = IncidentFormUiState(
            tripId = keepTrip?.id.orEmpty(),
            tripCode = keepTrip?.code.orEmpty(),
            tripRoute = keepTrip?.let { "${it.origin} a ${it.destination}" }.orEmpty(),
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
                    val existing = incidentRepository.findByKey(current.editingKey)
                        ?: throw IllegalArgumentException("El reporte ya no está en la cola.")
                    incidentRepository.updateRejectedIncident(
                        existing = existing,
                        type = current.type,
                        rawDescription = current.description,
                        newPhoto = current.capturedPhoto,
                        removeExistingPhoto = current.removeExistingPhoto,
                    )
                } else {
                    val targetTrip = trip
                        ?: throw IllegalArgumentException("Selecciona un viaje en ruta para reportar incidencias.")
                    incidentRepository.enqueueNewIncident(
                        userId = session.userId,
                        trip = targetTrip,
                        type = current.type,
                        rawDescription = current.description,
                        photo = current.capturedPhoto,
                    )
                }
                mutable.value = IncidentFormUiState(
                    tripId = trip?.id.orEmpty(),
                    tripCode = trip?.code.orEmpty(),
                    tripRoute = trip?.let { "${it.origin} a ${it.destination}" }.orEmpty(),
                )
                val confirmation = if (isOnline) {
                    "Incidencia guardada en la cola local. Enviando al servidor..."
                } else {
                    "Incidencia guardada en el teléfono, se enviará al recuperar señal."
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
                        error = "No pudimos guardar la incidencia en el teléfono.",
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
        private val incidentRepository: IncidentRepository,
        private val photoStore: PhotoAttachmentStore,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            IncidentFormViewModel(incidentRepository, photoStore) as T
    }
}
