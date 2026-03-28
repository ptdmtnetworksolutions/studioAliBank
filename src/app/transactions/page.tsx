
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
import { useUser, useFirestore, useDoc } from "@/firebase";
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
        <div className={cn("rounded-full flex items-center justify-center p-1", className)}>
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
        <div className={cn("rounded-full flex items-center justify-center p-1.5", className)}>
          <LogoIcon className="text-white" />
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-300">
      {/* Top Header Tabs - Scrollable */}
      <header className="px-4 h-14 flex items-center border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['Ringkasan', 'Pendanaan', 'Earn', 'Spot', 'Futures'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab)}
              className={cn(
                "text-base font-black transition-all relative shrink-0",
                activeTopTab === tab ? "text-foreground after:absolute after:-bottom-[15px] after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
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
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-xs font-bold">Estimasi Total Nilai</span>
                <button onClick={() => setShowBalance(!showBalance)}>
                  <Eye className={cn("w-4 h-4 transition-colors", !showBalance && "text-primary")} />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-black tracking-tight italic">
                  {showBalance ? `Rp${(userData?.totalBalance ?? 20.06).toLocaleString('id-ID')}` : '******'}
                </h1>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-sm font-black italic">IDR</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-1.5 group cursor-pointer">
                <span className="text-[11px] font-bold text-muted-foreground">PNL hari ini</span>
                <span className="text-[11px] font-black text-rose-500">-Rp0.00050926(-0.00%)</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              </div>
            </div>
            <div className="flex items-center gap-4 text-foreground pt-1">
              <BarChart3 className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
              <History className="w-5 h-5 cursor-pointer hover:text-primary transition-colors" />
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-xs h-11 rounded-lg uppercase tracking-tight shadow-none"
              onClick={() => router.push('/?open=add_funds')}
            >
              Tambah Dana
            </Button>
            <Button className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-xs h-11 rounded-lg uppercase tracking-tight shadow-none">
              Kirim
            </Button>
            <Button className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-xs h-11 rounded-lg uppercase tracking-tight shadow-none">
              Transfer
            </Button>
          </div>
        </div>

        {/* Content Tabs (Kripto / Akun) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/50 px-1">
            <div className="flex gap-8">
              {['Kripto', 'Akun'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-black transition-all relative italic",
                    activeSubTab === tab ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-5 text-muted-foreground pb-2">
              <Search className="w-5 h-5 cursor-pointer" />
              <Settings className="w-5 h-5 cursor-pointer" />
            </div>
          </div>

          {/* Asset List */}
          <div className="space-y-8 pb-10">
            {assets.map((asset) => (
              <div key={asset.symbol} className="space-y-4 px-1 group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <asset.icon className={cn("w-8 h-8 shadow-sm", asset.color)} />
                    <div>
                      <h3 className="text-sm font-black italic tracking-tight">{asset.symbol}</h3>
                      <p className="text-[10px] font-bold text-muted-foreground leading-none">{asset.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black italic tracking-tight">{asset.amount}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Rp{asset.idrValue}</p>
                  </div>
                </div>

                {/* Conditional Extra Info (like BNB in reference) */}
                {asset.symbol === "BNB" && (
                  <div className="space-y-1 pl-11 opacity-80">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span>PnL Hari Ini</span>
                      <span className="text-rose-500">{asset.pnl}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                      <span>Harga Rata-Rata</span>
                      <span>{asset.avgPrice}</span>
                    </div>
                  </div>
                )}

                {/* Row Actions */}
                <div className="flex gap-3 pl-11">
                  <Button variant="outline" className="h-8 px-6 bg-muted/30 border-none text-[10px] font-black italic rounded-md shadow-none">
                    Earn
                  </Button>
                  <Button variant="outline" className="h-8 px-6 bg-muted/30 border-none text-[10px] font-black italic rounded-md shadow-none">
                    Perdagangan
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Floating Assistant Icon (from Reference) */}
      <div className="fixed bottom-24 right-6 z-40">
        <div className="w-12 h-12 bg-card rounded-2xl shadow-xl border border-border flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer relative">
          <SmileIcon className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
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
