# AliBank - Financial Infrastructure V3

This is a Next.js application built for AliBank, featuring real-time financial tracking, PayPal integration, and AI-driven insights.

## Deployment to Firebase App Hosting

To deploy this application:

1. **Enable required APIs**: 
   Run the following command in your Google Cloud Shell:
   ```bash
   gcloud services enable firebaseapphosting.googleapis.com cloudbuild.googleapis.com run.googleapis.com artifactregistry.googleapis.com logging.googleapis.com --project darmedia-pos
   ```

2. **Connect to GitHub**: 
   Go to the [Firebase Console](https://console.firebase.google.com/project/darmedia-pos/apphosting) and connect your repository.

3. **Configure Environment Variables**:
   Ensure your PayPal Client ID and Firebase configuration are set in the App Hosting dashboard if needed.

## Features
- **Real-time Balance**: Synchronized with Firestore.
- **PayPal Gateway**: Integrated card and wallet clearing.
- **AI Assistant**: Financial DNA synthesis via Genkit.
- **Admin Command Center**: Supply management and audit logs.
