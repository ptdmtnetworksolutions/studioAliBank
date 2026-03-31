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
  Gift,
  Network,
  Milestone,
  Pencil,
  ChevronRight,
  ArrowDownLeft,
  Copy,
  Link as LinkIcon,
  Eraser
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore, useAuth } from "@/firebase";
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
  where,
  writeBatch
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { JsonRpcProvider, formatEther, parseEther, ethers, BrowserProvider, Contract } from "ethers";
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

const VAULT_ABI = [
  "function withdraw(uint256 _amount) public",
  "function withdrawUSDT(uint256 _amount) public",
  "function depositUSDT(uint256 _amount) public",
  "function getTotalVaultBalance() public view returns (uint256)",
  "function balances(address) public view returns (uint256)"
];

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
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "overview");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  
  // Vault Disbursement States
  const [disburseAmount, setDisburseAmount] = useState("");
  const [isDisbursing, setIsDisbursing] = useState(false);

  // ALX Sovereign Supply States
  const [alixMintAmount, setAlixMintAmount] = useState("");
  const [alixBurnAmount, setAlixBurnAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  // Marketplace Management States
  const [newProduct, setNewProduct] = useState({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Layanan Seluler", image: "" });
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const copyAddress = () => {
    navigator.clipboard.writeText(ALIX_CONTRACT);
    toast({ title: "Alamat Disalin", description: "Alamat brankas Mainnet siap digunakan." });
  };

  const handleVaultDisbursement = async () => {
    if (!disburseAmount || isDisbursing) return;
    setIsDisbursing(true);

    try {
      if (!window.ethereum) throw new Error("MetaMask tidak terdeteksi. Gunakan browser Web3.");
      
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new Contract(ALIX_CONTRACT, VAULT_ABI, signer);

      const amountWei = parseEther(disburseAmount);
      
      toast({ title: "Menyiapkan Transaksi", description: "Silakan konfirmasi di MetaMask Anda." });
      
      const tx = await vaultContract.withdraw(amountWei);
      await tx.wait();

      // Log ke Audit System
      if (db) {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `WITHDRAW-${Date.now()}`,
          category: "Vault Disbursement",
          cryptoAmount: parseFloat(disburseAmount),
          cryptoCurrency: "ETH",
          status: "success",
          txHash: tx.hash,
          timestamp: serverTimestamp(),
          description: "External Disbursement: Funds moved from Central Vault to Admin Wallet."
        });
      }

      toast({ title: "Disbursement Berhasil", description: `${disburseAmount} ETH telah ditarik dari brankas.` });
      setDisburseAmount("");
      syncOnChainData();
    } catch (err: any) {
      if (err.code === "ACTION_REJECTED") {
        toast({ title: "Transaksi Dibatalkan", description: "Tanda tangan transaksi ditolak oleh pengguna." });
      } else {
        console.error(err);
        toast({ variant: "destructive", title: "Gagal Menarik Dana", description: err.shortMessage || err.message || "Terjadi kesalahan pada jaringan." });
      }
    } finally {
      setIsDisbursing(false);
    }
  };

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
      if (editingId) {
        // Mode Update
        await updateDoc(doc(db, "marketplace", editingId), {
          ...newProduct,
          priceIdr: parseFloat(newProduct.priceIdr),
          priceUsd: parseFloat(newProduct.priceUsd) || 0,
          updatedAt: serverTimestamp()
        });
        toast({ title: "Product Updated", description: `${newProduct.name} has been updated successfully.` });
      } else {
        // Mode Create
        const id = `item-${Date.now()}`;
        await setDoc(doc(db, "marketplace", id), {
          ...newProduct,
          id,
          priceIdr: parseFloat(newProduct.priceIdr),
          priceUsd: parseFloat(newProduct.priceUsd) || 0,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Product Added", description: `${newProduct.name} is now live in the marketplace.` });
      }
      setNewProduct({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Layanan Seluler", image: "" });
      setEditingId(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setNewProduct({
      name: item.name,
      description: item.description || "",
      priceIdr: item.priceIdr.toString(),
      priceUsd: (item.priceUsd || 0).toString(),
      category: item.category,
      image: item.image || ""
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewProduct({ name: "", description: "", priceIdr: "", priceUsd: "", category: "Layanan Seluler", image: "" });
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

  const handlePasswordReset = async (email: string) => {
    if (!auth || !email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "Link Reset Terkirim", 
        description: `Instruksi penggantian kata sandi telah dikirim ke email: ${email}` 
      });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Gagal Mengirim Link", 
        description: err.message 
      });
    }
  };

  const handleClearAuditLogs = async () => {
    if (!db || !auditLogs || auditLogs.length === 0) {
      toast({ title: "Audit Kosong", description: "Tidak ada data audit yang perlu dihapus." });
      return;
    }
    
    const confirmDelete = window.confirm("PERINGATAN: Anda akan menghapus seluruh catatan audit secara permanen. Tindakan ini tidak dapat dibatalkan. Lanjutkan?");
    if (!confirmDelete) return;

    try {
      const batch = writeBatch(db);
      auditLogs.forEach((log) => {
        const docRef = doc(db, "system", "audit", "global_transactions", log.id);
        batch.delete(docRef);
      });
      await batch.commit();
      toast({ title: "Pembersihan Berhasil", description: "Seluruh log audit telah dihapus dari ledger AliBank." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus Log", description: err.message });
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
                <h1 className="text-5xl font-black text-foreground uppercase italic tracking-tighter leading-none">Command Center</h1>
                <p className="text-muted-foreground text-[11px] font-black uppercase tracking-[0.3em] italic mt-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Multi-Asset Vault Infrastructure V3
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={() => router.push('/admin/about-alix')} variant="outline" className="h-16 px-8 rounded-2xl font-black uppercase text-[11px] italic shadow-xl bg-card border-primary/20 text-foreground hover:bg-primary/5 transition-all">
                <Sparkles className="w-5 h-5 mr-3 text-primary" /> Misi & Validasi Vault
              </Button>
              <Button onClick={syncOnChainData} disabled={syncingVault} className="h-16 w-16 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <RefreshCw className={cn("w-6 h-6", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
            <div className="overflow-x-auto no-scrollbar pb-4">
              <TabsList className="bg-primary/5 p-2 rounded-[3rem] h-20 border border-primary/10 flex w-max shadow-inner mx-auto gap-2">
                <TabsTrigger value="overview" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Executive</TabsTrigger>
                <TabsTrigger value="alichain" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">AliChain Hub</TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Inventory</TabsTrigger>
                <TabsTrigger value="alix" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Tokenomics</TabsTrigger>
                <TabsTrigger value="vault" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Vault V3</TabsTrigger>
                <TabsTrigger value="users" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Clients</TabsTrigger>
                <TabsTrigger value="audit" className="rounded-[2.5rem] font-black uppercase text-[11px] italic px-10 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all text-foreground/60 data-[state=active]:text-white">Audit</TabsTrigger>
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
                    <p className="text-4xl font-black text-foreground italic tracking-tighter">{allUsers?.length || 0}</p>
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
                      <h3 className="text-2xl font-black text-foreground uppercase italic">System Heartbeat</h3>
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

                <Card className="liquid-glass-dark border-none rounded-[3.5rem] p-12 text-white space-y-8 shadow-[0_50px_100px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                  <div className="absolute right-[-10%] top-[-10%] p-12 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><Sparkles className="w-64 h-64" /></div>
                  <div className="relative z-10 flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-lg"><Zap className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black text-white uppercase italic">Sovereign Asset Sentinel</h3>
                  </div>
                  <p className="text-sm font-medium italic text-white/70 leading-relaxed uppercase relative z-10">
                    Seluruh pencetakan koin ALX didukung oleh agunan likuiditas Mainnet (USDT). Mekanisme "Smart Burn" otomatis aktif berdasarkan volume marketplace AliBank V3.
                  </p>
                  <Button onClick={() => router.push('/admin/about-alix')} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-xs tracking-widest relative z-10 shadow-2xl flex items-center justify-between px-8">
                    View Vault Protocol <ChevronRight className="w-5 h-5" />
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alichain" className="space-y-10 animate-in zoom-in-95 duration-500">
              <header className="text-center max-w-2xl mx-auto space-y-4">
                <Badge className="bg-primary text-white font-black uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full shadow-lg">Phase 2: Global Scaling</Badge>
                <h2 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">AliChain Migration Readiness</h2>
                <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.3em] leading-relaxed italic">
                  Monitoring transisi dari Token Ethereum (ERC-20) menuju Koin Native Berdaulat AliBank V3.
                </p>
              </header>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="liquid-glass border-none rounded-[3.5rem] p-12 space-y-10 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><TrendingUp className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black text-foreground uppercase italic">Ekonomi & Volume</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Harian Volume (IDR)</p>
                        <p className="text-xs font-black text-foreground italic">Rp 1.2T / Rp 10T</p>
                      </div>
                      <Progress value={12} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Holders</p>
                        <p className="text-xs font-black text-foreground italic">125K / 1M</p>
                      </div>
                      <Progress value={12.5} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <div className="p-6 rounded-3xl bg-blue-50 border border-blue-100">
                      <p className="text-[9px] font-black text-blue-600 uppercase leading-relaxed italic">
                        STRATEGI: Tingkatkan utilitas koin ALX pada marketplace untuk mempercepat sirkulasi dan mencapai target volume Mainnet.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[3.5rem] p-12 space-y-10 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner"><Network className="w-8 h-8" /></div>
                    <h3 className="text-2xl font-black text-foreground uppercase italic">Infrastruktur Node</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Validator Nodes</p>
                        <p className="text-xs font-black text-foreground italic">12 / 21 Nodes</p>
                      </div>
                      <Progress value={57} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Audit Security V3</p>
                        <p className="text-xs font-black text-green-600 italic">PASSED (Ver. 1.2)</p>
                      </div>
                      <Progress value={100} className="h-3 rounded-full bg-muted shadow-inner" />
                    </div>
                    <Button className="w-full h-16 border-2 border-dashed border-primary/30 text-primary rounded-[2rem] font-black uppercase italic text-xs hover:bg-primary/5">
                      Deploy AliChain Testnet Cluster
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="liquid-glass-dark rounded-[3.5rem] p-12 text-center space-y-8 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 gold-gradient opacity-5" />
                <Milestone className="w-16 h-16 text-primary mx-auto opacity-20" />
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Status Migrasi: <span className="text-primary">Staging</span></h3>
                <p className="text-sm font-medium text-white/60 italic max-w-3xl mx-auto uppercase leading-relaxed">
                  Blockchain Mandiri (AliChain) akan diluncurkan secara otomatis ketika volume ekosistem mencapai nilai ekuivalen Rp 10 Triliun. Seluruh Token ERC-20 akan dikonversi menjadi Koin Native melalui mekanisme Snapshot otomatis.
                </p>
                <div className="flex justify-center gap-6">
                  <Badge variant="outline" className="border-white/20 text-white uppercase text-[9px] font-black px-6 py-2 rounded-xl">EVM Compatible</Badge>
                  <Badge variant="outline" className="border-white/20 text-white uppercase text-[9px] font-black px-6 py-2 rounded-xl">Proof of Stake (PoS)</Badge>
                  <Badge variant="outline" className="border-white/20 text-white uppercase text-[9px] font-black px-6 py-2 rounded-xl">Zero-Fee Layer</Badge>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-10 animate-in slide-in-from-left-8 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-4 liquid-glass border-none rounded-[3.5rem] p-10 space-y-8 shadow-2xl sticky top-24 h-fit">
                  <h3 className="text-2xl font-black text-foreground uppercase italic flex items-center gap-4">
                    <PackagePlus className="w-8 h-8 text-primary" /> {editingId ? "Update Asset" : "Deploy Asset"}
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
                    <div className="flex flex-col gap-3 mt-6">
                      <Button onClick={handleAddProduct} disabled={isAddingProduct} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-2xl hover:scale-105 transition-all">
                        {isAddingProduct ? <Loader2 className="animate-spin w-6 h-6" /> : (editingId ? "Confirm Update" : "Authorize Deployment")}
                      </Button>
                      {editingId && (
                        <Button variant="ghost" onClick={handleCancelEdit} className="w-full h-12 rounded-2xl text-muted-foreground font-black uppercase italic text-[10px] hover:bg-muted">
                          Cancel Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="lg:col-span-8 liquid-glass border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                    <h3 className="text-2xl font-black italic uppercase text-foreground">Production Inventory</h3>
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
                              <p className="font-black text-foreground italic uppercase text-sm">{item.name}</p>
                              <p className="text-[10px] text-muted-foreground font-medium mt-1 italic">{item.id}</p>
                            </td>
                            <td className="px-10 py-6">
                              <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[9px] px-3">{item.category}</Badge>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="font-black italic text-foreground">Rp {item.priceIdr?.toLocaleString()}</p>
                              <p className="text-[9px] font-bold text-muted-foreground">$ {item.priceUsd?.toLocaleString()}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(item)} className="w-10 h-10 rounded-xl text-primary hover:bg-primary/10 transition-all">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(item.id)} className="w-10 h-10 rounded-xl text-destructive hover:bg-destructive/10 transition-all">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
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
                      <h3 className="text-3xl font-black text-foreground uppercase italic leading-none">Sovereign Mint</h3>
                      <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest mt-2 italic">Supply Expansion: Backed by USDT Reserve.</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Authorized USDT Agun</p>
                        <p className="text-3xl font-black text-foreground italic tracking-tighter">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
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
                      <h3 className="text-3xl font-black text-foreground uppercase italic leading-none">Auto-Burn Protocol</h3>
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <Card className="lg:col-span-8 liquid-glass border-none rounded-[4rem] p-16 text-foreground space-y-12 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-[-5%] bottom-[-5%] opacity-5"><LogoIcon className="w-96 h-96 text-primary" /></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><Database className="w-12 h-12" /></div>
                      <div>
                        <h3 className="text-4xl font-black uppercase italic">Mainnet Vault Reserve</h3>
                        <p className="text-[12px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2 italic">Institutional Multi-Asset Node V3</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white font-black text-sm px-6 py-2 rounded-2xl shadow-xl animate-pulse">NODE ACTIVE</Badge>
                  </div>

                  {/* VAULT ADDRESS DISPLAY */}
                  <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <LinkIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Official Mainnet Address (ERC-20 & ETH)</p>
                        <p className="text-sm font-mono font-bold text-foreground break-all">{ALIX_CONTRACT}</p>
                      </div>
                    </div>
                    <Button onClick={copyAddress} className="gold-gradient text-white font-black uppercase italic text-[10px] h-12 px-8 rounded-xl shrink-0">
                      <Copy className="w-4 h-4 mr-2" /> Salin Alamat
                    </Button>
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
                      <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.3em]">Compliance Hub (USDT)</p>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">USDT (ERC-20) Support</span>
                          <Badge className="bg-green-100 text-green-600 font-black text-[10px] border-none px-3">ACTIVE</Badge>
                        </div>
                        <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Min. Deposit Threshold</span>
                          <span className="text-sm font-black italic text-primary">5.000.000 USDT</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Compliance Guard</span>
                          <span className="text-sm font-black italic text-foreground">Institutional Grade V3</span>
                        </div>
                        <div className="flex justify-between items-end border-b border-primary/10 pb-4">
                          <span className="text-[10px] font-black uppercase text-muted-foreground">Settlement Logic</span>
                          <span className="text-sm font-black italic text-foreground">Real-Time Clearing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* DISBURSEMENT TERMINAL */}
                <Card className="lg:col-span-4 liquid-glass-dark border-none rounded-[3.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10"><ArrowDownLeft className="w-32 h-32 text-primary" /></div>
                  <div className="relative z-10 space-y-8">
                    <div>
                      <Badge className="bg-primary text-white font-black uppercase text-[8px] tracking-widest mb-2">Internal Protocol</Badge>
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">External Disbursement</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Keluarkan dana brankas ke dompet Admin eksternal.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-white/40 ml-2">Amount to Withdraw (ETH)</label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={disburseAmount}
                            onChange={(e) => setDisburseAmount(e.target.value)}
                            className="h-16 rounded-2xl bg-white/5 border-none font-black italic text-xl px-6 text-white shadow-inner" 
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-primary italic">ETH</span>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[9px] text-white/60 italic leading-relaxed uppercase font-bold">
                          Dana akan dikirim langsung ke dompet MetaMask yang terhubung ke sesi Command Center ini melalui interaksi Smart Contract AliBank V3.
                        </p>
                      </div>

                      <Button 
                        onClick={handleVaultDisbursement}
                        disabled={disburseAmount === "" || isDisbursing}
                        className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic text-sm shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
                      >
                        {isDisbursing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>EXECUTE DISBURSEMENT <ArrowDownRight className="w-5 h-5" /></>}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="animate-in fade-in duration-500">
              <Card className="liquid-glass border-none rounded-[3.5rem] overflow-hidden shadow-2xl">
                <div className="p-12 border-b border-primary/5 bg-accent/5 flex justify-between items-center">
                  <h3 className="text-3xl font-black italic uppercase text-foreground flex items-center gap-6">
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
                        <th className="px-12 py-10 text-right">Security</th>
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
                                <p className="text-base font-black italic uppercase text-foreground leading-none">{u.name}</p>
                                <p className="text-[10px] font-bold text-muted-foreground mt-1.5">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-12 py-8 font-mono text-[11px] text-foreground/80">{u.accountNumber}</td>
                          <td className="px-12 py-8">
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/30 text-primary px-4 py-1 rounded-md">{u.tier || "Standard"}</Badge>
                          </td>
                          <td className="px-12 py-8 text-right">
                            <p className="text-lg font-black italic text-foreground tracking-tighter">Rp {u.totalBalance?.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">Official Balance</p>
                          </td>
                          <td className="px-12 py-8 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handlePasswordReset(u.email)}
                              className="h-10 rounded-xl text-primary hover:bg-primary/10 border border-primary/10 font-black uppercase text-[9px] italic"
                            >
                              <Key className="w-3 h-3 mr-2" /> Reset Pass Link
                            </Button>
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
                    <h3 className="text-3xl font-black italic uppercase text-foreground flex items-center gap-6">
                      <FileText className="w-10 h-10 text-primary" /> Production Audit Log
                    </h3>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-2 italic">Immutable Ledger Reconciliation</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button 
                      onClick={handleClearAuditLogs}
                      variant="ghost" 
                      className="h-12 px-6 rounded-xl border border-destructive/20 text-destructive hover:bg-destructive/10 font-black uppercase text-[10px] italic gap-2"
                    >
                      <Eraser className="w-4 h-4" /> Purge Audit Logs
                    </Button>
                    <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/30 text-foreground px-6 py-2 rounded-2xl">Integrity Active</Badge>
                  </div>
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
                            <Badge className={cn("border-none font-black text-[8px] uppercase px-4 py-1.5 rounded-md", log.category?.includes("ALX") || log.category?.includes("Vault") ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                              {log.category}
                            </Badge>
                          </td>
                          <td className="px-12 py-8 font-black italic text-foreground text-base">
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
                      {(!auditLogs || auditLogs.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-12 py-32 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                              <Eraser className="w-16 h-16" />
                              <p className="text-sm font-black uppercase tracking-[0.3em]">Ledger is Empty</p>
                            </div>
                          </td>
                        </tr>
                      )}
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
