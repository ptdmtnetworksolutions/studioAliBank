
'use server';

/**
 * @fileOverview Server Actions untuk operasional Vault AliBank.
 * Mendukung interaksi dengan Smart Contract AliBankVault milik user.
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
 * Mengeksekusi penarikan dana dari Vault AliBank.
 * Kontrak user: withdraw(uint256 _amount) -> Mengirim ke msg.sender (Pemilik Kunci)
 */
export async function executeVaultWithdrawalAction(
  recipient: string, 
  amount: string, 
  adminUid: string,
  adminEmail: string
) {
  // 1. Otorisasi Ketat
  if (adminUid !== OWNER_UID || adminEmail !== OWNER_EMAIL) {
    throw new Error('Unauthorized: Akses administratif ditolak.');
  }

  try {
    // 2. Ambil Kunci Vault (Private Key MetaMask Anda)
    const privateKey = await getVaultPrivateKey();

    // 3. Ambil Konfigurasi dari Firestore
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const keySnap = await getDoc(doc(db, "system", "api_keys"));
    
    const config = keySnap.exists() ? keySnap.data() : {};
    const rpcUrl = config.ethereumRpcUrl || "https://ethereum-rpc.publicnode.com";
    const contractAddress = config.vaultContractAddress || "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

    // 4. Inisialisasi Provider & Wallet
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 5. Cek Saldo Dompet untuk Gas
    const walletBalance = await provider.getBalance(wallet.address);
    if (walletBalance === 0n) {
      throw new Error(`Dompet MetaMask Anda (${wallet.address}) tidak memiliki saldo ETH untuk membayar biaya GAS. Isi minimal 0.005 ETH agar bisa melakukan penarikan.`);
    }

    // 6. Inisialisasi Interface Kontrak
    const vaultContract = new ethers.Contract(contractAddress, AliBankVaultABI, wallet);

    // 7. Eksekusi Fungsi Withdraw (Mengirim ke wallet yang memegang Private Key)
    // Catatan: Kontrak Anda tidak menerima alamat tujuan, dia mengirim otomatis ke msg.sender.
    const tx = await vaultContract.withdraw(ethers.parseEther(amount), {
      gasLimit: 100000 
    });

    console.log(`Withdrawal Initiated: ${tx.hash}`);
    await tx.wait();

    return { 
      success: true, 
      hash: tx.hash,
      message: `Berhasil! Saldo ETH telah dikirim kembali ke dompet MetaMask Anda (${wallet.address}).`
    };
  } catch (err: any) {
    console.error('Vault Action Error:', err);
    throw new Error(err.message || 'Kegagalan pada Node Kliring AliBank V3.');
  }
}
