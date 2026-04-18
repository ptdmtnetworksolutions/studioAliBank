
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
  RotateCw,
  Info,
  TrendingDown,
  ArrowUpDown,
  Loader2,
  ShieldAlert,
  Skull,
  HandCoins,
  CheckCircle2,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
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
import { AlphaMarketView } from "@/components/crypto/AlphaMarketView";

const ALX_PRICE_IDR = 194004;
const DEFAULT_USDT_IDR_RATE = 15850;
const MARKUP = 1.02;

const INITIAL_COINS = [
  { symbol: "ALX", price: 12.24, baseIdr: 194004, change: 1.14, isUp: true, isNative: true },
  { symbol: "BTC", price: 66262.29, baseIdr: 1125133021, change: -3.76, isUp: false },
  { symbol: "ETH", price: 1987.12, baseIdr: 33741277, change: -3.98, isUp: false },
  { symbol: "SOL", price: 82.63, baseIdr: 1403056, change: -4.69, isUp: false },
  { symbol: "BNB", price: 582.41, baseIdr: 9231200, change: -2.14, isUp: false },
];

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isPnlOpen, setIsPnlOpen] = useState(false);
  
  const [marketCoins, setMarketCoins] = useState(INITIAL_COINS);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(DEFAULT_USDT_IDR_RATE);

  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const threshold = 140;

  // Real-time Data Definitions
  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(200)) : null), [db, user]);
  const { data: userTxs } = useCollection(txQuery);

  const pendingTopupQuery = useMemoFirebase(() => (db && user ? query(collection(db, "topup_requests"), where("userId", "==", user.uid), where("status", "==", "pending")) : null), [db, user]);
  const { data: pendingTopups } = useCollection(pendingTopupQuery);

  const notificationsQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "notifications"), where("read", "==", false)) : null), [db, user]);
  const { data: unreadNotifications } = useCollection(notificationsQuery);

  const currentUsdtRate = useMemo(() => dynamicUsdtRate || DEFAULT_USDT_IDR_RATE, [dynamicUsdtRate]);

  const totalValueCalculated = useMemo(() => {
    const idrBalance = userData?.totalBalance ?? 0;
    const alxHoldings = userData?.cryptoBalances?.ALX ?? 0;
    const usdtHoldings = userData?.cryptoBalances?.USDT ?? 0;
    const btcHoldings = userData?.cryptoBalances?.BTC ?? 0;
    const ethHoldings = userData?.cryptoBalances?.ETH ?? 0;
    
    const alxMarket = marketCoins.find(c => c.symbol === "ALX");
    const btcMarket = marketCoins.find(c => c.symbol === "BTC");
    const ethMarket = marketCoins.find(c => c.symbol === "ETH");
    
    const alxPriceIdr = (alxMarket?.price ?? 12.24) * currentUsdtRate;
    const btcPriceIdr = (btcMarket?.price ?? 66000) * currentUsdtRate;
    const ethPriceIdr = (ethMarket?.price ?? 2000) * currentUsdtRate;
    
    return idrBalance + (alxHoldings * alxPriceIdr) + (usdtHoldings * currentUsdtRate) + (btcHoldings * btcPriceIdr) + (ethHoldings * ethPriceIdr);
  }, [userData, marketCoins, currentUsdtRate]);

  const debtInfo = useMemo(() => {
    if (!userData || !userTxs) return { illegalDebtIdr: 0, cryptoDebts: [], pendingDebt: 0, hasDebt: false };

    const idrInflow = userTxs.filter(t => t.type === 'income' && t.amount).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrOutflow = userTxs.filter(t => t.type === 'expense' && t.amount).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrLedger = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (userData.totalBalance || 0) - idrLedger);

    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    const cryptoDebts: any[] = [];
    assets.forEach(asset => {
      const cryptoIn = userTxs.filter(t => t.type === 'income' && t.cryptoCurrency === asset).reduce((acc, t) => acc + (t.cryptoAmount || t.toAmount || 0), 0);
      const cryptoOut = userTxs.filter(t => t.type === 'expense' && t.cryptoCurrency === asset).reduce((acc, t) => acc + (t.cryptoAmount || t.fromAmount || 0), 0);
      const cryptoLedger = cryptoIn - cryptoOut;
      const cryptoActual = userData.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, cryptoActual - cryptoLedger);
      if (diff > 0.000001) {
        cryptoDebts.push({ asset, amount: diff });
      }
    });

    const pendingDebt = pendingTopups?.reduce((acc, curr) => acc + (curr.totalToTransfer || curr.amount || 0), 0) || 0;

    return {
      illegalDebtIdr,
      cryptoDebts,
      pendingDebt,
      hasDebt: illegalDebtIdr > 1000 || cryptoDebts.length > 0 || pendingDebt > 0
    };
  }, [userData, userTxs, pendingTopups]);

  const pnlData = useMemo(() => {
    const alxHoldings = userData?.cryptoBalances?.ALX ?? 0;
    const usdtHoldings = userData?.cryptoBalances?.USDT ?? 0;
    const btcHoldings = userData?.cryptoBalances?.BTC ?? 0;
    const ethHoldings = userData?.cryptoBalances?.ETH ?? 0;
    
    const alxMarket = marketCoins.find(c => c.symbol === "ALX");
    const btcMarket = marketCoins.find(c => c.symbol === "BTC");
    const ethMarket = marketCoins.find(c => c.symbol === "ETH");
    const usdtMarket = marketCoins.find(c => c.symbol === "USDT") || { change: 0.01 };

    const alxPriceIdr = (alxMarket?.price ?? 12.24) * currentUsdtRate;
    const btcPriceIdr = (btcMarket?.price ?? 66000) * currentUsdtRate;
    const ethPriceIdr = (ethMarket?.price ?? 2000) * currentUsdtRate;

    const alxPnl = (alxHoldings * alxPriceIdr * (alxMarket?.change ?? 0)) / 100;
    const usdtPnl = (usdtHoldings * currentUsdtRate * (usdtMarket.change ?? 0)) / 100;
    const btcPnl = (btcHoldings * btcPriceIdr * (btcMarket?.change ?? 0)) / 100;
    const ethPnl = (ethHoldings * ethPriceIdr * (ethMarket?.change ?? 0)) / 100;
    
    const totalPnl = alxPnl + usdtPnl + btcPnl + ethPnl;
    const pnlPercent = totalValueCalculated > 0 ? (totalPnl / totalValueCalculated) * 100 : 0;

    return {
      total: totalPnl,
      percent: pnlPercent,
      isUp: totalPnl >= 0,
      breakdown: {
        alx: alxPnl,
        usdt: usdtPnl,
        btc: btcPnl,
        eth: ethPnl
      }
    };
  }, [userData, marketCoins, totalValueCalculated, currentUsdtRate]);

  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "USDTIDRT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Market sync failed via Proxy');
      const data = await res.json();

      const formatted = data.map((item: any) => {
        let symbol = item.symbol.replace("USDT", "").replace("IDR", "").replace("IDRT", "");
        if (symbol === "") symbol = "USDT";
        let price = parseFloat(item.lastPrice);
        if (item.symbol === "USDTIDRT") setDynamicUsdtRate(price);
        price = price * MARKUP;
        return {
          symbol: symbol,
          price: symbol === "USDT" ? 1 : price,
          change: parseFloat(item.priceChangePercent) || 0,
          isUp: (parseFloat(item.priceChangePercent) || 0) >= 0,
          baseIdr: symbol === "USDT" ? price : price * (data.find((d:any) => d.symbol === "USDTIDRT")?.lastPrice || DEFAULT_USDT_IDR_RATE)
        };
      });

      const currentUsdtPrice = parseFloat(data.find((d:any) => d.symbol === "USDTIDRT")?.lastPrice || DEFAULT_USDT_IDR_RATE);
      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxData = {
        symbol: "ALX",
        price: alxPrice,
        baseIdr: alxPrice * currentUsdtPrice,
        change: 1.14 + (Math.random() * 0.05),
        isUp: true,
        isNative: true
      };

      setMarketCoins([alxData, ...formatted.filter((c: any) => c.symbol !== "USDT" && c.symbol !== "IDR" && c.symbol !== "IDRT")].slice(0, 5));
    } catch (e) {
      setIsMarketLoading(false);
    } finally {
      setIsMarketLoading(false);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setMarketCoins(prev => prev.map(coin => {
        const moveFactor = coin.symbol === "ALX" ? 0.0001 : 0.0003;
        const move = (Math.random() * moveFactor * 2 - moveFactor); 
        const newPrice = coin.price * (1 + move);
        return {
          ...coin,
          price: newPrice,
          baseIdr: newPrice * currentUsdtRate,
          change: (coin.change ?? 0) + (Math.random() * 0.02 - 0.01)
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [mounted, currentUsdtRate]);

  useEffect(() => {
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
    if (searchParams.get('open') === 'add_funds') setIsTambahDanaOpen(true);
  }, [user, userLoading, router, searchParams]);

  useEffect(() => {
    if (!bannerApi) return;
    bannerApi.on("select", () => setCurrentBanner(bannerApi.selectedScrollSnap()));
  }, [bannerApi]);

  useEffect(() => {
    if (!swiftApi) return;
    swiftApi.on("select", () => setCurrentSwiftBanner(swiftApi.selectedScrollSnap()));
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
      toast({ title: "Alamat Disalin", description: "Alamat dompet telah disalin." });
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
    if (pullY > threshold) setTimeout(() => router.push('/marketplace'), 100);
    isPulling.current = false;
    setPullY(0);
  };

  if (!mounted || userLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
        <LogoIcon className="text-white" />
      </div>
    </div>
  );

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
                  {userData?.avatarUrl ? (
                    <Image src={userData.avatarUrl} alt="Avatar" width={32} height={32} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200"><User className="w-4 h-4 text-slate-400" /></div>
                  )}
                </div>
                <div className="relative cursor-pointer shrink-0" onClick={() => router.push('/notifications')}>
                  <MessageSquareText className="w-6 h-6 text-foreground" />
                  {unreadNotifications && unreadNotifications.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background px-1">
                      {unreadNotifications.length}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-1 cursor-pointer shrink-0" onClick={() => router.push('/settings/wallet')}><Menu className="w-6 h-6 text-foreground" /></div>
            )}
          </div>
          
          <div className="flex bg-muted/60 p-1 rounded-lg shrink-0">
            <button onClick={() => switchTab('bursa')} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", activeTab === 'bursa' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Bursa</button>
            <button onClick={() => switchTab('dompet')} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-md transition-all", activeTab === 'dompet' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Dompet</button>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-end overflow-hidden">
            <Headset className="w-5 h-5 text-foreground cursor-pointer shrink-0" />
            <div className="cursor-pointer shrink-0" onClick={() => router.push('/topup')}><HandCoinIcon className="w-6 h-6 text-foreground" /></div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-2 sticky top-14 z-40 bg-background/80 backdrop-blur-md">
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Cari aset..." className="h-10 pl-11 pr-4 bg-muted border-none rounded-md text-xs font-medium placeholder:text-muted-foreground shadow-sm" />
        </div>
      </div>

      <main 
        className="px-4 pt-2 space-y-6 will-change-transform"
        style={{ transform: `translateY(${pullY}px)`, transition: isPulling.current ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
      >
        {activeTab === 'bursa' ? (
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* DEBT ALERT SECTION */}
            {debtInfo.hasDebt && (
              <Card className="bg-rose-600 text-white rounded-2xl p-5 shadow-lg border-none animate-in zoom-in duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Skull className="w-16 h-16" /></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><ShieldAlert className="w-6 h-6 text-white" /></div>
                  <div className="flex-1 space-y-1">
                    <h3 className="text-xs font-black uppercase italic tracking-widest">Kewajiban Akun Terdeteksi</h3>
                    <p className="text-[10px] font-bold uppercase opacity-80 leading-tight">Sistem mendeteksi selisih saldo multi-aset yang belum diselesaikan secara riil.</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 relative z-10">
                  {debtInfo.illegalDebtIdr > 1000 && (
                    <div className="flex justify-between items-center bg-black/10 p-2 rounded-lg">
                      <span className="text-[9px] font-black uppercase italic">Hutang IDR Ilegal</span>
                      <span className="text-xs font-black italic">Rp {debtInfo.illegalDebtIdr.toLocaleString()}</span>
                    </div>
                  )}
                  {debtInfo.cryptoDebts.map((c: any) => (
                    <div key={c.asset} className="flex justify-between items-center bg-black/10 p-2 rounded-lg">
                      <span className="text-[9px] font-black uppercase italic">Hutang {c.asset} Ilegal</span>
                      <span className="text-xs font-black italic">{c.amount.toFixed(6)} {c.asset}</span>
                    </div>
                  ))}
                  {debtInfo.pendingDebt > 0 && (
                    <div className="flex justify-between items-center bg-black/10 p-2 rounded-lg">
                      <span className="text-[9px] font-black uppercase italic">Hutang Top-up Pending</span>
                      <span className="text-xs font-black italic">Rp {debtInfo.pendingDebt.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="space-y-4 mb-2 px-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground cursor-pointer" onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                    <span className="text-xs font-bold">Total Nilai (IDR)</span>
                    {isDetailsOpen ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                  <h1 className="text-4xl font-black tracking-tight italic">Rp{totalValueCalculated.toLocaleString('id-ID')}</h1>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold cursor-pointer" onClick={() => setIsPnlOpen(!isPnlOpen)}>
                    <span className="text-muted-foreground">PNL hari ini</span>
                    <span className={cn("font-black italic", pnlData.isUp ? "text-green-500" : "text-rose-500")}>
                      {pnlData.isUp ? '+' : '-'}Rp{Math.abs(pnlData.total).toLocaleString('id-ID')}
                    </span>
                    {isPnlOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black px-4 h-10 rounded-lg text-xs uppercase" onClick={() => setIsTambahDanaOpen(true)}>Top-Up</Button>
              </div>

              {isPnlOpen && (
                <div className="p-5 rounded-2xl bg-accent/5 border border-primary/10 space-y-4 shadow-xl animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-accent">Profitabilitas Riil</span><Badge className="bg-green-500/10 text-green-600 text-[7px] font-black">Live</Badge></div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-muted-foreground uppercase">ALX Growth</span><span className={cn("text-[11px] font-black italic", pnlData.breakdown.alx >= 0 ? "text-green-500" : "text-rose-500")}>Rp{Math.abs(pnlData.breakdown.alx).toLocaleString()}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-muted-foreground uppercase">Kripto Lain</span><span className={cn("text-[11px] font-black italic", (pnlData.breakdown.btc + pnlData.breakdown.eth) >= 0 ? "text-green-500" : "text-rose-500")}>Rp{Math.abs(pnlData.breakdown.btc + pnlData.breakdown.eth).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer" onClick={() => router.push('/alpha')}>
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center p-2 shadow-lg"><div className="font-black text-[10px] text-white">α</div></div>
                <div><h4 className="text-sm font-black italic uppercase">Alpha Hub</h4><p className="text-[10px] font-bold text-muted-foreground uppercase italic">Copy Trade</p></div>
              </Card>
              <Card className="bg-card rounded-2xl p-4 border border-border shadow-sm h-40 flex flex-col justify-between cursor-pointer" onClick={() => router.push('/p2p/order-history')}>
                <span className="text-sm font-black italic">Order P2P</span>
                <div><p className="text-[10px] font-bold text-muted-foreground italic">Beli/Jual dengan IDR</p></div>
              </Card>
            </div>

            <div className="bg-card rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-2 gap-6 overflow-x-auto no-scrollbar">
                {["Favorit", "Populer", "Alpha", "Baru"].map((tab) => (
                  <button key={tab} onClick={() => setMarketFilter(tab)} className={cn("text-sm font-bold transition-all shrink-0", marketFilter === tab ? "text-foreground border-b-2 border-primary pb-1" : "text-muted-foreground")}>{tab}</button>
                ))}
              </div>
              <div className="space-y-6">
                {isMarketLoading ? <div className="py-10 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div> : marketCoins.map((coin) => (
                  <div key={coin.symbol} className="grid grid-cols-3 items-center group cursor-pointer active:opacity-70" onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}>
                    <div className="flex items-center gap-1"><span className="text-sm font-black italic text-foreground">{coin.symbol}</span>{coin.isNative && <Badge className="bg-primary/20 text-primary text-[7px] font-black h-4 px-1.5 border-none">V3</Badge>}</div>
                    <div className="text-right space-y-0.5"><p className="text-sm font-black italic text-foreground">{coin.price.toFixed(coin.price < 1 ? 4 : 2)}</p><p className="text-[9px] font-bold text-muted-foreground">Rp{coin.baseIdr.toLocaleString()}</p></div>
                    <div className="flex justify-end"><div className={cn("w-20 py-1.5 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-sm", coin.isUp ? "bg-green-500 text-white" : "bg-rose-500 text-white")}>{coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in slide-in-from-right-10 duration-500 space-y-6">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => router.push('/settings/wallet')}><div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center p-1"><LogoIcon className="text-white" /></div><span className="text-sm font-black text-foreground italic uppercase">AliBank Native</span><ChevronDown className="w-4 h-4 text-muted-foreground" /></div>
              <button onClick={copyAddress} className="p-1 hover:bg-muted rounded transition-colors"><Copy className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground italic">Rp{totalValueCalculated.toLocaleString('id-ID')}</h1>
            <div className="grid grid-cols-5 gap-4">
              {[
                { name: "Alpha", icon: CalendarDays, href: "/alpha" },
                { name: "Sekuritas", icon: TrendingUp, href: "/crypto" },
                { name: "Earn", icon: Briefcase, href: "/deposits" },
                { name: "Referral", icon: UserPlus, href: "/profile" },
                { name: "Lainnya", icon: Grid3X3, href: "/marketplace" },
              ].map((service, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => router.push(service.href)}>
                  <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center shadow-sm"><service.icon className="w-6 h-6 text-foreground" /></div>
                  <span className="text-[10px] font-bold text-muted-foreground italic">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Sheet open={isTambahDanaOpen} onOpenChange={setIsTambahDanaOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader className="text-left"><SheetTitle className="text-2xl font-black italic uppercase tracking-tighter">Metode Top-Up</SheetTitle></SheetHeader>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/buy'); }} className="flex items-center justify-between p-5 rounded-2xl bg-muted/50 border border-border hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center shadow-lg text-white"><Zap className="w-6 h-6" /></div><div className="text-left"><p className="text-sm font-black italic uppercase">Beli Kripto</p><p className="text-[9px] font-bold text-muted-foreground uppercase">Visa, Mastercard, QRIS, Bank Transfer</p></div></div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </button>
              <button onClick={() => { setIsTambahDanaOpen(false); router.push('/topup'); }} className="flex items-center justify-between p-5 rounded-2xl bg-muted/50 border border-border hover:border-primary/30 transition-all group">
                <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 border border-green-500/20"><HandCoinIcon className="w-6 h-6" /></div><div className="text-left"><p className="text-sm font-black italic uppercase">AliBank Pay</p><p className="text-[9px] font-bold text-muted-foreground uppercase">Gunakan kode unik untuk setoran instan</p></div></div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Dashboard() {
  return <Suspense fallback={null}><DashboardContent /></Suspense>;
}
