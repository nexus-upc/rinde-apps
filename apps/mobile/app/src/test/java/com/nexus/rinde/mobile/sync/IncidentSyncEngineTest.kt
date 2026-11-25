package com.nexus.rinde.mobile.sync

import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
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
import com.nexus.rinde.mobile.data.remote.ReportIncidentRequest
import com.nexus.rinde.mobile.data.remote.RindeRemoteClient
import com.nexus.rinde.mobile.data.remote.Settlement
import com.nexus.rinde.mobile.data.remote.SyncExpenseRequest
import com.nexus.rinde.mobile.data.remote.SyncExpensesResponse
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
import java.util.UUID

class IncidentSyncEngineTest {

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

    private class FakeIncidentRemoteClient : RindeRemoteClient {
        val reportedByKey = linkedMapOf<String, Incident>()
        val capturedRequests = mutableListOf<ReportIncidentRequest>()
        var reportCalls = 0
        var uploadCalls = 0
        var reportFailureByKey = mutableMapOf<String, Throwable>()
        var dropReportResponseAfterPersist = false
        var evidenceFailure: Throwable? = null

        override suspend fun signIn(email: String, password: String): String = ""
        override suspend fun trips(): List<Trip> = emptyList()
        override suspend fun trip(id: String): Trip = error("unused")
        override suspend fun vehicle(id: String): VehicleSummary = error("unused")
        override suspend fun tripAdvances(tripId: String): List<TripAdvance> = emptyList()
        override suspend fun tripSettlement(tripId: String): Settlement? = null
        override suspend fun changeTripStatus(id: String, action: String): Trip = error("unused")
        override suspend fun expenses(tripId: String): List<Expense> = emptyList()
        override suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse =
            error("unused")

        override suspend fun uploadExpenseEvidence(
            expenseId: String,
            file: File,
            fileName: String,
            contentType: String,
        ): Expense = error("unused")

        override suspend fun reportIncident(
            tripId: String,
            request: ReportIncidentRequest,
        ): Incident {
            reportCalls++
            capturedRequests.add(request)
            reportFailureByKey[request.idempotencyKey]?.let { throw it }

            val stored = reportedByKey.getOrPut(request.idempotencyKey) {
                Incident(
                    id = "inc-${UUID.nameUUIDFromBytes(request.idempotencyKey.toByteArray())}",
                    tripId = tripId,
                    vehicleId = "veh-1",
                    reportedBy = "user-1",
                    type = request.type,
                    description = request.description,
                    evidenceUrl = request.evidenceUrl,
                    status = "OPEN",
                    reportedAt = "2026-11-26T10:00:00Z",
                    updatedAt = "2026-11-26T10:00:00Z",
                )
            }
            if (dropReportResponseAfterPersist) {
                dropReportResponseAfterPersist = false
                throw IOException("Conexión interrumpida tras guardar la incidencia")
            }
            return stored
        }

        override suspend fun uploadIncidentEvidence(
            incidentId: String,
            file: File,
            fileName: String,
            contentType: String,
        ): Incident {
            uploadCalls++
            evidenceFailure?.let { throw it }
            val key = reportedByKey.entries.first { it.value.id == incidentId }.key
            val current = reportedByKey.getValue(key)
            val updated = current.copy(
                evidence = EvidenceMetadata(
                    id = "ev-$incidentId",
                    fileName = fileName,
                    contentType = contentType,
                    fileSizeBytes = file.length(),
                    contentUrl = "/api/v1/incidents/$incidentId/evidences/ev-$incidentId/content",
                    uploadedAt = "2026-11-26T10:01:00Z",
                ),
            )
            reportedByKey[key] = updated
            return updated
        }

        override suspend fun downloadEvidenceBytes(contentUrl: String): ByteArray = ByteArray(0)
    }

    private var currentEpochMs = 2_000_000_000_000L

    private fun validSession() = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "driver@rinde.test",
        userId = "user-1",
        role = "DRIVER",
        token = "valid.jwt.token",
        expiresAtEpochSeconds = (currentEpochMs / 1000L) + 3600L,
    )

    private fun incidentItem(
        key: String = "INC-${UUID.randomUUID()}",
        type: String = "BREAKDOWN",
        description: String = "Falla en el freno neumático",
        photoFile: File? = null,
    ) = QueueItemEntity(
        idempotencyKey = key,
        ownerUserId = "user-1",
        itemType = QueueItemType.INCIDENT.name,
        tripId = "trip-1",
        tripCode = "TRP-000014",
        payloadJson = IncidentQueuePayload(type, description).toJson(),
        photoPath = photoFile?.absolutePath,
        photoFileName = photoFile?.name,
        photoSizeBytes = photoFile?.length() ?: 0L,
        status = QueueItemStatus.PENDING.name,
        createdAtEpochMs = currentEpochMs,
        updatedAtEpochMs = currentEpochMs,
    )

    @Test
    fun `envia incidencia sin foto y la marca SYNCED con evidenceUrl null`() = runTest {
        val queue = InMemoryQueueStore().apply { upsert(incidentItem(key = "INC-001")) }
        val remote = FakeIncidentRemoteClient()
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val result = engine.syncNow(manual = true)
        assertEquals(SyncResult.Completed(1, 0, 0, 0), result)

        val stored = queue.findByKey("INC-001")!!
        assertEquals(QueueItemStatus.SYNCED, stored.queueStatus)
        assertTrue(!stored.remoteId.isNullOrBlank())
        assertEquals(1, remote.capturedRequests.size)
        assertNull(remote.capturedRequests.first().evidenceUrl)
        assertEquals("INC-001", remote.capturedRequests.first().idempotencyKey)
    }

    @Test
    fun `perdida de respuesta tras crear incidencia reintenta por idempotencia sin duplicar`() = runTest {
        val queue = InMemoryQueueStore().apply { upsert(incidentItem(key = "INC-IDEM-1")) }
        val remote = FakeIncidentRemoteClient().apply { dropReportResponseAfterPersist = true }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val first = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, first.retryPendingCount)
        assertEquals(QueueItemStatus.PENDING, queue.findByKey("INC-IDEM-1")!!.queueStatus)
        assertEquals(1, remote.reportedByKey.size)

        val skippedBackoff = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(0, skippedBackoff.syncedCount)
        assertEquals(1, remote.reportCalls)

        currentEpochMs += 20_000L
        val second = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, second.syncedCount)
        assertEquals(QueueItemStatus.SYNCED, queue.findByKey("INC-IDEM-1")!!.queueStatus)
        assertEquals(1, remote.reportedByKey.size)
        assertEquals(2, remote.reportCalls)
    }

    @Test
    fun `error 503 mantiene incidencia en PENDING con backoff`() = runTest {
        val queue = InMemoryQueueStore().apply { upsert(incidentItem(key = "INC-503")) }
        val remote = FakeIncidentRemoteClient().apply {
            reportFailureByKey["INC-503"] = ApiException(503, "No se pudo consultar el viaje en Trip.")
        }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val first = engine.syncNow(manual = false) as SyncResult.Completed
        assertEquals(1, first.retryPendingCount)
        val afterFirst = queue.findByKey("INC-503")!!
        assertEquals(QueueItemStatus.PENDING, afterFirst.queueStatus)
        assertEquals(1, afterFirst.retryCount)
        assertTrue(afterFirst.nextRetryAtEpochMs > currentEpochMs)
    }

    @Test
    fun `rechazos 403 y 409 marcan REJECTED con detalle en espanol`() = runTest {
        val queue = InMemoryQueueStore().apply {
            upsert(incidentItem(key = "INC-403"))
            upsert(incidentItem(key = "INC-409"))
        }
        val remote = FakeIncidentRemoteClient().apply {
            reportFailureByKey["INC-403"] =
                ApiException(403, "Solo el conductor asignado al viaje puede reportar incidencias.")
            reportFailureByKey["INC-409"] =
                ApiException(409, "Solo se puede reportar una incidencia cuando el viaje está en ruta.")
        }
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = {},
            clock = { currentEpochMs },
        )

        val result = engine.syncNow(manual = true) as SyncResult.Completed
        assertEquals(2, result.rejectedCount)

        val item403 = queue.findByKey("INC-403")!!
        assertEquals(QueueItemStatus.REJECTED, item403.queueStatus)
        assertEquals("INCIDENT_HTTP_403", item403.rejectionCode)
        assertEquals("Solo el conductor asignado al viaje puede reportar incidencias.", item403.errorMessage)

        val item409 = queue.findByKey("INC-409")!!
        assertEquals(QueueItemStatus.REJECTED, item409.queueStatus)
        assertEquals("INCIDENT_HTTP_409", item409.rejectionCode)
        assertEquals("Solo se puede reportar una incidencia cuando el viaje está en ruta.", item409.errorMessage)
    }

    @Test
    fun `incidencia con foto sube evidencia 201 y borra archivo local`() = runTest {
        val photo = tempFolder.newFile("freno.jpg").apply { writeBytes(byteArrayOf(1, 2, 3, 4)) }
        val queue = InMemoryQueueStore().apply {
            upsert(incidentItem(key = "INC-FOTO-OK", photoFile = photo))
        }
        val remote = FakeIncidentRemoteClient()
        val deleted = mutableListOf<String?>()
        val engine = OfflineSyncEngine(
            sessionStore = InMemorySessionStore(validSession()),
            queueStore = queue,
            remoteFactory = { remote },
            deletePhoto = { path ->
                deleted.add(path)
                path?.let { File(it).delete() }
            },
            clock = { currentEpochMs },
        )

        val result = engine.syncNow(manual = true) as SyncResult.Completed
        assertEquals(SyncResult.Completed(1, 1, 0, 0), result)

        val stored = queue.findByKey("INC-FOTO-OK")!!
        assertEquals(QueueItemStatus.SYNCED, stored.queueStatus)
        assertNull(stored.photoPath)
        assertFalse(photo.exists())
        assertEquals(listOf(photo.absolutePath), deleted)
        assertEquals(1, remote.reportCalls)
        assertEquals(1, remote.uploadCalls)
    }

    @Test
    fun `foto con 501 deja item en PHOTO_PENDING conservando remoteId y foto local para reintentar sin duplicar`() =
        runTest {
            val photo = tempFolder.newFile("choque.jpg").apply { writeBytes(byteArrayOf(9, 8, 7)) }
            val queue = InMemoryQueueStore().apply {
                upsert(incidentItem(key = "INC-FOTO-501", photoFile = photo))
            }
            val remote = FakeIncidentRemoteClient().apply {
                evidenceFailure = ApiException(501, "Funcionalidad pendiente de implementar en S4-14.")
            }
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
            assertEquals(0, first.rejectedCount)

            val pendingPhoto = queue.findByKey("INC-FOTO-501")!!
            assertEquals(QueueItemStatus.PHOTO_PENDING, pendingPhoto.queueStatus)
            assertFalse(pendingPhoto.remoteId.isNullOrBlank())
            assertEquals(photo.absolutePath, pendingPhoto.photoPath)
            assertTrue(photo.exists())
            assertEquals(1, remote.reportCalls)
            assertEquals(1, remote.uploadCalls)

            // Cuando el backend habilita la subida de foto, solo reintenta el paso b sin duplicar el reporte
            remote.evidenceFailure = null
            val second = engine.syncNow(manual = true) as SyncResult.Completed
            assertEquals(1, second.syncedCount)
            assertEquals(QueueItemStatus.SYNCED, queue.findByKey("INC-FOTO-501")!!.queueStatus)
            assertFalse(photo.exists())
            assertEquals(1, remote.reportCalls)
            assertEquals(2, remote.uploadCalls)
        }
}
