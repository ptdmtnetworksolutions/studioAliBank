
import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AliBank V3 - Financial Infrastructure',
    short_name: 'AliBank',
    description: 'Infrastruktur perbankan mandiri dan terminal aset digital global dengan fitur Futures & P2P.',
    start_url: '/',
    id: 'com.alibank.v3.official',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#1E2329',
    theme_color: '#FCD535',
    icons: [
      {
        src: "/icon.svg",
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'maskable'
      },
      {
        src: "/icon.svg",
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    shortcuts: [
      {
        name: 'Futures Trading',
        short_name: 'Futures',
        description: 'Buka terminal derivatif leverage 125x',
        url: '/crypto/trade/futures'
      },
      {
        name: 'Transfer Dana',
        short_name: 'Transfer',
        description: 'Kirim dana ke nasabah lain secara riil',
        url: '/transfer'
      }
    ],
    prefer_related_applications: false
  };
}
