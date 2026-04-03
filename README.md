
# AliBank - Financial Infrastructure V3

This is a Next.js application built for AliBank, featuring real-time financial tracking, PayPal integration, and AI-driven insights.

## Deployment to Firebase App Hosting

### 1. Verifikasi Project ID
Gunakan **Project ID** resmi: `darmedia-pos`.

### 2. Aktifkan API yang Diperlukan
Jalankan perintah ini di Google Cloud Shell:
```bash
gcloud services enable firebaseapphosting.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com logging.googleapis.com secretmanager.googleapis.com --project darmedia-pos
```

### 3. Solusi Error Billing (Not in Good Standing)
Jika tombol "Reopen" tidak bisa diklik, lakukan hal berikut:
1. **Cek Transaksi**: Buka [Transactions](https://console.cloud.google.com/billing/0188A8-644BFB-EE82F5/transactions) dan lunasi tagihan yang gagal.
2. **Verifikasi Kartu**: Pastikan kartu Mastercard aktif untuk transaksi internasional.
3. **Cek Email**: Periksa email `dzulfikaraliridlo@gmail.com` untuk instruksi verifikasi identitas dari Google.
4. **Support**: Gunakan ikon [?] Support di pojok kanan atas jika masalah berlanjut.

### 4. Setup Secure Vault (Secret Manager)
Setelah billing terbuka dan terhubung, jalankan ini di Cloud Shell:
```bash
# 1. Masuk ke project yang benar
gcloud config set project darmedia-pos

# 2. Buat wadah secret
gcloud secrets create ALIBANK_VAULT_PRIVATE_KEY --replication-policy="automatic"

# 3. Masukkan Private Key MetaMask (Ganti YOUR_KEY dengan kode 0x... Anda dari MetaMask)
echo -n "YOUR_KEY" | gcloud secrets versions add ALIBANK_VAULT_PRIVATE_KEY --data-file=-

# 4. Berikan izin akses ke Service Account aplikasi
gcloud secrets add-iam-policy-binding ALIBANK_VAULT_PRIVATE_KEY \
    --member="serviceAccount:852996332274-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager (Production Grade).
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital secara riil.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
