import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';
import { checkIdempotency, saveIdempotencyResult } from '@/lib/payment-anomaly-detector';
import { extractRequestTokens, verifyFirebaseToken } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: firebaseConfig.projectId || 'darmedia-pos' });
}

const INVOICE_PATH_REGEX = /^merchants\/[a-zA-Z0-9_-]+\/invoices\/[a-zA-Z0-9_-]+$/;

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    const body = await req.json();

    // Get authorization if present (guest checkouts are supported for public POS invoice payment)
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(req, body);
    const verifiedCaller =
      rawIdToken || rawRefreshToken ? await verifyFirebaseToken(rawIdToken, rawRefreshToken) : null;
    const userEmail = verifiedCaller?.email || 'external_client@alibank.com';

    const { invoiceId, isMarketplaceItem, path, amountIdr, amountUsd, productName, details } = body;

    if (!invoiceId || amountIdr == null || amountUsd == null) {
      return NextResponse.json({ error: 'Parameter finalisasi checkout tidak lengkap.' }, { status: 400 });
    }

    // Validasi format path invoice untuk mencegah manipulasi dokumen sembarang
    if (!isMarketplaceItem) {
      if (!path || !INVOICE_PATH_REGEX.test(path)) {
        return NextResponse.json({ error: 'Format jalur invoice tidak valid.' }, { status: 400 });
      }
    }

    const gatewayId = details?.id || `TXN-${Date.now()}`;
    const gatewayName = details?.gateway || 'AliBank Production Gateway';
    const bankName = details?.bankName || 'Global Issuer';
    const timestamp = new Date().toISOString();

    let finalAmountIdr = parseFloat(amountIdr);
    let finalAmountUsd = parseFloat(amountUsd);

    if (isNaN(finalAmountIdr) || finalAmountIdr <= 0 || finalAmountIdr > 5_000_000_000 || isNaN(finalAmountUsd) || finalAmountUsd < 0 || finalAmountUsd > 500_000) {
      return NextResponse.json({ error: 'Nominal penyelesaian checkout tidak valid.' }, { status: 400 });
    }

    if (isMarketplaceItem && !verifiedCaller && !details?.id) {
      return NextResponse.json({ error: 'Autentikasi atau referensi pembayaran gateway diperlukan untuk item marketplace.' }, { status: 401 });
    }

    const idempotencyKey = !isMarketplaceItem && path ? `finalize:${path}` : `finalize_market:${gatewayId}`;
    const idemCheck = checkIdempotency(idempotencyKey);
    if (idemCheck.isDuplicate) {
      return NextResponse.json({ error: 'Invoice ini sudah pernah diselesaikan sebelumnya.' }, { status: 409 });
    }

    if (!isMarketplaceItem && path) {
      const localInvoice = getLocalDoc(path);
      if (localInvoice.exists && localInvoice.data) {
        if (localInvoice.data.status === 'paid') {
          return NextResponse.json({ error: 'Invoice ini sudah pernah diselesaikan sebelumnya.' }, { status: 400 });
        }
        if (localInvoice.data.amountIdr != null) finalAmountIdr = parseFloat(localInvoice.data.amountIdr);
        if (localInvoice.data.amountUsd != null) finalAmountUsd = parseFloat(localInvoice.data.amountUsd);
      }
    }

    // Perform atomic transaction in Firestore BEFORE mutating local liquidity cache
    let alreadyPaidError = false;
    try {
      await db.runTransaction(async (transaction) => {
        // 1. Verifikasi integritas invoice dari database jika bukan marketplace item
        if (!isMarketplaceItem && path) {
          const invoiceRef = db.doc(path);
          const invoiceSnap = await transaction.get(invoiceRef);

          if (invoiceSnap.exists) {
            const invoiceData = invoiceSnap.data()!;
            if (invoiceData.status === 'paid') {
              throw new Error('ALREADY_PAID');
            }
            if (invoiceData.amountIdr != null) {
              finalAmountIdr = parseFloat(invoiceData.amountIdr);
            }
            if (invoiceData.amountUsd != null) {
              finalAmountUsd = parseFloat(invoiceData.amountUsd);
            }
            transaction.set(invoiceRef, {
              status: "paid",
              paidAt: timestamp,
              paymentMethod: gatewayName,
              gatewayOrderId: gatewayId,
            }, { merge: true });
          }
        }

        // 2. Update Global Liquidity
        const liquidityRef = db.collection('system').doc('liquidity');
        transaction.update(liquidityRef, {
          totalFiatInjected: FieldValue.increment(finalAmountIdr),
          totalUsdInjected: FieldValue.increment(finalAmountUsd)
        });

        // 3. Record Global Audit Log
        const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
        transaction.set(auditRef, {
          id: `CHECKOUT-${gatewayId}`,
          category: "External Settlement",
          gateway: gatewayName,
          bankName: bankName,
          amountIdr: finalAmountIdr,
          amountUsd: finalAmountUsd,
          description: `Settlement for Invoice ${invoiceId} (${productName || 'Marketplace Item'}).`,
          status: "success",
          timestamp: FieldValue.serverTimestamp(),
          userEmail: userEmail
        });
      });
    } catch (fsErr: any) {
      if (fsErr?.message === 'ALREADY_PAID') {
        alreadyPaidError = true;
      } else {
        console.warn('[Finalize Checkout] Firestore transaction skipped (saved in local store):', fsErr?.message?.slice(0, 80));
      }
    }

    if (alreadyPaidError) {
      return NextResponse.json({ error: 'Invoice ini sudah pernah diselesaikan sebelumnya.' }, { status: 400 });
    }

    if (!isMarketplaceItem && path) {
      setLocalDoc(path, {
        status: "paid",
        paidAt: timestamp,
        paymentMethod: gatewayName,
        gatewayOrderId: gatewayId,
      }, true);
    }

    const localLiq = getLocalDoc('system/liquidity');
    setLocalDoc('system/liquidity', {
      totalFiatInjected: Number(localLiq.data?.totalFiatInjected || 0) + finalAmountIdr,
      totalUsdInjected: Number(localLiq.data?.totalUsdInjected || 0) + finalAmountUsd,
    }, true);

    addLocalCollectionDoc('system/audit/global_transactions', {
      id: `CHECKOUT-${gatewayId}`,
      category: "External Settlement",
      gateway: gatewayName,
      bankName: bankName,
      amountIdr: finalAmountIdr,
      amountUsd: finalAmountUsd,
      description: `Settlement for Invoice ${invoiceId} (${productName || 'Marketplace Item'}).`,
      status: "success",
      timestamp,
      userEmail: userEmail
    });

    saveIdempotencyResult(idempotencyKey, { success: true });

    if (path) {
      const merchantUid = path.split('/')[1];
      if (merchantUid) {
        await dispatchUserNotification(merchantUid, {
          title: `💰 Pembayaran Invoice ${invoiceId} Lunas`,
          message: `Dana sebesar Rp ${finalAmountIdr.toLocaleString('id-ID')} (${gatewayName}) telah masuk untuk ${productName || `Invoice ${invoiceId}`}.`,
          type: 'success',
          category: 'transaksi',
          amount: finalAmountIdr,
          actionUrl: '/merchant',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Kliring pembayaran berhasil difinalisasi.'
    });

  } catch (err: any) {
    console.error('[Finalize Checkout Route Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses finalisasi pembayaran.' },
      { status: 500 }
    );
  }
}
