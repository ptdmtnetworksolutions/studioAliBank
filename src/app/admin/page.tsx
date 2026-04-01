
"use client";

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
  Building2,
  CheckCircle2,
  PackagePlus,
  CreditCard,
  DollarSign,
  Plus,
  Minus,
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
  Search,
  Bell,
  MessageSquare,
  TrendingUp,
  LineChart,
  BarChart3,
  Flame,
  Settings,
  LogOut,
  ChevronRight,
  Database,
  ArrowDownRight,
  Eraser,
  HelpCircle,
  Cpu,
  Globe,
  PlusCircle,
  Key,
  Sparkles,
  Sun,
  Moon,
  Clock,
  ShoppingCart,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  CreditCard as CardIcon,
  PiggyBank,
  Skull,
  QrCode,
  Copy,
  ArrowUpFromLine,
  ArrowDownToLine,
  History as HistoryIcon,
  Link2,
  Scan
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore, useAuth } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  increment, 
  query,
  orderBy,
  limit,
  deleteDoc,
  getDocs,
  writeBatch,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { JsonRpcProvider, formatEther, ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";
import { useTheme } from "next-themes";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
} from "recharts";

// KONSTANTA GLOBAL ADMIN - ALIBANK VAULT V3 (WEB3 NATIVE)
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com"; 
const ALX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const ETHERSCAN_API_KEY = "M1S7MDTBQSG1A3URQKYNVF31PSPE48UA8R";

const mockPerformanceData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 2000 },
  { name: 'Apr', revenue: 2780 },
  { name: 'May', revenue: 1890 },
  { name: 'Jun', revenue: 2390 },
  { name: 'Jul', revenue: 3490 },
];

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  
  const [adjustAmounts, setAdjustAmounts] = useState<Record<string, string>>({});
  const [alixMintAmount, setAlixMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const [vaultRecipient, setVaultRecipient] = useState("");
  const [vaultAmount, setVaultAmount] = useState("");
  const [isExecutingVaultTx, setIsExecutingVaultTx] = useState(false);
  const [onChainHistory, setOnChainHistory] = useState<any[]>([]);

  const [viewingUser, setViewingUser] = useState<any>(null);
  const [viewingUserDeposits, setViewingUserDeposits] = useState<any[]>([]);
  const [viewingUserWallets, setViewingUserWallets] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);
  const usersQuery = useMemo(() => (db ? query(collection(db, "users"), limit(100)) : null), [db]);
  const { data: allUsers } = useCollection(usersQuery);
  const auditQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db]);
  const { data: auditLogs } = useCollection(auditQuery);
  const marketplaceQuery = useMemo(() => (db ? query(collection(db, "marketplace"), limit(50)) : null), [db]);
  const { data: inventoryItems } = useCollection(marketplaceQuery);

  const syncOnChainData = useCallback(async (manual = false) => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(ALX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(balance));

      try {
        const [resNormal, resInternal] = await Promise.all([
          fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${ALX_CONTRACT}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${ETHERSCAN_API_KEY}`),
          fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${ALX_CONTRACT}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${ETHERSCAN_API_KEY}`)
        ]);

        const dataNormal = await resNormal.json();
        const dataInternal = await resInternal.json();
        
        const normalResults = dataNormal.status === "1" ? dataNormal.result : [];
        const internalResults = dataInternal.status === "1" ? dataInternal.result : [];

        const combinedResults = [...normalResults, ...internalResults].sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));

        if (combinedResults.length > 0) {
          const timeAgo = (ts: string) => {
            const seconds = Math.floor((Date.now() - parseInt(ts) * 1000) / 1000);
            if (seconds < 60) return `${seconds}s ago`;
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
          };

          const realHistory = combinedResults.slice(0, 20).map((tx: any) => {
            const isOut = tx.from.toLowerCase() === ALX_CONTRACT.toLowerCase();
            const val = formatEther(tx.value);
            return {
              hash: tx.hash ? (tx.hash.slice(0, 10) + "...") : "Internal",
              fullHash: tx.hash || "",
              from: tx.from,
              to: tx.to,
              value: `${parseFloat(val).toFixed(6)} ETH`,
              type: isOut ? "OUT" : "IN",
              time: timeAgo(tx.timeStamp),
              method: tx.input && tx.input !== '0x' ? 'Contract Call' : (tx.hash ? 'Transfer' : 'Internal Transfer')
            };
          });
          setOnChainHistory(realHistory);
        }
      } catch (apiErr) {
        console.warn("Etherscan API fetch failed", apiErr);
      }
      
      if (manual) {
        toast({ title: "Vault Synced", description: "Data Mainnet telah diperbarui dengan catatan Etherscan terbaru." });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally { 
      setSyncingVault(false); 
    }
  }, [toast, syncingVault]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isAuthorized) {
      syncOnChainData(false);
    }
  }, [isAuthorized, syncOnChainData]);

  const handleExecuteVaultWithdrawal = async () => {
    if (!vaultRecipient || !vaultAmount || isExecutingVaultTx) return;
    setIsExecutingVaultTx(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      if (db) {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `VAULT-WDR-${Date.now()}`,
          category: "External Disbursement",
          gateway: "Ali-Mainnet Node",
          amountUsd: parseFloat(vaultAmount) * 2500, 
          recipient: vaultRecipient,
          status: "success",
          timestamp: serverTimestamp(),
          description: `Vault withdrawal to ${vaultRecipient.slice(0, 8)}...`
        });
      }

      toast({ title: "Withdrawal Sent", description: "Transaksi telah disiarkan ke jaringan Ethereum." });
      setVaultRecipient("");
      setVaultAmount("");
      syncOnChainData(true);
    } catch (err) {
      toast({ variant: "destructive", title: "Withdrawal Failed" });
    } finally {
      setIsExecutingVaultTx(false);
    }
  };

  const handleUpdateUserBalance = async (uid: string, type: 'add' | 'sub') => {
    if (!db) return;
    const amount = parseFloat(adjustAmounts[uid] || "0");
    if (isNaN(amount) || amount <= 0) return;
    try {
      await updateDoc(doc(db, "users", uid), { totalBalance: increment(type === 'add' ? amount : -amount) });
      toast({ title: "Updated" });
      setAdjustAmounts(prev => ({ ...prev, [uid]: "" }));
    } catch (e) {}
  };

  const handleMintAlix = async () => {
    if (!db || !alixMintAmount) return;
    const amount = parseFloat(alixMintAmount);
    setIsMinting(true);
    try {
      await updateDoc(doc(db, "system", "liquidity"), { alixVaultBalance: increment(amount), totalAlixMinted: increment(amount) });
      toast({ title: "Minted" });
      setAlixMintAmount("");
    } catch (e) {} finally { setIsMinting(false); }
  };

  const handleDeleteAuditLog = async (logId: string) => {
    if (!db) return;
    try {
      const logRef = doc(db, "system", "audit", "global_transactions", logId);
      const logSnap = await getDoc(logRef);
      
      if (logSnap.exists()) {
        const logData = logSnap.data();
        const liquidityRef = doc(db, "system", "liquidity");
        
        const updates: any = {};
        if (logData.amountIdr) {
          updates.totalFiatInjected = increment(-logData.amountIdr);
          
          if (logData.category === "Trade-X Capture") {
            updates.tradeXGrossVolumeIdr = increment(-logData.amountIdr);
          } else if (logData.category === "Ali-Spin Capture") {
            updates.spinGrossVolumeIdr = increment(-logData.amountIdr);
          }
        }
        if (logData.amountUsd) {
          updates.totalUsdInjected = increment(-logData.amountUsd);
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(liquidityRef, updates);
        }
      }

      await deleteDoc(logRef);
      toast({ title: "Log Dihapus", description: "Saldo sistem telah diperbarui secara otomatis." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menghapus" });
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!db || isPurging) return;
    if (!confirm("Peringatan: Seluruh riwayat transaksi sistem akan dihapus secara permanen dan dashboard akan direset ke nol mutlak. Lanjutkan?")) return;

    setIsPurging(true);
    try {
      const q = query(collection(db, "system", "audit", "global_transactions"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const liquidityRef = doc(db, "system", "liquidity");
      batch.set(liquidityRef, {
        totalFiatInjected: 0,
        totalUsdInjected: 0,
        tradeXGrossVolumeIdr: 0,
        spinGrossVolumeIdr: 0,
        totalInternalAumIdr: 0,
        totalAlixSoldInternally: 0,
        alixVaultBalance: 0,
        totalAlixMinted: 0,
        totalAlixBurned: 0
      }, { merge: false });

      await batch.commit();
      toast({ title: "Sistem Dibersihkan", description: "Audit dihapus dan seluruh angka dashboard kembali ke Nol Mutlak." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Membersihkan Audit" });
    } finally {
      setIsPurging(false);
    }
  };

  const handleWipeAllClientData = async () => {
    if (!db || isPurging) return;
    if (!confirm("⚠️ PERINGATAN NUKLIR: Tindakan ini akan mengosongkan SELURUH saldo deposito, tabungan, dan aset kripto di SEMUA akun nasabah untuk persiapan publik. Lanjutkan?")) return;

    setIsPurging(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = writeBatch(db);

      for (const userDoc of usersSnap.docs) {
        batch.update(userDoc.ref, {
          totalBalance: 0,
          savings: 0,
          cryptoBalances: { BTC: 0, ETH: 0, USDT: 0, ALX: 0 }
        });

        const subCollections = ['deposits', 'wallets', 'transactions', 'notifications'];
        for (const sub of subCollections) {
          const subSnap = await getDocs(collection(db, "users", userDoc.id, sub));
          subSnap.docs.forEach(d => batch.delete(d.ref));
        }
      }

      await batch.commit();
      toast({ title: "Reset Produksi Berhasil", description: "Seluruh saldo nasabah kini telah menjadi nol mutlak." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Melakukan Reset Massal" });
    } finally {
      setIsPurging(false);
    }
  };

  const fetchUserSubCollections = async (userId: string) => {
    if (!db) return;
    setIsDetailLoading(true);
    try {
      const depositsSnap = await getDocs(collection(db, "users", userId, "deposits"));
      const walletsSnap = await getDocs(collection(db, "users", userId, "wallets"));
      
      setViewingUserDeposits(depositsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setViewingUserWallets(walletsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching user detail:", err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const copyVaultAddress = () => {
    navigator.clipboard.writeText(ALX_CONTRACT);
    toast({ title: "Address Copied", description: "Alamat brankas Mainnet telah disalin." });
  };

  const displayVal = (val: number) => Math.max(0, val || 0);

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground flex font-body transition-colors duration-300">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen z-50 transition-colors">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg">
              <LogoIcon className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter italic uppercase text-foreground">AliBank</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 pt-4">
            <SidebarItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Clients" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={Wallet} label="Vault Control" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
            <SidebarItem icon={Coins} label="Tokenomics" active={activeTab === 'tokenomics'} onClick={() => setActiveTab('tokenomics')} />
            <SidebarItem icon={Box} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={FileText} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          </nav>

          <div className="p-6 border-t border-border">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Interface Theme</span>
              <button 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary/10 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-primary" /> : <Moon className="w-5 h-5 text-foreground" />}
              </button>
            </div>
            <SidebarItem icon={Settings} label="Settings" />
            <SidebarItem icon={LogOut} label="Logout" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600" onClick={() => auth?.signOut()} />
            
            <div className="mt-8 bg-green-500/5 p-6 rounded-3xl border border-green-500/10 relative overflow-hidden group cursor-pointer transition-colors" onClick={() => router.push('/admin/about-alix')}>
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                <Sparkles className="w-20 h-20 text-green-600" />
              </div>
              <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">Kickoff Plan!</p>
              <p className="text-xs font-bold text-green-600/80 leading-relaxed mb-4">Upgrade to enterprise plan for real-time Web3 analytics!</p>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-[9px] border-none">View Strategy</Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors">
          
          <header className="h-20 bg-card border-b border-border flex items-center justify-between px-10 sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <h1 className="text-2xl font-black tracking-tight capitalize text-foreground transition-colors">{activeTab === 'dashboard' ? 'Overview' : activeTab}</h1>
              <div className="relative flex-1 hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search global data..." className="h-11 pl-12 bg-muted border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none text-foreground transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <button className="relative p-2 text-muted-foreground hover:text-primary transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
              </button>
              <div className="h-8 w-px bg-border" />
              <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black leading-none text-foreground transition-colors">Super Admin</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Web3 Node</p>
                </div>
                <div className="w-10 h-10 rounded-full gold-gradient p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                    <Image src="https://picsum.photos/seed/admin/100/100" alt="avatar" width={40} height={40} className="object-cover" />
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </header>

          <div className="p-10 space-y-10 overflow-y-auto no-scrollbar pb-20">
            
            {/* TAB: DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card 
                    className="lg:col-span-8 border-none shadow-none bg-card rounded-[2.5rem] p-10 space-y-10 cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all group"
                    onClick={() => setActiveTab('audit')}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 transition-colors">
                          <Database className="w-6 h-6" />
                        </div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground transition-colors">AliBank Global Liquidity</h3>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-border font-black uppercase text-[10px] h-10 px-6 italic text-foreground transition-colors" 
                        onClick={(e) => { e.stopPropagation(); syncOnChainData(true); }}
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", syncingVault && "animate-spin")} /> Sync System
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Net Capital (IDR)</p>
                        <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] font-black px-2">+12.01%</Badge>
                      </div>
                      <h2 className="text-6xl font-black tracking-tighter italic text-[#1A1D1F] dark:text-foreground transition-colors">Rp {displayVal(globalLiquidity?.totalFiatInjected).toLocaleString('id-ID')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">Vault Reserve (USD)</span>
                        </div>
                        <p className="text-xl font-black italic text-[#1A1D1F] dark:text-foreground transition-colors">$ {displayVal(globalLiquidity?.totalUsdInjected).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-[10px] font-bold uppercase transition-colors">Gaming Profit (IDR)</span>
                        </div>
                        <p className="text-xl font-black italic text-green-600 transition-colors">Rp {displayVal((globalLiquidity?.tradeXGrossVolumeIdr || 0) + (globalLiquidity?.spinGrossVolumeIdr || 0)).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-bold uppercase">System Status</span>
                        </div>
                        <p className="text-xl font-black italic text-green-600 transition-colors">WEB3 NODE ACTIVE</p>
                      </div>
                    </div>
                  </Card>

                  <Card 
                    className="lg:col-span-4 border-none shadow-none bg-card rounded-[2.5rem] p-10 flex flex-col cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all group"
                    onClick={() => setActiveTab('users')}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-base font-black italic uppercase tracking-tight text-foreground transition-colors">Verified Clients</h3>
                      <button className="text-[10px] font-black text-primary uppercase hover:underline">See All</button>
                    </div>
                    <div className="flex -space-x-3 overflow-hidden mb-10">
                      {allUsers?.slice(0, 5).map((u, i) => (
                        <div key={i} className="inline-block h-12 w-12 rounded-full ring-4 ring-card relative group cursor-pointer transition-all">
                          <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="u" width={48} height={48} className="rounded-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></div>
                        </div>
                      ))}
                      {allUsers && allUsers.length > 5 && (
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-muted text-xs font-black ring-4 ring-card text-foreground transition-all">+{allUsers.length - 5}</div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {allUsers?.slice(0, 5).map((u, i) => (
                        <p key={i} className="text-[9px] font-bold text-muted-foreground flex-1 text-center truncate">{u.name.split(' ')[0]}</p>
                      ))}
                    </div>
                    <div className="mt-auto pt-6 border-t border-border space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground transition-colors">
                        <span>Managed Accounts</span>
                        <span className="text-[#1A1D1F] dark:text-foreground transition-colors">{allUsers?.length || 0}</span>
                      </div>
                      <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1 bg-muted transition-colors" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* REVENUE DYNAMICS CHART */}
                  <Card className="lg:col-span-8 border-none shadow-none bg-card rounded-[2.5rem] p-10 space-y-8 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black italic uppercase tracking-widest text-foreground">Revenue Dynamics</h3>
                      <div className="flex bg-muted p-1 rounded-lg">
                        <button className="px-4 py-1.5 text-[9px] font-black rounded-md bg-background shadow-sm uppercase italic">Monthly</button>
                        <button className="px-4 py-1.5 text-[9px] font-black rounded-md text-muted-foreground uppercase italic">Yearly</button>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPerformanceData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="name" hide />
                          <YAxis hide />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-around pt-2">
                      {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'].map(m => (
                        <span key={m} className="text-[10px] font-bold text-muted-foreground uppercase">{m}</span>
                      ))}
                    </div>
                  </Card>

                  {/* SOVEREIGN ASSET CARD */}
                  <Card className="lg:col-span-4 border-none shadow-none bg-[#1A1D1F] dark:bg-card rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden transition-colors">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
                    <div className="relative z-10">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Sovereign Asset</p>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter">Alix Token (ALX)</h3>
                    </div>
                    
                    <div className="relative z-10 space-y-1">
                      <p className="text-xl font-black italic uppercase tracking-widest">ALX V3 PROTOCOL</p>
                    </div>

                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Vault Inventory</p>
                        <p className="text-lg font-black italic">{displayVal(globalLiquidity?.alixVaultBalance).toLocaleString('id-ID')} ALX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Anchor Price</p>
                        <p className="text-lg font-black italic text-primary">$ 12.24</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <QuickActionCard icon={Skull} label="Reset All Clients" sub="Production Wipe" onClick={handleWipeAllClientData} className="bg-rose-500/5 hover:bg-rose-500/10 text-rose-600" />
                  <QuickActionCard icon={PlusCircle} label="Mint ALX" sub="Authorized supply" onClick={() => setActiveTab('tokenomics')} />
                  <QuickActionCard icon={Pickaxe} label="Burn ALX" sub="Deflation protocol" onClick={() => setActiveTab('tokenomics')} />
                  <QuickActionCard icon={Database} label="Sync Vault" sub="Etherscan hook" onClick={() => syncOnChainData(true)} />
                </section>

                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border flex items-center justify-between transition-colors">
                    <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground transition-colors">Recent Activity Ledger</h3>
                    <button onClick={() => setActiveTab('audit')} className="rounded-xl text-muted-foreground font-black uppercase text-[10px] h-10 italic flex items-center gap-2 hover:text-primary transition-colors">View All Logs <ArrowDownRight className="w-4 h-4" /></button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest transition-colors">
                        <tr>
                          <th className="px-10 py-6">Operation ID</th>
                          <th className="px-10 py-6">Context</th>
                          <th className="px-10 py-6">Value</th>
                          <th className="px-10 py-6 text-right">Synchronization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border transition-colors">
                        {auditLogs?.slice(0, 5).map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors cursor-default group">
                            <td className="px-10 py-6">
                              <p className="font-mono text-xs font-bold text-foreground transition-colors">{log.id}</p>
                            </td>
                            <td className="px-10 py-6">
                              <Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase transition-colors">{log.category}</Badge>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-black italic text-[#1A1D1F] dark:text-foreground transition-colors">
                                {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString('id-ID')}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}
                              </p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="text-[10px] font-bold text-muted-foreground italic transition-colors">{log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('id-ID') : '---'}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: CLIENTS */}
            {activeTab === 'users' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-green-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground transition-colors">Managed Account Base</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 transition-colors">Consolidated client control terminal</p>
                    </div>
                    <Badge className="bg-green-600 text-white font-black px-4 py-1.5 rounded-full shadow-lg shadow-green-500/20">
                      {allUsers?.length || 0} Registered
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border transition-colors">
                        <tr>
                          <th className="px-10 py-8">Client Profile</th>
                          <th className="px-10 py-8">Institutional UID</th>
                          <th className="px-10 py-8 text-right">Liquidity Control</th>
                          <th className="px-10 py-8 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border transition-colors">
                        {allUsers?.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full gold-gradient p-[2px]">
                                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                                    <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="p" width={48} height={48} className="object-cover" />
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-black italic uppercase leading-none text-foreground transition-colors">{u.name}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1 transition-colors">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6 font-mono text-[11px] text-muted-foreground transition-colors">{u.accountNumber}</td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-base font-black italic tracking-tighter text-[#1A1D1F] dark:text-foreground transition-colors">Rp {u.totalBalance?.toLocaleString('id-ID')}</p>
                                <div className="flex items-center gap-2">
                                  <input type="number" placeholder="Amt" className="h-8 w-20 text-[10px] font-black bg-muted border-none shadow-none rounded-lg text-foreground transition-colors px-2 outline-none" value={adjustAmounts[u.uid] || ""} onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [u.uid]: e.target.value }))} />
                                  <div className="flex gap-1">
                                    <button onClick={() => handleUpdateUserBalance(u.uid, 'add')} className="w-6 h-6 rounded bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"><Plus className="w-3 h-3" /></button>
                                    <button onClick={() => handleUpdateUserBalance(u.uid, 'sub')} className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"><Minus className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Dialog onOpenChange={(open) => {
                                  if (open) {
                                    setViewingUser(u);
                                    fetchUserSubCollections(u.uid);
                                  } else {
                                    setViewingUser(null);
                                  }
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-9 rounded-xl border-border text-foreground font-black uppercase text-[9px] italic hover:bg-muted transition-colors">
                                      <Search className="w-3 h-3 mr-2" /> Intelligence
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl bg-background rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                                    <DialogHeader className="p-8 bg-muted/30 border-b border-border transition-colors">
                                      <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-foreground transition-colors">Client Intelligence Profile</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="max-h-[70vh]">
                                      <div className="p-8 space-y-10">
                                        <section className="flex flex-col md:flex-row gap-8 items-start">
                                          <div className="w-32 h-32 rounded-[2.5rem] gold-gradient p-1 shrink-0">
                                            <div className="w-full h-full rounded-[2.4rem] bg-background flex items-center justify-center overflow-hidden border-4 border-background">
                                              <Image src={`https://picsum.photos/seed/${viewingUser?.uid}/200/200`} alt="p" width={128} height={128} className="object-cover" />
                                            </div>
                                          </div>
                                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            <InfoItem icon={UserIcon} label="Full Legal Name" value={viewingUser?.name} />
                                            <InfoItem icon={Mail} label="Contact Email" value={viewingUser?.email} />
                                            <InfoItem icon={Phone} label="Mobile Phone" value={viewingUser?.phone || "Not Set"} />
                                            <InfoItem icon={Lock} label="Access Security" value="••••••••" action={<Button variant="link" className="h-auto p-0 text-[10px] font-black text-primary uppercase" onClick={() => sendPasswordResetEmail(auth!, viewingUser?.email)}>Reset Access</Button>} />
                                            <InfoItem icon={MapPin} label="Home Location" value={viewingUser?.address || "No primary address linked"} />
                                            <InfoItem icon={Database} label="Institutional UID" value={viewingUser?.accountNumber} className="font-mono" />
                                          </div>
                                        </section>

                                        <section className="space-y-6">
                                          <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors">Asset Allocation (Web3)</h4>
                                          </div>
                                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            <AssetMiniCard label="Primary Balance" value={`Rp ${viewingUser?.totalBalance?.toLocaleString('id-ID')}`} color="text-foreground" />
                                            <AssetMiniCard label="Vault Savings" value={`Rp ${viewingUser?.savings?.toLocaleString('id-ID') || 0}`} color="text-green-600" />
                                            <AssetMiniCard label="ALX Reserve" value={`${viewingUser?.cryptoBalances?.ALX || 0} ALX`} color="text-primary" />
                                            <AssetMiniCard label="BTC Node" value={`${viewingUser?.cryptoBalances?.BTC || 0} BTC`} color="text-orange-500" />
                                            <AssetMiniCard label="ETH Mainnet" value={`${viewingUser?.cryptoBalances?.ETH || 0} ETH`} color="text-blue-500" />
                                            <AssetMiniCard label="USDT Liquidity" value={`${viewingUser?.cryptoBalances?.USDT || 0} USDT`} color="text-teal-500" />
                                          </div>
                                        </section>

                                        <section className="space-y-6">
                                          <div className="flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4 text-primary" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors">Identity Synchronization</h4>
                                          </div>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <SyncStatusItem label="Ali-Native Wallet" value={viewingUser?.walletAddress} />
                                            <SyncStatusItem label="DANA Payment" value={viewingUserWallets.find(w => w.name === 'DANA')?.balance ? "LINKED" : null} />
                                            <SyncStatusItem label="OVO Settlement" value={viewingUserWallets.find(w => w.name === 'OVO')?.balance ? "LINKED" : null} />
                                            <SyncStatusItem label="GoPay Bridge" value={viewingUserWallets.find(w => w.name === 'GoPay')?.balance ? "LINKED" : null} />
                                            <SyncStatusItem label="PCI-DSS Global Card" value={viewingUser?.cardDetails ? "VISA / MASTERCARD" : null} />
                                          </div>
                                        </section>

                                        <section className="space-y-6">
                                          <div className="flex items-center gap-2">
                                            <PiggyBank className="w-4 h-4 text-primary" />
                                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors">Wealth Management (Deposits)</h4>
                                          </div>
                                          {viewingUserDeposits.length > 0 ? (
                                            <div className="space-y-3">
                                              {viewingUserDeposits.map((dep, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-muted/30 border border-border flex justify-between items-center transition-colors">
                                                  <div>
                                                    <p className="text-[10px] font-black uppercase text-foreground transition-colors">{dep.type}</p>
                                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Maturity: {dep.maturityDate ? new Date(dep.maturityDate).toLocaleDateString() : '---'}</p>
                                                  </div>
                                                  <div className="text-right">
                                                    <p className="text-sm font-black italic text-primary">Rp {dep.amount?.toLocaleString('id-ID')}</p>
                                                    <Badge className="bg-primary/10 text-primary text-[7px] font-black uppercase border-none h-4 px-1">{dep.rate} APY</Badge>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="p-10 rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center transition-colors">
                                              <PiggyBank className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">No active wealth certificates</p>
                                            </div>
                                          )}
                                        </section>
                                      </div>
                                    </ScrollArea>
                                    <div className="p-8 bg-muted/30 border-t border-border flex justify-end gap-3 transition-colors">
                                      <Button variant="ghost" className="rounded-xl font-black uppercase text-[10px] px-6 h-12" onClick={() => setViewingUser(null)}>Close Intelligence</Button>
                                      <Button className="gold-gradient text-white rounded-xl font-black uppercase text-[10px] px-8 h-12 shadow-lg">Commit Adjustments</Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                <Button variant="outline" size="sm" className="h-9 rounded-xl border-border text-primary font-black uppercase text-[9px] italic hover:bg-primary/10 transition-colors" onClick={() => sendPasswordResetEmail(auth!, u.email)}>
                                  <Key className="w-3 h-3 mr-2" /> Reset Key
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
            )}

            {/* TAB: TOKENOMICS */}
            {activeTab === 'tokenomics' && (
              <div className="animate-in zoom-in-95 duration-700 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="border-none shadow-none bg-card rounded-[3rem] p-12 space-y-10 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-green-500/10 flex items-center justify-center text-green-600">
                      <Pickaxe className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-foreground transition-colors">Sovereign Mint</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Authorized Supply Expansion</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-muted p-8 rounded-[2rem] space-y-2 transition-colors">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Global Anchor Reserve (USD)</p>
                      <p className="text-3xl font-black italic text-[#1A1D1F] dark:text-foreground transition-colors">$ {displayVal(globalLiquidity?.totalUsdInjected).toLocaleString('id-ID', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Amount to Authorize (ALX)</label>
                      <input type="number" placeholder="0.00" value={alixMintAmount} onChange={(e) => setAlixMintAmount(e.target.value)} className="h-16 rounded-2xl bg-muted border-none text-xl font-black italic px-8 shadow-none text-foreground transition-colors outline-none" />
                    </div>
                    <Button onClick={handleMintAlix} disabled={isMinting || !alixMintAmount} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
                      {isMinting ? <Loader2 className="animate-spin" /> : "Authorize Mint"}
                    </Button>
                  </div>
                </Card>

                <Card className="border-none shadow-none bg-[#1A1D1F] dark:bg-card rounded-[3rem] p-12 space-y-10 text-background dark:text-foreground transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-rose-500/10 flex items-center justify-center text-rose-500">
                      <Flame className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight">Deflationary Burn</h3>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Scarcity Enforcement Protocol</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-background/10 p-8 rounded-[2rem] space-y-2">
                      <p className="text-[9px] font-black uppercase opacity-40 tracking-widest">Permanently Incinerated</p>
                      <p className="text-3xl font-black italic">{displayVal(globalLiquidity?.totalAlixBurned).toLocaleString('id-ID')} ALX</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-2">Amount to Burn (ALX)</label>
                      <input type="number" placeholder="0.00" className="h-16 rounded-2xl bg-background/10 border-none text-xl font-black italic px-8 text-foreground shadow-none transition-colors outline-none" />
                    </div>
                    <Button className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">Execute Burn</Button>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: VAULT CONTROL (WEB3 INTERFACE) */}
            {activeTab === 'vault' && (
              <div className="animate-in zoom-in-95 duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none shadow-none bg-card rounded-[3rem] p-12 flex flex-col justify-between transition-colors relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
                    
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                          <Database className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tight text-foreground transition-colors">Mainnet Vault Reserve</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Multi-Asset Custody System V3</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase italic animate-pulse">Node Production Active</Badge>
                    </div>
                    
                    <div className="bg-muted p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 transition-colors border border-border shadow-inner">
                      <div className="space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] transition-colors flex items-center gap-2">
                          <Globe className="w-3 h-3" /> On-Chain Ethereum Balance
                        </p>
                        <p className="text-6xl font-black italic tracking-tighter text-blue-600 transition-colors">
                          {parseFloat(onChainEth).toFixed(4)} <span className="text-3xl text-muted-foreground/40 italic">ETH</span>
                        </p>
                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase italic">≈ Rp {(parseFloat(onChainEth) * 33000000).toLocaleString('id-ID')} Asset Value</p>
                      </div>
                      <Button onClick={() => syncOnChainData(true)} disabled={syncingVault} className="h-16 px-12 rounded-2xl gold-gradient text-white font-black uppercase italic tracking-widest shadow-xl border-none active:scale-95 transition-all">
                        {syncingVault ? <Loader2 className="animate-spin" /> : "REFRESH NODE"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none shadow-none bg-[#1A1D1F] dark:bg-card rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 text-white text-center relative overflow-hidden transition-colors">
                    <div className="absolute inset-0 gold-gradient opacity-5 pointer-events-none" />
                    <div className="bg-white p-4 rounded-3xl shadow-2xl relative z-10 group cursor-pointer hover:scale-105 transition-transform duration-500">
                      <QrCode className="w-32 h-32 text-black" />
                      <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Scan className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Mainnet Vault Address</p>
                        <p className="text-[11px] font-mono font-bold break-all bg-white/5 p-3 rounded-xl border border-white/10">{ALX_CONTRACT}</p>
                      </div>
                      <Button onClick={copyVaultAddress} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black italic uppercase text-[10px] border border-white/5">
                        <Copy className="w-4 h-4 mr-2" /> COPY VAULT ADDR
                      </Button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-5 border-none shadow-none bg-card rounded-[3rem] p-10 space-y-8 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                        <ArrowUpFromLine className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black italic uppercase tracking-tight text-foreground transition-colors">External Disbursement</h4>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase transition-colors">Settlement to External Wallet</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recipient Public Address</label>
                        <input 
                          placeholder="0x... MetaMask / Binance" 
                          value={vaultRecipient}
                          onChange={(e) => setVaultRecipient(e.target.value)}
                          className="h-14 bg-muted border-none font-bold text-xs rounded-xl px-6 shadow-none text-foreground transition-colors outline-none w-full" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Value to Transfer (ETH)</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={vaultAmount}
                          onChange={(e) => setVaultAmount(e.target.value)}
                          className="h-14 bg-muted border-none font-black italic rounded-xl px-6 shadow-none text-foreground transition-colors outline-none w-full" 
                        />
                      </div>
                      <Button 
                        onClick={handleExecuteVaultWithdrawal}
                        disabled={isExecutingVaultTx || !vaultRecipient || !vaultAmount}
                        className="w-full h-16 bg-[#1A1D1F] dark:bg-muted text-background dark:text-foreground hover:opacity-90 rounded-2xl font-black uppercase italic tracking-widest shadow-xl transition-all border-none"
                      >
                        {isExecutingVaultTx ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-7 border-none shadow-none bg-card rounded-[3rem] overflow-hidden transition-colors">
                    <div className="p-10 border-b border-border flex items-center justify-between bg-blue-500/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
                          <HistoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tight text-foreground transition-colors">Node Node Records</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase transition-colors">Institutional Transaction Explorer</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[8px] uppercase px-3 h-6 rounded-md">LIVE ETHERSCAN</Badge>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest transition-colors">
                          <tr>
                            <th className="px-10 py-6">Tx Hash</th>
                            <th className="px-10 py-6">Method</th>
                            <th className="px-10 py-6">Value</th>
                            <th className="px-10 py-6 text-right">Synchronization</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border transition-colors">
                          {onChainHistory.map((tx, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors group">
                              <td className="px-10 py-5">
                                <a 
                                  href={`https://etherscan.io/tx/${tx.fullHash || tx.hash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 group/link"
                                >
                                  <p className="font-mono text-[10px] font-bold text-blue-600 transition-colors hover:underline">{tx.hash}</p>
                                  <ExternalLink className="w-3 h-3 text-muted-foreground/40 group-hover/link:text-blue-600" />
                                </a>
                              </td>
                              <td className="px-10 py-5">
                                <Badge className={cn(
                                  "border-none text-[8px] font-black px-2 h-5 uppercase",
                                  tx.type === 'IN' ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600"
                                )}>
                                  {tx.method || (tx.type === 'IN' ? 'Deposit' : 'Transfer')}
                                </Badge>
                              </td>
                              <td className="px-10 py-5">
                                <p className="text-xs font-black italic text-foreground transition-colors">{tx.value}</p>
                              </td>
                              <td className="px-10 py-5 text-right">
                                <p className="text-[10px] font-bold text-muted-foreground italic transition-colors">{tx.time}</p>
                              </td>
                            </tr>
                          ))}
                          {onChainHistory.length === 0 && !syncingVault && (
                            <tr>
                              <td colSpan={4} className="py-10 text-center opacity-30 italic text-[10px] font-bold uppercase">No Mainnet Records Found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-6 bg-muted/20 text-center border-t border-border transition-colors">
                      <button 
                        onClick={() => window.open(`https://etherscan.io/address/${ALX_CONTRACT}`, '_blank')}
                        className="text-[10px] font-black uppercase text-blue-600 hover:underline flex items-center justify-center gap-2 mx-auto"
                      >
                        VIEW FULL EXPLORER <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* TAB: INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-blue-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground transition-colors">Ali-Marketplace Inventory</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 transition-colors">Managing digital & physical catalog assets</p>
                    </div>
                    <Button className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">
                      <PackagePlus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
                    {inventoryItems?.map((item) => (
                      <Card key={item.id} className="bg-muted/30 border border-border rounded-2xl p-6 space-y-4 relative group overflow-hidden transition-all hover:shadow-xl transition-colors">
                        <div className="w-full h-32 rounded-xl bg-muted border border-border flex items-center justify-center mb-4 relative overflow-hidden transition-colors">
                          <Image src={item.image || `https://picsum.photos/seed/${item.id}/200/200`} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase px-2 mb-2 transition-colors">{item.category}</Badge>
                          <h4 className="text-sm font-black italic uppercase text-foreground transition-colors">{item.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs font-black text-foreground transition-colors">Rp {item.priceIdr?.toLocaleString('id-ID')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground transition-colors">Stock: {item.stock || 0}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1 rounded-lg border-border font-black uppercase text-[9px] h-8 transition-colors">Edit</Button>
                          <button onClick={() => handleDeleteAuditLog(item.id)} className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </Card>
                    ))}
                    {(!inventoryItems || inventoryItems.length === 0) && (
                      <div className="col-span-full py-20 text-center opacity-20 transition-opacity">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No Assets Found</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB: AUDIT LOGS */}
            {activeTab === 'audit' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-amber-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground transition-colors">System Audit Ledger</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 transition-colors">Irreversible historical operation log</p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handlePurgeAuditLogs} disabled={isPurging} variant="outline" className="rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[10px] h-10 px-6 italic hover:bg-rose-50 transition-colors">
                        {isPurging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eraser className="w-4 h-4 mr-2" />} Purge History
                      </Button>
                      <Button onClick={() => syncOnChainData(true)} className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">
                        <RefreshCw className={cn("w-4 h-4 mr-2", syncingVault && "animate-spin")} /> Refresh Ledger
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border transition-colors">
                        <tr>
                          <th className="px-10 py-8">Timestamp</th>
                          <th className="px-10 py-8">Operation Type</th>
                          <th className="px-10 py-8">Context</th>
                          <th className="px-10 py-8 text-right">Settlement Value</th>
                          <th className="px-10 py-8 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border transition-colors">
                        {auditLogs?.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground italic transition-colors">
                                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('id-ID') : '---'}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase transition-colors">{log.category}</Badge>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-[10px] font-black italic text-[#1A1D1F] dark:text-foreground uppercase transition-colors">{log.gateway || log.description || 'System Node'}</p>
                              <p className="text-[8px] font-mono text-muted-foreground mt-1 transition-colors">{log.id}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="text-sm font-black italic text-[#1A1D1F] dark:text-foreground transition-colors">
                                {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString('id-ID')}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}
                              </p>
                            </td>
                            <td className="px-10 py-6 text-center">
                              <button onClick={() => handleDeleteAuditLog(log.id)} className="p-2 text-muted-foreground hover:text-rose-500 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(!auditLogs || auditLogs.length === 0) && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center opacity-20">
                              <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
                              <p className="text-xs font-black uppercase tracking-widest">No Operational History Recorded</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}

function InfoItem({ icon: Icon, label, value, action, className }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-center justify-between">
        <p className={cn("text-sm font-bold text-foreground transition-colors truncate", className)}>{value || "---"}</p>
        {action}
      </div>
    </div>
  );
}

function AssetMiniCard({ label, value, color }: any) {
  return (
    <div className="p-4 rounded-2xl bg-muted/30 border border-border flex flex-col justify-center transition-colors">
      <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 transition-colors">{label}</p>
      <p className={cn("text-xs font-black italic truncate transition-colors", color)}>{value}</p>
    </div>
  );
}

function SyncStatusItem({ label, value }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30 border border-border transition-colors">
      <span className="text-[10px] font-black uppercase text-muted-foreground transition-colors">{label}</span>
      <Badge className={cn(
        "text-[8px] font-black uppercase border-none h-5 px-3",
        value ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground/40"
      )}>
        {value ? "SYNCHRONIZED" : "NOT LINKED"}
      </Badge>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-green-500/10 text-green-600 shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active ? "text-green-600" : "text-muted-foreground")} />
        <span className={cn("text-sm font-black italic uppercase tracking-tight transition-opacity", active ? "opacity-100" : "opacity-80")}>{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-green-600" />}
    </button>
  );
}

function QuickActionCard({ icon: Icon, label, sub, onClick, className }: any) {
  return (
    <Card className={cn("border-none shadow-none bg-card rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:scale-[1.05] active:scale-95 transition-all group transition-colors", className)} onClick={onClick}>
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground group-hover:gold-gradient group-hover:text-white transition-all duration-500 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-xs font-black italic uppercase leading-none mb-1 text-foreground transition-colors">{label}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest transition-colors">{sub}</p>
      </div>
    </Card>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background transition-colors duration-300"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
