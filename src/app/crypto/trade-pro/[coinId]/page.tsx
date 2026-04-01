
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
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  Cell,
  ReferenceLine,
  ComposedChart
} from "recharts";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

const DURATIONS = [
  { label: "5s", value: 5 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "5m", value: 300 },
  { label: "30m", value: 1800 },
  { label: "1j", value: 3600 },
  { label: "1h", value: 86400 },
  { label: "1mgu", value: 604800 },
];

const ALX_PRICE_IDR = 194004; // Harga jangkar AliBank V3

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
  const [amount, setAmount] = useState("100000");
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
    // Init candles
    const initial = Array.from({ length: 20 }, (_, i) => generateCandle(i, price));
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
      candleHeight: Math.abs(close - open),
      candleBottom: Math.min(open, close)
    };
  }

  // Real-time Tick Price Simulation
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const move = Math.random() * 0.1 - 0.05;
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
            candleHeight: Math.abs(next - last.open),
            candleBottom: Math.min(last.open, next)
          };
          
          if (Date.now() % 10000 < 1000) {
            return [...prevCandles.slice(1), generateCandle(last.time + 1, next)];
          }
          return [...prevCandles.slice(0, -1), updatedLast];
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Trading Countdown Logic
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
    
    const betAmount = parseFloat(amount);
    if (isNaN(betAmount) || betAmount <= 0) return;
    
    if (userData.totalBalance < betAmount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Isi saldo IDR Anda untuk mulai bertransaksi Pro." });
      return;
    }

    // 1. Eksekusi Pengurangan Saldo Riil Nasabah
    updateDoc(userDocRef, {
      totalBalance: increment(-betAmount)
    });

    // 2. TAMPUNG DANA KE KAS NEGARA ALIBANK (Revenue Capture)
    const liquidityRef = doc(db, "system", "liquidity");
    updateDoc(liquidityRef, {
      totalFiatInjected: increment(betAmount),
      tradeXGrossVolumeIdr: increment(betAmount)
    });

    // 3. Catat di Audit Log Global sebagai "Aktivitas Perdagangan"
    addDoc(collection(db, "system", "audit", "global_transactions"), {
      id: `TRADEX-${Date.now()}`,
      category: "Trade-X Investment",
      amountIdr: betAmount,
      status: "success",
      timestamp: serverTimestamp(),
      description: `Nasabah ${userData.name} membuka posisi ${type.toUpperCase()} pada ${symbol}.`
    });

    setPrediction(type);
    setEntryPrice(price);
    setIsTrading(true);
    setTimeLeft(duration);
    
    toast({ title: "Posisi Dibuka", description: `Investasi Rp ${betAmount.toLocaleString()} pada ${type.toUpperCase()}` });
  };

  const finishTrade = async () => {
    if (!entryPrice || !userDocRef || !user || !db) return;

    const isWin = prediction === 'high' ? price > entryPrice : price < entryPrice;
    const betAmount = parseFloat(amount);
    const profitIdr = isWin ? betAmount * 0.9 : 0; // 90% Yield
    const totalReturnIdr = isWin ? betAmount + profitIdr : 0;
    
    // Konversi Hadiah ke ALX (Real-Time Settlement)
    const rewardInAlx = isWin ? totalReturnIdr / ALX_PRICE_IDR : 0;

    if (isWin) {
      // Eksekusi Penambahan Saldo ALX (Kemenangan)
      updateDoc(userDocRef, {
        "cryptoBalances.ALX": increment(rewardInAlx)
      });

      // Notifikasi Kemenangan
      addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Trade-X Profit!",
        message: `Selamat! Anda memenangkan ${rewardInAlx.toFixed(8)} ALX dari hasil prediksi Trade-X Pro.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      // Update Audit Log: Pembayaran Hadiah (Minting Logic Simulation)
      addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `WIN-${Date.now()}`,
        category: "Trade-X Payout",
        cryptoAmount: rewardInAlx,
        cryptoCurrency: "ALX",
        status: "success",
        timestamp: serverTimestamp(),
        description: `Pembayaran hadiah ALX kepada nasabah ${userData?.name} atas kemenangan Trade-X.`
      });
    } else {
      // LOG KEKALAHAN: Dana tetap di bank (Sudah ditarik di awal)
      addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `LOSS-${Date.now()}`,
        category: "Trade-X Bank Profit",
        amountIdr: betAmount,
        status: "success",
        timestamp: serverTimestamp(),
        description: `Nasabah meleset. Investasi Rp ${betAmount.toLocaleString()} resmi menjadi laba operasional AliBank.`
      });
    }

    // Catat Riwayat Transaksi Nasabah
    addDoc(collection(db, "users", user.uid, "transactions"), {
      date: new Date().toISOString(),
      description: `Trade-X Pro: ${prediction?.toUpperCase()} ${symbol}`,
      category: "Trade-X Pro",
      amount: betAmount,
      rewardAlx: rewardInAlx,
      status: isWin ? "WIN" : "LOSS",
      type: "expense",
      timestamp: serverTimestamp()
    });

    setTradeHistory(prev => [{
      id: Date.now(),
      type: prediction,
      entry: entryPrice,
      exit: price,
      amount: betAmount,
      rewardAlx: rewardInAlx,
      status: isWin ? 'WIN' : 'LOSS',
      time: new Date().toLocaleTimeString()
    }, ...prev]);

    setIsTrading(false);
    setPrediction(null);
    setEntryPrice(null);

    toast({
      variant: isWin ? "default" : "destructive",
      title: isWin ? "TRANSAKSI PROFIT!" : "PREDIKSI MELESET",
      description: isWin 
        ? `Anda mendapatkan ${rewardInAlx.toFixed(8)} ALX!` 
        : `Investasi Rp ${betAmount.toLocaleString()} menjadi profit bank.`
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white flex flex-col font-body overflow-hidden">
      <header className="px-4 h-14 flex items-center justify-between border-b border-white/5 bg-[#161A1E] shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gold-gradient rounded flex items-center justify-center p-1">
              <LogoIcon className="text-white" />
            </div>
            <h1 className="text-sm font-black italic tracking-tighter uppercase">{symbol}/USDT <span className="text-primary">PRO</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right mr-2 hidden xs:block">
            <p className="text-[8px] font-bold text-white/40 uppercase">Saldo Riil</p>
            <p className="text-[10px] font-black text-primary italic">Rp {(userData?.totalBalance ?? 0).toLocaleString()}</p>
          </div>
          <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] h-5 uppercase">Yield 90%</Badge>
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-1 relative border-r border-white/5 flex flex-col min-h-0">
          <div className="p-4 flex justify-between items-center bg-[#161A1E]/50 shrink-0">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Tick Price</p>
              <h2 className={cn(
                "text-2xl font-black italic tracking-tighter transition-colors",
                entryPrice ? (price >= entryPrice ? "text-green-500" : "text-rose-500") : "text-primary"
              )}>
                {price.toFixed(4)}
              </h2>
            </div>
            {isTrading && (
              <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 animate-in zoom-in">
                <Timer className="w-4 h-4 text-primary animate-spin" />
                <span className="text-lg font-black italic text-primary">{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full pt-4 min-h-[200px] lg:min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candles} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#161A1E] border border-white/10 p-2 rounded-lg text-[8px] font-bold uppercase">
                          <p className="text-white/40">Open: <span className="text-white">{data.open.toFixed(4)}</span></p>
                          <p className="text-white/40">Close: <span className="text-white">{data.close.toFixed(4)}</span></p>
                          <p className="text-white/40">High: <span className="text-white">{data.high.toFixed(4)}</span></p>
                          <p className="text-white/40">Low: <span className="text-white">{data.low.toFixed(4)}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {entryPrice && (
                  <ReferenceLine y={entryPrice} stroke="#FCD535" strokeDasharray="3 3" label={{ value: 'ENTRY', position: 'left', fill: '#FCD535', fontSize: 8, fontWeight: 'bold' }} />
                )}
                <Bar dataKey="high" fill="none" isAnimationActive={false}>
                  {candles.map((entry, index) => (
                    <Cell key={`wick-${index}`} fill={entry.isUp ? "#22c55e" : "#f43f5e"} />
                  ))}
                </Bar>
                <Bar dataKey="candleHeight" isAnimationActive={false}>
                  {candles.map((entry, index) => (
                    <Cell key={`body-${index}`} fill={entry.isUp ? "#22c55e" : "#f43f5e"} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="h-32 lg:h-48 border-t border-white/5 bg-[#161A1E]/30 overflow-y-auto no-scrollbar p-4 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/40">
                <History className="w-3.5 h-3.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">Trade Logs</span>
              </div>
              <Badge variant="outline" className="text-[7px] border-white/10 text-white/40 uppercase">Auto-Settlement Active</Badge>
            </div>
            <div className="space-y-2">
              {tradeHistory.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", log.type === 'high' ? "bg-green-500/20 text-green-500" : "bg-rose-500/20 text-rose-500")}>
                      {log.type === 'high' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black italic uppercase">Rp {log.amount.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-white/30">{log.time} • Entry: {log.entry.toFixed(4)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {log.status === 'WIN' ? (
                        <>
                          <p className="text-[10px] font-black text-green-500 italic">+{log.rewardAlx.toFixed(6)} ALX</p>
                          <Trophy className="w-3 h-3 text-primary" />
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black text-rose-500 italic">LOST</p>
                          <Skull className="w-3 h-3 text-rose-500" />
                        </>
                      )}
                    </div>
                    <Badge className={cn("text-[7px] font-black h-4 px-1 border-none mt-1", log.status === 'WIN' ? "bg-green-500" : "bg-rose-500")}>{log.status}</Badge>
                  </div>
                </div>
              ))}
              {tradeHistory.length === 0 && (
                <div className="py-6 text-center opacity-20">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-[8px] font-black uppercase tracking-widest">Waiting for orders...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 bg-[#161A1E] p-6 space-y-6 shadow-2xl overflow-y-auto no-scrollbar pb-32 lg:pb-6 shrink-0">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Investasi (IDR)</label>
                <div className="flex items-center gap-1 text-[9px] font-bold text-primary italic">
                  <Wallet className="w-2.5 h-2.5" />
                  <span>Rp {(userData?.totalBalance ?? 0).toLocaleString()}</span>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary italic">Rp</span>
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-xl font-black italic text-lg focus:ring-primary/20" 
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["50k", "100k", "500k", "1M"].map(v => (
                  <button 
                    key={v} 
                    onClick={() => setAmount((parseInt(v.replace('k', '000').replace('M', '1000000'))).toString())}
                    className="py-1.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase hover:bg-white/10 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Durasi Kontrak</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map(d => (
                  <button 
                    key={d.label} 
                    onClick={() => setDuration(d.value)}
                    className={cn(
                      "py-3 rounded-xl border-2 font-black text-[10px] transition-all uppercase italic",
                      duration === d.value ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(252,213,53,0.2)]" : "border-white/5 bg-white/5 text-white/40"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                <span className="text-white/40">Potensi Profit (90%)</span>
                <span className="text-green-500">+ Rp {(parseFloat(amount) * 0.9).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                <div>
                  <p className="text-[8px] text-white/20 uppercase font-black">Estimasi Reward</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-lg font-black italic text-primary">
                      {((parseFloat(amount) * 1.9) / ALX_PRICE_IDR).toFixed(6)}
                    </p>
                    <span className="text-[10px] font-black text-primary uppercase">ALX</span>
                  </div>
                </div>
                <Coins className="w-6 h-6 text-primary/20" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <Button 
              onClick={() => startTrade('high')}
              disabled={isTrading || !amount}
              className="w-full h-20 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition-all active:scale-95 group"
            >
              <TrendingUp className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform" />
              <span className="text-lg font-black uppercase italic tracking-tighter">HIGH (NAIK)</span>
            </Button>

            <Button 
              onClick={() => startTrade('low')}
              disabled={isTrading || !amount}
              className="w-full h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(244,63,94,0.3)] transition-all active:scale-95 group"
            >
              <TrendingDown className="w-6 h-6 group-hover:translate-y-[2px] transition-transform" />
              <span className="text-lg font-black uppercase italic tracking-tighter">LOW (TURUN)</span>
            </Button>
          </div>

          <div className="pt-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">Institutional Node V3.2</span>
            </div>
            <p className="text-[8px] text-white/30 italic uppercase leading-relaxed px-2">
              Investasi derivatif berisiko tinggi. Setiap kekalahan akan memotong saldo IDR Anda, dan kemenangan akan dibayarkan langsung dalam aset Kedaulatan ALX.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
