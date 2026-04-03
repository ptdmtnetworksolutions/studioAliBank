
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
  BrainCircuit,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  BarChart3,
  Rocket,
  MessageSquare,
  FileText,
  Share2,
  Activity,
  Target,
  LineChart as LineChartIcon,
  Search,
  ShoppingBag,
  Flame,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  ComposedChart,
  Line
} from "recharts";
import { LogoIcon } from "@/components/ui/logo";

export default function MarketDetailPage() {
  const { coinId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Harga");
  const [subTab, setSubTab] = useState("Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [mounted, setMounted] = useState(false);

  const isAlix = (coinId as string).toLowerCase() === 'alx';
  const symbol = (coinId as string).toUpperCase();

  // LIVE STATES
  const [currentPrice, setCurrentPrice] = useState(isAlix ? 12.24 : 66240.00);
  const [priceChange, setPriceChange] = useState(isAlix ? 1.14 : -3.08);
  const [chartData, setChartData] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState<{bids: any[], asks: any[]}>({ bids: [], asks: [] });
  const [sentiment, setSentiment] = useState(isAlix ? 88.24 : 45.12);

  // INITIAL DATA GENERATION
  useEffect(() => {
    setMounted(true);
    
    // Generate initial chart data
    const initialData = Array.from({ length: 40 }, (_, i) => ({
      time: `${17 + Math.floor(i/4)}:${(i%4)*15}`,
      price: isAlix ? 12.24 + (Math.random() * 0.02 - 0.01) : currentPrice + (Math.random() * 500 - 250),
      volume: 100 + Math.random() * 500
    }));
    setChartData(initialData);

    // Generate initial order book
    const generateBook = () => ({
      bids: Array.from({ length: 12 }, (_, i) => ({
        price: (currentPrice - (i * (isAlix ? 0.01 : 10)) - Math.random() * 0.005).toFixed(2),
        amount: (Math.random() * 50 + 1).toFixed(3),
        depth: Math.random() * 100
      })),
      asks: Array.from({ length: 12 }, (_, i) => ({
        price: (currentPrice + (i * (isAlix ? 0.01 : 10)) + Math.random() * 0.005).toFixed(2),
        amount: (Math.random() * 50 + 1).toFixed(3),
        depth: Math.random() * 100
      }))
    });
    setOrderBook(generateBook());
  }, [isAlix, currentPrice]);

  // LIVE SIMULATION INTERVAL
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      // 1. Simulate Price Movement (ALX much more stable)
      const move = isAlix ? (Math.random() * 0.002 - 0.001) : (Math.random() * 20 - 10); 
      setCurrentPrice(prev => {
        const next = prev + move;
        if (isAlix) {
          if (next < 12.20) return 12.20;
          if (next > 12.28) return 12.28;
        }
        return next;
      });

      // 2. Update Chart
      setChartData(prev => {
        const newData = [...prev.slice(1), {
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          price: currentPrice + move,
          volume: Math.random() * 600
        }];
        return newData;
      });

      // 3. Update Order Book
      setOrderBook(prev => ({
        bids: prev.bids.map(b => ({ ...b, amount: (parseFloat(b.amount) + (Math.random() * 2 - 1)).toFixed(3), depth: Math.random() * 100 })),
        asks: prev.asks.map(a => ({ ...a, amount: (parseFloat(a.amount) + (Math.random() * 2 - 1)).toFixed(3), depth: Math.random() * 100 }))
      }));

      // 4. Update Sentiment
      setSentiment(prev => {
        const sMove = (Math.random() * 2 - 1);
        const nextS = prev + sMove;
        return nextS < 10 ? 10 : nextS > 95 ? 95 : nextS;
      });

    }, 3000);

    return () => clearInterval(interval);
  }, [mounted, currentPrice, isAlix]);

  if (!mounted) return null;

  const idrPrice = (currentPrice * 15850).toLocaleString('id-ID', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", isAlix ? "gold-gradient" : "bg-muted")}>
              {isAlix ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-full" />}
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase italic">{symbol}/USDT</h1>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAlix && <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] uppercase px-2 h-5">V3 OFFICIAL</Badge>}
          <Star className="w-5 h-5 text-muted-foreground" />
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

      {/* Secondary Tabs */}
      <div className="flex items-center gap-8 px-6 border-b border-border/50 overflow-x-auto no-scrollbar">
        {["Harga", "Info", "Utilitas", "Trade-X"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-3 text-[13px] font-black transition-all relative shrink-0 italic uppercase whitespace-nowrap",
              activeTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
            )}
          >
            {tab}
            {tab === "Utilitas" && isAlix && (
              <Badge className="ml-1 bg-green-500 text-white text-[7px] font-black px-1 h-3 border-none uppercase">Core</Badge>
            )}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {activeTab === "Harga" ? (
          <>
            {/* Main Stats Section */}
            <section className="px-6 pt-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h2 className={cn(
                  "text-4xl font-black tracking-tighter italic transition-colors duration-500",
                  priceChange >= 0 ? "text-green-500" : "text-rose-500"
                )}>
                  {currentPrice.toFixed(2)}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-muted-foreground">Rp{idrPrice}</p>
                  <span className={cn("text-[10px] font-black", priceChange >= 0 ? "text-green-500" : "text-rose-500")}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
                {isAlix && (
                  <div className="flex gap-2 pt-2">
                    <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">Utility-Driven</span>
                    <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">Listing Price</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-muted-foreground text-right italic">
                <div>
                  <p className="uppercase opacity-60">High 24 jam</p>
                  <p className="text-foreground">{isAlix ? '12.28' : '67,120.00'}</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Vol 24 jam({symbol})</p>
                  <p className="text-foreground">{isAlix ? '1.24M' : '125.4K'}</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Low 24 jam</p>
                  <p className="text-foreground">{isAlix ? '12.20' : '65,890.00'}</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Vol 24 jam(USDT)</p>
                  <p className="text-foreground">{isAlix ? '15.1M' : '8.24B'}</p>
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
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['dataMin - 0.05', 'dataMax + 0.05']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} isAnimationActive={false} />
                  <Bar dataKey="volume" fill="hsl(var(--muted))" opacity={0.2} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
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
                    <span className="text-green-500">{sentiment.toFixed(2)}% Bullish</span>
                    <span className="text-rose-500">{(100 - sentiment).toFixed(2)}% Bearish</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full flex overflow-hidden bg-muted/30">
                    <div className="bg-green-500/80 h-full transition-all duration-1000" style={{ width: `${sentiment}%` }} />
                    <div className="bg-rose-500/80 h-full flex-1" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    {orderBook.bids.slice(0, 8).map((bid, i) => (
                      <div key={i} className="flex justify-between items-center relative h-5 px-1">
                        <div className="absolute right-0 top-0 bottom-0 bg-green-500/10" style={{ width: `${bid.depth}%` }} />
                        <span className="text-[10px] font-bold text-foreground relative z-10">{bid.amount}</span>
                        <span className="text-[10px] font-black text-green-500 relative z-10">{bid.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {orderBook.asks.slice(0, 8).map((ask, i) => (
                      <div key={i} className="flex justify-between items-center relative h-5 px-1">
                        <div className="absolute left-0 top-0 bottom-0 bg-rose-500/10" style={{ width: `${ask.depth}%` }} />
                        <span className="text-[10px] font-black text-rose-500 relative z-10">{ask.price}</span>
                        <span className="text-[10px] font-bold text-foreground relative z-10">{ask.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : activeTab === "Info" ? (
          <div className="px-6 py-8 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <section className="space-y-4">
              <h3 className="text-xl font-black italic uppercase text-foreground">Tentang {symbol}</h3>
              <p className="text-xs font-medium text-muted-foreground leading-relaxed italic uppercase">
                {isAlix 
                  ? "Alix Coin (ALX) adalah aset kripto utilitas utama dalam ekosistem AliBank. Dirancang dengan mekanisme deflasi melalui buyback 20% revenue bursa, ALX memberikan nilai nyata bagi pemegangnya melalui diskon biaya, bagi hasil staking, dan tata kelola platform."
                  : `Informasi mendetail mengenai ${symbol} dapat ditemukan melalui portal data global.`
                }
              </p>
            </section>

            <section className="space-y-6">
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Utilitas Utama</h4>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { title: "Fee Discount", icon: Zap, desc: "Gunakan ALX untuk membayar biaya transaksi bursa dengan diskon eksklusif." },
                  { title: "Revenue Share", icon: Trophy, desc: "Stake ALX Anda untuk mendapatkan persentase dari kolam biaya harian platform." },
                  { title: "Project Listing", icon: Rocket, desc: "ALX digunakan sebagai mata uang wajib untuk biaya listing proyek baru di bursa." },
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-muted/30 border border-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-black uppercase italic text-[11px] text-foreground">{item.title}</h5>
                      <p className="text-[9px] text-muted-foreground font-bold mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Informasi Proyek</h4>
              <Card className="liquid-glass border-none rounded-2xl overflow-hidden shadow-sm">
                <div className="divide-y divide-border/10">
                  {[
                    { label: "Situs Web", value: "alibank.io", icon: Globe },
                    { label: "Tokenomics", value: "Deflationary V3", icon: Flame },
                    { label: "Price Support", icon: ShieldCheck, value: "20% Rev Buyback" },
                  ].map((link, i) => (
                    <div key={i} className="flex justify-between items-center p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <link.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{link.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary italic uppercase">{link.value}</span>
                        <Share2 className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </section>
          </div>
        ) : activeTab === "Utilitas" && isAlix ? (
          <div className="px-6 py-8 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <header className="space-y-2">
              <Badge className="gold-gradient text-white font-black uppercase text-[10px] px-4 py-1 rounded-full">Utility Token V3.0</Badge>
              <h3 className="text-3xl font-black italic uppercase text-foreground">Tokenomics ALX</h3>
              <p className="text-xs font-medium text-muted-foreground uppercase leading-relaxed italic">
                Strategi deflasi dan dukungan harga riil berbasis volume bursa.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6 liquid-glass border-none rounded-[2rem] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase italic text-sm">Buyback & Burn</h4>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1">20% dari seluruh biaya transaksi AliBank digunakan untuk membeli kembali ALX dan memusnahkannya.</p>
                </div>
              </Card>
              <Card className="p-6 liquid-glass border-none rounded-[2rem] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 shadow-inner">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black uppercase italic text-sm">Organic Demand</h4>
                  <p className="text-[10px] text-muted-foreground font-bold mt-1">Semakin tinggi volume bursa AliBank, semakin besar tekanan beli otomatis terhadap harga ALX.</p>
                </div>
              </Card>
            </div>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-primary" />
                <h4 className="text-xl font-black italic uppercase">Tier Membership Benefits</h4>
              </div>
              
              <div className="space-y-4">
                {[
                  { step: "Bronze", title: "Hold 100 ALX", status: "Basic", desc: "Potongan biaya transaksi 5% dan akses ke kampanye reward dasar.", icon: Lock },
                  { step: "Gold", title: "Hold 1,000 ALX", status: "Active", desc: "Potongan biaya 15%, prioritas staking yield, dan akses Trade-X Pro.", icon: Trophy },
                  { step: "Platinum", title: "Hold 10,000 ALX", status: "Premium", desc: "Zero fee trading, profit-sharing pool eksklusif, dan VIP Personal Assistant.", icon: Sparkles },
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-muted/30 border border-border flex items-start gap-5 relative overflow-hidden group">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                      item.status === 'Active' ? "gold-gradient text-white" : "bg-muted text-muted-foreground"
                    )}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">{item.step}</span>
                        <Badge className={cn(
                          "text-[7px] font-black uppercase border-none px-2 h-4",
                          item.status === 'Premium' ? "bg-primary text-black" : "bg-muted text-muted-foreground"
                        )}>{item.status}</Badge>
                      </div>
                      <h5 className="font-black uppercase italic text-sm">{item.title}</h5>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed italic">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : activeTab === "Trade-X" ? (
          <div className="px-6 py-8 space-y-10 animate-in fade-in zoom-in-95 duration-500">
            <header className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase text-foreground">Advanced Analytics</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Trade-X Terminal V3</p>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20 px-3 h-6 rounded-md font-black text-[8px] uppercase">Alpha Pulse</Badge>
            </header>

            <Card className="liquid-glass-dark border-none rounded-3xl p-8 space-y-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <BrainCircuit className="w-32 h-32 text-primary" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <Activity className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-black uppercase italic text-white text-sm">AI Strategy Pulse</h4>
                  <p className="text-[9px] text-white/50 font-bold uppercase">Sentiment Analysis Riil</p>
                </div>
              </div>
              <p className="text-xs font-medium italic text-white/80 leading-relaxed uppercase relative z-10">
                "Stabilitas ALX berada pada tingkat optimal (Confidence: 98%). Rekomendasi: Akumulasi bertahap selama fase Internal Accumulation untuk keuntungan maksimal saat Listing Global."
              </p>
              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase">Holding Score</p>
                  <p className="text-xl font-black text-green-500 italic">9.2/10</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <p className="text-[8px] font-bold text-white/40 uppercase">Whale Activity</p>
                  <p className="text-xl font-black text-primary italic">Stable</p>
                </div>
              </div>
            </Card>

            <section className="space-y-6">
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest px-1">Market Micro-Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Target className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase italic">Volatility</span>
                  </div>
                  <p className="text-lg font-black italic text-foreground tracking-tighter">0.02%</p>
                  <Badge className="bg-green-500/10 text-green-500 border-none text-[7px] font-black h-4 px-1.5 uppercase">Low Risk</Badge>
                </div>
                <div className="p-6 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <LineChartIcon className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-bold uppercase italic">Liquidity</span>
                  </div>
                  <p className="text-lg font-black italic text-foreground tracking-tighter">Rp1.24B</p>
                  <Badge className="bg-blue-500/10 text-blue-500 border-none text-[7px] font-black h-4 px-1.5 uppercase">Internal</Badge>
                </div>
              </div>
            </section>

            <Button 
              onClick={() => router.push(`/crypto/trade-pro/${coinId}`)}
              className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform"
            >
              Buka Terminal Trade-X Pro <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-sm">
            Data Sedang Dimuat...
          </div>
        )}
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
            onClick={() => router.push(isAlix ? '/crypto/convert' : `/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Beli
          </Button>
          <Button 
            onClick={() => router.push(isAlix ? '/crypto/convert' : `/crypto/trade/${coinId}`)}
            className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Jual
          </Button>
        </div>
      </footer>
    </div>
  );
}
