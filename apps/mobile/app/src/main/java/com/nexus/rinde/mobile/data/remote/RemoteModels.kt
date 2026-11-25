package com.nexus.rinde.mobile.data.remote

import org.json.JSONObject
import java.math.BigDecimal

data class Trip(
    val id: String,
    val code: String,
    val origin: String,
    val destination: String,
    val departureDate: String,
    val status: String,
    val cargo: String = "",
    val weight: String = "",
    val startedAt: String = "",
    val finishedAt: String = "",
) {
    fun toJson(): JSONObject = JSONObject()
        .put("id", id)
        .put("code", code)
        .put("origin", origin)
        .put("destination", destination)
        .put("departureDate", departureDate)
        .put("status", status)
        .put("cargoDescription", cargo)
        .put("cargoWeightKg", weight)
        .put("startedAt", startedAt)
        .put("finishedAt", finishedAt)

    companion object {
        fun from(json: JSONObject) = Trip(
            id = json.getString("id"),
            code = json.getString("code"),
            origin = json.getString("origin"),
            destination = json.getString("destination"),
            departureDate = json.getString("departureDate"),
            status = json.getString("status"),
            cargo = json.text("cargoDescription"),
            weight = json.text("cargoWeightKg"),
            startedAt = json.text("startedAt"),
            finishedAt = json.text("finishedAt"),
        )
    }
}

data class EvidenceMetadata(
    val id: String,
    val fileName: String,
    val contentType: String,
    val fileSizeBytes: Long,
    val contentUrl: String,
    val uploadedAt: String,
) {
    companion object {
        fun from(json: JSONObject) = EvidenceMetadata(
            id = json.getString("id"),
            fileName = json.text("fileName"),
            contentType = json.text("contentType"),
            fileSizeBytes = json.optLong("fileSizeBytes", 0L),
            contentUrl = json.text("contentUrl"),
            uploadedAt = json.text("uploadedAt"),
        )
    }
}

data class Expense(
    val id: String,
    val tripId: String,
    val category: String,
    val amount: String,
    val currency: String,
    val date: String,
    val status: String,
    val reason: String,
    val key: String,
    val evidence: EvidenceMetadata? = null,
) {
    companion object {
        fun from(json: JSONObject): Expense {
            val evidenceJson = if (json.isNull("evidence")) null else json.optJSONObject("evidence")
            return Expense(
                id = json.getString("id"),
                tripId = json.text("tripId"),
                category = json.getString("category"),
                amount = json.get("amount").toString(),
                currency = json.text("currency"),
                date = json.text("expenseDate"),
                status = json.text("status"),
                reason = json.text("observationReason"),
                key = json.text("idempotencyKey"),
                evidence = evidenceJson?.let(EvidenceMetadata::from),
            )
        }
    }
}

data class SyncExpenseRequest(
    val tripId: String,
    val category: String,
    val amount: BigDecimal,
    val currency: String,
    val expenseDate: String,
    val idempotencyKey: String,
) {
    fun toJson(): JSONObject = JSONObject()
        .put("tripId", tripId)
        .put("category", category)
        .put("amount", amount)
        .put("currency", currency)
        .put("expenseDate", expenseDate)
        .put("idempotencyKey", idempotencyKey)
}

data class SyncRejectedItem(
    val idempotencyKey: String,
    val reason: String,
    val code: String,
) {
    companion object {
        fun from(json: JSONObject) = SyncRejectedItem(
            idempotencyKey = json.text("idempotencyKey"),
            reason = json.text("reason"),
            code = json.text("code"),
        )
    }
}

data class SyncExpensesResponse(
    val totalReceived: Int,
    val synchronizedCount: Int,
    val items: List<Expense>,
    val rejectedCount: Int,
    val rejected: List<SyncRejectedItem>,
) {
    companion object {
        fun from(json: JSONObject): SyncExpensesResponse {
            val itemsArray = json.optJSONArray("items")
            val itemsList = buildList {
                if (itemsArray != null) {
                    for (index in 0 until itemsArray.length()) {
                        add(Expense.from(itemsArray.getJSONObject(index)))
                    }
                }
            }
            val rejectedArray = json.optJSONArray("rejected")
            val rejectedList = buildList {
                if (rejectedArray != null) {
                    for (index in 0 until rejectedArray.length()) {
                        add(SyncRejectedItem.from(rejectedArray.getJSONObject(index)))
                    }
                }
            }
            return SyncExpensesResponse(
                totalReceived = json.optInt("totalReceived", 0),
                synchronizedCount = json.optInt("synchronizedCount", itemsList.size),
                items = itemsList,
                rejectedCount = json.optInt("rejectedCount", rejectedList.size),
                rejected = rejectedList,
            )
        }
    }
}

internal fun JSONObject.text(key: String): String = if (isNull(key)) "" else optString(key)
