/**
 * Utilitas Terpusat Notifikasi AliBank V3.1
 * Menjamin parsing tanggal aman, kategorisasi akurat lintas modul,
 * tampilan status seragam, dan penautan aksi cepat.
 */

export type NotificationCategoryId = 'transaksi' | 'akun' | 'pengumuman' | 'marketing';

export interface NotificationBadgeInfo {
  label: string;
  className: string;
  normalizedType: 'success' | 'alert' | 'warning' | 'info';
}

export interface NotificationActionLink {
  href: string;
  label: string;
}

function toValidDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  if (typeof val === 'number' && isFinite(val) && val > 0) {
    const ms = val < 1e12 ? val * 1000 : val;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof val === 'object') {
    if (typeof val.toDate === 'function') {
      try {
        const d = val.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d;
      } catch {}
    }
    if (typeof val.iso === 'string') {
      const d = new Date(val.iso);
      if (!isNaN(d.getTime())) return d;
    }
    const secs = typeof val.seconds === 'number' ? val.seconds : val._seconds;
    if (typeof secs === 'number' && isFinite(secs)) {
      const d = new Date(secs * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/**
 * Mengambil Date objek secara aman dari berbagai kemungkinan field timestamp.
 */
export function parseNotificationDate(n: any): Date | null {
  if (!n) return null;
  return (
    toValidDate(n.createdAt) ||
    toValidDate(n.timestamp) ||
    toValidDate(n.date) ||
    toValidDate(n.updatedAt)
  );
}

/**
 * Mengembalikan nilai epoch milliseconds untuk pengurutan kronologis yang akurat.
 */
export function getNotificationTimeMs(n: any): number {
  const d = parseNotificationDate(n);
  return d ? d.getTime() : 0;
}

/**
 * Format tampilan waktu notifikasi yang ramah pengguna & aman dari "Invalid Date".
 */
export function formatNotificationTime(n: any): {
  shortTime: string;
  shortDate: string;
  fullDateTime: string;
  relative: string;
} {
  const d = parseNotificationDate(n);
  if (!d) {
    return {
      shortTime: 'Baru',
      shortDate: '-',
      fullDateTime: 'Waktu tercatat oleh sistem',
      relative: 'Baru saja',
    };
  }

  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  let relative = '';
  if (diffSec < 60 && diffSec >= -30) {
    relative = 'Baru saja';
  } else if (diffSec >= 60 && diffSec < 3600) {
    relative = `${Math.floor(diffSec / 60)} mnt lalu`;
  } else if (diffSec >= 3600 && diffSec < 86400) {
    relative = `${Math.floor(diffSec / 3600)} jam lalu`;
  } else {
    relative = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  }

  return {
    shortTime: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    shortDate: d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
    fullDateTime: `${d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}, ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
    relative,
  };
}

/**
 * Menentukan kategori notifikasi secara presisi (prioritas explicit `category`,
 * lalu fallback ke klasifikasi kata kunci judul & pesan).
 */
export function resolveNotificationCategory(n: any): NotificationCategoryId {
  const rawCat = String(n?.category || '').toLowerCase().trim();
  if (rawCat) {
    if (
      rawCat === 'transaksi' ||
      rawCat === 'transaction' ||
      rawCat === 'transfer' ||
      rawCat === 'payment' ||
      rawCat === 'trading' ||
      rawCat === 'crypto' ||
      rawCat === 'deposito' ||
      rawCat === 'tabungan'
    ) {
      return 'transaksi';
    }
    if (
      rawCat === 'akun' ||
      rawCat === 'account' ||
      rawCat === 'security' ||
      rawCat === 'keamanan' ||
      rawCat === 'kyc'
    ) {
      return 'akun';
    }
    if (
      rawCat === 'marketing' ||
      rawCat === 'promo' ||
      rawCat === 'reward' ||
      rawCat === 'hadiah' ||
      rawCat === 'game'
    ) {
      return 'marketing';
    }
    if (
      rawCat === 'pengumuman' ||
      rawCat === 'system' ||
      rawCat === 'announcement' ||
      rawCat === 'info'
    ) {
      return 'pengumuman';
    }
  }

  const title = String(n?.title || '').toLowerCase();
  const message = String(n?.message || '').toLowerCase();
  const combined = `${title} ${message}`;
  const type = String(n?.type || '').toLowerCase();

  // 1. Cek Transaksi & Transfer (prioritas utama agar transaksi dengan type 'info' tetap masuk Transaksi)
  if (
    combined.includes('top up') ||
    combined.includes('topup') ||
    combined.includes('transfer') ||
    combined.includes('dana masuk') ||
    combined.includes('dana keluar') ||
    combined.includes('bayar') ||
    combined.includes('pembayaran') ||
    combined.includes('pencairan') ||
    combined.includes('settlement') ||
    combined.includes('beli') ||
    combined.includes('pembelian') ||
    combined.includes('jual') ||
    combined.includes('penjualan') ||
    combined.includes('swap') ||
    combined.includes('convert') ||
    combined.includes('withdraw') ||
    combined.includes('penarikan') ||
    combined.includes('deposit') ||
    combined.includes('setoran') ||
    combined.includes('softpos') ||
    combined.includes('edc') ||
    combined.includes('midtrans') ||
    combined.includes('ipaymu') ||
    combined.includes('doku') ||
    combined.includes('tabungan') ||
    combined.includes('deposito') ||
    combined.includes('futures') ||
    combined.includes('pengiriman tunai') ||
    combined.includes('cash delivery') ||
    combined.includes('cicilan') ||
    combined.includes('kewajiban') ||
    combined.includes('refund') ||
    combined.includes('dikembalikan') ||
    Boolean(n?.txHash || n?.terminalId || n?.approvalCode)
  ) {
    return 'transaksi';
  }

  // 2. Cek Promo, Hadiah, Yield & Game
  if (
    combined.includes('reward') ||
    combined.includes('hadiah') ||
    combined.includes('promo') ||
    combined.includes('turnamen') ||
    combined.includes('kampanye') ||
    combined.includes('cashback') ||
    combined.includes('moba') ||
    combined.includes('spin') ||
    combined.includes('jackpot') ||
    combined.includes('trade-x') ||
    combined.includes('yield') ||
    combined.includes('klaim') ||
    combined.includes('kemenangan')
  ) {
    return 'marketing';
  }

  // 3. Cek Keamanan & Akun
  if (
    combined.includes('kyc') ||
    combined.includes('verifikasi identitas') ||
    combined.includes('akun') ||
    combined.includes('device') ||
    combined.includes('signature') ||
    combined.includes('password') ||
    combined.includes('sandi') ||
    combined.includes('profil') ||
    combined.includes('pembekuan') ||
    combined.includes('ditangguhkan') ||
    combined.includes('diaktifkan') ||
    combined.includes('keamanan') ||
    combined.includes('anomali') ||
    combined.includes('rekonsiliasi') ||
    type === 'alert' ||
    type === 'error'
  ) {
    return 'akun';
  }

  // 4. Default ke Pengumuman Sistem
  return 'pengumuman';
}

/**
 * Mengembalikan badge visual dan label konsisten untuk tipe notifikasi apa pun.
 */
export function getNotificationBadgeInfo(type?: string): NotificationBadgeInfo {
  const t = String(type || 'info').toLowerCase();
  if (t === 'success' || t === 'sukses' || t === 'berhasil') {
    return {
      label: 'Sukses',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      normalizedType: 'success',
    };
  }
  if (t === 'alert' || t === 'error' || t === 'danger') {
    return {
      label: t === 'error' ? 'Ditolak' : 'Peringatan',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      normalizedType: 'alert',
    };
  }
  if (t === 'warning' || t === 'warn') {
    return {
      label: 'Perhatian',
      className: 'bg-amber-50 text-amber-800 border-amber-200',
      normalizedType: 'warning',
    };
  }
  return {
    label: 'Info',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    normalizedType: 'info',
  };
}

/**
 * Menentukan tautan aksi cepat berdasarkan konteks notifikasi.
 */
export function getNotificationActionLink(n: any): NotificationActionLink | null {
  if (typeof n?.actionUrl === 'string' && n.actionUrl.startsWith('/')) {
    return {
      href: n.actionUrl,
      label: n.actionLabel || 'Lihat Detail',
    };
  }

  const combined = `${String(n?.title || '').toLowerCase()} ${String(n?.message || '').toLowerCase()}`;

  if (combined.includes('kyc')) {
    return { href: '/settings/kyc', label: 'Status KYC' };
  }
  if (combined.includes('tabungan')) {
    return { href: '/savings', label: 'Kelola Tabungan' };
  }
  if (combined.includes('deposito')) {
    return { href: '/deposits', label: 'Lihat Deposito' };
  }
  if (combined.includes('futures')) {
    return { href: '/crypto/trade/futures', label: 'Buka Futures' };
  }
  if (combined.includes('moba')) {
    return { href: '/games/moba', label: 'Buka Arena MOBA' };
  }
  if (combined.includes('spin')) {
    return { href: '/games/spin', label: 'Ali-Spin Wheel' };
  }
  if (
    combined.includes('kripto') ||
    combined.includes('alx') ||
    combined.includes('pol') ||
    combined.includes('btc') ||
    combined.includes('eth') ||
    combined.includes('usdt') ||
    combined.includes('swap') ||
    combined.includes('yield')
  ) {
    return { href: '/crypto', label: 'Buka Hub Kripto' };
  }
  if (
    combined.includes('transfer') ||
    combined.includes('penarikan') ||
    combined.includes('setoran') ||
    combined.includes('dana masuk') ||
    combined.includes('softpos') ||
    combined.includes('midtrans') ||
    combined.includes('ipaymu') ||
    combined.includes('doku')
  ) {
    return { href: '/transactions/history', label: 'Riwayat Mutasi' };
  }

  return null;
}

