import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

/**
 * POST /api/transfer
 * Atomic P2P asset transfer between AliBank users.
 *
 * Uses Firestore runTransaction to guarantee atomic debit+credit.
 * Supported assets: IDR, USDT, BTC, ETH, ALX
 *
 * Body: {
 *   senderId:    string  — Firebase Auth UID of sender
 *   recipientId: string  — Firebase Auth UID of recipient
 *   asset:       'IDR' | 'USDT' | 'BTC' | 'ETH' | 'ALX'
 *   amount:      number  — amount to transfer (in asset units)
 *   note?:       string  — optional note/memo
 * }
 */

const SUPPORTED_ASSETS = ['IDR', 'USDT', 'BTC', 'ETH', 'ALX'] as const;
type Asset = typeof SUPPORTED_ASSETS[number];

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { senderId, recipientId, asset, amount, note, senderName } = body;

    // --- Input validation ---
    if (!senderId || !recipientId || !asset || amount == null) {
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

    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    const senderRef = db.collection('users').doc(senderId);
    const recipientRef = db.collection('users').doc(recipientId);

    let recipientName = 'Pengguna AliBank';

    // --- Atomic Firestore Transaction ---
    await db.runTransaction(async (tx) => {
      const senderSnap = await tx.get(senderRef);
      const recipientSnap = await tx.get(recipientRef);

      if (!senderSnap.exists) throw new Error('Akun pengirim tidak ditemukan.');
      if (!recipientSnap.exists) throw new Error('Akun penerima tidak ditemukan.');

      const senderData = senderSnap.data()!;
      const recipientData = recipientSnap.data()!;
      recipientName = recipientData.name || 'Pengguna AliBank';

      // --- Balance check ---
      let senderBalance: number;
      if (asset === 'IDR') {
        senderBalance = senderData.totalBalance ?? 0;
      } else {
        senderBalance = senderData.cryptoBalances?.[asset] ?? 0;
      }

      if (senderBalance < numAmount) {
        throw new Error(`Saldo ${asset} tidak cukup. Tersedia: ${senderBalance}`);
      }

      // --- Debit sender / Credit recipient ---
      if (asset === 'IDR') {
        tx.update(senderRef, { totalBalance: FieldValue.increment(-numAmount) });
        tx.update(recipientRef, { totalBalance: FieldValue.increment(numAmount) });
      } else {
        tx.update(senderRef, { [`cryptoBalances.${asset}`]: FieldValue.increment(-numAmount) });
        tx.update(recipientRef, { [`cryptoBalances.${asset}`]: FieldValue.increment(numAmount) });
      }
    });

    // --- Post-transaction: log transactions & notifications ---
    const txId = `XFER-${Date.now()}`;
    const now = new Date().toISOString();
    const displayAmount = asset === 'IDR'
      ? `Rp${numAmount.toLocaleString('id-ID')}`
      : `${numAmount} ${asset}`;

    const batch = db.batch();

    // Sender transaction log
    const senderTxRef = db.collection('users').doc(senderId).collection('transactions').doc();
    batch.set(senderTxRef, {
      date: now,
      description: `Transfer ${asset} ke ${recipientName}`,
      category: 'Transfer',
      amount: numAmount,
      asset,
      type: 'expense',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      note: note || '',
      transferId: txId,
      counterpartyId: recipientId,
      counterpartyName: recipientName,
    });

    // Recipient transaction log
    const recipientTxRef = db.collection('users').doc(recipientId).collection('transactions').doc();
    batch.set(recipientTxRef, {
      date: now,
      description: `Menerima ${asset} dari ${senderName || 'Pengguna AliBank'}`,
      category: 'Transfer',
      amount: numAmount,
      asset,
      type: 'income',
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      note: note || '',
      transferId: txId,
      counterpartyId: senderId,
      counterpartyName: senderName || 'Pengguna AliBank',
    });

    // Recipient notification
    const recipientNotifRef = db.collection('users').doc(recipientId).collection('notifications').doc();
    batch.set(recipientNotifRef, {
      title: '💸 Dana Masuk',
      message: `Anda menerima ${displayAmount} dari ${senderName || 'Pengguna AliBank'}.`,
      type: 'success',
      read: false,
      createdAt: now,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Sender notification
    const senderNotifRef = db.collection('users').doc(senderId).collection('notifications').doc();
    batch.set(senderNotifRef, {
      title: '✅ Transfer Berhasil',
      message: `${displayAmount} berhasil dikirim ke ${recipientName}.`,
      type: 'success',
      read: false,
      createdAt: now,
      timestamp: FieldValue.serverTimestamp(),
    });

    // Global audit log
    const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc(txId);
    batch.set(auditRef, {
      id: txId,
      category: 'P2P Transfer',
      asset,
      amount: numAmount,
      description: `Transfer ${displayAmount} dari ${senderName} (${senderId}) ke ${recipientName} (${recipientId})`,
      status: 'success',
      timestamp: FieldValue.serverTimestamp(),
      senderId,
      recipientId,
      note: note || '',
    });

    await batch.commit();

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
