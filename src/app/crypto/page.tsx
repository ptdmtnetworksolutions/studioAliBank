
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Wallet,
  Loader2,
  ArrowDownCircle,
  Globe,
  Zap,
  Sparkles,
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
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BrowserProvider, formatEther, Contract, parseEther, JsonRpcProvider } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, limit } from "firebase/firestore";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  ChartTooltip,
  CartesianGrid 
} from "recharts";
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
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getTotalVaultBalance() public view returns (uint256)",
  "function owner() public view returns (address)"
];

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
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Wallet states
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [usingGlobalNode, setUsingGlobalNode] = useState(true);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=15&page=1&sparkline=false"
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setCoins(data);
        if (!selectedCoin) setSelectedCoin(data[0]);
      }
    } catch (err) {} finally { setLoading(false); }
  }, [selectedCoin]);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
  }, [fetchMarketData]);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const checkBalances = useCallback(async (walletAddr: string) => {
    if (!walletAddr) return;
    try {
      let provider;
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        provider = new BrowserProvider(window.ethereum);
        setUsingGlobalNode(false);
      } else {
        provider = new JsonRpcProvider(GLOBAL_RPC);
        setUsingGlobalNode(true);
      }

      const ethBalance = await provider.getBalance(walletAddr).catch(() => 0n);
      setWalletBalance(formatEther(ethBalance));
      
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const vBalance = await contract.balances(walletAddr).catch(() => 0n);
      setVaultBalance(formatEther(vBalance));
    } catch (err) {
      console.warn("Gagal mengecek saldo via RPC:", err);
    }
  }, []);

  useEffect(() => {
    if (mounted && user) {
      if (userData?.walletAddress) {
        setAddress(userData.walletAddress);
        checkBalances(userData.walletAddress);
      } else if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
          if (Array.isArray(accounts) && accounts.length > 0) {
            setAddress(accounts[0]);
            checkBalances(accounts[0]);
          }
        }).catch(() => {});
      }
    }
  }, [mounted, user, userData?.walletAddress, checkBalances]);

  const handleConnectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "MetaMask Diperlukan", description: "Gunakan browser MetaMask di HP untuk otorisasi transaksi." });
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await checkBalances(accounts[0]);
      }
    } catch (err: any) {}
  };

  const handleKelolaBrankas = () => {
    if (user?.email === OWNER_EMAIL) {
      router.push('/admin?tab=vault');
    } else {
      toast({ 
        title: "Akses Terbatas", 
        description: "Brankas V3 adalah fitur infrastruktur elit. Silakan hubungi admin AliBank untuk partisipasi staking institusional." 
      });
    }
  };

  if (!mounted) return null;

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
                  Exchange Center <Globe className={cn("w-6 h-6 text-primary", usingGlobalNode ? "animate-pulse" : "")} />
                </h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest pl-1">
                AliBank Global Liquidity Engine • Real-Time Market Execution
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => router.push('/crypto/trade/bitcoin')} className="h-12 px-8 rounded-2xl bg-accent text-white font-black uppercase italic shadow-xl">
                <Zap className="mr-2 w-4 h-4" /> Buka Terminal Pro
              </Button>
              {address ? (
                <Badge className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg bg-green-600 text-white border-none">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Badge>
              ) : (
                <Button onClick={handleConnectWallet} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl">
                  <Wallet className="mr-2 w-4 h-4" /> Konek Wallet
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Asset Performance Side */}
            <div className="lg:col-span-8 space-y-8">
              {/* Market Overview Table */}
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

              {/* Security & DeFi Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-accent uppercase italic tracking-tighter">Custody Aman V3</h4>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">Aset Anda diamankan dengan teknologi smart contract multi-sig yang terverifikasi di Mainnet.</p>
                </Card>
                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <Zap className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-accent uppercase italic tracking-tighter">Eksekusi Instan</h4>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">Terminal trading pro AliBank menggunakan orderbook hybrid untuk likuiditas tak terbatas.</p>
                </Card>
              </div>
            </div>

            {/* Portfolio & Vault Side */}
            <div className="lg:col-span-4 space-y-8">
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

                  <Button onClick={() => router.push('/topup')} className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl">
                    Deposit IDR
                  </Button>
                </div>
              </Card>

              {/* Vault Section */}
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-accent uppercase italic">Brankas V3</h4>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">On-Chain Yield Bearing</p>
                  </div>
                </div>
                
                <div className="p-6 rounded-2xl bg-accent/5 border border-primary/5 space-y-1 text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Saldo Staking Mainnet</p>
                  <p className="text-2xl font-black text-accent italic">{parseFloat(vaultBalance).toFixed(4)} ETH</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground uppercase">APY Tahunan</span>
                    <span className="text-green-600">4.85%</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-muted-foreground uppercase">Status Node</span>
                    <span className="text-primary italic">Connected</span>
                  </div>
                </div>

                <Button 
                  onClick={handleKelolaBrankas}
                  className="w-full h-12 bg-accent text-white font-black uppercase italic rounded-xl shadow-lg hover:bg-accent/90"
                >
                  Kelola Brankas
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
