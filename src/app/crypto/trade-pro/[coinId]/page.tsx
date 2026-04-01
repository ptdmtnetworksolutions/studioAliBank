
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Timer, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  History,
  Activity,
  ChevronDown,
  Info,
  ChevronUp,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  ReferenceLine
} from "recharts";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

export default function TradeProPage() {
  const { coinId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  const symbol = (coinId as string).toUpperCase();
  const isAlix = symbol === 'ALX';

  // Game States
  const [price, setPrice] = useState(isAlix ? 12.24 : 66450.00);
  const [chartData, setChartData] = useState<any[]>([]);
  const [amount, setAmount] = useState("100000");
  const [duration, setDuration] = useState("1m");
  const [isTrading, setIsProcessing] = useState(false);
  const [prediction, setPrediction] = useState<'high' | 'low' | null>(null);
  const [entryPrice, setEntryPrice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    // Init chart
    const initial = Array.from({ length: 30 }, (_, i) => ({
      time: i,
      val: price + (Math.random() * 2 - 1)
    }));
    setChartData(initial);
  }, [price]);

  // Real-time Tick Price Simulation
  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      const move = Math.random() * 0.4 - 0.2;
      setPrice(prev => prev + move);
      setChartData(prev => {
        const next = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, val: price + move }];
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mounted, price]);

  // Trading Countdown Logic
  useEffect(() => {
    if (isTrading && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTrading && timeLeft === 0) {
      finishTrade();
    }
  }, [isTrading, timeLeft]);

  const startTrade = (type: 'high' | 'low') => {
    if (isTrading) return;
    setPrediction(type);
    setEntryPrice(price);
    setIsProcessing(true);
    setTimeLeft(60);
    toast({ title: "Posisi Dibuka", description: `Prediksi ${type.toUpperCase()} pada harga ${price.toFixed(4)}` });
  };

  const finishTrade = () => {
    const isWin = prediction === 'high' ? price > entryPrice! : price < entryPrice!;
    const profit = isWin ? parseFloat(amount) * 0.9 : -parseFloat(amount);
    
    setTradeHistory(prev => [{
      id: Date.now(),
      type: prediction,
      entry: entryPrice,
      exit: price,
      amount: parseFloat(amount),
      profit: profit,
      status: isWin ? 'WIN' : 'LOSS',
      time: new Date().toLocaleTimeString()
    }, ...prev]);

    setIsProcessing(false);
    setPrediction(null);
    setEntryPrice(null);

    toast({
      variant: isWin ? "default" : "destructive",
      title: isWin ? "TRANSAKSI PROFIT!" : "PREDIKSI MELESET",
      description: isWin ? `Selamat! Anda mendapatkan Rp ${profit.toLocaleString()}` : `Anda kehilangan Rp ${Math.abs(profit).toLocaleString()}`
    });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0B0E11] text-white flex flex-col font-body overflow-hidden">
      {/* Header Terminal */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-white/5 bg-[#161A1E]">
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
          <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] h-5 uppercase">Yield 90%</Badge>
          <Activity className="w-4 h-4 text-green-500 animate-pulse" />
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left: Chart Area */}
        <div className="flex-1 relative border-r border-white/5 flex flex-col">
          <div className="p-4 flex justify-between items-center bg-[#161A1E]/50">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live Price</p>
              <h2 className={cn(
                "text-2xl font-black italic tracking-tighter transition-colors",
                entryPrice ? (price >= entryPrice ? "text-green-500" : "text-rose-500") : "text-primary"
              )}>
                {price.toFixed(4)}
              </h2>
            </div>
            {isTrading && (
              <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                <Timer className="w-4 h-4 text-primary animate-spin" />
                <span className="text-lg font-black italic text-primary">{timeLeft}s</span>
              </div>
            )}
          </div>

          <div className="flex-1 w-full min-h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#161A1E', border: 'none', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ color: '#FCD535' }}
                />
                {entryPrice && (
                  <ReferenceLine y={entryPrice} stroke="#FCD535" strokeDasharray="3 3" label={{ value: 'ENTRY', position: 'left', fill: '#FCD535', fontSize: 8, fontWeight: 'bold' }} />
                )}
                <Line 
                  type="monotone" 
                  dataKey="val" 
                  stroke={isTrading ? (price >= entryPrice! ? "#22c55e" : "#f43f5e") : "#FCD535"} 
                  strokeWidth={3} 
                  dot={false} 
                  animationDuration={300}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Trade History Terminal */}
          <div className="h-40 border-t border-white/5 bg-[#161A1E]/30 overflow-y-auto no-scrollbar p-4">
            <div className="flex items-center gap-2 mb-4 text-white/40">
              <History className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Trade Logs</span>
            </div>
            <div className="space-y-2">
              {tradeHistory.map(log => (
                <div key={log.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center", log.type === 'high' ? "bg-green-500/20 text-green-500" : "bg-rose-500/20 text-rose-500")}>
                      {log.type === 'high' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black italic uppercase">Rp {log.amount.toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-white/30">{log.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-black italic", log.profit > 0 ? "text-green-500" : "text-rose-500")}>
                      {log.profit > 0 ? '+' : ''}Rp {log.profit.toLocaleString()}
                    </p>
                    <Badge className={cn("text-[7px] font-black h-4 px-1 border-none", log.status === 'WIN' ? "bg-green-500" : "bg-rose-500")}>{log.status}</Badge>
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

        {/* Right: Control Panel */}
        <div className="w-full lg:w-80 bg-[#161A1E] p-6 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Investasi (IDR)</label>
                <Zap className="w-3 h-3 text-primary" />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 pl-12 bg-white/5 border-white/10 rounded-xl font-black italic text-lg focus:ring-primary/20" 
                />
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["50k", "100k", "500k", "1M"].map(v => (
                  <button key={v} className="py-1.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase hover:bg-white/10 transition-colors">{v}</button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">Durasi Kontrak</label>
              <div className="grid grid-cols-3 gap-2">
                {["1m", "2m", "5m"].map(d => (
                  <button 
                    key={d} 
                    onClick={() => setDuration(d)}
                    className={cn(
                      "py-3 rounded-xl border-2 font-black text-xs transition-all uppercase italic",
                      duration === d ? "border-primary bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-white/40"
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                <span className="text-white/40">Potensi Profit</span>
                <span className="text-green-500">+90%</span>
              </div>
              <div className="flex justify-between items-end">
                <p className="text-[9px] text-white/20 uppercase font-black">Estimasi Terima</p>
                <p className="text-xl font-black italic text-primary">Rp {(parseFloat(amount) * 1.9).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button 
              onClick={() => startTrade('high')}
              disabled={isTrading}
              className="w-full h-20 bg-green-500 hover:bg-green-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(34,197,94,0.3)] transition-all active:scale-95"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="text-lg font-black uppercase italic tracking-tighter">HIGH (NAIK)</span>
            </Button>

            <Button 
              onClick={() => startTrade('low')}
              disabled={isTrading}
              className="w-full h-20 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl flex flex-col items-center justify-center gap-1 shadow-[0_10px_30px_rgba(244,63,94,0.3)] transition-all active:scale-95"
            >
              <TrendingDown className="w-6 h-6" />
              <span className="text-lg font-black uppercase italic tracking-tighter">LOW (TURUN)</span>
            </Button>
          </div>

          <div className="pt-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-white/20">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[8px] font-black uppercase tracking-[0.3em]">AliBank V3 Secure Node</span>
            </div>
            <p className="text-[8px] text-white/30 italic uppercase leading-relaxed px-4">
              Perdagangan derivatif melibatkan risiko tinggi. Pastikan Anda memahami mekanisme Trade-X Pro sebelum mengeksekusi dana besar.
            </p>
          </div>
        </div>
      </main>

      {/* Floating AI Insight Mobile */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button className="w-12 h-12 gold-gradient rounded-full shadow-2xl flex items-center justify-center text-primary-foreground animate-bounce">
          <BrainCircuit className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
