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
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { useVaultStaking } from "@/hooks/useVaultStaking";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";
import { GasStation } from "@/components/crypto/GasStation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";

const MARKUP = 1.02;
const INITIAL_COINS = [
  { symbol: "ALX", price: 12.24, baseIdr: 194004, change: 1.14, isUp: true, isNative: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 12.24 + Math.sin(i / 2) * 0.05 })) },
  { symbol: "BTC", price: 66450.00, baseIdr: 1053232500, change: -0.45, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 66450.00 - Math.cos(i) * 300 })) },
  { symbol: "ETH", price: 2420.00, baseIdr: 38357000, change: 3.73, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 2420.00 + Math.sin(i) * 40 })) },
  { symbol: "BNB", price: 575.20, baseIdr: 9116920, change: -1.20, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 575.20 - Math.sin(i) * 8 })) },
  { symbol: "SOL", price: 145.50, baseIdr: 2306175, change: 2.50, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 145.50 + Math.sin(i) * 5 })) },
  { symbol: "XRP", price: 0.52, baseIdr: 8242, change: 0.85, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.52 + Math.sin(i) * 0.01 })) },
  { symbol: "ADA", price: 0.45, baseIdr: 7132, change: -1.10, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.45 - Math.sin(i) * 0.01 })) },
  { symbol: "DOGE", price: 0.14, baseIdr: 2219, change: 4.20, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.14 + Math.sin(i) * 0.005 })) },
  { symbol: "TRX", price: 0.12, baseIdr: 1902, change: 0.30, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.12 + Math.sin(i) * 0.002 })) },
  { symbol: "DOT", price: 6.50, baseIdr: 103025, change: -2.40, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 6.50 - Math.sin(i) * 0.1 })) },
  { symbol: "LINK", price: 15.20, baseIdr: 240920, change: 1.80, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 15.20 + Math.sin(i) * 0.2 })) },
  { symbol: "MATIC", price: 0.68, baseIdr: 10778, change: -0.95, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.68 - Math.sin(i) * 0.01 })) },
  { symbol: "LTC", price: 82.40, baseIdr: 1306040, change: 1.15, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 82.40 + Math.sin(i) * 1.5 })) },
  { symbol: "SHIB", price: 0.000022, baseIdr: 0.348, change: 5.40, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.000022 + Math.sin(i) * 0.000001 })) },
  { symbol: "AVAX", price: 34.80, baseIdr: 551580, change: -1.50, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 34.80 - Math.sin(i) * 0.5 })) },
  { symbol: "UNI", price: 7.20, baseIdr: 114120, change: 0.90, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 7.20 + Math.sin(i) * 0.1 })) },
  { symbol: "ATOM", price: 8.40, baseIdr: 133140, change: -2.10, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 8.40 - Math.sin(i) * 0.15 })) },
  { symbol: "XLM", price: 0.11, baseIdr: 1743, change: 0.25, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.11 + Math.sin(i) * 0.002 })) },
  { symbol: "XMR", price: 172.50, baseIdr: 2734125, change: 0.60, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 172.50 + Math.sin(i) * 2.0 })) },
  { symbol: "NEAR", price: 5.80, baseIdr: 91930, change: 3.10, isUp: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 5.80 + Math.sin(i) * 0.1 })) },
  { symbol: "ARB", price: 0.95, baseIdr: 15057, change: -1.80, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.95 - Math.sin(i) * 0.02 })) }
];

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isError, setIsError] = useState(false);
  const [lastSync, setLastSync] = useState("");
  const [marketCoins, setMarketCoins] = useState<any[]>(INITIAL_COINS);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(17690);
  const currentUsdtRate = useMemo(() => dynamicUsdtRate || 17690, [dynamicUsdtRate]);

  // Firebase doc & collection subscriptions
  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Ambil dompet terhubung (prioritaskan external MetaMask daripada internal wallet)
  const activeWalletAddress = useMemo(() => {
    if (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized') {
      return userData.externalWalletAddress;
    }
    return userData?.walletAddress || null;
  }, [userData]);

  // Ambil saldo tabungan vault on-chain dan yield milik user
  const {
    stakedEth: vaultBalanceEth,
    accruedRewards: vaultStakingYieldAlx,
    isClaiming: isStakingClaiming,
    claimSuccess: stakingClaimSuccess,
    claimError: stakingClaimError,
    claimYield: claimStakingYield
  } = useVaultStaking(activeWalletAddress, user?.uid || null);

  // Otomatis sinkronkan deposit on-chain dari external wallet
  useEffect(() => {
    if (!user?.uid || !activeWalletAddress || activeWalletAddress === '0xNoWalletInitialized') return;
    
    const syncDeposits = async () => {
      try {
        await fetch(`/api/crypto/sync-deposits?userId=${user.uid}`);
      } catch (e) {
        console.warn('Gagal sinkronisasi setoran otomatis:', e);
      }
    };

    syncDeposits();
  }, [user?.uid, activeWalletAddress]);

  const txQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(10)) : null), [db, user]);
  const { data: userTxs } = useCollection(txQuery);

  const notificationsQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "notifications"), where("read", "==", false)) : null), [db, user]);
  const { data: unreadNotifications } = useCollection(notificationsQuery);

  // Auth guard and viewport routing logic
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth < 768;
      setIsMobileViewport(isMobile);
      if (isMobile && user) {
        router.replace('/m/home');
      }
    }
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, userLoading, router]);

  // Fetch real-time market data (USDT price & other tickers)
  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
        "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
        "MATICUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
        "ATOMUSDT", "XLMUSDT", "XMRUSDT", "NEARUSDT", "ARBUSDT",
        "USDTIDRT"
      ];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Market sync failed');
      const data = await res.json();

      const rawUsdtPrice = parseFloat(data.find((d:any) => d.symbol === "USDTIDRT")?.lastPrice || 17690);
      // Sanity check: IDR/USDT rate must be > 1000
      const currentUsdtPrice = rawUsdtPrice > 10000 ? rawUsdtPrice : 17690;

      const formatted = data.map((item: any) => {
        let symbol = item.symbol.replace("USDT", "").replace("IDR", "").replace("IDRT", "");
        if (symbol === "") symbol = "USDT";
        let price = parseFloat(item.lastPrice);
        // Sanity check: IDR rate must be > 1000 to be valid
        if (item.symbol === "USDTIDRT" && price > 1000) setDynamicUsdtRate(price);
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
          baseIdr: symbol === "USDT" ? price : price * currentUsdtPrice,
          trend: baseTrend
        };
      });
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

      setMarketCoins([alxData, ...formatted.filter((c: any) => c.symbol !== "USDT" && c.symbol !== "IDR" && c.symbol !== "IDRT")]);
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

  // Fetch real-time USD/IDR forex rate on mount and hourly
  useEffect(() => {
    const fetchForexRate = async () => {
      try {
        const res = await fetch('/api/forex/rate');
        if (!res.ok) return;
        const data = await res.json();
        // Sanity check: IDR/USD rate must be > 10000 (currently ~17690)
        if (data?.rate && data.rate > 10000) {
          setDynamicUsdtRate(data.rate);
        }
      } catch (e) {
        console.warn('[Forex] Rate fetch failed, keeping current rate');
      }
    };
    fetchForexRate();
    const hourlyInterval = setInterval(fetchForexRate, 3600000);
    return () => clearInterval(hourlyInterval);
  }, []);

  // Balance calculation (IDR and USD value)
  const totalValueCalculated = useMemo(() => {
    let totalIdr = userData?.totalBalance ?? 0;
    
    if (userData?.cryptoBalances) {
      Object.entries(userData.cryptoBalances).forEach(([sym, amountRaw]) => {
        const amount = amountRaw as number;
        if (amount <= 0) return;
        
        if (sym === 'USDT') {
          totalIdr += amount * currentUsdtRate;
        } else {
          const coinMarket = marketCoins.find(c => c.symbol === sym) || INITIAL_COINS.find(c => c.symbol === sym);
          const priceUsd = coinMarket?.price ?? 0;
          totalIdr += amount * priceUsd * currentUsdtRate;
        }
      });
    }

    if (vaultBalanceEth > 0) {
      const ethMarket = marketCoins.find(c => c.symbol === 'ETH') || INITIAL_COINS.find(c => c.symbol === 'ETH');
      const priceUsd = ethMarket?.price ?? 0;
      totalIdr += vaultBalanceEth * priceUsd * currentUsdtRate;
    }
    
    return totalIdr;
  }, [userData, marketCoins, currentUsdtRate, vaultBalanceEth]);

  const totalValueUsd = useMemo(() => {
    return totalValueCalculated / currentUsdtRate;
  }, [totalValueCalculated, currentUsdtRate]);

  const pnlData = useMemo(() => {
    let totalPnl = 0;
    
    if (userData?.cryptoBalances) {
      Object.entries(userData.cryptoBalances).forEach(([sym, amountRaw]) => {
        const amount = amountRaw as number;
        if (amount <= 0) return;
        
        const coinMarket = marketCoins.find(c => c.symbol === sym) || INITIAL_COINS.find(c => c.symbol === sym);
        if (coinMarket) {
          const change = coinMarket.change ?? 0;
          const priceUsd = coinMarket.price ?? 0;
          const valIdr = amount * priceUsd * currentUsdtRate;
          totalPnl += (valIdr * change) / 100;
        }
      });
    }

    if (vaultBalanceEth > 0) {
      const coinMarket = marketCoins.find(c => c.symbol === 'ETH') || INITIAL_COINS.find(c => c.symbol === 'ETH');
      if (coinMarket) {
        const change = coinMarket.change ?? 0;
        const priceUsd = coinMarket.price ?? 0;
        const valIdr = vaultBalanceEth * priceUsd * currentUsdtRate;
        totalPnl += (valIdr * change) / 100;
      }
    }
    
    const pnlPercent = totalValueCalculated > 0 ? (totalPnl / totalValueCalculated) * 100 : 0;
    return {
      total: totalPnl,
      percent: pnlPercent,
      isUp: totalPnl >= 0
    };
  }, [userData, marketCoins, totalValueCalculated, currentUsdtRate, vaultBalanceEth]);

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
    const assets = ["ALX", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "DOT", "LINK", "MATIC", "LTC", "SHIB", "AVAX", "UNI", "ATOM", "XLM", "XMR", "NEAR", "ARB", "USDT"];
    assets.forEach(asset => {
      const cryptoIn = userTxs.filter(t => t.type === 'income' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.toAmount || 0), 0);
      const cryptoOut = userTxs.filter(t => t.type === 'expense' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.fromAmount || 0), 0);
      const cryptoLedger = cryptoIn - cryptoOut;
      const cryptoActual = userData.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, cryptoActual - cryptoLedger);
      if (diff > 0.000001) {
        const dynamicAlxPriceUsdt = globalLiquidity?.lastAlxPriceUsdt || 12.24;
        const dynamicAlxPriceIdr = Math.round(dynamicAlxPriceUsdt * currentUsdtRate);

        const priceMap: any = { 
          ALX: dynamicAlxPriceIdr, BTC: 1100000000, ETH: 35000000, USDT: 17690,
          SOL: 2300000, BNB: 9100000, XRP: 8200, ADA: 7100, DOGE: 2200,
          TRX: 1900, DOT: 103000, LINK: 240000, MATIC: 10700, LTC: 1300000,
          SHIB: 0.35, AVAX: 550000, UNI: 114000, ATOM: 133000, XLM: 1700,
          XMR: 2700000, NEAR: 91000, ARB: 15000
        };
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
  }, [userData, userTxs, globalLiquidity, currentUsdtRate]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet berhasil disalin ke papan klip." });
    }
  };

  if (!mounted || userLoading || isMobileViewport) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
        <LogoIcon className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

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
                    Rp{totalValueCalculated.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </h1>
                  <span className="text-xl font-bold text-muted-foreground italic">
                    ≈ US${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    {(() => {
                      const COIN_NAMES: Record<string, string> = {
                        "ALX": "Alix Coin",
                        "BTC": "Bitcoin",
                        "ETH": "Ethereum",
                        "BNB": "Binance Coin",
                        "SOL": "Solana",
                        "XRP": "Ripple",
                        "ADA": "Cardano",
                        "DOGE": "Dogecoin",
                        "TRX": "TRON",
                        "DOT": "Polkadot",
                        "LINK": "Chainlink",
                        "MATIC": "Polygon",
                        "LTC": "Litecoin",
                        "SHIB": "Shiba Inu",
                        "AVAX": "Avalanche",
                        "UNI": "Uniswap",
                        "ATOM": "Cosmos",
                        "XLM": "Stellar",
                        "XMR": "Monero",
                        "NEAR": "Near Protocol",
                        "ARB": "Arbitrum",
                        "USDT": "Tether USD",
                        "IDR": "Rupiah",
                        "ETH_VAULT": "DeFi Vault Tabungan",
                      };

                      const ASSET_SYMBOLS_ORDER = [
                        "ALX", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "DOT", 
                        "LINK", "MATIC", "LTC", "SHIB", "AVAX", "UNI", "ATOM", "XLM", "XMR", "NEAR", "ARB",
                        "USDT", "IDR"
                      ];
                      
                      if (vaultBalanceEth > 0) {
                        const ethIdx = ASSET_SYMBOLS_ORDER.indexOf("ETH");
                        if (ethIdx !== -1) {
                          ASSET_SYMBOLS_ORDER.splice(ethIdx + 1, 0, "ETH_VAULT");
                        }
                      }

                      // Bangun list aset dinamis dengan saldo dan estimasi nilai
                      const assetsList = ASSET_SYMBOLS_ORDER.map((sym) => {
                        const isAlx = sym === "ALX";
                        const isUsdt = sym === "USDT";
                        const isIdr = sym === "IDR";
                        
                        let name = COIN_NAMES[sym] || sym;
                        let amount = 0;
                        let priceUsd = 0;
                        let priceIdr = 0;
                        let changePercent = 0;
                        let isUp = true;
                        let trend: any[] = [];
                        
                        if (isIdr) {
                          amount = userData?.totalBalance ?? 0;
                          priceUsd = 1 / currentUsdtRate;
                          priceIdr = 1;
                          changePercent = 0;
                          isUp = true;
                          trend = Array.from({ length: 12 }, () => ({ value: 1 }));
                        } else if (isUsdt) {
                          amount = userData?.cryptoBalances?.USDT ?? 0;
                          priceUsd = 1.00;
                          priceIdr = currentUsdtRate;
                          changePercent = 0.01;
                          isUp = true;
                          trend = Array.from({ length: 12 }, () => ({ value: 1 }));
                        } else if (sym === "ETH_VAULT") {
                          amount = vaultBalanceEth ?? 0;
                          const coin = marketCoins.find(c => c.symbol === "ETH") || INITIAL_COINS.find(c => c.symbol === "ETH");
                          priceUsd = coin?.price ?? 0;
                          priceIdr = coin?.baseIdr ?? (priceUsd * currentUsdtRate);
                          changePercent = coin?.change ?? 0;
                          isUp = coin?.isUp ?? true;
                          trend = coin?.trend ?? [];
                        } else {
                          amount = userData?.cryptoBalances?.[sym] ?? 0;
                          const coin = marketCoins.find(c => c.symbol === sym) || INITIAL_COINS.find(c => c.symbol === sym);
                          priceUsd = coin?.price ?? 0;
                          priceIdr = coin?.baseIdr ?? (priceUsd * currentUsdtRate);
                          changePercent = coin?.change ?? 0;
                          isUp = coin?.isUp ?? true;
                          trend = coin?.trend ?? [];
                        }
                        
                        const valueUsd = amount * priceUsd;
                        
                        return {
                          sym,
                          name,
                          amount,
                          priceUsd,
                          priceIdr,
                          changePercent,
                          isUp,
                          trend,
                          isAlx,
                          valueUsd
                        };
                      });

                      // Filter: Tampilkan aset yang memiliki saldo > 0, atau aset utama platform yang selalu ditampilkan agar sama dengan mobile
                      const filteredAssets = assetsList.filter(a => a.amount > 0 || ["ALX", "BTC", "ETH", "USDT", "IDR"].includes(a.sym));

                      // Urutkan berdasarkan nilai estimasi USD terbesar agar aset yang didanai muncul di atas
                      filteredAssets.sort((a, b) => b.valueUsd - a.valueUsd);

                      return filteredAssets.map((asset) => {
                        return (
                          <DesktopAssetRow 
                            key={asset.sym}
                            name={asset.name}
                            symbol={asset.sym}
                            amount={asset.amount}
                            priceUsd={asset.priceUsd}
                            priceIdr={asset.priceIdr}
                            changePercent={asset.changePercent}
                            isUp={asset.isUp}
                            isNative={asset.isAlx}
                            trend={asset.trend}
                          />
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-8 flex flex-col">
              {/* DEFI VAULT STAKING CARD */}
              {userData?.walletAddress && (
                <Card className="rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-8 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black italic tracking-tight uppercase">DeFi Vault Tabungan</h3>
                          <Badge className="bg-primary/20 text-primary text-[7px] font-black uppercase h-3.5 px-1 border-none leading-none animate-pulse">On-Chain</Badge>
                        </div>
                        <p className="text-[9px] font-mono text-muted-foreground tracking-tighter mt-0.5">
                          Address: {userData.walletAddress.substring(0, 8)}...{userData.walletAddress.substring(userData.walletAddress.length - 6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">Saldo Staking (ETH)</span>
                      <span className="text-sm font-black italic">{vaultBalanceEth.toFixed(6).replace(/\.?0+$/, "")} ETH</span>
                    </div>

                    <div className="flex justify-between items-center py-2 bg-primary/5 rounded-2xl px-4 border border-primary/10">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-primary uppercase">Yield Terkumpul (ALX)</span>
                        <span className="text-[7px] text-muted-foreground font-medium uppercase tracking-wider">Berdetak Real-Time</span>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black italic text-primary animate-pulse font-mono">
                          {vaultStakingYieldAlx > 0 ? vaultStakingYieldAlx.toFixed(8) : "0.00000000"} ALX
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-bold uppercase pt-1 text-muted-foreground">
                      <span>Base APY</span>
                      <span className="text-green-500 font-black italic">12.00% p.a</span>
                    </div>
                  </div>

                  {stakingClaimError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 text-[9px] font-bold uppercase border border-rose-500/20">
                      Error: {stakingClaimError}
                    </div>
                  )}

                  {stakingClaimSuccess && (
                    <div className="p-3 rounded-xl bg-green-500/10 text-green-500 text-[9px] font-bold uppercase border border-green-500/20">
                      Klaim Berhasil! Token ALX telah dikreditkan ke saldo Anda.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      className="h-10 bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl font-black uppercase text-[9px] italic"
                      onClick={() => router.push('/crypto/receive?asset=ETH')}
                    >
                      Tabung ETH
                    </Button>
                    <Button 
                      disabled={isStakingClaiming || vaultStakingYieldAlx < 0.0001}
                      onClick={claimStakingYield}
                      className="h-10 gold-gradient text-white border-none rounded-xl font-black uppercase text-[9px] italic shadow-md active:scale-95 transition-all"
                    >
                      {isStakingClaiming ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Klaim Yield (ALX)"
                      )}
                    </Button>
                  </div>

                  <p className="text-[8px] text-rose-500 font-bold uppercase leading-relaxed italic text-center opacity-85">
                    * Setoran baru atau penarikan ETH akan mereset durasi yield. Klaim ALX terlebih dahulu!
                  </p>
                </Card>
              )}

              {/* RECENT TRANSACTIONS PANEL */}
              <Card className="rounded-[2.5rem] bg-card border border-border shadow-sm p-8 space-y-6 flex flex-col justify-between flex-1">
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
          
        </div>
      </main>
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
  const router = useRouter();

  const handleRowClick = () => {
    if (symbol === 'IDR') {
      router.push('/deposits');
    } else if (symbol === 'ETH_VAULT') {
      router.push('/crypto/receive?asset=ETH');
    } else {
      router.push(`/crypto/market/${symbol.toLowerCase()}`);
    }
  };

  return (
    <tr 
      onClick={handleRowClick}
      className="hover:bg-muted/30 transition-colors cursor-pointer group"
    >
      <td className="py-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0", isNative ? "gold-gradient text-white" : (symbol === 'IDR' ? "bg-green-500/10 text-green-600 border border-green-500/20" : (symbol === 'ETH_VAULT' ? "bg-primary text-white p-1" : "bg-muted relative")))}>
            {isNative ? (
              <LogoIcon className="p-1.5 w-full h-full text-white" />
            ) : symbol === 'IDR' ? (
              <span className="font-black text-[10px] italic">Rp</span>
            ) : symbol === 'ETH_VAULT' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5"></path>
              </svg>
            ) : (
              <>
                <img 
                  src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} 
                  className="object-cover w-full h-full" 
                  alt={symbol} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-full font-black text-xs text-slate-400">
                  {symbol[0]}
                </div>
              </>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase italic">{name}</span>
              {isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 leading-none border-none">V3</Badge>}
              {symbol === 'ETH_VAULT' && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 leading-none border-none animate-pulse">DeFi</Badge>}
            </div>
            <span className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 block">{symbol === 'ETH_VAULT' ? 'ETH' : symbol}</span>
          </div>
        </div>
      </td>
      <td className="py-4 text-right">
        <p className="text-xs font-black italic leading-none">{amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}</p>
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
