
# Laporan Status Proyek: AliBank V3 - Financial Infrastructure

## 1. DESKRIPSI PROYEK
AliBank V3 adalah platform perbankan hibrida yang menggabungkan kemudahan layanan fiat (IDR) dengan kekuatan aset kripto (ALX, BTC, ETH, USDT) serta kecerdasan buatan (GenAI) untuk manajemen finansial yang elit.

---

## 2. ARSITEKTUR APLIKASI

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
- **Secret Management:** Google Cloud Secret Manager (Production Grade)

#### Infrastruktur
- **Cloud Provider:** Google Cloud Platform (GCP)
- **RPC Provider:** Konfigurasi Dinamis (Managed via Admin API Vault)
- **Domain:** darmedia-pos.web.app (Development)
- **CDN:** Firebase Global CDN

---

## 3. FITUR YANG SUDAH SELESAI ✅

### On-Chain & Web3
- [x] **AliBank Native Wallet:** Sistem pembuatan kunci privat dan alamat dompet mandiri saat registrasi.
- [x] **On-Chain Sync:** Sinkronisasi saldo ETH Mainnet secara riil ke UI dashboard.
- [x] **External Disbursement:** Modul pencairan dana dari brankas (Vault) pusat melalui Server Actions.
- [x] **Native Signature Activation:** Aktivasi tanda tangan digital untuk keamanan transaksi tingkat lanjut.
- [x] **Secure Vault Node:** Integrasi GCP Secret Manager untuk penyimpanan kunci privat Vault.

### Aplikasi & Finansial
- [x] **Dynamic Dashboard:** Tampilan saldo total yang menghitung IDR + Valuasi ALX + USDT secara otomatis.
- [x] **Interactive PNL:** Kalkulasi untung/rugi harian berdasarkan fluktuasi pasar ALX/USDT.
- [x] **Asset Detail Dropdown:** Panel rincian aset yang dapat dibuka-tutup dengan animasi ikon dinamis.
- [x] **Ali-Exchange:** Gerbang konversi IDR/USDT ke ALX dengan harga jangkar $12.24.
- [x] **History & Notifications:** Pelacakan transaksi lengkap dan pusat pemberitahuan sistem.
- [x] **AI Financial Assistant:** Analisis pola pengeluaran pengguna menggunakan Genkit AI.

### Admin & Management
- [x] **Modular Admin Dashboard:** Tab-based navigasi (Dashboard, Clients, Vault, Tokenomics, API, Audit).
- [x] **API Management Vault:** Pengelolaan terpusat kunci PayPal, Etherscan, RPC, dan Gemini.
- [x] **Customer Console:** Fitur edit saldo, reset sandi, dan hapus user (Desktop & Mobile).
- [x] **Tokenomics Terminal:** Kontrol pencetakan (Mint) dan pembakaran (Burn) suplai ALX.

---

## 4. FITUR DALAM PENGEMBANGAN 🔧

| Fitur | Progress | Target Selesai | Blocker |
|---|---|---|---|
| **Staking Yield ALX** | 70% | Mei 2026 | Integrasi perhitungan APR riil |
| **P2P Matching Engine** | 40% | Juni 2026 | Logika dispute & escrow |
| **Mobile NFC Clearing** | 85% | Mei 2026 | Final testing pada sensor hardware |

---

## 5. YANG BELUM DIMULAI 📋
- Sistem KYC Otomatis (Integrasi Sumsub/Veriff)
- Porting Mobile App Native (React Native)
- Laporan Pajak Tahunan Otomatis (PDF Generator)

---

## 6. INTEGRASI PIHAK KETIGA

| Layanan | Fungsi | Status | Keterangan |
|---|---|---|---|
| **PayPal** | Fiat Gateway (USD) | Terintegrasi | Managed via API Vault |
| **Etherscan** | Monitoring Node | Terintegrasi | Managed via API Vault |
| **Gemini AI** | Financial Brain | Terintegrasi | Managed via API Vault |
| **Firebase** | Backend & Hosting | Terintegrasi | Aktif |

---

## 7. TOKENOMICS ALX

- **Total Max Supply:** 100.000.000 ALX
- **Supply Awal (Minted):** 1.000.000 ALX
- **Mekanisme Support:** 
  - **20% Revenue Buyback:** Pembelian kembali dari pasar menggunakan keuntungan bursa.
  - **Deflationary:** Pembakaran token melalui panel Admin untuk mengurangi suplai sirkulasi.
- **Utilitas Utama:**
  1. **Tier Membership:** (Hold 1K ALX = Gold, 10K ALX = Platinum VIP).
  2. **Fee Discount:** Diskon biaya bursa berdasarkan kepemilikan ALX.
  3. **Revenue Sharing:** Hak atas pembagian dividen dari kolam biaya platform.
- **Harga Jangkar:** 12.24 USDT (Listing/Anchor Price).

---

## 8. REGULASI, KEPATUHAN & KEAMANAN

- **KYC:** Wajib dilakukan saat pendaftaran (Data tersimpan di Firestore).
- **AML Policy:** Monitoring otomatis melalui Log Audit Global di Dashboard Admin.
- **Key Security:** 
  - **Vault Key:** Disimpan di **GCP Secret Manager** (Akses via Server Action).
  - **User Key:** Self-custodial (Nasabah memegang kunci privat sendiri di dokumen user).
- **Otorisasi Admin:** 
  - **UID:** `IJOuQpjEOMgvlYfzvQ1yfp976Oa2`
  - **Email:** `alidzulfikar075@gmail.com`

---

## 9. CATATAN PENTING & KEPUTUSAN ARSITEKTUR
- **Hybrid System:** AliBank menggabungkan database terpusat untuk kecepatan dengan blockchain untuk transparansi aset.
- **Secure Disbursement:** Seluruh pencairan dana Vault kini menggunakan modul server terisolasi untuk mencegah kebocoran kunci di browser.
- **Anchor Pricing:** Harga ALX dipatok pada fase akumulasi internal untuk menjamin stabilitas likuiditas sebelum listing publik.

---
*Terakhir Diperbarui: Mei 2026*
