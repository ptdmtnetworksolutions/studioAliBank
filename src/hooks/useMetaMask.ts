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

  // Memeriksa status koneksi sebelumnya dan menyambungkan kembali jika ada
  useEffect(() => {
    if (!sdk) return;

    const checkConnection = async () => {
      try {
        const provider = sdk.getProvider();
        if (provider) {
          // Periksa apakah akun sudah diotorisasi oleh MetaMask
          const accounts: any = await provider.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
          } else if (localStorage.getItem('alibank_metamask_connected') === 'true') {
            // Auto-reconnect jika user sebelumnya telah menyetujui koneksi
            const connectedAccounts = await sdk.connect();
            if (connectedAccounts && connectedAccounts.length > 0) {
              setAccount(connectedAccounts[0]);
            }
          }
        }
      } catch (err) {
        console.warn("Auto-connect checking failed:", err);
      }
    };

    checkConnection();

    // Dengarkan perubahan akun dari MetaMask secara realtime
    const provider = sdk.getProvider();
    if (provider) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          localStorage.removeItem('alibank_metamask_connected');
        }
      };

      provider.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [sdk]);

  const connect = useCallback(async () => {
    if (!sdk) return;
    
    setIsConnecting(true);
    try {
      // connect() menginisialisasi handshake dan mengembalikan daftar akun
      const accounts: any = await sdk.connect();
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        localStorage.setItem('alibank_metamask_connected', 'true');
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
      localStorage.removeItem('alibank_metamask_connected');
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
