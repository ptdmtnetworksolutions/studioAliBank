import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { ethers } from 'ethers';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // Get authorization if present (optional, since guest checkouts are supported)
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

    const gatewayId = details?.id || `TXN-${Date.now()}`;
    const gatewayName = details?.gateway || 'AliBank Production Gateway';
    const bankName = details?.bankName || 'Global Issuer';
    const timestamp = new Date().toISOString();

    // Perform atomic transaction
    await db.runTransaction(async (transaction) => {
      // 1. Update Invoice status if not a marketplace item
      if (!isMarketplaceItem && path) {
        const invoiceRef = db.doc(path);
        transaction.set(invoiceRef, {
          status: "paid",
          paidAt: timestamp,
          paymentMethod: gatewayName,
          gatewayOrderId: gatewayId,
        }, { merge: true });
      }

      // 2. Update Global Liquidity
      const liquidityRef = db.collection('system').doc('liquidity');
      transaction.update(liquidityRef, {
        totalFiatInjected: FieldValue.increment(parseFloat(amountIdr)),
        totalUsdInjected: FieldValue.increment(parseFloat(amountUsd))
      });

      // 3. Record Global Audit Log
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: `CHECKOUT-${gatewayId}`,
        category: "External Settlement",
        gateway: gatewayName,
        bankName: bankName,
        amountIdr: parseFloat(amountIdr),
        amountUsd: parseFloat(amountUsd),
        description: `Settlement for Invoice ${invoiceId} (${productName || 'Marketplace Item'}).`,
        status: "success",
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userEmail
      });
    });

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
