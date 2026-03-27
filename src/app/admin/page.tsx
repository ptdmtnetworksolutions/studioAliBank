
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
  Key
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
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider, ethers } from "ethers";
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
  const [isSettling, setIsSettling] = useState(false);
  
  // State Manajemen Brankas
  const [vaultDepositAmount, setVaultVaultDepositAmount] = useState("");
  const [vaultAssetType, setVaultAssetType] = useState<"BTC" | "ETH" | "USDT">("ETH");
  const [isConsolidating, setIsConsolidating] = useState(false);

  // Form Inventaris
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceIdr: "",
    category: "Infrastruktur",
    image: ""
  });

  // Listener Data Riil dari Production Ledger
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const mktQuery = useMemo(() => (db ? collection(db, "marketplace") : null), [db]);
  const { data: products } = useCollection(mktQuery);

  const txQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(25)) : null), [db]);
  const { data: globalHistory } = useCollection(txQuery);

  const bridgeQuery = useMemo(() => (db ? query(collection(db, "system", "bridge", "queue"), orderBy("timestamp", "desc")) : null), [db]);
  const { data: bridgeQueue } = useCollection(bridgeQuery);

  const adminDocRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: adminData } = useDoc(adminDocRef);

  const [isSyncingEngine, setIsSyncingEngine] = useState(false);

  const syncOnChainVault = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(DEFAULT_CONTRACT).catch(() => 0n);
      setOnChainTotal(formatEther(balance));
    } catch (err: any) {
      console.error("Mainnet synchronization failure:", err);
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

  const handleEngineSync = async () => {
    if (!db || isSyncingEngine) return;
    setIsSyncingEngine(true);
    try {
      await syncOnChainVault();
      toast({ title: "Integrity Sync Complete", description: "Ledger Internal dan Saldo On-Chain telah disinkronkan." });
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncingEngine(false);
    }
  };

  const handleBroadcastBridge = async (bridgeId: string, asset: string, amount: number, recipient: string) => {
    if (!db || isSettling) return;
    setIsSettling(true);
    try {
      const bridgeRef = doc(db, "system", "bridge", "queue", bridgeId);
      const txId = `SETTLE-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
      
      await updateDoc(bridgeRef, {
        status: "broadcasted",
        broadcastTime: serverTimestamp(),
        txId: txId
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: txId,
        category: "Bridge Settlement",
        cryptoAmount: amount,
        cryptoCurrency: asset,
        status: "success",
        timestamp: serverTimestamp(),
        recipient: recipient
      });

      toast({ title: "Official Settlement Successful", description: `Aset ${amount} ${asset} telah dikliring secara permanen.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Clearing Failed", description: err.message });
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
        stock: 999,
        image: newProduct.image || "https://picsum.photos/seed/node/600/400",
        createdAt: new Date().toISOString()
      });
      setIsAddingProduct(false);
      toast({ title: "Product Officially Listed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to publish" });
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
      toast({ variant: "destructive", title: "Insufficient Administrative Balance" });
      return;
    }

    setIsSettling(true);
    try {
      const adminRef = doc(db, "users", user.uid);
      await updateDoc(adminRef, { [`cryptoBalances.${vaultAssetType}`]: increment(-amount) });

      const ethEquivalent = vaultAssetType === 'BTC' ? amount * 15 : vaultAssetType === 'USDT' ? amount * 0.0003 : amount;
      await updateDoc(doc(db, "system", "liquidity"), { 
        totalProfitDistributed: increment(ethEquivalent),
        lastVaultInjection: serverTimestamp()
      });

      toast({ title: "Liquidity Injection Complete", description: `${amount} ${vaultAssetType} moved to Official Vault.` });
      setVaultVaultDepositAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Execution Failed" });
    } finally {
      setIsSettling(false);
    }
  };

  const handleMainnetConsolidation = async () => {
    if (!db || !user || !adminData?.privateKey || !globalLiquidity?.totalProfitDistributed) return;
    
    const amountToSettle = globalLiquidity.totalProfitDistributed;
    if (amountToSettle <= 0) return;

    setIsConsolidating(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const wallet = new ethers.Wallet(adminData.privateKey, provider);
      
      const tx = await wallet.sendTransaction({
        to: DEFAULT_CONTRACT,
        value: parseEther(amountToSettle.toFixed(18))
      });

      toast({ title: "Settlement Broadcasted", description: "Menunggu konfirmasi blok Mainnet Ethereum..." });
      await tx.wait();

      await updateDoc(doc(db, "system", "liquidity"), {
        totalProfitDistributed: 0,
        lastMainnetConsolidation: serverTimestamp()
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: tx.hash,
        category: "Mainnet Vault Consolidation",
        cryptoAmount: amountToSettle,
        cryptoCurrency: "ETH",
        status: "success",
        timestamp: serverTimestamp(),
        recipient: DEFAULT_CONTRACT
      });

      await syncOnChainVault();
      toast({ title: "Consolidation Success", description: "Dana telah dikunci secara permanen di Brankas V3 Smart Contract." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Consolidation Failed", description: err.message });
    } finally {
      setIsConsolidating(false);
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
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Command Center</h1>
                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">Official Node V3 Infrastructure: {DEFAULT_CONTRACT}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleEngineSync} disabled={isSyncingEngine} className={cn("h-14 px-6 rounded-2xl font-black uppercase text-[10px] italic shadow-xl transition-all gold-gradient text-white")}>
                {isSyncingEngine ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Initializing Sync...</> : <><Database className="w-4 h-4 mr-2" /> Integrity Sync Engine</>}
              </Button>
              <Button onClick={syncOnChainVault} disabled={syncingVault} className="h-14 w-14 rounded-2xl liquid-glass border-primary/10 text-primary flex items-center justify-center">
                <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
              </Button>
            </div>
          </header>

          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-primary/5 p-1 rounded-[2rem] h-16 border border-primary/10 grid grid-cols-6 lg:w-full shadow-sm overflow-x-auto no-scrollbar">
              <TabsTrigger value="overview" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Dashboard</TabsTrigger>
              <TabsTrigger value="inventory" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Inventory</TabsTrigger>
              <TabsTrigger value="bridge" className="rounded-[1.5rem] font-black uppercase text-[10px] italic relative">
                Clearing {bridgeQueue?.filter(b => b.status === 'pending_broadcast').length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] rounded-full flex items-center justify-center animate-pulse">!</span>}
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Liquidity</TabsTrigger>
              <TabsTrigger value="vault" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Vault</TabsTrigger>
              <TabsTrigger value="audit" className="rounded-[1.5rem] font-black uppercase text-[10px] italic">Audit Log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <DollarSign className="w-6 h-6 text-primary" />
                    <Badge className="bg-primary/10 text-primary uppercase text-[8px] font-black">Net Cash</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Gateway Balance</p>
                    <p className="text-3xl font-black text-accent italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-blue-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Wallet className="w-6 h-6 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-600 uppercase text-[8px] font-black">ETH Reserves</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">On-Chain Vault Balance</p>
                    <p className="text-3xl font-black text-blue-600 italic">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-orange-500/5 shadow-md">
                  <div className="flex items-center justify-between">
                    <Coins className="w-6 h-6 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-600 uppercase text-[8px] font-black">Sovereign Rights</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available Extraction Quota</p>
                    <p className="text-3xl font-black text-orange-600 italic">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)} ALIX</p>
                  </div>
                </Card>

                <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white flex flex-col justify-center shadow-xl">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Payout Gateway</p>
                  <h3 className="text-2xl font-black italic uppercase leading-none">Manage Profit</h3>
                  <Button onClick={() => setActiveTab('vault')} className="w-full h-10 gold-gradient text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg mt-4">Open Terminal</Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="vault" className="space-y-8 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-8 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Lock className="w-8 h-8" /></div>
                    <div>
                      <h3 className="text-2xl font-black text-accent uppercase italic">Reserve Consolidation</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Inject digital assets into the Global Banking Vault.</p>
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
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Asset Injection Amount</label>
                      <Input type="number" placeholder="0.00" value={vaultDepositAmount} onChange={(e) => setVaultVaultDepositAmount(e.target.value)} className="h-14 rounded-2xl liquid-glass border-none font-black italic text-lg" />
                      <p className="text-[8px] font-bold text-muted-foreground uppercase px-1">Institutional Balance: {adminData?.cryptoBalances?.[vaultAssetType] || 0} {vaultAssetType}</p>
                    </div>

                    <Button onClick={handleDepositToVault} disabled={isSettling || !vaultDepositAmount} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black uppercase italic text-sm shadow-2xl">
                      {isSettling ? <Loader2 className="w-5 h-5 animate-spin" /> : `Execute Vault Injection`}
                    </Button>
                  </div>
                </Card>

                <div className="space-y-6">
                  <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 text-white space-y-6 flex flex-col justify-center shadow-2xl relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-5"><LogoIcon className="w-64 h-64" /></div>
                    <div className="text-center space-y-4 relative z-10">
                      <div className="flex items-center justify-center gap-3">
                        <ShieldCheck className="w-12 h-12 text-primary" />
                        <Badge className="bg-green-600 text-white text-[8px] font-black uppercase px-2 py-0.5 animate-pulse">Mainnet Active</Badge>
                      </div>
                      <h3 className="text-3xl font-black uppercase italic">Official Liquidity Status</h3>
                      <div className="space-y-2 pt-4 border-t border-white/10">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Pending Ledger Consolidation</p>
                        <p className="text-5xl font-black text-primary italic">{(globalLiquidity?.totalProfitDistributed || 0).toFixed(4)} ETH</p>
                      </div>
                      
                      <div className="pt-6 space-y-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                          <div className="text-left">
                            <p className="text-[8px] font-black uppercase text-white/40">V3 Smart Contract</p>
                            <p className="text-[9px] font-bold">{DEFAULT_CONTRACT.slice(0,18)}...</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black uppercase text-white/40">On-Chain Balance</p>
                            <p className="text-sm font-black text-primary">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
                          </div>
                        </div>

                        <Button 
                          onClick={handleMainnetConsolidation} 
                          disabled={isConsolidating || (globalLiquidity?.totalProfitDistributed || 0) <= 0}
                          className="w-full h-14 bg-white text-accent rounded-2xl font-black uppercase italic text-[10px] shadow-xl hover:bg-primary hover:text-white transition-all"
                        >
                          {isConsolidating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Zap className="w-4 h-4 mr-2" /> Settle to Mainnet V3 Contract</>}
                        </Button>
                      </div>
                    </div>
                  </Card>

                  <Card className="liquid-glass border-none rounded-[2.5rem] p-6 space-y-4 shadow-xl">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Key className="w-5 h-5" /></div>
                      <div>
                        <h4 className="text-[10px] font-black text-accent uppercase italic">Institutional Signature Active</h4>
                        <p className="text-[9px] text-muted-foreground font-medium italic mt-1 leading-relaxed">
                          Seluruh penyelesaian aset ke Smart Contract V3 dilakukan secara non-kustodial menggunakan tanda tangan kedaulatan Admin. Pastikan saldo dompet Admin cukup untuk biaya gas Mainnet.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bridge" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] p-10 shadow-2xl">
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <ArrowRightLeft className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-accent uppercase italic">Ali-Bridge Clearing House</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase">Official cross-chain asset verification & settlement.</p>
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
                              {item.status === 'broadcasted' ? 'SETTLED' : 'AWAITING DISPATCH'}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase break-all">Destination: {item.recipient}</p>
                          <p className="text-[8px] text-muted-foreground uppercase italic">Client: {item.userName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {item.status === 'pending_broadcast' ? (
                          <Button 
                            onClick={() => handleBroadcastBridge(item.id, item.asset, item.amount, item.recipient)}
                            disabled={isSettling}
                            className="h-12 px-8 gold-gradient text-white rounded-xl font-black uppercase italic text-[10px] shadow-lg"
                          >
                            {isSettling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Execute Settlement</>}
                          </Button>
                        ) : (
                          <div className="text-right">
                            <p className="text-[8px] font-black text-green-600 uppercase tracking-widest">SETTLEMENT ID: {item.txId}</p>
                            <p className="text-[7px] text-muted-foreground uppercase">{new Date(item.broadcastTime?.seconds * 1000).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center space-y-4">
                      <Activity className="w-12 h-12 text-primary/10 mx-auto" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Network clearing queue is empty.</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-end gap-4 mb-4">
                <div>
                  <h2 className="text-3xl font-black text-accent uppercase italic">Inventory Manager</h2>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">Manage physical and digital listings in the production marketplace.</p>
                </div>
                <Button onClick={() => setIsAddingProduct(!isAddingProduct)} className="h-12 px-6 rounded-xl gold-gradient text-white font-black uppercase text-[10px] italic shadow-lg">
                  {isAddingProduct ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />} {isAddingProduct ? "Cancel" : "Add New Listing"}
                </Button>
              </div>

              {isAddingProduct && (
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 mb-8 animate-in fade-in slide-in-from-top-2 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Product Name</label><Input placeholder="Master Node Access" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                    <div className="space-y-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Price (USD)</label><Input type="number" placeholder="1000" value={newProduct.priceUsd} onChange={(e) => setNewProduct({...newProduct, priceUsd: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                    <div className="space-y-2 md:col-span-2"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</label><Input placeholder="Full specifications..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="h-12 rounded-xl bg-white/50 border-none font-bold text-xs" /></div>
                  </div>
                  <Button onClick={handleAddProduct} disabled={isSettling} className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic text-sm shadow-xl">Confirm Production Listing</Button>
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

            <TabsContent value="audit" className="animate-in fade-in duration-300">
              <Card className="liquid-glass border-none rounded-[3rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5"><h3 className="text-xl font-black italic uppercase text-accent flex items-center gap-3"><FileText className="w-6 h-6 text-primary" /> Ecosystem Audit Ledger</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest"><th className="px-8 py-6">Settlement ID</th><th className="px-8 py-6">Category</th><th className="px-8 py-6">Amount</th><th className="px-8 py-6">Status</th><th className="px-8 py-6 text-right">Timestamp</th></tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {globalHistory?.map((tx: any, idx: number) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5"><p className="text-[10px] font-black text-accent uppercase">#{tx.id?.slice(-12)}</p></td>
                          <td className="px-8 py-5"><Badge className="text-[7px] font-black uppercase bg-primary/10 text-primary border-none">{tx.category}</Badge></td>
                          <td className="px-8 py-5"><p className="text-sm font-black text-accent italic">{tx.amountUsd ? `$ ${tx.amountUsd.toLocaleString()}` : tx.cryptoAmount ? `${tx.cryptoAmount} ${tx.cryptoCurrency}` : '---'}</p></td>
                          <td className="px-8 py-5"><div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[9px] font-bold uppercase">Settled</span></div></td>
                          <td className="px-8 py-5 text-right"><p className="text-[10px] font-bold text-muted-foreground">{tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000).toLocaleString() : 'Just now'}</p></td>
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
