package com.nexus.rinde.mobile.ui.incident

import android.net.Uri
import com.nexus.rinde.mobile.data.local.CapturedPhoto
import com.nexus.rinde.mobile.data.local.IncidentQueuePayload
import com.nexus.rinde.mobile.data.local.InputRules
import com.nexus.rinde.mobile.data.local.PhotoAttachmentStore
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.QueueStore
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.Trip
import com.nexus.rinde.mobile.data.repository.IncidentRepository
import com.nexus.rinde.mobile.sync.SyncScheduler
import com.nexus.rinde.mobile.ui.common.INCIDENT_TYPES
import com.nexus.rinde.mobile.ui.common.incidentStatusLabel
import com.nexus.rinde.mobile.ui.common.incidentTypeLabel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.io.File

@OptIn(ExperimentalCoroutinesApi::class)
class IncidentFormAndValidationTest {

    private val testDispatcher = StandardTestDispatcher()

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
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

        override suspend fun countPending(userId: String): Int = items.size

        override suspend fun findByTypeAndStatus(
            userId: String,
            type: QueueItemType,
            status: QueueItemStatus,
        ): List<QueueItemEntity> = items.values.filter {
            it.ownerUserId == userId && it.itemType == type.name && it.status == status.name
        }

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

    private class FakeSyncScheduler : SyncScheduler {
        var scheduleCalls = 0
        override fun scheduleWhenOnline() {
            scheduleCalls++
        }
    }

    private class FakePhotoStore : PhotoAttachmentStore {
        override suspend fun compressFromUri(uri: Uri, suggestedName: String?): CapturedPhoto =
            error("unused")

        override fun deletePhoto(path: String?) = Unit
        override fun deleteCacheFile(file: File?) = Unit
    }

    private val session = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "driver@rinde.test",
        userId = "user-1",
        role = "DRIVER",
        token = "jwt",
        expiresAtEpochSeconds = 9_999_999_999L,
    )

    private fun inRouteTrip() = Trip(
        id = "trip-1",
        code = "TRP-000014",
        origin = "Lima",
        destination = "Trujillo",
        departureDate = "2026-11-26",
        status = "IN_ROUTE",
    )

    @Test
    fun `valida tipos de incidencia exactos del backend y etiquetas en espanol`() {
        assertEquals(setOf("BREAKDOWN", "DELAY", "OTHER"), INCIDENT_TYPES.keys)
        assertEquals("BREAKDOWN", InputRules.incidentType("BREAKDOWN"))
        assertEquals("DELAY", InputRules.incidentType("DELAY"))
        assertEquals("OTHER", InputRules.incidentType("OTHER"))
        assertThrows(IllegalArgumentException::class.java) { InputRules.incidentType("ACCIDENT") }

        assertEquals("Avería", incidentTypeLabel("BREAKDOWN"))
        assertEquals("Retraso", incidentTypeLabel("DELAY"))
        assertEquals("Otro", incidentTypeLabel("OTHER"))
        assertEquals("Abierta", incidentStatusLabel("OPEN"))
        assertEquals("En atención", incidentStatusLabel("IN_PROGRESS"))
        assertEquals("Cerrada", incidentStatusLabel("CLOSED"))
    }

    @Test
    fun `valida descripcion obligatoria y maximo 500 caracteres`() {
        assertThrows(IllegalArgumentException::class.java) { InputRules.incidentDescription("") }
        assertThrows(IllegalArgumentException::class.java) { InputRules.incidentDescription("   ") }

        val max500 = "a".repeat(500)
        assertEquals(max500, InputRules.incidentDescription("  $max500  "))

        val over500 = "a".repeat(501)
        assertThrows(IllegalArgumentException::class.java) { InputRules.incidentDescription(over500) }
    }

    @Test
    fun `repositorio encola incidencia con prefijo INC y rechaza viajes que no estan en ruta`() = runTest {
        val queue = InMemoryQueueStore()
        val scheduler = FakeSyncScheduler()
        val repo = IncidentRepository(queue, scheduler, {})

        val entity = repo.enqueueNewIncident(
            userId = "user-1",
            trip = inRouteTrip(),
            type = "DELAY",
            rawDescription = "Desvío por mantenimiento vial en Panamericana Norte",
            photo = null,
        )

        assertTrue(entity.idempotencyKey.startsWith("INC-"))
        assertEquals(QueueItemType.INCIDENT, entity.queueType)
        assertEquals(QueueItemStatus.PENDING, entity.queueStatus)
        assertEquals(1, scheduler.scheduleCalls)
        val payload = IncidentQueuePayload.fromJson(entity.payloadJson)
        assertEquals("DELAY", payload.type)
        assertEquals("Desvío por mantenimiento vial en Panamericana Norte", payload.description)

        val finishedTrip = inRouteTrip().copy(status = "FINISHED")
        var rejected = false
        try {
            repo.enqueueNewIncident("user-1", finishedTrip, "BREAKDOWN", "Falla", null)
        } catch (_: IllegalArgumentException) {
            rejected = true
        }
        assertTrue(rejected)
    }

    @Test
    fun `viewmodel valida formulario y guarda en cola local sin conexion o con conexion`() = runTest {
        val queue = InMemoryQueueStore()
        val scheduler = FakeSyncScheduler()
        val repo = IncidentRepository(queue, scheduler, {})
        val vm = IncidentFormViewModel(repo, FakePhotoStore())

        vm.prepareNew(inRouteTrip())
        vm.onTypeChange("BREAKDOWN")
        vm.onDescriptionChange("   ")

        var callbackCalled = false
        vm.save(session, inRouteTrip(), isOnline = false) { _, _ -> callbackCalled = true }
        advanceUntilIdle()
        assertFalse(callbackCalled)
        assertEquals("Ingresa la descripción de la incidencia.", vm.state.value.error)

        vm.onDescriptionChange("x".repeat(501))
        assertTrue(vm.state.value.exceedsMaxLength)
        vm.save(session, inRouteTrip(), isOnline = true) { _, _ -> callbackCalled = true }
        advanceUntilIdle()
        assertFalse(callbackCalled)
        assertEquals("La descripción no puede superar los 500 caracteres.", vm.state.value.error)

        vm.onDescriptionChange("Falla en neumático posterior derecho")
        var savedMsg = ""
        var triggeredSync = true
        vm.save(session, inRouteTrip(), isOnline = false) { msg, shouldSync ->
            savedMsg = msg
            triggeredSync = shouldSync
        }
        advanceUntilIdle()

        assertFalse(triggeredSync)
        assertTrue(savedMsg.contains("cola", ignoreCase = true) || savedMsg.contains("teléfono", ignoreCase = true))
        assertEquals(1, queue.items.size)
        assertTrue(queue.items.keys.first().startsWith("INC-"))
    }
}
