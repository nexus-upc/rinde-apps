package com.nexus.rinde.mobile.data.local

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.provider.OpenableColumns
import androidx.core.content.FileProvider
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.UUID
import kotlin.math.max

data class CapturedPhoto(
    val file: File,
    val fileName: String,
    val sizeBytes: Long,
)

interface PhotoAttachmentStore {
    suspend fun compressFromUri(uri: Uri, suggestedName: String? = null): CapturedPhoto
    fun deletePhoto(path: String?)
    fun deleteCacheFile(file: File?)
}

class ReceiptPhotoStore(private val context: Context) : PhotoAttachmentStore {
    private val receiptsDir: File
        get() = File(context.filesDir, "receipts").apply { mkdirs() }

    private val cameraCacheDir: File
        get() = File(context.cacheDir, "camera_captures").apply { mkdirs() }

    fun createCameraCaptureTarget(): Pair<File, Uri> {
        val targetFile = File(cameraCacheDir, "capture-${UUID.randomUUID()}.jpg")
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            targetFile,
        )
        return targetFile to uri
    }

    override suspend fun compressFromUri(uri: Uri, suggestedName: String?): CapturedPhoto =
        withContext(Dispatchers.IO) {
            val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            context.contentResolver.openInputStream(uri)?.use { input ->
                BitmapFactory.decodeStream(input, null, bounds)
            } ?: throw IllegalArgumentException("No pudimos leer la imagen seleccionada.")

            require(bounds.outWidth > 0 && bounds.outHeight > 0) {
                "El archivo seleccionado no es una imagen válida."
            }

            val sampleSize = calculateInSampleSize(bounds.outWidth, bounds.outHeight, MAX_DIMENSION_PX)
            val decodeOpts = BitmapFactory.Options().apply { inSampleSize = sampleSize }
            val decoded = context.contentResolver.openInputStream(uri)?.use { input ->
                BitmapFactory.decodeStream(input, null, decodeOpts)
            } ?: throw IllegalArgumentException("No pudimos procesar la foto del comprobante.")

            val rotated = applyExifRotation(uri, decoded)
            val scaled = scaleDownIfNeeded(rotated, MAX_DIMENSION_PX)
            val jpegBytes = compressWithinLimit(scaled)

            if (scaled !== rotated) scaled.recycle()
            if (rotated !== decoded) rotated.recycle()
            decoded.recycle()

            val fileId = UUID.randomUUID().toString()
            val destination = File(receiptsDir, "$fileId.jpg")
            destination.writeBytes(jpegBytes)

            val displayName = resolveFileName(uri, suggestedName)
            CapturedPhoto(
                file = destination,
                fileName = displayName,
                sizeBytes = destination.length(),
            )
        }

    override fun deletePhoto(path: String?) {
        if (path.isNullOrBlank()) return
        runCatching { File(path).delete() }
    }

    override fun deleteCacheFile(file: File?) {
        if (file == null) return
        runCatching { file.delete() }
    }

    private fun applyExifRotation(uri: Uri, source: Bitmap): Bitmap {
        val orientation = context.contentResolver.openInputStream(uri)?.use { input ->
            ExifInterface(input).getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL,
            )
        } ?: ExifInterface.ORIENTATION_NORMAL

        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.preScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.preScale(1f, -1f)
            else -> return source
        }
        return Bitmap.createBitmap(source, 0, 0, source.width, source.height, matrix, true)
    }

    private fun scaleDownIfNeeded(bitmap: Bitmap, maxDimension: Int): Bitmap {
        val longest = max(bitmap.width, bitmap.height)
        if (longest <= maxDimension) return bitmap
        val ratio = maxDimension.toFloat() / longest.toFloat()
        val width = (bitmap.width * ratio).toInt().coerceAtLeast(1)
        val height = (bitmap.height * ratio).toInt().coerceAtLeast(1)
        return Bitmap.createScaledBitmap(bitmap, width, height, true)
    }

    private fun compressWithinLimit(bitmap: Bitmap): ByteArray {
        val out = ByteArrayOutputStream()
        for (quality in listOf(80, 70, 60, 50)) {
            out.reset()
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
            if (out.size() <= MAX_OUTPUT_BYTES) {
                return out.toByteArray()
            }
        }
        return out.toByteArray()
    }

    private fun resolveFileName(uri: Uri, fallback: String?): String {
        val queried = context.contentResolver.query(
            uri,
            arrayOf(OpenableColumns.DISPLAY_NAME),
            null,
            null,
            null,
        )?.use { cursor ->
            if (cursor.moveToFirst()) cursor.getString(0) else null
        }
        val base = (queried ?: fallback ?: "comprobante.jpg")
            .substringBeforeLast('.')
            .replace(Regex("[^A-Za-z0-9._-]"), "-")
            .trim('-')
            .ifBlank { "comprobante" }
        return "$base.jpg"
    }

    private fun calculateInSampleSize(width: Int, height: Int, targetMax: Int): Int {
        var sample = 1
        val longest = max(width, height)
        while (longest / (sample * 2) >= targetMax) {
            sample *= 2
        }
        return sample
    }

    private companion object {
        const val MAX_DIMENSION_PX = 1600
        const val MAX_OUTPUT_BYTES = 4_500_000
    }
}
