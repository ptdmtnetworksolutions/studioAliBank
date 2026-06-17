
'use client';

/**
 * @fileOverview Hook untuk mengelola deposit on-chain ke Smart Contract AliBankVault.
 * Menggunakan ethers.js BrowserProvider (MetaMask / wallet browser apapun).
 * 
 * Alur: Koneksi Wallet → Verifikasi Mainnet → Deposit → Catat Firestore
 * 
 * Kontrak: 0x56268032A3B3E64CFeF1916d591087CF8dF40945 (Ethereum Mainnet)
 */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const VAULT_CONTRACT_ADDRESS = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
const ETH_MAINNET_CHAIN_ID = '0x1'; // 1 dalam hex

export type DepositStep = 'idle' | 'connecting' | 'switching_network' | 'depositing' | 'confirming' | 'success' | 'error';

export interface VaultDepositState {
  step: DepositStep;
  walletAddress: string | null;
  txHash: string | null;
  error: string | null;
  gasEstimate: string | null;
  onChainBalance: string | null; // Saldo user di dalam kontrak
}

export function useVaultDeposit(userId?: string) {
  const [state, setState] = useState<VaultDepositState>({
    step: 'idle',
    walletAddress: null,
    txHash: null,
    error: null,
    gasEstimate: null,
    onChainBalance: null,
  });

  /** Cek apakah MetaMask/window.ethereum tersedia */
  const isWalletAvailable = typeof window !== 'undefined' && !!(window as any).ethereum;

  /** 
   * Langkah 1: Hubungkan wallet dan verifikasi Mainnet.
   * Jika berhasil, fetch saldo on-chain user di kontrak.
   */
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!isWalletAvailable) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: 'MetaMask tidak terdeteksi. Silakan install ekstensi MetaMask di browser Anda.'
      }));
      return null;
    }

    setState(prev => ({ ...prev, step: 'connecting', error: null }));

    try {
      const ethereum = (window as any).ethereum;
      const provider = new ethers.BrowserProvider(ethereum);

      // Request akses wallet
      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        throw new Error('Tidak ada akun yang dipilih di MetaMask.');
      }

      const walletAddress = accounts[0];

      // Cek apakah di Mainnet (chainId = 1 = 0x1)
      const chainId: string = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== ETH_MAINNET_CHAIN_ID) {
        setState(prev => ({ ...prev, step: 'switching_network' }));
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ETH_MAINNET_CHAIN_ID }],
          });
        } catch (switchError: any) {
          throw new Error(
            `Jaringan salah! AliBank Vault ada di Ethereum Mainnet. Mohon ganti jaringan secara manual di MetaMask Anda.`
          );
        }
      }

      // Fetch saldo on-chain user di kontrak
      const contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, AliBankVaultABI, provider);
      const onChainBalanceWei = await contract.balances(walletAddress).catch(() => BigInt(0));
      const onChainBalance = ethers.formatEther(onChainBalanceWei);

      setState(prev => ({
        ...prev,
        step: 'idle',
        walletAddress,
        onChainBalance,
        error: null,
      }));

      return walletAddress;
    } catch (err: any) {
      const message = err.message?.includes('user rejected')
        ? 'Koneksi ditolak. Silakan izinkan AliBank mengakses wallet Anda.'
        : err.message || 'Gagal menghubungkan wallet.';
      setState(prev => ({ ...prev, step: 'error', error: message }));
      return null;
    }
  }, [isWalletAvailable]);

  /**
   * Estimasi biaya gas sebelum deposit.
   */
  const estimateGas = useCallback(async (amountEth: string): Promise<string | null> => {
    if (!isWalletAvailable || !state.walletAddress) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const gasPrice = await provider.getFeeData();
      // Gas deposit() standar ≈ 50.000 unit
      const gasUnits = BigInt(60000);
      const gasPriceWei = gasPrice.gasPrice || ethers.parseUnits('20', 'gwei');
      const totalGasWei = gasUnits * gasPriceWei;
      const totalGasEth = parseFloat(ethers.formatEther(totalGasWei));
      const estimate = `~${totalGasEth.toFixed(6)} ETH`;
      setState(prev => ({ ...prev, gasEstimate: estimate }));
      return estimate;
    } catch {
      return null;
    }
  }, [isWalletAvailable, state.walletAddress]);

  /**
   * Langkah 2: Eksekusi deposit on-chain.
   * Memanggil contract.deposit({ value: parseEther(amount) })
   */
  const executeDeposit = useCallback(async (amountEth: string): Promise<boolean> => {
    if (!isWalletAvailable || !state.walletAddress) {
      setState(prev => ({ ...prev, step: 'error', error: 'Wallet belum terhubung.' }));
      return false;
    }

    if (parseFloat(amountEth) <= 0) {
      setState(prev => ({ ...prev, step: 'error', error: 'Jumlah deposit harus lebih dari 0 ETH.' }));
      return false;
    }

    setState(prev => ({ ...prev, step: 'depositing', error: null, txHash: null }));

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();

      // Cek saldo wallet user cukup untuk deposit + gas
      const walletBalance = await provider.getBalance(state.walletAddress);
      const depositAmount = ethers.parseEther(amountEth);
      const estimatedGas = ethers.parseUnits('0.002', 'ether'); // Buffer gas 0.002 ETH

      if (walletBalance < depositAmount + estimatedGas) {
        throw new Error(
          `Saldo ETH di wallet Anda tidak cukup. Diperlukan ${amountEth} ETH + ~0.002 ETH untuk gas. ` +
          `Saldo Anda: ${parseFloat(ethers.formatEther(walletBalance)).toFixed(6)} ETH`
        );
      }

      // Inisialisasi kontrak dengan signer
      const contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, AliBankVaultABI, signer);

      // Eksekusi deposit() — MetaMask akan muncul meminta konfirmasi user
      const tx = await contract.deposit({
        value: depositAmount,
        gasLimit: 100000, // Buffer keamanan
      });

      setState(prev => ({ ...prev, step: 'confirming', txHash: tx.hash }));

      // Tunggu 1 konfirmasi blok
      const receipt = await tx.wait(1);

      if (!receipt || receipt.status === 0) {
        throw new Error('Transaksi gagal di blockchain. Cek Etherscan untuk detail.');
      }

      // Catat ke Firestore
      if (userId) {
        await recordToFirestore({
          userId,
          walletAddress: state.walletAddress!,
          amountEth,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
        });
      }

      // Refresh saldo on-chain
      const newBalanceWei = await contract.balances(state.walletAddress!).catch(() => BigInt(0));
      const newBalance = ethers.formatEther(newBalanceWei);

      setState(prev => ({
        ...prev,
        step: 'success',
        txHash: tx.hash,
        onChainBalance: newBalance,
        error: null,
      }));

      return true;
    } catch (err: any) {
      let message = err.message || 'Deposit gagal.';
      if (err.code === 4001 || err.message?.includes('user rejected')) {
        message = 'Transaksi dibatalkan. Anda menolak konfirmasi di MetaMask.';
      } else if (err.message?.includes('insufficient funds')) {
        message = 'Saldo ETH di wallet tidak cukup untuk membayar gas.';
      }
      setState(prev => ({ ...prev, step: 'error', error: message }));
      return false;
    }
  }, [isWalletAvailable, state.walletAddress, userId]);

  /** Reset state ke idle */
  const reset = useCallback(() => {
    setState({
      step: 'idle',
      walletAddress: null,
      txHash: null,
      error: null,
      gasEstimate: null,
      onChainBalance: null,
    });
  }, []);

  return {
    ...state,
    isWalletAvailable,
    connectWallet,
    estimateGas,
    executeDeposit,
    reset,
  };
}

/** Catat riwayat deposit ke Firestore untuk riwayat transaksi in-app */
async function recordToFirestore(data: {
  userId: string;
  walletAddress: string;
  amountEth: string;
  txHash: string;
  blockNumber: number;
}) {
  try {
    const db = getFirestore(getApp());
    await addDoc(collection(db, 'transactions'), {
      userId: data.userId,
      type: 'vault_deposit_onchain',
      description: `Deposit on-chain ${data.amountEth} ETH ke AliBankVault`,
      amountEth: parseFloat(data.amountEth),
      currency: 'ETH',
      txHash: data.txHash,
      blockNumber: data.blockNumber,
      contractAddress: VAULT_CONTRACT_ADDRESS,
      walletAddress: data.walletAddress,
      network: 'Ethereum Mainnet',
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // Non-fatal: Firestore gagal tidak membatalkan deposit on-chain
    console.warn('Gagal mencatat ke Firestore (non-fatal):', err);
  }
}
