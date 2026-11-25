package com.nexus.rinde.mobile.data.local

import java.math.BigDecimal
import java.net.URI
import java.time.LocalDate

object InputRules {
    const val INCIDENT_DESCRIPTION_MAX_LENGTH = 500
    private val VALID_INCIDENT_TYPES = setOf("BREAKDOWN", "DELAY", "OTHER")

    fun serverUrl(value: String, allowHttp: Boolean): String {
        val uri = runCatching { URI(value.trim()) }.getOrNull()
        require(
            uri != null && !uri.host.isNullOrBlank() && uri.userInfo == null &&
                uri.query == null && uri.fragment == null && uri.path.orEmpty() in listOf("", "/") &&
                (uri.scheme == "https" || (allowHttp && uri.scheme == "http"))
        ) {
            "Ingresa la dirección del gateway, sin rutas ni credenciales."
        }
        return value.trim().trimEnd('/')
    }

    fun amount(value: String): BigDecimal {
        val text = value.trim().replace(',', '.')
        require(Regex("[0-9]{1,8}([.][0-9]{1,2})?").matches(text)) {
            "Ingresa un monto con hasta dos decimales."
        }
        return text.toBigDecimal().also {
            require(it > BigDecimal.ZERO) { "El monto debe ser mayor a cero." }
        }
    }

    fun expenseDate(value: String): LocalDate {
        val trimmed = value.trim()
        return runCatching { LocalDate.parse(trimmed) }.getOrElse {
            throw IllegalArgumentException("Ingresa una fecha válida en formato AAAA-MM-DD.")
        }
    }

    fun incidentType(value: String): String {
        val trimmed = value.trim()
        require(trimmed in VALID_INCIDENT_TYPES) {
            "Selecciona un tipo de incidencia válido."
        }
        return trimmed
    }

    fun incidentDescription(value: String): String {
        val trimmed = value.trim()
        require(trimmed.isNotEmpty()) {
            "Ingresa la descripción de la incidencia."
        }
        require(trimmed.length <= INCIDENT_DESCRIPTION_MAX_LENGTH) {
            "La descripción no puede superar los 500 caracteres."
        }
        return trimmed
    }
}
