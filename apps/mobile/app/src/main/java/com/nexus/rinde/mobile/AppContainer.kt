package com.nexus.rinde.mobile

import android.app.Application
import android.content.Context
import androidx.room.Room
import com.nexus.rinde.mobile.data.local.AesGcmSessionCipher
import com.nexus.rinde.mobile.data.local.AndroidKeystoreKeyProvider
import com.nexus.rinde.mobile.data.local.EncryptedSessionStore
import com.nexus.rinde.mobile.data.local.ReceiptPhotoStore
import com.nexus.rinde.mobile.data.local.RindeDatabase
import com.nexus.rinde.mobile.data.local.RoomQueueStore
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.RindeApi
import com.nexus.rinde.mobile.data.repository.ExpenseRepository
import com.nexus.rinde.mobile.data.repository.SessionRepository
import com.nexus.rinde.mobile.data.repository.TripRepository
import com.nexus.rinde.mobile.sync.NetworkMonitor
import com.nexus.rinde.mobile.sync.OfflineSyncEngine
import com.nexus.rinde.mobile.sync.SyncScheduler
import com.nexus.rinde.mobile.sync.WorkManagerSyncScheduler
import java.io.File

class AppContainer(context: Context) {
    private val appContext = context.applicationContext

    private val database: RindeDatabase = Room.databaseBuilder(
        appContext,
        RindeDatabase::class.java,
        "rinde_mobile.db",
    ).build()

    val queueStore = RoomQueueStore(database.offlineQueueDao())

    val sessionStore: SessionStore = EncryptedSessionStore(
        file = File(appContext.noBackupFilesDir, "rinde_session.bin"),
        cipher = AesGcmSessionCipher(AndroidKeystoreKeyProvider()),
    )

    val photoStore = ReceiptPhotoStore(appContext)
    val networkMonitor = NetworkMonitor(appContext)
    val syncScheduler: SyncScheduler = WorkManagerSyncScheduler(appContext)

    val syncEngine = OfflineSyncEngine(
        sessionStore = sessionStore,
        queueStore = queueStore,
        remoteFactory = { session -> RindeApi(session.serverUrl, session.token) },
        deletePhoto = photoStore::deletePhoto,
    )

    val sessionRepository = SessionRepository(
        sessionStore = sessionStore,
        queueStore = queueStore,
        remoteFactory = { server, token -> RindeApi(server, token) },
        syncScheduler = syncScheduler,
    )

    val tripRepository = TripRepository(
        cachedTripDao = database.cachedTripDao(),
        remoteFactory = { session -> RindeApi(session.serverUrl, session.token) },
    )

    val expenseRepository = ExpenseRepository(
        queueStore = queueStore,
        syncEngine = syncEngine,
        syncScheduler = syncScheduler,
        deletePhotoFile = photoStore::deletePhoto,
    )
}

class RindeApplication : Application() {
    val container: AppContainer by lazy { AppContainer(this) }
}
