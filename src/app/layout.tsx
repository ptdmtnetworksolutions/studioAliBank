import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/LanguageContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'AliBank - Bintang Kejora Perbankan Riil',
  description: 'Ekosistem perbankan elit dengan integrasi aset kripto Mainnet dan manajemen kekayaan cerdas.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AliBank',
    startupImage: [
      {
        url: 'https://picsum.photos/seed/alibank-splash/1242/2688',
        media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* PWA Icons - Black Edition */}
        <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='100' height='100' rx='22' fill='black'/%3E%3Cpath d='M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z' fill='%23B8860B'/%3E%3C/svg%3E" />
        <link rel="apple-touch-icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='0' y='0' width='100' height='100' rx='22' fill='black'/%3E%3Cpath d='M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z' fill='%23B8860B'/%3E%3C/svg%3E" />
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
              <div className="min-h-screen relative flex flex-col">
                <div className="flex-1 pb-32">
                  {children}
                </div>
                <InstallPrompt />
                <BottomNav />
              </div>
              <Toaster />
            </FirebaseClientProvider>
          </LanguageProvider>
        </ThemeProvider>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('AliBank Production SW registered');
                }, function(err) {
                  console.log('AliBank SW failed');
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
