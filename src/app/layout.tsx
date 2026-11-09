
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/LanguageContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { SecurityLockWrapper } from '@/components/layout/SecurityLockWrapper';
import { NotificationWatcher } from '@/components/layout/NotificationWatcher';
import Script from 'next/script';
import { Suspense } from 'react';

export const metadata: Metadata = {
  metadataBase: new URL('https://alibank.tarroz.com'),
  title: {
    default: 'AliBank V3 - Hybrid Neobank & Web3 Multi-Chain Financial Network',
    template: '%s | AliBank',
  },
  description:
    'Infrastruktur perbankan digital hibrida terdepan dengan cadangan 100% terverifikasi (Proof-of-Reserves), transfer P2P bebas biaya, dan integrasi multi-chain native (Polygon, Ethereum Vault, Bitcoin SegWit).',
  keywords: [
    'AliBank',
    'AliBank V3',
    'hybrid neobank',
    'digital banking indonesia',
    'proof of reserves',
    'web3 bank',
    'alix coin',
    'ALX',
    'polygon mainnet',
    'ethereum vault',
    'bitcoin native segwit',
    'trustwallet core',
    'zero fee p2p transfer',
    'merchant pos',
    'qris crypto banking'
  ],
  authors: [{ name: 'AliBank Financial Network' }],
  creator: 'AliBank',
  publisher: 'AliBank V3',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'AliBank V3 - Hybrid Neobank & Web3 Financial Network',
    description:
      'Perbankan digital hibrida berstandar dunia. 100% Bukti Cadangan Terbuka, transfer P2P instan bebas biaya, dan dompet multi-chain terdesentralisasi.',
    url: 'https://alibank.tarroz.com',
    siteName: 'AliBank',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AliBank V3 - Hybrid Neobank & Web3 Platform',
    description:
      'Institutional-grade hybrid digital banking. Verified 1:1 Proof-of-Reserves, TrustWallet Core multi-chain standard, and zero-fee instant P2P payments.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AliBank',
  },
  verification: {
    google: '8n-RD5m9NztlY5QqLtsJ6WjN2_8tUCRuweDzBS10qa0',
  },
};

export const viewport: Viewport = {
  themeColor: '#1E2329',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400;1,6..72,600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        
        {/* Google Search Console Verification */}
        <meta name="google-site-verification" content="8n-RD5m9NztlY5QqLtsJ6WjN2_8tUCRuweDzBS10qa0" />

        {/* Apple Standalone Optimization */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-body antialiased bg-background text-foreground transition-colors duration-300 overflow-x-hidden selection:bg-primary/30">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider>
            <FirebaseClientProvider>
              <SecurityLockWrapper>
                <div className="min-h-screen relative flex flex-col">
                  <div className="flex-1">
                    {children}
                  </div>
                  <InstallPrompt />
                  <Suspense fallback={null}>
                    <BottomNav />
                  </Suspense>
                </div>
                <Toaster />
                <NotificationWatcher />
              </SecurityLockWrapper>
            </FirebaseClientProvider>
          </LanguageProvider>
        </ThemeProvider>
        
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  console.log('AliBank WebAPK SW Registered:', reg.scope);
                }).catch(function(err) {
                  console.error('AliBank SW Registration Failed:', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
