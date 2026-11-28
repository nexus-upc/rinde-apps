package com.nexus.rinde.mobile.location

import android.Manifest
import android.annotation.SuppressLint
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.location.Location
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.nexus.rinde.mobile.RindeApplication
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class TripLocationForegroundService : Service() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private lateinit var fusedClient: FusedLocationProviderClient
    private var activeTripId: String? = null
    private var activeTripCode: String = ""
    private var updatesRegistered = false

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { handleLocationSample(it, isFromLastLocation = false) }
        }
    }

    override fun onCreate() {
        super.onCreate()
        fusedClient = LocationServices.getFusedLocationProviderClient(this)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null || intent.action == ACTION_STOP) {
            stopTrackingService()
            return START_NOT_STICKY
        }

        val tripId = intent.getStringExtra(EXTRA_TRIP_ID).orEmpty()
        val tripCode = intent.getStringExtra(EXTRA_TRIP_CODE).orEmpty()
        if (tripId.isBlank() || !hasLocationPermission()) {
            stopTrackingService()
            return START_NOT_STICKY
        }

        activeTripId = tripId
        activeTripCode = tripCode
        val notification = TripLocationNotificationHelper.buildNotification(this, tripCode)
        val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        } else {
            0
        }
        ServiceCompat.startForeground(
            this,
            TripLocationNotificationHelper.NOTIFICATION_ID,
            notification,
            serviceType,
        )
        startLocationUpdates()
        return START_NOT_STICKY
    }

    @SuppressLint("MissingPermission")
    private fun startLocationUpdates() {
        if (updatesRegistered || !hasLocationPermission()) return
        val request = LocationRequest.Builder(
            Priority.PRIORITY_HIGH_ACCURACY,
            UPDATE_INTERVAL_MS,
        )
            .setMinUpdateIntervalMillis(MIN_UPDATE_INTERVAL_MS)
            .build()
        updatesRegistered = true
        fusedClient.requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
        fusedClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null)
            .addOnSuccessListener { current ->
                if (current != null) {
                    handleLocationSample(current, isFromLastLocation = false)
                } else {
                    fusedClient.lastLocation.addOnSuccessListener { last ->
                        if (last != null) handleLocationSample(last, isFromLastLocation = true)
                    }
                }
            }
    }

    private fun handleLocationSample(location: Location, isFromLastLocation: Boolean = false) {
        val tripId = activeTripId ?: return
        val tripCode = activeTripCode
        val app = applicationContext as? RindeApplication ?: return
        val container = app.container
        val session = container.sessionStore.read()
        if (session == null) {
            stopTrackingService()
            return
        }

        val recordedAt = LocationSampleTimeResolver.resolveRecordedAt(
            locationTimeEpochMs = location.time,
            nowEpochMs = System.currentTimeMillis(),
            isFromLastLocation = isFromLastLocation,
        ) ?: return
        val accuracy = if (location.hasAccuracy()) location.accuracy.toDouble() else null
        serviceScope.launch {
            container.tripLocationRepository.enqueueLocation(
                userId = session.userId,
                tripId = tripId,
                tripCode = tripCode,
                latitude = location.latitude,
                longitude = location.longitude,
                accuracyMeters = accuracy,
                recordedAt = recordedAt,
            )
            container.tripLocationController.onPointRecorded(recordedAt.toString())
            if (container.networkMonitor.isOnline.value) {
                container.syncEngine.syncNow(manual = false)
            }
        }
    }

    private fun stopTrackingService() {
        if (updatesRegistered) {
            fusedClient.removeLocationUpdates(locationCallback)
            updatesRegistered = false
        }
        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        if (updatesRegistered) {
            fusedClient.removeLocationUpdates(locationCallback)
            updatesRegistered = false
        }
        val app = applicationContext as? RindeApplication
        app?.container?.tripLocationController?.onServiceStopped(activeTripId)
        serviceScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION,
            ) == PackageManager.PERMISSION_GRANTED

    companion object {
        const val ACTION_START = "com.nexus.rinde.mobile.location.START"
        const val ACTION_STOP = "com.nexus.rinde.mobile.location.STOP"
        const val EXTRA_TRIP_ID = "tripId"
        const val EXTRA_TRIP_CODE = "tripCode"
        private const val UPDATE_INTERVAL_MS = 180_000L
        private const val MIN_UPDATE_INTERVAL_MS = 60_000L
    }
}
