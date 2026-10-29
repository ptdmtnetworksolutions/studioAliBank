import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const adminApp = getAdminApp();
    const db = getFirestore(adminApp);

    // 1. Verify User Session Token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await getAuth(adminApp).verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || 'user_moba@alibank.com';

    // 2. Read Request Body
    const body = await req.json();
    const { itemType, itemId, itemName, priceAlx } = body;

    if (!itemType || !itemId || typeof priceAlx !== 'number' || priceAlx < 0) {
      return NextResponse.json({ error: 'Data pembelian tidak valid.' }, { status: 400 });
    }

    // 3. Load User Profile and check ALX balance
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json({ error: 'Akun pengguna tidak ditemukan.' }, { status: 404 });
    }

    const userData = userSnap.data()!;
    const currentAlx = userData.cryptoBalances?.ALX ?? 0;

    if (currentAlx < priceAlx) {
      return NextResponse.json({
        error: `Saldo ALX Anda tidak mencukupi. Butuh ${priceAlx} ALX, saldo Anda ${currentAlx.toFixed(2)} ALX.`
      }, { status: 400 });
    }

    // 4. Check already owned
    const inventory = userData.moba_inventory || { heroes: ['ali_vanguard', 'alix_frost'], skins: [] };
    if (itemType === 'hero' && inventory.heroes?.includes(itemId)) {
      return NextResponse.json({ error: 'Anda sudah memiliki Hero ini.' }, { status: 400 });
    }
    if (itemType === 'skin' && inventory.skins?.includes(itemId)) {
      return NextResponse.json({ error: 'Anda sudah memiliki Skin ini.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const txId = `MOBA-SHOP-${Date.now()}`;

    // 5. Execute atomic transaction
    await db.runTransaction(async (transaction) => {
      // Deduct ALX
      transaction.update(userRef, {
        'cryptoBalances.ALX': FieldValue.increment(-priceAlx),
        [`moba_inventory.${itemType === 'hero' ? 'heroes' : 'skins'}`]: FieldValue.arrayUnion(itemId)
      });

      // User transaction record
      const userTxRef = userRef.collection('transactions').doc();
      transaction.set(userTxRef, {
        date: now,
        description: `Beli ${itemType === 'hero' ? 'Hero' : 'Skin'}: ${itemName}`,
        category: 'Game Shop',
        cryptoAmount: -priceAlx,
        cryptoCurrency: 'ALX',
        type: 'expense',
        status: 'success',
        transferId: txId,
        timestamp: FieldValue.serverTimestamp()
      });

      // Global audit
      const auditRef = db.collection('system').doc('audit').collection('global_transactions').doc();
      transaction.set(auditRef, {
        id: txId,
        category: 'Game Purchase',
        gateway: 'Ali-MOBA Shop',
        amountIdr: 0,
        cryptoAmount: priceAlx,
        cryptoCurrency: 'ALX',
        status: 'success',
        timestamp: FieldValue.serverTimestamp(),
        userEmail: userEmail,
        description: `User purchased ${itemType} ${itemName} (${itemId}) for ${priceAlx} ALX.`
      });
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil membeli ${itemName}!`,
      itemId,
      itemType
    });

  } catch (err: any) {
    console.error('[MOBA Shop Purchase Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses pembelian di Toko MOBA.' },
      { status: 500 }
    );
  }
}

