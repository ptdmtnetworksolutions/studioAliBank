import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getLocalDoc, setLocalDoc, addLocalCollectionDoc } from '@/lib/local-firestore-store';
import { dispatchUserNotification } from '@/lib/notifications-server';
import {
  extractRequestTokens,
  verifyFirebaseToken,
  attachAuthCookies,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({ projectId: 'darmedia-pos' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(req, body);

    if (!rawIdToken && !rawRefreshToken) {
      return NextResponse.json({ error: 'Akses ditolak. Token autentikasi diperlukan.' }, { status: 401 });
    }

    const caller = await verifyFirebaseToken(rawIdToken, rawRefreshToken);
    if (!caller) {
      return NextResponse.json({ error: 'Sesi kedaluwarsa atau tidak valid.' }, { status: 401 });
    }

    const userId = caller.uid;
    const userEmail = caller.email || 'user_moba@alibank.com';

    const { itemType, itemId, itemName, priceAlx } = body;

    if (!itemType || !itemId || typeof priceAlx !== 'number' || !Number.isFinite(priceAlx) || priceAlx < 1) {
      return NextResponse.json({ error: 'Data pembelian tidak valid (minimal harga 1 ALX).' }, { status: 400 });
    }

    const localUser = getLocalDoc(`users/${userId}`);
    let userData: Record<string, any> | null = localUser.exists ? localUser.data : null;

    if (!userData) {
      try {
        const db = getFirestore(getAdminApp());
        const snap = await db.collection('users').doc(userId).get();
        if (snap.exists) userData = { id: snap.id, ...snap.data() };
      } catch {}
    }

    if (!userData) {
      return NextResponse.json({ error: 'Akun pengguna tidak ditemukan.' }, { status: 404 });
    }

    const currentAlx = Number(userData.cryptoBalances?.ALX ?? 0);
    if (currentAlx < priceAlx) {
      return NextResponse.json({
        error: `Saldo ALX Anda tidak mencukupi. Butuh ${priceAlx} ALX, saldo Anda ${currentAlx.toFixed(2)} ALX.`,
      }, { status: 400 });
    }

    const inventory = userData.moba_inventory || { heroes: ['ali_vanguard', 'alix_frost'], skins: [] };
    if (itemType === 'hero' && inventory.heroes?.includes(itemId)) {
      return NextResponse.json({ error: 'Anda sudah memiliki Hero ini.' }, { status: 400 });
    }
    if (itemType === 'skin' && inventory.skins?.includes(itemId)) {
      return NextResponse.json({ error: 'Anda sudah memiliki Skin ini.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const txId = `MOBA-SHOP-${Date.now()}`;

    const nextCrypto = { ...(userData.cryptoBalances || {}) };
    nextCrypto.ALX = Math.max(0, Number((currentAlx - priceAlx).toFixed(8)));
    const nextInventory = {
      heroes: Array.isArray(inventory.heroes) ? [...inventory.heroes] : ['ali_vanguard', 'alix_frost'],
      skins: Array.isArray(inventory.skins) ? [...inventory.skins] : [],
    };
    if (itemType === 'hero') nextInventory.heroes.push(itemId);
    else nextInventory.skins.push(itemId);

    setLocalDoc(`users/${userId}`, {
      cryptoBalances: nextCrypto,
      moba_inventory: nextInventory,
    }, true);

    addLocalCollectionDoc(`users/${userId}/transactions`, {
      id: txId,
      date: now,
      description: `Beli ${itemType === 'hero' ? 'Hero' : 'Skin'}: ${itemName}`,
      category: 'Game Shop',
      amount: 0,
      cryptoAmount: Math.abs(priceAlx),
      cryptoCurrency: 'ALX',
      type: 'expense',
      status: 'success',
      transferId: txId,
      timestamp: now,
    });

    addLocalCollectionDoc('system/audit/global_transactions', {
      id: txId,
      category: 'Game Purchase',
      gateway: 'Ali-MOBA Shop',
      amountIdr: 0,
      cryptoAmount: Math.abs(priceAlx),
      cryptoCurrency: 'ALX',
      status: 'success',
      timestamp: now,
      userEmail,
      description: `User purchased ${itemType} ${itemName} (${itemId}) for ${priceAlx} ALX.`,
    });

    try {
      const db = getFirestore(getAdminApp());
      const userRef = db.collection('users').doc(userId);
      await db.runTransaction(async (transaction) => {
        transaction.update(userRef, {
          'cryptoBalances.ALX': FieldValue.increment(-priceAlx),
          [`moba_inventory.${itemType === 'hero' ? 'heroes' : 'skins'}`]: FieldValue.arrayUnion(itemId),
        });
        transaction.set(userRef.collection('transactions').doc(txId), {
          date: now,
          description: `Beli ${itemType === 'hero' ? 'Hero' : 'Skin'}: ${itemName}`,
          category: 'Game Shop',
          cryptoAmount: Math.abs(priceAlx),
          cryptoCurrency: 'ALX',
          type: 'expense',
          status: 'success',
          transferId: txId,
          timestamp: FieldValue.serverTimestamp(),
        });
      });
    } catch {}

    await dispatchUserNotification(userId, {
      title: `🛡️ Pembelian Item MOBA Berhasil`,
      message: `Anda berhasil membuka ${itemType === 'hero' ? 'Hero' : 'Skin'} "${itemName}" senilai ${priceAlx} ALX di AliBank Arena Shop.`,
      type: 'success',
      category: 'transaksi',
      cryptoAmount: Math.abs(priceAlx),
      cryptoCurrency: 'ALX',
      actionUrl: '/games/moba',
    });

    const res = NextResponse.json({
      success: true,
      message: `Berhasil membeli ${itemName}!`,
      itemId,
      itemType,
    });
    attachAuthCookies(res, caller.newIdToken, caller.newRefreshToken);
    return res;
  } catch (err: any) {
    console.error('[MOBA Shop Purchase Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Gagal memproses pembelian di Toko MOBA.' },
      { status: 500 }
    );
  }
}
