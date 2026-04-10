"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  ChevronRight 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";
import { LogoIcon } from "@/components/ui/logo";

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
    // Navigate back to home and tell it to re-open the bottom sheet
    router.push('/?open=add_funds');
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 relative flex flex-col font-body transition-colors duration-300">
      {/* Header */}
      <header className="px-4 h-16 flex items-center sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center pr-10">
          <h1 className="text-sm font-black uppercase tracking-widest italic">Konfigurasi Fiat</h1>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 relative">
        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-black tracking-tight italic uppercase">Mata Uang</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Atur preferensi mata uang fiat default untuk seluruh transaksi eksternal AliBank.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Mata Uang atau Negara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-muted/50 border-none rounded-xl text-xs font-bold placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none transition-all"
          />
        </div>

        {/* Currency List */}
        <div className="space-y-1 pr-8 pb-20">
          {filteredCurrencies.map((c) => (
            <div 
              key={c.code} 
              className="flex items-center justify-between p-4 rounded-2xl cursor-pointer group active:bg-muted/50 hover:bg-muted/30 transition-all"
              onClick={() => handleSelectCurrency(c)}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0 border-2 border-background",
                  c.color
                )}>
                  {c.symbol.length > 2 ? c.code[0] : c.symbol}
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-base font-black italic leading-none uppercase">{c.code}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase italic tracking-tight">{c.name}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
            </div>
          ))}
          
          {filteredCurrencies.length === 0 && (
            <div className="py-20 text-center space-y-4 opacity-30">
              <div className="w-16 h-16 bg-muted rounded-2xl mx-auto flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black uppercase italic">Data Tidak Ditemukan</p>
                <p className="text-[10px] font-bold uppercase tracking-widest">Coba kata kunci lain.</p>
              </div>
            </div>
          )}
        </div>

        {/* Alphabet Index */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-40 bg-muted/20 backdrop-blur-md py-4 rounded-full border border-border/50">
          {alphabet.map((letter) => (
            <button 
              key={letter} 
              className="text-[9px] font-black text-muted-foreground hover:text-primary transition-colors w-5 h-4 flex items-center justify-center italic"
            >
              {letter}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}