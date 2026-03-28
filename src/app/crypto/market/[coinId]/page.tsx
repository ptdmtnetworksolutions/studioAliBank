
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
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
  TrendingUp
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

const mockData = Array.from({ length: 40 }, (_, i) => ({
  time: `${17 + Math.floor(i/4)}:${(i%4)*15}`,
  price: 610 + Math.random() * 2,
  volume: 100 + Math.random() * 500
}));

export default function MarketDetailPage() {
  const { coinId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Harga");
  const [timeframe, setTimeframe] = useState("15m");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const symbol = (coinId as string).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
      {/* Header */}
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
          <Sparkles className="w-5 h-5 text-primary" />
          <Star className="w-5 h-5 text-muted-foreground" />
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      {/* Secondary Tabs */}
      <div className="flex items-center gap-8 px-6 border-b border-border/50">
        {["Harga", "Info", "Data Perdagangan", "Trade-X"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-3 text-[13px] font-black transition-all relative shrink-0 italic uppercase",
              activeTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
            )}
          >
            {tab}
            {tab === "Trade-X" && (
              <Badge className="absolute -top-1 -right-4 bg-primary text-[7px] font-black px-1 h-3 border-none">New</Badge>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Main Stats */}
        <section className="px-6 pt-6 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tighter italic">611.57</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-muted-foreground">Rp10.382.336,45</p>
              <span className="text-[10px] font-black text-green-500">+0.37%</span>
            </div>
            <div className="flex gap-2 pt-2">
              <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary px-1.5 h-4">Lapisan 1 / Lapisan 2</Badge>
              <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary px-1.5 h-4">Vol</Badge>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-muted-foreground text-right italic">
            <div>
              <p className="uppercase opacity-60">High 24 jam</p>
              <p className="text-foreground">614.61</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Vol 24 jam({symbol})</p>
              <p className="text-foreground">100,485.79</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Low 24 jam</p>
              <p className="text-foreground">605.86</p>
            </div>
            <div>
              <p className="uppercase opacity-60">Vol 24 jam(USDT)</p>
              <p className="text-foreground">61.39M</p>
            </div>
          </div>
        </section>

        {/* Timeframes */}
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

        {/* Professional Chart */}
        <div className="h-80 w-full relative pt-4">
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
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
              <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.2} />
            </ComposedChart>
          </ResponsiveContainer>
          
          <div className="absolute top-4 left-6 pointer-events-none">
            <p className="text-[10px] font-black text-muted-foreground uppercase italic">MA60 611,63</p>
          </div>
        </div>

        {/* Technical Indicators Selection */}
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

        {/* Performance Stats Table */}
        <section className="px-6 py-8 space-y-6">
          <div className="grid grid-cols-6 gap-2 text-[9px] font-black text-muted-foreground uppercase italic text-center">
            <div>Hari Ini</div>
            <div>7 Hari</div>
            <div>30 Hari</div>
            <div>90 Hari</div>
            <div>180 Hari</div>
            <div>1 Tahun</div>
          </div>
          <div className="grid grid-cols-6 gap-2 text-[10px] font-black italic text-center">
            <div className="text-green-500">0.34%</div>
            <div className="text-rose-500">-4.50%</div>
            <div className="text-rose-500">-2.24%</div>
            <div className="text-rose-500">-27.24%</div>
            <div className="text-rose-500">-37.43%</div>
            <div className="text-rose-500">-3.71%</div>
          </div>
        </section>

        {/* Sub Navigation */}
        <div className="px-6 flex gap-8 border-b border-border/20">
          {["Book", "Perdagangan", "Jaringan"].map(tab => (
            <button key={tab} className={cn(
              "py-3 text-[11px] font-black italic uppercase",
              tab === "Book" ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"
            )}>{tab}</button>
          ))}
        </div>
      </main>

      {/* Action Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-4 py-4 flex items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex gap-6 px-2">
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-bold uppercase italic">Lainnya</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-bold uppercase italic">Hub</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-bold uppercase italic">Margin</span>
          </div>
        </div>
        
        <div className="flex-1 flex gap-3">
          <Button 
            onClick={() => router.push(`/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none"
          >
            Beli
          </Button>
          <Button 
            onClick={() => router.push(`/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none"
          >
            Jual
          </Button>
        </div>
      </footer>
    </div>
  );
}
