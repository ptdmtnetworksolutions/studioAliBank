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
  ShoppingCart
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
  writeBatch
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { JsonRpcProvider, formatEther } from "ethers";
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

const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com"; 
const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";

const mockPerformanceData = [
  { name: 'Jan', revenue: 4000, volume: 2400 },
  { name: 'Feb', revenue: 3000, volume: 1398 },
  { name: 'Mar', revenue: 2000, volume: 9800 },
  { name: 'Apr', revenue: 2780, volume: 3908 },
  { name: 'May', revenue: 1890, volume: 4800 },
  { name: 'Jun', revenue: 2390, volume: 3800 },
  { name: 'Jul', revenue: 3490, volume: 4300 },
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
  const [disburseAmount, setDisburseAmount] = useState("");
  const [alixMintAmount, setAlixMintAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Data Listeners
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);
  const usersQuery = useMemo(() => (db ? query(collection(db, "users"), limit(100)) : null), [db]);
  const { data: allUsers } = useCollection(usersQuery);
  const auditQuery = useMemo(() => (db ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db]);
  const { data: auditLogs } = useCollection(auditQuery);
  const marketplaceQuery = useMemo(() => (db ? query(collection(db, "marketplace"), limit(50)) : null), [db]);
  const { data: inventoryItems } = useCollection(marketplaceQuery);

  const syncOnChainData = useCallback(async () => {
    if (syncingVault) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(ALIX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(balance));
    } catch (err) {} finally { setSyncingVault(false); }
  }, [syncingVault]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
    syncOnChainData();
  }, [user, userLoading, router, syncOnChainData]);

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
      await deleteDoc(doc(db, "system", "audit", "global_transactions", logId));
      toast({ title: "Log Dihapus", description: "Satu entri audit telah dibersihkan." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Menghapus" });
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!db || isPurging) return;
    if (!confirm("Peringatan: Seluruh riwayat transaksi sistem akan dihapus secara permanen. Lanjutkan?")) return;

    setIsPurging(true);
    try {
      const q = query(collection(db, "system", "audit", "global_transactions"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      toast({ title: "Audit Ledger Dibersihkan", description: "Semua log transaksi uji coba telah dihapus." });
    } catch (err) {
      toast({ variant: "destructive", title: "Gagal Membersihkan Audit" });
    } finally {
      setIsPurging(false);
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground flex font-body transition-colors duration-300">
        
        {/* SIDEBAR */}
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
              <p className="text-xs font-bold text-green-600/80 leading-relaxed mb-4">Upgrade to the enterprise plan for great discounts!</p>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-[9px] border-none">View Strategy</Button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors">
          
          {/* TOP BAR */}
          <header className="h-20 bg-card border-b border-border flex items-center justify-between px-10 sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <h1 className="text-2xl font-black tracking-tight capitalize text-foreground">{activeTab === 'dashboard' ? 'Overview' : activeTab}</h1>
              <div className="relative flex-1 hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search everything..." className="h-11 pl-12 bg-muted border-none rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary/20 shadow-none text-foreground transition-colors" />
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
                  <p className="text-sm font-black leading-none text-foreground">Super Admin</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Controller</p>
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
            
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* MAIN SMART WALLET REPLACEMENT */}
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
                          <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground">AliBank Global Liquidity</h3>
                          <div onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="bg-foreground text-background border-none p-4 rounded-2xl max-w-xs shadow-2xl">
                                <p className="text-[10px] font-bold leading-relaxed uppercase italic">Total Net Capital adalah seluruh akumulasi modal riil yang berhasil diamankan dari Gateway (PayPal/Kartu) dan Stake Capture dari kekalahan nasabah di seluruh game AliBank.</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-border font-black uppercase text-[10px] h-10 px-6 italic text-foreground transition-colors" 
                        onClick={(e) => { e.stopPropagation(); syncOnChainData(); }}
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5 mr-2", syncingVault && "animate-spin")} /> Sync System
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Net Capital (IDR)</p>
                        <Badge className="bg-green-500/10 text-green-600 border-none text-[10px] font-black px-2">+12.01%</Badge>
                      </div>
                      <h2 className="text-6xl font-black tracking-tighter italic text-foreground transition-colors">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Globe className="w-4 h-4" />
                          <span className="text-[10px] font-bold uppercase">Vault Reserve (USD)</span>
                        </div>
                        <p className="text-xl font-black italic text-foreground">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-[10px] font-bold uppercase">Gaming Profit (IDR)</span>
                        </div>
                        <p className="text-xl font-black italic text-green-600 transition-colors">Rp {((globalLiquidity?.tradeXGrossVolumeIdr || 0) + (globalLiquidity?.spinGrossVolumeIdr || 0)).toLocaleString()}</p>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Activity className="w-4 h-4 text-primary" />
                          <span className="text-[10px] font-bold uppercase">System Status</span>
                        </div>
                        <p className="text-xl font-black italic text-green-600 transition-colors">PRODUCTION LIVE</p>
                      </div>
                    </div>
                  </Card>

                  {/* ACTIVE CLIENTS SUMMARY */}
                  <Card 
                    className="lg:col-span-4 border-none shadow-none bg-card rounded-[2.5rem] p-10 flex flex-col cursor-pointer hover:shadow-xl hover:shadow-black/5 transition-all group"
                    onClick={() => setActiveTab('users')}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-base font-black italic uppercase tracking-tight text-foreground">Active Clients</h3>
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
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                        <span>Total Accounts</span>
                        <span className="text-foreground">{allUsers?.length || 0}</span>
                      </div>
                      <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1 bg-muted" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* PERFORMANCE CHART */}
                  <Card className="lg:col-span-8 border-none shadow-none bg-card rounded-[2.5rem] p-10 space-y-10 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black italic uppercase tracking-tight text-foreground">Revenue Dynamics</h3>
                      <div className="flex bg-muted p-1 rounded-xl">
                        <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg bg-background shadow-sm text-foreground transition-all">Monthly</button>
                        <button className="px-4 py-1.5 text-[10px] font-black uppercase rounded-lg text-muted-foreground hover:text-foreground transition-colors">Yearly</button>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={mockPerformanceData}>
                          <defs>
                            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                          <YAxis hide />
                          <RechartsTooltip contentStyle={{backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 30px rgba(0,0,0,0.05)'}} />
                          <Area type="monotone" dataKey="revenue" stroke="#16A34A" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  {/* TOKENOMICS SUMMARY CARD */}
                  <Card 
                    className="lg:col-span-4 border-none shadow-none bg-foreground dark:bg-card rounded-[2.5rem] p-10 flex flex-col justify-between text-background dark:text-foreground relative overflow-hidden group cursor-pointer hover:scale-[1.02] transition-all"
                    onClick={() => setActiveTab('tokenomics')}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000"><LogoIcon className="w-40 h-40 text-primary" /></div>
                    <div className="relative z-10 flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Sovereign Asset</p>
                        <h4 className="text-xl font-black italic uppercase">Alix Token (ALX)</h4>
                      </div>
                      <Image src="https://coin-images.coingecko.com/coins/images/6319/large/google.png?1696506698" alt="v" width={40} height={40} className="invert dark:invert-0 opacity-20" />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <p className="text-2xl font-mono tracking-[0.2em]">ALX V3 PROTOCOL</p>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Vault Inventory</p>
                          <p className="text-sm font-black italic">{(globalLiquidity?.alixVaultBalance || 0).toLocaleString()} ALX</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase opacity-40 mb-1">Anchor Price</p>
                          <p className="text-sm font-black italic">$ 12.24</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* QUICK ACTIONS SECTION */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                  <QuickActionCard icon={PlusCircle} label="Mint ALX" sub="Expand supply" onClick={() => setActiveTab('tokenomics')} />
                  <QuickActionCard icon={Pickaxe} label="Burn ALX" sub="Scarcity control" onClick={() => setActiveTab('tokenomics')} />
                  <QuickActionCard icon={Database} label="Sync Vault" sub="Mainnet data" onClick={syncOnChainData} />
                  <QuickActionCard icon={Eraser} label="Purge Audit" sub="Clean ledger" onClick={handlePurgeAuditLogs} />
                </section>

                {/* RECENT TRANSACTIONS TABLE */}
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground">Recent Transactions</h3>
                    <Button onClick={() => setActiveTab('audit')} variant="ghost" className="rounded-xl text-muted-foreground font-black uppercase text-[10px] h-10 italic">View Ledger <ArrowDownRight className="w-4 h-4 ml-2" /></Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                        <tr>
                          <th className="px-10 py-6">Reference ID</th>
                          <th className="px-10 py-6">Operation</th>
                          <th className="px-10 py-6">Settlement Value</th>
                          <th className="px-10 py-6 text-right">Synchronization</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs?.slice(0, 5).map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors cursor-default group">
                            <td className="px-10 py-6">
                              <p className="font-mono text-xs font-bold text-foreground">{log.id}</p>
                            </td>
                            <td className="px-10 py-6">
                              <Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase">{log.category}</Badge>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-sm font-black italic text-foreground">
                                {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}
                              </p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="text-[10px] font-bold text-muted-foreground italic">{log.timestamp?.toDate().toLocaleString() || '---'}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB USERS */}
            {activeTab === 'users' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-green-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">Verified Client Base</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Consolidated global account control</p>
                    </div>
                    <Badge className="bg-green-600 text-white font-black px-4 py-1.5 rounded-full shadow-lg shadow-green-500/20">
                      {allUsers?.length || 0} Accounts
                    </Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-10 py-8">Client Profile</th>
                          <th className="px-10 py-8">Institutional UID</th>
                          <th className="px-10 py-8 text-right">Liquidity Control</th>
                          <th className="px-10 py-8 text-right">Security</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
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
                                  <p className="text-sm font-black italic uppercase leading-none text-foreground">{u.name}</p>
                                  <p className="text-[10px] font-bold text-muted-foreground mt-1">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6 font-mono text-[11px] text-muted-foreground">{u.accountNumber}</td>
                            <td className="px-10 py-6 text-right">
                              <div className="flex flex-col items-end gap-2">
                                <p className="text-base font-black italic tracking-tighter text-foreground">Rp {u.totalBalance?.toLocaleString()}</p>
                                <div className="flex items-center gap-2">
                                  <Input type="number" placeholder="Amt" className="h-8 w-20 text-[10px] font-black bg-muted border-none shadow-none rounded-lg text-foreground transition-colors" value={adjustAmounts[u.uid] || ""} onChange={(e) => setAdjustAmounts(prev => ({ ...prev, [u.uid]: e.target.value }))} />
                                  <div className="flex gap-1">
                                    <button onClick={() => handleUpdateUserBalance(u.uid, 'add')} className="w-6 h-6 rounded bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"><Plus className="w-3 h-3" /></button>
                                    <button onClick={() => handleUpdateUserBalance(u.uid, 'sub')} className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"><Minus className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <Button variant="outline" size="sm" className="h-9 rounded-xl border-border text-primary font-black uppercase text-[9px] italic hover:bg-primary/10 transition-colors" onClick={() => sendPasswordResetEmail(auth!, u.email)}>
                                <Key className="w-3 h-3 mr-2" /> Reset
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB TOKENOMICS */}
            {activeTab === 'tokenomics' && (
              <div className="animate-in zoom-in-95 duration-700 grid grid-cols-1 lg:grid-cols-2 gap-10">
                <Card className="border-none shadow-none bg-card rounded-[3rem] p-12 space-y-10 transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-green-500/10 flex items-center justify-center text-green-600">
                      <Pickaxe className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase tracking-tight text-foreground">Sovereign Mint</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Authorized Supply Expansion</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-muted p-8 rounded-[2rem] space-y-2 transition-colors">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Global Anchor Reserve (USD)</p>
                      <p className="text-3xl font-black italic text-foreground">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Amount to Authorize (ALX)</label>
                      <Input type="number" placeholder="0.00" value={alixMintAmount} onChange={(e) => setAlixMintAmount(e.target.value)} className="h-16 rounded-2xl bg-muted border-none text-xl font-black italic px-8 shadow-none text-foreground transition-colors" />
                    </div>
                    <Button onClick={handleMintAlix} disabled={isMinting || !alixMintAmount} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
                      {isMinting ? <Loader2 className="animate-spin" /> : "Authorize Mint"}
                    </Button>
                  </div>
                </Card>

                <Card className="border-none shadow-none bg-foreground dark:bg-card rounded-[3rem] p-12 space-y-10 text-background dark:text-foreground transition-colors">
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
                      <p className="text-3xl font-black italic">{(globalLiquidity?.totalAlixBurned || 0).toLocaleString()} ALX</p>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase opacity-40 ml-2">Amount to Burn (ALX)</label>
                      <Input type="number" placeholder="0.00" className="h-16 rounded-2xl bg-background/10 border-none text-xl font-black italic px-8 text-foreground shadow-none transition-colors" />
                    </div>
                    <Button className="w-full h-16 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">Execute Burn</Button>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB VAULT */}
            {activeTab === 'vault' && (
              <div className="animate-in zoom-in-95 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[3rem] p-12 space-y-10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Database className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tight text-foreground">Mainnet Vault Reserve</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Multi-Asset Custody System</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">Node Active</Badge>
                  </div>
                  
                  <div className="p-8 rounded-[2rem] bg-muted flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
                    <div className="space-y-1 text-center md:text-left">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">On-Chain Ethereum Balance</p>
                      <p className="text-5xl font-black italic tracking-tighter text-blue-600 transition-colors">{parseFloat(onChainEth).toFixed(4)} <span className="text-2xl text-muted-foreground/40 italic">ETH</span></p>
                    </div>
                    <Button onClick={syncOnChainData} className="h-14 px-10 rounded-2xl gold-gradient text-white font-black uppercase italic tracking-widest shadow-lg border-none">Refresh Chain</Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    <div className="p-8 rounded-[2.5rem] border border-border space-y-4 transition-colors">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">External Disbursement</p>
                      <div className="space-y-4">
                        <Input type="number" placeholder="0.00 ETH" value={disburseAmount} onChange={(e) => setDisburseAmount(e.target.value)} className="h-14 bg-muted border-none font-black italic rounded-xl px-6 shadow-none text-foreground transition-colors" />
                        <Button className="w-full h-12 bg-foreground dark:bg-muted text-background dark:text-foreground hover:opacity-90 rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-xl transition-all border-none">Execute Withdrawal</Button>
                      </div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] border border-border space-y-4 flex flex-col justify-center bg-blue-500/5 transition-colors">
                      <div className="flex gap-4">
                        <HelpCircle className="w-6 h-6 text-blue-600 shrink-0" />
                        <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic">Every external settlement is verified by AliBank V3 Protocol to ensure 100% solvency.</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* TAB INVENTORY */}
            {activeTab === 'inventory' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-blue-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">Marketplace Inventory</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Managing Digital & Physical Goods</p>
                    </div>
                    <Button className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">
                      <PackagePlus className="w-4 h-4 mr-2" /> Add Item
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
                    {inventoryItems?.map((item) => (
                      <Card key={item.id} className="bg-muted/30 border border-border rounded-2xl p-6 space-y-4 relative group overflow-hidden transition-all hover:shadow-xl">
                        <div className="w-full h-32 rounded-xl bg-muted border border-border flex items-center justify-center mb-4 relative overflow-hidden">
                          <Image src={item.image || `https://picsum.photos/seed/${item.id}/200/200`} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <Badge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase px-2 mb-2">{item.category}</Badge>
                          <h4 className="text-sm font-black italic uppercase text-foreground">{item.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs font-black text-foreground">Rp {item.priceIdr?.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">Stock: {item.stock || 0}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button variant="outline" size="sm" className="flex-1 rounded-lg border-border font-black uppercase text-[9px] h-8">Edit</Button>
                          <Button variant="ghost" size="sm" className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-500/10 p-0"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </Card>
                    ))}
                    {(!inventoryItems || inventoryItems.length === 0) && (
                      <div className="col-span-full py-20 text-center opacity-20">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No Inventory Items Found</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* TAB AUDIT */}
            {activeTab === 'audit' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                <Card className="border-none shadow-none bg-card rounded-[2.5rem] overflow-hidden transition-colors">
                  <div className="p-10 border-b border-border bg-amber-500/5 flex items-center justify-between transition-colors">
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tight text-foreground">System Audit Ledger</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Irreversible Transaction History</p>
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handlePurgeAuditLogs} disabled={isPurging} variant="outline" className="rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[10px] h-10 px-6 italic hover:bg-rose-50 transition-colors">
                        {isPurging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Eraser className="w-4 h-4 mr-2" />} Purge All Logs
                      </Button>
                      <Button onClick={() => syncOnChainData()} className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">
                        <RefreshCw className={cn("w-4 h-4 mr-2", syncingVault && "animate-spin")} /> Refresh Ledger
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-10 py-8">Timestamp</th>
                          <th className="px-10 py-8">Operation Type</th>
                          <th className="px-10 py-8">Entity</th>
                          <th className="px-10 py-8 text-right">Settlement Value</th>
                          <th className="px-10 py-8 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs?.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                            <td className="px-10 py-6">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-[10px] font-bold text-muted-foreground italic">
                                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : '---'}
                                </span>
                              </div>
                            </td>
                            <td className="px-10 py-6">
                              <Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase">{log.category}</Badge>
                            </td>
                            <td className="px-10 py-6">
                              <p className="text-[10px] font-black italic text-foreground uppercase">{log.gateway || log.description || 'System Node'}</p>
                              <p className="text-[8px] font-mono text-muted-foreground mt-1">{log.id}</p>
                            </td>
                            <td className="px-10 py-6 text-right">
                              <p className="text-sm font-black italic text-foreground">
                                {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : log.cryptoAmount ? `${log.cryptoAmount} ${log.cryptoCurrency}` : '---'}
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
                              <p className="text-xs font-black uppercase tracking-widest">No Audit Logs Recorded</p>
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

function QuickActionCard({ icon: Icon, label, sub, onClick }: any) {
  return (
    <Card className="border-none shadow-none bg-card rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:scale-[1.05] active:scale-95 transition-all group" onClick={onClick}>
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-foreground group-hover:gold-gradient group-hover:text-white transition-all duration-500 shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-xs font-black italic uppercase leading-none mb-1 text-foreground transition-colors">{label}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{sub}</p>
      </div>
    </Card>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
