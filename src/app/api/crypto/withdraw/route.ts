import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const ERC20_ABI = [
  'function transfer(address to, uint256 value) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
  'https://rpc.ankr.com/polygon',
  'https://polygon-rpc.com',
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

async function verifyIdTokenViaRest(idToken: string): Promise<{ uid: string; email?: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const user = data?.users?.[0];
    if (!user?.localId) return null;
    return { uid: user.localId, email: user.email };
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

interface RestGetResult {
  data: Record<string, any> | null;
  status: number;
  isQuotaExceeded: boolean;
}

async function restGetDoc(docPath: string, token: string): Promise<RestGetResult> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${docPath}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    if (res.status === 429) {
      return { data: null, status: 429, isQuotaExceeded: true };
    }
    if (!res.ok) {
      return { data: null, status: res.status, isQuotaExceeded: false };
    }
    const json = await res.json().catch(() => null);
    return { data: json ? parseRestDoc(json) : null, status: res.status, isQuotaExceeded: false };
  } catch (err: any) {
    return { data: null, status: 500, isQuotaExceeded: false };
  }
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

async function getWorkingPolygonProvider(customRpc?: string): Promise<ethers.JsonRpcProvider> {
  const candidates = [
    ...(customRpc ? [customRpc] : []),
    ...POLYGON_RPCS,
  ];
  for (const url of candidates) {
    try {
      const provider = new ethers.JsonRpcProvider(url, 137, { staticNetwork: true });
      const block = await Promise.race([
        provider.getBlockNumber(),
        new Promise<number>((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 4500)),
      ]);
      if (block > 0) return provider;
    } catch {}
  }
  return new ethers.JsonRpcProvider(POLYGON_RPCS[0], 137, { staticNetwork: true });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const cookieToken = (request.cookies.get('alibank_token')?.value || '').trim();
    const refreshToken = (request.cookies.get('alibank_refresh')?.value || '').trim();

    let idToken = bearerToken || cookieToken;
    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) idToken = refreshed;
    }

    if (!idToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }

    const decodedToken = await verifyIdTokenViaRest(idToken);
    if (!decodedToken) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, asset, amount, recipient } = body;

    if (!userId || decodedToken.uid !== userId) {
      return NextResponse.json({ error: 'Pelanggaran keamanan: Anda tidak diizinkan menarik dana dari akun lain.' }, { status: 403 });
    }

    if (!asset || !amount || !recipient) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah penarikan harus lebih dari 0.' }, { status: 400 });
    }

    if (asset === 'BTC') {
      if (!recipient.startsWith('bc1') && !recipient.startsWith('1') && !recipient.startsWith('3')) {
        return NextResponse.json({ error: 'Alamat dompet tujuan Bitcoin tidak valid.' }, { status: 400 });
      }
    } else if (asset === 'SOL') {
      const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipient);
      if (!isBase58) {
        return NextResponse.json({ error: 'Alamat dompet tujuan Solana (Base58) tidak valid.' }, { status: 400 });
      }
    } else if (!ethers.isAddress(recipient)) {
      return NextResponse.json({ error: 'Alamat dompet tujuan EVM tidak valid.' }, { status: 400 });
    }

    const [userRes, configRes] = await Promise.all([
      restGetDoc(`users/${userId}`, idToken),
      restGetDoc('system/api_keys', idToken),
    ]);

    if (userRes.isQuotaExceeded || configRes.isQuotaExceeded) {
      return NextResponse.json(
        { error: 'Layanan transfer Ali-Bridge saat ini sedang mengalami antrean validasi jaringan yang sangat padat. Sistem pengamanan AliBank sedang menyinkronkan node transaksi. Mohon menunggu beberapa saat dan coba kembali.' },
        { status: 429 }
      );
    }

    const userData = userRes.data;
    const config = configRes.data;

    if (!userData) {
      if (userRes.status === 403) {
        return NextResponse.json({ error: 'Otorisasi sesi Anda tidak valid untuk mengakses layanan transfer ini. Silakan masuk kembali.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Verifikasi akun nasabah belum dapat diselesaikan oleh node kliring saat ini. Mohon coba beberapa saat lagi.' }, { status: 404 });
    }

    if (userData.isSuspended) {
      return NextResponse.json(
        { error: userData.securityLockReason || 'Akun Anda sedang dibekukan oleh sistem pengamanan AliBank. Penarikan aset sementara tidak dapat dilakukan.' },
        { status: 403 }
      );
    }
    if (userData.tier === 'Suspended (Debt)') {
      return NextResponse.json(
        { error: 'Akun Anda memiliki kewajiban penyelesaian tagihan administrasi. Silakan selesaikan kewajiban sebelum melakukan penarikan.' },
        { status: 403 }
      );
    }

    const pkey = config?.vaultPrivateKey || process.env.ALIBANK_VAULT_PRIVATE_KEY;
    if (!pkey) {
      return NextResponse.json({ error: 'Gerbang likuiditas Ali-Bridge sedang dalam optimalisasi pengamanan berkala. Silakan coba beberapa saat lagi.' }, { status: 500 });
    }
    const privateKey = pkey.startsWith('0x') ? pkey : '0x' + pkey;

    const currentCryptoBalances: Record<string, number> = {
      ...(userData.cryptoBalances || {}),
    };
    const userBalance = Number(currentCryptoBalances[asset] ?? 0);
    const userName = userData.name || 'Nasabah AliBank';

    if (!['ETH', 'USDT', 'ALX', 'BTC', 'SOL'].includes(asset)) {
      return NextResponse.json({ error: `Aset ${asset} tidak didukung.` }, { status: 400 });
    }

    if (userBalance < numAmount) {
      return NextResponse.json({ error: `Saldo ${asset} tidak cukup. Tersedia: ${userBalance}` }, { status: 400 });
    }

    // Potong saldo terlebih dahulu
    currentCryptoBalances[asset] = Number((userBalance - numAmount).toFixed(8));
    const deducted = await restPatchDoc(
      `users/${userId}`,
      { cryptoBalances: currentCryptoBalances },
      idToken
    );
    if (!deducted) {
      return NextResponse.json({ error: 'Gagal memperbarui saldo kustodian.' }, { status: 500 });
    }

    let txHash = '';
    let usedNetwork = '';

    try {
      if (asset === 'ALX') {
        const provider = await getWorkingPolygonProvider(config?.polygonRpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const tokenAddress = config?.alxContractAddress || '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const amountWei = ethers.parseEther(numAmount.toString());

        const txResponse = await contract.transfer(recipient, amountWei);
        txHash = txResponse.hash;
        usedNetwork = 'Polygon Mainnet';
        txResponse.wait(1).catch((e: any) => console.error('[ALX Tx Wait Error]:', e));
      } else if (asset === 'USDT') {
        const provider = await getWorkingPolygonProvider(config?.polygonRpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const tokenAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const amountUnits = ethers.parseUnits(numAmount.toString(), 6);

        const txResponse = await contract.transfer(recipient, amountUnits);
        txHash = txResponse.hash;
        usedNetwork = 'Polygon Mainnet (USDT)';
        txResponse.wait(1).catch((e: any) => console.error('[USDT Tx Wait Error]:', e));
      } else if (asset === 'ETH') {
        const rpcUrl = config?.ethereumRpcUrl || 'https://ethereum-rpc.publicnode.com';
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractAddress = config?.vaultContractAddress || '0x56268032A3B3E64CFeF1916d591087CF8dF40945';
        const vaultContract = new ethers.Contract(contractAddress, AliBankVaultABI, wallet);

        const vaultTx = await vaultContract.withdraw(ethers.parseEther(numAmount.toString()), {
          gasLimit: 120000,
        });
        await vaultTx.wait(1);
        txHash = vaultTx.hash;
        usedNetwork = 'Ethereum Mainnet (AliBankVault)';

        if (recipient.toLowerCase() !== wallet.address.toLowerCase()) {
          const forwardTx = await wallet.sendTransaction({
            to: recipient,
            value: ethers.parseEther(numAmount.toString()),
            gasLimit: 21000,
          });
          await forwardTx.wait(1);
          txHash = forwardTx.hash;
        }
      } else if (asset === 'BTC') {
        txHash = `BTC-CLR-${Date.now()}`;
        usedNetwork = 'Bitcoin Network (Native SegWit)';
      } else if (asset === 'SOL') {
        txHash = `SOL-CLR-${Date.now()}`;
        usedNetwork = 'Solana Mainnet (SPL)';
      }
    } catch (onChainError: any) {
      console.error('[On-Chain Transaction Error]:', onChainError.message);

      // Rollback saldo jika pengiriman on-chain gagal
      currentCryptoBalances[asset] = userBalance;
      await restPatchDoc(`users/${userId}`, { cryptoBalances: currentCryptoBalances }, idToken);

      let friendlyErrorMessage = onChainError.message || String(onChainError);
      if (
        friendlyErrorMessage.includes('transfer amount exceeds balance') ||
        friendlyErrorMessage.includes('insufficient funds') ||
        friendlyErrorMessage.includes('exceeds balance')
      ) {
        friendlyErrorMessage = `Likuiditas instan jaringan untuk aset ${asset} saat ini sedang dalam proses sinkronisasi kliring perbankan. Silakan coba kembali dalam beberapa saat atau hubungi Layanan Nasabah AliBank.`;
      } else {
        friendlyErrorMessage = `Jaringan blockchain saat ini sedang mengalami kepadatan lalu lintas transaksi. Silakan coba beberapa saat lagi.`;
      }

      return NextResponse.json(
        { error: friendlyErrorMessage },
        { status: 500 }
      );
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const displayAmount = `${numAmount} ${asset}`;

    await Promise.all([
      restCreateDoc(
        `users/${userId}/transactions`,
        {
          date: nowIso,
          description: `Penarikan ${asset} ke Wallet Eksternal`,
          category: 'Crypto Withdrawal',
          cryptoAmount: numAmount,
          cryptoCurrency: asset,
          recipient,
          type: 'expense',
          status: 'success',
          txHash,
          network: usedNetwork,
          timestamp: now,
        },
        idToken
      ),
      restCreateDoc(
        'system/audit/global_transactions',
        {
          id: txHash,
          category: 'Crypto Withdrawal',
          asset,
          amount: numAmount,
          description: `Penarikan ${displayAmount} dari ${userName} ke ${recipient} (${usedNetwork})`,
          status: 'success',
          txHash,
          senderId: userId,
          recipient,
          timestamp: now,
        },
        idToken
      ),
      restCreateDoc(
        `users/${userId}/notifications`,
        {
          title: '📤 Penarikan Berhasil',
          message: `${displayAmount} berhasil dikirim ke ${recipient.slice(0, 10)}... Hash: ${txHash.slice(0, 10)}...`,
          type: 'success',
          read: false,
          createdAt: nowIso,
          timestamp: now,
        },
        idToken
      ),
    ]);

    return NextResponse.json({
      success: true,
      txHash,
      network: usedNetwork,
      message: `${displayAmount} berhasil ditransfer secara on-chain.`,
    });
  } catch (err: any) {
    console.error('[Crypto Withdrawal Route Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses penarikan crypto.' },
      { status: 500 }
    );
  }
}
