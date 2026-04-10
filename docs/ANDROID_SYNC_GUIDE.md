
# Panduan Sinkronisasi AliBank Android (Kotlin)

Dokumen ini berisi spesifikasi logika dan data untuk diimplementasikan di Android Studio agar selaras dengan versi Web AliBank V3.

## 1. Skema Data (Data Models)
Gunakan struktur berikut pada kelas Kotlin Anda untuk memastikan data terbaca dengan benar dari Firestore.

### User Model
```kotlin
data class User(
    val uid: String = "",
    val name: String = "",
    val accountNumber: String = "",
    val totalBalance: Double = 0.0,
    val savings: Double = 0.0,
    val walletAddress: String = "",
    val cryptoBalances: Map<String, Double> = mapOf(
        "ALX" to 0.0,
        "USDT" to 0.0,
        "ETH" to 0.0,
        "BTC" to 0.0
    )
)
```

## 2. Logika Keuntungan Admin (Futures & Trade)
Pastikan aplikasi Android memotong biaya layanan (Platform Fee) agar Admin mendapatkan profit yang sama:

- **Trading Fee**: 0.1% dari nilai posisi.
- **Profit Target**: Masukkan biaya ini ke `doc("system/liquidity")` pada field `totalTradingFeesIdr`.
- **Loss Capture**: Jika nasabah rugi di Android, pastikan margin tersebut tidak dikembalikan ke saldo user, melainkan menetap di `system/liquidity`.

## 3. Integrasi Firebase
Gunakan file `google-services.json` yang sama dari Firebase Console proyek `darmedia-pos`.

- **Firestore Path**:
    - Profil: `/users/{uid}`
    - Posisi Futures: `/users/{uid}/futures_positions/{posId}`
    - Audit Ledger: `/system/audit/global_transactions`
    - Likuiditas Sistem: `/system/liquidity`

## 4. Warna Branding (AliBank Gold)
- **Primary**: `#FCD535`
- **Background Dark**: `#1E2329`
- **Accent**: `#B8860B`

---
*Catatan: Gunakan Firebase SDK untuk Android (Kotlin Coroutines/Flow) untuk mendengarkan perubahan saldo secara real-time.*
