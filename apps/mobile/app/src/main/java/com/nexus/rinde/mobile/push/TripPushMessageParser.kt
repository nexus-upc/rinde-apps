package com.nexus.rinde.mobile.push

data class TripPushMessage(
    val notificationId: Int,
    val title: String,
    val body: String,
    val tripId: String? = null,
)

object TripPushMessageParser {
    fun parse(
        data: Map<String, String>,
        notificationTitle: String? = null,
        notificationBody: String? = null,
    ): TripPushMessage {
        val tripId = data["tripId"]?.trim()?.takeIf { it.isNotBlank() }
        val tripCode = data["tripCode"]?.trim()?.takeIf { it.isNotBlank() }
            ?: data["code"]?.trim()?.takeIf { it.isNotBlank() }
        val destination = data["destination"]?.trim()?.takeIf { it.isNotBlank() }
        val departureDate = data["departureDate"]?.trim()?.takeIf { it.isNotBlank() }

        val title = notificationTitle?.trim()?.takeIf { it.isNotBlank() }
            ?: data["title"]?.trim()?.takeIf { it.isNotBlank() }
            ?: if (tripCode != null) "Nuevo viaje asignado: $tripCode" else "Nuevo viaje asignado"

        val body = notificationBody?.trim()?.takeIf { it.isNotBlank() }
            ?: data["body"]?.trim()?.takeIf { it.isNotBlank() }
            ?: data["message"]?.trim()?.takeIf { it.isNotBlank() }
            ?: buildFallbackBody(tripCode, destination, departureDate)

        val idSeed = tripId ?: data["eventId"] ?: tripCode ?: title
        val notificationId = (idSeed.hashCode() and 0x7FFFFFFF).coerceAtLeast(1)

        return TripPushMessage(
            notificationId = notificationId,
            title = title,
            body = body,
            tripId = tripId,
        )
    }

    private fun buildFallbackBody(
        tripCode: String?,
        destination: String?,
        departureDate: String?,
    ): String {
        val parts = buildList {
            if (tripCode != null) add("Viaje $tripCode asignado.")
            if (destination != null) add("Destino: $destination.")
            if (departureDate != null) add("Fecha de salida: $departureDate.")
        }
        return if (parts.isNotEmpty()) {
            parts.joinToString(" ")
        } else {
            "Tienes un nuevo viaje asignado. Abre la aplicación para ver el detalle."
        }
    }
}
