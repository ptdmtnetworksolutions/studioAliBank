
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_USER, MOCK_TRANSACTIONS } from "@/app/lib/mock-data";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  ChevronRight, 
  CreditCard, 
  QrCode, 
  Zap, 
  Smartphone,
  Sparkles,
  Wallet,
  ArrowRight,
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
  TrendingUp,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import Image from "next/image";

const mainServices = [
  { name: "Transfer", icon: Send, color: "bg-blue-50 text-blue-600" },
  { name: "Top Up & Tagihan", icon: Smartphone, color: "bg-orange-50 text-orange-600", badge: "Promo" },
  { name: "Top Up E-Wallet", icon: Wallet, color: "bg-brown-50 text-amber-700" },
  { name: "Undang Teman", icon: Users, color: "bg-red-50 text-red-600" },
  { name: "Deposito", icon: PiggyBank, color: "bg-green-50 text-green-600" },
  { name: "Tarik Tunai", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600", badge: "Gratis" },
  { name: "Setor Tunai", icon: ArrowUpToLine, color: "bg-teal-50 text-teal-600", badge: "Gratis" },
  { name: "Lihat Semua", icon: Grid2X2, color: "bg-gray-50 text-gray-600" },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen pb-24 bg-background selection:bg-primary/20">
      {/* Top Header Section */}
      <header className="px-4 pt-6 pb-4 bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-primary/5">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-full border-2 border-primary/20 overflow-hidden shadow-sm">
              <Image 
                src="https://picsum.photos/seed/alex-thompson/150/150" 
                alt="Profile" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="font-bold text-accent leading-tight">{MOCK_USER.name}</h2>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                No. Rekening: {MOCK_USER.accountNumber}
                <button className="hover:text-primary transition-colors">
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
          <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full bg-white/80 shadow-sm border border-primary/5 hover:bg-primary/10">
              <Bell className="w-5 h-5 text-accent" />
            </Button>
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              13
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        {/* Main Balance Card */}
        <section className="gold-gradient rounded-[2rem] p-6 text-white shadow-2xl shadow-primary/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/80">Total Saldo</span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <Link href="/transactions">
                <Button size="sm" variant="ghost" className="bg-black/10 hover:bg-black/20 text-white rounded-full text-xs font-bold px-4">
                  Riwayat <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="text-4xl font-extrabold tracking-tight">
              Rp {mounted ? (showBalance ? MOCK_USER.totalBalance.toLocaleString('id-ID') : "••••••••") : "..."}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Tabungan <ChevronRight className="w-3 h-3" />
                </div>
                <p className="text-lg font-bold">Rp {mounted ? MOCK_USER.savings.toLocaleString('id-ID') : "..."}</p>
                <p className="text-[10px] text-white/70">2,5% p.a. cair harian</p>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/60 mb-1">
                  Deposito <ChevronRight className="w-3 h-3" />
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">Rp 0</p>
                  <Badge variant="secondary" className="bg-white/20 text-white text-[8px] px-1.5 py-0">Buka Deposito</Badge>
                </div>
                <p className="text-[10px] text-white/70">Hingga 6% p.a.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="liquid-glass rounded-[2rem] p-6 grid grid-cols-4 gap-y-8 gap-x-2 border-none">
          {mainServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <button key={idx} className="flex flex-col items-center gap-2 group">
                <div className="relative">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm border border-primary/5",
                    service.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {service.badge && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md border border-white shadow-sm">
                      {service.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-accent text-center leading-tight h-8 flex items-center">
                  {service.name}
                </span>
              </button>
            )
          })}
        </section>

        {/* Promo Banner */}
        <section className="relative aspect-[3/1] rounded-3xl overflow-hidden shadow-lg border border-primary/10">
          <Image 
            src="https://picsum.photos/seed/promo/800/266" 
            alt="Promotion" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center px-8">
            <div className="text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Eksklusif</p>
              <h3 className="text-xl font-black italic">TOTAL HADIAH<br/>MILIARAN RUPIAH</h3>
            </div>
          </div>
        </section>

        {/* Flash Deals Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black italic text-accent flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Deposito Flash Deals
            </h3>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="liquid-glass rounded-[2.5rem] p-6 border-none overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
             
             <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
               {/* Deal 1 */}
               <div className="min-w-[200px] bg-white/80 rounded-3xl p-5 border border-primary/10 shadow-sm space-y-4">
                 <div>
                   <p className="text-sm font-bold text-accent">12 bulan</p>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-primary">7%</span>
                     <span className="text-xs font-bold text-primary">p.a.</span>
                   </div>
                   <p className="text-[10px] text-muted-foreground line-through">6% p.a.</p>
                 </div>
                 <div className="space-y-1">
                   <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-3/4" />
                   </div>
                   <p className="text-[10px] font-medium text-muted-foreground">Rp 400 juta ditempatkan</p>
                 </div>
               </div>

               {/* Deal 2 */}
               <div className="min-w-[200px] bg-white/80 rounded-3xl p-5 border border-primary/10 shadow-sm space-y-4">
                 <div>
                   <p className="text-sm font-bold text-accent">6 bulan</p>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-primary">6,5%</span>
                     <span className="text-xs font-bold text-primary">p.a.</span>
                   </div>
                   <p className="text-[10px] text-muted-foreground line-through">5,25% p.a.</p>
                 </div>
                 <div className="space-y-1">
                   <div className="w-full h-1.5 bg-primary/10 rounded-full overflow-hidden">
                     <div className="h-full bg-primary w-1/4" />
                   </div>
                   <p className="text-[10px] font-medium text-muted-foreground">Rp 2 miliar ditempatkan</p>
                 </div>
               </div>
             </div>
          </div>
        </section>
      </main>

      {/* Fixed Bottom Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 max-w-2xl mx-auto">
        <div className="liquid-glass-dark bg-accent/90 border-white/10 rounded-[2.5rem] flex items-center justify-around h-20 shadow-2xl px-2">
          <Link href="/" className="flex flex-col items-center gap-1 group">
            <Home className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-white/90">Beranda</span>
          </Link>
          <Link href="/transfer" className="flex flex-col items-center gap-1 group">
            <Send className="w-6 h-6 text-white/50 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-white/40">Bayar/Transfer</span>
          </Link>
          <div className="relative -mt-12">
            <button className="gold-gradient w-16 h-16 rounded-3xl flex items-center justify-center shadow-[0_12px_24px_-8px_rgba(184,134,11,0.5)] border-4 border-accent">
              <QrCode className="w-8 h-8 text-white" />
            </button>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/40">QRIS</span>
          </div>
          <Link href="/deposits" className="flex flex-col items-center gap-1 group">
            <PiggyBank className="w-6 h-6 text-white/50 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-white/40">Deposito</span>
          </Link>
          <button className="flex flex-col items-center gap-1 group">
            <User className="w-6 h-6 text-white/50 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold text-white/40">Saya</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
