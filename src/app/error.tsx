'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 rounded-[2.5rem] border border-border shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black italic uppercase tracking-tight">Sistem AliBank</h2>
          <p className="text-xs text-muted-foreground font-bold">
            Terjadi kendala sementara pada modul tampilan. Silakan segarkan aplikasi.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              } else {
                reset();
              }
            }}
            className="w-full h-12 gold-gradient text-white font-black italic uppercase rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Muat Ulang Aplikasi
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            className="w-full h-12 rounded-xl font-black italic uppercase flex items-center justify-center gap-2 border-border"
          >
            <Home className="w-4 h-4" />
            Ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  );
}

