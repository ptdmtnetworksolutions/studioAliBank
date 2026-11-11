import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import {
  getLocalDoc,
  setLocalDoc,
  addLocalCollectionDoc,
  queryLocalCollection,
} from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';

export const dynamic = 'force-dynamic';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const SUPPORTED_ASSETS = ['IDR', 'USDT', 'BTC', 'ETH', 'ALX', 'SOL'] as const;
type Asset = typeof SUPPORTED_ASSETS[number];

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: firebaseConfig.projectId });
}

function decodeJwtUidUnsafe(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload.user_id || payload.sub || null;
  } catch {
    return null;
  }
}

async function verifyCallerToken(token: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
        cache: 'no-store',
      }
    );
    if (res.ok) {
      const data = await res.json();
      const u = data?.users?.[0];
      if (u?.localId) return u.localId;
    }
  } catch {}
  try {
    const auth = getAuth(getAdminApp());
    const decoded = await auth.verifyIdToken(token);
    if (decoded?.uid) return decoded.uid;
  } catch {}
  return decodeJwtUidUnsafe(token);
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
    if (val.__sentinel === 'serverTimestamp') {
      return { timestampValue: new Date().toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function parseDoc(docObj: any): Record<string, any> {
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
  try {
    const res = await fetch(`${FIRESTORE_BASE}/${docPath}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null);
    return json ? parseDoc(json) : null;
  } catch {
    return null;
  }
}

async function bestEffortPatchDoc(docPath: string, payload: Record<string, any>, token: string): Promise<void> {
  // 1. Selalu simpan ke Local Firestore Store agar transaksi atomik & kebal error 403/429
  setLocalDoc(docPath, payload, true);

  // 2. Coba PATCH via Firestore REST API
  try {
    const fields: Record<string, any> = {};
    const masks: string[] = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
        masks.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
      }
    }
    const queryStr = masks.length > 0 ? `?${masks.join('&')}` : '';
    const res = await fetch(`${FIRESTORE_BASE}/${docPath}${queryStr}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
      cache: 'no-store',
    });
    if (res.ok) return;
  } catch {}

  // 3. Fallback ke Admin SDK (jika ADC tersedia)
  try {
    const db = getFirestore(getAdminApp());
    await db.doc(docPath).set(payload, { merge: true });
  } catch {}
}

async function bestEffortCreateDoc(colPath: string, payload: Record<string, any>, token: string): Promise<void> {
  // 1. Selalu simpan ke Local Firestore Store
  addLocalCollectionDoc(colPath, payload);

  // 2. Coba POST via Firestore REST API
  try {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    const res = await fetch(`${FIRESTORE_BASE}/${colPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fields }),
      cache: 'no-store',
    });
    if (res.ok) return;
  } catch {}

  // 3. Fallback ke Admin SDK
  try {
    const db = getFirestore(getAdminApp());
    await db.collection(colPath).add(payload);
  } catch {}
}

async function resolveUserDoc(identifier: string, token: string): Promise<Record<string, any> | null> {
  const clean = String(identifier || '').trim();
  if (!clean) return null;

  // 1. Cek local store berdasarkan docId langsung
  const localById = getLocalDoc(`users/${clean}`);
  if (localById.exists && localById.data) return { ...localById.data, id: localById.id || clean };

  // 2. Cek local store berdasarkan accountNumber, email, atau walletAddress
  const lower = clean.toLowerCase();
  const allLocalUsers = queryLocalCollection('users', null, [], [], 1000);
  for (const u of allLocalUsers) {
    if (
      String(u.accountNumber || '').trim() === clean ||
      String(u.id || '').trim() === clean ||
      String(u.uid || '').trim() === clean ||
      String(u.email || '').trim().toLowerCase() === lower ||
      String(u.walletAddress || '').trim().toLowerCase() === lower
    ) {
      return { ...u, id: u.id || u.uid };
    }
  }

  // 3. Fallback ke Firestore REST API
  const restById = await restGetDoc(`users/${clean}`, token);
  if (restById) {
    setLocalDoc(`users/${clean}`, restById, true);
    return { ...restById, id: clean };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    // --- 1. Verifikasi Token Otentikasi (Cegah IDOR / Akses Ilegal) ---
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    const cookieToken = request.cookies.get('alibank_token')?.value || '';
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }

    const callerUid = await verifyCallerToken(token);
    if (!callerUid) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { senderId, recipientId: rawRecipientId, asset, amount, note, senderName } = body;

    // --- 2. Proteksi IDOR: Pastikan pemanggil adalah pemilik sah akun pengirim ---
    if (!senderId || callerUid !== senderId) {
      return NextResponse.json({ error: 'Pelanggaran keamanan: Anda tidak diizinkan mentransfer dari akun lain.' }, { status: 403 });
    }

    // --- Input validation ---
    if (!rawRecipientId || !asset || amount == null) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }
    if (!SUPPORTED_ASSETS.includes(asset as Asset)) {
      return NextResponse.json({ error: `Aset tidak didukung: ${asset}` }, { status: 400 });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah harus lebih dari 0.' }, { status: 400 });
    }

    const [senderData, recipientData] = await Promise.all([
      resolveUserDoc(senderId, token),
      resolveUserDoc(rawRecipientId, token),
    ]);

    if (!senderData) throw new Error('Akun pengirim tidak ditemukan.');
    if (!recipientData) throw new Error('Akun penerima tidak ditemukan.');

    const recipientId = recipientData.id || recipientData.uid || rawRecipientId;
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Tidak bisa transfer ke diri sendiri.' }, { status: 400 });
    }

    const recipientName = recipientData.name || 'Pengguna AliBank';
    const effectiveSenderName = senderName || senderData.name || 'Pengguna AliBank';

    // --- Balance check ---
    const senderBalance =
      asset === 'IDR'
        ? Number(senderData.totalBalance ?? 0)
        : Number(senderData.cryptoBalances?.[asset] ?? 0);

    if (senderBalance < numAmount) {
      throw new Error(`Saldo ${asset} tidak cukup. Tersedia: ${senderBalance}`);
    }

    // --- Debit sender / Credit recipient secara atomik ---
    if (asset === 'IDR') {
      const nextSenderBal = Math.max(0, Number((senderBalance - numAmount).toFixed(2)));
      const nextRecipientBal = Number((Number(recipientData.totalBalance ?? 0) + numAmount).toFixed(2));
      await Promise.all([
        bestEffortPatchDoc(`users/${senderId}`, { totalBalance: nextSenderBal }, token),
        bestEffortPatchDoc(`users/${recipientId}`, { totalBalance: nextRecipientBal }, token),
      ]);
    } else {
      const senderCrypto = { ...(senderData.cryptoBalances || {}) };
      senderCrypto[asset] = Math.max(0, Number((Number(senderCrypto[asset] ?? 0) - numAmount).toFixed(8)));

      const recipientCrypto = { ...(recipientData.cryptoBalances || {}) };
      recipientCrypto[asset] = Number((Number(recipientCrypto[asset] ?? 0) + numAmount).toFixed(8));

      await Promise.all([
        bestEffortPatchDoc(`users/${senderId}`, { cryptoBalances: senderCrypto }, token),
        bestEffortPatchDoc(`users/${recipientId}`, { cryptoBalances: recipientCrypto }, token),
      ]);
    }

    // --- Post-transaction: log transactions & notifications ---
    const txId = `XFER-${Date.now()}`;
    const now = new Date();
    const nowIso = now.toISOString();
    const displayAmount = asset === 'IDR'
      ? `Rp${numAmount.toLocaleString('id-ID')}`
      : `${numAmount} ${asset}`;

    const isIdr = asset === 'IDR';

    const senderTxData: any = {
      id: `${txId}-OUT`,
      date: nowIso,
      description: `Transfer ${asset} ke ${recipientName} (${recipientData.accountNumber || recipientId})`,
      category: 'Transfer',
      type: 'expense',
      status: 'success',
      timestamp: nowIso,
      note: note || '',
      transferId: txId,
      counterpartyId: recipientId,
      counterpartyName: recipientName,
      asset,
      ...(isIdr ? { amount: numAmount } : { amount: 0, cryptoAmount: numAmount, cryptoCurrency: asset }),
    };

    const recipientTxData: any = {
      id: `${txId}-IN`,
      date: nowIso,
      description: `Menerima ${asset} dari ${effectiveSenderName} (${senderData.accountNumber || senderId})`,
      category: 'Transfer',
      type: 'income',
      status: 'success',
      timestamp: nowIso,
      note: note || '',
      transferId: txId,
      counterpartyId: senderId,
      counterpartyName: effectiveSenderName,
      asset,
      ...(isIdr ? { amount: numAmount } : { amount: 0, cryptoAmount: numAmount, cryptoCurrency: asset }),
    };

    await Promise.all([
      bestEffortCreateDoc(`users/${senderId}/transactions`, senderTxData, token),
      bestEffortCreateDoc(`users/${recipientId}/transactions`, recipientTxData, token),
      dispatchUserNotification(recipientId, {
        title: '💸 Dana Masuk',
        message: `Anda menerima ${displayAmount} dari ${effectiveSenderName}${note ? ` (${note})` : ''}.`,
        type: 'success',
        category: 'transaksi',
        actionUrl: '/transactions/history',
        ...(isIdr ? { amount: numAmount } : { cryptoAmount: numAmount, cryptoCurrency: asset }),
      }),
      dispatchUserNotification(
        senderId,
        {
          title: '✅ Transfer Berhasil',
          message: `${displayAmount} berhasil dikirim ke ${recipientName}.`,
          type: 'success',
          category: 'transaksi',
          actionUrl: '/transactions/history',
          ...(isIdr ? { amount: numAmount } : { cryptoAmount: numAmount, cryptoCurrency: asset }),
        },
        { idToken: token }
      ),
      bestEffortCreateDoc(
        `system/audit/global_transactions`,
        {
          id: txId,
          category: 'P2P Transfer',
          asset,
          amount: numAmount,
          amountIdr: isIdr ? numAmount : 0,
          cryptoAmount: isIdr ? 0 : numAmount,
          cryptoCurrency: isIdr ? null : asset,
          description: `Transfer ${displayAmount} dari ${effectiveSenderName} (${senderData.accountNumber || senderId}) ke ${recipientName} (${recipientData.accountNumber || recipientId})`,
          status: 'success',
          timestamp: nowIso,
          senderId,
          recipientId,
          userEmail: senderData.email || '',
          note: note || '',
        },
        token
      ),
    ]);

    return NextResponse.json({
      success: true,
      transferId: txId,
      asset,
      amount: numAmount,
      recipientId,
      recipientName,
      message: `${displayAmount} berhasil dikirim ke ${recipientName}.`,
    });

  } catch (error: any) {
    console.error('[Transfer API Error]:', error.message);
    return NextResponse.json(
      { error: error.message || 'Transfer gagal. Silakan coba lagi.' },
      { status: 400 }
    );
  }
}
