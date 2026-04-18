
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Bell, 
  User, 
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
  Star,
  ExternalLink,
  ChevronRight,
  Trophy,
  ShieldCheck,
  Gamepad2,
  MousePointer2,
  Loader2,
  Wifi,
  RefreshCw,
  Target
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const MARKUP = 1.02; // AliBank 2% Premium Fee
const USDT_IDR_RATE = 15850;

const GAMES_LIST = [
  { id: "craft-world", title: "Craft World", category: "Multiplayer, Singleplayer, Farming & Crafting", imageId: "game-craft-world" },
  { id: "awakening", title: "Unfettered Awakening", category: "Editors Choice, Action, Indie", imageId: "game-awakening" },
  { id: "medieval", title: "Medieval Empires", category: "Strategy", imageId: "game-medieval" },
  { id: "galaxies", title: "Phantom Galaxies", category: "Action, Space, Story-Rich", imageId: "game-galaxies" },
];

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

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  // FETCH LIVE DATA FROM PROXY & INFURA
  const syncMarketData = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
      
      if (!res.ok) throw new Error("Upstream busy");
      const data = await res.json();
      
      if (!Array.isArray(data)) return;

      // Fetch Klines for sparklines (Parallel)
      const klinesPromises = symbols.map(s => 
        fetch(`/api/market/klines?symbol=${s}&interval=1h&limit=20`).then(r => r.json())
      );
      const allKlines = await Promise.all(klinesPromises);

      const formatted = data.map((item, idx) => {
        const symbol = item.symbol.replace("USDT", "");
        const kline = allKlines[idx];
        const trendData = Array.isArray(kline) ? kline.map(k => ({ value: parseFloat(k[4]) })) : [];
        
        return {
          rank: idx + 2,
          symbol: symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : symbol,
          price: parseFloat(item.lastPrice) * MARKUP,
          changePercent: parseFloat(item.priceChangePercent) || 0,
          isUp: parseFloat(item.priceChangePercent) >= 0,
          marketCap: (parseFloat(item.quoteVolume) * 10).toLocaleString(), // Estimated
          trend: trendData,
          age: "Active"
        };
      });

      // Add ALX as #1
      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxTrend = Array.from({ length: 20 }, (_, i) => ({ value: alxPrice + (Math.sin(i) * 0.02) }));
      
      const alxEntry = {
        rank: 1,
        symbol: "ALX",
        name: "Alix Coin",
        price: alxPrice,
        changePercent: 1.14,
        isUp: true,
        marketCap: "524M",
        trend: alxTrend,
        age: "Sovereign"
      };

      setMarketData([alxEntry, ...formatted]);
      setLastSync(new Date().toLocaleTimeString());
      setIsLoading(false);
    } catch (e) {
      console.warn("Sync failed, retrying...");
    }
  }, [globalLiquidity]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/crypto');
      return;
    }
    syncMarketData();
    const interval = setInterval(syncMarketData, 15000);
    return () => clearInterval(interval);
  }, [router, syncMarketData]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1E2329] flex font-body selection:bg-primary/30 transition-colors duration-500">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col fixed h-screen z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg text-white">
            <LogoIcon />
          </div>
          <span className="font-bold text-xl tracking-tighter italic uppercase text-slate-900">AliBank</span>
        </div>

        <nav className="flex-1 px-4 space-y-1 pt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" />
          <SidebarItem icon={ArrowRightLeft} label="Move crypto" hasSubmenu href="/crypto/buy" />
          <SidebarItem icon={Compass} label="Discover" active href="/crypto" />
          <SidebarItem icon={CreditCard} label="Card" href="/marketplace" />
          <SidebarItem icon={Calculator} label="Tax Hub" href="#" />
          <SidebarItem icon={Plane} label="Travel" isPilot href="#" />
        </nav>

        <div className="p-6 border-t border-[#E5E7EB] space-y-4">
          <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>Node Status</span>
            <span className="text-green-500 flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> Online</span>
          </div>
          <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-primary transition-colors flex items-center gap-2">
            Terms of Use <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Discover</h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black h-5 uppercase px-2">
              <RefreshCw className={cn("w-2.5 h-2.5 mr-1.5", isLoading && "animate-spin")} /> 
              {isLoading ? "Syncing Nodes..." : `Last Sync: ${lastSync}`}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search for a token..." className="h-10 pl-10 bg-[#F3F4F6] border-none rounded-lg text-sm font-medium" />
            </div>
            <div className="flex items-center gap-4 border-l border-[#E5E7EB] pl-6">
              <Activity className="w-4 h-4 text-slate-400" />
              <Bell className="w-5 h-5 text-slate-400" />
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-border cursor-pointer" onClick={() => router.push('/profile')}>
                {user?.photoURL ? <img src={user.photoURL} alt="p" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-10">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-8 border-b border-[#E5E7EB]">
            {["Tokens", "Sites", "NFTs", "Games", "Networks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative uppercase italic tracking-tighter",
                  activeSubTab === tab ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeSubTab === "Tokens" ? (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PromoCard icon="https://picsum.photos/seed/everstake/40/40" title="Everstake" desc="Earn up to 9% on SOL and ETH — MEV-boosted staking." color="bg-[#F6A000]" />
                <PromoCard icon="https://picsum.photos/seed/ondo/40/40" title="Ondo Global" desc="Trade tokenized U.S. stocks and ETFs with Ali-Bridge." color="bg-black" />
                <PromoCard icon="https://picsum.photos/seed/turtle/40/40" title="Turtle Yield" desc="Boost your rewards and earn 10%-30%+ APR." color="bg-[#22C55E]" />
                <PromoCard icon="https://picsum.photos/seed/metalend/40/40" title="AliBank Card" desc="Spend your ALX anywhere in the world!" color="bg-[#6366F1]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FilterBtn icon={Trophy} label="Popular" active={activeFilter === "Popular"} onClick={() => setActiveFilter("Popular")} />
                  <FilterBtn icon={Zap} label="Trending" active={activeFilter === "Trending"} onClick={() => setActiveFilter("Trending")} />
                  <FilterBtn icon={TrendingUp} label="Gainers" active={activeFilter === "Gainers"} onClick={() => setActiveFilter("Gainers")} />
                </div>
                <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold hover:bg-slate-50">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Multi-Chain Node <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Token</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Change (24h)</th>
                      <th className="px-6 py-4">Real-Time Trend</th>
                      <th className="px-6 py-4 text-right">Node Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center opacity-30">
                          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                          <p className="mt-4 font-black uppercase italic text-xs">Connecting to Market Proxy...</p>
                        </td>
                      </tr>
                    ) : marketData.map((token) => (
                      <tr 
                        key={token.symbol} 
                        className="hover:bg-slate-50 transition-colors cursor-pointer group" 
                        onClick={() => router.push(`/crypto/market/${token.symbol.toLowerCase()}`)}
                      >
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{token.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center p-1.5 shadow-inner", token.symbol === "ALX" ? "gold-gradient" : "bg-slate-100 border border-border")}>
                              {token.symbol === "ALX" ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-lg flex items-center justify-center text-[10px] font-black text-white">{token.symbol[0]}</div>}
                            </div>
                            <div>
                              <p className="text-sm font-black italic leading-none group-hover:text-primary transition-colors">{token.symbol}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">{token.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold italic tracking-tighter">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                        <td className={cn("px-6 py-4 text-sm font-bold italic", token.isUp ? "text-green-500" : "text-rose-500")}>
                          {token.isUp ? '+' : ''}{token.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 w-32">
                          <div className="h-10 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={token.trend}>
                                <Area type="monotone" dataKey="value" stroke={token.isUp ? "#22C55E" : "#EF4444"} fill={token.isUp ? "#22C55E" : "#EF4444"} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Badge variant="outline" className={cn("text-[7px] font-black uppercase px-2 border-none", token.symbol === 'ALX' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500")}>
                            {token.age}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          ) : activeSubTab === "Games" ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-700">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                   <h3 className="text-lg font-black italic uppercase tracking-tight">Top Web3 Games</h3>
                   <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5">Mainnet Integrated</Badge>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase italic">Curated by <span className="text-primary">AliBank Node</span></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {GAMES_LIST.map((game) => {
                  const img = PlaceHolderImages.find(i => i.id === game.imageId);
                  return (
                    <div key={game.id} className="group cursor-pointer space-y-4">
                      <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden relative shadow-xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-primary/10">
                        <img 
                          src={img?.imageUrl} 
                          alt={game.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          data-ai-hint={img?.imageHint}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                           <Button className="w-full h-12 gold-gradient text-white rounded-xl font-black italic uppercase text-[10px] shadow-2xl">
                             Play Now <MousePointer2 className="w-4 h-4 ml-2" />
                           </Button>
                        </div>
                      </div>
                      <div className="px-2 space-y-1">
                        <h4 className="text-base font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">{game.title}</h4>
                        <p className="text-[10px] font-medium text-slate-400 line-clamp-1">{game.category}</p>
                        <div className="pt-2 flex items-center gap-2">
                           <div className="w-5 h-5 rounded-lg bg-orange-500/10 flex items-center justify-center p-1">
                             <LogoIcon className="text-orange-600" />
                           </div>
                           <span className="text-[9px] font-bold text-slate-400 uppercase italic">In-game support</span>
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
               <p className="text-xl font-black uppercase tracking-widest">Coming Soon: {activeSubTab} Hub</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, hasSubmenu = false, isPilot = false, href }: any) {
  const router = useRouter();
  return (
    <div 
      onClick={() => href !== "#" && router.push(href)}
      className={cn(
        "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative",
        active ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-slate-400 group-hover:text-slate-900")} />
        <span className="text-sm font-bold">{label}</span>
      </div>
      {hasSubmenu && <ChevronRight className="w-4 h-4 text-slate-300" />}
      {isPilot && <Badge className="bg-blue-100 text-blue-600 text-[8px] font-black h-4 border-none px-1.5 uppercase">Pilot</Badge>}
      {active && <div className="w-1 h-5 bg-primary rounded-full absolute left-0" />}
    </div>
  );
}

function PromoCard({ icon, title, desc, color }: any) {
  return (
    <Card className="bg-white p-6 rounded-2xl border border-[#E5E7EB] hover:shadow-lg transition-all group cursor-pointer h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center p-2 shadow-sm text-white", color)}>
          <img src={icon} alt={title} width={24} height={24} className="rounded" />
        </div>
        <h4 className="text-sm font-black italic">{title}</h4>
      </div>
      <p className="text-[11px] font-medium text-slate-400 leading-relaxed group-hover:text-slate-600 transition-colors">{desc}</p>
    </Card>
  );
}

function FilterBtn({ icon: Icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black italic uppercase transition-all border",
        active 
          ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
          : "bg-white border-[#E5E7EB] text-slate-400 hover:border-slate-300"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
