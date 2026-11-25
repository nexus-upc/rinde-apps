package com.nexus.rinde.mobile.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

@Composable
fun RindeTheme(content: @Composable () -> Unit) {
    val scheme = if (isSystemInDarkTheme()) {
        darkColorScheme(
            primary = Color(0xFFB4C5FF),
            onPrimary = Color(0xFF002A78),
            background = Color(0xFF101318),
            onBackground = Color(0xFFE2E2E9),
            surface = Color(0xFF101318),
            onSurface = Color(0xFFE2E2E9),
            surfaceContainer = Color(0xFF1C2027),
        )
    } else {
        lightColorScheme(
            primary = Color(0xFF1D4ED8),
            onPrimary = Color.White,
            background = Color.White,
            onBackground = Color(0xFF0F172A),
            surface = Color.White,
            onSurface = Color(0xFF0F172A),
            surfaceContainer = Color(0xFFF1F5F9),
        )
    }
    MaterialTheme(colorScheme = scheme, content = content)
}
