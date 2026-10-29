'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CryptoBuyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error('CryptoBuyPage Error Boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-md w-full p-8 rounded-[2rem] border border-border shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black italic uppercase tracking-tight">Terjadi Gangguan Sesi</h2>
          <p className="text-xs text-muted-foreground font-bold">
            Gagal memuat sistem kliring kripto. Silakan muat ulang atau kembali ke dashboard.
          </p>
          {error?.message && (
            <div className="p-3 bg-muted/50 rounded-xl text-[10px] font-mono text-muted-foreground break-all text-left">
              {error.message}
            </div>
          )}
        </div>
        <div className="space-y-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full h-12 gold-gradient text-white font-black italic uppercase rounded-xl flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Coba Muat Ulang
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full h-12 rounded-xl font-black italic uppercase flex items-center justify-center gap-2 border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </div>
      </Card>
    </div>
  );
}

