
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
  Store
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";

const navItems = [
  { name: "Beranda", href: "/", icon: LayoutDashboard },
  { name: "Transaksi", href: "/transactions", icon: History },
  { name: "Transfer", href: "/transfer", icon: Send },
  { name: "Dompet", href: "/wallets", icon: Wallet },
  { name: "Deposito", href: "/deposits", icon: PiggyBank },
  { name: "Kripto", href: "/crypto", icon: Bitcoin },
  { name: "Merchant", href: "/merchant", icon: Store },
  { name: "AI", href: "/ai-assistant", icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-medium text-sm",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                      : "text-accent hover:bg-primary/10"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-accent dark:text-primary"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden mt-2 liquid-glass rounded-2xl p-4 flex flex-col gap-2 animate-in slide-in-from-top-4">
            {navItems.map((item) => {
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
          </div>
        )}
      </div>
    </nav>
  );
}
