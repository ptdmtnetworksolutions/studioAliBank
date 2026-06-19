
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
  title: 'AliBank V3',
  description: 'Infrastruktur perbankan elit dengan integrasi aset kripto Mainnet.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'AliBank',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        
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
