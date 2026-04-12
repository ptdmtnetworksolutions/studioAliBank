
'use server';

/**
 * @fileOverview Server Actions untuk operasional Vault AliBank yang aman.
 * Mendukung interaksi dengan Smart Contract Brankas Pusat V3.
 */

import { ethers } from 'ethers';
import { getVaultPrivateKey } from '@/lib/secrets';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';

// Konfigurasi Infrastruktur (Production Node)
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";
const VAULT_CONTRACT_ADDRESS = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

/**
 * Mengeksekusi penarikan dana (Disbursement) dari Vault pusat AliBank.
 * Menggunakan Smart Contract AliBankVaultV3 untuk akuntansi on-chain.
 */
export async function executeVaultWithdrawalAction(
  recipient: string, 
  amount: string, 
  adminUid: string,
  adminEmail: string
) {
  // 1. Otorisasi Ketat: Hanya Super Admin AliBank yang sah
  if (adminUid !== OWNER_UID || adminEmail !== OWNER_EMAIL) {
    throw new Error('Unauthorized: Node keamanan menolak akses administratif luar.');
  }

  try {
    // 2. Ambil Kunci Vault dari GCP Secret Manager
    const privateKey = await getVaultPrivateKey();

    // 3. Inisialisasi Provider & Wallet Secure Node
    const provider = new ethers.JsonRpcProvider(GLOBAL_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 4. Inisialisasi Interface Kontrak Brankas
    const vaultContract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, AliBankVaultABI, wallet);

    // 5. Eksekusi Fungsi Withdraw pada Kontrak
    // Ini lebih profesional daripada transfer ETH biasa karena tercatat di 'Withdrawal' event kontrak.
    const tx = await vaultContract.withdraw(recipient, ethers.parseEther(amount), {
      gasLimit: 100000 
    });

    console.log(`Vault V3 Execution: ${tx.hash}`);

    // 6. Tunggu Konfirmasi Node (Opsional untuk respons cepat)
    // await tx.wait();

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
