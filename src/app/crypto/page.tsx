
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
const MAINNET_CHAIN_ID = "0x1";

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
  }, []);

  // Sync wallet state only for the logged in user
  useEffect(() => {
    if (!user) {
      setAddress(null);
      resetBalances();
      return;
    }

    const syncWithMetaMask = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        // If the wallet address in Firestore doesn't match current MetaMask, or if MetaMask has accounts
        if (accounts.length > 0) {
          const currentMetaMaskAddr = accounts[0];
          setAddress(currentMetaMaskAddr);
          await checkMainnetBalances(currentMetaMaskAddr);
        } else if (userData?.walletAddress) {
          // Fallback to saved address if no active MetaMask session but data exists
          setAddress(userData.walletAddress);
          await checkMainnetBalances(userData.walletAddress);
        } else {
          setAddress(null);
          resetBalances();
        }
      }
      setIsInitializing(false);
    };

    if (mounted) syncWithMetaMask();

    // MetaMask Event Listeners
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
          resetBalances();
        }
      };

      const handleChainChanged = () => window.location.reload();

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [mounted, user, userData?.walletAddress, userDocRef, checkMainnetBalances, resetBalances]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') return;
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
          toast({ variant: "destructive", title: "Mainnet Required", description: "Gunakan Mainnet untuk aset riil." });
          return;
        }
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const activeAddr = accounts[0];
      setAddress(activeAddr);
      if (userDocRef) updateDoc(userDocRef, { walletAddress: activeAddr });
      await checkMainnetBalances(activeAddr);
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet." });
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    setAddress(null);
    resetBalances();
    if (userDocRef) {
      updateDoc(userDocRef, { walletAddress: null });
    }
    toast({ title: "Dompet Terputus", description: "Identitas Web3 Anda telah dilepas dari akun AliBank." });
  };

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

  const handleDepositToVault = async () => {
    if (!address || !depositAmount || typeof window.ethereum === 'undefined') return;
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      const tx = await contract.deposit({ value: parseEther(depositAmount) });
      await tx.wait();
      await checkMainnetBalances(address);
      setDepositAmount("");
      toast({ title: "Success", description: "Aset berhasil masuk ke Vault." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
      if (balance === 0n) throw new Error("Vault kosong.");
      const tx = await contract.withdraw(balance);
      await tx.wait();
      await checkMainnetBalances(address);
      toast({ title: "Success", description: "Aset ditarik ke dompet." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
        updateDoc(userDocRef!, { totalBalance: increment(-fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(qty) });
      } else {
        const currentAssetBalance = userData?.cryptoBalances?.[selectedAsset.id] || 0;
        if (currentAssetBalance < qty) throw new Error(`Saldo ${selectedAsset.id} tidak cukup.`);
        updateDoc(userDocRef!, { totalBalance: increment(fiat), [`cryptoBalances.${selectedAsset.id}`]: increment(-qty) });
      }

      addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${qty} ${selectedAsset.id} (Internal)`,
        category: "Trading",
        amount: fiat,
        type: type === 'buy' ? 'expense' : 'income',
        timestamp: serverTimestamp()
      });

      toast({ title: "Success", description: "Transaksi berhasil diselesaikan." });
      setBuyFiat(""); setBuyCrypto(""); setSellFiat(""); setSellCrypto("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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

  const internalBal = userData?.cryptoBalances?.[selectedAsset.id] || 0;

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
                Live Mainnet <Globe className="w-6 h-6 animate-pulse text-primary" />
              </h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Bursa aset riil AliBank dengan sinkronisasi blockchain global.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <Badge className={cn("font-bold h-10 px-4 rounded-full flex items-center gap-2", isWrongNetwork ? "bg-destructive text-white" : "bg-green-600 text-white")}>
                    {isWrongNetwork ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    {isWrongNetwork ? "Switch Network" : `${address.slice(0, 6)}...${address.slice(-4)}`}
                  </Badge>
                  <Button onClick={disconnectWallet} variant="ghost" size="icon" className="text-destructive rounded-full"><Unlink className="w-4 h-4" /></Button>
                </div>
                <p className="text-[10px] font-black text-primary uppercase pr-4 tracking-widest">
                  Wallet: {parseFloat(walletBalance).toFixed(4)} ETH
                </p>
              </div>
            ) : (
              <Button onClick={connectWallet} className="rounded-full gold-gradient text-white font-bold h-10 px-6 shadow-lg"><Wallet className="w-4 h-4 mr-2" /> Connect Wallet</Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl relative">
              <div className="absolute top-4 left-4 z-10"><Badge className="bg-primary text-white font-black italic">PROD-ACTIVE</Badge></div>
              <div className="absolute top-4 right-4 z-10"><HelpIcon title="Price Chart" content="Grafik pergerakan harga real-time dari pasar global." /></div>
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-6 pt-12">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-primary/10", selectedAsset.color)}><selectedAsset.icon className="w-6 h-6" /></div>
                  <div>
                    <CardTitle className="text-xl font-black">{selectedAsset.name} / IDR</CardTitle>
                    <p className="text-xs font-bold text-green-600 flex items-center gap-1">{selectedAsset.change} <Globe className="w-3 h-3" /></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-accent">Rp {selectedAsset.price.toLocaleString('id-ID')}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={MOCK_CHART_DATA}>
                      <defs><linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['dataMin - 1000000', 'dataMax + 1000000']} />
                      <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5 relative">
                <div className="absolute top-6 right-6"><HelpIcon title="Trading Buy" content="Beli aset internal AliBank menggunakan saldo Rupiah Anda." /></div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Beli {selectedAsset.id}</h3>
                <div className="space-y-4">
                  <Input type="number" placeholder="Nominal IDR" value={buyFiat} onChange={(e) => handleBuyFiatChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <Input type="number" placeholder={`Jumlah ${selectedAsset.id}`} value={buyCrypto} onChange={(e) => handleBuyCryptoChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <Button onClick={() => handleTrade('buy')} disabled={loading || !buyCrypto} className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl">Eksekusi Beli</Button>
                </div>
              </Card>

              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5 relative">
                <div className="absolute top-6 right-6"><HelpIcon title="Trading Sell" content="Jual aset internal Anda untuk mendapatkan saldo Rupiah." /></div>
                <div className="flex justify-between items-center"><h3 className="text-xl font-black italic uppercase tracking-tighter text-primary">Jual {selectedAsset.id}</h3><Badge className="bg-primary/20 text-primary">Saldo: {internalBal}</Badge></div>
                <div className="space-y-4">
                  <Input type="number" placeholder="Nominal IDR" value={sellFiat} onChange={(e) => handleSellFiatChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <Input type="number" placeholder={`Jumlah ${selectedAsset.id}`} value={sellCrypto} onChange={(e) => handleSellCryptoChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <Button onClick={() => handleTrade('sell')} disabled={loading || !sellCrypto} variant="outline" className="w-full h-14 border-primary/20 text-primary font-black uppercase italic rounded-xl">Eksekusi Jual</Button>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden bg-accent/5">
              <div className="absolute top-4 right-4 z-20"><HelpIcon title="Mainnet Vault" content="Brankas fisik terenkripsi langsung di blockchain Ethereum." /></div>
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6">Secure Mainnet Vault <Lock className="w-3 h-3 text-primary" /></h4>
                <div className="p-6 rounded-2xl bg-black/40 flex flex-col items-center space-y-2 mb-6 border border-primary/10">
                  <span className="text-3xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(6)} ETH</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Vault Balance</span>
                </div>
                <div className="space-y-3">
                  <Input type="number" placeholder="Jumlah Setor (ETH)" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-12 rounded-xl bg-white/5 border-primary/10 text-white" />
                  <Button onClick={handleDepositToVault} disabled={loading || !address || !depositAmount} className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl shadow-lg"><ArrowUpRight className="w-5 h-5 mr-2" /> Setor ke Vault</Button>
                  <Button onClick={handleWithdrawFromVault} disabled={loading || !address || parseFloat(vaultBalance) <= 0} variant="outline" className="w-full h-12 border-primary/20 text-primary font-black uppercase italic rounded-xl"><ArrowDownLeft className="w-4 h-4 mr-2" /> Tarik ke Dompet</Button>
                  <p className="text-[9px] text-muted-foreground leading-relaxed text-center italic font-bold">Saldo Vault adalah aset riil di Mainnet, terpisah dari saldo Jual (Internal).</p>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative">
              <div className="absolute top-8 right-8 z-20"><HelpIcon title="Market Data" content="Data harga aset digital teratas dari bursa global." /></div>
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6 italic">Global Market Data</h4>
              <div className="space-y-4">
                {ASSETS.map((asset) => (
                  <button key={asset.id} onClick={() => setSelectedAsset(asset)} className={cn("w-full flex items-center justify-between p-4 rounded-2xl transition-all", selectedAsset.id === asset.id ? "bg-primary/10 border border-primary/20 shadow-sm" : "hover:bg-primary/5")}>
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl bg-white", asset.color)}><asset.icon className="w-5 h-5" /></div>
                      <div className="text-left"><p className="text-sm font-black text-accent">{asset.id}</p><p className="text-[9px] font-bold text-muted-foreground uppercase">{asset.name}</p></div>
                    </div>
                    <div className="text-right"><p className="text-sm font-black text-accent">Rp {asset.price.toLocaleString('id-ID')}</p><p className={cn("text-[9px] font-bold", asset.change.startsWith('+') ? "text-green-600" : "text-red-600")}>{asset.change}</p></div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
