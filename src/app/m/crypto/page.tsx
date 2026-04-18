
"use client";

import { useRouter } from "next/navigation";
import { 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  ArrowUpRight,
  Zap,
  TrendingUp,
  LayoutGrid,
  Activity,
  Loader2,
  Trophy,
  TrendingDown,
  ShieldCheck,
  Wifi,
  ArrowLeft,
  History,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import Image from "next/image";
import { AlphaMarketView } from "@/components/crypto/AlphaMarketView";

const MARKUP = 1.02;
const USDT_IDR_RATE = 15850;

const getIconUrl = (symbol: string) => {
  const s = symbol.toLowerCase();
  if (s === 'alx') return null;
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${s}.png`;
};

const GLOBAL_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "DAIUSDT", "BCHUSDT", "AVAXUSDT", "UNIUSDT", "ATOMUSDT", "XLMUSDT", "XMRUSDT",
  "ETCUSDT", "ICPUSDT", "FILUSDT", "LDOUSDT", "APTUSDT", "HBARUSDT", "NEARUSDT", "ARBUSDT", "VETUSDT", "OPUSDT",
  "GRTUSDT", "RNDRUSDT", "MKRUSDT", "STXUSDT", "INJUSDT", "THETAUSDT", "FTMUSDT", "ALGOUSDT", "EGLDUSDT", "TIAUSDT",
  "FLOWUSDT", "SEIUSDT", "DYDXUSDT", "MANAUSDT", "SANDUSDT", "IMXUSDT", "KASUSDT"
];

export default function MobileMarketPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Pasar");
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      router.replace('/crypto');
    }
  }, [router]);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(GLOBAL_SYMBOLS))}`);
      const data = await res.json();
      
      if (!Array.isArray(data)) return;

      const formatted = data.map(item => {
        let symbol = item.symbol.replace("USDT", "");
        let price = parseFloat(item.lastPrice) * MARKUP;

        return {
          symbol: symbol,
          price: price,
          change: parseFloat(item.priceChangePercent) || 0,
          isUp: (parseFloat(item.priceChangePercent) || 0) >= 0,
          icon: getIconUrl(symbol)
        };
      });

      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxData = { symbol: "ALX", price: alxPrice, change: 1.14, isUp: true, isNative: true, icon: null };

      setMarketData([alxData, ...formatted]);
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    if (mounted) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 15000);
      return () => clearInterval(interval);
    }
  }, [mounted, fetchMarketData]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col font-body">
      <header className="px-4 h-16 sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 px-4 flex justify-center">
          <div className="flex bg-muted/60 p-1 rounded-lg">
            {["Pasar", "Alpha"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-1.5 text-[10px] font-black uppercase italic rounded-md transition-all",
                  activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded-full">
           <Search className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      <main className="flex-1 px-4 pt-4 space-y-6 overflow-y-auto no-scrollbar">
        {activeTab === "Pasar" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
               <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aset Global (48)</h3>
               {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black">Connecting to Mainnet...</p>
              </div>
            ) : marketData.map((coin) => (
              <div key={coin.symbol} className="flex items-center justify-between group active:opacity-70" onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm overflow-hidden", coin.isNative ? "gold-gradient" : "bg-muted")}>
                    {coin.isNative ? <LogoIcon className="text-white p-2" /> : <img src={coin.icon || `https://placehold.co/100x100?text=${coin.symbol}`} className="object-cover w-full h-full" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                       <span className="text-sm font-black italic text-foreground uppercase">{coin.symbol}</span>
                       {coin.isNative && <Badge className="bg-primary/20 text-primary text-[6px] h-3 px-1 border-none">V3</Badge>}
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Real-Time Sync</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black italic text-slate-900">${coin.price.toFixed(coin.price < 1 ? 4 : 2)}</p>
                  <p className={cn("text-[9px] font-black italic", coin.isUp ? "text-green-500" : "text-rose-500")}>
                    {coin.isUp ? '+' : ''}{coin.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "Alpha" && <AlphaMarketView marketCoins={marketData} />}
      </main>
    </div>
  );
}
