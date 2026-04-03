
/**
 * @fileOverview Modul Server-Side untuk mengakses GCP Secret Manager.
 * Digunakan untuk mengambil kredensial sensitif seperti Vault Private Key.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

/**
 * Mengambil Private Key Vault AliBank dari GCP Secret Manager.
 * @returns {Promise<string>} Kunci privat dalam format string hex.
 */
export async function getVaultPrivateKey(): Promise<string> {
  // Gunakan ID Proyek dari environment variable atau default
  const projectId = process.env.GCP_PROJECT_ID || 'darmedia-pos';
  
  try {
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/ALIBANK_VAULT_PRIVATE_KEY/versions/latest`,
    });

    const payload = version.payload?.data?.toString();
    
    if (!payload) {
      throw new Error('Vault key payload kosong di Secret Manager');
    }
    
    return payload;
  } catch (error) {
    console.error('Gagal mengakses Secret Manager:', error);
    throw new Error('Vault key tidak ditemukan atau otorisasi Secret Manager gagal.');
  }
}
