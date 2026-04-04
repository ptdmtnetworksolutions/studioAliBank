/**
 * CRITICAL: AliBank Admin Control V3.5 - TOKENOMICS & INVENTORY TERMINAL
 * Pusat Kendali Suplai, Kebijakan Moneter ALX, dan Manajemen Katalog Marketplace.
 * Otorisasi Eksklusif: alidzulfikar075@gmail.com / IJOuQpjEOMgvlYfzvQ1yfp976Oa2
 */

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
  Smartphone,
  PieChart as PieIcon,
  Timer,
  Info,
  ShoppingBag,
  Layers,
  Eye,
  EyeOff
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
import { useUser, useDoc, useCollection, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
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
import { JsonRpcProvider, formatEther, ethers, BrowserProvider } from "ethers";
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
  Cell,
  PieChart,
  Pie
} from "recharts";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { executeVaultWithdrawalAction } from "@/app/actions/vault-actions";
import { useAlixCoin } from '@/hooks/useAlixCoin';

const ALX_CONTRACT = process.env.NEXT_PUBLIC_ALX_ADDRESS || "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"; 
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const ALX_PRICE_IDR = 194004;

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  // Blockchain Data Hook (Polygon)
  const {
    totalSupply,
    maxSupply,
    remainingMintable,
    circulationRate,
    isPaused,
    isLoading: isLoadingAlix,
    mintALX,
    burnALX,
    togglePause,
  } = useAlixCoin();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  
  // States for User Management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [alxAdjustment, setAlxAdjustment] = useState("");

  // States for Tokenomics
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // States for Inventory
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPriceIdr, setProductPriceIdr] = useState("");
  const [productPriceUsd, setProductPriceUsd] = useState("");
  const [productCategory, setProductCategory] = useState("Kartu Hadiah");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // Detailed User Data
  const [selectedUserWallets, setSelectedUserWallets] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  
  // API Key States
  const [keys, setKeys] = useState({
    paypalClientId: "",
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: ALX_CONTRACT
  });

  const [vaultRecipient, setVaultRecipient] = useState("");
  const [vaultAmount, setVaultAmount] = useState("");
  const [isExecutingVaultTx, setIsExecutingVaultTx] = useState(false);
  const [onChainHistory, setOnChainHistory] = useState<any[]>([]);

  // Firestore Queries
  const liquidityRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "liquidity") : null), [db, isAuthorized]);
  const { data: globalLiquidity } = useDoc(liquidityRef);
  
  const usersQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "users"), limit(100)) : null), [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);
  
  const auditQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db, isAuthorized]);
  const { data: auditLogs } = useCollection(auditQuery);

  const marketplaceQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "marketplace"), orderBy("createdAt", "desc")) : null), [db, isAuthorized]);
  const { data: marketplaceProducts } = useCollection(marketplaceQuery);

  const apiKeysRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "api_keys") : null), [db, isAuthorized]);
  const { data: storedKeys } = useDoc(apiKeysRef);

  useEffect(() => {
    if (storedKeys) {
      setKeys({
        paypalClientId: storedKeys.paypalClientId || "",
        etherscanApiKey: storedKeys.etherscanApiKey || "",
        ethereumRpcUrl: storedKeys.ethereumRpcUrl || "",
        geminiApiKey: storedKeys.geminiApiKey || "",
        alxContractAddress: storedKeys.alxContractAddress || ALX_CONTRACT
      });
    }
  }, [storedKeys]);

  const candleData = useMemo(() => {
    if (!auditLogs) return Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, close: 0, isUp: true }));
    const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, close: 0, isUp: true }));
    auditLogs.forEach(log => {
      if (log.timestamp && log.amountIdr) {
        const hour = log.timestamp.toDate().getHours();
        hours[hour].close += log.amountIdr;
      }
    });
    for (let i = 1; i < hours.length; i++) hours[i].isUp = hours[i].close >= hours[i-1].close;
    return hours;
  }, [auditLogs]);

  const syncOnChainData = useCallback(async (manual = false) => {
    if (!isAuthorized) return;
    setSyncingVault(true);
    try {
      const rpc = keys.ethereumRpcUrl || "https://ethereum-rpc.publicnode.com";
      const provider = new JsonRpcProvider(rpc);
      const vaultBalance = await provider.getBalance(ALX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(vaultBalance));
      if (manual) toast({ title: "Vault Synced", description: "Node Mainnet diperbarui." });
    } catch (err) {
      console.error(err);
    } finally { setSyncingVault(false); }
  }, [isAuthorized, keys.ethereumRpcUrl, toast]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
    syncOnChainData();
  }, [user, userLoading, router, syncOnChainData]);

  const handleOnChainMint = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({ variant: "destructive", title: "MetaMask Required" });
      return;
    }
    if (isProcessingToken || !mintAmount) return;
    setIsProcessingToken(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const txHash = await mintALX(await signer.getAddress(), mintAmount, signer);
      await addDoc(collection(db!, "system", "audit", "global_transactions"), {
        id: `MINT-${Date.now()}`,
        category: "Tokenomics",
        gateway: "Polygon",
        description: `Minted ${mintAmount} ALX`,
        timestamp: serverTimestamp(),
        status: "success",
        txHash
      });
      toast({ title: "Mint Success" });
      setMintAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Mint Failed", description: err.message });
    } finally { setIsProcessingToken(false); }
  };

  const handleOnChainBurn = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    if (isProcessingToken || !burnAmount) return;
    setIsProcessingToken(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const txHash = await burnALX(burnAmount, signer);
      await addDoc(collection(db!, "system", "audit", "global_transactions"), {
        id: `BURN-${Date.now()}`,
        category: "Tokenomics",
        gateway: "Polygon",
        description: `Burned ${burnAmount} ALX`,
        timestamp: serverTimestamp(),
        status: "success",
        txHash
      });
      toast({ title: "Burn Success" });
      setBurnAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Burn Failed", description: err.message });
    } finally { setIsProcessingToken(false); }
  };

  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!isAuthorized) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <aside className="w-full md:w-72 bg-card border-r border-border flex flex-col fixed top-0 md:h-screen z-50">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg"><LogoIcon className="text-white" /></div>
            <span className="font-bold text-xl tracking-tighter italic uppercase">AliBank</span>
          </div>
          <nav className="flex-1 px-4 space-y-2 pt-4 overflow-y-auto no-scrollbar">
            <SidebarItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Clients" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={Wallet} label="Vault Control" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
            <SidebarItem icon={Coins} label="Tokenomics" active={activeTab === 'tokenomics'} onClick={() => setActiveTab('tokenomics')} />
            <SidebarItem icon={Key} label="API Management" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
            <SidebarItem icon={Box} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={FileText} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          </nav>
          <div className="p-6 mt-auto space-y-6 hidden md:block">
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Theme</span>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <SidebarItem icon={LogOut} label="Logout" className="text-rose-500" onClick={() => auth?.signOut()} />
            </div>
          </div>
        </aside>

        <main className="md:ml-72 flex-1 flex flex-col min-w-0 bg-background transition-colors">
          <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search global data..." className="h-11 pl-12 bg-muted border-none rounded-xl text-xs font-bold w-full" />
            </div>
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
          </header>

          <div className="p-6 md:p-10 space-y-10 overflow-y-auto no-scrollbar pb-20">
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600"><Database className="w-6 h-6" /></div>
                        <h3 className="text-lg font-black italic uppercase tracking-tight">AliBank Global Liquidity</h3>
                      </div>
                      <Badge className="bg-green-100 text-green-600 font-black text-[8px] px-3 h-6 rounded uppercase">LIVE SINKRON</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground uppercase">Total Net Capital (IDR)</p>
                      <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString('id-ID')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                      <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Vault Reserve (USD)</span><p className="text-xl font-black italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p></div>
                      <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Internal AUM</span><p className="text-xl font-black italic text-green-600">Rp {(globalLiquidity?.totalInternalAumIdr || 0).toLocaleString()}</p></div>
                      <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Node Status</span><p className="text-xl font-black italic text-blue-600 uppercase">PRODUCTION</p></div>
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
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground"><span>Active Accounts</span><span>{allUsers?.length || 0}</span></div>
                      <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-8 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2"><CandlestickChart className="w-4 h-4 text-primary" /> Revenue Dynamics Pro</h3>
                      <Badge className="bg-muted text-muted-foreground text-[8px] font-black uppercase">24H Activity</Badge>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={candleData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <Bar dataKey="close" barSize={12}>
                            {candleData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isUp ? "#10b981" : "#ef4444"} />)}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  <Card className="lg:col-span-4 border-none bg-[#1A1D1F] rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Sovereign Asset</p>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
                      <p className="text-[9px] font-bold text-white/30 uppercase mt-2">ALX V3 PROTOCOL</p>
                    </div>
                    <div className="relative z-10 flex justify-between items-end">
                      <div><p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Vault Inventory</p><p className="text-xl font-black italic">{isLoadingAlix ? '...' : Number(totalSupply).toLocaleString()} ALX</p></div>
                      <div className="text-right"><p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Anchor Price</p><p className="text-xl font-black italic text-primary">$ 12.24</p></div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                          <tr><th className="px-8 py-5">Operation ID</th><th className="px-8 py-5">Context</th><th className="px-8 py-5">Value</th><th className="px-8 py-5 text-right">Synchronization</th></tr>
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
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Render tab lainnya dengan logic Tokenomics V3.1 yang baru */}
            {activeTab === 'tokenomics' && (
              <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0"><Coins className="text-white w-full h-full" /></div>
                    <div><h3 className="text-3xl font-black italic uppercase tracking-tighter">ALX Tokenomics Terminal</h3><p className="text-xs font-bold text-muted-foreground uppercase mt-1">Contract logic synchronized with V3.1 Protocol</p></div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">V3.1 PROTOCOL ACTIVE</Badge>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <TokenStatCard label="Total Supply" value={`${isLoadingAlix ? '...' : Number(totalSupply).toLocaleString()} ALX`} sub={`Max: ${Number(maxSupply).toLocaleString()}`} icon={Zap} />
                  <TokenStatCard label="Remaining Mintable" value={`${isLoadingAlix ? '...' : Number(remainingMintable).toLocaleString()} ALX`} sub="Available to Mint" icon={Globe} color="text-green-600" />
                  <TokenStatCard label="Circulation Rate" value={`${circulationRate.toFixed(2)}%`} sub="Supply vs Max Cap" icon={Activity} color="text-blue-500" />
                  <TokenStatCard label="Burn Pool" value={`${(Number(maxSupply) - Number(totalSupply)).toLocaleString()} ALX`} sub="Deflation Realized" icon={Flame} color="text-orange-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black italic uppercase tracking-tight">Authorized Minting Terminal</h4>
                      <Badge variant="outline" className="border-green-500/20 text-green-600 font-black text-[8px] px-3 h-6 uppercase italic">OnlyOwner Protection</Badge>
                    </div>
                    <div className="p-10 rounded-[2.5rem] bg-muted/50 border border-border space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Mint Amount (ALX)</label>
                        <div className="relative">
                          <Input type="number" placeholder="0.00" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} className="h-20 bg-background border-none rounded-3xl font-black italic text-4xl pl-10 pr-24" />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-primary italic">ALX</div>
                        </div>
                      </div>
                      <Button onClick={handleOnChainMint} disabled={!mintAmount || isProcessingToken} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
                        {isProcessingToken ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN MINT"}
                      </Button>
                    </div>
                  </Card>
                  <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 flex flex-col justify-center space-y-8 shadow-sm">
                    <h4 className="text-xl font-black italic uppercase tracking-tight text-center">Supply Distribution</h4>
                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ name: 'Supply', value: Number(totalSupply) }, { name: 'Unminted', value: Number(remainingMintable) }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"><Cell fill="hsl(var(--primary))" /><Cell fill="hsl(var(--muted))" /></Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase"><span>Status Kontrak</span><Badge className={cn("text-[8px] font-black h-5 uppercase", isPaused ? "bg-rose-500" : "bg-green-500")}>{isPaused ? "Paused" : "Active"}</Badge></div>
                      <Button onClick={async () => {
                        if (typeof window === 'undefined' || !window.ethereum) return;
                        const provider = new BrowserProvider(window.ethereum as any);
                        const signer = await provider.getSigner();
                        await togglePause(signer);
                        toast({ title: "Status Updated" });
                      }} variant="outline" className="w-full text-[10px] font-black uppercase italic h-10 border-primary/20">TOGGLE EMERGENCY PAUSE</Button>
                    </div>
                  </Card>
                </div>
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
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group", active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground", className)}>
      <div className="flex items-center gap-4"><Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} /><span className={cn("text-sm font-black italic uppercase tracking-tight", active ? "opacity-100" : "opacity-80")}>{label}</span></div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}

function QuickOpButton({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-card border border-border/50 hover:bg-muted/50 transition-all group shadow-sm active:scale-95 text-center w-full">
      <div className={cn("w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-inner", color)}><Icon className="w-5 h-5" /></div>
      <div><p className="text-[10px] font-black uppercase italic">{label}</p><p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{sub}</p></div>
    </button>
  );
}

function TokenStatCard({ label, value, sub, icon: Icon, color = "text-accent" }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 space-y-4 shadow-sm">
      <div className="flex justify-between items-start"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p><Icon className={cn("w-4 h-4 opacity-20", color)} /></div>
      <p className={cn("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
    </Card>
  );
}

export default function AdminControlPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}><AdminContent /></Suspense>;
}
