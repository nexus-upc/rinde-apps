package com.nexus.rinde.mobile.location

import com.nexus.rinde.mobile.data.remote.Trip

enum class LocationShareStatus {
    SHARING,
    PERMISSION_DENIED,
    INACTIVE,
}

data class LocationTrackingState(
    val activeTripId: String? = null,
    val activeTripCode: String = "",
    val isSharing: Boolean = false,
    val permissionDeniedForTripIds: Set<String> = emptySet(),
    val lastRecordedAt: String = "",
)

object LocationPermissionFlow {
    const val DISCLOSURE_MESSAGE =
        "Mientras el viaje esté en ruta, la oficina verá dónde está el camión. " +
            "Al finalizar el viaje dejamos de compartir tu ubicación."

    fun statusForTrip(
        trip: Trip?,
        state: LocationTrackingState,
        hasLocationPermission: Boolean,
    ): LocationShareStatus {
        if (trip == null || trip.status != "IN_ROUTE") return LocationShareStatus.INACTIVE
        if (state.isSharing && state.activeTripId == trip.id && hasLocationPermission) {
            return LocationShareStatus.SHARING
        }
        if (!hasLocationPermission || trip.id in state.permissionDeniedForTripIds) {
            return LocationShareStatus.PERMISSION_DENIED
        }
        return LocationShareStatus.INACTIVE
    }
}
