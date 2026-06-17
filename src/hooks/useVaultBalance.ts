'use client';

/**
 * @fileOverview Hook untuk mengambil saldo ETH on-chain milik user di Smart Contract AliBankVault.
 * Menggunakan public RPC Ethereum Mainnet (Read-Only call).
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';

const VAULT_CONTRACT_ADDRESS = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
const ETH_RPC_URL = 'https://cloudflare-eth.com'; // Public RPC Ethereum Mainnet yang cepat dan andal

export function useVaultBalance(walletAddress: string | null) {
  const [onChainBalance, setOnChainBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress === '0xNoWalletInitialized') {
      setOnChainBalance(0);
      return;
    }

    let active = true;
    const fetchBalance = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
        const contract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, AliBankVaultABI, provider);
        
        // Memanggil balances(address) view method di smart contract
        const balanceWei = await contract.balances(walletAddress).catch(() => BigInt(0));
        const balanceEth = parseFloat(ethers.formatEther(balanceWei));

        if (active) {
          setOnChainBalance(balanceEth);
        }
      } catch (err: any) {
        console.warn('Gagal membaca saldo on-chain dari AliBankVault:', err);
        if (active) {
          setError(err.message || 'Gagal mengambil saldo on-chain');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchBalance();

    // Refetch setiap 30 detik untuk sinkronisasi real-time
    const interval = setInterval(fetchBalance, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [walletAddress]);

  return { onChainBalance, isLoading, error };
}
