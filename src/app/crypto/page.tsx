
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

const MARKUP = 1.02; 
const GLOBAL_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
  "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
  "ATOMUSDT", "XLMUSDT", "XMRUSDT", "NEARUSDT", "ARBUSDT"
];

const GAMES_LIST = [
  { id: "craft-world", title: "Craft World", category: "Multiplayer, Singleplayer, Farming & Crafting", imageId: "game-craft-world" },
  { id: "awakening", title: "Unfettered Awakening", category: "Editors Choice, Action, Indie", imageId: "game-awakening" },
  { id: "medieval", title: "Medieval Empires", category: "Strategy", imageId: "game-medieval" },
  { id: "galaxies", title: "Phantom Galaxies", category: "Action, Space, Story-Rich", imageId: "game-galaxies" },
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

  const syncMarketData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(GLOBAL_SYMBOLS))}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' }
      });
      
      const tickerData = await res.json();
      
      if (!tickerData || tickerData.error || !Array.isArray(tickerData)) {
        console.warn("Market Proxy Error:", tickerData?.error || "Invalid response format");
        setIsError(true);
        // Tetap gunakan data lama jika ada
        if (marketData.length === 0) setIsLoading(false);
        return;
      }

      // Gabungkan dengan data kedaulatan ALX dari Firestore
      const formatted = tickerData.map((item, idx) => {
        const symbol = item.symbol.replace("USDT", "");
        
        return {
          rank: idx + 2,
          symbol: symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
          price: parseFloat(item.lastPrice) * MARKUP,
          changePercent: parseFloat(item.priceChangePercent) || 0,
          isUp: parseFloat(item.priceChangePercent) >= 0,
          marketCap: (parseFloat(item.quoteVolume) * 12.5).toLocaleString(), 
          trend: [], // Trend will be updated separately or on demand to save requests
          age: "Autonomous",
          icon: getIconUrl(symbol)
        };
      });

      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
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

      setMarketData([alxEntry, ...formatted]);
      setLastSync(new Date().toLocaleTimeString());
      setIsLoading(false);
      setIsError(false);
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
    const interval = setInterval(syncMarketData, 30000); 
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
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-screen z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg text-white">
            <LogoIcon />
          </div>
          <span className="font-bold text-xl tracking-tighter italic uppercase">AliBank</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 pt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" />
          <SidebarItem icon={ArrowRightLeft} label="Move crypto" href="/crypto/buy" />
          <SidebarItem icon={Compass} label="Discover" active href="/crypto" />
          <SidebarItem icon={CreditCard} label="Card" href="/marketplace" />
          <SidebarItem icon={Calculator} label="Tax Hub" href="#" />
          <SidebarItem icon={Plane} label="Travel" href="#" />
        </nav>
        <div className="p-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
            <span>Network Health</span>
            <span className={cn("flex items-center gap-1", isError ? "text-rose-500" : "text-green-500")}>
              <Wifi className="w-2.5 h-2.5" /> {isError ? "Limited" : "Live"}
            </span>
          </div>
        </div>
      </aside>

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
                  activeSubTab === tab ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeSubTab === "Tokens" ? (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PromoCard icon="https://picsum.photos/seed/ev/100/100" title="Everstake" desc="Earn up to 9.2% on SOL and ETH — MEV-boosted yield." color="bg-[#F6A000]" />
                <PromoCard icon="https://picsum.photos/seed/on/100/100" title="Ondo Finance" desc="Access tokenized U.S. Treasuries via Ali-Bridge." color="bg-black" />
                <PromoCard icon="https://picsum.photos/seed/tur/100/100" title="Turtle" desc="Re-stake your assets and multiply rewards." color="bg-[#22C55E]" />
                <PromoCard icon="https://picsum.photos/seed/card/100/100" title="AliBank Card" desc="Spend ALX globally at 50M+ merchants." color="bg-[#6366F1]" />
              </div>

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
                      {isLoading && marketData.length === 0 ? (
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
                                <p className="text-sm font-black italic leading-none text-foreground group-hover:text-primary transition-colors uppercase">{token.symbol}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{token.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm font-black italic tracking-tighter text-foreground">
                            ${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className={cn("px-6 py-5 text-sm font-black italic", token.isUp ? "text-green-500" : "text-rose-500")}>
                            {token.isUp ? '+' : ''}{token.changePercent.toFixed(2)}%
                          </td>
                          <td className="px-6 py-5 w-40">
                            <div className="h-10 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={token.trend && token.trend.length > 0 ? token.trend : [{value: 1}]}>
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
          ) : activeSubTab === "Games" ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between px-1">
                 <h3 className="text-lg font-black italic uppercase tracking-tight">Web3 Gaming Universe</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase italic">Powered by <span className="text-primary">Ali-Sovereign Assets</span></p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {GAMES_LIST.map((game) => {
                  const img = PlaceHolderImages.find(i => i.id === game.imageId);
                  return (
                    <div key={game.id} className="group cursor-pointer space-y-4">
                      <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden relative shadow-xl transition-all duration-500 group-hover:scale-[1.02]">
                        <img src={img?.imageUrl} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-ai-hint={img?.imageHint} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                           <Button className="w-full h-12 gold-gradient text-white rounded-xl font-black italic uppercase text-[10px] shadow-2xl">Connect Wallet</Button>
                        </div>
                      </div>
                      <div className="px-2 space-y-1">
                        <h4 className="text-base font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">{game.title}</h4>
                        <p className="text-[10px] font-medium text-muted-foreground line-clamp-1">{game.category}</p>
                        <div className="pt-2 flex items-center gap-2">
                           <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center p-1"><LogoIcon className="text-primary" /></div>
                           <span className="text-[9px] font-bold text-muted-foreground uppercase italic">AliBank Verified</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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

function SidebarItem({ icon: Icon, label, active = false, href }: any) {
  const router = useRouter();
  return (
    <div onClick={() => href !== "#" && router.push(href)} className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-sm font-bold">{label}</span>
      </div>
      {active && <div className="w-1 h-5 bg-primary rounded-full absolute left-0" />}
    </div>
  );
}

function PromoCard({ icon, title, desc, color }: any) {
  return (
    <Card className="bg-card p-6 rounded-2xl border border-border hover:shadow-lg transition-all group cursor-pointer h-full border-b-4 border-b-transparent hover:border-b-primary">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center p-2 shadow-sm text-white shrink-0", color)}><img src={icon} alt={title} width={24} height={24} className="rounded" /></div>
        <h4 className="text-sm font-black italic text-foreground">{title}</h4>
      </div>
      <p className="text-[11px] font-medium text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors italic">{desc}</p>
    </Card>
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
