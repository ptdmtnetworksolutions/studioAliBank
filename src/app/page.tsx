"use client";

import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard,
  Zap,
  Bell,
  User,
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Loader2,
  ShieldAlert,
  Skull,
  Send,
  Download,
  DollarSign,
  ArrowRightLeft,
  MessageSquareText,
  Activity,
  Wifi,
  Copy,
  ArrowUpRight,
  Sparkles,
  Gamepad2,
  HelpCircle,
  TrendingDown as TrendingDownIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";
import { GasStation } from "@/components/crypto/GasStation";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

const MARKUP = 1.02;
const INITIAL_COINS = [
  { symbol: "ALX", price: 12.24, baseIdr: 194004, change: 1.14, isUp: true, isNative: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 12.24 + Math.sin(i / 2) * 0.05 })) },
  { symbol: "BTC", price: 66410.20, baseIdr: 1052601670, change: -0.45, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 66410.20 - Math.cos(i) * 300 })) },
  { symbol: "ETH", price: 2420.08, baseIdr: 38358268, change: 3.73, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 2420.08 + Math.sin(i) * 40 })) },
  { symbol: "SOL", price: 145.50, baseIdr: 2306175, change: 2.50, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 145.50 + Math.sin(i) * 5 })) },
  { symbol: "BNB", price: 575.20, baseIdr: 9116920, change: -1.20, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 575.20 - Math.sin(i) * 8 })) }
];

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isError, setIsError] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const [marketCoins, setMarketCoins] = useState<any[]>(INITIAL_COINS);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(15850);
  const currentUsdtRate = useMemo(() => dynamicUsdtRate || 15850, [dynamicUsdtRate]);

  // Firebase doc & collection subscriptions
  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(10)) : null), [db, user]);
  const { data: userTxs } = useCollection(txQuery);

  const notificationsQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "notifications"), where("read", "==", false)) : null), [db, user]);
  const { data: unreadNotifications } = useCollection(notificationsQuery);

  // Auth guard and viewport routing logic
  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    
    // Check viewport. Mobile users go to dedicated mobile dashboard
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/home');
    }
  }, [user, userLoading, router]);

  // Fetch real-time market data (USDT price & other tickers)
  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "USDTIDRT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Market sync failed');
      const data = await res.json();

      const formatted = data.map((item: any) => {
        let symbol = item.symbol.replace("USDT", "").replace("IDR", "").replace("IDRT", "");
        if (symbol === "") symbol = "USDT";
        let price = parseFloat(item.lastPrice);
        if (item.symbol === "USDTIDRT") setDynamicUsdtRate(price);
        price = price * MARKUP;
        
        // Generate mock trend array for sparklines
        const baseTrend = Array.from({ length: 12 }, (_, i) => ({
          value: price + (Math.random() * price * 0.01 * (parseFloat(item.priceChangePercent) >= 0 ? 1 : -1))
        }));

        return {
          symbol: symbol,
          price: symbol === "USDT" ? 1 : price,
          change: parseFloat(item.priceChangePercent) || 0,
          isUp: (parseFloat(item.priceChangePercent) || 0) >= 0,
          baseIdr: symbol === "USDT" ? price : price * (data.find((d:any) => d.symbol === "USDTIDRT")?.lastPrice || 15850),
          trend: baseTrend
        };
      });

      const currentUsdtPrice = parseFloat(data.find((d:any) => d.symbol === "USDTIDRT")?.lastPrice || 15850);
      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxData = {
        symbol: "ALX",
        price: alxPrice,
        baseIdr: alxPrice * currentUsdtPrice,
        change: 1.14,
        isUp: true,
        isNative: true,
        trend: Array.from({ length: 12 }, (_, i) => ({ value: alxPrice + Math.sin(i / 2) * 0.05 }))
      };

      setMarketCoins([alxData, ...formatted.filter((c: any) => c.symbol !== "USDT" && c.symbol !== "IDR" && c.symbol !== "IDRT")].slice(0, 5));
      setLastSync(new Date().toLocaleTimeString());
      setIsError(false);
    } catch (e) {
      console.warn("Market sync failed, using fallback:", e);
      setIsError(true);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    if (mounted && user) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 25000);
      return () => clearInterval(interval);
    }
  }, [mounted, user, fetchMarketData]);

  // Balance calculation (IDR and USD value)
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

  const totalValueUsd = useMemo(() => {
    return totalValueCalculated / currentUsdtRate;
  }, [totalValueCalculated, currentUsdtRate]);

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
      isUp: totalPnl >= 0
    };
  }, [userData, marketCoins, totalValueCalculated, currentUsdtRate]);

  // Debt restriction checker
  const debtInfo = useMemo(() => {
    if (!userData || !userTxs) return { hasDebt: false, totalDebtValIdr: 0, illegalDebtIdr: 0, cryptoDebts: [] };
    const isNeutralCategory = (cat: string) => ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat);
    
    const idrInflow = userTxs.filter(t => t.type === 'income' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrOutflow = userTxs.filter(t => t.type === 'expense' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrLedger = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (userData.totalBalance || 0) - idrLedger);

    let totalCryptoDebtValIdr = 0;
    const cryptoDebts: any[] = [];
    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    assets.forEach(asset => {
      const cryptoIn = userTxs.filter(t => t.type === 'income' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.toAmount || 0), 0);
      const cryptoOut = userTxs.filter(t => t.type === 'expense' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.fromAmount || 0), 0);
      const cryptoLedger = cryptoIn - cryptoOut;
      const cryptoActual = userData.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, cryptoActual - cryptoLedger);
      if (diff > 0.000001) {
        const priceMap: any = { ALX: 194004, BTC: 1100000000, ETH: 35000000, USDT: 15850 };
        const val = diff * (priceMap[asset] || 0);
        totalCryptoDebtValIdr += val;
        cryptoDebts.push({ asset, amount: diff, valueIdr: val });
      }
    });

    const totalDebt = illegalDebtIdr + totalCryptoDebtValIdr;
    return {
      hasDebt: totalDebt > 1000,
      totalDebtValIdr: totalDebt,
      illegalDebtIdr,
      cryptoDebts
    };
  }, [userData, userTxs]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet berhasil disalin ke papan klip." });
    }
  };

  if (!mounted || userLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
        <LogoIcon className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-screen z-50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg text-white">
            <LogoIcon />
          </div>
          <span className="font-bold text-xl tracking-tighter italic uppercase">AliBank</span>
        </div>
        <nav className="flex-1 px-4 space-y-1 pt-4">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active href="/" />
          <SidebarItem icon={ArrowRightLeft} label="Move crypto" href="/crypto/buy" />
          <SidebarItem icon={Zap} label="Discover" href="/crypto" />
          <SidebarItem icon={ArrowUpDown} label="Card" href="/marketplace" />
          <SidebarItem icon={HelpCircle} label="Tax Hub" href="#" />
          <SidebarItem icon={HelpCircle} label="Travel" href="#" />
        </nav>
        <div className="p-6 border-t border-border space-y-4">
          <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
            <span>Network Health</span>
            <span className={cn("flex items-center gap-1", isError ? "text-rose-500" : "text-green-500")}>
              <Wifi className="w-2.5 h-2.5" /> {isError ? "Limited" : "Live"}
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Dashboard</h2>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black h-5 uppercase px-2">
              Node Sync: {lastSync || "connecting..."}
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Cari transaksi atau aset..." className="h-10 pl-10 bg-muted/50 border-none rounded-lg text-sm font-medium" />
            </div>
            
            <div className="flex items-center gap-4 border-l border-border pl-6">
              <GasStation />
              <Activity className="w-4 h-4 text-muted-foreground" />
              <div className="relative cursor-pointer" onClick={() => router.push('/notifications')}>
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadNotifications && unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] font-black rounded-full flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border cursor-pointer" onClick={() => router.push('/profile')}>
                {userData?.avatarUrl ? (
                  <img src={userData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                    {userData?.name?.[0] || 'U'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1400px] w-full mx-auto">

          {/* DEBT CRITICAL ALERT CARD */}
          {debtInfo.hasDebt && (
            <Card className="bg-rose-600 text-white rounded-[2rem] p-6 shadow-xl border-none animate-in zoom-in duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Skull className="w-32 h-32" /></div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                    <ShieldAlert className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black uppercase italic tracking-wider leading-none">Restriksi Likuiditas Akun</h3>
                    <p className="text-xs font-bold uppercase opacity-85">Terdeteksi hutang tidak terverifikasi sebesar Rp{debtInfo.totalDebtValIdr.toLocaleString('id-ID')}. Selesaikan kewajiban untuk memulihkan akses penuh.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => router.push('/debt-repayment')}
                  className="bg-white text-rose-600 hover:bg-white/95 border-none font-black italic uppercase text-xs px-6 py-5 rounded-xl shadow-lg shrink-0"
                >
                  Bayar Kewajiban
                </Button>
              </div>
            </Card>
          )}

          {/* TOP ROW GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PORTFOLIO OVERVIEW CARD */}
            <Card className="lg:col-span-2 rounded-[2.5rem] bg-card border border-border shadow-sm p-8 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Total Saldo Terkonsolidasi</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">{userData?.walletAddress || "Initializing wallet..."}</span>
                    <button onClick={copyAddress} className="w-6 h-6 rounded bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-4 md:gap-8">
                  <h1 className="text-5xl font-black italic tracking-tighter text-foreground">
                    Rp{totalValueCalculated.toLocaleString('id-ID')}
                  </h1>
                  <span className="text-xl font-bold text-muted-foreground italic">
                    ≈ US${totalValueUsd.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={cn("text-[9px] font-black italic border-none uppercase px-2.5 h-6", pnlData.isUp ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600")}>
                    PNL Hari Ini: {pnlData.isUp ? '+' : ''}{pnlData.percent.toFixed(2)}%
                  </Badge>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Terupdate langsung dari mainnet</span>
                </div>
              </div>

              {/* QUICK ACTIONS BAR */}
              <div className="grid grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/50">
                <DesktopActionBtn icon={DollarSign} label="Beli Crypto" desc="Instan VA / Credit Card" onClick={() => router.push('/crypto/buy')} />
                <DesktopActionBtn icon={ArrowRightLeft} label="Convert" desc="Swap aset instan" onClick={() => router.push('/crypto/buy?tab=convert')} />
                <DesktopActionBtn icon={Send} label="Kirim Aset" desc="Transfer ke wallet luar" onClick={() => router.push('/crypto/send')} />
                <DesktopActionBtn icon={Download} label="Terima" desc="Tampilkan QR / Address" onClick={() => router.push('/crypto/receive')} />
              </div>
            </Card>

            {/* INTEGRATED GAMES / ALPHA WIDGET */}
            <Card className="rounded-[2.5rem] bg-card border border-border shadow-sm p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aktivitas & Hiburan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Gunakan token ALX Anda untuk bermain game finansial atau hubungkan dengan copy-trading.</p>
              </div>

              <div className="space-y-4 my-6">
                <Card className="p-4 bg-muted/30 border border-border rounded-2xl flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-all shadow-sm group" onClick={() => router.push('/crypto/trade-pro/btc')}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic shrink-0 group-hover:scale-105 transition-transform">Tx</div>
                    <div>
                      <p className="text-sm font-black uppercase italic leading-tight group-hover:text-primary transition-colors">Trade X Pro</p>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 block">Simulator Options Kripto</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Card>

                <Card className="p-4 bg-muted/30 border border-border rounded-2xl flex items-center justify-between cursor-pointer hover:bg-muted/60 transition-all shadow-sm group" onClick={() => router.push('/games/spin')}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase italic leading-tight group-hover:text-orange-500 transition-colors">Ali Spin Wheel</p>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 block">Fortune Spin Harian</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Card>
              </div>

              <div className="flex gap-2">
                <Button className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground font-black uppercase italic text-[10px] rounded-xl" onClick={() => router.push('/p2p/order-history')}>
                  P2P Order Hub
                </Button>
                <Button className="w-full h-11 bg-primary text-primary-foreground font-black uppercase italic text-[10px] rounded-xl" onClick={() => router.push('/alpha')}>
                  Alpha Hub (Copy-Trade)
                </Button>
              </div>
            </Card>
          </div>

          {/* LOWER GRID FOR ASSETS AND RECENT TRANSACTIONS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* ASSETS PORTFOLIO GRID */}
            <Card className="xl:col-span-2 rounded-[2.5rem] bg-card border border-border shadow-sm overflow-hidden p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Rincian Portofolio Aset</h3>
                <Badge variant="outline" className="text-[8px] font-black uppercase px-2 h-5">Semua jaringan didukung</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[9px] font-black uppercase text-muted-foreground tracking-widest pb-3">
                      <th className="py-3">Token</th>
                      <th className="py-3 text-right">Saldo Dimiliki</th>
                      <th className="py-3 text-right">Harga Satuan</th>
                      <th className="py-3 text-right">Estimasi Nilai (USD)</th>
                      <th className="py-3 text-right">Estimasi Nilai (IDR)</th>
                      <th className="py-3 text-center">Trend 24h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    <DesktopAssetRow 
                      name="Alix Coin" 
                      symbol="ALX" 
                      amount={userData?.cryptoBalances?.ALX ?? 0} 
                      priceUsd={marketCoins.find(c => c.symbol === "ALX")?.price ?? 12.24} 
                      priceIdr={(marketCoins.find(c => c.symbol === "ALX")?.price ?? 12.24) * currentUsdtRate}
                      changePercent={1.14}
                      isUp={true}
                      isNative={true}
                      trend={marketCoins.find(c => c.symbol === "ALX")?.trend || []}
                    />
                    <DesktopAssetRow 
                      name="Bitcoin" 
                      symbol="BTC" 
                      amount={userData?.cryptoBalances?.BTC ?? 0} 
                      priceUsd={marketCoins.find(c => c.symbol === "BTC")?.price ?? 66000} 
                      priceIdr={(marketCoins.find(c => c.symbol === "BTC")?.price ?? 66000) * currentUsdtRate}
                      changePercent={marketCoins.find(c => c.symbol === "BTC")?.change ?? -0.45}
                      isUp={marketCoins.find(c => c.symbol === "BTC")?.isUp ?? false}
                      trend={marketCoins.find(c => c.symbol === "BTC")?.trend || []}
                    />
                    <DesktopAssetRow 
                      name="Ethereum" 
                      symbol="ETH" 
                      amount={userData?.cryptoBalances?.ETH ?? 0} 
                      priceUsd={marketCoins.find(c => c.symbol === "ETH")?.price ?? 2400} 
                      priceIdr={(marketCoins.find(c => c.symbol === "ETH")?.price ?? 2400) * currentUsdtRate}
                      changePercent={marketCoins.find(c => c.symbol === "ETH")?.change ?? 3.73}
                      isUp={marketCoins.find(c => c.symbol === "ETH")?.isUp ?? true}
                      trend={marketCoins.find(c => c.symbol === "ETH")?.trend || []}
                    />
                    <DesktopAssetRow 
                      name="Tether USD" 
                      symbol="USDT" 
                      amount={userData?.cryptoBalances?.USDT ?? 0} 
                      priceUsd={1.00} 
                      priceIdr={currentUsdtRate}
                      changePercent={0.01}
                      isUp={true}
                      trend={Array.from({ length: 12 }, () => ({ value: 1 }))}
                    />
                    <DesktopAssetRow 
                      name="Rupiah" 
                      symbol="IDR" 
                      amount={userData?.totalBalance ?? 0} 
                      priceUsd={1 / currentUsdtRate} 
                      priceIdr={1}
                      changePercent={0.0}
                      isUp={true}
                      trend={Array.from({ length: 12 }, () => ({ value: 1 }))}
                    />
                  </tbody>
                </table>
              </div>
            </Card>

            {/* RECENT TRANSACTIONS PANEL */}
            <Card className="rounded-[2.5rem] bg-card border border-border shadow-sm p-8 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Riwayat Aktivitas</h3>
                  <History className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2 no-scrollbar">
                  {userTxs && userTxs.length > 0 ? (
                    userTxs.slice(0, 6).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tx.type === 'income' ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-500")}>
                            {tx.type === 'income' ? <Download className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase italic leading-none truncate max-w-[130px]">{tx.description || tx.category}</p>
                            <span className="text-[8px] font-bold text-muted-foreground block mt-1 uppercase">{new Date(tx.date || tx.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black italic">
                            {tx.amount ? `Rp${tx.amount.toLocaleString()}` : `${tx.cryptoAmount?.toFixed(4) || tx.toAmount?.toFixed(4)} ${tx.cryptoCurrency || tx.toCurrency || ''}`}
                          </p>
                          <Badge variant="outline" className={cn("text-[6px] font-black h-3.5 uppercase border-none px-1.5 mt-0.5", tx.status === 'success' ? "bg-green-600/10 text-green-600" : "bg-orange-500/10 text-orange-500")}>
                            {tx.status || 'Success'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center opacity-30 italic">
                      <p className="text-xs font-black uppercase tracking-widest">Belum ada transaksi</p>
                    </div>
                  )}
                </div>
              </div>

              <Button className="w-full h-11 bg-muted hover:bg-muted/80 text-foreground font-black uppercase italic text-[10px] rounded-xl mt-4" onClick={() => router.push('/transactions')}>
                Lihat Semua Riwayat
              </Button>
            </Card>
          </div>
          
        </div>
      </main>
    </div>
  );
}

// Sidebar Navigation Item component
function SidebarItem({ icon: Icon, label, active = false, href }: any) {
  const router = useRouter();
  return (
    <div onClick={() => href !== "#" && router.push(href)} className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-sm font-bold">{label}</span>
      </div>
      {active && <div className="w-1 h-5 bg-primary rounded-full absolute left-0" />}
    </div>
  );
}

// Action Button component
function DesktopActionBtn({ icon: Icon, label, desc, onClick }: any) {
  return (
    <button className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 hover:bg-muted/80 transition-all border border-border/40 text-left group" onClick={onClick}>
      <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <div>
        <p className="text-xs font-black uppercase italic leading-none">{label}</p>
        <span className="text-[8px] font-bold text-muted-foreground uppercase block mt-1 leading-none">{desc}</span>
      </div>
    </button>
  );
}

// Portfolio Asset Row component
function DesktopAssetRow({ name, symbol, amount, priceUsd, priceIdr, changePercent, isUp, isNative = false, trend }: any) {
  return (
    <tr className="hover:bg-muted/30 transition-colors cursor-default group">
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shadow-inner shrink-0", isNative ? "gold-gradient text-white" : "bg-muted")}>
            {isNative ? <LogoIcon className="p-1.5 w-full h-full" /> : <span className="font-black text-xs">{symbol[0]}</span>}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase italic">{name}</span>
              {isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 leading-none border-none">V3</Badge>}
            </div>
            <span className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 block">{symbol}</span>
          </div>
        </div>
      </td>
      <td className="py-4 text-right">
        <p className="text-xs font-black italic leading-none">{amount.toFixed(6).replace(/\.?0+$/, "")}</p>
        <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block leading-none">{symbol}</span>
      </td>
      <td className="py-4 text-right">
        <p className="text-xs font-black italic leading-none">${priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
        <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block leading-none">USD</span>
      </td>
      <td className="py-4 text-right">
        <p className="text-xs font-black italic text-foreground leading-none">
          ${(amount * priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block leading-none">USD Value</span>
      </td>
      <td className="py-4 text-right">
        <p className="text-xs font-black italic text-foreground leading-none">
          Rp{(amount * priceIdr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
        </p>
        <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1 block leading-none">IDR Value</span>
      </td>
      <td className="py-4 text-center w-24">
        <div className="flex flex-col items-center gap-1">
          <div className="h-6 w-20">
            {trend && trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area type="monotone" dataKey="value" stroke={isUp ? "#22C55E" : "#EF4444"} fill={isUp ? "#22C55E" : "#EF4444"} fillOpacity={0.05} strokeWidth={1.5} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <span className={cn("text-[8px] font-black italic leading-none", changePercent === 0 ? "text-muted-foreground" : isUp ? "text-green-500" : "text-rose-500")}>
            {changePercent === 0 ? '0.00%' : `${isUp ? '+' : ''}${changePercent.toFixed(2)}%`}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
          <LogoIcon className="text-white" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
