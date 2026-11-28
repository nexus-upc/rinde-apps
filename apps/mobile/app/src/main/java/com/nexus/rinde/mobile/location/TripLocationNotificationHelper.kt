package com.nexus.rinde.mobile.location

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.nexus.rinde.mobile.MainActivity
import com.nexus.rinde.mobile.R

object TripLocationNotificationHelper {
    const val CHANNEL_ID = "rinde_trip_location_tracking"
    const val CHANNEL_NAME = "Ubicación en ruta"
    const val NOTIFICATION_ID = 3301
    private const val CHANNEL_DESCRIPTION =
        "Notificación fija mientras compartes la ubicación de un viaje en ruta."

    fun ensureChannel(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        val channel = NotificationChannel(
            CHANNEL_ID,
            CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW,
        ).apply {
            description = CHANNEL_DESCRIPTION
            setShowBadge(false)
        }
        manager.createNotificationChannel(channel)
    }

    fun buildNotification(context: Context, tripCode: String): Notification {
        ensureChannel(context)
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_CLEAR_TOP or
                Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            NOTIFICATION_ID,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val label = tripCode.ifBlank { "en ruta" }
        return NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("Compartiendo la ubicación del viaje $label")
            .setContentText("Se detendrá automáticamente al finalizar el viaje.")
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setContentIntent(pendingIntent)
            .build()
    }
}
