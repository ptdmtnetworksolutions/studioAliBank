
'use client';

import { useState, useEffect, useCallback } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';

/**
 * @fileOverview Hook khusus untuk manajemen MetaMask SDK di AliBank V3.
 * Menggunakan Infura Project ID 30ba607f7b6845bca3a645b110a0db22 sebagai jalur utama.
 */

export function useMetaMask() {
  const [account, setAccount] = useState<string | null>(null);
  const [sdk, setSdk] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const mmsdk = new MetaMaskSDK({
        dappMetadata: {
          name: "AliBank V3",
          url: window.location.origin,
        },
        infuraAPIKey: "30ba607f7b6845bca3a645b110a0db22",
        // Aktifkan logging untuk debugging integrasi
        logging: {
          sdk: false,
        }
      });

      setSdk(mmsdk);
    } catch (err) {
      console.error("MetaMask SDK Initialization failed:", err);
    }
  }, []);

  const connect = useCallback(async () => {
    if (!sdk) return;
    
    setIsConnecting(true);
    try {
      // connect() menginisialisasi handshake dan mengembalikan daftar akun
      const accounts: any = await sdk.connect();
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        return accounts[0];
      }
    } catch (err) {
      console.error("MetaMask connection failed:", err);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [sdk]);

  const disconnect = useCallback(async () => {
    if (!sdk) return;
    try {
      await sdk.terminate();
      setAccount(null);
    } catch (e) {
      console.error("Disconnect MetaMask failed:", e);
    }
  }, [sdk]);

  return { 
    account, 
    connect, 
    disconnect,
    isConnecting, 
    isSupported: !!sdk,
    provider: sdk ? sdk.getProvider() : null
  };
}
