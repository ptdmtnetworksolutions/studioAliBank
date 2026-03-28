
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  Sparkles,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function PaymentCurrencyPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const filteredCurrencies = currencies.filter(c => 
    c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCurrency = (currency: Currency) => {
    localStorage.setItem("alibank-payment-currency", JSON.stringify(currency));
    router.back();
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-10 relative flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 px-6 pt-4 relative">
        <div className="space-y-1 mb-8">
          <h1 className="text-3xl font-black tracking-tight">Mata uang pembayaran</h1>
          <p className="text-sm font-medium text-slate-400">
            Mengatur mata uang fiat default untuk pembayaran fiat
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
          <Input 
            placeholder="Cari"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-slate-50 border-none rounded-xl text-base font-medium placeholder:text-slate-300 focus-visible:ring-1 focus-visible:ring-slate-200 shadow-none"
          />
        </div>

        {/* Currency List */}
        <div className="space-y-6 pr-8 pb-20">
          {filteredCurrencies.map((c) => (
            <div 
              key={c.code} 
              className="flex items-center gap-4 cursor-pointer group active:opacity-70 transition-opacity"
              onClick={() => handleSelectCurrency(c)}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0",
                c.color
              )}>
                {c.symbol.length > 2 ? c.code[0] : c.symbol}
              </div>
              <div className="space-y-0.5">
                <h3 className="text-lg font-black leading-none">{c.code}</h3>
                <p className="text-xs font-bold text-slate-400">{c.name}</p>
              </div>
            </div>
          ))}
          
          {filteredCurrencies.length === 0 && (
            <div className="py-20 text-center space-y-2">
              <p className="text-slate-400 font-bold">Mata uang tidak ditemukan</p>
              <p className="text-xs text-slate-300">Coba gunakan kata kunci lain</p>
            </div>
          )}
        </div>

        {/* Alphabet Index */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-40">
          {alphabet.map((letter) => (
            <button 
              key={letter} 
              className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors w-4 h-4 flex items-center justify-center"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Floating Help Icon */}
        <div className="fixed bottom-10 right-6 z-50">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-blue-500 border border-slate-50 active:scale-95 transition-transform cursor-pointer">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </main>
    </div>
  );
}
