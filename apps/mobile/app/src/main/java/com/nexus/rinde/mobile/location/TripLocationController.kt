package com.nexus.rinde.mobile.location

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat
import com.nexus.rinde.mobile.data.remote.Trip
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

class TripLocationController(
    context: Context,
) {
    private val appContext = context.applicationContext
    private val mutable = MutableStateFlow(LocationTrackingState())
    val state = mutable.asStateFlow()

    fun hasLocationPermission(): Boolean =
        ContextCompat.checkSelfPermission(
            appContext,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ) == PackageManager.PERMISSION_GRANTED

    fun startTracking(tripId: String, tripCode: String): Boolean {
        if (tripId.isBlank()) return false
        if (!hasLocationPermission()) {
            markPermissionDenied(tripId)
            return false
        }
        mutable.update { current ->
            current.copy(
                activeTripId = tripId,
                activeTripCode = tripCode,
                isSharing = true,
                permissionDeniedForTripIds = current.permissionDeniedForTripIds - tripId,
            )
        }
        val intent = Intent(appContext, TripLocationForegroundService::class.java).apply {
            action = TripLocationForegroundService.ACTION_START
            putExtra(TripLocationForegroundService.EXTRA_TRIP_ID, tripId)
            putExtra(TripLocationForegroundService.EXTRA_TRIP_CODE, tripCode)
        }
        ContextCompat.startForegroundService(appContext, intent)
        return true
    }

    fun markPermissionDenied(tripId: String) {
        mutable.update { current ->
            val stillActive = if (current.activeTripId == tripId) null else current.activeTripId
            current.copy(
                activeTripId = stillActive,
                activeTripCode = if (stillActive == null) "" else current.activeTripCode,
                isSharing = stillActive != null && current.isSharing,
                permissionDeniedForTripIds = current.permissionDeniedForTripIds + tripId,
            )
        }
    }

    fun stopTracking(tripId: String? = null) {
        val current = mutable.value
        if (tripId != null && current.activeTripId != null && current.activeTripId != tripId) {
            return
        }
        val hadActive = current.isSharing || current.activeTripId != null
        mutable.update {
            it.copy(
                activeTripId = null,
                activeTripCode = "",
                isSharing = false,
            )
        }
        if (hadActive) {
            val intent = Intent(appContext, TripLocationForegroundService::class.java).apply {
                action = TripLocationForegroundService.ACTION_STOP
            }
            runCatching { appContext.startService(intent) }
        }
    }

    fun onServiceStopped(tripId: String?) {
        mutable.update { current ->
            if (tripId == null || current.activeTripId == tripId) {
                current.copy(activeTripId = null, activeTripCode = "", isSharing = false)
            } else {
                current
            }
        }
    }

    fun onPointRecorded(recordedAtIso: String) {
        mutable.update { it.copy(lastRecordedAt = recordedAtIso) }
    }

    fun reconcileWithTrips(trips: List<Trip>): String? {
        val trackedId = mutable.value.activeTripId ?: return null
        val matchingTrip = trips.firstOrNull { it.id == trackedId }
        if (matchingTrip == null || matchingTrip.status != "IN_ROUTE") {
            stopTracking(trackedId)
            return trackedId
        }
        return null
    }
}
