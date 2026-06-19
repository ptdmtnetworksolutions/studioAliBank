import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

async function getIpaymuCredentials() {
  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    const snap = await adminDb.doc('system/api_keys').get();
    if (snap.exists) {
      const data = snap.data();
      return {
        ipaymuVa: data?.ipaymuVa || '',
        ipaymuApiKey: data?.ipaymuApiKey || '',
        ipaymuSandbox: data?.ipaymuSandbox ?? false
      };
    }
  } catch (e: any) {
    console.warn('[iPaymu Route] Admin SDK unavailable:', e?.code || e?.message?.slice(0, 80));
  }
  return { ipaymuVa: '', ipaymuApiKey: '', ipaymuSandbox: false };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      orderId, 
      amount, 
      customerName, 
      customerEmail,
      userId,
      cryptoAmount,
      cryptoCurrency,
      usdValue
    } = body;

    if (!orderId || !amount || !customerName || !userId || !cryptoAmount || !cryptoCurrency || !usdValue) {
      return NextResponse.json({ error: 'Parameter tidak lengkap.' }, { status: 400 });
    }

    const { ipaymuVa, ipaymuApiKey, ipaymuSandbox } = await getIpaymuCredentials();
    if (!ipaymuVa || !ipaymuApiKey) {
      return NextResponse.json(
        { error: 'Kredensial iPaymu belum dikonfigurasi di Admin panel.' },
        { status: 503 }
      );
    }

    const isProduction = !ipaymuSandbox;
    const ipaymuUrl = isProduction
      ? 'https://my.ipaymu.com/api/v2/payment'
      : 'https://sandbox.ipaymu.com/api/v2/payment';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://alix.tarroz.com';
    
    // Create iPaymu request body
    const ipaymuBody = {
      product: [`Beli ${cryptoAmount} ${cryptoCurrency}`],
      qty: ['1'],
      price: [amount.toString()],
      amount: amount.toString(),
      returnUrl: `${appUrl}/crypto/buy?status=success&referenceId=${orderId}`,
      cancelUrl: `${appUrl}/crypto/buy?status=cancel`,
      notifyUrl: `${appUrl}/api/payments/ipaymu-webhook`,
      referenceId: orderId,
      buyerName: customerName,
      buyerEmail: customerEmail || 'buyer@mail.com',
    };

    // Calculate Signature
    const bodyString = JSON.stringify(ipaymuBody);
    const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex');
    const stringToSign = `POST:${ipaymuVa}:${bodyHash}:${ipaymuApiKey}`;
    const signature = crypto.createHmac('sha256', ipaymuApiKey).update(stringToSign).digest('hex');
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').substring(0, 14);

    const response = await fetch(ipaymuUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'va': ipaymuVa,
        'signature': signature,
        'timestamp': timestamp
      },
      body: bodyString,
      cache: 'no-store'
    });

    const data = await response.json();
    const responseStatus = data.Status !== undefined ? data.Status : data.status;
    const responseMessage = data.Message !== undefined ? data.Message : data.message;

    if (!response.ok || responseStatus !== 200) {
      const errMsg = responseMessage || `iPaymu error (${response.status})`;
      console.error('[iPaymu Route] API error:', errMsg);
      return NextResponse.json({ error: errMsg }, { status: response.status === 200 ? 400 : response.status });
    }

    // Save pending transaction to Firestore
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);
    await db.collection('ipaymu_pending_transactions').doc(orderId).set({
      orderId,
      userId,
      userEmail: customerEmail || '',
      userName: customerName,
      amountIdr: parseFloat(amount),
      cryptoAmount: parseFloat(cryptoAmount),
      cryptoCurrency,
      usdValue: parseFloat(usdValue),
      status: 'pending',
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    });

    return NextResponse.json({
      redirectUrl: data.Data.Url
    });

  } catch (err: any) {
    console.error('[iPaymu Route Error]:', err?.message);
    return NextResponse.json(
      { error: err.message || 'Hambatan gateway iPaymu.' },
      { status: 500 }
    );
  }
}
