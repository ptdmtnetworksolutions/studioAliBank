# AliBank - Financial Infrastructure V3

This is a Next.js application built for AliBank, featuring real-time financial tracking, PayPal integration, and AI-driven insights.

## Deployment to Firebase App Hosting

To deploy this application:

1. **Enable required APIs**: 
   Run the following command in your Google Cloud Shell:
   ```bash
   gcloud services enable firebaseapphosting.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com logging.googleapis.com secretmanager.googleapis.com --project darmedia-pos
   ```

2. **Setup Secure Vault (Secret Manager)**:
   After enabling billing, run these commands in Cloud Shell to secure your Vault Private Key:
   ```bash
   # Create the secret container
   gcloud secrets create ALIBANK_VAULT_PRIVATE_KEY --replication-policy="automatic"

   # Add your MetaMask Private Key (Replace YOUR_KEY with actual key starting with 0x)
   echo -n "YOUR_KEY" | gcloud secrets versions add ALIBANK_VAULT_PRIVATE_KEY --data-file=-

   # Grant access to the app's service account
   PROJECT_NUMBER=$(gcloud projects describe darmedia-pos --format='value(projectNumber)')
   gcloud secrets add-iam-policy-binding ALIBANK_VAULT_PRIVATE_KEY \
       --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
       --role="roles/secretmanager.secretAccessor"
   ```

3. **Vault Private Key**:
   - Alamat `0x5626...` adalah alamat publik.
   - **Private Key** harus diambil dari dompet tempat alamat itu dibuat (misal: MetaMask). 
   - JANGAN PERNAH memberikan Private Key kepada siapa pun kecuali memasukkannya ke Google Secret Manager Anda sendiri.

4. **Connect to GitHub**: 
   Buka [Firebase Console](https://console.firebase.google.com/project/darmedia-pos/apphosting) dan hubungkan repositori Anda.

## Features
- **Real-time Balance**: Sinkronisasi otomatis dengan Firestore.
- **Secure Vault**: Kunci privat aman di GCP Secret Manager (Production Grade).
- **PayPal Gateway**: Integrasi kliring kartu dan dompet digital.
- **AI Assistant**: Sintesis DNA finansial menggunakan Genkit.
