
"use client";

import { useUser, useDoc, useFirestore } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  ChevronRight, 
  Wallet,
  Bell,
  Copy,
  Eye,
  Send,
  ArrowDownToLine,
  Grid2X2,
  PiggyBank,
  LogOut,
  QrCode,
  EyeOff,
  Bitcoin,
  ShieldCheck,
  Zap,
  Cpu
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
import { LogoIcon } from "@/components/ui/logo";

const mainServices = [
  { name: "Transfer", icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
  { name: "Top Up", icon: Plus, color: "bg-green-50 text-green-600", href: "/topup" },
  { name: "Crypto Bridge", icon: Bitcoin, color: "bg-orange-50 text-orange-600", href: "/crypto", badge: "Live" },
  { name: "E-Wallet", icon: Wallet, color: "bg-amber-50 text-amber-700", href: "/wallets" },
  { name: "Elite Deposits", icon: PiggyBank, color: "bg-green-50 text-green-600", href: "/deposits" },
  { name: "Withdraw", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600" },
  { name: "Pay QRIS", icon: QrCode, color: "bg-teal-50 text-teal-600", href: "/topup" },
  { name: "More", icon: Grid2X2, color: "bg-gray-50 text-gray-600" },
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

  const { data: userData } = useDoc(userDocRef);

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
        title: "Account Copied",
        description: "Number copied to clipboard successfully.",
      });
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
          <LogoIcon className="text-white" />
        </div>
      </div>
    );
  }

  const balance = userData?.totalBalance || 0;
  const savings = userData?.savings || 0;
  const accountNumber = userData?.accountNumber || "---";
  const cryptoBalances = userData?.cryptoBalances || { BTC: 0, ETH: 0, USDT: 0 };

  return (
    <div className="min-h-screen pb-32 bg-background">
      <header className="px-4 pt-6 pb-4 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-primary/5 dark:bg-black/80">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl border-2 border-primary/20 overflow-hidden shadow-sm gold-gradient flex items-center justify-center">
              <Image 
                src={`https://picsum.photos/seed/${user?.uid || '1'}/150/150`} 
                alt="Profile" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Premium Nasabah</p>
              <h2 className="font-bold text-accent leading-tight text-lg dark:text-primary">
                {userData?.name?.split(' ')[0] || "Client"}
              </h2>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5">
              <LogOut className="w-5 h-5 text-accent dark:text-primary" />
            </Button>
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5">
                <Bell className="w-5 h-5 text-accent dark:text-primary" />
              </Button>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                1
              </span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-6">
        <div className="flex items-center justify-between px-2">
           <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1.5 rounded-full text-[9px] uppercase tracking-tighter">
             {userData?.tier || "Platinum Member"}
           </Badge>
           <button 
             onClick={copyAccountNumber}
             className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-black uppercase tracking-widest bg-muted/30 px-4 py-2 rounded-full hover:bg-muted/50 transition-colors"
           >
             No. Rekening: {accountNumber}
             <Copy className="w-3 h-3" />
           </button>
        </div>

        <section className="gold-gradient rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/10">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
          
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Available Balance</span>
                <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl transition-colors">
                  {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <Link href="/transactions">
                <Button size="sm" variant="ghost" className="bg-black/20 text-white rounded-2xl text-[10px] font-black px-5 h-10 hover:bg-black/30 border border-white/10 uppercase tracking-widest">
                  History <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="text-5xl font-black tracking-tighter italic drop-shadow-2xl">
              Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/20">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Savings</p>
                <p className="text-xl font-black">Rp {savings.toLocaleString('id-ID')}</p>
              </div>
              <Link href="/topup" className="flex items-center justify-between bg-white/10 p-4 rounded-2xl hover:bg-white/20 transition-all group">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Manage Funds</p>
                  <p className="text-sm font-black uppercase tracking-wider">Top Up Wallet</p>
                </div>
                <Zap className="w-6 h-6 fill-white group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Crypto Portfolio Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
              <Bitcoin className="w-4 h-4 text-primary" /> Portofolio Kripto
            </h3>
            <Link href="/crypto" className="text-[10px] font-black text-primary uppercase hover:underline">Market <ChevronRight className="w-3 h-3 inline" /></Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="liquid-glass p-4 rounded-3xl border-primary/5 flex flex-col items-center text-center space-y-2">
              <Bitcoin className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase">BTC</p>
                <p className="text-xs font-black text-accent dark:text-primary">{cryptoBalances.BTC.toFixed(6)}</p>
              </div>
            </div>
            <div className="liquid-glass p-4 rounded-3xl border-primary/5 flex flex-col items-center text-center space-y-2">
              <Cpu className="w-6 h-6 text-blue-500" />
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase">ETH</p>
                <p className="text-xs font-black text-accent dark:text-primary">{cryptoBalances.ETH.toFixed(4)}</p>
              </div>
            </div>
            <div className="liquid-glass p-4 rounded-3xl border-primary/5 flex flex-col items-center text-center space-y-2">
              <ShieldCheck className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-[9px] font-black text-muted-foreground uppercase">USDT</p>
                <p className="text-xs font-black text-accent dark:text-primary">{cryptoBalances.USDT.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="liquid-glass rounded-[3rem] p-8 grid grid-cols-4 gap-y-10 gap-x-2 border-primary/10 shadow-sm">
          {mainServices.map((service, idx) => {
            const Icon = service.icon;
            return (
              <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-3 group text-center">
                <div className={cn(
                  "w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 shadow-md border border-primary/5 relative",
                  service.color
                )}>
                  <Icon className="w-7 h-7" />
                  {service.badge && (
                    <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase border-2 border-white dark:border-black animate-pulse">
                      {service.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-black text-accent dark:text-primary leading-tight h-8 flex items-center px-1 uppercase tracking-tighter">
                  {service.name}
                </span>
              </Link>
            )
          })}
        </section>

        <section className="relative overflow-hidden liquid-glass rounded-[2.5rem] p-8 border-primary/20 border-2 group cursor-pointer hover:border-primary/40 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shrink-0 shadow-xl p-3">
              <LogoIcon className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-base font-black text-accent dark:text-primary uppercase tracking-tight mb-1">Security Update</h4>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">Your account is secured with end-to-end encryption and biometrics.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-primary group-hover:translate-x-2 transition-transform" />
          </div>
        </section>
      </main>
    </div>
  );
}
