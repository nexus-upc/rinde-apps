package com.nexus.rinde.mobile.location

import java.time.Instant
import java.time.temporal.ChronoUnit

object LocationSampleTimeResolver {
    const val MAX_LAST_LOCATION_AGE_MS = 10L * 60L * 1000L

    fun resolveRecordedAt(
        locationTimeEpochMs: Long,
        nowEpochMs: Long,
        isFromLastLocation: Boolean,
    ): Instant? {
        if (locationTimeEpochMs <= 0L) {
            return if (isFromLastLocation) {
                null
            } else {
                Instant.ofEpochMilli(nowEpochMs).truncatedTo(ChronoUnit.SECONDS)
            }
        }
        if (isFromLastLocation && nowEpochMs - locationTimeEpochMs > MAX_LAST_LOCATION_AGE_MS) {
            return null
        }
        val effectiveEpochMs = minOf(locationTimeEpochMs, nowEpochMs)
        return Instant.ofEpochMilli(effectiveEpochMs).truncatedTo(ChronoUnit.SECONDS)
    }
}
