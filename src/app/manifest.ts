import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AliBank',
    short_name: 'AliBank',
    description: 'Infrastruktur perbankan mandiri dan terminal aset digital global.',
    start_url: '/',
    id: 'com.alibank.v3.official',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
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
        name: 'Transfer Dana',
        short_name: 'Transfer',
        description: 'Kirim dana ke nasabah lain secara riil',
        url: '/transfer'
      },
      {
        name: 'Terminal Kripto',
        short_name: 'Kripto',
        description: 'Buka terminal perdagangan aset digital',
        url: '/crypto'
      }
    ],
    prefer_related_applications: false
  };
}