'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const VAULT_ADDRESS_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
const APY = 0.12; // 12% APY

const FALLBACK_ETH_RPCS = [
  "https://rpc.ankr.com/eth",
  "https://ethereum-rpc.publicnode.com",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com"
];

export function useVaultStaking(walletAddress: string | null, userId: string | null) {
  const [stakedEth, setStakedEth] = useState<number>(0);
  const [depositTimestamp, setDepositTimestamp] = useState<number>(0);
  const [lastClaimedTimestamp, setLastClaimedTimestamp] = useState<number>(0);
  const [alxPrice, setAlxPrice] = useState<number>(12.24);
  const [ethPrice, setEthPrice] = useState<number>(2420);
  const [accruedRewards, setAccruedRewards] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimSuccess, setClaimSuccess] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Simpan nilai terbaru dalam ref agar interval ticking tidak menggunakan nilai state yang usang
  const stakedEthRef = useRef(0);
  const depositTimestampRef = useRef(0);
  const lastClaimedTimestampRef = useRef(0);
  const ethPriceRef = useRef(2420);
  const alxPriceRef = useRef(12.24);

  useEffect(() => { stakedEthRef.current = stakedEth; }, [stakedEth]);
  useEffect(() => { depositTimestampRef.current = depositTimestamp; }, [depositTimestamp]);
  useEffect(() => { lastClaimedTimestampRef.current = lastClaimedTimestamp; }, [lastClaimedTimestamp]);
  useEffect(() => { ethPriceRef.current = ethPrice; }, [ethPrice]);
  useEffect(() => { alxPriceRef.current = alxPrice; }, [alxPrice]);

  // 1. Subscribe ke lastClaimedTimestamp di Firestore
  useEffect(() => {
    if (!userId) return;
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const userDocRef = doc(db, 'users', userId);

      const unsubscribe = onSnapshot(
        userDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.lastClaimedTimestamp) {
              setLastClaimedTimestamp(Number(data.lastClaimedTimestamp));
            } else {
              setLastClaimedTimestamp(0);
            }
          }
        },
        () => {}
      );
      return () => unsubscribe();
    } catch (e) {
      console.error("Gagal men-subscribe data user dari Firestore:", e);
    }
  }, [userId]);

  // 2. Mengambil data on-chain dan harga pasar secara periodik
  const fetchOnChainData = useCallback(async () => {
    if (!walletAddress || !walletAddress.startsWith('0x') || walletAddress === '0xNoWalletInitialized') {
      setStakedEth(0);
      setDepositTimestamp(0);
      setIsLoading(false);
      return;
    }

    let dynamicRpc = "";
    let infuraId = "";
    let dynamicAddress = VAULT_ADDRESS_DEFAULT;
    let currentAlxPrice = 12.24;

    // Ambil konfigurasi API & RPC dari Firestore
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

      const liqSnap = await getDoc(doc(db, "system", "liquidity"));
      if (liqSnap.exists()) {
        const data = liqSnap.data();
        if (data.lastAlxPriceUsdt) {
          currentAlxPrice = data.lastAlxPriceUsdt;
          setAlxPrice(data.lastAlxPriceUsdt);
        }
      }
    } catch (e) {
      console.warn("Firestore RPC fetch failed, using fallbacks:", e);
    }

    // Ambil harga pasar ETH/USDT
    let currentEthPrice = 2420;
    try {
      const res = await fetch('/api/market/ticker?symbols=["ETHUSDT"]');
      if (res.ok) {
        const data = await res.json();
        const ethData = data.find((d: any) => d.symbol === 'ETHUSDT');
        if (ethData?.lastPrice) {
          currentEthPrice = parseFloat(ethData.lastPrice);
          setEthPrice(currentEthPrice);
        }
      }
    } catch (e) {
      // Fallback ke Binance API langsung jika API internal gagal
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT');
        const data = await res.json();
        if (data.price) {
          currentEthPrice = parseFloat(data.price);
          setEthPrice(currentEthPrice);
        }
      } catch {}
    }

    // Ambil Saldo On-chain & Timestamp Deposit dari Ethereum RPC
    const rpcsToTry = [];
    if (infuraId) {
      rpcsToTry.push(`https://mainnet.infura.io/v3/${infuraId}`);
    }
    if (dynamicRpc) rpcsToTry.push(dynamicRpc);
    rpcsToTry.push(...FALLBACK_ETH_RPCS);

    let success = false;
    for (const rpcUrl of rpcsToTry) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
          staticNetwork: ethers.Network.from(1)
        });
        const contract = new ethers.Contract(dynamicAddress, AliBankVaultABI, provider);
        
        const [balanceWei, timestamp] = await Promise.all([
          contract.balances(walletAddress),
          contract.depositTimestamps(walletAddress)
        ]);

        setStakedEth(parseFloat(ethers.formatEther(balanceWei)));
        setDepositTimestamp(Number(timestamp));
        success = true;
        break;
      } catch (err) {
        console.warn(`Gagal membaca saldo staking dari RPC ${rpcUrl}:`, err);
      }
    }

    if (!success) {
      console.error("Gagal menyinkronkan data staking dari semua node RPC.");
    }
    setIsLoading(false);
  }, [walletAddress]);

  useEffect(() => {
    fetchOnChainData();
    const interval = setInterval(fetchOnChainData, 30000);
    return () => clearInterval(interval);
  }, [fetchOnChainData]);

  // 3. Counter berdetak (Ticking) setiap 1 detik
  useEffect(() => {
    const timer = setInterval(() => {
      const staked = stakedEthRef.current;
      const depTime = depositTimestampRef.current;
      const lastClaim = lastClaimedTimestampRef.current;
      const ethP = ethPriceRef.current;
      const alxP = alxPriceRef.current;

      if (staked <= 0 || depTime === 0) {
        setAccruedRewards(0);
        return;
      }

      // Mulai menghitung waktu staking efektif
      const effectiveStart = Math.max(depTime, lastClaim);
      const now = Math.floor(Date.now() / 1000);
      const duration = Math.max(0, now - effectiveStart);

      // Hitung reward ALX: Staked_ETH * APY * (duration / 365_days) * (harga_ETH / harga_ALX)
      const rewards = staked * APY * (duration / 31536000) * (ethP / alxP);
      setAccruedRewards(rewards);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 4. Kirim request klaim ke backend
  const claimYield = useCallback(async () => {
    if (!userId) return;
    setIsClaiming(true);
    setClaimError(null);
    setClaimSuccess(false);

    try {
      const res = await fetch('/api/crypto/claim-rewards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengklaim yield');
      }

      setClaimSuccess(true);
      await fetchOnChainData();
    } catch (err: any) {
      setClaimError(err.message || 'Terjadi kesalahan saat mengklaim yield.');
    } finally {
      setIsClaiming(false);
    }
  }, [userId, fetchOnChainData]);

  const resetClaimState = useCallback(() => {
    setClaimSuccess(false);
    setClaimError(null);
  }, []);

  return {
    stakedEth,
    depositTimestamp,
    lastClaimedTimestamp,
    accruedRewards,
    alxPrice,
    ethPrice,
    isLoading,
    isClaiming,
    claimSuccess,
    claimError,
    claimYield,
    resetClaimState,
    refetch: fetchOnChainData
  };
}
