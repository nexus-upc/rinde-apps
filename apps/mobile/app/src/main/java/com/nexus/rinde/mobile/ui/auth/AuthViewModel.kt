package com.nexus.rinde.mobile.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.repository.SessionRepository
import com.nexus.rinde.mobile.data.repository.SessionRestoreResult
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val restoring: Boolean = true,
    val busy: Boolean = false,
    val session: SessionData? = null,
    val prefillEmail: String = "",
    val error: String = "",
    val notice: String = "",
) {
    val signedIn: Boolean get() = session != null
}

class AuthViewModel(
    private val sessionRepository: SessionRepository,
) : ViewModel() {

    private val mutable = MutableStateFlow(AuthUiState())
    val state = mutable.asStateFlow()

    init {
        viewModelScope.launch {
            when (val result = sessionRepository.restoreSession()) {
                is SessionRestoreResult.Active -> {
                    mutable.value = AuthUiState(restoring = false, session = result.session)
                }
                is SessionRestoreResult.Expired -> {
                    val notice = if (result.pendingCount > 0) {
                        "Tu sesión venció. Vuelve a ingresar. Tienes ${result.pendingCount} " +
                            "registro(s) pendiente(s) guardado(s)."
                    } else {
                        "Tu sesión venció. Vuelve a ingresar."
                    }
                    mutable.value = AuthUiState(
                        restoring = false,
                        prefillEmail = result.email,
                        error = notice,
                    )
                }
                is SessionRestoreResult.None -> {
                    mutable.value = AuthUiState(restoring = false)
                }
            }
        }
    }

    fun signIn(server: String, email: String, password: String) {
        if (mutable.value.busy) return
        mutable.update { it.copy(busy = true, error = "", notice = "") }
        viewModelScope.launch {
            try {
                val session = sessionRepository.signIn(server, email, password)
                mutable.value = AuthUiState(restoring = false, session = session)
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                mutable.update { it.copy(busy = false, error = e.message.orEmpty()) }
            } catch (e: IllegalArgumentException) {
                mutable.update { it.copy(busy = false, error = e.message.orEmpty()) }
            } catch (_: Exception) {
                mutable.update {
                    it.copy(
                        busy = false,
                        error = "No recibimos confirmación del servidor. Comprueba la conexión e inténtalo de nuevo.",
                    )
                }
            }
        }
    }

    fun onSessionExpired() {
        val currentEmail = mutable.value.session?.email.orEmpty()
        sessionRepository.signOutKeepingQueue()
        mutable.value = AuthUiState(
            restoring = false,
            prefillEmail = currentEmail,
            error = "Tu sesión venció. Vuelve a ingresar. Tus registros pendientes siguen guardados.",
        )
    }

    suspend fun pendingCountBeforeSignOut(): Int {
        val userId = mutable.value.session?.userId ?: return 0
        return sessionRepository.pendingCount(userId)
    }

    fun confirmSignOut() {
        sessionRepository.signOutKeepingQueue()
        mutable.value = AuthUiState(restoring = false)
    }

    class Factory(
        private val sessionRepository: SessionRepository,
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T =
            AuthViewModel(sessionRepository) as T
    }
}
