package com.nexus.rinde.mobile.data.remote

import java.io.File

/** Puerto de acceso al gateway para permitir pruebas unitarias con cliente falso. */
interface RindeRemoteClient {
    suspend fun signIn(email: String, password: String): String
    suspend fun trips(): List<Trip>
    suspend fun trip(id: String): Trip
    suspend fun changeTripStatus(id: String, action: String): Trip
    suspend fun expenses(tripId: String): List<Expense>
    suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse
    suspend fun uploadExpenseEvidence(
        expenseId: String,
        file: File,
        fileName: String,
        contentType: String = "image/jpeg",
    ): Expense
    suspend fun downloadEvidenceBytes(contentUrl: String): ByteArray
}
