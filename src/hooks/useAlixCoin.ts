
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AlixCoinABI } from '@/lib/abi/AlixCoin';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

const ALX_ADDRESS_DEFAULT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";

const FALLBACK_RPCS = [
  "https://rpc.ankr.com/polygon",
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://polygon-rpc.com"
];

export function useAlixCoin() {
  const [totalSupply, setTotalSupply]           = useState<string>('0');
  const [maxSupply, setMaxSupply]               = useState<string>('0');
  const [remainingMintable, setRemaining]       = useState<string>('0');
  const [circulationRate, setCirculationRate]   = useState<number>(0);
  const [isPaused, setIsPaused]                 = useState<boolean>(false);
  const [isLoading, setIsLoading]               = useState<boolean>(true);
  const [isNodeError, setIsNodeError]           = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    let dynamicRpc = "";
    let infuraId = "";
    let dynamicAddress = ALX_ADDRESS_DEFAULT;

    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const keySnap = await getDoc(doc(db, "system", "api_keys"));
      if (keySnap.exists()) {
        const data = keySnap.data();
        if (data.polygonRpcUrl) dynamicRpc = data.polygonRpcUrl;
        if (data.infuraProjectId) infuraId = data.infuraProjectId;
        if (data.alxContractAddress) dynamicAddress = data.alxContractAddress;
      }
    } catch (e) {
      console.warn("Firestore RPC fetch failed, using fallbacks.");
    }

    const rpcsToTry = [];
    if (dynamicRpc) rpcsToTry.push(dynamicRpc);
    if (infuraId) rpcsToTry.push(`https://polygon-mainnet.infura.io/v3/${infuraId}`);
    rpcsToTry.push(...FALLBACK_RPCS);

    let success = false;

    for (const rpcUrl of rpcsToTry) {
      if (success) break;
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
          staticNetwork: ethers.Network.from(137)
        });
        
        const contract = new ethers.Contract(dynamicAddress, AlixCoinABI, provider);

        const [supply, max, remaining, rate, paused] = await Promise.all([
          contract.totalSupply(),
          contract.MAX_SUPPLY(),
          contract.remainingMintable(),
          contract.circulationRate(),
          contract.paused(),
        ]);

        setTotalSupply(ethers.formatEther(supply));
        setMaxSupply(ethers.formatEther(max));
        setRemaining(ethers.formatEther(remaining));
        setCirculationRate(Number(rate) / 100);
        setIsPaused(paused);
        
        success = true;
        setIsNodeError(false);
      } catch (error) {
        console.warn(`Failed to fetch ALX from RPC ${rpcUrl}, trying next...`);
      }
    }

    if (!success) setIsNodeError(true);
    setIsLoading(false);
  }, []);

  const mintALX = useCallback(async (
    toAddress: string,
    amount: string,
    signer: ethers.Signer
  ) => {
    let dynamicAddress = ALX_ADDRESS_DEFAULT;
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const keySnap = await getDoc(doc(db, "system", "api_keys"));
      if (keySnap.exists()) dynamicAddress = keySnap.data().alxContractAddress || ALX_ADDRESS_DEFAULT;
    } catch (e) {}

    const contract = new ethers.Contract(dynamicAddress, AlixCoinABI, signer);
    const amountWei = ethers.parseEther(amount);
    
    const network = await signer.provider?.getNetwork();
    if (network?.chainId !== 137n) {
      throw new Error("MetaMask harus berada di jaringan Polygon Mainnet.");
    }

    const tx = await contract.mint(toAddress, amountWei);
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [fetchData]);

  const burnALX = useCallback(async (
    amount: string,
    signer: ethers.Signer
  ) => {
    let dynamicAddress = ALX_ADDRESS_DEFAULT;
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const keySnap = await getDoc(doc(db, "system", "api_keys"));
      if (keySnap.exists()) dynamicAddress = keySnap.data().alxContractAddress || ALX_ADDRESS_DEFAULT;
    } catch (e) {}

    const contract = new ethers.Contract(dynamicAddress, AlixCoinABI, signer);
    const amountWei = ethers.parseEther(amount);
    
    const network = await signer.provider?.getNetwork();
    if (network?.chainId !== 137n) throw new Error("Gunakan jaringan Polygon.");

    const tx = await contract.burn(amountWei);
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [fetchData]);

  const togglePause = useCallback(async (signer: ethers.Signer) => {
    let dynamicAddress = ALX_ADDRESS_DEFAULT;
    try {
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      const db = getFirestore(app);
      const keySnap = await getDoc(doc(db, "system", "api_keys"));
      if (keySnap.exists()) dynamicAddress = keySnap.data().alxContractAddress || ALX_ADDRESS_DEFAULT;
    } catch (e) {}

    const contract = new ethers.Contract(dynamicAddress, AlixCoinABI, signer);
    
    const network = await signer.provider?.getNetwork();
    if (network?.chainId !== 137n) throw new Error("Gunakan jaringan Polygon.");

    const tx = isPaused 
      ? await contract.unpause()
      : await contract.pause();
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [isPaused, fetchData]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    totalSupply,
    maxSupply,
    remainingMintable,
    circulationRate,
    isPaused,
    isLoading,
    isNodeError,
    mintALX,
    burnALX,
    togglePause,
    refetch: fetchData,
  };
}
