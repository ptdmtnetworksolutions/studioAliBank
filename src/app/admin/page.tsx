
/**
 * CRITICAL: AliBank Admin Control V3.5 - MODULAR RECONSTRUCTION
 * Pusat Kendali Suplai, Kebijakan Moneter ALX, dan Manajemen Katalog.
 * Otorisasi Eksklusif: alidzulfikar075@gmail.com / IJOuQpjEOMgvlYfzvQ1yfp976Oa2
 */

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
  Loader2 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  doc, 
  query, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { JsonRpcProvider, formatEther } from "ethers";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useTheme } from "next-themes";
import Image from "next/image";

// Import Modular Components
import { DashboardView } from "./components/DashboardView";
import { ClientsView } from "./components/ClientsView";
import { VaultControlView } from "./components/VaultControlView";
import { TokenomicsView } from "./components/TokenomicsView";
import { ApiManagementView } from "./components/ApiManagementView";
import { InventoryView } from "./components/InventoryView";

import { useAlixCoin } from '@/hooks/useAlixCoin';
import { AuditLogsView as AuditLogsMod } from "./components/AuditLogsView";

// KONFIGURASI DUA JARINGAN BERBEDA
const ALX_CONTRACT = process.env.NEXT_PUBLIC_ALX_ADDRESS || "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"; // Polygon
const VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; // ETH Mainnet (AliBankVault)

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  
  // Blockchain Data Hook (Polygon - ALX)
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

  const candleData = useMemo(() => {
    if (!auditLogs) return Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, close: 0, isUp: true }));
    const hours = Array.from({ length: 24 }, (_, i) => ({ time: `${i.toString().padStart(2, '0')}:00`, close: 0, isUp: true }));
    auditLogs.forEach((log: any) => {
      if (log.timestamp && log.amountIdr) {
        const hour = log.timestamp.toDate().getHours();
        hours[hour].close += log.amountIdr;
      }
    });
    for (let i = 1; i < hours.length; i++) hours[i].isUp = hours[i].close >= hours[i-1].close;
    return hours;
  }, [auditLogs]);

  // Sync Data dari Brankas ETH Mainnet
  const syncOnChainData = useCallback(async () => {
    if (!isAuthorized) return;
    setSyncingVault(true);
    try {
      const ethRpc = "https://ethereum-rpc.publicnode.com";
      const provider = new JsonRpcProvider(ethRpc);
      // Ambil saldo ETH langsung dari alamat kontrak AliBankVault
      const vaultBalance = await provider.getBalance(VAULT_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(vaultBalance));
    } catch (err) {
      console.error("Vault sync failed:", err);
    } finally {
      setSyncingVault(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
    syncOnChainData();
  }, [user, userLoading, router, syncOnChainData]);

  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!isAuthorized) return null;

  return (
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

      <main className="md:ml-72 flex-1 flex flex-col min-w-0 bg-background">
        <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
          <div className="relative w-full max-w-sm hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search global data..." className="h-11 pl-12 bg-muted border-none rounded-xl text-xs font-bold w-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black leading-none">{user?.displayName || "Super Admin"}</p>
              <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Web3 Node</p>
            </div>
            <div className="w-10 h-10 rounded-full gold-gradient p-[2px]">
              <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                <Image src={`https://picsum.photos/seed/${user?.uid}/100/100`} alt="avatar" width={40} height={40} className="object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 md:p-10 space-y-10 overflow-y-auto no-scrollbar pb-20">
          {activeTab === 'dashboard' && (
            <DashboardView 
              globalLiquidity={globalLiquidity} 
              allUsers={allUsers} 
              candleData={candleData} 
              auditLogs={auditLogs} 
              setActiveTab={setActiveTab} 
              syncOnChainData={syncOnChainData} 
              syncingVault={syncingVault}
              isLoadingAlix={isLoadingAlix}
              totalSupply={totalSupply}
            />
          )}
          {activeTab === 'users' && <ClientsView allUsers={allUsers} />}
          {activeTab === 'vault' && (
            <VaultControlView 
              onChainEth={onChainEth} 
              VAULT_CONTRACT={VAULT_CONTRACT} 
              auditLogs={auditLogs} 
            />
          )}
          {activeTab === 'tokenomics' && (
            <TokenomicsView 
              totalSupply={totalSupply}
              maxSupply={maxSupply}
              remainingMintable={remainingMintable}
              circulationRate={circulationRate}
              isPaused={isPaused}
              isLoadingAlix={isLoadingAlix}
              mintALX={mintALX}
              burnALX={burnALX}
              togglePause={togglePause}
            />
          )}
          {activeTab === 'api' && <ApiManagementView storedKeys={storedKeys} />}
          {activeTab === 'inventory' && <InventoryView marketplaceProducts={marketplaceProducts} />}
          {activeTab === 'audit' && <AuditLogsMod auditLogs={auditLogs} />}
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
