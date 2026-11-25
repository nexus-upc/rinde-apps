package com.nexus.rinde.mobile.data.local

import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import org.json.JSONObject
import java.math.BigDecimal

enum class QueueItemType {
    EXPENSE,
    INCIDENT,
}

enum class QueueItemStatus {
    PENDING,
    PHOTO_PENDING,
    SYNCED,
    REJECTED,
}

@Entity(
    tableName = "offline_queue_items",
    indices = [
        Index(value = ["ownerUserId", "status"]),
        Index(value = ["ownerUserId", "tripId"]),
    ],
)
data class QueueItemEntity(
    @PrimaryKey
    val idempotencyKey: String,
    val ownerUserId: String,
    val itemType: String,
    val tripId: String,
    val tripCode: String,
    val payloadJson: String,
    val photoPath: String? = null,
    val photoFileName: String? = null,
    val photoSizeBytes: Long = 0L,
    val remoteId: String? = null,
    val status: String = QueueItemStatus.PENDING.name,
    val rejectionCode: String = "",
    val errorMessage: String = "",
    val retryCount: Int = 0,
    val nextRetryAtEpochMs: Long = 0L,
    val createdAtEpochMs: Long = 0L,
    val updatedAtEpochMs: Long = 0L,
) {
    val queueType: QueueItemType
        get() = runCatching { QueueItemType.valueOf(itemType) }.getOrDefault(QueueItemType.EXPENSE)

    val queueStatus: QueueItemStatus
        get() = runCatching { QueueItemStatus.valueOf(status) }.getOrDefault(QueueItemStatus.PENDING)
}

data class ExpenseQueuePayload(
    val category: String,
    val amount: BigDecimal,
    val currency: String,
    val expenseDate: String,
) {
    fun toJson(): String = JSONObject()
        .put("category", category)
        .put("amount", amount.toPlainString())
        .put("currency", currency)
        .put("expenseDate", expenseDate)
        .toString()

    companion object {
        fun fromJson(raw: String): ExpenseQueuePayload {
            val obj = JSONObject(raw)
            return ExpenseQueuePayload(
                category = obj.getString("category"),
                amount = BigDecimal(obj.get("amount").toString()),
                currency = obj.optString("currency", "PEN"),
                expenseDate = obj.getString("expenseDate"),
            )
        }
    }
}

data class IncidentQueuePayload(
    val type: String,
    val description: String,
) {
    fun toJson(): String = JSONObject()
        .put("type", type)
        .put("description", description)
        .toString()

    companion object {
        fun fromJson(raw: String): IncidentQueuePayload {
            val obj = JSONObject(raw)
            return IncidentQueuePayload(
                type = obj.getString("type"),
                description = obj.getString("description"),
            )
        }
    }
}

@Entity(
    tableName = "cached_trips",
    primaryKeys = ["ownerUserId", "tripId"],
)
data class CachedTripEntity(
    val ownerUserId: String,
    val tripId: String,
    val tripJson: String,
    val updatedAtEpochMs: Long,
)
