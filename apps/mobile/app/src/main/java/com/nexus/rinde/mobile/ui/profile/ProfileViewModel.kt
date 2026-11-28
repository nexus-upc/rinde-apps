package com.nexus.rinde.mobile.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.repository.DriverAccountProfile
import com.nexus.rinde.mobile.data.repository.ProfileRepository
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ProfileQueueSummary(
    val pendingCount: Int,
    val retryableCount: Int,
    val rejectedCount: Int,
    val statusText: String,
    val canSendNow: Boolean,
) {
    companion object {
        fun from(items: List<QueueItemEntity>, isSyncing: Boolean): ProfileQueueSummary {
            val total = items.size
            val retryable = items.count {
                it.queueStatus == QueueItemStatus.PENDING ||
                    it.queueStatus == QueueItemStatus.PHOTO_PENDING
            }
            val rejected = items.count { it.queueStatus == QueueItemStatus.REJECTED }
            return ProfileQueueSummary(
                pendingCount = total,
                retryableCount = retryable,
                rejectedCount = rejected,
                statusText = if (total == 0) "Todo enviado" else "$total por enviar",
                canSendNow = total > 0 && !isSyncing,
            )
        }
    }
}

data class ProfileUiState(
    val loading: Boolean = false,
    val profile: DriverAccountProfile? = null,
    val error: String = "",
)

class ProfileViewModel(
    private val profileRepository: ProfileRepository,
    private val onSessionExpired: () -> Unit,
) : ViewModel() {

    private val mutable = MutableStateFlow(ProfileUiState())
    val state = mutable.asStateFlow()

    private var activeSession: SessionData? = null
    private var loadJob: Job? = null

    fun bindSession(session: SessionData?) {
        if (session == null) {
            activeSession = null
            loadJob?.cancel()
            mutable.value = ProfileUiState()
            return
        }
        if (session.userId == activeSession?.userId && session.token == activeSession?.token) {
            return
        }
        activeSession = session
        loadProfile()
    }

    fun loadProfile() {
        val session = activeSession ?: return
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            mutable.update { it.copy(loading = true, error = "") }
            try {
                val loaded = profileRepository.loadProfile(session)
                mutable.value = ProfileUiState(loading = false, profile = loaded)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (ex: ApiException) {
                if (ex.status == 401) {
                    onSessionExpired()
                } else {
                    mutable.update {
                        it.copy(
                            loading = false,
                            error = ex.message.orEmpty().ifBlank {
                                "No pudimos cargar tu perfil."
                            },
                        )
                    }
                }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(
                        loading = false,
                        error = "No pudimos cargar tu perfil. Comprueba tu conexión e inténtalo de nuevo.",
                    )
                }
            }
        }
    }

    class Factory(
        private val profileRepository: ProfileRepository,
        private val onSessionExpired: () -> Unit,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            ProfileViewModel(profileRepository, onSessionExpired) as T
    }
}
