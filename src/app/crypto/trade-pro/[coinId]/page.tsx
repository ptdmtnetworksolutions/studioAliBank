
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Timer, 
  Zap, 
  ShieldCheck, 
  History,
  Activity,
  ChevronDown,
  Loader2,
  Trophy,
  Skull,
  Coins,
  Wallet,
  User,
  Plus,
  Minus,
  Settings2,
  LineChart,
  Clock,
  LayoutGrid,
  HelpCircle,
  ShoppingBag,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  Cell,
  ReferenceLine,
  ComposedChart,
  Bar,
  Line
} from "recharts";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

const ALX_PRICE_IDR = 194004;

export default function TradeProPage() {
  const { coinId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const symbol = (coinId as string).toUpperCase();
  const isAlix = symbol === 'ALX';

  const [mounted, setMounted] = useState(false);
  const [price, setPrice] = useState(isAlix ? 12.24 : 66450.00);
  const [candles, setCandles] = useState<any[]>([]);
  const [amount, setAmount] = useState(100000);
  const [duration, setDuration] = useState(60);
  const [isTrading, setIsTrading] = useState(false);
  const [prediction, setPrediction] = useState<'high' | 'low' | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
    const initial = Array.from({ length: 30 }, (_, i) => generateCandle(i, price));
    setCandles(initial);
  }, []);

  function generateCandle(time: number, basePrice: number) {
    const open = basePrice + (Math.random() * 0.4 - 0.2);
    const close = open + (Math.random() * 0.6 - 0.3);
    const high = Math.max(open, close) + Math.random() * 0.1;
    const low = Math.min(open, close) - Math.random() * 0.1;
    return {
      time,
      open,
      close,
      high,
      low,
      isUp: close >= open,
      candleHeight: Math.max(0.01, Math.abs(close - open)),
      candleBottom: Math.min(open, close)
    };
  }

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const move = Math.random() * 0.04 - 0.02;
      setPrice(prev => {
        const next = prev + move;
        setCandles(prevCandles => {
          const last = prevCandles[prevCandles.length - 1];
          const updatedLast = {
            ...last,
            close: next,
            high: Math.max(last.high, next),
            low: Math.min(last.low, next),
            isUp: next >= last.open,
            candleHeight: Math.max(0.01, Math.abs(next - last.open)),
            candleBottom: Math.min(last.open, next)
          };
          
          if (Date.now() % 5000 < 1000) {
            return [...prevCandles.slice(1), generateCandle(last.time + 1, next)];
          }
          return [...prevCandles.slice(0, -1), updatedLast];
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    if (isTrading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTrading && timeLeft === 0) {
      finishTrade();
    }
  }, [isTrading, timeLeft]);

  const startTrade = async (type: 'high' | 'low') => {
    if (isTrading || !userDocRef || !userData || !db) return;
    if (userData.totalBalance < amount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup" });
      return;
    }

    updateDoc(userDocRef, { totalBalance: increment(-amount) });
    const liquidityRef = doc(db, "system", "liquidity");
    updateDoc(liquidityRef, { totalFiatInjected: increment(amount), tradeXGrossVolumeIdr: increment(amount) });

    setPrediction(type);
    setEntryPrice(price);
    setIsTrading(true);
    setTimeLeft(duration);
    toast({ title: "Order Berhasil", description: `Prediksi ${type.toUpperCase()} sebesar Rp ${amount.toLocaleString()}` });
  };

  const finishTrade = async () => {
    if (!entryPrice || !userDocRef || !user || !db) return;
    const isWin = prediction === 'high' ? price > entryPrice : price < entryPrice;
    const rewardInAlx = isWin ? (amount * 1.9) / ALX_PRICE_IDR : 0;

    if (isWin) {
      updateDoc(userDocRef, { "cryptoBalances.ALX": increment(rewardInAlx) });
      addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Trade-X Profit!",
        message: `Kemenangan Trade-X: +${rewardInAlx.toFixed(6)} ALX`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    addDoc(collection(db, "users", user.uid, "transactions"), {
      date: new Date().toISOString(),
      description: `Trade-X: ${prediction?.toUpperCase()} ${symbol}`,
      category: "Trade-X",
      amount: amount,
      rewardAlx: rewardInAlx,
      status: isWin ? "WIN" : "LOSS",
      type: "expense",
      timestamp: serverTimestamp()
    });

    setIsTrading(false);
    setPrediction(null);
    setEntryPrice(null);
    toast({
      variant: isWin ? "default" : "destructive",
      title: isWin ? "PROFIT!" : "LOSS",
      description: isWin ? `Dapatkan ${rewardInAlx.toFixed(6)} ALX` : "Coba lagi strategi Anda."
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F1113] text-white flex flex-col font-body overflow-hidden">
      {/* PROFESSIONAL TOP HEADER */}
      <header className="px-4 h-16 flex items-center justify-between bg-[#171A1D] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform" onClick={() => router.push('/profile')}>
            <User className="w-5 h-5 text-white/60" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171A1D] flex items-center justify-center text-[8px] font-black text-white">7</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => router.push('/')}>
              <span className="text-sm font-black italic tracking-tighter">IDR {(userData?.totalBalance ?? 0).toLocaleString()}</span>
              <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">IDR Akun Anda</span>
          </div>
        </div>
        <button onClick={() => router.push('/topup')} className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-transform">
          <Wallet className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* ASSET SELECTOR BAR */}
      <div className="px-4 h-12 flex items-center justify-between bg-[#1C2024] shrink-0">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 cursor-pointer active:bg-white/10 transition-colors">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center p-1">
            <LogoIcon className="text-black" />
          </div>
          <span className="text-xs font-black italic uppercase tracking-tighter">{symbol} Index - <span className="text-green-500">90%</span></span>
          <ChevronDown className="w-3 h-3 text-white/40" />
        </div>
        <div className="flex items-center gap-4">
          <Settings2 className="w-4 h-4 text-white/60" />
          <div className="text-[10px] font-black bg-white/10 px-2 py-1 rounded text-white/80">5s</div>
          <Activity className="w-4 h-4 text-white/60" />
        </div>
      </div>

      {/* CHART AREA */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        <div className="flex-1 relative pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candles} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
              <YAxis domain={['auto', 'auto']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'rgba(255,255,255,0.3)'}} />
              <Tooltip content={() => null} />
              
              {/* CURRENT PRICE LINE */}
              <ReferenceLine y={price} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2">
                <label value={price.toFixed(2)} position="right" fill="#fff" fontSize={10} fontWeight="bold" className="bg-white text-black" />
              </ReferenceLine>

              {entryPrice && (
                <ReferenceLine y={entryPrice} stroke="#FCD535" strokeDasharray="3 3" />
              )}

              <Bar dataKey="candleHeight" isAnimationActive={false}>
                {candles.map((entry, index) => (
                  <Cell key={`body-${index}`} fill={entry.isUp ? "#26A69A" : "#EF5350"} />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>

          {/* ZOOM CONTROLS */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 bg-[#1C2024]/80 backdrop-blur p-1 rounded-lg border border-white/5">
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"><Minus className="w-4 h-4 text-white/60" /></button>
            <div className="w-px h-4 bg-white/10 self-center" />
            <button className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded"><Plus className="w-4 h-4 text-white/60" /></button>
          </div>
        </div>

        {/* TRADING TERMINAL PANEL */}
        <div className="bg-[#171A1D] border-t border-white/5 p-4 space-y-4 pb-8 shrink-0">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fixed Time mode</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-white/40 uppercase">Profit:</span>
              <span className="text-xs font-black text-green-500 italic">+Rp {(amount * 0.9).toLocaleString()}</span>
              <HelpCircle className="w-3 h-3 text-white/20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* DURATION SELECTOR */}
            <div className="bg-[#1C2024] rounded-xl p-1 flex items-center justify-between border border-white/5 h-14">
              <button onClick={() => setDuration(Math.max(5, duration - 15))} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Minus className="w-4 h-4 text-white/40" /></button>
              <div className="flex-1 text-center">
                <p className="text-base font-black italic">{duration >= 60 ? `${duration/60} min` : `${duration} s`}</p>
              </div>
              <button onClick={() => setDuration(duration + 15)} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-4 h-4 text-white/40" /></button>
            </div>

            {/* AMOUNT SELECTOR */}
            <div className="bg-[#1C2024] rounded-xl p-1 flex items-center justify-between border border-white/5 h-14">
              <button onClick={() => setAmount(Math.max(10000, amount - 50000))} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Minus className="w-4 h-4 text-white/40" /></button>
              <div className="flex-1 text-center">
                <p className="text-[11px] font-black italic uppercase leading-none mt-1">Rp</p>
                <p className="text-sm font-black italic">{amount.toLocaleString()}</p>
              </div>
              <button onClick={() => setAmount(amount + 50000)} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-4 h-4 text-white/40" /></button>
            </div>
          </div>

          <div className="flex gap-3 h-16">
            {/* DOWN BUTTON */}
            <button 
              onClick={() => startTrade('low')}
              disabled={isTrading}
              className={cn(
                "flex-1 rounded-2xl bg-[#EF5350] hover:bg-[#D32F2F] active:scale-95 transition-all flex items-center justify-between px-6 shadow-lg shadow-red-500/10",
                isTrading && "opacity-50 grayscale"
              )}
            >
              <div className="text-left">
                <span className="text-xs font-black uppercase italic tracking-tighter block">Down</span>
                <p className="text-[8px] font-bold text-white/60 uppercase">Meleset</p>
              </div>
              <TrendingDown className="w-6 h-6" />
            </button>

            {/* STATUS / CLOCK ICON */}
            <button className="w-16 h-full bg-[#1C2024] rounded-2xl border border-white/5 flex items-center justify-center active:scale-95 transition-transform">
              {isTrading ? <span className="text-primary font-black italic text-lg">{timeLeft}</span> : <Clock className="w-6 h-6 text-white/40" />}
            </button>

            {/* UP BUTTON */}
            <button 
              onClick={() => startTrade('high')}
              disabled={isTrading}
              className={cn(
                "flex-1 rounded-2xl bg-[#26A69A] hover:bg-[#00897B] active:scale-95 transition-all flex items-center justify-between px-6 shadow-lg shadow-teal-500/10",
                isTrading && "opacity-50 grayscale"
              )}
            >
              <div className="text-left">
                <span className="text-xs font-black uppercase italic tracking-tighter block">Up</span>
                <p className="text-[8px] font-bold text-white/60 uppercase">Naik</p>
              </div>
              <TrendingUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {/* TERMINAL NAVIGATION */}
      <footer className="h-16 bg-[#171A1D] border-t border-white/5 flex items-center justify-around shrink-0 px-2">
        <button className="flex flex-col items-center gap-1 group">
          <LineChart className="w-5 h-5 text-primary" />
          <div className="w-1 h-1 bg-primary rounded-full" />
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <ArrowRightLeft className="w-5 h-5" />
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <ShoppingBag className="w-5 h-5" />
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <Trophy className="w-5 h-5" />
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
          <HelpCircle className="w-5 h-5" />
        </button>
      </footer>
    </div>
  );
}
