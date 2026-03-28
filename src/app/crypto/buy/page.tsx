
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  History, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Delete,
  X,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";

export default function CryptoBuyPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'beli' | 'jual' | 'convert'>('beli');
  const [amount, setAmount] = useState("0");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);

  useEffect(() => {
    setMounted(true);
    const savedCurrency = localStorage.getItem("alibank-payment-currency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {}
    }
  }, []);

  if (!mounted) return null;

  const handleKeyPress = (num: string) => {
    if (amount === "0") {
      setAmount(num);
    } else {
      setAmount(amount + num);
    }
  };

  const handleDelete = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount("0");
    }
  };

  const handleComma = () => {
    if (!amount.includes(",")) {
      setAmount(amount + ",");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-10 relative flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <History className="w-6 h-6 text-slate-700" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-4 flex flex-col overflow-y-auto no-scrollbar">
        {/* Mode Selector */}
        <div className="bg-slate-100/60 p-1 rounded-full flex w-fit mb-12">
          {['Beli', 'Jual', 'Convert'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab.toLowerCase() === 'convert') {
                  router.push('/crypto/convert');
                } else {
                  setActiveTab(tab.toLowerCase() as any);
                }
              }}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-black transition-all",
                activeTab === tab.toLowerCase() ? "bg-black text-white shadow-lg" : "text-slate-400"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Amount Input Display */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-12">
          <div className="flex items-center gap-3">
            <span className="text-7xl font-black tracking-tight">{amount}</span>
            <div 
              className="flex items-center gap-1 cursor-pointer bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
              onClick={() => router.push('/settings/payment-currency')}
            >
              <span className="text-xl font-black uppercase tracking-tighter">{selectedCurrency.code}</span>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-bold">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="text-sm">0 USDT</span>
          </div>
        </div>

        {/* Transaction Details List */}
        <div className="space-y-6 mb-10">
          <div className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center p-2 shadow-sm">
                <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-black italic">Beli</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">USDT</span>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">3.79% APR</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>

          <div className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 overflow-hidden shadow-sm">
                <svg viewBox="0 0 24 24" className="w-full h-full">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-black italic">Metode pembayaran</p>
                <p className="text-xs font-bold text-slate-400">Google Pay</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Preset Amount Buttons */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <Button variant="outline" className="h-14 rounded-xl border-slate-100 font-bold text-sm bg-white hover:bg-slate-50 shadow-none uppercase">Min</Button>
          <Button variant="outline" className="h-14 rounded-xl border-slate-100 font-bold text-sm bg-white hover:bg-slate-50 shadow-none">200 {selectedCurrency.symbol.length > 2 ? "" : selectedCurrency.symbol}</Button>
          <Button variant="outline" className="h-14 rounded-xl border-slate-100 font-bold text-sm bg-white hover:bg-slate-50 shadow-none uppercase">Maks</Button>
        </div>

        {/* Numeric Keypad */}
        <div className="mt-auto grid grid-cols-3 gap-y-6 pb-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-bold active:bg-slate-100 py-4 rounded-full transition-colors">{n}</button>
          ))}
          <button onClick={handleComma} className="text-3xl font-bold active:bg-slate-100 py-4 rounded-full transition-colors">,</button>
          <button onClick={() => handleKeyPress("0")} className="text-3xl font-bold active:bg-slate-100 py-4 rounded-full transition-colors">0</button>
          <button onClick={handleDelete} className="flex items-center justify-center active:bg-slate-100 py-4 rounded-full transition-colors relative">
            <Delete className="w-8 h-8 text-slate-700" />
            {/* Sparkle Icon relative to Delete according to UI */}
            <div className="absolute -right-2 -top-2">
               <Sparkles className="w-5 h-5 text-blue-400 opacity-40" />
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
