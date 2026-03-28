
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  TrendingUp, 
  Repeat, 
  FileText, 
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Pasar", href: "/crypto", icon: TrendingUp },
  { name: "Perdagangan", href: "/crypto/trade/alix", icon: Repeat },
  { name: "Futures", href: "/marketplace", icon: FileText },
  { name: "Aset", href: "/transactions", icon: Wallet },
];

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Daftar halaman yang tidak boleh menampilkan Bottom Navigation
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

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 px-2 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300",
                isActive ? "text-slate-900" : "text-slate-400"
              )}
            >
              <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} />
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
