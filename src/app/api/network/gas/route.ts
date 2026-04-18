
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Server-side proxy untuk Infura Gas API.
 * Menjamin privasi Project Secret dan reliabilitas data GWEI.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkId = searchParams.get('networkId') || '1';

  try {
    // 1. Ambil Kredensial dari Firestore secara aman
    // Di App Hosting, initializeApp() tanpa argumen akan menggunakan service account default
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    const keySnap = await getDoc(doc(db, "system", "api_keys"));
    
    let projectId = "30ba607f7b6845bca3a645b110a0db22"; // Jalur Prioritas Default
    let projectSecret = "";

    if (keySnap.exists()) {
      const config = keySnap.data();
      if (config.infuraProjectId) projectId = config.infuraProjectId;
      if (config.infuraProjectSecret) projectSecret = config.infuraProjectSecret;
    }

    // 2. Bangun URL Infura Gas API V3
    const url = `https://gas.api.infura.io/v3/${projectId}/networks/${networkId}/suggestedGasFees`;

    // 3. Siapkan Header Keamanan
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'AliBank-V3-Engine/1.2'
    };

    if (projectSecret) {
      const auth = Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Node Gas Sedang Sibuk', 
        status: response.status 
      }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('Gas Proxy Exception:', error.message);
    return NextResponse.json({ error: 'Hambatan koneksi node gas global.' }, { status: 200 });
  }
}
