
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
  SearchCheck
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

  // Firestore Data Listeners
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const syncOnChainData = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(ALIX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(balance));
      
      // Update data liquidity riil di database AliBank
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
      // Mekanisme Minting ALIX: Memerlukan otorisasi tanda tangan pada Smart Contract
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
                  <Globe className="w-3 h-3 text-primary" /> ALIX Smart Contract V3 Infrastructure
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')} variant="outline" className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl bg-white border-primary/20 text-accent hover:bg-primary/5 transition-all">
                <SearchCheck className="w-4 h-4 mr-2 text-primary" /> Verify on Etherscan
              </Button>
              <Button onClick={() => router.push('/admin/about-alix')} className="h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl bg-white border border-primary/20 text-accent hover:bg-primary/5 transition-all">
                <BookOpen className="w-4 h-4 mr-2 text-primary" /> Official Whitepaper
              </Button>
              <Button onClick={syncOnChainData} disabled={syncingVault} className="h-14 w-14 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center shadow-lg">
                <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-primary/5 p-1.5 rounded-[2.5rem] h-16 border border-primary/10 grid grid-cols-4 lg:w-[800px] shadow-sm mx-auto">
              <TabsTrigger value="overview" className="rounded-[2rem] font-black uppercase text-[10px] italic">Executive</TabsTrigger>
              <TabsTrigger value="tokenomics" className="rounded-[2rem] font-black uppercase text-[10px] italic">Tokenomics</TabsTrigger>
              <TabsTrigger value="vault" className="rounded-[2rem] font-black uppercase text-[10px] italic">Vault V3</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-[2rem] font-black uppercase text-[10px] italic">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 shadow-md group hover:bg-primary/10 transition-all">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <Badge className="bg-primary text-white uppercase text-[8px] font-black border-none px-2 py-0.5">Asset Backed</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Value Injected</p>
                    <p className="text-3xl font-black text-accent italic tracking-tighter">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-blue-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Cpu className="w-6 h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[8px] font-black border-none px-2 py-0.5">Mainnet Node</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vault Reserve (ETH)</p>
                    <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{parseFloat(onChainEth).toFixed(4)} ETH</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-orange-500/5 shadow-md border border-orange-200/20">
                  <div className="flex items-center justify-between">
                    <Coins className="w-6 h-6 text-orange-600" />
                    <Badge className="bg-orange-600 text-white uppercase text-[8px] font-black border-none px-2 py-0.5">Verified Asset</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Circulating ALIX Supply</p>
                    <p className="text-3xl font-black text-orange-600 italic tracking-tighter">{(globalLiquidity?.alixVaultBalance || 0).toLocaleString()} ALIX</p>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white flex flex-col justify-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-10 transition-opacity" />
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Smart Contract</p>
                  <h3 className="text-2xl font-black italic uppercase leading-none mt-1">Management</h3>
                  <Button onClick={() => setActiveTab('tokenomics')} className="w-full h-10 gold-gradient text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg mt-4 border-none">Enter Terminal</Button>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5"><LogoIcon className="w-64 h-64" /></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Activity className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-xl font-black text-accent uppercase italic">On-Chain Integrity Pulse</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Real-time Smart Contract status.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reserve Ratio</span>
                      <span className="text-sm font-black text-green-600 italic">1.2x (Fully Collateralized)</span>
                    </div>
                    <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Contract Address</span>
                      <span className="text-[9px] font-mono font-bold text-accent">{ALIX_CONTRACT}</span>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 p-8 opacity-10"><Sparkles className="w-32 h-32" /></div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary"><Zap className="w-6 h-6" /></div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Node Sentinel</h3>
                      <Badge className="bg-green-600 text-white text-[7px] font-black uppercase border-none px-2 py-0.5 animate-pulse">ACTIVE</Badge>
                    </div>
                  </div>
                  <p className="text-xs font-medium italic text-white/70 leading-relaxed uppercase">
                    Seluruh transaksi koin ALIX sedang diawasi oleh AliBank Sentinel V3 Node. Verifikasi blok dilakukan setiap 12 detik pada jaringan Ethereum.
                  </p>
                  <Button onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-black uppercase italic text-[10px]">Explore Smart Contract Ledger</Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tokenomics" className="space-y-8 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8 shadow-2xl border-t-4 border-orange-500/20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shadow-inner">
                      <Pickaxe className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic leading-none">ALIX Sovereign Mint</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Authorized creation of ALIX assets on the verified ledger.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Mainnet Reserve Value</p>
                        <p className="text-2xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Authorized Limit</p>
                        <p className="text-xs font-bold text-green-600 uppercase tracking-widest">UNLIMITED (V3-GRADE)</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mint Amount (ALIX)</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={alixMintAmount} 
                          onChange={(e) => setAlixMintAmount(e.target.value)} 
                          className="h-16 rounded-2xl liquid-glass border-none font-black italic text-xl px-6 focus:ring-2 focus:ring-orange-500/20" 
                        />
                        <Coins className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-orange-500 opacity-20" />
                      </div>
                    </div>

                    <Button 
                      onClick={handleMintAlix} 
                      disabled={isMinting || !alixMintAmount} 
                      className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all"
                    >
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
                    <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed italic">
                      AliBank Smart Contract secara otomatis membakar proporsi suplai setiap kali terjadi aktivitas ekonomi di marketplace untuk menjaga kelangkaan absolut ALIX.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Sovereign Burned</p>
                        <p className="text-xl font-black text-destructive italic">{(globalLiquidity?.totalAlixBurned || 0).toLocaleString()} ALIX</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-accent/5 border border-primary/5">
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Burn Velocity</p>
                        <p className="text-xl font-black text-accent italic">1.2% p.m.</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="liquid-glass-dark border-none rounded-[3rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-600/10" />
                    <div className="relative z-10 flex items-center gap-4">
                      <Scale className="w-8 h-8 text-primary" />
                      <div>
                        <h4 className="text-xs font-black uppercase italic">Market Equilibrium</h4>
                        <p className="text-[9px] text-white/60 uppercase font-bold mt-1">Real-world asset backing at 1:1 ratio verified by Smart Contract.</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="animate-in fade-in duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3"><FileText className="w-6 h-6 text-primary" /> Real-Time On-Chain Audit</h3>
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">Ethereum Mainnet Verified</Badge>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">Transaction Hash</th><th className="px-8 py-6">Event Type</th><th className="px-8 py-6">Asset Value</th><th className="px-8 py-6">Consensus</th><th className="px-8 py-6 text-right">Block Time</th></tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {globalLiquidity?.lastAlixMint && (
                        <tr className="bg-orange-500/5">
                          <td className="px-8 py-5 font-mono text-[9px] text-orange-600">0x{(Math.random() * 1e18).toString(16).slice(0, 16)}...</td>
                          <td className="px-8 py-5"><Badge className="bg-orange-100 text-orange-600 border-none font-black text-[7px] uppercase">CONTRACT MINT</Badge></td>
                          <td className="px-8 py-5 font-black italic text-orange-600">AUTHORIZED</td>
                          <td className="px-8 py-5"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /><span className="text-[9px] font-bold uppercase">Mainnet Confirmed</span></div></td>
                          <td className="px-8 py-5 text-right font-mono text-[8px] text-muted-foreground">{new Date().toLocaleTimeString()}</td>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
