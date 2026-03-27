import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AliBank V3 Production',
    short_name: 'AliBank',
    description: 'Infrastruktur perbankan mandiri dan terminal aset digital global.',
    start_url: '/',
    id: 'com.alibank.v3.production',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='100' height='100' fill='black'/%3E%3Cpath d='M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z' fill='%23B8860B'/%3E%3C/svg%3E",
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='100' height='100' fill='black'/%3E%3Cpath d='M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z' fill='%23B8860B'/%3E%3C/svg%3E",
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Transfer Dana',
        short_name: 'Transfer',
        description: 'Kirim dana ke nasabah lain secara riil',
        url: '/transfer',
        icons: [{ 
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8860B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'%3E%3C/line%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'%3E%3C/polygon%3E%3C/svg%3E", 
          sizes: '192x192' 
        }]
      },
      {
        name: 'Bayar QRIS',
        short_name: 'Scan',
        description: 'Pembayaran instan via QRIS Gateway',
        url: '/topup',
        icons: [{ 
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8860B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='3' width='7' height='7'%3E%3C/rect%3E%3Crect x='14' y='14' width='7' height='7'%3E%3C/rect%3E%3Crect x='3' y='14' width='7' height='7'%3E%3C/rect%3E%3C/svg%3E", 
          sizes: '192x192' 
        }]
      },
      {
        name: 'Terminal Kripto',
        short_name: 'Exchange',
        description: 'Buka terminal perdagangan aset digital',
        url: '/crypto',
        icons: [{ 
          src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23B8860B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'%3E%3C/path%3E%3C/svg%3E", 
          sizes: '192x192' 
        }]
      }
    ],
    prefer_related_applications: false
  };
}
