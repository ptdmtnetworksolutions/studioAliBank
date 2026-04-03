
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

### 3. Solusi Error Billing (UREQ_PROJECT_BILLING_NOT_OPEN)
Meskipun kartu sudah didaftarkan, project harus **dihubungkan** ke akun penagihan:
1. Buka [Google Cloud Billing](https://console.cloud.google.com/billing).
2. Di sidebar kiri, pilih **Account Management**.
3. Cari project **darmedia-pos**.
4. Klik ikon titik tiga di sebelah project tersebut.
5. Pilih **Change billing** dan pilih akun "Firebase Payment".
6. Ulangi perintah di Cloud Shell.

### 4. Setup Secure Vault (Secret Manager)
Setelah billing terhubung, jalankan ini di Cloud Shell:
```bash
# 1. Masuk ke project yang benar
gcloud config set project darmedia-pos

# 2. Buat wadah secret
gcloud secrets create ALIBANK_VAULT_PRIVATE_KEY --replication-policy="automatic"

# 3. Masukkan Private Key MetaMask (Ganti YOUR_KEY dengan kode 0x... Anda dari MetaMask)
echo -n "YOUR_KEY" | gcloud secrets versions add ALIBANK_VAULT_PRIVATE_KEY --data-file=-

# 4. Berikan izin akses ke Service Account aplikasi (Project Number: 852996332274)
gcloud secrets add-iam-policy-binding ALIBANK_VAULT_PRIVATE_KEY \
    --member="serviceAccount:852996332274-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager (Production Grade).
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital secara riil.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
