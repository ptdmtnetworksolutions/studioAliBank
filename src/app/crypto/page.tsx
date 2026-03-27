
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
  AlertTriangle
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
const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 

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

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=15&page=1&sparkline=false"
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setCoins(data);
      }
    } catch (err) {} finally { setLoading(false); }
  }, []);

  const fetchInternalBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(addr);
      setOnChainEth(formatEther(balance));
    } catch (err) {
      console.warn("RPC fetch failed", err);
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

  const handleActivateNativeWallet = async () => {
    if (!userDocRef || isActivatingWallet) return;
    setIsActivatingWallet(true);
    try {
      const newWallet = ethers.Wallet.createRandom();
      await updateDoc(userDocRef, {
        walletAddress: newWallet.address,
        privateKey: newWallet.privateKey
      });
      toast({ title: "Native Wallet Aktif", description: "Dompet internal AliBank berhasil dibuat." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsActivatingWallet(false);
    }
  };

  const showPrivateKey = () => {
    if (userData?.privateKey) {
      alert(`PRIVATE KEY ANDA (RAHASIA):\n\n${userData.privateKey}\n\nJangan pernah bagikan ini kepada siapa pun!`);
    } else {
      toast({ variant: "destructive", title: "Belum Aktif", description: "Aktifkan Native Signature terlebih dahulu." });
    }
  };

  if (!mounted) return null;

  const hasNativeSignature = !!userData?.privateKey;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa]">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-2.5">
                  <LogoIcon className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter flex items-center gap-3">
                  Exchange Center <Globe className="w-6 h-6 text-primary animate-pulse" />
                </h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest pl-1">
                AliBank Sovereign Infrastructure • Independent Web3 Node 2026
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.push('/crypto/trade/bitcoin')} className="h-12 px-8 rounded-2xl bg-accent text-white font-black uppercase italic shadow-xl">
                <Zap className="mr-2 w-4 h-4" /> Buka Terminal Pro
              </Button>
              {userData?.walletAddress ? (
                <div className="flex items-center gap-2">
                  <Badge className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg bg-primary text-white border-none flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> {userData.walletAddress.slice(0, 6)}...{userData.walletAddress.slice(-4)}
                  </Badge>
                  <Button onClick={() => router.push('/crypto/send')} variant="outline" className="h-12 w-12 rounded-2xl border-primary/20 text-primary flex items-center justify-center shadow-md">
                    <Send className="w-5 h-5" />
                  </Button>
                  <Button onClick={() => router.push('/crypto/receive')} variant="outline" className="h-12 w-12 rounded-2xl border-primary/20 text-primary flex items-center justify-center shadow-md">
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button onClick={handleActivateNativeWallet} disabled={isActivatingWallet} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl">
                  {isActivatingWallet ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Wallet2 className="mr-2 w-4 h-4" />} Aktifkan Native Wallet
                </Button>
              )}
            </div>
          </header>

          {!hasNativeSignature && userData?.walletAddress && (
            <Card className="mb-8 p-6 bg-destructive/5 border border-destructive/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-destructive uppercase italic">Keamanan Web3 Belum Lengkap</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                    Alamat dompet ada, namun kunci tanda tangan mandiri (Native Signature) belum aktif.
                  </p>
                </div>
              </div>
              <Button onClick={handleActivateNativeWallet} disabled={isActivatingWallet} className="w-full md:w-auto h-12 px-8 bg-destructive text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg">
                {isActivatingWallet ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />} 
                AKTIFKAN SIGNATURE SEKARANG
              </Button>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Wallet Header - Meta-style */}
              <Card className="rounded-[2.5rem] gold-gradient border-none p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-40 h-40" /></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">AliBank Sovereign Asset</p>
                      <h2 className="text-5xl font-black italic tracking-tighter mt-1">{parseFloat(onChainEth).toFixed(4)} ETH</h2>
                      <p className="text-xs font-bold opacity-80 mt-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-green-400" /> Mainnet Sync: Connected
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => router.push('/crypto/send')} className="bg-white text-primary rounded-xl font-black uppercase italic text-[10px] px-6 h-10 shadow-lg">Kirim Aset</Button>
                      <Button onClick={() => router.push('/crypto/receive')} className="bg-white/10 text-white border border-white/20 rounded-xl font-black uppercase italic text-[10px] px-6 h-10">Terima</Button>
                    </div>
                  </div>
                  <div className="bg-black/10 backdrop-blur-md rounded-3xl p-6 border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Native Web3 Node</p>
                      <ShieldCheck className={cn("w-4 h-4", hasNativeSignature ? "text-primary" : "text-destructive")} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] font-bold uppercase opacity-40">Alamat Dompet Mandiri</p>
                      <p className="text-[10px] font-black break-all leading-relaxed">{userData?.walletAddress || "Generating..."}</p>
                    </div>
                    <Button onClick={showPrivateKey} variant="ghost" className="w-full h-8 text-[8px] font-black uppercase text-white/40 hover:text-white hover:bg-white/5">
                      <Key className="w-3 h-3 mr-2" /> Backup Private Key
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-primary" /> Live Markets
                  </h3>
                  <Badge className="bg-primary/10 text-primary uppercase font-black text-[10px]">Mainnet Prices</Badge>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Pasangan Aset</th>
                        <th className="px-8 py-6">Harga Terakhir</th>
                        <th className="px-8 py-6">24h Perubahan</th>
                        <th className="px-8 py-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}><td colSpan={4} className="px-8 py-10 animate-pulse bg-primary/5" /></tr>
                        ))
                      ) : coins.map((coin) => (
                        <tr key={coin.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-1 shadow-sm">
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
                              className="h-10 px-6 rounded-xl gold-gradient text-white font-black italic uppercase text-[10px] shadow-lg group-hover:scale-105 transition-all"
                            >
                              Trade Now
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
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-accent uppercase italic">AliBank Signature</h4>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Independent Infrastructure</p>
                  </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-accent/5 border border-primary/5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Status Jaringan</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-black text-accent italic uppercase">Global Node Aktif</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed">
                    Aplikasi ini menggunakan teknologi signing mandiri. Anda tidak lagi membutuhkan MetaMask untuk menandatangani transaksi. Semua dikelola aman oleh AliBank V3 Node.
                  </p>
                </div>

                <Button 
                  onClick={() => router.push('/admin?tab=vault')}
                  className="w-full h-12 bg-accent text-white font-black uppercase italic rounded-xl shadow-lg hover:bg-accent/90"
                >
                  Kelola Brankas V3
                </Button>
              </Card>

              <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><PieChart className="w-20 h-20" /></div>
                <h3 className="text-xs font-black uppercase tracking-widest text-primary mb-8">Portofolio Saya</h3>
                
                <div className="space-y-8 relative z-10">
                  <div>
                    <p className="text-[9px] font-bold text-white/60 uppercase">Estimasi Saldo Total</p>
                    <p className="text-4xl font-black italic tracking-tighter">Rp {(userData?.totalBalance || 0).toLocaleString()}</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Aset Digital</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Bitcoin className="w-5 h-5 text-orange-400" />
                          <span className="text-xs font-black italic">BTC</span>
                        </div>
                        <span className="text-sm font-black italic">{(userData?.cryptoBalances?.BTC || 0).toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 rounded-2xl bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3">
                          <Cpu className="w-5 h-5 text-blue-400" />
                          <span className="text-xs font-black italic">ETH</span>
                        </div>
                        <span className="text-sm font-black italic">{(userData?.cryptoBalances?.ETH || 0).toFixed(4)}</span>
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
