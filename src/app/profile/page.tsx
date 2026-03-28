
"use client";

import { useRouter } from "next/navigation";
import { 
  X, 
  Maximize, 
  Headset, 
  Settings, 
  Share2, 
  Copy, 
  ChevronRight, 
  DollarSign, 
  User, 
  CircleUserRound,
  LayoutGrid,
  Users,
  Zap,
  Ticket,
  ArrowRightLeft,
  CalendarDays,
  Target,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const copyUid = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "UID Disalin", description: "Nomor ID nasabah telah disalin." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-10 flex flex-col font-body transition-colors duration-300">
      {/* Header - Icons Right */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-6 h-6 text-foreground" />
        </button>
        <div className="flex items-center gap-4">
          <Maximize className="w-5 h-5 text-foreground cursor-pointer" />
          <Headset className="w-5 h-5 text-foreground cursor-pointer" />
          <Settings className="w-5 h-5 text-foreground cursor-pointer" />
        </div>
      </header>

      <main className="flex-1 px-5 pt-2 space-y-8 overflow-y-auto no-scrollbar">
        {/* User Info Section */}
        <section className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Custom Avatar Styled as per image */}
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-border relative">
              <div className="absolute inset-0 bg-yellow-400 rounded-full scale-90" />
              <User className="w-12 h-12 text-slate-100 dark:text-slate-900 relative z-10 mt-2" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">{userData?.name || "DzulfikarAliRidlo"}</h1>
                <Share2 className="w-4 h-4 text-muted-foreground/60 cursor-pointer" />
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground" onClick={copyUid}>
                <span className="text-[11px] font-bold">UID: {userData?.accountNumber || "369470107"}</span>
                <Copy className="w-3 h-3 cursor-pointer active:scale-90 transition-transform" />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Badge className="bg-green-500/10 text-green-500 text-[10px] font-black h-5 border-none px-2 rounded-md">Terverifikasi</Badge>
                <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md cursor-pointer hover:bg-muted/80">
                  <span className="text-[10px] font-black text-muted-foreground">Reguler</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground/40 mt-6" />
        </section>

        {/* Promo Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-muted/40 border-none p-5 rounded-2xl flex flex-col justify-between h-44 cursor-pointer hover:bg-muted/60 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <DollarSign className="w-4 h-4 text-yellow-600" />
                <div className="w-3 h-0.5 bg-yellow-600 rounded-full -mt-0.5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Hasilkan Bersama</p>
              <h3 className="text-sm font-black text-foreground mt-1 leading-tight">Dapatkan Reward Putaran Anda Sekarang!</h3>
            </div>
          </Card>

          <Card className="bg-muted/40 border-none p-5 rounded-2xl flex flex-col justify-between h-44 cursor-pointer hover:bg-muted/60 transition-colors relative overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <CircleUserRound className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Untuk Anda</p>
                <h3 className="text-sm font-black text-foreground mt-1 leading-tight">Kompetisi Trading Alpha BLUAI Pertama: Pool Hadi...</h3>
              </div>
              <div className="flex gap-1">
                <div className="w-3 h-1 bg-foreground rounded-full" />
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
              </div>
            </div>
          </Card>
        </div>

        {/* List Menu Section */}
        <div className="bg-muted/20 rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition-colors border-b border-border/10">
            <span className="text-sm font-bold text-foreground">Voucher Saya</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </button>
        </div>

        {/* Recommended Grid Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Disarankan</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>

          <div className="grid grid-cols-4 gap-y-8">
            {[
              { name: "P2P", icon: Users, color: "text-yellow-500" },
              { name: "Alpha", icon: Smile, color: "text-yellow-500", isSpecial: true },
              { name: "Hub Reward", icon: Ticket, color: "text-white" },
              { name: "Konversi", icon: Maximize, color: "text-yellow-500", rotate: 45 },
              { name: "WOTD", icon: LayoutGrid, color: "text-yellow-500" },
              { name: "Margin", icon: ArrowRightLeft, color: "text-white", rotate: -45 },
              { name: "Acara Alpha", icon: CalendarDays, color: "text-yellow-500", hasBadge: true },
              { name: "Lainnya", icon: LayoutGrid, color: "text-white" },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-transform">
                <div className="relative">
                  {item.isSpecial ? (
                    <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center p-0.5">
                      <div className="w-full h-full rounded-full bg-yellow-500 flex items-center justify-center text-background font-black text-[10px]">α</div>
                    </div>
                  ) : item.hasBadge ? (
                    <div className="relative">
                      <item.icon className={cn("w-6 h-6", item.color, item.rotate && `rotate-[${item.rotate}deg]`)} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded flex items-center justify-center text-[6px] font-black text-background">α</div>
                    </div>
                  ) : (
                    <item.icon className={cn("w-6 h-6", item.color, item.rotate && `rotate-[${item.rotate}deg]`)} />
                  )}
                </div>
                <span className="text-[10px] font-bold text-foreground text-center leading-tight">{item.name}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center gap-1.5 pt-2">
            <div className="w-4 h-1 bg-foreground rounded-full" />
            <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        </section>

        {/* Task Center Section */}
        <div className="bg-muted/20 rounded-2xl overflow-hidden mt-4">
          <button className="w-full flex items-center justify-between p-5 hover:bg-muted/40 transition-colors">
            <span className="text-sm font-bold text-foreground">Pusat Tugas</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </button>
        </div>

        {/* Footer Mode Switcher */}
        <footer className="pt-6 pb-4">
          <button className="w-full bg-muted/20 hover:bg-muted/40 transition-all rounded-2xl p-5 flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center p-1.5 shadow-sm">
                <LogoIcon className="text-foreground" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tighter italic uppercase">AliBank</span>
                <span className="text-xs font-black text-yellow-500 italic">Lite</span>
              </div>
            </div>
            <div className="w-10 h-10 bg-muted/40 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Smile className="w-6 h-6" />
            </div>
          </button>
        </footer>
      </main>
    </div>
  );
}
