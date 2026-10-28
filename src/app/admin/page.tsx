
"use client";

import { 
  LayoutGrid, 
  Users, 
  Wallet, 
  Coins, 
  Key, 
  Box, 
  FileText, 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  Loader2,
  Clock,
  ShieldCheck,
  Menu,
  X,
  BookOpenCheck,
  ShieldAlert,
  CreditCard
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  limit,
  collectionGroup
} from "firebase/firestore";
import { JsonRpcProvider, formatEther } from "ethers";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useTheme } from "next-themes";
import Image from "next/image";
import { UserAvatar } from "@/components/ui/user-avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";

import { DashboardView } from "./components/DashboardView";
import { ClientsView } from "./components/ClientsView";
import { VaultControlView } from "./components/VaultControlView";
import { TokenomicsView } from "./components/TokenomicsView";
import { ApiManagementView } from "./components/ApiManagementView";
import { InventoryView } from "./components/InventoryView";
import { AuditLogsView } from "./components/AuditLogsView";
import { PendingRequestsView } from "./components/PendingRequestsView";
import { KycVerificationView } from "./components/KycVerificationView";
import { ClientLedgerView } from "./components/ClientLedgerView";
import { ReconciliationView } from "./components/ReconciliationView";
import { PaymentMethodsView } from "./components/PaymentMethodsView";

import { useAlixCoin } from '@/hooks/useAlixCoin';

const VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  
  const {
    totalSupply,
    maxSupply,
    remainingMintable,
    circulationRate,
    isPaused,
    isLoading: isLoadingAlix,
    isNodeError,
    contractOwner,
    mintALX,
    burnALX,
    togglePause,
  } = useAlixCoin();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // DATA FETCHING STRATEGY V3.5 - RECONCILIATION MODE
  const isPrivileged = user && (user.email === OWNER_EMAIL || user.uid === OWNER_UID);

  const liquidityRef = useMemoFirebase(() => (db && isPrivileged ? doc(db, "system", "liquidity") : null), [db, isPrivileged]);
  const { data: globalLiquidity } = useDoc(liquidityRef);
  
  const usersQuery = useMemoFirebase(() => (db && isPrivileged ? query(collection(db, "users"), limit(100)) : null), [db, isPrivileged]);
  const { data: allUsers } = useCollection(usersQuery);
  
  // 1. Ambil Log Audit Global (Resmi)
  const auditQuery = useMemoFirebase(() => (db && isPrivileged ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db, isPrivileged]);
  const { data: auditLogs } = useCollection(auditQuery);

  // 2. KRITIS: Ambil Laporan Lintas Nasabah (Mendeteksi lonjakan yang tidak ter-capture di Global Audit)
  const userTransactionsQuery = useMemoFirebase(() => (db && isPrivileged ? query(collectionGroup(db, "transactions"), orderBy("timestamp", "desc"), limit(200)) : null), [db, isPrivileged]);
  const { data: userTransactions } = useCollection(userTransactionsQuery);

  const marketplaceQuery = useMemoFirebase(() => (db && isPrivileged ? query(collection(db, "marketplace"), orderBy("createdAt", "desc")) : null), [db, isPrivileged]);
  const { data: marketplaceProducts } = useCollection(marketplaceQuery);

  const apiKeysRef = useMemoFirebase(() => (db && isPrivileged ? doc(db, "system", "api_keys") : null), [db, isPrivileged]);
  const { data: storedKeys } = useDoc(apiKeysRef);

  const topupQuery = useMemoFirebase(() => (db && isPrivileged ? query(collection(db, "topup_requests"), orderBy("timestamp", "desc"), limit(50)) : null), [db, isPrivileged]);
  const { data: topupRequests } = useCollection(topupQuery);

  // MERGE DATA UNTUK AUDIT TOTAL
  const combinedAuditLogs = useMemo(() => {
    const global = (auditLogs || []).map(l => ({ ...l, source: 'official' }));
    const clientSide = (userTransactions || []).map(l => ({ 
      ...l, 
      source: 'client',
      category: l.category || 'User Activity',
      amountIdr: l.amount || l.amountIdr || 0,
      description: l.description || 'Transaksi Sisi Nasabah'
    }));

    // Hindari duplikasi jika ID sama
    const seenIds = new Set(global.map(l => l.id));
    const filteredClient = clientSide.filter(l => !seenIds.has(l.id));

    return [...global, ...filteredClient].sort((a, b) => {
      const timeA = a.timestamp?.seconds || 0;
      const timeB = b.timestamp?.seconds || 0;
      return timeB - timeA;
    });
  }, [auditLogs, userTransactions]);

  const candleData = useMemo(() => {
    const logs = combinedAuditLogs;
    if (!logs) return Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, close: 0, isUp: true }));
    const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, close: 0, isUp: true }));
    logs.forEach((log: any) => {
      if (log.timestamp && log.amountIdr) {
        const hour = log.timestamp.toDate().getHours();
        hours[hour].close += log.amountIdr;
      }
    });
    for (let i = 1; i < hours.length; i++) hours[i].isUp = hours[i].close >= hours[i-1].close;
    return hours;
  }, [combinedAuditLogs]);

  const syncOnChainData = useCallback(async () => {
    if (!isPrivileged) return;
    setSyncingVault(true);
    try {
      const ethRpc = "https://ethereum-rpc.publicnode.com";
      const provider = new JsonRpcProvider(ethRpc);
      const vaultBalance = await provider.getBalance(VAULT_CONTRACT).catch(() => BigInt(0));
      setOnChainEth(formatEther(vaultBalance));
    } catch (err) {
      console.error("Vault sync failed:", err);
    } finally {
      setSyncingVault(false);
    }
  }, [isPrivileged]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email === OWNER_EMAIL || user.uid === OWNER_UID)) {
      setIsAuthorized(true);
      syncOnChainData();
    } else {
      router.push('/login');
    }
  }, [user, userLoading, router, syncOnChainData]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!isAuthorized) return null;

  const NavItems = () => (
    <>
      <SidebarItem icon={LayoutGrid} label="Dasbor" active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} />
      <SidebarItem icon={ShieldCheck} label="Pusat KYC" active={activeTab === 'kyc'} onClick={() => handleTabChange('kyc')} />
      <SidebarItem icon={Clock} label="Permintaan Tertunda" active={activeTab === 'pending'} onClick={() => handleTabChange('pending')} />
      <SidebarItem icon={BookOpenCheck} label="Buku Besar Nasabah" active={activeTab === 'ledger'} onClick={() => handleTabChange('ledger')} />
      <SidebarItem icon={Users} label="Nasabah" active={activeTab === 'users'} onClick={() => handleTabChange('users')} />
      <SidebarItem icon={Wallet} label="Kontrol Brankas" active={activeTab === 'vault'} onClick={() => handleTabChange('vault')} />
      <SidebarItem icon={Coins} label="Tokenomik" active={activeTab === 'tokenomics'} onClick={() => handleTabChange('tokenomics')} />
      <SidebarItem icon={Key} label="Manajemen API" active={activeTab === 'api'} onClick={() => handleTabChange('api')} />
      <SidebarItem icon={CreditCard} label="Metode Pembayaran" active={activeTab === 'payment_methods'} onClick={() => handleTabChange('payment_methods')} />
      <SidebarItem icon={Box} label="Inventaris" active={activeTab === 'inventory'} onClick={() => handleTabChange('inventory')} />
      <SidebarItem icon={ShieldAlert} label="Rekonsiliasi & Fraud" active={activeTab === 'reconciliation'} onClick={() => handleTabChange('reconciliation')} />
      <SidebarItem icon={FileText} label="Log Audit" active={activeTab === 'audit'} onClick={() => handleTabChange('audit')} />
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <aside className="hidden md:flex w-72 bg-card border-r border-border flex-col fixed top-0 h-screen z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg"><LogoIcon className="text-white" /></div>
          <span className="font-bold text-xl tracking-tighter italic uppercase">AliBank</span>
        </div>
        <nav className="flex-1 px-4 space-y-2 pt-4 overflow-y-auto no-scrollbar">
          <NavItems />
        </nav>
        <div className="p-6 mt-auto space-y-6">
          <div className="bg-muted/50 rounded-2xl p-4 border border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Tema</span>
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            <SidebarItem icon={LogOut} label="Keluar" className="text-rose-500" onClick={() => auth?.signOut()} />
          </div>
        </div>
      </aside>

      <main className="md:ml-72 flex-1 flex flex-col min-w-0 bg-background min-h-screen">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-muted rounded-xl transition-colors">
                  <Menu className="w-6 h-6 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] p-0 bg-card border-r border-border">
                <SheetHeader className="p-8 flex-row items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg"><LogoIcon className="text-white" /></div>
                  <div>
                    <SheetTitle className="font-bold text-xl tracking-tighter italic uppercase">AliBank</SheetTitle>
                    <SheetDescription className="text-[8px] font-bold uppercase text-muted-foreground">Control Center V3</SheetDescription>
                  </div>
                </SheetHeader>
                <nav className="px-4 space-y-2 py-4 h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
                  <NavItems />
                </nav>
                <div className="p-6 border-t border-border mt-auto">
                   <SidebarItem icon={LogOut} label="Keluar" className="text-rose-500" onClick={() => auth?.signOut()} />
                </div>
              </SheetContent>
            </Sheet>

            <div className="relative w-full max-w-sm hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari data global..." className="h-11 pl-12 bg-muted border-none rounded-xl text-xs font-bold w-full" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black leading-none">{user?.displayName || "Super Admin"}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Web3 Node</p>
            </div>
            <div className="w-10 h-10 rounded-3xl gold-gradient p-[2px]">
              <div className="w-full h-full rounded-3xl bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                <UserAvatar photoURL={user?.photoURL} name={user?.displayName || "Super Admin"} email={user?.email} size={40} />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-10 overflow-y-auto no-scrollbar pb-20 flex-1">
          {activeTab === 'dashboard' && (
            <DashboardView 
              globalLiquidity={globalLiquidity} 
              allUsers={allUsers} 
              candleData={candleData} 
              auditLogs={combinedAuditLogs} 
              setActiveTab={setActiveTab} 
              syncOnChainData={syncOnChainData} 
              syncingVault={syncingVault}
              isLoadingAlix={isLoadingAlix}
              totalSupply={totalSupply}
            />
          )}
          {activeTab === 'kyc' && <KycVerificationView allUsers={allUsers} />}
          {activeTab === 'pending' && <PendingRequestsView topupRequests={topupRequests} />}
          {activeTab === 'ledger' && <ClientLedgerView allUsers={allUsers} />}
          {activeTab === 'users' && <ClientsView allUsers={allUsers} />}
          {activeTab === 'vault' && <VaultControlView onChainEth={onChainEth} VAULT_CONTRACT={VAULT_CONTRACT} auditLogs={combinedAuditLogs} />}
          {activeTab === 'tokenomics' && (
            <TokenomicsView 
              totalSupply={totalSupply}
              maxSupply={maxSupply}
              remainingMintable={remainingMintable}
              circulationRate={circulationRate}
              isPaused={isPaused}
              isLoadingAlix={isLoadingAlix}
              isNodeError={isNodeError}
              contractOwner={contractOwner}
              mintALX={mintALX}
              burnALX={burnALX}
              togglePause={togglePause}
              auditLogs={combinedAuditLogs}
            />
          )}
          {activeTab === 'api' && <ApiManagementView storedKeys={storedKeys} />}
          {activeTab === 'payment_methods' && <PaymentMethodsView />}
          {activeTab === 'inventory' && <InventoryView marketplaceProducts={marketplaceProducts} />}
          {activeTab === 'reconciliation' && <ReconciliationView setActiveTab={setActiveTab} />}
          {activeTab === 'audit' && <AuditLogsView auditLogs={combinedAuditLogs} />}
        </div>
      </main>
    </div>
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

export default function AdminControlPage() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}><AdminContent /></Suspense>;
}
