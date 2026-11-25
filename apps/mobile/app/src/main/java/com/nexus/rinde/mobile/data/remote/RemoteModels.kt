package com.nexus.rinde.mobile.data.remote

import org.json.JSONArray
import org.json.JSONObject
import java.math.BigDecimal

data class TripStatusChange(
    val status: String,
    val changedAt: String,
    val changedBy: String = "",
) {
    fun toJson(): JSONObject = JSONObject()
        .put("status", status)
        .put("changedAt", changedAt)
        .put("changedBy", changedBy)

    companion object {
        fun from(json: JSONObject) = TripStatusChange(
            status = json.text("status"),
            changedAt = json.text("changedAt"),
            changedBy = json.text("changedBy"),
        )
    }
}

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
    val vehicleId: String = "",
    val driverId: String = "",
    val assignedAt: String = "",
    val overdueMaintenanceConfirmedBy: String = "",
    val statusChanges: List<TripStatusChange> = emptyList(),
) {
    fun toJson(): JSONObject {
        val changesArray = JSONArray()
        statusChanges.forEach { changesArray.put(it.toJson()) }
        return JSONObject()
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
            .put("vehicleId", vehicleId)
            .put("driverId", driverId)
            .put("assignedAt", assignedAt)
            .put("overdueMaintenanceConfirmedBy", overdueMaintenanceConfirmedBy)
            .put("statusChanges", changesArray)
    }

    companion object {
        fun from(json: JSONObject): Trip {
            val changesArray = json.optJSONArray("statusChanges")
            val changes = buildList {
                if (changesArray != null) {
                    for (index in 0 until changesArray.length()) {
                        val item = changesArray.optJSONObject(index)
                        if (item != null) add(TripStatusChange.from(item))
                    }
                }
            }
            return Trip(
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
                vehicleId = json.text("vehicleId"),
                driverId = json.text("driverId"),
                assignedAt = json.text("assignedAt"),
                overdueMaintenanceConfirmedBy = json.text("overdueMaintenanceConfirmedBy"),
                statusChanges = changes,
            )
        }
    }
}

data class VehicleSummary(
    val id: String,
    val plateNumber: String,
    val brand: String,
    val model: String,
    val modelYear: Int? = null,
    val payloadCapacityKg: String = "",
    val status: String = "",
) {
    companion object {
        fun from(json: JSONObject) = VehicleSummary(
            id = json.getString("id"),
            plateNumber = json.text("plateNumber"),
            brand = json.text("brand"),
            model = json.text("model"),
            modelYear = if (json.has("modelYear") && !json.isNull("modelYear")) {
                json.optInt("modelYear")
            } else {
                null
            },
            payloadCapacityKg = json.text("payloadCapacityKg"),
            status = json.text("status"),
        )
    }
}

data class TripAdvance(
    val id: String,
    val tripId: String,
    val amount: String,
    val currency: String,
    val deliveryMethod: String,
    val registeredBy: String = "",
    val registeredAt: String = "",
) {
    companion object {
        fun from(json: JSONObject) = TripAdvance(
            id = json.getString("id"),
            tripId = json.text("tripId"),
            amount = json.decimalText("amount").ifBlank { "0.00" },
            currency = json.text("currency").ifBlank { "PEN" },
            deliveryMethod = json.text("deliveryMethod"),
            registeredBy = json.text("registeredBy"),
            registeredAt = json.text("registeredAt"),
        )
    }
}

data class Settlement(
    val id: String,
    val tripId: String,
    val driverId: String = "",
    val status: String,
    val advanceAmount: String = "",
    val advanceCurrency: String = "PEN",
    val expenseTotalAmount: String = "",
    val expenseTotalCurrency: String = "PEN",
    val advanceBalance: String = "",
    val createdAt: String = "",
    val updatedAt: String = "",
) {
    companion object {
        fun from(json: JSONObject) = Settlement(
            id = json.getString("id"),
            tripId = json.text("tripId"),
            driverId = json.text("driverId"),
            status = json.text("status"),
            advanceAmount = json.decimalText("advanceAmount"),
            advanceCurrency = json.text("advanceCurrency").ifBlank { "PEN" },
            expenseTotalAmount = json.decimalText("expenseTotalAmount"),
            expenseTotalCurrency = json.text("expenseTotalCurrency").ifBlank { "PEN" },
            advanceBalance = json.decimalText("advanceBalance"),
            createdAt = json.text("createdAt"),
            updatedAt = json.text("updatedAt"),
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

data class ReportIncidentRequest(
    val type: String,
    val description: String,
    val evidenceUrl: String? = null,
    val idempotencyKey: String,
) {
    fun toJson(): JSONObject = JSONObject()
        .put("type", type)
        .put("description", description)
        .put("evidenceUrl", evidenceUrl ?: JSONObject.NULL)
        .put("idempotencyKey", idempotencyKey)
}

data class Incident(
    val id: String,
    val tripId: String,
    val vehicleId: String = "",
    val reportedBy: String = "",
    val type: String,
    val description: String,
    val evidenceUrl: String? = null,
    val evidence: EvidenceMetadata? = null,
    val status: String,
    val reportedAt: String = "",
    val updatedAt: String = "",
) {
    companion object {
        fun from(json: JSONObject): Incident {
            val evidenceJson = if (json.isNull("evidence")) null else json.optJSONObject("evidence")
            return Incident(
                id = json.getString("id"),
                tripId = json.text("tripId"),
                vehicleId = json.text("vehicleId"),
                reportedBy = json.text("reportedBy"),
                type = json.text("type"),
                description = json.text("description"),
                evidenceUrl = json.text("evidenceUrl").ifBlank { null },
                evidence = evidenceJson?.let(EvidenceMetadata::from),
                status = json.text("status"),
                reportedAt = json.text("reportedAt"),
                updatedAt = json.text("updatedAt"),
            )
        }
    }
}

data class RegisterDeviceRequest(
    val token: String,
    val platform: String = "ANDROID",
) {
    fun toJson(): JSONObject = JSONObject()
        .put("token", token)
        .put("platform", platform)
}

internal fun JSONObject.text(key: String): String =
    if (!has(key) || isNull(key)) "" else optString(key)

internal fun JSONObject.decimalText(key: String): String =
    if (!has(key) || isNull(key)) "" else opt(key)?.toString().orEmpty()
