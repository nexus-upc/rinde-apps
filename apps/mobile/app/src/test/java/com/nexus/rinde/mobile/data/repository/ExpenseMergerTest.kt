package com.nexus.rinde.mobile.data.repository

import com.nexus.rinde.mobile.data.local.ExpenseQueuePayload
import com.nexus.rinde.mobile.data.local.QueueItemEntity
import com.nexus.rinde.mobile.data.local.QueueItemStatus
import com.nexus.rinde.mobile.data.local.QueueItemType
import com.nexus.rinde.mobile.data.remote.Expense
import org.junit.Assert.assertEquals
import org.junit.Test
import java.math.BigDecimal

class ExpenseMergerTest {

    @Test
    fun `combina gastos del servidor y de la cola sin duplicar por idempotencyKey`() {
        val remote = Expense(
            id = "exp-1",
            tripId = "trip-1",
            category = "TOLL",
            amount = "32.00",
            currency = "PEN",
            date = "2026-11-25",
            status = "PENDING_SUPPORT",
            reason = "",
            key = "key-photo-pending",
        )
        val photoPendingQueue = QueueItemEntity(
            idempotencyKey = "key-photo-pending",
            ownerUserId = "user-1",
            itemType = QueueItemType.EXPENSE.name,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            payloadJson = ExpenseQueuePayload("TOLL", BigDecimal("32.00"), "PEN", "2026-11-25").toJson(),
            photoPath = "/data/user/0/rinde/files/receipts/a.jpg",
            photoFileName = "peaje.jpg",
            photoSizeBytes = 120_000L,
            remoteId = "exp-1",
            status = QueueItemStatus.PHOTO_PENDING.name,
        )
        val offlinePending = QueueItemEntity(
            idempotencyKey = "key-local-only",
            ownerUserId = "user-1",
            itemType = QueueItemType.EXPENSE.name,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            payloadJson = ExpenseQueuePayload("FUEL", BigDecimal("180.50"), "PEN", "2026-11-25").toJson(),
            status = QueueItemStatus.PENDING.name,
        )
        val syncedQueue = QueueItemEntity(
            idempotencyKey = "key-already-synced",
            ownerUserId = "user-1",
            itemType = QueueItemType.EXPENSE.name,
            tripId = "trip-1",
            tripCode = "TRP-000014",
            payloadJson = ExpenseQueuePayload("FOOD", BigDecimal("25.00"), "PEN", "2026-11-24").toJson(),
            remoteId = "exp-2",
            status = QueueItemStatus.SYNCED.name,
        )

        val merged = ExpenseMerger.merge(
            serverExpenses = listOf(remote),
            queueItems = listOf(photoPendingQueue, offlinePending, syncedQueue),
            activeSyncKeys = setOf("key-photo-pending"),
        )

        assertEquals(2, merged.size)
        val pendingRow = merged.first { it.idempotencyKey == "key-local-only" }
        assertEquals(QueueItemStatus.PENDING, pendingRow.queueStatus)

        val matchedRow = merged.first { it.idempotencyKey == "key-photo-pending" }
        assertEquals(QueueItemStatus.PHOTO_PENDING, matchedRow.queueStatus)
        assertEquals(true, matchedRow.isSyncingNow)
        assertEquals("exp-1", matchedRow.remoteId)
    }
}
