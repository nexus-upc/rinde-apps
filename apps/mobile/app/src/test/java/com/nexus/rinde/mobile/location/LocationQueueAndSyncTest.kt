package com.nexus.rinde.mobile.location

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.LocationQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.CurrentUserProfile
import com.nexus.rinde.mobile.data.remote.DriverProfile
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.Incident
import com.nexus.rinde.mobile.data.remote.RecordTripLocationsRequest
import com.nexus.rinde.mobile.data.remote.RecordTripLocationsResponse
import com.nexus.rinde.mobile.data.remote.RegisterDeviceRequest
import com.nexus.rinde.mobile.data.remote.ReportIncidentRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import com.nexus.rinde.mobile.data.remote.SyncExpensesResponse
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.remote.TripAdvance
import com.nexus.rinde.mobile.data.remote.TripLocationPointRequest
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import com.nexus.rinde.mobile.data.repository.TripLocationRepository
import com.nexus.rinde.mobile.sync.OfflineSyncEngine
import com.nexus.rinde.mobile.sync.SyncResult
import com.nexus.rinde.mobile.sync.SyncScheduler
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.io.IOException
import java.math.BigDecimal
import java.time.Instant

class LocationQueueAndSyncTest {

    private class InMemorySessionStore(var current: SessionData?) : SessionStore {
        override fun save(session: SessionData) {
            current = session
        }

        override fun read(): SessionData? = current
        override fun clear() {
            current = null
        }
    }

    private class InMemoryQueueStore : QueueStore {
        val items = linkedMapOf<String, QueueItemEntity>()
        private val stream = MutableStateFlow<List<QueueItemEntity>>(emptyList())

        override fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>> =
            stream.map { list ->
                list.filter { it.ownerUserId == userId && it.status != QueueItemStatus.SYNCED.name }
            }

        override fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>> =
            stream.map { list -> list.filter { it.ownerUserId == userId && it.tripId == tripId } }

        override suspend fun countPending(userId: String): Int =
            items.values.count { it.ownerUserId == userId && it.status != QueueItemStatus.SYNCED.name }

        override suspend fun findByTypeAndStatus(
            userId: String,
            type: QueueItemType,
            status: QueueItemStatus,
        ): List<QueueItemEntity> = items.values
            .filter { it.ownerUserId == userId && it.itemType == type.name && it.status == status.name }
            .sortedBy { it.createdAtEpochMs }

        override suspend fun findByKey(key: String): QueueItemEntity? = items[key]

        override suspend fun upsert(item: QueueItemEntity) {
            items[item.idempotencyKey] = item
            stream.value = items.values.toList()
        }

        override suspend fun upsertAll(items: List<QueueItemEntity>) {
            items.forEach { this.items[it.idempotencyKey] = it }
            stream.value = this.items.values.toList()
        }

        override suspend fun deleteByKey(key: String) {
            items.remove(key)
            stream.value = items.values.toList()
        }

        override suspend fun deleteByTripAndType(userId: String, tripId: String, type: QueueItemType) {
            items.entries.removeIf {
                it.value.ownerUserId == userId && it.value.tripId == tripId && it.value.queueType == type
            }
            stream.value = items.values.toList()
        }

        override suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long) = Unit
    }

    private class RecordingSyncScheduler : SyncScheduler {
        var scheduledCount = 0
        override fun scheduleWhenOnline() {
            scheduledCount++
        }
    }

    private class FakeLocationRemoteClient : RindeRemoteClient {
        val sentBatches = mutableListOf<Pair<String, RecordTripLocationsRequest>>()
        var failure: Throwable? = null

        override suspend fun recordTripLocations(
            tripId: String,
            request: RecordTripLocationsRequest,
        ): RecordTripLocationsResponse {
            failure?.let { throw it }
            sentBatches.add(tripId to request)
            return RecordTripLocationsResponse(savedCount = request.points.size, duplicateCount = 0)
        }

        override suspend fun signIn(email: String, password: String): String = ""
        override suspend fun trips(): List<Trip> = emptyList()
        override suspend fun trip(id: String): Trip = error("unused")
        override suspend fun vehicle(id: String): VehicleSummary = error("unused")
        override suspend fun tripAdvances(tripId: String): List<TripAdvance> = emptyList()
        override suspend fun tripSettlement(tripId: String): Settlement? = null
        override suspend fun changeTripStatus(id: String, action: String): Trip = error("unused")
        override suspend fun expenses(tripId: String): List<Expense> = emptyList()
        override suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse =
            SyncExpensesResponse(0, 0, emptyList(), 0, emptyList())

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
        override suspend fun registerDevice(request: RegisterDeviceRequest) = Unit
        override suspend fun removeDevice(token: String) = Unit
        override suspend fun currentUser(): CurrentUserProfile = error("unused")
        override suspend fun currentDriver(): DriverProfile = error("unused")
    }

    private val session = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "luis.demo@transportesandes.example.invalid",
        userId = "user-1",
        role = "DRIVER",
        token = "jwt.demo",
        expiresAtEpochSeconds = 9_999_999_999L,
    )

    @Test
    fun `envia puntos en lotes de maximo 50 por viaje y limpia la cola`() = runTest {
        var nowMs = 1_764_320_000_000L
        val queue = InMemoryQueueStore()
        val scheduler = RecordingSyncScheduler()
        val remote = FakeLocationRemoteClient()
        val repo = TripLocationRepository(queue, scheduler) { nowMs }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(session),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { nowMs },
        )

        val base = Instant.parse("2026-11-28T10:00:00Z")
        repeat(52) { index ->
            repo.enqueueLocation(
                userId = session.userId,
                tripId = "trip-1",
                tripCode = "TRP-000014",
                latitude = -12.046374 + index * 0.0001,
                longitude = -77.042793,
                accuracyMeters = 10.0,
                recordedAt = base.plusSeconds(index * 180L),
            )
        }

        assertEquals(52, queue.countPending(session.userId))
        val result = engine.syncNow(manual = true) as SyncResult.Completed

        assertEquals(52, result.syncedCount)
        assertEquals(2, remote.sentBatches.size)
        assertEquals(50, remote.sentBatches[0].second.points.size)
        assertEquals(2, remote.sentBatches[1].second.points.size)
        assertEquals("2026-11-28T10:00:00Z", remote.sentBatches[0].second.points[0].recordedAt)
        assertEquals(0, queue.countPending(session.userId))
    }

    @Test
    fun `recorta la cola a los ultimos 200 puntos por viaje sin afectar otros viajes`() = runTest {
        val queue = InMemoryQueueStore()
        val repo = TripLocationRepository(queue, RecordingSyncScheduler()) { 1_764_320_000_000L }
        val base = Instant.parse("2026-11-28T08:00:00Z")

        repo.enqueueLocation(
            userId = session.userId,
            tripId = "trip-other",
            tripCode = "TRP-000015",
            latitude = -11.90,
            longitude = -77.05,
            accuracyMeters = 8.0,
            recordedAt = base,
        )

        repeat(205) { index ->
            repo.enqueueLocation(
                userId = session.userId,
                tripId = "trip-1",
                tripCode = "TRP-000014",
                latitude = -12.0 - index * 0.0001,
                longitude = -77.04,
                accuracyMeters = 12.0,
                recordedAt = base.plusSeconds(index * 60L),
            )
        }

        val trip1Points = queue.findByTypeAndStatus(
            session.userId,
            QueueItemType.LOCATION,
            QueueItemStatus.PENDING,
        ).filter { it.tripId == "trip-1" }
        val otherPoints = queue.findByTypeAndStatus(
            session.userId,
            QueueItemType.LOCATION,
            QueueItemStatus.PENDING,
        ).filter { it.tripId == "trip-other" }

        assertEquals(200, trip1Points.size)
        assertEquals(1, otherPoints.size)
        // Los 5 más antiguos (índices 0..4) fueron descartados; queda el índice 5 como primero
        val firstPayload = LocationQueuePayload.fromJson(trip1Points.first().payloadJson)
        assertEquals(base.plusSeconds(5 * 60L).toString(), firstPayload.recordedAt)
    }

    @Test
    fun `al finalizar el viaje descarta puntos pendientes sin borrar gastos ni incidencias`() = runTest {
        val queue = InMemoryQueueStore()
        val repo = TripLocationRepository(queue, RecordingSyncScheduler()) { 1_764_320_000_000L }

        queue.upsert(
            QueueItemEntity(
                idempotencyKey = "EXP-1",
                ownerUserId = session.userId,
                itemType = QueueItemType.EXPENSE.name,
                tripId = "trip-1",
                tripCode = "TRP-000014",
                payloadJson = ExpenseQueuePayload("FUEL", BigDecimal("100.00"), "PEN", "2026-11-28").toJson(),
                status = QueueItemStatus.PENDING.name,
            ),
        )
        repo.enqueueLocation(
            userId = session.userId,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            latitude = -12.04,
            longitude = -77.04,
            accuracyMeters = 9.5,
            recordedAt = Instant.parse("2026-11-28T11:00:00Z"),
        )

        repo.discardPendingForTrip(session.userId, "trip-1")

        assertTrue(
            queue.findByTypeAndStatus(session.userId, QueueItemType.LOCATION, QueueItemStatus.PENDING)
                .isEmpty(),
        )
        assertEquals(1, queue.countPending(session.userId))
        assertEquals("EXP-1", queue.findByKey("EXP-1")?.idempotencyKey)
    }

    @Test
    fun `respuesta 409 del backend detiene seguimiento y vacia puntos pendientes del viaje`() = runTest {
        var nowMs = 1_764_320_000_000L
        val queue = InMemoryQueueStore()
        val remote = FakeLocationRemoteClient().apply {
            failure = ApiException(409, "Solo se registra la ubicación de un viaje en ruta.")
        }
        val stoppedTrips = mutableListOf<String>()
        val repo = TripLocationRepository(queue, RecordingSyncScheduler()) { nowMs }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(session),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { nowMs },
            onTripLocationFinishedRemotely = { stoppedTrips.add(it) },
        )

        repo.enqueueLocation(
            userId = session.userId,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            latitude = -12.04,
            longitude = -77.04,
            accuracyMeters = null,
            recordedAt = Instant.parse("2026-11-28T11:00:00Z"),
        )

        val result = engine.syncNow(manual = true) as SyncResult.Completed

        assertEquals(listOf("trip-1"), stoppedTrips)
        assertEquals(0, result.rejectedCount)
        assertEquals(0, queue.countPending(session.userId))
    }

    @Test
    fun `sin senal conserva puntos en cola con reintento y sincroniza al reconectar`() = runTest {
        var nowMs = 1_764_320_000_000L
        val queue = InMemoryQueueStore()
        val remote = FakeLocationRemoteClient().apply {
            failure = IOException("Sin señal")
        }
        val repo = TripLocationRepository(queue, RecordingSyncScheduler()) { nowMs }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(session),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { nowMs },
        )

        repo.enqueueLocation(
            userId = session.userId,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            latitude = -12.046374,
            longitude = -77.042793,
            accuracyMeters = 14.0,
            recordedAt = Instant.parse("2026-11-28T11:05:00Z"),
        )

        val offlineResult = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, offlineResult.retryPendingCount)
        assertEquals(1, queue.countPending(session.userId))

        // Simula reconexión tras el backoff
        remote.failure = null
        nowMs += 60_000L
        val onlineResult = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, onlineResult.syncedCount)
        assertEquals(0, queue.countPending(session.userId))
    }

    @Test
    fun `serializa C11 y evalua estado del indicador de ubicacion en pantalla`() {
        val req = RecordTripLocationsRequest(
            points = listOf(
                TripLocationPointRequest(-12.046374, -77.042793, null, "2026-11-28T14:30:00Z"),
            ),
        )
        val json = req.toJson()
        val pointsArray = json.getJSONArray("points")
        assertEquals(1, pointsArray.length())
        assertTrue(pointsArray.getJSONObject(0).isNull("accuracyMeters"))

        val parsed = RecordTripLocationsResponse.from(
            JSONObject("""{"savedCount": 1, "duplicateCount": 0}"""),
        )
        assertEquals(1, parsed.savedCount)
        assertEquals(0, parsed.duplicateCount)

        val inRouteTrip = Trip(
            id = "trip-1",
            code = "TRP-000014",
            origin = "Lima",
            destination = "Trujillo",
            departureDate = "2026-11-28",
            status = "IN_ROUTE",
        )
        val finishedTrip = inRouteTrip.copy(status = "FINISHED")

        assertEquals(
            LocationShareStatus.SHARING,
            LocationPermissionFlow.statusForTrip(
                trip = inRouteTrip,
                state = LocationTrackingState(activeTripId = "trip-1", isSharing = true),
                hasLocationPermission = true,
            ),
        )
        assertEquals(
            LocationShareStatus.PERMISSION_DENIED,
            LocationPermissionFlow.statusForTrip(
                trip = inRouteTrip,
                state = LocationTrackingState(permissionDeniedForTripIds = setOf("trip-1")),
                hasLocationPermission = false,
            ),
        )
        assertEquals(
            LocationShareStatus.INACTIVE,
            LocationPermissionFlow.statusForTrip(
                trip = finishedTrip,
                state = LocationTrackingState(activeTripId = "trip-1", isSharing = true),
                hasLocationPermission = true,
            ),
        )
        assertNull(LocationQueuePayload.fromJson("""{"latitude":-12.0,"longitude":-77.0,"accuracyMeters":null,"recordedAt":"2026-11-28T14:30:00Z"}""").accuracyMeters)
    }

    @Test
    fun `resuelve hora de lectura con location time, recorte futuro y descarte de lastLocation antiguo`() {
        val now = Instant.parse("2026-11-28T14:30:00Z")
        val nowMs = now.toEpochMilli()

        // Lectura reciente (2 minutos antes): conserva location.time truncado a segundos
        val recentMs = now.minusSeconds(120).toEpochMilli() + 450L
        assertEquals(
            now.minusSeconds(120),
            LocationSampleTimeResolver.resolveRecordedAt(recentMs, nowMs, isFromLastLocation = false),
        )
        assertEquals(
            now.minusSeconds(120),
            LocationSampleTimeResolver.resolveRecordedAt(recentMs, nowMs, isFromLastLocation = true),
        )

        // Lectura futura (+3 minutos): usa la hora actual del teléfono
        val futureMs = now.plusSeconds(180).toEpochMilli()
        assertEquals(
            now,
            LocationSampleTimeResolver.resolveRecordedAt(futureMs, nowMs, isFromLastLocation = false),
        )
        assertEquals(
            now,
            LocationSampleTimeResolver.resolveRecordedAt(futureMs, nowMs, isFromLastLocation = true),
        )

        // lastLocation con 10 minutos exactos de antigüedad: se acepta
        val exactLimitMs = nowMs - LocationSampleTimeResolver.MAX_LAST_LOCATION_AGE_MS
        assertEquals(
            now.minusSeconds(600),
            LocationSampleTimeResolver.resolveRecordedAt(exactLimitMs, nowMs, isFromLastLocation = true),
        )

        // lastLocation con más de 10 minutos de antigüedad: se descarta
        assertNull(
            LocationSampleTimeResolver.resolveRecordedAt(exactLimitMs - 1L, nowMs, isFromLastLocation = true),
        )
        assertNull(
            LocationSampleTimeResolver.resolveRecordedAt(
                now.minusSeconds(900).toEpochMilli(),
                nowMs,
                isFromLastLocation = true,
            ),
        )

        // Lectura normal (no lastLocation) de más de 10 minutos: conserva su propia hora
        assertEquals(
            now.minusSeconds(900),
            LocationSampleTimeResolver.resolveRecordedAt(
                now.minusSeconds(900).toEpochMilli(),
                nowMs,
                isFromLastLocation = false,
            ),
        )

        // Sin marca de tiempo: lastLocation se descarta y lectura normal usa la hora actual
        assertNull(
            LocationSampleTimeResolver.resolveRecordedAt(0L, nowMs, isFromLastLocation = true),
        )
        assertEquals(
            now,
            LocationSampleTimeResolver.resolveRecordedAt(0L, nowMs, isFromLastLocation = false),
        )
    }
}
