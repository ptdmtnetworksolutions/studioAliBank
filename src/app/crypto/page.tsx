
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LayoutDashboard, 
  ArrowRightLeft, 
  Compass, 
  CreditCard, 
  Calculator, 
  Plane,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  ExternalLink,
  ChevronRight,
  Trophy,
  ShieldCheck,
  Loader2,
  Wifi,
  RefreshCw,
  CircleAlert
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { GasStation } from "@/components/crypto/GasStation";
import { Sidebar } from "@/components/layout/Sidebar";

const MARKUP = 1.02; 
const GLOBAL_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
  "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
  "ATOMUSDT", "XLMUSDT", "XMRUSDT", "NEARUSDT", "ARBUSDT"
];

const getIconUrl = (symbol: string) => {
  const s = symbol.toLowerCase();
  if (s === 'alx') return null;
  return `https://assets.coincap.io/assets/icons/${s}@2x.png`;
};

export default function DesktopDiscoverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("Tokens");
  const [activeFilter, setActiveFilter] = useState("Popular");
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState("");
  const [isError, setIsError] = useState(false);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchTrendData = async (symbol: string) => {
    try {
      const binanceSymbol = symbol === 'USDT' ? 'USDTIDR' : `${symbol}USDT`;
      const res = await fetch(`/api/market/klines?symbol=${binanceSymbol}&interval=1h&limit=24&t=${Date.now()}`);
      if (res.ok) {
        const klines = await res.json();
        if (Array.isArray(klines)) {
          return klines.map((k: any) => ({ value: parseFloat(k[4]) }));
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  const syncMarketData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(GLOBAL_SYMBOLS))}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const tickerData = await res.json();
      
      if (!tickerData || tickerData.error || !Array.isArray(tickerData)) {
        setIsError(true);
        if (marketData.length === 0) setIsLoading(false);
        return;
      }

      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      
      const baseData = tickerData.map((item, idx) => {
        const symbol = item.symbol.replace("USDT", "");
        return {
          rank: idx + 2,
          symbol: symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
          price: parseFloat(item.lastPrice) * MARKUP,
          changePercent: parseFloat(item.priceChangePercent) || 0,
          isUp: parseFloat(item.priceChangePercent) >= 0,
          marketCap: (parseFloat(item.quoteVolume) * 12.5).toLocaleString(), 
          trend: marketData.find(m => m.symbol === symbol)?.trend || [], 
          age: "Autonomous",
          icon: getIconUrl(symbol)
        };
      });

      const alxEntry = {
        rank: 1,
        symbol: "ALX",
        name: "Alix Coin",
        price: alxPrice,
        changePercent: 1.14,
        isUp: true,
        marketCap: "524.8M",
        trend: Array.from({ length: 24 }, (_, i) => ({ value: alxPrice + (Math.sin(i/2) * 0.05) })),
        age: "Sovereign",
        icon: null
      };

      setMarketData([alxEntry, ...baseData]);
      setLastSync(new Date().toLocaleTimeString());
      setIsLoading(false);
      setIsError(false);

      // Sequential background trend loading
      for (let i = 0; i < baseData.length; i++) {
        const coin = baseData[i];
        if (i > 0 && i % 2 === 0) await new Promise(r => setTimeout(r, 600));
        
        const trend = await fetchTrendData(coin.symbol);
        if (trend.length > 0) {
          setMarketData(prev => prev.map(m => 
            m.symbol === coin.symbol ? { ...m, trend } : m
          ));
        }
      }

    } catch (e) {
      console.warn("Market Node Sync Failed:", e);
      setIsError(true);
      setIsLoading(false);
    }
  }, [globalLiquidity, marketData.length]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/crypto');
      return;
    }
    syncMarketData();
    const interval = setInterval(syncMarketData, 45000); 
    return () => clearInterval(interval);
  }, [router, syncMarketData]);

  const filteredMarketData = useMemo(() => {
    if (marketData.length === 0) return [];
    if (activeFilter === "Popular") return marketData;
    if (activeFilter === "Gainers") return [...marketData].sort((a, b) => b.changePercent - a.changePercent);
    return marketData;
  }, [marketData, activeFilter]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30">
      <Sidebar />

      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Discover</h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black h-5 uppercase px-2">
              <RefreshCw className={cn("w-2.5 h-2.5 mr-1.5", isLoading && "animate-spin")} /> 
              {isLoading ? "Syncing Nodes..." : `Node Sync: ${lastSync}`}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search for a token..." className="h-10 pl-10 bg-muted/50 border-none rounded-lg text-sm font-medium" />
            </div>
            
            <div className="flex items-center gap-4 border-l border-border pl-6">
              <GasStation />
              <Activity className="w-4 h-4 text-muted-foreground" />
              <Bell className="w-5 h-5 text-muted-foreground" />
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border cursor-pointer" onClick={() => router.push('/profile')}>
                {user?.photoURL ? <img src={user.photoURL} alt="p" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">{user?.displayName?.[0] || 'U'}</div>}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-10">
          <div className="flex items-center gap-8 border-b border-border">
            {["Tokens", "Games", "Sites", "NFTs", "Networks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative uppercase italic tracking-tighter",
                  activeSubTab === tab ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeSubTab === "Tokens" ? (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FilterBtn icon={Trophy} label="Popular" active={activeFilter === "Popular"} onClick={() => setActiveFilter("Popular")} />
                  <FilterBtn icon={TrendingUp} label="Gainers" active={activeFilter === "Gainers"} onClick={() => setActiveFilter("Gainers")} />
                </div>
                <button className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border border-border text-xs font-bold text-foreground shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Multi-Chain Sync Active
                </button>
              </div>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-6 py-5">#</th>
                        <th className="px-6 py-5">Token</th>
                        <th className="px-6 py-5">Price (USD)</th>
                        <th className="px-6 py-5">24h Change</th>
                        <th className="px-6 py-5">24h Trend</th>
                        <th className="px-6 py-5 text-right">Node Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(isLoading && marketData.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-32 text-center">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                            <p className="mt-4 font-black uppercase italic text-xs tracking-widest opacity-40">Connecting to Mainnet Nodes...</p>
                          </td>
                        </tr>
                      ) : filteredMarketData.map((token) => (
                        <tr 
                          key={token.symbol} 
                          className="hover:bg-muted/30 transition-colors cursor-pointer group" 
                          onClick={() => router.push(`/crypto/market/${token.symbol.toLowerCase()}`)}
                        >
                          <td className="px-6 py-5 text-xs font-bold text-muted-foreground">{token.rank}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center p-1.5 shadow-inner transition-transform group-hover:scale-110", token.symbol === "ALX" ? "gold-gradient" : "bg-muted border border-border relative overflow-hidden")}>
                                {token.symbol === "ALX" ? (
                                  <LogoIcon className="text-white" />
                                ) : (
                                  <>
                                    <img 
                                      src={token.icon || ""} 
                                      alt={token.symbol} 
                                      className="w-full h-full object-contain rounded-lg" 
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as any).nextElementSibling?.classList.remove('hidden'); }}
                                    />
                                    <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-lg font-black text-[10px] text-muted-foreground uppercase">{token.symbol[0]}</div>
                                  </>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black italic leading-none text-slate-900 group-hover:text-primary transition-colors uppercase">{token.symbol}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{token.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-black italic tracking-tighter text-slate-900">
                            ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className={cn("px-6 py-5 text-sm font-black italic", token.isUp ? "text-green-500" : "text-rose-500")}>
                            {token.isUp ? '+' : ''}{token.changePercent.toFixed(2)}%
                          </td>
                          <td className="px-6 py-5 w-40">
                            <div className="h-10 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={token.trend && token.trend.length > 0 ? token.trend : [{value: 0}]}>
                                  <YAxis domain={['auto', 'auto']} hide />
                                  <Area type="monotone" dataKey="value" stroke={token.isUp ? "#22C55E" : "#EF4444"} fill={token.isUp ? "#22C55E" : "#EF4444"} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2.5 h-6 border-none", token.symbol === 'ALX' ? "bg-primary text-black" : "bg-muted text-muted-foreground")}>{token.age}</Badge>
                          </td>
                        </tr>
                      ))}
                      {marketData.length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={6} className="py-20 text-center opacity-40 italic">
                             <CircleAlert className="w-12 h-12 mx-auto mb-4" />
                             <p className="font-black uppercase">Node bursa sibuk. Mengubungkan kembali...</p>
                             <Button onClick={syncMarketData} variant="link" className="text-primary font-black uppercase text-xs mt-2">Re-Connect Now</Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          ) : (
            <div className="py-40 text-center opacity-20 italic">
               <Zap className="w-16 h-16 mx-auto mb-4 text-primary" />
               <p className="text-xl font-black uppercase tracking-widest">Terminal {activeSubTab} Segera Hadir</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


function FilterBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black italic uppercase transition-all border", active ? "bg-foreground border-foreground text-background shadow-lg" : "bg-card border-border text-muted-foreground hover:border-muted-foreground")}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
