"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings2, 
  ChevronDown, 
  ArrowUpDown, 
  Loader2,
  CheckCircle2,
  Bitcoin,
  Cpu,
  Zap,
  Info,
  Pencil,
  User,
  LayoutGrid,
  ArrowRightLeft,
  Ticket,
  Settings,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, increment, collection, serverTimestamp } from "firebase/firestore";
import { proxyUpdateDoc, proxyAddDoc } from "@/lib/firestore-proxy-client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MARKUP = 1.02; // AliBank 2% Profit Margin
const USDT_IDR_RATE = 17690; // Fallback rate — updated June 2026 (real-time fetched on mount)

type AssetKey = 'ALX' | 'BTC' | 'ETH' | 'USDT' | 'IDR';

interface AssetConfig {
  symbol: AssetKey;
  name: string;
  icon: any;
  color: string;
}

const ASSETS: AssetConfig[] = [
  { symbol: 'ALX', name: 'Alix Coin', icon: LogoIcon, color: 'gold-gradient' },
  { symbol: 'BTC', name: 'Bitcoin', icon: Bitcoin, color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: Cpu, color: 'bg-blue-500' },
  { symbol: 'USDT', name: 'TetherUS', icon: Zap, color: 'bg-[#0D9488]' },
  { symbol: 'IDR', name: 'Rupiah', icon: () => <span className="text-white font-black text-[10px]">Rp</span>, color: 'bg-rose-600' },
];

export default function ConvertPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [fromAsset, setFromAsset] = useState<AssetKey>('ETH');
  const [toAsset, setToAsset] = useState<AssetKey>('USDT');
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  // liveUsdtRate: real-time IDR/USDT rate, updated from /api/forex/rate
  const [liveUsdtRate, setLiveUsdtRate] = useState(USDT_IDR_RATE);

  const [prices, setPrices] = useState<Record<AssetKey, number>>({
    ALX: 12.24,
    BTC: 66450,
    ETH: 2350,
    USDT: 1,
    IDR: 1 / USDT_IDR_RATE
  });

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchPrices = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "USDTIDRT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
      if (res.ok) {
        const data = await res.json();
        if (data.error) return; // Silent return if proxy busy

        const newPrices = { ...prices };
        
        const btcData = data.find((d: any) => d.symbol === 'BTCUSDT');
        const ethData = data.find((d: any) => d.symbol === 'ETHUSDT');
        const usdtIdrData = data.find((d: any) => d.symbol === 'USDTIDRT');

        if (btcData) newPrices.BTC = parseFloat(btcData.lastPrice);
        if (ethData) newPrices.ETH = parseFloat(ethData.lastPrice);
        if (usdtIdrData) {
          const parsedIdrRate = parseFloat(usdtIdrData.lastPrice);
          // Sanity check: IDR rate must be > 10000 (currently ~17690)
          if (parsedIdrRate > 10000) {
            newPrices.IDR = 1 / parsedIdrRate;
            setLiveUsdtRate(parsedIdrRate);
          }
          // If < 10000, keep the default: IDR: 1/USDT_IDR_RATE
        }
        if (globalLiquidity?.lastAlxPriceUsdt) newPrices.ALX = globalLiquidity.lastAlxPriceUsdt;

        setPrices(newPrices);
      }
    } catch (e) {
      console.warn("Price sync failed", e);
    }
  }, [globalLiquidity, prices]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    const interval = setInterval(fetchPrices, 15000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [fetchPrices]);

  // Fetch real-time USD/IDR forex rate on mount (updates prices.IDR)
  useEffect(() => {
    const fetchForexRate = async () => {
      try {
        const res = await fetch('/api/forex/rate');
        if (!res.ok) return;
        const data = await res.json();
        if (data?.rate && data.rate > 10000) {
          setLiveUsdtRate(data.rate);
          setPrices(prev => ({ ...prev, IDR: 1 / data.rate }));
        }
      } catch (e) {
        console.warn('[Convert/Forex] Rate fetch failed');
      }
    };
    fetchForexRate();
  }, []);

  // convertedRaw: numeric value used for Firebase writes and math
  const convertedRaw = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return 0;
    // valueInUsdt: amount in USD/USDT equivalent
    const valueInUsdt = num * prices[fromAsset];
    // When toAsset === 'IDR': prices[IDR] = 1/USDT_IDR_RATE
    // rawOutput = valueInUsdt / (1/USDT_IDR_RATE) / MARKUP = valueInUsdt * USDT_IDR_RATE / MARKUP
    const rawOutput = valueInUsdt / (prices[toAsset] * MARKUP);
    if (toAsset === 'IDR') return Math.floor(rawOutput);
    return rawOutput;
  }, [amount, fromAsset, toAsset, prices]);

  // convertedDisplay: formatted string for UI display only
  const convertedDisplay = useMemo(() => {
    if (convertedRaw === 0) return "0";
    if (toAsset === 'IDR') return convertedRaw.toLocaleString('id-ID');
    return convertedRaw.toFixed(6);
  }, [convertedRaw, toAsset]);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const userBalance = useMemo(() => {
    if (!userData) return 0;
    if (fromAsset === 'IDR') return userData.totalBalance || 0;
    return userData.cryptoBalances?.[fromAsset] || 0;
  }, [userData, fromAsset]);

  const isInsufficient = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return false;
    return num > userBalance;
  }, [amount, userBalance]);

  const handleConvert = async () => {
    if (!user || !db || !userData || isInsufficient) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    // Use convertedRaw (numeric) — never parse the formatted display string!
    if (convertedRaw <= 0) return;

    setIsProcessing(true);
    try {
      const userRef = doc(db, "users", user.uid);

      const userUpdates: any = {};
      if (fromAsset === 'IDR') userUpdates.totalBalance = increment(-numAmount);
      else userUpdates[`cryptoBalances.${fromAsset}`] = increment(-numAmount);

      if (toAsset === 'IDR') userUpdates.totalBalance = increment(convertedRaw);
      else userUpdates[`cryptoBalances.${toAsset}`] = increment(convertedRaw);

      await proxyUpdateDoc(userRef, userUpdates);

      await proxyAddDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Swap ${fromAsset} ke ${toAsset}`,
        category: "Trading",
        fromAmount: numAmount,
        fromCurrency: fromAsset,
        toAmount: convertedRaw,
        toCurrency: toAsset,
        asset: toAsset,
        amount: toAsset === 'IDR' ? convertedRaw : (fromAsset === 'IDR' ? numAmount : 0),
        cryptoAmount: toAsset !== 'IDR' ? convertedRaw : numAmount,
        cryptoCurrency: toAsset !== 'IDR' ? toAsset : fromAsset,
        type: 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      setStep('success');
      toast({ title: "Swap Berhasil" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  const currentFromAsset = ASSETS.find(a => a.symbol === fromAsset)!;
  const currentToAsset = ASSETS.find(a => a.symbol === toAsset)!;

  // fromUsd: value of 'from' amount in USD
  const fromUsd = (parseFloat(amount) || 0) * prices[fromAsset];
  // toUsd: value of 'to' amount in USD (for IDR: divide by rate, for crypto: multiply by price)
  const toUsd = toAsset === 'IDR'
    ? convertedRaw / USDT_IDR_RATE
    : convertedRaw * prices[toAsset];

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase mb-2">Swap Berhasil</h2>
        <Card className="w-full max-w-sm bg-card border border-border/50 rounded-[2rem] p-8 mb-8 text-center shadow-lg">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Total Diterima</p>
          <p className="text-3xl font-black text-primary italic">{convertedDisplay} {toAsset}</p>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl" onClick={() => router.push('/')}>Selesai</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      {isMobile ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* HEADER */}
          <header className="px-6 h-16 flex items-center justify-between sticky top-0 bg-background border-b border-border/50 z-50">
            <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors text-foreground">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-base font-black uppercase italic tracking-widest text-foreground">Swap</h1>
            <button className="p-1 hover:bg-muted rounded-full transition-colors text-foreground/60">
              <Settings2 className="w-5 h-5" />
            </button>
          </header>

          <main className="flex-1 flex flex-col pt-4 overflow-y-auto no-scrollbar">
            {/* FROM SECTION */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between items-center h-20">
                <div className="flex-1 flex flex-col">
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-6xl font-black italic outline-none tracking-tighter text-foreground placeholder:text-foreground/10" 
                  />
                  <p className="text-sm font-medium text-muted-foreground italic mt-1">${fromUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 pl-2 pr-4 py-2 rounded-full border border-border shadow-xl transition-all active:scale-95 text-foreground">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentFromAsset.color)}>
                          <currentFromAsset.icon className="text-white w-full h-full" />
                        </div>
                        <span className="text-sm font-black italic uppercase tracking-tighter">{fromAsset}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl p-2 min-w-[140px] shadow-2xl">
                      {ASSETS.filter(a => a.symbol !== toAsset).map((a) => (
                        <DropdownMenuItem key={a.symbol} onClick={() => setFromAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-muted">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                          <span className="font-black italic uppercase text-xs text-foreground">{a.symbol}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex items-center gap-1.5 mr-1">
                     <span className={cn("text-[10px] font-black uppercase italic", isInsufficient ? "text-rose-500" : "text-muted-foreground")}>
                        {userBalance.toFixed(fromAsset === 'IDR' ? 0 : 4)} {fromAsset}
                     </span>
                     <button 
                      onClick={() => setAmount(userBalance.toString())}
                      className="text-blue-500 font-black text-[9px] uppercase hover:underline"
                    >
                      Maks
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DIVIDER WITH SWAP ICON */}
            <div className="relative h-px bg-border w-full flex justify-center items-center my-2">
              <button 
                onClick={() => { const old = fromAsset; setFromAsset(toAsset); setToAsset(old); setAmount(""); }}
                className="w-10 h-10 bg-muted border-[4px] border-background rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/85 active:scale-90 transition-all shadow-xl z-20"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* TO SECTION */}
            <div className="px-6 py-4 space-y-2">
              <div className="flex justify-between items-center h-20">
                <div className="flex-1 flex flex-col">
                  <div className="text-6xl font-black italic tracking-tighter text-foreground">
                    {convertedDisplay}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground italic mt-1">${toUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 pl-2 pr-4 py-2 rounded-full border border-border shadow-xl transition-all active:scale-95 text-foreground">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentToAsset.color)}>
                          <currentToAsset.icon className="text-white w-full h-full" />
                        </div>
                        <span className="text-sm font-black italic uppercase tracking-tighter">{toAsset}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl p-2 min-w-[140px] shadow-2xl">
                      {ASSETS.filter(a => a.symbol !== fromAsset).map((a) => (
                        <DropdownMenuItem key={a.symbol} onClick={() => setToAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-muted">
                          <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                          <span className="font-black italic uppercase text-xs text-foreground">{a.symbol}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-muted-foreground/40 italic mr-1">
                    <span>Wallet 1 / AliBank</span>
                    <Pencil className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </div>

            {/* DETAILED INFO SECTION */}
            <div className="mt-8 px-6 space-y-4 pb-10">
              <DetailRow label="Tarif" value={`1 ${fromAsset} = ${(prices[fromAsset]/prices[toAsset]/MARKUP).toFixed(4)} ${toAsset}`} icon />
              <DetailRow label="Biaya jaringan" value="$0.0004" icon />
              <DetailRow label="Selip" value="2%" edit icon />
              <DetailRow label="Dampak harga" value="0%" icon />
              <DetailRow label="Minimum yang diterima" value={`${(convertedRaw * 0.98).toFixed(toAsset === 'IDR' ? 0 : 4)} ${toAsset}`} icon />
              <DetailRow label="Penerima" value="Wallet 1 / AliBank" edit />
            </div>
          </main>

          {/* FOOTER CTA */}
          <footer className="p-6 bg-background pb-12 space-y-4">
            <Button 
              disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
              onClick={handleConvert}
              className={cn(
                "w-full h-16 rounded-3xl font-black italic uppercase transition-all duration-300 border-none shadow-none text-base",
                isInsufficient 
                  ? "bg-muted text-muted-foreground/40" 
                  : (!amount || parseFloat(amount) <= 0)
                    ? "bg-muted text-muted-foreground/40"
                    : "gold-gradient text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
              )}
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (isInsufficient ? "Dana tidak cukup" : !amount ? "Pilih jumlah" : "Konfirmasi Swap")}
            </Button>
            <p className="text-center text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
              Termasuk biaya MM sebesar 0.875%.
            </p>
          </footer>
        </div>
      ) : (
        <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30 w-full">
          {/* SIDEBAR NAVIGATION */}
            <Sidebar />

          {/* MAIN CONTAINER */}
          <main className="ml-64 flex-1 flex flex-col min-w-0 bg-background text-foreground">
            {/* HEADER */}
            <header className="h-16 bg-card border-b border-border/50 flex items-center justify-between px-8 sticky top-0 z-40">
              <h2 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                <span>Convert & Swap Assets</span>
              </h2>
              <div className="flex items-center gap-6">
                <button className="p-2 hover:bg-muted rounded-full relative" onClick={() => router.back()}>
                  <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                    {userData?.name?.[0] || user?.email?.[0] || "U"}
                  </div>
                </div>
              </div>
            </header>

            {/* CONTAINER CONTENT */}
            <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT / CENTER COLUMN (FORM) */}
                <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom duration-500">
                  {/* TRANSACTION FORM PANEL */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-8 shadow-sm space-y-8">
                    <div className="space-y-6">
                      
                      {/* FROM ASSET CONTAINER */}
                      <div className="p-6 bg-muted/40 rounded-2xl border border-border/50 flex items-center justify-between">
                        <div className="flex-1 flex flex-col mr-4">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 pl-0.5">Dari</label>
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-transparent border-none text-5xl font-black tracking-tighter italic text-foreground focus:outline-none focus:ring-0 w-full placeholder:text-muted-foreground/20"
                          />
                          <span className="text-[10px] font-bold text-muted-foreground italic mt-1">${fromUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 pl-2 pr-4 py-2 rounded-full border border-border shadow-xl transition-all active:scale-95 text-foreground">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentFromAsset.color)}>
                                  <currentFromAsset.icon className="text-white w-full h-full" />
                                </div>
                                <span className="text-sm font-black italic uppercase tracking-tighter">{fromAsset}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl p-2 min-w-[140px] shadow-2xl">
                              {ASSETS.filter(a => a.symbol !== toAsset).map((a) => (
                                <DropdownMenuItem key={a.symbol} onClick={() => setFromAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-muted">
                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                                  <span className="font-black italic uppercase text-xs text-foreground">{a.symbol}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <div className="flex items-center gap-2 mr-1">
                            <span className={cn("text-[10px] font-black uppercase italic", isInsufficient ? "text-rose-500" : "text-muted-foreground")}>
                              Saldo: {userBalance.toFixed(fromAsset === 'IDR' ? 0 : 4)} {fromAsset}
                            </span>
                            <button 
                              onClick={() => setAmount(userBalance.toString())}
                              className="text-blue-500 font-black text-[9px] uppercase hover:underline"
                            >
                              Maks
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SWITCH / SWAP DIRECTION BUTTON */}
                      <div className="flex justify-center -my-2 relative z-20">
                        <button 
                          onClick={() => { const old = fromAsset; setFromAsset(toAsset); setToAsset(old); setAmount(""); }}
                          className="w-11 h-11 bg-muted hover:bg-muted/80 border-[4px] border-card rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-90 transition-all shadow-2xl"
                        >
                          <ArrowUpDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* TO ASSET CONTAINER */}
                      <div className="p-6 bg-muted/40 rounded-2xl border border-border/50 flex items-center justify-between">
                        <div className="flex-1 flex flex-col mr-4">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 pl-0.5">Ke</label>
                          <div className="text-5xl font-black tracking-tighter italic text-foreground h-[60px] flex items-center leading-none">
                            {convertedDisplay}
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground italic mt-1">${toUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center gap-2 bg-muted hover:bg-muted/80 pl-2 pr-4 py-2 rounded-full border border-border shadow-xl transition-all active:scale-95 text-foreground">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentToAsset.color)}>
                                  <currentToAsset.icon className="text-white w-full h-full" />
                                </div>
                                <span className="text-sm font-black italic uppercase tracking-tighter">{toAsset}</span>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-card border-border text-foreground rounded-2xl p-2 min-w-[140px] shadow-2xl">
                              {ASSETS.filter(a => a.symbol !== fromAsset).map((a) => (
                                <DropdownMenuItem key={a.symbol} onClick={() => setToAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-muted">
                                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                                  <span className="font-black italic uppercase text-xs text-foreground">{a.symbol}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <div className="flex items-center gap-1 text-[9px] font-mono font-bold text-muted-foreground/30 italic mr-1">
                            <span>Wallet 1 / AliBank</span>
                            <Pencil className="w-2.5 h-2.5" />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Swap Actions */}
                    <div className="pt-4 space-y-4">
                      <Button 
                        disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
                        onClick={handleConvert}
                        className={cn(
                          "w-full h-16 rounded-2xl font-black italic uppercase transition-all duration-300 border-none shadow-none text-base",
                          isInsufficient 
                            ? "bg-muted text-muted-foreground/40" 
                            : (!amount || parseFloat(amount) <= 0)
                              ? "bg-muted text-muted-foreground/40"
                              : "gold-gradient text-white shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-95"
                        )}
                      >
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (isInsufficient ? "Dana tidak cukup" : !amount ? "Pilih jumlah" : "Konfirmasi Swap")}
                      </Button>
                      <p className="text-center text-[10px] font-bold text-muted-foreground/50 uppercase tracking-tighter">
                        Termasuk biaya MM sebesar 0.875%.
                      </p>
                    </div>
                  </Card>
                </div>

                {/* RIGHT COLUMN (DETAILS & SECURE INFO) */}
                <div className="space-y-8 text-foreground animate-in fade-in slide-in-from-right duration-500">
                  {/* TRANSACTION METRICS CARD */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-6 shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest pl-1">Metrik Swap</h3>
                    <div className="space-y-4 text-xs">
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Kurs Penukaran</span>
                        <span className="font-black text-foreground">{`1 ${fromAsset} = ${(prices[fromAsset]/prices[toAsset]/MARKUP).toFixed(4)} ${toAsset}`}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Biaya Jaringan</span>
                        <span className="font-black text-foreground">$0.0004</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Batas Toleransi Selip</span>
                        <div className="flex items-center gap-1 text-foreground font-black">
                          <span>2%</span>
                          <Pencil className="w-2.5 h-2.5 text-muted-foreground/30" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Dampak Harga</span>
                        <span className="font-black text-foreground">0%</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 border-b border-border">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Minimum Diterima</span>
                        <span className="font-black text-foreground">{`${(convertedRaw * 0.98).toFixed(toAsset === 'IDR' ? 0 : 4)} ${toAsset}`}</span>
                      </div>
                      <div className="flex justify-between items-center py-2.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Penerima</span>
                        <span className="font-black text-foreground">Wallet 1 / AliBank</span>
                      </div>
                    </div>
                  </Card>

                  {/* SECURITY SSL CARD */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase italic leading-none mb-1">Enkripsi Nodes</h4>
                        <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">Secure SSL Gateway</span>
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic pl-1">
                      Transaksi swap ini dilakukan secara instan di dalam ledger blockchain privat AliBank. Seluruh aset Anda dijamin 100% aman dan dilindungi enkripsi end-to-end.
                    </p>
                  </Card>
                </div>

              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value, edit = false, icon = false }: { label: string; value: string; edit?: boolean; icon?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-muted-foreground italic">{label}</span>
        {icon && <Info className="w-3 h-3 text-muted-foreground/20" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black italic text-foreground">{value}</span>
        {edit && <Pencil className="w-2.5 h-2.5 text-muted-foreground/30" />}
        {label === "Tarif" && <ChevronDown className="w-3 h-3 text-muted-foreground/30 rotate-[-90deg]" />}
      </div>
    </div>
  );
}

