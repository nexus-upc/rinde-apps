package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.PushDeviceState
import com.nexus.rinde.mobile.data.local.PushDeviceStore
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.Incident
import com.nexus.rinde.mobile.data.remote.RegisterDeviceRequest
import com.nexus.rinde.mobile.data.remote.ReportIncidentRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import com.nexus.rinde.mobile.data.remote.SyncExpensesResponse
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.remote.TripAdvance
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import com.nexus.rinde.mobile.sync.OfflineSyncEngine
import com.nexus.rinde.mobile.sync.SyncResult
import com.nexus.rinde.mobile.sync.SyncScheduler
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.io.IOException
import java.util.Base64

class PushDeviceRepositoryAndSessionTest {

    private class InMemorySessionStore(var current: SessionData? = null) : SessionStore {
        override fun save(session: SessionData) {
            current = session
        }

        override fun read(): SessionData? = current

        override fun clear() {
            current = null
        }
    }

    private class InMemoryPushDeviceStore(var state: PushDeviceState = PushDeviceState()) : PushDeviceStore {
        override fun save(state: PushDeviceState) {
            this.state = state
        }

        override fun read(): PushDeviceState = state

        override fun clear() {
            state = PushDeviceState()
        }
    }

    private class EmptyQueueStore : QueueStore {
        private val flow = MutableStateFlow<List<QueueItemEntity>>(emptyList())
        override fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>> = flow
        override fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>> = flow
        override suspend fun countPending(userId: String): Int = 0
        override suspend fun findByTypeAndStatus(
            userId: String,
            type: QueueItemType,
            status: QueueItemStatus,
        ): List<QueueItemEntity> = emptyList()

        override suspend fun findByKey(key: String): QueueItemEntity? = null
        override suspend fun upsert(item: QueueItemEntity) = Unit
        override suspend fun upsertAll(items: List<QueueItemEntity>) = Unit
        override suspend fun deleteByKey(key: String) = Unit
        override suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long) = Unit

        override suspend fun deleteByTripAndType(
            userId: String,
            tripId: String,
            type: com.nexus.rinde.mobile.data.local.QueueItemType,
        ) = Unit
    }

    private class RecordingSyncScheduler : SyncScheduler {
        var scheduledCount = 0
        override fun scheduleWhenOnline() {
            scheduledCount++
        }
    }

    private class FakePushRemoteClient(
        private val sessionStore: InMemorySessionStore,
        private val issuedJwt: String,
    ) : RindeRemoteClient {
        val registeredRequests = mutableListOf<RegisterDeviceRequest>()
        val removedTokens = mutableListOf<String>()
        val jwtPresentDuringRemove = mutableListOf<Boolean>()
        var registerFailure: Throwable? = null
        var removeFailure: Throwable? = null

        override suspend fun signIn(email: String, password: String): String = issuedJwt
        override suspend fun trips(): List<Trip> = emptyList()
        override suspend fun trip(id: String): Trip = error("unused")
        override suspend fun vehicle(id: String): VehicleSummary = error("unused")
        override suspend fun tripAdvances(tripId: String): List<TripAdvance> = emptyList()
        override suspend fun tripSettlement(tripId: String): Settlement? = null
        override suspend fun changeTripStatus(id: String, action: String): Trip = error("unused")
        override suspend fun expenses(tripId: String): List<Expense> = emptyList()
        override suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse = error("unused")
        override suspend fun uploadExpenseEvidence(
            expenseId: String,
            file: File,
            fileName: String,
            contentType: String,
        ): Expense = error("unused")

        override suspend fun reportIncident(tripId: String, request: ReportIncidentRequest): Incident =
            error("unused")

        override suspend fun uploadIncidentEvidence(
            incidentId: String,
            file: File,
            fileName: String,
            contentType: String,
        ): Incident = error("unused")

        override suspend fun downloadEvidenceBytes(contentUrl: String): ByteArray = ByteArray(0)

        override suspend fun registerDevice(request: RegisterDeviceRequest) {
            registerFailure?.let { throw it }
            registeredRequests.add(request)
        }

        override suspend fun removeDevice(token: String) {
            jwtPresentDuringRemove.add(sessionStore.read() != null)
            removeFailure?.let { throw it }
            removedTokens.add(token)
        }

        override suspend fun currentUser(): com.nexus.rinde.mobile.data.remote.CurrentUserProfile =
            error("unused")

        override suspend fun currentDriver(): com.nexus.rinde.mobile.data.remote.DriverProfile =
            error("unused")

        override suspend fun recordTripLocations(
            tripId: String,
            request: com.nexus.rinde.mobile.data.remote.RecordTripLocationsRequest,
        ): com.nexus.rinde.mobile.data.remote.RecordTripLocationsResponse = error("unused")
    }

    private fun buildJwt(userId: String, role: String = "DRIVER", exp: Long = 9_999_999_999L): String {
        val header = Base64.getUrlEncoder().withoutPadding()
            .encodeToString("""{"alg":"HS256"}""".toByteArray(Charsets.UTF_8))
        val payloadJson = JSONObject()
            .put("sub", userId)
            .put("role", role)
            .put("exp", exp)
            .toString()
        val payload = Base64.getUrlEncoder().withoutPadding()
            .encodeToString(payloadJson.toByteArray(Charsets.UTF_8))
        return "$header.$payload.sig"
    }

    @Test
    fun `registro idempotente tras login no repite POST al restaurar sesion`() = runTest {
        val jwt = buildJwt("driver-1")
        val sessionStore = InMemorySessionStore()
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { "fcm-token-01" },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )
        val sessionRepo = SessionRepository(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { _, _ -> remote },
            syncScheduler = scheduler,
            pushDeviceRepository = pushRepo,
            clockSeconds = { 1_000_000L },
        )

        val session = sessionRepo.signIn("http://10.0.2.2:8000", "driver@rinde.test", "secret")
        assertEquals(1, remote.registeredRequests.size)
        assertEquals("fcm-token-01", pushStore.read().syncedToken)
        assertFalse(pushStore.read().pendingRegistration)

        val restored = sessionRepo.restoreSession() as SessionRestoreResult.Active
        val secondOutcome = pushRepo.syncRegistrationIfNeeded(restored.session)
        assertEquals(PushSyncOutcome.ALREADY_SYNCED, secondOutcome)
        assertEquals(1, remote.registeredRequests.size)
        assertEquals(session, restored.session)
    }

    @Test
    fun `fallo de red al iniciar sesion deja registro pendiente y reintento posterior registra el token`() = runTest {
        val jwt = buildJwt("driver-1")
        val sessionStore = InMemorySessionStore()
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt).apply {
            registerFailure = IOException("Sin conexión")
        }
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { "fcm-token-01" },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )
        val sessionRepo = SessionRepository(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { _, _ -> remote },
            syncScheduler = scheduler,
            pushDeviceRepository = pushRepo,
            clockSeconds = { 1_000_000L },
        )

        val session = sessionRepo.signIn("http://10.0.2.2:8000", "driver@rinde.test", "secret")
        assertEquals("driver-1", session.userId)
        assertTrue(pushStore.read().pendingRegistration)
        assertNull(pushStore.read().syncedToken)
        assertTrue(pushRepo.hasPendingSync())
        assertTrue(scheduler.scheduledCount >= 1)

        // Al recuperar red, OfflineSyncEngine completa el registro pendiente
        remote.registerFailure = null
        val syncEngine = OfflineSyncEngine(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { remote },
            deletePhoto = {},
            pushDeviceRepository = pushRepo,
            clock = { 1_000_000_000L },
        )
        val syncResult = syncEngine.syncNow(manual = false)
        assertTrue(syncResult is SyncResult.Completed)
        assertEquals(1, remote.registeredRequests.size)
        assertFalse(pushStore.read().pendingRegistration)
        assertEquals("fcm-token-01", pushStore.read().syncedToken)
        assertFalse(pushRepo.hasPendingSync())
    }

    @Test
    fun `rotacion de token onNewToken da de baja el anterior y registra el nuevo`() = runTest {
        val jwt = buildJwt("driver-1")
        val session = SessionData("http://10.0.2.2:8000", "driver@rinde.test", "driver-1", "DRIVER", jwt, 9_999_999_999L)
        val sessionStore = InMemorySessionStore(session)
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { "fcm-token-v1" },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )

        assertEquals(PushSyncOutcome.REGISTERED, pushRepo.syncRegistrationIfNeeded(session))
        val rotatedOutcome = pushRepo.onNewToken("fcm-token-v2")

        assertEquals(PushSyncOutcome.REGISTERED, rotatedOutcome)
        assertEquals(listOf("fcm-token-v1"), remote.removedTokens)
        assertEquals(listOf("fcm-token-v1", "fcm-token-v2"), remote.registeredRequests.map { it.token })
        assertEquals("fcm-token-v2", pushStore.read().currentToken)
        assertEquals("fcm-token-v2", pushStore.read().syncedToken)
    }

    @Test
    fun `rotacion de token offline conserva baja pendiente y la completa al reconectar`() = runTest {
        val jwt = buildJwt("driver-1")
        val session = SessionData("http://10.0.2.2:8000", "driver@rinde.test", "driver-1", "DRIVER", jwt, 9_999_999_999L)
        val sessionStore = InMemorySessionStore(session)
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        var currentProviderToken = "fcm-token-v1"
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { currentProviderToken },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )

        pushRepo.syncRegistrationIfNeeded(session)
        remote.removeFailure = IOException("Sin red")
        remote.registerFailure = IOException("Sin red")
        currentProviderToken = "fcm-token-v2"

        val offlineOutcome = pushRepo.onNewToken("fcm-token-v2")
        assertEquals(PushSyncOutcome.FAILED_PENDING, offlineOutcome)
        assertEquals("fcm-token-v1", pushStore.read().staleTokenToUnregister)
        assertTrue(pushRepo.hasPendingSync())

        remote.removeFailure = null
        remote.registerFailure = null
        val onlineOutcome = pushRepo.syncRegistrationIfNeeded(session)
        assertEquals(PushSyncOutcome.REGISTERED, onlineOutcome)
        assertEquals(listOf("fcm-token-v1"), remote.removedTokens)
        assertNull(pushStore.read().staleTokenToUnregister)
        assertEquals("fcm-token-v2", pushStore.read().syncedToken)
    }

    @Test
    fun `cierre de sesion da de baja el dispositivo antes de borrar el JWT y limpia estado local`() = runTest {
        val jwt = buildJwt("driver-1")
        val session = SessionData("http://10.0.2.2:8000", "driver@rinde.test", "driver-1", "DRIVER", jwt, 9_999_999_999L)
        val sessionStore = InMemorySessionStore(session)
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { "fcm-token-01" },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )
        val sessionRepo = SessionRepository(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { _, _ -> remote },
            syncScheduler = scheduler,
            pushDeviceRepository = pushRepo,
            clockSeconds = { 1_000_000L },
        )

        pushRepo.syncRegistrationIfNeeded(session)
        sessionRepo.signOutKeepingQueue()

        assertEquals(listOf("fcm-token-01"), remote.removedTokens)
        assertEquals(listOf(true), remote.jwtPresentDuringRemove)
        assertNull(sessionStore.read())
        assertNull(pushStore.read().syncedToken)
        assertNull(pushStore.read().syncedUserId)
        assertFalse(pushStore.read().pendingRegistration)
    }

    @Test
    fun `fallo de red al cerrar sesion no bloquea el logout y limpia estado local`() = runTest {
        val jwt = buildJwt("driver-1")
        val session = SessionData("http://10.0.2.2:8000", "driver@rinde.test", "driver-1", "DRIVER", jwt, 9_999_999_999L)
        val sessionStore = InMemorySessionStore(session)
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { "fcm-token-01" },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )
        val sessionRepo = SessionRepository(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { _, _ -> remote },
            syncScheduler = scheduler,
            pushDeviceRepository = pushRepo,
            clockSeconds = { 1_000_000L },
        )

        pushRepo.syncRegistrationIfNeeded(session)
        remote.removeFailure = ApiException(503, "Servicio no disponible")

        sessionRepo.signOutKeepingQueue()

        assertNull(sessionStore.read())
        assertNull(pushStore.read().syncedToken)
        assertNull(pushStore.read().syncedUserId)
        assertFalse(pushStore.read().pendingRegistration)
    }

    @Test
    fun `sin google-services ni token no realiza registro HTTP y no bloquea sesion`() = runTest {
        val jwt = buildJwt("driver-1")
        val sessionStore = InMemorySessionStore()
        val pushStore = InMemoryPushDeviceStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakePushRemoteClient(sessionStore, jwt)
        val pushRepo = PushDeviceRepository(
            pushDeviceStore = pushStore,
            sessionStore = sessionStore,
            tokenProvider = { null },
            remoteFactory = { remote },
            syncScheduler = scheduler,
            clockSeconds = { 1_000_000L },
        )
        val sessionRepo = SessionRepository(
            sessionStore = sessionStore,
            queueStore = EmptyQueueStore(),
            remoteFactory = { _, _ -> remote },
            syncScheduler = scheduler,
            pushDeviceRepository = pushRepo,
            clockSeconds = { 1_000_000L },
        )

        val session = sessionRepo.signIn("http://10.0.2.2:8000", "driver@rinde.test", "secret")
        assertEquals("driver-1", session.userId)
        assertEquals(0, remote.registeredRequests.size)
        assertEquals(PushSyncOutcome.NO_TOKEN, pushRepo.syncRegistrationIfNeeded(session))
    }
}
