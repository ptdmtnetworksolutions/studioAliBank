
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
  Cpu,
  Globe,
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Activity,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useAuth } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { BrowserProvider, formatEther } from "ethers";

const mainServices = [
  { name: "Transfer", icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
  { name: "Top Up", icon: Plus, color: "bg-green-50 text-green-600", href: "/topup" },
  { name: "Crypto Bridge", icon: Bitcoin, color: "bg-orange-50 text-orange-600", href: "/crypto", badge: "Live" },
  { name: "Marketplace", icon: ShoppingBag, color: "bg-amber-50 text-amber-700", href: "/marketplace" },
  { name: "Elite Deposits", icon: PiggyBank, color: "bg-emerald-50 text-emerald-600", href: "/deposits" },
  { name: "Withdraw", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600" },
  { name: "Pay QRIS", icon: QrCode, color: "bg-teal-50 text-teal-600", href: "/topup" },
  { name: "AI Insight", icon: Sparkles, color: "bg-purple-50 text-purple-600", href: "/ai-assistant" },
];

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [mainnetEthBalance, setMainnetEthBalance] = useState<string>("0");

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

  const fetchEthBalance = useCallback(async (addr: string) => {
    if (typeof window.ethereum === 'undefined' || !addr) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(addr);
      setMainnetEthBalance(formatEther(balance));
    } catch (err) {
      setMainnetEthBalance("0");
    }
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (typeof window.ethereum !== 'undefined' && mounted && user) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await fetchEthBalance(accounts[0]);
        } else if (userData?.walletAddress) {
          await fetchEthBalance(userData.walletAddress);
        }
      }
    };
    sync();
  }, [mounted, user, userData?.walletAddress, fetchEthBalance]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const copyAccountNumber = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "Account Copied", description: "Nomor rekening berhasil disalin." });
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
          <LogoIcon className="text-white" />
        </div>
      </div>
    );
  }

  const balance = userData?.totalBalance || 0;
  const savings = userData?.savings || 0;
  const accountNumber = userData?.accountNumber || "---";
  
  const cryptoBalances = {
    BTC: userData?.cryptoBalances?.BTC ?? 0,
    ETH: parseFloat(mainnetEthBalance),
    USDT: userData?.cryptoBalances?.USDT ?? 0,
  };

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
      {/* Dynamic Header */}
      <header className="px-4 md:px-8 pt-6 pb-4 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-primary/5 dark:bg-black/80">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl border-2 border-primary/20 overflow-hidden shadow-lg gold-gradient flex items-center justify-center">
              <Image 
                src={`https://picsum.photos/seed/${user?.uid || '1'}/150/150`} 
                alt="Profile" 
                fill 
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                Platinum Private <Globe className="w-3 h-3 animate-spin-slow" />
              </p>
              <h2 className="font-black text-accent leading-tight text-lg md:text-2xl italic uppercase tracking-tighter dark:text-primary">
                {userData?.name || "Client"}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-4">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">System Status</p>
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20 text-[9px] font-black uppercase">Mainnet Online</Badge>
            </div>
            <NotificationCenter />
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5 hover:bg-destructive/10 hover:text-destructive transition-colors">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 md:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Section: Financial Summary & Assets (Mobile Friendly) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Balance Card */}
          <section className="gold-gradient rounded-[3rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-white/10 transition-all hover:shadow-primary/20">
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[80px] group-hover:bg-white/20 transition-all duration-700" />
            <div className="absolute left-10 bottom-10 w-40 h-40 bg-black/10 rounded-full blur-[60px]" />
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic">Current Liquidity Assets</span>
                    <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white bg-white/10 p-2 rounded-xl transition-colors">
                      {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="text-4xl md:text-6xl font-black tracking-tighter italic drop-shadow-2xl">
                    Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
                  </div>
                </div>
                <div className="hidden sm:block">
                   <LogoIcon className="w-16 h-16 text-white/20" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/20">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Savings Portfolio</p>
                  <p className="text-xl font-black italic">Rp {savings.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Yield Realized</p>
                  <p className="text-xl font-black italic text-green-300">+ 4.85%</p>
                </div>
                <div className="flex items-center">
                  <button onClick={copyAccountNumber} className="flex flex-col items-start group">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1 group-hover:text-white transition-colors">
                      Account Number <Copy className="w-3 h-3" />
                    </p>
                    <p className="text-sm font-black tracking-widest group-hover:text-primary transition-colors">{accountNumber}</p>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Services Grid */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2 italic">
                <Grid2X2 className="w-4 h-4 text-primary" /> Premium Services
              </h3>
            </div>
            <div className="liquid-glass rounded-[3rem] p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-primary/10 shadow-xl">
              {mainServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-3 group text-center">
                    <div className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 group-active:scale-95 shadow-md border border-primary/5 relative",
                      service.color
                    )}>
                      <Icon className="w-7 h-7 md:w-8 md:h-8" />
                      {service.badge && (
                        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase border-2 border-white animate-pulse">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-black text-accent leading-tight uppercase tracking-tighter group-hover:text-primary transition-colors">
                      {service.name}
                    </span>
                  </Link>
                )
              })}
            </div>
          </section>

          {/* Asset Clusters */}
          <section className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent italic flex items-center gap-2">
                <Bitcoin className="w-4 h-4 text-primary" /> Multi-Chain Portfolio
              </h3>
              <Link href="/crypto" className="text-[10px] font-black text-primary uppercase hover:underline flex items-center gap-1">
                Analysis <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/crypto" className="liquid-glass p-6 rounded-[2rem] border-primary/5 flex items-center justify-between hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Bitcoin className="w-20 h-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shadow-sm">
                    <Bitcoin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Bitcoin</p>
                    <p className="text-lg font-black text-accent italic">{cryptoBalances.BTC.toFixed(6)} BTC</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </Link>

              <Link href="/crypto" className="liquid-glass p-6 rounded-[2rem] border-primary/5 flex items-center justify-between hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Cpu className="w-20 h-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shadow-sm">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Ethereum</p>
                      {mainnetEthBalance !== "0" && <Badge className="bg-green-600 text-white text-[6px] h-3 px-1">MAINNET</Badge>}
                    </div>
                    <p className="text-lg font-black text-accent italic">{cryptoBalances.ETH.toFixed(4)} ETH</p>
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </Link>

              <Link href="/crypto" className="liquid-glass p-6 rounded-[2rem] border-primary/5 flex items-center justify-between hover:border-primary/30 transition-all group relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck className="w-20 h-20" />
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Tether USD</p>
                    <p className="text-lg font-black text-accent italic">{cryptoBalances.USDT.toLocaleString('id-ID')} USDT</p>
                  </div>
                </div>
                <Activity className="w-5 h-5 text-primary" />
              </Link>
            </div>
          </section>
        </div>

        {/* Right Section: Insights, Security & Sidebar Content (Desktop Layout) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* AI Insight Card */}
          <section className="liquid-glass-dark rounded-[2.5rem] p-8 text-white border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-20 h-20" />
            </div>
            <h4 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 mb-6">
              <LogoIcon className="w-5 h-5 text-primary" /> AliBank Intelligence
            </h4>
            <div className="space-y-6">
              <p className="text-sm font-bold italic leading-relaxed text-white/80">
                "Berdasarkan pola transaksi Anda, mengalokasikan 15% saldo ke **Elite Deposits** bulan ini dapat meningkatkan yield pasif Anda sebesar Rp 450.000."
              </p>
              <Button onClick={() => router.push('/ai-assistant')} className="w-full h-12 gold-gradient text-white rounded-2xl font-black uppercase italic text-[10px] shadow-lg hover:scale-105 transition-all">
                Buka Analisis Lengkap
              </Button>
            </div>
          </section>

          {/* System Security Status */}
          <section className="liquid-glass rounded-[2rem] p-8 space-y-6 border-primary/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" /> Security Layer V3
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-accent uppercase italic">Enkripsi End-to-End</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Seluruh mutasi dana dipantau oleh AI Sentinel 24/7.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-accent uppercase italic">Audit Mainnet Aktif</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Aset kripto Anda disinkronkan secara riil ke blockchain.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Access Sidebar Footer (Desktop Only) */}
          <div className="hidden lg:block liquid-glass rounded-[2rem] p-8 border-none bg-primary/5">
            <p className="text-[10px] font-black uppercase text-accent/40 tracking-[0.2em] mb-4">Official Infrastructure</p>
            <div className="flex flex-col gap-3">
              <Link href="/merchant" className="text-xs font-bold text-accent/60 hover:text-primary transition-colors flex items-center justify-between group">
                Business Console <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/admin" className="text-xs font-bold text-accent/60 hover:text-primary transition-colors flex items-center justify-between group">
                Command Center <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="pt-4 border-t border-primary/5 mt-2">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest text-center">
                  AliBank V3 Production Node • 2024
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
