
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
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo, useCallback } from "react";
import { BrowserProvider, formatEther, Contract, parseEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, orderBy, limit } from "firebase/firestore";
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

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getTotalVaultBalance() public view returns (uint256)",
  "function depositTimestamps(address) public view returns (uint256)",
  "function owner() public view returns (address)"
];

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

  // Swap states
  const [swapAmount, setSwapAmount] = useState("");
  const [swapDirection, setSwapDirection] = useState<'buy' | 'sell'>('buy');

  const generateChartData = (basePrice: number) => {
    const points = Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
    }));
    setChartData(points);
  };

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=15&page=1&sparkline=false",
        { signal: AbortSignal.timeout(10000) }
      );
      
      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setCoins(data);
        if (!selectedCoin) {
          setSelectedCoin(data[0]);
          generateChartData(data[0].current_price);
        }
      }
    } catch (err) {
      console.warn("Market fetch handled error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCoin]);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const transactionsQuery = useMemo(() => (!db || !user) ? null : query(
    collection(db, "users", user.uid, "transactions"),
    where("category", "in", ["Trading", "Bridge", "Swap"]),
    orderBy("timestamp", "desc"),
    limit(10)
  ), [db, user]);
  const { data: historyData } = useCollection(transactionsQuery);

  const checkBalances = useCallback(async (walletAddr: string) => {
    if (typeof window.ethereum === 'undefined' || !walletAddr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1n) { setIsWrongNetwork(true); } else { setIsWrongNetwork(false); }
      
      const ethBalance = await provider.getBalance(walletAddr);
      setWalletBalance(formatEther(ethBalance));
      
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const vBalance = await contract.balances(walletAddr).catch(() => 0n);
      setVaultBalance(formatEther(vBalance));
    } catch (err) {
      console.error("Balance Check Error:", err);
    }
  }, []);

  useEffect(() => {
    if (mounted && user && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          checkBalances(accounts[0]);
        }
      });
    }
  }, [mounted, user, checkBalances]);

  const handleVaultAction = async (action: 'deposit' | 'withdraw') => {
    if (!address || !bridgeAmount || !user || !db) return;
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = action === 'deposit' 
        ? await contract.deposit({ value: parseEther(bridgeAmount) })
        : await contract.withdraw(parseEther(bridgeAmount));
        
      toast({ title: "Transaksi Terkirim", description: "Menunggu konfirmasi blockchain..." });
      await tx.wait();
      
      const txRef = collection(db, "users", user.uid, "transactions");
      const logPayload = {
        date: new Date().toISOString(),
        description: `${action === 'deposit' ? 'Staking' : 'Penarikan'} Vault V3`,
        category: "Bridge",
        cryptoAmount: parseFloat(bridgeAmount),
        cryptoCurrency: "ETH",
        type: action === 'deposit' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      };
      
      addDoc(txRef, logPayload);

      toast({ title: "Berhasil!", description: `Aset telah berhasil ${action === 'deposit' ? 'disimpan di' : 'ditarik dari'} Vault V3.` });
      setBridgeAmount("");
      await checkBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally { setIsProcessing(false); }
  };

  const handleSwap = async () => {
    if (!user || !db || !userData || !selectedCoin || !swapAmount) return;
    const amount = parseFloat(swapAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    const price = selectedCoin.current_price;
    const assetKey = selectedCoin.symbol.toUpperCase();
    const userRef = doc(db, "users", user.uid);
    
    try {
      if (swapDirection === 'buy') {
        if (userData.totalBalance < amount) {
          toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Saldo IDR Anda tidak mencukupi untuk melakukan swap ini." });
          setIsProcessing(false);
          return;
        }
        const qty = amount / price;
        const payload = { 
          totalBalance: increment(-amount),
          [`cryptoBalances.${assetKey}`]: increment(qty)
        };
        updateDoc(userRef, payload).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: payload })));
        
        addDoc(collection(db, "users", user.uid, "transactions"), {
          date: new Date().toISOString(),
          description: `Swap IDR ke ${assetKey}`,
          category: "Swap",
          amount: amount,
          cryptoAmount: qty,
          cryptoCurrency: assetKey,
          type: 'expense',
          status: "success",
          timestamp: serverTimestamp()
        });
      } else {
        const currentQty = userData.cryptoBalances?.[assetKey] || 0;
        if (currentQty < amount) {
          toast({ variant: "destructive", title: "Saldo Aset Tidak Cukup", description: `Saldo ${assetKey} Anda tidak mencukupi.` });
          setIsProcessing(false);
          return;
        }
        const idrValue = amount * price;
        const payload = { 
          totalBalance: increment(idrValue),
          [`cryptoBalances.${assetKey}`]: increment(-amount)
        };
        updateDoc(userRef, payload).catch(e => errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: payload })));

        addDoc(collection(db, "users", user.uid, "transactions"), {
          date: new Date().toISOString(),
          description: `Swap ${assetKey} ke IDR`,
          category: "Swap",
          amount: idrValue,
          cryptoAmount: amount,
          cryptoCurrency: assetKey,
          type: 'income',
          status: "success",
          timestamp: serverTimestamp()
        });
      }

      addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Swap Berhasil",
        message: `Pertukaran aset senilai ${swapDirection === 'buy' ? 'Rp ' + amount.toLocaleString() : amount + ' ' + assetKey} telah selesai.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Swap Berhasil", description: "Saldo Anda telah diperbarui secara instan." });
      setSwapAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const totalEstimatedValue = useMemo(() => {
    if (!userData || !coins.length) return 0;
    
    let cryptoValue = 0;
    const balances = userData.cryptoBalances || {};
    
    Object.entries(balances).forEach(([symbol, qty]) => {
      const coin = coins.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
      if (coin) {
        cryptoValue += (qty as number) * coin.current_price;
      }
    });

    const ethCoin = coins.find(c => c.symbol.toUpperCase() === 'ETH');
    if (ethCoin) {
      cryptoValue += parseFloat(walletBalance) * ethCoin.current_price;
      cryptoValue += parseFloat(vaultBalance) * ethCoin.current_price;
    }

    return (userData.totalBalance || 0) + cryptoValue;
  }, [userData, coins, walletBalance, vaultBalance]);

  if (!mounted) return null;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa] selection:bg-primary/20">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-2.5">
                  <LogoIcon className="text-white" />
                </div>
                <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter flex items-center gap-3">
                  DeFi Central <Globe className="w-6 h-6 animate-pulse text-primary" />
                </h1>
              </div>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest pl-1">V3 Mainnet Infrastructure • Staking Foundation • Real-Time Arbitrage</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {address ? (
                <Badge className={cn(
                  "h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg transition-all",
                  isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white"
                )}>
                  {isWrongNetwork ? "Switch to Mainnet" : `${address.slice(0, 6)}...${address.slice(-4)}`}
                </Badge>
              ) : (
                <Button className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl hover:scale-105 transition-all">
                  <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
                </Button>
              )}
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white h-[600px] flex flex-col">
                <div className="p-6 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                      <LayoutGrid className="w-4 h-4 text-primary" /> Market List
                    </h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                        <p className="text-[10px] font-bold">Daftar harga aset kripto global secara real-time. Klik aset untuk melihat grafik dan mulai trading.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-primary/5">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="p-4 animate-pulse bg-primary/5 h-16" />
                    ))
                  ) : coins.length > 0 ? coins.map((coin) => (
                    <button 
                      key={coin.id} 
                      onClick={() => {
                        setSelectedCoin(coin);
                        generateChartData(coin.current_price);
                      }}
                      className={cn(
                        "w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-left",
                        selectedCoin?.id === coin.id && "bg-primary/5 border-l-4 border-primary"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white shadow-sm">
                          <Image src={coin.image} alt={coin.name} fill className="object-contain p-1" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-accent uppercase tracking-tighter">{coin.symbol}/IDR</p>
                          <p className={cn("text-[9px] font-bold", coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-destructive")}>
                            {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] font-black text-accent italic">
                        {coin.current_price.toLocaleString('id-ID')}
                      </p>
                    </button>
                  )) : (
                    <div className="p-10 text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">API limit or network error.</p>
                      <Button variant="ghost" size="sm" onClick={fetchMarketData} className="mt-2 h-8 text-[9px] font-black uppercase"><RefreshCw className="w-3 h-3 mr-2" /> Retry</Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            <div className="lg:col-span-6 space-y-6">
              <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative h-[400px]">
                <div className="absolute top-6 left-8 z-10 flex justify-between w-[calc(100%-4rem)] items-start">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-black text-accent uppercase italic flex items-center gap-2">
                        {selectedCoin?.name || "Market"} Feed <TrendingUp className="w-4 h-4 text-primary" />
                      </h3>
                      <p className="text-2xl font-black text-primary italic mt-1">
                        Rp {selectedCoin?.current_price.toLocaleString('id-ID') || "---"}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground/40 cursor-help mt-1" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                        <p className="text-[10px] font-bold">Grafik performa harga aset dalam 24 jam terakhir. Gunakan untuk menganalisis tren pasar sebelum trading.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {selectedCoin && (
                    <Button 
                      onClick={() => router.push(`/crypto/trade/${selectedCoin.id}`)}
                      className="rounded-xl gold-gradient text-white font-black italic uppercase text-[10px] h-10 px-6 shadow-lg"
                    >
                      Go to Terminal <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
                <CardContent className="pt-28 h-full px-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin * 0.99', 'dataMax * 1.01']} />
                      <ChartTooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                        formatter={(v: any) => [`Rp ${Math.round(v).toLocaleString('id-ID')}`, 'Price']} 
                      />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Tabs defaultValue="vault" className="w-full">
                <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-3">
                  <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px]">Vault V3</TabsTrigger>
                  <TabsTrigger value="swap" className="rounded-[1.5rem] font-black uppercase text-[10px]">Quick Swap</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-[1.5rem] font-black uppercase text-[10px]">Audit</TabsTrigger>
                </TabsList>

                <TabsContent value="vault" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">V3 Infrastructure Controls</h4>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3 h-3 text-primary/40 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                          <p className="text-[10px] font-bold">Simpan aset ETH Anda di Smart Contract V3 untuk mendapatkan yield pasif harian tanpa kehilangan kepemilikan aset.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-8 rounded-[2rem] liquid-glass-dark text-white text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Vault Balance</p>
                        <p className="text-4xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(4)} ETH</p>
                        <Badge className="bg-primary/20 text-primary mt-2">Yield APY: 4.85%</Badge>
                      </div>
                      <div className="p-8 rounded-[2rem] bg-accent/5 border border-primary/5 text-center space-y-2 flex flex-col justify-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Balance</p>
                        <p className="text-2xl font-black text-accent italic">{parseFloat(walletBalance).toFixed(4)} ETH</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Connected MetaMask</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-primary/40">ETH</span>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={bridgeAmount} 
                          onChange={(e) => setBridgeAmount(e.target.value)} 
                          className="h-16 pl-16 rounded-2xl liquid-glass border-none text-lg font-black italic focus:ring-primary/20" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleVaultAction('deposit')} 
                          disabled={isProcessing || !bridgeAmount} 
                          className="h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
                        >
                          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Stake Asset"}
                        </Button>
                        <Button 
                          onClick={() => handleVaultAction('withdraw')} 
                          variant="outline" 
                          disabled={isProcessing || !bridgeAmount} 
                          className="h-14 border-primary/20 text-primary font-black italic uppercase rounded-2xl hover:bg-primary/5"
                        >
                          Unstake Asset
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="swap" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">AliBank Quick Swap</h4>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-primary/40 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                            <p className="text-[10px] font-bold">Tukar saldo IDR dengan koin pilihan Anda secara instan. Saldo akan langsung terpotong/bertambah di profil AliBank Anda.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSwapDirection(swapDirection === 'buy' ? 'sell' : 'buy')}
                        className="h-8 rounded-xl text-[9px] font-black uppercase gap-2 hover:bg-primary/10"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" /> Toggle Direction
                      </Button>
                    </div>

                    {/* Balance Summary in Swap Tab */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex flex-col items-center">
                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Saldo IDR</p>
                        <p className="text-sm font-black text-accent">Rp {userData?.totalBalance?.toLocaleString() || "0"}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 flex flex-col items-center">
                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Saldo {selectedCoin?.symbol.toUpperCase() || 'Asset'}</p>
                        <p className="text-sm font-black text-primary">
                          {(userData?.cryptoBalances?.[selectedCoin?.symbol.toUpperCase() || ''] || 0).toFixed(selectedCoin?.symbol.toUpperCase() === 'BTC' ? 8 : 4)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 mb-1 block">
                          {swapDirection === 'buy' ? 'Bayar dengan IDR' : `Tukar dari ${selectedCoin?.symbol.toUpperCase() || 'Asset'}`}
                        </label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-primary/40">
                            {swapDirection === 'buy' ? 'Rp' : selectedCoin?.symbol.toUpperCase()}
                          </span>
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={swapAmount}
                            onChange={(e) => setSwapAmount(e.target.value)}
                            className="h-16 pl-20 rounded-2xl liquid-glass border-none text-lg font-black italic" 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col items-center py-2">
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-white shadow-lg">
                          <ArrowRightLeft className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                          <span className="text-muted-foreground">Estimasi Diterima</span>
                          <span className="text-accent italic">
                            {swapDirection === 'buy' 
                              ? ((parseFloat(swapAmount) || 0) / (selectedCoin?.current_price || 1)).toFixed(6) + ' ' + selectedCoin?.symbol.toUpperCase()
                              : 'Rp ' + ((parseFloat(swapAmount) || 0) * (selectedCoin?.current_price || 0)).toLocaleString()
                            }
                          </span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSwap}
                        disabled={isProcessing || !swapAmount}
                        className="w-full h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Eksekusi Swap Instan"}
                      </Button>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
                  <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
                    <div className="divide-y divide-primary/5">
                      {historyData && historyData.length > 0 ? historyData.map((tx, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                            )}>
                              {tx.category === 'Bridge' ? <ArrowDownCircle className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="text-xs font-black text-accent uppercase">{tx.description}</p>
                              <p className="text-[9px] text-muted-foreground font-bold">{new Date(tx.date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className={cn("text-sm font-black italic", tx.type === 'income' ? "text-green-600" : "text-accent")}>
                            {tx.type === 'income' ? '+' : '-'}{tx.cryptoAmount ? `${tx.cryptoAmount.toFixed(4)} ${tx.cryptoCurrency}` : `Rp ${tx.amount?.toLocaleString()}`}
                          </p>
                        </div>
                      )) : (
                        <div className="p-20 text-center">
                          <History className="w-10 h-10 text-primary/10 mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase text-muted-foreground">No DeFi history detected.</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="lg:col-span-3 space-y-6">
              {/* Active Asset Portfolio Card */}
              <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><PieChart className="w-20 h-20" /></div>
                <div className="flex items-center gap-2 mb-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Portfolio Insight
                  </h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-primary/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                      <p className="text-[10px] font-bold">Ringkasan total kekayaan Anda yang menggabungkan saldo IDR internal dan nilai aset kripto Mainnet secara real-time.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Estimated Total Value</p>
                    <p className="text-3xl font-black italic tracking-tighter text-white">
                      Rp {totalEstimatedValue.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="space-y-5">
                    <div className="flex justify-between items-center group/item cursor-help">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-bold text-white/60 uppercase">IDR Liquidity</span>
                      </div>
                      <span className="text-xs font-black italic">Rp {userData?.totalBalance?.toLocaleString() || "0"}</span>
                    </div>

                    <div className="flex justify-between items-center group/item cursor-help">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        <span className="text-[10px] font-bold text-white/60 uppercase">Ethereum (ETH)</span>
                      </div>
                      <span className="text-xs font-black italic">
                        {( (userData?.cryptoBalances?.ETH || 0) + parseFloat(walletBalance) + parseFloat(vaultBalance) ).toFixed(4)} ETH
                      </span>
                    </div>

                    {userData?.cryptoBalances?.BTC > 0 && (
                      <div className="flex justify-between items-center group/item">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                          <span className="text-[10px] font-bold text-white/60 uppercase">Bitcoin (BTC)</span>
                        </div>
                        <span className="text-xs font-black italic">{(userData?.cryptoBalances?.BTC || 0).toFixed(6)} BTC</span>
                      </div>
                    )}

                    {userData?.cryptoBalances?.USDT > 0 && (
                      <div className="flex justify-between items-center group/item">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-[10px] font-bold text-white/60 uppercase">Tether (USDT)</span>
                        </div>
                        <span className="text-xs font-black italic">Rp {(userData?.cryptoBalances?.USDT || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <Button className="w-full h-12 gold-gradient text-white rounded-2xl font-black uppercase italic text-[10px] shadow-lg hover:scale-[1.02] transition-transform">
                    Optimize Yield <Zap className="w-3 h-3 ml-2" />
                  </Button>
                </div>
              </Card>

              <Card className="liquid-glass rounded-[2rem] p-6 space-y-4 border-primary/10">
                <div className="flex items-center gap-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Security Layer V3
                  </h4>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-primary/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                      <p className="text-[10px] font-bold">Sistem keamanan multi-sig dan audit kontrak pintar yang memastikan aset DeFi Anda terlindungi dari ancaman siber.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                      <Lock className="w-4 h-4" />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Contract Audited by OpenZeppelin Standard</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Zap className="w-4 h-4" />
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">Instant Bridge Settlement Active</p>
                  </div>
                </div>
              </Card>

              <Card className="liquid-glass rounded-[2rem] p-6 space-y-4 border-primary/10 bg-primary/5">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2 italic">
                  <BarChart3 className="w-4 h-4 text-primary" /> AI Market Logic
                </h4>
                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                  "Berdasarkan volatilitas saat ini, aset ETH menunjukkan pola akumulasi yang kuat di atas support V3."
                </p>
                <Button 
                  onClick={() => router.push('/ai-assistant')}
                  variant="ghost" 
                  className="w-full text-[9px] font-black uppercase text-primary hover:bg-transparent p-0 flex items-center justify-start gap-1"
                >
                  Detail Intelligence <ChevronRight className="w-3 h-3" />
                </Button>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
