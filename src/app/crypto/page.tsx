
"use client";

import { useState, useEffect, useMemo } from "react";
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
  MousePointer2
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
import { useUser } from "@/firebase";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const generateTrendData = () => 
  Array.from({ length: 20 }, () => ({ value: Math.random() * 100 }));

const TOKEN_LIST = [
  { rank: 1, symbol: "ETH", name: "Ethereum", price: 2420.08, change: 90.17, changePercent: 3.73, isUp: true, marketCap: "292.0B", fdv: "292.0B", age: "8y" },
  { rank: 2, symbol: "QUQ", name: "Quq", price: 0.0021, change: -0.0001, changePercent: -4.10, isUp: false, marketCap: "2.1M", fdv: "2.1M", age: "1y" },
  { rank: 3, symbol: "CBBTC", name: "Coinbase Wrapped BTC", price: 77313.24, change: 2675.04, changePercent: 3.46, isUp: true, marketCap: "6.8B", fdv: "2.8B", age: "1y" },
  { rank: 4, symbol: "SOL", name: "Wrapped SOL", price: 83.78, change: -2.16, changePercent: -2.58, isUp: false, marketCap: "51.2B", fdv: "--", age: "--" },
  { rank: 5, symbol: "USDT", name: "Tether USD", price: 1.00, change: 0.0011, changePercent: 0.11, isUp: true, marketCap: "9.0B", fdv: "9.0B", age: "5y" },
  { rank: 6, symbol: "WBTC", name: "Wrapped Bitcoin", price: 77121.96, change: 2506.46, changePercent: 3.25, isUp: true, marketCap: "9.2B", fdv: "9.2B", age: "7y" },
];

const GAMES_LIST = [
  { id: "craft-world", title: "Craft World", category: "Multiplayer, Singleplayer, Farming & Crafting", imageId: "game-craft-world" },
  { id: "awakening", title: "Unfettered Awakening", category: "Editors Choice, Action, Indie", imageId: "game-awakening" },
  { id: "medieval", title: "Medieval Empires", category: "Strategy", imageId: "game-medieval" },
  { id: "galaxies", title: "Phantom Galaxies", category: "Action, Space, Story-Rich", imageId: "game-galaxies" },
];

export default function DesktopDiscoverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("Tokens");
  const [activeFilter, setActiveFilter] = useState("Popular");

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/crypto');
    }
  }, [router]);

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

        <div className="p-6 border-t border-[#E5E7EB]">
          <button className="text-[10px] font-bold text-slate-400 uppercase hover:text-primary transition-colors flex items-center gap-2">
            Terms of Use <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Discover</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="Search for a token..." className="h-10 pl-10 bg-[#F3F4F6] border-none rounded-lg text-sm font-medium" />
            </div>
            <div className="flex items-center gap-4 border-l border-[#E5E7EB] pl-6">
              <Activity className="w-4 h-4 text-slate-400" />
              <Bell className="w-5 h-5 text-slate-400" />
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-border">
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

          {/* DYNAMIC CONTENT BASED ON TAB */}
          {activeSubTab === "Tokens" ? (
            <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PromoCard icon="https://picsum.photos/seed/everstake/40/40" title="Everstake" desc="Earn up to 9% on SOL and ETH — MEV-boosted staking." color="bg-[#F6A000]" />
                <PromoCard icon="https://picsum.photos/seed/ondo/40/40" title="Ondo Global Markets" desc="Trade hundreds of tokenized U.S. stocks and ETFs." color="bg-black" />
                <PromoCard icon="https://picsum.photos/seed/turtle/40/40" title="Turtle" desc="Boost your rewards and earn 10%-30%+ APR." color="bg-[#22C55E]" />
                <PromoCard icon="https://picsum.photos/seed/metalend/40/40" title="MetaLend" desc="Spend anywhere with the AliBank Card!" color="bg-[#6366F1]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FilterBtn icon={Trophy} label="Popular" active={activeFilter === "Popular"} onClick={() => setActiveFilter("Popular")} />
                  <FilterBtn icon={Zap} label="Trending" active={activeFilter === "Trending"} onClick={() => setActiveFilter("Trending")} />
                  <FilterBtn icon={TrendingUp} label="Gainers" active={activeFilter === "Gainers"} onClick={() => setActiveFilter("Gainers")} />
                </div>
                <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold hover:bg-slate-50">
                  All networks <ChevronDown className="w-4 h-4" />
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
                      <th className="px-6 py-4">Trend</th>
                      <th className="px-6 py-4 text-right">Age</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {TOKEN_LIST.map((token) => (
                      <tr key={token.rank} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/crypto/market/${token.symbol.toLowerCase()}`)}>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">{token.rank}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center p-1 border border-border">
                              {token.symbol === "ETH" ? <div className="w-full h-full bg-blue-500 rounded-full flex items-center justify-center p-1.5"><LogoIcon className="text-white" /></div> : <div className="w-full h-full bg-slate-400 rounded-full" />}
                            </div>
                            <div>
                              <p className="text-sm font-black italic leading-none">{token.symbol}</p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1">{token.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold">${token.price.toLocaleString()}</td>
                        <td className={cn("px-6 py-4 text-sm font-bold", token.isUp ? "text-green-500" : "text-rose-500")}>
                          {token.isUp ? '+' : ''}{token.changePercent.toFixed(2)}%
                        </td>
                        <td className="px-6 py-4 w-32">
                          <div className="h-10 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={generateTrendData()}>
                                <Area type="monotone" dataKey="value" stroke={token.isUp ? "#22C55E" : "#EF4444"} fill={token.isUp ? "#22C55E" : "#EF4444"} fillOpacity={0.1} strokeWidth={2} />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-slate-400">{token.age}</td>
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
