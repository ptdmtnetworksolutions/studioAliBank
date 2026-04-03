# AliBank - Financial Infrastructure V3

This is a Next.js application built for AliBank, featuring real-time financial tracking, PayPal integration, and AI-driven insights.

## Deployment to Firebase App Hosting

To deploy this application:

1. **Enable required APIs**: 
   Run the following command in your Google Cloud Shell:
   ```bash
   gcloud services enable firebaseapphosting.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com logging.googleapis.com secretmanager.googleapis.com --project darmedia-pos
   ```

2. **Troubleshooting "Billing Not Open" Error**:
   Jika Anda melihat error `FAILED_PRECONDITION: Billing account ... is not open`, ikuti langkah ini:
   - Buka [Google Cloud Billing](https://console.cloud.google.com/billing).
   - Pastikan akun penagihan Anda **Aktif**.
   - Masuk ke **Account Management** dan pastikan proyek `darmedia-pos` sudah terhubung ke akun penagihan tersebut. Jika belum, klik titik tiga dan pilih **Change billing**.

3. **Vault Private Key**:
   - Alamat `0x5626...` adalah alamat publik.
   - **Private Key** harus diambil dari dompet tempat alamat itu dibuat (misal: MetaMask). 
   - JANGAN PERNAH memberikan Private Key kepada siapa pun kecuali memasukkannya ke Google Secret Manager Anda sendiri.

4. **Connect to GitHub**: 
   Buka [Firebase Console](https://console.firebase.google.com/project/darmedia-pos/apphosting) dan hubungkan repositori Anda.

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager.
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
