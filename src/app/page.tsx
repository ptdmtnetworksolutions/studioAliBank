
"use client";

import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Headset, 
  Search, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  LayoutGrid,
  Zap,
  Award,
  Bell,
  Scan,
  User,
  Menu,
  X,
  Landmark,
  HandCoins,
  Trophy,
  ListTodo,
  ShoppingBag,
  Download,
  Users,
  Flame,
  Sparkles,
  Briefcase,
  TrendingUp,
  PieChart,
  Grid3X3,
  CalendarDays,
  UserPlus,
  MessageSquareText,
  Send,
  Gamepad2,
  Dice5,
  RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, Suspense, useCallback, useRef } from "react";
import { doc, collection, query, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import Image from "next/image";

function HandCoinIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M2 19h12c1.5 0 2.5-1 2.5-2.5v-2.5" />
      <path d="M16.5 14h3" />
      <circle cx="20" cy="8" r="4" />
      <path d="M20 6.5 21.5 8 20 9.5 18.5 8z" />
    </svg>
  );
}

// KONFIGURASI HARGA RIIL ALX (Anchor Price V3)
const ALX_PRICE_USD = 12.24;
const USDT_IDR_RATE = 15850;
const ALX_PRICE_IDR = ALX_PRICE_USD * USDT_IDR_RATE; // Rp 194,004

const INITIAL_COINS = [
  { symbol: "ALX", price: ALX_PRICE_USD, baseIdr: ALX_PRICE_IDR, change: 1.14, isUp: true, isNative: true },
  { symbol: "BTC", price: 66262.29, baseIdr: 1125133021, change: -3.76, isUp: false },
  { symbol: "ETH", price: 1987.12, baseIdr: 33741277, change: -3.98, isUp: false },
  { symbol: "SOL", price: 82.63, baseIdr: 1403056, change: -4.69, isUp: false },
  { symbol: "WLD", price: 0.2480, baseIdr: 4211, change: -15.04, isUp: false },
];

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [swiftApi, setSwiftApi] = useState<CarouselApi>();
  const [currentSwiftBanner, setCurrentSwiftBanner] = useState(0);
  const [isTambahDanaOpen, setIsTambahDanaOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bursa' | 'dompet'>('bursa');
  const [marketFilter, setMarketFilter] = useState("Populer");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);
  
  // LIVE MARKET STATE
  const [marketCoins, setMarketCoins] = useState(INITIAL_COINS);

  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 140;

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  // HITUNG TOTAL ESTIMASI NILAI (IDR Balance + ALX Value + USDT Value)
  const totalValueCalculated = useMemo(() => {
    const idrBalance = userData?.totalBalance ?? 0;
    const alxHoldings = userData?.cryptoBalances?.ALX ?? 0;
    const usdtHoldings = userData?.cryptoBalances?.USDT ?? 0;
    
    const alxValueIdr = alxHoldings * ALX_PRICE_IDR;
    const usdtValueIdr = usdtHoldings * USDT_IDR_RATE;
    
    return idrBalance + alxValueIdr + usdtValueIdr;
  }, [userData]);

  const unreadQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
  }, [db, user]);
  const { data: unreadNotifications } = useCollection(unreadQuery);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }

    const savedMode = localStorage.getItem("alibank-active-mode") as 'bursa' | 'dompet';
    const urlTab = searchParams.get('tab') as 'bursa' | 'dompet';

    if (urlTab) {
      setActiveTab(urlTab);
      localStorage.setItem("alibank-active-mode", urlTab);
    } else if (savedMode) {
      setActiveTab(savedMode);
    }

    const savedCurrency = localStorage.getItem("alibank-payment-currency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {}
    }

    if (searchParams.get('open') === 'add_funds') {
      setIsTambahDanaOpen(true);
    }
  }, [user, userLoading, router, searchParams]);

  // MARKET TICKER EFFECT
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setMarketCoins(prev => prev.map(coin => {
        if (coin.symbol === "ALX") return coin; 
        
        const move = (Math.random() * 0.002 - 0.001); 
        const newPrice = coin.price * (1 + move);
        const newChange = coin.change + (Math.random() * 0.1 - 0.05);
        return {
          ...coin,
          price: newPrice,
          change: newChange,
          isUp: newChange >= 0
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (!bannerApi) return;
    bannerApi.on("select", () => {
      setCurrentBanner(bannerApi.selectedScrollSnap());
    });
  }, [bannerApi]);

  useEffect(() => {
    if (!swiftApi) return;
    swiftApi.on("select", () => {
      setCurrentSwiftBanner(swiftApi.selectedScrollSnap());
    });
  }, [swiftApi]);

  const switchTab = useCallback((tab: 'bursa' | 'dompet') => {
    setActiveTab(tab);
    localStorage.setItem("alibank-active-mode", tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/?${params.toString()}`, { scroll: false });
    window.dispatchEvent(new Event('alibank-mode-change'));
  }, [router, searchParams]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet telah disalin ke clipboard." });
    }
  };

  const openAddFunds = () => {
    setIsTambahDanaOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set('open', 'add_funds');
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  const closeAddFunds = (open: boolean) => {
    setIsTambahDanaOpen(open);
    if (!open) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('open');
      router.push(`/?${params.toString()}`, { scroll: false });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && window.scrollY <= 0) {
      const dampedDiff = Math.pow(diff, 0.82);
      setPullY(dampedDiff);
      if (diff > 10 && e.cancelable) e.preventDefault();
    } else {
      setPullY(0);
      isPulling.current = false;
    }
  };

  const handleTouchEnd = () => {
    if (pullY > threshold) {
      setTimeout(() => {
        router.push('/marketplace');
      }, 100);
    }
    isPulling.current = false;
    setPullY(0);
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

  return (
    <div 
      className="min-h-screen bg-background pb-32 text-foreground transition-colors duration-300 relative overflow-x-hidden"
      onTouchStart={activeTab === 'bursa' ? handleTouchStart : undefined}
      onTouchMove={activeTab === 'bursa' ? handleTouchMove : undefined}
      onTouchEnd={activeTab === 'bursa' ? handleTouchEnd : undefined}
    >
      <header className="px-4 h-14 flex items-center sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between gap-1 mb-4 w-full">
          <div className="flex items-center gap-3 flex-1 overflow-hidden">
            {activeTab === 'bursa' ? (
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden cursor-pointer shrink-0 relative"
                  onClick={() => router.push('/profile')}
                >
                  <div className="absolute inset-0 bg-slate-200" />
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-yellow-400" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-3 rounded-t-full bg-slate-400" />
                </div>
                <div 
                  className="relative cursor-pointer shrink-0"
                  onClick={() => router.push('/notifications')}
                >
                  <MessageSquareText className="w-6 h-6 text-foreground" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background px-1">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="p-1 cursor-pointer shrink-0"
                onClick={() => router.push('/settings/wallet')}
              >
                <Menu className="w-6 h-6 text-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex bg-muted/60 p-1 rounded-lg shrink-0">
            <button 
              onClick={() => switchTab('bursa')}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold rounded-md transition-all",
                activeTab === 'bursa' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Bursa
            </button>
            <button 
              onClick={() => switchTab('dompet')}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold rounded-md transition-all",
                activeTab === 'dompet' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              Dompet
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end overflow-hidden">
            <Headset className="w-5 h-5 text-foreground cursor-pointer shrink-0" onClick={() => toast({ title: "Hubungi Bantuan", description: "Layanan asisten AliBank akan segera tersedia." })} />
            {activeTab === 'bursa' ? (
              <div className="cursor-pointer shrink-0" onClick={() => router.push('/topup')}>
                <HandCoinIcon className="w-6 h-6 text-foreground" />
              </div>
            ) : (
              <Scan className="w-5 h-5 text-foreground cursor-pointer shrink-0" onClick={() => toast({ title: "Scanner Aktif", description: "Gunakan untuk memindai alamat dompet AliBank." })} />
            )}
          </div>
        </div>
      </header>

      <div className="px-4 pb-2 sticky top-14 z-40 bg-background/80 backdrop-blur-md">
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={activeTab === 'bursa' ? "ALX pencarian terpopuler" : "Pencarian Teratas: ALX"}
            className="h-10 pl-11 pr-4 bg-muted border-none rounded-md text-xs font-medium placeholder:text-muted-foreground shadow-sm"
          />
        </div>
      </div>

      <main 
        className="px-4 pt-2 space-y-6 will-change-transform"
        style={{ transform: `translateY(${pullY}px)`, transition: isPulling.current ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        {activeTab === 'bursa' ? (
          <div className="animate-in fade-in duration-500 space-y-6">
            <div 
              className="flex flex-col items-center justify-center absolute left-0 right-0 -top-16 mb-4 transition-opacity pointer-events-none"
              style={{ opacity: Math.min(pullY / 60, 1), transform: `scale(${Math.min(0.5 + pullY/140, 1)})` }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-2",
                pullY > threshold ? "bg-primary text-black" : "bg-muted text-muted-foreground"
              )}>
                <ChevronUp className={cn("w-6 h-6 transition-transform", pullY > threshold ? "rotate-180" : "rotate-0")} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic text-center">
                {pullY > threshold ? "Lepaskan untuk Marketplace" : "Seret ke bawah ke Marketplace"}
              </span>
            </div>

            <div className="flex justify-between items-start mb-2 px-1">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-xs font-bold">Estimasi Total Nilai(IDR)</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">
                  Rp{totalValueCalculated.toLocaleString('id-ID')}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-muted-foreground">PNL hari ini</span>
                  <span className="text-green-500">+Rp1.240 (+0.01%)</span>
                  <ChevronDown className="w-3 h-3 text-green-500" />
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 h-10 rounded-lg shadow-none text-xs" onClick={openAddFunds}>
                Tambah Dana
              </Button>
            </div>

            <div className="relative group">
              <Carousel setApi={setBannerApi} className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between shadow-sm relative cursor-pointer h-[100px]" onClick={() => router.push('/profile')}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
                          <Trophy className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Turnamen Referral Bulan Maret</p>
                          <h3 className="text-sm font-black text-foreground leading-tight">Undang Teman, Raih Hadiah 3.000 USDC!</h3>
                        </div>
                      </div>
                      <Button className="bg-muted hover:bg-muted/80 text-foreground font-bold text-[10px] h-8 px-4 rounded-md shadow-none shrink-0">Ikuti</Button>
                    </div>
                  </CarouselItem>
                  <CarouselItem>
                    <div className="bg-card rounded-2xl p-5 border border-border flex items-center justify-between shadow-sm relative cursor-pointer h-[100px]" onClick={() => router.push('/deposits')}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">AliBank Earn</p>
                          <h3 className="text-sm font-black text-foreground leading-tight">Dapatkan Hingga 15% APY di Stablecoin!</h3>
                        </div>
                      </div>
                      <Button className="bg-primary text-primary-foreground font-bold text-[10px] h-8 px-4 rounded-md shadow-none shrink-0">Mulai</Button>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
              <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1].map((i) => (
                  <div key={i} className={cn("h-1 rounded-full transition-all duration-300", currentBanner === i ? "w-4 bg-primary" : "w-1 bg-muted")} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform" onClick={() => router.push('/crypto/market/alx')}>
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogoIcon className="text-primary p-1 w-6 h-6" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-foreground leading-tight italic">Aset ALX</h4>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tight italic">Utilitas & Membership</p>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform" onClick={() => router.push('/p2p/order-history')}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-foreground italic">Order P2P</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground mb-4 italic">Beli/Jual Kripto dengan IDR</p>
                  <div className="flex gap-6 mt-2">
                    <div className="flex flex-col items-center gap-1">
                      <Users className="w-5 h-5 text-foreground" />
                      <span className="text-[9px] font-bold italic">P2P</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Search className="w-5 h-5 text-foreground" />
                      <span className="text-[9px] font-bold text-center leading-tight italic">Temukan<br/>Penawaran</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-40 relative group active:scale-[0.98] transition-transform">
                <Carousel setApi={setSwiftApi} className="w-full h-full">
                  <CarouselContent>
                    <CarouselItem>
                      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer" onClick={() => router.push('/crypto/deposit-methods?type=setor')}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center font-black text-[10px] text-primary-foreground">$</div>
                            <span className="text-xs font-bold text-foreground">USD</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                          <Badge className="bg-blue-500/10 text-blue-500 text-[8px] font-black h-4 px-1.5 mb-2 border-none uppercase">Setor</Badge>
                          <h4 className="text-sm font-black text-foreground leading-tight italic">Transfer Bank (SWIFT)</h4>
                        </div>
                      </div>
                    </CarouselItem>
                    <CarouselItem>
                      <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer" onClick={() => router.push('/crypto/deposit-methods?type=tarik')}>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center font-black text-[10px] text-primary-foreground">$</div>
                            <span className="text-xs font-bold text-foreground">USD</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                        </div>
                        <div>
                          <Badge className="bg-rose-500/10 text-rose-500 text-[8px] font-black h-4 px-1.5 mb-2 border-none uppercase">Tarik</Badge>
                          <h4 className="text-sm font-black text-foreground leading-tight italic">Transfer Bank (SWIFT)</h4>
                        </div>
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                  {[0, 1].map((i) => (
                    <div key={i} className={cn("h-1 rounded-full transition-all duration-300", currentSwiftBanner === i ? "w-3 bg-primary" : "w-1 bg-muted")} />
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer group active:scale-[0.98] transition-transform" onClick={() => router.push('/crypto/cash-delivery')}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-foreground italic">Kirim Tunai</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-1 transition-transform" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground mt-2 leading-tight italic">Kirim Kripto dan Terima Fiat</p>
                  <div className="mt-4">
                    <p className="text-[8px] font-bold text-muted-foreground uppercase italic">Kurs Ref.</p>
                    <p className="text-xs font-black text-foreground italic">Rp17,052</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-2 gap-6">
                {["Favorit", "Populer", "Alpha", "Baru", "Game"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMarketFilter(tab)}
                    className={cn(
                      "text-sm font-bold transition-all shrink-0",
                      marketFilter === tab ? "text-foreground border-b-2 border-primary pb-1" : "text-muted-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {marketFilter !== 'Game' ? (
                <>
                  <div className="grid grid-cols-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                    <span>Nama</span>
                    <span className="text-right">Harga Terakhir</span>
                    <span className="text-right">Prbh% 24j</span>
                  </div>
                  <div className="space-y-6">
                    {marketCoins.map((coin) => (
                      <div key={coin.symbol} className="grid grid-cols-3 items-center group cursor-pointer active:opacity-70 transition-opacity" onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black italic tracking-tight text-foreground">{coin.symbol}</span>
                          {coin.isNative ? (
                            <div className="w-4 h-4 bg-primary/20 text-primary rounded flex items-center justify-center text-[7px] font-black">V3</div>
                          ) : (
                            <Flame className="w-3.5 h-3.5 text-orange-500" />
                          )}
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-sm font-black italic tracking-tight text-foreground">
                            {coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground">Rp{coin.baseIdr.toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex justify-end">
                          <div className={cn(
                            "w-20 py-1.5 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-sm transition-colors duration-500",
                            coin.isUp ? "bg-green-500 text-white" : "bg-rose-500 text-white"
                          )}>
                            {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {[
                    { id: 'tradex', name: "Trade-X Pro", desc: "Prediksi Kecepatan Tinggi", icon: Zap, href: "/crypto/trade-pro/alx", badge: "POPULER", color: "text-primary" },
                    { id: 'reward', name: "Hub Reward", desc: "Selesaikan Tugas, Dapat ALX", icon: Award, href: "/profile", badge: "NEW", color: "text-blue-500" },
                    { id: 'earn', name: "AliBank Earn", desc: "Staking & Deposito Elit", icon: TrendingUp, href: "/deposits", badge: "HIGH APY", color: "text-green-500" },
                    { id: 'alispin', name: "Ali-Spin Pro", desc: "Angka Acak Keberuntungan", icon: RotateCw, href: "/games/spin", badge: "BARU", color: "text-orange-500" },
                  ].map((game) => (
                    <div 
                      key={game.id} 
                      className="flex items-center justify-between group cursor-pointer active:opacity-70 transition-opacity"
                      onClick={() => router.push(game.href)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border shadow-sm", game.color)}>
                          <game.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black italic uppercase tracking-tight text-foreground">{game.name}</span>
                            <Badge className="bg-primary/10 text-primary text-[7px] font-black h-4 px-1.5 border-none uppercase">{game.badge}</Badge>
                          </div>
                          <p className="text-[10px] font-bold text-muted-foreground italic mt-0.5">{game.desc}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-10 duration-500 space-y-6 pb-10">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/settings/wallet')}>
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center p-1">
                  <LogoIcon className="text-white" />
                </div>
                <span className="text-sm font-black text-foreground italic uppercase tracking-tighter">AliBank Native</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              <button onClick={copyAddress} className="p-1 hover:bg-muted rounded transition-colors">
                <Copy className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex justify-between items-center px-1">
              <h1 className="text-5xl font-black tracking-tighter text-foreground italic">
                Rp{totalValueCalculated.toLocaleString('id-ID')}
              </h1>
              <div className="flex gap-2">
                <Button 
                  onClick={() => router.push('/crypto/send')}
                  variant="outline"
                  className="border-primary/20 text-primary font-black px-6 h-11 rounded-lg shadow-none text-sm italic uppercase"
                >
                  Kirim
                </Button>
                <Button 
                  onClick={() => router.push('/crypto/receive')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-6 h-11 rounded-lg border-none shadow-none text-sm italic uppercase"
                >
                  Terima
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                { name: "Alpha", icon: CalendarDays, href: "/crypto/market/btc" },
                { name: "Sekuritas", icon: TrendingUp, href: "/crypto" },
                { name: "Earn", icon: Briefcase, href: "/deposits" },
                { name: "Referral", icon: UserPlus, href: "/profile" },
                { name: "Lainnya", icon: Grid3X3, href: "/marketplace" },
              ].map((service, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => router.push(service.href)}>
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center shadow-sm group-active:scale-95 transition-transform">
                    <service.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground italic">{service.name}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#1E2329] dark:bg-card border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl cursor-pointer active:scale-[0.98] transition-transform" onClick={() => router.push('/marketplace')}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center p-2">
                  <LogoIcon className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white italic leading-tight">Berbagi 35 Juta KAT bersama Katana</h3>
                </div>
              </div>
              <Button className="bg-primary text-primary-foreground font-black text-[10px] h-8 px-4 rounded-md shadow-none uppercase italic">Ikuti</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-2xl p-5 border border-border flex flex-col justify-between h-36 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => router.push('/marketplace')}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-tight italic">Meme Rush</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-xl font-black text-foreground italic tracking-tighter leading-none">2,53K</p>
                  <p className="text-[9px] font-bold text-muted-foreground mt-1 uppercase italic">token baru dalam 1 jam</p>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[6px] text-white font-bold">B</div>
                  <div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-[6px] text-white font-bold">T</div>
                  <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[6px] text-white font-bold">E</div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-2xl p-5 border border-border flex flex-col justify-between h-36 cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => router.push('/deposits')}>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-tight italic">Earn</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-xl font-black text-green-500 italic tracking-tighter leading-none">8.58% <span className="text-[10px]">APY</span></p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full bg-slate-200 border border-border flex items-center justify-center overflow-hidden">
                      <LogoIcon className="text-black p-0.5" />
                    </div>
                    <span className="text-[10px] font-black text-foreground italic">WETH</span>
                  </div>
                </div>
                <div className="h-6 w-full mt-2">
                  <svg viewBox="0 0 100 40" className="w-full h-full opacity-30">
                    <path d="M0 35 L 20 25 L 40 30 L 60 15 L 80 20 L 100 5" fill="none" stroke="#16a34a" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-2">
                {["Daftar Pantauan", "Pencarian Populer", "Sedang Tren"].map((tab) => (
                  <button
                    key={tab}
                    className={cn(
                      "text-sm font-black transition-all shrink-0 uppercase tracking-tight italic",
                      tab === "Pencarian Populer" ? "text-foreground text-base underline decoration-primary decoration-2 underline-offset-8" : "text-muted-foreground"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                {["Semua", "BSC", "Solana", "Ethereum"].map((net) => (
                  <button key={net} className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors shrink-0 italic">{net}</button>
                ))}
                <div className="flex items-center gap-1 text-xs font-bold text-muted-foreground ml-auto shrink-0 cursor-pointer">
                  1j <ChevronDown className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-6">
                {marketCoins.slice(0, 3).map((asset, i) => (
                  <div key={i} className="flex items-center justify-between group cursor-pointer active:opacity-70 transition-opacity" onClick={() => router.push(`/crypto/market/${asset.symbol.toLowerCase()}`)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center p-1 relative">
                        <div className="w-10 h-10 rounded-full gold-gradient p-2">
                          <LogoIcon className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-primary flex items-center justify-center">
                          <LogoIcon className="text-primary-foreground p-0.5" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-foreground italic uppercase tracking-tighter">{asset.symbol}</span>
                          <div className="w-4 h-4 bg-green-500/10 text-green-500 rounded flex items-center justify-center text-[8px] font-black">AI</div>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase italic">
                          <span>Vol Rp6,24B</span>
                          <span className="opacity-30">|</span>
                          <span>Cap Rp16,6B</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground italic tracking-tighter">{asset.price.toFixed(2)}</p>
                      <p className={cn("text-[10px] font-black italic", asset.isUp ? "text-green-500" : "text-rose-500")}>{asset.change.toFixed(2)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => router.push('/ai-assistant')}
          className="w-14 h-14 gold-gradient rounded-2xl shadow-[0_15px_30px_rgba(252,213,53,0.3)] flex items-center justify-center text-primary-foreground active:scale-90 transition-transform group"
        >
          <Card className="border-none bg-transparent shadow-none"><Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" /></Card>
        </button>
      </div>

      <Sheet open={isTambahDanaOpen} onOpenChange={closeAddFunds}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-8">
            <div className="flex items-center justify-between">
              <SheetHeader>
                <SheetTitle className="text-xl font-black text-foreground tracking-tight italic uppercase">Tambah Dana</SheetTitle>
                <SheetDescription className="sr-only">Pilih metode penambahan dana.</SheetDescription>
              </SheetHeader>
              <div 
                className="flex items-center gap-1.5 bg-muted px-2.5 py-1.5 rounded-full border border-border cursor-pointer"
                onClick={() => { router.push('/settings/payment-currency'); }}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white",
                  selectedCurrency.color
                )}>
                  {selectedCurrency.symbol.length > 2 ? selectedCurrency.code[0] : selectedCurrency.symbol}
                </div>
                <span className="text-xs font-black text-foreground">{selectedCurrency.code}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <div 
                className="p-6 rounded-[1.5rem] border border-border bg-card flex items-center gap-5 active:bg-muted/50 transition-all cursor-pointer group shadow-sm"
                onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/buy'); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground italic uppercase tracking-tight leading-none">Beli dengan {selectedCurrency.code}</h3>
                  <p className="text-xs font-bold text-muted-foreground mt-1.5 leading-tight italic">Manfaatkan berbagai cara pembayaran!</p>
                </div>
              </div>

              <div 
                className="p-6 rounded-[1.5rem] border border-border bg-card flex items-center gap-5 active:bg-muted/50 transition-all cursor-pointer group shadow-sm"
                onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/receive'); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground italic uppercase tracking-tight leading-none">Penyetoran On-Chain</h3>
                  <p className="text-xs font-bold text-muted-foreground mt-1.5 leading-tight italic">Setor kripto dari bursa/dompet lain ke AliBank</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
