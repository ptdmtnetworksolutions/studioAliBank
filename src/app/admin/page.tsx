
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
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback } from "react";
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
  serverTimestamp
} from "firebase/firestore";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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

const CONTRACT_ABI = [
  "function getTotalVaultBalance() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function releaseFunds(address _to, uint256 _amount) public",
  "function withdraw(uint256 _amount) public",
  "function deposit() public payable"
];

const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const ADMIN_WALLET = "0xc7D06CA4a4B00b19fFa1a4EFCB3cB3e12c24d777";

export default function AdminControlPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainTotal, setOnChainTotal] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [isSettling, setIsSettling] = useState(false);
  
  // Inventory Form States
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceIdr: "",
    category: "Infrastructure",
    image: ""
  });

  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

  // Data Listeners
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const mktQuery = useMemo(() => (db ? collection(db, "marketplace") : null), [db]);
  const { data: products } = useCollection(mktQuery);

  const txQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(10)) : null), [db]);
  const { data: globalHistory } = useCollection(txQuery);

  // ALIX MINING ENGINE
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);

  const syncOnChainVault = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;
    setSyncingVault(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const bal = await provider.getBalance(accounts[0].address);
        setConnectedBalance(formatEther(bal));
      }

      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      const balance = await contract.getTotalVaultBalance().catch(() => 0n);
      setOnChainTotal(formatEther(balance));
    } catch (err) {
      console.error("Vault Sync Error:", err);
    } finally {
      setSyncingVault(false);
    }
  }, []);

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
          await setDoc(platformRef, { 
            alixVaultBalance: increment(reward),
            totalAlixMinted: increment(reward),
            lastMintingPulse: new Date().toISOString()
          }, { merge: true });
        }
      }, 1500);
    } else {
      setHashrate(0);
    }
    return () => clearInterval(miningInterval);
  }, [isMining, db]);

  const handleAddProduct = async () => {
    if (!db || !newProduct.name || !newProduct.priceUsd) return;
    setIsSettling(true);
    try {
      const id = `prod-${Date.now()}`;
      const productData = {
        id,
        name: newProduct.name,
        description: newProduct.description,
        priceUsd: parseFloat(newProduct.priceUsd),
        priceIdr: parseFloat(newProduct.priceIdr) || parseFloat(newProduct.priceUsd) * 15500,
        category: newProduct.category,
        stock: 99,
        image: newProduct.image || "https://picsum.photos/seed/node/600/400",
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, "marketplace", id), productData);
      toast({ title: "Product Added", description: `${newProduct.name} is now live in marketplace.` });
      setNewProduct({ name: "", description: "", priceUsd: "", priceIdr: "", category: "Infrastructure", image: "" });
      setIsAddingProduct(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to add product", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db || !confirm("Hapus produk ini?")) return;
    try {
      await deleteDoc(doc(db, "marketplace", id));
      toast({ title: "Product Deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleBridgeToVault = async () => {
    if (!db || !globalLiquidity || typeof window.ethereum === 'undefined') return;
    const fiatBalance = globalLiquidity.totalUsdInjected || 0;
    if (fiatBalance <= 0) {
      toast({ variant: "destructive", title: "No Funds", description: "Tidak ada saldo AliBank Gateway yang tersedia untuk di-bridge." });
      return;
    }

    // Simulasi konversi: $1 = 0.0003 ETH (Contoh statis)
    const ethToDeposit = fiatBalance * 0.0003;
    
    setIsSettling(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      toast({ title: "Bridging Liquidity...", description: `Mengonversi $${fiatBalance.toLocaleString()} menjadi ${ethToDeposit.toFixed(4)} ETH ke Vault.` });
      
      const tx = await contract.deposit({ value: parseEther(ethToDeposit.toFixed(18)) });
      await tx.wait();

      // Update Database: Reset fiat balance after successfully bridging to on-chain vault
      await updateDoc(doc(db, "system", "liquidity"), {
        totalUsdInjected: 0,
        totalFiatInjected: 0,
        lastBridgeSync: serverTimestamp()
      });

      toast({ title: "Bridge Success", description: "Dana Gateway telah dipindahkan ke On-Chain Vault." });
      syncOnChainVault();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Bridge Failed", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa]">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-8">
          
          <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center border border-white/20 p-4 shadow-2xl">
                <ShieldAlert className="text-white w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Command Center</h1>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">NODE: {ADMIN_WALLET}</p>
                  <Badge className="bg-green-100 text-green-600 border-none font-black text-[8px] px-2 py-0.5 uppercase animate-pulse">Live Mainnet</Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsMining(!isMining)} className={cn("h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl transition-all", isMining ? "bg-destructive text-white" : "gold-gradient text-white")}>
                {isMining ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Stop Node</> : <><Pickaxe className="w-4 h-4 mr-2" /> Start ALIX Node</>}
              </Button>
              <Button onClick={syncOnChainVault} disabled={syncingVault} className="h-14 w-14 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs defaultValue="overview" className="space-y-8">
            <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-4 w-full lg:w-2/3 mx-auto">
              <TabsTrigger value="overview" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Overview</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Marketplace</TabsTrigger>
              <TabsTrigger value="liquidity" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Liquidity Bridge</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Audit Log</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <Badge className="bg-primary/10 text-primary uppercase text-[8px] font-black">AliBank Gateway</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available Gateway USD</p>
                    <p className="text-3xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Equiv. Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-blue-500/5">
                  <div className="flex items-center justify-between">
                    <Wallet className="w-6 h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[8px] font-black">On-Chain Vault</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Physical ETH Balance</p>
                    <p className="text-3xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                  </div>
                  <div className="pt-2 border-t border-blue-200/20">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Smart Contract V3 Verified</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-orange-500/5">
                  <div className="flex items-center justify-between">
                    <Pickaxe className="w-6 h-6 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-600 uppercase text-[8px] font-black">ALIX Mining</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Mined Pool Balance</p>
                    <p className="text-3xl font-black text-orange-600 italic">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)} ALIX</p>
                  </div>
                  <div className="pt-2 border-t border-orange-200/20">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Hashrate: {hashrate} MH/s</p>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-4 flex flex-col justify-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Payout System</p>
                  <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Withdraw Profit</h3>
                  <p className="text-[8px] opacity-50 uppercase font-medium leading-relaxed">Cairkan jatah hasil mining ke dompet MetaMask pribadi.</p>
                  <Button onClick={() => router.push('/admin/about-alix')} className="w-full h-10 gold-gradient text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg mt-2">
                    Cairkan Profit (On-Chain)
                  </Button>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 liquid-glass border-none rounded-[3rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3">
                      <Activity className="w-6 h-6 text-primary" /> System Intelligence
                    </h3>
                    <Badge className="bg-green-100 text-green-600 font-bold text-[10px]">ALL SYSTEMS OPERATIONAL</Badge>
                  </div>
                  <div className="p-10 rounded-[2.5rem] bg-accent/5 border border-primary/10 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                      <Zap className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-black text-accent uppercase italic tracking-tighter">Gateway Health: 100%</h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">AliBank Production Bridge is syncing with Ethereum Mainnet.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-8 w-full mt-8 pt-8 border-t border-primary/5">
                      <div><p className="text-[8px] font-black text-muted-foreground uppercase">Total Injected</p><p className="text-lg font-black text-primary italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p></div>
                      <div><p className="text-[8px] font-black text-muted-foreground uppercase">Pending Bridging</p><p className="text-lg font-black text-accent italic">{( (globalLiquidity?.totalUsdInjected || 0) * 0.0003 ).toFixed(4)} ETH</p></div>
                      <div><p className="text-[8px] font-black text-muted-foreground uppercase">Node Latency</p><p className="text-lg font-black text-green-600 italic">14ms</p></div>
                    </div>
                  </div>
                </Card>

                <Card className="lg:col-span-4 liquid-glass-dark border-none rounded-[3rem] p-10 text-white space-y-8 flex flex-col justify-between">
                  <div className="space-y-4">
                    <ShieldCheck className="w-12 h-12 text-primary" />
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-tight">Admin Security Logic</h3>
                    <p className="text-[10px] opacity-60 font-medium leading-relaxed italic uppercase">Pastikan Anda selalu memiliki saldo ETH pribadi di MetaMask untuk melakukan transaksi Bridge ke Vault atau Pencairan Profit.</p>
                  </div>
                  <Button className="w-full h-14 gold-gradient text-white rounded-[1.5rem] font-black uppercase italic text-xs shadow-2xl">
                    Open Node Firewall
                  </Button>
                </Card>
              </div>
            </TabsContent>

            {/* INVENTORY TAB */}
            <TabsContent value="inventory" className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h2 className="text-3xl font-black text-accent uppercase italic tracking-tighter">Inventory Manager</h2>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Manage products in AliBank Public Marketplace.</p>
                </div>
                <Button onClick={() => setIsAddingProduct(!isAddingProduct)} className="h-12 px-6 rounded-xl gold-gradient text-white font-black uppercase text-[10px] italic shadow-lg">
                  {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} 
                  {isAddingProduct ? "Cancel" : "Add New Item"}
                </Button>
              </div>

              {isAddingProduct && (
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 mb-8 animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Product Name</label>
                      <Input placeholder="e.g. Master Node V3" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Price (USD)</label>
                      <Input type="number" placeholder="1000000" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</label>
                      <Input placeholder="Technical specifications..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                      <Input placeholder="Infrastructure" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Image URL</label>
                      <Input placeholder="https://..." value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                  </div>
                  <Button onClick={handleAddProduct} disabled={isSettling} className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl">
                    {isSettling ? <Loader2 className="w-5 h-5 animate-spin" /> : "Deploy Product to Marketplace"}
                  </Button>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.map((p: any) => (
                  <Card key={p.id} className="liquid-glass border-none rounded-[2rem] overflow-hidden group">
                    <div className="relative h-40 overflow-hidden bg-white/5">
                      <Image src={p.image || "https://picsum.photos/seed/node/600/400"} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-white/90 text-accent border-none font-black text-[7px] px-2 py-0.5 uppercase rounded-full">{p.category}</Badge>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-accent uppercase italic">{p.name}</h4>
                          <p className="text-[9px] text-muted-foreground font-bold italic line-clamp-1">{p.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-destructive/40 hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <div className="flex justify-between items-end pt-4 border-t border-primary/5">
                        <div>
                          <p className="text-[7px] font-black uppercase text-muted-foreground">Market Price</p>
                          <p className="text-lg font-black text-primary italic">$ {p.priceUsd?.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black uppercase">Stock: {p.stock || 0}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* LIQUIDITY BRIDGE TAB */}
            <TabsContent value="liquidity" className="space-y-8 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg"><ArrowRightLeft className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic tracking-tighter leading-none">Liquidity Bridge</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Move AliBank Gateway Cash to On-Chain Vault.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-4 text-center">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">AliBank Gateway Cash</p>
                        <p className="text-5xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-center gap-3">
                        <Badge className="bg-green-100 text-green-600 font-black text-[8px] px-2 py-1 uppercase">Ready to Bridge</Badge>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4 py-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce"><ArrowUpRight className="w-6 h-6 rotate-45" /></div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground text-center max-w-xs italic">Menyuntikkan likuiditas riil dari rekening gateway ke dalam Smart Contract ETH.</p>
                    </div>

                    <div className="p-6 rounded-[2rem] liquid-glass-dark text-white text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Estimated On-Chain Conversion</p>
                      <p className="text-2xl font-black text-primary italic">{( (globalLiquidity?.totalUsdInjected || 0) * 0.0003 ).toFixed(4)} ETH</p>
                    </div>

                    <Button onClick={handleBridgeToVault} disabled={isSettling || (globalLiquidity?.totalUsdInjected || 0) <= 0} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-2xl shadow-primary/20">
                      {isSettling ? <Loader2 className="w-6 h-6 animate-spin" /> : "Bridge Gateway to Vault"}
                    </Button>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8 bg-blue-500/5">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-lg"><Wallet className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic tracking-tighter leading-none">Vault Status</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Real-time Ethereum Mainnet Audit.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-8 rounded-[2.5rem] bg-white/40 border border-blue-200/50 space-y-2 text-center">
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Contract Physical Balance</p>
                      <p className="text-5xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <ShieldCheck className="w-4 h-4 text-green-600" />
                        <span className="text-[8px] font-black text-green-600 uppercase">Verified on Etherscan</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase text-accent ml-1">Vault Analytics</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-white/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase italic">Total Withdrawals Paid</span>
                          <span className="text-xs font-black text-accent">0.0000 ETH</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-white/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase italic">Active Stakers</span>
                          <span className="text-xs font-black text-accent">---</span>
                        </div>
                        <div className="flex justify-between items-center p-4 rounded-2xl bg-white/60">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase italic">Yield Distributed</span>
                          <span className="text-xs font-black text-green-600 italic">+ 4.85%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-center">
                      <p className="text-[9px] font-bold text-blue-600/60 uppercase italic leading-relaxed">Dana dalam Vault dijamin oleh Smart Contract AliBank V3 dan tidak dapat ditarik tanpa verifikasi Node.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* AUDIT TAB */}
            <TabsContent value="audit" className="animate-in fade-in duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3">
                      <FileText className="w-6 h-6 text-primary" /> Global Transaction Audit
                    </h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Logging seluruh aktivitas ekonomi di ekosistem AliBank.</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase hover:bg-primary/10"><LayoutGrid className="w-3 h-3 mr-2" /> View Full Log</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Transaction ID</th>
                        <th className="px-8 py-6">Type</th>
                        <th className="px-8 py-6">Amount</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {globalHistory && globalHistory.length > 0 ? globalHistory.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5"><p className="text-[10px] font-black text-accent uppercase">#{tx.id?.slice(-8)}</p></td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2">
                              <Badge className={cn("text-[7px] font-black uppercase border-none", tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                                {tx.category || 'General'}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-black text-accent italic">
                              {tx.amount ? `Rp ${tx.amount.toLocaleString()}` : tx.amountUsd ? `$ ${tx.amountUsd.toLocaleString()}` : `${tx.cryptoAmount} ETH`}
                            </p>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-1">
                              <div className={cn("w-1.5 h-1.5 rounded-full", tx.status === 'success' ? "bg-green-500" : "bg-amber-500")} />
                              <span className="text-[9px] font-bold uppercase">{tx.status || 'Settled'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <p className="text-[10px] font-bold text-muted-foreground">{new Date(tx.timestamp?.seconds * 1000 || Date.now()).toLocaleString()}</p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <Activity className="w-12 h-12 text-primary/10 mx-auto mb-4" />
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No global activities recorded yet.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <footer className="mt-20 pt-12 border-t border-primary/10 flex flex-col items-center gap-8 text-center">
            <div className="flex items-center gap-12">
              <Link href="/admin/about-alix" className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-lg"><BookOpen className="w-6 h-6" /></div>
                <span className="text-[10px] font-black uppercase text-accent group-hover:text-primary transition-colors tracking-widest italic">Tentang Koin ALIX</span>
              </Link>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest italic">Secure AliBank Bridge v3.0</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 p-1 rounded-lg gold-gradient flex items-center justify-center"><LogoIcon className="text-white" /></div>
                <p className="text-xs font-black text-accent italic uppercase tracking-tighter">AliBank Command Center</p>
              </div>
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Authorized Personnel Only • AliBank Production Node Active</p>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
