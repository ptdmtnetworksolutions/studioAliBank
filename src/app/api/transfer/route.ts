import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const SUPPORTED_ASSETS = ['IDR', 'USDT', 'BTC', 'ETH', 'ALX'] as const;
type Asset = typeof SUPPORTED_ASSETS[number];

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: firebaseConfig.projectId });
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
  const fields = docObj?.fields || {};
  const data: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    data[k] = fromFirestoreValue(v);
  }
  return data;
}

async function restGetDoc(docPath: string, token: string): Promise<Record<string, any> | null> {
  const res = await fetch(`${FIRESTORE_BASE}/${docPath}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json ? parseDoc(json) : null;
}

async function restPatchDoc(docPath: string, payload: Record<string, any>, token: string): Promise<void> {
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gagal memperbarui dokumen ${docPath}`);
  }
}

async function restCreateDoc(colPath: string, payload: Record<string, any>, token: string): Promise<void> {
  const fields: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  }
  await fetch(`${FIRESTORE_BASE}/${colPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
    cache: 'no-store',
  });
}

export async function POST(request: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const auth = getAuth(adminApp);

    // --- 1. Verifikasi Token Otentikasi (Cegah IDOR / Akses Ilegal) ---
    const authHeader = request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';
    const cookieToken = request.cookies.get('alibank_token')?.value || '';
    const token = bearerToken || cookieToken;

    if (!token) {
      return NextResponse.json({ error: 'Akses ditolak. Token otentikasi diperlukan.' }, { status: 401 });
    }

    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid. Silakan login kembali.' }, { status: 401 });
    }

    const body = await request.json();
    const { senderId, recipientId, asset, amount, note, senderName } = body;

    // --- 2. Proteksi IDOR: Pastikan pemanggil adalah pemilik sah akun pengirim ---
    if (!senderId || decodedToken.uid !== senderId) {
      return NextResponse.json({ error: 'Pelanggaran keamanan: Anda tidak diizinkan mentransfer dari akun lain.' }, { status: 403 });
    }

    // --- Input validation ---
    if (!recipientId || !asset || amount == null) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }
    if (!SUPPORTED_ASSETS.includes(asset as Asset)) {
      return NextResponse.json({ error: `Aset tidak didukung: ${asset}` }, { status: 400 });
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Jumlah harus lebih dari 0.' }, { status: 400 });
    }
    if (senderId === recipientId) {
      return NextResponse.json({ error: 'Tidak bisa transfer ke diri sendiri.' }, { status: 400 });
    }

    const [senderData, recipientData] = await Promise.all([
      restGetDoc(`users/${senderId}`, token),
      restGetDoc(`users/${recipientId}`, token),
    ]);

    if (!senderData) throw new Error('Akun pengirim tidak ditemukan.');
    if (!recipientData) throw new Error('Akun penerima tidak ditemukan.');

    const recipientName = recipientData.name || 'Pengguna AliBank';

    // --- Balance check ---
    const senderBalance =
      asset === 'IDR'
        ? Number(senderData.totalBalance ?? 0)
        : Number(senderData.cryptoBalances?.[asset] ?? 0);

    if (senderBalance < numAmount) {
      throw new Error(`Saldo ${asset} tidak cukup. Tersedia: ${senderBalance}`);
    }

    // --- Debit sender / Credit recipient ---
    if (asset === 'IDR') {
      const nextSenderBal = senderBalance - numAmount;
      const nextRecipientBal = Number(recipientData.totalBalance ?? 0) + numAmount;
      await restPatchDoc(`users/${senderId}`, { totalBalance: nextSenderBal }, token);
      await restPatchDoc(`users/${recipientId}`, { totalBalance: nextRecipientBal }, token);
    } else {
      const senderCrypto = { ...(senderData.cryptoBalances || {}) };
      senderCrypto[asset] = Number(senderCrypto[asset] ?? 0) - numAmount;

      const recipientCrypto = { ...(recipientData.cryptoBalances || {}) };
      recipientCrypto[asset] = Number(recipientCrypto[asset] ?? 0) + numAmount;

      await restPatchDoc(`users/${senderId}`, { cryptoBalances: senderCrypto }, token);
      await restPatchDoc(`users/${recipientId}`, { cryptoBalances: recipientCrypto }, token);
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
      date: nowIso,
      description: `Transfer ${asset} ke ${recipientName}`,
      category: 'Transfer',
      type: 'expense',
      status: 'success',
      timestamp: now,
      note: note || '',
      transferId: txId,
      counterpartyId: recipientId,
      counterpartyName: recipientName,
      asset,
      ...(isIdr ? { amount: numAmount } : { cryptoAmount: numAmount, cryptoCurrency: asset }),
    };

    const recipientTxData: any = {
      date: nowIso,
      description: `Menerima ${asset} dari ${senderName || 'Pengguna AliBank'}`,
      category: 'Transfer',
      type: 'income',
      status: 'success',
      timestamp: now,
      note: note || '',
      transferId: txId,
      counterpartyId: senderId,
      counterpartyName: senderName || 'Pengguna AliBank',
      asset,
      ...(isIdr ? { amount: numAmount } : { cryptoAmount: numAmount, cryptoCurrency: asset }),
    };

    await Promise.all([
      restCreateDoc(`users/${senderId}/transactions`, senderTxData, token),
      restCreateDoc(`users/${recipientId}/transactions`, recipientTxData, token),
      restCreateDoc(
        `users/${recipientId}/notifications`,
        {
          title: '💸 Dana Masuk',
          message: `Anda menerima ${displayAmount} dari ${senderName || 'Pengguna AliBank'}.`,
          type: 'success',
          read: false,
          createdAt: nowIso,
          timestamp: now,
        },
        token
      ),
      restCreateDoc(
        `users/${senderId}/notifications`,
        {
          title: '✅ Transfer Berhasil',
          message: `${displayAmount} berhasil dikirim ke ${recipientName}.`,
          type: 'success',
          read: false,
          createdAt: nowIso,
          timestamp: now,
        },
        token
      ),
      restCreateDoc(
        `system/audit/global_transactions`,
        {
          id: txId,
          category: 'P2P Transfer',
          asset,
          amount: numAmount,
          amountIdr: isIdr ? numAmount : 0,
          description: `Transfer ${displayAmount} dari ${senderName} (${senderId}) ke ${recipientName} (${recipientId})`,
          status: 'success',
          timestamp: now,
          senderId,
          recipientId,
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
