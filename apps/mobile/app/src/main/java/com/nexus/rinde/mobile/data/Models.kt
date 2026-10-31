package com.nexus.rinde.mobile.data

import org.json.JSONObject

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
    companion object {
        fun from(json: JSONObject) = Trip(
            json.getString("id"), json.getString("code"), json.getString("origin"),
            json.getString("destination"), json.getString("departureDate"),
            json.getString("status"), json.text("cargoDescription"), json.text("cargoWeightKg"),
            json.text("startedAt"), json.text("finishedAt"),
        )
    }
}

data class Expense(
    val id: String,
    val category: String,
    val amount: String,
    val currency: String,
    val date: String,
    val status: String,
    val reason: String,
    val key: String,
) {
    companion object {
        fun from(json: JSONObject) = Expense(
            json.getString("id"), json.getString("category"), json.get("amount").toString(),
            json.text("currency"), json.text("expenseDate"), json.text("status"),
            json.text("observationReason"), json.text("idempotencyKey"),
        )
    }
}

internal fun JSONObject.text(key: String): String = if (isNull(key)) "" else optString(key)
