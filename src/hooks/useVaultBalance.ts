'use client';

/**
 * @fileOverview Hook untuk mengambil saldo ETH on-chain milik user di Smart Contract AliBankVault.
 * Menggunakan public/custom RPC Ethereum Mainnet (Read-Only call).
 */

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const VAULT_ADDRESS_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';

const FALLBACK_ETH_RPCS = [
  "https://rpc.ankr.com/eth",
  "https://ethereum-rpc.publicnode.com",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com"
];

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

      let dynamicRpc = "";
      let infuraId = "";
      let dynamicAddress = VAULT_ADDRESS_DEFAULT;

      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        const keySnap = await getDoc(doc(db, "system", "public_keys"));
        if (keySnap.exists()) {
          const data = keySnap.data();
          if (data.ethereumRpcUrl) dynamicRpc = data.ethereumRpcUrl;
          if (data.infuraProjectId) infuraId = data.infuraProjectId;
          if (data.vaultContractAddress) dynamicAddress = data.vaultContractAddress;
        }
      } catch (e) {
        console.warn("Firestore RPC fetch failed, using fallbacks.");
      }

      const rpcsToTry = [];
      if (infuraId) {
        rpcsToTry.push(`https://mainnet.infura.io/v3/${infuraId}`);
      }
      if (dynamicRpc) rpcsToTry.push(dynamicRpc);
      rpcsToTry.push(...FALLBACK_ETH_RPCS);

      let success = false;
      let lastError: any = null;

      for (const rpcUrl of rpcsToTry) {
        if (!active) break;
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
            staticNetwork: ethers.Network.from(1)
          });
          const contract = new ethers.Contract(dynamicAddress, AliBankVaultABI, provider);
          
          // Memanggil balances(address) view method di smart contract
          const balanceWei = await contract.balances(walletAddress);
          const balanceEth = parseFloat(ethers.formatEther(balanceWei));

          if (active) {
            setOnChainBalance(balanceEth);
            success = true;
            break;
          }
        } catch (err: any) {
          console.warn(`Gagal membaca saldo dari RPC ${rpcUrl}:`, err.message || err);
          lastError = err;
        }
      }

      if (!success && active) {
        setError(lastError?.message || 'Gagal mengambil saldo on-chain dari semua node RPC');
      }
      if (active) {
        setIsLoading(false);
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
