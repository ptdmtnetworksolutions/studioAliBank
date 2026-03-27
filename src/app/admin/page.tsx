
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldAlert, 
  ShieldCheck,
  Loader2,
  RefreshCw,
  Coins,
  Zap,
  Pickaxe,
  Box,
  ExternalLink,
  BookOpen,
  Building2,
  CheckCircle2,
  PackagePlus,
  CreditCard,
  DollarSign,
  Plus,
  Trash2,
  Users,
  ArrowRightLeft,
  Activity,
  ArrowUpRight,
  LayoutGrid,
  FileText,
  Wallet,
  X,
  Lock,
  Unlock,
  AlertCircle,
  Smartphone,
  Globe,
  Info,
  Bitcoin,
  Cpu,
  ArrowDownToLine,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  increment, 
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";

const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com"; 
const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

const CONTRACT_ABI = [
  "function getTotalVaultBalance() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function releaseFunds(address _to, uint256 _amount) public",
  "function withdraw(uint256 _amount) public",
  "function deposit() public payable",
  "function balances(address) public view returns (uint256)"
];

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainTotal, setOnChainTotal] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [isSettling, setIsSettling] = useState(false);
  const [isFirewallActive, setIsFirewallActive] = useState(true);
  const [usingGlobalNode, setUsingGlobalNode] = useState(true);
  
  // State Form Inventaris
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceIdr: "",
    category: "Infrastruktur",
    image: ""
  });

  // State Manajemen Brankas
  const [vaultDepositAmount, setVaultVaultDepositAmount] = useState("");
  const [vaultAssetType, setVaultAssetType] = useState<"BTC" | "ETH" | "USDT">("ETH");

  // Listener Data Riil
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const mktQuery = useMemo(() => (db ? collection(db, "marketplace") : null), [db]);
  const { data: products } = useCollection(mktQuery);

  const txQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(15)) : null), [db]);
  const { data: globalHistory } = useCollection(txQuery);

  const bridgeQuery = useMemo(() => (db ? query(collection(db, "system", "bridge", "queue"), orderBy("timestamp", "desc")) : null), [db]);
  const { data: bridgeQueue } = useCollection(bridgeQuery);

  const adminDocRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: adminData } = useDoc(adminDocRef);

  // MESIN MINING ALIX
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);

  const syncOnChainVault = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      let provider;
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        provider = new BrowserProvider(window.ethereum);
        setUsingGlobalNode(false);
      } else {
        provider = new JsonRpcProvider(GLOBAL_RPC);
        setUsingGlobalNode(true);
      }

      const balance = await provider.getBalance(DEFAULT_CONTRACT).catch(() => 0n);
      setOnChainTotal(formatEther(balance));
    } catch (err: any) {
      console.error("Sinkronisasi gagal:", err);
    } finally {
      setSyncingVault(false);
    }
  }, [syncingVault]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
    syncOnChainVault();
  }, [user, userLoading, router, syncOnChainVault]);

  useEffect(() => {
    let miningInterval: NodeJS.Timeout;
    if (isMining && db) {
      miningInterval = setInterval(async () => {
        const currentHash = Math.floor(Math.random() * 1200) + 2500;
        setHashrate(currentHash);

        if (Math.random() > 0.92) {
          const reward = 0.5;
          const platformRef = doc(db, "system", "liquidity");
          updateDoc(platformRef, { 
            alixVaultBalance: increment(reward),
            totalAlixMinted: increment(reward),
            lastMintingPulse: serverTimestamp()
          }).catch(() => {});
        }
      }, 1500);
    } else {
      setHashrate(0);
    }
    return () => clearInterval(miningInterval);
  }, [isMining, db]);

  const handleBroadcastBridge = async (bridgeId: string, asset: string, amount: number, recipient: string) => {
    if (!db || isSettling) return;
    setIsSettling(true);
    try {
      // Simulasi Broadcaster Node ke Network BTC/Mainnet
      const bridgeRef = doc(db, "system", "bridge", "queue", bridgeId);
      await updateDoc(bridgeRef, {
        status: "broadcasted",
        broadcastTime: serverTimestamp(),
        txId: `PROX-${Math.random().toString(36).substring(2, 15).toUpperCase()}`
      });

      toast({ title: "Bridge Broadcasted", description: `Aset ${amount} ${asset} telah disiarkan ke network tujuan.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Broadcast Gagal", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleAddProduct = async () => {
    if (!db || !newProduct.name || !newProduct.priceUsd) return;
    setIsSettling(true);
    try {
      const id = `prod-${Date.now()}`;
      await setDoc(doc(db, "marketplace", id), {
        ...newProduct,
        id,
        priceUsd: parseFloat(newProduct.priceUsd),
        priceIdr: parseFloat(newProduct.priceIdr) || parseFloat(newProduct.priceUsd) * 15500,
        stock: 99,
        image: newProduct.image || "https://picsum.photos/seed/node/600/400",
        createdAt: new Date().toISOString()
      });
      setIsAddingProduct(false);
      toast({ title: "Produk Terbit" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleDepositToVault = async () => {
    if (!db || !user || !adminData || !vaultDepositAmount) return;
    const amount = parseFloat(vaultDepositAmount);
    if (isNaN(amount) || amount <= 0) return;

    const currentBal = adminData.cryptoBalances?.[vaultAssetType] || 0;
    if (amount > currentBal) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup" });
      return;
    }

    setIsSettling(true);
    try {
      const adminRef = doc(db, "users", user.uid);
      await updateDoc(adminRef, { [`cryptoBalances.${vaultAssetType}`]: increment(-amount) });

      const ethEquivalent = vaultAssetType === 'BTC' ? amount * 15 : vaultAssetType === 'USDT' ? amount * 0.0003 : amount;
      await updateDoc(doc(db, "system", "liquidity"), { totalProfitDistributed: increment(ethEquivalent) });

      toast({ title: "Aset Masuk Brankas" });
      setVaultVaultDepositAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa]">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          
          <header className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center border border-white/20 p-4 shadow-2xl">
                <ShieldAlert className="text-white w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Pusat Komando</h1>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Infrastruktur: {DEFAULT_CONTRACT}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsMining(!isMining)} className={cn("h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl transition-all", isMining ? "bg-destructive text-white" : "gold-gradient text-white")}>
                {isMining ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Hentikan Node</> : <><Pickaxe className="w-4 h-4 mr-2" /> Jalankan Node ALIX</>}
              </Button>
              <Button onClick={syncOnChainVault} disabled={syncingVault} className="h-14 w-14 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-primary/5 p-1 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-6 lg:w-full shadow-sm overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Ikhtisar</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Pasar</TabsTrigger>
              <TabsTrigger value="bridge" className="rounded-[1.5rem] font-black uppercase text-[10px] italic relative">
                Bridge {bridgeQueue?.filter(b => b.status === 'pending_broadcast').length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">!</span>}
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Jembatan</TabsTrigger>
              <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Brankas</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Audit</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <Badge className="bg-primary/10 text-primary uppercase text-[8px] font-black">Kas Gateway</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Gateway Bersih</p>
                    <p className="text-3xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-blue-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Wallet className="w-6 h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[8px] font-black">Brankas Riil</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Fisik ETH</p>
                    <p className="text-3xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-orange-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Pickaxe className="w-6 h-6 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-600 uppercase text-[8px] font-black">Mining</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jatah Profit</p>
                    <p className="text-3xl font-black text-orange-600 italic">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)} ALIX</p>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white flex flex-col justify-center shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Payout V3</p>
                  <h3 className="text-2xl font-black italic uppercase leading-none">Tarik Profit</h3>
                  <Button onClick={() => router.push('/crypto')} className="w-full h-10 gold-gradient text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg mt-4">Kelola Profit</Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bridge" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] p-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <ArrowRightLeft className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-accent uppercase italic">Ali-Bridge Broadcaster</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Antrean Pengiriman Aset Antar Network (BTC/USDT).</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {bridgeQueue && bridgeQueue.length > 0 ? bridgeQueue.map((item: any) => (
                    <div key={item.id} className="p-6 rounded-3xl bg-accent/5 border border-primary/10 flex flex-col lg:flex-row justify-between items-center gap-6 group hover:bg-accent/10 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black", item.asset === 'BTC' ? 'bg-orange-500' : 'bg-green-600')}>
                          {item.asset[0]}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="text-lg font-black text-accent italic">{item.amount} {item.asset}</p>
                            <Badge variant="outline" className={cn("text-[8px] font-black uppercase", item.status === 'broadcasted' ? 'text-green-600 border-green-200' : 'text-amber-600 border-amber-200')}>
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase break-all">Tujuan: {item.recipient}</p>
                          <p className="text-[8px] text-muted-foreground uppercase italic">Oleh Nasabah: {item.userName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {item.status === 'pending_broadcast' ? (
                          <Button 
                            onClick={() => handleBroadcastBridge(item.id, item.asset, item.amount, item.recipient)}
                            disabled={isSettling}
                            className="h-12 px-8 gold-gradient text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg"
                          >
                            {isSettling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Siarkan ke Network Luar</>}
                          </Button>
                        ) : (
                          <div className="text-right">
                            <p className="text-[8px] font-black text-green-600 uppercase">TXID: {item.txId}</p>
                            <p className="text-[7px] text-muted-foreground uppercase">{new Date(item.broadcastTime?.seconds * 1000).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center space-y-4">
                      <Activity className="w-12 h-12 text-primary/10 mx-auto" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tidak ada antrean bridge aktif.</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-end gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-accent uppercase italic">Manajer Pasar</h2>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Kelola produk riil di database AliBank.</p>
                </div>
                <Button onClick={() => setIsAddingProduct(!isAddingProduct)} className="h-12 px-6 rounded-xl gold-gradient text-white font-black uppercase text-[10px] italic shadow-lg">
                  {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingProduct ? "Batal" : "Tambah Item"}
                </Button>
              </div>

              {isAddingProduct && (
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 mb-8 animate-in fade-in slide-in-from-top-2 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Produk</label><Input placeholder="Master Node V3" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Harga (USD)</label><Input type="number" placeholder="1000" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Deskripsi</label><Input placeholder="Detail teknis..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                  </div>
                  <Button onClick={handleAddProduct} disabled={isSettling} className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic text-sm shadow-xl">Publikasikan</Button>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products?.map((p: any) => (
                  <Card key={p.id} className="liquid-glass border-none rounded-[2rem] overflow-hidden group shadow-lg">
                    <div className="relative h-40 overflow-hidden bg-white/5"><Image src={p.image || "https://picsum.photos/seed/node/600/400"} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div><h4 className="text-sm font-black text-accent uppercase italic">{p.name}</h4><p className="text-[9px] text-muted-foreground font-bold italic line-clamp-1">{p.description}</p></div>
                        <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(db!, "marketplace", p.id))} className="text-destructive/40 hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <p className="text-lg font-black text-primary italic">$ {p.priceUsd?.toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="vault" className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Lock className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic">Manajer Brankas</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Pindahkan Aset Digital Kripto ke Brankas V3.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {['BTC', 'ETH', 'USDT'].map((type) => (
                        <button key={type} onClick={() => setVaultAssetType(type as any)} className={cn("p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all", vaultAssetType === type ? "border-primary bg-primary/5" : "border-primary/5")}>
                          {type === 'BTC' ? <Bitcoin className={vaultAssetType === 'BTC' ? "text-orange-500" : "text-muted-foreground"} /> : type === 'ETH' ? <Cpu className={vaultAssetType === 'ETH' ? "text-blue-500" : "text-muted-foreground"} /> : <ShieldCheck className={vaultAssetType === 'USDT' ? "text-green-500" : "text-muted-foreground"} />}
                          <span className="text-[10px] font-black uppercase">{type}</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Jumlah {vaultAssetType}</label>
                      <Input type="number" placeholder="0.00" value={vaultDepositAmount} onChange={(e) => setVaultVaultDepositAmount(e.target.value)} className="h-14 rounded-2xl liquid-glass border-none font-black italic text-lg" />
                      <p className="text-[8px] font-bold text-muted-foreground uppercase px-1">Tersedia: {adminData?.cryptoBalances?.[vaultAssetType] || 0} {vaultAssetType}</p>
                    </div>

                    <Button onClick={handleDepositToVault} disabled={isSettling || !vaultDepositAmount} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-2xl">
                      {isSettling ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pindahkan ${vaultAssetType} ke Brankas`}
                    </Button>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 text-white space-y-6 flex flex-col justify-center shadow-2xl">
                  <div className="text-center space-y-4">
                    <ShieldCheck className="w-16 h-16 text-primary mx-auto" />
                    <h3 className="text-3xl font-black uppercase italic">Status Likuiditas</h3>
                    <div className="space-y-2 pt-4 border-t border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Estimasi Total Likuiditas Terserap</p>
                      <p className="text-5xl font-black text-primary italic">{(globalLiquidity?.totalProfitDistributed || 0).toFixed(4)} ETH</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="animate-in fade-in duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5"><h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3"><FileText className="w-6 h-6 text-primary" /> Log Audit Ekosistem</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">ID Transaksi</th><th className="px-8 py-6">Kategori</th><th className="px-8 py-6">Nominal</th><th className="px-8 py-6">Status</th><th className="px-8 py-6 text-right">Waktu</th></tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {globalHistory?.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5"><p className="text-[10px] font-black text-accent uppercase">#{tx.id?.slice(-10)}</p></td>
                          <td className="px-8 py-5"><Badge className="text-[7px] font-black uppercase bg-primary/10 text-primary border-none">{tx.category}</Badge></td>
                          <td className="px-8 py-5"><p className="text-sm font-black text-accent italic">{tx.amountUsd ? `$ ${tx.amountUsd.toLocaleString()}` : tx.cryptoAmount ? `${tx.cryptoAmount} ${tx.cryptoCurrency}` : '---'}</p></td>
                          <td className="px-8 py-5"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[9px] font-bold uppercase">{tx.status || 'Berhasil'}</span></div></td>
                          <td className="px-8 py-5 text-right"><p className="text-[10px] font-bold text-muted-foreground">{tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000).toLocaleString() : 'Baru saja'}</p></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
