
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings2, 
  History, 
  ChevronDown, 
  ArrowUpDown, 
  Info, 
  Gift, 
  Sparkles,
  RefreshCw,
  PlusCircle,
  Loader2,
  CheckCircle2,
  Bitcoin,
  Cpu,
  Coins,
  ShieldCheck,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MARKUP = 1.02; // AliBank 2% PROFIT MARGIN
const USDT_IDR_RATE = 15850;

type AssetKey = 'ALX' | 'BTC' | 'ETH' | 'USDT' | 'IDR';

interface AssetConfig {
  symbol: AssetKey;
  name: string;
  icon: any;
  color: string;
  isNative?: boolean;
}

const ASSETS: AssetConfig[] = [
  { symbol: 'ALX', name: 'Alix Coin', icon: LogoIcon, color: 'gold-gradient', isNative: true },
  { symbol: 'BTC', name: 'Bitcoin', icon: Bitcoin, color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: Cpu, color: 'bg-blue-500' },
  { symbol: 'USDT', name: 'TetherUS', icon: Zap, color: 'bg-[#0D9488]' },
  { symbol: 'IDR', name: 'Rupiah', icon: () => <span className="text-white font-black text-sm">Rp</span>, color: 'bg-rose-600' },
];

export default function ConvertPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [fromAsset, setFromAsset] = useState<AssetKey>('USDT');
  const [toAsset, setToAsset] = useState<AssetKey>('BTC');
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const [prices, setPrices] = useState<Record<AssetKey, number>>({
    ALX: 12.24,
    BTC: 66450,
    ETH: 2350,
    USDT: 1,
    IDR: 1 / USDT_IDR_RATE
  });

  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchPrices = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "USDTIDR"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
      if (res.ok) {
        const data = await res.json();
        const newPrices = { ...prices };
        
        const btcData = data.find((d: any) => d.symbol === 'BTCUSDT');
        const ethData = data.find((d: any) => d.symbol === 'ETHUSDT');
        const usdtIdrData = data.find((d: any) => d.symbol === 'USDTIDR');

        if (btcData) newPrices.BTC = parseFloat(btcData.lastPrice);
        if (ethData) newPrices.ETH = parseFloat(ethData.lastPrice);
        if (usdtIdrData) newPrices.IDR = 1 / parseFloat(usdtIdrData.lastPrice);
        if (globalLiquidity?.lastAlxPriceUsdt) newPrices.ALX = globalLiquidity.lastAlxPriceUsdt;

        setPrices(newPrices);
      }
    } catch (e) {
      console.warn("Price sync failed", e);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const gasFee = useMemo(() => {
    // Simulasi Biaya Gas berdasarkan target network (perbaikan: tidak nol untuk USDT)
    if (toAsset === 'BTC') return 0.00005;
    if (toAsset === 'ETH') return 0.0006;
    if (toAsset === 'ALX') return 0.000001;
    if (toAsset === 'USDT') return 0.5; // Biaya kliring bridge stablecoin
    return 0; // IDR internal diproses tanpa gas
  }, [toAsset]);

  const convertedValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0.00";
    
    const valueInUsdt = num * prices[fromAsset];
    const rawOutput = valueInUsdt / (prices[toAsset] * MARKUP);
    
    // Kurangi estimasi gas dari output jika bukan IDR
    const afterGas = rawOutput > gasFee ? rawOutput - (toAsset === 'IDR' ? 0 : gasFee) : 0;
    
    return toAsset === 'IDR' ? Math.floor(afterGas * USDT_IDR_RATE).toString() : afterGas.toFixed(8);
  }, [amount, fromAsset, toAsset, prices, gasFee]);

  const handleConvert = async () => {
    if (!user || !db || !userData) return;
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) return;

    let balance = 0;
    if (fromAsset === 'IDR') balance = userData.totalBalance || 0;
    else balance = userData.cryptoBalances?.[fromAsset] || 0;

    if (balance < numAmount) {
      toast({ 
        variant: "destructive", 
        title: "Saldo Tidak Cukup", 
        description: `Anda membutuhkan saldo ${fromAsset} yang lebih besar.` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const resultNum = parseFloat(convertedValue);
      const userDocRef = doc(db, "users", user.uid);
      const tradeTime = new Date().toISOString();

      // 1. Update Saldo User
      const userUpdates: any = {};
      if (fromAsset === 'IDR') userUpdates.totalBalance = increment(-numAmount);
      else userUpdates[`cryptoBalances.${fromAsset}`] = increment(-numAmount);

      if (toAsset === 'IDR') userUpdates.totalBalance = increment(resultNum);
      else userUpdates[`cryptoBalances.${toAsset}`] = increment(resultNum);

      await updateDoc(userDocRef, userUpdates);

      // 2. Update Likuiditas Sistem
      const systemRef = doc(db, "system", "liquidity");
      const amountInIdr = numAmount * (fromAsset === 'IDR' ? 1 : prices[fromAsset] * USDT_IDR_RATE);
      
      await updateDoc(systemRef, {
        totalAlixTrades: increment(1),
        totalInternalAumIdr: increment(amountInIdr)
      });

      // 3. Log Audit
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `SWAP-${Date.now()}`,
        category: "Ali-Exchange",
        description: `Swap: ${numAmount} ${fromAsset} to ${resultNum} ${toAsset} for ${userData.name}`,
        amountIdr: amountInIdr,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      // 4. Riwayat User
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: tradeTime,
        description: `Swap ${fromAsset} ke ${toAsset}`,
        category: "Trading",
        fromAmount: numAmount,
        fromCurrency: fromAsset,
        toAmount: resultNum,
        toCurrency: toAsset,
        gasFee: gasFee,
        type: 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      setStep('success');
      toast({ title: "Konversi Berhasil", description: "Aset Anda telah diperbarui secara instan." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Konversi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  if (!mounted) return null;

  const currentFromAsset = ASSETS.find(a => a.symbol === fromAsset)!;
  const currentToAsset = ASSETS.find(a => a.symbol === toAsset)!;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground mb-1">Swap Berhasil</h2>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-6 italic">Ali-Secure Settlement Node V3</p>
        
        <div className="w-full bg-muted/50 rounded-[2rem] p-6 mb-8 space-y-4 shadow-inner border border-border/50">
          <div>
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Total Diterima</p>
            <p className="text-3xl font-black italic text-foreground">
              {convertedValue} {toAsset}
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground">
              <span>Biaya Jaringan (Gas)</span>
              <span className="text-rose-500">{gasFee} {toAsset}</span>
            </div>
            <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground">
              <span>Kurs Eksekusi</span>
              <span>1 {fromAsset} ≈ {(prices[fromAsset]/prices[toAsset]/MARKUP).toFixed(8)} {toAsset}</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full h-14 bg-primary text-primary-foreground font-black italic uppercase rounded-2xl shadow-xl"
          onClick={() => router.push('/')}
        >
          SELESAI
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      <header className="px-4 h-12 flex items-center justify-between sticky top-0 bg-background z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-base font-black tracking-tight italic uppercase">Ali-Convert Node</h1>
        <div className="flex gap-2">
          <History onClick={() => router.push('/transactions')} className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
      </header>

      <main className="flex-1 px-4 pt-1 space-y-3 overflow-hidden">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
            <p className="text-[9px] font-bold text-foreground leading-tight uppercase italic">Konversi instan dengan proteksi harga AliBank.</p>
          </div>
          <Badge className="bg-primary text-primary-foreground text-[7px] font-black italic border-none h-4">MARKUP +2%</Badge>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-foreground italic">
              Rate: 
              <span className="text-green-500 ml-1">
                1 {fromAsset} ≈ {(prices[fromAsset]/prices[toAsset]/MARKUP).toFixed(fromAsset === 'IDR' ? 8 : 4)} {toAsset}
              </span>
            </p>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest italic">Node Harga Live Global</span>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase">Gas: {gasFee} {toAsset}</Badge>
        </div>

        <div className="space-y-1 mt-4">
          {/* FROM SLOT */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Jual</label>
              <span className="text-[9px] font-black text-muted-foreground italic">
                Saldo: {fromAsset === 'IDR' ? `Rp${(userData?.totalBalance ?? 0).toLocaleString()}` : `${(userData?.cryptoBalances?.[fromAsset] ?? 0).toFixed(6)} ${fromAsset}`}
              </span>
            </div>
            <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border shadow-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded-xl transition-all">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-md", currentFromAsset.color)}>
                      <currentFromAsset.icon className="text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black italic uppercase tracking-tighter">{fromAsset}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border-border rounded-xl">
                  {ASSETS.filter(a => a.symbol !== toAsset).map((a) => (
                    <DropdownMenuItem key={a.symbol} onClick={() => setFromAsset(a.symbol)} className="font-black italic uppercase text-xs">
                      {a.symbol} - {a.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input 
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
                className="w-1/2 bg-transparent text-right text-2xl font-black italic outline-none tracking-tighter text-foreground" 
              />
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-20">
            <button 
              onClick={() => { const oldFrom = fromAsset; setFromAsset(toAsset); setToAsset(oldFrom); setAmount(""); }} 
              className="w-10 h-10 bg-background border-4 border-muted rounded-full shadow-xl flex items-center justify-center text-primary active:scale-90 transition-transform"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* TO SLOT */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">Dapatkan</label>
            <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border shadow-sm">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-1 rounded-xl transition-all">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-md", currentToAsset.color)}>
                      <currentToAsset.icon className="text-white" />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black italic uppercase tracking-tighter">{toAsset}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-background border-border rounded-xl">
                  {ASSETS.filter(a => a.symbol !== fromAsset).map((a) => (
                    <DropdownMenuItem key={a.symbol} onClick={() => setToAsset(a.symbol)} className="font-black italic uppercase text-xs">
                      {a.symbol} - {a.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-2xl font-black text-muted-foreground/60 italic tracking-tighter">{convertedValue}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-[9px] font-black text-blue-600 uppercase">Estimasi Biaya Jaringan</p>
            <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase italic">
              Swap ini dikenakan biaya gas sebesar <span className="text-foreground font-black">{gasFee} {toAsset}</span> untuk eksekusi on-chain dan margin proteksi 2%.
            </p>
          </div>
        </div>
      </main>

      <div className="p-4 bg-background border-t border-border mt-auto pb-10">
        <Button 
          disabled={!amount || isProcessing} 
          onClick={handleConvert} 
          className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-[1.5rem] shadow-xl text-sm tracking-[0.2em]"
        >
          {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : 'KONFIRMASI SWAP ASET'}
        </Button>
      </div>
    </div>
  );
}
