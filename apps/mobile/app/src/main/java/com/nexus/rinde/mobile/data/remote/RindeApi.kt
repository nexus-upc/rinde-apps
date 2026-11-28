package com.nexus.rinde.mobile.data.remote

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedOutputStream
import java.io.File
import java.io.FileInputStream
import java.net.HttpURLConnection
import java.net.URI
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import java.util.UUID

class RindeApi(
    private val server: String,
    private val token: String = "",
) : RindeRemoteClient {

    suspend fun request(method: String, path: String, payload: String? = null): String =
        withContext(Dispatchers.IO) {
            val connection = URI(server + path).toURL().openConnection() as HttpURLConnection
            try {
                connection.requestMethod = method
                connection.instanceFollowRedirects = false
                connection.connectTimeout = 10_000
                connection.readTimeout = 15_000
                connection.setRequestProperty("Accept", "application/json")
                if (token.isNotBlank()) connection.setRequestProperty("Authorization", "Bearer $token")
                if (payload != null) {
                    connection.doOutput = true
                    connection.setRequestProperty("Content-Type", "application/json; charset=utf-8")
                    connection.outputStream.use { it.write(payload.toByteArray(Charsets.UTF_8)) }
                }
                readTextResponse(connection)
            } finally {
                connection.disconnect()
            }
        }

    override suspend fun signIn(email: String, password: String): String {
        val body = JSONObject().put("email", email).put("password", password)
        val result = JSONObject(request("POST", "/api/v1/auth/sign-in", body.toString()))
        return result.getString("accessToken")
    }

    override suspend fun trips(): List<Trip> =
        JSONArray(request("GET", "/api/v1/trips/assigned-to-me")).let { array ->
            (0 until array.length()).map { index -> Trip.from(array.getJSONObject(index)) }
        }

    override suspend fun trip(id: String): Trip =
        Trip.from(JSONObject(request("GET", "/api/v1/trips/$id")))

    override suspend fun vehicle(id: String): VehicleSummary =
        VehicleSummary.from(JSONObject(request("GET", "/api/v1/vehicles/$id")))

    override suspend fun tripAdvances(tripId: String): List<TripAdvance> =
        JSONArray(request("GET", "/api/v1/trips/$tripId/advances")).let { array ->
            (0 until array.length()).map { index -> TripAdvance.from(array.getJSONObject(index)) }
        }

    override suspend fun tripSettlement(tripId: String): Settlement? =
        Settlement.from(JSONObject(request("GET", "/api/v1/trips/$tripId/settlement")))

    override suspend fun changeTripStatus(id: String, action: String): Trip =
        Trip.from(JSONObject(request("POST", "/api/v1/trips/$id/$action", "{}")))

    override suspend fun expenses(tripId: String): List<Expense> =
        JSONArray(request("GET", "/api/v1/trips/$tripId/expenses")).let { array ->
            (0 until array.length()).map { index -> Expense.from(array.getJSONObject(index)) }
        }

    override suspend fun syncExpenses(items: List<SyncExpenseRequest>): SyncExpensesResponse {
        val array = JSONArray()
        items.forEach { array.put(it.toJson()) }
        val response = request("POST", "/api/v1/expenses/sync", array.toString())
        return SyncExpensesResponse.from(JSONObject(response))
    }

    override suspend fun uploadExpenseEvidence(
        expenseId: String,
        file: File,
        fileName: String,
        contentType: String,
    ): Expense {
        val body = postMultipartEvidence(
            path = "/api/v1/expenses/$expenseId/evidences",
            file = file,
            fileName = fileName,
            fallbackName = "comprobante.jpg",
            contentType = contentType,
        )
        return Expense.from(JSONObject(body))
    }

    override suspend fun reportIncident(tripId: String, request: ReportIncidentRequest): Incident =
        Incident.from(
            JSONObject(
                request("POST", "/api/v1/trips/$tripId/incidents", request.toJson().toString()),
            ),
        )

    override suspend fun uploadIncidentEvidence(
        incidentId: String,
        file: File,
        fileName: String,
        contentType: String,
    ): Incident {
        val body = postMultipartEvidence(
            path = "/api/v1/incidents/$incidentId/evidences",
            file = file,
            fileName = fileName,
            fallbackName = "incidencia.jpg",
            contentType = contentType,
        )
        return Incident.from(JSONObject(body))
    }

    private suspend fun postMultipartEvidence(
        path: String,
        file: File,
        fileName: String,
        fallbackName: String,
        contentType: String,
    ): String = withContext(Dispatchers.IO) {
        val boundary = "RindeBoundary-${UUID.randomUUID()}"
        val safeName = fileName.replace("\"", "").replace("\r", "").replace("\n", "")
            .ifBlank { fallbackName }
        val connection = URI("$server$path").toURL().openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.instanceFollowRedirects = false
            connection.connectTimeout = 10_000
            connection.readTimeout = 30_000
            connection.doOutput = true
            connection.setRequestProperty("Accept", "application/json")
            connection.setRequestProperty("Content-Type", "multipart/form-data; boundary=$boundary")
            if (token.isNotBlank()) connection.setRequestProperty("Authorization", "Bearer $token")

            BufferedOutputStream(connection.outputStream).use { out ->
                val header = buildString {
                    append("--").append(boundary).append("\r\n")
                    append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                        .append(safeName).append("\"\r\n")
                    append("Content-Type: ").append(contentType).append("\r\n\r\n")
                }
                out.write(header.toByteArray(Charsets.UTF_8))
                FileInputStream(file).use { input -> input.copyTo(out) }
                out.write("\r\n--$boundary--\r\n".toByteArray(Charsets.UTF_8))
                out.flush()
            }
            readTextResponse(connection)
        } finally {
            connection.disconnect()
        }
    }

    override suspend fun downloadEvidenceBytes(contentUrl: String): ByteArray =
        withContext(Dispatchers.IO) {
            val targetUrl = if (contentUrl.startsWith("http://") || contentUrl.startsWith("https://")) {
                contentUrl
            } else {
                val normalized = if (contentUrl.startsWith("/")) contentUrl else "/$contentUrl"
                server + normalized
            }
            val connection = URI(targetUrl).toURL().openConnection() as HttpURLConnection
            try {
                connection.requestMethod = "GET"
                connection.instanceFollowRedirects = false
                connection.connectTimeout = 10_000
                connection.readTimeout = 20_000
                if (token.isNotBlank()) connection.setRequestProperty("Authorization", "Bearer $token")
                val status = connection.responseCode
                if (status !in 200..299) {
                    val errText = connection.errorStream?.bufferedReader(Charsets.UTF_8)
                        ?.use { it.readText().take(200_000) }.orEmpty()
                    throw ApiException(status, resolveErrorMessage(status, errText))
                }
                connection.inputStream.use { input ->
                    val bytes = input.readBytes()
                    if (bytes.size > 10 * 1024 * 1024) {
                        throw ApiException(413, "El comprobante supera el tamaño permitido para mostrar.")
                    }
                    bytes
                }
            } finally {
                connection.disconnect()
            }
        }

    override suspend fun registerDevice(request: RegisterDeviceRequest) {
        request("POST", "/api/v1/notifications/devices", request.toJson().toString())
    }

    override suspend fun removeDevice(token: String) {
        require(token.isNotBlank()) { "El token del dispositivo es obligatorio." }
        request("DELETE", "/api/v1/notifications/devices/${encodePathSegment(token)}")
    }

    override suspend fun currentUser(): CurrentUserProfile =
        CurrentUserProfile.from(JSONObject(request("GET", "/api/v1/users/me")))

    override suspend fun currentDriver(): DriverProfile =
        DriverProfile.from(JSONObject(request("GET", "/api/v1/drivers/me")))

    override suspend fun recordTripLocations(
        tripId: String,
        request: RecordTripLocationsRequest,
    ): RecordTripLocationsResponse =
        RecordTripLocationsResponse.from(
            JSONObject(request("POST", "/api/v1/trips/$tripId/locations", request.toJson().toString())),
        )

    private fun encodePathSegment(segment: String): String =
        URLEncoder.encode(segment, StandardCharsets.UTF_8.name()).replace("+", "%20")

    private fun readTextResponse(connection: HttpURLConnection): String {
        val status = connection.responseCode
        val stream = if (status in 200..299) connection.inputStream else connection.errorStream
        val response = stream?.bufferedReader(Charsets.UTF_8)?.use {
            it.readText().take(2_000_000)
        }.orEmpty()
        if (status !in 200..299) {
            throw ApiException(status, resolveErrorMessage(status, response))
        }
        return response
    }

    private fun resolveErrorMessage(status: Int, responseBody: String): String {
        val detail = runCatching { JSONObject(responseBody).text("detail") }.getOrDefault("")
        return detail.ifBlank {
            when (status) {
                400 -> "Los datos enviados no son válidos."
                401 -> "Tu sesión venció. Vuelve a ingresar."
                403 -> "Tu cuenta no tiene permiso para esta operación."
                404 -> "El registro no está disponible. Actualiza el viaje."
                409 -> "La operación no está permitida para el estado actual."
                else -> "No pudimos completar la operación. Actualiza e inténtalo de nuevo."
            }
        }
    }
}
