
'use server';

/**
 * @fileOverview Server Actions untuk operasional Vault AliBank yang aman.
 */

import { ethers } from 'ethers';
import { getVaultPrivateKey } from '@/lib/secrets';

// Konfigurasi Statis (Dapat dipindahkan ke API Vault Firestore jika diperlukan)
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";

/**
 * Mengeksekusi penarikan dana (Disbursement) dari Vault pusat AliBank.
 * @param recipient Alamat dompet tujuan.
 * @param amount Jumlah ETH yang akan dicairkan.
 * @param adminUid UID admin yang melakukan permintaan.
 * @param adminEmail Email admin yang melakukan permintaan.
 */
export async function executeVaultWithdrawalAction(
  recipient: string, 
  amount: string, 
  adminUid: string,
  adminEmail: string
) {
  // 1. Validasi Otoritas Server-Side (Hardcoded for Super Admin)
  if (adminUid !== OWNER_UID || adminEmail !== OWNER_EMAIL) {
    throw new Error('Unauthorized: Hanya Super Admin yang diizinkan mengeksekusi penarikan Vault.');
  }

  try {
    // 2. Ambil Private Key dari GCP Secret Manager (Aman, tidak pernah ke klien)
    const privateKey = await getVaultPrivateKey();

    // 3. Inisialisasi Provider & Wallet
    const provider = new ethers.JsonRpcProvider(GLOBAL_RPC);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 4. Kirim Transaksi
    const tx = await wallet.sendTransaction({
      to: recipient,
      value: ethers.parseEther(amount)
    });

    // 5. Tunggu Konfirmasi Blok (Optional: bisa dikembalikan langsung untuk respons lebih cepat)
    await tx.wait();

    return { 
      success: true, 
      hash: tx.hash,
      message: 'Transaksi on-chain berhasil dieksekusi melalui Secure Node.'
    };
  } catch (err: any) {
    console.error('Vault Action Error:', err);
    throw new Error(err.message || 'Kegagalan eksekusi on-chain pada Secure Node.');
  }
}
