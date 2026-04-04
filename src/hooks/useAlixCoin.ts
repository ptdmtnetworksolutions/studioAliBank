
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AlixCoinABI } from '@/lib/abi/AlixCoin';

const ALX_ADDRESS = process.env.NEXT_PUBLIC_ALX_ADDRESS || "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";

// Daftar RPC Fallback untuk stabilitas tinggi
const FALLBACK_RPCS = [
  process.env.NEXT_PUBLIC_POLYGON_RPC,
  "https://polygon-bor-rpc.publicnode.com",
  "https://rpc.ankr.com/polygon",
  "https://1rpc.io/matic",
  "https://polygon-rpc.com"
].filter(Boolean) as string[];

export function useAlixCoin() {
  const [totalSupply, setTotalSupply]           = useState<string>('0');
  const [maxSupply, setMaxSupply]               = useState<string>('0');
  const [remainingMintable, setRemaining]       = useState<string>('0');
  const [circulationRate, setCirculationRate]   = useState<number>(0);
  const [isPaused, setIsPaused]                 = useState<boolean>(false);
  const [isLoading, setIsLoading]               = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    let success = false;
    
    // Coba setiap RPC sampai berhasil
    for (const rpcUrl of FALLBACK_RPCS) {
      if (success) break;
      
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
          staticNetwork: ethers.Network.from(137) // Mempercepat deteksi dengan static network
        });
        
        const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, provider);

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
        console.log(`ALX Data fetched successfully via ${rpcUrl}`);
      } catch (error) {
        console.warn(`Failed to fetch from RPC ${rpcUrl}, trying next...`);
      }
    }

    setIsLoading(false);
  }, []);

  const mintALX = useCallback(async (
    toAddress: string,
    amount: string,
    signer: ethers.Signer
  ) => {
    const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, signer);
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.mint(toAddress, amountWei);
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [fetchData]);

  const burnALX = useCallback(async (
    amount: string,
    signer: ethers.Signer
  ) => {
    const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, signer);
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.burn(amountWei);
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [fetchData]);

  const togglePause = useCallback(async (signer: ethers.Signer) => {
    const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, signer);
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
    mintALX,
    burnALX,
    togglePause,
    refetch: fetchData,
  };
}
