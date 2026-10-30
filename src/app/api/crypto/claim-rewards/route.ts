import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { AlixCoinABI } from '@/lib/abi/AlixCoin';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const ETH_RPC_DEFAULT = 'https://ethereum-rpc.publicnode.com';
const POLYGON_RPC_DEFAULT = 'https://polygon-bor-rpc.publicnode.com';

const VAULT_CONTRACT_ADDRESS_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
const ALX_CONTRACT_ADDRESS_DEFAULT = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';

const APY = 0.12; // 12% APY

const FALLBACK_ETH_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://1rpc.io/eth',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com'
];

const FALLBACK_POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
  'https://rpc.ankr.com/polygon',
  'https://polygon-rpc.com'
];

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.exp) return false;
    return Date.now() >= (payload.exp - 60) * 1000;
  } catch {
    return true;
  }
}

async function refreshFirebaseToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.id_token || null;
  } catch {
    return null;
  }
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) return val.timestampValue;
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  if ('arrayValue' in val) {
    return (val.arrayValue?.values || []).map(fromFirestoreValue);
  }
  return null;
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function parseRestDoc(docObj: any): Record<string, any> {
  const nameParts = (docObj?.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = docObj?.fields || {};
  const data: Record<string, any> = { id };
  for (const [k, v] of Object.entries(fields)) {
    data[k] = fromFirestoreValue(v);
  }
  return data;
}

async function restGetDoc(docPath: string, token: string): Promise<Record<string, any> | null> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/${docPath}`, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json ? parseRestDoc(json) : null;
}

async function restPatchDoc(docPath: string, payload: Record<string, any>, token: string): Promise<boolean> {
  const fields: Record<string, any> = {};
  const masks: string[] = [];
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
      masks.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
    }
  }
  const queryStr = masks.length > 0 ? `?${masks.join('&')}` : '';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/${docPath}${queryStr}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  });
  return res.ok;
}

async function restCreateDoc(colPath: string, payload: Record<string, any>, token: string): Promise<string | null> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/${colPath}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  const nameParts = (json?.name || '').split('/');
  return nameParts[nameParts.length - 1] || null;
}

async function fetchVaultPrivateKey(config: Record<string, any>): Promise<string> {
  if (process.env.ALIBANK_VAULT_PRIVATE_KEY) {
    return process.env.ALIBANK_VAULT_PRIVATE_KEY.trim();
  }
  if (config?.vaultPrivateKey) {
    return String(config.vaultPrivateKey).trim();
  }
  throw new Error('Kunci privat administratif (vaultPrivateKey) tidak dikonfigurasi di dashboard API.');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Parameter userId diperlukan untuk klaim.' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const cookieToken = (request.cookies.get('alibank_token')?.value || '').trim();
    const refreshToken = (request.cookies.get('alibank_refresh')?.value || '').trim();

    let idToken = bearerToken || cookieToken;
    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) idToken = refreshed;
    }

    // 1. Ambil data user, api_keys, dan liquidity secara paralel via Firestore REST API
    const [userData, apiKeysData, liqData] = await Promise.all([
      restGetDoc(`users/${userId}`, idToken),
      restGetDoc('system/api_keys', idToken),
      restGetDoc('system/liquidity', idToken),
    ]);

    if (!userData) {
      return NextResponse.json({ error: 'Verifikasi akun nasabah belum dapat diselesaikan saat ini. Silakan muat ulang atau coba beberapa saat lagi.' }, { status: 404 });
    }

    const walletAddress =
      userData.externalWalletAddress && userData.externalWalletAddress !== '0xNoWalletInitialized'
        ? userData.externalWalletAddress
        : userData.walletAddress;
    const lastClaimedTimestamp = Number(userData.lastClaimedTimestamp || 0);

    if (!walletAddress || walletAddress === '0xNoWalletInitialized') {
      return NextResponse.json({ error: 'Anda harus menghubungkan dompet eksternal (MetaMask) terlebih dahulu.' }, { status: 400 });
    }

    const config = apiKeysData || {};

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
      const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=ETHUSDT', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.price) ethPrice = parseFloat(data.price);
      }
    } catch {
      console.warn('[Claim API]: Gagal memuat harga live ETH, menggunakan fallback $2420.');
    }

    const alxPrice = Number(liqData?.lastAlxPriceUsdt || 12.24);

    // 4. Kueri data deposit on-chain di Ethereum Mainnet
    const ethRpcs = [];
    if (config.infuraProjectId) ethRpcs.push(`https://mainnet.infura.io/v3/${config.infuraProjectId}`);
    ethRpcs.push(ethRpc, ...FALLBACK_ETH_RPCS);

    let stakedEth = 0;
    let depositTimestamp = 0;
    let ethQuerySuccess = false;

    for (const rpcUrl of ethRpcs) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });
        const vaultContract = new ethers.Contract(vaultAddress, AliBankVaultABI, provider);

        const [balanceWei, timestamp] = await Promise.all([
          vaultContract.balances(walletAddress),
          vaultContract.depositTimestamps(walletAddress),
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

    const yieldAmount = stakedEth * APY * (duration / 31536000) * (ethPrice / alxPrice);

    if (yieldAmount < 0.0001) {
      return NextResponse.json({ error: 'Akumulasi imbal hasil (ALX) Anda saat ini terlalu kecil untuk diklaim.' }, { status: 400 });
    }

    // 6. Dapatkan Kunci Privat Admin untuk Minting di Polygon
    const rawKey = await fetchVaultPrivateKey(config);
    if (!rawKey || rawKey === 'YOUR_KEY') {
      return NextResponse.json({ error: 'Layanan pencairan imbal hasil sedang dalam optimalisasi pengamanan sistem. Silakan coba kembali dalam beberapa saat.' }, { status: 500 });
    }
    const privateKey = rawKey.startsWith('0x') ? rawKey : '0x' + rawKey;

    // 7. Eksekusi Minting di Polygon Mainnet
    const polygonRpcs = [];
    if (config.infuraProjectId) polygonRpcs.push(`https://polygon-mainnet.infura.io/v3/${config.infuraProjectId}`);
    polygonRpcs.push(polygonRpc, ...FALLBACK_POLYGON_RPCS);

    let mintSuccess = false;
    let receipt: any = null;
    let polygonErrorMsg = '';

    for (const rpcUrl of polygonRpcs) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, 137, { staticNetwork: true });
        const wallet = new ethers.Wallet(privateKey, provider);
        const alxContract = new ethers.Contract(alxAddress, AlixCoinABI, wallet);

        const gasBalance = await provider.getBalance(wallet.address);
        if (gasBalance < ethers.parseEther('0.005')) {
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

    // 8. Catat Transaksi & Notifikasi ke Firestore via REST API
    const currentCryptoBalances: Record<string, number> = {
      ...(userData.cryptoBalances || {}),
    };
    currentCryptoBalances.ALX = Number(((currentCryptoBalances.ALX || 0) + yieldAmount).toFixed(8));

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();

    await restPatchDoc(
      `users/${userId}`,
      {
        lastClaimedTimestamp: now,
        cryptoBalances: currentCryptoBalances,
      },
      idToken
    );

    await Promise.all([
      restCreateDoc(
        `users/${userId}/transactions`,
        {
          date: nowIso,
          description: 'Klaim Yield DeFi Vault',
          category: 'Crypto Reward',
          cryptoAmount: yieldAmount,
          cryptoCurrency: 'ALX',
          recipientAddress: walletAddress,
          type: 'income',
          status: 'success',
          txHash: receipt.hash,
          network: 'Polygon Mainnet',
          timestamp: nowDate,
        },
        idToken
      ),
      restCreateDoc(
        'system/audit/global_transactions',
        {
          id: `CLAIM-${Date.now()}`,
          category: 'DeFi Staking Reward',
          gateway: 'Vault Staking',
          amountIdr: 0,
          cryptoAmount: yieldAmount,
          cryptoCurrency: 'ALX',
          txHash: receipt.hash,
          description: `Minted ${yieldAmount.toFixed(6)} ALX to ${walletAddress} for staking rewards.`,
          status: 'berhasil',
          timestamp: nowDate,
          userEmail: userData.email || '',
        },
        idToken
      ),
      restCreateDoc(
        `users/${userId}/notifications`,
        {
          title: '🎁 Klaim Yield ALX Berhasil',
          message: `Klaim yield staking sebesar ${yieldAmount.toFixed(6)} ALX berhasil diproses dan dikirim ke dompet Anda. Hash: ${receipt.hash.slice(0, 10)}...`,
          type: 'success',
          read: false,
          createdAt: nowIso,
          timestamp: nowDate,
        },
        idToken
      ),
    ]);

    return NextResponse.json({
      success: true,
      amountMinted: yieldAmount,
      txHash: receipt.hash,
      walletAddress,
      stakedBalance: stakedEth,
    });
  } catch (err: any) {
    console.error('[Claim API Route Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Terjadi kesalahan sistem internal.' },
      { status: 500 }
    );
  }
}
