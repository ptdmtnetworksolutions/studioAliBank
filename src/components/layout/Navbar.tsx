
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  History, 
  Send, 
  Wallet, 
  PiggyBank, 
  Menu,
  X,
  Bitcoin,
  Sparkles,
  Store,
  ShoppingBag
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";
import { useUser } from "@/firebase";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const personalItems = [
  { name: "Beranda", href: "/", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: History },
  { name: "Transfer", href: "/transfer", icon: Send },
  { name: "Marketplace", href: "/marketplace", icon: ShoppingBag },
  { name: "Deposito", href: "/deposits", icon: PiggyBank },
  { name: "Kripto", href: "/crypto", icon: Bitcoin },
  { name: "AI Insight", href: "/ai-assistant", icon: Sparkles },
];

const businessItems = [
  { name: "Merchant Console", href: "/merchant", icon: Store },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  if (pathname === "/") return null;

  return (
    <nav className="sticky top-0 z-50 w-full mb-6 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4">
        <div className="liquid-glass rounded-2xl mt-4 px-6 h-16 flex items-center justify-between border border-primary/20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center shadow-lg p-1.5">
              <LogoIcon className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tighter italic text-accent dark:text-primary uppercase">AliBank</span>
          </Link>

          {/* Desktop Nav - Public Items Only */}
          <div className="hidden lg:flex items-center gap-1">
            <div className="flex items-center gap-1 pr-4 border-r border-primary/10">
              {personalItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-medium text-[11px] uppercase tracking-wider",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                        : "text-accent hover:bg-primary/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="pl-4 flex items-center gap-4">
              {businessItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl transition-all font-bold text-[11px] uppercase tracking-wider",
                      isActive 
                        ? "bg-accent text-accent-foreground shadow-lg" 
                        : "text-primary hover:bg-primary/10"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
              <div className="w-px h-6 bg-primary/10 mx-2" />
              <NotificationCenter />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <NotificationCenter />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-accent dark:text-primary"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="lg:hidden mt-2 liquid-glass rounded-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-4 max-h-[70vh] overflow-y-auto">
            <p className="text-[10px] font-black uppercase text-muted-foreground px-4 py-2 tracking-widest">Personal Banking</p>
            {personalItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-accent hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
            <div className="h-px bg-primary/10 my-2 mx-4" />
            <p className="text-[10px] font-black uppercase text-muted-foreground px-4 py-2 tracking-widest">Business & Merchant</p>
            {businessItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold",
                    isActive 
                      ? "bg-accent text-accent-foreground" 
                      : "text-primary hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
