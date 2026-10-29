# AliBank POS ProGuard Rules

# Keep the JavaScript bridge interface accessible
-keepclassmembers class com.example.alibankpos.MainActivity$AndroidNfcBridge {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep WebView JS interface
-keepattributes JavascriptInterface

# Keep Compose runtime
-keep class androidx.compose.** { *; }

# Keep BiometricPrompt classes
-keep class androidx.biometric.** { *; }

# General Android rules
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-dontwarn okhttp3.**
-dontwarn okio.**

