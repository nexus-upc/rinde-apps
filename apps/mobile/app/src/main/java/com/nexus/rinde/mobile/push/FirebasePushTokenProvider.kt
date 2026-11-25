package com.nexus.rinde.mobile.push

import android.content.Context
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import com.nexus.rinde.mobile.data.repository.PushTokenProvider
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume

class FirebasePushTokenProvider(
    private val context: Context,
) : PushTokenProvider {

    override suspend fun fetchToken(): String? {
        // Evitar IllegalStateException cuando no existe google-services.json en el build
        val hasFirebaseApp = runCatching { FirebaseApp.getApps(context).isNotEmpty() }.getOrDefault(false)
        if (!hasFirebaseApp) return null

        return suspendCancellableCoroutine { continuation ->
            try {
                FirebaseMessaging.getInstance().token
                    .addOnSuccessListener { token ->
                        if (continuation.isActive) {
                            continuation.resume(token?.trim()?.takeIf { it.isNotBlank() })
                        }
                    }
                    .addOnFailureListener {
                        if (continuation.isActive) {
                            continuation.resume(null)
                        }
                    }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                if (continuation.isActive) {
                    continuation.resume(null)
                }
            }
        }
    }
}
