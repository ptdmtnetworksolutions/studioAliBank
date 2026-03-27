
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Clock, 
  QrCode, 
  Bitcoin
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LogoIcon } from "@/components/ui/logo";

const navItems = [
  { name: "Main", href: "/", icon: Home },
  { name: "History", href: "/transactions", icon: Clock },
  { name: "SCAN", href: "/topup", icon: QrCode, isCenter: true },
  { name: "Bridge", href: "/crypto", icon: Bitcoin },
  { name: "AI", href: "/ai-assistant", icon: LogoIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/register";
  
  if (!mounted || isAuthPage) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-1 max-w-lg mx-auto pointer-events-none">
      <div className="liquid-glass-dark bg-accent/95 rounded-[2rem] grid grid-cols-5 items-center h-16 shadow-2xl px-3 border-white/10 pointer-events-auto dark:bg-black/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <div key={item.name} className="flex items-center justify-center relative h-full">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                  <Link href={item.href}>
                    <button className="gold-gradient w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl border-4 border-accent dark:border-black hover:scale-105 active:scale-95 transition-all p-3">
                      <Icon className="w-8 h-8 text-white" />
                    </button>
                  </Link>
                </div>
              </div>
            );
          }

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex items-center justify-center transition-all duration-300 h-full",
                isActive ? "opacity-100 scale-110" : "opacity-40 hover:opacity-100"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-white")} />
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
