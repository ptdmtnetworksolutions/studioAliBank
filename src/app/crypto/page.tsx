
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
  Tooltip as ChartTooltip,
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
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const GLOBAL_RPC = "https://cloudflare-eth.com";
const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 

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
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Wallet states
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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
    try {
      let provider;
      if (typeof window.ethereum !== 'undefined' && walletAddr) {
        provider = new BrowserProvider(window.ethereum);
        setUsingGlobalNode(false);
      } else {
        provider = new JsonRpcProvider(GLOBAL_RPC);
        setUsingGlobalNode(true);
      }

      if (walletAddr) {
        const ethBalance = await provider.getBalance(walletAddr);
        setWalletBalance(formatEther(ethBalance));
        
        const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
        const vBalance = await contract.balances(walletAddr).catch(() => 0n);
        setVaultBalance(formatEther(vBalance));
      }
    } catch (err) {
      console.error("Balance Check Error:", err);
    }
  }, []);

  useEffect(() => {
    if (mounted && user) {
      // Jika ada wallet internal di database, cek saldonya via Global Node RPC
      if (userData?.walletAddress) {
        setAddress(userData.walletAddress);
        checkBalances(userData.walletAddress);
      } else if (typeof window.ethereum !== 'undefined') {
        window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
          if (accounts.length > 0) {
            setAddress(accounts[0]);
            checkBalances(accounts[0]);
          }
        });
      }
    }
  }, [mounted, user, userData?.walletAddress, checkBalances]);

  const handleConnectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "MetaMask Diperlukan", description: "Gunakan browser MetaMask di HP untuk otorisasi transaksi." });
      return;
    }
    setIsConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        await checkBalances(accounts[0]);
      }
    } catch (err: any) {} finally { setIsConnecting(false); }
  };

  const handleVaultAction = async (action: 'deposit' | 'withdraw') => {
    if (!address) { await handleConnectWallet(); return; }
    if (!bridgeAmount) return;
    
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = action === 'deposit' 
        ? await contract.deposit({ value: parseEther(bridgeAmount) })
        : await contract.withdraw(parseEther(bridgeAmount));
        
      toast({ title: "Transaksi Terkirim", description: "Menunggu konfirmasi blockchain..." });
      await tx.wait();
      
      const txRef = collection(db!, "users", user!.uid, "transactions");
      addDoc(txRef, {
        date: new Date().toISOString(),
        description: `${action === 'deposit' ? 'Staking' : 'Penarikan'} Vault V3`,
        category: "Bridge",
        cryptoAmount: parseFloat(bridgeAmount),
        cryptoCurrency: "ETH",
        type: action === 'deposit' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      toast({ title: "Berhasil!", description: `Aset telah diamankan di Brankas.` });
      setBridgeAmount("");
      await checkBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally { setIsProcessing(false); }
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
                  DeFi Central <Globe className={cn("w-6 h-6 text-primary", usingGlobalNode ? "animate-pulse" : "")} />
                </h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest pl-1">
                {usingGlobalNode ? "Powered by AliBank Global Node Architecture (Independent of MetaMask)" : "Connected via Local Provider Interface"}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {address ? (
                <Badge className="h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg bg-green-600 text-white">
                  {address.slice(0, 6)}...{address.slice(-4)}
                </Badge>
              ) : (
                <Button onClick={handleConnectWallet} disabled={isConnecting} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl">
                  {isConnecting ? <Loader2 className="animate-spin mr-2" /> : <Wallet className="mr-2" />} Konek Wallet
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Market List Column */}
            <div className="lg:col-span-3">
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white h-[600px] flex flex-col">
                <div className="p-6 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" /> Market List
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-primary/5">
                  {coins.map((coin) => (
                    <button key={coin.id} onClick={() => setSelectedCoin(coin)} className={cn("w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-left", selectedCoin?.id === coin.id && "bg-primary/5 border-l-4 border-primary")}>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm">
                          <Image src={coin.image} alt={coin.name} fill className="object-contain p-1" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-accent uppercase tracking-tighter">{coin.symbol}/IDR</p>
                          <p className={cn("text-[9px] font-bold", coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-destructive")}>{coin.price_change_percentage_24h.toFixed(2)}%</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-accent italic">{coin.current_price.toLocaleString('id-ID')}</p>
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* Trading & Tabs Column */}
            <div className="lg:col-span-6 space-y-6">
              <Tabs defaultValue="vault" className="w-full">
                <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-3">
                  <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px]">Brankas V3</TabsTrigger>
                  <TabsTrigger value="bridge" className="rounded-[1.5rem] font-black uppercase text-[10px]">Bridge Out</TabsTrigger>
                  <TabsTrigger value="audit" className="rounded-[1.5rem] font-black uppercase text-[10px]">Audit</TabsTrigger>
                </TabsList>

                <TabsContent value="vault" className="mt-6">
                  <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 rounded-[2rem] liquid-glass-dark text-white text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Vault Balance</p>
                        <p className="text-4xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(4)} ETH</p>
                        <Badge className="bg-primary/20 text-primary mt-2">Yield APY: 4.85%</Badge>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-accent/5 border border-primary/5 text-center space-y-2 flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Balance</p>
                        <p className="text-2xl font-black text-accent italic">{parseFloat(walletBalance).toFixed(4)} ETH</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Real-Time Sync</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-primary/40">ETH</span>
                        <Input type="number" placeholder="0.00" value={bridgeAmount} onChange={(e) => setBridgeAmount(e.target.value)} className="h-16 pl-16 rounded-2xl liquid-glass border-none text-lg font-black italic" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button onClick={() => handleVaultAction('deposit')} disabled={isProcessing || !bridgeAmount} className="h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl">
                          {isProcessing ? <Loader2 className="animate-spin" /> : "Stake Asset"}
                        </Button>
                        <Button onClick={() => handleVaultAction('withdraw')} variant="outline" disabled={isProcessing || !bridgeAmount} className="h-14 border-primary/20 text-primary font-black italic uppercase rounded-2xl">
                          Unstake
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Global Node Insight
                  </h4>
                </div>
                <p className="text-[11px] font-bold text-white/80 leading-relaxed italic mb-6">
                  "AliBank mengintegrasikan Node RPC independen untuk memastikan saldo Anda tetap akurat tanpa tergantung pada provider wallet lokal."
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
                    <span>STATUS NODE</span>
                    <span className="text-green-400">AKTIF (GLOBAL)</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-white/60">
                    <span>UPTIME</span>
                    <span>99.99%</span>
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
