"use client";

/**
 * ALI-BANK MOBILE HOME V3.5
 * Handled in dedicated /m/ directory for pure mobile UX.
 */

import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  MessageSquareText, 
  Bell, 
  User, 
  DollarSign, 
  ArrowRightLeft, 
  Send, 
  Download,
  TrendingUp,
  TrendingDown,
  Zap,
  ShieldAlert,
  Skull,
  RotateCw,
  Copy,
  ArrowUpRight,
  Loader2,
  Coins,
  Cpu,
  Bitcoin
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";

const getIconUrl = (symbol: string) => {
  const s = symbol.toLowerCase();
  if (s === 'alx') return null;
  return `https://assets.coincap.io/assets/icons/${s}@2x.png`;
};

const GLOBAL_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
  "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
  "ATOMUSDT", "XLMUSDT", "XMRUSDT", "NEARUSDT", "ARBUSDT"
];

const FALLBACK_COINS = [
  { symbol: "BTC", price: 66450.00, change: -0.45, isUp: false, icon: getIconUrl("BTC") },
  { symbol: "ETH", price: 2420.00, change: 3.73, isUp: true, icon: getIconUrl("ETH") },
  { symbol: "BNB", price: 575.20, change: -1.20, isUp: false, icon: getIconUrl("BNB") },
  { symbol: "SOL", price: 145.50, change: 2.50, isUp: true, icon: getIconUrl("SOL") },
  { symbol: "XRP", price: 0.52, change: 0.85, isUp: true, icon: getIconUrl("XRP") },
  { symbol: "ADA", price: 0.45, change: -1.10, isUp: false, icon: getIconUrl("ADA") },
  { symbol: "DOGE", price: 0.14, change: 4.20, isUp: true, icon: getIconUrl("DOGE") },
  { symbol: "TRX", price: 0.12, change: 0.30, isUp: true, icon: getIconUrl("TRX") },
  { symbol: "DOT", price: 6.50, change: -2.40, isUp: false, icon: getIconUrl("DOT") },
  { symbol: "LINK", price: 15.20, change: 1.80, isUp: true, icon: getIconUrl("LINK") },
  { symbol: "MATIC", price: 0.68, change: -0.95, isUp: false, icon: getIconUrl("MATIC") },
  { symbol: "LTC", price: 82.40, change: 1.15, isUp: true, icon: getIconUrl("LTC") },
  { symbol: "SHIB", price: 0.000022, change: 5.40, isUp: true, icon: getIconUrl("SHIB") },
  { symbol: "AVAX", price: 34.80, change: -1.50, isUp: false, icon: getIconUrl("AVAX") },
  { symbol: "UNI", price: 7.20, change: 0.90, isUp: true, icon: getIconUrl("UNI") },
  { symbol: "ATOM", price: 8.40, change: -2.10, isUp: false, icon: getIconUrl("ATOM") },
  { symbol: "XLM", price: 0.11, change: 0.25, isUp: true, icon: getIconUrl("XLM") },
  { symbol: "XMR", price: 172.50, change: 0.60, isUp: true, icon: getIconUrl("XMR") },
  { symbol: "NEAR", price: 5.80, change: 3.10, isUp: true, icon: getIconUrl("NEAR") },
  { symbol: "ARB", price: 0.95, change: -1.80, isUp: false, icon: getIconUrl("ARB") }
];

function MobileHomePageContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'bursa' | 'dompet'>('bursa');
  
  // Real-time market state
  const [marketCoins, setMarketCoins] = useState<any[]>(() => {
    const alxPrice = 12.24;
    const rate = 15850;
    const alxData = { symbol: "ALX", price: alxPrice, baseIdr: alxPrice * rate, change: 1.14, isUp: true, isNative: true, icon: null };
    const formattedFallback = FALLBACK_COINS.map(c => ({
      ...c,
      baseIdr: c.price * rate
    }));
    return [alxData, ...formattedFallback];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(15850);
  const currentUsdtRate = useMemo(() => dynamicUsdtRate || 15850, [dynamicUsdtRate]);

  // Auth guard and mobile viewport redirect
  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      router.replace('/');
    }
  }, [user, userLoading, router]);

  // Sync tab with localStorage and search params
  useEffect(() => {
    if (!mounted) return;
    const savedMode = localStorage.getItem("alibank-active-mode") as 'bursa' | 'dompet';
    const urlTab = searchParams.get('tab') as 'bursa' | 'dompet';
    if (urlTab) {
      setActiveTab(urlTab);
      localStorage.setItem("alibank-active-mode", urlTab);
    } else if (savedMode) {
      setActiveTab(savedMode);
    }
  }, [mounted, searchParams]);

  // Switch tab helper
  const switchTab = useCallback((tab: 'bursa' | 'dompet') => {
    setActiveTab(tab);
    localStorage.setItem("alibank-active-mode", tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/m/home?${params.toString()}`, { scroll: false });
    window.dispatchEvent(new Event('alibank-mode-change'));
  }, [router, searchParams]);

  // Firebase doc definitions
  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(50)) : null), [db, user]);
  const { data: userTxs } = useCollection(txQuery);

  const notificationsQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "notifications"), where("read", "==", false)) : null), [db, user]);
  const { data: unreadNotifications } = useCollection(notificationsQuery);

  // Market Ticker fetcher
  const fetchMarketData = useCallback(async () => {
    const rate = currentUsdtRate;
    const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
    const alxData = {
      symbol: "ALX",
      price: alxPrice,
      baseIdr: alxPrice * rate,
      change: 1.14,
      isUp: true,
      isNative: true,
      icon: null
    };

    try {
      const symbolsToFetch = [...GLOBAL_SYMBOLS, "USDTIDRT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbolsToFetch))}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Market sync failed');
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response from market API');
      }

      const usdtIdrItem = data.find((d: any) => d.symbol === "USDTIDRT");
      const latestUsdtRate = usdtIdrItem ? parseFloat(usdtIdrItem.lastPrice) : rate;
      if (usdtIdrItem) {
        setDynamicUsdtRate(latestUsdtRate);
      }

      const formatted = data
        .filter((item: any) => item.symbol !== "USDTIDRT")
        .map((item: any) => {
          let symbol = item.symbol.replace("USDT", "");
          let price = parseFloat(item.lastPrice) * 1.02; // markup 2%
          return {
            symbol: symbol,
            price: price,
            change: parseFloat(item.priceChangePercent) || 0,
            isUp: (parseFloat(item.priceChangePercent) || 0) >= 0,
            baseIdr: price * latestUsdtRate,
            icon: getIconUrl(symbol)
          };
        });

      setMarketCoins([alxData, ...formatted]);
    } catch (e) {
      console.warn("Mobile market load error, using fallback:", e);
      const fallbackFormatted = FALLBACK_COINS.map(c => ({
        ...c,
        baseIdr: c.price * rate
      }));
      setMarketCoins([alxData, ...fallbackFormatted]);
    } finally {
      setIsLoading(false);
    }
  }, [globalLiquidity, currentUsdtRate]);

  useEffect(() => {
    if (mounted) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 20000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchMarketData]);

  // Balance calculation (in IDR and USD)
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

  // Debt Info check
  const debtInfo = useMemo(() => {
    if (!userData || !userTxs) return { hasDebt: false, totalDebtValIdr: 0 };
    const isNeutralCategory = (cat: string) => ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat);
    
    const idrInflow = userTxs.filter(t => t.type === 'income' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrOutflow = userTxs.filter(t => t.type === 'expense' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrLedger = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (userData.totalBalance || 0) - idrLedger);

    let totalCryptoDebtValIdr = 0;
    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    assets.forEach(asset => {
      const cryptoIn = userTxs.filter(t => t.type === 'income' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.toAmount || 0), 0);
      const cryptoOut = userTxs.filter(t => t.type === 'expense' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.fromAmount || 0), 0);
      const cryptoLedger = cryptoIn - cryptoOut;
      const cryptoActual = userData.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, cryptoActual - cryptoLedger);
      if (diff > 0.000001) {
        const priceMap: any = { ALX: 194004, BTC: 1100000000, ETH: 35000000, USDT: 15850 };
        totalCryptoDebtValIdr += diff * (priceMap[asset] || 0);
      }
    });

    const totalDebt = illegalDebtIdr + totalCryptoDebtValIdr;
    return {
      hasDebt: totalDebt > 1000,
      totalDebtValIdr: totalDebt
    };
  }, [userData, userTxs]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet telah disalin." });
    }
  };

  if (!mounted || userLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* HEADER SECTION */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border cursor-pointer shrink-0" onClick={() => router.push('/profile')}>
            {userData?.avatarUrl ? (
              <img src={userData.avatarUrl} className="object-cover w-full h-full" alt="Avatar" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-200"><User className="w-4 h-4 text-slate-500" /></div>
            )}
          </div>
          <div className="relative cursor-pointer shrink-0" onClick={() => router.push('/notifications')}>
            <MessageSquareText className="w-6 h-6" />
            {unreadNotifications && unreadNotifications.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background px-1">
                {unreadNotifications.length}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex bg-muted/60 p-1 rounded-lg">
          <button onClick={() => switchTab('bursa')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase italic rounded-md transition-all", activeTab === 'bursa' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Bursa</button>
          <button onClick={() => switchTab('dompet')} className={cn("px-4 py-1.5 text-[10px] font-black uppercase italic rounded-md transition-all", activeTab === 'dompet' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Dompet</button>
        </div>

        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 cursor-pointer" onClick={() => router.push('/notifications')} />
          <Zap className="w-5 h-5 text-primary cursor-pointer" onClick={() => router.push('/topup')} />
        </div>
      </header>

      {/* DEBT BANNERS */}
      {debtInfo.hasDebt && (
        <div className="mx-4 mt-4">
          <Card className="bg-rose-600 text-white rounded-2xl p-4 shadow-lg border-none flex items-center justify-between cursor-pointer" onClick={() => router.push('/debt-repayment')}>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase italic leading-none">Restriksi Akun Aktif</p>
                <p className="text-[8px] font-bold uppercase opacity-80 mt-1">Harap lunasi kewajiban Rp{debtInfo.totalDebtValIdr.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4" />
          </Card>
        </div>
      )}

      {/* MAIN VIEW CONTENTS */}
      <main className="px-4 pt-6 space-y-8 animate-in fade-in duration-500">
        
        {/* ESTIMATED BALANCE DISPLAY */}
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic leading-none">
            {activeTab === 'bursa' ? "Total Nilai Estimasi (IDR)" : "Total Nilai Estimasi (USD)"}
          </p>
          <h1 className="text-4xl font-black italic tracking-tighter">
            {activeTab === 'bursa' 
              ? `Rp${totalValueCalculated.toLocaleString('id-ID')}` 
              : `US$${totalValueUsd.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </h1>
          <div className="flex items-center gap-1.5">
            <Badge className={cn("text-[8px] font-black italic border-none uppercase", pnlData.isUp ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600")}>
              PNL: {pnlData.isUp ? '+' : ''}{pnlData.percent.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* 4 ACTION BUTTONS (Beli, Swap, Kirim, Terima) */}
        <div className="grid grid-cols-4 gap-4">
          <ActionBtn icon={DollarSign} label="Beli" onClick={() => router.push('/crypto/buy')} />
          <ActionBtn icon={ArrowRightLeft} label="Swap" onClick={() => router.push('/crypto/convert')} />
          <ActionBtn icon={Send} label="Kirim" onClick={() => router.push('/crypto/send')} />
          <ActionBtn icon={Download} label="Terima" onClick={() => router.push('/crypto/receive')} />
        </div>

        {/* CONDITIONAL MAIN CONTAINER TAB */}
        {activeTab === 'bursa' ? (
          <>
            {/* INTERACTIVE GAMES SECTION */}
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Game Populer</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-muted/40 border border-border/80 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-muted/80 transition-all shadow-sm" onClick={() => router.push('/crypto/trade-pro/btc')}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic shrink-0">Tx</div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase italic leading-tight">Trade X</p>
                    <span className="text-[7px] font-bold text-muted-foreground uppercase leading-none block mt-0.5">Trading Game</span>
                  </div>
                </Card>
                <Card className="p-4 bg-muted/40 border border-border/80 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-muted/80 transition-all shadow-sm" onClick={() => router.push('/games/spin')}>
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0"><RotateCw className="w-5 h-5" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase italic leading-tight">Ali Spin</p>
                    <span className="text-[7px] font-bold text-muted-foreground uppercase leading-none block mt-0.5">Fortune Wheel</span>
                  </div>
                </Card>
              </div>
            </section>

            {/* DYNAMIC MARKET ASSETS LIST */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aset Populer</h3>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
              </div>
              <div className="space-y-6">
                {marketCoins.map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between cursor-pointer active:opacity-75" onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden", coin.isNative ? "gold-gradient" : "bg-muted border border-border/10")}>
                        {coin.isNative ? (
                          <LogoIcon className="text-white p-2 w-full h-full" />
                        ) : (
                          <>
                            <img 
                              src={coin.icon || ""} 
                              className="object-cover w-full h-full" 
                              alt={coin.symbol} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-lg font-black text-[10px] text-slate-400">
                              {coin.symbol[0]}
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-black italic uppercase text-foreground">{coin.symbol}</span>
                          {coin.isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 border-none leading-none">V3</Badge>}
                        </div>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Rupiah: Rp{coin.baseIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black italic text-foreground">${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</p>
                      <p className={cn("text-[9px] font-black italic leading-none mt-0.5", coin.change >= 0 ? "text-green-500" : "text-rose-500")}>
                        {coin.change >= 0 ? '+' : ''}{coin.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* DOMPET MODE VIEWS */
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
            {/* Wallet Address bar */}
            <div className="flex items-center gap-3 bg-muted/30 px-3 py-2.5 rounded-2xl border border-border/50">
              <span className="text-[10px] font-mono text-muted-foreground truncate flex-1 uppercase">
                {userData?.walletAddress || "0xNoWalletInitialized"}
              </span>
              <button onClick={copyAddress} className="w-6 h-6 rounded bg-muted flex items-center justify-center cursor-pointer active:scale-90 transition-transform shrink-0">
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            {/* Token list with actual balances */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aset Saya</h3>
              
              <div className="space-y-5">
                {/* ALX */}
                <WalletAssetRow 
                  name="Alix Coin" 
                  symbol="ALX" 
                  amount={userData?.cryptoBalances?.ALX ?? 0} 
                  usdValue={(userData?.cryptoBalances?.ALX ?? 0) * (marketCoins.find(c => c.symbol === "ALX")?.price ?? 12.24)} 
                  change="+1.14%"
                  isUp={true}
                  icon={LogoIcon} 
                  color="gold-gradient text-white"
                  networkBadge="ALX"
                />

                {/* ETH */}
                <WalletAssetRow 
                  name="Ethereum" 
                  symbol="ETH" 
                  amount={userData?.cryptoBalances?.ETH ?? 0} 
                  usdValue={(userData?.cryptoBalances?.ETH ?? 0) * (marketCoins.find(c => c.symbol === "ETH")?.price ?? 2400)} 
                  change="+3.73%"
                  isUp={true}
                  icon={Cpu} 
                  color="bg-blue-600 text-white"
                  networkBadge="ETH"
                />

                {/* USDT */}
                <WalletAssetRow 
                  name="TetherUS" 
                  symbol="USDT" 
                  amount={userData?.cryptoBalances?.USDT ?? 0} 
                  usdValue={(userData?.cryptoBalances?.USDT ?? 0)} 
                  change="+0.01%"
                  isUp={true}
                  icon={Zap} 
                  color="bg-teal-600 text-white"
                  networkBadge="BSC"
                />

                {/* BTC */}
                <WalletAssetRow 
                  name="Bitcoin" 
                  symbol="BTC" 
                  amount={userData?.cryptoBalances?.BTC ?? 0} 
                  usdValue={(userData?.cryptoBalances?.BTC ?? 0) * (marketCoins.find(c => c.symbol === "BTC")?.price ?? 66000)} 
                  change="-0.45%"
                  isUp={false}
                  icon={Bitcoin} 
                  color="bg-orange-500 text-white"
                  networkBadge="BTC"
                />

                {/* Rupiah */}
                <WalletAssetRow 
                  name="Rupiah" 
                  symbol="IDR" 
                  amount={userData?.totalBalance ?? 0} 
                  usdValue={(userData?.totalBalance ?? 0) / currentUsdtRate} 
                  change="+0.22%"
                  isUp={true}
                  icon={() => <span className="font-black text-[10px]">Rp</span>} 
                  color="bg-rose-600 text-white font-bold"
                  networkBadge="FIAT"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Reusable action button component
function ActionBtn({ icon: Icon, label, onClick }: any) {
  return (
    <button className="flex flex-col items-center gap-2 group" onClick={onClick}>
      <div className="w-full aspect-square rounded-2xl bg-muted border border-border flex items-center justify-center transition-transform active:scale-95 group-hover:bg-muted/80">
        <Icon className="w-5 h-5 text-foreground" />
      </div>
      <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">{label}</span>
    </button>
  );
}

// Reusable wallet asset row component
function WalletAssetRow({ name, symbol, amount, usdValue, change, isUp, icon: Icon, color, networkBadge }: any) {
  return (
    <div className="flex items-center justify-between py-2 group cursor-pointer active:opacity-75 transition-all">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2 shadow-sm shrink-0", color)}>
            <Icon className="w-full h-full" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-muted border-2 border-background rounded-full flex items-center justify-center">
            <span className="text-[6px] font-black text-muted-foreground">{networkBadge}</span>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-black italic uppercase text-foreground leading-none">{name}</h4>
          <p className={cn("text-[9px] font-black uppercase mt-1 leading-none", isUp ? "text-green-500" : "text-rose-500")}>
            {change}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-black italic text-foreground leading-none">
          US${usdValue.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className={cn("text-[9px] font-bold text-muted-foreground uppercase mt-1 leading-none", amount <= 0 && "opacity-20")}>
          {amount.toFixed(6).replace(/\.?0+$/, "")} {symbol}
        </p>
      </div>
    </div>
  );
}

export default function MobileHomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <MobileHomePageContent />
    </Suspense>
  );
}
