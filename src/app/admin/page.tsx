
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
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  
  // ALIX Real Supply States
  const [alixMintAmount, setAlixMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);

  // Marketplace Management States
  const [newProduct, setNewProduct] = useState({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Security", image: "" });
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
        category: "ALIX Sovereign Mint",
        cryptoAmount: amount,
        cryptoCurrency: "ALIX",
        status: "success",
        timestamp: serverTimestamp(),
        description: "Official Supply Expansion: Realized on-chain authorization."
      });

      toast({ title: "Sovereign Mint Successful", description: `${amount} ALIX has been added to global circulation.` });
      setAlixMintAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Minting Failed", description: err.message });
    } finally {
      setIsMinting(false);
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
      setNewProduct({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Security", image: "" });
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
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter leading-none">Command Center</h1>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic mt-1 flex items-center gap-2">
                  <Globe className="w-3 h-3 text-primary" /> Integrated Multi-Service Infrastructure
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')} variant="outline" className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl bg-white border-primary/20 text-accent hover:bg-primary/5 transition-all">
                <SearchCheck className="w-4 h-4 mr-2 text-primary" /> Verify on Etherscan
              </Button>
              <Button onClick={syncOnChainData} disabled={syncingVault} className="h-14 w-14 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center shadow-lg">
                <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <div className="overflow-x-auto no-scrollbar pb-2">
              <TabsList className="bg-primary/5 p-1.5 rounded-[2.5rem] h-16 border border-primary/10 flex w-max shadow-sm mx-auto">
                <TabsTrigger value="overview" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">Executive</TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">Inventory</TabsTrigger>
                <TabsTrigger value="alix" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">ALIX Tokenomics</TabsTrigger>
                <TabsTrigger value="vault" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">Vault V3</TabsTrigger>
                <TabsTrigger value="users" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">User Base</TabsTrigger>
                <TabsTrigger value="audit" className="rounded-[2rem] font-black uppercase text-[10px] italic px-6">Audit Log</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Users className="w-6 h-6 text-primary" />
                    <Badge className="bg-primary text-white uppercase text-[8px] font-black border-none">Total Clients</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Accounts</p>
                    <p className="text-3xl font-black text-accent italic tracking-tighter">{allUsers?.length || 0}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-blue-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[8px] font-black border-none">Mainnet Reserve</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vault Balance (USD)</p>
                    <p className="text-3xl font-black text-blue-600 italic tracking-tighter">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-orange-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Coins className="w-6 h-6 text-orange-600" />
                    <Badge className="bg-orange-600 text-white uppercase text-[8px] font-black border-none">ALIX Supply</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Circulating Tokens</p>
                    <p className="text-3xl font-black text-orange-600 italic tracking-tighter">{(globalLiquidity?.alixVaultBalance || 0).toLocaleString()} ALIX</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-green-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <ShoppingBag className="w-6 h-6 text-green-600" />
                    <Badge className="bg-green-600 text-white uppercase text-[8px] font-black border-none">Revenue Flow</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Marketplace Volume</p>
                    <p className="text-3xl font-black text-green-600 italic tracking-tighter">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Activity className="w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-accent uppercase italic">System Performance Pulse</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Database Sync Status</span>
                      <span className="text-xs font-black text-green-600 uppercase">Operational • 100%</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Internal Settlement Hub</span>
                      <span className="text-xs font-black text-green-600 uppercase">Online</span>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-8 opacity-10"><Sparkles className="w-32 h-32" /></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary"><Zap className="w-6 h-6" /></div>
                    <h3 className="text-xl font-black text-white uppercase italic">AI Security Sentinel</h3>
                  </div>
                  <p className="text-xs font-medium italic text-white/70 leading-relaxed uppercase">
                    Seluruh mutasi data sedang dipantau secara real-time. Deteksi anomali pada Smart Contract V3 diaktifkan melalui Node Ethereum.
                  </p>
                  <Button onClick={() => setActiveTab('audit')} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-black uppercase italic text-[10px]">View Full System Logs</Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-8 animate-in slide-in-from-left-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-1 liquid-glass border-none rounded-[3rem] p-8 space-y-6 shadow-xl">
                  <h3 className="text-xl font-black text-accent uppercase italic flex items-center gap-3"><PackagePlus className="w-6 h-6 text-primary" /> New Product</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Product Name</label><Input value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl liquid-glass border-none font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Price (IDR)</label><Input type="number" value={newProduct.priceIdr} onChange={(e) => setNewProduct({...newProduct, priceIdr: e.target.value})} className="h-12 rounded-xl liquid-glass border-none font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Price (USD)</label><Input type="number" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-12 rounded-xl liquid-glass border-none font-bold" /></div>
                    <div className="space-y-1.5"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label><Input value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="h-12 rounded-xl liquid-glass border-none font-bold" /></div>
                    <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full h-12 gold-gradient text-white rounded-xl font-black uppercase italic mt-4">{isAddingProduct ? <Loader2 className="animate-spin" /> : "Deploy to Marketplace"}</Button>
                  </div>
                </Card>

                <Card className="lg:col-span-2 liquid-glass border-none rounded-[3rem] overflow-hidden shadow-xl">
                  <div className="p-8 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                    <h3 className="text-xl font-black italic uppercase text-accent">Active Inventory</h3>
                    <Badge className="bg-primary text-white">{mktItems?.length || 0} Items</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead><tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">Product</th><th className="px-8 py-6">Category</th><th className="px-8 py-6 text-right">Price</th><th className="px-8 py-6 text-right">Actions</th></tr></thead>
                      <tbody className="divide-y divide-primary/5">
                        {mktItems?.map((item) => (
                          <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                            <td className="px-8 py-5 font-bold text-accent italic">{item.name}</td>
                            <td className="px-8 py-5 text-[10px] font-black uppercase"><Badge variant="outline" className="border-primary/20">{item.category}</Badge></td>
                            <td className="px-8 py-5 text-right font-black italic text-accent">Rp {item.priceIdr?.toLocaleString()}</td>
                            <td className="px-8 py-5 text-right"><Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(item.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alix" className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8 shadow-2xl border-t-4 border-orange-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner"><Pickaxe className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic leading-none">ALIX Sovereign Mint</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Authorized creation of ALIX assets on the verified ledger.</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div><p className="text-[9px] font-black uppercase text-muted-foreground">Authorized Reserve Value</p><p className="text-2xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p></div>
                      <div className="text-right"><p className="text-[9px] font-black uppercase text-muted-foreground">Audit Grade</p><p className="text-xs font-bold text-green-600 uppercase tracking-widest">MAINNET V3</p></div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mint Amount (ALIX)</label>
                      <div className="relative">
                        <Input type="number" placeholder="0.00" value={alixMintAmount} onChange={(e) => setAlixMintAmount(e.target.value)} className="h-16 rounded-2xl liquid-glass border-none font-black italic text-xl px-6" />
                        <Coins className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 opacity-20" />
                      </div>
                    </div>
                    <Button onClick={handleMintAlix} disabled={isMinting || !alixMintAmount} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-xl transition-all">
                      {isMinting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Mainnet Minting"}
                    </Button>
                  </div>
                </Card>

                <div className="space-y-8">
                  <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive"><Flame className="w-6 h-6" /></div>
                      <h3 className="text-xl font-black text-accent uppercase italic">Deflationary Protocol</h3>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed italic">AliBank Smart Contract secara otomatis membakar proporsi suplai berdasarkan aktivitas marketplace.</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Sovereign Burned</p>
                        <p className="text-xl font-black text-destructive italic">{(globalLiquidity?.totalAlixBurned || 0).toLocaleString()} ALIX</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Equilibrium Ratio</p>
                        <p className="text-xl font-black text-accent italic">1.2x</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="vault" className="space-y-8 animate-in zoom-in-95">
              <Card className="liquid-glass border-none rounded-[3rem] p-10 text-accent space-y-8 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><Database className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black uppercase italic">On-Chain Vault Reserve</h3>
                  </div>
                  <Badge className="bg-green-600 text-white font-black">NODE ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mainnet Balance (ETH)</p>
                    <p className="text-5xl font-black italic tracking-tighter text-blue-600">{parseFloat(onChainEth).toFixed(4)} <span className="text-xl">ETH</span></p>
                    <div className="pt-4 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <SearchCheck className="w-4 h-4 text-primary" /> Verified by Ethereum Node 2026
                    </div>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contract Status</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end border-b border-primary/5 pb-2"><span className="text-[9px] font-bold uppercase text-muted-foreground">Version</span><span className="text-xs font-black italic">V3.0 Institutional</span></div>
                      <div className="flex justify-between items-end border-b border-primary/5 pb-2"><span className="text-[9px] font-bold uppercase text-muted-foreground">Compliance</span><span className="text-xs font-black italic">Sovereign Standard</span></div>
                      <div className="flex justify-between items-end border-b border-primary/5 pb-2"><span className="text-[9px] font-bold uppercase text-muted-foreground">Auditor</span><span className="text-xs font-black italic">AliBank Sentinel AI</span></div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="animate-in fade-in">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                  <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3"><UserCheck className="w-6 h-6 text-primary" /> Verified Client Base</h3>
                  <Badge className="bg-primary text-white">{allUsers?.length || 0} Accounts</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">Client Name</th><th className="px-8 py-6">Account Number</th><th className="px-8 py-6">Tier</th><th className="px-8 py-6 text-right">Balance</th></tr></thead>
                    <tbody className="divide-y divide-primary/5">
                      {allUsers?.map((u) => (
                        <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full gold-gradient p-0.5"><Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="p" width={32} height={32} className="rounded-full object-cover" /></div><div><p className="text-xs font-black italic uppercase">{u.name}</p><p className="text-[8px] font-bold text-muted-foreground">{u.email}</p></div></div></td>
                          <td className="px-8 py-5 font-mono text-[10px] text-accent">{u.accountNumber}</td>
                          <td className="px-8 py-5"><Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary">{u.tier || "Standard"}</Badge></td>
                          <td className="px-8 py-5 text-right font-black italic text-accent">Rp {u.totalBalance?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="animate-in slide-in-from-bottom-4">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3"><FileText className="w-6 h-6 text-primary" /> System-Wide Audit Log</h3>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">Production Integrity Active</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">Transaction ID</th><th className="px-8 py-6">Event Category</th><th className="px-8 py-6">Value</th><th className="px-8 py-6">Status</th><th className="px-8 py-6 text-right">Timestamp</th></tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {auditLogs?.map((log) => (
                        <tr key={log.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5 font-mono text-[9px] text-muted-foreground">{log.id}</td>
                          <td className="px-8 py-5"><Badge className={cn("border-none font-black text-[7px] uppercase", log.category?.includes("ALIX") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>{log.category}</Badge></td>
                          <td className="px-8 py-5 font-black italic text-accent">{log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}</td>
                          <td className="px-8 py-5"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[9px] font-bold uppercase">{log.status}</span></div></td>
                          <td className="px-8 py-5 text-right font-mono text-[8px] text-muted-foreground">{log.timestamp?.toDate().toLocaleString() || "---"}</td>
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
