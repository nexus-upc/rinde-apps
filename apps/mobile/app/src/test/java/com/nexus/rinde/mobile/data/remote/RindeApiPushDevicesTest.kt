package com.nexus.rinde.mobile.data.remote

import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import java.io.BufferedInputStream
import java.io.ByteArrayOutputStream
import java.io.DataInputStream
import java.net.InetAddress
import java.net.ServerSocket
import java.net.SocketException
import kotlin.concurrent.thread

class RindeApiPushDevicesTest {

    private lateinit var server: ServerSocket
    private var lastMethod: String = ""
    private var lastRawPath: String = ""
    private var lastAuthHeader: String = ""
    private var lastContentType: String = ""
    private var lastBody: String = ""
    private var nextStatus: Int = 204
    private var nextResponseBody: String = ""

    @Before
    fun setUp() {
        server = ServerSocket(0, 5, InetAddress.getLoopbackAddress())
        thread(isDaemon = true) {
            while (!server.isClosed) {
                val socket = try {
                    server.accept()
                } catch (_: SocketException) {
                    break
                }
                socket.use { client ->
                    val input = BufferedInputStream(client.getInputStream())
                    val requestLine = readHttpLine(input) ?: return@use
                    val parts = requestLine.split(' ')
                    lastMethod = parts.getOrElse(0) { "" }
                    lastRawPath = parts.getOrElse(1) { "" }

                    val headers = mutableMapOf<String, String>()
                    while (true) {
                        val line = readHttpLine(input) ?: break
                        if (line.isEmpty()) break
                        val colon = line.indexOf(':')
                        if (colon > 0) {
                            val name = line.substring(0, colon).trim().lowercase()
                            val value = line.substring(colon + 1).trim()
                            headers[name] = value
                        }
                    }
                    lastAuthHeader = headers["authorization"].orEmpty()
                    lastContentType = headers["content-type"].orEmpty()

                    val contentLength = headers["content-length"]?.toIntOrNull() ?: 0
                    lastBody = if (contentLength > 0) {
                        val bodyBytes = ByteArray(contentLength)
                        DataInputStream(input).readFully(bodyBytes)
                        String(bodyBytes, Charsets.UTF_8)
                    } else {
                        ""
                    }

                    val out = client.getOutputStream()
                    if (nextStatus == 204) {
                        out.write("HTTP/1.1 204 No Content\r\nConnection: close\r\n\r\n".toByteArray(Charsets.US_ASCII))
                    } else {
                        val bodyBytes = nextResponseBody.toByteArray(Charsets.UTF_8)
                        val header = "HTTP/1.1 $nextStatus Error\r\n" +
                            "Content-Type: application/json; charset=utf-8\r\n" +
                            "Content-Length: ${bodyBytes.size}\r\n" +
                            "Connection: close\r\n\r\n"
                        out.write(header.toByteArray(Charsets.US_ASCII))
                        out.write(bodyBytes)
                    }
                    out.flush()
                }
            }
        }
    }

    @After
    fun tearDown() {
        server.close()
    }

    private fun readHttpLine(input: BufferedInputStream): String? {
        val buffer = ByteArrayOutputStream()
        while (true) {
            val next = input.read()
            if (next == -1) {
                return if (buffer.size() == 0) null else buffer.toString(Charsets.US_ASCII.name())
            }
            if (next == '\n'.code) {
                val raw = buffer.toByteArray()
                val end = if (raw.isNotEmpty() && raw.last() == '\r'.code.toByte()) raw.size - 1 else raw.size
                return String(raw, 0, end, Charsets.US_ASCII)
            }
            buffer.write(next)
        }
    }

    private fun baseUrl(): String = "http://127.0.0.1:${server.localPort}"

    @Test
    fun `registerDevice envia POST C5 con payload y bearer token`() = runTest {
        nextStatus = 204
        val api = RindeApi(server = baseUrl(), token = "jwt-driver-1")

        api.registerDevice(RegisterDeviceRequest(token = "fcm-token-01"))

        assertEquals("POST", lastMethod)
        assertEquals("/api/v1/notifications/devices", lastRawPath)
        assertEquals("Bearer jwt-driver-1", lastAuthHeader)
        assertEquals("application/json; charset=utf-8", lastContentType)
        val json = JSONObject(lastBody)
        assertEquals("fcm-token-01", json.getString("token"))
        assertEquals("ANDROID", json.getString("platform"))
    }

    @Test
    fun `removeDevice envia DELETE C5 con codificacion segura del segmento token`() = runTest {
        nextStatus = 204
        val api = RindeApi(server = baseUrl(), token = "jwt-driver-1")
        val rawToken = "tok:abc/123+45?a#b c"

        api.removeDevice(rawToken)

        assertEquals("DELETE", lastMethod)
        assertEquals("/api/v1/notifications/devices/tok%3Aabc%2F123%2B45%3Fa%23b%20c", lastRawPath)
        assertEquals("Bearer jwt-driver-1", lastAuthHeader)
    }

    @Test
    fun `registerDevice propaga ApiException cuando el servidor responde error`() {
        nextStatus = 400
        nextResponseBody = """{"status":400,"detail":"El token del dispositivo es obligatorio."}"""
        val api = RindeApi(server = baseUrl(), token = "jwt-driver-1")

        val ex = assertThrows(ApiException::class.java) {
            kotlinx.coroutines.runBlocking {
                api.registerDevice(RegisterDeviceRequest(token = "invalido"))
            }
        }
        assertEquals(400, ex.status)
        assertEquals("El token del dispositivo es obligatorio.", ex.message)
    }
}
