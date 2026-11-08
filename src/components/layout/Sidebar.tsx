"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import NextLink from "next/link";
import { 
  LayoutDashboard, 
  User, 
  Bell, 
  History, 
  Send, 
  PiggyBank, 
  ArrowDownToLine, 
  Coins, 
  Compass, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  Gamepad2, 
  Settings, 
  ShieldCheck,
  Wifi,
  ChevronDown,
  ChevronUp,
  Circle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";
import { UserAvatar } from "@/components/ui/user-avatar";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const [cryptoExpanded, setCryptoExpanded] = useState(false);
  const [gamesExpanded, setGamesExpanded] = useState(false);

  // Auto expand submenus if on subpages
  useEffect(() => {
    if (pathname && (pathname.startsWith("/crypto") || pathname.includes("/trade-pro") || pathname.includes("/market/"))) {
      setCryptoExpanded(true);
    }
    if (pathname && pathname.startsWith("/games")) {
      setGamesExpanded(true);
    }
  }, [pathname]);

  // Fetch unread notifications
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "notifications"), 
      where("read", "==", false)
    );
  }, [db, user]);
  
  const { data: unreadNotifications } = useCollection(notificationsQuery);
  const unreadCount = unreadNotifications?.length || 0;

  // Admin access check
  const isAdmin = useMemo(() => {
    return user && (user.email === OWNER_EMAIL || user.email === 'aldzulfikar075@gmail.com' || user.uid === OWNER_UID);
  }, [user]);

  const handleNavigation = (href: string) => {
    if (href && href !== "#") {
      router.push(href);
    }
  };

  return (
    <aside className="hidden lg:flex w-64 bg-white border-r border-[#DFDAD0] flex-col fixed h-screen z-50 overflow-y-auto no-scrollbar font-sans selection:bg-[#F4B728] selection:text-black">
      {/* BRAND HEADER (V 3.1 Editorial Style) */}
      <div className="p-6 flex items-center justify-between border-b border-[#ECE7DE] shrink-0 bg-[#FAF9F6]">
        <NextLink href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-[#111111] leading-none">
              AliBank
            </span>
            <span className="text-[8px] font-mono tracking-widest uppercase text-[#888888] mt-1">
              Institutional
            </span>
          </div>
        </NextLink>

        <span className="text-[8px] font-bold tracking-[0.16em] uppercase px-2 py-0.5 rounded-sm bg-white border border-[#DFDAD0] text-[#444444]">
          V 3.1
        </span>
      </div>

      {/* NAVIGATION SECTIONS */}
      <nav className="flex-1 px-3 py-6 space-y-6">
        
        {/* SECTION 1: RINGKASAN & AKUN */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-[0.18em] px-3 mb-2">
            Ikhtisar & Akun
          </p>
          
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={pathname === "/"} 
            onClick={() => handleNavigation("/")} 
          />
          <SidebarItem 
            icon={User} 
            label="Profil Saya" 
            active={pathname === "/profile"} 
            onClick={() => handleNavigation("/profile")} 
          />
          <SidebarItem 
            icon={ShieldCheck} 
            label="Verifikasi KYC" 
            active={pathname === "/settings/kyc"} 
            onClick={() => handleNavigation("/settings/kyc")} 
            tag={userData?.kycStatus === 'verified' ? 'Verified' : 'Wajib'}
          />
          <SidebarItem 
            icon={Bell} 
            label="Notifikasi" 
            active={pathname === "/notifications"} 
            onClick={() => handleNavigation("/notifications")}
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
          <SidebarItem 
            icon={History} 
            label="Riwayat Aktivitas" 
            active={pathname === "/transactions"} 
            onClick={() => handleNavigation("/transactions")} 
          />
        </div>

        {/* SECTION 2: PERBANKAN RETAIL */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-[0.18em] px-3 mb-2">
            Layanan Perbankan
          </p>
          
          <SidebarItem 
            icon={Send} 
            label="Transfer Dana" 
            active={pathname === "/transfer"} 
            onClick={() => handleNavigation("/transfer")} 
          />
          <SidebarItem 
            icon={PiggyBank} 
            label="Setor & Deposito" 
            active={pathname === "/deposits"} 
            onClick={() => handleNavigation("/deposits")} 
          />
          <SidebarItem 
            icon={ArrowDownToLine} 
            label="Tarik Tunai" 
            active={pathname === "/withdraw"} 
            onClick={() => handleNavigation("/withdraw")} 
          />
          <SidebarItem 
            icon={Coins} 
            label="Tabungan Yield" 
            active={pathname === "/savings"} 
            onClick={() => handleNavigation("/savings")} 
            tag="12% APY"
          />
        </div>

        {/* SECTION 3: WEB3 & DEFI */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-[0.18em] px-3 mb-2">
            DeFi & Web3
          </p>
          
          {/* Collapsible Crypto Submenu */}
          <div>
            <div 
              onClick={() => setCryptoExpanded(!cryptoExpanded)} 
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer transition-colors text-xs font-medium",
                (pathname?.startsWith("/crypto") || pathname?.includes("/trade-pro")) && !cryptoExpanded
                  ? "bg-[#111111] text-white font-bold" 
                  : "text-[#666666] hover:bg-[#FAF9F6] hover:text-[#111111]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Compass className="w-4 h-4 shrink-0" />
                <span className="uppercase tracking-[0.08em]">Layanan Kripto</span>
              </div>
              {cryptoExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#888888]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />}
            </div>
            
            {cryptoExpanded && (
              <div className="pl-3 space-y-0.5 mt-1 ml-3.5 border-l border-[#DFDAD0]">
                <SubmenuItem 
                  label="Bursa Pasar" 
                  active={pathname === "/crypto"} 
                  onClick={() => handleNavigation("/crypto")} 
                />
                <SubmenuItem 
                  label="Beli Kripto" 
                  active={pathname === "/crypto/buy" && !pathname.includes("tab=convert")} 
                  onClick={() => handleNavigation("/crypto/buy")} 
                />
                <SubmenuItem 
                  label="Convert / Swap" 
                  active={pathname === "/crypto/convert" || (pathname === "/crypto/buy" && pathname.includes("tab=convert"))} 
                  onClick={() => handleNavigation("/crypto/convert")} 
                />
              </div>
            )}
          </div>

          <SidebarItem 
            icon={TrendingUp} 
            label="Copy-Trade (Alpha)" 
            active={pathname === "/alpha"} 
            onClick={() => handleNavigation("/alpha")} 
          />
          <SidebarItem 
            icon={Users} 
            label="P2P Order Hub" 
            active={pathname?.startsWith("/p2p")} 
            onClick={() => handleNavigation("/p2p/order-history")} 
          />
          <SidebarItem 
            icon={ShoppingBag} 
            label="Marketplace" 
            active={pathname === "/marketplace"} 
            onClick={() => handleNavigation("/marketplace")} 
          />
        </div>

        {/* SECTION 4: SISTEM & PENGATURAN */}
        <div className="space-y-1">
          <p className="text-[9px] font-bold text-[#888888] uppercase tracking-[0.18em] px-3 mb-2">
            Sistem & Pengaturan
          </p>
          
          <SidebarItem 
            icon={MessageSquare} 
            label="Asisten AI" 
            active={pathname === "/ai-assistant"} 
            onClick={() => handleNavigation("/ai-assistant")} 
          />

          {/* Collapsible Mini Games Submenu */}
          <div>
            <div 
              onClick={() => setGamesExpanded(!gamesExpanded)} 
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer transition-colors text-xs font-medium",
                pathname?.startsWith("/games") && !gamesExpanded
                  ? "bg-[#111111] text-white font-bold" 
                  : "text-[#666666] hover:bg-[#FAF9F6] hover:text-[#111111]"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Gamepad2 className="w-4 h-4 shrink-0" />
                <span className="uppercase tracking-[0.08em]">Mini Games</span>
              </div>
              {gamesExpanded ? <ChevronUp className="w-3.5 h-3.5 text-[#888888]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />}
            </div>
            
            {gamesExpanded && (
              <div className="pl-3 space-y-0.5 mt-1 ml-3.5 border-l border-[#DFDAD0]">
                <SubmenuItem 
                  label="Ali Spin Wheel" 
                  active={pathname === "/games/spin"} 
                  onClick={() => handleNavigation("/games/spin")} 
                />
                <SubmenuItem 
                  label="AliBank MOBA" 
                  active={pathname === "/games/moba"} 
                  onClick={() => handleNavigation("/games/moba")} 
                />
              </div>
            )}
          </div>

          <SidebarItem 
            icon={Settings} 
            label="Pengaturan" 
            active={pathname === "/settings"} 
            onClick={() => handleNavigation("/settings")} 
          />
          {isAdmin && (
            <SidebarItem 
              icon={ShieldCheck} 
              label="Panel Admin" 
              active={pathname?.startsWith("/admin")} 
              onClick={() => handleNavigation("/admin")} 
              variant="admin"
            />
          )}
        </div>

      </nav>

      {/* FOOTER USER CARD & SYSTEM HEALTH */}
      <div className="p-4 border-t border-[#ECE7DE] shrink-0 space-y-3 bg-[#FAF9F6]">
        {user && (
          <div 
            onClick={() => router.push('/profile')}
            className="flex items-center gap-3 p-2 rounded-sm hover:bg-white border border-transparent hover:border-[#DFDAD0] cursor-pointer transition-all group"
            title="Buka Profil"
          >
            <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] shrink-0">
              <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#111111] truncate group-hover:text-black">
                {userData?.name || user?.displayName || "Nasabah AliBank"}
              </p>
              <p className="text-[9px] font-mono text-[#888888] truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[9px] font-mono uppercase text-[#777777] px-2 pt-1 border-t border-[#ECE7DE]">
          <span>Mainnet Node</span>
          <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>
    </aside>
  );
}

// Side Navigation Item Helper
interface SidebarItemProps {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  tag?: string;
  variant?: "default" | "admin";
}

function SidebarItem({ icon: Icon, label, active = false, onClick, badge, tag, variant = "default" }: SidebarItemProps) {
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer transition-colors text-xs relative",
        active 
          ? (variant === "admin" 
              ? "bg-rose-700 text-white font-bold shadow-sm" 
              : "bg-[#111111] text-white font-bold shadow-sm") 
          : "text-[#666666] hover:bg-[#FAF9F6] hover:text-[#111111]"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-white" : "text-[#888888]")} />
        <span className="uppercase tracking-[0.08em] font-medium leading-none">{label}</span>
      </div>
      
      {/* Right widgets (badge or tag) */}
      <div className="flex items-center gap-1.5 z-10">
        {tag && (
          <span className={cn(
            "text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider",
            active 
              ? "bg-white/20 text-white border border-white/20" 
              : "bg-[#F4F1EA] text-[#666666] border border-[#DFDAD0]"
          )}>
            {tag}
          </span>
        )}
        {badge !== undefined && (
          <span className="bg-[#F4B728] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}

// Submenu Navigation Item Helper
interface SubmenuItemProps {
  label: string;
  active?: boolean;
  onClick: () => void;
}

function SubmenuItem({ label, active = false, onClick }: SubmenuItemProps) {
  return (
    <div 
      onClick={onClick} 
      className={cn(
        "flex items-center gap-2 px-2.5 py-1.5 rounded-sm cursor-pointer transition-colors text-[11px] font-medium uppercase tracking-wider",
        active 
          ? "text-[#111111] font-bold bg-[#FAF9F6]" 
          : "text-[#777777] hover:text-[#111111] hover:bg-[#FAF9F6]"
      )}
    >
      <Circle className={cn("w-1 h-1 shrink-0", active ? "text-[#111111] fill-[#111111]" : "text-[#BBBBBB]")} />
      <span>{label}</span>
    </div>
  );
}
