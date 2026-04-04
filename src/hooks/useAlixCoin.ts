
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { AlixCoinABI } from '@/lib/abi/AlixCoin';

const ALX_ADDRESS = process.env.NEXT_PUBLIC_ALX_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_POLYGON_RPC;

export function useAlixCoin() {
  const [totalSupply, setTotalSupply]           = useState<string>('0');
  const [maxSupply, setMaxSupply]               = useState<string>('0');
  const [remainingMintable, setRemaining]       = useState<string>('0');
  const [circulationRate, setCirculationRate]   = useState<number>(0);
  const [isPaused, setIsPaused]                 = useState<boolean>(false);
  const [isLoading, setIsLoading]               = useState<boolean>(true);

  const fetchData = useCallback(async () => {
    if (!ALX_ADDRESS || !RPC_URL) {
      console.warn('ALX Configuration missing in .env');
      setIsLoading(false);
      return;
    }

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, provider);

      // Menggunakan penanganan error per fungsi agar satu kegagalan tidak mematikan seluruh fetch
      const [supply, max, remaining, rate, paused] = await Promise.all([
        contract.totalSupply().catch(() => 0n),
        contract.MAX_SUPPLY().catch(() => 0n),
        contract.remainingMintable().catch(() => 0n),
        contract.circulationRate().catch(() => 0n),
        contract.paused().catch(() => false),
      ]);

      setTotalSupply(ethers.formatEther(supply));
      setMaxSupply(ethers.formatEther(max));
      setRemaining(ethers.formatEther(remaining));
      setCirculationRate(Number(rate) / 100);
      setIsPaused(paused);

    } catch (error) {
      console.error('Error fetch ALX data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const mintALX = useCallback(async (
    toAddress: string,
    amount: string,
    signer: ethers.Signer
  ) => {
    if (!ALX_ADDRESS) throw new Error("Contract address missing");
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
    if (!ALX_ADDRESS) throw new Error("Contract address missing");
    const contract = new ethers.Contract(ALX_ADDRESS, AlixCoinABI, signer);
    const amountWei = ethers.parseEther(amount);
    const tx = await contract.burn(amountWei);
    await tx.wait();
    await fetchData();
    return tx.hash;
  }, [fetchData]);

  const togglePause = useCallback(async (signer: ethers.Signer) => {
    if (!ALX_ADDRESS) throw new Error("Contract address missing");
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
