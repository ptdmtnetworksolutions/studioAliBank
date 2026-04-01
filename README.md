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
   If you see `FAILED_PRECONDITION: Billing account ... is not open`, follow these steps:
   - Go to [Google Cloud Billing](https://console.cloud.google.com/billing).
   - Ensure your billing account is **Active**.
   - Go to **Account Management** and make sure the project `darmedia-pos` is listed under "Projects linked to this billing account".
   - If it's not linked, click the three dots next to the project and select **Change billing**.

3. **Connect to GitHub**: 
   Go to the [Firebase Console](https://console.firebase.google.com/project/darmedia-pos/apphosting) and connect your repository.

4. **Configure Environment Variables**:
   Ensure your PayPal Client ID and Firebase configuration are set in the App Hosting dashboard if needed.

## Features
- **Real-time Balance**: Synchronized with Firestore.
- **PayPal Gateway**: Integrated card and wallet clearing.
- **AI Assistant**: Financial DNA synthesis via Genkit.
- **Admin Command Center**: Supply management and audit logs.
