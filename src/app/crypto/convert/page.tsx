
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
  YAxis,
  Tooltip
} from "recharts";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const mockChartData = [
  { time: '00:00', price: 615 },
  { time: '01:00', price: 618 },
  { time: '02:00', price: 610 },
  { time: '03:00', price: 606 },
  { time: '04:00', price: 612 },
  { time: '05:00', price: 611 },
  { time: '06:00', price: 614 },
  { time: '07:00', price: 612 },
  { time: '08:00', price: 613 },
  { time: '09:00', price: 609 },
  { time: '10:00', price: 611 },
  { time: '11:00', price: 612.24 },
];

export default function ConvertPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [direction, setDirection] = useState<'ALX_TO_USDT' | 'USDT_TO_ALX'>('ALX_TO_USDT');

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
  }, []);

  const ALX_PRICE_USDT = 612.24;
  
  const convertedValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0.00";
    return direction === 'ALX_TO_USDT' 
      ? (num * ALX_PRICE_USDT).toFixed(2)
      : (num / ALX_PRICE_USDT).toFixed(8);
  }, [amount, direction]);

  const handleConvert = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) return;

    const balanceToCheck = direction === 'ALX_TO_USDT' 
      ? (userData.cryptoBalances?.ALX || 0) 
      : (userData.cryptoBalances?.USDT || 0);

    if (numAmount > balanceToCheck) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Silakan isi ulang dompet Anda terlebih dahulu." });
      return;
    }

    setIsProcessing(true);
    try {
      const resultNum = parseFloat(convertedValue);

      if (direction === 'ALX_TO_USDT') {
        await updateDoc(userDocRef, {
          "cryptoBalances.ALX": increment(-numAmount),
          "cryptoBalances.USDT": increment(resultNum)
        });
      } else {
        await updateDoc(userDocRef, {
          "cryptoBalances.USDT": increment(-numAmount),
          "cryptoBalances.ALX": increment(resultNum)
        });
      }

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: direction === 'ALX_TO_USDT' ? `Konversi ALX ke USDT` : `Konversi USDT ke ALX`,
        category: "Crypto Swap",
        fromAmount: numAmount,
        fromCurrency: direction === 'ALX_TO_USDT' ? "ALX" : "USDT",
        toAmount: resultNum,
        toCurrency: direction === 'ALX_TO_USDT' ? "USDT" : "ALX",
        type: "expense",
        status: "success",
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Konversi Berhasil",
        message: `Berhasil menukar ${numAmount} ${direction === 'ALX_TO_USDT' ? 'ALX' : 'USDT'} menjadi ${resultNum} ${direction === 'ALX_TO_USDT' ? 'USDT' : 'ALX'}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      setStep('success');
      toast({ title: "Transaksi Selesai", description: "Dana telah dikreditkan ke dompet Anda." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Konversi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleDirection = () => {
    setDirection(prev => prev === 'ALX_TO_USDT' ? 'USDT_TO_ALX' : 'ALX_TO_USDT');
    setAmount("");
  };

  if (!mounted) return null;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500 overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-xl font-black italic uppercase tracking-tight text-slate-900 mb-1">Konversi Berhasil</h2>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-6 italic">Tervalidasi oleh AliBank V3 Mainnet Protocol</p>
        
        <div className="w-full bg-slate-50 rounded-[2rem] p-6 mb-8 space-y-4 shadow-inner">
          <div>
            <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Total Diterima</p>
            <p className="text-3xl font-black italic text-slate-900">
              {convertedValue} {direction === 'ALX_TO_USDT' ? 'USDT' : 'ALX'}
            </p>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex justify-between items-center text-[9px] font-bold uppercase">
            <span className="text-slate-400">Nilai Tukar</span>
            <span className="text-slate-900">1 ALX = {ALX_PRICE_USDT} USDT</span>
          </div>
        </div>

        <Button 
          className="w-full h-14 bg-[#FCD535] text-slate-900 font-black italic uppercase rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
          onClick={() => router.push('/')}
        >
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-body overflow-hidden">
      {/* Header - Compact */}
      <header className="px-4 h-12 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black tracking-tight italic uppercase">Convert</h1>
        <div className="w-8" /> 
      </header>

      <main className="flex-1 px-4 pt-1 space-y-3 overflow-hidden">
        {/* Banner Promo - Compact */}
        <div className="bg-[#FFFBEB] border border-yellow-100 rounded-xl p-3 flex items-center gap-3">
          <Gift className="w-4 h-4 text-yellow-600 shrink-0" />
          <p className="text-[10px] font-bold text-slate-700 leading-tight">
            Dapatkan Rabat dengan Konversi Berulang
          </p>
        </div>

        {/* Instan Dropdown & Icons - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg cursor-pointer hover:bg-slate-100">
            Instan <ChevronDown className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-3 text-slate-700">
            <Settings2 className="w-4 h-4 cursor-pointer hover:text-slate-900" />
            <History onClick={() => router.push('/transactions')} className="w-4 h-4 cursor-pointer hover:text-slate-900" />
          </div>
        </div>

        {/* Harga Info - Compact */}
        <div className="flex items-center gap-2 px-1">
          <p className="text-xs font-black text-slate-900 italic">
            1 ALX = {ALX_PRICE_USDT} USDT <span className="text-rose-500">-1.14%</span>
          </p>
          <RefreshCw className="w-3 h-3 text-slate-400 animate-spin-slow" />
        </div>

        {/* Chart Area - Slimmer */}
        <div className="h-32 w-full relative">
          <div className="absolute top-0 left-0 text-[8px] font-black text-slate-300">619,61</div>
          <div className="absolute bottom-2 left-0 text-[8px] font-black text-slate-300">606,02</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <YAxis domain={[600, 625]} hide />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#FCD535" 
                strokeWidth={2.5} 
                dot={false} 
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Timeframe Toggles - Compact */}
        <div className="flex items-center justify-center gap-6 py-1">
          {['1H', '1M', '1B'].map(t => (
            <button key={t} className={cn(
              "text-[10px] font-black px-3 py-1 rounded-md transition-all",
              t === '1H' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}>{t}</button>
          ))}
          <Info className="w-3.5 h-3.5 text-slate-400 cursor-pointer" />
        </div>

        {/* Conversion Form - Compact Spacing */}
        <div className="space-y-1">
          {/* Dari Section */}
          <div className="space-y-1">
            <div className="flex justify-between items-center px-1">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Dari</label>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-slate-400 italic uppercase">
                  Dompet {direction === 'ALX_TO_USDT' ? (userData?.cryptoBalances?.ALX ?? 0).toLocaleString() : (userData?.cryptoBalances?.USDT ?? 0).toLocaleString()} {direction === 'ALX_TO_USDT' ? 'ALX' : 'USDT'}
                </span>
                <PlusCircle className="w-2.5 h-2.5 text-[#FCD535] cursor-pointer" />
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-center justify-between border-2 border-transparent focus-within:border-[#FCD535] transition-all shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center p-2 shadow-sm",
                  direction === 'ALX_TO_USDT' ? "bg-slate-900" : "bg-[#0D9488]"
                )}>
                  {direction === 'ALX_TO_USDT' ? (
                    <LogoIcon className="text-[#FCD535]" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                      <path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/>
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-0.5 cursor-pointer">
                  <span className="text-base font-black italic tracking-tight uppercase">{direction === 'ALX_TO_USDT' ? 'ALX' : 'USDT'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              <div className="text-right flex-1">
                <input 
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-right text-xl font-black italic text-slate-900 outline-none placeholder:text-slate-200 tracking-tighter"
                />
              </div>
            </div>
          </div>

          {/* Swap Button - Smaller */}
          <div className="flex justify-center -my-3.5 relative z-20">
            <button 
              onClick={toggleDirection}
              className="w-8 h-8 bg-white border border-slate-100 rounded-full shadow-md flex items-center justify-center text-slate-900 active:scale-90 transition-transform hover:bg-slate-50"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Ke Section */}
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Ke</label>
            <div className="bg-[#F8FAFC] rounded-xl p-3 flex items-center justify-between border-2 border-transparent shadow-sm">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center p-2 shadow-sm",
                  direction === 'ALX_TO_USDT' ? "bg-[#0D9488]" : "bg-slate-900"
                )}>
                  {direction === 'ALX_TO_USDT' ? (
                    <svg viewBox="0 0 24 24" fill="white" className="w-full h-full">
                      <path d="M12 2L2 12l10 10 10-10L12 2zm0 16.5L5.5 12 12 5.5 18.5 12 12 18.5z"/>
                    </svg>
                  ) : (
                    <LogoIcon className="text-[#FCD535]" />
                  )}
                </div>
                <div className="flex items-center gap-0.5 cursor-pointer">
                  <span className="text-base font-black italic tracking-tight uppercase">{direction === 'ALX_TO_USDT' ? 'USDT' : 'ALX'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-slate-200 italic tracking-tighter">
                  {convertedValue}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Action - Fixed at Bottom */}
      <div className="p-4 bg-white border-t border-slate-50 mt-auto">
        <Button 
          disabled={!amount || isProcessing}
          onClick={handleConvert}
          className="w-full h-14 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] font-black italic uppercase rounded-2xl border-none shadow-none text-sm tracking-[0.1em] transition-all"
        >
          {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : "PRATINJAU"}
        </Button>
      </div>
    </div>
  );
}
