package com.nexus.rinde.mobile.data.local

import org.json.JSONObject
import java.io.File

data class PushDeviceState(
    val currentToken: String? = null,
    val syncedToken: String? = null,
    val syncedUserId: String? = null,
    val syncedServerUrl: String? = null,
    val pendingRegistration: Boolean = false,
    val staleTokenToUnregister: String? = null,
    val staleTokenUserId: String? = null,
    val staleTokenServerUrl: String? = null,
)

interface PushDeviceStore {
    fun save(state: PushDeviceState)
    fun read(): PushDeviceState
    fun clear()
}

class EncryptedPushDeviceStore(
    private val file: File,
    private val cipher: SessionCipher,
) : PushDeviceStore {

    @Synchronized
    override fun save(state: PushDeviceState) {
        file.parentFile?.mkdirs()
        val json = JSONObject().apply {
            putOptional("currentToken", state.currentToken)
            putOptional("syncedToken", state.syncedToken)
            putOptional("syncedUserId", state.syncedUserId)
            putOptional("syncedServerUrl", state.syncedServerUrl)
            put("pendingRegistration", state.pendingRegistration)
            putOptional("staleTokenToUnregister", state.staleTokenToUnregister)
            putOptional("staleTokenUserId", state.staleTokenUserId)
            putOptional("staleTokenServerUrl", state.staleTokenServerUrl)
        }
        val encrypted = cipher.encrypt(json.toString().toByteArray(Charsets.UTF_8))
        val tmp = File(file.parentFile, "${file.name}.tmp")
        tmp.writeBytes(encrypted)
        if (!tmp.renameTo(file)) {
            file.writeBytes(encrypted)
            tmp.delete()
        }
    }

    @Synchronized
    override fun read(): PushDeviceState {
        if (!file.exists()) return PushDeviceState()
        return runCatching {
            val raw = cipher.decrypt(file.readBytes())
            val obj = JSONObject(String(raw, Charsets.UTF_8))
            PushDeviceState(
                currentToken = obj.optionalText("currentToken"),
                syncedToken = obj.optionalText("syncedToken"),
                syncedUserId = obj.optionalText("syncedUserId"),
                syncedServerUrl = obj.optionalText("syncedServerUrl"),
                pendingRegistration = obj.optBoolean("pendingRegistration", false),
                staleTokenToUnregister = obj.optionalText("staleTokenToUnregister"),
                staleTokenUserId = obj.optionalText("staleTokenUserId"),
                staleTokenServerUrl = obj.optionalText("staleTokenServerUrl"),
            )
        }.getOrDefault(PushDeviceState())
    }

    @Synchronized
    override fun clear() {
        if (file.exists()) {
            file.delete()
        }
    }

    private fun JSONObject.putOptional(key: String, value: String?) {
        if (!value.isNullOrBlank()) put(key, value)
    }

    private fun JSONObject.optionalText(key: String): String? =
        if (!has(key) || isNull(key)) null else optString(key).trim().ifBlank { null }
}
