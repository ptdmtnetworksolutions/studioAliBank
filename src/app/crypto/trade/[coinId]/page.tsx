
"use client";

import { useParams, useRouter } from "next/navigation";
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
  Smile,
  Gauge,
  CircleAlert,
  Delete,
  Globe,
  ArrowLeft,
  FileClock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, addDoc, updateDoc, increment, collection, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const MARKUP = 1.02; // ALIBANK 2% PROFIT MARGIN
const USDT_IDR_RATE = 15850;

export default function TradePage() {
  const { coinId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [activeTopTab, setActiveTopTab] = useState<'Beli/Jual' | 'Spot' | 'P2P' | 'Alpha'>('Beli/Jual');
  const [tradeType, setTradeType] = useState<'beli' | 'jual' | 'convert'>('beli');
  const [amount, setAmount] = useState("0");
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // MARKET DATA STATES
  const [livePrice, setLivePrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const symbol = (coinId as string).toUpperCase();
  const isAlix = symbol === 'ALX';

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const fetchMarketPrice = useCallback(async () => {
    if (isAlix) {
      setLivePrice(12.24); 
      setIsLoading(false);
      return;
    }

    try {
      const binanceSymbol = symbol === 'USDT' ? 'USDTIDR' : `${symbol}USDT`;
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
      const data = await res.json();
      
      if (data.price) {
        let base = parseFloat(data.price);
        if (binanceSymbol === 'USDTIDR') base = base / USDT_IDR_RATE;
        setLivePrice(base * MARKUP);
      }
      setIsLoading(false);
    } catch (e) {
      console.error("AME Sync Error:", e);
    }
  }, [symbol, isAlix]);

  useEffect(() => {
    fetchMarketPrice();
    const interval = setInterval(fetchMarketPrice, 5000);
    return () => clearInterval(interval);
  }, [fetchMarketPrice]);

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 15) setAmount(amount + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  };

  const executeTrade = async () => {
    if (!user || !db || isProcessing || amount === "0" || !userData) return;
    const numAmount = parseFloat(amount);
    
    setIsProcessing(true);
    try {
      const totalCostIdr = numAmount;
      const cryptoGain = totalCostIdr / (livePrice * USDT_IDR_RATE);

      if (tradeType === 'beli') {
        if ((userData.totalBalance ?? 0) < totalCostIdr) {
          throw new Error("Saldo IDR Anda tidak mencukupi.");
        }

        // 1. Update Saldo User
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          totalBalance: increment(-totalCostIdr),
          [`cryptoBalances.${symbol}`]: increment(cryptoGain)
        });

        // 2. Jika Aset adalah ALX, Update Inventaris Pusat Bank
        if (isAlix) {
          const sysRef = doc(db, "system", "liquidity");
          await updateDoc(sysRef, {
            alixVaultBalance: increment(-cryptoGain),
            totalAlixSoldInternally: increment(cryptoGain),
            totalInternalAumIdr: increment(totalCostIdr)
          });
        }

        // 3. Catat ke Audit Ledger Global (Untuk Admin)
        const globalAuditRef = collection(db, "system", "audit", "global_transactions");
        await addDoc(globalAuditRef, {
          id: `TRADE-BUY-${Date.now()}`,
          category: "Market Trade",
          description: `Buy ${cryptoGain.toFixed(6)} ${symbol} by ${userData.name}`,
          amountIdr: totalCostIdr,
          status: "success",
          timestamp: serverTimestamp(),
          userEmail: user.email
        });

        // 4. Catat Riwayat Pribadi
        await addDoc(collection(db, "users", user.uid, "transactions"), {
          date: new Date().toISOString(),
          description: `Beli ${symbol} (Ali-Premium)`,
          category: "Trading",
          amount: totalCostIdr,
          cryptoAmount: cryptoGain,
          cryptoCurrency: symbol,
          type: "expense",
          status: "success",
          executionPrice: livePrice,
          timestamp: serverTimestamp()
        });

        toast({ title: "Pembelian Berhasil", description: `${cryptoGain.toFixed(8)} ${symbol} telah ditambahkan.` });
      }
      setAmount("0");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Eksekusi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body select-none transition-colors duration-300">
      <header className="px-4 h-14 flex items-center justify-between border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {['Beli/Jual', 'Spot', 'P2P', 'Alpha'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab as any)}
              className={cn(
                "text-base font-black transition-all relative shrink-0 italic uppercase",
                activeTopTab === tab ? "text-foreground after:absolute after:-bottom-[15px] after:left-0 after:right-0 after:h-[3px] after:bg-primary" : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="p-1" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </header>

      {activeTopTab === 'Beli/Jual' ? (
        <main className="flex-1 flex flex-col animate-in fade-in duration-500 overflow-y-auto no-scrollbar">
          <div className="px-6 pt-6 space-y-8 flex-1">
            <div className="flex items-center justify-between">
              <div className="bg-muted/60 p-1 rounded-full flex gap-1">
                {['Beli', 'Jual', 'Convert'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTradeType(type.toLowerCase() as any)}
                    className={cn(
                      "px-6 py-1.5 rounded-full text-xs font-black transition-all",
                      tradeType === type.toLowerCase() ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black italic uppercase">Markup +2% Active</Badge>
                <FileClock className="w-5 h-5 text-muted-foreground cursor-pointer" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-6xl font-black tracking-tighter italic",
                  amount === "0" ? "text-muted-foreground/30" : "text-foreground"
                )}>
                  {parseFloat(amount).toLocaleString('id-ID')}
                </span>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-muted p-1 px-2 rounded-lg transition-colors">
                  <span className="text-xl font-black italic">IDR</span>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-bold">
                <ArrowUpDown className="w-4 h-4 text-primary" />
                <span className="text-sm italic">
                  Estimasi: {isLoading ? "..." : (parseFloat(amount) / (livePrice * USDT_IDR_RATE)).toFixed(8)} {symbol}
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2 shadow-sm", isAlix ? "gold-gradient" : "bg-teal-600")}>
                    {isAlix ? <LogoIcon className="text-white" /> : <span className="text-white font-black text-xs">{symbol[0]}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-black italic">{tradeType === 'beli' ? 'Beli' : 'Jual'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground">{symbol}</span>
                      {!isAlix && <Badge className="bg-primary/10 text-primary text-[7px] font-black h-4 px-1.5 border-none uppercase">Ali-Premium</Badge>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-foreground italic">Harga Satuan</p>
                  <p className="text-xs font-bold text-muted-foreground">Rp{(livePrice * USDT_IDR_RATE).toLocaleString()}</p>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black italic">Metode pembayaran</p>
                    <p className="text-xs font-bold text-muted-foreground">Saldo Dompet AliBank</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground/40 -rotate-90" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-4">
              <Button onClick={() => setAmount("100000")} variant="outline" className="h-12 rounded-xl border-border font-black text-xs bg-muted/30 hover:bg-muted shadow-none italic">Rp100rb</Button>
              <Button onClick={() => setAmount("500000")} variant="outline" className="h-12 rounded-xl border-border font-black text-xs bg-muted/30 hover:bg-muted shadow-none italic">Rp500rb</Button>
              <Button onClick={() => setAmount((userData?.totalBalance ?? 0).toString())} variant="outline" className="h-12 rounded-xl border-border font-black text-xs bg-muted/30 hover:bg-muted shadow-none uppercase italic">Maks</Button>
            </div>
          </div>

          <div className="px-6 pb-6">
            <Button 
              disabled={amount === "0" || isProcessing}
              onClick={executeTrade}
              className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl shadow-primary/20 text-lg tracking-widest"
            >
              {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : `EKSEKUSI ${tradeType.toUpperCase()} ${symbol}`}
            </Button>
          </div>

          <div className="bg-background border-t border-border grid grid-cols-3 gap-y-1 pb-safe pt-4 animate-in slide-in-from-bottom-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">{n}</button>
            ))}
            <button onClick={() => handleKeyPress(",")} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 transition-colors">
              <Delete className="w-7 h-7 text-foreground" />
            </button>
          </div>
        </main>
      ) : (
        <div className="flex-1 flex items-center justify-center opacity-30 italic font-black uppercase tracking-widest">
          Coming Soon: Advanced {activeTopTab} Terminal
        </div>
      )}
    </div>
  );
}
