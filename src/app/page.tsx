
"use client";

import { useUser, useDoc, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ChevronRight, 
  Smartphone,
  Sparkles,
  Wallet,
  Bell,
  Copy,
  Eye,
  Send,
  Users,
  ArrowDownToLine,
  ArrowUpToLine,
  Grid2X2,
  Home,
  PiggyBank,
  Clock,
  LogOut,
  QrCode,
  Loader2,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

const mainServices = [
  { name: "Transfer", icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
  { name: "Tagihan", icon: Smartphone, color: "bg-orange-50 text-orange-600", badge: "Promo" },
  { name: "E-Wallet", icon: Wallet, color: "bg-amber-50 text-amber-700", href: "/wallets" },
  { name: "Undang", icon: Users, color: "bg-red-50 text-red-600" },
  { name: "Deposito", icon: PiggyBank, color: "bg-green-50 text-green-600", href: "/deposits" },
  { name: "Tarik Tunai", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600", badge: "Gratis" },
  { name: "Setor Tunai", icon: ArrowUpToLine, color: "bg-teal-50 text-teal-600" },
  { name: "Semua", icon: Grid2X2, color: "bg-gray-50 text-gray-600" },
];

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData, loading: dataLoading } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const copyAccountNumber = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({
        title: "Disalin!",
        description: "Nomor rekening berhasil disalin ke clipboard.",
      });
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center shadow-xl">
          <Sparkles className="text-white w-8 h-8" />
        </div>
        <p className="text-accent font-bold animate-pulse tracking-widest uppercase text-[10px]">Menyiapkan AliBank...</p>
      </div>
    );
  }

  const balance = userData?.totalBalance || 0;
  const savings = userData?.savings || 0;
  const accountNumber = userData?.accountNumber || "Inisialisasi...";

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="px-4 pt-6 pb-4 bg-white/70 backdrop-blur-xl sticky top-0 z-40 border-b border-primary/5">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm gold-gradient">
              <Image 
                src={user?.photoURL || "https://picsum.photos/seed/user/150/150"} 
                alt="Profile" 
                fill 
                className="object-cover"
                data-ai-hint="user portrait"
              />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Selamat Datang,</p>
              <h2 className="font-bold text-accent leading-tight text-lg">{user?.displayName?.split(' ')[0] || "Nasabah"}</h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-2xl bg-white/80 border border-primary/5 shadow-sm hover:bg-destructive/5 hover:text-destructive group">
              <LogOut className="w-5 h-5 text-accent group-hover:text-destructive" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-2xl bg-white/80 border border-primary/5 shadow-sm">
                <Bell className="w-5 h-5 text-accent" />
              </Button>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                1
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Account Info Bar */}
        <div className="flex items-center justify-between px-2">
           <div className="flex items-center gap-2">
             <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1 rounded-full text-[10px] uppercase tracking-tighter">
               AliBank Premium
             </Badge>
           </div>
           <button 
             onClick={copyAccountNumber}
             className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full hover:bg-muted/50 transition-colors"
           >
             No. Rek: {accountNumber}
             <Copy className="w-3 h-3" />
           </button>
        </div>

        {/* Main Card */}
        <section className="gold-gradient rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/10">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Saldo Utama</span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white bg-white/10 p-1.5 rounded-lg transition-colors">
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              <Link href="/transactions">
                <Button size="sm" variant="ghost" className="bg-black/20 text-white rounded-xl text-[10px] font-black px-4 hover:bg-black/30 border border-white/10 uppercase tracking-widest">
                  Riwayat <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="text-5xl font-black tracking-tighter italic drop-shadow-lg">
              Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
            </div>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/20">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Tabungan</p>
                <p className="text-xl font-extrabold">Rp {savings.toLocaleString('id-ID')}</p>
                <Badge className="bg-white/20 text-white text-[8px] font-black uppercase tracking-widest">Bunga Harian</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Deposito</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-extrabold">Rp 0</p>
                  <Link href="/deposits">
                    <Badge className="bg-accent/80 text-white text-[8px] font-black uppercase tracking-widest hover:bg-accent cursor-pointer border border-white/10">Mulai</Badge>
                  </Link>
                </div>
                <p className="text-[10px] text-white/70 font-medium">Bunga s/d 6% p.a.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Service Grid */}
        <section className="liquid-glass rounded-[2.5rem] p-6 grid grid-cols-4 gap-y-8 gap-x-2 border-primary/10">
          {mainServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-2 group text-center">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 shadow-sm border border-primary/5 relative",
                  service.color
                )}>
                  <Icon className="w-6 h-6" />
                  {service.badge && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase border border-white">
                      {service.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-accent leading-tight h-8 flex items-center px-1 uppercase tracking-tighter">
                  {service.name}
                </span>
              </Link>
            )
          })}
        </section>

        {/* Promo Banner */}
        <section className="relative aspect-[2.8/1] rounded-[2rem] overflow-hidden shadow-xl border border-primary/10 group">
          <Image 
            src="https://picsum.photos/seed/promo-gold/800/300" 
            alt="Promotion" 
            fill 
            className="object-cover group-hover:scale-105 transition-transform duration-1000"
            data-ai-hint="luxury gold"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center px-8 text-white">
            <div className="space-y-1">
              <Badge className="bg-primary text-white text-[8px] font-black uppercase mb-2 tracking-widest">Eksklusif Nasabah</Badge>
              <h3 className="text-2xl font-black italic tracking-tighter leading-none uppercase">HADIAH<br/>MILIARAN RUPIAH</h3>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-2">Berakhir dalam 12 Hari</p>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Nav */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 max-w-2xl mx-auto pointer-events-none">
        <div className="liquid-glass-dark bg-accent/95 rounded-[2.8rem] grid grid-cols-5 items-center h-20 shadow-2xl px-2 border-white/10 pointer-events-auto">
          <Link href="/" className="flex flex-col items-center gap-1 group">
            <Home className="w-6 h-6 text-primary" />
            <span className="text-[8px] font-black text-white/90 uppercase tracking-widest">Beranda</span>
          </Link>
          <Link href="/transactions" className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity group">
            <Clock className="w-6 h-6 text-white group-hover:text-primary" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Riwayat</span>
          </Link>
          <div className="flex flex-col items-center justify-center relative h-full">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <button className="gold-gradient w-16 h-16 rounded-[1.8rem] flex items-center justify-center shadow-2xl border-4 border-accent hover:scale-105 active:scale-95 transition-all">
                <QrCode className="w-8 h-8 text-white" />
              </button>
            </div>
            <span className="mt-10 text-[8px] font-black text-white/50 tracking-widest uppercase">QRIS</span>
          </div>
          <Link href="/deposits" className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity group">
            <PiggyBank className="w-6 h-6 text-white group-hover:text-primary" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">Deposito</span>
          </Link>
          <Link href="/ai-assistant" className="flex flex-col items-center gap-1 opacity-50 hover:opacity-100 transition-opacity group">
            <Sparkles className="w-6 h-6 text-white group-hover:text-primary" />
            <span className="text-[8px] font-black text-white uppercase tracking-widest">AI Bank</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
