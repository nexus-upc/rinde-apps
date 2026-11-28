package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.CachedTripDao
import com.nexus.rinde.mobile.data.local.CachedTripEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.SessionData
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
import com.nexus.rinde.mobile.data.remote.TripStatusChange
import com.nexus.rinde.mobile.data.remote.VehicleSummary
import com.nexus.rinde.mobile.ui.common.deliveryMethodLabel
import com.nexus.rinde.mobile.ui.common.settlementStatusLabel
import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.io.IOException
import java.math.BigDecimal

class TripDetailLoadAndFinancialsTest {

    private class InMemoryCachedTripDao : CachedTripDao {
        private val items = linkedMapOf<Pair<String, String>, CachedTripEntity>()

        override suspend fun findByUser(userId: String): List<CachedTripEntity> =
            items.values.filter { it.ownerUserId == userId }

        override suspend fun findOne(userId: String, tripId: String): CachedTripEntity? =
            items[userId to tripId]

        override suspend fun upsertAll(items: List<CachedTripEntity>) {
            items.forEach { this.items[it.ownerUserId to it.tripId] = it }
        }

        override suspend fun deleteByUser(userId: String) {
            items.keys.removeAll { it.first == userId }
        }
    }

    private class FakeTripRemoteClient : RindeRemoteClient {
        var tripDetail: Trip = Trip(
            id = "trip-1",
            code = "TRP-000014",
            origin = "Lima",
            destination = "Trujillo",
            departureDate = "2026-11-26",
            status = "IN_ROUTE",
            cargo = "Materiales de construcción",
            weight = "4200.00",
            vehicleId = "veh-1",
            driverId = "drv-1",
            assignedAt = "2026-11-25T10:00:00Z",
            startedAt = "2026-11-26T08:00:00Z",
            statusChanges = listOf(
                TripStatusChange("SCHEDULED", "2026-11-25T09:00:00Z", "admin-1"),
                TripStatusChange("ASSIGNED", "2026-11-25T10:00:00Z", "admin-1"),
                TripStatusChange("IN_ROUTE", "2026-11-26T08:00:00Z", "driver-1"),
            ),
        )
        var vehicleSummary: VehicleSummary = VehicleSummary(
            id = "veh-1",
            plateNumber = "ABC-123",
            brand = "Volvo",
            model = "FH 460",
            modelYear = 2024,
            payloadCapacityKg = "15000",
            status = "IN_TRIP",
        )
        var advances: List<TripAdvance> = listOf(
            TripAdvance("adv-1", "trip-1", "300.00", "PEN", "CASH", "admin-1", "2026-11-25T11:00:00Z"),
            TripAdvance("adv-2", "trip-1", "200.00", "PEN", "TRANSFER", "admin-1", "2026-11-25T12:00:00Z"),
        )
        var settlement: Settlement? = null
        var settlementException: ApiException? = null
        var vehicleException: Throwable? = null

        override suspend fun signIn(email: String, password: String): String = ""
        override suspend fun trips(): List<Trip> = listOf(tripDetail)
        override suspend fun trip(id: String): Trip = tripDetail
        override suspend fun vehicle(id: String): VehicleSummary {
            vehicleException?.let { throw it }
            return vehicleSummary
        }

        override suspend fun tripAdvances(tripId: String): List<TripAdvance> = advances
        override suspend fun tripSettlement(tripId: String): Settlement? {
            settlementException?.let { throw it }
            return settlement
        }

        override suspend fun changeTripStatus(id: String, action: String): Trip = tripDetail
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
        override suspend fun currentUser(): com.nexus.rinde.mobile.data.remote.CurrentUserProfile =
            error("unused")

        override suspend fun currentDriver(): com.nexus.rinde.mobile.data.remote.DriverProfile =
            error("unused")

        override suspend fun recordTripLocations(
            tripId: String,
            request: com.nexus.rinde.mobile.data.remote.RecordTripLocationsRequest,
        ): com.nexus.rinde.mobile.data.remote.RecordTripLocationsResponse = error("unused")
    }

    private val session = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "driver@rinde.test",
        userId = "user-1",
        role = "DRIVER",
        token = "jwt.token",
        expiresAtEpochSeconds = 9_999_999_999L,
    )

    @Test
    fun `carga detalle del viaje con historial de estados, vehiculo y adelantos`() = runTest {
        val dao = InMemoryCachedTripDao()
        val remote = FakeTripRemoteClient()
        val repo = TripRepository(dao, { remote })

        val trip = repo.loadTrip(session, "trip-1")
        val vehicle = repo.loadVehicle(session, trip.vehicleId)
        val advances = repo.loadAdvances(session, "trip-1")

        assertEquals(3, trip.statusChanges.size)
        assertEquals("veh-1", trip.vehicleId)
        assertEquals("ABC-123", vehicle?.plateNumber)
        assertEquals(2, advances.size)
        assertEquals("Efectivo", deliveryMethodLabel(advances[0].deliveryMethod))
        assertEquals("Transferencia", deliveryMethodLabel(advances[1].deliveryMethod))

        // Verifica serialización completa en caché local
        val cachedTrip = Trip.from(JSONObject(dao.findOne("user-1", "trip-1")!!.tripJson))
        assertEquals(3, cachedTrip.statusChanges.size)
        assertEquals("veh-1", cachedTrip.vehicleId)
    }

    @Test
    fun `liquidacion 404 por inexistencia devuelve NotCreated y calcula resumen orientativo`() = runTest {
        val dao = InMemoryCachedTripDao()
        val remote = FakeTripRemoteClient().apply {
            settlementException = ApiException(404, "No existe liquidación para este viaje.")
        }
        val repo = TripRepository(dao, { remote })

        val lookup = repo.loadSettlement(session, "trip-1")
        assertTrue(lookup is SettlementLookupResult.NotCreated)

        val expenses = listOf(
            TripExpenseDisplayItem(
                idempotencyKey = "k1",
                remoteId = "e1",
                category = "FUEL",
                amount = "180.50",
                currency = "PEN",
                date = "2026-11-26",
                backendStatus = "APPROVED",
                queueStatus = null,
                isSyncingNow = false,
                observationReason = "",
                queueError = "",
                localPhotoPath = null,
                localPhotoName = null,
                remoteEvidence = null,
            ),
            TripExpenseDisplayItem(
                idempotencyKey = "k2",
                remoteId = null,
                category = "TOLL",
                amount = "32.00",
                currency = "PEN",
                date = "2026-11-26",
                backendStatus = "",
                queueStatus = QueueItemStatus.PENDING,
                isSyncingNow = false,
                observationReason = "",
                queueError = "",
                localPhotoPath = null,
                localPhotoName = null,
                remoteEvidence = null,
            ),
            TripExpenseDisplayItem(
                idempotencyKey = "k3",
                remoteId = "e3",
                category = "FOOD",
                amount = "40.00",
                currency = "PEN",
                date = "2026-11-26",
                backendStatus = "OBSERVED",
                queueStatus = null,
                isSyncingNow = false,
                observationReason = "Sin RUC",
                queueError = "",
                localPhotoPath = null,
                localPhotoName = null,
                remoteEvidence = null,
            ),
            TripExpenseDisplayItem(
                idempotencyKey = "k4",
                remoteId = null,
                category = "OTHER",
                amount = "15.00",
                currency = "PEN",
                date = "2026-11-26",
                backendStatus = "",
                queueStatus = QueueItemStatus.REJECTED,
                isSyncingNow = false,
                observationReason = "",
                queueError = "Error",
                localPhotoPath = null,
                localPhotoName = null,
                remoteEvidence = null,
            ),
        )

        val summary = TripFinancialCalculator.calculate(
            settlement = null,
            advances = remote.advances,
            expenses = expenses,
        )

        assertFalse(summary.hasOfficialSettlement)
        assertEquals("Sin liquidación generada", settlementStatusLabel(summary.settlementStatus))
        assertEquals(BigDecimal("500.00"), summary.advanceTotal)
        assertEquals(BigDecimal("180.50"), summary.approvedExpensesTotal)
        // Solo cuenta k1 (180.50) y k2 (32.00), excluyendo OBSERVED (k3) y REJECTED (k4)
        assertEquals(BigDecimal("212.50"), summary.registeredExpensesTotal)
        assertEquals(BigDecimal("287.50"), summary.balance)
        assertEquals(2, summary.queuedExpensesCount)
    }

    @Test
    fun `liquidacion oficial abierta o cerrada usa montos oficiales y traduce estado`() = runTest {
        val dao = InMemoryCachedTripDao()
        val remote = FakeTripRemoteClient().apply {
            settlement = Settlement(
                id = "set-1",
                tripId = "trip-1",
                driverId = "drv-1",
                status = "CLOSED",
                advanceAmount = "500.00",
                advanceCurrency = "PEN",
                expenseTotalAmount = "310.00",
                expenseTotalCurrency = "PEN",
                advanceBalance = "190.00",
            )
        }
        val repo = TripRepository(dao, { remote })

        val lookup = repo.loadSettlement(session, "trip-1")
        assertTrue(lookup is SettlementLookupResult.Available)
        val official = (lookup as SettlementLookupResult.Available).settlement

        val summary = TripFinancialCalculator.calculate(
            settlement = official,
            advances = remote.advances,
            expenses = emptyList(),
        )

        assertTrue(summary.hasOfficialSettlement)
        assertEquals("CLOSED", summary.settlementStatus)
        assertEquals("Liquidación cerrada", settlementStatusLabel(summary.settlementStatus))
        assertEquals(BigDecimal("500.00"), summary.advanceTotal)
        assertEquals(BigDecimal("310.00"), summary.approvedExpensesTotal)
        assertEquals(BigDecimal("190.00"), summary.balance)
    }

    @Test
    fun `liquidacion 404 cuando el viaje no existe si propaga error y fallo de vehiculo degrada sin romper`() = runTest {
        val dao = InMemoryCachedTripDao()
        val remote = FakeTripRemoteClient().apply {
            settlementException = ApiException(404, "El viaje no existe.")
            vehicleException = IOException("Sin señal")
        }
        val repo = TripRepository(dao, { remote })

        assertNull(repo.loadVehicle(session, "veh-1"))
        assertThrows(ApiException::class.java) {
            kotlinx.coroutines.runBlocking { repo.loadSettlement(session, "trip-1") }
        }
    }
}
