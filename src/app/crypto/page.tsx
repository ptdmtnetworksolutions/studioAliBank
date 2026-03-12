
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

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=idr&include_24hr_change=true");
      const data = await response.json();
      const updatedAssets = [
        { id: "ETH", name: "Ethereum", icon: Cpu, color: "text-blue-500", price: data.ethereum?.idr || FALLBACK_PRICES.ETH, change: `${(data.ethereum?.idr_24h_change || 0).toFixed(2)}%` },
        { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-500", price: data.bitcoin?.idr || FALLBACK_PRICES.BTC, change: `${(data.bitcoin?.idr_24h_change || 0).toFixed(2)}%` },
        { id: "USDT", name: "Tether", icon: ShieldCheck, color: "text-green-500", price: data.tether?.idr || FALLBACK_PRICES.USDT, change: `${(data.tether?.idr_24h_change || 0).toFixed(2)}%` },
      ];
      setAssets(updatedAssets);
      const basePrice = data.ethereum?.idr || FALLBACK_PRICES.ETH;
      const points = Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, price: basePrice * (1 + (Math.random() * 0.04 - 0.02)) }));
      setChartData(points);
    } catch (err) {}
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const transactionsQuery = useMemo(() => (!db || !user) ? null : query(collection(db, "users", user.uid, "transactions"), where("category", "in", ["Trading", "Bridge"]), orderBy("timestamp", "desc")), [db, user]);
  const { data: historyData } = useCollection(transactionsQuery);

  const checkMainnetBalances = useCallback(async (walletAddr: string) => {
    if (typeof window.ethereum === 'undefined' || !walletAddr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1n) { setIsWrongNetwork(true); return; }
      setIsWrongNetwork(false);
      const ethBalance = await provider.getBalance(walletAddr);
      setWalletBalance(formatEther(ethBalance));
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      setVaultBalance(formatEther(await contract.balances(walletAddr).catch(() => 0n)));
      setDepositTime(Number(await contract.depositTimestamps(walletAddr).catch(() => 0n)));
    } catch (err) {}
  }, []);

  useEffect(() => {
    if (mounted && user && typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
        if (accounts.length > 0) { setAddress(accounts[0]); checkMainnetBalances(accounts[0]); }
      });
    }
  }, [mounted, user, checkMainnetBalances]);

  const handleSwap = async (type: 'buy' | 'sell') => {
    if (!user || !db || !swapInput || !userDocRef) return;
    const qty = type === 'buy' ? parseFloat(swapOutput) : parseFloat(swapInput);
    const fiat = type === 'buy' ? parseFloat(swapInput) : parseFloat(swapOutput);
    
    setLoading(true);
    try {
      if (type === 'buy' && (userData?.totalBalance || 0) < fiat) throw new Error("Saldo IDR Tidak Cukup");
      if (type === 'sell' && (userData?.cryptoBalances?.[selectedAsset.id] || 0) < qty) throw new Error("Saldo Aset Tidak Cukup");

      const payload = type === 'buy' 
        ? { totalBalance: increment(-fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(qty) }
        : { totalBalance: increment(fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(-qty) };

      updateDoc(userDocRef, payload);

      const txRef = collection(db, "users", user.uid, "transactions");
      const notifRef = collection(db, "users", user.uid, "notifications");

      addDoc(txRef, {
        date: new Date().toISOString(),
        description: `Swap ${type === 'buy' ? 'IDR ke' : selectedAsset.id + ' ke'} ${type === 'buy' ? selectedAsset.id : 'IDR'}`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      addDoc(notifRef, {
        title: "Eksekusi Swap Berhasil",
        message: `Berhasil menukar ${type === 'buy' ? 'IDR' : selectedAsset.id} menjadi ${type === 'buy' ? selectedAsset.id : 'IDR'}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Swap Berhasil" });
      setSwapInput(""); setSwapOutput("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally { setLoading(false); }
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
        
      toast({ title: "Terkirim", description: "Menunggu blockchain..." });
      await tx.wait();
      
      const txRef = collection(db, "users", user.uid, "transactions");
      const notifRef = collection(db, "users", user.uid, "notifications");

      addDoc(txRef, {
        date: new Date().toISOString(),
        description: `${action === 'deposit' ? 'Staking' : 'Withdraw'} Vault V3`,
        category: "Bridge",
        cryptoAmount: parseFloat(bridgeAmount),
        cryptoCurrency: "ETH",
        type: action === 'deposit' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      addDoc(notifRef, {
        title: `V3 Vault ${action === 'deposit' ? 'Deposit' : 'Withdrawal'}`,
        message: `Aset sebesar ${bridgeAmount} ETH telah berhasil ${action === 'deposit' ? 'masuk ke' : 'ditarik dari'} Brankas V3.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Berhasil" });
      setBridgeAmount("");
      await checkMainnetBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Blockchain Error", description: err.message });
    } finally { setLoading(false); }
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
            {address ? (
              <Badge className={cn("h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-tighter shadow-lg transition-all", isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white")}>
                {isWrongNetwork ? "Switch to Mainnet" : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </Badge>
            ) : (
              <Button onClick={() => setLoading(true)} className="h-12 px-8 rounded-2xl gold-gradient text-white font-black uppercase italic shadow-xl hover:scale-105 transition-all">
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
                  <p className="text-sm font-black italic">Rp {a.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <Badge variant="ghost" className={cn("text-[8px] font-black", a.change.startsWith('-') ? "text-destructive" : "text-green-400")}>{a.change}</Badge>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative h-[400px]">
              <div className="absolute top-6 left-8 z-10">
                <h3 className="text-xl font-black text-accent uppercase italic flex items-center gap-2">
                  {selectedAsset.name} Chart <TrendingUp className="w-4 h-4 text-primary" />
                </h3>
              </div>
              <CardContent className="pt-24 h-full">
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
                    <Tooltip contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: 'none' }} formatter={(v: any) => [`Rp ${Math.round(v).toLocaleString('id-ID')}`, 'Price']} />
                    <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Tabs defaultValue="swap" className="w-full">
              <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-3">
                <TabsTrigger value="swap" className="rounded-[1.5rem] font-black uppercase text-[10px]">Internal Swap</TabsTrigger>
                <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px]">Staking Vault</TabsTrigger>
                <TabsTrigger value="history" className="rounded-[1.5rem] font-black uppercase text-[10px]">History</TabsTrigger>
              </TabsList>
              <TabsContent value="swap" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                  <div className="space-y-4">
                    <div className="p-6 rounded-[2rem] bg-accent/5 border border-primary/10">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">You Give</label>
                      <div className="flex items-center justify-between mt-2">
                        <Input type="number" placeholder="0.00" value={swapInput} onChange={(e) => { setSwapInput(e.target.value); setSwapOutput((parseFloat(e.target.value) / selectedAsset.price).toFixed(8)); }} className="bg-transparent border-none text-2xl font-black italic focus-visible:ring-0 p-0" />
                        <Badge className="bg-primary/10 text-primary h-10 px-4 rounded-xl text-xs font-black">IDR</Badge>
                      </div>
                    </div>
                    <Button onClick={() => handleSwap('buy')} disabled={loading || !swapInput} className="w-full h-16 gold-gradient text-white font-black uppercase italic text-lg rounded-[2rem] shadow-xl">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Swap"}
                    </Button>
                  </div>
                </Card>
              </TabsContent>
              <TabsContent value="vault" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-8 rounded-[2rem] bg-black/40 text-center space-y-2">
                      <span className="text-4xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(4)} ETH</span>
                      <Badge className="bg-primary/20 text-primary block mt-2">APY: 4.8% (Est.)</Badge>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Input type="number" placeholder="Amount to Stake/Withdraw" value={bridgeAmount} onChange={(e) => setBridgeAmount(e.target.value)} className="h-16 rounded-2xl liquid-glass border-none text-lg font-black italic" />
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => handleVaultAction('deposit')} disabled={loading || !bridgeAmount} className="h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-lg">Stake</Button>
                      <Button onClick={() => handleVaultAction('withdraw')} variant="outline" disabled={loading || !bridgeAmount} className="h-14 border-primary/20 text-primary font-black italic uppercase rounded-2xl">Unstake</Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
