
# Laporan Status Proyek: AliBank V3 - Financial Infrastructure

## 1. DESKRIPSI PROYEK
AliBank V3 adalah platform perbankan hibrida yang menggabungkan kemudahan layanan fiat (IDR) dengan kekuatan aset kripto (ALX, BTC, ETH, USDT) serta kecerdasan buatan (GenAI) untuk manajemen finansial yang elit.

---

## 2. ARSITEKTUR APLIKASI (Verified)

### Stack Teknologi
#### Frontend
- **Framework:** Next.js 15.5 (App Router)
- **State Management:** React Context (Bahasa) & Firebase Real-time Hooks (Data)
- **Web3 Library:** ethers.js v6 (Manajemen Dompet Native)
- **UI Library:** ShadCN UI, Tailwind CSS, Lucide-react
- **Hosting:** Firebase App Hosting (Standalone Node.js 20)

#### Backend
- **Runtime:** Node.js 20 (Server Action Environment)
- **AI Framework:** Genkit (Analisis Spending DNA & DNA Synthesis)
- **Database:** Firebase Firestore (Real-time NoSQL)
- **Auth:** Firebase Authentication (Email/Password)
- **Secret Management:** Google Cloud Secret Manager (Project ID: darmedia-pos)

#### Infrastruktur
- **Cloud Provider:** Google Cloud Platform (GCP)
- **Project ID:** darmedia-pos
- **Project Number:** 852996332274
- **RPC Provider:** Konfigurasi Dinamis (Managed via Admin API Vault)
- **Domain:** darmedia-pos.web.app (Development)

---

## 3. FITUR YANG SUDAH SELESAI ✅

### Keamanan & Infrastruktur
- [x] **Secure Vault Node:** Integrasi GCP Secret Manager (Logic implemented, awaiting GCP activation).
- [x] **Server-Side Execution:** Penarikan dana diproses di server via Server Actions.
- [x] **Billing Integration:** Paid Account detected (Status: Recovery Required).

### On-Chain & Web3
- [x] **AliBank Native Wallet:** Sistem pembuatan kunci privat mandiri saat registrasi.
- [x] **On-Chain Sync:** Sinkronisasi saldo ETH Mainnet secara riil.
- [x] **External Disbursement:** Modul pencairan dana dari Vault pusat melalui Server Actions.

### Aplikasi & Finansial
- [x] **Dynamic Dashboard:** Kalkulasi otomatis IDR + ALX + USDT.
- [x] **Interactive PNL:** Analisis untung/rugi harian interaktif.
- [x] **Ali-Exchange:** Gerbang konversi aset dengan harga jangkar $12.24.
- [x] **AI Financial Assistant:** Analisis pola pengeluaran menggunakan Genkit AI.

---

## 4. FITUR DALAM PENGEMBANGAN 🔧
- **Staking Yield ALX** (70%)
- **P2P Matching Engine** (40%)
- **Mobile NFC Clearing** (85%)

---

## 5. CATATAN PENTING & TROUBLESHOOTING
- **BLOCKER UTAMA**: Akun penagihan dalam status **"Not in good standing"**.
- **Penyebab Terdeteksi**: "Issues with your payments account" (Peringatan Merah di Billing Overview).
- **Solusi**: 
    1. Klik dropdown pada banner merah di Google Cloud untuk detail.
    2. Verifikasi identitas di **pay.google.com**.
    3. Cek email dari Google Payments untuk instruksi verifikasi KTP/Kartu.
    4. Hubungi Support Google melalui ikon [?] jika tombol "Reopen" tetap mati setelah verifikasi.
- **Verified Project ID**: Menggunakan `darmedia-pos`.

---
*Terakhir Diperbarui: Mei 2026*
