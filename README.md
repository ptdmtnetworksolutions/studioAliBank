
# AliBank - Financial Infrastructure V3

This is a Next.js application built for AliBank, featuring real-time financial tracking, PayPal integration, and AI-driven insights.

## Deployment to Firebase App Hosting

### 1. Verifikasi Project ID
Pastikan Anda menggunakan **Project ID** yang benar (bukan Nama Proyek). Cek di Firebase Console > Project Settings. Contoh: `darmedia-pos`.

### 2. Aktifkan API yang Diperlukan
Jalankan perintah ini di Google Cloud Shell:
```bash
gcloud services enable firebaseapphosting.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com logging.googleapis.com secretmanager.googleapis.com --project [PROJECT_ID_ANDA]
```

### 3. Setup Secure Vault (Secret Manager)
Simpan Kunci Privat MetaMask Anda ke dalam brankas Google Cloud yang aman:
```bash
# Buat wadah secret (Ganti [PROJECT_ID_ANDA] dengan ID asli Anda)
gcloud secrets create ALIBANK_VAULT_PRIVATE_KEY --replication-policy="automatic" --project [PROJECT_ID_ANDA]

# Masukkan Private Key MetaMask (Ganti YOUR_KEY dengan kode 0x... Anda)
echo -n "YOUR_KEY" | gcloud secrets versions add ALIBANK_VAULT_PRIVATE_KEY --data-file=- --project [PROJECT_ID_ANDA]

# Berikan izin akses ke Service Account aplikasi
PROJECT_NUMBER=$(gcloud projects describe [PROJECT_ID_ANDA] --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding ALIBANK_VAULT_PRIVATE_KEY \
    --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" \
    --project [PROJECT_ID_ANDA]
```

### 4. Konfigurasi Environment Variable
Di Firebase Console > App Hosting > Settings, tambahkan:
- **Key:** `GCP_PROJECT_ID`
- **Value:** `[PROJECT_ID_ANDA]`

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager (Production Grade).
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital secara riil.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
