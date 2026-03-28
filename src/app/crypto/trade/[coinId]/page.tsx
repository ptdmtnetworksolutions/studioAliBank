
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  ChevronDown, 
  Menu, 
  CandlestickChart, 
  MoreHorizontal, 
  ArrowRightLeft,
  FileText,
  User,
  LayoutGrid,
  Check,
  ChevronUp,
  History,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
    <div className="min-h-screen bg-white text-slate-900 pb-20 flex flex-col font-body select-none">
      {/* Top Header Tabs */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white z-50">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['Beli/Jual', 'Spot', 'P2P', 'Alpha'].map((tab) => (
            <button
              key={tab}
              className={cn(
                "text-base font-black transition-all relative shrink-0",
                tab === 'Spot' ? "text-slate-900 after:absolute after:-bottom-4 after:left-0 after:right-0 after:h-1 after:bg-yellow-400" : "text-slate-400"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="p-1">
          <Menu className="w-6 h-6 text-slate-900" />
        </button>
      </header>

      <main className="flex-1 px-4 pt-4 flex flex-col gap-6">
        {/* Market Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-xl font-black tracking-tight uppercase">BTC/USDT</h1>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-[11px] font-black text-rose-500">-4.23%</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Margin</span>
              <Switch className="scale-75 data-[state=checked]:bg-yellow-400" />
            </div>
            <CandlestickChart className="w-5 h-5 text-slate-700" />
            <MoreHorizontal className="w-5 h-5 text-slate-700" />
          </div>
        </div>

        {/* Main Trading Terminal Layout */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* LEFT: Trading Controls */}
          <div className="col-span-7 space-y-4">
            {/* Quick Settings */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {['Cross', '3x', 'Otom', 'B/R'].map((btn) => (
                <button key={btn} className="px-3 py-1 rounded-md bg-slate-100 text-[10px] font-black uppercase text-slate-600 border border-transparent active:border-yellow-400 transition-all">
                  {btn}
                </button>
              ))}
            </div>

            {/* Buy/Sell Switcher */}
            <div className="bg-slate-100 p-0.5 rounded-md flex">
              <button 
                onClick={() => setTradeType('beli')}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-md transition-all",
                  tradeType === 'beli' ? "bg-green-500 text-white shadow-sm" : "text-slate-400"
                )}
              >
                Beli
              </button>
              <button 
                onClick={() => setTradeType('jual')}
                className={cn(
                  "flex-1 py-2 text-xs font-black rounded-md transition-all",
                  tradeType === 'jual' ? "bg-white text-slate-400" : "text-slate-400"
                )}
              >
                Jual
              </button>
            </div>

            {/* Order Type Selector */}
            <div className="relative group">
              <div className="bg-slate-50 rounded-md p-2 flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 bg-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-white italic">i</span>
                  </div>
                  <span className="text-xs font-black">Limit Order</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* Price & Amount Inputs */}
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <div className="flex-1 flex items-center bg-slate-50 rounded-md border border-slate-100 overflow-hidden h-10">
                  <button className="px-2 text-slate-400 font-bold">-</button>
                  <input className="w-full bg-transparent text-center text-xs font-black outline-none" defaultValue="66050.00" />
                  <button className="px-2 text-slate-400 font-bold">+</button>
                </div>
                <button className="bg-slate-50 border border-slate-100 rounded-md px-3 h-10 text-[10px] font-black uppercase text-slate-600">BBO</button>
              </div>

              <div className="flex items-center bg-slate-50 rounded-md border border-slate-100 overflow-hidden h-10">
                <button className="px-2 text-slate-200 font-bold">-</button>
                <input className="w-full bg-transparent text-center text-xs font-black outline-none placeholder:text-slate-300" placeholder="Jumlah (BTC)" />
                <button className="px-2 text-slate-200 font-bold">+</button>
              </div>
            </div>

            {/* Percentage Slider */}
            <div className="py-2 flex items-center justify-between relative px-1">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100" />
              {[0, 25, 50, 75, 100].map((p) => (
                <div key={p} className="relative z-10 w-2.5 h-2.5 rounded-sm border-2 border-slate-100 bg-white rotate-45" />
              ))}
            </div>

            {/* Total Input */}
            <div className="bg-slate-50 rounded-md border border-slate-100 h-10 flex items-center justify-center text-xs font-black text-slate-300 italic">
              Total (USDT)
            </div>

            {/* Checkboxes */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <Checkbox id="tp-sl" className="w-4 h-4 border-slate-200 rounded-sm" />
                <label htmlFor="tp-sl" className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">TP/SL</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="iceberg" className="w-4 h-4 border-slate-200 rounded-sm" />
                <label htmlFor="iceberg" className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Iceberg</label>
              </div>
            </div>

            {/* Asset Info */}
            <div className="space-y-1 text-[10px] font-bold text-slate-400">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 cursor-pointer">
                  <span>Tersedia</span>
                  <ChevronDown className="w-2.5 h-2.5" />
                </div>
                <div className="flex items-center gap-1 text-slate-900 italic">
                  <span>0 USDT</span>
                  <ArrowRightLeft className="w-3 h-3 text-yellow-500" />
                </div>
              </div>
              <div className="flex justify-between">
                <span>Maks</span>
                <span className="text-slate-900 italic">0 USDT</span>
              </div>
              <div className="flex justify-between">
                <span>Pinjam</span>
                <span className="text-slate-300 italic">-- USDT</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-black italic rounded-md shadow-none text-base">
              Margin Beli
            </Button>
          </div>

          {/* RIGHT: Order Book */}
          <div className="col-span-5 flex flex-col">
            <div className="flex justify-between text-[9px] font-black text-slate-300 uppercase tracking-tighter mb-2">
              <span>Harga (USDT)</span>
              <span className="text-right">Jumlah (BTC)</span>
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
                  <span className="text-slate-900 relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-rose-50 opacity-20" style={{ width: i === 6 ? '80%' : '10%' }} />
                </div>
              ))}
            </div>

            {/* Current Price Display */}
            <div className="py-2 border-y border-slate-50 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-rose-500 italic tracking-tighter leading-none">66,050.00</span>
              <span className="text-[9px] font-bold text-slate-400 mt-1">≈ Rp1,121,836,793.00</span>
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
                  <span className="text-slate-900 relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-green-50 opacity-20" style={{ width: i === 0 ? '90%' : '15%' }} />
                </div>
              ))}
            </div>

            {/* Ratio Bar */}
            <div className="flex h-1 gap-0.5 mt-4 rounded-full overflow-hidden">
              <div className="bg-green-500" style={{ width: '52.65%' }} />
              <div className="bg-rose-500" style={{ width: '47.35%' }} />
            </div>
            <div className="flex justify-between text-[8px] font-black mt-1">
              <span className="text-green-500">52.65%</span>
              <span className="text-rose-500">47.35%</span>
            </div>

            {/* Precision Selector */}
            <div className="mt-4 flex items-center justify-between gap-1">
              <div className="flex-1 bg-slate-50 rounded-md p-1.5 flex items-center justify-between border border-slate-100">
                <span className="text-[10px] font-black">0.01</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
              <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center border border-slate-100">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Tabs & Icons */}
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50">
            <div className="flex gap-6 pb-2">
              <button className="text-sm font-black italic relative">
                Order Terbuka (0)
                <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-yellow-400" />
              </button>
              <button className="text-sm font-black italic text-slate-400">Posisi (0)</button>
            </div>
            <button className="p-1 hover:bg-slate-100 rounded">
              <History className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-10 opacity-30">
            <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center mb-2">
              <LogoIcon className="w-6 h-6 p-1" />
            </div>
            <p className="text-[10px] font-black text-slate-400 italic">BELUM ADA ORDER</p>
          </div>
        </div>
      </main>

      {/* Floating Robot Icon */}
      <div className="fixed bottom-24 right-4 z-[60]">
        <div className="w-10 h-10 bg-white rounded-xl shadow-lg border border-slate-100 flex items-center justify-center text-blue-500 active:scale-95 transition-transform cursor-pointer">
          <Smile className="w-6 h-6" />
        </div>
      </div>

      {/* Diagram Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-black italic tracking-tight">Diagram BTC/USDT</span>
        <ChevronUp className="w-4 h-4 text-slate-400" />
      </div>
    </div>
  );
}
