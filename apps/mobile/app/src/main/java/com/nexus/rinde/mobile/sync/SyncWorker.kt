package com.nexus.rinde.mobile.sync

import android.content.Context
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.nexus.rinde.mobile.RindeApplication
import java.util.concurrent.TimeUnit

interface SyncScheduler {
    fun scheduleWhenOnline()
}

class WorkManagerSyncScheduler(
    private val context: Context,
) : SyncScheduler {
    override fun scheduleWhenOnline() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        val request = OneTimeWorkRequestBuilder<OfflineSyncWorker>()
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 15, TimeUnit.SECONDS)
            .build()
        WorkManager.getInstance(context).enqueueUniqueWork(
            UNIQUE_WORK_NAME,
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }

    private companion object {
        const val UNIQUE_WORK_NAME = "rinde_offline_sync"
    }
}

class OfflineSyncWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {
    override suspend fun doWork(): Result {
        val container = (applicationContext as RindeApplication).container
        return when (val result = container.syncEngine.syncNow(manual = false)) {
            is SyncResult.NoSession,
            is SyncResult.SessionExpired -> Result.success()
            is SyncResult.Completed -> {
                if (result.retryPendingCount > 0 || container.pushDeviceRepository.hasPendingSync()) {
                    Result.retry()
                } else {
                    Result.success()
                }
            }
        }
    }
}
