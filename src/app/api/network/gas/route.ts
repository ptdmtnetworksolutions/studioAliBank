
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Server-side proxy untuk Infura Gas API.
 * Menggunakan Project ID dan Secret dari Brankas secara aman.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkId = searchParams.get('networkId') || '1';

  try {
    // 1. Ambil Kredensial dari Firestore
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const keySnap = await getDoc(doc(db, "system", "api_keys"));
    
    if (!keySnap.exists()) {
      return NextResponse.json({ error: 'Konfigurasi Vault tidak ditemukan.' }, { status: 404 });
    }

    const config = keySnap.data();
    const projectId = config.infuraProjectId || "30ba607f7b6845bca3a645b110a0db22";
    const projectSecret = config.infuraProjectSecret;

    // 2. Bangun URL Infura Gas API V3
    const url = `https://gas.api.infura.io/v3/${projectId}/networks/${networkId}/suggestedGasFees`;

    // 3. Siapkan Header (Gunakan Basic Auth jika Secret tersedia)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (projectSecret) {
      const auth = Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      next: { revalidate: 10 } // Cache selama 10 detik sesuai waktu blok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Infura Gas Node Error [${response.status}]:`, errorText);
      return NextResponse.json({ error: 'Node Gas sedang sibuk.', status: response.status }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Gas Proxy Exception:', error.message);
    return NextResponse.json({ error: 'Gagal menghubungkan node gas global.' }, { status: 200 });
  }
}
