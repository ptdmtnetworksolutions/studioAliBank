
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Search, 
  Settings, 
  Eye, 
  ChevronDown, 
  ChevronRight, 
  History, 
  BarChart3,
  Loader2,
  MoreHorizontal,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

export default function AssetsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [activeTopTab, setActiveTopTab] = useState('Ringkasan');
  const [activeSubTab, setActiveSubTab] = useState('Kripto');
  const [showBalance, setShowBalance] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, loading: userLoading } = useDoc(userDocRef);

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Menghubungkan Vault...</p>
      </div>
    );
  }

  const assets = [
    { 
      symbol: "USDT", 
      name: "TetherUS", 
      amount: "0.00110179", 
      idrValue: "18.70", 
      color: "bg-teal-600",
      icon: (className: string) => (
        <div className={cn("rounded-full flex items-center justify-center p-2", className)}>
          <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
            <path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/>
          </svg>
        </div>
      )
    },
    { 
      symbol: "BNB", 
      name: "BNB", 
      amount: "0.00000013", 
      idrValue: "1.36", 
      color: "bg-yellow-500",
      pnl: "Rp0.00(-0.04%)",
      avgPrice: "Rp4,158,371.64",
      icon: (className: string) => (
        <div className={cn("rounded-full flex items-center justify-center p-2.5", className)}>
          <LogoIcon className="text-white" />
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-300">
      {/* Top Header Tabs - Scrollable & Compact */}
      <header className="px-4 h-12 flex items-center border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar w-full">
          {['Ringkasan', 'Pendanaan', 'Earn', 'Spot', 'Futures'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab)}
              className={cn(
                "text-sm font-black transition-all relative shrink-0",
                activeTopTab === tab ? "text-foreground after:absolute after:-bottom-[13px] after:left-0 after:right-0 after:h-[2.5px] after:bg-primary" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pt-6 space-y-8 animate-in fade-in duration-500">
        {/* Estimasi Total Nilai Section */}
        <div className="space-y-4 px-1">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-[11px] font-bold">Estimasi Total Nilai</span>
                <button onClick={() => setShowBalance(!showBalance)}>
                  <Eye className={cn("w-3.5 h-3.5 transition-colors", !showBalance && "text-primary")} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black tracking-tight italic">
                  {showBalance ? `Rp${(userData?.totalBalance ?? 0).toLocaleString('id-ID')}` : '******'}
                </h1>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-[13px] font-black italic text-muted-foreground uppercase">IDR</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 group cursor-pointer pt-1">
                <span className="text-[10px] font-bold text-muted-foreground">PNL hari ini</span>
                <span className="text-[10px] font-black text-rose-500">-Rp0.00050926(-0.00%)</span>
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-foreground pt-1">
              <BarChart3 className="w-5 h-5 cursor-pointer hover:text-primary transition-colors opacity-80" />
              <History className="w-5 h-5 cursor-pointer hover:text-primary transition-colors opacity-80" />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none"
              onClick={() => router.push('/?open=add_funds')}
            >
              TAMBAH DANA
            </Button>
            <Button className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none">
              KIRIM
            </Button>
            <Button className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none">
              TRANSFER
            </Button>
          </div>
        </div>

        {/* Content Tabs (Kripto / Akun) */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-border/50 px-1">
            <div className="flex gap-8">
              {['Kripto', 'Akun'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-black transition-all relative italic",
                    activeSubTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-primary" : "text-muted-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-5 text-muted-foreground pb-2 opacity-60">
              <Search className="w-5 h-5 cursor-pointer" />
              <Settings className="w-5 h-5 cursor-pointer" />
            </div>
          </div>

          {/* Asset List - Compact Version */}
          <div className="space-y-10 pb-10">
            {assets.map((asset) => (
              <div key={asset.symbol} className="space-y-4 px-1 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <asset.icon className={cn("w-10 h-10 shadow-sm shrink-0", asset.color)} />
                    <div>
                      <h3 className="text-sm font-black italic tracking-tight">{asset.symbol}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground leading-none">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black italic tracking-tight">{asset.amount}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-60">Rp{asset.idrValue}</p>
                  </div>
                </div>

                {/* Conditional Extra Info */}
                {asset.symbol === "BNB" && (
                  <div className="space-y-1 pl-13 pr-1 opacity-80">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span>PnL Hari Ini</span>
                      <span className="text-rose-500">{asset.pnl}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span>Harga Rata-Rata</span>
                      <span className="text-foreground">{asset.avgPrice}</span>
                    </div>
                  </div>
                )}

                {/* Row Actions */}
                <div className="flex gap-2 pl-13 pt-1">
                  <Button variant="outline" className="h-7 px-5 bg-muted/40 border-none text-[9px] font-black italic rounded-md shadow-none uppercase">
                    Earn
                  </Button>
                  <Button variant="outline" className="h-7 px-5 bg-muted/40 border-none text-[9px] font-black italic rounded-md shadow-none uppercase">
                    Perdagangan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Assistant Icon - Smaller & Precise */}
      <div className="fixed bottom-24 right-6 z-40">
        <div className="w-10 h-10 bg-card rounded-xl shadow-xl border border-border flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer relative">
          <SmileIcon className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SmileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22c5.523 0 9-4.477 9-10s-3.477-10-9-10-9 4.477-9 10 3.477 10 9 10z" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}
