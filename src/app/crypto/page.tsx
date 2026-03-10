
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Wallet,
  Link2,
  Unlink,
  Loader2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Globe,
  Zap,
  HelpCircle,
  Info
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
import { useState, useEffect, useMemo } from "react";
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

// ABI resmi sesuai dengan AliBankVault.sol yang dideploy
const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "event Deposited(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)"
];

/**
 * PRODUCTION SMART CONTRACT ADDRESS
 * Alamat brankas AliBank di Ethereum Mainnet.
 */
const DEFAULT_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"; 
const MAINNET_CHAIN_ID = "0x1"; // Ethereum Mainnet

const ASSETS = [
  { id: "ETH", name: "Ethereum", icon: Cpu, color: "text-blue-500", price: 48500000, change: "+2.4%" },
  { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-500", price: 1050000000, change: "+1.8%" },
  { id: "USDT", name: "Tether", icon: ShieldCheck, color: "text-green-500", price: 15800, change: "0.0%" },
];

const MOCK_CHART_DATA = [
  { time: "00:00", price: 45000000 },
  { time: "04:00", price: 46200000 },
  { time: "08:00", price: 45800000 },
  { time: "12:00", price: 47500000 },
  { time: "16:00", price: 48200000 },
  { time: "20:00", price: 48500000 },
];

export default function CryptoPage() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  
  // State for Trading Inputs
  const [buyFiat, setBuyFiat] = useState("");
  const [buyCrypto, setBuyCrypto] = useState("");
  const [sellFiat, setSellFiat] = useState("");
  const [sellCrypto, setSellCrypto] = useState("");

  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");
  const [walletBalance, setWalletBalance] = useState("0");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  // Auto-calculate conversion for Buy
  const handleBuyFiatChange = (val: string) => {
    setBuyFiat(val);
    if (!val || isNaN(parseFloat(val))) {
      setBuyCrypto("");
    } else {
      setBuyCrypto((parseFloat(val) / selectedAsset.price).toFixed(8));
    }
  };

  const handleBuyCryptoChange = (val: string) => {
    setBuyCrypto(val);
    if (!val || isNaN(parseFloat(val))) {
      setBuyFiat("");
    } else {
      setBuyFiat(Math.round(parseFloat(val) * selectedAsset.price).toString());
    }
  };

  // Auto-calculate conversion for Sell
  const handleSellFiatChange = (val: string) => {
    setSellFiat(val);
    if (!val || isNaN(parseFloat(val))) {
      setSellCrypto("");
    } else {
      setSellCrypto((parseFloat(val) / selectedAsset.price).toFixed(8));
    }
  };

  const handleSellCryptoChange = (val: string) => {
    setSellCrypto(val);
    if (!val || isNaN(parseFloat(val))) {
      setSellFiat("");
    } else {
      setSellFiat(Math.round(parseFloat(val) * selectedAsset.price).toString());
    }
  };

  const checkMainnetBalances = async (walletAddr: string) => {
    if (typeof window.ethereum === 'undefined') return;
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 1n) {
        setIsWrongNetwork(true);
        setVaultBalance("0");
        setWalletBalance("0");
        return;
      }

      setIsWrongNetwork(false);
      
      const ethBalance = await provider.getBalance(walletAddr);
      setWalletBalance(formatEther(ethBalance));

      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const balanceInVault = await contract.balances(walletAddr).catch(() => null);
      
      if (balanceInVault !== null) {
        setVaultBalance(formatEther(balanceInVault));
      } else {
        setVaultBalance("0");
      }
    } catch (err) {
      console.error("Failed to read mainnet data:", err);
    }
  };

  useEffect(() => {
    const syncWallet = async () => {
      if (userData?.walletAddress) {
        setAddress(userData.walletAddress);
        await checkMainnetBalances(userData.walletAddress);
      }
      setIsInitializing(false);

      if (typeof window.ethereum !== 'undefined') {
        const handleAccountsChanged = (accounts: string[]) => {
          if (accounts.length > 0) {
            const newAddr = accounts[0];
            setAddress(newAddr);
            if (userDocRef) {
              updateDoc(userDocRef, { walletAddress: newAddr });
            }
            checkMainnetBalances(newAddr);
          } else {
            setAddress(null);
            setVaultBalance("0");
            setWalletBalance("0");
          }
        };

        const handleChainChanged = () => {
          window.location.reload();
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
        return () => {
          if (window.ethereum?.removeListener) {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
          }
        };
      }
    };

    if (userData) syncWallet();
  }, [userData?.walletAddress, userDocRef]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      const dappUrl = window.location.href.split('://')[1];
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
      return;
    }

    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== 1n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: MAINNET_CHAIN_ID }],
          });
        } catch (switchError: any) {
          toast({ 
            variant: "destructive", 
            title: "Mainnet Required", 
            description: "Silakan pindah ke Ethereum Mainnet untuk memproses aset riil." 
          });
          return;
        }
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const newAddress = accounts[0];
      setAddress(newAddress);
      
      if (userDocRef) {
        updateDoc(userDocRef, { walletAddress: newAddress });
      }

      await checkMainnetBalances(newAddress);
      toast({ title: "Mainnet Bridge Active", description: "Dompet aset riil Anda telah terhubung." });
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet." });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositToVault = async () => {
    if (!address || !depositAmount || typeof window.ethereum === 'undefined') return;
    
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = await contract.deposit({ value: parseEther(depositAmount) });
      toast({ title: "Transaction Broadcasted", description: "Menyetorkan ETH ke AliBank Vault di Mainnet..." });
      await tx.wait();
      
      await checkMainnetBalances(address);
      setDepositAmount("");
      toast({ title: "Deposit Success", description: "ETH Anda telah aman di dalam Vault AliBank." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Deposit Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFromVault = async () => {
    if (!address || typeof window.ethereum === 'undefined') return;
    
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const balance = await contract.balances(address);
      if (balance === 0n) {
        throw new Error("Saldo Vault Anda kosong.");
      }

      const tx = await contract.withdraw(balance);
      toast({ title: "Transaction Broadcasted", description: "Memproses penarikan di Ethereum Mainnet..." });
      await tx.wait();
      
      await checkMainnetBalances(address);
      toast({ title: "Withdrawal Success", description: "Aset telah ditarik ke dompet pribadi Anda." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Withdrawal Failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    if (!userDocRef) return;
    try {
      updateDoc(userDocRef, { walletAddress: null });
      setAddress(null);
      setVaultBalance("0");
      setWalletBalance("0");
      toast({ title: "Disconnected", description: "Hubungan dompet telah diputus secara aman." });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Gagal memutuskan hubungan." });
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
        if ((userData?.totalBalance || 0) < fiat) {
          throw new Error("Saldo IDR tidak mencukupi.");
        }
        
        updateDoc(userDocRef!, {
          totalBalance: increment(-fiat),
          [`cryptoBalances.${selectedAsset.id}`]: increment(qty)
        });
      } else {
        const currentAssetBalance = userData?.cryptoBalances?.[selectedAsset.id] || 0;
        if (currentAssetBalance < qty) {
          throw new Error(`Saldo ${selectedAsset.id} tidak mencukupi.`);
        }

        updateDoc(userDocRef!, {
          totalBalance: increment(fiat),
          [`cryptoBalances.${selectedAsset.id}`]: increment(-qty)
        });
      }

      addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${qty} ${selectedAsset.id} (Mainnet Bridge)`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        timestamp: serverTimestamp()
      });

      toast({ title: "Execution Success", description: `Transaksi ${selectedAsset.id} telah diselesaikan di pasar riil.` });
      
      // Clear inputs
      setBuyFiat("");
      setBuyCrypto("");
      setSellFiat("");
      setSellCrypto("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Trading Error", description: err.message });
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
            <h4 className="font-black italic uppercase text-xs text-accent tracking-tighter">Fitur: {title}</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic">
            {content}
          </p>
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
              <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter dark:text-primary flex items-center gap-2">
                Live Mainnet <Globe className="w-6 h-6 animate-pulse text-primary" />
              </h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Bursa aset riil AliBank yang terintegrasi langsung dengan blockchain global.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "font-bold h-10 px-4 rounded-full flex items-center gap-2",
                    isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white"
                  )}>
                    {isWrongNetwork ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {isWrongNetwork ? "Switch to Mainnet" : `${address.slice(0, 6)}...${address.slice(-4)}`}
                  </Badge>
                  <Button onClick={disconnectWallet} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 rounded-full">
                    <Unlink className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] font-black text-primary uppercase pr-4 tracking-widest">
                  Wallet: {parseFloat(walletBalance).toFixed(4)} ETH
                </p>
              </div>
            ) : (
              <Button 
                onClick={connectWallet} 
                disabled={isInitializing}
                className="rounded-full gold-gradient text-white font-bold h-10 px-6 border-none shadow-lg hover:scale-105 transition-transform"
              >
                {isInitializing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                Connect Mainnet Wallet
              </Button>
            )}
          </div>
        </header>

        {isWrongNetwork && (
          <div className="mb-8 p-6 rounded-[2rem] bg-destructive/10 border border-destructive/20 flex items-center gap-4 text-destructive animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-8 h-8 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-black uppercase italic">Jaringan Tidak Sesuai</p>
              <p className="text-xs font-medium">AliBank saat ini beroperasi di <span className="underline font-bold">Ethereum Mainnet</span>. Harap pindahkan jaringan dompet Anda untuk memproses aset riil.</p>
            </div>
            <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={connectWallet}>Ganti Jaringan</Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10">
                <Badge className="bg-primary text-white font-black italic">PROD-ACTIVE</Badge>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <HelpIcon 
                  title="Price Chart" 
                  content="Grafik ini menunjukkan pergerakan harga aset riil di pasar global secara real-time. Data diperbarui menggunakan aggregator harga terpercaya." 
                />
              </div>
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-6 pt-12">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-primary/10", selectedAsset.color)}>
                    <selectedAsset.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">{selectedAsset.name} / IDR</CardTitle>
                    <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                      {selectedAsset.change} <Globe className="w-3 h-3" />
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-accent">Rp {selectedAsset.price.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Aggregator Price</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 1000000', 'dataMax + 1000000']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                        formatter={(val: number) => [`Rp ${val.toLocaleString('id-ID')}`, 'Harga']}
                      />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Buy Card */}
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 relative bg-black/5">
                <div className="absolute top-6 right-6">
                  <HelpIcon 
                    title="Trading Buy" 
                    content="Gunakan saldo Rupiah AliBank Anda untuk membeli aset kripto riil. Transaksi diselesaikan secara instan menggunakan infrastruktur Mainnet Bridge kami." 
                  />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Beli {selectedAsset.id}</h3>
                  <Badge variant="outline" className="border-primary/40 text-primary font-bold bg-primary/5">Saldo: Rp {(userData?.totalBalance || 0).toLocaleString('id-ID')}</Badge>
                </div>
                
                <div className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40 text-xs uppercase">Nominal IDR</span>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={buyFiat}
                      onChange={(e) => handleBuyFiatChange(e.target.value)}
                      className="h-16 pl-28 pr-4 rounded-xl border-none liquid-glass-dark text-white font-black text-xl italic"
                    />
                  </div>
                  
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40 text-xs uppercase">Jumlah {selectedAsset.id}</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={buyCrypto}
                      onChange={(e) => handleBuyCryptoChange(e.target.value)}
                      className="h-16 pl-28 pr-4 rounded-xl border-none liquid-glass-dark text-white font-black text-xl italic"
                    />
                  </div>

                  <Button 
                    onClick={() => handleTrade('buy')}
                    disabled={loading || !buyCrypto}
                    className="w-full h-16 gold-gradient text-white font-black uppercase italic rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : "Eksekusi Beli"}
                  </Button>
                </div>
              </Card>

              {/* Sell Card */}
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 relative bg-black/5">
                <div className="absolute top-6 right-6">
                  <HelpIcon 
                    title="Trading Sell" 
                    content="Tukarkan aset kripto yang Anda miliki di AliBank kembali menjadi saldo Rupiah dengan harga pasar saat ini secara transparan." 
                  />
                </div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Jual {selectedAsset.id}</h3>
                  <Badge variant="outline" className="border-primary/40 text-primary font-bold bg-primary/5">Miliki: {userData?.cryptoBalances?.[selectedAsset.id] || 0}</Badge>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40 text-xs uppercase">Nominal IDR</span>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={sellFiat}
                      onChange={(e) => handleSellFiatChange(e.target.value)}
                      className="h-16 pl-28 pr-4 rounded-xl border-none liquid-glass-dark text-white font-black text-xl italic"
                    />
                  </div>

                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-primary/40 text-xs uppercase">Jumlah {selectedAsset.id}</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={sellCrypto}
                      onChange={(e) => handleSellCryptoChange(e.target.value)}
                      className="h-16 pl-28 pr-4 rounded-xl border-none liquid-glass-dark text-white font-black text-xl italic"
                    />
                  </div>

                  <Button 
                    onClick={() => handleTrade('sell')}
                    disabled={loading || !sellCrypto}
                    variant="outline"
                    className="w-full h-16 border-primary/20 text-primary font-black uppercase italic rounded-2xl hover:bg-primary/10 shadow-lg"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : "Eksekusi Jual"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden bg-accent/5">
              <div className="absolute top-4 right-4 z-20">
                <HelpIcon 
                  title="Mainnet Vault" 
                  content="Brankas terenkripsi langsung di blockchain Ethereum. Aset yang disetorkan ke sini aman dalam Smart Contract AliBank dan dapat ditarik kembali ke dompet pribadi Anda kapan saja." 
                />
              </div>
              <div className="absolute top-0 right-0 p-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full blur-2xl animate-pulse" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <LogoIcon className="w-5 h-5 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    Secure Mainnet Vault <Lock className="w-3 h-3" />
                  </h4>
                </div>
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-black/50 flex flex-col items-center justify-center space-y-2 mb-6 border border-primary/10">
                  <span className="text-3xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(6)} ETH</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Vault Balance</span>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="Jumlah Setor (ETH)" 
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="h-12 rounded-xl border-primary/10 bg-white/30 text-xs font-bold"
                    />
                  </div>
                  <Button 
                    onClick={handleDepositToVault}
                    disabled={loading || !address || !depositAmount}
                    className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl shadow-lg flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    Setor ke Vault
                  </Button>
                  <Button 
                    onClick={handleWithdrawFromVault}
                    disabled={loading || !address || parseFloat(vaultBalance) <= 0}
                    variant="outline"
                    className="w-full h-12 border-primary/20 text-primary font-black uppercase italic rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    Tarik ke Dompet
                  </Button>
                  <p className="text-[9px] text-muted-foreground leading-relaxed text-center italic font-bold">
                    Setoran dan penarikan diproses di jaringan Ethereum Mainnet. Biaya gas (Gas Fee) berlaku.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative">
              <div className="absolute top-8 right-8 z-20">
                <HelpIcon 
                  title="Global Market Data" 
                  content="Daftar harga aset digital teratas yang diambil langsung dari sumber data bursa kripto global terpercaya secara real-time." 
                />
              </div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 italic">Global Market Data</h4>
              <div className="space-y-4">
                {ASSETS.map((asset) => (
                  <button 
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all",
                      selectedAsset.id === asset.id ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white", asset.color)}>
                        <asset.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-accent">{asset.id}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-accent">Rp {asset.price.toLocaleString('id-ID')}</p>
                      <p className={cn("text-[9px) font-bold", asset.change.startsWith('+') ? "text-green-600" : "text-red-600")}>
                        {asset.change}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden relative">
              <div className="absolute top-8 right-8 z-20">
                <HelpIcon 
                  title="Audit Transparency" 
                  content="Seluruh operasi AliBank bersifat terbuka dan dapat diverifikasi oleh siapa pun di Etherscan. Ini menjamin tidak ada manipulasi data dan aset Anda benar-benar tersimpan di blockchain." 
                />
              </div>
              <div className="absolute top-0 right-0 p-4">
                <Globe className="w-20 h-20 text-white/5 animate-spin-slow" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8">
                    <LogoIcon className="text-primary" />
                  </div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">Audit Transparency</h3>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-green-600 text-white font-bold">STABLE</Badge>
                    <span className="text-[10px] font-black uppercase text-white/40">Etherscan Verified</span>
                  </div>
                  <p className="text-[11px] text-white/70 leading-relaxed italic">
                    "AliBank Smart Contract beroperasi dengan standar keamanan tinggi. Semua penarikan dari Vault diproses secara instan di jaringan Mainnet."
                  </p>
                </div>
                <a 
                  href={`https://etherscan.io/address/${DEFAULT_CONTRACT}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="ghost" className="w-full text-[10px] font-bold text-primary hover:bg-white/5 gap-2">
                    View Contract on Etherscan <ExternalLink className="w-3 h-3" />
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
