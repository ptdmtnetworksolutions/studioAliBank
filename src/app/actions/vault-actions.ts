'use server';

/**
 * @fileOverview Server Actions untuk operasional Vault AliBank.
 * Mendukung interaksi dengan Smart Contract AliBankVault milik user dengan verifikasi kriptografis token admin.
 */

import { ethers } from 'ethers';
import { getVaultPrivateKey } from '@/lib/secrets';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { initializeApp as initAdminApp, getApps as getAdminApps, App as AdminApp } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';

function getAdminApp(): AdminApp {
  if (getAdminApps().length > 0) return getAdminApps()[0];
  return initAdminApp({ projectId: 'darmedia-pos' });
}

// Identitas Super Admin Tetap
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

/**
 * Mengeksekusi penarikan dana dari Vault AliBank.
 * Memvalidasi token ID Firebase secara kriptografis di server sebelum mengeksekusi on-chain.
 */
export async function executeVaultWithdrawalAction(
  recipient: string, 
  amount: string, 
  idToken: string
) {
  // 1. Otorisasi Ketat Berbasis Verifikasi Token Kriptografis
  if (!idToken) {
    throw new Error('Unauthorized: Token otentikasi diperlukan.');
  }

  const adminApp = getAdminApp();
  const auth = getAdminAuth(adminApp);
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (err: any) {
    throw new Error('Unauthorized: Sesi kedaluwarsa atau token otentikasi tidak valid.');
  }

  if (decodedToken.uid !== OWNER_UID || (decodedToken.email !== OWNER_EMAIL && decodedToken.email !== 'aldzulfikar075@gmail.com')) {
    throw new Error('Unauthorized: Akses administratif ditolak. Anda bukan Super Admin.');
  }

  try {
    // 2. Ambil Konfigurasi dari Firestore via Admin SDK
    const db = getAdminFirestore(adminApp);
    const keySnap = await db.collection("system").doc("api_keys").get();
    
    if (!keySnap.exists) {
      throw new Error("Konfigurasi API Keys tidak ditemukan di Brankas.");
    }

    const config = keySnap.data()!;
    
    // 3. Ambil Kunci Vault (Private Key MetaMask Admin)
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
      rpcUrl = "https://ethereum-rpc.publicnode.com";
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
