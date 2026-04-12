/**
 * @fileOverview Modul Server-Side untuk mengakses kredensial sensitif.
 * Diperbarui untuk mendukung pengambilan kunci yang lebih stabil di Firebase Studio.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Mengambil Private Key Vault AliBank.
 * Mencoba Secret Manager terlebih dahulu, kemudian fallback ke Firestore system/api_keys.
 * @returns {Promise<string>} Kunci privat dalam format string hex.
 */
export async function getVaultPrivateKey(): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || 'darmedia-pos';
  
  // 1. Upayakan akses melalui GCP Secret Manager (Standard Produksi)
  try {
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/ALIBANK_VAULT_PRIVATE_KEY/versions/latest`,
    });

    const payload = version.payload?.data?.toString();
    if (payload) return payload;
  } catch (error: any) {
    console.warn('Secret Manager tidak tersedia. Mencoba fallback Firestore...');
  }
  
  // 2. Fallback: Ambil dari Firestore (system/api_keys)
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const snap = await getDoc(doc(db, "system", "api_keys"));
    
    if (snap.exists()) {
      const data = snap.data();
      if (data.vaultPrivateKey) {
        return data.vaultPrivateKey;
      }
    }
  } catch (fsError) {
    console.error('Gagal mengambil kunci dari Firestore:', fsError);
  }

  throw new Error(`Vault key tidak ditemukan di project '${projectId}'. Pastikan Anda sudah memasukkan Private Key MetaMask di menu 'API Management' pada Dashboard Admin.`);
}
