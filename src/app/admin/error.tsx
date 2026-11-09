'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, RefreshCw, Home, Terminal } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Panel Error Caught]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-8 rounded-[2.5rem] border border-border shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0 shadow-lg">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tight">Admin Control Center</h2>
            <p className="text-xs text-muted-foreground font-bold">
              Kendala pada modul panel kontrol administrator.
            </p>
          </div>
        </div>

        {error?.message && (
          <div className="p-4 rounded-2xl bg-muted/50 border border-border text-left font-mono text-[11px] text-muted-foreground break-all space-y-1">
            <div className="flex items-center gap-1.5 text-primary font-bold uppercase text-[9px]">
              <Terminal className="w-3 h-3" /> Diagnostic Log
            </div>
            <p>{error.message}</p>
            {error.digest && <p className="opacity-60 text-[9px]">Digest: {error.digest}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
            Muat Ulang Admin
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
