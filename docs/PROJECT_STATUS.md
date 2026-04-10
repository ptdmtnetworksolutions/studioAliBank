
# Laporan Status Proyek: AliBank V3 - Financial Infrastructure

## 1. DESKRIPSI PROYEK
AliBank V3 adalah platform perbankan hibrida yang menggabungkan kemudahan layanan fiat (IDR) dengan kekuatan aset kripto (ALX, BTC, ETH, USDT).

**Status Platform:** Cross-Platform Sync (Web PWA & Android Native Parity).

---

## 2. ARSITEKTUR APLIKASI (Verified)

### Stack Teknologi (Web & Android Parity)
#### Frontend (Web)
- **Framework:** Next.js 15.5 (App Router)
- **UI:** ShadCN UI, Tailwind CSS
- **PWA:** WebAPK Native Integration Active.

#### Backend (Shared via Firebase)
- **Database:** Firebase Firestore (Real-time Shared Schema)
- **Auth:** Firebase Authentication (Shared Session)
- **Profit Engine:** Admin Capture Logic (Fees & Loss Capture)

---

## 3. FITUR UTAMA RIIL ✅

### Perdagangan Berjangka (Futures)
- [x] **Leverage Engine**: Mendukung hingga 125x.
- [x] **Platform Fee**: Admin menarik 0.1% biaya dari setiap posisi.
- [x] **Loss Capture**: Kerugian margin nasabah dikonversi menjadi profit Bank pusat.

### Manajemen Likuiditas Admin
- [x] **Audit Ledger**: Pencatatan otomatis setiap pergerakan dana riil.
- [x] **Vault Inventory**: Sinkronisasi stok ALX internal (1 Juta koin) dengan penjualan aplikasi.

---

## 4. PETUNJUK SINKRONISASI ANDROID STUDIO
- **Android Studio** bertindak sebagai klien native yang menggunakan skema data dari `/docs/backend.json`.
- Gunakan `docs/ANDROID_SYNC_GUIDE.md` untuk mengimplementasikan logika yang sama di Kotlin.

---
*Terakhir Diperbarui: Mei 2026*
