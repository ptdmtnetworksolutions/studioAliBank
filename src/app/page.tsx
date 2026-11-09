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
  ShieldCheck,
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
import { UserAvatar } from "@/components/ui/user-avatar";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { useVaultStaking } from "@/hooks/useVaultStaking";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";
import { GasStation } from "@/components/crypto/GasStation";
import { Sidebar } from "@/components/layout/Sidebar";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { LandingPage } from "@/components/landing/LandingPage";

const MARKUP = 1.02;
const INITIAL_COINS = [
  { symbol: "ALX", price: 0.108, baseIdr: 1728, change: 1.14, isUp: true, isNative: true, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.108 + Math.sin(i / 2) * 0.002 })) },
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
  { symbol: "POL", price: 0.0891, baseIdr: 1576, change: -0.53, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.0891 + Math.sin(i / 2) * 0.001 })) },
  { symbol: "MATIC", price: 0.0891, baseIdr: 1576, change: -0.53, isUp: false, trend: Array.from({ length: 12 }, (_, i) => ({ value: 0.0891 - Math.cos(i) * 0.001 })) },
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

  // Otomatis sinkronkan deposit on-chain dari dompet eksternal (MetaMask / Polygon)
  useEffect(() => {
    if (!user?.uid || (!userData?.walletAddress && !activeWalletAddress)) return;
    let isCancelled = false;

    const syncDeposits = async () => {
      try {
        const { getStoredAuthTokens, triggerFirestoreSync } = await import('@/lib/firestore-proxy-client');
        const { idToken } = getStoredAuthTokens();
        const res = await fetch(`/api/crypto/sync-deposits?userId=${user.uid}`, {
          headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
          cache: 'no-store',
        });
        if (!res.ok || isCancelled) return;
        const data = await res.json().catch(() => null);
        if (data?.newDepositsCount > 0) {
          triggerFirestoreSync();
          toast({
            title: "📥 Deposit Kripto Masuk!",
            description: `Setoran baru di jaringan Polygon berhasil dideteksi dan langsung ditambahkan ke saldo AliBank Anda.`,
          });
        }
      } catch (e) {
        console.warn('Gagal sinkronisasi setoran otomatis:', e);
      }
    };

    syncDeposits();
    const intervalId = setInterval(syncDeposits, 30000);
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [user?.uid, userData?.walletAddress, activeWalletAddress, toast]);

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
      if (isMobile && user && searchParams.get('view') !== 'landing') {
        router.replace('/m/home');
      }
    }
  }, [user, userLoading, router, searchParams]);

  // Fetch real-time market data (USDT price & other tickers)
  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
        "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
        "MATICUSDT", "POLUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
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
      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 0.108;
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
    const isNeutralCategory = (cat: string) => ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat || '');

    let idrInflow = 0;
    let idrOutflow = 0;

    userTxs.forEach((t: any) => {
      if (t.status === 'rejected' || isNeutralCategory(t.category)) return;
      const desc = String(t.description || '');

      // 1. Swap / Convert transactions
      if (t.fromCurrency || t.toCurrency) {
        if (t.toCurrency === 'IDR') idrInflow += Number(t.toAmount || t.amount || 0);
        if (t.fromCurrency === 'IDR') idrOutflow += Number(t.fromAmount || t.amount || 0);
        return;
      }

      // 2. Crypto Buy/Sell with IDR Wallet
      if (t.cryptoCurrency && t.cryptoCurrency !== 'IDR') {
        if (desc.includes('ke Saldo Dompet') || desc.startsWith('Jual ')) {
          idrInflow += Math.abs(Number(t.amount || 0));
        } else if (desc.includes('via Saldo Dompet') || (desc.startsWith('Beli ') && t.type === 'expense')) {
          idrOutflow += Math.abs(Number(t.amount || 0));
        }
        return;
      }

      // 3. Standard IDR transactions
      if (t.asset === 'IDR' || (!t.asset && !t.cryptoCurrency)) {
        const amt = Math.abs(Number(t.amount || t.amountIdr || 0));
        if (t.type === 'income') idrInflow += amt;
        else if (t.type === 'expense') idrOutflow += amt;
      }
    });

    const idrLedger = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (userData.totalBalance || 0) - idrLedger);

    let totalCryptoDebtValIdr = 0;
    const cryptoDebts: any[] = [];
    const assets = ["ALX", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "TRX", "DOT", "LINK", "MATIC", "LTC", "SHIB", "AVAX", "UNI", "ATOM", "XLM", "XMR", "NEAR", "ARB", "USDT"];
    assets.forEach(asset => {
      let cryptoIn = 0;
      let cryptoOut = 0;

      userTxs.forEach((t: any) => {
        if (t.status === 'rejected' || isNeutralCategory(t.category)) return;
        const desc = String(t.description || '');

        if (t.fromCurrency || t.toCurrency) {
          if (t.toCurrency === asset) cryptoIn += Math.abs(Number(t.toAmount || t.cryptoAmount || 0));
          if (t.fromCurrency === asset) cryptoOut += Math.abs(Number(t.fromAmount || 0));
          return;
        }

        if (t.cryptoCurrency === asset || t.asset === asset) {
          const cAmt = Math.abs(Number(t.cryptoAmount || (t.asset === asset ? t.amount : 0) || 0));
          if (desc.includes('ke Saldo Dompet') || desc.startsWith('Jual ')) {
            cryptoOut += cAmt;
          } else if (desc.startsWith('Beli ') || t.type === 'income') {
            cryptoIn += cAmt;
          } else if (t.type === 'expense') {
            cryptoOut += cAmt;
          }
        }
      });

      const onChainSynced = Number(userData.syncedOnChainBalances?.[asset] || 0);
      if (onChainSynced > cryptoIn) cryptoIn = onChainSynced;

      const cryptoLedger = cryptoIn - cryptoOut;
      const cryptoActual = userData.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, cryptoActual - cryptoLedger);
      if (diff > 0.000001) {
        const dynamicAlxPriceUsdt = globalLiquidity?.lastAlxPriceUsdt || 0.108;
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
      hasDebt: totalDebt > 1000 && userData.tier !== "Restructured (Legal)",
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

  // 1. Explicit request for landing page via query parameter (?view=landing)
  const isExplicitLanding = searchParams.get('view') === 'landing';
  if (isExplicitLanding) {
    return <LandingPage />;
  }

  // 2. Smooth branded loader during SSR, initial mount, or auth resolution
  // This completely eliminates the glitch where LandingPage flashed briefly on hard refresh (Ctrl+Shift+R)
  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 rounded-full bg-[#F4B728] flex items-center justify-center text-black font-bold text-lg animate-pulse shadow-sm">
          A
        </div>
      </div>
    );
  }

  // 3. Authenticated session check after client has mounted
  const hasCookie = typeof document !== 'undefined' && (
    document.cookie.includes('alibank_session=1') || 
    document.cookie.includes('alibank_token=')
  );
  const hasStored = typeof window !== 'undefined' && !!localStorage.getItem('alibank_user');
  const isAuthenticated = Boolean(user || hasCookie || hasStored);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (isMobileViewport) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
      <div className="w-12 h-12 rounded-full bg-[#F4B728] flex items-center justify-center text-black font-bold text-lg animate-pulse shadow-sm">
        A
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        
        {/* HEADER */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">Dashboard</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[10px] font-mono text-[#666666]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Node Sync: {lastSync || "Connected"}</span>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                placeholder="Cari transaksi atau aset..."
                className="w-full h-10 pl-10 pr-4 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-[#DFDAD0] pl-5">
              <GasStation />
              <div 
                className="relative cursor-pointer p-2 hover:bg-[#FAF9F6] rounded-sm transition-colors text-[#666666] hover:text-black" 
                onClick={() => router.push('/notifications')}
                title="Notifikasi"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications && unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F4B728] text-black text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              <div 
                className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] cursor-pointer shrink-0 hover:border-black transition-colors" 
                onClick={() => router.push('/profile')}
                title="Profil Pengguna"
              >
                <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1400px] w-full mx-auto">

          {/* DEBT CRITICAL ALERT CARD */}
          {debtInfo.hasDebt && (
            <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-sm p-6 text-[#9F1239] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-sm bg-[#FFE4E6] border border-[#FECDD3] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-[#E11D48]" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-base font-bold text-[#881337] tracking-tight">Restriksi Likuiditas Akun</h3>
                  <p className="text-xs text-[#9F1239] leading-relaxed">
                    Terdeteksi kewajiban tidak terverifikasi sebesar Rp{debtInfo.totalDebtValIdr.toLocaleString('id-ID')}. Selesaikan kewajiban untuk memulihkan akses penuh ke brankas dana.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/debt-repayment')}
                className="px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Bayar Kewajiban →
              </button>
            </div>
          )}

          {/* KYC VERIFICATION ALERT */}
          {!debtInfo.hasDebt && userData && userData.kycStatus !== 'verified' && (
            <div className="p-5 rounded-sm bg-[#FFFDF5] border border-[#FDE68A] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-sm bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 border border-[#FDE68A]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif text-sm font-bold text-[#111111] tracking-tight">
                      Verifikasi Identitas Nasabah (KYC)
                    </h4>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-sm bg-[#F4B728]/25 text-[#92400E] border border-[#F4B728]/40 uppercase tracking-widest">
                      {userData.kycStatus === 'pending' ? 'Sedang Ditinjau' : 'Verifikasi Diperlukan'}
                    </span>
                  </div>
                  <p className="text-xs text-[#666666] font-light mt-1 leading-relaxed">
                    {userData.kycStatus === 'pending' 
                      ? 'Dokumen identitas Anda sedang ditinjau tim kepatuhan AliBank. Klik untuk memeriksa detail status pengajuan Anda.'
                      : 'Lakukan verifikasi KTP & selfie biometrik untuk membuka limit transaksi hingga Rp 100 Juta, pencairan rekening bank, dan fitur kliring PayPal.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/settings/kyc')}
                className="px-5 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm shrink-0 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#F4B728]" />
                <span>{userData.kycStatus === 'pending' ? 'Cek Status KYC' : 'Verifikasi Sekarang →'}</span>
              </button>
            </div>
          )}

          {/* TOP ROW GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* PORTFOLIO OVERVIEW CARD */}
            <div className="lg:col-span-2 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[300px] space-y-6">
              {/* Radial Sunburst Guilloche Watermark */}
              <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.035] pointer-events-none -mr-16 -mt-16">
                <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="30" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                </svg>
              </div>

              <div className="space-y-4 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777777]">
                    Total Saldo Terkonsolidasi
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#666666] bg-[#FAF9F6] border border-[#DFDAD0] px-2.5 py-1 rounded-sm truncate max-w-[180px]">
                      {userData?.walletAddress || "Initializing wallet..."}
                    </span>
                    <button 
                      onClick={copyAddress} 
                      title="Salin Alamat" 
                      className="w-7 h-7 rounded-sm bg-[#FAF9F6] hover:bg-[#F4F1EA] border border-[#DFDAD0] flex items-center justify-center transition-colors text-[#666666] hover:text-black cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6 pt-1">
                  <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-[#111111]">
                    Rp{totalValueCalculated.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </h1>
                  <span className="text-xl sm:text-2xl font-light text-[#777777]">
                    ≈ US${totalValueUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className={cn(
                    "text-xs font-mono font-bold px-2.5 py-1 rounded-sm border",
                    pnlData.isUp 
                      ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" 
                      : "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                  )}>
                    PNL Hari Ini: {pnlData.isUp ? '+' : ''}{pnlData.percent.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-[#888888] uppercase tracking-wider font-medium">
                    Terupdate langsung dari Mainnet
                  </span>
                </div>
              </div>

              {/* QUICK ACTIONS BAR */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#ECE7DE] relative z-10">
                <DesktopActionBtn icon={DollarSign} label="Beli Crypto" desc="Instan VA / Kartu" onClick={() => router.push('/crypto/buy')} />
                <DesktopActionBtn icon={ArrowRightLeft} label="Convert" desc="Swap Aset Instan" onClick={() => router.push('/crypto/buy?tab=convert')} />
                <DesktopActionBtn icon={Send} label="Kirim Aset" desc="Transfer ke Wallet Luar" onClick={() => router.push('/crypto/send')} />
                <DesktopActionBtn icon={Download} label="Terima" desc="Tampilkan QR / Address" onClick={() => router.push('/crypto/receive')} />
              </div>
            </div>

            {/* INTEGRATED GAMES / ALPHA WIDGET */}
            <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777777]">
                  Aktivitas & Ekosistem
                </h3>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Gunakan token ALX Anda untuk utilitas finansial, hiburan, atau copy-trading otomatis.
                </p>
              </div>

              <div className="space-y-3 my-2">
                <div 
                  onClick={() => router.push('/crypto/trade-pro/btc')}
                  className="p-3.5 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-sm bg-[#111111] flex items-center justify-center text-[#F4B728] font-mono text-xs font-bold shrink-0">
                      Tx
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">Trade X Pro</p>
                      <span className="text-[10px] text-[#777777] uppercase font-light mt-0.5 block">Simulator Options Kripto</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-black transition-colors" />
                </div>

                <div 
                  onClick={() => router.push('/games/spin')}
                  className="p-3.5 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-sm bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">Ali Spin Wheel</p>
                      <span className="text-[10px] text-[#777777] uppercase font-light mt-0.5 block">Fortune Spin Harian</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-black transition-colors" />
                </div>

                <div 
                  onClick={() => router.push('/games/moba')}
                  className="p-3.5 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-sm bg-[#F5F3FF] border border-[#DDD6FE] flex items-center justify-center text-[#7C3AED] shrink-0">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-black">AliBank Arena MOBA</p>
                      <span className="text-[10px] text-[#777777] uppercase font-light mt-0.5 block">Pertempuran Hero & Klaim ALX</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-black transition-colors" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button 
                  onClick={() => router.push('/p2p/order-history')}
                  className="w-full py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  P2P Order Hub
                </button>
                <button 
                  onClick={() => router.push('/alpha')}
                  className="w-full py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm cursor-pointer"
                >
                  Alpha Hub →
                </button>
              </div>
            </div>
          </div>

          {/* LOWER GRID FOR ASSETS AND RECENT TRANSACTIONS */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* ASSETS PORTFOLIO GRID */}
            <div className="xl:col-span-2 bg-white border border-[#DFDAD0] rounded-sm shadow-sm overflow-hidden p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold tracking-tight text-[#111111]">
                    Rincian Portofolio Aset
                  </h3>
                  <p className="text-xs text-[#777777] font-light">
                    Saldo terverifikasi langsung dari smart contract & cadangan terpusat
                  </p>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm">
                  Multi-Chain Reserves
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ECE7DE] text-[9px] font-bold uppercase text-[#777777] tracking-[0.14em] pb-3">
                      <th className="py-3 font-bold">Token</th>
                      <th className="py-3 text-right font-bold">Saldo Dimiliki</th>
                      <th className="py-3 text-right font-bold">Harga Satuan</th>
                      <th className="py-3 text-right font-bold">Estimasi Nilai (USD)</th>
                      <th className="py-3 text-right font-bold">Estimasi Nilai (IDR)</th>
                      <th className="py-3 text-center font-bold">Trend 24h</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F1EA]">
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
                        "POL": "Polygon POL",
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
                        "LINK", "POL", "MATIC", "LTC", "SHIB", "AVAX", "UNI", "ATOM", "XLM", "XMR", "NEAR", "ARB",
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
            </div>

            <div className="space-y-8 flex flex-col">
              {/* DEFI VAULT STAKING CARD */}
              {userData?.walletAddress && (
                <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F4B728] flex items-center justify-center shadow-sm text-black font-bold">
                        A
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-serif text-base font-bold text-[#111111] tracking-tight">DeFi Vault Tabungan</h3>
                          <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-sm bg-[#F4B728]/20 border border-[#F4B728]/40 text-[#855B00]">On-Chain</span>
                        </div>
                        <p className="text-[10px] font-mono text-[#888888] mt-0.5">
                          Vault: {userData.walletAddress.substring(0, 8)}...{userData.walletAddress.substring(userData.walletAddress.length - 6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-[#ECE7DE]">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">Saldo Staking (ETH)</span>
                      <span className="font-mono font-bold text-[#111111]">{vaultBalanceEth.toFixed(6).replace(/\.?0+$/, "")} ETH</span>
                    </div>

                    <div className="flex justify-between items-center py-3 bg-[#FAF9F6] rounded-sm px-4 border border-[#DFDAD0]">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-[#666666] uppercase tracking-wider">Yield Terkumpul (ALX)</span>
                        <span className="text-[8px] text-[#888888] uppercase font-mono">Berdetak Real-Time</span>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-bold font-mono text-[#111111]">
                          {vaultStakingYieldAlx > 0 ? vaultStakingYieldAlx.toFixed(8) : "0.00000000"} ALX
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold uppercase pt-1 text-[#777777]">
                      <span>Base APY</span>
                      <span className="text-emerald-600 font-mono font-bold">12.00% p.a</span>
                    </div>
                  </div>

                  {stakingClaimError && (
                    <div className="p-3 rounded-sm bg-[#FFF1F2] text-[#9F1239] text-xs font-medium border border-[#FECDD3]">
                      Error: {stakingClaimError}
                    </div>
                  )}

                  {stakingClaimSuccess && (
                    <div className="p-3 rounded-sm bg-[#F0FDF4] text-[#15803D] text-xs font-medium border border-[#BBF7D0]">
                      Klaim Berhasil! Token ALX telah dikreditkan ke saldo Anda.
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      className="h-10 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                      onClick={() => router.push('/crypto/receive?asset=ETH')}
                    >
                      Tabung ETH
                    </button>
                    <button 
                      disabled={isStakingClaiming || vaultStakingYieldAlx < 0.0001}
                      onClick={claimStakingYield}
                      className="h-10 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm active:scale-95 transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isStakingClaiming ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B728]" />
                      ) : (
                        "Klaim Yield (ALX)"
                      )}
                    </button>
                  </div>

                  <p className="text-[9px] text-[#9F1239] font-medium leading-relaxed text-center">
                    * Setoran baru atau penarikan ETH akan mereset durasi yield. Klaim ALX terlebih dahulu!
                  </p>
                </div>
              )}

              {/* RECENT TRANSACTIONS PANEL */}
              <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm space-y-6 flex flex-col justify-between flex-1">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#111111] tracking-tight">Riwayat Aktivitas</h3>
                    <History className="w-4 h-4 text-[#888888]" />
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1 no-scrollbar">
                    {userTxs && userTxs.length > 0 ? (
                      userTxs.slice(0, 6).map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-sm bg-[#FAF9F6] hover:bg-white border border-transparent hover:border-[#DFDAD0] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-sm flex items-center justify-center border", 
                              tx.type === 'income' 
                                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" 
                                : "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                            )}>
                              {tx.type === 'income' ? <Download className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#111111] leading-none truncate max-w-[130px]">{tx.description || tx.category}</p>
                              <span className="text-[9px] font-mono text-[#888888] block mt-1 uppercase">{new Date(tx.date || tx.timestamp?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono font-bold text-[#111111]">
                              {tx.amount ? `Rp${tx.amount.toLocaleString()}` : `${tx.cryptoAmount?.toFixed(4) || tx.toAmount?.toFixed(4)} ${tx.cryptoCurrency || tx.toCurrency || ''}`}
                            </p>
                            <span className={cn(
                              "text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-sm border inline-block mt-0.5", 
                              tx.status === 'success' 
                                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" 
                                : "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
                            )}>
                              {tx.status || 'Success'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center opacity-40">
                        <p className="text-xs font-medium uppercase tracking-widest text-[#888888]">Belum ada transaksi</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  className="w-full py-2.5 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] text-xs font-bold uppercase tracking-wider rounded-sm transition-colors mt-3 cursor-pointer" 
                  onClick={() => router.push('/transactions')}
                >
                  Lihat Semua Riwayat →
                </button>
              </div>
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
    <button 
      className="flex items-center gap-3.5 p-3.5 rounded-sm bg-[#FAF9F6] hover:bg-white transition-all border border-[#DFDAD0] hover:border-black text-left group cursor-pointer" 
      onClick={onClick}
    >
      <div className="w-9 h-9 rounded-sm bg-white border border-[#DFDAD0] group-hover:border-black flex items-center justify-center shrink-0 shadow-xs transition-colors">
        <Icon className="w-4.5 h-4.5 text-[#111111]" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#111111] leading-none">{label}</p>
        <span className="text-[9px] text-[#777777] uppercase font-light block mt-1 leading-none">{desc}</span>
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
      className="hover:bg-[#FAF9F6] transition-colors cursor-pointer group text-xs"
    >
      <td className="py-3.5">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#DFDAD0]", 
            isNative 
              ? "bg-[#F4B728] text-black font-bold" 
              : (symbol === 'IDR' 
                  ? "bg-[#F0FDF4] text-[#15803D]" 
                  : (symbol === 'ETH_VAULT' 
                      ? "bg-[#111111] text-white p-1.5" 
                      : "bg-white relative"))
          )}>
            {isNative ? (
              <span className="font-bold text-xs text-black">A</span>
            ) : symbol === 'IDR' ? (
              <span className="font-bold text-[10px] text-[#15803D]">Rp</span>
            ) : symbol === 'ETH_VAULT' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#F4B728]">
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
                <div className="hidden absolute inset-0 flex items-center justify-center bg-[#FAF9F6] rounded-full font-bold text-xs text-[#888888]">
                  {symbol[0]}
                </div>
              </>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#111111]">{name}</span>
              {isNative && <span className="bg-[#F4B728]/25 text-[#92400E] border border-[#F4B728]/40 text-[7px] font-bold px-1 py-0.2 rounded-sm leading-none uppercase">V3.1</span>}
              {symbol === 'ETH_VAULT' && <span className="bg-[#111111] text-[#F4B728] text-[7px] font-bold px-1 py-0.2 rounded-sm leading-none uppercase">DeFi</span>}
            </div>
            <span className="text-[9px] font-mono text-[#888888] uppercase mt-0.5 block">{symbol === 'ETH_VAULT' ? 'ETH' : symbol}</span>
          </div>
        </div>
      </td>
      <td className="py-3.5 text-right font-mono text-xs font-bold text-[#111111]">
        <p className="leading-none">{amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 6 })}</p>
        <span className="text-[9px] font-mono text-[#888888] uppercase mt-1 block leading-none">{symbol}</span>
      </td>
      <td className="py-3.5 text-right font-mono text-xs text-[#666666]">
        <p className="leading-none">${priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
        <span className="text-[9px] font-mono text-[#888888] uppercase mt-1 block leading-none">USD</span>
      </td>
      <td className="py-3.5 text-right font-mono text-xs font-bold text-[#111111]">
        <p className="leading-none">
          ${(amount * priceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <span className="text-[9px] font-mono text-[#888888] uppercase mt-1 block leading-none">USD Value</span>
      </td>
      <td className="py-3.5 text-right font-mono text-xs font-bold text-[#111111]">
        <p className="leading-none">
          Rp{(amount * priceIdr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
        </p>
        <span className="text-[9px] font-mono text-[#888888] uppercase mt-1 block leading-none">IDR Value</span>
      </td>
      <td className="py-3.5 text-center w-24">
        <div className="flex flex-col items-center gap-1">
          <div className="h-5 w-20">
            {trend && trend.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area type="monotone" dataKey="value" stroke={isUp ? "#16A34A" : "#DC2626"} fill={isUp ? "#16A34A" : "#DC2626"} fillOpacity={0.06} strokeWidth={1.2} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          <span className={cn("text-[8px] font-mono font-bold leading-none", changePercent === 0 ? "text-[#888888]" : isUp ? "text-emerald-600" : "text-rose-600")}>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 rounded-full bg-[#F4B728] flex items-center justify-center text-black font-bold text-lg animate-pulse shadow-sm">
          A
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
