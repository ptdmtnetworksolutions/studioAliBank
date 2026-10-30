import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// ABI untuk mendeteksi event Transfer ERC-20 dan membaca balanceOf langsung
const ERC20_SYNC_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
  'https://rpc.ankr.com/polygon',
  'https://polygon-rpc.com',
];

const ALX_CONTRACT_ADDRESS = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
const USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

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

async function restGetUserTransactions(userId: string, token: string): Promise<Array<Record<string, any>>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/users/${userId}:runQuery`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'transactions' }],
        limit: 300,
      },
    }),
    cache: 'no-store',
  });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  const out: Array<Record<string, any>> = [];
  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (row?.document) {
        out.push(parseRestDoc(row.document));
      }
    }
  }
  return out;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const specificTxHash = (searchParams.get('txHash') || '').trim();

    if (!userId) {
      return NextResponse.json({ error: 'Parameter userId diperlukan' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    const queryToken = (searchParams.get('idToken') || '').trim();
    const cookieToken = (request.cookies.get('alibank_token')?.value || '').trim();
    const refreshToken = (request.cookies.get('alibank_refresh')?.value || '').trim();

    let idToken = bearerToken || queryToken || cookieToken;
    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) idToken = refreshed;
    }

    // 1. Ambil data user via Firestore REST API
    const userData = await restGetDoc(`users/${userId}`, idToken);
    if (!userData) {
      return NextResponse.json({ error: 'Verifikasi akun nasabah belum dapat diselesaikan oleh node sinkronisasi saat ini. Silakan coba beberapa saat lagi.' }, { status: 404 });
    }

    const walletAddress: string = userData.walletAddress || '';
    if (!walletAddress || walletAddress === '0xNoWalletInitialized' || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ success: true, message: 'User belum memiliki wallet EVM aktif', newDepositsCount: 0 });
    }

    // 2. Dapatkan konfigurasi RPC (jika ada) & pilih provider Polygon yang responsif
    const apiKeysData = await restGetDoc('system/api_keys', idToken).catch(() => null);
    let customPolygonRpc: string | undefined = apiKeysData?.polygonRpcUrl;
    if (apiKeysData?.infuraProjectId && apiKeysData?.infuraProjectSecret) {
      customPolygonRpc = `https://:${apiKeysData.infuraProjectSecret}@polygon-mainnet.infura.io/v3/${apiKeysData.infuraProjectId}`;
    } else if (apiKeysData?.infuraProjectId) {
      customPolygonRpc = `https://polygon-mainnet.infura.io/v3/${apiKeysData.infuraProjectId}`;
    }

    const provider = await getWorkingPolygonProvider(customPolygonRpc);
    const latestBlock = await provider.getBlockNumber();

    // Scan maksimal 900 blok ke belakang untuk eth_getLogs agar tidak ditolak oleh limit RPC publik (1.000 blok)
    const lastSyncedBlock = Number(userData.lastSyncedBlockPolygon || 0);
    const startBlock = lastSyncedBlock > 0
      ? Math.max(lastSyncedBlock + 1, latestBlock - 900)
      : latestBlock - 900;
    const endBlock = latestBlock;

    const tokens = [
      { symbol: 'ALX', address: ALX_CONTRACT_ADDRESS, decimals: 18 },
      { symbol: 'USDT', address: USDT_CONTRACT_ADDRESS, decimals: 6 },
    ];

    // 3. Ambil seluruh transaksi user untuk mengetahui txHash dan total deposit on-chain yang sudah dikreditkan
    const allUserTxs = await restGetUserTransactions(userId, idToken);
    const existingHashes = new Set<string>();
    const creditedOnChainBySymbol: Record<string, number> = { ALX: 0, USDT: 0 };

    for (const tx of allUserTxs) {
      if (tx.txHash) {
        existingHashes.add(String(tx.txHash).toLowerCase());
      }
      if (tx.status === 'rejected') continue;
      const sym = tx.cryptoCurrency || tx.asset;
      if (sym === 'ALX' || sym === 'USDT') {
        if (tx.category === 'Crypto Deposit') {
          creditedOnChainBySymbol[sym] += Number(tx.cryptoAmount || tx.amount || 0);
        } else if (
          tx.category === 'Crypto Reward' &&
          String(tx.recipientAddress || '').toLowerCase() === walletAddress.toLowerCase()
        ) {
          creditedOnChainBySymbol[sym] += Number(tx.cryptoAmount || tx.amount || 0);
        }
      }
    }

    const currentCryptoBalances: Record<string, number> = {
      ...(userData.cryptoBalances || {}),
    };

    let newDepositsCount = 0;
    const processedTxHashes: string[] = [];
    const creditedAmounts: Record<string, number> = { ALX: 0, USDT: 0 };

    const creditDepositToUser = async (
      symbol: string,
      amount: number,
      txHash: string,
      senderAddress: string
    ) => {
      if (amount <= 0) return;
      const cleanHash = txHash.toLowerCase();
      if (existingHashes.has(cleanHash)) return;

      const prevBal = Number(currentCryptoBalances[symbol] || 0);
      const nextBal = Number((prevBal + amount).toFixed(8));
      currentCryptoBalances[symbol] = nextBal;
      creditedOnChainBySymbol[symbol] = Number(((creditedOnChainBySymbol[symbol] || 0) + amount).toFixed(8));
      creditedAmounts[symbol] = Number(((creditedAmounts[symbol] || 0) + amount).toFixed(8));
      existingHashes.add(cleanHash);

      const now = new Date();
      const nowIso = now.toISOString();

      await restPatchDoc(
        `users/${userId}`,
        { cryptoBalances: currentCryptoBalances },
        idToken
      );

      await Promise.all([
        restCreateDoc(
          `users/${userId}/transactions`,
          {
            date: nowIso,
            description: `Terima ${symbol} dari Wallet Eksternal (MetaMask)`,
            category: 'Crypto Deposit',
            asset: symbol,
            cryptoAmount: amount,
            cryptoCurrency: symbol,
            senderAddress,
            type: 'income',
            status: 'success',
            txHash,
            network: 'Polygon Mainnet',
            timestamp: now,
          },
          idToken
        ),
        restCreateDoc(
          `system/audit/global_transactions`,
          {
            id: `DEP-AUTO-${Date.now()}`,
            category: 'External Inflow',
            gateway: 'Auto-Node Sync',
            amountIdr: 0,
            cryptoAmount: amount,
            cryptoCurrency: symbol,
            txHash,
            description: `Auto-credited deposit ${amount} ${symbol} ke ${userData.name || 'Nasabah'}. Hash: ${txHash.slice(0, 12)}...`,
            status: 'berhasil',
            timestamp: now,
            userEmail: userData.email || '',
          },
          idToken
        ),
        restCreateDoc(
          `users/${userId}/notifications`,
          {
            title: `📥 Deposit ${symbol} Masuk`,
            message: `Setoran ${amount} ${symbol} dari dompet eksternal telah diterima dan dikreditkan ke saldo AliBank Anda. Hash: ${txHash.slice(0, 10)}...`,
            type: 'success',
            read: false,
            createdAt: nowIso,
            timestamp: now,
          },
          idToken
        ),
      ]);

      newDepositsCount++;
      processedTxHashes.push(txHash);
    };

    // LAYER 1: Jika user mengirimkan txHash spesifik (misal dari halaman Konfirmasi Deposit), verifikasi langsung receipt-nya!
    if (specificTxHash && specificTxHash.startsWith('0x') && specificTxHash.length === 66) {
      try {
        const receipt = await provider.getTransactionReceipt(specificTxHash);
        if (receipt && receipt.status === 1) {
          const iface = new ethers.Interface(ERC20_SYNC_ABI);
          for (const log of receipt.logs) {
            const matchedToken = tokens.find(
              (t) => t.address.toLowerCase() === log.address.toLowerCase()
            );
            if (!matchedToken) continue;
            try {
              const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
              if (parsed && parsed.name === 'Transfer') {
                const from = String(parsed.args[0]);
                const to = String(parsed.args[1]);
                const val = parsed.args[2];
                if (to.toLowerCase() === walletAddress.toLowerCase()) {
                  const amount = parseFloat(ethers.formatUnits(val, matchedToken.decimals));
                  await creditDepositToUser(matchedToken.symbol, amount, specificTxHash, from);
                }
              }
            } catch {}
          }
        }
      } catch (e: any) {
        console.warn('[Sync Deposit] Gagal mengecek receipt spesifik:', e?.message);
      }
    }

    // LAYER 2 & LAYER 3: Scan event Transfer terbaru + Rekonsiliasi langsung balanceOf(walletAddress) di Smart Contract Polygon
    const syncedOnChainBalances: Record<string, number> = {
      ...(userData.syncedOnChainBalances || {}),
    };

    for (const token of tokens) {
      const contract = new ethers.Contract(token.address, ERC20_SYNC_ABI, provider);

      // Layer 2: Coba ambil event Transfer pada rentang blok terbaru (jangan gagal jika RPC membatasi eth_getLogs)
      if (startBlock <= endBlock) {
        try {
          const filter = contract.filters.Transfer(null, walletAddress);
          const logs = await contract.queryFilter(filter, startBlock, endBlock);
          for (const log of logs) {
            if ('args' in log && log.args) {
              const from = String(log.args[0]);
              const value = log.args[2];
              const txHash = log.transactionHash;
              const amount = parseFloat(ethers.formatUnits(value, token.decimals));
              if (amount > 0) {
                await creditDepositToUser(token.symbol, amount, txHash, from);
              }
            }
          }
        } catch (err: any) {
          console.warn(`[Sync Deposit] eth_getLogs dilewati untuk ${token.symbol}, beralih ke rekonsiliasi balanceOf langsung:`, err?.message);
        }
      }

      // Layer 3: Rekonsiliasi Pasti via balanceOf(walletAddress) On-Chain!
      // Menangkap seluruh transfer dari MetaMask meskipun terjadi di luar jendela 900 blok atau saat eth_getLogs dibatasi RPC!
      try {
        const rawBal = await contract.balanceOf(walletAddress);
        const onChainBalance = parseFloat(ethers.formatUnits(rawBal, token.decimals));
        syncedOnChainBalances[token.symbol] = onChainBalance;

        const alreadyCredited = Number(creditedOnChainBySymbol[token.symbol] || 0);
        const uncreditedDiff = Number((onChainBalance - alreadyCredited).toFixed(6));

        if (uncreditedDiff > 0.000001) {
          const syntheticHash = `0xonchain_${token.symbol.toLowerCase()}_${walletAddress.slice(2, 10).toLowerCase()}_${Math.round(onChainBalance * 1000000)}`;
          await creditDepositToUser(
            token.symbol,
            uncreditedDiff,
            syntheticHash,
            'MetaMask / External Polygon Wallet'
          );
        }
      } catch (balErr: any) {
        console.warn(`[Sync Deposit] Gagal membaca balanceOf untuk ${token.symbol}:`, balErr?.message);
      }
    }

    // 4. Simpan blok terakhir & status saldo on-chain
    await restPatchDoc(
      `users/${userId}`,
      {
        lastSyncedBlockPolygon: endBlock,
        syncedOnChainBalances,
      },
      idToken
    );

    // 5. Sinkronkan harga ALX dari On-Chain Contract ke Firestore (system/liquidity)
    let onChainPriceUsd = 12.24;
    try {
      const alxContract = new ethers.Contract(
        ALX_CONTRACT_ADDRESS,
        ['function ANCHOR_PRICE_USD_CENTS() view returns (uint256)'],
        provider
      );
      const anchorPriceCents = await alxContract.ANCHOR_PRICE_USD_CENTS();
      onChainPriceUsd = parseFloat(anchorPriceCents.toString()) / 100;
      await restPatchDoc('system/liquidity', { lastAlxPriceUsdt: onChainPriceUsd }, idToken);
    } catch {}

    return NextResponse.json({
      success: true,
      walletAddress,
      newDepositsCount,
      creditedAmounts,
      processedTransactions: processedTxHashes,
      syncedOnChainBalances,
      syncedBlock: endBlock,
      rangeScanned: `${startBlock} -> ${endBlock}`,
      lastAlxPriceUsdt: onChainPriceUsd,
    });
  } catch (err: any) {
    console.error('[Deposit Auto-Sync Route Error]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menyinkronkan setoran on-chain' },
      { status: 500 }
    );
  }
}
