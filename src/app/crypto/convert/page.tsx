
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

    // Cek Saldo Riil
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

      // 1. Eksekusi Pertukaran Aset Riil di Firestore
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

      // 2. Log Riwayat Transaksi Nasabah
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

      // 3. Kirim Notifikasi Internal
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900 mb-2">Konversi Berhasil</h2>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10 italic">Tervalidasi oleh AliBank V3 Mainnet Protocol</p>
        
        <div className="w-full bg-slate-50 rounded-[2.5rem] p-8 mb-10 space-y-6 shadow-inner">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Total Diterima</p>
            <p className="text-4xl font-black italic text-slate-900">
              {convertedValue} {direction === 'ALX_TO_USDT' ? 'USDT' : 'ALX'}
            </p>
          </div>
          <div className="h-px bg-slate-200" />
          <div className="flex justify-between items-center text-[10px] font-bold uppercase">
            <span className="text-slate-400">Nilai Tukar</span>
            <span className="text-slate-900">1 ALX = {ALX_PRICE_USDT} USDT</span>
          </div>
        </div>

        <Button 
          className="w-full h-16 bg-[#FCD535] text-slate-900 font-black italic uppercase rounded-2xl shadow-xl hover:scale-[1.02] transition-all"
          onClick={() => router.push('/')}
        >
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 relative flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight italic uppercase">Convert</h1>
        <div className="w-8" /> 
      </header>

      <main className="flex-1 px-4 py-2 space-y-6 overflow-y-auto no-scrollbar">
        {/* Banner Promo */}
        <div className="bg-[#FFFBEB] border border-yellow-100 rounded-xl p-4 flex items-center gap-3">
          <Gift className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-xs font-bold text-slate-700 leading-tight">
            Dapatkan Rabat dengan Konversi Berulang
          </p>
        </div>

        {/* Instan Dropdown & Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-100">
            Instan <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 text-slate-700">
            <Settings2 className="w-5 h-5 cursor-pointer hover:text-slate-900" />
            <History onClick={() => router.push('/transactions')} className="w-5 h-5 cursor-pointer hover:text-slate-900" />
          </div>
        </div>

        {/* Harga Info */}
        <div className="flex items-center gap-2 px-1">
          <p className="text-sm font-black text-slate-900 italic">
            1 ALX = {ALX_PRICE_USDT} USDT <span className="text-rose-500">-1.14%</span>
          </p>
          <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin-slow" />
        </div>

        {/* Chart Area */}
        <div className="h-48 w-full relative">
          <div className="absolute top-0 left-0 text-[10px] font-black text-slate-300">619,61</div>
          <div className="absolute bottom-4 left-0 text-[10px] font-black text-slate-300">606,02</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <YAxis domain={[600, 625]} hide />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#FCD535" 
                strokeWidth={3} 
                dot={false} 
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Timeframe Toggles */}
        <div className="flex items-center justify-center gap-8 py-2">
          {['1H', '1M', '1B'].map(t => (
            <button key={t} className={cn(
              "text-xs font-black px-4 py-1.5 rounded-md transition-all",
              t === '1H' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}>{t}</button>
          ))}
          <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
        </div>

        {/* Conversion Form */}
        <div className="space-y-1 pt-4">
          {/* Dari Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dari</label>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-slate-400 italic uppercase">
                  Dompet {direction === 'ALX_TO_USDT' ? (userData?.cryptoBalances?.ALX ?? 0).toLocaleString() : (userData?.cryptoBalances?.USDT ?? 0).toLocaleString()} {direction === 'ALX_TO_USDT' ? 'ALX' : 'USDT'}
                </span>
                <PlusCircle className="w-3 h-3 text-[#FCD535] cursor-pointer" />
              </div>
            </div>
            <div className="bg-[#F8FAFC] rounded-2xl p-5 flex items-center justify-between border-2 border-transparent focus-within:border-[#FCD535] transition-all shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-sm",
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
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-xl font-black italic tracking-tight uppercase">{direction === 'ALX_TO_USDT' ? 'ALX' : 'USDT'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="text-right flex-1">
                <input 
                  type="number"
                  placeholder="0.000016"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-right text-2xl font-black italic text-slate-900 outline-none placeholder:text-slate-200 tracking-tighter"
                />
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-4 relative z-20">
            <button 
              onClick={toggleDirection}
              className="w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-900 active:scale-90 transition-transform hover:bg-slate-50"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>
          </div>

          {/* Ke Section */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Ke</label>
            <div className="bg-[#F8FAFC] rounded-2xl p-5 flex items-center justify-between border-2 border-transparent shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center p-2.5 shadow-sm",
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
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-xl font-black italic tracking-tight uppercase">{direction === 'ALX_TO_USDT' ? 'USDT' : 'ALX'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-200 italic tracking-tighter">
                  {convertedValue}
                </p>
              </div>
            </div>
          </div>

          {/* Magic Button */}
          <div className="flex justify-end mt-4 pr-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-500 shadow-sm animate-pulse cursor-pointer">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Action */}
      <div className="p-4 bg-white sticky bottom-0 border-t border-slate-50">
        <Button 
          disabled={!amount || isProcessing}
          onClick={handleConvert}
          className="w-full h-16 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-[0.1em] transition-all"
        >
          {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : "PRATINJAU"}
        </Button>
      </div>
    </div>
  );
}
