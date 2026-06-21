"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  User, 
  Bell, 
  History, 
  Send, 
  PiggyBank, 
  ArrowDownToLine, 
  Coins, 
  CreditCard, 
  ArrowRightLeft, 
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
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

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
    return user && (user.email === OWNER_EMAIL || user.uid === OWNER_UID);
  }, [user]);

  const handleNavigation = (href: string) => {
    if (href && href !== "#") {
      router.push(href);
    }
  };

  return (
    <aside className="hidden lg:flex w-64 bg-card border-r border-border flex-col fixed h-screen z-50 overflow-y-auto no-scrollbar">
      {/* BRAND HEADER */}
      <div className="p-6 flex items-center gap-3 border-b border-border/40 shrink-0">
        <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg text-white">
          <LogoIcon />
        </div>
        <span className="font-bold text-xl tracking-tighter italic uppercase text-foreground">AliBank</span>
      </div>

      {/* NAVIGATION SECTIONS */}
      <nav className="flex-1 px-4 py-6 space-y-7">
        
        {/* SECTION 1: RINGKASAN & AKUN */}
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">Ikhtisar & Akun</p>
          
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
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">Layanan Perbankan</p>
          
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
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">DeFi & Web3</p>
          
          {/* Collapsible Crypto Submenu */}
          <div>
            <div 
              onClick={() => setCryptoExpanded(!cryptoExpanded)} 
              className={cn(
                "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                (pathname?.startsWith("/crypto") || pathname?.includes("/trade-pro")) && !cryptoExpanded
                  ? "bg-primary/5 text-primary" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Compass className={cn("w-4.5 h-4.5", (pathname?.startsWith("/crypto") || pathname?.includes("/trade-pro")) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="text-xs font-black uppercase italic tracking-tight">Layanan Kripto</span>
              </div>
              {cryptoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
            
            {cryptoExpanded && (
              <div className="pl-4 space-y-1 mt-1 ml-4 border-l border-border/40">
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
                  label="Convert/Swap" 
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
        <div className="space-y-1.5">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-3 mb-2">Sistem & Lainnya</p>
          
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
                "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group",
                pathname?.startsWith("/games") && !gamesExpanded
                  ? "bg-primary/5 text-primary font-bold" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className={cn("w-4.5 h-4.5", pathname?.startsWith("/games") ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="text-xs font-black uppercase italic tracking-tight">Mini Games</span>
              </div>
              {gamesExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
            
            {gamesExpanded && (
              <div className="pl-4 space-y-1 mt-1 ml-4 border-l border-border/40">
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

      {/* FOOTER SYSTEM HEALTH */}
      <div className="p-6 border-t border-border/40 shrink-0 space-y-4 bg-card/50">
        <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
          <span>Network Health</span>
          <span className="flex items-center gap-1 text-green-500">
            <Wifi className="w-2.5 h-2.5" /> Live
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
        "flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all group relative",
        active 
          ? (variant === "admin" ? "bg-rose-500/10 text-rose-500 font-bold" : "bg-primary/10 text-primary font-bold") 
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4.5 h-4.5 transition-colors", active ? (variant === "admin" ? "text-rose-500" : "text-primary") : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-xs font-black uppercase italic tracking-tight">{label}</span>
      </div>
      
      {/* Right widgets (badge or tag) */}
      <div className="flex items-center gap-1.5 z-10">
        {tag && (
          <span className="text-[7px] font-black px-1.5 py-0.5 bg-primary/20 text-primary rounded border border-primary/20 uppercase tracking-widest">
            {tag}
          </span>
        )}
        {badge !== undefined && (
          <span className="bg-primary text-primary-foreground text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg">
            {badge}
          </span>
        )}
      </div>

      {/* Active left indicator bar */}
      {active && (
        <div className={cn("w-1 h-5 rounded-full absolute left-0 top-1/2 -translate-y-1/2", variant === "admin" ? "bg-rose-500" : "bg-primary")} />
      )}
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
        "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-[11px] font-bold uppercase tracking-wider group relative",
        active ? "text-primary font-extrabold" : "text-muted-foreground/85 hover:text-foreground"
      )}
    >
      <Circle className={cn("w-1.5 h-1.5 transition-all", active ? "text-primary fill-primary scale-110" : "text-muted-foreground/40 group-hover:text-muted-foreground")} />
      <span>{label}</span>
    </div>
  );
}
