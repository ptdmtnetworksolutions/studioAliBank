import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { setLocalDoc } from '@/lib/local-firestore-store';
import type { NotificationCategoryId } from '@/lib/notification-utils';

const PROJECT_ID = firebaseConfig.projectId || 'darmedia-pos';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export interface ServerNotificationPayload {
  title: string;
  message: string;
  type?: 'success' | 'alert' | 'error' | 'warning' | 'info';
  category?: NotificationCategoryId;
  actionUrl?: string;
  actionLabel?: string;
  txHash?: string;
  amount?: number;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  terminalId?: string;
  merchantName?: string;
  approvalCode?: string;
  rrn?: string;
  bankName?: string;
  cardType?: string;
  maskedPan?: string;
  settlementDestination?: string;
}

function getAdminApp(): App | null {
  try {
    if (getApps().length > 0) return getApps()[0];
    return initializeApp({ projectId: PROJECT_ID });
  } catch {
    return null;
  }
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!isFinite(val)) return { integerValue: '0' };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

/**
 * Dispatcher Notifikasi Server Tunggal (Multi-Tier):
 * 1. Membuat ID dokumen tunggal yang konsisten (mencegah duplikasi).
 * 2. Menulis seketika ke Local Firestore Store (kebal 429/quota & offline).
 * 3. Mengirim ke Firestore Cloud via REST API (bila idToken ada) atau Admin SDK.
 */
export async function dispatchUserNotification(
  userId: string,
  payload: ServerNotificationPayload,
  options?: { idToken?: string; docId?: string }
): Promise<string | null> {
  if (!userId || !payload?.title) return null;

  const now = new Date();
  const nowIso = now.toISOString();
  const notifId =
    options?.docId ||
    `loc_notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const cleanPayload: Record<string, any> = {
    title: payload.title,
    message: payload.message,
    type: payload.type || 'info',
    category: payload.category || 'transaksi',
    read: false,
    createdAt: nowIso,
    timestamp: nowIso,
  };

  const optionalKeys: Array<keyof ServerNotificationPayload> = [
    'actionUrl',
    'actionLabel',
    'txHash',
    'amount',
    'cryptoAmount',
    'cryptoCurrency',
    'terminalId',
    'merchantName',
    'approvalCode',
    'rrn',
    'bankName',
    'cardType',
    'maskedPan',
    'settlementDestination',
  ];

  for (const key of optionalKeys) {
    if (payload[key] !== undefined && payload[key] !== null) {
      cleanPayload[key] = payload[key];
    }
  }

  // Tier 1: Simpan seketika di local-firestore-store dengan docId yang sama
  setLocalDoc(`users/${userId}/notifications/${notifId}`, cleanPayload, true);

  let syncedRemote = false;

  // Tier 2: Firestore REST API dengan token user (jika tersedia)
  if (options?.idToken) {
    try {
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries({ ...cleanPayload, timestamp: now })) {
        if (v !== undefined) fields[k] = toFirestoreValue(v);
      }
      const res = await fetch(
        `${FIRESTORE_BASE}/users/${userId}/notifications?documentId=${encodeURIComponent(notifId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${options.idToken}`,
          },
          body: JSON.stringify({ fields }),
          cache: 'no-store',
        }
      );
      if (res.ok) syncedRemote = true;
    } catch {}
  }

  // Tier 3: Admin SDK fallback (untuk webhook server-to-server atau jika REST API tidak dipanggil)
  if (!syncedRemote) {
    try {
      const adminApp = getAdminApp();
      if (adminApp) {
        const db = getFirestore(adminApp);
        await db
          .collection('users')
          .doc(userId)
          .collection('notifications')
          .doc(notifId)
          .set({
            ...cleanPayload,
            timestamp: FieldValue.serverTimestamp(),
          });
      }
    } catch {}
  }

  return notifId;
}

