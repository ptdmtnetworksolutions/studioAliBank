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
  ArrowRightLeft,
  Bitcoin,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Line,
  CartesianGrid
} from "recharts";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

const ALX_PRICE_USD = 12.24;
const USDT_IDR_RATE = 15850;
const ALX_PRICE_IDR = ALX_PRICE_USD * USDT_IDR_RATE; // Rp 194,004

const ASSET_PRICES: Record<string, number> = {
  IDR: 1,
  ALX: ALX_PRICE_IDR,
  USDT: 15850,
  ETH: 1987.12 * 15850,
  BTC: 66262.29 * 15850
};

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
  const [zoomLevel, setZoomLevel] = useState(40);
  const [stakeCurrency, setStakeCurrency] = useState<'IDR' | 'ALX' | 'USDT' | 'ETH' | 'BTC'>('IDR');
  const [amount, setAmount] = useState(100000);
  const [duration, setDuration] = useState(60);
  const [isTrading, setIsTrading] = useState(false);
  const [prediction, setPrediction] = useState<'high' | 'low' | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const visibleCandles = useMemo(() => {
    return candles.slice(-zoomLevel);
  }, [candles, zoomLevel]);

  useEffect(() => {
    setMounted(true);
    const initial = Array.from({ length: 150 }, (_, i) => generateCandle(i, price, 150));
    setCandles(initial);
  }, []);

  function generateCandle(index: number, basePrice: number, total: number) {
    const time = new Date(Date.now() - (total - index) * 5000);
    const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const open = basePrice + (Math.random() * 0.4 - 0.2);
    const close = open + (Math.random() * 0.6 - 0.3);
    const high = Math.max(open, close) + Math.random() * 0.15;
    const low = Math.min(open, close) - Math.random() * 0.15;
    return { time: timeStr, open, close, high, low, isUp: close >= open, body: [open, close], wick: [low, high] };
  }

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const move = Math.random() * 0.06 - 0.03;
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
            body: [last.open, next],
            wick: [Math.min(last.low, next), Math.max(last.high, next)]
          };
          if (Date.now() % 5000 < 1000) {
            return [...prevCandles.slice(1), generateCandle(150, next, 150)];
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

  const handleZoom = (type: 'in' | 'out') => {
    setZoomLevel(prev => {
      if (type === 'in') return Math.max(10, prev - 5);
      return Math.min(150, prev + 10);
    });
  };

  const startTrade = async (type: 'high' | 'low') => {
    if (isTrading || !userDocRef || !userData || !db) return;

    let balance = 0;
    if (stakeCurrency === 'IDR') balance = userData.totalBalance || 0;
    else balance = userData.cryptoBalances?.[stakeCurrency] || 0;

    if (balance < amount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: `Saldo ${stakeCurrency} Anda tidak mencukupi.` });
      return;
    }

    const balanceKey = stakeCurrency === 'IDR' ? "totalBalance" : `cryptoBalances.${stakeCurrency}`;
    updateDoc(userDocRef, { [balanceKey]: increment(-amount) });

    const liquidityRef = doc(db, "system", "liquidity");
    const amountInIdr = amount * ASSET_PRICES[stakeCurrency];
    updateDoc(liquidityRef, { 
      totalFiatInjected: increment(amountInIdr),
      tradeXGrossVolumeIdr: increment(amountInIdr) 
    });

    setPrediction(type);
    setEntryPrice(price);
    setIsTrading(true);
    setTimeLeft(duration);
    toast({ title: "Order Berhasil", description: `Prediksi ${type.toUpperCase()} sebesar ${amount} ${stakeCurrency}` });
  };

  const finishTrade = async () => {
    if (!entryPrice || !userDocRef || !user || !db) return;
    const isWin = prediction === 'high' ? price > entryPrice : price < entryPrice;
    
    const amountInIdr = amount * ASSET_PRICES[stakeCurrency];
    const rewardInAlx = isWin ? (amountInIdr * 1.9) / ALX_PRICE_IDR : 0;

    const globalAuditRef = collection(db, "system", "audit", "global_transactions");

    if (isWin) {
      updateDoc(userDocRef, { "cryptoBalances.ALX": increment(rewardInAlx) });
      
      // LOG KEMENANGAN KE AUDIT GLOBAL
      addDoc(globalAuditRef, {
        id: `TRADEX-WIN-${Date.now()}`,
        category: "Trade-X Win",
        amountIdr: amountInIdr * 1.9,
        cryptoAmount: rewardInAlx,
        cryptoCurrency: "ALX",
        status: "success",
        timestamp: serverTimestamp(),
        description: `User Win: Trade-X high yield payout for ${userData?.name}.`,
        userEmail: user.email
      });

      addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Trade-X Profit!",
        message: `Kemenangan Trade-X: +${rewardInAlx.toFixed(6)} ALX`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    } else {
      // LOG KEKALAHAN KE AUDIT GLOBAL (BANK PROFIT)
      addDoc(globalAuditRef, {
        id: `TRADEX-CAPTURE-${Date.now()}`,
        category: "Trade-X Capture",
        amountIdr: amountInIdr,
        cryptoAmount: stakeCurrency !== 'IDR' ? amount : 0,
        cryptoCurrency: stakeCurrency,
        status: "success",
        timestamp: serverTimestamp(),
        description: `Bank Profit: Trade-X Loss capture from ${userData?.name}.`,
        userEmail: user.email
      });
    }

    addDoc(collection(db, "users", user.uid, "transactions"), {
      date: new Date().toISOString(),
      description: `Trade-X: ${prediction?.toUpperCase()} ${symbol} (Stake ${stakeCurrency})`,
      category: "Trade-X",
      stakeAmount: amount,
      stakeCurrency: stakeCurrency,
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

  const currentFormattedPrice = price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (!mounted) return null;

  return (
    <div className="h-screen bg-[#0F1113] text-white flex flex-col font-body overflow-hidden">
      <header className="px-4 h-16 flex items-center justify-between bg-[#171A1D] border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center relative cursor-pointer active:scale-95 transition-transform" onClick={() => router.push('/profile')}>
            <User className="w-5 h-5 text-white/60" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#171A1D] flex items-center justify-center text-[8px] font-black text-white">7</div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => router.push('/')}>
              <span className="text-sm font-black italic tracking-tighter uppercase text-white">
                {stakeCurrency === 'IDR' ? `Rp ${(userData?.totalBalance ?? 0).toLocaleString()}` : `${(userData?.cryptoBalances?.[stakeCurrency] ?? 0).toFixed(6)} ${stakeCurrency}`}
              </span>
              <ChevronDown className="w-3 h-3 text-white/40 group-hover:text-primary transition-colors" />
            </div>
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest leading-none">{stakeCurrency} Akun Anda</span>
          </div>
        </div>
        <button onClick={() => router.push('/topup')} className="w-10 h-10 bg-[#26A69A] rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-95 transition-transform">
          <Wallet className="w-5 h-5 text-white" />
        </button>
      </header>

      <div className="px-4 h-12 flex items-center justify-between bg-[#1C2024] shrink-0 border-b border-white/5">
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

      <main className="flex-1 relative overflow-hidden flex flex-col bg-[#0F1113]">
        <div className="flex-1 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={visibleCandles} margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={true} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'rgba(255,255,255,0.3)'}} minTickGap={30} />
              <YAxis domain={['auto', 'auto']} orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: 'rgba(255,255,255,0.3)'}} />
              <Tooltip content={() => null} />
              <ReferenceLine y={price} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" isFront />
              <Bar dataKey="body" isAnimationActive={false} barSize={zoomLevel > 60 ? 4 : 8}>
                {visibleCandles.map((entry, index) => (
                  <Cell key={`body-${index}`} fill={entry.isUp ? "#26A69A" : "#EF5350"} />
                ))}
              </Bar>
              <Bar dataKey="wick" isAnimationActive={false} barSize={1}>
                {visibleCandles.map((entry, index) => (
                  <Cell key={`wick-${index}`} fill={entry.isUp ? "#26A69A" : "#EF5350"} />
                ))}
              </Bar>
              {entryPrice && visibleCandles.some(c => c.time === visibleCandles[visibleCandles.length-1].time) && (
                <ReferenceLine y={entryPrice} stroke="#FCD535" strokeDasharray="3 3" label={{ position: 'left', value: 'ENTRY', fill: '#FCD535', fontSize: 8, fontWeight: 'bold' }} />
              )}
            </ComposedChart>
          </ResponsiveContainer>

          <div className="absolute right-0 top-0 bottom-0 pointer-events-none flex flex-col justify-center pr-1">
             <div className="bg-white text-black px-2 py-1 rounded-l-md font-black text-[10px] shadow-xl z-30">{currentFormattedPrice}</div>
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 bg-[#1C2024]/80 backdrop-blur p-1 rounded-lg border border-white/5 z-20">
            <button onClick={() => handleZoom('out')} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded active:scale-90 transition-transform"><Minus className="w-4 h-4 text-white/60" /></button>
            <div className="w-px h-4 bg-white/10 self-center" />
            <button onClick={() => handleZoom('in')} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded active:scale-90 transition-transform"><Plus className="w-4 h-4 text-white/60" /></button>
          </div>
        </div>

        <div className="h-8 bg-[#171A1D] border-t border-white/5 px-4 flex items-center justify-between shrink-0">
           <span className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Fixed Time mode</span>
           <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-white/30 uppercase italic">Profit:</span>
              <span className="text-[10px] font-black text-green-500 italic">Yield 90% (Reward ALX)</span>
              <HelpCircle className="w-3 h-3 text-white/10" />
           </div>
        </div>

        <div className="bg-[#171A1D] p-4 space-y-4 pb-8 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#1C2024] rounded-xl p-1 flex items-center justify-between border border-white/5 h-14">
              <button onClick={() => setDuration(Math.max(5, duration - 15))} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Minus className="w-4 h-4 text-white/40" /></button>
              <div className="flex-1 text-center">
                <p className="text-base font-black italic">{duration >= 60 ? `${duration/60} min` : `${duration} s`}</p>
              </div>
              <button onClick={() => setDuration(duration + 15)} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-4 h-4 text-white/40" /></button>
            </div>

            <div className="bg-[#1C2024] rounded-xl p-1 flex items-center justify-between border border-white/5 h-14 relative">
              <button onClick={() => setAmount(prev => Math.max(0, prev - (stakeCurrency === 'IDR' ? 50000 : 0.001)))} className="w-8 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Minus className="w-3 h-3 text-white/40" /></button>
              
              <div className="flex-1 text-center flex flex-col items-center justify-center overflow-hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 text-[8px] font-black italic uppercase leading-none text-primary hover:text-primary/80 transition-colors mb-1">
                      {stakeCurrency} <ChevronDown className="w-2 h-2" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1C2024] border-white/10 text-white rounded-xl">
                    {(['IDR', 'ALX', 'USDT', 'ETH', 'BTC'] as const).map((curr) => (
                      <DropdownMenuItem key={curr} onClick={() => { setStakeCurrency(curr); setAmount(curr === 'IDR' ? 100000 : 0.01); }} className="font-black text-[10px] uppercase italic focus:bg-primary/20">
                        {curr}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-center text-sm font-black italic outline-none border-none p-0 focus:ring-0 appearance-none text-white"
                />
              </div>

              <button onClick={() => setAmount(prev => prev + (stakeCurrency === 'IDR' ? 50000 : 0.001))} className="w-8 h-full flex items-center justify-center hover:bg-white/5 rounded-lg transition-colors"><Plus className="w-3 h-3 text-white/40" /></button>
            </div>
          </div>

          <div className="flex gap-3 h-16">
            <button 
              onClick={() => startTrade('low')}
              disabled={isTrading}
              className={cn(
                "flex-1 rounded-2xl bg-[#EF5350] hover:bg-[#D32F2F] active:scale-95 transition-all flex items-center justify-between px-4 shadow-xl",
                isTrading && "opacity-50 grayscale"
              )}
            >
              <div className="text-left">
                <span className="text-[11px] font-black uppercase italic tracking-tighter block leading-none">Down</span>
                <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Meleset</p>
              </div>
              <TrendingDown className="w-6 h-6" />
            </button>

            <button className="w-20 h-full bg-[#1C2024] rounded-2xl border border-white/5 flex items-center justify-center active:scale-95 transition-transform shadow-inner">
              {isTrading ? (
                <div className="flex flex-col items-center">
                  <span className="text-primary font-black italic text-lg leading-none">{timeLeft}</span>
                  <span className="text-[7px] text-white/20 font-bold uppercase mt-0.5">SEC</span>
                </div>
              ) : <Clock className="w-6 h-6 text-white/40" />}
            </button>

            <button 
              onClick={() => startTrade('high')}
              disabled={isTrading}
              className={cn(
                "flex-1 rounded-2xl bg-[#26A69A] hover:bg-[#00897B] active:scale-95 transition-all flex items-center justify-between px-4 shadow-xl",
                isTrading && "opacity-50 grayscale"
              )}
            >
              <div className="text-left">
                <span className="text-[11px] font-black uppercase italic tracking-tighter block leading-none">Up</span>
                <p className="text-[8px] font-bold text-white/60 uppercase mt-1">Naik</p>
              </div>
              <TrendingUp className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      <footer className="h-16 bg-[#171A1D] border-t border-white/5 flex items-center justify-around shrink-0 px-2 pb-safe">
        <button className="flex flex-col items-center gap-1 group w-full" onClick={() => router.push('/')}>
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic text-primary">Beranda</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full" onClick={() => router.push('/crypto')}>
          <ArrowRightLeft className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Pasar</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full">
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Perdagangan</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full">
          <Trophy className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Futures</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full">
          <HelpCircle className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Aset</span>
        </button>
      </footer>
    </div>
  );
}