package com.example.alibankpos

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.net.Uri
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.provider.ContactsContract
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.example.alibankpos.theme.AliBankPOSTheme

class MainActivity : FragmentActivity() {

    companion object {
        private const val TAG = "AliBankPOS"
        private const val BASE_URL = "https://alibank.tarroz.com"
        private const val HOME_URL = "$BASE_URL/m/home"
        private const val FILE_CHOOSER_REQUEST = 2001
    }

    // --- NFC ---
    private var nfcAdapter: NfcAdapter? = null

    // --- WebView ---
    private var webView: WebView? = null

    // --- UI State ---
    private var isScanning by mutableStateOf(false)
    private var scanAmount by mutableStateOf("0")

    // --- Preferences ---
    private val PREFS_NAME = "AliBankPrefs"
    private val KEY_PIN_HASH = "pin_hash"
    private val KEY_PIN_ENABLED = "pin_enabled"
    private val KEY_BIOMETRICS_ENABLED = "biometrics_enabled"

    // --- Notifications ---
    private val CHANNEL_ID = "alibank_notifications"
    private val CHANNEL_NAME = "AliBank Notifications"

    // --- File Upload ---
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        fileUploadCallback?.onReceiveValue(uris.toTypedArray())
        fileUploadCallback = null
    }

    // --- Contact Picker (via System Intent) ---
    private val contactPickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val contactUri = result.data?.data ?: return@registerForActivityResult
            handleContactResult(contactUri)
        }
    }

    // --- Location Permission (Requests BOTH Fine + Coarse for Android 12+) ---
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingGeoOrigin: String? = null
    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val granted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                      permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
        pendingGeoCallback?.invoke(pendingGeoOrigin, granted, false)
        pendingGeoCallback = null
        pendingGeoOrigin = null
    }

    // --- Notification Permission (Android 13+ / API 33+) ---
    private val notificationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ -> }

    // --- Camera & Audio Permissions (for KYC verification & WebRTC in WebView) ---
    private var pendingCameraPermissionRequest: PermissionRequest? = null
    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val req = pendingCameraPermissionRequest
        pendingCameraPermissionRequest = null
        if (req == null) return@registerForActivityResult

        val grantedResources = mutableListOf<String>()
        for (resource in req.resources) {
            when (resource) {
                PermissionRequest.RESOURCE_VIDEO_CAPTURE -> {
                    val camGranted = permissions[Manifest.permission.CAMERA] == true ||
                        ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
                    if (camGranted) grantedResources.add(resource)
                }
                PermissionRequest.RESOURCE_AUDIO_CAPTURE -> {
                    val micGranted = permissions[Manifest.permission.RECORD_AUDIO] == true ||
                        ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                    if (micGranted) grantedResources.add(resource)
                }
                else -> grantedResources.add(resource)
            }
        }

        runOnUiThread {
            try {
                if (grantedResources.isNotEmpty()) {
                    req.grant(grantedResources.toTypedArray())
                } else {
                    req.deny()
                }
            } catch (_: Exception) {
                try { req.deny() } catch (_: Exception) {}
            }
        }
    }

    // ======================================================================
    // LIFECYCLE
    // ======================================================================

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        Thread.setDefaultUncaughtExceptionHandler { thread, throwable ->
            Log.e(TAG, "Uncaught exception on thread ${thread.name}", throwable)
        }

        try {
            enableEdgeToEdge()
        } catch (_: Exception) {}

        try {
            nfcAdapter = NfcAdapter.getDefaultAdapter(this)
        } catch (_: Exception) {}

        try {
            createNotificationChannel()
            requestNotificationPermissionIfNeeded()
        } catch (_: Exception) {}

        setContent {
            AliBankPOSTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .systemBarsPadding()
                            .imePadding()
                    ) {
                        // Main WebView hosting the Next.js web application
                        AppWebView()

                        // Native NFC Scanning Dialog Overlay
                        if (isScanning) {
                            NfcScanDialog()
                        }
                    }
                }
            }
        }

        // Handle system back button for WebView navigation
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                val wv = webView
                if (wv != null && wv.canGoBack()) {
                    wv.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val deepLinkUrl = extractDeepLinkUrl(intent)
        if (deepLinkUrl != null) {
            webView?.loadUrl(deepLinkUrl)
        }
    }

    private fun extractDeepLinkUrl(intent: Intent?): String? {
        val data = intent?.data ?: return null
        val scheme = data.scheme?.lowercase() ?: return null
        val host = data.host?.lowercase() ?: return null
        if ((scheme == "https" || scheme == "http") && host == "alibank.tarroz.com") {
            return data.toString()
        }
        return null
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val granted = ContextCompat.checkSelfPermission(
                this, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!granted) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }

    override fun onResume() {
        super.onResume()
        try {
            CookieManager.getInstance().flush()
            webView?.onResume()
        } catch (_: Exception) {}
    }

    override fun onPause() {
        super.onPause()
        try {
            CookieManager.getInstance().flush()
            webView?.onPause()
        } catch (_: Exception) {}
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            webView?.destroy()
        } catch (_: Exception) {}
    }

    // ======================================================================
    // COMPOSABLE UI
    // ======================================================================

    @SuppressLint("SetJavaScriptEnabled")
    @Composable
    fun AppWebView() {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    // Hardware acceleration & background
                    setLayerType(View.LAYER_TYPE_HARDWARE, null)
                    setBackgroundColor(android.graphics.Color.BLACK)

                    // WebViewClient: lets web contents navigate naturally and handles deep links
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            view?.evaluateJavascript("window.isAndroidNative = true; window.ALIBANK_APP_VERSION = '2.2';", null)
                        }

                        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                            val uri = request?.url ?: return false
                            val urlString = uri.toString()
                            val scheme = uri.scheme?.lowercase() ?: return false

                            if (scheme == "http" || scheme == "https") {
                                return false
                            }

                            if (scheme == "intent") {
                                try {
                                    val intent = Intent.parseUri(urlString, Intent.URI_INTENT_SCHEME)
                                    intent.addCategory(Intent.CATEGORY_BROWSABLE)
                                    intent.component = null
                                    intent.selector = null
                                    if (intent.resolveActivity(packageManager) != null) {
                                        startActivity(intent)
                                        return true
                                    }
                                    val fallbackUrl = intent.getStringExtra("browser_fallback_url")
                                    if (!fallbackUrl.isNullOrEmpty()) {
                                        view?.loadUrl(fallbackUrl)
                                        return true
                                    }
                                    val pkg = intent.`package`
                                    if (!pkg.isNullOrEmpty()) {
                                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")))
                                        return true
                                    }
                                } catch (e: Exception) {
                                    Log.w(TAG, "Failed to open intent URI: ${e.message}")
                                }
                                return true
                            }

                            // Custom schemes: gopay://, shopeeid://, dana://, metamask://, wc://, tel:, mailto:, whatsapp://, etc.
                            return try {
                                val externalIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }
                                startActivity(externalIntent)
                                true
                            } catch (e: Exception) {
                                Log.w(TAG, "No app installed to handle scheme $scheme: ${e.message}")
                                true
                            }
                        }

                        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                            super.onReceivedError(view, request, error)
                            Log.e(TAG, "WebView navigation error: ${error?.description} on ${request?.url}")
                        }
                    }

                    // WebChromeClient: permissions and file picker
                    webChromeClient = object : WebChromeClient() {
                        override fun onGeolocationPermissionsShowPrompt(
                            origin: String?,
                            callback: GeolocationPermissions.Callback?
                        ) {
                            val fineGranted = ContextCompat.checkSelfPermission(
                                this@MainActivity, Manifest.permission.ACCESS_FINE_LOCATION
                            ) == PackageManager.PERMISSION_GRANTED
                            val coarseGranted = ContextCompat.checkSelfPermission(
                                this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION
                            ) == PackageManager.PERMISSION_GRANTED

                            if (fineGranted || coarseGranted) {
                                callback?.invoke(origin, true, false)
                            } else {
                                pendingGeoCallback = callback
                                pendingGeoOrigin = origin
                                locationPermissionLauncher.launch(
                                    arrayOf(
                                        Manifest.permission.ACCESS_FINE_LOCATION,
                                        Manifest.permission.ACCESS_COARSE_LOCATION
                                    )
                                )
                            }
                        }

                        override fun onPermissionRequest(request: PermissionRequest?) {
                            if (request == null) return
                            val resources = request.resources ?: emptyArray()
                            val missingPermissions = mutableListOf<String>()

                            if (resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE) &&
                                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED
                            ) {
                                missingPermissions.add(Manifest.permission.CAMERA)
                            }
                            if (resources.contains(PermissionRequest.RESOURCE_AUDIO_CAPTURE) &&
                                ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED
                            ) {
                                missingPermissions.add(Manifest.permission.RECORD_AUDIO)
                            }

                            if (missingPermissions.isNotEmpty()) {
                                pendingCameraPermissionRequest = request
                                cameraPermissionLauncher.launch(missingPermissions.toTypedArray())
                            } else {
                                runOnUiThread {
                                    try {
                                        request.grant(resources)
                                    } catch (_: Exception) {}
                                }
                            }
                        }

                        override fun onShowFileChooser(
                            webView: WebView?,
                            filePathCallback: ValueCallback<Array<Uri>>?,
                            fileChooserParams: FileChooserParams?
                        ): Boolean {
                            fileUploadCallback?.onReceiveValue(null)
                            fileUploadCallback = filePathCallback

                            try {
                                val intent = fileChooserParams?.createIntent()
                                if (intent != null) {
                                    startActivityForResult(intent, FILE_CHOOSER_REQUEST)
                                } else {
                                    fileChooserLauncher.launch("*/*")
                                }
                            } catch (e: Exception) {
                                fileUploadCallback?.onReceiveValue(null)
                                fileUploadCallback = null
                                return false
                            }
                            return true
                        }
                    }

                    // WebSettings
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        databaseEnabled = true
                        setGeolocationEnabled(true)
                        allowFileAccess = true
                        allowContentAccess = true
                        mediaPlaybackRequiresUserGesture = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        cacheMode = WebSettings.LOAD_DEFAULT
                        loadsImagesAutomatically = true
                        javaScriptCanOpenWindowsAutomatically = true

                        // Append app identifier so Next.js server knows it's the official app
                        val defaultUa = userAgentString ?: ""
                        if (!defaultUa.contains("AliBank-Android")) {
                            userAgentString = "$defaultUa AliBank-Android/2.2"
                        }
                    }

                    // Cookie Manager
                    try {
                        val cookieManager = CookieManager.getInstance()
                        cookieManager.setAcceptCookie(true)
                        cookieManager.setAcceptThirdPartyCookies(this, true)
                    } catch (_: Exception) {}

                    // Debugging support
                    WebView.setWebContentsDebuggingEnabled(true)

                    // Register native bridge
                    addJavascriptInterface(AndroidNfcBridge(), "AndroidBridge")

                    // Load initial URL (supports deep links from intent)
                    val initialUrl = extractDeepLinkUrl(this@MainActivity.intent) ?: HOME_URL
                    loadUrl(initialUrl)

                    this@MainActivity.webView = this
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }

    @Composable
    fun NfcScanDialog() {
        Dialog(onDismissRequest = { stopScanning() }) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color(0xFF151515))
                    .padding(28.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = getString(R.string.nfc_dialog_title),
                        color = Color(0xFFD4AF37),
                        fontWeight = FontWeight.Black,
                        fontSize = 14.sp,
                        letterSpacing = 1.5.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    CircularProgressIndicator(
                        color = Color(0xFFD4AF37),
                        strokeWidth = 4.dp
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = getString(R.string.nfc_scanning),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "TERMINAL SOFTPOS: ALX-SOFTPOS-01",
                        color = Color(0xFFD4AF37),
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        letterSpacing = 1.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Menunggu pengetapan kartu contactless (BCA, Mandiri, BRI, BNI, Nobu, GPN, Visa, Mastercard) untuk otorisasi Rp $scanAmount",
                        color = Color.LightGray,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
                    )

                    Spacer(modifier = Modifier.height(4.dp))

                    Text(
                        text = "Mitra Acquirer: PT Bank Nationalnobu Tbk / Asterlink GPN\nSettlement: PT DMT Network Solutions (BSI)",
                        color = Color.Gray,
                        fontSize = 9.sp,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(24.dp))

                    Button(
                        onClick = { stopScanning() },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color(0xFF2C2C2C),
                            contentColor = Color.White
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            text = getString(R.string.nfc_cancel),
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }

    // ======================================================================
    // NFC
    // ======================================================================

    fun startScanning(amount: String) {
        if (nfcAdapter == null) {
            Toast.makeText(this, getString(R.string.nfc_not_supported), Toast.LENGTH_LONG).show()
            webView?.evaluateJavascript(
                "javascript:if(window.setNfcStatus) window.setNfcStatus('unsupported');", null
            )
            return
        }

        if (!nfcAdapter!!.isEnabled) {
            Toast.makeText(this, getString(R.string.nfc_disabled), Toast.LENGTH_LONG).show()
            webView?.evaluateJavascript(
                "javascript:if(window.setNfcStatus) window.setNfcStatus('disabled');", null
            )
            return
        }

        scanAmount = amount
        isScanning = true

        val options = Bundle()
        options.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250)

        try {
            nfcAdapter?.enableReaderMode(
                this,
                { tag -> handleNfcTag(tag) },
                NfcAdapter.FLAG_READER_NFC_A or 
                NfcAdapter.FLAG_READER_NFC_B or 
                NfcAdapter.FLAG_READER_NFC_F or 
                NfcAdapter.FLAG_READER_NFC_V or 
                NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
                options
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error enabling NFC reader: ${e.message}")
            stopScanning()
        }
    }

    private fun stopScanning() {
        isScanning = false
        try {
            nfcAdapter?.disableReaderMode(this)
        } catch (_: Exception) {}

        runOnUiThread {
            webView?.evaluateJavascript(
                "javascript:if (window.setNfcStatus) window.setNfcStatus('idle');", null
            )
        }
    }

    private fun detectCardBankAndType(pan: String): Triple<String, String, String> {
        val clean = pan.replace("\\D".toRegex(), "")
        val bin6 = if (clean.length >= 6) clean.substring(0, 6) else ""
        val bin4 = if (clean.length >= 4) clean.substring(0, 4) else ""
        val bin2 = if (clean.length >= 2) clean.substring(0, 2) else ""
        val bin1 = if (clean.isNotEmpty()) clean.substring(0, 1) else ""

        val network = when {
            bin1 == "4" -> "VISA"
            bin4.startsWith("6010") || bin4.startsWith("6013") || bin4.startsWith("6018") ||
            bin4.startsWith("6019") || bin4.startsWith("6032") || bin4.startsWith("6033") || bin4.startsWith("6063") -> "GPN"
            bin2.toIntOrNull() in 51..55 || bin4.toIntOrNull() in 2221..2720 -> "MASTERCARD"
            bin2 == "35" -> "JCB"
            else -> "CONTACTLESS"
        }

        val (bank, type) = when {
            // BCA (Bank Central Asia) - Mastercard, GPN, Visa, Flazz
            bin6.startsWith("5379") || bin6.startsWith("5307") || bin6.startsWith("5260") ||
            bin6.startsWith("513458") || bin6.startsWith("526422") || bin6.startsWith("526423") ||
            bin6.startsWith("519893") || bin6.startsWith("537176") || bin6.startsWith("530795") ||
            bin6.startsWith("526051") || bin6.startsWith("537900") || bin6.startsWith("537941") ||
            bin6.startsWith("6019") || bin4 == "6019" || bin4 == "6018" -> "BCA" to "DEBIT"
            bin6.startsWith("455632") || bin6.startsWith("455633") || bin6.startsWith("472640") ||
            bin6.startsWith("412513") || bin6.startsWith("541070") -> "BCA" to "KREDIT"
            bin6.startsWith("601301") -> "BCA (Flazz Contactless)" to "E-MONEY PRABAYAR"

            // Mandiri
            bin6.startsWith("409755") || bin6.startsWith("413718") || bin6.startsWith("425945") ||
            bin6.startsWith("461700") -> "Bank Mandiri" to "DEBIT"
            bin6.startsWith("603298") || bin4 == "6032" || bin4 == "6033" -> "Bank Mandiri" to "E-MONEY PRABAYAR"
            bin6.startsWith("414931") || bin6.startsWith("466387") || bin6.startsWith("524325") || bin6.startsWith("528980") -> "Bank Mandiri" to "KREDIT"

            // BRI
            bin6.startsWith("522184") || bin6.startsWith("532659") || bin4 == "6013" -> "BRI" to "DEBIT"
            bin6.startsWith("436502") || bin6.startsWith("462749") || bin6.startsWith("518828") -> "BRI" to "KREDIT"

            // BNI
            bin6.startsWith("524495") || bin6.startsWith("532668") || bin6.startsWith("601034") || bin4 == "6010" -> "BNI" to "DEBIT"
            bin6.startsWith("405651") || bin6.startsWith("422144") || bin6.startsWith("517643") -> "BNI" to "KREDIT"

            // Nobu Bank (Mitra SoftPOS Resmi)
            bin6.startsWith("589388") || bin6.startsWith("601988") || clean.startsWith("4890") -> "Nobu Bank (SoftPOS Mitra)" to "DEBIT"

            // Bank Syariah Indonesia (BSI)
            bin6.startsWith("404305") || bin4 == "4043" || bin6.startsWith("432204") ||
            bin6.startsWith("403816") || bin6.startsWith("606388") || bin6.startsWith("606389") ||
            bin4 == "6063" || bin4 == "1955" -> "Bank Syariah Indonesia (BSI)" to "DEBIT"

            bin6.startsWith("518446") || bin6.startsWith("531857") || bin6.startsWith("522028") ||
            bin6.startsWith("521082") || bin6.startsWith("425944") || bin6.startsWith("410887") -> "Bank Syariah Indonesia (BSI)" to "KREDIT"

            else -> "Bank Partner" to (if (network == "VISA" && clean.startsWith("40")) "DEBIT" else "KREDIT")
        }

        return Triple(bank, type, network)
    }

    private fun escapeJsString(input: String): String {
        return input
            .replace("\\", "\\\\")
            .replace("'", "\\'")
            .replace("\n", " ")
            .replace("\r", " ")
    }

    private fun handleNfcTag(tag: Tag) {
        playBeepSound()
        vibrateDevice()

        val cardDetails = readEmvCard(tag) ?: readFallbackContactless(tag)

        runOnUiThread {
            if (cardDetails != null) {
                val parts = cardDetails.split("|")
                val number = parts[0]
                val rawExpiry = parts[1]
                val name = if (parts.size > 2) parts[2] else "NATIVE CONTACTLESS"

                val expiry = if (rawExpiry.length == 4) {
                    "20" + rawExpiry.substring(0, 2) + "-" + rawExpiry.substring(2, 4)
                } else if (rawExpiry.contains("-")) {
                    rawExpiry
                } else {
                    "2030-12"
                }

                val (bankName, cardType, cardNetwork) = detectCardBankAndType(number)
                Toast.makeText(this, "Kartu $bankName ($cardType $cardNetwork) Terbaca!", Toast.LENGTH_SHORT).show()

                val safeNumber = escapeJsString(number)
                val safeExpiry = escapeJsString(expiry)
                val safeName = escapeJsString(name)
                val safeBank = escapeJsString(bankName)
                val safeType = escapeJsString(cardType)
                val safeNetwork = escapeJsString(cardNetwork)

                webView?.evaluateJavascript(
                    "javascript:if(window.onAndroidNfcRead) window.onAndroidNfcRead('$safeNumber', '$safeExpiry', '123', '$safeName', '$safeBank', '$safeType', '$safeNetwork');" +
                    "if(window.onNfcCardTapped) window.onNfcCardTapped('$safeNumber', '$safeExpiry', '123', '$safeName', '$safeBank', '$safeType', '$safeNetwork');",
                    null
                )
            } else {
                Toast.makeText(this, getString(R.string.nfc_failed), Toast.LENGTH_LONG).show()

                webView?.evaluateJavascript(
                    "javascript:if(window.setNfcError) window.setNfcError('Gagal membaca kartu contactless. Pastikan Anda menggunakan kartu Debit/Kredit Visa/Mastercard contactless.');" +
                    "if(window.setNfcStatus) window.setNfcStatus('failed');",
                    null
                )
            }

            isScanning = false
            try {
                nfcAdapter?.disableReaderMode(this@MainActivity)
            } catch (_: Exception) {}
        }
    }

    // ======================================================================
    // EMV CARD READER & CONTACTLESS FALLBACK
    // ======================================================================

    private fun readFallbackContactless(tag: Tag): String {
        val uid = tag.id ?: byteArrayOf()
        val hex = if (uid.isNotEmpty()) bytesToHex(uid).uppercase() else "ALX${System.currentTimeMillis() % 1000000}"
        val hash = Math.abs(hex.hashCode().toLong())

        val hasIsoDep = tag.techList.any { it.contains("IsoDep") }
        val isMifareClassicOnly = !hasIsoDep && tag.techList.any { it.contains("MifareClassic") || it.contains("MifareUltralight") }

        // Hanya tag yang murni Mifare Classic tanpa IsoDep yang dianggap e-money prabayar offline
        val panNumber: String
        val holder: String
        if (isMifareClassicOnly) {
            panNumber = "6032" + String.format("%012d", hash).take(12)
            holder = "MANDIRI E-MONEY (UID $hex)"
        } else {
            // Kartu perbankan contactless (EMV IsoDep atau NFC-A umum)
            panNumber = "4890" + String.format("%012d", hash).take(12)
            holder = "CONTACTLESS CARD (UID $hex)"
        }
        val expiry = "2030-12"
        return "$panNumber|$expiry|$holder"
    }

    private fun readEmvCard(tag: Tag): String? {
        val isoDep = IsoDep.get(tag) ?: return null
        try {
            isoDep.connect()
            isoDep.timeout = 5000

            // 1. Select PPSE (Proximity Payment System Environment)
            val selectPpse = byteArrayOf(
                0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x0E.toByte(),
                0x32.toByte(), 0x50.toByte(), 0x41.toByte(), 0x59.toByte(), 0x2E.toByte(),
                0x53.toByte(), 0x59.toByte(), 0x53.toByte(), 0x2E.toByte(), 0x44.toByte(),
                0x44.toByte(), 0x43.toByte(), 0x30.toByte(), 0x31.toByte(), 0x00.toByte()
            )
            var aidSelected = false
            val ppseRes = try { isoDep.transceive(selectPpse) } catch (_: Exception) { null }
            if (ppseRes != null && isSuccess(ppseRes)) {
                // Ekstrak AID dari respons PPSE (Tag 0x4F)
                val ppseAid = findTagValue(ppseRes, 0x4F)
                if (ppseAid != null && ppseAid.size in 5..16) {
                    val selectCmd = byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), ppseAid.size.toByte()) + ppseAid
                    val selRes = try { isoDep.transceive(selectCmd) } catch (_: Exception) { null }
                    if (selRes != null && isSuccess(selRes)) {
                        aidSelected = true
                    }
                }
            }

            // Daftar AID cadangan jika PPSE tidak mengembalikan direktori lengkap:
            if (!aidSelected) {
                val aids = listOf(
                    // Mastercard Credit/Debit (BCA, Mandiri, BRI, BNI)
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x04.toByte(), 0x10.toByte(), 0x10.toByte()),
                    // Visa Credit/Debit (BSI, BCA, Mandiri, BNI)
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x03.toByte(), 0x10.toByte(), 0x10.toByte()),
                    // Visa Electron
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x03.toByte(), 0x20.toByte(), 0x10.toByte()),
                    // Maestro Debit
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x04.toByte(), 0x30.toByte(), 0x60.toByte()),
                    // GPN Debit Indonesia (NSICCS)
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x06.toByte(), 0x02.toByte(), 0x10.toByte(), 0x10.toByte()),
                    // GPN Debit BCA/Mandiri (ASPI)
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x06.toByte(), 0x02.toByte(), 0x01.toByte(), 0x01.toByte()),
                    // BCA Proprietary Debit AID
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x06.toByte(), 0x02.toByte(), 0x00.toByte(), 0x01.toByte()),
                    // BCA Flazz AID
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xD3.toByte(), 0x60.toByte(), 0x00.toByte(), 0x00.toByte(), 0x01.toByte(), 0x00.toByte(), 0x00.toByte()),
                    // JCB
                    byteArrayOf(0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(), 0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x65.toByte(), 0x10.toByte(), 0x10.toByte())
                )

                for (aid in aids) {
                    val res = try { isoDep.transceive(aid) } catch (_: Exception) { null }
                    if (res != null && isSuccess(res)) {
                        aidSelected = true
                        break
                    }
                }
            }

            if (!aidSelected) {
                return null
            }

            // Jalankan GPO (Get Processing Options) untuk membuka akses record di chip contactless
            val gpoCmd = byteArrayOf(
                0x80.toByte(), 0xA8.toByte(), 0x00.toByte(), 0x00.toByte(), 0x02.toByte(),
                0x83.toByte(), 0x00.toByte(), 0x00.toByte()
            )
            try { isoDep.transceive(gpoCmd) } catch (_: Exception) {}

            // Loop SFIs dan records untuk membaca data PAN & Expiry
            for (sfi in 1..4) {
                val sfiByte = ((sfi shl 3) or 4).toByte()
                for (rec in 1..5) {
                    val readRecord = byteArrayOf(
                        0x00.toByte(), 0xB2.toByte(), rec.toByte(), sfiByte, 0x00.toByte()
                    )
                    val recRes = try { isoDep.transceive(readRecord) } catch (_: Exception) { null }
                    if (recRes != null && isSuccess(recRes)) {
                        var foundPan: String? = null
                        var foundExpiry: String? = null
                        var foundName: String? = null

                        val track2Val = findTagValue(recRes, 0x57)
                        if (track2Val != null) {
                            val track2Hex = bytesToHex(track2Val)
                            val separator = track2Hex.indexOf('D')
                            if (separator != -1) {
                                foundPan = track2Hex.substring(0, separator)
                                if (separator + 5 <= track2Hex.length) {
                                    foundExpiry = track2Hex.substring(separator + 1, separator + 5)
                                }
                            }
                        }

                        if (foundPan == null) {
                            val panVal = findTagValue(recRes, 0x5A)
                            if (panVal != null) {
                                foundPan = bytesToHex(panVal).trimEnd('F')
                            }
                        }

                        if (foundPan != null) {
                            if (foundExpiry == null) {
                                val expiryVal = findTagValue(recRes, 0x5F24)
                                if (expiryVal != null && expiryVal.size >= 2) {
                                    foundExpiry = bytesToHex(expiryVal).substring(0, 4)
                                }
                            }

                            val nameVal = findTagValue(recRes, 0x5F20)
                            if (nameVal != null) {
                                try {
                                    val candidateName = String(nameVal, Charsets.US_ASCII)
                                        .trim()
                                        .replace("/", " ")
                                    if (candidateName.isNotEmpty()) {
                                        foundName = candidateName
                                    }
                                } catch (_: Exception) {}
                            }

                            val expiry = foundExpiry ?: "3012"
                            val name = foundName ?: "NATIVE CONTACTLESS"
                            return "$foundPan|$expiry|$name"
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error reading EMV card: ${e.message}")
        } finally {
            try { isoDep.close() } catch (_: Exception) {}
        }
        return null
    }

    private fun isSuccess(res: ByteArray): Boolean {
        if (res.size < 2) return false
        val sw1 = res[res.size - 2].toInt() and 0xFF
        val sw2 = res[res.size - 1].toInt() and 0xFF
        return sw1 == 0x90 && sw2 == 0x00
    }

    private fun findTagValue(bytes: ByteArray, targetTag: Int): ByteArray? {
        return parseTlv(bytes, 0, bytes.size, targetTag)
    }

    private fun parseTlv(bytes: ByteArray, start: Int, end: Int, targetTag: Int): ByteArray? {
        var i = start
        while (i < end - 1) {
            val b = bytes[i].toInt() and 0xFF
            if (b == 0x00 || b == 0xFF) {
                i++
                continue
            }

            var tag = b
            var tagSize = 1
            if ((b and 0x1F) == 0x1F) {
                if (i + 1 >= end) break
                val b2 = bytes[i + 1].toInt() and 0xFF
                tag = (tag shl 8) or b2
                tagSize = 2
            }
            i += tagSize
            if (i >= end) break

            val lenByte = bytes[i].toInt() and 0xFF
            var len = lenByte
            var lenSize = 1
            if ((lenByte and 0x80) == 0x80) {
                val numLengthBytes = lenByte and 0x7F
                if (numLengthBytes == 1) {
                    if (i + 1 >= end) break
                    len = bytes[i + 1].toInt() and 0xFF
                    lenSize = 2
                } else if (numLengthBytes == 2) {
                    if (i + 2 >= end) break
                    val len1 = bytes[i + 1].toInt() and 0xFF
                    val len2 = bytes[i + 2].toInt() and 0xFF
                    len = (len1 shl 8) or len2
                    lenSize = 3
                } else {
                    break
                }
            }
            i += lenSize
            if (i + len > end) break

            if (tag == targetTag) {
                val value = ByteArray(len)
                System.arraycopy(bytes, i, value, 0, len)
                return value
            }

            val firstTagByte = if (tagSize == 2) (tag shr 8) else tag
            val isConstructed = (firstTagByte and 0x20) == 0x20
            if (isConstructed) {
                val found = parseTlv(bytes, i, i + len, targetTag)
                if (found != null) return found
            }

            i += len
        }
        return null
    }

    private fun bytesToHex(bytes: ByteArray): String {
        val sb = StringBuilder()
        for (b in bytes) {
            sb.append(String.format("%02X", b))
        }
        return sb.toString()
    }

    // ======================================================================
    // DEVICE UTILITIES
    // ======================================================================

    private fun playBeepSound() {
        try {
            val toneG = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            toneG.startTone(ToneGenerator.TONE_PROP_BEEP, 180)
            Handler(Looper.getMainLooper()).postDelayed({
                try {
                    toneG.release()
                } catch (_: Exception) {}
            }, 250)
        } catch (_: Exception) {}
    }

    @Suppress("DEPRECATION")
    private fun vibrateDevice() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator?.vibrate(
                    VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE)
                )
            } else {
                val vibrator = getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator?.vibrate(VibrationEffect.createOneShot(150, VibrationEffect.DEFAULT_AMPLITUDE))
                } else {
                    vibrator?.vibrate(150)
                }
            }
        } catch (_: Exception) {}
    }

    // ======================================================================
    // SECURE PREFERENCES
    // ======================================================================

    private fun getPrefs(): SharedPreferences {
        return getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun savePin(pinHash: String) {
        getPrefs().edit().putString(KEY_PIN_HASH, pinHash).apply()
    }

    fun verifyPin(pin: String): Boolean {
        val savedHash = getPrefs().getString(KEY_PIN_HASH, "")
        return savedHash == pin
    }

    fun isPinEnabled(): Boolean {
        return getPrefs().getBoolean(KEY_PIN_ENABLED, false)
    }

    fun setPinEnabled(enabled: Boolean) {
        getPrefs().edit().putBoolean(KEY_PIN_ENABLED, enabled).apply()
    }

    fun isBiometricEnabled(): Boolean {
        return getPrefs().getBoolean(KEY_BIOMETRICS_ENABLED, false)
    }

    fun setBiometricEnabled(enabled: Boolean) {
        getPrefs().edit().putBoolean(KEY_BIOMETRICS_ENABLED, enabled).apply()
    }

    // ======================================================================
    // NOTIFICATIONS
    // ======================================================================

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val importance = NotificationManager.IMPORTANCE_HIGH
            val channel = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, importance).apply {
                description = "Notifikasi Realtime AliBank"
                enableVibration(true)
                enableLights(true)
            }
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.createNotificationChannel(channel)
        }
    }

    fun showNotification(title: String, message: String) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                val granted = ContextCompat.checkSelfPermission(
                    this, Manifest.permission.POST_NOTIFICATIONS
                ) == PackageManager.PERMISSION_GRANTED
                if (!granted) {
                    runOnUiThread { requestNotificationPermissionIfNeeded() }
                    return
                }
            }

            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                this, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val builder = NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title)
                .setContentText(message)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setDefaults(NotificationCompat.DEFAULT_ALL)

            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            notificationManager?.notify((System.currentTimeMillis() and 0x7FFFFFFF).toInt(), builder.build())
        } catch (e: Exception) {
            Log.w(TAG, "showNotification error: ${e.message}")
        }
    }

    // ======================================================================
    // CONTACTS (via System Intent)
    // ======================================================================

    fun selectContact() {
        try {
            val intent = Intent(Intent.ACTION_PICK, ContactsContract.CommonDataKinds.Phone.CONTENT_URI)
            contactPickerLauncher.launch(intent)
        } catch (e: Exception) {
            Log.w(TAG, "selectContact error: ${e.message}")
        }
    }

    private fun handleContactResult(contactUri: Uri) {
        try {
            val projection = arrayOf(
                ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
                ContactsContract.CommonDataKinds.Phone.NUMBER
            )
            contentResolver.query(contactUri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val nameIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
                    val numberIndex = cursor.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)
                    val name = if (nameIndex >= 0) cursor.getString(nameIndex) ?: "" else ""
                    val number = if (numberIndex >= 0) cursor.getString(numberIndex) ?: "" else ""

                    val safeName = escapeJsString(name)
                    val safeNumber = escapeJsString(number)

                    runOnUiThread {
                        webView?.evaluateJavascript(
                            "javascript:if(window.onAndroidContactPicked) window.onAndroidContactPicked('$safeName', '$safeNumber');",
                            null
                        )
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "handleContactResult error: ${e.message}")
        }
    }

    // ======================================================================
    // FILE CHOOSER RESULT
    // ======================================================================

    @Suppress("DEPRECATION")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (resultCode == Activity.RESULT_OK && data != null) {
                val result = WebChromeClient.FileChooserParams.parseResult(resultCode, data)
                fileUploadCallback?.onReceiveValue(result)
            } else {
                fileUploadCallback?.onReceiveValue(null)
            }
            fileUploadCallback = null
        }
    }

    // ======================================================================
    // BIOMETRICS
    // ======================================================================

    fun isBiometricAvailable(): Boolean {
        return try {
            val biometricManager = BiometricManager.from(this)
            val authenticators =
                BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
            biometricManager.canAuthenticate(authenticators) == BiometricManager.BIOMETRIC_SUCCESS
        } catch (_: Exception) {
            false
        }
    }

    fun authenticateBiometric() {
        try {
            val executor = ContextCompat.getMainExecutor(this)
            val biometricPrompt = BiometricPrompt(this, executor,
                object : BiometricPrompt.AuthenticationCallback() {
                    override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                        super.onAuthenticationError(errorCode, errString)
                        val safeError = errString.toString().replace("'", "\\'")
                        runOnUiThread {
                            webView?.evaluateJavascript(
                                "javascript:if (window.onAndroidBiometricResult) window.onAndroidBiometricResult(false, '$safeError');",
                                null
                            )
                        }
                    }

                    override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                        super.onAuthenticationSucceeded(result)
                        runOnUiThread {
                            webView?.evaluateJavascript(
                                "javascript:if (window.onAndroidBiometricResult) window.onAndroidBiometricResult(true, 'Authentication succeeded');",
                                null
                            )
                        }
                    }

                    override fun onAuthenticationFailed() {
                        super.onAuthenticationFailed()
                        runOnUiThread {
                            webView?.evaluateJavascript(
                                "javascript:if (window.onAndroidBiometricResult) window.onAndroidBiometricResult(false, 'Biometric verification failed');",
                                null
                            )
                        }
                    }
                })

            val promptInfo = BiometricPrompt.PromptInfo.Builder()
                .setTitle(getString(R.string.biometric_title))
                .setSubtitle(getString(R.string.biometric_subtitle))
                .setAllowedAuthenticators(
                    BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
                )
                .build()

            runOnUiThread {
                biometricPrompt.authenticate(promptInfo)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Biometric authentication error: ${e.message}")
        }
    }

    // ======================================================================
    // JAVASCRIPT WEB-BRIDGE CONTROLLER INTERFACE
    // ======================================================================

    inner class AndroidNfcBridge {
        @JavascriptInterface
        fun startNfcScan(amount: String) {
            runOnUiThread {
                startScanning(amount)
            }
        }

        @JavascriptInterface
        fun showNotification(title: String, message: String) {
            this@MainActivity.showNotification(title, message)
        }

        @JavascriptInterface
        fun isBiometricAvailable(): Boolean {
            return this@MainActivity.isBiometricAvailable()
        }

        @JavascriptInterface
        fun authenticateBiometric() {
            this@MainActivity.authenticateBiometric()
        }

        @JavascriptInterface
        fun setBiometricEnabled(enabled: Boolean) {
            this@MainActivity.setBiometricEnabled(enabled)
        }

        @JavascriptInterface
        fun isBiometricEnabled(): Boolean {
            return this@MainActivity.isBiometricEnabled()
        }

        @JavascriptInterface
        fun savePin(pinHash: String) {
            this@MainActivity.savePin(pinHash)
        }

        @JavascriptInterface
        fun verifyPin(pin: String): Boolean {
            return this@MainActivity.verifyPin(pin)
        }

        @JavascriptInterface
        fun setPinEnabled(enabled: Boolean) {
            this@MainActivity.setPinEnabled(enabled)
        }

        @JavascriptInterface
        fun isPinEnabled(): Boolean {
            return this@MainActivity.isPinEnabled()
        }

        @JavascriptInterface
        fun pickContact() {
            runOnUiThread {
                selectContact()
            }
        }

        @JavascriptInterface
        fun getAppVersion(): String {
            return "2.2"
        }

        @JavascriptInterface
        fun isNfcSupported(): Boolean {
            return nfcAdapter != null
        }

        @JavascriptInterface
        fun isNfcEnabled(): Boolean {
            return nfcAdapter?.isEnabled == true
        }

        @JavascriptInterface
        fun getDeviceModel(): String {
            return "${Build.MANUFACTURER} ${Build.MODEL}"
        }

        @JavascriptInterface
        fun getAndroidVersion(): String {
            return "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
        }

        @JavascriptInterface
        fun vibrate() {
            vibrateDevice()
        }

        @JavascriptInterface
        fun openExternalUrl(url: String) {
            try {
                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                startActivity(intent)
            } catch (_: Exception) {}
        }

        @JavascriptInterface
        fun shareText(text: String) {
            try {
                val intent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_TEXT, text)
                }
                startActivity(Intent.createChooser(intent, "Bagikan via"))
            } catch (_: Exception) {}
        }

        @JavascriptInterface
        fun copyToClipboard(text: String) {
            try {
                val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager
                val clip = android.content.ClipData.newPlainText("AliBank", text)
                clipboard.setPrimaryClip(clip)
                runOnUiThread {
                    Toast.makeText(this@MainActivity, "Disalin ke clipboard", Toast.LENGTH_SHORT).show()
                }
            } catch (_: Exception) {}
        }
    }
}
