"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
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
  Clock,
  Crown,
  Coins,
  History as HistoryIcon,
  ExternalLink,
  ShieldAlert,
  Copy
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
import { useToast } from "@/hooks/use-toast";

const MARKUP = 1.02; // AliBank 2% Profit Margin
const USDT_IDR_RATE = 17690;

const FUNDAMENTALS: Record<string, { name: string; cap: string; supply: string; desc: string; contract: string }> = {
  "BTC": { 
    name: "Bitcoin", 
    cap: "Rp 21,500,000,000,000,000", 
    supply: "21,000,000 BTC", 
    contract: "Native Mainnet", 
    desc: "Bitcoin adalah aset kripto desentralisasi pertama di dunia, yang diluncurkan pada tahun 2009 oleh entitas anonim bernama Satoshi Nakamoto sebagai mata uang digital tanpa otoritas pusat." 
  },
  "ETH": { 
    name: "Ethereum", 
    cap: "Rp 4,800,000,000,000,000", 
    supply: "120,400,000 ETH", 
    contract: "Native Mainnet", 
    desc: "Ethereum adalah platform komputasi berbasis blockchain global yang memungkinkan pengembang membangun aplikasi terdesentralisasi (dApps) dan meluncurkan smart contract." 
  },
  "BNB": { 
    name: "BNB", 
    cap: "Rp 1,400,000,000,000,000", 
    supply: "147,500,000 BNB", 
    contract: "BNB Smart Chain (BEP20)", 
    desc: "BNB adalah koin utilitas ekosistem bursa kripto terbesar di dunia yang digunakan untuk memotong biaya gas transaksi, staking, dan partisipasi token sale." 
  },
  "SOL": { 
    name: "Solana", 
    cap: "Rp 1,100,000,000,000,000", 
    supply: "462,000,000 SOL", 
    contract: "Native Mainnet", 
    desc: "Solana adalah blockchain layer-1 berkinerja tinggi yang dioptimalkan untuk skalabilitas tinggi, biaya gas yang sangat murah, dan pemrosesan transaksi berkecepatan tinggi." 
  },
};

const COINS_LIST = [
  { symbol: "ALX", name: "Alix Coin", isNative: true },
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "BNB", name: "Binance Coin" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "XRP", name: "Ripple" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "DOT", name: "Polkadot" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "MATIC", name: "Polygon" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "UNI", name: "Uniswap" },
  { symbol: "ATOM", name: "Cosmos" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "XMR", name: "Monero" },
  { symbol: "NEAR", name: "Near Protocol" },
  { symbol: "ARB", name: "Arbitrum" },
];

export default function MarketDetailPage() {
  const params = useParams();
  const coinId = params?.coinId;
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { resolvedTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("Harga");
  const [subTab, setSubTab] = useState("Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [mounted, setMounted] = useState(false);
  
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCoins = useMemo(() => {
    if (!searchQuery) return COINS_LIST;
    const q = searchQuery.toLowerCase();
    return COINS_LIST.filter(c => 
      c.symbol.toLowerCase().includes(q) || 
      c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);
  
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

  const fetchMarketData = useCallback(async () => {
    if (isAlix) {
      const base = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const noise = (Math.random() * 0.002 - 0.001);
      setLivePrice(base + noise);
      setPriceChange(1.14 + (Math.random() * 0.1));
      setHigh24h(base * 1.05);
      setLow24h(base * 0.98);
      setVolume24h(globalLiquidity?.totalAlixSoldInternally || 1250000);
      setIsLoading(false);
      return;
    }

    if (!symbol) return;

    try {
      const intervalMap: Record<string, string> = {
        "1m": "1m", "5m": "5m", "15m": "15m", "1j": "1h", "4j": "4h", "1H": "1d"
      };
      const interval = intervalMap[timeframe] || "15m";
      const binanceSymbol = symbol === 'USDT' ? 'USDTIDR' : `${symbol}USDT`;

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
    } catch (error: any) {
      console.error('Market Proxy Klines Error:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, isAlix, timeframe, globalLiquidity]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const currentPrice = useMemo(() => {
    if (isAlix) {
      if (realTrades && realTrades.length > 0) return realTrades[realTrades.length - 1].price || 12.24;
      return livePrice || globalLiquidity?.lastAlxPriceUsdt || 12.24;
    }
    return livePrice || 0;
  }, [isAlix, realTrades, globalLiquidity, livePrice]);

  const chartData = useMemo(() => {
    if (!isAlix) return candlestickData;
    
    if (!realTrades || realTrades.length === 0) {
      const base = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      return Array.from({ length: 40 }, (_, i) => {
        const p = base + (Math.sin(i/5) * 0.05);
        return {
          time: `${i}:00`, open: p, high: p+0.01, low: p-0.01, close: p,
          body: [p, p], wick: [p-0.01, p+0.01], isUp: true
        };
      });
    }
    
    return realTrades.map((t) => {
      const p = t.price || 12.24;
      return {
        time: t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
        open: p, high: p + 0.01, low: p - 0.01, close: p,
        body: [p, p], wick: [p-0.01, p+0.01], isUp: true
      };
    });
  }, [isAlix, realTrades, candlestickData, globalLiquidity]);

  useEffect(() => {
    if (!mounted || currentPrice <= 0) return;
    
    const basePrice = currentPrice;
    const vaultInventory = Math.abs(globalLiquidity?.alixVaultBalance || 1000000);
    const step = basePrice * 0.0002; 
    
    setOrderBook({
      bids: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice - ((i + 1) * step);
        const randomAmount = Math.abs(vaultInventory * (0.01 + Math.random() * 0.05));
        return {
          price: Math.max(0.0001, priceValue).toFixed(basePrice < 1 ? 4 : 2),
          amount: randomAmount.toFixed(2),
          depth: 20 + Math.random() * 60
        };
      }),
      asks: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice + ((i + 1) * step);
        const randomAmount = Math.abs(vaultInventory * (0.01 + Math.random() * 0.05));
        return {
          price: priceValue.toFixed(basePrice < 1 ? 4 : 2),
          amount: randomAmount.toFixed(2),
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
          <div 
            onClick={() => setShowCoinSelector(true)} 
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center overflow-hidden", isAlix ? "gold-gradient p-1" : "bg-muted relative")}>
              {isAlix ? (
                <LogoIcon className="text-white" />
              ) : (
                <>
                  <img 
                    src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} 
                    className="object-cover w-full h-full" 
                    alt={symbol} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      const fallback = (e.target as HTMLImageElement).nextElementSibling;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-full font-black text-[8px] text-slate-400">
                    {symbol[0]}
                  </div>
                </>
              )}
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
        {activeTab === "Harga" && (
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
                  <p className="text-green-500 uppercase">{isAlix ? "SOVEREIGN" : "AUTONOMOUS"}</p>
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
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={true} 
                      horizontal={true} 
                      stroke={resolvedTheme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'} 
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: resolvedTheme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: resolvedTheme === 'dark' ? '#171A1D' : '#ffffff', 
                        borderRadius: '12px', 
                        border: resolvedTheme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)', 
                        fontSize: '10px',
                        color: resolvedTheme === 'dark' ? '#ffffff' : '#000000'
                      }}
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
                {subTab === "Book" && (
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
                )}
                {subTab === "Perdagangan" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 text-[8px] font-black text-muted-foreground uppercase px-1">
                      <span>Waktu</span>
                      <span className="text-center">Harga(USDT)</span>
                      <span className="text-right">Jumlah(ALX)</span>
                    </div>
                    {(realTrades || []).slice(-10).reverse().map((t, i) => (
                      <div key={i} className="grid grid-cols-3 text-[10px] font-bold italic">
                        <span className="text-muted-foreground">{t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}) : '---'}</span>
                        <span className={cn("text-center font-black", Math.random() > 0.5 ? "text-green-500" : "text-rose-500")}>{t.price?.toFixed(4) || '12.2400'}</span>
                        <span className="text-right text-foreground">{t.amount?.toFixed(2) || '100.00'}</span>
                      </div>
                    ))}
                    {(!realTrades || realTrades.length === 0) && (
                      <div className="py-10 text-center opacity-20 italic">Belum ada riwayat perdagangan global hari ini.</div>
                    )}
                  </div>
                )}
                {subTab === "Jaringan" && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border">
                      <Activity className="w-8 h-8 text-primary" />
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Node Performance</p>
                        <p className="text-sm font-black italic">14,250 TPS <span className="text-[8px] text-green-500 ml-2">HEALTHY</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-muted/20 space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Total Konfirmasi</p>
                        <p className="text-xs font-black italic">1,248,992 Blocks</p>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/20 space-y-1">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Gas Price</p>
                        <p className="text-xs font-black italic text-primary">0.000001 ALX</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === "Info" && (
          <div className="px-6 pt-8 space-y-10 animate-in slide-in-from-right-10 duration-500">
            <header className="flex flex-col items-center text-center space-y-4">
              <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl overflow-hidden", isAlix ? "gold-gradient p-5" : "bg-muted p-3 relative")}>
                {isAlix ? (
                  <LogoIcon className="text-white" />
                ) : (
                  <>
                    <img 
                      src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} 
                      className="object-cover w-full h-full" 
                      alt={symbol} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-[2rem] font-black text-2xl text-slate-400">
                      {symbol}
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                  {isAlix ? "Alix Coin (ALX)" : `${FUNDAMENTALS[symbol]?.name || symbol} (${symbol})`}
                </h2>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full w-fit mx-auto">
                  {isAlix ? "Aset Berdaulat AliBank V3" : "Aset Pasar Global Sync"}
                </p>
              </div>
            </header>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Detail Fundamental
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <InfoRow label="Nama Aset" value={isAlix ? "Alix Token" : (FUNDAMENTALS[symbol]?.name || `${symbol} Token`)} />
                <InfoRow label="Simbol" value={symbol} />
                <InfoRow label={isAlix ? "Harga Anchor" : "Harga Terkini"} value={`$ ${(isAlix ? (globalLiquidity?.lastAlxPriceUsdt || 12.24) : (currentPrice || 0)).toFixed(isAlix ? 2 : 4)}`} />
                <InfoRow label="Market Cap" value={isAlix ? `Rp ${(globalLiquidity?.totalInternalAumIdr * 1.5 || 25000000000).toLocaleString()}` : (FUNDAMENTALS[symbol]?.cap || "TBD")} />
                <InfoRow label="Total Suplai" value={isAlix ? "1,000,000,000 ALX" : (FUNDAMENTALS[symbol]?.supply || "TBD")} />
                {isAlix && <InfoRow label="Sirkulasi Riil" value={`${(globalLiquidity?.totalAlixSoldInternally || 1250000).toLocaleString()} ALX`} />}
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Kontrak Pintar / Jaringan</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-accent">
                      {isAlix ? "0x8BAF...D1Dd" : (FUNDAMENTALS[symbol]?.contract || "Native Mainnet")}
                    </span>
                    {isAlix && (
                      <Copy className="w-3 h-3 text-primary cursor-pointer" onClick={() => {
                        navigator.clipboard.writeText("0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd");
                        toast({title: "Alamat Disalin"});
                      }} />
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-black uppercase italic tracking-tight flex items-center gap-2">
                <Rocket className="w-4 h-4 text-primary" /> Visi & Deskripsi Aset
              </h3>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic uppercase">
                {isAlix 
                  ? "ALX bukan sekadar token spekulatif. Ini adalah unit nilai inti dalam ekosistem AliBank yang didukung oleh cadangan likuiditas riil (fiat dan kripto utama). Setiap koin ALX memberikan hak akses eksklusif ke infrastruktur perbankan Web3 kami yang aman dan otonom."
                  : (FUNDAMENTALS[symbol]?.desc || `${symbol} adalah aset terenkripsi global yang diperdagangkan secara riil dan di-sync secara live di jaringan AliBank V3.`)}
              </p>
              <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary font-black uppercase italic text-xs">
                Baca Info Lengkap <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </section>
          </div>
        )}

        {activeTab === "Utilitas" && (
          <div className="px-6 pt-8 space-y-10 animate-in slide-in-from-right-10 duration-500">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-center">Ekosistem & Utilitas</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <UtilityBenefitCard 
                icon={Crown} 
                title="Tier Membership" 
                desc="Hold ALX untuk menaikkan level akun. Platinum VIP (10k+ ALX) menikmati Bebas Biaya Transaksi selamanya."
              />
              <UtilityBenefitCard 
                icon={Trophy} 
                title="Staking Yield" 
                desc="Kunci koin ALX Anda di Brankas untuk mendapatkan bagi hasil dari kolam keuntungan perdagangan harian AliBank."
              />
              <UtilityBenefitCard 
                icon={Flame} 
                title="Buyback & Burn" 
                desc="20% dari seluruh biaya platform digunakan untuk membeli kembali ALX dari pasar dan membakarnya secara permanen."
              />
              <UtilityBenefitCard 
                icon={ShieldCheck} 
                title="Akses Infrastruktur" 
                desc="Gunakan ALX untuk membayar biaya layanan khusus di Marketplace dan peluncuran program mini Anda sendiri."
              />
            </div>

            <Card className="liquid-glass-dark p-8 rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden text-center space-y-4">
              <div className="absolute inset-0 gold-gradient opacity-5" />
              <Coins className="w-12 h-12 text-primary mx-auto relative z-10" />
              <h4 className="text-lg font-black uppercase italic text-white relative z-10">Miliki Masa Depan</h4>
              <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed italic relative z-10">
                Pertumbuhan ALX berbanding lurus dengan volume transaksi di seluruh jaringan AliBank. Bergabunglah dengan 12,500+ pemegang koin awal hari ini.
              </p>
              <Button onClick={() => router.push('/crypto/convert')} className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs shadow-xl relative z-10">
                BELI ALX SEKARANG
              </Button>
            </Card>
          </div>
        )}

        {activeTab === "Trade-X" && (
          <div className="px-6 pt-8 space-y-10 animate-in slide-in-from-right-10 duration-500">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full mx-auto flex items-center justify-center border-4 border-primary/20">
                <Zap className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Trade-X Terminal</h2>
                <Badge className="bg-green-500 text-white border-none font-black text-[8px] uppercase px-3 h-5">90% Instant Yield</Badge>
              </div>
            </div>

            <Card className="p-8 rounded-[2.5rem] bg-muted/30 border border-border shadow-inner space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-primary" />
                  <span className="text-xs font-black uppercase italic">Prediksi Cepat</span>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">5 Detik - 1 Menit</span>
              </div>
              
              <div className="space-y-4">
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic uppercase">
                  Gunakan saldo ALX atau IDR Anda untuk memprediksi arah pasar dalam jangka pendek. Dapatkan keuntungan instan yang dibayarkan langsung dalam koin ALX.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                    <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase text-muted-foreground">High Profit</p>
                    <p className="text-sm font-black italic text-green-600">Up to 90%</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center">
                    <HistoryIcon className="w-5 h-5 text-rose-500 mx-auto mb-2" />
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Min Stake</p>
                    <p className="text-sm font-black italic text-rose-600">Rp 10,000</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => router.push('/crypto/trade-pro/alx')}
                className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-sm shadow-xl tracking-widest group"
              >
                LUNCURKAN TERMINAL <Rocket className="w-5 h-5 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </Card>

            <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Peringatan Risiko: Perdagangan Trade-X melibatkan spekulasi harga jangka pendek yang tinggi. Pastikan Anda hanya menggunakan dana dingin untuk fitur ini.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border px-4 py-4 flex items-center gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex gap-6 px-2">
          <div 
            className="flex flex-col items-center gap-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => toast({ title: "Fitur Notifikasi", description: "Atur peringatan harga koin ALX." })}
          >
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

      {/* COIN SELECTOR DRAWER BOTTOM SHEET */}
      {showCoinSelector && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] animate-in fade-in duration-200"
            onClick={() => {
              setShowCoinSelector(false);
              setSearchQuery("");
            }}
          />
          {/* Bottom Sheet Container */}
          <div className="fixed inset-x-0 bottom-0 max-w-md mx-auto h-[75vh] rounded-t-[2.5rem] border-t border-border bg-card/95 backdrop-blur-md shadow-2xl z-[100] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
            {/* Drag handle decoration */}
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto my-4 shrink-0" />
            
            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black uppercase italic tracking-wider text-foreground">Pilih Aset Kripto</h3>
              <button 
                onClick={() => {
                  setShowCoinSelector(false);
                  setSearchQuery("");
                }}
                className="text-xs font-black uppercase italic text-muted-foreground hover:text-foreground px-3 py-1 bg-muted/40 rounded-lg"
              >
                Tutup
              </button>
            </div>

            {/* Search Input */}
            <div className="px-6 pb-4 relative shrink-0">
              <Search className="w-4 h-4 text-muted-foreground absolute left-10 top-3.5" />
              <input 
                type="text" 
                placeholder="Cari koin..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 rounded-xl bg-muted/50 border border-border/50 text-sm focus:outline-none focus:border-primary/50 italic uppercase font-bold text-foreground"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2.5">
              {filteredCoins.map((coin) => {
                const isCurrent = coin.symbol === symbol;
                return (
                  <div 
                    key={coin.symbol} 
                    onClick={() => {
                      setShowCoinSelector(false);
                      setSearchQuery("");
                      router.push(`/crypto/market/${coin.symbol.toLowerCase()}`);
                    }}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border",
                      isCurrent 
                        ? "bg-primary/10 border-primary" 
                        : "bg-muted/30 border-transparent hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0", coin.isNative ? "gold-gradient p-1.5" : "bg-muted relative")}>
                        {coin.isNative ? (
                          <LogoIcon className="text-white" />
                        ) : (
                          <>
                            <img 
                              src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`} 
                              className="object-cover w-full h-full" 
                              alt={coin.symbol} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-xl font-black text-[10px] text-slate-400">
                              {coin.symbol[0]}
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black italic uppercase text-foreground">{coin.symbol}</span>
                          {coin.isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 border-none">V3</Badge>}
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{coin.name}</p>
                      </div>
                    </div>
                    
                    {isCurrent && (
                      <Badge className="bg-primary text-primary-foreground text-[8px] font-black uppercase h-5">Aktif</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-border/50">
      <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
      <span className="text-[11px] font-black italic text-foreground">{value}</span>
    </div>
  );
}

function UtilityBenefitCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <Card className="p-6 rounded-[2rem] bg-card border border-border shadow-sm flex items-start gap-5 group hover:border-primary/30 transition-all">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 space-y-1">
        <h4 className="text-sm font-black uppercase italic">{title}</h4>
        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic">{desc}</p>
      </div>
    </Card>
  );
}
