package com.nexus.rinde.mobile.data.local

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.ByteArrayInputStream

class ReceiptPhotoStoreTest {

    private class TrackedInputStream(bytes: ByteArray = byteArrayOf(1, 2, 3)) :
        ByteArrayInputStream(bytes) {
        var closed = false

        override fun close() {
            closed = true
            super.close()
        }
    }

    @Test
    fun `readImageBounds acepta retorno null de decodeStream con inJustDecodeBounds y cierra el stream`() {
        val stream = TrackedInputStream()

        val bounds = ReceiptPhotoCodec.readImageBounds(
            openStream = { stream },
            decodeBounds = { _, holder ->
                holder.width = 4032
                holder.height = 3024
                null
            },
        )

        assertEquals(ImageBounds(4032, 3024), bounds)
        assertTrue(stream.closed)
    }

    @Test
    fun `readImageBounds falla si openStream devuelve null`() {
        val error = assertThrows(IllegalArgumentException::class.java) {
            ReceiptPhotoCodec.readImageBounds(
                openStream = { null },
                decodeBounds = { _, _ -> null },
            )
        }

        assertEquals("No pudimos leer la imagen seleccionada.", error.message)
    }

    @Test
    fun `readImageBounds rechaza dimensiones invalidas y cierra el stream`() {
        val stream = TrackedInputStream()

        val error = assertThrows(IllegalArgumentException::class.java) {
            ReceiptPhotoCodec.readImageBounds(
                openStream = { stream },
                decodeBounds = { _, holder ->
                    holder.width = -1
                    holder.height = -1
                    null
                },
            )
        }

        assertEquals("El archivo seleccionado no es una imagen válida.", error.message)
        assertTrue(stream.closed)
    }

    @Test
    fun `calculateInSampleSize calcula potencias de dos segun el lado mayor`() {
        assertEquals(1, ReceiptPhotoCodec.calculateInSampleSize(800, 600, 1600))
        assertEquals(1, ReceiptPhotoCodec.calculateInSampleSize(1600, 1200, 1600))
        assertEquals(1, ReceiptPhotoCodec.calculateInSampleSize(3199, 2000, 1600))
        assertEquals(2, ReceiptPhotoCodec.calculateInSampleSize(3200, 2400, 1600))
        assertEquals(2, ReceiptPhotoCodec.calculateInSampleSize(4032, 3024, 1600))
        assertEquals(4, ReceiptPhotoCodec.calculateInSampleSize(6400, 4800, 1600))
        assertEquals(2, ReceiptPhotoCodec.calculateInSampleSize(1200, 4800, 1600))
    }

    @Test
    fun `flujo de dos pasadas lee dimensiones con retorno null y decodifica con inSampleSize`() {
        val openedStreams = mutableListOf<TrackedInputStream>()
        var capturedSampleSize = 0

        val bounds = ReceiptPhotoCodec.readImageBounds(
            openStream = {
                TrackedInputStream().also { openedStreams += it }
            },
            decodeBounds = { _, holder ->
                holder.width = 4032
                holder.height = 3024
                null
            },
        )

        val decoded = ReceiptPhotoCodec.decodeSampledBitmap(
            openStream = {
                TrackedInputStream().also { openedStreams += it }
            },
            bounds = bounds,
            maxDimension = 1600,
            decodeBitmap = { _, sampleSize ->
                capturedSampleSize = sampleSize
                "bitmap-ok"
            },
        )

        assertEquals("bitmap-ok", decoded)
        assertEquals(2, capturedSampleSize)
        assertEquals(2, openedStreams.size)
        assertTrue(openedStreams.all { it.closed })
    }

    @Test
    fun `decodeSampledBitmap falla si el stream es null o la decodificacion devuelve null`() {
        val bounds = ImageBounds(2000, 1500)

        val nullStreamError = assertThrows(IllegalArgumentException::class.java) {
            ReceiptPhotoCodec.decodeSampledBitmap<String>(
                openStream = { null },
                bounds = bounds,
                decodeBitmap = { _, _ -> "unused" },
            )
        }
        assertEquals("No pudimos procesar la foto del comprobante.", nullStreamError.message)

        val stream = TrackedInputStream()
        val nullBitmapError = assertThrows(IllegalArgumentException::class.java) {
            ReceiptPhotoCodec.decodeSampledBitmap<String>(
                openStream = { stream },
                bounds = bounds,
                decodeBitmap = { _, _ -> null },
            )
        }
        assertEquals("No pudimos procesar la foto del comprobante.", nullBitmapError.message)
        assertTrue(stream.closed)
    }

    @Test
    fun `sanitizeFileName normaliza nombres y aplica respaldo jpg`() {
        assertEquals("boleta-peaje-01.jpg", ReceiptPhotoCodec.sanitizeFileName("boleta peaje 01.png"))
        assertEquals("comprobante.jpg", ReceiptPhotoCodec.sanitizeFileName(null))
        assertEquals("comprobante.jpg", ReceiptPhotoCodec.sanitizeFileName("   .jpg"))
    }
}
