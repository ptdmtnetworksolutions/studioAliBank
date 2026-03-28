
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
  Home, 
  TrendingUp, 
  Repeat, 
  Compass, 
  Wallet,
  LayoutGrid,
  ArrowRightLeft,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogoIcon } from "@/components/ui/logo";

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<'bursa' | 'dompet'>('bursa');

  useEffect(() => {
    setMounted(true);
    
    // Fungsi untuk mensinkronisasi mode dari localStorage
    const syncMode = () => {
      const savedMode = localStorage.getItem("alibank-active-mode") as 'bursa' | 'dompet';
      const urlTab = searchParams.get('tab') as 'bursa' | 'dompet';
      
      if (urlTab) {
        setMode(urlTab);
      } else if (savedMode) {
        setMode(savedMode);
      }
    };

    syncMode();

    // Dengarkan event perubahan mode kustom (jika ada)
    window.addEventListener('alibank-mode-change', syncMode);
    return () => window.removeEventListener('alibank-mode-change', syncMode);
  }, [searchParams]);

  if (!mounted) return null;

  const excludedPaths = [
    "/login",
    "/register",
    "/crypto/buy",
    "/crypto/convert",
    "/crypto/deposit-methods",
    "/crypto/cash-delivery",
    "/settings/payment-currency",
    "/checkout"
  ];

  const shouldHide = excludedPaths.some(path => pathname?.startsWith(path));
  if (shouldHide) return null;

  // Bursa Tab Menu
  const bursaItems = [
    { name: "Beranda", href: "/?tab=bursa", icon: Home, isLogo: true },
    { name: "Pasar", href: "/crypto", icon: TrendingUp },
    { name: "Perdagangan", href: "/crypto/trade/btc", icon: ArrowRightLeft },
    { name: "Futures", href: "/crypto/trade/futures", icon: FileText },
    { name: "Aset", href: "/transactions", icon: Wallet },
  ];

  // Dompet Tab Menu
  const dompetItems = [
    { name: "Beranda", href: "/?tab=dompet", icon: Home },
    { name: "Pasar", href: "/crypto", icon: TrendingUp },
    { name: "Dagang", href: "/crypto/trade/alix", icon: Repeat },
    { name: "Discover", href: "/marketplace", icon: Compass },
    { name: "Aset", href: "/transactions", icon: Wallet },
  ];

  const navItems = mode === 'dompet' ? dompetItems : bursaItems;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-2 pb-safe transition-colors duration-300">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          const isHome = item.href.startsWith('/?tab=');
          const itemTab = item.href.includes('dompet') ? 'dompet' : 'bursa';
          
          // Logika Active yang diperketat:
          const isActive = (() => {
            // Jika menu Beranda, cek mode bursa/dompet
            if (isHome) return pathname === '/' && mode === itemTab;
            
            // Khusus menu Pasar di bursa agar tidak tabrakan dengan Perdagangan (sama-sama mulai dari /crypto)
            if (item.href === '/crypto' && mode === 'bursa') {
              return pathname === '/crypto';
            }

            // Jika Perdagangan, cek apakah di sub-path trade
            if (item.href.includes('/trade/') && !item.href.includes('futures')) {
              return pathname?.startsWith('/crypto/trade/') && !pathname?.includes('futures');
            }

            // Default startsWith
            return pathname?.startsWith(item.href);
          })();

          return (
            <Link 
              key={item.name + item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                {item.isLogo && isActive ? (
                  <div className="w-5 h-5 gold-gradient rounded p-0.5 shadow-sm">
                    <LogoIcon className="text-white" />
                  </div>
                ) : (
                  <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
                )}
              </div>
              <span className={cn("text-[9px] font-bold uppercase italic tracking-tighter", isActive ? "opacity-100" : "opacity-80")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
