
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
  Coins
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

  const mainServices = [
    { name: t('transfer'), icon: Send, color: "bg-blue-50 text-blue-600", href: "/transfer" },
    { name: "Top Up", icon: Plus, color: "bg-green-50 text-green-600", href: "/topup" },
    { name: "Crypto Bridge", icon: Bitcoin, color: "bg-orange-50 text-orange-600", href: "/crypto", badge: "Live" },
    { name: t('marketplace'), icon: ShoppingBag, color: "bg-amber-50 text-amber-700", href: "/marketplace" },
    { name: "Elite Deposits", icon: PiggyBank, color: "bg-emerald-50 text-emerald-600", href: "/deposits" },
    { name: "Withdraw", icon: ArrowDownToLine, color: "bg-indigo-50 text-indigo-600", href: "/withdraw" },
    { name: "Pay QRIS", icon: QrCode, color: "bg-teal-50 text-teal-600", href: "/topup" },
    { name: t('ai_assistant'), icon: Sparkles, color: "bg-purple-50 text-purple-600", href: "/ai-assistant" },
  ];

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
      console.warn("Mainnet balance sync unavailable via home-node");
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
      const num = userData.accountNumber;
      navigator.clipboard.writeText(num);
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
  
  const cryptoBalances = {
    ALIX: userData?.cryptoBalances?.ALIX ?? 0,
    BTC: userData?.cryptoBalances?.BTC ?? 0,
    ETH: parseFloat(mainnetEthBalance),
    USDT: userData?.cryptoBalances?.USDT ?? 0,
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
        {/* Header - Production Standards */}
        <header className="px-4 md:px-8 pt-4 pb-3 bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-primary/5 dark:bg-black/80">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl border-2 border-primary/20 overflow-hidden shadow-lg gold-gradient flex items-center justify-center">
                <Image 
                  src={`https://picsum.photos/seed/${user?.uid || '1'}/150/150`} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              </div>
              <div>
                <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                  {t('platinum_private')} <ShieldCheck className="w-2.5 h-2.5 text-primary" />
                </p>
                <h2 className="font-black text-accent leading-tight text-sm md:text-2xl italic uppercase tracking-tighter dark:text-primary truncate max-w-[100px] md:max-w-none">
                  {userData?.name || "Official Client"}
                </h2>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="hidden md:flex flex-col items-end mr-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('system_status')}</p>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600/20 text-[9px] font-black uppercase flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-green-600 animate-ping" /> {t('mainnet_online')}
                </Badge>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5">
                    <Languages className="w-4 h-4 md:w-5 md:h-5 text-accent dark:text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl liquid-glass border-primary/10 p-2">
                  <DropdownMenuItem onClick={() => setLanguage('id')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                    Indonesia {language === 'id' && <Check className="w-3 h-3 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-xl flex justify-between gap-4 font-bold text-xs">
                    English {language === 'en' && <Check className="w-3 h-3 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <NotificationCenter />
              <Button variant="ghost" size="icon" onClick={handleLogout} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 md:px-8 pt-4 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            {/* Real Balance Card */}
            <section className="gold-gradient rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-12 text-white shadow-2xl relative overflow-hidden group border border-white/10 transition-all hover:shadow-primary/20">
              <div className="absolute -right-20 -top-20 w-64 h-64 md:w-80 md:h-80 bg-white/10 rounded-full blur-[60px] md:blur-[80px] group-hover:bg-white/20 transition-all duration-700" />
              
              <div className="relative z-10 space-y-5 md:space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] md:text-[11px] font-black text-white/80 uppercase tracking-widest italic">{t('current_liquidity')}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-3.5 h-3.5 text-white/40 cursor-help hover:text-white transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                          <p className="text-[10px] font-bold">Saldo IDR riil Anda yang diamankan di Ledger Internal AliBank V3.</p>
                        </TooltipContent>
                      </Tooltip>
                      <button onClick={() => setShowBalance(!showBalance)} className="text-white/60 hover:text-white bg-white/10 p-1 rounded-md transition-colors ml-1">
                        {showBalance ? <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" /> : <EyeOff className="w-3.5 h-3.5 md:w-5 md:h-5" />}
                      </button>
                    </div>
                    {docLoading ? (
                      <div className="h-12 w-48 bg-white/10 animate-pulse rounded-xl" />
                    ) : (
                      <div className="text-xl sm:text-3xl md:text-6xl font-black tracking-tighter italic drop-shadow-2xl overflow-hidden text-ellipsis whitespace-nowrap leading-tight">
                        Rp {showBalance ? balance.toLocaleString('id-ID') : "••••••••"}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                     <LogoIcon className="w-12 h-12 md:w-16 md:h-16 text-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 pt-5 md:pt-8 border-t border-white/20">
                  <Link href="/savings" className="space-y-0.5 group/savings transition-transform active:scale-95 flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/60 group-hover/savings:text-white transition-colors">{t('savings_portfolio')}</p>
                      <ChevronRight className="w-2 h-2 md:w-2.5 md:h-2.5 text-white/40 group-hover/savings:text-white group-hover/savings:translate-x-1 transition-all" />
                    </div>
                    <p className="text-base md:text-xl font-black italic">Rp {savings.toLocaleString('id-ID')}</p>
                  </Link>
                  <div className="space-y-0.5 hidden sm:block">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">{t('yield_realized')}</p>
                    <p className="text-lg md:text-xl font-black italic text-green-300">+ 4.85% p.a.</p>
                  </div>
                  <div className="flex items-center">
                    <button onClick={copyAccountNumber} className="flex flex-col items-start group active:scale-95 transition-transform">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1 group-hover:text-white transition-colors">
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
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2 italic">
                  <Grid2X2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {t('premium_services')}
                </h3>
              </div>
              <div className="liquid-glass rounded-[1.5rem] md:rounded-[3rem] p-4 md:p-8 grid grid-cols-4 gap-3 md:gap-6 border-primary/10 shadow-xl">
                {mainServices.map((service, idx) => {
                  const Icon = service.icon;
                  return (
                    <Link key={idx} href={service.href || "#"} className="flex flex-col items-center gap-1.5 group text-center active:scale-90 transition-transform">
                      <div className={cn(
                        "w-11 h-11 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-[1rem] md:rounded-[2rem] flex items-center justify-center transition-all group-hover:scale-110 shadow-md border border-primary/5 relative",
                        service.color
                      )}>
                        <Icon className="w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                        {service.badge && (
                          <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[5px] md:text-[7px] font-black px-1 md:px-2 py-0.5 rounded-full uppercase border border-white animate-pulse">
                            {service.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[7px] md:text-[10px] font-black text-accent leading-tight uppercase tracking-tighter group-hover:text-primary transition-colors line-clamp-1">
                        {service.name}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </section>

            {/* Real-time Multi-Chain Portfolio */}
            <section className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[9px] md:text-xs font-black uppercase tracking-widest text-accent italic flex items-center gap-2">
                  <Bitcoin className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" /> {t('multi_chain_portfolio')}
                </h3>
                <Link href="/crypto" className="text-[8px] md:text-[10px] font-black text-primary uppercase hover:underline flex items-center gap-1">
                  Analysis <ChevronRight className="w-2.5 h-2.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                {[
                  { name: 'AliBank', symbol: 'ALIX', amount: cryptoBalances.ALIX.toLocaleString('id-ID'), icon: LogoIcon, color: "gold-gradient text-white", sovereign: true },
                  { name: 'Bitcoin', symbol: 'BTC', amount: cryptoBalances.BTC.toFixed(6), icon: Bitcoin, color: "bg-orange-50 text-orange-500", type: "Ali-Bridge" },
                  { name: 'Ethereum', symbol: 'ETH', amount: cryptoBalances.ETH.toFixed(4), icon: Cpu, color: "bg-blue-50 text-blue-500", mainnet: true },
                  { name: 'Tether USD', symbol: 'USDT', amount: cryptoBalances.USDT.toLocaleString('id-ID'), icon: ShieldCheck, color: "bg-green-50 text-green-500", type: "Internal" }
                ].map((coin, idx) => (
                  <Link key={idx} href="/crypto" className="liquid-glass p-3.5 md:p-6 rounded-[1.25rem] md:rounded-[2rem] border-primary/5 flex items-center justify-between hover:border-primary/30 transition-all group relative overflow-hidden active:scale-[0.98]">
                    <div className="absolute -right-2 -bottom-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <coin.icon className="w-12 h-12 md:w-16 md:h-16" />
                    </div>
                    <div className="flex items-center gap-3 md:gap-4 relative z-10">
                      <div className={cn("w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center shadow-sm", coin.color, coin.sovereign && "p-2")}>
                        <coin.icon className="w-4 h-4 md:w-6 md:h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-[7px] md:text-[10px] font-black text-muted-foreground uppercase">{coin.name}</p>
                          {coin.mainnet && <Badge className="bg-green-600 text-white text-[4px] md:text-[5px] h-2.5 px-1 leading-none">MAINNET</Badge>}
                          {coin.sovereign && <Badge className="bg-orange-600 text-white text-[4px] md:text-[5px] h-2.5 px-1 leading-none uppercase">Native</Badge>}
                        </div>
                        <p className="text-sm md:text-lg font-black text-accent italic">{coin.amount} {coin.symbol}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            {/* AI Intelligence Card - Synthetic Look */}
            <section className="liquid-glass-dark rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 text-white border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="w-12 h-12 md:w-20 md:h-20" />
              </div>
              <div className="flex items-center gap-2 mb-3 md:mb-6">
                <h4 className="text-[10px] md:text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                  <LogoIcon className="w-3.5 h-3.5 md:w-5 md:h-5 text-primary" /> AliBank Intelligence
                </h4>
              </div>
              <div className="space-y-4 md:space-y-6 min-h-[120px] flex flex-col justify-center">
                {aiSynthesizing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Synthesizing Ledger...</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full gold-gradient w-1/2 animate-infinite-scroll" />
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] md:text-sm font-bold italic leading-relaxed text-white/80 animate-in fade-in duration-700">
                    "Analisis mutasi ledger terbaru menunjukkan efisiensi tinggi. Alokasi 15% dari likuiditas harian Anda ke **Elite Deposits** dapat mengoptimalkan bagi hasil riil sebesar Rp 450.000 bulan ini."
                  </p>
                )}
                <Button onClick={() => router.push('/ai-assistant')} className="w-full h-10 md:h-12 gold-gradient text-white rounded-xl md:rounded-2xl font-black uppercase italic text-[8px] md:text-[10px] shadow-lg hover:scale-105 active:scale-95 transition-all">
                  Buka Analisis Lengkap
                </Button>
              </div>
            </section>

            {/* Official Security Info */}
            <section className="liquid-glass rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 space-y-4 md:space-y-6 border-primary/10">
              <div className="flex items-center gap-2">
                <h4 className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                  <ShieldAlert className="w-3 md:w-4 md:h-4 text-primary" /> {t('security_layer')}
                </h4>
              </div>
              <div className="space-y-3 md:space-y-4">
                {[
                  { title: "Enkripsi End-to-End", desc: "Mutasi dana dipantau AI Sentinel secara riil.", icon: Zap, color: "bg-primary/10 text-primary" },
                  { title: "Audit Mainnet Aktif", desc: "Aset disinkronkan ke blockchain setiap 15 detik.", icon: Activity, color: "bg-green-50 text-green-600" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 md:gap-4">
                    <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0", item.color)}>
                      <item.icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] md:text-[11px] font-black text-accent uppercase italic leading-tight">{item.title}</p>
                      <p className="text-[7px] md:text-[10px] text-muted-foreground font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Official Infrastructure Links */}
            <div className="liquid-glass rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 border-none bg-primary/5">
              <p className="text-[7px] md:text-[10px] font-black uppercase text-accent/40 tracking-[0.2em] mb-2 md:mb-4">Official Infrastructure</p>
              <div className="flex flex-col gap-1.5 md:gap-3">
                <Link href="/merchant" className="text-[9px] md:text-xs font-bold text-accent/60 hover:text-primary transition-colors flex items-center justify-between group py-1 active:bg-primary/5 px-2 rounded-lg -mx-2">
                  {t('merchant_console')} <ChevronRight className="w-2 h-2 md:w-3 md:h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/admin" className="text-[9px] md:text-xs font-bold text-accent/60 hover:text-primary transition-colors flex items-center justify-between group py-1 active:bg-primary/5 px-2 rounded-lg -mx-2">
                  {t('command_center')} <ChevronRight className="w-2 h-2 md:w-3 md:h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
                <div className="pt-3 md:pt-4 border-t border-primary/5 mt-1 md:mt-2">
                  <p className="text-[6px] md:text-[8px] font-black uppercase text-muted-foreground tracking-widest text-center">
                    AliBank V3 Production Node • 2026
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
