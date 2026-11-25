package com.nexus.rinde.mobile.push

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TripPushMessageParserTest {

    @Test
    fun `prioriza titulo y cuerpo de notification cuando estan presentes`() {
        val parsed = TripPushMessageParser.parse(
            data = mapOf("tripId" to "trip-14", "tripCode" to "TRP-000014"),
            notificationTitle = "Nuevo viaje asignado",
            notificationBody = "Viaje TRP-000014 asignado. Destino: Trujillo.",
        )

        assertEquals("Nuevo viaje asignado", parsed.title)
        assertEquals("Viaje TRP-000014 asignado. Destino: Trujillo.", parsed.body)
        assertEquals("trip-14", parsed.tripId)
        assertTrue(parsed.notificationId > 0)
    }

    @Test
    fun `construye mensaje en espanol desde data cuando falta notification`() {
        val parsed = TripPushMessageParser.parse(
            data = mapOf(
                "tripId" to "trip-22",
                "tripCode" to "TRP-000022",
                "destination" to "Arequipa",
                "departureDate" to "2026-11-28",
            ),
        )

        assertEquals("Nuevo viaje asignado: TRP-000022", parsed.title)
        assertEquals(
            "Viaje TRP-000022 asignado. Destino: Arequipa. Fecha de salida: 2026-11-28.",
            parsed.body,
        )
        assertEquals("trip-22", parsed.tripId)
    }

    @Test
    fun `usa texto por defecto cuando el payload viene vacio`() {
        val parsed = TripPushMessageParser.parse(data = emptyMap())

        assertEquals("Nuevo viaje asignado", parsed.title)
        assertEquals(
            "Tienes un nuevo viaje asignado. Abre la aplicación para ver el detalle.",
            parsed.body,
        )
    }
}
