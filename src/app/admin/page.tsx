
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
  Scan,
  Copy,
  ArrowUpFromLine,
  ArrowDownToLine,
  History as HistoryIcon,
  CandlestickChart,
  Edit2,
  Save,
  AlertCircle,
  Gamepad2,
  Trophy,
  RotateCw,
  Smartphone
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ComposedChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

// KONSTANTA GLOBAL ADMIN - ALIBANK VAULT V3
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com"; 
const ALX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const ETHERSCAN_API_KEY = "M1S7MDTBQSG1A3URQKYNVF31PSPE48UA8R";
const ALX_PRICE_IDR = 194004;

// Simulasi Data Candle untuk Revenue Dynamics
const generateMockCandles = () => {
  return Array.from({ length: 24 }, (_, i) => {
    const open = 3000 + Math.random() * 2000;
    const close = open + (Math.random() * 1000 - 500);
    return {
      time: `${i}:00`,
      open,
      close,
      high: Math.max(open, close) + Math.random() * 200,
      low: Math.min(open, close) - Math.random() * 200,
      isUp: close >= open
    };
  });
};

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
  const [adminWalletEth, setAdminWalletEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [candleData, setCandleData] = useState(generateMockCandles());
  
  // States for User Management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [alxAdjustment, setAlxAdjustment] = useState("");

  // Detailed User States
  const [selectedUserWallets, setSelectedUserWallets] = useState<any[]>([]);
  const [selectedUserDeposits, setSelectedUserDeposits] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  const [vaultRecipient, setVaultRecipient] = useState("");
  const [vaultAmount, setVaultAmount] = useState("");
  const [isExecutingVaultTx, setIsExecutingVaultTx] = useState(false);
  const [onChainHistory, setOnChainHistory] = useState<any[]>([]);

  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);
  
  const usersQuery = useMemo(() => (db ? query(collection(db, "users"), limit(100)) : null), [db]);
  const { data: allUsers } = useCollection(usersQuery);
  
  const auditQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db]);
  const { data: auditLogs } = useCollection(auditQuery);

  const userProfileRef = useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userProfileRef);

  // Fetch detailed user data for dialog
  useEffect(() => {
    async function fetchSubData() {
      if (!selectedUser || !db || !isUserDialogOpen) return;
      setLoadingSubData(true);
      try {
        const walletsSnap = await getDocs(collection(db, "users", selectedUser.id, "wallets"));
        setSelectedUserWallets(walletsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const depositsSnap = await getDocs(collection(db, "users", selectedUser.id, "deposits"));
        setSelectedUserDeposits(depositsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const txsSnap = await getDocs(query(collection(db, "users", selectedUser.id, "transactions"), orderBy("timestamp", "desc"), limit(50)));
        setSelectedUserTransactions(txsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching user detail data:", err);
      } finally {
        setLoadingSubData(false);
      }
    }
    fetchSubData();
  }, [selectedUser, isUserDialogOpen, db]);

  const syncOnChainData = useCallback(async (manual = false) => {
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const vaultBalance = await provider.getBalance(ALX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(vaultBalance));

      if (userData?.walletAddress) {
        const adminBal = await provider.getBalance(userData.walletAddress).catch(() => 0n);
        setAdminWalletEth(formatEther(adminBal));
      }

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
              method: tx.functionName ? tx.functionName.split('(')[0] : (tx.input && tx.input !== '0x' ? 'Contract' : (tx.hash ? 'Transfer' : 'Internal'))
            };
          });
          setOnChainHistory(realHistory);
        }
      } catch (apiErr) {
        console.warn("Etherscan API failed", apiErr);
      }
      
      setCandleData(generateMockCandles());

      if (manual) {
        toast({ title: "Vault Synced", description: "Node Mainnet telah diperbarui." });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally { 
      setSyncingVault(false); 
    }
  }, [toast, userData?.walletAddress]);

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

  const handleUpdateUserBalance = async (type: 'idr' | 'alx', amount: string, operation: 'add' | 'sub') => {
    if (!db || !selectedUser || !amount) return;
    const num = parseFloat(amount);
    if (isNaN(num)) return;

    setIsUpdatingUser(true);
    try {
      const userRef = doc(db, "users", selectedUser.id);
      const val = operation === 'add' ? num : -num;
      
      const updateData: any = {};
      if (type === 'idr') updateData.totalBalance = increment(val);
      else updateData["cryptoBalances.ALX"] = increment(val);

      await updateDoc(userRef, updateData);
      
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `MANUAL-ADJ-${Date.now()}`,
        category: "Manual Adjustment",
        gateway: "Super Admin",
        amountIdr: type === 'idr' ? val : 0,
        description: `Manual ${operation} ${num} ${type.toUpperCase()} for ${selectedUser.name}`,
        timestamp: serverTimestamp(),
        status: "success"
      });

      toast({ title: "Update Berhasil", description: `Saldo ${type.toUpperCase()} telah disesuaikan.` });
      setBalanceAdjustment("");
      setAlxAdjustment("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Gagal", description: err.message });
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth || !selectedUser?.email) return;
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);
      toast({ title: "Email Terkirim", description: `Tautan riset sandi telah dikirim ke ${selectedUser.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Kirim", description: err.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db) return;
    if (!confirm("Hapus data nasabah secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast({ title: "User Deleted", description: "Data nasabah telah dihapus dari sistem." });
    } catch (err) {}
  };

  const handleExecuteVaultWithdrawal = async () => {
    if (!vaultRecipient || !vaultAmount || isExecutingVaultTx || !userData?.privateKey) {
      toast({ variant: "destructive", title: "Otoritas Ditolak", description: "Kunci Privat & Saldo Gas diperlukan." });
      return;
    }
    
    setIsExecutingVaultTx(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const wallet = new ethers.Wallet(userData.privateKey, provider);
      const tx = await wallet.sendTransaction({
        to: vaultRecipient,
        value: ethers.parseEther(vaultAmount)
      });
      await tx.wait();
      
      if (db) {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `VAULT-WDR-${Date.now()}`,
          category: "External Disbursement",
          gateway: "Ali-Mainnet Node",
          amountIdr: parseFloat(vaultAmount) * 33000000, 
          recipient: vaultRecipient,
          status: "success",
          txHash: tx.hash,
          timestamp: serverTimestamp(),
          description: `Withdrawal to ${vaultRecipient}`
        });
      }
      toast({ title: "Pencairan Berhasil" });
      setVaultRecipient(""); setVaultAmount("");
      syncOnChainData(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Eksekusi", description: err.message });
    } finally {
      setIsExecutingVaultTx(false);
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!db || isPurging) return;
    if (!confirm("Hapus seluruh riwayat operasi? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsPurging(true);
    try {
      const q = query(collection(db, "system", "audit", "global_transactions"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "Sistem Dibersihkan", description: "Semua log audit telah dihapus." });
    } catch (err) {} finally { setIsPurging(false); }
  };

  const [isPurging, setIsPurging] = useState(false);

  // Statistics Calculation
  const totalGamingEarnings = useMemo(() => {
    return selectedUserTransactions
      .filter(tx => tx.category === "Game" || tx.category === "Trade-X")
      .reduce((acc, tx) => acc + (tx.rewardAlx || 0), 0);
  }, [selectedUserTransactions]);

  const totalDepositsValue = useMemo(() => {
    return selectedUserDeposits.reduce((acc, dep) => acc + (dep.amount || 0), 0);
  }, [selectedUserDeposits]);

  const displayVal = (val: number) => Math.max(0, val || 0);

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground flex font-body transition-colors duration-300">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-72 bg-card border-r border-border flex flex-col sticky top-0 h-screen z-50">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg">
              <LogoIcon className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter italic uppercase">AliBank</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 pt-4">
            <SidebarItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Clients" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={Wallet} label="Vault Control" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
            <SidebarItem icon={Coins} label="Tokenomics" active={activeTab === 'tokenomics'} onClick={() => setActiveTab('tokenomics')} />
            <SidebarItem icon={Box} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={FileText} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          </nav>

          <div className="p-6 mt-auto space-y-6">
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Interface Theme</span>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />
              <SidebarItem icon={LogOut} label="Logout" className="text-rose-500 mt-2" onClick={() => auth?.signOut()} />
            </div>

            <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-5 space-y-4">
              <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Kickoff Plan!</h4>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">Upgrade to enterprise plan for real-time Web3 analytics!</p>
              <Button onClick={() => router.push('/admin/about-alix')} className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase h-9 rounded-xl border-none shadow-lg">View Strategy</Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors">
          <header className="h-20 bg-card border-b border-border flex items-center justify-between px-10 sticky top-0 z-40">
            <div className="relative w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search global data..." className="h-11 pl-12 bg-muted border-none rounded-xl text-xs font-bold" />
            </div>
            <div className="flex gap-4">
               <button onClick={() => syncOnChainData(true)} className="p-2 hover:bg-muted rounded-full transition-colors">
                  <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
               </button>
               <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black leading-none">Super Admin</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Web3 Node</p>
                </div>
                <div className="w-10 h-10 rounded-full gold-gradient p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                    <Image src="https://picsum.photos/seed/admin/100/100" alt="avatar" width={40} height={40} className="object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-10 space-y-10 overflow-y-auto no-scrollbar pb-20">
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                          <Database className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black italic uppercase tracking-tight">AliBank Global Liquidity</h3>
                      </div>
                      <Badge className="bg-green-100 text-green-600 font-black text-[8px] px-3 h-6 rounded uppercase">LIVE SINKRON</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground uppercase">Total Net Capital (IDR)</p>
                      <h2 className="text-6xl font-black tracking-tighter italic">Rp {displayVal(globalLiquidity?.totalFiatInjected).toLocaleString('id-ID')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Vault Reserve (USD)</span>
                        <p className="text-xl font-black italic">$ {displayVal(globalLiquidity?.totalUsdInjected).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Internal AUM</span>
                        <p className="text-xl font-black italic text-green-600">Rp {displayVal(globalLiquidity?.totalInternalAumIdr).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Node Status</span>
                        <p className="text-xl font-black italic text-blue-600 uppercase">Production</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-card rounded-[2.5rem] p-10 flex flex-col shadow-sm">
                    <h3 className="text-base font-black italic uppercase mb-8">Verified Clients</h3>
                    <div className="flex -space-x-3 mb-10">
                      {allUsers?.slice(0, 5).map((u, i) => (
                        <div key={i} className="h-12 w-12 rounded-full ring-4 ring-card overflow-hidden border border-border">
                          <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="u" width={48} height={48} className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                        <span>Active Accounts</span>
                        <span>{allUsers?.length || 0}</span>
                      </div>
                      <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-8 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2">
                        <CandlestickChart className="w-4 h-4 text-primary" /> Revenue Dynamics Pro
                      </h3>
                      <div className="flex bg-muted p-1 rounded-lg">
                        <button className="px-4 py-1.5 bg-background text-[9px] font-black uppercase rounded shadow-sm">Monthly</button>
                        <button className="px-4 py-1.5 text-[9px] font-black uppercase text-muted-foreground">Yearly</button>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={candleData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <RechartsTooltip 
                            contentStyle={{ background: '#1A1D1F', border: 'none', borderRadius: '12px' }} 
                            itemStyle={{ color: '#FCD535', fontSize: '10px' }}
                          />
                          <Bar dataKey="close" barSize={8}>
                            {candleData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.isUp ? "#10b981" : "#ef4444"} />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-[#1A1D1F] dark:bg-card rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Sovereign Asset</p>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
                      <p className="text-[9px] font-bold text-white/30 uppercase mt-2 tracking-widest">ALX V3 PROTOCOL</p>
                    </div>
                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Vault Inventory</p>
                        <p className="text-xl font-black italic">{displayVal(globalLiquidity?.alixVaultBalance).toLocaleString('id-ID')} ALX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Anchor Price</p>
                        <p className="text-xl font-black italic text-primary">$ 12.24</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-4 gap-6">
                  <QuickOpButton icon={Skull} label="Reset All Clients" sub="Production Wipe" color="text-rose-500" onClick={() => setActiveTab('users')} />
                  <QuickOpButton icon={PlusCircle} label="Mint ALX" sub="Authorized Supply" color="text-green-500" onClick={() => setActiveTab('tokenomics')} />
                  <QuickOpButton icon={Pickaxe} label="Burn ALX" sub="Deflation Protocol" color="text-orange-500" onClick={() => setActiveTab('tokenomics')} />
                  <QuickOpButton icon={RefreshCw} label="Sync Vault" sub="Etherscan Hook" color="text-blue-500" onClick={() => syncOnChainData(true)} />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black italic uppercase tracking-widest">Recent Activity Ledger</h3>
                    <button onClick={() => setActiveTab('audit')} className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">View All Logs <ArrowUpRight className="w-3 h-3" /></button>
                  </div>
                  <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-8 py-5">Operation ID</th>
                          <th className="px-8 py-5">Context</th>
                          <th className="px-8 py-5">Value</th>
                          <th className="px-8 py-5 text-right">Synchronization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs?.slice(0, 5).map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-8 py-4 text-[10px] font-mono font-bold text-accent">{log.id.slice(0, 15)}...</td>
                            <td className="px-8 py-4"><Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">{log.category}</Badge></td>
                            <td className="px-8 py-4 text-[10px] font-black italic">{log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : '---'}</td>
                            <td className="px-8 py-4 text-right text-[9px] font-bold text-muted-foreground italic">{log.timestamp?.toDate?.().toLocaleString() || '---'}</td>
                          </tr>
                        ))}
                        {(!auditLogs || auditLogs.length === 0) && (
                          <tr>
                            <td colSpan={4} className="px-8 py-10 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">No activity recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight">Client Directory</h3>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">
                    {allUsers?.length || 0} Registered Users
                  </Badge>
                </div>

                <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-8 py-6">Client / Identity</th>
                          <th className="px-8 py-6">UID / Account</th>
                          <th className="px-8 py-6">Liquid Balance</th>
                          <th className="px-8 py-6">ALX Holdings</th>
                          <th className="px-8 py-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allUsers?.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                  <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="avatar" width={40} height={40} className="object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-black italic uppercase">{u.name}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-accent">{u.accountNumber}</span>
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Tier: {u.tier || 'Regular'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm font-black italic text-green-600">Rp {(u.totalBalance || 0).toLocaleString('id-ID')}</p>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center p-1">
                                  <LogoIcon className="text-white" />
                                </div>
                                <span className="text-sm font-black italic">{(u.cryptoBalances?.ALX || 0).toFixed(4)} ALX</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  onClick={() => { setSelectedUser(u); setIsUserDialogOpen(true); }}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-rose-100 hover:text-rose-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!allUsers || allUsers.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">
                              No clients detected in node
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="animate-in zoom-in-95 duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] p-12 flex flex-col justify-between relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><Database className="w-8 h-8" /></div>
                        <div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tight">Mainnet Vault Reserve</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Contract Address: {ALX_CONTRACT.slice(0,6)}...{ALX_CONTRACT.slice(-4)}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase italic animate-pulse">Production Node Active</Badge>
                    </div>
                    <div className="bg-muted p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border border-border shadow-inner">
                      <div className="space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2">
                          <Globe className="w-3 h-3" /> On-Chain Ethereum Balance
                        </p>
                        <p className="text-6xl font-black italic tracking-tighter text-blue-600">
                          {parseFloat(onChainEth).toFixed(6)} <span className="text-3xl text-muted-foreground/40 italic">ETH</span>
                        </p>
                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase italic">≈ Rp {(parseFloat(onChainEth) * 33000000).toLocaleString('id-ID')} Total Vault Assets</p>
                      </div>
                      <Button onClick={() => syncOnChainData(true)} disabled={syncingVault} className="h-16 px-12 rounded-2xl gold-gradient text-white font-black uppercase italic tracking-widest shadow-xl border-none">
                        {syncingVault ? <Loader2 className="animate-spin" /> : "REFRESH CHAIN"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-[#1A1D1F] dark:bg-card rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 text-white text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 gold-gradient opacity-5" />
                    <div className="bg-white p-4 rounded-3xl shadow-2xl relative z-10 group cursor-pointer hover:scale-105 transition-transform duration-500 overflow-hidden">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ALX_CONTRACT}`} alt="Vault QR" className="w-32 h-32 rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Scan className="w-8 h-8 text-white" /></div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Public Vault Address</p>
                        <p className="text-[11px] font-mono font-bold break-all bg-white/5 p-3 rounded-xl border border-white/10">{ALX_CONTRACT}</p>
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(ALX_CONTRACT); toast({ title: "Copied" }); }} className="w-full h-12 bg-white/10 text-white rounded-xl font-black italic text-[10px]">COPY ADDRESS</Button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner"><ArrowUpFromLine className="w-6 h-6" /></div>
                        <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tight">External Disbursement</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase italic">Real-Time Web3 Settlement</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Gas Wallet Bal.</p>
                        <p className="text-xs font-black italic text-green-600">{parseFloat(adminWalletEth).toFixed(6)} ETH</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recipient Address</label>
                        <input placeholder="0x..." value={vaultRecipient} onChange={(e) => setVaultRecipient(e.target.value)} className="h-14 bg-muted border-none font-bold text-xs rounded-xl px-6 w-full outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Value (ETH)</label>
                        <input type="number" placeholder="0.00" value={vaultAmount} onChange={(e) => setVaultAmount(e.target.value)} className="h-14 bg-muted border-none font-black italic rounded-xl px-6 w-full outline-none" />
                      </div>
                      {parseFloat(adminWalletEth) === 0 && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase italic flex gap-3">
                          <Skull className="w-4 h-4 shrink-0" />
                          <span>Insufficient Gas: Top-up alamat {userData?.walletAddress} untuk mengeksekusi transaksi.</span>
                        </div>
                      )}
                      <Button onClick={handleExecuteVaultWithdrawal} disabled={isExecutingVaultTx || !vaultRecipient || !vaultAmount || parseFloat(adminWalletEth) === 0} className="w-full h-16 bg-[#1A1D1F] dark:bg-muted text-background dark:text-foreground rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
                        {isExecutingVaultTx ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-10 border-b border-border flex items-center justify-between bg-blue-500/5">
                      <h4 className="text-lg font-black italic uppercase tracking-tight">Node Transaction Records</h4>
                      <Badge className="bg-blue-100 text-blue-600 font-black text-[8px] uppercase px-3 h-6">LIVE ETHERSCAN</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                          <tr>
                            <th className="px-10 py-6">Tx Hash</th>
                            <th className="px-10 py-6">Method</th>
                            <th className="px-10 py-6">Value</th>
                            <th className="px-10 py-6 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {onChainHistory.map((tx, i) => (
                            <tr key={i} className="hover:bg-muted/30 group">
                              <td className="px-10 py-5">
                                <a href={`https://etherscan.io/tx/${tx.fullHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold text-blue-600 hover:underline">{tx.hash}</a>
                              </td>
                              <td className="px-10 py-5">
                                <Badge className={cn("border-none text-[8px] font-black px-2 h-5 uppercase", tx.type === 'IN' ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600")}>{tx.method}</Badge>
                              </td>
                              <td className="px-10 py-5 text-xs font-black italic">{tx.value}</td>
                              <td className="px-10 py-5 text-right text-[10px] font-bold text-muted-foreground italic">{tx.time}</td>
                            </tr>
                          ))}
                          {onChainHistory.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">No blockchain data found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-in slide-in-from-right-10 duration-700">
                <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-10 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">System Audit Ledger</h3>
                    <div className="flex gap-3">
                      <Button onClick={handlePurgeAuditLogs} disabled={isPurging} variant="outline" className="rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[10px] h-10 px-6 italic">Purge Ledger</Button>
                      <Button onClick={() => syncOnChainData(true)} className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">Refresh Ledger</Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-10 py-8">Timestamp</th>
                          <th className="px-10 py-8">Category</th>
                          <th className="px-10 py-8">Context</th>
                          <th className="px-10 py-8 text-right">Value</th>
                          <th className="px-10 py-8 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs?.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30">
                            <td className="px-10 py-6 text-[10px] font-bold text-muted-foreground italic">{log.timestamp?.toDate?.().toLocaleString() || '---'}</td>
                            <td className="px-10 py-6"><Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase">{log.category}</Badge></td>
                            <td className="px-10 py-6 text-[10px] font-black italic uppercase">{log.gateway || log.description || 'System Node'}</td>
                            <td className="px-10 py-6 text-right text-sm font-black italic">Rp {log.amountIdr?.toLocaleString() || '0'}</td>
                            <td className="px-10 py-6 text-center"><button onClick={async () => { if(db) await deleteDoc(doc(db, "system", "audit", "global_transactions", log.id)); }} className="p-2 text-muted-foreground hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {(activeTab === 'tokenomics' || activeTab === 'inventory') && (
              <div className="flex flex-col items-center justify-center py-40 opacity-20">
                <Database className="w-20 h-20 mb-4" />
                <h3 className="text-xl font-black uppercase italic italic tracking-widest">Protocol Staging</h3>
                <p className="text-xs font-bold uppercase mt-2">Section reserved for V3.5 Deployment</p>
              </div>
            )}
          </div>
        </main>

        {/* User Management Dialog - PROFESSIONAL CONSOLE */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-4xl rounded-[3rem] p-0 bg-card border-border shadow-2xl overflow-hidden">
            <div className="gold-gradient h-32 w-full relative">
              <div className="absolute -bottom-12 left-10 w-24 h-24 rounded-[2rem] bg-background border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                <Image src={`https://picsum.photos/seed/${selectedUser?.uid}/200/200`} alt="client" width={100} height={100} className="object-cover" />
              </div>
              <button onClick={() => setIsUserDialogOpen(false)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="pt-16 px-10 pb-10 space-y-8">
              <header className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser?.name}</h2>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2">UID: {selectedUser?.accountNumber}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedUser?.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResetPassword} variant="outline" className="h-10 rounded-xl border-primary/20 text-primary font-black uppercase italic text-[10px] px-6">Riset Sandi</Button>
                  <Button onClick={() => handleDeleteUser(selectedUser?.id)} variant="outline" className="h-10 rounded-xl border-rose-200 text-rose-600 font-black uppercase italic text-[10px] px-6">Freeze Account</Button>
                </div>
              </header>

              <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full justify-start gap-2 border border-border">
                  <TabsTrigger value="profile" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Profile</TabsTrigger>
                  <TabsTrigger value="financials" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Financials</TabsTrigger>
                  <TabsTrigger value="wallets" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Wallets</TabsTrigger>
                  <TabsTrigger value="earnings" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Earnings</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <ProfileField icon={UserIcon} label="Full Name" value={selectedUser?.name} />
                    <ProfileField icon={Mail} label="Email Address" value={selectedUser?.email} />
                    <ProfileField icon={Phone} label="Phone Number" value={selectedUser?.phone || "Not Set"} />
                    <ProfileField icon={ShieldCheck} label="Account Tier" value={selectedUser?.tier || "Regular"} />
                    <div className="col-span-2">
                      <ProfileField icon={Key} label="Web3 Native Address" value={selectedUser?.walletAddress} isMono />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">IDR Liquidity Pool</label>
                      <div className="p-6 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-between">
                        <p className="text-3xl font-black italic text-foreground">Rp {selectedUser?.totalBalance?.toLocaleString() || '0'}</p>
                        <div className="flex gap-2">
                          <Input placeholder="Amount" type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} className="w-24 h-10 bg-background border-none text-xs font-black italic" />
                          <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'add')} className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'sub')} className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">ALX Asset Holdings</label>
                      <div className="p-6 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-between">
                        <p className="text-3xl font-black italic text-primary">{selectedUser?.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX</p>
                        <div className="flex gap-2">
                          <Input placeholder="ALX" type="number" value={alxAdjustment} onChange={(e) => setAlxAdjustment(e.target.value)} className="w-24 h-10 bg-background border-none text-xs font-black italic" />
                          <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'add')} className="w-8 h-8 rounded-lg gold-gradient text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'sub')} className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><PiggyBank className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Wealth Deposits</p>
                        <p className="text-xl font-black italic">Rp {totalDepositsValue.toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-white font-black italic">{selectedUserDeposits.length} ACTIVE DEPOSITS</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="wallets" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUserWallets.length > 0 ? selectedUserWallets.map((w, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
                          <div>
                            <p className="text-xs font-black uppercase italic">{w.name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Linked Account</p>
                          </div>
                        </div>
                        <p className="text-sm font-black italic text-green-600">Rp {w.balance?.toLocaleString()}</p>
                      </div>
                    )) : (
                      <div className="col-span-2 py-10 text-center opacity-20">
                        <Wallet className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase">No External Wallets Linked</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="earnings" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="grid grid-cols-3 gap-6">
                    <Card className="p-6 rounded-[2rem] bg-orange-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto shadow-inner"><RotateCw className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Ali-Spin Profit</p>
                        <p className="text-2xl font-black italic text-orange-500">{totalGamingEarnings.toFixed(4)} ALX</p>
                      </div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] bg-blue-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto shadow-inner"><Zap className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Trade-X Yield</p>
                        <p className="text-2xl font-black italic text-blue-500">Live Monitoring</p>
                      </div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] bg-green-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 mx-auto shadow-inner"><Trophy className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Grand Total Rewards</p>
                        <p className="text-2xl font-black italic text-green-600">{(totalGamingEarnings * ALX_PRICE_IDR).toLocaleString()} IDR</p>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recent Settlement History</h4>
                    <div className="rounded-[2rem] bg-muted/30 border border-border overflow-hidden">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-border">
                          {selectedUserTransactions.slice(0, 5).map((tx, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground">{tx.date?.split('T')[0]}</td>
                              <td className="px-6 py-4 text-[10px] font-black italic uppercase">{tx.description}</td>
                              <td className="px-6 py-4 text-right text-[10px] font-black italic text-green-600">+{tx.rewardAlx?.toFixed(6) || 0} ALX</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="bg-muted/30 p-8 border-t border-border">
              <div className="flex items-center gap-4 text-muted-foreground grayscale opacity-40">
                <Smartphone className="w-4 h-4" /><Globe className="w-4 h-4" /><ShieldCheck className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Encrypted Admin Terminal V3</span>
              </div>
              <Button onClick={() => setIsUserDialogOpen(false)} variant="ghost" className="h-12 px-10 rounded-xl font-black uppercase italic text-xs ml-auto">Close Console</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm font-black italic uppercase tracking-tight", active ? "opacity-100" : "opacity-80")}>{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}

function QuickOpButton({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-card border border-border/50 hover:bg-muted/50 transition-all group shadow-sm active:scale-95 text-left w-full">
      <div className={cn("w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-inner", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-black uppercase italic leading-none">{label}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{sub}</p>
      </div>
    </button>
  );
}

function ProfileField({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
        <p className={cn("text-xs font-bold truncate italic uppercase", isMono && "font-mono text-[10px]")}>{value || "---"}</p>
      </div>
    </div>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
