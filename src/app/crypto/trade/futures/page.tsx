
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ChevronDown, 
  Menu, 
  CandlestickChart, 
  MoreHorizontal, 
  ArrowRightLeft,
  ChevronUp,
  History,
  Info,
  Zap,
  ArrowUpDown,
  FileText,
  Delete,
  Globe,
  ArrowLeft,
  FileClock,
  Clock,
  TrendingUp,
  TrendingDown,
  Loader2,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, addDoc, updateDoc, increment, collection, serverTimestamp, query, orderBy, limit, deleteDoc, getDocs, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Cell,
  ReferenceLine
} from "recharts";

const MARKUP = 1.02; 
const USDT_IDR_RATE = 15850;
const TRADING_FEE_PERCENT = 0.001; // 0.1% Platform Fee untuk Admin

export default function FuturesPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // APP STATES
  const [activeTopTab, setActiveTopTab] = useState<'USDⓈ-M' | 'COIN-M' | 'Option' | 'Smart M'>('USDⓈ-M');
  const [tradeSide, setTradeType] = useState<'long' | 'short'>('long');
  const [leverage, setLeverage] = useState(20);
  const [amountUsdt, setAmountUsdt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // MARKET DATA
  const [livePrice, setLivePrice] = useState(66413.10);
  const [priceChange, setPriceChange] = useState(-2.98);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [orderBook, setOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });

  // DATABASE DATA
  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const positionsQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "futures_positions"), where("status", "==", "open")) : null), [db, user]);
  const { data: activePositions, loading: loadingPositions } = useCollection(positionsQuery);

  useEffect(() => {
    setMounted(true);
  }, []);

  // REAL-TIME MARKET ENGINE (AME)
  const fetchMarketData = useCallback(async () => {
    try {
      const tickerRes = await fetch(`/api/market/ticker?symbol=BTCUSDT`);
      if (tickerRes.ok) {
        const ticker = await tickerRes.json();
        setLivePrice(parseFloat(ticker.lastPrice) * MARKUP);
        setPriceChange(parseFloat(ticker.priceChangePercent));
      }

      const klineRes = await fetch(`/api/market/klines?symbol=BTCUSDT&interval=15m&limit=40`);
      if (klineRes.ok) {
        const klines = await klineRes.json();
        const formatted = klines.map((k: any) => ({
          time: new Date(k[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          close: parseFloat(k[4]) * MARKUP,
          isUp: parseFloat(k[4]) >= parseFloat(k[1])
        }));
        setCandlestickData(formatted);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // SIMULATED ORDER BOOK DEPTH
  useEffect(() => {
    if (!mounted) return;
    setOrderBook({
      asks: Array.from({ length: 5 }, (_, i) => ({ price: (livePrice + (i * 0.5) + 0.1).toFixed(1), amount: (Math.random() * 2).toFixed(3), width: 20 + Math.random() * 60 })),
      bids: Array.from({ length: 5 }, (_, i) => ({ price: (livePrice - (i * 0.5) - 0.1).toFixed(1), amount: (Math.random() * 2).toFixed(3), width: 20 + Math.random() * 60 }))
    });
  }, [livePrice, mounted]);

  // CALCULATION LOGIC
  const costUsdt = useMemo(() => {
    const amt = parseFloat(amountUsdt) || 0;
    return amt / leverage;
  }, [amountUsdt, leverage]);

  // EXECUTE TRADE (RIIL BALANCES)
  const handleOpenPosition = async () => {
    if (!user || !db || !userData || isProcessing) return;
    const amt = parseFloat(amountUsdt);
    if (isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "Jumlah Tidak Valid" });
      return;
    }

    const requiredMargin = costUsdt;
    const platformFeeUsdt = amt * TRADING_FEE_PERCENT; // Admin Profit
    const totalDeduction = requiredMargin + platformFeeUsdt;

    if ((userData.cryptoBalances?.USDT || 0) < totalDeduction) {
      toast({ 
        variant: "destructive", 
        title: "Saldo Tidak Cukup", 
        description: `Dibutuhkan ${totalDeduction.toFixed(2)} USDT (Margin + Fee).` 
      });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Potong Saldo USDT Nasabah (Margin + Platform Fee)
      await updateDoc(userDocRef!, { "cryptoBalances.USDT": increment(-totalDeduction) });

      // 2. Transfer Fee ke Likuiditas Admin
      const sysRef = doc(db, "system", "liquidity");
      const platformFeeIdr = platformFeeUsdt * USDT_IDR_RATE;
      await updateDoc(sysRef, { 
        totalFiatInjected: increment(platformFeeIdr),
        futuresGrossProfitIdr: increment(platformFeeIdr),
        totalTradingFeesIdr: increment(platformFeeIdr)
      });

      // 3. Buka Posisi di Firestore
      await addDoc(collection(db, "users", user.uid, "futures_positions"), {
        symbol: "BTCUSDT",
        side: tradeSide,
        leverage: leverage,
        entryPrice: livePrice,
        margin: requiredMargin,
        platformFee: platformFeeUsdt,
        size: amt,
        status: "open",
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      // 4. Catat Audit Ledger Global (Untuk Admin)
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `FUTURES-OPEN-${Date.now()}`,
        category: "Futures Entry",
        description: `Open ${tradeSide.toUpperCase()} ${leverage}x BTCUSDT by ${userData.name}. Fee captured: ${platformFeeUsdt.toFixed(4)} USDT.`,
        amountIdr: platformFeeIdr,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      setAmountUsdt("");
      toast({ title: "Posisi Berhasil Dibuka", description: `Margin dikomit & biaya layanan 0.1% telah dibayarkan.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Eksekusi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClosePosition = async (pos: any) => {
    if (!user || !db || !userDocRef) return;
    
    setIsProcessing(true);
    try {
      // Hitung PNL Riil terhadap harga saat ini
      const pnlMultiplier = pos.side === 'long' ? (livePrice - pos.entryPrice) / pos.entryPrice : (pos.entryPrice - livePrice) / pos.entryPrice;
      const realizedPnl = pos.size * pnlMultiplier;
      const finalReturn = pos.margin + realizedPnl;

      // Jika rugi, selisih margin yang hilang tetap di kas Admin
      // Jika untung, kas Admin (Liquidity) akan berkurang untuk membayar profit nasabah
      if (realizedPnl > 0) {
        const sysRef = doc(db, "system", "liquidity");
        await updateDoc(sysRef, { 
          totalFiatInjected: increment(-(realizedPnl * USDT_IDR_RATE)) 
        });
      }

      // Kembalikan Modal + PNL ke Saldo USDT (Hanya jika masih ada sisa setelah rugi)
      await updateDoc(userDocRef, { "cryptoBalances.USDT": increment(Math.max(0, finalReturn)) });
      
      // Update Status Posisi
      await updateDoc(doc(db, "users", user.uid, "futures_positions", pos.id), { 
        status: "closed", 
        exitPrice: livePrice, 
        realizedPnl: realizedPnl,
        closedAt: serverTimestamp() 
      });

      // Audit Log untuk Admin
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `FUTURES-CLOSE-${Date.now()}`,
        category: "Futures Settlement",
        description: `Settled position for ${userData?.name}. Result: ${realizedPnl >= 0 ? 'User Profit' : 'Bank Captured Loss'}. PNL: ${realizedPnl.toFixed(2)} USDT.`,
        amountIdr: Math.abs(realizedPnl * USDT_IDR_RATE),
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      toast({ 
        title: realizedPnl >= 0 ? "Profit Terealisasi" : "Kerugian Ditanggung", 
        description: `${Math.abs(realizedPnl).toFixed(2)} USDT telah diselesaikan.`,
        variant: realizedPnl >= 0 ? "default" : "destructive"
      });
    } catch (e) {
      toast({ variant: "destructive", title: "Settlement Gagal" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F1113] text-white flex flex-col font-body select-none">
      {/* Header Tabs */}
      <header className="px-4 h-14 flex items-center justify-between border-b border-white/5 sticky top-0 bg-[#0F1113] z-50">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar">
          {['USDⓈ-M', 'COIN-M', 'Option', 'Smart M'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab as any)}
              className={cn(
                "text-base font-black transition-all relative shrink-0 italic uppercase",
                activeTopTab === tab ? "text-white after:absolute after:-bottom-[15px] after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-white/40"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="p-1" onClick={() => router.push('/crypto')}><ArrowLeft className="w-6 h-6" /></button>
          <Menu className="w-6 h-6 text-white/60" />
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 flex flex-col gap-4 animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-32">
        {/* Pair Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1 cursor-pointer">
              <h1 className="text-xl font-black tracking-tight uppercase italic">BTCUSDT</h1>
              <Badge variant="outline" className="bg-white/5 text-[8px] font-black h-4 px-1 border-none ml-1 uppercase">Perp</Badge>
              <ChevronDown className="w-4 h-4 text-white/40" />
            </div>
            <span className={cn("text-[11px] font-black italic", priceChange >= 0 ? "text-green-500" : "text-rose-500")}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <CandlestickChart className="w-5 h-5 text-white/60" />
            <div className="relative">
               <MoreHorizontal className="w-5 h-5 text-white/60" />
               <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0F1113]" />
            </div>
          </div>
        </div>

        {/* Leverage & Margin Info */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button className="px-4 py-1.5 bg-white/5 rounded-md text-[11px] font-black uppercase text-white border border-white/5 shadow-sm shrink-0 italic">Cross</button>
            <button className="px-4 py-1.5 bg-white/5 rounded-md text-[11px] font-black uppercase text-white border border-white/5 shadow-sm shrink-0 italic">{leverage}x</button>
            <button className="px-3 py-1.5 bg-white/5 rounded-md text-[11px] font-black uppercase text-white border border-white/5 shadow-sm shrink-0 italic">S</button>
          </div>
          <div className="flex flex-col items-end text-right">
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter leading-tight">Funding / Countdown</p>
            <p className="text-[10px] font-black text-white/80 italic">-0.00762% / 07:55:01</p>
          </div>
        </div>

        {/* Trading Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Input Controls */}
          <div className="col-span-7 space-y-4">
            <div className="bg-white/5 p-0.5 rounded-lg flex relative h-10 overflow-hidden">
              <button onClick={() => setTradeType('long')} className={cn("flex-1 z-10 text-xs font-black transition-all italic uppercase", tradeSide === 'long' ? "text-white" : "text-white/30")}>Beli</button>
              <button onClick={() => setTradeType('short')} className={cn("flex-1 z-10 text-xs font-black transition-all italic uppercase", tradeSide === 'short' ? "text-white" : "text-white/30")}>Jual</button>
              <div className={cn("absolute top-0 bottom-0 w-1/2 transition-all duration-300", tradeSide === 'long' ? "left-0 bg-green-500" : "left-1/2 bg-rose-500")} />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-white/30 uppercase">Tersedia</span>
              <div className="flex items-center gap-1 text-white font-black text-[10px] italic">
                <span>{(userData?.cryptoBalances?.USDT || 0).toFixed(2)} USDT</span>
                <div className="w-4 h-4 rounded bg-primary/10 flex items-center justify-center"><ArrowRightLeft className="w-2.5 h-2.5 text-primary rotate-90" /></div>
              </div>
            </div>

            <div className="bg-white/5 rounded-md p-2.5 flex items-center justify-between border border-white/5 h-11">
              <div className="flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-white/30" /><span className="text-xs font-black italic">Market Order</span></div>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center bg-white/5 rounded-md border border-white/5 overflow-hidden h-11 opacity-50">
                <div className="w-full flex flex-col items-center justify-center">
                  <span className="text-[8px] font-bold text-white/20 uppercase leading-none mt-1">Mark Price</span>
                  <input className="w-full bg-transparent text-center text-xs font-black outline-none text-white mb-1" value={livePrice.toFixed(1)} readOnly />
                </div>
              </div>
            </div>

            <div className="flex items-center bg-white/5 rounded-md border border-white/5 overflow-hidden h-11">
              <button className="px-3 text-white/30 font-bold" onClick={() => setAmountUsdt(prev => (parseFloat(prev) || 0).toString())}>-</button>
              <div className="w-full flex flex-col items-center justify-center">
                <span className="text-[8px] font-bold text-white/20 uppercase leading-none mt-1">Jumlah (USDT)</span>
                <input 
                  type="number"
                  className="w-full bg-transparent text-center text-xs font-black outline-none placeholder:text-white/10 text-white mb-1" 
                  placeholder="0.00"
                  value={amountUsdt}
                  onChange={(e) => setAmountUsdt(e.target.value)}
                />
              </div>
              <button className="px-3 text-white/30 font-bold">+</button>
            </div>

            {/* Slider Leverage */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[10px] font-black italic text-primary">
                <span>Leverage</span>
                <span>{leverage}x</span>
              </div>
              <Slider 
                defaultValue={[leverage]} 
                max={125} 
                step={1} 
                onValueChange={(v) => setLeverage(v[0])}
                className="py-2"
              />
            </div>

            <div className="space-y-1 text-[10px] font-bold text-white/30 pt-2 uppercase italic">
              <div className="flex justify-between items-center"><span>Cost (Margin)</span><span className="text-white">{costUsdt.toFixed(2)} USDT</span></div>
              <div className="flex justify-between items-center"><span>Platform Fee (0.1%)</span><span className="text-primary">{(parseFloat(amountUsdt) * TRADING_FEE_PERCENT || 0).toFixed(4)} USDT</span></div>
            </div>

            <Button 
              disabled={isProcessing || !amountUsdt}
              onClick={handleOpenPosition}
              className={cn("w-full h-12 text-[#0F1113] font-black italic rounded-xl shadow-lg text-base border-none uppercase transition-all active:scale-95", tradeSide === 'long' ? "bg-green-500 hover:bg-green-600" : "bg-rose-500 hover:bg-rose-600")}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : `${tradeSide === 'long' ? 'Buy / Long' : 'Sell / Short'}`}
            </Button>
          </div>

          {/* Right: Order Book Simulation */}
          <div className="col-span-5 flex flex-col pt-1">
            <div className="flex justify-between text-[9px] font-black text-white/30 uppercase tracking-tighter mb-2 italic">
              <span>Harga</span>
              <span className="text-right">Jumlah</span>
            </div>

            <div className="space-y-1 mb-3">
              {orderBook.asks.map((ask, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-rose-500 relative z-10">{ask.price}</span>
                  <span className="text-white relative z-10">{ask.amount}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-rose-500/10" style={{ width: `${ask.width}%` }} />
                </div>
              ))}
            </div>

            <div className="py-2 flex flex-col items-center justify-center border-y border-white/5 my-2">
              <span className={cn("text-xl font-black italic tracking-tighter leading-none", priceChange >= 0 ? "text-green-500" : "text-rose-500")}>
                {livePrice.toFixed(1)}
              </span>
              <span className="text-[9px] font-bold text-white/20 mt-1 uppercase italic tracking-widest">≈ Rp{(livePrice * USDT_IDR_RATE).toLocaleString()}</span>
            </div>

            <div className="space-y-1 mt-1">
              {orderBook.bids.map((bid, i) => (
                <div key={i} className="flex justify-between text-[10px] font-black italic relative h-4 items-center">
                  <span className="text-green-500 relative z-10">{bid.price}</span>
                  <span className="text-white relative z-10">{bid.amount}</span>
                  <div className="absolute right-0 top-0 bottom-0 bg-green-500/10" style={{ width: `${bid.width}%` }} />
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 rounded-xl bg-primary/5 border border-primary/10 text-center">
               <ShieldCheck className="w-4 h-4 text-primary mx-auto mb-1" />
               <p className="text-[7px] font-black uppercase text-primary tracking-widest">AME RIIL PROTOCOL</p>
            </div>
          </div>
        </div>

        {/* Positions Section */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5">
            <div className="flex gap-6 pb-2">
              <button className="text-sm font-black italic relative text-white uppercase">Posisi ({activePositions?.length || 0})<div className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-primary" /></button>
              <button className="text-sm font-black italic text-white/30 uppercase">Open Orders</button>
            </div>
            <FileText className="w-5 h-5 text-white/40 cursor-pointer" />
          </div>
          
          <div className="space-y-4">
            {loadingPositions ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
            ) : activePositions && activePositions.length > 0 ? (
              activePositions.map((pos: any) => {
                const pnlPercent = pos.side === 'long' ? (livePrice - pos.entryPrice) / pos.entryPrice * pos.leverage : (pos.entryPrice - livePrice) / pos.entryPrice * pos.leverage;
                const pnlUsdt = pos.margin * pnlPercent;
                
                return (
                  <Card key={pos.id} className="bg-white/5 border-white/5 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("font-black text-[9px] uppercase px-2 h-5", pos.side === 'long' ? "bg-green-500 text-[#0F1113]" : "bg-rose-500 text-white")}>
                          {pos.side.toUpperCase()} {pos.leverage}x
                        </Badge>
                        <span className="text-sm font-black italic uppercase">BTCUSDT Perpetual</span>
                      </div>
                      <button onClick={() => handleClosePosition(pos)} className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-lg">Close Position</button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] font-bold text-white/30 uppercase italic">Unrealized PNL (USDT)</p>
                        <p className={cn("text-lg font-black italic tracking-tighter", pnlUsdt >= 0 ? "text-green-500" : "text-rose-500")}>
                          {pnlUsdt >= 0 ? '+' : ''}{pnlUsdt.toFixed(2)} ({ (pnlPercent * 100).toFixed(2) }%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-white/30 uppercase italic">Margin</p>
                        <p className="text-sm font-black text-white italic">{pos.margin.toFixed(2)} USDT</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 text-[9px] font-bold text-white/40 uppercase">
                      <div><span>Entry Price</span><p className="text-white font-black mt-0.5">{pos.entryPrice.toLocaleString()}</p></div>
                      <div><span>Mark Price</span><p className="text-white font-black mt-0.5">{livePrice.toLocaleString()}</p></div>
                      <div className="text-right"><span>Liq. Price</span><p className="text-rose-500 font-black mt-0.5">{(pos.entryPrice * (pos.side === 'long' ? (1 - 1/pos.leverage) : (1 + 1/pos.leverage))).toFixed(1)}</p></div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="py-12 text-center flex flex-col items-center justify-center opacity-20 italic">
                 <div className="w-12 h-12 border-2 border-white rounded-full flex items-center justify-center mb-2">
                    <Zap className="w-6 h-6" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Tidak ada posisi aktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Risk Warning */}
        <div className="mt-4 bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-primary/80 leading-relaxed italic uppercase">
            Peringatan: Seluruh perdagangan Futures diproses secara riil terhadap saldo Anda. Admin memungut biaya 0.1% per posisi. Kerugian margin nasabah akan dikonversi menjadi profit bank.
          </p>
        </div>
      </main>
    </div>
  );
}
