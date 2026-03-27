
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
  ShieldAlert,
  HelpCircle,
  Languages,
  Check,
  Loader2,
  Coins,
  Award,
  Flame,
  ArrowRight
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
import { JsonRpcProvider, formatEther } from "ethers";
import { useLanguage } from "@/context/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";
const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  
  const [mounted, setMounted] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [mainnetEthBalance, setMainnetEthBalance] = useState<string>("0");
  const [aiSynthesizing, setAiSynthesizing] = useState(true);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData, loading: docLoading } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
    }
    const aiTimer = setTimeout(() => setAiSynthesizing(false), 2500);
    return () => clearTimeout(aiTimer);
  }, [user, userLoading, router]);

  const fetchEthBalance = useCallback(async (addr: string) => {
    if (!addr) return;
    try {
      const provider = new JsonRpcProvider(GLOBAL_RPC);
      const balance = await provider.getBalance(addr);
      setMainnetEthBalance(formatEther(balance));
    } catch (err) {
      console.warn("Mainnet balance sync unavailable");
      setMainnetEthBalance("0");
    }
  }, []);

  useEffect(() => {
    if (mounted && userData?.walletAddress) {
      fetchEthBalance(userData.walletAddress);
    }
  }, [mounted, userData?.walletAddress, fetchEthBalance]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const copyAccountNumber = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: t('copied'), description: t('account_copied_msg') });
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

  const balance = userData?.totalBalance ?? 0;
  const savings = userData?.savings ?? 0;
  const accountNumber = userData?.accountNumber || "---";
  const alixBalance = userData?.cryptoBalances?.ALIX ?? 0;

  const mainServices = [
    { name: t('transfer'), icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
    { name: "Top Up", icon: Plus, color: "bg-green-50 text-green-600", href: "/topup" },
    { name: "ALIX Bridge", icon: LogoIcon, color: "gold-gradient text-white", href: "/crypto", badge: "Hot" },
    { name: t('marketplace'), icon: ShoppingBag, color: "bg-amber-50 text-amber-700", href: "/marketplace" },
    { name: "Elite Deposits", icon: PiggyBank, color: "bg-emerald-50 text-emerald-600", href: "/deposits" },
    { name: "Withdraw", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600", href: "/withdraw" },
    { name: "Pay QRIS", icon: QrCode, color: "bg-teal-50 text-teal-600", href: "/topup" },
    { name: t('ai_assistant'), icon: Sparkles, color: "bg-purple-50 text-purple-600", href: "/ai-assistant" },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
        <header className="px-4 md:px-8 pt-4 pb-3 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-primary/5 dark:bg-black/80">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-primary/20 overflow-hidden shadow-lg gold-gradient flex items-center justify-center">
                <Image src={`https://picsum.photos/seed/${user?.uid || '1'}/150/150`} alt="P" fill className="object-cover" />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  {userData?.tier || 'Sovereign Client'} <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                </p>
                <h2 className="font-black text-accent leading-tight text-sm md:text-2xl italic uppercase tracking-tighter dark:text-primary truncate max-w-[100px] md:max-w-none">
                  {userData?.name || "Official Client"}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3">
              <NotificationCenter />
              <Button variant="ghost" size="icon" onClick={handleLogout} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-white/50 border border-primary/5 shadow-sm">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 md:px-8 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            
            {/* ALIX Sovereign Highlight - Standard BNB Utility */}
            <section className="liquid-glass-dark rounded-[2rem] p-6 border-none shadow-2xl relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-10 opacity-5 -rotate-12 group-hover:scale-110 transition-transform"><LogoIcon className="w-48 h-48" /></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <Badge className="bg-primary text-white border-none px-3 py-1 rounded-full font-black uppercase text-[8px] tracking-widest mb-2">
                    SOVEREIGN ASSET • V3 MAINNET
                  </Badge>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
                    Koin <span className="text-primary">ALIX</span>
                  </h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase italic tracking-wider">
                    Official ecosystem fuel for fee discounts & governance.
                  </p>
                </div>
                <div className="flex flex-col items-center md:items-end">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Your Holdings</p>
                  <p className="text-4xl font-black text-white italic tracking-tighter">
                    {alixBalance.toLocaleString('id-ID')} <span className="text-sm">ALIX</span>
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => router.push('/crypto/trade/alix')} className="h-9 px-6 rounded-xl bg-white text-accent font-black uppercase italic text-[9px] shadow-xl hover:bg-primary hover:text-white transition-all">Buy ALIX</Button>
                    <Button onClick={() => router.push('/admin/about-alix')} variant="outline" className="h-9 px-4 rounded-xl border-white/20 text-white font-black uppercase italic text-[9px]">Benefits</Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Real Balance Card */}
            <section className="gold-gradient rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-12 text-white shadow-2xl relative overflow-hidden border border-white/10">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[60px]" />
              <div className="relative z-10 space-y-5 md:space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic">{t('current_liquidity')}</span>
                      <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white bg-white/10 p-1 rounded-md">
                        {showBalance ? <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <EyeOff className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                      </button>
                    </div>
                    <div className="text-xl sm:text-3xl md:text-6xl font-black tracking-tighter italic drop-shadow-2xl leading-tight">
                      Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                     <LogoIcon className="w-12 h-12 md:w-16 md:h-16 text-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 pt-5 md:pt-8 border-t border-white/20">
                  <Link href="/savings" className="space-y-0.5 group/savings flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/60">{t('savings_portfolio')}</p>
                      <ChevronRight className="w-2 h-2 text-white/40 group-hover/savings:translate-x-1 transition-all" />
                    </div>
                    <p className="text-base md:text-xl font-black italic">Rp {savings.toLocaleString('id-ID')}</p>
                  </Link>
                  <div className="space-y-0.5 hidden sm:block">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">{t('yield_realized')}</p>
                    <p className="text-lg md:text-xl font-black italic text-green-300">+ 4.85% p.a.</p>
                  </div>
                  <div className="flex items-center">
                    <button onClick={copyAccountNumber} className="flex flex-col items-start group">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1">
                        {t('account_number')} <Copy className="w-2 h-2" />
                      </p>
                      <p className="text-xs md:text-sm font-black tracking-widest group-hover:text-primary transition-colors">{accountNumber}</p>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Premium Services */}
            <section className="space-y-3">
              <h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2 italic">
                <Grid2X2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {t('premium_services')}
              </h3>
              <div className="liquid-glass rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-8 grid grid-cols-4 gap-3 md:gap-6 border-primary/10 shadow-xl">
                {mainServices.map((service, idx) => (
                  <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-1.5 group text-center active:scale-90 transition-transform">
                    <div className={cn(
                      "w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-md border border-primary/5 relative overflow-hidden",
                      service.color
                    )}>
                      <service.icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                      {service.badge && (
                        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[5px] md:text-[7px] font-black px-1 md:px-2 py-0.5 rounded-full border border-white animate-pulse uppercase">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[7px] md:text-[10px] font-black text-accent uppercase tracking-tighter group-hover:text-primary transition-colors line-clamp-1">
                      {service.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* ALIX Sovereign Benefits - Standard BNB Perks */}
            <section className="liquid-glass-dark rounded-[2rem] p-6 text-white border-none shadow-2xl relative overflow-hidden border-t-4 border-primary">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-primary" />
                <h4 className="text-sm font-black uppercase italic tracking-tighter">ALIX Sovereign Benefits</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><ShoppingBag className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase italic">Marketplace Discount</p>
                    <p className="text-[9px] text-white/50 font-medium">Automatic 5% OFF using ALIX.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all"><Flame className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase italic">Deflationary Protocol</p>
                    <p className="text-[9px] text-white/50 font-medium">Supply burned based on volume.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all"><ShieldCheck className="w-5 h-5" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase italic">On-Chain Verified</p>
                    <p className="text-[9px] text-white/50 font-medium font-mono">Verified V3 Contract.</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')} className="w-full mt-8 h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase italic text-[9px] border border-white/10">
                View Smart Contract <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </section>

            {/* AI Assistant Insight */}
            <section className="liquid-glass rounded-[2rem] p-6 space-y-4 border-primary/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">AliBank Intelligence</h4>
              </div>
              <div className="min-h-[80px] flex flex-col justify-center">
                {aiSynthesizing ? (
                  <div className="space-y-2"><div className="h-2 w-full bg-primary/5 animate-pulse rounded-full" /><div className="h-2 w-3/4 bg-primary/5 animate-pulse rounded-full" /></div>
                ) : (
                  <p className="text-[11px] font-bold italic leading-relaxed text-accent/80">
                    "Memegang ALIX di portofolio Anda memberikan akses eksklusif ke biaya gateway 0% dan bagi hasil marketplace kuartalan."
                  </p>
                )}
              </div>
              <Button onClick={() => router.push('/ai-assistant')} className="w-full h-10 gold-gradient text-white rounded-xl font-black uppercase italic text-[9px] shadow-lg">Full Analysis</Button>
            </section>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
