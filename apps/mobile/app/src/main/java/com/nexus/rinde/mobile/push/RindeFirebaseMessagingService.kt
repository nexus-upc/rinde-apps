package com.nexus.rinde.mobile.push

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.nexus.rinde.mobile.RindeApplication
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeoutOrNull

class RindeFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        val container = (applicationContext as? RindeApplication)?.container ?: return
        // Guardar y sincronizar dentro del tiempo de servicio sin registrar el token en logs
        runBlocking(Dispatchers.IO) {
            withTimeoutOrNull(TOKEN_SYNC_TIMEOUT_MS) {
                container.pushDeviceRepository.onNewToken(token)
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val parsed = TripPushMessageParser.parse(
            data = message.data,
            notificationTitle = message.notification?.title,
            notificationBody = message.notification?.body,
        )
        TripNotificationHelper.showTripAssignmentNotification(applicationContext, parsed)
    }

    private companion object {
        const val TOKEN_SYNC_TIMEOUT_MS = 8_000L
    }
}
