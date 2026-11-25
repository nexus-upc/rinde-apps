package com.nexus.rinde.mobile.data.local

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey

class EncryptedPushDeviceStoreTest {

    @get:Rule
    val tempFolder = TemporaryFolder()

    private fun testKey(): SecretKey = KeyGenerator.getInstance("AES").apply {
        init(256)
    }.generateKey()

    @Test
    fun `guarda, lee y borra el estado del dispositivo push cifrado`() {
        val file = tempFolder.newFile("push_device.bin").apply { delete() }
        val key = testKey()
        val store = EncryptedPushDeviceStore(file, AesGcmSessionCipher { key })
        val expected = PushDeviceState(
            currentToken = "fcm-token-secreto-01",
            syncedToken = "fcm-token-secreto-01",
            syncedUserId = "driver-1",
            syncedServerUrl = "https://api.rinde.test",
            pendingRegistration = false,
            staleTokenToUnregister = "fcm-token-anterior-00",
            staleTokenUserId = "driver-1",
            staleTokenServerUrl = "https://api.rinde.test",
        )

        store.save(expected)
        assertTrue(file.exists())
        val rawText = file.readBytes().toString(Charsets.ISO_8859_1)
        assertFalse(rawText.contains("fcm-token-secreto-01"))
        assertFalse(rawText.contains("fcm-token-anterior-00"))

        assertEquals(expected, store.read())

        store.clear()
        assertFalse(file.exists())
        assertEquals(PushDeviceState(), store.read())
    }

    @Test
    fun `archivo alterado devuelve estado vacio sin aceptar datos corruptos`() {
        val file = tempFolder.newFile("push_tampered.bin").apply { delete() }
        val key = testKey()
        val store = EncryptedPushDeviceStore(file, AesGcmSessionCipher { key })
        store.save(PushDeviceState(currentToken = "fcm-token-1", syncedToken = "fcm-token-1"))

        val bytes = file.readBytes()
        val idx = bytes.lastIndex - 1
        bytes[idx] = (bytes[idx].toInt() xor 0xFF).toByte()
        file.writeBytes(bytes)

        assertEquals(PushDeviceState(), store.read())
    }
}
