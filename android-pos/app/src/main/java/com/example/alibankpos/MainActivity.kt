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
                val name = if (parts.size > 2) parts[2] else "NATIVE CONTACTLESS"
                
                // Format Expiry from YYMM to YYYY-MM
                val expiry = if (rawExpiry.length == 4) {
                    "20" + rawExpiry.substring(0, 2) + "-" + rawExpiry.substring(2, 4)
                } else {
                    "2029-12"
                }

                Toast.makeText(this, "Kartu Contactless Berhasil Dibaca", Toast.LENGTH_SHORT).show()
                
                // Send read details back to Next.js WebView
                webView?.evaluateJavascript(
                    "javascript:if(window.onAndroidNfcRead) window.onAndroidNfcRead('$number', '$expiry', '123', '$name');",
                    null
                )
            } else {
                Toast.makeText(this, "Gagal Membaca Kartu Contactless", Toast.LENGTH_LONG).show()
                
                // Notify the WebView of the failure and set a clear error message
                webView?.evaluateJavascript(
                    "javascript:if(window.setNfcError) window.setNfcError('Gagal membaca kartu contactless. Pastikan Anda menggunakan kartu Debit/Kredit Visa/Mastercard contactless.');" +
                    "if(window.setNfcStatus) window.setNfcStatus('failed');",
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
                    val recRes = try { isoDep.transceive(readRecord) } catch (e: Exception) { null }
                    if (recRes != null && isSuccess(recRes)) {
                        var foundPan: String? = null
                        var foundExpiry: String? = null
                        var foundName: String? = null

                        // a. Try Track 2 Equivalent Data (Tag 0x57)
                        val track2Val = findTagValue(recRes, 0x57)
                        if (track2Val != null) {
                            val track2Hex = bytesToHex(track2Val)
                            val separator = track2Hex.indexOf('D')
                            if (separator != -1) {
                                foundPan = track2Hex.substring(0, separator)
                                if (separator + 5 <= track2Hex.length) {
                                    foundExpiry = track2Hex.substring(separator + 1, separator + 5) // YYMM
                                }
                            }
                        }

                        // b. Try Application PAN (Tag 0x5A)
                        if (foundPan == null) {
                            val panVal = findTagValue(recRes, 0x5A)
                            if (panVal != null) {
                                foundPan = bytesToHex(panVal).trimEnd('F')
                            }
                        }

                        // If we found a valid PAN, extract expiry/name from this record and return immediately
                        if (foundPan != null) {
                            // Try to get Expiry from Tag 0x5F24 if not found from Track 2
                            if (foundExpiry == null) {
                                val expiryVal = findTagValue(recRes, 0x5F24)
                                if (expiryVal != null && expiryVal.size >= 2) {
                                    foundExpiry = bytesToHex(expiryVal).substring(0, 4) // YYMM
                                }
                            }

                            // Try to get Cardholder Name (Tag 0x5F20)
                            val nameVal = findTagValue(recRes, 0x5F20)
                            if (nameVal != null) {
                                try {
                                    val candidateName = String(nameVal, Charsets.US_ASCII).trim().replace("/", " ")
                                    if (candidateName.isNotEmpty()) {
                                        foundName = candidateName
                                    }
                                } catch (e: Exception) {}
                            }

                            val expiry = foundExpiry ?: "2912"
                            val name = foundName ?: "NATIVE CONTACTLESS"
                            return "$foundPan|$expiry|$name"
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
            
            // Determine Tag
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
            
            // Determine Length
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
            
            // Check if this is the target tag
            if (tag == targetTag) {
                val value = ByteArray(len)
                System.arraycopy(bytes, i, value, 0, len)
                return value
            }
            
            // Check if constructed (constructed tag has bit 6 set)
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
