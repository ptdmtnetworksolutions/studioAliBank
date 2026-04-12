'use server';

/**
 * @fileOverview Server Actions untuk operasional Vault AliBank yang aman.
 * Mendukung interaksi dengan Smart Contract Brankas Pusat V3.
 */

import { ethers } from 'ethers';
import { getVaultPrivateKey } from '@/lib/secrets';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Identitas Super Admin Tetap
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

/**
 * Mengeksekusi penarikan dana (Disbursement) dari Vault pusat AliBank.
 * Menggunakan Smart Contract yang terdaftar di API Management.
 */
export async function executeVaultWithdrawalAction(
  recipient: string, 
  amount: string, 
  adminUid: string,
  adminEmail: string
) {
  // 1. Otorisasi Ketat: Hanya Super Admin AliBank yang sah
  if (adminUid !== OWNER_UID || adminEmail !== OWNER_EMAIL) {
    throw new Error('Unauthorized: Akses administratif ditolak oleh Node Keamanan.');
  }

  try {
    // 2. Ambil Kunci Vault (GCP Secret Manager atau Firestore Fallback)
    const privateKey = await getVaultPrivateKey();

    // 3. Ambil Konfigurasi Kontrak & RPC dari Firestore secara dinamis
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const keySnap = await getDoc(doc(db, "system", "api_keys"));
    
    const config = keySnap.exists() ? keySnap.data() : {};
    const rpcUrl = config.ethereumRpcUrl || "https://ethereum-rpc.publicnode.com";
    const contractAddress = config.vaultContractAddress || "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

    // 4. Inisialisasi Provider & Wallet Secure Node
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 5. Inisialisasi Interface Kontrak Brankas
    const vaultContract = new ethers.Contract(contractAddress, AliBankVaultABI, wallet);

    // 6. Eksekusi Fungsi Withdraw pada Kontrak
    const tx = await vaultContract.withdraw(recipient, ethers.parseEther(amount), {
      gasLimit: 150000 
    });

    console.log(`Vault V3 Execution Successful: ${tx.hash}`);

    return { 
      success: true, 
      hash: tx.hash,
      message: 'Settlement on-chain berhasil disiarkan melalui Smart Contract Vault V3.'
    };
  } catch (err: any) {
    console.error('Vault Action Error:', err);
    throw new Error(err.message || 'Kegagalan kritis pada Node Kliring AliBank V3.');
  }
}
