
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Wallet,
  Loader2,
  Globe,
  Zap,
  ArrowRightLeft,
  Lock,
  TrendingUp,
  Activity,
  History,
  Coins,
  ChevronRight,
  LayoutGrid,
  BarChart3,
  ArrowUpRight,
  HelpCircle,
  ArrowUpDown,
  Wallet2,
  PieChart,
  ExternalLink,
  ShieldAlert,
  Send,
  Download,
  Key,
  AlertTriangle,
  Sparkles,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { formatEther, JsonRpcProvider, ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { LogoIcon } from "@/components/ui/logo";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";

type CoinData = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
};

export default function CryptoDeFiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [mounted, setMounted] = useState(false);
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [onChainEth, setOnChainEth] = useState("0");
  const [isActivatingWallet, setIsActivatingWallet] = useState(false);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=15&page=1&sparkline=false"
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setCoins(data);
      }
    } catch (err) {
      console.error("Market data sync interrupted");
    } finally { setLoading(false); }
  }, []);

  const fetchInternalBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(addr);
      setOnChainEth(formatEther(balance));
    } catch (err) {
      console.warn("Mainnet ledger sync interrupted");
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (userData?.walletAddress) {
      fetchInternalBalance(userData.walletAddress);
    }
  }, [userData?.walletAddress, fetchInternalBalance]);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa]">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl p-3">
                  <LogoIcon className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter flex items-center gap-3">
                  Sovereign Exchange <Globe className="w-6 h-6 text-primary animate-pulse" />
                </h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest pl-1">
                AliBank V3 Node • Institutional Global Liquidity • Production Environment
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.push('/admin/about-alix')} className="h-12 px-8 rounded-2xl bg-white border border-primary/20 text-accent font-black uppercase italic shadow-xl hover:bg-primary/5 transition-all">
                <Award className="mr-2 w-4 h-4 text-primary" /> ALIX Whitepaper
              </Button>
              <Button onClick={() => router.push('/crypto/trade/bitcoin')} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl">
                <Zap className="mr-2 w-4 h-4" /> Professional Terminal
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* ALIX Sovereign Asset Card */}
              <Card className="rounded-[3rem] bg-accent border-none p-10 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-all duration-700" />
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform"><LogoIcon className="w-48 h-48" /></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                  <div className="space-y-8 flex-1">
                    <div>
                      <Badge className="bg-primary text-white border-none px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[9px] mb-4">
                        Utility Token • Eco-Backing Active
                      </Badge>
                      <h2 className="text-5xl font-black italic tracking-tighter leading-tight uppercase">Koin <span className="text-primary underline decoration-primary/30 underline-offset-8">ALIX</span></h2>
                      <p className="text-xs font-bold text-white/60 mt-4 leading-relaxed italic uppercase tracking-wider">
                        Aset kripto resmi AliBank yang didukung oleh 100% likuiditas kas riil dan bagi hasil marketplace.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 pt-4">
                      <Button onClick={() => router.push('/crypto/trade/alix')} className="bg-white text-accent rounded-xl font-black uppercase italic text-[10px] px-8 h-12 shadow-xl hover:bg-primary hover:text-white transition-all">
                        Buy ALIX
                      </Button>
                      <Button onClick={() => router.push('/admin/about-alix')} variant="ghost" className="text-white/60 hover:text-white font-black uppercase italic text-[10px] border border-white/10 rounded-xl h-12 px-6">
                        Learn Tokenomics
                      </Button>
                    </div>
                  </div>

                  <div className="w-full md:w-72 space-y-4">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 space-y-6">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Circulating Balance</p>
                        <p className="text-3xl font-black italic tracking-tighter">{(userData?.cryptoBalances?.ALIX || 0).toLocaleString()} <span className="text-sm">ALIX</span></p>
                      </div>
                      <div className="pt-4 border-t border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-white/40 uppercase">Internal Value</span>
                          <span className="text-[10px] font-black text-green-400">Rp 12,450 / ALIX</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] font-bold text-white/40 uppercase">Liquidity Rights</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Mainnet Assets & Market Pulse */}
              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" /> Institutional Markets
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Mainnet Node Online</span>
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Asset Pair</th>
                        <th className="px-8 py-6">Spot Price</th>
                        <th className="px-8 py-6">24h Pulse</th>
                        <th className="px-8 py-6 text-right">Execution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      <tr className="hover:bg-primary/5 transition-colors group bg-orange-500/5">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-accent flex items-center justify-center p-2 shadow-lg">
                              <LogoIcon className="text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-accent uppercase tracking-tighter">ALIX/IDR</p>
                              <Badge className="bg-orange-600 text-white text-[6px] font-black uppercase h-3 px-1 border-none leading-none">SOVEREIGN</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-accent italic">Rp 12,450.00</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-green-600">
                            +4.85%
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button onClick={() => router.push('/crypto/trade/alix')} className="h-10 px-6 rounded-xl gold-gradient text-white font-black italic uppercase text-[10px] shadow-lg">Trade Now</Button>
                        </td>
                      </tr>
                      {coins.map((coin) => (
                        <tr key={coin.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-1 shadow-sm border border-primary/5">
                                <Image src={coin.image} alt={coin.name} fill className="object-contain" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-accent uppercase tracking-tighter">{coin.symbol}/IDR</p>
                                <p className="text-[9px] text-muted-foreground font-black uppercase">{coin.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-accent italic">Rp {coin.current_price.toLocaleString('id-ID')}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className={cn(
                              "flex items-center gap-1 text-[10px] font-black uppercase",
                              coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-destructive"
                            )}>
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button 
                              onClick={() => router.push(`/crypto/trade/${coin.id}`)}
                              className="h-10 px-6 rounded-xl bg-white border border-primary/20 text-accent font-black italic uppercase text-[10px] shadow-md group-hover:gold-gradient group-hover:text-white transition-all"
                            >
                              Open Order
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* Sovereign Signature Activation */}
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6 border-t-4 border-primary">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-accent uppercase italic leading-tight">Verified Signature</h4>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Production Environment 2026</p>
                  </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-accent/5 border border-primary/5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Security Protocol</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-black text-accent italic uppercase">ECDSA p256 Active</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed uppercase">
                    Seluruh eksekusi koin ALIX menggunakan tanda tangan kedaulatan non-kustodial yang diverifikasi oleh node global AliBank.
                  </p>
                </div>

                <Button 
                  onClick={() => router.push('/admin?tab=tokenomics')}
                  className="w-full h-14 bg-accent text-white font-black uppercase italic rounded-2xl shadow-xl hover:bg-accent/90"
                >
                  Manage Supply Ledger
                </Button>
              </Card>

              {/* Verified Portfolio Card */}
              <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="w-20 h-20" /></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8">Asset Breakdown</h3>
                
                <div className="space-y-8 relative z-10">
                  <div>
                    <p className="text-[9px] font-bold text-white/60 uppercase">Consolidated Market Value</p>
                    <p className="text-4xl font-black italic tracking-tighter">Rp {(userData?.totalBalance || 0).toLocaleString()}</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sovereign Holdings</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10 group hover:border-primary/40 transition-all cursor-default">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center p-1.5"><LogoIcon className="text-white" /></div>
                          <span className="text-xs font-black italic">ALIX</span>
                        </div>
                        <span className="text-sm font-black italic">{(userData?.cryptoBalances?.ALIX || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-8 h-8 text-blue-400 bg-blue-400/10 rounded-lg p-1.5" />
                          <span className="text-xs font-black italic">ETH</span>
                        </div>
                        <span className="text-sm font-black italic">{parseFloat(onChainEth).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
