
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  ChevronDown, 
  Building2, 
  CreditCard, 
  Check,
  Search,
  Sparkles,
  ShieldCheck,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

function DepositMethodsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  
  // Ambil state awal dari URL jika ada (misal dari dashboard bursa)
  const initialType = searchParams.get('type') === 'tarik' ? 'tarik' : 'setor';
  
  const [activeMethod, setActiveMethod] = useState<string>('doku');
  const [transactionType, setTransactionType] = useState<'setor' | 'tarik'>(initialType);
  const [currency, setCurrency] = useState('IDR');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 relative flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-2 space-y-8">
        {/* Toggle Setor/Tarik */}
        <div className="bg-slate-50 p-1 rounded-full flex w-fit gap-1">
          <button 
            onClick={() => setTransactionType('setor')}
            className={cn(
              "px-8 py-2 rounded-full text-xs font-black transition-all",
              transactionType === 'setor' ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"
            )}
          >
            Setor
          </button>
          <button 
            onClick={() => setTransactionType('tarik')}
            className={cn(
              "px-8 py-2 rounded-full text-xs font-black transition-all",
              transactionType === 'tarik' ? "bg-black text-white shadow-lg" : "text-slate-400"
            )}
          >
            Tarik
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight">
          {transactionType === 'setor' ? 'Pilih Metode Penyetoran' : 'Pilih Metode Penarikan'}
        </h1>

        {/* Currency Selector */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'IDR', icon: 'https://picsum.photos/seed/idr/40/40' },
            { id: 'USD', icon: 'https://picsum.photos/seed/usd/40/40' },
            { id: 'EUR', icon: 'https://picsum.photos/seed/eur/40/40' },
          ].map((c) => (
            <button 
              key={c.id}
              onClick={() => setCurrency(c.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0",
                currency === c.id ? "bg-slate-50 border-slate-200" : "bg-white border-transparent"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black italic overflow-hidden">
                {c.id === 'USD' ? <span className="text-yellow-600">$</span> : c.id === 'EUR' ? <span className="text-blue-600">€</span> : <span className="text-rose-600 text-[8px]">Rp</span>}
              </div>
              <span className={cn("text-xs font-black italic", currency === c.id ? "text-slate-900" : "text-slate-400")}>
                {c.id}
              </span>
            </button>
          ))}
          <button className="flex items-center gap-1 text-xs font-bold text-slate-400 shrink-0">
            Lainnya <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Section based on type */}
        <div className="space-y-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {transactionType === 'setor' ? 'Direkomendasikan (DOKU Full Aktif)' : 'Metode Penerimaan'}
          </p>

          {transactionType === 'setor' && (
            <>
              <div 
                onClick={() => setActiveMethod('doku')}
                className={cn(
                  "p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
                  activeMethod === 'doku' ? "border-black bg-emerald-50/40" : "border-slate-100 bg-white"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black italic uppercase">DOKU Checkout (VA 14 Bank, e-Wallet & Retail)</h3>
                    <p className="text-[10px] font-bold text-slate-500">Didukung oleh DOKU PJP Kategori 1 • PT. DMT Network Solutions</p>
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <span className="bg-emerald-500/10 text-emerald-700 text-[9px] font-black px-2.5 py-1 rounded-md">Instan Real-Time</span>
                      <span className="bg-slate-100 text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-md">BRI, BNI, BSI, Alfamart, Indomaret</span>
                    </div>
                  </div>
                </div>
                {activeMethod === 'doku' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>

              <div 
                onClick={() => setActiveMethod('nfc')}
                className={cn(
                  "p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
                  activeMethod === 'nfc' ? "border-black bg-white" : "border-slate-100 bg-white"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Wifi className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black italic uppercase">Terminal EDC SoftPOS (NFC Tap-on-Phone)</h3>
                    <p className="text-[10px] font-bold text-slate-500">Didukung oleh DOKU + Nobu / Asterlink GPN Switch</p>
                    <div className="flex gap-2 pt-2">
                      <span className="bg-slate-100 text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-md">Tap Kartu Debit/Kredit</span>
                      <span className="bg-slate-100 text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-md">Settlement Instan</span>
                    </div>
                  </div>
                </div>
                {activeMethod === 'nfc' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          <div 
            onClick={() => setActiveMethod('swift')}
            className={cn(
              "p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
              activeMethod === 'swift' ? "border-black bg-white" : "border-slate-100 bg-white"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-slate-900" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black italic uppercase">Transfer Bank (Manual / SWIFT)</h3>
                <p className="text-[10px] font-bold text-slate-400">Kliring Rekening Kustodian AliBank</p>
                <div className="flex gap-2 pt-2">
                  <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">
                    {transactionType === 'setor' ? 'Verifikasi Kode Unik' : '0-3 hari kerja'}
                  </span>
                  <span className="bg-slate-50 text-slate-900 text-[9px] font-black px-2.5 py-1 rounded-md">
                    {transactionType === 'setor' ? 'Biaya 0' : 'Biaya 25 USD'}
                  </span>
                </div>
              </div>
            </div>
            {activeMethod === 'swift' && (
              <div className="absolute top-4 right-4">
                <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other Section only for Setor */}
        {transactionType === 'setor' && (
          <div className="space-y-4 pt-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Lainnya</p>
            
            <div 
              onClick={() => setActiveMethod('card')}
              className={cn(
                "p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
                activeMethod === 'card' ? "border-black bg-white" : "border-slate-100 bg-white"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-slate-900" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black italic uppercase">Kartu (VISA/Mastercard)</h3>
                  <p className="text-[10px] font-bold text-slate-400">Didukung oleh BPay</p>
                  <div className="flex gap-2 pt-2">
                    <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">Biaya 3,3%</span>
                    <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">Real time</span>
                  </div>
                </div>
              </div>
              {activeMethod === 'card' && (
                <div className="absolute top-4 right-4">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>

            <div 
              onClick={() => setActiveMethod('gpay')}
              className={cn(
                "p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer relative overflow-hidden",
                activeMethod === 'gpay' ? "border-black bg-white" : "border-slate-100 bg-white"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 p-2">
                  <svg viewBox="0 0 24 24" className="w-full h-full">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black italic uppercase">Google Pay</h3>
                  <p className="text-[10px] font-bold text-slate-400">Didukung oleh BPay</p>
                  <div className="flex gap-2 pt-2">
                    <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">Biaya 3,3%</span>
                    <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">Real time</span>
                  </div>
                </div>
              </div>
              {activeMethod === 'gpay' && (
                <div className="absolute top-4 right-4">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Help Icon */}
        <div className="fixed bottom-28 right-6 z-40">
          <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-500 border border-slate-50 active:scale-95 transition-transform cursor-pointer">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </main>

      {/* Footer Action */}
      <div className="p-6 bg-white sticky bottom-0 border-t border-slate-50">
        <Button
          onClick={() => {
            if (transactionType === 'tarik') {
              router.push('/crypto/buy?tab=jual');
              return;
            }
            const methodMap: Record<string, string> = {
              doku: 'doku',
              nfc: 'nfc',
              card: 'card',
              gpay: 'doku_qris',
              swift: 'bank',
            };
            const mapped = methodMap[activeMethod] || 'doku';
            router.push(`/crypto/buy?tab=beli&method=${encodeURIComponent(mapped)}`);
          }}
          className="w-full h-14 bg-[#FCD535] hover:bg-[#FCD535]/90 text-slate-900 font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all"
        >
          Lanjutkan
        </Button>
      </div>
    </div>
  );
}

export default function DepositMethodsPage() {
  return (
    <Suspense fallback={null}>
      <DepositMethodsContent />
    </Suspense>
  );
}
