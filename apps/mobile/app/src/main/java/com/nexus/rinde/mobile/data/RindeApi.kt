package com.nexus.rinde.mobile.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URI

class ApiException(val status: Int, message: String) : IOException(message)

class RindeApi(private val server: String, private val token: String = "") {
    suspend fun request(method: String, path: String, body: JSONObject? = null): String =
        withContext(Dispatchers.IO) {
            val connection = URI(server + path).toURL().openConnection() as HttpURLConnection
            try {
                connection.requestMethod = method
                connection.instanceFollowRedirects = false
                connection.connectTimeout = 10_000
                connection.readTimeout = 15_000
                connection.setRequestProperty("Accept", "application/json")
                if (token.isNotBlank()) connection.setRequestProperty("Authorization", "Bearer $token")
                if (body != null) {
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
                }
                val status = connection.responseCode
                val stream = if (status in 200..299) connection.inputStream else connection.errorStream
                val response = stream?.bufferedReader(Charsets.UTF_8)?.use {
                    it.readText().take(2_000_000)
                }.orEmpty()
                if (status !in 200..299) {
                    val detail = runCatching { JSONObject(response).text("detail") }.getOrDefault("")
                    throw ApiException(status, detail.ifBlank {
                        when (status) {
                            401 -> "Tu sesión venció. Vuelve a ingresar."
                            403 -> "Tu cuenta no tiene permiso para esta operación."
                            404 -> "El registro no está disponible. Actualiza el viaje."
                            else -> "No pudimos completar la operación. Actualiza e inténtalo de nuevo."
                        }
                    })
                }
                response
            } finally {
                connection.disconnect()
            }
        }

    suspend fun trips(): List<Trip> = JSONArray(request("GET", "/api/v1/trips/assigned-to-me")).let {
        (0 until it.length()).map { index -> Trip.from(it.getJSONObject(index)) }
    }

    suspend fun trip(id: String) = Trip.from(JSONObject(request("GET", "/api/v1/trips/$id")))

    suspend fun expenses(id: String): List<Expense> =
        JSONArray(request("GET", "/api/v1/trips/$id/expenses")).let {
            (0 until it.length()).map { index -> Expense.from(it.getJSONObject(index)) }
        }
}
