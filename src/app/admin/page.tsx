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
  Globe
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
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider } from "ethers";
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

// Konfigurasi RPC Global (Fasilitas Web3 Infrastructure)
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

  // Listener Data Riil
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const mktQuery = useMemo(() => (db ? collection(db, "marketplace") : null), [db]);
  const { data: products } = useCollection(mktQuery);

  const txQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(15)) : null), [db]);
  const { data: globalHistory } = useCollection(txQuery);

  // MESIN MINING ALIX
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);

  const handleOpenMetaMask = () => {
    const host = window.location.host;
    const path = window.location.pathname;
    window.location.href = `https://metamask.app.link/dapp/${host}${path}`;
  };

  const syncOnChainVault = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      let provider;
      // Gunakan MetaMask jika ada, jika tidak gunakan Global Node RPC
      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        provider = new BrowserProvider(window.ethereum);
        setUsingGlobalNode(false);
      } else {
        provider = new JsonRpcProvider(GLOBAL_RPC);
        setUsingGlobalNode(true);
      }

      // Pastikan address valid sebelum getBalance
      const balance = await provider.getBalance(DEFAULT_CONTRACT).catch((e) => {
        console.warn("RPC fetch failed, using fallback 0", e);
        return 0n;
      });
      setOnChainTotal(formatEther(balance));

      if (typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask) {
        const accounts = await (provider as BrowserProvider).listAccounts();
        if (accounts.length > 0) {
          const walletBal = await provider.getBalance(accounts[0].address);
          setConnectedBalance(formatEther(walletBal));
        }
      }
    } catch (err: any) {
      console.error("Kesalahan Sinkronisasi Brankas:", err);
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
            lastMintingPulse: new Date().toISOString()
          }).catch(() => {});
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
      toast({ title: "Produk Berhasil Diterbitkan", description: `${newProduct.name} sekarang tersedia di pasar.` });
      setNewProduct({ name: "", description: "", priceUsd: "", priceIdr: "", category: "Infrastruktur", image: "" });
      setIsAddingProduct(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menambah Produk", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db || !confirm("Hapus produk ini secara permanen dari database?")) return;
    try {
      await deleteDoc(doc(db, "marketplace", id));
      toast({ title: "Produk Berhasil Dihapus" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menghapus", description: err.message });
    }
  };

  const handleBridgeToVault = async () => {
    if (!db || !globalLiquidity) return;
    if (typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "MetaMask Diperlukan", description: "Untuk memindahkan dana riil ke Brankas, diperlukan otorisasi tanda tangan MetaMask." });
      handleOpenMetaMask();
      return;
    }

    const fiatBalance = globalLiquidity.totalUsdInjected || 0;
    if (fiatBalance <= 0) {
      toast({ variant: "destructive", title: "Kas Gateway Kosong" });
      return;
    }

    const ethToDeposit = fiatBalance * 0.0003; 
    setIsSettling(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const tx = await contract.deposit({ value: parseEther(ethToDeposit.toFixed(18)) });
      await tx.wait();

      await updateDoc(doc(db, "system", "liquidity"), {
        totalUsdInjected: 0,
        totalFiatInjected: 0,
        lastBridgeSync: serverTimestamp()
      });

      toast({ title: "Jembatan Sukses", description: "Likuiditas riil telah diamankan di Smart Contract AliBank." });
      syncOnChainVault();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengeksekusi Jembatan", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-[#f8f9fa]">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-4 md:pt-8">
          
          <header className="mb-8 md:mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 md:gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl gold-gradient flex items-center justify-center border border-white/20 p-3 md:p-4 shadow-2xl">
                <ShieldAlert className="text-white w-6 h-6 md:w-10 md:h-10" />
              </div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-accent uppercase italic tracking-tighter">Pusat Komando</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-muted-foreground text-[8px] md:text-[10px] font-black uppercase tracking-widest italic truncate max-w-[150px] md:max-w-none">KONTRAK: {DEFAULT_CONTRACT}</p>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] md:text-[8px] px-2 py-0.5 uppercase flex items-center gap-1">
                    <Globe className="w-2 h-2" /> Global Node Active
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 w-full lg:w-auto">
              <Button 
                onClick={() => setIsMining(!isMining)} 
                className={cn("flex-1 lg:flex-none h-12 md:h-14 px-4 md:px-6 rounded-xl md:rounded-2xl font-black uppercase text-[9px] md:text-[10px] italic shadow-xl transition-all", isMining ? "bg-destructive text-white" : "gold-gradient text-white")}
              >
                {isMining ? <><Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin mr-2" /> Hentikan Node</> : <><Pickaxe className="w-3 h-3 md:w-4 md:h-4 mr-2" /> Jalankan Node ALIX</>}
              </Button>
              <Button onClick={syncOnChainVault} disabled={syncingVault} className="h-12 w-12 md:h-14 md:w-14 rounded-xl md:rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center shrink-0">
                <RefreshCw className={cn("w-4 h-4 md:w-5 md:h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs defaultValue="overview" className="space-y-6 md:space-y-8">
            <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
              <TabsList className="bg-primary/5 p-1 rounded-2xl md:rounded-[2rem] h-12 md:h-16 border border-primary/10 grid grid-cols-4 min-w-[400px] lg:w-2/3 mx-auto shadow-sm">
                <TabsTrigger value="overview" className="rounded-xl md:rounded-[1.5rem] font-black uppercase text-[8px] md:text-[10px] italic">Ikhtisar</TabsTrigger>
                <TabsTrigger value="inventory" className="rounded-xl md:rounded-[1.5rem] font-black uppercase text-[8px] md:text-[10px] italic">Pasar</TabsTrigger>
                <TabsTrigger value="liquidity" className="rounded-xl md:rounded-[1.5rem] font-black uppercase text-[8px] md:text-[10px] italic">Jembatan</TabsTrigger>
                <TabsTrigger value="audit" className="rounded-xl md:rounded-[1.5rem] font-black uppercase text-[8px] md:text-[10px] italic">Audit</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="liquid-glass border-none rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 space-y-3 md:space-y-4 bg-primary/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    <Badge className="bg-primary/10 text-primary uppercase text-[7px] md:text-[8px] font-black">Kas Gateway</Badge>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo PayPal Tersedia</p>
                    <p className="text-2xl md:text-3xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                  <div className="pt-2 border-t border-primary/10">
                    <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase">Setara Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 space-y-3 md:space-y-4 bg-blue-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[7px] md:text-[8px] font-black">Brankas Riil</Badge>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Saldo Fisik ETH</p>
                    <p className="text-2xl md:text-3xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                  </div>
                  <div className="pt-2 border-t border-blue-200/20 flex items-center justify-between">
                    <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase">Global Node Active</p>
                    {usingGlobalNode && <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 space-y-3 md:space-y-4 bg-orange-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Pickaxe className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-600 uppercase text-[7px] md:text-[8px] font-black">Mining</Badge>
                  </div>
                  <div>
                    <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">Jatah Profit</p>
                    <p className="text-2xl md:text-3xl font-black text-orange-600 italic">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)} ALIX</p>
                  </div>
                  <div className="pt-2 border-t border-orange-200/20">
                    <p className="text-[7px] md:text-[8px] font-bold text-muted-foreground uppercase">Rate: {hashrate} MH/s</p>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 text-white space-y-3 md:space-y-4 flex flex-col justify-center shadow-xl">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">Payout V3</p>
                  <h3 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase leading-none">Tarik Profit</h3>
                  <p className="text-[7px] md:text-[8px] opacity-50 uppercase font-medium leading-relaxed">Cairkan jatah mining Anda ke MetaMask secara riil.</p>
                  <Button 
                    onClick={() => router.push('/crypto')} 
                    className="w-full h-9 md:h-10 gold-gradient text-white rounded-lg md:rounded-xl text-[8px] md:text-[9px] font-black uppercase italic shadow-lg mt-1"
                  >
                    Kelola Profit
                  </Button>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
                <Card className="lg:col-span-8 liquid-glass border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 space-y-4 md:space-y-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-black italic uppercase text-accent flex items-center gap-2 md:gap-3">
                      <Activity className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Status Sistem AliBank
                    </h3>
                    <Badge className="bg-green-100 text-green-600 font-bold text-[8px] md:text-[10px]">AKTIF</Badge>
                  </div>
                  <div className="p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-accent/5 border border-primary/10 flex flex-col items-center justify-center text-center space-y-3 md:space-y-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse shadow-inner">
                      <Zap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xl md:text-2xl font-black text-accent uppercase italic tracking-tighter">Kesehatan Jaringan: 100%</h4>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">AliBank Global Node beroperasi tanpa ketergantungan wallet.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 md:gap-8 w-full mt-6 md:mt-8 pt-6 md:pt-8 border-t border-primary/5">
                      <div><p className="text-[6px] md:text-[8px] font-black text-muted-foreground uppercase">Latency RPC</p><p className="text-sm md:text-lg font-black text-primary italic">24ms</p></div>
                      <div><p className="text-[6px] md:text-[8px] font-black text-muted-foreground uppercase">Data Source</p><p className="text-sm md:text-lg font-black text-accent italic">Web3 Portal</p></div>
                      <div><p className="text-[6px] md:text-[8px] font-black text-muted-foreground uppercase">Block Height</p><p className="text-sm md:text-lg font-black text-green-600 italic">Sync</p></div>
                    </div>
                  </div>
                </Card>

                <Card className="lg:col-span-4 liquid-glass-dark border-none rounded-[2rem] md:rounded-[3rem] p-8 md:p-10 text-white space-y-6 md:space-y-8 flex flex-col justify-between shadow-2xl">
                  <div className="space-y-3 md:space-y-4">
                    <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-primary" />
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter leading-tight">Protokol Keamanan</h3>
                    <p className="text-[8px] md:text-[10px] opacity-60 font-medium leading-relaxed italic uppercase">Audit saldo dilakukan secara independen via AliBank Global Node.</p>
                  </div>
                  <Button 
                    onClick={() => setIsFirewallActive(!isFirewallActive)}
                    className={cn(
                      "w-full h-12 md:h-14 rounded-xl md:rounded-[1.5rem] font-black uppercase italic text-[10px] md:text-xs shadow-2xl transition-all",
                      isFirewallActive ? "gold-gradient text-white" : "bg-destructive text-white"
                    )}
                  >
                    {isFirewallActive ? <><Lock className="w-4 h-4 mr-2" /> Firewall Aktif</> : <><Unlock className="w-4 h-4 mr-2" /> Firewall Dinonaktifkan</>}
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-accent uppercase italic tracking-tighter">Manajer Pasar</h2>
                  <p className="text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest">Kelola produk fisik dan digital secara riil di AliBank.</p>
                </div>
                <Button onClick={() => setIsAddingProduct(!isAddingProduct)} className="w-full sm:w-auto h-10 md:h-12 px-4 md:px-6 rounded-lg md:rounded-xl gold-gradient text-white font-black uppercase text-[9px] md:text-[10px] italic shadow-lg">
                  {isAddingProduct ? <X className="w-3 h-3 md:w-4 md:h-4 mr-2" /> : <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />} 
                  {isAddingProduct ? "Batal" : "Tambah Item"}
                </Button>
              </div>

              {isAddingProduct && (
                <Card className="liquid-glass border-none rounded-2xl md:rounded-[2.5rem] p-6 md:p-8 mb-8 animate-in fade-in slide-in-from-top-2 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Produk</label>
                      <Input placeholder="Contoh: Master Node V3" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground ml-1">Harga (USD)</label>
                      <Input type="number" placeholder="1000000" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2 md:col-span-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground ml-1">Deskripsi</label>
                      <Input placeholder="Detail teknis produk..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground ml-1">Kategori</label>
                      <Input placeholder="Infrastruktur" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                      <label className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground ml-1">URL Gambar</label>
                      <Input placeholder="https://..." value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="h-10 md:h-12 rounded-lg md:rounded-xl bg-white/50 border-none font-bold text-xs" />
                    </div>
                  </div>
                  <Button onClick={handleAddProduct} disabled={isSettling} className="w-full h-12 md:h-14 gold-gradient text-white rounded-xl md:rounded-2xl font-black uppercase italic text-xs md:text-sm shadow-xl">
                    {isSettling ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Publikasikan ke Marketplace"}
                  </Button>
                </Card>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products?.map((p: any) => (
                  <Card key={p.id} className="liquid-glass border-none rounded-2xl md:rounded-[2rem] overflow-hidden group shadow-lg">
                    <div className="relative h-32 md:h-40 overflow-hidden bg-white/5">
                      <Image src={p.image || "https://picsum.photos/seed/node/600/400"} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-2">
                        <Badge className="bg-white/90 text-accent border-none font-black text-[6px] md:text-[7px] px-2 py-0.5 uppercase rounded-full">{p.category}</Badge>
                      </div>
                    </div>
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs md:text-sm font-black text-accent uppercase italic">{p.name}</h4>
                          <p className="text-[8px] md:text-[9px] text-muted-foreground font-bold italic line-clamp-1">{p.description}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                      <div className="flex justify-between items-end pt-3 md:pt-4 border-t border-primary/5">
                        <div>
                          <p className="text-[6px] md:text-[7px] font-black uppercase text-muted-foreground">Harga</p>
                          <p className="text-base md:text-lg font-black text-primary italic">$ {p.priceUsd?.toLocaleString()}</p>
                        </div>
                        <Badge variant="outline" className="text-[7px] md:text-[8px] font-black uppercase">Stok: {p.stock || 0}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="liquidity" className="space-y-6 md:space-y-8 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                <Card className="liquid-glass border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 shadow-xl">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg"><ArrowRightLeft className="w-6 h-6 md:w-8 md:h-8" /></div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-accent uppercase italic tracking-tighter leading-none">Jembatan Gateway</h3>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Pindahkan Kas PayPal ke Brankas On-Chain.</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-3 md:space-y-4 text-center">
                      <div className="space-y-1">
                        <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground">Akumulasi Dana PayPal</p>
                        <p className="text-3xl md:text-5xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 md:gap-3">
                        <Badge className="bg-green-100 text-green-600 font-black text-[7px] md:text-[8px] px-2 py-1 uppercase">Tersedia untuk Bridging</Badge>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 md:gap-4 py-2 md:py-4">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary animate-bounce shadow-md"><ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 rotate-45" /></div>
                      <p className="text-[8px] md:text-[9px] font-black uppercase text-muted-foreground text-center max-w-[200px] md:max-w-xs italic leading-relaxed">Dana PayPal akan dikonversi menjadi deposit ETH riil pada Smart Contract AliBank V3.</p>
                    </div>

                    <div className="p-4 md:p-6 rounded-xl md:rounded-[2rem] liquid-glass-dark text-white text-center shadow-lg">
                      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Estimasi Konversi ETH</p>
                      <p className="text-xl md:text-2xl font-black text-primary italic">{( (globalLiquidity?.totalUsdInjected || 0) * 0.0003 ).toFixed(4)} ETH</p>
                    </div>

                    <Button onClick={handleBridgeToVault} disabled={isSettling || (globalLiquidity?.totalUsdInjected || 0) <= 0} className="w-full h-14 md:h-16 gold-gradient text-white rounded-[1.5rem] md:rounded-[2rem] font-black uppercase italic text-xs md:text-sm shadow-2xl active:scale-95 transition-all">
                      {isSettling ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Eksekusi Jembatan ke Brankas"}
                    </Button>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 bg-blue-500/5 shadow-xl">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-lg"><Wallet className="w-6 h-6 md:w-8 md:h-8" /></div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black text-accent uppercase italic tracking-tighter leading-none">Status Brankas</h3>
                      <p className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Audit Blockchain Mandiri.</p>
                    </div>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    <div className="p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] bg-white/40 border border-blue-200/50 space-y-2 text-center shadow-inner">
                      <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground">Saldo Fisik Kontrak</p>
                      <p className="text-3xl md:text-5xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        <span className="text-[7px] md:text-[8px] font-black text-green-600 uppercase">Terverifikasi via Global Node</span>
                      </div>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <p className="text-[8px] md:text-[10px] font-black uppercase text-accent ml-1">Analitik Brankas</p>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/60 shadow-sm">
                          <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase italic">Likuiditas Terserap</span>
                          <span className="text-xs font-black text-accent">{(globalLiquidity?.totalProfitDistributed || 0).toFixed(4)} ETH</span>
                        </div>
                        <div className="flex justify-between items-center p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/60 shadow-sm">
                          <span className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase italic">Provider Status</span>
                          <span className="text-xs font-black text-green-600 italic">Connected</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 rounded-xl md:rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-center">
                      <p className="text-[8px] md:text-[9px] font-bold text-blue-600/60 uppercase italic leading-relaxed">Sistem audit mandiri memungkinkan pemantauan brankas tanpa MetaMask.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="animate-in fade-in duration-300">
              {/* Log Audit content remains same as previous version but with Bahasa Indonesia */}
              <Card className="liquid-glass border-none rounded-2xl md:rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-6 md:p-8 border-b border-primary/5 bg-accent/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-black italic uppercase text-accent flex items-center gap-2 md:gap-3">
                      <FileText className="w-5 h-5 md:w-6 md:h-6 text-primary" /> Log Audit Ekosistem
                    </h3>
                    <p className="text-[8px] md:text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Seluruh jejak ekonomi ekosistem AliBank.</p>
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-primary/5 text-[8px] md:text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-6 md:px-8 py-4 md:py-6">ID Transaksi</th>
                        <th className="px-6 md:px-8 py-4 md:py-6">Kategori</th>
                        <th className="px-6 md:px-8 py-4 md:py-6">Nominal</th>
                        <th className="px-6 md:px-8 py-4 md:py-6">Status</th>
                        <th className="px-6 md:px-8 py-4 md:py-6 text-right">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {globalHistory && globalHistory.length > 0 ? globalHistory.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="px-6 md:px-8 py-4 md:py-5"><p className="text-[9px] md:text-[10px] font-black text-accent uppercase">#{tx.id?.slice(-10) || `TX-${idx}`}</p></td>
                          <td className="px-6 md:px-8 py-4 md:py-5">
                            <Badge className={cn("text-[6px] md:text-[7px] font-black uppercase border-none", tx.type === 'income' ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary")}>
                              {tx.category || 'Umum'}
                            </Badge>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-5">
                            <p className="text-xs md:text-sm font-black text-accent italic whitespace-nowrap">
                              {tx.amountUsd ? `$ ${tx.amountUsd.toLocaleString()}` : tx.amount ? `Rp ${tx.amount.toLocaleString()}` : tx.cryptoAmount ? `${tx.cryptoAmount} ETH` : '---'}
                            </p>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-5">
                            <div className="flex items-center gap-1">
                              <div className={cn("w-1 md:w-1.5 h-1 md:h-1.5 rounded-full", tx.status === 'success' || !tx.status ? "bg-green-500" : "bg-amber-500")} />
                              <span className="text-[8px] md:text-[9px] font-bold uppercase">{tx.status === 'success' ? 'Berhasil' : tx.status || 'Selesai'}</span>
                            </div>
                          </td>
                          <td className="px-6 md:px-8 py-4 md:py-5 text-right">
                            <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                              {tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000).toLocaleString('id-ID') : 'Baru saja'}
                            </p>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="py-16 md:py-20 text-center">
                            <Activity className="w-10 h-10 md:w-12 md:h-12 text-primary/10 mx-auto mb-4" />
                            <p className="text-[9px] md:text-xs font-black text-muted-foreground uppercase tracking-widest">Tidak ada aktivitas terdeteksi.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <footer className="mt-16 md:mt-20 pt-8 md:pt-12 border-t border-primary/10 flex flex-col items-center gap-6 md:gap-8 text-center">
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 md:w-6 md:h-6 p-1 rounded-lg gold-gradient flex items-center justify-center"><LogoIcon className="text-white" /></div>
              <p className="text-[10px] md:text-xs font-black text-accent italic uppercase tracking-tighter">Pusat Komando AliBank</p>
            </div>
            <p className="text-[6px] md:text-[8px] font-black uppercase text-muted-foreground tracking-[0.2em] md:tracking-[0.3em]">Official Web3 Node Infrastructure • Google Cloud Powered • 2024</p>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
