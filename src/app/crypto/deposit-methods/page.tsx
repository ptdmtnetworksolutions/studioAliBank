
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  ChevronDown, 
  Building2, 
  CreditCard, 
  Check,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";

type Method = 'swift' | 'card' | 'gpay';

export default function DepositMethodsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeMethod, setActiveMethod] = useState<Method>('swift');
  const [transactionType, setTransactionType] = useState<'setor' | 'tarik'>('setor');
  const [currency, setCurrency] = useState('USD');

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
        <div className="bg-slate-50 p-1.5 rounded-full flex w-fit gap-1">
          <button 
            onClick={() => setTransactionType('setor')}
            className={cn(
              "px-8 py-2.5 rounded-full text-xs font-black transition-all",
              transactionType === 'setor' ? "bg-black text-white shadow-lg" : "text-slate-500"
            )}
          >
            Setor
          </button>
          <button 
            onClick={() => setTransactionType('tarik')}
            className={cn(
              "px-8 py-2.5 rounded-full text-xs font-black transition-all",
              transactionType === 'tarik' ? "bg-black text-white shadow-lg" : "text-slate-500"
            )}
          >
            Tarik
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight">Pilih Metode Penyetoran</h1>

        {/* Currency Selector */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {[
            { id: 'IDR', icon: 'https://picsum.photos/seed/idr/40/40', hint: 'idr' },
            { id: 'USD', icon: 'https://picsum.photos/seed/usd/40/40', hint: 'usd' },
            { id: 'EUR', icon: 'https://picsum.photos/seed/eur/40/40', hint: 'eur' },
          ].map((c) => (
            <button 
              key={c.id}
              onClick={() => setCurrency(c.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all shrink-0",
                currency === c.id ? "bg-slate-50 border-slate-200" : "bg-white border-transparent"
              )}
            >
              <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black italic">
                {c.id === 'USD' ? <span className="text-yellow-600">$</span> : c.id === 'EUR' ? <span className="text-blue-600">€</span> : <span className="text-rose-600">Rp</span>}
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

        {/* Recommended Section */}
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Direkomendasikan</p>
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
                <h3 className="text-sm font-black italic uppercase">Transfer Bank (SWIFT)</h3>
                <p className="text-[10px] font-bold text-slate-400">Didukung oleh BPay</p>
                <div className="flex gap-2 pt-2">
                  <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">Biaya 0</span>
                  <span className="bg-slate-50 text-[9px] font-black px-2.5 py-1 rounded-md">0-5 hari kerja</span>
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

        {/* Other Section */}
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Lainnya</p>
          
          {/* Card Method */}
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

          {/* GPay Method */}
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
      </main>

      {/* Footer Action */}
      <div className="p-6 bg-white sticky bottom-0 border-t border-slate-50">
        <Button className="w-full h-14 bg-[#FCD535] hover:bg-[#FCD535]/90 text-slate-900 font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all">
          Lanjutkan
        </Button>
      </div>
    </div>
  );
}
