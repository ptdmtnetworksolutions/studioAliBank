
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

### 3. Setup Secure Vault (Secret Manager)
Simpan Kunci Privat MetaMask Anda ke dalam brankas Google Cloud yang aman:
```bash
# 1. Masuk ke project yang benar
gcloud config set project darmedia-pos

# 2. Aktifkan API Secret Manager
gcloud services enable secretmanager.googleapis.com

# 3. Buat wadah secret
gcloud secrets create ALIBANK_VAULT_PRIVATE_KEY --replication-policy="automatic"

# 4. Masukkan Private Key MetaMask (Ganti YOUR_KEY dengan kode 0x... Anda dari MetaMask)
echo -n "YOUR_KEY" | gcloud secrets versions add ALIBANK_VAULT_PRIVATE_KEY --data-file=-

# 5. Berikan izin akses ke Service Account aplikasi (Project Number: 852996332274)
gcloud secrets add-iam-policy-binding ALIBANK_VAULT_PRIVATE_KEY \
    --member="serviceAccount:852996332274-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 4. Konfigurasi Environment Variable
Di Firebase Console > App Hosting > Settings, tambahkan:
- **Key:** `GCP_PROJECT_ID`
- **Value:** `darmedia-pos`

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager (Production Grade).
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital secara riil.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
