
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
  ArrowUpCircle,
  Globe,
  Zap,
  HelpCircle,
  Info,
  Sparkles,
  ArrowRightLeft,
  Lock,
  ArrowUpRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

// ABI TERBARU: Menyertakan getTotalVaultBalance
const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getTotalVaultBalance() public view returns (uint256)",
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)"
];

const DEFAULT_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"; 

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

export default function CryptoPage() {
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
  
  const [buyFiat, setBuyFiat] = useState("");
  const [buyCrypto, setBuyCrypto] = useState("");
  const [sellFiat, setSellFiat] = useState("");
  const [sellCrypto, setSellCrypto] = useState("");

  const [bridgeAmount, setBridgeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceLoading, setPriceLoading] = useState(true);
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [mounted, setMounted] = useState(false);

  const SERVICE_FEE_PERCENT = 0.005; 

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=idr&include_24hr_change=true"
      );
      
      if (!response.ok) throw new Error("API rate limit or connection issue");

      const data = await response.json();
      
      const updatedAssets = [
        { 
          id: "ETH", 
          name: "Ethereum", 
          icon: Cpu, 
          color: "text-blue-500", 
          price: data.ethereum?.idr || FALLBACK_PRICES.ETH, 
          change: `${(data.ethereum?.idr_24h_change || 0).toFixed(2)}%` 
        },
        { 
          id: "BTC", 
          name: "Bitcoin", 
          icon: Bitcoin, 
          color: "text-orange-500", 
          price: data.bitcoin?.idr || FALLBACK_PRICES.BTC, 
          change: `${(data.bitcoin?.idr_24h_change || 0).toFixed(2)}%` 
        },
        { 
          id: "USDT", 
          name: "Tether", 
          icon: ShieldCheck, 
          color: "text-green-500", 
          price: data.tether?.idr || FALLBACK_PRICES.USDT, 
          change: `${(data.tether?.idr_24h_change || 0).toFixed(2)}%` 
        },
      ];
      
      setAssets(updatedAssets);
      const currentSelected = updatedAssets.find(a => a.id === selectedAsset.id);
      if (currentSelected) setSelectedAsset(currentSelected);
      
      const basePrice = data.ethereum?.idr || FALLBACK_PRICES.ETH;
      const points = Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 2}:00`,
        price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
      }));
      setChartData(points);
    } catch (err) {
      console.warn("Price Fetch Failed:", err);
      if (chartData.length === 0) {
        const basePrice = FALLBACK_PRICES[selectedAsset.id] || 0;
        const points = Array.from({ length: 12 }, (_, i) => ({
          time: `${i * 2}:00`,
          price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
        }));
        setChartData(points);
      }
    } finally {
      setPriceLoading(false);
    }
  }, [selectedAsset.id, chartData.length]);

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
      orderBy("timestamp", "desc")
    );
  }, [db, user]);

  const { data: allTransactions } = useCollection(transactionsQuery);

  const pendingAmount = useMemo(() => {
    if (!allTransactions) return 0;
    return allTransactions
      .filter(t => t.category === "Bridge" && t.status === "pending")
      .reduce((acc, curr) => acc + (curr.cryptoAmount || 0), 0);
  }, [allTransactions]);

  const resetBalances = useCallback(() => {
    setVaultBalance("0");
    setWalletBalance("0");
    setIsWrongNetwork(false);
  }, []);

  const checkMainnetBalances = useCallback(async (walletAddr: string) => {
    if (typeof window.ethereum === 'undefined' || !walletAddr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1n) {
        setIsWrongNetwork(true);
        resetBalances();
        return;
      }
      setIsWrongNetwork(false);
      const ethBalance = await provider.getBalance(walletAddr);
      setWalletBalance(formatEther(ethBalance));
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const balanceInVault = await contract.balances(walletAddr).catch(() => null);
      if (balanceInVault !== null) setVaultBalance(formatEther(balanceInVault));
    } catch (err) {
      console.error("Blockchain Fetch Error:", err);
    }
  }, [resetBalances]);

  useEffect(() => {
    if (!user) {
      setAddress(null);
      resetBalances();
      return;
    }
    const sync = async () => {
      if (typeof window.ethereum !== 'undefined' && mounted) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          await checkMainnetBalances(accounts[0]);
        }
      }
      setIsInitializing(false);
    };
    sync();
  }, [mounted, user, checkMainnetBalances, resetBalances]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') return;
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      if (userDocRef) updateDoc(userDocRef, { walletAddress: accounts[0] });
      await checkMainnetBalances(accounts[0]);
      toast({ title: "Mainnet Terhubung", description: "Dompet Anda siap untuk fitur Bridge AliBank." });
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet MetaMask." });
    } finally {
      setLoading(false);
    }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user || !db) return;
    const qty = type === 'buy' ? parseFloat(buyCrypto) : parseFloat(sellCrypto);
    const fiat = type === 'buy' ? parseFloat(buyFiat) : parseFloat(sellFiat);
    if (isNaN(qty) || qty <= 0) return;

    setLoading(true);
    try {
      if (type === 'buy') {
        if ((userData?.totalBalance || 0) < fiat) throw new Error("Saldo IDR tidak cukup.");
        await updateDoc(userDocRef!, { 
          totalBalance: increment(-fiat), 
          [`cryptoBalances.${selectedAsset.id}`]: increment(qty) 
        });
      } else {
        const currentAssetBalance = userData?.cryptoBalances?.[selectedAsset.id] || 0;
        if (currentAssetBalance < qty) throw new Error(`Saldo ${selectedAsset.id} tidak cukup.`);
        await updateDoc(userDocRef!, { 
          totalBalance: increment(fiat), 
          [`cryptoBalances.${selectedAsset.id}`]: increment(-qty) 
        });
      }

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${qty} ${selectedAsset.id} (Pasar AliBank)`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      toast({ title: "Berhasil", description: `Transaksi ${type === 'buy' ? 'pembelian' : 'penjualan'} aset internal berhasil.` });
      setBuyFiat(""); setBuyCrypto(""); setSellFiat(""); setSellCrypto("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositToVault = async () => {
    if (!address || typeof window.ethereum === 'undefined' || !bridgeAmount) return;
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = await contract.deposit({ value: parseEther(bridgeAmount) });
      toast({ title: "Setoran Diproses", description: "Menunggu konfirmasi blockchain..." });
      await tx.wait();
      
      toast({ title: "Brankas Terisi", description: "ETH Anda kini aman di Brankas Smart Contract AliBank." });
      setBridgeAmount("");
      await checkMainnetBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Vault Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFromVault = async () => {
    if (!address || typeof window.ethereum === 'undefined' || !bridgeAmount) return;
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = await contract.withdraw(parseEther(bridgeAmount));
      toast({ title: "Penarikan Diproses", description: "Menunggu konfirmasi blockchain..." });
      await tx.wait();
      
      toast({ title: "Aset Ditarik", description: "ETH telah kembali ke dompet MetaMask Anda." });
      setBridgeAmount("");
      await checkMainnetBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Vault Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleBridgeInternalToVault = async () => {
    if (!user || !db || !bridgeAmount || selectedAsset.id !== 'ETH') return;
    const qty = parseFloat(bridgeAmount);
    const internalEth = userData?.cryptoBalances?.ETH || 0;

    if (internalEth < qty) {
      toast({ variant: "destructive", title: "Gagal", description: "Saldo internal ETH Anda tidak mencukupi." });
      return;
    }

    setLoading(true);
    try {
      await updateDoc(userDocRef!, {
        "cryptoBalances.ETH": increment(-qty)
      });

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Bridge Internal ETH ke Mainnet Vault (Proses Settlement)`,
        category: "Bridge",
        cryptoAmount: qty,
        amount: 0,
        type: "expense",
        status: "pending", 
        timestamp: serverTimestamp()
      });

      toast({ 
        title: "Permintaan Bridge Diterima", 
        description: "AliBank Treasury sedang memproses pengiriman aset asli ke Brankas Blockchain Anda." 
      });
      setBridgeAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-2.5">
                <LogoIcon className="text-white" />
              </div>
              <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter flex items-center gap-2">
                Live Bridge <Globe className="w-6 h-6 animate-pulse text-primary" />
              </h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium italic">Manajemen Aset Hibrida: Internal & Brankas Blockchain.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
              <Badge className={cn("font-bold h-10 px-4 rounded-full flex items-center gap-2", isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white")}>
                {isWrongNetwork ? "Wrong Network" : `${address.slice(0, 6)}...${address.slice(-4)}`}
              </Badge>
            ) : (
              <Button onClick={connectWallet} className="rounded-full gold-gradient text-white font-bold h-10 px-6 shadow-lg"><Wallet className="w-4 h-4 mr-2" /> Connect Wallet</Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-6 pt-12">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-primary/10 transition-colors", selectedAsset.color)}><selectedAsset.icon className="w-6 h-6" /></div>
                  <div>
                    <CardTitle className="text-xl font-black">{selectedAsset.name} / IDR</CardTitle>
                    <p className={cn("text-xs font-bold flex items-center gap-1", selectedAsset.change.startsWith('-') ? "text-destructive" : "text-green-600")}>
                      {selectedAsset.change} <Globe className="w-3 h-3" />
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {priceLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-primary ml-auto" />
                  ) : (
                    <p className="text-3xl font-black text-accent">Rp {selectedAsset.price.toLocaleString('id-ID')}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin * 0.98', 'dataMax * 1.02']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`Rp ${Math.round(value).toLocaleString()}`, 'Harga']}
                      />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <ArrowRightLeft className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Pasar AliBank (Aset Internal)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black italic uppercase text-primary">Beli {selectedAsset.id}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nominal Rupiah</label>
                      <Input type="number" placeholder="Rp 0" value={buyFiat} onChange={(e) => {
                        setBuyFiat(e.target.value);
                        if (!e.target.value || isNaN(parseFloat(e.target.value))) setBuyCrypto("");
                        else setBuyCrypto(((parseFloat(e.target.value) * (1 - SERVICE_FEE_PERCENT)) / selectedAsset.price).toFixed(8));
                      }} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah {selectedAsset.id}</label>
                      <Input type="number" placeholder="0.00" value={buyCrypto} onChange={(e) => {
                        setBuyCrypto(e.target.value);
                        if (!e.target.value || isNaN(parseFloat(e.target.value))) setBuyFiat("");
                        else setBuyFiat(Math.round((parseFloat(e.target.value) * selectedAsset.price) / (1 - SERVICE_FEE_PERCENT)).toString());
                      }} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <Button onClick={() => handleTrade('buy')} disabled={loading || !buyCrypto || priceLoading} className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl">Eksekusi Beli</Button>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black italic uppercase text-primary">Jual {selectedAsset.id}</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah {selectedAsset.id}</label>
                      <Input type="number" placeholder="0.00" value={sellCrypto} onChange={(e) => {
                        setSellCrypto(e.target.value);
                        if (!e.target.value || isNaN(parseFloat(e.target.value))) setSellFiat("");
                        else setSellFiat(Math.round(parseFloat(e.target.value) * selectedAsset.price).toString());
                      }} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Estimasi Rupiah</label>
                      <Input type="number" placeholder="Rp 0" value={sellFiat} onChange={(e) => {
                        setSellFiat(e.target.value);
                        if (!e.target.value || isNaN(parseFloat(e.target.value))) setSellCrypto("");
                        else setSellCrypto((parseFloat(e.target.value) / selectedAsset.price).toFixed(8));
                      }} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                      <span>Miliki: {userData?.cryptoBalances?.[selectedAsset.id] || 0} {selectedAsset.id}</span>
                    </div>
                    <Button onClick={() => handleTrade('sell')} disabled={loading || !sellCrypto || priceLoading} variant="outline" className="w-full h-14 border-primary/20 text-primary font-black uppercase italic rounded-xl">Eksekusi Jual</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 bg-accent/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Mainnet Vault <Lock className="w-3 h-3 text-primary" /></h4>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none"><HelpCircle className="w-4 h-4" /></button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 rounded-2xl liquid-glass border-primary/20 p-5 shadow-2xl">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2"><Info className="w-4 h-4 text-primary" /><h4 className="font-black italic uppercase text-xs text-accent tracking-tighter">Vault Guide</h4></div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic">
                        Setoran dari MetaMask akan memindahkan ETH ke Smart Contract AliBankVault. Penarikan akan mengembalikan aset dari Brankas ke dompet pribadi Anda.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {!address ? (
                <div className="p-8 rounded-3xl bg-black/20 border border-dashed border-primary/20 text-center space-y-4">
                  <Wallet className="w-10 h-10 text-primary/40 mx-auto" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Hubungkan Dompet untuk mengakses Brankas Blockchain (Mainnet)</p>
                  <Button onClick={connectWallet} size="sm" className="rounded-full gold-gradient text-white w-full h-10 font-black italic uppercase text-[10px]">Koneksikan Sekarang</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-black/40 flex flex-col items-center space-y-2 border border-primary/10">
                    <span className="text-3xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(6)} ETH</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saldo Brankas On-Chain</span>
                  </div>

                  {pendingAmount > 0 && (
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 animate-pulse">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black text-primary uppercase">Pending Settlement</span>
                        <Clock className="w-3 h-3 text-primary" />
                      </div>
                      <p className="text-lg font-black text-accent italic">{pendingAmount.toFixed(6)} ETH</p>
                      <p className="text-[8px] font-medium text-muted-foreground italic mt-1 leading-tight">
                        Aset internal sedang diproses oleh Treasury menuju Brankas Blockchain.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-primary/5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span>Dompet MetaMask</span>
                      <span className="text-accent">{parseFloat(walletBalance).toFixed(4)} ETH</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span>Portofolio Internal</span>
                      <span className="text-primary">{userData?.cryptoBalances?.ETH?.toFixed(4) || "0.0000"} ETH</span>
                    </div>
                    <Input 
                      type="number" 
                      placeholder="Jumlah ETH" 
                      value={bridgeAmount} 
                      onChange={(e) => setBridgeAmount(e.target.value)} 
                      className="h-12 rounded-xl liquid-glass border-none text-accent font-bold text-xs" 
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        onClick={handleDepositToVault} 
                        disabled={loading || !bridgeAmount} 
                        className="h-12 bg-primary text-white font-black italic uppercase rounded-xl text-[9px] flex items-center gap-1.5"
                      >
                        <ArrowDownCircle className="w-4 h-4" /> MetaMask &rarr; Vault
                      </Button>
                      <Button 
                        onClick={handleWithdrawFromVault} 
                        disabled={loading || !bridgeAmount || parseFloat(vaultBalance) <= 0} 
                        variant="outline"
                        className="h-12 border-primary/20 text-primary font-black italic uppercase rounded-xl text-[9px] flex items-center gap-1.5"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Vault &rarr; MetaMask
                      </Button>
                    </div>
                    
                    {selectedAsset.id === 'ETH' && (
                      <Button 
                        onClick={handleBridgeInternalToVault}
                        disabled={loading || !bridgeAmount || (userData?.cryptoBalances?.ETH || 0) <= 0}
                        className="w-full h-12 liquid-glass-dark text-white font-black italic uppercase rounded-xl text-[9px] flex items-center justify-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4 text-primary" /> Internal &rarr; Vault Bridge
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute inset-0 gold-gradient opacity-10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Blockchain Proof</h3>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                  Aset di Brankas terikat pada dompet Anda. Transaksi dicatat secara publik di Mainnet.
                </p>
                <Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest">Decentralized Custody</Badge>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
