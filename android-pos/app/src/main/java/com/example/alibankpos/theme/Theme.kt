package com.example.alibankpos.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val AliBankDarkColorScheme = darkColorScheme(
    primary = GoldPrimary,
    onPrimary = TextOnGold,
    primaryContainer = GoldDark,
    onPrimaryContainer = Color.White,
    secondary = GoldLight,
    onSecondary = TextOnGold,
    background = DarkBackground,
    onBackground = TextPrimary,
    surface = DarkSurface,
    onSurface = TextPrimary,
    surfaceVariant = DarkCard,
    onSurfaceVariant = TextSecondary,
    error = Error,
    onError = Color.White,
)

private val AliBankLightColorScheme = lightColorScheme(
    primary = GoldPrimary,
    onPrimary = TextOnGold,
    primaryContainer = GoldLight,
    onPrimaryContainer = TextOnGold,
    secondary = GoldDark,
    onSecondary = Color.White,
    background = LightBackground,
    onBackground = Color(0xFF1C1B1F),
    surface = LightSurface,
    onSurface = Color(0xFF1C1B1F),
    error = Error,
    onError = Color.White,
)

@Composable
fun AliBankPOSTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    // AliBank always uses dark theme for the native shell since the WebView app is dark-themed
    val colorScheme = AliBankDarkColorScheme

    MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}
