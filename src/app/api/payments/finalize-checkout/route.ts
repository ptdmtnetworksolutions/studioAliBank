import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';

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

    // Get authorization if present (guest checkouts are supported for public POS payment)
    let userEmail = 'external_client@alibank.com';
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decodedToken = await getAuth(adminApp).verifyIdToken(token);
        userEmail = decodedToken.email || userEmail;
      } catch (e) {
        console.warn('[Finalize Checkout Auth Warning]: invalid token provided, proceeding as guest');
      }
    }

    const body = await req.json();
    const { invoiceId, isMarketplaceItem, path, amountIdr, amountUsd, productName, details } = body;

    if (!invoiceId || amountIdr == null || amountUsd == null) {
      return NextResponse.json({ error: 'Parameter finalisasi checkout tidak lengkap.' }, { status: 400 });
    }

    // Validasi format path invoice untuk mencegah manipulasi dokumen sembarang
    if (!isMarketplaceItem && path) {
      if (!INVOICE_PATH_REGEX.test(path)) {
        return NextResponse.json({ error: 'Format jalur invoice tidak valid.' }, { status: 400 });
      }
    }

    const gatewayId = details?.id || `TXN-${Date.now()}`;
    const gatewayName = details?.gateway || 'AliBank Production Gateway';
    const bankName = details?.bankName || 'Global Issuer';
    const timestamp = new Date().toISOString();

    let finalAmountIdr = parseFloat(amountIdr);
    let finalAmountUsd = parseFloat(amountUsd);

    if (!isMarketplaceItem && path) {
      const localInvoice = getLocalDoc(path);
      if (localInvoice.exists && localInvoice.data) {
        if (localInvoice.data.status === 'paid') {
          return NextResponse.json({ error: 'Invoice ini sudah pernah diselesaikan sebelumnya.' }, { status: 400 });
        }
        if (localInvoice.data.amountIdr != null) finalAmountIdr = parseFloat(localInvoice.data.amountIdr);
        if (localInvoice.data.amountUsd != null) finalAmountUsd = parseFloat(localInvoice.data.amountUsd);
      }
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

    // Perform atomic transaction in Firestore (best-effort if ADC/quota available)
    try {
      await db.runTransaction(async (transaction) => {
        // 1. Verifikasi integritas invoice dari database jika bukan marketplace item
        if (!isMarketplaceItem && path) {
          const invoiceRef = db.doc(path);
          const invoiceSnap = await transaction.get(invoiceRef);

          if (invoiceSnap.exists) {
            const invoiceData = invoiceSnap.data()!;
            if (invoiceData.status === 'paid') {
              return;
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
      console.warn('[Finalize Checkout] Firestore transaction skipped (saved in local store):', fsErr?.message?.slice(0, 80));
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
