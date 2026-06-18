import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { AlixCoinABI } from '@/lib/abi/AlixCoin';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

const ETH_RPC_DEFAULT = 'https://cloudflare-eth.com';
const POLYGON_RPC_DEFAULT = 'https://polygon-rpc.com';

const VAULT_CONTRACT_ADDRESS_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
const ALX_CONTRACT_ADDRESS_DEFAULT = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';

const APY = 0.12; // 12% APY

// Fallback Node RPCs jika RPC primer tidak merespon
const FALLBACK_ETH_RPCS = [
  "https://rpc.ankr.com/eth",
  "https://ethereum-rpc.publicnode.com",
  "https://1rpc.io/eth",
  "https://cloudflare-eth.com"
];

const FALLBACK_POLYGON_RPCS = [
  "https://rpc.ankr.com/polygon",
  "https://polygon-bor-rpc.publicnode.com",
  "https://1rpc.io/matic",
  "https://polygon-rpc.com"
];

/**
 * Mengambil Private Key Admin dari Secret Manager (GCP) atau fallback Firestore.
 */
async function fetchVaultPrivateKey(db: FirebaseFirestore.Firestore): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID || 'darmedia-pos';
  
  try {
    const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
    const client = new SecretManagerServiceClient();
    const [version] = await client.accessSecretVersion({
      name: `projects/${projectId}/secrets/ALIBANK_VAULT_PRIVATE_KEY/versions/latest`,
    });
    const payload = version.payload?.data?.toString();
    if (payload) return payload.trim();
  } catch (error) {
    console.warn('[Claim API]: Secret Manager tidak dapat dijangkau. Mencoba membaca dari Firestore...');
  }
  
  const apiKeysSnap = await db.collection('system').doc('api_keys').get();
  if (apiKeysSnap.exists) {
    const data = apiKeysSnap.data()!;
    if (data.vaultPrivateKey) {
      return data.vaultPrivateKey.trim();
    }
  }
  
  throw new Error("Kunci privat administratif (vaultPrivateKey) tidak dikonfigurasi di dashboard API.");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Parameter userId diperlukan untuk klaim.' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // 1. Ambil data user
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan di database.' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const walletAddress = userData.walletAddress;
    const lastClaimedTimestamp = Number(userData.lastClaimedTimestamp || 0);

    if (!walletAddress || walletAddress === '0xNoWalletInitialized') {
      return NextResponse.json({ error: 'Anda harus menghubungkan dompet eksternal (MetaMask) terlebih dahulu.' }, { status: 400 });
    }

    // 2. Ambil konfigurasi API & RPC
    const apiKeysSnap = await db.collection('system').doc('api_keys').get();
    const config = apiKeysSnap.exists ? apiKeysSnap.data()! : {};

    let ethRpc = config.ethereumRpcUrl || ETH_RPC_DEFAULT;
    if (config.infuraProjectId) {
      ethRpc = `https://mainnet.infura.io/v3/${config.infuraProjectId}`;
    }

    let polygonRpc = config.polygonRpcUrl || POLYGON_RPC_DEFAULT;
    if (config.infuraProjectId && config.infuraProjectSecret) {
      polygonRpc = `https://:${config.infuraProjectSecret}@polygon-mainnet.infura.io/v3/${config.infuraProjectId}`;
    } else if (config.infuraProjectId) {
      polygonRpc = `https://polygon-mainnet.infura.io/v3/${config.infuraProjectId}`;
    }

    const vaultAddress = config.vaultContractAddress || VAULT_CONTRACT_ADDRESS_DEFAULT;
    const alxAddress = config.alxContractAddress || ALX_CONTRACT_ADDRESS_DEFAULT;

    // 3. Tarik Harga Terkini (ETH dan ALX)
    let ethPrice = 2420;
    try {
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { next: { revalidate: 60 } });
      if (res.ok) {
        const data = await res.json();
        if (data.price) ethPrice = parseFloat(data.price);
      }
    } catch (e) {
      console.warn('[Claim API]: Gagal memuat harga live ETH, menggunakan fallback $2420.');
    }

    let alxPrice = 12.24;
    const liqSnap = await db.collection('system').doc('liquidity').get();
    if (liqSnap.exists) {
      const data = liqSnap.data()!;
      if (data.lastAlxPriceUsdt) alxPrice = Number(data.lastAlxPriceUsdt);
    }

    // 4. Kueri data deposit on-chain di Ethereum Mainnet
    const ethRpcs = [];
    if (config.infuraProjectId) ethRpcs.push(`https://mainnet.infura.io/v3/${config.infuraProjectId}`);
    ethRpcs.push(ethRpc, ...FALLBACK_ETH_RPCS);

    let stakedEth = 0;
    let depositTimestamp = 0;
    let ethQuerySuccess = false;

    for (const rpcUrl of ethRpcs) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        const vaultContract = new ethers.Contract(vaultAddress, AliBankVaultABI, provider);
        
        const [balanceWei, timestamp] = await Promise.all([
          vaultContract.balances(walletAddress),
          vaultContract.depositTimestamps(walletAddress)
        ]);

        stakedEth = parseFloat(ethers.formatEther(balanceWei));
        depositTimestamp = Number(timestamp);
        ethQuerySuccess = true;
        break;
      } catch (err: any) {
        console.warn(`[Claim API]: RPC Ethereum ${rpcUrl} gagal:`, err.message || err);
      }
    }

    if (!ethQuerySuccess) {
      return NextResponse.json({ error: 'Gagal memverifikasi saldo staking Anda di blockchain Ethereum. Silakan coba beberapa saat lagi.' }, { status: 500 });
    }

    if (stakedEth <= 0 || depositTimestamp === 0) {
      return NextResponse.json({ error: 'Anda tidak memiliki saldo setoran aktif di DeFi Vault Ethereum.' }, { status: 400 });
    }

    // 5. Kalkulasi Yield
    const effectiveStart = Math.max(depositTimestamp, lastClaimedTimestamp);
    const now = Math.floor(Date.now() / 1000);
    const duration = Math.max(0, now - effectiveStart);

    if (duration < 10) {
      return NextResponse.json({ error: 'Waktu tunggu klaim minimum (10 detik) belum terpenuhi.' }, { status: 400 });
    }

    // Formula: Staked_ETH * APY * (duration / 365_days) * (harga_ETH / harga_ALX)
    const yieldAmount = stakedEth * APY * (duration / 31536000) * (ethPrice / alxPrice);

    if (yieldAmount < 0.0001) {
      return NextResponse.json({ error: 'Akumulasi imbal hasil (ALX) Anda saat ini terlalu kecil untuk diklaim.' }, { status: 400 });
    }

    // 6. Dapatkan Kunci Privat Admin untuk Minting di Polygon
    const privateKey = await fetchVaultPrivateKey(db);
    if (!privateKey || privateKey === 'YOUR_KEY') {
      return NextResponse.json({ error: 'Kunci privat administratif admin belum dikonfigurasi secara lengkap oleh bank.' }, { status: 500 });
    }

    // 7. Eksekusi Minting di Polygon Mainnet
    const polygonRpcs = [];
    if (config.infuraProjectId) polygonRpcs.push(`https://polygon-mainnet.infura.io/v3/${config.infuraProjectId}`);
    polygonRpcs.push(polygonRpc, ...FALLBACK_POLYGON_RPCS);

    let mintSuccess = false;
    let receipt: any = null;
    let polygonErrorMsg = '';

    for (const rpcUrl of polygonRpcs) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: true });
        const wallet = new ethers.Wallet(privateKey, provider);
        const alxContract = new ethers.Contract(alxAddress, AlixCoinABI, wallet);

        // Cek saldo gas admin
        const gasBalance = await provider.getBalance(wallet.address);
        if (gasBalance < ethers.parseEther("0.005")) {
          throw new Error(`Saldo POL/MATIC admin tidak cukup untuk gas: ${ethers.formatEther(gasBalance)} POL.`);
        }

        const amountWei = ethers.parseEther(yieldAmount.toFixed(18));
        const tx = await alxContract.mint(walletAddress, amountWei);
        receipt = await tx.wait();
        
        if (receipt && receipt.status === 1) {
          mintSuccess = true;
          break;
        } else {
          throw new Error('Transaksi ditolak oleh validator Polygon.');
        }
      } catch (err: any) {
        console.warn(`[Claim API]: RPC Polygon ${rpcUrl} gagal:`, err.message || err);
        polygonErrorMsg = err.message || 'Node Error';
      }
    }

    if (!mintSuccess) {
      return NextResponse.json({ error: `Gagal mengirim transaksi minting ke Polygon: ${polygonErrorMsg}` }, { status: 500 });
    }

    // 8. Catat Transaksi & Notifikasi secara atomik ke database Firestore
    await db.runTransaction(async (tx) => {
      // Dapatkan data saldo user saat ini untuk dikreditkan secara instan (proaktif)
      const userTxSnap = await tx.get(userRef);
      const currentBalances = userTxSnap.data()?.cryptoBalances || {};
      const currentAlxBalance = Number(currentBalances.ALX || 0);

      // 8a. Update parameter klaim & tambahkan saldo instan
      tx.update(userRef, {
        lastClaimedTimestamp: now,
        'cryptoBalances.ALX': currentAlxBalance + yieldAmount
      });

      // 8b. Tambahkan log riwayat transaksi in-app
      const txLogRef = userRef.collection('transactions').doc();
      tx.set(txLogRef, {
        date: new Date().toISOString(),
        description: `Klaim Yield DeFi Vault`,
        category: 'Crypto Reward',
        cryptoAmount: yieldAmount,
        cryptoCurrency: 'ALX',
        recipientAddress: walletAddress,
        type: 'income',
        status: 'success',
        txHash: receipt.hash,
        network: 'Polygon Mainnet',
        timestamp: FieldValue.serverTimestamp()
      });

      // 8c. Tambahkan log audit ledger global
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      tx.set(auditRef, {
        id: `CLAIM-${Date.now()}`,
        category: 'DeFi Staking Reward',
        gateway: 'Vault Staking',
        amountIdr: 0,
        cryptoAmount: yieldAmount,
        cryptoCurrency: 'ALX',
        txHash: receipt.hash,
        description: `Minted ${yieldAmount.toFixed(6)} ALX to ${walletAddress} for staking rewards.`,
        status: 'berhasil',
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userData.email || ''
      });

      // 8d. Tambahkan notifikasi in-app
      const notifRef = userRef.collection('notifications').doc();
      tx.set(notifRef, {
        title: `🎁 Klaim Yield ALX Berhasil`,
        message: `Klaim yield staking sebesar ${yieldAmount.toFixed(6)} ALX berhasil diproses dan dikirim ke dompet Anda. Hash: ${receipt.hash.slice(0, 10)}...`,
        type: 'success',
        read: false,
        createdAt: new Date().toISOString(),
        timestamp: FieldValue.serverTimestamp()
      });
    });

    return NextResponse.json({
      success: true,
      amountMinted: yieldAmount,
      txHash: receipt.hash,
      walletAddress,
      stakedBalance: stakedEth
    });

  } catch (err: any) {
    console.error('[Claim API Route Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem internal.' },
      { status: 500 }
    );
  }
}
