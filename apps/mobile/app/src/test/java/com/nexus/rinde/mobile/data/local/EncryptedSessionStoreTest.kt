package com.nexus.rinde.mobile.data.local

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class EncryptedSessionStoreTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private fun testKey(): SecretKey = KeyGenerator.getInstance("AES").apply {
        init(256)
    }.generateKey()

    private fun sampleSession(expiresAt: Long = 2_000_000_000L) = SessionData(
        serverUrl = "http://10.0.2.2:8000",
        email = "conductor@rinde.test",
        userId = "driver-user-1",
        role = "DRIVER",
        token = "header.payload.signature",
        expiresAtEpochSeconds = expiresAt,
    )

    @Test
    fun `guarda, lee y borra la sesion cifrada correctamente`() {
        val file = tempFolder.newFile("session.bin").apply { delete() }
        val key = testKey()
        val store = EncryptedSessionStore(file, AesGcmSessionCipher { key })
        val expected = sampleSession()

        store.save(expected)
        assertTrue(file.exists())
        val textContent = file.readBytes().toString(Charsets.ISO_8859_1)
        assertFalse(textContent.contains("conductor@rinde.test"))
        assertFalse(textContent.contains("header.payload.signature"))

        assertEquals(expected, store.read())

        store.clear()
        assertFalse(file.exists())
        assertNull(store.read())
    }

    @Test
    fun `rechaza archivo manipulado sin exponer ni aceptar datos alterados`() {
        val file = tempFolder.newFile("tampered.bin").apply { delete() }
        val key = testKey()
        val store = EncryptedSessionStore(file, AesGcmSessionCipher { key })
        store.save(sampleSession())

        val bytes = file.readBytes()
        val targetIndex = bytes.lastIndex - 1
        bytes[targetIndex] = (bytes[targetIndex].toInt() xor 0xFF).toByte()
        file.writeBytes(bytes)

        assertNull(store.read())
    }

    @Test
    fun `detecta vigencia y expiracion de token`() {
        val active = sampleSession(expiresAt = 1_000_200L)
        assertFalse(active.isExpired(nowEpochSeconds = 1_000_000L))
        assertTrue(active.isExpired(nowEpochSeconds = 1_000_180L))
        assertTrue(active.isExpired(nowEpochSeconds = 1_000_500L))
    }
}
