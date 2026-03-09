
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Clock, 
  QrCode, 
  Bitcoin, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Main", href: "/", icon: Home },
  { name: "History", href: "/transactions", icon: Clock },
  { name: "SCAN", href: "/topup", icon: QrCode, isCenter: true },
  { name: "Bridge", href: "/crypto", icon: Bitcoin },
  { name: "AI Intelligence", href: "/ai-assistant", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  // Sembunyikan navigasi di halaman login dan register
  if (pathname === "/login" || pathname === "/register") return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-2 max-w-2xl mx-auto pointer-events-none">
      <div className="liquid-glass-dark bg-accent/95 rounded-[3rem] grid grid-cols-5 items-center h-22 shadow-2xl px-3 border-white/10 pointer-events-auto dark:bg-black/95">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          if (item.isCenter) {
            return (
              <div key={item.name} className="flex flex-col items-center justify-center relative h-full">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                  <Link href={item.href}>
                    <button className="gold-gradient w-20 h-20 rounded-[2.2rem] flex items-center justify-center shadow-2xl border-4 border-accent dark:border-black hover:scale-105 active:scale-95 transition-all">
                      <Icon className="w-10 h-10 text-white" />
                    </button>
                  </Link>
                </div>
                <span className="mt-12 text-[9px] font-black text-white/40 tracking-widest uppercase">{item.name}</span>
              </div>
            );
          }

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-300",
                isActive ? "opacity-100 scale-110" : "opacity-50 hover:opacity-100"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "text-primary" : "text-white")} />
              <span className={cn(
                "text-[9px] font-black uppercase tracking-widest",
                isActive ? "text-primary" : "text-white"
              )}>
                {item.name === "Main" ? "Home" : item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
