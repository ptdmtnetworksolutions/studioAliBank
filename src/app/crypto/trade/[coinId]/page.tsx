
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
  Info,
  PlusCircle,
  Zap,
  ArrowUpDown,
  FileText,
  Smile,
  Gauge,
  CircleAlert
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
  const [marginEnabled, setMarginEnabled] = useState(true);
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
                tab === 'Spot' ? "text-foreground after:absolute after:-bottom-[15px] after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
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

      <main className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {/* Market Info Bar */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-xl font-black tracking-tight uppercase">BTC/USDT</h1>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-black text-rose-500 mt-0.5">-3.08%</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground">Margin</span>
              <Switch 
                checked={marginEnabled} 
                onCheckedChange={setMarginEnabled}
                className="scale-75 data-[state=checked]:bg-primary" 
              />
            </div>
            <CandlestickChart className="w-5 h-5 text-foreground" />
            <div className="relative">
               <MoreHorizontal className="w-5 h-5 text-foreground" />
               <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </div>
          </div>
        </div>

        {/* Margin Controls Row (Only if Enabled) */}
        {marginEnabled && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <button className="px-3 py-1 bg-muted rounded text-[10px] font-black uppercase text-foreground border border-border shadow-sm">Cross</button>
              <button className="px-3 py-1 bg-muted rounded text-[10px] font-black uppercase text-foreground border border-border shadow-sm">3x</button>
              <button className="px-3 py-1 bg-muted rounded text-[10px] font-black uppercase text-foreground border border-border shadow-sm">Otom</button>
              <button className="px-3 py-1 bg-muted rounded text-[10px] font-black uppercase text-foreground border border-border shadow-sm">B/R</button>
            </div>
            <div className="flex flex-col items-end">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Level Margin</p>
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3 h-3 text-green-500" />
                <span className="text-xs font-black text-green-500 italic">999.00</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Trading Terminal Layout */}
        <div className="grid grid-cols-12 gap-4">
          
          {/* LEFT: Trading Controls */}
          <div className="col-span-7 space-y-4">
            {/* Buy/Sell Switcher - Trapezoid Style */}
            <div className="bg-muted p-0.5 rounded-md flex relative h-10 overflow-hidden">
              <button 
                onClick={() => setTradeType('beli')}
                className={cn(
                  "flex-1 z-10 text-xs font-black transition-all italic",
                  tradeType === 'beli' ? "text-white" : "text-muted-foreground"
                )}
              >
                Beli
              </button>
              <button 
                onClick={() => setTradeType('jual')}
                className={cn(
                  "flex-1 z-10 text-xs font-black transition-all italic",
                  tradeType === 'jual' ? "text-white" : "text-muted-foreground"
                )}
              >
                Jual
              </button>
              <div 
                className={cn(
                  "absolute top-0 bottom-0 w-1/2 transition-all duration-300",
                  tradeType === 'beli' ? "left-0 bg-green-500" : "left-1/2 bg-rose-500"
                )}
                style={{ 
                  clipPath: tradeType === 'beli' 
                    ? "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" 
                    : "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" 
                }}
              />
            </div>

            {/* Order Type Selector */}
            <div className="bg-muted/50 rounded-md p-2 flex items-center justify-between border border-border h-10">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-black">Limit Order</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            {/* Price Input Row */}
            <div className="flex items-center gap-1">
              <div className="flex-1 flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
                <button className="px-3 text-muted-foreground font-bold hover:text-foreground text-lg">-</button>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none mt-1">Limit (USDT)</span>
                  <input className="w-full bg-transparent text-center text-xs font-black outline-none text-foreground mb-1" defaultValue="66489.97" />
                </div>
                <button className="px-3 text-muted-foreground font-bold hover:text-foreground text-lg">+</button>
              </div>
              <button className="bg-muted/50 border border-border rounded-md px-3 h-10 text-[10px] font-black uppercase text-foreground shadow-sm">BBO</button>
            </div>

            {/* Amount Input Row */}
            <div className="flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
              <button className="px-3 text-muted-foreground/30 font-bold text-lg">-</button>
              <div className="w-full flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none mt-1">Jumlah (BTC)</span>
                <input className="w-full bg-transparent text-center text-xs font-black outline-none placeholder:text-muted-foreground/30 text-foreground mb-1" placeholder="" />
              </div>
              <button className="px-3 text-muted-foreground/30 font-bold text-lg">+</button>
            </div>

            {/* Percentage Slider (Diamond Style) */}
            <div className="py-2 flex items-center justify-between relative px-1 h-6">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-muted" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-sm border-2 border-muted-foreground/40 bg-background rotate-45 z-20" />
              {[25, 50, 75, 100].map((p) => (
                <div key={p} className="relative z-10 w-1.5 h-1.5 rounded-full bg-muted border border-background" />
              ))}
            </div>

            {/* Total Display */}
            <div className="bg-muted/30 rounded-md h-10 flex items-center justify-center border border-border/50">
              <span className="text-xs font-black text-muted-foreground italic uppercase">Total (USDT)</span>
            </div>

            {/* Options Checkboxes */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox id="tpsl" className="w-3.5 h-3.5 rounded border-muted-foreground" />
                <label htmlFor="tpsl" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">TP/SL</label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="iceberg" className="w-3.5 h-3.5 rounded border-muted-foreground" />
                <label htmlFor="iceberg" className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Iceberg</label>
              </div>
            </div>

            {/* Asset Info Section */}
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
              <div className="flex justify-between items-center opacity-60">
                <span>Maks</span>
                <span className="text-foreground">0 USDT</span>
              </div>
              <div className="flex justify-between items-center opacity-60">
                <span>{marginEnabled ? 'Pinjam' : 'Est. Biaya'}</span>
                <span className="text-foreground">-- USDT</span>
              </div>
            </div>

            {/* Primary Action Button */}
            <Button className={cn(
              "w-full h-12 text-foreground font-black italic rounded-md shadow-lg text-base border-none uppercase tracking-tight",
              tradeType === 'beli' ? "bg-green-500 hover:bg-green-600" : "bg-rose-500 hover:bg-rose-600"
            )}>
              {marginEnabled 
                ? (tradeType === 'beli' ? 'Margin Beli' : 'Margin Jual') 
                : (tradeType === 'beli' ? 'Beli BTC' : 'Jual BTC')}
            </Button>
          </div>

          {/* RIGHT: Order Book */}
          <div className="col-span-5 flex flex-col pt-1">
            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-2">
              <div className="flex flex-col">
                <span>Harga</span>
                <span>(USDT)</span>
              </div>
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1 justify-end">
                  <span>Jumlah</span>
                  <ArrowUpDown className="w-2 h-2" />
                </div>
                <span>(BTC)</span>
              </div>
            </div>

            {/* Sell Orders (Red) */}
            <div className="space-y-1 mb-3">
              {[
                { p: "66,477.54", a: "0.63287" },
                { p: "66,477.53", a: "0.65690" },
                { p: "66,477.52", a: "0.00016" },
                { p: "66,477.39", a: "0.05582" },
                { p: "66,477.30", a: "0.00008" },
                { p: "66,476.93", a: "0.00016" },
                { p: "66,476.92", a: "3.94654" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-rose-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{ width: i === 6 ? '80%' : '15%' }} />
                </div>
              ))}
            </div>

            {/* Current Price Display */}
            <div className="py-2 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-rose-500 italic tracking-tighter leading-none">66,476.91</span>
              <span className="text-[9px] font-bold text-muted-foreground mt-1 opacity-60">≈ Rp1,128,480,115.24</span>
            </div>

            {/* Buy Orders (Green) */}
            <div className="space-y-1 mt-3">
              {[
                { p: "66,476.91", a: "0.30496" },
                { p: "66,476.90", a: "0.07782" },
                { p: "66,476.36", a: "0.00016" },
                { p: "66,476.35", a: "0.13008" },
                { p: "66,476.02", a: "0.00092" },
                { p: "66,475.63", a: "0.00008" },
                { p: "66,475.62", a: "0.00575" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-green-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-green-500/10" style={{ width: i === 0 ? '90%' : '20%' }} />
                </div>
              ))}
            </div>

            {/* Ratio Bar */}
            <div className="mt-4 space-y-1 px-1">
              <div className="flex justify-between text-[8px] font-bold text-muted-foreground">
                <span className="text-green-500">8.91%</span>
                <span className="text-rose-500">91.09%</span>
              </div>
              <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-muted/30">
                <div className="bg-green-500 h-full" style={{ width: '9%' }} />
                <div className="bg-rose-500 h-full flex-1" />
              </div>
            </div>

            {/* Grid Settings */}
            <div className="mt-4 flex items-center justify-between bg-muted/30 rounded p-1">
              <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground px-1">
                <span>0.01</span>
                <ChevronDown className="w-3 h-3" />
              </div>
              <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Orders List */}
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border">
            <div className="flex gap-6 pb-2">
              <button className="text-sm font-black italic relative text-foreground">
                Order Terbuka (0)
                <div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary" />
              </button>
              <button className="text-sm font-black italic text-muted-foreground">Posisi (0)</button>
            </div>
            <button className="p-1 hover:bg-muted rounded">
              <FileText className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Empty History Message */}
          <div className="py-10 text-center flex flex-col items-center justify-center opacity-20">
             <div className="relative w-16 h-16 border-2 border-foreground rounded-full flex items-center justify-center mb-4">
                <div className="w-1 h-6 bg-foreground" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-1 bg-foreground" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest">No Active Positions</p>
          </div>
        </div>
      </main>

      {/* Floating Center Icon */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60]">
        <div className="w-12 h-12 bg-card rounded-full shadow-2xl border border-border flex items-center justify-center text-muted-foreground active:scale-95 transition-transform cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-foreground/5 opacity-0 group-hover:opacity-100" />
          <div className="relative">
            <div className="w-6 h-6 rounded-full border-2 border-muted-foreground flex items-center justify-center font-black text-[10px]">$</div>
            <div className="absolute -top-1 -right-1">
               <CircleAlert className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Robot Icon */}
      <div className="fixed bottom-20 right-4 z-[60]">
        <div className="w-10 h-10 bg-card rounded-xl shadow-lg border border-border flex items-center justify-center text-primary active:scale-95 transition-transform cursor-pointer relative">
          <Smile className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
        </div>
      </div>

      {/* Diagram Footer */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-background border-t border-border px-4 py-3 flex items-center justify-between cursor-pointer">
        <span className="text-xs font-black italic tracking-tight text-foreground uppercase">Diagram BTC/USDT</span>
        <ChevronUp className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}
