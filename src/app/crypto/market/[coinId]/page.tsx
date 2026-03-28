
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  Bell, 
  Star, 
  Sparkles, 
  ChevronDown, 
  Maximize2, 
  ChevronRight, 
  Info,
  MoreHorizontal,
  LayoutGrid,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart
} from "recharts";

export default function MarketDetailPage() {
  const { coinId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Harga");
  const [subTab, setSubTab] = useState("Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const symbol = (coinId as string).toUpperCase();

  // Logika Data Koin Dinamis berdasarkan Diskusi Harga ALX (12.24 USDT)
  const coinInfo = useMemo(() => {
    if (symbol === "ALX") {
      return {
        price: "12.24",
        idr: "194.004,00",
        change: "+1.14%",
        high: "12.45",
        low: "11.98",
        volCoin: "1.85M",
        volUsdt: "22.6M",
        base: 12.24,
        isUp: true
      };
    }
    // Fallback untuk koin lain jika ada
    return {
      price: "12.24",
      idr: "194.004,00",
      change: "+1.14%",
      high: "12.45",
      low: "11.98",
      volCoin: "1.85M",
      volUsdt: "22.6M",
      base: 12.24,
      isUp: true
    };
  }, [symbol]);

  const mockData = useMemo(() => {
    const base = coinInfo.base;
    return Array.from({ length: 40 }, (_, i) => ({
      time: `${17 + Math.floor(i/4)}:${(i%4)*15}`,
      price: base + (Math.random() * (base * 0.02) - (base * 0.01)),
      volume: 100 + Math.random() * 500
    }));
  }, [coinInfo]);

  // Simulasi Data Order Book
  const orderBookData = useMemo(() => {
    const bids = Array.from({ length: 15 }, (_, i) => ({
      price: (12.24 - (i * 0.01)).toFixed(2),
      amount: (Math.random() * 50).toFixed(3),
      depth: Math.random() * 100
    }));
    const asks = Array.from({ length: 15 }, (_, i) => ({
      price: (12.25 + (i * 0.01)).toFixed(2),
      amount: (Math.random() * 50).toFixed(3),
      depth: Math.random() * 100
    }));
    return { bids, asks };
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
      {/* Header - Identical to Reference */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-1 cursor-pointer">
            <h1 className="text-lg font-black tracking-tight uppercase italic">{symbol}/USDT</h1>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <BrainCircuit className="w-5 h-5 text-primary" />
          <Star className="w-5 h-5 text-muted-foreground" />
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      {/* Secondary Tabs */}
      <div className="flex items-center gap-8 px-6 border-b border-border/50 overflow-x-auto no-scrollbar">
        {["Harga", "Info", "Data Perdagangan", "Trade-X"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-3 text-[13px] font-black transition-all relative shrink-0 italic uppercase whitespace-nowrap",
              activeTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
            )}
          >
            {tab}
            {tab === "Trade-X" && (
              <Badge className="absolute -top-1 -right-4 bg-primary text-primary-foreground text-[7px] font-black px-1 h-3 border-none uppercase">New</Badge>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Main Stats Section */}
        <section className="px-6 pt-6 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter italic">{coinInfo.price}</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-muted-foreground">Rp{coinInfo.idr}</p>
              <span className={cn("text-[10px] font-black", coinInfo.isUp ? "text-green-500" : "text-rose-500")}>
                {coinInfo.change}
              </span>
            </div>
            <div className="flex gap-2 pt-2">
              <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">Layer 1 / Layer 2</span>
              <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">Vol</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-muted-foreground text-right italic">
            <div>
              <p className="uppercase opacity-60">High 24 jam</p>
              <p className="text-foreground">{coinInfo.high}</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Vol 24 jam({symbol})</p>
              <p className="text-foreground">{coinInfo.volCoin}</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Low 24 jam</p>
              <p className="text-foreground">{coinInfo.low}</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Vol 24 jam(USDT)</p>
              <p className="text-foreground">{coinInfo.volUsdt}</p>
            </div>
          </div>
        </section>

        {/* Timeframes Bar */}
        <div className="px-6 pt-6 flex items-center justify-between border-b border-border/20">
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
            {["Waktu", "15m", "1j", "4j", "1H", "Lainnya", "Kedalaman"].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  "text-[11px] font-black italic transition-all shrink-0",
                  timeframe === t ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t} {t === "Lainnya" || t === "Kedalaman" ? <ChevronDown className="inline-block w-3 h-3 ml-0.5" /> : ""}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pb-2 text-muted-foreground">
            <LayoutGrid className="w-4 h-4" />
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-64 w-full relative pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
              <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Technical Indicators */}
        <div className="px-6 py-4 flex items-center gap-6 overflow-x-auto no-scrollbar border-y border-border/20">
          {["MA", "EMA", "BOLL", "SAR", "AVL", "SUPER", "VOL"].map((ind) => (
            <button key={ind} className={cn(
              "text-[10px] font-black italic transition-all",
              ind === "MA" || ind === "VOL" ? "text-foreground" : "text-muted-foreground/40"
            )}>
              {ind}
            </button>
          ))}
          <TrendingUp className="w-4 h-4 text-muted-foreground ml-auto" />
        </div>

        {/* Order Book Section */}
        <section className="mt-4 border-t border-border/50">
          <div className="flex gap-8 px-6 border-b border-border/20">
            {["Book", "Perdagangan", "Jaringan"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setSubTab(tab)}
                className={cn(
                  "py-3 text-[11px] font-black italic uppercase relative",
                  subTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Sentiment Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                <span className="text-green-500">30.72%</span>
                <span className="text-rose-500">69.28%</span>
              </div>
              <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-muted/30">
                <div className="bg-green-500/80 h-full" style={{ width: '30.72%' }} />
                <div className="bg-rose-500/80 h-full flex-1" />
              </div>
            </div>

            {/* Book Headers */}
            <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase italic tracking-widest pb-2">
              <div className="flex-1 flex justify-between pr-4">
                <span>Bid</span>
                <span className="text-right">Price</span>
              </div>
              <div className="flex-1 flex justify-between pl-4 border-l border-border/20">
                <span>Price</span>
                <span className="text-right">Ask</span>
              </div>
            </div>

            {/* Book Content - Side by Side Grid */}
            <div className="grid grid-cols-2 gap-0">
              {/* LEFT: Bids (Green) */}
              <div className="space-y-0.5 pr-2">
                {orderBookData.bids.map((bid, i) => (
                  <div key={i} className="flex justify-between items-center relative h-5 px-1 group cursor-default">
                    <div className="absolute right-0 top-0 bottom-0 bg-green-500/10 transition-all group-hover:bg-green-500/20" style={{ width: `${bid.depth}%` }} />
                    <span className="text-[10px] font-bold text-foreground relative z-10">{bid.amount}</span>
                    <span className="text-[10px] font-black text-green-500 relative z-10">{bid.price}</span>
                  </div>
                ))}
              </div>

              {/* RIGHT: Asks (Red) */}
              <div className="space-y-0.5 pl-2 border-l border-border/20">
                {orderBookData.asks.map((ask, i) => (
                  <div key={i} className="flex justify-between items-center relative h-5 px-1 group cursor-default">
                    <div className="absolute left-0 top-0 bottom-0 bg-rose-500/10 transition-all group-hover:bg-rose-500/20" style={{ width: `${ask.depth}%` }} />
                    <span className="text-[10px] font-black text-rose-500 relative z-10">{ask.price}</span>
                    <span className="text-[10px] font-bold text-foreground relative z-10">{ask.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Performance Grid */}
        <section className="px-6 py-8 space-y-6 border-t border-border/20">
          <div className="grid grid-cols-6 gap-2 text-[9px] font-black text-muted-foreground uppercase italic text-center">
            <div>Hari Ini</div>
            <div>7 Hari</div>
            <div>30 Hari</div>
            <div>90 Hari</div>
            <div>180 Hari</div>
            <div>1 Tahun</div>
          </div>
          <div className="grid grid-cols-6 gap-2 text-[10px] font-black italic text-center">
            <div className={cn(coinInfo.isUp ? "text-green-500" : "text-rose-500")}>{coinInfo.change}</div>
            <div className="text-rose-500">-4.50%</div>
            <div className="text-rose-500">-2.24%</div>
            <div className="text-rose-500">-27.24%</div>
            <div className="text-rose-500">-37.43%</div>
            <div className="text-rose-500">-3.71%</div>
          </div>
        </section>
      </main>

      {/* FIXED ACTION FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border px-4 py-4 flex items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex gap-6 px-2">
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-black uppercase italic">Lainnya</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-black uppercase italic">Hub</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-black uppercase italic">Margin</span>
          </div>
        </div>
        
        <div className="flex-1 flex gap-3">
          <Button 
            onClick={() => router.push(`/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Beli
          </Button>
          <Button 
            onClick={() => router.push(`/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Jual
          </Button>
        </div>
      </footer>
    </div>
  );
}
