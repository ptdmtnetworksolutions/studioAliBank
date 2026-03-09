"use client";

import { Navbar } from "@/components/layout/Navbar";
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
  User,
  PiggyBank,
  Clock,
  LogOut,
  QrCode
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

const mainServices = [
  { name: "Transfer", icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
  { name: "Top Up & Tagihan", icon: Smartphone, color: "bg-orange-50 text-orange-600", badge: "Promo" },
  { name: "Top Up E-Wallet", icon: Wallet, color: "bg-amber-50 text-amber-700", href: "/wallets" },
  { name: "Undang Teman", icon: Users, color: "bg-red-50 text-red-600" },
  { name: "Deposito", icon: PiggyBank, color: "bg-green-50 text-green-600", href: "/deposits" },
  { name: "Tarik Tunai", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600", badge: "Gratis" },
  { name: "Setor Tunai", icon: ArrowUpToLine, color: "bg-teal-50 text-teal-600", badge: "Gratis" },
  { name: "Lihat Semua", icon: Grid2X2, color: "bg-gray-50 text-gray-600" },
];

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
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

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
      </div>
    );
  }

  const handleLogout = () => {
    if (auth) signOut(auth);
  };

  const balance = userData?.totalBalance || 0;
  const savings = userData?.savings || 0;
  const accountNumber = userData?.accountNumber || "8800 0000 0000";

  return (
    <div className="min-h-screen pb-24 bg-background">
      <header className="px-4 pt-6 pb-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-primary/5">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm">
              <Image 
                src={user?.photoURL || "https://picsum.photos/seed/user/150/150"} 
                alt="Profile" 
                fill 
                className="object-cover"
                data-ai-hint="user portrait"
              />
            </div>
            <div>
              <h2 className="font-bold text-accent leading-tight">{user?.displayName || "Nasabah AliBank"}</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                No. Rekening: {accountNumber}
                <button className="hover:text-primary transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full bg-white/80 border border-primary/5">
              <LogOut className="w-5 h-5 text-accent" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-full bg-white/80 border border-primary/5">
                <Bell className="w-5 h-5 text-accent" />
              </Button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                1
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        <section className="gold-gradient rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/80">Total Saldo</span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <Link href="/transactions">
                <Button size="sm" variant="ghost" className="bg-black/10 text-white rounded-full text-xs font-bold px-4">
                  Riwayat <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="text-4xl font-extrabold tracking-tight">
              Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Tabungan</p>
                <p className="text-lg font-bold">Rp {savings.toLocaleString('id-ID')}</p>
                <p className="text-[10px] text-white/70">Cair harian</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">Deposito</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">Rp 0</p>
                  <Link href="/deposits">
                    <Badge variant="secondary" className="bg-white/20 text-white text-[8px]">Mulai</Badge>
                  </Link>
                </div>
                <p className="text-[10px] text-white/70">Hingga 6% p.a.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="liquid-glass rounded-[2rem] p-6 grid grid-cols-4 gap-y-8 gap-x-2">
          {mainServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-2 group text-center">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-primary/5",
                  service.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-accent leading-tight h-8 flex items-center">
                  {service.name}
                </span>
              </Link>
            )
          })}
        </section>

        <section className="relative aspect-[3/1] rounded-3xl overflow-hidden shadow-lg border border-primary/10">
          <Image 
            src="https://picsum.photos/seed/promo/800/266" 
            alt="Promotion" 
            fill 
            className="object-cover"
            data-ai-hint="banking promo"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-8 text-white">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Eksklusif</p>
              <h3 className="text-xl font-black italic">PROMO HADIAH<br/>MILIARAN RUPIAH</h3>
            </div>
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 max-w-2xl mx-auto">
        <div className="liquid-glass-dark bg-accent/90 rounded-[2.5rem] grid grid-cols-5 items-center h-20 shadow-2xl px-2">
          <Link href="/" className="flex flex-col items-center gap-1">
            <Home className="w-6 h-6 text-primary" />
            <span className="text-[10px] font-bold text-white/90">Beranda</span>
          </Link>
          <Link href="/transactions" className="flex flex-col items-center gap-1 opacity-50">
            <Clock className="w-6 h-6 text-white" />
            <span className="text-[10px] font-bold text-white">Riwayat</span>
          </Link>
          <div className="flex flex-col items-center justify-center relative h-full">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2">
              <button className="gold-gradient w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl border-4 border-accent hover:scale-105 transition-transform">
                <QrCode className="w-8 h-8 text-white" />
              </button>
            </div>
            <span className="mt-8 text-[10px] font-bold text-white/40">QRIS</span>
          </div>
          <Link href="/deposits" className="flex flex-col items-center gap-1 opacity-50">
            <PiggyBank className="w-6 h-6 text-white" />
            <span className="text-[10px] font-bold text-white">Deposito</span>
          </Link>
          <Link href="/ai-assistant" className="flex flex-col items-center gap-1 opacity-50">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-[10px] font-bold text-white">AI Bank</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
