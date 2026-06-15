
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
 * Menggunakan Kredensial riil dari Vault Firestore/Secret Manager.
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
    // 2. Ambil Konfigurasi dari Firestore
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const keySnap = await getDoc(doc(db, "system", "api_keys"));
    
    if (!keySnap.exists()) {
      throw new Error("Konfigurasi API Keys tidak ditemukan di Brankas.");
    }

    const config = keySnap.data();
    
    // 3. Ambil Kunci Vault (Private Key MetaMask Anda)
    // Mencoba Secret Manager (GCP), fallback ke field vaultPrivateKey di Firestore
    const privateKey = await getVaultPrivateKey();

    if (!privateKey || privateKey === "YOUR_KEY") {
      throw new Error("Kunci Privat Vault belum diset atau masih menggunakan placeholder.");
    }

    // 4. Inisialisasi Provider (Prioritaskan Infura dari Vault)
    let rpcUrl = config.ethereumRpcUrl;
    if (config.infuraProjectId) {
      rpcUrl = `https://mainnet.infura.io/v3/${config.infuraProjectId}`;
    }
    
    if (!rpcUrl) {
      rpcUrl = "https://ethereum-rpc.publicnode.com"; // Terakhir
    }

    const contractAddress = config.vaultContractAddress || "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    // 5. Cek Saldo Dompet untuk Gas
    const walletBalance = await provider.getBalance(wallet.address);
    if (walletBalance < ethers.parseEther("0.002")) {
      throw new Error(`Dompet MetaMask Anda (${wallet.address}) tidak memiliki cukup saldo ETH untuk biaya GAS (Minimal 0.002 ETH). Saldo saat ini: ${ethers.formatEther(walletBalance)} ETH.`);
    }

    // 6. Inisialisasi Interface Kontrak
    const vaultContract = new ethers.Contract(contractAddress, AliBankVaultABI, wallet);

    // 7. Eksekusi Fungsi Withdraw
    const tx = await vaultContract.withdraw(ethers.parseEther(amount), {
      gasLimit: 120000 
    });

    console.log(`Withdrawal Initiated: ${tx.hash}`);
    await tx.wait();

    // 8. Forward to external recipient wallet if specified
    let finalMessage = `Berhasil! Saldo ${amount} ETH telah ditarik dari kontrak ke dompet Brankas (${wallet.address}).`;
    let usedHash = tx.hash;

    if (recipient && recipient.toLowerCase() !== wallet.address.toLowerCase()) {
      console.log(`Forwarding ${amount} ETH to external wallet ${recipient}...`);
      const forwardTx = await wallet.sendTransaction({
        to: recipient,
        value: ethers.parseEther(amount),
        gasLimit: 21000
      });
      await forwardTx.wait();
      usedHash = forwardTx.hash;
      finalMessage = `Berhasil! Saldo ${amount} ETH ditarik dari Kontrak Brankas dan dikirim secara on-chain ke alamat tujuan Anda: ${recipient}.`;
    }

    return { 
      success: true, 
      hash: usedHash,
      message: finalMessage
    };
  } catch (err: any) {
    console.error('Vault Action Error:', err);
    throw new Error(err.message || 'Kegagalan pada Node Kliring AliBank V3.');
  }
}
