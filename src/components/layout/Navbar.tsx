
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  History, 
  Send, 
  Wallet, 
  PiggyBank, 
  Sparkles,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: History },
  { name: "Transfer", href: "/transfer", icon: Send },
  { name: "Wallets", href: "/wallets", icon: Wallet },
  { name: "Deposits", href: "/deposits", icon: PiggyBank },
  { name: "AI Insights", href: "/ai-assistant", icon: Sparkles },
];

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full mb-6">
      <div className="container mx-auto px-4">
        <div className="liquid-glass rounded-2xl mt-4 px-6 h-16 flex items-center justify-between border border-primary/20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <span className="font-headline font-bold text-xl tracking-tight text-accent">AliBank</span>
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
            className="md:hidden text-accent"
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
