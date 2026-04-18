
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
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Globe,
  Star,
  Loader2,
  ExternalLink,
  ChevronRight,
  Trophy,
  ShieldCheck
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
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";

const MARKUP = 1.02;
const USDT_IDR_RATE = 15850;

// Data dummy untuk Sparklines
const generateTrendData = () => 
  Array.from({ length: 20 }, () => ({ value: Math.random() * 100 }));

const TOKEN_LIST = [
  { rank: 1, symbol: "ETH", name: "Ethereum", price: 2420.08, change: 90.17, changePercent: 3.73, isUp: true, marketCap: "292.0B", fdv: "292.0B", age: "8y" },
  { rank: 2, symbol: "QUQ", name: "Quq", price: 0.0021, change: -0.0001, changePercent: -4.10, isUp: false, marketCap: "2.1M", fdv: "2.1M", age: "1y" },
  { rank: 3, symbol: "CBBTC", name: "Coinbase Wrapped BTC", price: 77313.24, change: 2675.04, changePercent: 3.46, isUp: true, marketCap: "6.8B", fdv: "2.8B", age: "1y" },
  { rank: 4, symbol: "SOL", name: "Wrapped SOL", price: 83.78, change: -2.16, changePercent: -2.58, isUp: false, marketCap: "51.2B", fdv: "--", age: "--" },
  { rank: 5, symbol: "USDT", name: "Tether USD", price: 1.00, change: 0.0011, changePercent: 0.11, isUp: true, marketCap: "9.0B", fdv: "9.0B", age: "5y" },
  { rank: 6, symbol: "WBTC", name: "Wrapped Bitcoin", price: 77121.96, change: 2506.46, changePercent: 3.25, isUp: true, marketCap: "9.2B", fdv: "9.2B", age: "7y" },
  { rank: 7, symbol: "WBTC", name: "Wrapped BTC", price: 77107.61, change: 2644.79, changePercent: 3.43, isUp: true, marketCap: "589.6M", fdv: "590.4M", age: "4y" },
  { rank: 8, symbol: "USDT", name: "Tether USD", price: 1.00, change: 0.0023, changePercent: 0.23, isUp: true, marketCap: "186.7B", fdv: "96.0B", age: "8y" },
  { rank: 9, symbol: "KOGE", name: "BNB48 Club Token", price: 47.99, change: -0.01, changePercent: -0.03, isUp: false, marketCap: "162.3M", fdv: "162.2M", age: "5y" },
];

export default function DesktopDiscoverPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("Tokens");
  const [activeFilter, setActiveFilter] = useState("Popular");

  useEffect(() => {
    setMounted(true);
    // Deteksi Mobile & Redirect
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/crypto');
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#1E2329] flex font-body selection:bg-primary/30">
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
          <SidebarItem 
            icon={ArrowRightLeft} 
            label="Move crypto" 
            hasSubmenu 
            href="/transfer"
          />
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
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8 sticky top-0 z-40">
          <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">Discover</h2>
          
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search for a token..." 
                className="h-10 pl-10 bg-[#F3F4F6] border-none rounded-lg text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary/40"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-[#E5E7EB] pl-6">
              <div className="flex items-center gap-1.5 text-slate-400 hover:text-slate-900 cursor-pointer">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-bold">2</span>
              </div>
              <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-primary" />
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden cursor-pointer border border-border">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="p" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="p-8 space-y-10">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center gap-8 border-b border-[#E5E7EB]">
            {["Tokens", "Sites", "NFTs", "Games", "Networks"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative",
                  activeSubTab === tab ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary" : "text-slate-400 hover:text-slate-600"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Promo Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PromoCard 
              icon="https://picsum.photos/seed/everstake/40/40" 
              title="Everstake" 
              desc="Earn up to 9% on SOL and ETH — MEV-boosted staking, airdrops & more with Everstake."
              color="bg-[#F6A000]"
            />
            <PromoCard 
              icon="https://picsum.photos/seed/ondo/40/40" 
              title="Ondo Global Markets" 
              desc="Trade hundreds of tokenized U.S. stocks and ETFs, fully backed 1:1."
              color="bg-black"
            />
            <PromoCard 
              icon="https://picsum.photos/seed/turtle/40/40" 
              title="Turtle" 
              desc="Boost your rewards and earn 10%-30%+ APR on USD, BTC, and ETH across 50+ protocols."
              color="bg-[#22C55E]"
            />
            <PromoCard 
              icon="https://picsum.photos/seed/metalend/40/40" 
              title="MetaLend" 
              desc="Earn 10%+ and spend anywhere with the AliBank Card! Fully on-chain - built on AAVE & Morpho."
              color="bg-[#6366F1]"
            />
          </div>

          {/* Table Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FilterBtn icon={Trophy} label="Popular" active={activeFilter === "Popular"} onClick={() => setActiveFilter("Popular")} />
              <FilterBtn icon={Zap} label="Trending" active={activeFilter === "Trending"} onClick={() => setActiveFilter("Trending")} />
              <FilterBtn icon={TrendingUp} label="Gainers" active={activeFilter === "Gainers"} onClick={() => setActiveFilter("Gainers")} />
              <FilterBtn icon={TrendingDown} label="Losers" active={activeFilter === "Losers"} onClick={() => setActiveFilter("Losers")} />
              <FilterBtn icon={ShieldCheck} label="Tokenised Stocks" active={activeFilter === "Stocks"} onClick={() => setActiveFilter("Stocks")} />
            </div>
            
            <button className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-bold hover:bg-slate-50 transition-all">
              All networks <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Token Table */}
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#F3F4F6] text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Token</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Change (24h)</th>
                    <th className="px-6 py-4">Change % (24h)</th>
                    <th className="px-6 py-4">Trend (24h)</th>
                    <th className="px-6 py-4">Market cap</th>
                    <th className="px-6 py-4">FDV</th>
                    <th className="px-6 py-4 text-right">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {TOKEN_LIST.map((token) => (
                    <tr key={token.rank} className="hover:bg-slate-50 transition-colors group cursor-pointer">
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
                        {token.isUp ? '+' : ''}{token.change.toFixed(2)}
                      </td>
                      <td className={cn("px-6 py-4 text-sm font-bold", token.isUp ? "text-green-500" : "text-rose-500")}>
                        {token.isUp ? '+' : ''}{token.changePercent.toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 w-32">
                        <div className="h-10 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={generateTrendData()}>
                              <Area 
                                type="monotone" 
                                dataKey="value" 
                                stroke={token.isUp ? "#22C55E" : "#EF4444"} 
                                fill={token.isUp ? "#22C55E" : "#EF4444"} 
                                fillOpacity={0.1} 
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-600">${token.marketCap}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">${token.fdv}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-400">{token.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false, hasSubmenu = false, isPilot = false, href }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group",
      active ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
    )}>
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
          <Image src={icon} alt={title} width={24} height={24} className="rounded" />
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
