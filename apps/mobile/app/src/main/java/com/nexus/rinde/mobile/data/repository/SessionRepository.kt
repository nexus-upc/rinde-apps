package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.BuildConfig
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.data.local.JwtClaimsParser
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.sync.SyncScheduler

sealed class SessionRestoreResult {
    data object None : SessionRestoreResult()
    data class Expired(val email: String, val pendingCount: Int) : SessionRestoreResult()
    data class Active(val session: SessionData) : SessionRestoreResult()
}

class SessionRepository(
    private val sessionStore: SessionStore,
    private val queueStore: QueueStore,
    private val remoteFactory: (server: String, token: String) -> RindeRemoteClient,
    private val syncScheduler: SyncScheduler,
    private val clockSeconds: () -> Long = { System.currentTimeMillis() / 1000L },
) {
    suspend fun restoreSession(): SessionRestoreResult {
        val saved = sessionStore.read() ?: return SessionRestoreResult.None
        if (saved.isExpired(clockSeconds())) {
            // La cola local nunca se borra cuando vence la sesión
            val pending = queueStore.countPending(saved.userId)
            sessionStore.clear()
            return SessionRestoreResult.Expired(email = saved.email, pendingCount = pending)
        }
        if (saved.role != DRIVER_ROLE) {
            sessionStore.clear()
            return SessionRestoreResult.None
        }
        return SessionRestoreResult.Active(saved)
    }

    suspend fun signIn(server: String, email: String, password: String): SessionData {
        val base = InputRules.serverUrl(server, BuildConfig.DEBUG)
        val cleanEmail = email.trim()
        require(cleanEmail.isNotBlank() && password.isNotBlank()) {
            "Completa tu correo y contraseña."
        }
        val token = remoteFactory(base, "").signIn(cleanEmail, password)
        val claims = JwtClaimsParser.parse(token)
        require(claims.role == DRIVER_ROLE) {
            "Ingresa con una cuenta de conductor. La administración está en la web."
        }
        val session = SessionData(
            serverUrl = base,
            email = cleanEmail,
            userId = claims.userId,
            role = claims.role,
            token = token,
            expiresAtEpochSeconds = claims.expiresAtEpochSeconds,
        )
        sessionStore.save(session)
        syncScheduler.scheduleWhenOnline()
        return session
    }

    fun currentSession(): SessionData? = sessionStore.read()

    suspend fun pendingCount(userId: String): Int = queueStore.countPending(userId)

    fun signOutKeepingQueue() {
        sessionStore.clear()
    }

    private companion object {
        const val DRIVER_ROLE = "DRIVER"
    }
}
