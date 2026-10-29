import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { executeSoftPosAcquirerTransaction, DEFAULT_SOFTPOS_PROFILE } from '@/lib/softpos-acquirer';
import { detectCardBin } from '@/lib/bin-detector';

export const dynamic = 'force-dynamic';

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: firebaseConfig.projectId });
  } catch (e) {
    return null;
  }
}

/**
 * POST /api/payments/softpos
 * Memproses transaksi SoftPOS / Tap-on-Phone menggunakan Terminal Smartphone berlisensi PCI MPoC.
 * Dana di-settle ke rekening penampungan perusahaan PT AliBank Digital Indonesia,
 * dan koin kripto langsung diterbitkan ke portofolio user.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      userEmail,
      cardNumber,
      cardExpiry,
      cardHolderName,
      cardCvv,
      amountIdr,
      cryptoAmount,
      cryptoCurrency,
      usdValue
    } = body;

    if (!userId || !cardNumber || !amountIdr || !cryptoAmount || !cryptoCurrency) {
      return NextResponse.json({ 
        error: 'Parameter transaksi SoftPOS tidak lengkap. Pastikan nomor kartu dan nominal terisi.' 
      }, { status: 400 });
    }

    const cardBin = detectCardBin(cardNumber);

    // 1. Eksekusi Kernel SoftPOS Acquirer (Nobu Bank / Asterlink Switch)
    const receipt = await executeSoftPosAcquirerTransaction({
      cardNumber,
      cardExpiry: cardExpiry || '2030-12',
      cardHolderName: cardHolderName || 'NATIVE CONTACTLESS',
      cardCvv: cardCvv || '123',
      amountIdr: Number(amountIdr),
      cryptoAmount: Number(cryptoAmount),
      cryptoCurrency,
      usdValue: usdValue || '0',
      userId,
      userEmail: userEmail || ''
    });

    // 2. Perbarui Ledger Firestore (Saldo Kripto & Escrow Penampungan Perusahaan)
    let serverUpdated = false;
    try {
      const adminApp = getAdminApp();
      if (adminApp) {
        const db = getFirestore(adminApp);
        const userRef = db.collection('users').doc(userId);

        await db.runTransaction(async (transaction) => {
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists) return;

          // Tambahkan saldo kripto ke akun user
          const cryptoField = `cryptoBalances.${cryptoCurrency}`;
          transaction.update(userRef, {
            [cryptoField]: FieldValue.increment(parseFloat(String(cryptoAmount)))
          });

          // Injeksi dana fiat masuk ke Rekening Penampungan Likuiditas PT AliBank
          const liquidityRef = db.collection('system').doc('liquidity');
          transaction.update(liquidityRef, {
            totalFiatInjected: FieldValue.increment(parseFloat(String(amountIdr))),
            totalUsdInjected: FieldValue.increment(parseFloat(String(usdValue || 0))),
            lastSoftPosSettlement: FieldValue.serverTimestamp(),
            lastAcquirer: DEFAULT_SOFTPOS_PROFILE.acquirerName
          });

          // Catat Audit Transaksi Global EDC
          const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
          transaction.set(auditRef, {
            id: receipt.transactionId,
            category: "SoftPOS EDC Contactless",
            gateway: `SoftPOS ${cardBin.bank.shortName} (${cardBin.cardType} ${cardBin.network})`,
            acquirer: DEFAULT_SOFTPOS_PROFILE.acquirerName,
            terminalId: DEFAULT_SOFTPOS_PROFILE.terminalId,
            merchantId: DEFAULT_SOFTPOS_PROFILE.merchantId,
            approvalCode: receipt.approvalCode,
            rrn: receipt.retrievalRefNumber,
            settlementAccount: DEFAULT_SOFTPOS_PROFILE.settlementAccount.accountNumber,
            settlementHolder: DEFAULT_SOFTPOS_PROFILE.settlementAccount.accountHolder,
            amountIdr: parseFloat(String(amountIdr)),
            cryptoAmount: parseFloat(String(cryptoAmount)),
            cryptoCurrency: cryptoCurrency,
            cardMasked: cardBin.maskedPan,
            bankName: cardBin.bank.name,
            cardType: cardBin.cardType,
            status: "success",
            timestamp: FieldValue.serverTimestamp(),
            userEmail: userEmail || ""
          });

          // Catat Riwayat Transaksi Nasabah
          const userTxRef = userRef.collection('transactions').doc();
          transaction.set(userTxRef, {
            date: new Date().toISOString(),
            description: `Beli ${cryptoCurrency} via EDC SoftPOS Tap (${cardBin.bank.shortName} ${cardBin.cardType})`,
            category: "Trading",
            amount: parseFloat(String(amountIdr)),
            cryptoAmount: parseFloat(String(cryptoAmount)),
            cryptoCurrency: cryptoCurrency,
            type: 'income',
            status: "success",
            approvalCode: receipt.approvalCode,
            rrn: receipt.retrievalRefNumber,
            terminalId: DEFAULT_SOFTPOS_PROFILE.terminalId,
            timestamp: FieldValue.serverTimestamp()
          });
        });

        serverUpdated = true;
      }
    } catch (dbErr: any) {
      console.warn('[SoftPOS API] Server ledger update skipped, client-side finalization fallback enabled:', dbErr?.message?.slice(0, 80));
    }

    return NextResponse.json({
      success: true,
      receipt,
      cardBin,
      serverUpdated,
      message: `Pembayaran EDC SoftPOS berhasil. Dana Rp ${Number(amountIdr).toLocaleString('id-ID')} disalurkan ke Rekening Penampungan Perusahaan.`
    });

  } catch (err: any) {
    console.error('[SoftPOS Error]:', err.message);
    return NextResponse.json({ 
      error: err.message || 'Gagal memproses transaksi SoftPOS Acquirer.' 
    }, { status: 500 });
  }
}
