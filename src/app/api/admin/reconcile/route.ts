import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { firebaseConfig } from '@/firebase/config';
import { AliBankVaultABI } from '@/lib/abi/AliBankVault';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const POLYGON_RPCS = [
  'https://polygon-bor-rpc.publicnode.com',
  'https://1rpc.io/matic',
  'https://polygon.drpc.org',
  'https://rpc.ankr.com/polygon',
  'https://polygon-rpc.com',
];

const ETH_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://1rpc.io/eth',
  'https://rpc.ankr.com/eth',
  'https://cloudflare-eth.com',
];

const ALX_CONTRACT_DEFAULT = '0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd';
const USDT_CONTRACT_DEFAULT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
const VAULT_CONTRACT_DEFAULT = '0x56268032A3B3E64CFeF1916d591087CF8dF40945';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function decimals() view returns (uint8)',
];

const OWNER_EMAIL = 'alidzulfikar075@gmail.com';
const OWNER_UID = 'IJOuQpjEOMgvlYfzvQ1yfp976Oa2';

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

async function verifyAdminTokenViaRest(idToken: string): Promise<{ uid: string; email: string } | null> {
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
    const email = (user.email || '').toLowerCase();
    const uid = user.localId;
    if (email === OWNER_EMAIL.toLowerCase() || uid === OWNER_UID) {
      return { uid, email };
    }
    return null;
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

async function restQueryCollection(
  parentPath: string,
  collectionId: string,
  token: string,
  limitCount = 500
): Promise<Array<Record<string, any>>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = parentPath
    ? `${FIRESTORE_BASE}/${parentPath}:runQuery`
    : `${FIRESTORE_BASE}:runQuery`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        limit: limitCount,
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

function resolveTokenFromRequest(req: NextRequest): { idToken: string; refreshToken: string } {
  const authHeader = req.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const cookieToken = (req.cookies.get('alibank_token')?.value || '').trim();
  const refreshToken = (req.cookies.get('alibank_refresh')?.value || '').trim();
  return {
    idToken: bearerToken || cookieToken,
    refreshToken,
  };
}

/**
 * Menghitung ekspektasi saldo Ledger Nasabah secara presisi berdasarkan:
 * 1. Subkoleksi `users/{uid}/transactions` (mendukung Swap, Beli via Saldo Dompet/Ali-Premium, Jual ke Saldo Dompet, Beli via Gateway Eksternal, Game, Staking, Transfer P2P, Penarikan)
 * 2. Koleksi `topup_requests` yang berstatus `approved` (jika belum tercatat di subkoleksi transactions)
 * 3. Koleksi `system/audit/global_transactions` (untuk Trade-X Win, Futures Settlement, dll.)
 */
function computeAccurateUserLedger(
  user: Record<string, any>,
  txs: Array<Record<string, any>>,
  approvedTopups: Array<Record<string, any>>,
  userGlobalAudits: Array<Record<string, any>>
) {
  let idrInflow = 0;
  let idrOutflow = 0;
  const cryptoInflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };
  const cryptoOutflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };

  let hasLegalization = false;
  let hasDepositApprovedTx = false;
  let hasTradeXTx = false;

  for (const t of txs) {
    if (t.status === 'rejected' || t.status === 'cancelled') continue;
    const cat = String(t.category || '');
    const desc = String(t.description || '');

    if (['Legalization', 'Adjustment', 'Manual Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat)) {
      hasLegalization = true;
      continue;
    }
    if (cat === 'Security Lock') continue;

    if (
      (cat === 'Deposit' || cat === 'TopUp' || cat === 'Kliring Manual' || cat === 'Kliring On-Chain') &&
      (desc.includes('Setoran') || desc.includes('Deposit') || desc.includes('Terverifikasi') || desc.includes('Disetujui'))
    ) {
      hasDepositApprovedTx = true;
    }

    // 0. Transaksi Trade-X Pro (memiliki stakeCurrency, stakeAmount, dan rewardAlx)
    if (cat === 'Trade-X' || t.stakeCurrency || t.rewardAlx !== undefined) {
      hasTradeXTx = true;
      const stakeCur = String(t.stakeCurrency || 'IDR');
      const stakeAmt = Math.abs(Number(t.stakeAmount || 0));
      const rewardAlx = Math.abs(Number(t.rewardAlx || 0));

      if (stakeCur === 'IDR') idrOutflow += stakeAmt;
      else if (stakeCur in cryptoOutflows) cryptoOutflows[stakeCur] += stakeAmt;

      if (rewardAlx > 0) {
        cryptoInflows.ALX += rewardAlx;
      }
      continue;
    }

    // 1. Transaksi Swap / Konversi (memiliki fromCurrency & toCurrency)
    if (t.fromCurrency && t.toCurrency) {
      const fromCur = String(t.fromCurrency);
      const toCur = String(t.toCurrency);
      const fromAmt = Math.abs(Number(t.fromAmount || 0));
      const toAmt = Math.abs(Number(t.toAmount || 0));

      if (fromCur === 'IDR') idrOutflow += fromAmt;
      else if (fromCur in cryptoOutflows) cryptoOutflows[fromCur] += fromAmt;

      if (toCur === 'IDR') idrInflow += toAmt;
      else if (toCur in cryptoInflows) cryptoInflows[toCur] += toAmt;
      continue;
    }

    // 2. Jual Kripto ke Saldo Dompet IDR
    if (desc.includes('Jual ') && desc.includes('ke Saldo Dompet')) {
      const sym = String(t.cryptoCurrency || t.asset || '');
      const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
      const idrAmt = Math.abs(Number(t.amount || 0));
      if (sym in cryptoOutflows) cryptoOutflows[sym] += cryptoAmt;
      idrInflow += idrAmt;
      continue;
    }

    // 3. Beli Kripto menggunakan Saldo Dompet IDR atau Ali-Premium (type === 'expense' atau 'via Saldo Dompet')
    if (
      desc.startsWith('Beli ') &&
      (desc.includes('Saldo Dompet') || desc.includes('(Ali-Premium)') || t.type === 'expense')
    ) {
      const sym = String(t.cryptoCurrency || t.asset || '');
      const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
      const idrAmt = Math.abs(Number(t.amount || 0));
      idrOutflow += idrAmt;
      if (sym in cryptoInflows) cryptoInflows[sym] += cryptoAmt;
      continue;
    }

    // 4. Beli Kripto menggunakan Gateway Eksternal (Midtrans, SoftPOS, PayPal, iPaymu)
    if (desc.startsWith('Beli ') && t.type === 'income' && t.cryptoCurrency) {
      const sym = String(t.cryptoCurrency);
      const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
      if (sym in cryptoInflows) cryptoInflows[sym] += cryptoAmt;
      continue;
    }

    // 5. Transaksi Kripto Murni (Deposit On-Chain, Penarikan Kripto, Transfer P2P Kripto, Game, Klaim Yield, Cash Delivery)
    const sym = String(t.cryptoCurrency || (t.asset && t.asset !== 'IDR' ? t.asset : ''));
    const cryptoAmt = Math.abs(Number(t.cryptoAmount || (sym ? t.amount : 0) || 0));
    if (sym && sym in cryptoInflows && cryptoAmt > 0) {
      if (t.type === 'income') {
        cryptoInflows[sym] += cryptoAmt;
      } else if (t.type === 'expense') {
        cryptoOutflows[sym] += cryptoAmt;
      }
      continue;
    }

    // 6. Transaksi Fiat IDR Murni (Top-Up, Tarik Tunai, Transfer P2P IDR, Tabungan Yield, Deposito)
    const idrAmt = Math.abs(Number(t.amount || 0));
    if (idrAmt > 0) {
      if (t.type === 'income') idrInflow += idrAmt;
      else if (t.type === 'expense') idrOutflow += idrAmt;
    }
  }

  // 7. Rekonsiliasi Topup Requests yang berstatus 'approved' (untuk menyertakan setoran lama yang disetujui sebelum subkoleksi transactions ditambahkan)
  if (!hasDepositApprovedTx) {
    for (const req of approvedTopups) {
      if (req.type === 'withdraw' || req.type === 'cash_delivery') continue;
      const asset = String(req.asset || 'IDR');
      const amt = Math.abs(Number(req.estimatedAsset || req.amount || 0));
      if (amt <= 0) continue;
      if (asset === 'IDR') {
        idrInflow += amt;
      } else if (asset in cryptoInflows) {
        cryptoInflows[asset] += amt;
      }
    }
  }

  // 8. Rekonsiliasi Audit Global untuk mutasi Trade-X Win & Futures Settlement yang hanya tercatat di global_transactions
  for (const g of userGlobalAudits) {
    const gCat = String(g.category || '');
    if (!hasTradeXTx && gCat === 'Trade-X Win' && g.cryptoCurrency === 'ALX') {
      cryptoInflows.ALX += Math.abs(Number(g.cryptoAmount || 0));
    } else if (gCat === 'Futures Settlement' && !g.userLoggedInTx) {
      const desc = String(g.description || '');
      if (desc.includes('User Profit')) {
        const match = desc.match(/PNL:\s*([0-9.]+)\s*USDT/i);
        if (match && match[1]) {
          cryptoInflows.USDT += parseFloat(match[1]);
        }
      }
    }
  }

  // 9. Sertakan saldo on-chain yang sudah disinkronkan di dompet kustodian nasabah
  if (user.syncedOnChainBalances && typeof user.syncedOnChainBalances === 'object') {
    for (const coin of ['ALX', 'USDT', 'ETH', 'BTC']) {
      const onChainBal = Number(user.syncedOnChainBalances[coin] || 0);
      if (onChainBal > cryptoInflows[coin]) {
        cryptoInflows[coin] = onChainBal;
      }
    }
  }

  const idrLedgerBal = idrInflow - idrOutflow;
  const cryptoLedgerBals: Record<string, number> = {
    ALX: cryptoInflows.ALX - cryptoOutflows.ALX,
    USDT: cryptoInflows.USDT - cryptoOutflows.USDT,
    ETH: cryptoInflows.ETH - cryptoOutflows.ETH,
    BTC: cryptoInflows.BTC - cryptoOutflows.BTC,
  };

  return {
    hasLegalization,
    idrInflow,
    idrOutflow,
    idrLedgerBal,
    cryptoInflows,
    cryptoOutflows,
    cryptoLedgerBals,
  };
}

export async function GET(req: NextRequest) {
  try {
    let { idToken, refreshToken } = resolveTokenFromRequest(req);
    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) idToken = refreshed;
    }

    const summary = await restGetDoc('system/reconciliation', idToken);
    if (summary?.latestRunId) {
      const runDoc = await restGetDoc(`system/reconciliation/runs/${summary.latestRunId}`, idToken);
      if (runDoc) {
        return NextResponse.json({ success: true, latestRun: runDoc });
      }
    }
    return NextResponse.json({ success: true, latestRun: null });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Gagal memuat data rekonsiliasi.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let { idToken, refreshToken } = resolveTokenFromRequest(req);
    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) idToken = refreshed;
    }

    if (!idToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const adminInfo = await verifyAdminTokenViaRest(idToken);
    if (!adminInfo) {
      return NextResponse.json({ error: 'Akses ditolak. Endpoint ini memerlukan hak Super Admin.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // Mode tindakan cepat Admin: 'legalize' (Legalisasi Selisih) atau 'clawback' (Sita Saldo Hantu)
    if (body.action === 'legalize' || body.action === 'clawback') {
      const targetUserId = String(body.userId || '');
      const flaggedAssets: Array<{ asset: string; diff: number; ledger: number; actual: number }> = body.flaggedAssets || [];
      if (!targetUserId || flaggedAssets.length === 0) {
        return NextResponse.json({ error: 'Parameter userId dan flaggedAssets diperlukan.' }, { status: 400 });
      }

      const targetUser = await restGetDoc(`users/${targetUserId}`, idToken);
      if (!targetUser) {
        return NextResponse.json({ error: 'Nasabah tidak ditemukan.' }, { status: 404 });
      }

      const now = new Date();
      const nowIso = now.toISOString();

      if (body.action === 'clawback') {
        const nextCrypto = { ...(targetUser.cryptoBalances || {}) };
        let nextTotalBalance = Number(targetUser.totalBalance || 0);

        for (const f of flaggedAssets) {
          if (f.asset === 'IDR') {
            nextTotalBalance = Math.max(0, Math.round(Number(f.ledger || 0)));
          } else {
            nextCrypto[f.asset] = Math.max(0, Number(Number(f.ledger || 0).toFixed(8)));
          }
        }

        await restPatchDoc(
          `users/${targetUserId}`,
          {
            totalBalance: nextTotalBalance,
            cryptoBalances: nextCrypto,
            isSuspended: false,
            securityLockReason: null,
          },
          idToken
        );

        await restCreateDoc(
          `users/${targetUserId}/transactions`,
          {
            date: nowIso,
            description: 'Penyesuaian Rekonsiliasi: Penertiban Saldo Tanpa Bukti Mutasi',
            category: 'Adjustment',
            amount: 0,
            type: 'expense',
            status: 'success',
            timestamp: now,
          },
          idToken
        );
      } else {
        // 'legalize' — tambahkan catatan penyesuaian sah untuk setiap aset yang selisih
        for (const f of flaggedAssets) {
          const diffAmt = Number(f.diff || 0);
          if (diffAmt <= 0) continue;
          if (f.asset === 'IDR') {
            await restCreateDoc(
              `users/${targetUserId}/transactions`,
              {
                date: nowIso,
                description: 'Otorisasi Rekonsiliasi Admin (Saldo Awal / Injeksi Sah IDR)',
                category: 'Deposit',
                asset: 'IDR',
                amount: Math.round(diffAmt),
                type: 'income',
                status: 'success',
                timestamp: now,
              },
              idToken
            );
          } else {
            await restCreateDoc(
              `users/${targetUserId}/transactions`,
              {
                date: nowIso,
                description: `Otorisasi Rekonsiliasi Admin (Saldo Awal / Injeksi Sah ${f.asset})`,
                category: 'Crypto Deposit',
                asset: f.asset,
                cryptoCurrency: f.asset,
                cryptoAmount: Number(diffAmt.toFixed(8)),
                type: 'income',
                status: 'success',
                timestamp: now,
              },
              idToken
            );
          }
        }

        await restPatchDoc(
          `users/${targetUserId}`,
          {
            isSuspended: false,
            securityLockReason: null,
          },
          idToken
        );
      }

      return NextResponse.json({
        success: true,
        action: body.action,
        userId: targetUserId,
      });
    }

    const autoSuspend = body.autoSuspend ?? false;

    // 1. Ambil konfigurasi sistem, seluruh nasabah, topup_requests, dan global_transactions secara paralel
    const [configDoc, liquidityDoc, users, allTopupReqs, allGlobalAudits] = await Promise.all([
      restGetDoc('system/api_keys', idToken),
      restGetDoc('system/liquidity', idToken),
      restQueryCollection('', 'users', idToken, 500),
      restQueryCollection('', 'topup_requests', idToken, 500),
      restQueryCollection('system/audit', 'global_transactions', idToken, 500),
    ]);

    const config = configDoc || {};
    const liqData = liquidityDoc || {};

    const alxContract = config.alxContractAddress || ALX_CONTRACT_DEFAULT;
    const usdtContract = config.usdtContractAddress || USDT_CONTRACT_DEFAULT;
    const vaultContract = config.vaultContractAddress || VAULT_CONTRACT_DEFAULT;

    let totalUsersAudited = 0;
    const flaggedUsers: any[] = [];

    const totalCustody = {
      IDR: 0,
      ALX: 0,
      USDT: 0,
      ETH: 0,
      BTC: 0,
    };

    let totalUserOnChainAlx = 0;
    let totalUserOnChainUsdt = 0;

    // 2. Audit seluruh nasabah secara paralel dalam batch
    const userAuditResults = await Promise.all(
      users.map(async (user) => {
        const txs = await restQueryCollection(`users/${user.id}`, 'transactions', idToken, 400);
        return { user, txs };
      })
    );

    for (const { user, txs } of userAuditResults) {
      totalUsersAudited++;

      // Gunakan totalBalance (saldo dompet aktif) agar konsisten dengan mutasi Setor/Tarik Tabungan Yield
      const userBalIdr = Number(user.totalBalance || 0);
      const userBalSavings = Number(user.savings || 0);
      const userBalAlx = Number(user.cryptoBalances?.ALX || 0);
      const userBalUsdt = Number(user.cryptoBalances?.USDT || 0);
      const userBalEth = Number(user.cryptoBalances?.ETH || 0);
      const userBalBtc = Number(user.cryptoBalances?.BTC || 0);

      totalCustody.IDR += userBalIdr + userBalSavings;
      totalCustody.ALX += userBalAlx;
      totalCustody.USDT += userBalUsdt;
      totalCustody.ETH += userBalEth;
      totalCustody.BTC += userBalBtc;

      totalUserOnChainAlx += Number(user.syncedOnChainBalances?.ALX || 0);
      totalUserOnChainUsdt += Number(user.syncedOnChainBalances?.USDT || 0);

      // Akun Super Admin / Owner adalah akun Brankas & Operasional Bank (dikecualikan dari daftar tersangka fraud)
      const userEmailClean = String(user.email || '').toLowerCase();
      const isOwnerAccount =
        userEmailClean === OWNER_EMAIL.toLowerCase() ||
        userEmailClean === 'aldzulfikar075@gmail.com' ||
        user.id === OWNER_UID ||
        user.role === 'admin';
      if (isOwnerAccount) {
        continue;
      }

      const approvedTopups = allTopupReqs.filter(
        (r) => r.userId === user.id && r.status === 'approved'
      );
      const userGlobalAudits = allGlobalAudits.filter(
        (g) =>
          String(g.userEmail || '').toLowerCase() === String(user.email || '').toLowerCase() &&
          (g.status === 'success' || g.status === 'berhasil')
      );

      const {
        hasLegalization,
        idrLedgerBal,
        cryptoLedgerBals,
      } = computeAccurateUserLedger(user, txs, approvedTopups, userGlobalAudits);

      if (hasLegalization) {
        continue;
      }

      const idrDiff = userBalIdr - idrLedgerBal;
      const userFlaggedAssets: any[] = [];

      if (idrDiff > 1000) {
        userFlaggedAssets.push({
          asset: 'IDR',
          actual: userBalIdr,
          ledger: idrLedgerBal,
          diff: idrDiff,
        });
      }

      (['ALX', 'USDT', 'ETH', 'BTC'] as const).forEach((coin) => {
        const ledgerBal = cryptoLedgerBals[coin] || 0;
        const actualBal =
          coin === 'ALX'
            ? userBalAlx
            : coin === 'USDT'
            ? userBalUsdt
            : coin === 'ETH'
            ? userBalEth
            : userBalBtc;
        const diff = actualBal - ledgerBal;
        if (diff > 0.001) {
          userFlaggedAssets.push({
            asset: coin,
            actual: actualBal,
            ledger: ledgerBal,
            diff,
          });
        }
      });

      if (userFlaggedAssets.length > 0) {
        let isSuspendedNow = Boolean(user.isSuspended);

        if (autoSuspend && !isSuspendedNow) {
          isSuspendedNow = true;
          const now = new Date();
          const nowIso = now.toISOString();

          await Promise.all([
            restPatchDoc(
              `users/${user.id}`,
              {
                isSuspended: true,
                securityLockReason: 'Auto-Suspended: Ledger reconciliation discrepancy detected.',
              },
              idToken
            ),
            restCreateDoc(
              `users/${user.id}/transactions`,
              {
                date: nowIso,
                description: 'Security Freeze: Saldo Ditangguhkan (Rekonsiliasi Mismatch)',
                category: 'Security Lock',
                amount: 0,
                type: 'expense',
                status: 'success',
                timestamp: now,
              },
              idToken
            ),
            restCreateDoc(
              `users/${user.id}/notifications`,
              {
                title: '⚠️ Pembekuan Akun Keamanan',
                message:
                  'Akun Anda ditangguhkan secara otomatis oleh sistem keamanan AliBank karena adanya selisih saldo di luar riwayat mutasi sah Anda.',
                type: 'warning',
                read: false,
                createdAt: nowIso,
                timestamp: now,
              },
              idToken
            ),
            restCreateDoc(
              'system/audit/global_transactions',
              {
                id: `SUSP-AUTO-${user.id}-${Date.now()}`,
                category: 'Security Alert',
                gateway: 'System Reconciler',
                amountIdr: 0,
                status: 'success',
                timestamp: now,
                userEmail: user.email || '',
                description: `Auto-suspended user ${user.email} (UID: ${user.id}) due to reconciliation discrepancy.`,
              },
              idToken
            ),
          ]);
        }

        flaggedUsers.push({
          userId: user.id,
          name: user.name || 'Pengguna Tanpa Nama',
          email: user.email || 'N/A',
          tier: user.tier || 'Regular',
          isSuspended: isSuspendedNow,
          flaggedAssets: userFlaggedAssets,
        });
      }
    }

    // 3. Ambil Saldo Brankas Pusat (On-Chain + Cadangan Gateway Likuiditas Sistem)
    const totalVault = {
      ALX: 0,
      USDT: 0,
      ETH: 0,
      BTC: totalCustody.BTC,
      IDR: Number(liqData.totalFiatInjected || 0),
    };

    const rpcErrors: string[] = [];

    let adminWalletAddress = '';
    if (config.vaultPrivateKey || process.env.ALIBANK_VAULT_PRIVATE_KEY) {
      try {
        const pkey = String(config.vaultPrivateKey || process.env.ALIBANK_VAULT_PRIVATE_KEY).trim();
        const finalKey = pkey.startsWith('0x') ? pkey : '0x' + pkey;
        const wallet = new ethers.Wallet(finalKey);
        adminWalletAddress = wallet.address;
      } catch {}
    }

    // Cek Polygon On-Chain (Multi-RPC Fallback)
    const polygonCandidates = [
      ...(config.polygonRpcUrl ? [config.polygonRpcUrl] : []),
      ...POLYGON_RPCS,
    ];
    let polygonSuccess = false;
    for (const rpcUrl of polygonCandidates) {
      try {
        const providerPolygon = new ethers.JsonRpcProvider(rpcUrl, 137, { staticNetwork: true });
        const alxContractObj = new ethers.Contract(alxContract, ERC20_ABI, providerPolygon);
        const usdtContractObj = new ethers.Contract(usdtContract, ERC20_ABI, providerPolygon);

        if (adminWalletAddress) {
          const [alxWei, usdtUnits] = await Promise.all([
            alxContractObj.balanceOf(adminWalletAddress),
            usdtContractObj.balanceOf(adminWalletAddress),
          ]);
          const onChainAdminAlx = parseFloat(ethers.formatUnits(alxWei, 18));
          const onChainAdminUsdt = parseFloat(ethers.formatUnits(usdtUnits, 6));

          // Cadangan Brankas ALX = Saldo On-Chain Admin + Saldo On-Chain Kustodian + Cadangan Vault Internal
          const internalAlxReserve = Math.max(0, Number(liqData.alixVaultBalance || 0));
          totalVault.ALX = onChainAdminAlx + totalUserOnChainAlx + internalAlxReserve;

          // Cadangan Brankas USDT = Saldo On-Chain Admin + Saldo On-Chain Kustodian + Likuiditas USD Gateway
          const gatewayUsdReserve = Math.max(0, Number(liqData.totalUsdInjected || 0));
          totalVault.USDT = onChainAdminUsdt + totalUserOnChainUsdt + gatewayUsdReserve;
        } else {
          const totalSupplyWei = await alxContractObj.totalSupply();
          totalVault.ALX = parseFloat(ethers.formatUnits(totalSupplyWei, 18));
          totalVault.USDT = Math.max(0, Number(liqData.totalUsdInjected || 0)) + totalUserOnChainUsdt;
        }

        polygonSuccess = true;
        break;
      } catch (err: any) {
        console.warn(`[Reconcile Polygon RPC Fallback ${rpcUrl}]:`, err?.message);
      }
    }
    if (!polygonSuccess) {
      rpcErrors.push('Polygon RPC: Gagal menghubungi semua node publik Polygon.');
    }

    // Cek Ethereum On-Chain (Multi-RPC Fallback)
    const ethCandidates = [
      ...(config.ethereumRpcUrl ? [config.ethereumRpcUrl] : []),
      ...ETH_RPCS,
    ];
    let ethSuccess = false;
    for (const rpcUrl of ethCandidates) {
      try {
        const providerEth = new ethers.JsonRpcProvider(rpcUrl, 1, { staticNetwork: true });
        const contract = new ethers.Contract(vaultContract, AliBankVaultABI, providerEth);
        const [vaultBalWei, adminEthWei] = await Promise.all([
          contract.getTotalVaultBalance().catch(() => providerEth.getBalance(vaultContract)),
          adminWalletAddress ? providerEth.getBalance(adminWalletAddress).catch(() => BigInt(0)) : Promise.resolve(BigInt(0)),
        ]);
        totalVault.ETH =
          parseFloat(ethers.formatEther(vaultBalWei)) +
          parseFloat(ethers.formatEther(adminEthWei));
        ethSuccess = true;
        break;
      } catch (err: any) {
        console.warn(`[Reconcile Ethereum RPC Fallback ${rpcUrl}]:`, err?.message);
      }
    }
    if (!ethSuccess) {
      rpcErrors.push('Ethereum RPC: Gagal menghubungi semua node publik Ethereum.');
    }

    // Hitung defisit sistem (jika ada)
    const deficiencies = {
      IDR: Math.max(0, totalCustody.IDR - totalVault.IDR),
      ALX: Math.max(0, totalCustody.ALX - totalVault.ALX),
      USDT: Math.max(0, totalCustody.USDT - totalVault.USDT),
      ETH: Math.max(0, totalCustody.ETH - totalVault.ETH),
    };

    const isSystemDeficit =
      deficiencies.ALX > 0.01 ||
      deficiencies.USDT > 0.01 ||
      deficiencies.ETH > 0.01 ||
      deficiencies.IDR > 10000;

    // 4. Simpan hasil rekonsiliasi ke Firestore via REST API
    const runId = `RUN-${Date.now()}`;
    const now = new Date();
    const nowIso = now.toISOString();

    const runData = {
      runId,
      timestamp: nowIso,
      createdAt: nowIso,
      totalUsersAudited,
      flaggedUsersCount: flaggedUsers.length,
      flaggedUsers,
      totalCustody,
      totalVault,
      deficiencies,
      rpcErrors,
      status: isSystemDeficit || flaggedUsers.length > 0 ? 'anomalies_detected' : 'clean',
    };

    await Promise.all([
      restPatchDoc(`system/reconciliation/runs/${runId}`, runData, idToken),
      restPatchDoc(
        'system/reconciliation',
        {
          latestRunId: runId,
          latestRunTimestamp: nowIso,
          status: runData.status,
          flaggedUsersCount: flaggedUsers.length,
          isSystemDeficit,
          rpcErrors: rpcErrors.length > 0 ? rpcErrors : [],
        },
        idToken
      ),
    ]);

    return NextResponse.json({
      success: true,
      ...runData,
    });
  } catch (err: any) {
    console.error('[Reconciliation API Error]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Gagal menjalankan audit rekonsiliasi.' },
      { status: 500 }
    );
  }
}
