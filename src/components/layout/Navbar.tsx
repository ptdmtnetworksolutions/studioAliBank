
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
  ShoppingBag,
  Languages,
  Check
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";
import { useUser } from "@/firebase";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { language, setLanguage, t } = useLanguage();

  const personalItems = [
    { name: t('dashboard'), href: "/", icon: LayoutDashboard },
    { name: t('transactions'), href: "/transactions", icon: History },
    { name: t('transfer'), href: "/transfer", icon: Send },
    { name: t('marketplace'), href: "/marketplace", icon: ShoppingBag },
    { name: t('deposits'), href: "/deposits", icon: PiggyBank },
    { name: t('crypto'), href: "/crypto", icon: Bitcoin },
    { name: t('ai_assistant'), href: "/ai-assistant", icon: Sparkles },
  ];

  const businessItems = [
    { name: t('merchant_console'), href: "/merchant", icon: Store },
  ];

  if (pathname === "/" || pathname?.startsWith("/admin")) return null;

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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm">
                    <Languages className="w-4 h-4 text-accent" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl liquid-glass border-primary/10 p-2">
                  <DropdownMenuItem onClick={() => setLanguage('id')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                    ID (Indonesia) {language === 'id' && <Check className="w-3 h-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                    EN (English) {language === 'en' && <Check className="w-3 h-3 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationCenter />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm">
                  <Languages className="w-4 h-4 text-accent" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl liquid-glass border-primary/10 p-2">
                <DropdownMenuItem onClick={() => setLanguage('id')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                  Indonesia {language === 'id' && <Check className="w-3 h-3 text-primary" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                  English {language === 'en' && <Check className="w-3 h-3 text-primary" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
