
"use client";

/**
 * ALI-BANK SUPER ADMIN - MOBILE TERMINAL V3.5
 * Modul Eksklusif untuk Perangkat Mobile dengan Bottom Navigation.
 * Otorisasi: alidzulfikar075@gmail.com / IJOuQpjEOMgvlYfzvQ1yfp976Oa2
 */

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  LayoutGrid, 
  Users, 
  Wallet, 
  MoreHorizontal, 
  RefreshCw, 
  Search, 
  Database, 
  TrendingUp, 
  Plus, 
  Minus, 
  Zap, 
  Coins, 
  Box, 
  FileText, 
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  PackagePlus,
  Trash2,
  Edit2,
  Loader2,
  Skull,
  Bell,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  ArrowLeft
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
  deleteDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { JsonRpcProvider, formatEther } from "ethers";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const ALX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";

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

  // Queries
  const liquidityRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "liquidity") : null), [db, isAuthorized]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const usersQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "users"), limit(50)) : null), [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);

  const auditQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(20)) : null), [db, isAuthorized]);
  const { data: auditLogs } = useCollection(auditQuery);

  const marketplaceQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "marketplace"), orderBy("createdAt", "desc")) : null), [db, isAuthorized]);
  const { data: products } = useCollection(marketplaceQuery);

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

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
    syncVault();

    // AUTO-DETECTION: Redirect back to Desktop UI if on large screen
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      router.push('/admin');
    }
  }, [user, userLoading, router, syncVault]);

  if (userLoading || !isAuthorized) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
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
      <main className="flex-1 overflow-y-auto px-6 pt-6 pb-24 space-y-8 no-scrollbar">
        {activeTab === "dashboard" && <DashboardView liquidity={globalLiquidity} usersCount={allUsers?.length || 0} />}
        {activeTab === "users" && <UsersView users={allUsers} />}
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
    </div>
  );
}

// VIEW COMPONENTS
function DashboardView({ liquidity, usersCount }: any) {
  const display = (val: number) => (val || 0).toLocaleString('id-ID');
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
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

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 rounded-[2rem] border-none bg-card shadow-sm space-y-2">
          <Users className="w-5 h-5 text-muted-foreground opacity-40" />
          <p className="text-xl font-black italic">{usersCount}</p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">Active Clients</p>
        </Card>
        <Card className="p-6 rounded-[2rem] border-none bg-[#1A1D1F] text-white shadow-sm space-y-2">
          <Coins className="w-5 h-5 text-primary opacity-60" />
          <p className="text-xl font-black italic">{display(liquidity?.alixVaultBalance)}</p>
          <p className="text-[8px] font-bold text-white/40 uppercase">ALX in Vault</p>
        </Card>
      </div>
    </div>
  );
}

function UsersView({ users }: any) {
  const router = useRouter();
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
            onClick={() => router.push(`/admin?tab=users&id=${u.id}`)} // Redirect ke modal di desktop/full page
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
            <div className="text-right">
              <p className="text-xs font-black text-green-600">Rp {(u.totalBalance || 0).toLocaleString()}</p>
              <p className="text-[8px] font-bold text-muted-foreground">IDR Liquid</p>
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
        <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1">Live Audit Feed</h3>
        <div className="space-y-3">
          {logs?.slice(0, 5).map((log: any) => (
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

  if (view === 'inventory') return (
    <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
      <button onClick={() => setView('menu')} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground mb-4"><ArrowLeft className="w-4 h-4" /> Back to Tools</button>
      <h2 className="text-2xl font-black italic uppercase tracking-tighter">Market Inventory</h2>
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
              <p className="text-3xl font-black italic">{liquidity?.totalAlixSupply?.toLocaleString()} <span className="text-lg">ALX</span></p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Global Maximum Cap</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black italic text-primary">$ 12.24</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase">Anchor Price</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Button className="h-16 rounded-2xl bg-green-600 text-white font-black italic uppercase text-[10px] tracking-widest border-none">MINT NEW ALX</Button>
          <Button className="h-16 rounded-2xl bg-rose-600 text-white font-black italic uppercase text-[10px] tracking-widest border-none">BURN ALX</Button>
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
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-300",
        active ? "text-primary scale-110" : "text-muted-foreground opacity-60"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        active && "bg-primary/10"
      )}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-black uppercase italic tracking-tighter">{label}</span>
    </button>
  );
}

function MenuToolItem({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <button onClick={onClick} className="w-full p-6 rounded-[2rem] bg-card border border-border flex items-center justify-between active:scale-[0.98] transition-all group shadow-sm">
      <div className="flex items-center gap-5">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="text-left">
          <p className="text-sm font-black italic uppercase leading-none">{label}</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{sub}</p>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
    </button>
  );
}
