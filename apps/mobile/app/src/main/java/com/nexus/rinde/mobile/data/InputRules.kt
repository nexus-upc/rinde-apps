package com.nexus.rinde.mobile.data

import java.math.BigDecimal
import java.net.URI

object InputRules {
    fun serverUrl(value: String, allowHttp: Boolean): String {
        val uri = runCatching { URI(value.trim()) }.getOrNull()
        require(uri != null && !uri.host.isNullOrBlank() && uri.userInfo == null &&
            uri.query == null && uri.fragment == null && uri.path.orEmpty() in listOf("", "/") &&
            (uri.scheme == "https" || (allowHttp && uri.scheme == "http"))) {
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
}
