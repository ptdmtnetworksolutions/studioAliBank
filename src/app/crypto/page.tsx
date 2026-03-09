
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Zap, 
  Wallet,
  Coins,
  ArrowRightLeft,
  LineChart,
  BarChart3,
  History,
  Sparkles,
  Info,
  Link2,
  Unlink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import { BrowserProvider, formatEther, parseEther, Contract } from "ethers";
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

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)"
];

const DEFAULT_CONTRACT = "0x59B9149D05138c6709D3552783aA3b85f992C79c";

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
  const [tradeAmount, setTradeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState("0");

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  // Auto-connect if walletAddress is stored in profile
  useEffect(() => {
    if (userData?.walletAddress && !address) {
      setAddress(userData.walletAddress);
      checkVaultBalance(userData.walletAddress);
    }
  }, [userData, address]);

  const checkVaultBalance = async (walletAddr: string) => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
        const vault = await contract.balances(walletAddr);
        setVaultBalance(formatEther(vault));
      } catch (err) {
        console.error("Failed to read vault balance:", err);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      const dappUrl = window.location.href.split('://')[1];
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const newAddress = accounts[0];
      setAddress(newAddress);
      
      // Persist the connection to Firestore
      if (userDocRef) {
        await updateDoc(userDocRef, {
          walletAddress: newAddress
        });
      }

      await checkVaultBalance(newAddress);
      toast({ title: "Dompet Terhubung", description: "Alamat dompet Anda telah tertaut secara permanen dengan akun AliBank." });
    } catch (err) {
      toast({ variant: "destructive", title: "Web3 Error", description: "Gagal menghubungkan dompet." });
    }
  };

  const disconnectWallet = async () => {
    if (!userDocRef) return;
    try {
      await updateDoc(userDocRef, {
        walletAddress: null
      });
      setAddress(null);
      setVaultBalance("0");
      toast({ title: "Dompet Diputuskan", description: "Hubungan dompet telah dihapus dari profil Anda." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal", description: "Gagal memutuskan hubungan dompet." });
    }
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user || !db || !tradeAmount) return;
    setLoading(true);

    const amount = parseFloat(tradeAmount);
    const totalCost = amount * selectedAsset.price;

    try {
      if (type === 'buy') {
        if ((userData?.totalBalance || 0) < totalCost) {
          throw new Error("Saldo IDR tidak mencukupi.");
        }
        
        await updateDoc(userDocRef!, {
          totalBalance: increment(-totalCost),
          [`cryptoBalances.${selectedAsset.id}`]: increment(amount)
        });
      } else {
        const currentAssetBalance = userData?.cryptoBalances?.[selectedAsset.id] || 0;
        if (currentAssetBalance < amount) {
          throw new Error(`Saldo ${selectedAsset.id} tidak mencukupi.`);
        }

        await updateDoc(userDocRef!, {
          totalBalance: increment(totalCost),
          [`cryptoBalances.${selectedAsset.id}`]: increment(-amount)
        });
      }

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Beli' : 'Jual'} ${amount} ${selectedAsset.id}`,
        category: "Trading",
        amount: totalCost,
        type: type === 'buy' ? 'expense' : 'income',
        timestamp: serverTimestamp()
      });

      toast({ title: "Eksekusi Berhasil", description: `Transaksi ${type === 'buy' ? 'pembelian' : 'penjualan'} ${selectedAsset.id} selesai.` });
      setTradeAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Transaksi Gagal", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl">
                <Coins className="text-white w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Crypto Exchange</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Platform bursa kripto elit AliBank dengan koneksi dompet persisten.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Saldo Utama</p>
              <p className="text-lg font-black text-accent dark:text-primary">Rp {(userData?.totalBalance || 0).toLocaleString('id-ID')}</p>
            </div>
            {address ? (
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white font-bold h-10 px-4 rounded-full flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> {address.slice(0, 6)}...{address.slice(-4)}
                </Badge>
                <Button onClick={disconnectWallet} variant="ghost" size="icon" className="text-destructive hover:bg-destructive/5 rounded-full">
                  <Unlink className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={connectWallet} variant="outline" className="rounded-full border-primary/20 text-primary font-bold h-10 px-6">
                <Wallet className="w-4 h-4 mr-2" /> Hubungkan Wallet
              </Button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Trading Area */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className={cn("p-3 rounded-2xl bg-primary/10", selectedAsset.color)}>
                    <selectedAsset.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black">{selectedAsset.name} / IDR</CardTitle>
                    <p className="text-xs font-bold text-green-600">{selectedAsset.change} (24h)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-accent">Rp {selectedAsset.price.toLocaleString('id-ID')}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Live Price</p>
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
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Beli {selectedAsset.id}</h3>
                  <Badge variant="outline" className="border-primary/20 text-primary">Instan</Badge>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary/40">{selectedAsset.id}</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="h-14 rounded-xl border-none liquid-glass-dark text-white font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Estimasi Biaya:</span>
                    <span className="text-accent">Rp {((parseFloat(tradeAmount) || 0) * selectedAsset.price).toLocaleString('id-ID')}</span>
                  </div>
                  <Button 
                    onClick={() => handleTrade('buy')}
                    disabled={loading || !tradeAmount}
                    className="w-full h-14 gold-gradient text-white font-black uppercase italic rounded-xl shadow-lg"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : "Eksekusi Beli"}
                  </Button>
                </div>
              </Card>

              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Jual {selectedAsset.id}</h3>
                  <p className="text-[10px] font-bold text-muted-foreground">Saldo: {userData?.cryptoBalances?.[selectedAsset.id] || 0}</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-primary/40">{selectedAsset.id}</span>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="h-14 rounded-xl border-none liquid-glass-dark text-white font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                    <span>Akan Menerima:</span>
                    <span className="text-green-600 font-black">Rp {((parseFloat(tradeAmount) || 0) * selectedAsset.price).toLocaleString('id-ID')}</span>
                  </div>
                  <Button 
                    onClick={() => handleTrade('sell')}
                    disabled={loading || !tradeAmount}
                    variant="outline"
                    className="w-full h-14 border-primary/20 text-primary font-black uppercase italic rounded-xl"
                  >
                    {loading ? <RefreshCw className="animate-spin" /> : "Eksekusi Jual"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="text-primary w-6 h-6" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">AI Market Insight</h3>
              </div>
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[10px] font-black text-primary uppercase mb-2 tracking-widest">Sinyal Saat Ini</p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-600 text-white font-bold px-4 py-1">STRONG BUY</Badge>
                    <p className="text-xs font-medium">Conf: 92%</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed italic">
                  "Tren pasar menunjukkan akumulasi kuat pada aset {selectedAsset.id}. Koneksi dompet persisten Anda memastikan eksekusi perdagangan yang lebih cepat."
                </p>
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-white/50">Resistance</span>
                    <span>Rp {(selectedAsset.price * 1.05).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase">
                    <span className="text-white/50">Support</span>
                    <span>Rp {(selectedAsset.price * 0.95).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8">
              <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-6">Aset Populer</h4>
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
                      <p className={cn("text-[9px] font-bold", asset.change.startsWith('+') ? "text-green-600" : "text-red-600")}>
                        {asset.change}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden group">
              <div className="absolute inset-0 gold-gradient opacity-5 group-hover:opacity-10 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-4 h-4 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Riwayat Vault</h4>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 flex justify-between items-center mb-4">
                  <span className="text-xs font-bold text-accent">Saldo Kustodian</span>
                  <span className="text-lg font-black text-primary">{parseFloat(vaultBalance).toFixed(4)} ETH</span>
                </div>
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest h-10 hover:bg-primary/5">
                  Buka Explorer <ArrowRightLeft className="w-3 h-3 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
