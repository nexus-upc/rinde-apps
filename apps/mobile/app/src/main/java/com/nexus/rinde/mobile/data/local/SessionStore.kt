package com.nexus.rinde.mobile.data.local

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.json.JSONObject
import java.io.File
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

interface SessionCipher {
    fun encrypt(plainText: ByteArray): ByteArray
    fun decrypt(cipherText: ByteArray): ByteArray
}

interface SessionStore {
    fun save(session: SessionData)
    fun read(): SessionData?
    fun clear()
}

class AndroidKeystoreKeyProvider(
    private val alias: String = "rinde_session_aes_key",
) : () -> SecretKey {
    override fun invoke(): SecretKey {
        val keyStore = KeyStore.getInstance(KEYSTORE_TYPE).apply { load(null) }
        val existing = keyStore.getKey(alias, null) as? SecretKey
        if (existing != null) return existing
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE_TYPE)
        val spec = KeyGenParameterSpec.Builder(
            alias,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        generator.init(spec)
        return generator.generateKey()
    }

    private companion object {
        const val KEYSTORE_TYPE = "AndroidKeyStore"
    }
}

class AesGcmSessionCipher(
    private val keyProvider: () -> SecretKey,
) : SessionCipher {
    override fun encrypt(plainText: ByteArray): ByteArray {
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.ENCRYPT_MODE, keyProvider())
        val iv = cipher.iv
        val encrypted = cipher.doFinal(plainText)
        return ByteArray(2 + iv.size + encrypted.size).apply {
            this[0] = FORMAT_VERSION
            this[1] = iv.size.toByte()
            System.arraycopy(iv, 0, this, 2, iv.size)
            System.arraycopy(encrypted, 0, this, 2 + iv.size, encrypted.size)
        }
    }

    override fun decrypt(cipherText: ByteArray): ByteArray {
        require(cipherText.size > 4 && cipherText[0] == FORMAT_VERSION) {
            "Formato inválido de sesión almacenada."
        }
        val ivLength = cipherText[1].toInt() and 0xFF
        require(ivLength in 12..16 && cipherText.size > 2 + ivLength) {
            "Vector de cifrado inválido."
        }
        val iv = cipherText.copyOfRange(2, 2 + ivLength)
        val payload = cipherText.copyOfRange(2 + ivLength, cipherText.size)
        val cipher = Cipher.getInstance(TRANSFORMATION)
        cipher.init(Cipher.DECRYPT_MODE, keyProvider(), GCMParameterSpec(GCM_TAG_BITS, iv))
        return cipher.doFinal(payload)
    }

    private companion object {
        const val FORMAT_VERSION: Byte = 1
        const val GCM_TAG_BITS = 128
        const val TRANSFORMATION = "AES/GCM/NoPadding"
    }
}

class EncryptedSessionStore(
    private val file: File,
    private val cipher: SessionCipher,
) : SessionStore {

    @Synchronized
    override fun save(session: SessionData) {
        file.parentFile?.mkdirs()
        val json = JSONObject()
            .put("serverUrl", session.serverUrl)
            .put("email", session.email)
            .put("userId", session.userId)
            .put("role", session.role)
            .put("token", session.token)
            .put("expiresAtEpochSeconds", session.expiresAtEpochSeconds)
        val encrypted = cipher.encrypt(json.toString().toByteArray(Charsets.UTF_8))
        val tmp = File(file.parentFile, "${file.name}.tmp")
        tmp.writeBytes(encrypted)
        if (!tmp.renameTo(file)) {
            file.writeBytes(encrypted)
            tmp.delete()
        }
    }

    @Synchronized
    override fun read(): SessionData? {
        if (!file.exists()) return null
        return runCatching {
            val raw = cipher.decrypt(file.readBytes())
            val obj = JSONObject(String(raw, Charsets.UTF_8))
            val token = obj.getString("token")
            val userId = obj.getString("userId")
            val serverUrl = obj.getString("serverUrl")
            require(token.isNotBlank() && userId.isNotBlank() && serverUrl.isNotBlank())
            SessionData(
                serverUrl = serverUrl,
                email = obj.getString("email"),
                userId = userId,
                role = obj.getString("role"),
                token = token,
                expiresAtEpochSeconds = obj.getLong("expiresAtEpochSeconds"),
            )
        }.getOrNull()
    }

    @Synchronized
    override fun clear() {
        if (file.exists()) {
            file.delete()
        }
    }
}
