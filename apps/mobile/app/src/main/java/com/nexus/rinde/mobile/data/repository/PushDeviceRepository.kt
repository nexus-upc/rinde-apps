package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.PushDeviceState
import com.nexus.rinde.mobile.data.local.PushDeviceStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.RegisterDeviceRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.sync.SyncScheduler
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeoutOrNull

fun interface PushTokenProvider {
    suspend fun fetchToken(): String?
}

enum class PushSyncOutcome {
    REGISTERED,
    ALREADY_SYNCED,
    NO_TOKEN,
    SKIPPED,
    FAILED_PENDING,
    SESSION_EXPIRED,
}

class PushDeviceRepository(
    private val pushDeviceStore: PushDeviceStore,
    private val sessionStore: SessionStore,
    private val tokenProvider: PushTokenProvider,
    private val remoteFactory: (SessionData) -> RindeRemoteClient,
    private val syncScheduler: SyncScheduler,
    private val clockSeconds: () -> Long = { System.currentTimeMillis() / 1000L },
    private val logoutTimeoutMs: Long = DEFAULT_LOGOUT_TIMEOUT_MS,
) {
    private val mutex = Mutex()

    suspend fun syncRegistrationIfNeeded(session: SessionData): PushSyncOutcome = mutex.withLock {
        if (session.isExpired(clockSeconds())) {
            return@withLock PushSyncOutcome.SKIPPED
        }
        val fetchedToken = runCatching { tokenProvider.fetchToken() }
            .getOrNull()
            ?.trim()
            ?.takeIf { it.isNotBlank() }

        val state = pushDeviceStore.read()
        val effectiveToken = fetchedToken ?: state.currentToken?.trim()?.takeIf { it.isNotBlank() }
            ?: return@withLock PushSyncOutcome.NO_TOKEN

        syncLocked(session = session, state = state, targetToken = effectiveToken)
    }

    suspend fun onNewToken(newToken: String): PushSyncOutcome = mutex.withLock {
        val cleanToken = newToken.trim()
        if (cleanToken.isBlank()) return@withLock PushSyncOutcome.NO_TOKEN

        val state = pushDeviceStore.read()
        val session = sessionStore.read()
        if (session == null || session.isExpired(clockSeconds())) {
            // Conservar el nuevo token para registrarlo apenas inicie sesión un conductor
            pushDeviceStore.save(
                PushDeviceState(
                    currentToken = cleanToken,
                    pendingRegistration = false,
                ),
            )
            return@withLock PushSyncOutcome.SKIPPED
        }

        syncLocked(session = session, state = state, targetToken = cleanToken)
    }

    suspend fun unregisterOnSignOut(session: SessionData) = mutex.withLock {
        val state = pushDeviceStore.read()
        val tokensToRemove = linkedSetOf<String>()
        if (state.syncedUserId == session.userId && state.syncedServerUrl == session.serverUrl) {
            state.syncedToken?.takeIf { it.isNotBlank() }?.let(tokensToRemove::add)
        }
        if (tokensToRemove.isEmpty()) {
            state.currentToken?.takeIf { it.isNotBlank() }?.let(tokensToRemove::add)
        }
        if (state.staleTokenUserId == session.userId && state.staleTokenServerUrl == session.serverUrl) {
            state.staleTokenToUnregister?.takeIf { it.isNotBlank() }?.let(tokensToRemove::add)
        }

        val remote = remoteFactory(session)
        try {
            withTimeoutOrNull(logoutTimeoutMs) {
                for (token in tokensToRemove) {
                    try {
                        remote.removeDevice(token)
                    } catch (cancelled: CancellationException) {
                        throw cancelled
                    } catch (_: Exception) {
                        // Baja en mejor esfuerzo: nunca bloquea el cierre de sesión
                    }
                }
            }
        } finally {
            clearRegistrationStateLocked(state.currentToken)
        }
    }

    suspend fun ensurePendingScheduled(session: SessionData) = mutex.withLock {
        if (session.isExpired(clockSeconds())) return@withLock
        val fetchedToken = runCatching { tokenProvider.fetchToken() }
            .getOrNull()
            ?.trim()
            ?.takeIf { it.isNotBlank() }
        val state = pushDeviceStore.read()
        val effectiveToken = fetchedToken ?: state.currentToken?.trim()?.takeIf { it.isNotBlank() } ?: return@withLock
        val staleToken = resolveStaleToken(state, session, effectiveToken)
        val alreadySynced = state.syncedToken == effectiveToken &&
            state.syncedUserId == session.userId &&
            state.syncedServerUrl == session.serverUrl &&
            !state.pendingRegistration &&
            staleToken == null
        if (!alreadySynced) {
            savePendingState(targetToken = effectiveToken, staleToken = staleToken, session = session)
            syncScheduler.scheduleWhenOnline()
        }
    }

    fun clearRegistrationState() {
        val current = pushDeviceStore.read()
        clearRegistrationStateLocked(current.currentToken)
    }

    fun hasPendingSync(): Boolean {
        val session = sessionStore.read() ?: return false
        if (session.isExpired(clockSeconds())) return false
        val state = pushDeviceStore.read()
        val hasStale = !state.staleTokenToUnregister.isNullOrBlank() &&
            state.staleTokenUserId == session.userId &&
            state.staleTokenServerUrl == session.serverUrl
        val needsRegister = !state.currentToken.isNullOrBlank() && (
            state.pendingRegistration ||
                state.syncedToken != state.currentToken ||
                state.syncedUserId != session.userId ||
                state.syncedServerUrl != session.serverUrl
            )
        return needsRegister || hasStale
    }

    private suspend fun syncLocked(
        session: SessionData,
        state: PushDeviceState,
        targetToken: String,
    ): PushSyncOutcome {
        val staleToken = resolveStaleToken(state, session, targetToken)
        val alreadyRegistered = state.syncedToken == targetToken &&
            state.syncedUserId == session.userId &&
            state.syncedServerUrl == session.serverUrl &&
            !state.pendingRegistration

        if (alreadyRegistered && staleToken == null) {
            return PushSyncOutcome.ALREADY_SYNCED
        }

        val remote = remoteFactory(session)
        var remainingStale: String? = staleToken
        if (staleToken != null) {
            try {
                remote.removeDevice(staleToken)
                remainingStale = null
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (e: ApiException) {
                if (e.status == 401) {
                    savePendingState(
                        targetToken = targetToken,
                        staleToken = staleToken,
                        session = session,
                    )
                    return PushSyncOutcome.SESSION_EXPIRED
                }
                if (e.status in 400..499) {
                    remainingStale = null
                }
            } catch (_: Exception) {
                // Conservar staleToken para reintentar en la siguiente sincronización
            }
        }

        if (alreadyRegistered) {
            pushDeviceStore.save(
                state.copy(
                    currentToken = targetToken,
                    staleTokenToUnregister = remainingStale,
                    staleTokenUserId = if (remainingStale != null) session.userId else null,
                    staleTokenServerUrl = if (remainingStale != null) session.serverUrl else null,
                ),
            )
            return PushSyncOutcome.ALREADY_SYNCED
        }

        return try {
            remote.registerDevice(RegisterDeviceRequest(token = targetToken, platform = PLATFORM_ANDROID))
            pushDeviceStore.save(
                PushDeviceState(
                    currentToken = targetToken,
                    syncedToken = targetToken,
                    syncedUserId = session.userId,
                    syncedServerUrl = session.serverUrl,
                    pendingRegistration = false,
                    staleTokenToUnregister = remainingStale,
                    staleTokenUserId = if (remainingStale != null) session.userId else null,
                    staleTokenServerUrl = if (remainingStale != null) session.serverUrl else null,
                ),
            )
            PushSyncOutcome.REGISTERED
        } catch (cancelled: CancellationException) {
            throw cancelled
        } catch (e: ApiException) {
            savePendingState(
                targetToken = targetToken,
                staleToken = remainingStale,
                session = session,
            )
            if (e.status == 401) {
                PushSyncOutcome.SESSION_EXPIRED
            } else {
                if (e.status >= 500 || e.status == 408 || e.status == 429) {
                    syncScheduler.scheduleWhenOnline()
                }
                PushSyncOutcome.FAILED_PENDING
            }
        } catch (_: Exception) {
            savePendingState(
                targetToken = targetToken,
                staleToken = remainingStale,
                session = session,
            )
            syncScheduler.scheduleWhenOnline()
            PushSyncOutcome.FAILED_PENDING
        }
    }

    private fun resolveStaleToken(
        state: PushDeviceState,
        session: SessionData,
        targetToken: String,
    ): String? {
        val syncedSameOwner = state.syncedUserId == session.userId && state.syncedServerUrl == session.serverUrl
        if (syncedSameOwner && !state.syncedToken.isNullOrBlank() && state.syncedToken != targetToken) {
            return state.syncedToken
        }
        val staleSameOwner = state.staleTokenUserId == session.userId && state.staleTokenServerUrl == session.serverUrl
        if (staleSameOwner && !state.staleTokenToUnregister.isNullOrBlank() && state.staleTokenToUnregister != targetToken) {
            return state.staleTokenToUnregister
        }
        return null
    }

    private fun savePendingState(
        targetToken: String,
        staleToken: String?,
        session: SessionData,
    ) {
        pushDeviceStore.save(
            PushDeviceState(
                currentToken = targetToken,
                syncedToken = null,
                syncedUserId = null,
                syncedServerUrl = null,
                pendingRegistration = true,
                staleTokenToUnregister = staleToken,
                staleTokenUserId = if (staleToken != null) session.userId else null,
                staleTokenServerUrl = if (staleToken != null) session.serverUrl else null,
            ),
        )
    }

    private fun clearRegistrationStateLocked(preservedToken: String?) {
        pushDeviceStore.save(
            PushDeviceState(
                currentToken = preservedToken?.takeIf { it.isNotBlank() },
                pendingRegistration = false,
            ),
        )
    }

    private companion object {
        const val PLATFORM_ANDROID = "ANDROID"
        const val DEFAULT_LOGOUT_TIMEOUT_MS = 5_000L
    }
}
