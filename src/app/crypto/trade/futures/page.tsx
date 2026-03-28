
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ChevronDown, 
  Menu, 
  CandlestickChart, 
  MoreHorizontal, 
  ArrowRightLeft,
  ChevronUp,
  History,
  Info,
  Zap,
  ArrowUpDown,
  FileText,
  Smile,
  Gauge,
  CircleAlert,
  Delete,
  Globe,
  ArrowLeft,
  FileClock,
  Clock,
  ExternalLink,
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function FuturesPage() {
  const router = useRouter();
  const [activeTopTab, setActiveTopTab] = useState<'USDⓈ-M' | 'COIN-M' | 'Option' | 'Smart M'>('USDⓈ-M');
  const [tradeType, setTradeType] = useState<'beli' | 'jual'>('beli');
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body select-none transition-colors duration-300">
      {/* Top Header Tabs */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
          {['USDⓈ-M', 'COIN-M', 'Option', 'Smart M'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab as any)}
              className={cn(
                "text-base font-black transition-all relative shrink-0",
                activeTopTab === tab ? "text-foreground after:absolute after:-bottom-[15px] after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
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

      <main className="flex-1 px-4 pt-4 flex flex-col gap-4 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-32">
        {/* Market Info Bar */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-xl font-black tracking-tight uppercase">BTCUSDT</h1>
              <Badge variant="outline" className="bg-muted text-[8px] font-black h-4 px-1 border-none ml-1 uppercase">Perp</Badge>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-[11px] font-black text-rose-500 mt-0.5">-2.98%</span>
          </div>
          
          <div className="flex items-center gap-4">
            <CandlestickChart className="w-5 h-5 text-foreground" />
            <div className="relative">
               <MoreHorizontal className="w-5 h-5 text-foreground" />
               <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            </div>
          </div>
        </div>

        {/* Futures Controls Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button className="px-4 py-1.5 bg-muted rounded-md text-[11px] font-black uppercase text-foreground border border-border shadow-sm shrink-0">Cross</button>
            <button className="px-4 py-1.5 bg-muted rounded-md text-[11px] font-black uppercase text-foreground border border-border shadow-sm shrink-0">20x</button>
            <button className="px-3 py-1.5 bg-muted rounded-md text-[11px] font-black uppercase text-foreground border border-border shadow-sm shrink-0">S</button>
          </div>
          <div className="flex flex-col items-end shrink-0 pl-4 text-right">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter leading-tight">
              Pendanaan (8 jam) /<br />Hitungan mundur
            </p>
            <p className="text-[10px] font-black text-foreground italic">-0.00762%/07:55:01</p>
          </div>
        </div>

        {/* Main Trading Terminal Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT: Trading Controls */}
          <div className="col-span-7 space-y-4">
            <div className="bg-muted p-0.5 rounded-md flex relative h-10 overflow-hidden">
              <button onClick={() => setTradeType('beli')} className={cn("flex-1 z-10 text-xs font-black transition-all italic uppercase", tradeType === 'beli' ? "text-white" : "text-muted-foreground")}>Beli</button>
              <button onClick={() => setTradeType('jual')} className={cn("flex-1 z-10 text-xs font-black transition-all italic uppercase", tradeType === 'jual' ? "text-white" : "text-muted-foreground")}>Jual</button>
              <div className={cn("absolute top-0 bottom-0 w-1/2 transition-all duration-300", tradeType === 'beli' ? "left-0 bg-green-500" : "left-1/2 bg-rose-500")} style={{ clipPath: tradeType === 'beli' ? "polygon(0 0, 100% 0, 85% 100%, 0% 100%)" : "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }} />
            </div>

            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Tersedia</span>
              </div>
              <div className="flex items-center gap-1 text-foreground font-black text-[10px] italic">
                <span>0.00 USDT</span>
                <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-2.5 h-2.5 text-primary rotate-90" />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-md p-2 flex items-center justify-between border border-border h-10">
              <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs font-black italic">Limit Order</span></div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>

            <div className="flex items-center gap-1">
              <div className="flex-1 flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
                <button className="px-3 text-muted-foreground font-bold hover:text-foreground">-</button>
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none mt-1">Harga (USDT)</span>
                  <input className="w-full bg-transparent text-center text-xs font-black outline-none text-foreground mb-1" defaultValue="66413.1" />
                </div>
                <button className="px-3 text-muted-foreground font-bold hover:text-foreground">+</button>
              </div>
              <button className="bg-muted/50 border border-border rounded-md px-3 h-10 text-[10px] font-black uppercase text-foreground shadow-sm italic">BBO</button>
            </div>

            <div className="flex items-center bg-muted/50 rounded-md border border-border overflow-hidden h-10">
              <button className="px-3 text-muted-foreground/30 font-bold">-</button>
              <div className="w-full flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none mt-1">Jumlah</span>
                <input className="w-full bg-transparent text-center text-xs font-black outline-none placeholder:text-muted-foreground/30 text-foreground mb-1" placeholder="" />
              </div>
              <button className="px-3 text-muted-foreground/30 font-bold">+</button>
              <div className="flex items-center gap-1 pr-2 border-l border-border pl-2 cursor-pointer">
                <span className="text-[10px] font-black italic">BTC</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>

            {/* Slider Diamond */}
            <div className="py-2 flex items-center justify-between relative px-1 h-6">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-muted" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-sm border-2 border-primary bg-background rotate-45 z-20" />
              {[25, 50, 75, 100].map((p) => (
                <div key={p} className="relative z-10 w-1.5 h-1.5 rounded-full bg-muted border border-background" />
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="tpsl" className="border-muted-foreground/50 data-[state=checked]:bg-primary rounded-sm" />
                <label htmlFor="tpsl" className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">TP/SL</label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="reduce" className="border-muted-foreground/50 data-[state=checked]:bg-primary rounded-sm" />
                  <label htmlFor="reduce" className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Reduce Only</label>
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-[10px] font-black uppercase text-foreground italic">GTC</span>
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-1 text-[10px] font-bold text-muted-foreground pt-2">
              <div className="flex justify-between items-center opacity-60"><span>Maks</span><span className="text-foreground italic">0.000 BTC</span></div>
              <div className="flex justify-between items-center opacity-60"><span>Biaya</span><span className="text-foreground italic">0.00 USDT</span></div>
            </div>

            <Button className={cn("w-full h-12 text-foreground font-black italic rounded-md shadow-lg text-base border-none uppercase", tradeType === 'beli' ? "bg-green-500" : "bg-rose-500")}>
              {tradeType === 'beli' ? 'Beli/Long' : 'Jual/Short'}
            </Button>
          </div>

          {/* RIGHT: Order Book */}
          <div className="col-span-5 flex flex-col pt-1">
            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-tighter mb-2">
              <div className="flex flex-col"><span>Harga</span><span>(USDT)</span></div>
              <div className="flex flex-col text-right"><div className="flex items-center gap-1 justify-end"><span>Jumlah</span></div><span>(BTC)</span></div>
            </div>

            <div className="space-y-1 mb-3">
              {[
                { p: "66,516.7", a: "0.004" },
                { p: "66,516.5", a: "0.002" },
                { p: "66,516.4", a: "0.048" },
                { p: "66,516.3", a: "0.009" },
                { p: "66,516.2", a: "55.385" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-rose-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{ width: i === 4 ? '80%' : '15%' }} />
                </div>
              ))}
            </div>

            <div className="py-2 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-rose-500 italic tracking-tighter leading-none">66,516.1</span>
              <span className="text-[9px] font-bold text-muted-foreground mt-1 opacity-60">66,526.6</span>
            </div>

            <div className="space-y-1 mt-3">
              {[
                { p: "66,516.1", a: "127.935" },
                { p: "66,516.0", a: "0.996" },
                { p: "66,515.9", a: "0.003" },
                { p: "66,515.8", a: "1.660" },
                { p: "66,515.7", a: "0.804" },
              ].map((order, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-green-500 relative z-10">{order.p}</span>
                  <span className="text-foreground relative z-10">{order.a}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-green-500/10" style={{ width: i === 0 ? '90%' : '20%' }} />
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-1 px-1">
              <div className="flex justify-between text-[8px] font-bold text-muted-foreground">
                <span className="text-green-500">70.57%</span>
                <span className="text-rose-500">29.43%</span>
              </div>
              <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-muted/30">
                <div className="bg-green-500 h-full" style={{ width: '70%' }} />
                <div className="bg-rose-500 h-full flex-1" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-1">
              <div className="flex-1 bg-muted/50 rounded px-2 py-1 flex items-center justify-between border border-border cursor-pointer">
                <span className="text-[10px] font-black italic">0.1</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="bg-muted/50 p-1 rounded border border-border cursor-pointer">
                <LayoutGrid className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="mt-4 bg-[#1E2329] border border-blue-500/20 rounded-xl p-4 flex gap-3 animate-in slide-in-from-bottom-2">
          <CircleAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-medium text-white/80 leading-relaxed italic uppercase">
            Semua aset Anda telah ditransfer ke dompet Spot sejak akun Anda tidak aktif. Klik Aktifkan, maka Anda dapat mengaktifkan kembali akun Futures UM Anda kapan saja. <span className="text-primary font-black cursor-pointer hover:underline">Aktifkan</span>
          </p>
        </div>

        {/* Bottom Orders Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border">
            <div className="flex gap-6 pb-2">
              <button className="text-sm font-black italic relative text-foreground">Posisi (0)<div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary" /></button>
              <button className="text-sm font-black italic text-muted-foreground">Order Terbuka (0)</button>
              <button className="text-sm font-black italic text-muted-foreground">Bot</button>
            </div>
            <button className="p-1"><FileText className="w-5 h-5 text-foreground" /></button>
          </div>
          
          <div className="py-12 text-center flex flex-col items-center justify-center opacity-20">
             <div className="relative w-12 h-12 border-2 border-foreground rounded-full flex items-center justify-center mb-2">
                <div className="w-1 h-4 bg-foreground" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-1 bg-foreground" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest italic">Belum Ada Posisi</p>
          </div>
        </div>

        {/* Floating Diagram Handler */}
        <div className="bg-muted/30 border-t border-border px-4 py-3 flex items-center justify-between cursor-pointer rounded-t-xl mt-4">
          <span className="text-[11px] font-black italic tracking-tight text-foreground uppercase">BTCUSDT Perp Diagram</span>
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        </div>
      </main>
    </div>
  );
}
