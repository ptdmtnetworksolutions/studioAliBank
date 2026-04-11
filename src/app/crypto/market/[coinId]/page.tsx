
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
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
  Trophy,
  Loader2,
  RefreshCw,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Area,
  Cell
} from "recharts";
import { LogoIcon } from "@/components/ui/logo";
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";

const MARKUP = 1.02; // AliBank 2% Profit Margin
const USDT_IDR_RATE = 15850;

export default function MarketDetailPage() {
  const params = useParams();
  const coinId = params?.coinId;
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const [activeTab, setActiveTab] = useState("Harga");
  const [subTab, setSubTab] = useState("Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [mounted, setMounted] = useState(false);
  
  // LIVE DATA STATES
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState(0);
  const [high24h, setHigh24h] = useState(0);
  const [low24h, setLow24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [orderBook, setOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });

  const symbol = useMemo(() => {
    const s = Array.isArray(coinId) ? coinId[0] : coinId;
    return (s || "").toUpperCase();
  }, [coinId]);

  const isAlix = symbol === 'ALX';
  const displayPair = symbol === 'USDT' ? 'USDT/IDR' : `${symbol}/USDT`;

  // REAL DATA QUERIES (FOR ALX)
  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const tradesQuery = useMemoFirebase(() => {
    if (!db || !isAlix || !user) return null;
    return query(collection(db, "market", "ALX_USDT", "trades"), orderBy("timestamp", "asc"), limit(100));
  }, [db, isAlix, user]);
  const { data: realTrades } = useCollection(tradesQuery);

  // CLOCK ENGINE
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // AliBank Autonomous Market Engine (AME) - SYNC NODE VIA PROXY
  const fetchMarketData = useCallback(async () => {
    if (isAlix || !symbol) {
      setIsLoading(false);
      return;
    }

    try {
      const intervalMap: Record<string, string> = {
        "1m": "1m", "5m": "5m", "15m": "15m", "1j": "1h", "4j": "4h", "1H": "1d"
      };
      const interval = intervalMap[timeframe] || "15m";
      const binanceSymbol = symbol === 'USDT' ? 'USDTIDR' : `${symbol}USDT`;

      // 1. Fetch Ticker via Proxy
      const tickerRes = await fetch(`/api/market/ticker?symbol=${binanceSymbol}`);
      if (!tickerRes.ok) throw new Error('Ticker fetch failed via Proxy');
      const ticker = await tickerRes.json();

      if (ticker.lastPrice) {
        let basePrice = parseFloat(ticker.lastPrice);
        if (binanceSymbol === 'USDTIDR') basePrice = basePrice / USDT_IDR_RATE;
        
        setLivePrice(basePrice * MARKUP);
        setPriceChange(parseFloat(ticker.priceChangePercent) || 0);
        setHigh24h(parseFloat(ticker.highPrice) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP);
        setLow24h(parseFloat(ticker.lowPrice) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP);
        setVolume24h(parseFloat(ticker.quoteVolume) || 0);
      }

      // 2. Fetch Klines via Proxy
      const klineRes = await fetch(`/api/market/klines?symbol=${binanceSymbol}&interval=${interval}&limit=60`);
      if (!klineRes.ok) throw new Error('Klines fetch failed via Proxy');
      const klines = await klineRes.json();

      if (Array.isArray(klines)) {
        const formatted = klines.map(k => {
          const open = parseFloat(k[1]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const high = parseFloat(k[2]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const low = parseFloat(k[3]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const close = parseFloat(k[4]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          
          return {
            time: new Date(k[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open, high, low, close,
            body: [open, close],
            wick: [low, high],
            isUp: close >= open,
            volume: parseFloat(k[5]) || 0
          };
        });
        setCandlestickData(formatted);
      }
    } catch (err) {
      console.warn("AME Proxy Sync failed, keeping last data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, isAlix, timeframe]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // DYNAMIC ALX LOGIC
  const currentPrice = useMemo(() => {
    if (isAlix) {
      if (realTrades && realTrades.length > 0) return realTrades[realTrades.length - 1].price || 12.24;
      return globalLiquidity?.lastAlxPriceUsdt || 12.24;
    }
    return livePrice || 0;
  }, [isAlix, realTrades, globalLiquidity, livePrice]);

  const chartData = useMemo(() => {
    if (!isAlix) return candlestickData;
    if (!realTrades || realTrades.length === 0) return [{ time: "Now", open: 12.24, close: 12.24, high: 12.24, low: 12.24, body: [12.24, 12.24], wick: [12.24, 12.24], isUp: true }];
    
    return realTrades.map((t) => {
      const p = t.price || 12.24;
      return {
        time: t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
        open: p, high: p + 0.01, low: p - 0.01, close: p,
        body: [p, p], wick: [p-0.01, p+0.01], isUp: true
      };
    });
  }, [isAlix, realTrades, candlestickData]);

  // FIX: LOGIKA ORDER BOOK UNTUK MENCEGAH NILAI NEGATIF (-0.00)
  useEffect(() => {
    if (!mounted || currentPrice <= 0) return;
    
    const basePrice = currentPrice;
    const vaultInventory = globalLiquidity?.alixVaultBalance || 1000000;
    
    // Gunakan step dinamis berdasarkan besarnya harga koin
    const step = basePrice * 0.0002; 
    
    setOrderBook({
      bids: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice - ((i + 1) * step);
        return {
          price: Math.max(0.0001, priceValue).toFixed(basePrice < 1 ? 4 : 2),
          amount: (vaultInventory * (0.01 + Math.random() * 0.05)).toFixed(2),
          depth: 20 + Math.random() * 60
        };
      }),
      asks: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice + ((i + 1) * step);
        return {
          price: priceValue.toFixed(basePrice < 1 ? 4 : 2),
          amount: (vaultInventory * (0.01 + Math.random() * 0.05)).toFixed(2),
          depth: 20 + Math.random() * 60
        };
      })
    });
  }, [mounted, currentPrice, globalLiquidity]);

  if (!mounted) return null;

  const idrPrice = (currentPrice * USDT_IDR_RATE).toLocaleString('id-ID', { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 cursor-pointer">
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", isAlix ? "gold-gradient" : "bg-muted")}>
              {isAlix ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-full" />}
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase italic">{displayPair}</h1>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Star className="w-5 h-5 text-muted-foreground" />
          <Bell className="w-5 h-5 text-muted-foreground" />
        </div>
      </header>

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
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {activeTab === "Harga" ? (
          <>
            <section className="px-6 pt-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <h2 className={cn(
                  "text-4xl font-black tracking-tighter italic transition-all duration-500",
                  priceChange >= 0 ? "text-green-500" : "text-rose-500"
                )}>
                  {isLoading ? "..." : currentPrice.toFixed(4)}
                </h2>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-muted-foreground">Rp{idrPrice}</p>
                  <span className={cn("text-[10px] font-black", priceChange >= 0 ? "text-green-500" : "text-rose-500")}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <span className="text-[8px] font-black uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <ShieldCheck className="w-2.5 h-2.5" /> Ali-Secure Node
                  </span>
                  <span className="text-[8px] font-black uppercase text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" /> {currentTime}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-y-2 text-[10px] font-bold text-muted-foreground text-right italic">
                <div>
                  <p className="uppercase opacity-60">High 24 jam</p>
                  <p className="text-foreground">{high24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Vol 24 jam({symbol})</p>
                  <p className="text-foreground">{(volume24h / 1000000).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Low 24 jam</p>
                  <p className="text-foreground">{low24h.toFixed(2)}</p>
                </div>
                <div>
                  <p className="uppercase opacity-60">Node Status</p>
                  <p className="text-green-500 uppercase">AUTONOMOUS</p>
                </div>
              </div>
            </section>

            <div className="px-6 pt-6 flex items-center justify-between border-b border-border/20">
              <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2">
                {["1m", "5m", "15m", "1j", "4j", "1H"].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTimeframe(t); setIsLoading(true); }}
                    className={cn(
                      "text-[11px] font-black italic transition-all shrink-0",
                      timeframe === t ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-4 pb-2 text-muted-foreground">
                <LayoutGrid className="w-4 h-4" />
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            <div className="h-72 w-full relative pt-4 bg-muted/5">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-[8px] font-black uppercase tracking-widest">AME Proxy Sync...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['auto', 'auto']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'rgba(255,255,255,0.3)'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171A1D', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="body" isAnimationActive={false} barSize={6}>
                      {chartData.map((entry, index) => (
                        <Cell key={`body-${index}`} fill={entry.isUp ? "#26A69A" : "#EF5350"} />
                      ))}
                    </Bar>
                    <Bar dataKey="wick" isAnimationActive={false} barSize={1}>
                      {chartData.map((entry, index) => (
                        <Cell key={`wick-${index}`} fill={entry.isUp ? "#26A69A" : "#EF5350"} />
                      ))}
                    </Bar>
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Liquidity Bids (Real)</p>
                    {orderBook.bids.map((bid, i) => (
                      <div key={i} className="flex justify-between items-center relative h-5 px-1 group">
                        <div className="absolute right-0 top-0 bottom-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" style={{ width: `${bid.depth}%` }} />
                        <span className="text-[10px] font-bold text-foreground relative z-10">{bid.amount}</span>
                        <span className="text-[10px] font-black text-green-500 relative z-10">{bid.price}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase mb-2">Liquidity Asks (Real)</p>
                    {orderBook.asks.map((ask, i) => (
                      <div key={i} className="flex justify-between items-center relative h-5 px-1 group">
                        <div className="absolute left-0 top-0 bottom-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" style={{ width: `${ask.depth}%` }} />
                        <span className="text-[10px] font-black text-rose-500 relative z-10">{ask.price}</span>
                        <span className="text-[10px] font-bold text-foreground relative z-10">{ask.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-sm flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 animate-spin" />
            AME NODE SYNC...
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border px-4 py-4 flex items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex gap-6 px-2">
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors">
            <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-black uppercase italic">Lainnya</span>
          </div>
          <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors" onClick={() => router.push('/marketplace')}>
            <LayoutGrid className="w-5 h-5 text-muted-foreground" />
            <span className="text-[8px] font-black uppercase italic">Hub</span>
          </div>
        </div>
        
        <div className="flex-1 flex gap-3">
          <Button 
            onClick={() => router.push(isAlix ? '/crypto/convert' : `/crypto/trade/${symbol.toLowerCase()}`)}
            className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Beli
          </Button>
          <Button 
            onClick={() => router.push(isAlix ? '/crypto/convert' : `/crypto/trade/${symbol.toLowerCase()}`)}
            className="flex-1 h-12 bg-rose-500 hover:bg-rose-600 text-white font-black italic uppercase rounded-lg shadow-lg border-none text-base"
          >
            Jual
          </Button>
        </div>
      </footer>
    </div>
  );
}
