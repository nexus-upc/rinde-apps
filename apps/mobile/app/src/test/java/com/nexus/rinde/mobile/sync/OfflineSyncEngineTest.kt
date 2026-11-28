package com.nexus.rinde.mobile.sync

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.local.SessionStore
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.EvidenceMetadata
import com.nexus.rinde.mobile.data.remote.Expense
import com.nexus.rinde.mobile.data.remote.Incident
import com.nexus.rinde.mobile.data.remote.RegisterDeviceRequest
import com.nexus.rinde.mobile.data.remote.ReportIncidentRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import com.nexus.rinde.mobile.data.remote.SyncExpensesResponse
import com.nexus.rinde.mobile.data.remote.SyncRejectedItem
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.remote.TripAdvance
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.io.IOException
import java.math.BigDecimal
import java.util.UUID

class OfflineSyncEngineTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

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
        private val items = linkedMapOf<String, QueueItemEntity>()
        private val stream = MutableStateFlow<List<QueueItemEntity>>(emptyList())

        override fun observePendingAndRejected(userId: String): Flow<List<QueueItemEntity>> =
            stream.map { list ->
                list.filter { it.ownerUserId == userId && it.status != QueueItemStatus.SYNCED.name }
            }

        override fun observeByTrip(userId: String, tripId: String): Flow<List<QueueItemEntity>> =
            stream.map { list -> list.filter { it.ownerUserId == userId && it.tripId == tripId } }

        override suspend fun countPending(userId: String): Int =
            items.values.count {
                it.ownerUserId == userId &&
                    it.status in setOf(
                        QueueItemStatus.PENDING.name,
                        QueueItemStatus.PHOTO_PENDING.name,
                        QueueItemStatus.REJECTED.name,
                    )
            }

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

        override suspend fun purgeOldSynced(userId: String, cutoffEpochMs: Long) = Unit
    }

    private class FakeRemoteClient : RindeRemoteClient {
        val syncedExpensesByKey = linkedMapOf<String, Expense>()
        val rejectKeys = mutableMapOf<String, Pair<String, String>>()
        var syncCalls = 0
        var uploadCalls = 0
        var dropSyncResponseAfterPersist = false
        var failSyncWith401 = false
        var failEvidenceWithIo = false
        var failEvidenceWith401 = false

        override suspend fun signIn(email: String, password: String): String = ""
        override suspend fun trips(): List<Trip> = emptyList()
        override suspend fun trip(id: String): Trip = error("unused")
        override suspend fun vehicle(id: String): VehicleSummary = error("unused")
        override suspend fun tripAdvances(tripId: String): List<TripAdvance> = emptyList()
        override suspend fun tripSettlement(tripId: String): Settlement? = null
        override suspend fun changeTripStatus(id: String, action: String): Trip = error("unused")
        override suspend fun expenses(tripId: String): List<Expense> =
            syncedExpensesByKey.values.filter { it.tripId == tripId }

        override suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse {
            syncCalls++
            if (failSyncWith401) throw ApiException(401, "Tu sesión venció.")

            val accepted = mutableListOf<Expense>()
            val rejected = mutableListOf<SyncRejectedItem>()
            for (req in items) {
                val rejection = rejectKeys[req.idempotencyKey]
                if (rejection != null) {
                    rejected.add(
                        SyncRejectedItem(
                            idempotencyKey = req.idempotencyKey,
                            code = rejection.first,
                            reason = rejection.second,
                        ),
                    )
                } else {
                    val stored = syncedExpensesByKey.getOrPut(req.idempotencyKey) {
                        Expense(
                            id = "remote-${UUID.nameUUIDFromBytes(req.idempotencyKey.toByteArray())}",
                            tripId = req.tripId,
                            category = req.category,
                            amount = req.amount.toPlainString(),
                            currency = req.currency,
                            date = req.expenseDate,
                            status = "PENDING_SUPPORT",
                            reason = "",
                            key = req.idempotencyKey,
                        )
                    }
                    accepted.add(stored)
                }
            }
            if (dropSyncResponseAfterPersist) {
                dropSyncResponseAfterPersist = false
                throw IOException("Conexión interrumpida al recibir respuesta")
            }
            return SyncExpensesResponse(
                totalReceived = items.size,
                synchronizedCount = accepted.size,
                items = accepted,
                rejectedCount = rejected.size,
                rejected = rejected,
            )
        }

        override suspend fun uploadExpenseEvidence(
            expenseId: String,
            file: File,
            fileName: String,
            contentType: String,
        ): Expense {
            uploadCalls++
            if (failEvidenceWith401) throw ApiException(401, "Tu sesión venció.")
            if (failEvidenceWithIo) throw IOException("Error temporal al subir comprobante")
            val match = syncedExpensesByKey.values.first { it.id == expenseId }
            val updated = match.copy(
                status = "REGISTERED",
                evidence = EvidenceMetadata(
                    id = "ev-$expenseId",
                    fileName = fileName,
                    contentType = contentType,
                    fileSizeBytes = file.length(),
                    contentUrl = "/api/v1/expenses/$expenseId/evidences/ev-$expenseId/content",
                    uploadedAt = "2026-11-25T10:00:00Z",
                ),
            )
            syncedExpensesByKey[match.key] = updated
            return updated
        }

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
        override suspend fun currentUser(): com.nexus.rinde.mobile.data.remote.CurrentUserProfile =
            error("unused")

        override suspend fun currentDriver(): com.nexus.rinde.mobile.data.remote.DriverProfile =
            error("unused")
    }

    private var currentEpochMs = 1_000_000_000_000L

    private fun validSession() = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "driver@rinde.test",
        userId = "user-1",
        role = "DRIVER",
        token = "valid.jwt.token",
        expiresAtEpochSeconds = (currentEpochMs / 1000L) + 3600L,
    )

    private fun expenseItem(
        key: String,
        photoFile: File? = null,
        status: QueueItemStatus = QueueItemStatus.PENDING,
        remoteId: String? = null,
    ) = QueueItemEntity(
        idempotencyKey = key,
        ownerUserId = "user-1",
        itemType = QueueItemType.EXPENSE.name,
        tripId = "trip-1",
        tripCode = "TRP-000014",
        payloadJson = ExpenseQueuePayload("FUEL", BigDecimal("180.50"), "PEN", "2026-11-25").toJson(),
        photoPath = photoFile?.absolutePath,
        photoFileName = photoFile?.name,
        photoSizeBytes = photoFile?.length() ?: 0L,
        remoteId = remoteId,
        status = status.name,
        createdAtEpochMs = currentEpochMs,
        updatedAtEpochMs = currentEpochMs,
    )

    @Test
    fun `envia gasto con foto, la sube por evidencias y borra la foto local`() = runTest {
        val photo = tempFolder.newFile("recibo.jpg").apply { writeBytes(byteArrayOf(1, 2, 3)) }
        val queue = InMemoryQueueStore().apply { upsert(expenseItem("k-con-foto", photo)) }
        val remote = FakeRemoteClient()
        val deletedPaths = mutableListOf<String?>()
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = { path ->
                deletedPaths.add(path)
                path?.let { File(it).delete() }
            },
            clock = { currentEpochMs },
        )

        val result = engine.syncNow(manual = true)
        assertEquals(SyncResult.Completed(syncedCount = 1, photoPendingCount = 1, rejectedCount = 0, retryPendingCount = 0), result)

        val stored = queue.findByKey("k-con-foto")!!
        assertEquals(QueueItemStatus.SYNCED, stored.queueStatus)
        assertNull(stored.photoPath)
        assertFalse(photo.exists())
        assertEquals(listOf(photo.absolutePath), deletedPaths)
        assertEquals(1, remote.syncCalls)
        assertEquals(1, remote.uploadCalls)
    }

    @Test
    fun `marca rechazo con motivo en espanol sin frenar otros gastos validos del lote`() = runTest {
        val queue = InMemoryQueueStore().apply {
            upsert(expenseItem("k-valido"))
            upsert(expenseItem("k-ajeno"))
        }
        val remote = FakeRemoteClient().apply {
            rejectKeys["k-ajeno"] = "TRIP_NOT_ASSIGNED" to "Solo el conductor asignado al viaje puede registrar gastos."
        }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val result = engine.syncNow(manual = true)
        assertEquals(SyncResult.Completed(syncedCount = 1, photoPendingCount = 0, rejectedCount = 1, retryPendingCount = 0), result)

        assertEquals(QueueItemStatus.SYNCED, queue.findByKey("k-valido")!!.queueStatus)
        val rejected = queue.findByKey("k-ajeno")!!
        assertEquals(QueueItemStatus.REJECTED, rejected.queueStatus)
        assertEquals("TRIP_NOT_ASSIGNED", rejected.rejectionCode)
        assertEquals("Solo el conductor asignado al viaje puede registrar gastos.", rejected.errorMessage)
    }

    @Test
    fun `perdida de respuesta tras guardar en servidor reintenta sin duplicar`() = runTest {
        val queue = InMemoryQueueStore().apply { upsert(expenseItem("k-idempotente")) }
        val remote = FakeRemoteClient().apply { dropSyncResponseAfterPersist = true }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val first = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, first.retryPendingCount)
        assertEquals(QueueItemStatus.PENDING, queue.findByKey("k-idempotente")!!.queueStatus)
        assertEquals(1, remote.syncedExpensesByKey.size)

        // Verifica que antes de cumplir backoff el reintento automatico espera, y luego reintenta
        val skippedBackoff = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(0, skippedBackoff.syncedCount)
        currentEpochMs += 20_000L

        val second = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, second.syncedCount)
        assertEquals(QueueItemStatus.SYNCED, queue.findByKey("k-idempotente")!!.queueStatus)
        assertEquals(1, remote.syncedExpensesByKey.size)
        assertEquals(2, remote.syncCalls)
    }

    @Test
    fun `si la foto falla tras sincronizar el gasto queda PHOTO_PENDING y no recrea el gasto`() = runTest {
        val photo = tempFolder.newFile("peaje.jpg").apply { writeBytes(byteArrayOf(4, 5, 6)) }
        val queue = InMemoryQueueStore().apply { upsert(expenseItem("k-foto-luego", photo)) }
        val remote = FakeRemoteClient().apply { failEvidenceWithIo = true }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = { path -> path?.let { File(it).delete() } },
            clock = { currentEpochMs },
        )

        val first = engine.syncNow(manual = true) as SyncResult.Completed
        assertEquals(1, first.photoPendingCount)
        assertEquals(1, first.retryPendingCount)
        val afterFirst = queue.findByKey("k-foto-luego")!!
        assertEquals(QueueItemStatus.PHOTO_PENDING, afterFirst.queueStatus)
        assertTrue(photo.exists())
        assertEquals(1, remote.syncCalls)
        assertEquals(1, remote.uploadCalls)

        remote.failEvidenceWithIo = false
        val second = engine.syncNow(manual = true) as SyncResult.Completed
        assertEquals(1, second.syncedCount)
        assertEquals(QueueItemStatus.SYNCED, queue.findByKey("k-foto-luego")!!.queueStatus)
        assertFalse(photo.exists())
        // No vuelve a llamar syncExpenses: solo sube la foto pendiente
        assertEquals(1, remote.syncCalls)
        assertEquals(2, remote.uploadCalls)
    }

    @Test
    fun `token vencido o rechazo 401 conserva la cola intacta para reintentar al volver a ingresar`() = runTest {
        val photo = tempFolder.newFile("ticket.jpg").apply { writeBytes(byteArrayOf(7, 8, 9)) }
        val queue = InMemoryQueueStore().apply { upsert(expenseItem("k-espera-token", photo)) }
        val remote = FakeRemoteClient()
        val expiredSession = validSession().copy(expiresAtEpochSeconds = (currentEpochMs / 1000L) - 10L)
        val sessionStore = InMemorySessionStore(expiredSession)
        val engine = OfflineSyncEngine(
            sessionStore = sessionStore,
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        assertEquals(SyncResult.SessionExpired, engine.syncNow(manual = true))
        assertEquals(0, remote.syncCalls)
        assertEquals(QueueItemStatus.PENDING, queue.findByKey("k-espera-token")!!.queueStatus)
        assertTrue(photo.exists())

        // También prueba 401 remoto en tiempo real conservando intacta la cola
        sessionStore.save(validSession())
        remote.failSyncWith401 = true
        assertEquals(SyncResult.SessionExpired, engine.syncNow(manual = true))
        assertEquals(QueueItemStatus.PENDING, queue.findByKey("k-espera-token")!!.queueStatus)
    }
}
