package com.nexus.rinde.mobile.data.local

data class SessionData(
    val serverUrl: String,
    val email: String,
    val userId: String,
    val role: String,
    val token: String,
    val expiresAtEpochSeconds: Long,
) {
    fun isExpired(nowEpochSeconds: Long = System.currentTimeMillis() / 1000L): Boolean =
        expiresAtEpochSeconds <= nowEpochSeconds + 30L
}

data class JwtClaims(
    val userId: String,
    val role: String,
    val expiresAtEpochSeconds: Long,
)

object JwtClaimsParser {
    fun parse(token: String): JwtClaims {
        val parts = token.split('.')
        require(parts.size >= 2) { "La respuesta de acceso no tiene el formato esperado." }
        val payloadJson = String(java.util.Base64.getUrlDecoder().decode(parts[1]), Charsets.UTF_8)
        val obj = org.json.JSONObject(payloadJson)
        val userId = obj.optString("sub").trim()
        val role = obj.optString("role").trim()
        val exp = obj.optLong("exp", 0L)
        require(userId.isNotBlank()) { "El acceso no incluye el identificador del usuario." }
        return JwtClaims(userId = userId, role = role, expiresAtEpochSeconds = exp)
    }
}
