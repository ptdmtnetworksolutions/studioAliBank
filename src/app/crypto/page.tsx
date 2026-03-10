
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
  Lock
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
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
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

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
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

export default function CryptoPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [assets, setAssets] = useState<Asset[]>([
    { id: "ETH", name: "Ethereum", icon: Cpu, color: "text-blue-500", price: 0, change: "0.0%" },
    { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-500", price: 0, change: "0.0%" },
    { id: "USDT", name: "Tether", icon: ShieldCheck, color: "text-green-500", price: 0, change: "0.0%" },
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

  // Real-Time Price Fetching
  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=idr&include_24hr_change=true"
      );
      const data = await response.json();
      
      const updatedAssets = [
        { 
          id: "ETH", 
          name: "Ethereum", 
          icon: Cpu, 
          color: "text-blue-500", 
          price: data.ethereum.idr, 
          change: `${data.ethereum.idr_24h_change.toFixed(2)}%` 
        },
        { 
          id: "BTC", 
          name: "Bitcoin", 
          icon: Bitcoin, 
          color: "text-orange-500", 
          price: data.bitcoin.idr, 
          change: `${data.bitcoin.idr_24h_change.toFixed(2)}%` 
        },
        { 
          id: "USDT", 
          name: "Tether", 
          icon: ShieldCheck, 
          color: "text-green-500", 
          price: data.tether.idr, 
          change: `${data.tether.idr_24h_change.toFixed(2)}%` 
        },
      ];
      
      setAssets(updatedAssets);
      // Update selected asset reference
      const currentSelected = updatedAssets.find(a => a.id === selectedAsset.id);
      if (currentSelected) setSelectedAsset(currentSelected);
      
      // Generate some simulated chart data points based on current price for visual
      const basePrice = data.ethereum.idr;
      const points = Array.from({ length: 12 }, (_, i) => ({
        time: `${i * 2}:00`,
        price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
      }));
      setChartData(points);
      
      setPriceLoading(false);
    } catch (err) {
      console.error("Price Fetch Error:", err);
    }
  }, [selectedAsset.id]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

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
      toast({ title: "Mainnet Connected", description: "Dompet Anda siap untuk fitur Bridge." });
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet." });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyFiatChange = (val: string) => {
    setBuyFiat(val);
    if (!val || isNaN(parseFloat(val)) || selectedAsset.price === 0) {
      setBuyCrypto("");
    } else {
      const totalAmount = parseFloat(val);
      const fee = totalAmount * SERVICE_FEE_PERCENT;
      const effectiveAmount = totalAmount - fee;
      setBuyCrypto((effectiveAmount / selectedAsset.price).toFixed(8));
    }
  };

  const handleBuyCryptoChange = (val: string) => {
    setBuyCrypto(val);
    if (!val || isNaN(parseFloat(val)) || selectedAsset.price === 0) {
      setBuyFiat("");
    } else {
      const cryptoAmount = parseFloat(val);
      const rawFiat = cryptoAmount * selectedAsset.price;
      const totalFiat = rawFiat / (1 - SERVICE_FEE_PERCENT);
      setBuyFiat(Math.round(totalFiat).toString());
    }
  };

  const handleSellFiatChange = (val: string) => {
    setSellFiat(val);
    if (!val || isNaN(parseFloat(val)) || selectedAsset.price === 0) {
      setSellCrypto("");
    } else {
      const fiatAmount = parseFloat(val);
      setSellCrypto((fiatAmount / selectedAsset.price).toFixed(8));
    }
  };

  const handleSellCryptoChange = (val: string) => {
    setSellCrypto(val);
    if (!val || isNaN(parseFloat(val)) || selectedAsset.price === 0) {
      setSellFiat("");
    } else {
      const cryptoAmount = parseFloat(val);
      setSellFiat(Math.round(cryptoAmount * selectedAsset.price).toString());
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
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${qty} ${selectedAsset.id} (Live Exchange)`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        timestamp: serverTimestamp()
      });

      toast({ title: "Sukses", description: "Transaksi internal berhasil diproses dengan harga pasar." });
      setBuyFiat(""); setBuyCrypto(""); setSellFiat(""); setSellCrypto("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
      
      toast({ title: "Setoran Berhasil", description: "Aset Anda kini aman di AliBank Vault." });
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
      
      toast({ title: "Penarikan Berhasil", description: "Aset telah dikembalikan ke dompet Anda." });
      setBridgeAmount("");
      await checkMainnetBalances(address);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Vault Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const HelpIcon = ({ title, content }: { title: string, content: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl liquid-glass border-primary/20 p-5 shadow-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="font-black italic uppercase text-xs text-accent tracking-tighter">{title}</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic">{content}</p>
        </div>
      </PopoverContent>
    </Popover>
  );

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
            <p className="text-muted-foreground text-sm font-medium italic">Data pasar Real-Time & Jembatan Aset Riil Ethereum Mainnet.</p>
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
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Pasar Live AliBank (Tanpa Gas)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xl font-black italic uppercase text-primary">Beli {selectedAsset.id}</h3>
                     <HelpIcon title="Live Market Buy" content="Beli aset dengan harga pasar real-time menggunakan saldo IDR. Aset disimpan di portfolio internal Anda tanpa biaya blockchain." />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nominal Rupiah</label>
                      <Input type="number" placeholder="Rp 0" value={buyFiat} onChange={(e) => handleBuyFiatChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah {selectedAsset.id}</label>
                      <Input type="number" placeholder="0.00" value={buyCrypto} onChange={(e) => handleBuyCryptoChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                      <span>Service Fee: {SERVICE_FEE_PERCENT * 100}%</span>
                      <span>Instant Settlement</span>
                    </div>
                    <Button onClick={() => handleTrade('buy')} disabled={loading || !buyCrypto || priceLoading} className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl">Eksekusi Beli</Button>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-black italic uppercase text-primary">Jual {selectedAsset.id}</h3>
                    <HelpIcon title="Live Market Sell" content="Jual aset internal Anda untuk mendapatkan saldo Rupiah secara instan dengan harga pasar terkini." />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah {selectedAsset.id}</label>
                      <Input type="number" placeholder="0.00" value={sellCrypto} onChange={(e) => handleSellCryptoChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Estimasi Rupiah</label>
                      <Input type="number" placeholder="Rp 0" value={sellFiat} onChange={(e) => handleSellFiatChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground px-1">
                      <span>Status: {userData?.cryptoBalances?.[selectedAsset.id] || 0} {selectedAsset.id} Miliki</span>
                    </div>
                    <Button onClick={() => handleTrade('sell')} disabled={loading || !sellCrypto || priceLoading} variant="outline" className="w-full h-14 border-primary/20 text-primary font-black uppercase italic rounded-xl">Eksekusi Jual</Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
             <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic px-2">Aset Terdaftar</h3>
              <div className="grid grid-cols-1 gap-3">
                {assets.map((asset) => (
                  <button 
                    key={asset.id} 
                    onClick={() => setSelectedAsset(asset)}
                    className={cn(
                      "liquid-glass p-5 rounded-2xl border-primary/5 flex items-center justify-between hover:border-primary/40 transition-all text-left",
                      selectedAsset.id === asset.id ? "border-primary/40 bg-primary/5" : ""
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-xl bg-white/10", asset.color)}><asset.icon className="w-5 h-5" /></div>
                      <div>
                        <p className="text-xs font-black text-accent">{asset.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{asset.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-accent italic">Rp {asset.price.toLocaleString()}</p>
                      <p className={cn("text-[9px] font-bold", asset.change.startsWith('-') ? "text-destructive" : "text-green-600")}>{asset.change}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 bg-accent/5 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">Mainnet Vault <Lock className="w-3 h-3 text-primary" /></h4>
                <HelpIcon title="Smart Contract Vault" content="Brankas on-chain AliBank. Dana Anda di sini benar-benar terkunci di blockchain Ethereum." />
              </div>

              {!address ? (
                <div className="p-8 rounded-3xl bg-black/20 border border-dashed border-primary/20 text-center space-y-4">
                  <Wallet className="w-10 h-10 text-primary/40 mx-auto" />
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Hubungkan Dompet untuk mengakses Brankas Blockchain (ETH Mainnet)</p>
                  <Button onClick={connectWallet} size="sm" className="rounded-full gold-gradient text-white w-full h-10 font-black italic uppercase text-[10px]">Koneksikan Sekarang</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-black/40 flex flex-col items-center space-y-2 border border-primary/10">
                    <span className="text-3xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(6)} ETH</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Saldo Brankas On-Chain</span>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-primary/5">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span>Dompet MetaMask</span>
                      <span>{parseFloat(walletBalance).toFixed(4)} ETH</span>
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
                        className="h-12 bg-primary text-white font-black italic uppercase rounded-xl text-[10px] flex items-center gap-2"
                      >
                        <ArrowDownCircle className="w-4 h-4" /> Setor
                      </Button>
                      <Button 
                        onClick={handleWithdrawFromVault} 
                        disabled={loading || !bridgeAmount || parseFloat(vaultBalance) <= 0} 
                        variant="outline"
                        className="h-12 border-primary/20 text-primary font-black italic uppercase rounded-xl text-[10px] flex items-center gap-2"
                      >
                        <ArrowUpCircle className="w-4 h-4" /> Tarik
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute inset-0 gold-gradient opacity-10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Audit Transparansi</h3>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                  Setiap transaksi di Brankas Brige dapat diverifikasi secara publik di Etherscan. Keamanan aset Anda adalah prioritas elit kami.
                </p>
                <Badge className="bg-primary text-white font-black text-[8px] uppercase tracking-widest">Publicly Auditable</Badge>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
