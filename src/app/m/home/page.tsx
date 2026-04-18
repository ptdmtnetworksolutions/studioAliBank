
"use client";

/**
 * ALI-BANK MOBILE HOME V3.5
 * Handled in dedicated /m/ directory for pure mobile UX.
 */

import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  MessageSquareText, 
  Bell, 
  User, 
  HandCoins, 
  DollarSign, 
  ArrowRightLeft, 
  Send, 
  Download,
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Zap,
  ShieldAlert,
  Skull,
  CheckCircle2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export default function MobileHomePage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'bursa' | 'dompet'>('bursa');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      router.replace('/');
    }
  }, [router]);

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  if (!mounted || userLoading) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border" onClick={() => router.push('/profile')}>
            {userData?.avatarUrl ? <img src={userData.avatarUrl} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center bg-slate-200"><User className="w-4 h-4" /></div>}
          </div>
          <div className="relative" onClick={() => router.push('/notifications')}>
            <MessageSquareText className="w-6 h-6" />
          </div>
        </div>
        
        <div className="flex bg-muted/60 p-1 rounded-lg">
          <button onClick={() => setActiveTab('bursa')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase italic rounded-md transition-all", activeTab === 'bursa' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Bursa</button>
          <button onClick={() => setActiveTab('dompet')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase italic rounded-md transition-all", activeTab === 'dompet' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Dompet</button>
        </div>

        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" />
          <Zap className="w-5 h-5 text-primary" onClick={() => router.push('/topup')} />
        </div>
      </header>

      <main className="px-4 pt-6 space-y-8 animate-in fade-in duration-500">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic leading-none">Total Nilai Estimasi</p>
          <h1 className="text-4xl font-black italic tracking-tighter">Rp{(userData?.totalBalance || 0).toLocaleString('id-ID')}</h1>
          <div className="flex items-center gap-1.5">
            <Badge className="bg-green-500/10 text-green-600 text-[8px] font-black italic border-none uppercase">PNL: +Rp12,450.00</Badge>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <ActionBtn icon={DollarSign} label="Beli" />
          <ActionBtn icon={ArrowRightLeft} label="Swap" />
          <ActionBtn icon={Send} label="Kirim" />
          <ActionBtn icon={Download} label="Terima" />
        </div>

        <section className="space-y-4">
           <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aset Populer</h3>
           <div className="space-y-6">
              <MobileAssetRow symbol="ALX" name="Alix Coin" price="12.24" change="+1.14%" isUp={true} isNative />
              <MobileAssetRow symbol="BTC" name="Bitcoin" price="66,410.20" change="-0.45%" isUp={false} />
              <MobileAssetRow symbol="ETH" name="Ethereum" price="2,420.08" change="+3.73%" isUp={true} />
           </div>
        </section>
      </main>
    </div>
  );
}

function ActionBtn({ icon: Icon, label }: any) {
  return (
    <button className="flex flex-col items-center gap-2 group">
      <div className="w-full aspect-square rounded-2xl bg-muted border border-border flex items-center justify-center transition-transform active:scale-95 group-hover:bg-muted/80">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">{label}</span>
    </button>
  );
}

function MobileAssetRow({ symbol, name, price, change, isUp, isNative }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", isNative ? "gold-gradient" : "bg-muted")}>
          {isNative ? <LogoIcon className="text-white p-2" /> : <div className="w-full h-full bg-slate-400 rounded-full" />}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black italic uppercase">{symbol}</span>
            {isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 border-none">V3</Badge>}
          </div>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">{name}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black italic">${price}</p>
        <p className={cn("text-[9px] font-black italic", isUp ? "text-green-500" : "text-rose-500")}>{change}</p>
      </div>
    </div>
  );
}
