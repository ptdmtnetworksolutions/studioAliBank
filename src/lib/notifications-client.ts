'use client';

import { proxyAddDoc, triggerFirestoreSync } from '@/lib/firestore-proxy-client';
import type { NotificationCategoryId } from '@/lib/notification-utils';

export interface ClientNotificationPayload {
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

/**
 * Mengirim notifikasi aktivitas nasabah melalui Firestore Proxy + Local Cache Fallback
 * agar selalu tercatat real-time meskipun koneksi client WebChannel diblokir atau kuota penuh.
 * Bersifat non-blocking terhadap alur transaksi utama.
 */
export async function sendClientNotification(
  userId: string,
  payload: ClientNotificationPayload
): Promise<boolean> {
  if (!userId || !payload?.title) return false;
  try {
    const nowIso = new Date().toISOString();
    await proxyAddDoc(`users/${userId}/notifications`, {
      ...payload,
      type: payload.type || 'info',
      category: payload.category || 'transaksi',
      read: false,
      createdAt: nowIso,
      timestamp: nowIso,
    });
    triggerFirestoreSync();
    return true;
  } catch (err) {
    console.warn('[ClientNotification] Non-blocking write warning:', err);
    return false;
  }
}

