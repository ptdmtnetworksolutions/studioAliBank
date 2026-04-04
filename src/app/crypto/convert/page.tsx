
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
import { useState, useEffect, useMemo } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
  YAxis
} from "recharts";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const mockChartData = [
  { time: '00:00', price: 12.10 },
  { time: '01:00', price: 12.15 },
  { time: '02:00', price: 12.05 },
  { time: '03:00', price: 12.08 },
  { time: '04:00', price: 12.18 },
  { time: '05:00', price: 12.25 },
  { time: '06:00', price: 12.20 },
  { time: '07:00', price: 12.22 },
  { time: '08:00', price: 12.24 },
  { time: '09:00', price: 12.21 },
  { time: '10:00', price: 12.23 },
  { time: '11:00', price: 12.24 },
];

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

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  // KONFIGURASI HARGA STRATEGIS ALIBANK V3
  const ALX_PRICE_USDT = 12.24;
  const USDT_IDR_RATE = 15850;
  const ALX_PRICE_IDR = ALX_PRICE_USDT * USDT_IDR_RATE; // Rp 194,004
  
  const currentRate = counterCurrency === 'USDT' ? ALX_PRICE_USDT : ALX_PRICE_IDR;

  const convertedValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0.00";
    if (direction === 'FROM_ALX') {
      return (num * currentRate).toFixed(counterCurrency === 'USDT' ? 2 : 0);
    } else {
      return (num / currentRate).toFixed(8);
    }
  }, [amount, direction, currentRate, counterCurrency]);

  const handleConvert = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Cek Saldo Berdasarkan Mata Uang Asal
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
        description: `Anda membutuhkan saldo ${direction === 'FROM_ALX' ? 'ALX' : counterCurrency} yang lebih besar untuk transaksi ini.` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      const resultNum = parseFloat(convertedValue);

      if (direction === 'FROM_ALX') {
        // JUAL ALX -> (DITERIMA USDT / IDR)
        const updates: any = { "cryptoBalances.ALX": increment(-numAmount) };
        if (counterCurrency === 'USDT') {
          updates["cryptoBalances.USDT"] = increment(resultNum);
        } else {
          updates["totalBalance"] = increment(resultNum);
        }
        await updateDoc(userDocRef, updates);
      } else {
        // BELI ALX DENGAN (USDT / IDR)
        const updates: any = { "cryptoBalances.ALX": increment(resultNum) };
        if (counterCurrency === 'USDT') {
          updates["cryptoBalances.USDT"] = increment(-numAmount);
        } else {
          updates["totalBalance"] = increment(-numAmount);
        }
        await updateDoc(userDocRef, updates);
      }

      // Catat ke Audit Internal & Transaksi User
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: direction === 'FROM_ALX' ? `Jual ALX ke ${counterCurrency}` : `Beli ALX dengan ${counterCurrency}`,
        category: "Ali-Exchange",
        fromAmount: numAmount,
        fromCurrency: direction === 'FROM_ALX' ? "ALX" : counterCurrency,
        toAmount: resultNum,
        toCurrency: direction === 'FROM_ALX' ? counterCurrency : "ALX",
        type: "expense",
        status: "success",
        timestamp: serverTimestamp()
      });

      // Update Likuiditas Global System
      const systemRef = doc(db, "system", "liquidity");
      const liquidityUpdates: any = {};
      
      if (direction === 'TO_ALX' && counterCurrency === 'IDR') {
        liquidityUpdates.totalInternalAumIdr = increment(numAmount);
        liquidityUpdates.totalAlixSoldInternally = increment(resultNum);
      }
      
      if (Object.keys(liquidityUpdates).length > 0) {
        await updateDoc(systemRef, liquidityUpdates);
      }

      setStep('success');
      toast({ title: "Transaksi Berhasil", description: "Aset ALX Anda telah diperbarui." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Konversi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tight text-foreground mb-1">Transaksi Berhasil</h2>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-6 italic">Verified by AliBank Settlement Node</p>
        
        <div className="w-full bg-muted/50 rounded-[2rem] p-6 mb-8 space-y-4 shadow-inner">
          <div>
            <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Total Diterima</p>
            <p className="text-3xl font-black italic text-foreground">
              {convertedValue} {direction === 'TO_ALX' ? 'ALX' : counterCurrency}
            </p>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center text-[9px] font-bold uppercase text-muted-foreground">
            <span>Harga Eksekusi</span>
            <span>1 ALX = {counterCurrency === 'USDT' ? `${ALX_PRICE_USDT} USDT` : `Rp${ALX_PRICE_IDR.toLocaleString()}`}</span>
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
        <h1 className="text-base font-black tracking-tight italic uppercase">Ali-Exchange Terminal</h1>
        <div className="flex gap-2">
          <History onClick={() => router.push('/transactions')} className="w-4 h-4 text-muted-foreground cursor-pointer" />
        </div>
      </header>

      <main className="flex-1 px-4 pt-1 space-y-3 overflow-hidden">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 flex items-center gap-3">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <p className="text-[9px] font-bold text-foreground leading-tight uppercase italic">Beli ALX di fase internal untuk mendapatkan harga dasar $12.24 sebelum Listing Global.</p>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <p className="text-[11px] font-black text-foreground italic">
              Harga ALX: {counterCurrency === 'USDT' ? `$${ALX_PRICE_USDT}` : `Rp${ALX_PRICE_IDR.toLocaleString()}`}
            </p>
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest">Target Price: $12.24 (Anchor)</span>
          </div>
          <div 
            className="flex items-center gap-1 text-[10px] font-black bg-muted/50 px-3 py-1.5 rounded-full border border-border cursor-pointer active:scale-95 transition-all"
            onClick={() => setCounterCurrency(counterCurrency === 'USDT' ? 'IDR' : 'USDT')}
          >
            Bayar dengan {counterCurrency === 'USDT' ? 'IDR' : 'USDT'} <ChevronDown className="w-3 h-3" />
          </div>
        </div>

        <div className="h-28 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} hide />
              <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          {/* ASAL */}
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

          {/* TUJUAN */}
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
            Hasil penjualan ALX dikumpulkan untuk pembentukan pool likuiditas (USDT) yang akan dikunci pada Smart Contract AliBank di Uniswap V3 Mainnet.
          </p>
        </div>
      </main>

      <div className="p-4 bg-background border-t border-border mt-auto pb-10">
        <Button 
          disabled={!amount || isProcessing} 
          onClick={handleConvert} 
          className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-[1.5rem] shadow-xl text-sm tracking-[0.2em]"
        >
          {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : (direction === 'TO_ALX' ? 'EKSEKUSI PEMBELIAN ALX' : 'KONFIRMASI PENJUALAN')}
        </Button>
      </div>
    </div>
  );
}
