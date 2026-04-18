
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Server-side proxy untuk Infura Gas API.
 * Menangani kegagalan Firestore permission di level server secara anggun.
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const networkId = searchParams.get('networkId') || '1';

  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const db = getFirestore(app);
    
    let projectId = "30ba607f7b6845bca3a645b110a0db22"; // Jalur Prioritas Default
    let projectSecret = "";

    // Cobalah mengambil kunci dari Vault, jika gagal (karena no-auth di server) gunakan default
    try {
      const keySnap = await getDoc(doc(db, "system", "api_keys"));
      if (keySnap.exists()) {
        const config = keySnap.data();
        if (config.infuraProjectId) projectId = config.infuraProjectId;
        if (config.infuraProjectSecret) projectSecret = config.infuraProjectSecret;
      }
    } catch (fsError) {
      // Ini normal terjadi di server-side client SDK tanpa auth context
      console.warn('[Gas Proxy]: Firestore access restricted, using public node.');
    }

    const url = `https://gas.api.infura.io/v3/${projectId}/networks/${networkId}/suggestedGasFees`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'AliBank-V3-Engine/1.2-Live',
      'Cache-Control': 'no-cache, no-store'
    };

    if (projectSecret) {
      const auth = Buffer.from(`${projectId}:${projectSecret}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Node Gas Sedang Sibuk', 
        status: response.status 
      }, { 
        status: 200,
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error('[Gas Proxy Error]:', error.message);
    return NextResponse.json({ error: 'Hambatan koneksi node gas global.' }, { status: 200 });
  }
}
