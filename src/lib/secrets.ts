
/**
 * @fileOverview Modul Server-Side untuk mengakses GCP Secret Manager.
 * Digunakan untuk mengambil kredensial sensitif seperti Vault Private Key.
 * Mendukung fallback ke Firestore untuk kemudahan konfigurasi di Firebase Studio.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const client = new SecretManagerServiceClient();

/**
 * Mengambil Private Key Vault AliBank.
 * Mencoba Secret Manager terlebih dahulu, kemudian fallback ke Firestore system/api_keys.
 * @returns {Promise<string>} Kunci privat dalam format string hex.
 */
export async function getVaultPrivateKey(): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || 'darmedia-pos';
  
  try {
    // 1. Upayakan akses melalui GCP Secret Manager (Standard Produksi)
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/ALIBANK_VAULT_PRIVATE_KEY/versions/latest`,
    });

    const payload = version.payload?.data?.toString();
    if (payload) return payload;
    throw new Error('Empty payload');
  } catch (error: any) {
    console.warn('Secret Manager tidak tersedia atau belum dikonfigurasi. Menggunakan fallback Firestore...');
    
    try {
      // 2. Fallback: Ambil dari Firestore (Memudahkan setup di Firebase Studio)
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const snap = await getDoc(doc(db, "system", "api_keys"));
      
      if (snap.exists() && snap.data().vaultPrivateKey) {
        return snap.data().vaultPrivateKey;
      }
    } catch (fsError) {
      console.error('Gagal mengambil kunci dari Firestore:', fsError);
    }

    throw new Error(`Vault key tidak ditemukan di project '${projectId}'. Silakan masukkan Private Key dompet MetaMask Anda pada menu 'Credential Vault' di Dashboard Admin.`);
  }
}
