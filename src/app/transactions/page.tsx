"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { 
  Search, 
  Settings, 
  Eye, 
  EyeOff,
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  History, 
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wallet,
  PiggyBank,
  Zap,
  Coins,
  CheckCircle2,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Lock,
  ShieldCheck,
  Percent,
  Sparkles,
  ExternalLink,
  Plus,
  Landmark,
  QrCode,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { ALX_PRICE_USD_FALLBACK, IDR_RATE_FALLBACK } from "@/lib/currency";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useVaultStaking } from "@/hooks/useVaultStaking";
import { TooltipProvider } from "@/components/ui/tooltip";

// Definisi aset yang didukung — sesuaikan dengan field cryptoBalances di Firestore
const ASSET_CONFIG: Record<string, {
  name: string;
  color: string;
  bgColor: string;
  decimals: number;
  icon: React.ReactNode;
}> = {
  USDT: {
    name: "TetherUS",
    color: "text-teal-600",
    bgColor: "bg-teal-50",
    decimals: 4,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.008 0-1.724-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V8H8.595v3.427h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.122 0 1.047 3.309 1.919 7.709 2.12v7.596h3.913v-7.6c4.393-.202 7.694-1.073 7.694-2.12 0-1.047-3.301-1.917-7.694-2.12" fill="white"/>
      </svg>
    )
  },
  BTC: {
    name: "Bitcoin",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    decimals: 8,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#F7931A"/>
        <path d="M22.504 13.674c.322-2.151-1.317-3.308-3.558-4.079l.727-2.914-1.774-.442-.708 2.838c-.467-.116-.947-.225-1.424-.334l.712-2.854-1.773-.442-.727 2.913c-.386-.088-.766-.175-1.135-.267l.002-.009-2.447-.611-.472 1.895s1.317.302 1.289.32c.719.179.849.654.827 1.032l-.828 3.319c.049.013.113.031.183.059l-.186-.046-1.161 4.653c-.088.218-.311.546-.814.421.018.026-1.29-.322-1.29-.322l-.882 2.03 2.309.576c.429.108.85.22 1.266.326l-.734 2.945 1.772.442.727-2.916c.485.131.956.253 1.416.368l-.724 2.9 1.773.442.734-2.94c3.024.572 5.298.341 6.254-2.394.771-2.202-.038-3.471-1.629-4.3 1.158-.267 2.031-1.03 2.263-2.604zm-4.048 5.674c-.548 2.202-4.255 1.012-5.459.714l.974-3.904c1.204.3 5.065.895 4.485 3.19zm.548-5.707c-.499 2.002-3.587.985-4.591.736l.883-3.538c1.004.25 4.231.715 3.708 2.802z" fill="white"/>
      </svg>
    )
  },
  ETH: {
    name: "Ethereum",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    decimals: 8,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.616z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </svg>
    )
  },
  ALX: {
    name: "Alix Coin",
    color: "text-[#B8860B]",
    bgColor: "bg-amber-50",
    decimals: 6,
    icon: <LogoIcon className="text-[#F4B728] w-5 h-5" />
  }
};

// Harga fallback (USD)
const FALLBACK_PRICE_USD: Record<string, number> = {
  BTC: 66450,
  ETH: 2420,
  USDT: 1,
  ALX: ALX_PRICE_USD_FALLBACK,
};

type TopTab = 'Ringkasan' | 'Pendanaan' | 'Earn' | 'Spot';

export default function AssetsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  
  const [activeTopTab, setActiveTopTab] = useState<TopTab>('Ringkasan');
  const [activeSubTab, setActiveSubTab] = useState<'Kripto' | 'IDR Fiat'>('Kripto');
  const [showBalance, setShowBalance] = useState(true);
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Spot quick swap state
  const [swapAmount, setSwapAmount] = useState<string>("100000");
  const [swapFrom, setSwapFrom] = useState<string>("IDR");
  const [swapTo, setSwapTo] = useState<string>("ALX");

  // Earn simulator state
  const [calcAmount, setCalcAmount] = useState<string>("1");

  const [priceUsd, setPriceUsd] = useState<Record<string, number>>(FALLBACK_PRICE_USD);
  const [idrPerUsd, setIdrPerUsd] = useState<number>(IDR_RATE_FALLBACK);

  useEffect(() => {
    let cancelled = false;
    const loadPrices = async () => {
      try {
        const symbols = ["BTCUSDT", "ETHUSDT", "USDTIDRT"];
        const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}&t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || cancelled) return;
        const btc = parseFloat(data.find((d: any) => d.symbol === 'BTCUSDT')?.lastPrice);
        const eth = parseFloat(data.find((d: any) => d.symbol === 'ETHUSDT')?.lastPrice);
        const rate = parseFloat(data.find((d: any) => d.symbol === 'USDTIDRT')?.lastPrice);
        setPriceUsd(prev => ({
          ...prev,
          ...(btc > 0 ? { BTC: btc } : {}),
          ...(eth > 0 ? { ETH: eth } : {}),
        }));
        if (rate > 10000) setIdrPerUsd(rate);
      } catch {}
    };
    loadPrices();
    const id = setInterval(loadPrices, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const liquidityDocRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

  const PRICE_IDR = useMemo<Record<string, number>>(() => {
    const alx = Number(globalLiquidity?.lastAlxPriceUsdt) > 0 ? Number(globalLiquidity?.lastAlxPriceUsdt) : priceUsd.ALX;
    return {
      BTC: priceUsd.BTC * idrPerUsd,
      ETH: priceUsd.ETH * idrPerUsd,
      USDT: idrPerUsd,
      ALX: alx * idrPerUsd,
    };
  }, [priceUsd, idrPerUsd, globalLiquidity?.lastAlxPriceUsdt]);

  useEffect(() => {
    setMounted(true);
    document.title = "Portofolio & Riwayat Aktivitas - AliBank V 3.1";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

  // Ambil transaksi user untuk tab Pendanaan, Earn, dan Spot
  const txQuery = useMemoFirebase(() => 
    (db && user) 
      ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(40))
      : null, 
    [db, user]
  );
  const { data: rawTxs, isLoading: txsLoading } = useCollection(txQuery);

  // Ambil dompet terhubung
  const activeWalletAddress = useMemo(() => {
    if (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized') {
      return userData.externalWalletAddress;
    }
    return userData?.walletAddress || null;
  }, [userData]);

  // Load saldo on-chain dan yield dari smart contract AliBankVault
  const {
    stakedEth: vaultBalanceEth,
    accruedRewards: vaultStakingYieldAlx,
    isClaiming: isStakingClaiming,
    claimSuccess: stakingClaimSuccess,
    claimError: stakingClaimError,
    claimYield: claimStakingYield
  } = useVaultStaking(activeWalletAddress, user?.uid || null);

  // Otomatis sinkronkan deposit on-chain dari dompet eksternal
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
  }, [user?.uid, userData?.walletAddress, activeWalletAddress]);

  // Bangun daftar aset dari data Firestore user
  const portfolioAssets = useMemo(() => {
    if (!userData) return [];
    const cryptoBalances = userData.cryptoBalances || {};
    
    return Object.entries(ASSET_CONFIG)
      .map(([symbol, config]) => {
        const amount = cryptoBalances[symbol] ?? 0;
        const priceIdr = PRICE_IDR[symbol] ?? 0;
        const valueIdr = amount * priceIdr;
        return { symbol, ...config, amount, valueIdr };
      })
      .filter(a => a.amount > 0)
      .sort((a, b) => b.valueIdr - a.valueIdr);
  }, [userData, PRICE_IDR]);

  // Total nilai portofolio kripto custodial dalam IDR
  const totalCryptoValueIdr = useMemo(() => 
    portfolioAssets.reduce((sum, a) => sum + a.valueIdr, 0),
  [portfolioAssets]);

  // Nilai tabungan vault on-chain dalam IDR
  const vaultValueIdr = useMemo(() => 
    (vaultBalanceEth ?? 0) * (PRICE_IDR.ETH ?? 0),
  [vaultBalanceEth, PRICE_IDR]);

  // Total saldo IDR fiat
  const totalIdrBalance = userData?.totalBalance ?? 0;

  // Grand total
  const grandTotal = totalIdrBalance + totalCryptoValueIdr + vaultValueIdr;

  // Filter transaksi untuk Pendanaan (topup / withdraw / deposit)
  const fundingTransactions = useMemo(() => {
    if (!rawTxs) return [];
    return rawTxs.filter((tx: any) => {
      const type = (tx.type || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      return type.includes('topup') || type.includes('withdraw') || type.includes('deposit') || 
             desc.includes('setor') || desc.includes('tarik') || desc.includes('top up') || desc.includes('kliring');
    });
  }, [rawTxs]);

  // Filter transaksi untuk Earn (staking / yield)
  const earnTransactions = useMemo(() => {
    if (!rawTxs) return [];
    return rawTxs.filter((tx: any) => {
      const type = (tx.type || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      return desc.includes('yield') || desc.includes('stake') || desc.includes('klaim') || 
             desc.includes('bunga') || desc.includes('reward') || type.includes('yield') || type.includes('reward');
    });
  }, [rawTxs]);

  // Filter transaksi untuk Spot (trade / buy / sell / convert)
  const spotTransactions = useMemo(() => {
    if (!rawTxs) return [];
    return rawTxs.filter((tx: any) => {
      const type = (tx.type || '').toLowerCase();
      const desc = (tx.description || '').toLowerCase();
      return desc.includes('beli') || desc.includes('jual') || desc.includes('swap') || 
             desc.includes('convert') || desc.includes('trade') || type.includes('trade');
    });
  }, [rawTxs]);

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 text-[#111111] animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#666666]">Memuat Portofolio & Aktivitas...</p>
      </div>
    );
  }

  // Helper render header tab bar
  const renderTabBar = () => (
    <div className="flex items-center justify-between border-b border-[#DFDAD0] pb-2">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {(['Ringkasan', 'Pendanaan', 'Earn', 'Spot'] as TopTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTopTab(tab)}
            className={cn(
              "text-xs font-serif font-bold uppercase tracking-wider pb-2 relative transition-colors cursor-pointer shrink-0",
              activeTopTab === tab 
                ? "text-[#111111] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#111111]" 
                : "text-[#777777] hover:text-[#111111]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => router.push('/transactions/history')}
          className="p-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          title="Riwayat Lengkap"
        >
          <History className="w-3.5 h-3.5 text-[#F4B728]" />
          <span className="hidden sm:inline">Riwayat Lengkap</span>
        </button>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black w-full">
        {/* SIDEBAR NAVIGATION (Desktop) */}
        {!isMobile && <Sidebar />}

        {/* MAIN CONTAINER */}
        <main className={cn("flex-1 flex flex-col min-w-0 bg-[#FAF9F6] text-[#111111]", !isMobile && "ml-64")}>
          {/* HEADER */}
          <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">Portofolio & Riwayat Aktivitas</h2>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm hidden sm:inline">
                AliBank Institutional Ledger
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push('/')}
                className="p-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] transition-colors cursor-pointer shadow-xs sm:hidden"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div 
                className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] flex items-center justify-center font-serif text-xs font-bold cursor-pointer hover:border-black transition-colors"
                onClick={() => router.push('/profile')}
                title="Profil Nasabah"
              >
                {userData?.name?.[0] || user?.email?.[0] || "U"}
              </div>
            </div>
          </header>

          {/* CONTAINER CONTENT */}
          <div className="p-4 sm:p-8 space-y-6 max-w-[1300px] w-full mx-auto overflow-y-auto">
            {/* Top Tab Bar */}
            {renderTabBar()}

            {/* ========================================================================= */}
            {/* TAB 1: RINGKASAN (Overview, Custodial Assets, Vault)                      */}
            {/* ========================================================================= */}
            {activeTopTab === 'Ringkasan' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
                {/* Left Column: Estimated Total Balance (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white border border-[#DFDAD0] rounded-sm p-6 space-y-6 shadow-xs relative overflow-hidden">
                    {/* Watermark */}
                    <div className="absolute top-0 right-0 w-36 h-36 opacity-[0.03] pointer-events-none -mr-8 -mt-8">
                      <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                        <circle cx="100" cy="100" r="30" strokeWidth="1" />
                        <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                        <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                      </svg>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[#777777]">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Estimasi Total Nilai</span>
                        <button onClick={() => setShowBalance(!showBalance)} className="cursor-pointer hover:text-black">
                          {showBalance 
                            ? <Eye className="w-3.5 h-3.5" />
                            : <EyeOff className="w-3.5 h-3.5 text-[#F4B728]" />
                          }
                        </button>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
                          {showBalance 
                            ? `Rp${grandTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                            : '••••••••'}
                        </h1>
                        <span className="font-mono text-xs font-bold text-[#888888] uppercase">IDR</span>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-4 border-t border-[#EAE6DF] text-xs font-medium text-[#666666]">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-[#111111]" /> 
                          <span>Saldo Fiat IDR</span>
                        </span>
                        <span className="font-mono font-bold text-[#111111]">
                          {showBalance ? `Rp${totalIdrBalance.toLocaleString('id-ID')}` : '••••••'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-[#F4B728]" /> 
                          <span>Saldo Kripto & DeFi</span>
                        </span>
                        <span className="font-mono font-bold text-[#111111]">
                          {showBalance ? `Rp${(totalCryptoValueIdr + vaultValueIdr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '••••••'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <button 
                        onClick={() => router.push('/?open=add_funds')}
                        className="py-2.5 px-3 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center"
                      >
                        Top-Up
                      </button>
                      <button 
                        onClick={() => router.push('/crypto/send')}
                        className="py-2.5 px-3 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center"
                      >
                        Kirim
                      </button>
                      <button 
                        onClick={() => router.push('/transfer')}
                        className="py-2.5 px-3 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>

                  {/* Node Status Card */}
                  <div className="p-5 rounded-sm bg-white border border-[#DFDAD0] shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111]">Ledger Multi-Chain Terverifikasi</h4>
                    </div>
                    <p className="text-xs text-[#666666] font-light leading-relaxed">
                      Seluruh aset tercatat pada node perbankan hibrida dengan verifikasi on-chain 1:1 Proof-of-Reserves dan penyimpanan vault terpisah.
                    </p>
                  </div>
                </div>

                {/* Right Column: Asset List & Sub-Tabs (8 cols) */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center justify-between border-b border-[#DFDAD0] pb-2">
                    <div className="flex gap-6">
                      {(['Kripto', 'IDR Fiat'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveSubTab(tab)}
                          className={cn(
                            "pb-2 font-serif text-xs font-bold uppercase tracking-wider relative transition-colors cursor-pointer",
                            activeSubTab === tab 
                              ? "text-[#111111] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#111111]" 
                              : "text-[#777777] hover:text-[#111111]"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-[#777777]">
                      <button onClick={() => router.push('/marketplace')} className="hover:text-black transition-colors" title="Cari Pasar">
                        <Search className="w-4 h-4" />
                      </button>
                      <button onClick={() => router.push('/settings')} className="hover:text-black transition-colors" title="Pengaturan Portofolio">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-Tab 1: Kripto & DeFi Vault */}
                  {activeSubTab === 'Kripto' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      {/* DeFi Vault Card */}
                      {userData?.walletAddress && (
                        <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] space-y-4 shadow-xs relative overflow-hidden">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3.5">
                              <div className="w-10 h-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center">
                                <Landmark className="w-5 h-5 text-[#F4B728]" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-serif text-base font-bold text-[#111111]">DeFi Vault Tabungan</h3>
                                  <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm font-bold">
                                    Ethereum On-Chain
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-[#777777] mt-0.5 truncate max-w-[280px]">
                                  Alamat Node: {userData.walletAddress}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-serif text-base font-bold text-[#111111]">
                                {showBalance 
                                  ? `${vaultBalanceEth.toFixed(6).replace(/\.?0+$/, "")} ETH` 
                                  : '••••••'}
                              </p>
                              <p className="font-mono text-xs text-[#777777] mt-0.5">
                                {showBalance 
                                  ? `≈ Rp${vaultValueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                                  : '••••••'}
                              </p>
                            </div>
                          </div>

                          {/* Ticking Staking Yield Counter */}
                          <div className="p-3.5 bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block">Yield Terkumpul (ALX)</span>
                              <span className="text-[9px] font-mono text-emerald-700 font-medium">Bunga Berjalan Real-Time (12% APY)</span>
                            </div>
                            <p className="font-mono text-sm font-bold text-[#111111]">
                              {showBalance 
                                ? (vaultStakingYieldAlx > 0 ? vaultStakingYieldAlx.toFixed(8) : "0.00000000")
                                : "••••••••"} <span className="text-[#F4B728]">ALX</span>
                            </p>
                          </div>

                          {stakingClaimError && (
                            <div className="p-2.5 rounded-sm bg-rose-50 text-rose-700 text-xs border border-rose-200">
                              Error: {stakingClaimError}
                            </div>
                          )}

                          {stakingClaimSuccess && (
                            <div className="p-2.5 rounded-sm bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">
                              Klaim Berhasil! Token ALX telah ditambahkan ke saldo Anda.
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#EAE6DF]">
                            <button 
                              onClick={() => router.push('/crypto/receive?asset=ETH')}
                              className="py-2.5 px-4 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors cursor-pointer shadow-xs"
                            >
                              Tabung (Deposit ETH)
                            </button>
                            <button 
                              disabled={isStakingClaiming || vaultStakingYieldAlx < 0.0001}
                              onClick={claimStakingYield}
                              className="py-2.5 px-4 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              {isStakingClaiming ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B728]" />
                              ) : (
                                <span>Klaim Yield (ALX)</span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Asset Rows */}
                      <div className="space-y-3">
                        {portfolioAssets.length === 0 && !userData?.walletAddress ? (
                          <div className="py-16 flex flex-col items-center text-center bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-xs">
                            <Wallet className="w-10 h-10 text-[#AAAAAA] mb-3" />
                            <h4 className="font-serif text-base font-bold text-[#111111]">Belum Ada Aset Kripto</h4>
                            <p className="text-xs text-[#666666] font-light mt-1">Beli atau terima kripto untuk mulai bertransaksi di AliBank</p>
                            <button 
                              onClick={() => router.push('/crypto/buy')}
                              className="mt-4 py-2.5 px-5 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                            >
                              Beli Kripto Sekarang
                            </button>
                          </div>
                        ) : (
                          portfolioAssets.map((asset) => (
                            <div 
                              key={asset.symbol} 
                              className="p-5 rounded-sm bg-white border border-[#DFDAD0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-[#111111] transition-colors shadow-xs group"
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-center shrink-0">
                                  {asset.icon}
                                </div>
                                <div>
                                  <h4 className="font-serif text-sm font-bold text-[#111111]">{asset.symbol}</h4>
                                  <p className="text-xs text-[#777777] font-light">{asset.name}</p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                <div className="text-left sm:text-right">
                                  <p className="font-mono text-sm font-bold text-[#111111]">
                                    {showBalance 
                                      ? asset.amount.toFixed(asset.decimals) 
                                      : '••••••'}
                                  </p>
                                  <p className="font-mono text-xs text-[#777777]">
                                    {showBalance 
                                      ? `≈ Rp${asset.valueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                                      : '••••••'}
                                  </p>
                                </div>

                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => router.push(`/crypto/receive?asset=${asset.symbol}`)}
                                    className="py-1.5 px-3 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                                  >
                                    Terima
                                  </button>
                                  <button 
                                    onClick={() => router.push(`/crypto/send?asset=${asset.symbol}`)}
                                    className="py-1.5 px-3 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                                  >
                                    Kirim
                                  </button>
                                  <button 
                                    onClick={() => router.push(`/crypto/trade/${asset.symbol.toLowerCase()}`)}
                                    className="py-1.5 px-3 bg-[#111111] hover:bg-black text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                                  >
                                    Dagang
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Asset Dotted Button */}
                      <button 
                        onClick={() => router.push('/crypto/buy')}
                        className="w-full flex items-center justify-center gap-2.5 p-4 rounded-sm bg-white border border-dashed border-[#DFDAD0] hover:border-[#111111] transition-colors cursor-pointer shadow-xs group"
                      >
                        <Plus className="w-4 h-4 text-[#F4B728]" />
                        <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111]">
                          Beli / Terima Aset Kripto Baru
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Sub-Tab 2: IDR Fiat */}
                  {activeSubTab === 'IDR Fiat' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-center">
                            <LogoIcon className="text-[#F4B728] w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-serif text-base font-bold text-[#111111]">Rupiah Indonesia (IDR)</h3>
                              <span className="font-mono text-[9px] uppercase px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-sm font-bold">
                                Terverifikasi
                              </span>
                            </div>
                            <p className="text-xs text-[#777777] font-light">Rekening Utama Kliring BI-FAST & QRIS</p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto justify-between">
                          <div className="text-left sm:text-right">
                            <p className="font-serif text-xl font-bold text-[#111111]">
                              {showBalance ? `Rp${totalIdrBalance.toLocaleString('id-ID')}` : '••••••••'}
                            </p>
                            <p className="text-[10px] font-mono text-[#777777]">Saldo Mengendap</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => router.push('/?open=add_funds')}
                              className="py-2 px-3.5 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5 text-[#F4B728]" /> Top-Up
                            </button>
                            <button 
                              onClick={() => router.push('/withdraw')}
                              className="py-2 px-3.5 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" /> Tarik
                            </button>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => router.push('/transactions/history')}
                        className="w-full flex items-center justify-between p-4 rounded-sm bg-white border border-[#DFDAD0] hover:border-[#111111] transition-colors cursor-pointer shadow-xs group"
                      >
                        <div className="flex items-center gap-3">
                          <History className="w-4 h-4 text-[#F4B728]" />
                          <span className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111]">
                            Lihat Riwayat Lengkap Transaksi Rupiah
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#888888]" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: PENDANAAN (Funding, Deposit/Withdrawal Ledger, Bank Clearing)       */}
            {/* ========================================================================= */}
            {activeTopTab === 'Pendanaan' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hero Funding Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-8 p-6 sm:p-8 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-5">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">Portofolio Likuiditas Pendanaan</span>
                      <h3 className="font-serif text-2xl font-bold text-[#111111]">Saldo Tersedia untuk Pendanaan & Kliring</h3>
                      <p className="text-xs text-[#666666] font-light leading-relaxed">
                        Dana dapat langsung disetor, ditarik ke rekening bank lokal, atau digunakan untuk transaksi antar nasabah 24/7 tanpa batas hari libur.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-baseline gap-3 pt-2">
                      <span className="font-serif text-3xl sm:text-4xl font-bold text-[#111111]">
                        {showBalance ? `Rp${totalIdrBalance.toLocaleString('id-ID')}` : '••••••••'}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#777777] uppercase">IDR FIAT</span>
                      <span className="text-xs text-[#AAAAAA]">|</span>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {showBalance ? `$${(totalCryptoValueIdr / idrPerUsd).toFixed(2)}` : '••••'}
                      </span>
                      <span className="font-mono text-xs text-[#777777] uppercase">USD EQUIVALENT</span>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-3 border-t border-[#EAE6DF]">
                      <button 
                        onClick={() => router.push('/?open=add_funds')}
                        className="py-2.5 px-5 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-[#F4B728]" />
                        <span>Setor Saldo (Fiat & Kripto)</span>
                      </button>
                      <button 
                        onClick={() => router.push('/withdraw')}
                        className="py-2.5 px-5 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>Tarik ke Rekening Bank</span>
                      </button>
                      <button 
                        onClick={() => router.push('/transfer')}
                        className="py-2.5 px-5 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                        <span>Transfer P2P</span>
                      </button>
                    </div>
                  </div>

                  {/* Funding Capabilities Card */}
                  <div className="lg:col-span-4 p-6 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-4 flex flex-col justify-between">
                    <div>
                      <h4 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Jaringan Kliring Resmi</span>
                      </h4>
                      <p className="text-xs text-[#666666] font-light mt-1 leading-relaxed">
                        Didukung integrasi langsung BI-FAST, DOKU, Midtrans, dan protokol kliring multi-chain instan.
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between">
                        <span className="font-medium text-[#555555]">QRIS Nasional</span>
                        <span className="font-mono text-emerald-700 font-bold">0% Biaya</span>
                      </div>
                      <div className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between">
                        <span className="font-medium text-[#555555]">Virtual Account Bank</span>
                        <span className="font-mono text-[#111111] font-bold">Otomatis 24/7</span>
                      </div>
                      <div className="p-2.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between">
                        <span className="font-medium text-[#555555]">Batas Penarikan Harian</span>
                        <span className="font-mono text-[#111111] font-bold">Rp 100.000.000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Riwayat Aliran Dana (Funding Ledger) */}
                <div className="p-6 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h4 className="font-serif text-base font-bold text-[#111111]">Riwayat Aliran Dana (Setor & Tarik)</h4>
                    </div>
                    <span className="font-mono text-[10px] text-[#777777] uppercase">
                      {fundingTransactions.length} Aktivitas
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {txsLoading ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-[#111111]" />
                      </div>
                    ) : fundingTransactions.length > 0 ? (
                      fundingTransactions.map((tx: any, idx: number) => {
                        const isDeposit = tx.type?.includes('topup') || tx.type?.includes('deposit') || (tx.amount && tx.amount > 0);
                        return (
                          <div key={tx.id || idx} className="p-4 rounded-sm border border-[#DFDAD0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#111111] transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-sm flex items-center justify-center font-bold text-xs shrink-0 border",
                                isDeposit ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                              )}>
                                {isDeposit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div>
                                <h5 className="font-serif text-sm font-bold text-[#111111]">{tx.description || (isDeposit ? "Setoran Saldo" : "Penarikan Dana")}</h5>
                                <p className="font-mono text-[10px] text-[#777777]">
                                  {tx.timestamp?.seconds ? new Date(tx.timestamp.seconds * 1000).toLocaleString('id-ID') : 'Hari ini'}
                                </p>
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className={cn("font-mono text-sm font-bold", isDeposit ? "text-emerald-700" : "text-[#111111]")}>
                                {isDeposit ? "+" : "-"}Rp{Math.abs(tx.amount || 0).toLocaleString('id-ID')}
                              </p>
                              <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666]">
                                Terverifikasi Node
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center space-y-2">
                        <p className="font-serif text-sm font-bold text-[#111111]">Belum Ada Aktivitas Pendanaan</p>
                        <p className="text-xs text-[#777777] font-light">Setor saldo via QRIS atau Virtual Account untuk memulai pendanaan.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: EARN (DeFi Yield Vault, ALX Staking, Passive Income)               */}
            {/* ========================================================================= */}
            {activeTopTab === 'Earn' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Hero Earn Card */}
                <div className="p-6 sm:p-8 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#F4B728]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">AliBank Vault & Yield Program</span>
                      </div>
                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                        Tabungan Berbunga & Smart Contract Staking
                      </h3>
                      <p className="text-xs text-[#666666] font-light leading-relaxed">
                        Kunci aset kripto atau simpan saldo IDR untuk menikmati imbal hasil bunga majemuk harian yang dicatat langsung pada blockchain Ethereum dan Polygon Mainnet.
                      </p>
                    </div>

                    <div className="p-5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] min-w-[260px] text-right space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">Total Staked Asset Value</span>
                      <p className="font-serif text-2xl font-bold text-[#111111]">
                        {showBalance ? `Rp${vaultValueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '••••••••'}
                      </p>
                      <p className="font-mono text-xs text-emerald-700 font-bold">
                        Bunga Majemuk 12.00% P.A.
                      </p>
                    </div>
                  </div>

                  {/* Yield Products Matrix */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#EAE6DF]">
                    {/* Product 1 */}
                    <div className="p-5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#111111] rounded-sm">
                          ETH On-Chain Vault
                        </span>
                        <span className="font-serif text-base font-bold text-emerald-700">12.00% APY</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#111111]">Ethereum Staking Vault</h4>
                      <p className="text-xs text-[#666666] font-light">
                        Simpan ETH di smart contract AliBank. Imbal hasil token ALX dapat diklaim setiap saat tanpa periode penguncian.
                      </p>
                      <button 
                        onClick={() => router.push('/crypto/receive?asset=ETH')}
                        className="w-full py-2 bg-[#111111] hover:bg-black text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Tabung Sekarang
                      </button>
                    </div>

                    {/* Product 2 */}
                    <div className="p-5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#111111] rounded-sm">
                          ALX VIP Staking
                        </span>
                        <span className="font-serif text-base font-bold text-amber-700">18.50% APY</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#111111]">AlixCoin Native Pool</h4>
                      <p className="text-xs text-[#666666] font-light">
                        Pegang koin ALX di dompet Anda. Sistem secara otomatis mendistribusikan dividen likuiditas perbankan setiap akhir bulan.
                      </p>
                      <button 
                        onClick={() => router.push('/crypto/trade/alx')}
                        className="w-full py-2 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Beli & Stake ALX
                      </button>
                    </div>

                    {/* Product 3 */}
                    <div className="p-5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[9px] font-bold uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#111111] rounded-sm">
                          P2P Lending Pool
                        </span>
                        <span className="font-serif text-base font-bold text-[#111111]">0.25% / Tx</span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-[#111111]">Penyedia Likuiditas P2P</h4>
                      <p className="text-xs text-[#666666] font-light">
                        Dukung peredaran escrow transfer antar nasabah dan peroleh pembagian hasil komisi kliring dari setiap transaksi selesai.
                      </p>
                      <button 
                        onClick={() => router.push('/p2p/order-history')}
                        className="w-full py-2 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Buka Portal P2P
                      </button>
                    </div>
                  </div>
                </div>

                {/* Earn Calculator */}
                <div className="p-6 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-4">
                  <h4 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#F4B728]" />
                    <span>Kalkulator Estimasi Hasil Imbalan (12% APY)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-[#777777]">Nominal Deposit (ETH)</label>
                      <input 
                        type="number"
                        value={calcAmount}
                        onChange={(e) => setCalcAmount(e.target.value)}
                        className="w-full h-11 px-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm font-mono text-sm font-bold text-[#111111] focus:border-black focus:outline-none"
                        placeholder="Contoh: 1.0"
                      />
                    </div>
                    <div className="p-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-[#777777]">Estimasi Hasil / Bulan</span>
                      <p className="font-mono text-base font-bold text-emerald-700">
                        +{(parseFloat(calcAmount || "0") * 0.12 / 12).toFixed(4)} ETH
                      </p>
                      <p className="font-mono text-[10px] text-[#888888]">
                        ≈ Rp{((parseFloat(calcAmount || "0") * 0.12 / 12) * (PRICE_IDR.ETH || 38000000)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm space-y-0.5">
                      <span className="text-[10px] font-bold uppercase text-[#777777]">Estimasi Hasil / Tahun</span>
                      <p className="font-mono text-base font-bold text-[#111111]">
                        +{(parseFloat(calcAmount || "0") * 0.12).toFixed(4)} ETH
                      </p>
                      <p className="font-mono text-[10px] text-[#888888]">
                        ≈ Rp{((parseFloat(calcAmount || "0") * 0.12) * (PRICE_IDR.ETH || 38000000)).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: SPOT (Spot Trading, Instant Swap & Market Rates)                   */}
            {/* ========================================================================= */}
            {activeTopTab === 'Spot' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Spot Overview & Quick Swap */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left: Quick Swap (5 cols) */}
                  <div className="lg:col-span-5 p-6 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">Zero-Slippage Engine</span>
                      <h3 className="font-serif text-lg font-bold text-[#111111]">Konversi Instan Tanpa Biaya</h3>
                      <p className="text-xs text-[#666666] font-light mt-0.5">
                        Tukar saldo Rupiah langsung ke ALX, USDT, atau ETH dengan nilai pasar transparan.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#777777]">Anda Membayar ({swapFrom})</label>
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            value={swapAmount}
                            onChange={(e) => setSwapAmount(e.target.value)}
                            className="flex-1 h-11 px-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm font-mono text-sm font-bold text-[#111111] focus:border-black focus:outline-none"
                            placeholder="Jumlah"
                          />
                          <select 
                            value={swapFrom}
                            onChange={(e) => setSwapFrom(e.target.value)}
                            className="h-11 px-3 bg-white border border-[#DFDAD0] rounded-sm font-serif text-xs font-bold text-[#111111]"
                          >
                            <option value="IDR">IDR</option>
                            <option value="USDT">USDT</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="w-7 h-7 rounded-full bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-center text-[#777777]">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-[#777777]">Anda Menerima ({swapTo})</label>
                        <div className="flex gap-2">
                          <div className="flex-1 h-11 px-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm font-mono text-sm font-bold text-emerald-700 flex items-center">
                            {swapFrom === 'IDR' && swapTo === 'ALX' && (
                              (parseFloat(swapAmount || "0") / (PRICE_IDR.ALX || 195000)).toFixed(4)
                            )}
                            {swapFrom === 'IDR' && swapTo === 'USDT' && (
                              (parseFloat(swapAmount || "0") / (idrPerUsd || 16000)).toFixed(2)
                            )}
                            {swapFrom === 'USDT' && swapTo === 'ALX' && (
                              (parseFloat(swapAmount || "0") / (priceUsd.ALX || 12.24)).toFixed(4)
                            )}
                          </div>
                          <select 
                            value={swapTo}
                            onChange={(e) => setSwapTo(e.target.value)}
                            className="h-11 px-3 bg-white border border-[#DFDAD0] rounded-sm font-serif text-xs font-bold text-[#111111]"
                          >
                            <option value="ALX">ALX</option>
                            <option value="USDT">USDT</option>
                            <option value="ETH">ETH</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={() => router.push('/crypto/convert')}
                        className="w-full py-3 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors cursor-pointer"
                      >
                        Lanjutkan Konversi Sekarang →
                      </button>
                    </div>
                  </div>

                  {/* Right: Top Spot Markets (7 cols) */}
                  <div className="lg:col-span-7 p-6 bg-white border border-[#DFDAD0] rounded-sm shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
                      <h4 className="font-serif text-sm font-bold text-[#111111]">Pasar Spot Teratas</h4>
                      <button 
                        onClick={() => router.push('/marketplace')}
                        className="text-xs font-mono font-bold text-[#111111] hover:underline uppercase flex items-center gap-1"
                      >
                        Semua Pasar <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {[
                        { pair: "ALX / USDT", name: "AlixCoin", priceUsd: priceUsd.ALX, priceIdr: PRICE_IDR.ALX, change: "+7.34%", isUp: true, path: "/crypto/trade/alx" },
                        { pair: "BTC / USDT", name: "Bitcoin", priceUsd: priceUsd.BTC, priceIdr: PRICE_IDR.BTC, change: "+2.15%", isUp: true, path: "/crypto/trade/btc" },
                        { pair: "ETH / USDT", name: "Ethereum", priceUsd: priceUsd.ETH, priceIdr: PRICE_IDR.ETH, change: "+3.88%", isUp: true, path: "/crypto/trade/eth" },
                        { pair: "USDT / IDR", name: "Tether USD", priceUsd: 1.0, priceIdr: idrPerUsd, change: "+0.12%", isUp: true, path: "/crypto/buy?asset=USDT" },
                      ].map((m) => (
                        <div key={m.pair} className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between hover:border-black transition-colors">
                          <div>
                            <span className="font-serif text-sm font-bold text-[#111111]">{m.pair}</span>
                            <p className="text-[10px] text-[#777777] font-light">{m.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm font-bold text-[#111111]">
                              ${m.priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="font-mono text-[10px] text-[#777777]">
                              ≈ Rp{m.priceIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-emerald-700">
                              {m.change}
                            </span>
                            <button 
                              onClick={() => router.push(m.path)}
                              className="py-1.5 px-3 bg-[#111111] hover:bg-black text-white rounded-sm text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Trading
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
