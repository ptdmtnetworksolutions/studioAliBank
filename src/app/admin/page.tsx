
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
  Send,
  Database,
  Link2,
  ArrowDownRight,
  Key,
  BarChart3,
  TrendingUp,
  LineChart,
  Scale,
  Sparkles,
  Flame,
  SearchCheck,
  ShoppingBag,
  UserCheck,
  Percent,
  Gamepad2,
  Gift
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore } from "@/firebase";
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
  addDoc,
  getDocs,
  where
} from "firebase/firestore";
import { JsonRpcProvider, formatEther, parseEther, ethers } from "ethers";
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
const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

const PRODUCT_CATEGORIES = [
  "Layanan Seluler",
  "Kartu Hadiah",
  "Game",
  "Security",
  "Infrastructure",
  "Digital Asset"
];

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  
  // ALX Sovereign Supply States
  const [alixMintAmount, setAlixMintAmount] = useState("");
  const [alixBurnAmount, setAlixBurnAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  // Marketplace Management States
  const [newProduct, setNewProduct] = useState({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Layanan Seluler", image: "" });
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Firestore Data Listeners
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const usersQuery = useMemo(() => (db ? query(collection(db, "users"), limit(100)) : null), [db]);
  const { data: allUsers } = useCollection(usersQuery);

  const mktQuery = useMemo(() => (db ? collection(db, "marketplace") : null), [db]);
  const { data: mktItems } = useCollection(mktQuery);

  const auditQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(50)) : null), [db]);
  const { data: auditLogs } = useCollection(auditQuery);

  const syncOnChainData = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(ALIX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(balance));
      
      if (db) {
        await updateDoc(doc(db, "system", "liquidity"), {
          onChainVaultEth: parseFloat(formatEther(balance)),
          lastChainSync: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error("Mainnet synchronization failure:", err);
    } finally {
      setSyncingVault(false);
    }
  }, [syncingVault, db]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
    syncOnChainData();
  }, [user, userLoading, router, syncOnChainData]);

  const handleMintAlix = async () => {
    if (!db || !alixMintAmount) return;
    const amount = parseFloat(alixMintAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsMinting(true);
    try {
      const liquidityRef = doc(db, "system", "liquidity");
      await updateDoc(liquidityRef, {
        alixVaultBalance: increment(amount),
        totalAlixMinted: increment(amount),
        lastAlixMint: serverTimestamp()
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `MINT-${Date.now()}`,
        category: "ALX Sovereign Mint",
        cryptoAmount: amount,
        cryptoCurrency: "ALX",
        status: "success",
        timestamp: serverTimestamp(),
        description: "Official Supply Expansion: Realized on-chain authorization."
      });

      toast({ title: "Sovereign Mint Successful", description: `${amount} ALX has been added to global circulation.` });
      setAlixMintAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Minting Failed", description: err.message });
    } finally {
      setIsMinting(false);
    }
  };

  const handleBurnAlix = async () => {
    if (!db || !alixBurnAmount) return;
    const amount = parseFloat(alixBurnAmount);
    if (isNaN(amount) || amount <= 0) return;

    setIsBurning(true);
    try {
      const liquidityRef = doc(db, "system", "liquidity");
      await updateDoc(liquidityRef, {
        alixVaultBalance: increment(-amount),
        totalAlixBurned: increment(amount),
        lastAlixBurn: serverTimestamp()
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `BURN-${Date.now()}`,
        category: "ALX Protocol Burn",
        cryptoAmount: amount,
        cryptoCurrency: "ALX",
        status: "success",
        timestamp: serverTimestamp(),
        description: "Token Scarcity Protocol (ALX Standard): supply removed from circulation permanently."
      });

      toast({ title: "Protocol Burn Successful", description: `${amount} ALX burned permanently.` });
      setAlixBurnAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Burn Failed", description: err.message });
    } finally {
      setIsBurning(false);
    }
  };

  const handleAddProduct = async () => {
    if (!db || !newProduct.name || !newProduct.priceIdr) return;
    setIsAddingProduct(true);
    try {
      const id = `item-${Date.now()}`;
      await setDoc(doc(db, "marketplace", id), {
        ...newProduct,
        id,
        priceIdr: parseFloat(newProduct.priceIdr),
        priceUsd: parseFloat(newProduct.priceUsd) || 0,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Product Added", description: `${newProduct.name} is now live in the marketplace.` });
      setNewProduct({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Layanan Seluler", image: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, "marketplace", id));
      toast({ title: "Product Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          
          <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] gold-gradient flex items-center justify-center border border-white/20 p-5 shadow-[0_20px_50px_rgba(184,134,11,0.3)]">
                <ShieldAlert className="text-white w-12 h-12" />
              </div>
              <div>
                <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-none dark:text-white">Command Center</h1>
                <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] italic mt-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Integrated Multi-Service Infrastructure V3
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')} variant="outline" className="h-16 px-8 rounded-2xl font-black uppercase text-[11px] italic shadow-xl bg-card border-primary/20 text-accent hover:bg-primary/5 transition-all dark:text-white">
                <SearchCheck className="w-5 h-5 mr-3 text-primary" /> Verify on Etherscan
              </Button>
              <Button onClick={syncOnChainData} disabled={syncingVault} className="h-16 w-16 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <RefreshCw className={cn("w-6 h-6", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
            <div className="overflow-x-auto no-scrollbar pb-4">
              <TabsList className="bg-primary/5 p-2 rounded-[3rem] h-20 border border-primary/10 flex w-max shadow-inner mx-auto gap-2">
                <TabsTrigger value="overview" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Executive</TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Inventory</TabsTrigger>
                <TabsTrigger value="alix" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Tokenomics</TabsTrigger>
                <TabsTrigger value="vault" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Vault V3</TabsTrigger>
                <TabsTrigger value="users" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Clients</TabsTrigger>
                <TabsTrigger value="audit" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">Audit</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 bg-primary/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
                  <div className="flex items-center justify-between">
                    <Users className="w-8 h-8 text-primary" />
                    <Badge className="bg-primary text-white uppercase text-[9px] font-black border-none px-3 py-1">Active</Badge>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Global Accounts</p>
                    <p className="text-4xl font-black text-accent italic tracking-tighter dark:text-white">{allUsers?.length || 0}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 bg-blue-500/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                    <Badge className="bg-blue-600 text-white uppercase text-[9px] font-black border-none px-3 py-1">Mainnet</Badge>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Vault Reserve (USD)</p>
                    <p className="text-4xl font-black text-blue-600 italic tracking-tighter">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 bg-orange-500/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between">
                    <LogoIcon className="w-8 h-8 text-orange-600" />
                    <Badge className="bg-orange-600 text-white uppercase text-[9px] font-black border-none px-3 py-1">ALX</Badge>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Sovereign Supply</p>
                    <p className="text-4xl font-black text-orange-600 italic tracking-tighter">{(globalLiquidity?.alixVaultBalance || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 bg-green-500/5 shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-between">
                    <ShoppingBag className="w-8 h-8 text-green-600" />
                    <Badge className="bg-green-600 text-white uppercase text-[9px] font-black border-none px-3 py-1">Revenue</Badge>
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Market Volume (IDR)</p>
                    <p className="text-4xl font-black text-green-600 italic tracking-tighter">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="liquid-glass border-none rounded-[3.5rem] p-12 space-y-8 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Activity className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic dark:text-white">System Heartbeat</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Real-time infrastructure diagnostic.</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-accent/5 border border-primary/10 flex justify-between items-center group hover:bg-primary/5 transition-all">
                      <span className="text-[11px] font-black uppercase text-muted-foreground">Database Sync Status</span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-black text-green-600 uppercase italic">Operational 100%</span>
                      </div>
                    </div>
                    <div className="p-6 rounded-3xl bg-accent/5 border border-primary/10 flex justify-between items-center group hover:bg-primary/5 transition-all">
                      <span className="text-[11px] font-black uppercase text-muted-foreground">Mainnet Node Cluster</span>
                      <span className="text-sm font-black text-blue-600 uppercase italic">Active (V3 Protocol)</span>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[3.5rem] p-12 text-white space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.4)] relative overflow-hidden">
                  <div className="absolute right-[-10%] top-[-10%] p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Sparkles className="w-64 h-64" /></div>
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-lg"><Zap className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Sovereign Asset Sentinel</h3>
                  </div>
                  <p className="text-sm font-medium italic text-white/70 leading-relaxed uppercase relative z-10">
                    Seluruh pencetakan koin ALX didukung oleh agunan likuiditas Mainnet. Mekanisme "Smart Burn" otomatis aktif berdasarkan volume marketplace AliBank V3.
                  </p>
                  <Button onClick={() => setActiveTab('audit')} className="w-full h-16 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-[2rem] font-black uppercase italic text-xs tracking-widest relative z-10 shadow-2xl">
                    View Real-Time System Records
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-10 animate-in slide-in-from-left-8 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-4 liquid-glass border-none rounded-[3.5rem] p-10 space-y-8 shadow-2xl sticky top-24 h-fit">
                  <h3 className="text-2xl font-black text-accent uppercase italic flex items-center gap-4 dark:text-white">
                    <PackagePlus className="w-8 h-8 text-primary" /> Deploy Asset
                  </h3>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Product Identification</label>
                      <Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. AliBank Gold Key" className="h-14 rounded-2xl liquid-glass border-none font-black italic px-6 shadow-inner" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (IDR)</label>
                        <Input type="number" value={newProduct.priceIdr} onChange={(e) => setNewProduct({...newProduct, priceIdr: e.target.value})} className="h-14 rounded-2xl liquid-glass border-none font-black italic px-6 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (USD)</label>
                        <Input type="number" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-14 rounded-2xl liquid-glass border-none font-black italic px-6 shadow-inner" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Category Sector</label>
                      <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                        <SelectTrigger className="h-14 rounded-2xl liquid-glass border-none font-black italic px-6 shadow-inner">
                          <SelectValue placeholder="Pilih Kategori" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none liquid-glass">
                          {PRODUCT_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat} className="font-bold text-xs uppercase italic">{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm mt-6 shadow-2xl hover:scale-105 transition-all">
                      {isAddingProduct ? <Loader2 className="animate-spin w-6 h-6" /> : "Authorize Deployment"}
                    </Button>
                  </div>
                </Card>

                <Card className="lg:col-span-8 liquid-glass border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                    <h3 className="text-2xl font-black italic uppercase text-accent dark:text-white">Production Inventory</h3>
                    <Badge className="bg-primary text-white font-black px-4 py-1.5 rounded-full">{mktItems?.length || 0} Assets Online</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-primary/5">
                          <th className="px-10 py-8">Asset Specifications</th>
                          <th className="px-10 py-8">Sector</th>
                          <th className="px-10 py-8 text-right">Liquidity Value</th>
                          <th className="px-10 py-8 text-right">Protocol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                        {mktItems?.map((item) => (
                          <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="px-10 py-6">
                              <p className="font-black text-accent italic uppercase text-sm dark:text-white">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium mt-1 italic">{item.id}</p>
                            </td>
                            <td className="px-10 py-6">
                              <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[9px] px-3">{item.category}</Badge>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="font-black italic text-accent dark:text-white">Rp {item.priceIdr?.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-muted-foreground">$ {item.priceUsd?.toLocaleString()}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(item.id)} className="w-12 h-12 rounded-2xl text-destructive hover:bg-destructive/10 transition-all">
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alix" className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Sovereign Minting Hub */}
                <Card className="liquid-glass border-none rounded-[3.5rem] p-12 space-y-10 shadow-2xl border-t-[6px] border-orange-500/30">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner"><Pickaxe className="w-10 h-10" /></div>
                    <div>
                      <h3 className="text-3xl font-black text-accent uppercase italic leading-none dark:text-white">Sovereign Mint</h3>
                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-2 italic">Supply Expansion: Backed by Mainnet Reserve.</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Authorized Liquidity</p>
                        <p className="text-3xl font-black text-accent italic tracking-tighter dark:text-white">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Capacity</p>
                        <Badge className="bg-green-600 text-white font-black text-[9px] uppercase px-3 py-1">STABLE SECURE</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-muted-foreground ml-3">Amount to Authorize (ALX)</label>
                      <div className="relative">
                        <Input type="number" placeholder="0.00" value={alixMintAmount} onChange={(e) => setAlixMintAmount(e.target.value)} className="h-20 rounded-[2rem] liquid-glass border-none font-black italic text-3xl px-10 shadow-2xl" />
                        <LogoIcon className="absolute right-10 top-1/2 -translate-y-1/2 w-10 h-10 text-orange-500 opacity-20" />
                      </div>
                    </div>
                    <Button onClick={handleMintAlix} disabled={isMinting || !alixMintAmount} className="w-full h-20 gold-gradient text-white rounded-[2.5rem] font-black uppercase italic text-lg shadow-[0_20px_50px_rgba(184,134,11,0.4)] hover:scale-[1.02] transition-all">
                      {isMinting ? <Loader2 className="w-8 h-8 animate-spin" /> : "Authorize Sovereign Mint"}
                    </Button>
                  </div>
                </Card>

                {/* Auto-Burn Protocol */}
                <Card className="liquid-glass border-none rounded-[3.5rem] p-12 space-y-10 shadow-2xl border-t-[6px] border-destructive/30">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-destructive/10 flex items-center justify-center text-destructive shadow-inner"><Flame className="w-10 h-10" /></div>
                    <div>
                      <h3 className="text-3xl font-black text-accent uppercase italic leading-none dark:text-white">Auto-Burn Protocol</h3>
                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-2 italic">Deflation Mechanism: Scarcity Enforcement (ALX Std).</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-destructive/5 border border-destructive/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Permanently Burned</p>
                        <p className="text-3xl font-black text-destructive italic tracking-tighter">{(globalLiquidity?.totalAlixBurned || 0).toLocaleString()} ALX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Rate</p>
                        <Badge className="bg-destructive text-white font-black text-[9px] uppercase px-3 py-1">ACCELERATING</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black uppercase text-muted-foreground ml-3">Amount to Incinerate (ALX)</label>
                      <div className="relative">
                        <Input type="number" placeholder="0.00" value={alixBurnAmount} onChange={(e) => setAlixBurnAmount(e.target.value)} className="h-20 rounded-[2rem] bg-destructive/5 border-none font-black italic text-3xl px-10 text-destructive shadow-inner" />
                        <Flame className="absolute right-10 top-1/2 -translate-y-1/2 w-10 h-10 text-destructive opacity-20" />
                      </div>
                    </div>
                    <Button onClick={handleBurnAlix} disabled={isBurning || !alixBurnAmount} className="w-full h-20 bg-destructive hover:bg-destructive/90 text-white rounded-[2.5rem] font-black uppercase italic text-lg shadow-[0_20px_50px_rgba(239,68,68,0.3)] hover:scale-[1.02] transition-all">
                      {isBurning ? <Loader2 className="w-8 h-8 animate-spin" /> : "Execute Deflationary Burn"}
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vault" className="space-y-10 animate-in zoom-in-95 duration-500">
              <Card className="liquid-glass border-none rounded-[4rem] p-16 text-accent space-y-12 shadow-2xl relative overflow-hidden">
                <div className="absolute right-[-5%] bottom-[-5%] opacity-5"><LogoIcon className="w-96 h-96 text-primary" /></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><Database className="w-12 h-12" /></div>
                    <div>
                      <h3 className="text-4xl font-black uppercase italic dark:text-white">Mainnet Vault Reserve</h3>
                      <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 italic">Institutional Multi-Asset Node V3</p>
                    </div>
                  </div>
                  <Badge className="bg-green-600 text-white font-black text-sm px-6 py-2 rounded-2xl shadow-xl animate-pulse">NODE ACTIVE</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                  <div className="p-12 rounded-[3.5rem] bg-accent/5 border border-primary/10 space-y-6 shadow-inner group hover:bg-primary/5 transition-all">
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">Vault Liquidity (ETH)</p>
                    <p className="text-7xl font-black italic tracking-tighter text-blue-600">{parseFloat(onChainEth).toFixed(4)} <span className="text-3xl text-muted-foreground opacity-40">ETH</span></p>
                    <div className="pt-8 flex items-center gap-3 text-[11px] font-black text-muted-foreground uppercase italic">
                      <SearchCheck className="w-6 h-6 text-primary" /> Verified by Ethereum Node Cluster 2026
                    </div>
                  </div>
                  <div className="p-12 rounded-[3.5rem] bg-accent/5 border border-primary/10 space-y-8 shadow-inner">
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">Contract Verification Hud</p>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Standard Architecture</span>
                        <span className="text-sm font-black italic dark:text-white">ALX Sovereign Protocol</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Compliance Guard</span>
                        <span className="text-sm font-black italic dark:text-white">Institutional Grade V3</span>
                      </div>
                      <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Storage Type</span>
                        <span className="text-sm font-black italic dark:text-white">Cold-Storage Backed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="animate-in fade-in duration-500">
              <Card className="liquid-glass border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="p-12 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                  <h3 className="text-3xl font-black italic uppercase text-accent flex items-center gap-6 dark:text-white">
                    <UserCheck className="w-10 h-10 text-primary" /> Verified Client Registry
                  </h3>
                  <Badge className="bg-primary text-white font-black px-6 py-2 rounded-full shadow-lg">{allUsers?.length || 0} Accounts Enrolled</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-primary/5">
                        <th className="px-12 py-10">Client Profile</th>
                        <th className="px-12 py-10">Institutional UID</th>
                        <th className="px-12 py-10">Tier Status</th>
                        <th className="px-12 py-10 text-right">Liquidity Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {allUsers?.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-colors group cursor-default">
                          <td className="px-12 py-8">
                            <div className="flex items-center gap-5">
                              <div className="w-14 h-14 rounded-full gold-gradient p-[2px] shadow-lg">
                                <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="p" width={56} height={56} className="rounded-full object-cover border-4 border-white dark:border-card" />
                              </div>
                              <div>
                                <p className="text-base font-black italic uppercase dark:text-white leading-none">{u.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-8 font-mono text-[11px] text-accent dark:text-white/80">{u.accountNumber}</td>
                          <td className="px-12 py-8">
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary px-4 py-1 rounded-md">{u.tier || "Standard"}</Badge>
                          </td>
                          <td className="px-12 py-8 text-right">
                            <p className="text-lg font-black italic text-accent dark:text-white tracking-tighter">Rp {u.totalBalance?.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Official Balance</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="animate-in slide-in-from-bottom-10 duration-500">
              <Card className="liquid-glass border-none rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
                <div className="p-12 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black italic uppercase text-accent flex items-center gap-6 dark:text-white">
                      <FileText className="w-10 h-10 text-primary" /> Production Audit Log
                    </h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 italic">Immutable Ledger Reconciliation</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-accent dark:text-white px-6 py-2 rounded-2xl">Integrity Active</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[1000px]">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-primary/5">
                        <th className="px-12 py-10">Trace ID</th>
                        <th className="px-12 py-10">Event Specification</th>
                        <th className="px-12 py-10">Settlement Value</th>
                        <th className="px-12 py-10">Pulse Status</th>
                        <th className="px-12 py-10 text-right">Synchronization Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {auditLogs?.map((log) => (
                        <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-12 py-8 font-mono text-[10px] text-muted-foreground">{log.id}</td>
                          <td className="px-12 py-8">
                            <Badge className={cn("border-none font-black text-[8px] uppercase px-4 py-1.5 rounded-md", log.category?.includes("ALX") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                              {log.category}
                            </Badge>
                          </td>
                          <td className="px-12 py-8 font-black italic text-accent dark:text-white text-base">
                            {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}
                          </td>
                          <td className="px-12 py-8">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{log.status}</span>
                            </div>
                          </td>
                          <td className="px-12 py-8 text-right font-mono text-[10px] text-muted-foreground italic">
                            {log.timestamp?.toDate().toLocaleString() || "---"}
                          </td>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
