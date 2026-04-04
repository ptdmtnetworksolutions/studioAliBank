
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
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const MARKUP = 1.02; // ALIBANK 2% PROFIT MARGIN
const USDT_IDR_RATE = 15850;

export default function ConvertPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');
  const [direction, setDirection] = useState<'FROM_ALX' | 'TO_ALX'>('TO_ALX');
  const [counterCurrency, setCounterCurrency] = useState<'USDT' | 'IDR'>('IDR');
  
  const [liveAlxPriceUsdt, setLiveAlxPriceUsdt] = useState(12.24);

  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  useEffect(() => {
    setMounted(true);
    if (globalLiquidity?.lastAlxPriceUsdt) {
      setLiveAlxPriceUsdt(globalLiquidity.lastAlxPriceUsdt);
    }
  }, [globalLiquidity]);

  const currentPriceIdr = useMemo(() => liveAlxPriceUsdt * USDT_IDR_RATE, [liveAlxPriceUsdt]);
  
  // LOGIKA MARKUP: Hanya diterapkan jika berinteraksi dengan aset eksternal (USDT/IDR)
  // Saat nasabah MEMBELI ALX mengunakan USDT/IDR, AliBank menerapkan markup pada harga jualnya.
  const currentRateWithMarkup = useMemo(() => {
    const baseRate = counterCurrency === 'USDT' ? liveAlxPriceUsdt : currentPriceIdr;
    return direction === 'TO_ALX' ? baseRate * MARKUP : baseRate;
  }, [counterCurrency, liveAlxPriceUsdt, currentPriceIdr, direction]);

  const convertedValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0.00";
    if (direction === 'FROM_ALX') {
      return (num * (counterCurrency === 'USDT' ? liveAlxPriceUsdt : currentPriceIdr)).toFixed(counterCurrency === 'USDT' ? 2 : 0);
    } else {
      return (num / currentRateWithMarkup).toFixed(8);
    }
  }, [amount, direction, currentRateWithMarkup, counterCurrency, liveAlxPriceUsdt, currentPriceIdr]);

  const handleConvert = async () => {
    if (!user || !db || !userData) return;
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) return;

    let hasBalance = false;
    if (direction === 'FROM_ALX') {
      hasBalance = (userData.cryptoBalances?.ALX || 0) >= numAmount;
    } else {
      if (counterCurrency === 'USDT') {
        hasBalance = (userData.cryptoBalances?.USDT || 0) >= numAmount;
      } else {
        hasBalance = (userData.totalBalance || 0) >= numAmount;
      }
    }

    if (!hasBalance) {
      toast({ 
        variant: "destructive", 
        title: "Saldo Tidak Cukup", 
        description: `Anda membutuhkan saldo ${direction === 'FROM_ALX' ? 'ALX' : counterCurrency} yang lebih besar.` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const resultNum = parseFloat(convertedValue);
      const userDocRef = doc(db, "users", user.uid);
      const tradeTime = new Date().toISOString();

      if (direction === 'FROM_ALX') {
        const updates: any = { "cryptoBalances.ALX": increment(-numAmount) };
        if (counterCurrency === 'USDT') updates["cryptoBalances.USDT"] = increment(resultNum);
        else updates["totalBalance"] = increment(resultNum);
        await updateDoc(userDocRef, updates);
      } else {
        const updates: any = { "cryptoBalances.ALX": increment(resultNum) };
        if (counterCurrency === 'USDT') updates["cryptoBalances.USDT"] = increment(-numAmount);
        else updates["totalBalance"] = increment(-numAmount);
        await updateDoc(userDocRef, updates);
      }

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: tradeTime,
        description: direction === 'FROM_ALX' ? `Jual ALX ke ${counterCurrency}` : `Beli ALX dengan ${counterCurrency} (Premium)`,
        category: "Ali-Exchange",
        fromAmount: numAmount,
        fromCurrency: direction === 'FROM_ALX' ? "ALX" : counterCurrency,
        toAmount: resultNum,
        toCurrency: direction === 'FROM_ALX' ? counterCurrency : "ALX",
        executionPrice: currentRateWithMarkup,
        type: direction === 'TO_ALX' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      const systemRef = doc(db, "system", "liquidity");
      const liquidityUpdates: any = {
        totalAlixTrades: increment(1)
      };
      
      if (direction === 'TO_ALX' && counterCurrency === 'IDR') {
        liquidityUpdates.totalInternalAumIdr = increment(numAmount);
        liquidityUpdates.totalAlixSoldInternally = increment(resultNum);
      }
      
      await updateDoc(systemRef, liquidityUpdates);

      setStep('success');
      toast({ title: "Transaksi Berhasil", description: "Aset ALX Anda telah diperbarui." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Konversi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  if (!mounted) return null;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground mb-1">Konversi Berhasil</h2>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-6 italic">Ali-Secure Settlement Node V3</p>
        
        <div className="w-full bg-muted/50 rounded-[2rem] p-6 mb-8 space-y-4 shadow-inner border border-border/50">
          <div>
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Total Diterima</p>
            <p className="text-3xl font-black italic text-foreground">
              {convertedValue} {direction === 'TO_ALX' ? 'ALX' : counterCurrency}
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground">
            <span>Kurs Eksekusi Premium</span>
            <span>1 ALX = {counterCurrency === 'USDT' ? `${currentRateWithMarkup.toFixed(4)} USDT` : `Rp${currentRateWithMarkup.toLocaleString()}`}</span>
          </div>
        </div>

        <Button 
          className="w-full h-14 bg-primary text-primary-foreground font-black italic uppercase rounded-2xl shadow-xl"
          onClick={() => router.push('/')}
        >
          Selesai
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
              Harga Pasar: 
              <span className="text-green-500 ml-1">
                {counterCurrency === 'USDT' ? `$${currentRateWithMarkup.toFixed(4)}` : `Rp${currentRateWithMarkup.toLocaleString()}`}
              </span>
            </p>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest italic">Termasuk Biaya Jaringan & Margin Bank</span>
          </div>
          <div 
            className="flex items-center gap-1 text-[10px] font-black bg-muted/50 px-3 py-1.5 rounded-full border border-border cursor-pointer active:scale-95 transition-all"
            onClick={() => setCounterCurrency(counterCurrency === 'USDT' ? 'IDR' : 'USDT')}
          >
            {counterCurrency} <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        <div className="space-y-1 mt-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                {direction === 'TO_ALX' ? 'Bayar' : 'Jual'}
              </label>
              <span className="text-[9px] font-black text-muted-foreground italic">
                Saldo: {direction === 'TO_ALX' ? (counterCurrency === 'USDT' ? `${(userData?.cryptoBalances?.USDT ?? 0).toFixed(2)} USDT` : `Rp${(userData?.totalBalance ?? 0).toLocaleString()}`) : `${(userData?.cryptoBalances?.ALX ?? 0).toFixed(4)} ALX`}
              </span>
            </div>
            <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-md", direction === 'TO_ALX' ? (counterCurrency === 'USDT' ? "bg-[#0D9488]" : "bg-rose-600") : "gold-gradient")}>
                  {direction === 'TO_ALX' ? (counterCurrency === 'USDT' ? <svg viewBox="0 0 24 24" fill="white" className="w-full h-full"><path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/></svg> : <span className="text-white font-black text-sm">Rp</span>) : <LogoIcon className="text-white" />}
                </div>
                <span className="text-sm font-black italic uppercase tracking-tighter">{direction === 'TO_ALX' ? counterCurrency : 'ALX'}</span>
              </div>
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-1/2 bg-transparent text-right text-2xl font-black italic outline-none tracking-tighter text-foreground" />
            </div>
          </div>

          <div className="flex justify-center -my-4 relative z-20">
            <button onClick={() => { setDirection(prev => prev === 'TO_ALX' ? 'FROM_ALX' : 'TO_ALX'); setAmount(""); }} className="w-10 h-10 bg-background border-4 border-muted rounded-full shadow-xl flex items-center justify-center text-primary active:scale-90 transition-transform"><ArrowUpDown className="w-5 h-5" /></button>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-1">
              {direction === 'TO_ALX' ? 'Terima Estimasi' : 'Dapatkan'}
            </label>
            <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-between border border-border shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-md", direction === 'FROM_ALX' ? (counterCurrency === 'USDT' ? "bg-[#0D9488]" : "bg-rose-600") : "gold-gradient")}>
                  {direction === 'FROM_ALX' ? (counterCurrency === 'USDT' ? <svg viewBox="0 0 24 24" fill="white" className="w-full h-full"><path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/></svg> : <span className="text-white font-black text-sm">Rp</span>) : <LogoIcon className="text-white" />}
                </div>
                <span className="text-sm font-black italic uppercase tracking-tighter">{direction === 'FROM_ALX' ? counterCurrency : 'ALX'}</span>
              </div>
              <p className="text-2xl font-black text-muted-foreground/60 italic tracking-tighter">{convertedValue}</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-4">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase italic">
            Harga konversi yang ditampilkan mencakup perlindungan volatilitas pasar dan margin operasional AliBank sebesar 2%.
          </p>
        </div>
      </main>

      <div className="p-4 bg-background border-t border-border mt-auto pb-10">
        <Button 
          disabled={!amount || isProcessing} 
          onClick={handleConvert} 
          className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-[1.5rem] shadow-xl text-sm tracking-[0.2em]"
        >
          {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : (direction === 'TO_ALX' ? 'EKSEKUSI KONVERSI PREMIUM' : 'KONFIRMASI PENJUALAN')}
        </Button>
      </div>
    </div>
  );
}
