package com.nexus.rinde.mobile.sync

import kotlin.math.min

object BackoffPolicyCalculator {
    private const val BASE_DELAY_MS = 15_000L
    private const val MAX_DELAY_MS = 900_000L

    fun delayMs(retryCount: Int): Long {
        if (retryCount <= 0) return 0L
        val shift = (retryCount - 1).coerceAtMost(10)
        return min(BASE_DELAY_MS shl shift, MAX_DELAY_MS)
    }
}
