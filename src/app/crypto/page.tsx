
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
  Info,
  Sparkles
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

  // Simulation of spread (AliBank revenue model)
  const SERVICE_FEE_PERCENT = 0.005; // 0.5% fee

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
      console.error(err);
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
        } else if (userData?.walletAddress) {
          setAddress(userData.walletAddress);
          await checkMainnetBalances(userData.walletAddress);
        }
      }
      setIsInitializing(false);
    };
    sync();
    if (typeof window.ethereum !== 'undefined' && mounted) {
      const handleAccs = (accs: string[]) => {
        if (accs.length > 0) {
          setAddress(accs[0]);
          if (userDocRef) updateDoc(userDocRef, { walletAddress: accs[0] });
          checkMainnetBalances(accs[0]);
        } else {
          setAddress(null);
          resetBalances();
        }
      };
      window.ethereum.on('accountsChanged', handleAccs);
      return () => window.ethereum?.removeListener('accountsChanged', handleAccs);
    }
  }, [mounted, user, userData?.walletAddress, userDocRef, checkMainnetBalances, resetBalances]);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') return;
    try {
      setLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== 1n) {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: MAINNET_CHAIN_ID }],
        });
      }
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      if (userDocRef) updateDoc(userDocRef, { walletAddress: accounts[0] });
      await checkMainnetBalances(accounts[0]);
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet." });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyFiatChange = (val: string) => {
    setBuyFiat(val);
    if (!val || isNaN(parseFloat(val))) {
      setBuyCrypto("");
    } else {
      // Logic: User pays total amount, AliBank gets fee, remaining buys crypto
      const totalAmount = parseFloat(val);
      const fee = totalAmount * SERVICE_FEE_PERCENT;
      const effectiveAmount = totalAmount - fee;
      setBuyCrypto((effectiveAmount / selectedAsset.price).toFixed(8));
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
        updateDoc(userDocRef!, { 
          totalBalance: increment(-fiat), 
          [`cryptoBalances.${selectedAsset.id}`]: increment(qty) 
        });
      } else {
        const currentAssetBalance = userData?.cryptoBalances?.[selectedAsset.id] || 0;
        if (currentAssetBalance < qty) throw new Error(`Saldo ${selectedAsset.id} tidak cukup.`);
        updateDoc(userDocRef!, { 
          totalBalance: increment(fiat), 
          [`cryptoBalances.${selectedAsset.id}`]: increment(-qty) 
        });
      }

      addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${qty} ${selectedAsset.id} (Internal Exchange)`,
        category: "Trading",
        amount: fiat,
        feeIncluded: fiat * SERVICE_FEE_PERCENT,
        type: type === 'buy' ? 'expense' : 'income',
        timestamp: serverTimestamp()
      });

      toast({ title: "Success", description: "Transaksi berhasil diproses." });
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
            <p className="text-muted-foreground text-sm font-medium">Bursa aset riil AliBank. Bebas biaya admin bulanan, hanya biaya layanan per transaksi.</p>
          </div>
          
          <div className="flex items-center gap-4">
            {address ? (
              <Badge className={cn("font-bold h-10 px-4 rounded-full flex items-center gap-2", isWrongNetwork ? "bg-destructive" : "bg-green-600 text-white")}>
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
                      <Tooltip />
                      <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                <div className="flex justify-between items-center">
                   <h3 className="text-xl font-black italic uppercase text-primary">Beli {selectedAsset.id}</h3>
                   <HelpIcon title="Service Fee" content="AliBank mengenakan biaya layanan 0.5% untuk setiap transaksi beli sebagai pengganti biaya admin bulanan." />
                </div>
                <div className="space-y-4">
                  <Input type="number" placeholder="Nominal IDR" value={buyFiat} onChange={(e) => handleBuyFiatChange(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground">
                      <span>Service Fee (0.5%)</span>
                      <span>Rp {buyFiat ? (parseFloat(buyFiat) * SERVICE_FEE_PERCENT).toLocaleString('id-ID') : "0"}</span>
                    </div>
                  </div>
                  <Input type="number" readOnly placeholder={`Estimasi ${selectedAsset.id}`} value={buyCrypto} className="h-14 rounded-xl liquid-glass-dark text-white/50 font-bold" />
                  <Button onClick={() => handleTrade('buy')} disabled={loading || !buyCrypto} className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl">Eksekusi Beli</Button>
                </div>
              </Card>

              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6 bg-black/5">
                <h3 className="text-xl font-black italic uppercase text-primary">Jual {selectedAsset.id}</h3>
                <div className="space-y-4">
                  <Input type="number" placeholder={`Jumlah ${selectedAsset.id}`} value={sellCrypto} onChange={(e) => setSellCrypto(e.target.value)} className="h-14 rounded-xl liquid-glass-dark text-white font-bold" />
                  <Input type="number" readOnly placeholder="Estimasi IDR" value={sellFiat} className="h-14 rounded-xl liquid-glass-dark text-white/50 font-bold" />
                  <Button onClick={() => handleTrade('sell')} disabled={loading || !sellCrypto} variant="outline" className="w-full h-14 border-primary/20 text-primary font-black uppercase italic rounded-xl">Eksekusi Jual</Button>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
              <div className="absolute inset-0 gold-gradient opacity-10" />
              <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                <h3 className="text-lg font-black italic uppercase">The AliBank Promise</h3>
                <p className="text-[11px] font-medium leading-relaxed italic opacity-80">
                  Kami tidak membebani nasabah dengan biaya bulanan. Pendapatan kami murni dari volume transaksi dan kemitraan bisnis. Semakin Anda aktif bertransaksi, semakin kami berkembang bersama Anda.
                </p>
                <Badge className="bg-primary text-white font-black">ACTIVE POLICY: 0 ADMIN FEE</Badge>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 bg-accent/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-6">Mainnet Vault Balance <Lock className="w-3 h-3 text-primary" /></h4>
              <div className="p-6 rounded-2xl bg-black/40 flex flex-col items-center space-y-2 border border-primary/10">
                <span className="text-3xl font-black text-primary italic">{parseFloat(vaultBalance).toFixed(6)} ETH</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Secured Assets</span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
