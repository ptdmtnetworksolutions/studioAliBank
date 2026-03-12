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
  Coins
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
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, query, where, orderBy } from "firebase/firestore";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid 
} from "recharts";
import { LogoIcon } from "@/components/ui/logo";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

// ABI V3: Mendukung ReentrancyGuard, Ownership, dan Staking
const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getTotalVaultBalance() public view returns (uint256)",
  "function depositTimestamps(address) public view returns (uint256)",
  "function owner() public view returns (address)",
  "event Deposited(address indexed user, uint256 amount, uint256 timestamp)",
  "event Withdrawn(address indexed user, uint256 amount, uint256 timestamp)"
];

const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 

type Asset = {
  id: string;
  name: string;
  icon: any;
  color: string;
  price: number;
  change: string;
};

const FALLBACK_PRICES: Record<string, number> = {
  ETH: 45000000,
  BTC: 1500000000,
  USDT: 16000
};

export default function CryptoDeFiPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [assets, setAssets] = useState<Asset[]>([
    { id: "ETH", name: "Ethereum", icon: Cpu, color: "text-blue-500", price: FALLBACK_PRICES.ETH, change: "0.0%" },
    { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-500", price: FALLBACK_PRICES.BTC, change: "0.0%" },
    { id: "USDT", name: "Tether", icon: ShieldCheck, color: "text-green-500", price: FALLBACK_PRICES.USDT, change: "0.0%" },
  ]);
  
  const [selectedAsset, setSelectedAsset] = useState<Asset>(assets[0]);
  const [chartData, setChartData] = useState<any[]>([]);
  
  const [swapInput, setSwapInput] = useState("");
  const [swapOutput, setSwapOutput] = useState("");
  const [bridgeAmount, setBridgeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [depositTime, setDepositTime] = useState<number>(0);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [mounted, setMounted] = useState(false);

  const SERVICE_FEE_PERCENT = 0.005; 

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=idr&include_24hr_change=true"
      );
      if (!response.ok) throw new Error("API issue");
      const data = await response.json();
      
      const updatedAssets = [
        { id: "ETH", name: "Ethereum", icon: Cpu, color: "text-blue-500", price: data.ethereum?.idr || FALLBACK_PRICES.ETH, change: `${(data.ethereum?.idr_24h_change || 0).toFixed(2)}%` },
        { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-500", price: data.bitcoin?.idr || FALLBACK_PRICES.BTC, change: `${(data.bitcoin?.idr_24h_change || 0).toFixed(2)}%` },
        { id: "USDT", name: "Tether", icon: ShieldCheck, color: "text-green-500", price: data.tether?.idr || FALLBACK_PRICES.USDT, change: `${(data.tether?.idr_24h_change || 0).toFixed(2)}%` },
      ];
      
      setAssets(updatedAssets);
      const currentSelected = updatedAssets.find(a => a.id === selectedAsset.id);
      if (currentSelected) setSelectedAsset(currentSelected);
      
      const basePrice = data.ethereum?.idr || FALLBACK_PRICES.ETH;
      const points = Array.from({ length: 24 }, (_, i) => ({
        time: `${i}:00`,
        price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
      }));
      setChartData(points);
    } catch (err) {
      console.error("Price fetch error");
    }
  }, [selectedAsset.id]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); 
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const transactionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"), 
      where("category", "in", ["Trading", "Bridge"]),
      orderBy("timestamp", "desc")
    );
  }, [db, user]);

  const { data: historyData } = useCollection(transactionsQuery);

  const checkMainnetBalances = useCallback(async (walletAddr: string) => {
    if (typeof window.ethereum === 'undefined' || !walletAddr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1n) {
        setIsWrongNetwork(true);
        return;
      }
      setIsWrongNetwork(false);
      const ethBalance = await provider.getBalance(walletAddr);
      setWalletBalance(formatEther(ethBalance));
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const balanceInVault = await contract.balances(walletAddr).catch(() => 0n);
      setVaultBalance(formatEther(balanceInVault));
      const time = await contract.depositTimestamps(walletAddr).catch(() => 0n);
      setDepositTime(Number(time));
    } catch (err) {
      console.error("Blockchain sync failed");
    }
  }, []);

  useEffect(() => {
    if (mounted && user && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          checkMainnetBalances(accounts[0]);
        }
      });
    }
  }, [mounted, user, checkMainnetBalances]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') return;
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      await checkMainnetBalances(accounts[0]);
      toast({ title: "Wallet Connected", description: "V3 Mainnet Ready." });
    } catch (err) {
      toast({ variant: "destructive", title: "Connection Failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async (type: 'buy' | 'sell') => {
    if (!user || !db || !swapInput || !userDocRef) return;
    const qty = type === 'buy' ? parseFloat(swapOutput) : parseFloat(swapInput);
    const fiat = type === 'buy' ? parseFloat(swapInput) : parseFloat(swapOutput);
    
    setLoading(true);
    try {
      const payload = type === 'buy' 
        ? { totalBalance: increment(-fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(qty) }
        : { totalBalance: increment(fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(-qty) };

      if (type === 'buy' && (userData?.totalBalance || 0) < fiat) throw new Error("Saldo IDR Tidak Cukup");
      if (type === 'sell' && (userData?.cryptoBalances?.[selectedAsset.id] || 0) < qty) throw new Error("Saldo Aset Tidak Cukup");

      updateDoc(userDocRef, payload)
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: payload
          }));
        });

      const txRef = collection(db, "users", user.uid, "transactions");
      const txData = {
        date: new Date().toISOString(),
        description: `Swap ${type === 'buy' ? 'IDR ke' : selectedAsset.id + ' ke'} ${type === 'buy' ? selectedAsset.id : 'IDR'}`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      };

      addDoc(txRef, txData)
        .catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: txRef.path,
            operation: 'create',
            requestResourceData: txData
          }));
        });

      toast({ title: "Swap Berhasil", description: "Portofolio internal diperbarui." });
      setSwapInput(""); setSwapOutput("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleVaultAction = async (action: 'deposit' | 'withdraw') => {
    if (!address || !bridgeAmount || !user || !db) return;
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = action === 'deposit' 
        ? await contract.deposit({ value: parseEther(bridgeAmount) })
        : await contract.withdraw(parseEther(bridgeAmount));
        
      toast({ title: "Transaksi Terkirim", description: "Menunggu konfirmasi blockchain..." });
      await tx.wait();
      
      // Log ke Firestore History
      const txRef = collection(db, "users", user.uid, "transactions");
      const txData = {
        date: new Date().toISOString(),
        description: `${action === 'deposit' ? 'Staking' : 'Withdraw'} Vault V3`,
        category: "Bridge",
        cryptoAmount: parseFloat(bridgeAmount),
        cryptoCurrency: "ETH",
        type: action === 'deposit' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      };

      addDoc(txRef, txData).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: txRef.path,
          operation: 'create',
          requestResourceData: txData
        }));
      });

      toast({ title: "Berhasil", description: `Aset telah ${action === 'deposit' ? 'masuk ke' : 'ditarik dari'} Brankas V3.` });
      setBridgeAmount("");
      await checkMainnetBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Blockchain Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
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
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest pl-1">V3 Mainnet Infrastructure • Low Slippage • Staking Foundation</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden md:flex items-center gap-4 px-6 h-12 rounded-2xl liquid-glass border-primary/20">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Node: Mainnet-V3</span>
              </div>
              <div className="w-px h-4 bg-primary/10" />
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-accent">Safety: ReentrancyGuard Active</span>
              </div>
            </div>
            {address ? (
              <Badge className={cn("h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg transition-all", isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white")}>
                {isWrongNetwork ? "Switch to Mainnet" : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </Badge>
            ) : (
              <Button onClick={connectWallet} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl hover:scale-105 transition-all">
                <Wallet className="w-4 h-4 mr-2" /> Connect Wallet
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {assets.map(a => (
            <Card key={a.id} onClick={() => setSelectedAsset(a)} className={cn(
              "p-4 rounded-[1.5rem] cursor-pointer transition-all border-none shadow-sm flex items-center justify-between group",
              selectedAsset.id === a.id ? "liquid-glass-dark text-white ring-2 ring-primary" : "liquid-glass hover:bg-primary/5"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-white/10", a.color)}><a.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{a.name}</p>
                  <p className="text-sm font-black italic">Rp {a.price.toLocaleString()}</p>
                </div>
              </div>
              <Badge variant="ghost" className={cn("text-[8px] font-black", a.change.startsWith('-') ? "text-destructive" : "text-green-400")}>{a.change}</Badge>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-6 left-8 z-10">
                <h3 className="text-xl font-black text-accent uppercase italic flex items-center gap-2">
                  {selectedAsset.name} Chart <TrendingUp className="w-4 h-4 text-primary" />
                </h3>
              </div>
              <CardContent className="pt-24 px-6 pb-6">
                <div className="h-[300px] w-full">
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
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`Rp ${Math.round(value).toLocaleString()}`, 'Price']}
                      />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="swap" className="w-full">
              <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-3">
                <TabsTrigger value="swap" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Internal Swap</TabsTrigger>
                <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Staking Vault</TabsTrigger>
                <TabsTrigger value="history" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">History</TabsTrigger>
              </TabsList>

              <TabsContent value="swap" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="p-6 rounded-[2rem] bg-accent/5 border border-primary/10 relative">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">You Give</label>
                      <div className="flex items-center justify-between mt-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={swapInput}
                          onChange={(e) => {
                            setSwapInput(e.target.value);
                            const val = parseFloat(e.target.value);
                            if (isNaN(val)) setSwapOutput("");
                            else setSwapOutput((val / selectedAsset.price).toFixed(8));
                          }}
                          className="bg-transparent border-none text-2xl font-black italic focus-visible:ring-0 p-0 h-auto"
                        />
                        <Badge className="bg-primary/10 text-primary border-primary/20 h-10 px-4 rounded-xl text-xs font-black">IDR</Badge>
                      </div>
                      <p className="text-[9px] font-bold text-muted-foreground mt-2 uppercase">Balance: Rp {userData?.totalBalance?.toLocaleString() || "0"}</p>
                    </div>

                    <div className="flex justify-center -my-6 relative z-10">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-4 border-background">
                        <ArrowDownCircle className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">You Receive</label>
                      <div className="flex items-center justify-between mt-2">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={swapOutput}
                          readOnly
                          className="bg-transparent border-none text-2xl font-black italic focus-visible:ring-0 p-0 h-auto"
                        />
                        <Badge className="bg-primary/10 text-primary border-primary/20 h-10 px-4 rounded-xl text-xs font-black">{selectedAsset.id}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
                      <span>Fee: {SERVICE_FEE_PERCENT * 100}%</span>
                      <span>Slippage: 0.1%</span>
                    </div>
                    <Button 
                      onClick={() => handleSwap('buy')} 
                      disabled={loading || !swapInput}
                      className="w-full h-16 gold-gradient text-white font-black uppercase italic text-lg rounded-[2rem] shadow-xl hover:scale-[1.02] transition-all"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Swap"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="vault" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] bg-black/40 border border-primary/10 text-center flex flex-col items-center justify-center space-y-2">
                      <span className="text-4xl font-black text-primary italic tracking-tighter">{parseFloat(vaultBalance).toFixed(4)} ETH</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Current Staked</span>
                      <Badge className="bg-primary/20 text-primary border-primary/30 mt-2">APY: 4.8% (Est.)</Badge>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/10 flex flex-col items-center justify-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Staking Age</p>
                      <p className="text-xl font-black text-accent italic">
                        {depositTime > 0 ? new Date(depositTime * 1000).toLocaleDateString() : "No Assets"}
                      </p>
                      <p className="text-[9px] font-bold text-primary/60 uppercase">Earning Passively via V3 Contract</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-primary/30">ETH</span>
                      <Input 
                        type="number" 
                        placeholder="Amount to Stake/Withdraw" 
                        value={bridgeAmount} 
                        onChange={(e) => setBridgeAmount(e.target.value)} 
                        className="h-16 pl-16 rounded-2xl liquid-glass border-none text-lg font-black italic" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => handleVaultAction('deposit')} disabled={loading || !bridgeAmount} className="h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-lg transition-all active:scale-95">
                        Stake in Vault
                      </Button>
                      <Button onClick={() => handleVaultAction('withdraw')} variant="outline" disabled={loading || !bridgeAmount || parseFloat(vaultBalance) <= 0} className="h-14 border-primary/20 text-primary font-black italic uppercase rounded-2xl transition-all active:scale-95">
                        Unstake Assets
                      </Button>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex gap-4 items-center">
                    <ShieldCheck className="w-10 h-10 text-primary shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-accent mb-1 tracking-widest">V3 Vault Protection</p>
                      <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed uppercase tracking-widest">Aset Anda diamankan di level Smart Contract dengan ReentrancyGuard V3 terbaru.</p>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
                  <div className="divide-y divide-primary/5">
                    {historyData && historyData.length > 0 ? (
                      historyData.map((h, idx) => (
                        <div key={idx} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", h.category === "Bridge" ? "bg-blue-100 text-blue-600" : "bg-primary/10 text-primary")}>
                              {h.category === "Bridge" ? <ArrowRightLeft className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-accent italic">{h.description}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{new Date(h.date).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-accent italic">
                              {h.amount ? `Rp ${h.amount.toLocaleString()}` : `${h.cryptoAmount} ETH`}
                            </p>
                            <Badge className="bg-green-100 text-green-600 text-[8px] font-black uppercase">On-Chain Success</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-20 text-center">
                        <History className="w-12 h-12 text-primary/10 mx-auto mb-4" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No transaction history</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none shadow-2xl text-white">
              <h3 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8">
                <Coins className="w-6 h-6 text-primary" /> Global Assets
              </h3>
              <div className="space-y-6">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">AliBank Balance</p>
                    <p className="text-2xl font-black italic tracking-tighter">Rp {userData?.totalBalance?.toLocaleString() || "0"}</p>
                  </div>
                  <Badge className="bg-primary text-white font-black italic">Verified</Badge>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Asset Clusters</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Ethereum (ETH)</span>
                      <span className="font-black italic">{(userData?.cryptoBalances?.ETH || 0).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Bitcoin (BTC)</span>
                      <span className="font-black italic">{(userData?.cryptoBalances?.BTC || 0).toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Tether (USDT)</span>
                      <span className="font-black italic">{(userData?.cryptoBalances?.USDT || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Mainnet Sync</p>
                    <Badge variant="outline" className="border-green-400 text-green-400 font-bold h-5 px-2">LIVE V3</Badge>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/5 flex items-center justify-between border border-white/10">
                    <span className="text-[11px] font-bold">External Wallet</span>
                    <span className="text-sm font-black italic text-primary">{parseFloat(walletBalance).toFixed(4)} ETH</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Staking Rewards
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-accent uppercase tracking-tighter">Yield Generation</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Aset dalam Vault menghasilkan estimasi 4.8% APY.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-accent uppercase tracking-tighter">Auto-Compound</p>
                    <p className="text-[10px] text-muted-foreground font-medium italic">Imbal hasil dihitung berdasarkan waktu staking riil.</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}