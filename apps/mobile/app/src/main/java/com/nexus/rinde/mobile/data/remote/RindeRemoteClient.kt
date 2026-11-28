package com.nexus.rinde.mobile.data.remote

import java.io.File

/** Puerto de acceso al gateway para permitir pruebas unitarias con cliente falso. */
interface RindeRemoteClient {
    suspend fun signIn(email: String, password: String): String
    suspend fun trips(): List<Trip>
    suspend fun trip(id: String): Trip
    suspend fun vehicle(id: String): VehicleSummary
    suspend fun tripAdvances(tripId: String): List<TripAdvance>
    suspend fun tripSettlement(tripId: String): Settlement?
    suspend fun changeTripStatus(id: String, action: String): Trip
    suspend fun expenses(tripId: String): List<Expense>
    suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse
    suspend fun uploadExpenseEvidence(
        expenseId: String,
        file: File,
        fileName: String,
        contentType: String = "image/jpeg",
    ): Expense
    suspend fun reportIncident(tripId: String, request: ReportIncidentRequest): Incident
    suspend fun uploadIncidentEvidence(
        incidentId: String,
        file: File,
        fileName: String,
        contentType: String = "image/jpeg",
    ): Incident
    suspend fun downloadEvidenceBytes(contentUrl: String): ByteArray
    suspend fun registerDevice(request: RegisterDeviceRequest)
    suspend fun removeDevice(token: String)
    suspend fun currentUser(): CurrentUserProfile
    suspend fun currentDriver(): DriverProfile
    suspend fun recordTripLocations(
        tripId: String,
        request: RecordTripLocationsRequest,
    ): RecordTripLocationsResponse
}
