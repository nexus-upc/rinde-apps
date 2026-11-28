package com.nexus.rinde.mobile.ui.profile

import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.local.SessionData
import com.nexus.rinde.mobile.data.remote.ApiException
import com.nexus.rinde.mobile.data.remote.CurrentUserProfile
import com.nexus.rinde.mobile.data.remote.CurrentUserTenant
import com.nexus.rinde.mobile.data.remote.DriverProfile
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
import com.nexus.rinde.mobile.data.repository.ProfileRepository
import com.nexus.rinde.mobile.ui.common.formatIsoDate
import com.nexus.rinde.mobile.ui.common.roleLabel
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.io.IOException

class ProfileQueueAndRepositoryTest {

    private class FakeProfileRemoteClient : RindeRemoteClient {
        var userProfile: CurrentUserProfile = CurrentUserProfile(
            id = "u-1",
            fullName = "Luis Quispe Mamani",
            email = "luis.demo@transportesandes.example.invalid",
            role = "DRIVER",
            status = "ACTIVE",
            tenant = CurrentUserTenant(
                id = "t-1",
                tradeName = "Transportes Andes SAC",
                ruc = "20123456789",
                status = "ACTIVE",
            ),
        )
        var driverProfile: DriverProfile = DriverProfile(
            id = "d-1",
            userId = "u-1",
            fullName = "Luis Quispe Mamani",
            documentType = "DNI",
            documentNumber = "40123456",
            licenseNumber = "Q40123456",
            licenseCategory = "A-IIIb",
            licenseExpirationDate = "2028-09-30",
            status = "ENABLED",
        )
        var userFailure: Throwable? = null
        var driverFailure: Throwable? = null

        override suspend fun currentUser(): CurrentUserProfile {
            userFailure?.let { throw it }
            return userProfile
        }

        override suspend fun currentDriver(): DriverProfile {
            driverFailure?.let { throw it }
            return driverProfile
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
            error("unused")

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
        override suspend fun recordTripLocations(
            tripId: String,
            request: com.nexus.rinde.mobile.data.remote.RecordTripLocationsRequest,
        ): com.nexus.rinde.mobile.data.remote.RecordTripLocationsResponse = error("unused")
    }

    private val session = SessionData(
        serverUrl = "http://127.0.0.1:8000",
        email = "luis.demo@transportesandes.example.invalid",
        userId = "u-1",
        role = "DRIVER",
        token = "jwt.demo",
        expiresAtEpochSeconds = 9_999_999_999L,
    )

    private fun queueItem(key: String, status: QueueItemStatus, type: QueueItemType = QueueItemType.EXPENSE) =
        QueueItemEntity(
            idempotencyKey = key,
            ownerUserId = "u-1",
            itemType = type.name,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            payloadJson = "{}",
            status = status.name,
        )

    @Test
    fun `cola vacia muestra Todo enviado y deshabilita Enviar ahora`() {
        val summary = ProfileQueueSummary.from(emptyList(), isSyncing = false)

        assertEquals(0, summary.pendingCount)
        assertEquals(0, summary.retryableCount)
        assertEquals(0, summary.rejectedCount)
        assertEquals("Todo enviado", summary.statusText)
        assertFalse(summary.canSendNow)
    }

    @Test
    fun `cola con registros pendientes, foto pendiente y rechazados calcula conteos y texto`() {
        val items = listOf(
            queueItem("k1", QueueItemStatus.PENDING, QueueItemType.EXPENSE),
            queueItem("k2", QueueItemStatus.PHOTO_PENDING, QueueItemType.INCIDENT),
            queueItem("k3", QueueItemStatus.REJECTED, QueueItemType.EXPENSE),
        )

        val idle = ProfileQueueSummary.from(items, isSyncing = false)
        assertEquals(3, idle.pendingCount)
        assertEquals(2, idle.retryableCount)
        assertEquals(1, idle.rejectedCount)
        assertEquals("3 por enviar", idle.statusText)
        assertTrue(idle.canSendNow)

        val syncing = ProfileQueueSummary.from(items, isSyncing = true)
        assertEquals("3 por enviar", syncing.statusText)
        assertFalse(syncing.canSendNow)
    }

    @Test
    fun `carga perfil completo combinando IAM y Fleet`() = runTest {
        val repo = ProfileRepository { FakeProfileRemoteClient() }

        val loaded = repo.loadProfile(session)

        assertEquals("Luis Quispe Mamani", loaded.fullName)
        assertEquals("Transportes Andes SAC", loaded.companyName)
        assertEquals("DRIVER", loaded.role)
        assertEquals("luis.demo@transportesandes.example.invalid", loaded.email)
        assertEquals("Q40123456", loaded.licenseNumber)
        assertEquals("A-IIIb", loaded.licenseCategory)
        assertEquals("2028-09-30", loaded.licenseExpirationDate)
        assertEquals("", loaded.fleetNotice)
    }

    @Test
    fun `cuando Fleet responde 404 omite licencia sin error`() = runTest {
        val remote = FakeProfileRemoteClient().apply {
            driverFailure = ApiException(404, "La cuenta no está vinculada a ningún conductor.")
        }
        val repo = ProfileRepository { remote }

        val loaded = repo.loadProfile(session)

        assertEquals("Luis Quispe Mamani", loaded.fullName)
        assertEquals("", loaded.licenseNumber)
        assertEquals("", loaded.licenseExpirationDate)
        assertEquals("", loaded.fleetNotice)
    }

    @Test
    fun `cuando Fleet falla temporalmente conserva datos de IAM y muestra aviso`() = runTest {
        val remote = FakeProfileRemoteClient().apply {
            driverFailure = IOException("Fleet no disponible")
        }
        val repo = ProfileRepository { remote }

        val loaded = repo.loadProfile(session)

        assertEquals("Luis Quispe Mamani", loaded.fullName)
        assertEquals("Transportes Andes SAC", loaded.companyName)
        assertEquals("", loaded.licenseNumber)
        assertEquals("No pudimos consultar tu licencia en este momento.", loaded.fleetNotice)
    }

    @Test
    fun `error 401 en IAM o Fleet se propaga para reautenticar`() {
        val iamExpired = FakeProfileRemoteClient().apply {
            userFailure = ApiException(401, "Sesión vencida")
        }
        assertThrows(ApiException::class.java) {
            kotlinx.coroutines.runBlocking { ProfileRepository { iamExpired }.loadProfile(session) }
        }

        val fleetExpired = FakeProfileRemoteClient().apply {
            driverFailure = ApiException(401, "Sesión vencida")
        }
        assertThrows(ApiException::class.java) {
            kotlinx.coroutines.runBlocking { ProfileRepository { fleetExpired }.loadProfile(session) }
        }
    }

    @Test
    fun `parsea JSON de IAM y Fleet y formatea rol y vencimiento`() {
        val userJson = JSONObject(
            """
            {
              "id": "u-1",
              "fullName": "Luis Quispe",
              "email": "luis@andes.example",
              "role": "DRIVER",
              "status": "ACTIVE",
              "tenant": {
                "id": "t-1",
                "tradeName": "Transportes Andes SAC",
                "ruc": "20123456789",
                "status": "ACTIVE"
              }
            }
            """.trimIndent(),
        )
        val driverJson = JSONObject(
            """
            {
              "id": "d-1",
              "userId": "u-1",
              "fullName": "Luis Quispe",
              "documentType": "DNI",
              "documentNumber": "40123456",
              "licenseNumber": "Q40123456",
              "licenseCategory": "A-IIIb",
              "licenseExpirationDate": "2028-09-30",
              "status": "ENABLED"
            }
            """.trimIndent(),
        )

        val user = CurrentUserProfile.from(userJson)
        val driver = DriverProfile.from(driverJson)

        assertEquals("Transportes Andes SAC", user.tenant?.tradeName)
        assertEquals("Q40123456", driver.licenseNumber)
        assertEquals("Conductor", roleLabel(user.role))
        assertEquals("30/09/2028", formatIsoDate(driver.licenseExpirationDate))
    }
}
