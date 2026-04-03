"use client";

/**
 * ALI-BANK SUPER ADMIN - MOBILE TERMINAL V3.5
 * Modul Eksklusif untuk Perangkat Mobile dengan Bottom Navigation.
 * Otorisasi: alidzulfikar075@gmail.com / IJOuQpjEOMgvlYfzvQ1yfp976Oa2
 */

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  Users, 
  Wallet, 
  MoreHorizontal, 
  RefreshCw, 
  Database, 
  CandlestickChart, 
  PlusCircle, 
  Pickaxe, 
  Skull, 
  ArrowUpRight, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight, 
  Coins, 
  Box, 
  FileText, 
  Settings, 
  LogOut, 
  Loader2,
  Edit2,
  Layers,
  Activity,
  Info,
  Trash2,
  X,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Phone,
  Key,
  Plus,
  Minus,
  PiggyBank,
  RotateCw,
  Zap,
  Trophy,
  Smartphone
} from "lucide-react";
import { useUser, useDoc, useCollection, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  increment, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { JsonRpcProvider, formatEther } from "ethers";
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const ALX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";
const ALX_PRICE_IDR = 194004;

export default function AdminMobilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
      <AdminMobileContent />
    </Suspense>
  );
}

function AdminMobileContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [vaultEth, setVaultEth] = useState("0");

  // States for User Management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [alxAdjustment, setAlxAdjustment] = useState("");
  const [selectedUserWallets, setSelectedUserWallets] = useState<any[]>([]);
  const [selectedUserDeposits, setSelectedUserDeposits] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  // Queries
  const liquidityRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "liquidity") : null), [db, isAuthorized]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const usersQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "users"), limit(50)) : null), [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);

  const auditQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db, isAuthorized]);
  const { data: auditLogs } = useCollection(auditQuery);

  const marketplaceQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "marketplace"), orderBy("createdAt", "desc")) : null), [db, isAuthorized]);
  const { data: products } = useCollection(marketplaceQuery);

  // AGGREGATE REAL REVENUE DATA
  const candleData = useMemo(() => {
    if (!auditLogs) return Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, close: 0, isUp: true }));

    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = i.toString().padStart(2, '0');
      return { time: `${h}:00`, close: 0, isUp: true };
    });

    auditLogs.forEach(log => {
      if (log.timestamp && log.amountIdr) {
        const date = log.timestamp.toDate();
        const hour = date.getHours();
        hours[hour].close += log.amountIdr;
      }
    });

    for (let i = 1; i < hours.length; i++) {
      hours[i].isUp = hours[i].close >= hours[i-1].close;
    }

    return hours;
  }, [auditLogs]);

  // Sync On-Chain
  const syncVault = useCallback(async () => {
    if (!isAuthorized) return;
    setSyncing(true);
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const bal = await provider.getBalance(ALX_CONTRACT).catch(() => 0n);
      setVaultEth(formatEther(bal));
      toast({ title: "Vault Synced", description: "Data On-Chain diperbarui." });
    } catch (e) {} finally { setSyncing(false); }
  }, [isAuthorized, toast]);

  // Fetch detailed user data for dialog
  useEffect(() => {
    async function fetchSubData() {
      if (!selectedUser || !db || !isUserDialogOpen || !isAuthorized) return;
      setLoadingSubData(true);
      try {
        const [walletsSnap, depositsSnap, txsSnap] = await Promise.all([
          getDocs(collection(db, "users", selectedUser.id, "wallets")),
          getDocs(collection(db, "users", selectedUser.id, "deposits")),
          getDocs(query(collection(db, "users", selectedUser.id, "transactions"), orderBy("timestamp", "desc"), limit(20)))
        ]);
        setSelectedUserWallets(walletsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSelectedUserDeposits(depositsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setSelectedUserTransactions(txsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {} finally {
        setLoadingSubData(false);
      }
    }
    fetchSubData();
  }, [selectedUser, isUserDialogOpen, db, isAuthorized]);

  const handleUpdateUserBalance = async (type: 'idr' | 'alx', amount: string, operation: 'add' | 'sub') => {
    if (!db || !selectedUser || !amount || !isAuthorized) return;
    const num = parseFloat(amount);
    if (isNaN(num)) return;

    const userRef = doc(db, "users", selectedUser.id);
    const val = operation === 'add' ? num : -num;
    
    const updateData: any = {};
    if (type === 'idr') updateData.totalBalance = increment(val);
    else updateData["cryptoBalances.ALX"] = increment(val);

    updateDoc(userRef, updateData)
      .then(async () => {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `MOBILE-ADJ-${Date.now()}`,
          category: "Manual Adjustment",
          gateway: "Mobile Admin",
          amountIdr: type === 'idr' ? val : 0,
          description: `Manual ${operation} ${num} ${type.toUpperCase()} for ${selectedUser.name}`,
          timestamp: serverTimestamp(),
          status: "success"
        });
        toast({ title: "Update Berhasil" });
        setBalanceAdjustment("");
        setAlxAdjustment("");
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAuthorized) return;
    if (!confirm("Hapus data nasabah secara permanen?")) return;
    
    const userRef = doc(db, "users", userId);
    deleteDoc(userRef)
      .then(() => {
        toast({ title: "User Deleted" });
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleResetPassword = async () => {
    if (!auth || !selectedUser?.email || !isAuthorized) return;
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);
      toast({ title: "Email Terkirim" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Kirim", description: err.message });
    }
  };

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
    syncVault();

    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      router.push('/admin');
    }
  }, [user, userLoading, router, syncVault]);

  if (userLoading || !isAuthorized) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body">
      {/* Header Mobile */}
      <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gold-gradient p-1.5 shadow-lg">
            <LogoIcon className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">Super Admin</h1>
            <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">Mobile Terminal V3</span>
          </div>
        </div>
        <button 
          onClick={syncVault}
          disabled={syncing}
          className="p-2 hover:bg-muted rounded-full transition-colors relative"
        >
          <RefreshCw className={cn("w-5 h-5 text-muted-foreground", syncing && "animate-spin text-primary")} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-10 no-scrollbar">
        {activeTab === "dashboard" && (
          <DashboardView 
            liquidity={globalLiquidity} 
            usersCount={allUsers?.length || 0} 
            candleData={candleData} 
            auditLogs={auditLogs}
            onTabChange={setActiveTab}
            onSync={syncVault}
            syncing={syncing}
          />
        )}
        {activeTab === "users" && (
          <UsersView 
            users={allUsers} 
            onEdit={(u: any) => { setSelectedUser(u); setIsUserDialogOpen(true); }}
            onDelete={handleDeleteUser}
          />
        )}
        {activeTab === "vault" && <VaultView eth={vaultEth} address={ALX_CONTRACT} logs={auditLogs} />}
        {activeTab === "more" && <MoreView products={products} liquidity={globalLiquidity} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <NavButton icon={LayoutGrid} label="Panel" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        <NavButton icon={Users} label="Clients" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <NavButton icon={Wallet} label="Vault" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
        <NavButton icon={MoreHorizontal} label="Tools" active={activeTab === 'more'} onClick={() => setActiveTab('more')} />
      </nav>

      {/* USER MANAGEMENT DIALOG MOBILE */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="max-w-[95vw] rounded-[2rem] p-0 bg-background border-none shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] no-scrollbar">
          <div className="gold-gradient h-24 w-full relative">
            <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-background border-4 border-background flex items-center justify-center overflow-hidden shadow-xl">
              <img src={`https://picsum.photos/seed/${selectedUser?.uid}/100/100`} alt="client" className="object-cover" />
            </div>
            <button onClick={() => setIsUserDialogOpen(false)} className="absolute top-4 right-4 p-2 bg-white/20 rounded-full text-white"><X className="w-4 h-4" /></button>
          </div>

          <div className="pt-10 px-6 pb-8 space-y-6">
            <header className="space-y-1">
              <h2 className="text-xl font-black italic uppercase tracking-tight">{selectedUser?.name}</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedUser?.email}</p>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleResetPassword} variant="outline" className="h-8 rounded-lg text-[8px] font-black uppercase italic border-primary/20">Riset Sandi</Button>
                <Button onClick={() => handleDeleteUser(selectedUser?.id)} variant="outline" className="h-8 rounded-lg text-[8px] font-black uppercase italic border-rose-200 text-rose-500">Freeze</Button>
              </div>
            </header>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-xl h-10 w-full justify-start gap-1 border border-border overflow-x-auto no-scrollbar">
                <TabsTrigger value="profile" className="rounded-lg px-4 font-black uppercase text-[8px] italic shrink-0">Profile</TabsTrigger>
                <TabsTrigger value="financials" className="rounded-lg px-4 font-black uppercase text-[8px] italic shrink-0">Finance</TabsTrigger>
                <TabsTrigger value="wallets" className="rounded-lg px-4 font-black uppercase text-[8px] italic shrink-0">Wallets</TabsTrigger>
                <TabsTrigger value="earnings" className="rounded-lg px-4 font-black uppercase text-[8px] italic shrink-0">Profit</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <ProfileField icon={Mail} label="Email Address" value={selectedUser?.email} />
                <ProfileField icon={Phone} label="Phone Number" value={selectedUser?.phone || "Not Set"} />
                <ProfileField icon={ShieldCheck} label="Account Tier" value={selectedUser?.tier || "Regular"} />
                <ProfileField icon={Key} label="Native Address" value={selectedUser?.walletAddress} isMono />
              </TabsContent>

              <TabsContent value="financials" className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">IDR Liquidity Pool</label>
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                    <p className="text-lg font-black italic">Rp {selectedUser?.totalBalance?.toLocaleString() || '0'}</p>
                    <div className="flex gap-1.5">
                      <Input placeholder="Amt" type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} className="w-16 h-8 bg-background border-none text-[10px] font-black italic" />
                      <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'add')} className="w-7 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'sub')} className="w-7 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">ALX Holdings</label>
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border flex items-center justify-between">
                    <p className="text-lg font-black italic text-primary">{selectedUser?.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX</p>
                    <div className="flex gap-1.5">
                      <Input placeholder="ALX" type="number" value={alxAdjustment} onChange={(e) => setAlxAdjustment(e.target.value)} className="w-16 h-8 bg-background border-none text-[10px] font-black italic" />
                      <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'add')} className="w-7 h-8 rounded-lg gold-gradient text-white flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'sub')} className="w-7 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="wallets" className="space-y-3">
                {selectedUserWallets.map((w, i) => (
                  <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center"><Wallet className="w-4 h-4 text-primary" /></div>
                      <p className="text-[10px] font-black italic uppercase">{w.name}</p>
                    </div>
                    <p className="text-xs font-black text-green-600">Rp {w.balance?.toLocaleString()}</p>
                  </div>
                ))}
                {selectedUserWallets.length === 0 && <p className="text-center text-[10px] font-bold text-muted-foreground opacity-20 py-10 uppercase italic">No Linked Wallets</p>}
              </TabsContent>

              <TabsContent value="earnings" className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-primary/5 text-center space-y-1">
                    <p className="text-[7px] font-black text-muted-foreground uppercase">Grand Rewards</p>
                    <p className="text-sm font-black italic text-primary">{(selectedUserTransactions.filter(tx => tx.category === "Game").reduce((acc, tx) => acc + (tx.rewardAlx || 0), 0) * ALX_PRICE_IDR).toLocaleString()} IDR</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-green-500/5 text-center space-y-1">
                    <p className="text-[7px] font-black text-muted-foreground uppercase">ALX Yield</p>
                    <p className="text-sm font-black italic text-green-600">{selectedUserTransactions.filter(tx => tx.category === "Game").reduce((acc, tx) => acc + (tx.rewardAlx || 0), 0).toFixed(4)} ALX</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full text-left text-[8px]">
                    <tbody className="divide-y divide-border">
                      {selectedUserTransactions.slice(0, 5).map((tx, i) => (
                        <tr key={i}>
                          <td className="px-4 py-3 font-bold text-muted-foreground italic">{tx.timestamp?.toDate?.().toLocaleDateString() || '---'}</td>
                          <td className="px-4 py-3 font-black uppercase italic">{tx.description}</td>
                          <td className="px-4 py-3 text-right font-black text-green-600">+{tx.rewardAlx?.toFixed(4) || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// VIEW COMPONENTS
function DashboardView({ liquidity, candleData, auditLogs, onTabChange, onSync, syncing }: any) {
  const display = (val: number) => (val || 0).toLocaleString('id-ID');
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">System Health</h2>
      
      <Card className="p-8 rounded-[2.5rem] border-none bg-primary/5 space-y-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Database className="text-primary w-5 h-5" />
          <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Net Capital</span>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase mb-1">IDR Liquidity</p>
          <h3 className="text-3xl font-black italic tracking-tighter">Rp {display(liquidity?.totalFiatInjected)}</h3>
        </div>
        <div className="h-px bg-primary/10 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[8px] font-bold text-muted-foreground uppercase">Vault Reserve</p>
            <p className="text-lg font-black italic">$ {display(liquidity?.totalUsdInjected)}</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-muted-foreground uppercase">Internal AUM</p>
            <p className="text-lg font-black italic text-green-600">Rp {display(liquidity?.totalInternalAumIdr)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-8 rounded-[2.5rem] border-none bg-card shadow-sm space-y-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black italic uppercase tracking-widest flex items-center gap-2">
            <CandlestickChart className="w-4 h-4 text-primary" /> Revenue Dynamics Pro
          </h3>
          <Badge className="bg-muted text-muted-foreground text-[8px] font-black uppercase px-2">Real Activity</Badge>
        </div>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candleData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="time" hide />
              <YAxis domain={['auto', 'auto']} hide />
              <Bar dataKey="close" barSize={6}>
                {candleData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.isUp ? "#10b981" : "#ef4444"} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-8 rounded-[2.5rem] border-none bg-[#1A1D1F] text-white flex flex-col justify-between h-48 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-6 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
        <div className="relative z-10">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Sovereign Asset</p>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
        </div>
        <div className="relative z-10 flex justify-between items-end">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Vault Inventory</p>
            <p className="text-xl font-black italic">{(liquidity?.alixVaultBalance || 0).toLocaleString()} ALX</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Anchor Price</p>
            <p className="text-xl font-black italic text-primary">$ 12.24</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <QuickOpButton icon={Skull} label="Reset Clients" sub="Wipe Data" color="text-rose-500" onClick={() => onTabChange('users')} />
        <QuickOpButton icon={PlusCircle} label="Mint ALX" sub="Authorized" color="text-green-500" onClick={() => onTabChange('more')} />
        <QuickOpButton icon={Pickaxe} label="Burn ALX" sub="Deflation" color="text-orange-500" onClick={() => onTabChange('more')} />
        <QuickOpButton icon={RefreshCw} label="Sync Vault" sub="Mainnet" color="text-blue-500" onClick={onSync} syncing={syncing} />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black italic uppercase tracking-widest">Recent Activity Ledger</h3>
          <ArrowUpRight className="w-4 h-4 text-primary" onClick={() => onTabChange('vault')} />
        </div>
        <Card className="rounded-[2rem] border-none bg-card overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {auditLogs?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="p-5 flex justify-between items-center active:bg-muted/30 transition-colors">
                <div className="space-y-1">
                  <Badge className="bg-muted text-foreground text-[7px] font-black uppercase h-4 px-1.5">{log.category}</Badge>
                  <p className="text-[10px] font-bold text-muted-foreground truncate max-w-[150px]">{log.description || log.gateway}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black italic">Rp {log.amountIdr?.toLocaleString()}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase italic">{log.timestamp?.toDate?.().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function UsersView({ users, onEdit, onDelete }: any) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">Client Hub</h2>
        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black">{users?.length || 0} Registered</Badge>
      </div>
      
      <div className="space-y-3">
        {users?.map((u: any) => (
          <Card 
            key={u.id} 
            className="p-5 rounded-[1.5rem] border-none bg-card shadow-sm flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                <img src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="avatar" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-black italic uppercase">{u.name}</p>
                <p className="text-[8px] font-bold text-muted-foreground font-mono">{u.accountNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => onEdit(u)}
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button 
                onClick={() => onDelete(u.id)}
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-rose-100 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VaultView({ eth, address, logs }: any) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Mainnet Node</h2>
      <Card className="p-8 rounded-[2.5rem] border-none bg-[#1A1D1F] text-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5"><LogoIcon className="w-32 h-32" /></div>
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <Badge className="bg-green-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-4 py-1 animate-pulse">Live Chain</Badge>
          <div className="space-y-1">
            <p className="text-4xl font-black italic tracking-tighter text-blue-400">{parseFloat(eth).toFixed(6)} <span className="text-xl text-white/30">ETH</span></p>
            <p className="text-[10px] font-bold text-white/40 uppercase">Total Vault Balance</p>
          </div>
          <div className="w-full bg-white/5 p-3 rounded-xl border border-white/10">
            <p className="text-[8px] font-mono font-bold break-all opacity-60">{address}</p>
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Audit Ledger</h3>
        <div className="space-y-3">
          {logs?.slice(0, 10).map((log: any) => (
            <div key={log.id} className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
                <div>
                  <p className="text-[10px] font-black italic uppercase">{log.category}</p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.timestamp?.toDate?.().toLocaleTimeString()}</p>
                </div>
              </div>
              <p className="text-xs font-black italic">Rp {log.amountIdr?.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoreView({ products, liquidity }: any) {
  const [view, setView] = useState<'menu' | 'inventory' | 'tokenomics'>('menu');
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const db = useFirestore();
  const { toast } = useToast();

  const handleTokenOp = async (type: 'mint' | 'burn') => {
    if (!db || processing) return;
    const amt = type === 'mint' ? parseFloat(mintAmount) : parseFloat(burnAmount);
    if (isNaN(amt) || amt <= 0) return;

    setProcessing(true);
    try {
      const sysRef = doc(db, "system", "liquidity");
      const change = type === 'mint' ? amt : -amt;
      await updateDoc(sysRef, {
        alixVaultBalance: increment(change),
        totalAlixSupply: increment(change)
      });
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `${type.toUpperCase()}-${Date.now()}`,
        category: "Tokenomics",
        gateway: "Mobile Node",
        amountIdr: 0,
        description: `Mobile authorized ${type}: ${amt} ALX`,
        timestamp: serverTimestamp(),
        status: "success"
      });
      toast({ title: "Success", description: `${amt} ALX has been updated.` });
      setMintAmount(""); setBurnAmount("");
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally { setProcessing(false); }
  };

  if (view === 'inventory') return (
    <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
      <button onClick={() => setView('menu')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to Tools</button>
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Inventory</h2>
      <div className="space-y-3">
        {products?.map((p: any) => (
          <div key={p.id} className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">{p.category === 'Infrastructure' ? <Layers className="w-5 h-5 text-primary" /> : <Box className="w-5 h-5 text-muted-foreground" />}</div>
              <div>
                <p className="text-sm font-black italic uppercase leading-none">{p.name}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Rp {p.priceIdr?.toLocaleString()} • {p.category}</p>
              </div>
            </div>
            <Edit2 className="w-4 h-4 text-muted-foreground opacity-40" />
          </div>
        ))}
      </div>
    </div>
  );

  if (view === 'tokenomics') return (
    <div className="animate-in slide-in-from-right-4 duration-500 space-y-8">
      <button onClick={() => setView('menu')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to Tools</button>
      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">ALX Terminal</h2>
      <div className="space-y-6">
        <Card className="p-6 rounded-[2rem] border-none bg-muted/50 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Authorized Supply</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-black italic">{(liquidity?.totalAlixSupply || 0).toLocaleString()} <span className="text-lg">ALX</span></p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Maximum Cap</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black italic text-primary">$ 12.24</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Anchor Price</p>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input type="number" placeholder="Mint Amount..." value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} className="h-14 rounded-xl bg-muted border-none font-bold" />
            <button onClick={() => handleTokenOp('mint')} disabled={processing || !mintAmount} className="h-14 px-6 bg-green-600 text-white rounded-xl font-black uppercase italic text-[10px]">{processing ? "..." : "MINT"}</button>
          </div>
          <div className="flex gap-2">
            <Input type="number" placeholder="Burn Amount..." value={burnAmount} onChange={(e) => setBurnAmount(e.target.value)} className="h-14 rounded-xl bg-muted border-none font-bold" />
            <button onClick={() => handleTokenOp('burn')} disabled={processing || !burnAmount} className="h-14 px-6 bg-rose-600 text-white rounded-xl font-black uppercase italic text-[10px]">{processing ? "..." : "BURN"}</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Admin Tools</h2>
      <div className="grid grid-cols-1 gap-4">
        <MenuToolItem icon={Coins} label="Tokenomics Terminal" sub="Manage ALX Supply & Policy" color="bg-primary/10 text-primary" onClick={() => setView('tokenomics')} />
        <MenuToolItem icon={Box} label="Market Inventory" sub="Deploy Global Infrastructure" color="bg-blue-500/10 text-blue-500" onClick={() => setView('inventory')} />
        <MenuToolItem icon={FileText} label="System Audit Ledger" sub="Real-Time Operation History" color="bg-accent/10 text-accent" onClick={() => {}} />
        <MenuToolItem icon={Settings} label="Interface Settings" sub="UI/UX & Security Policy" color="bg-muted text-muted-foreground" onClick={() => {}} />
        <MenuToolItem icon={LogOut} label="Log Out Terminal" sub="Kill active admin session" color="bg-rose-500/10 text-rose-500" onClick={() => auth?.signOut()} />
      </div>
    </div>
  );
}

// HELPERS
function NavButton({ icon: Icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300", active ? "text-primary scale-110" : "text-muted-foreground opacity-60")}>
      <div className={cn("p-2 rounded-xl transition-colors", active && "bg-primary/10")}><Icon className="w-6 h-6" /></div>
      <span className="text-[10px] font-black uppercase italic tracking-tighter">{label}</span>
    </button>
  );
}

function MenuToolItem({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-6 rounded-[2rem] bg-card border border-border flex items-center justify-between active:scale-[0.98] transition-all group shadow-sm">
      <div className="flex items-center gap-5">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", color)}><Icon className="w-6 h-6" /></div>
        <div className="text-left">
          <p className="text-sm font-black italic uppercase leading-none">{label}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{sub}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </button>
  );
}

function QuickOpButton({ icon: Icon, label, sub, color, onClick, syncing }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 rounded-[2rem] bg-card border border-border/50 hover:bg-muted/50 transition-all group shadow-sm active:scale-95 text-center w-full">
      <div className={cn("w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-inner", color, syncing && "animate-spin")}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-[10px] font-black uppercase italic">{label}</p>
        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

function ProfileField({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3 h-3" />
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className={cn("text-[10px] font-bold truncate italic uppercase", isMono && "font-mono text-[9px]")}>{value || "---"}</p>
      </div>
    </div>
  );
}
