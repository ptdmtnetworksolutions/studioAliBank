
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  ChevronDown, 
  Menu, 
  CandlestickChart, 
  MoreHorizontal, 
  ArrowRightLeft,
  LayoutGrid,
  ChevronUp,
  History,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export default function SpotTradePage() {
  const { coinId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  
  const [tradeType, setTradeType] = useState<'beli' | 'jual'>('beli');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body select-none transition-colors duration-300">
      {/* Top Header Tabs */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['Beli/Jual', 'Spot', 'P2P', 'Alpha'].map((tab) => (
            <button
              key={tab}
              className={cn(
                "text-base font-black transition-all relative shrink-0",
                tab === 'Spot' ? "text-foreground after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-1 after:bg-primary" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="p-1">
          <Menu className="w-6 h-6 text-foreground" />
        </button>
      </header>

      <main className="flex-1 px-4 pt-4 flex flex-col gap-6">
        {/* Market Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-xl font-black tracking-tight uppercase">BTC/USDT</h1>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-black text-rose-500">-4.23%</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground">Margin</span>
              <Switch className="scale-75 data-[state=checked]:bg-primary" />
            </div>
            <CandlestickChart className="w-5 h-5 text-foreground" />
            <MoreHorizontal className="w-5 h-5 text-foreground" />
          </div>
        </div>

        {/* Main Trading Terminal Layout */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* LEFT: Trading Controls */}
          <div className="col-span-7 space-y-4">
            {/* Quick Settings */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['Cross', '3x', 'Otom', 'B/R'].map((btn) => (
                <button key={btn} className="px-3 py-1 rounded-md bg-muted text-[10px] font-black uppercase text-muted-foreground border border-transparent active:border-primary transition-all">
                  {btn}
                </button>
              ))}
            </div>

            {/* Buy/Sell Switcher */}
            <div className="bg-muted p-0.5 rounded-md flex">
              <button 
                onClick={() => setTradeType('beli')}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-md transition-all",
                  tradeType === 'beli' ? "bg-green-500 text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Beli
              </button>
              <button 
                onClick={() => setTradeType('jual')}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-md transition-all",
                  tradeType === 'jual' ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Jual
              </button>
            </div>

            {/* Order Type Selector */}
            <div className="relative group">
              <div className="bg-muted/50 rounded-md p-2 flex items-center justify-between border border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-foreground italic">i</span>
                  </div>
                  <span className="text-xs font-black">Limit Order</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            {/* Price & Amount Inputs */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="flex-1 flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
                  <button className="px-2 text-muted-foreground font-bold">-</button>
                  <input className="w-full bg-transparent text-center text-xs font-black outline-none text-foreground" defaultValue="66050.00" />
                  <button className="px-2 text-muted-foreground font-bold">+</button>
                </div>
                <button className="bg-muted/50 border border-border rounded-md px-3 h-10 text-[10px] font-black uppercase text-muted-foreground">BBO</button>
              </div>

              <div className="flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
                <button className="px-2 text-muted-foreground/30 font-bold">-</button>
                <input className="w-full bg-transparent text-center text-xs font-black outline-none placeholder:text-muted-foreground/30 text-foreground" placeholder="Jumlah (BTC)" />
                <button className="px-2 text-muted-foreground/30 font-bold">+</button>
              </div>
            </div>

            {/* Percentage Slider */}
            <div className="py-2 flex items-center justify-between relative px-1">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted" />
              {[0, 25, 50, 75, 100].map((p) => (
                <div key={p} className="relative z-10 w-2.5 h-2.5 rounded-sm border-2 border-muted bg-background rotate-45" />
              ))}
            </div>

            {/* Asset Info */}
            <div className="space-y-1 text-[10px] font-bold text-muted-foreground">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Tersedia</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
                <div className="flex items-center gap-1 text-foreground italic">
                  <span>0 USDT</span>
                  <ArrowRightLeft className="w-3 h-3 text-primary" />
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button className={cn(
              "w-full h-12 text-white font-black italic rounded-md shadow-none text-base border-none",
              tradeType === 'beli' ? "bg-green-500 hover:bg-green-600" : "bg-rose-500 hover:bg-rose-600"
            )}>
              {tradeType === 'beli' ? 'Margin Beli' : 'Margin Jual'}
            </Button>
          </div>

          {/* RIGHT: Order Book */}
          <div className="col-span-5 flex flex-col">
            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-2">
              <span>Harga</span>
              <span className="text-right">Jumlah</span>
            </div>

            {/* Sell Orders (Red) */}
            <div className="space-y-1 mb-3">
              {[
                { p: "66,051.23", a: "0.00008" },
                { p: "66,050.76", a: "0.14312" },
                { p: "66,050.75", a: "0.00008" },
                { p: "66,050.61", a: "0.00016" },
                { p: "66,050.03", a: "0.00008" },
                { p: "66,050.02", a: "0.00072" },
                { p: "66,050.01", a: "1.36155" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative">
                  <span className="text-rose-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{ width: i === 6 ? '80%' : '10%' }} />
                </div>
              ))}
            </div>

            {/* Current Price Display */}
            <div className="py-2 border-y border-border flex flex-col items-center justify-center">
              <span className="text-lg font-black text-rose-500 italic tracking-tighter leading-none">66,050.00</span>
              <span className="text-[9px] font-bold text-muted-foreground mt-1">≈ Rp1,121,836,793</span>
            </div>

            {/* Buy Orders (Green) */}
            <div className="space-y-1 mt-3">
              {[
                { p: "66,050.00", a: "1.78118" },
                { p: "66,049.99", a: "0.00040" },
                { p: "66,049.67", a: "0.00302" },
                { p: "66,048.28", a: "0.00016" },
                { p: "66,048.27", a: "0.01991" },
                { p: "66,048.15", a: "0.00384" },
                { p: "66,048.08", a: "0.00300" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative">
                  <span className="text-green-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-green-500/10" style={{ width: i === 0 ? '90%' : '15%' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Tabs & Icons */}
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between border-b border-border">
            <div className="flex gap-6 pb-2">
              <button className="text-sm font-black italic relative text-foreground">
                Order Terbuka (0)
                <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary" />
              </button>
              <button className="text-sm font-black italic text-muted-foreground">Posisi (0)</button>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <History className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <div className="w-12 h-12 rounded-full border-2 border-foreground flex items-center justify-center mb-2">
              <LogoIcon className="w-6 h-6 p-1 text-foreground" />
            </div>
            <p className="text-[10px] font-black text-muted-foreground italic">BELUM ADA ORDER</p>
          </div>
        </div>
      </main>

      {/* Floating Robot Icon */}
      <div className="fixed bottom-24 right-4 z-[60]">
        <div className="w-10 h-10 bg-card rounded-xl shadow-lg border border-border flex items-center justify-center text-primary active:scale-95 transition-transform cursor-pointer">
          <Smile className="w-6 h-6" />
        </div>
      </div>

      {/* Diagram Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-background border-t border-border px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-black italic tracking-tight text-foreground">Diagram BTC/USDT</span>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}
