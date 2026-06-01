
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

// Menggunakan coincap assets untuk dukungan koin modern (NEAR, SHIB, ARB)
const getIconUrl = (symbol: string) => {
  const s = symbol.toLowerCase();
  if (s === 'alx') return null;
  return `https://assets.coincap.io/assets/icons/${s}@2x.png`;
};

// DAFTAR 20 KOIN PRIORITAS UNTUK STABILITAS MOBILE
const GLOBAL_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
  "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT",
  "MATICUSDT", "LTCUSDT", "SHIBUSDT", "AVAXUSDT", "UNIUSDT", 
  "ATOMUSDT", "XLMUSDT", "XMRUSDT", "NEARUSDT", "ARBUSDT"
];

const FALLBACK_COINS = [
  { symbol: "BTC", price: 66450.00, change: -0.45, isUp: false, icon: getIconUrl("BTC") },
  { symbol: "ETH", price: 2420.00, change: 3.73, isUp: true, icon: getIconUrl("ETH") },
  { symbol: "BNB", price: 575.20, change: -1.20, isUp: false, icon: getIconUrl("BNB") },
  { symbol: "SOL", price: 145.50, change: 2.50, isUp: true, icon: getIconUrl("SOL") },
  { symbol: "XRP", price: 0.52, change: 0.85, isUp: true, icon: getIconUrl("XRP") },
  { symbol: "ADA", price: 0.45, change: -1.10, isUp: false, icon: getIconUrl("ADA") },
  { symbol: "DOGE", price: 0.14, change: 4.20, isUp: true, icon: getIconUrl("DOGE") },
  { symbol: "TRX", price: 0.12, change: 0.30, isUp: true, icon: getIconUrl("TRX") },
  { symbol: "DOT", price: 6.50, change: -2.40, isUp: false, icon: getIconUrl("DOT") },
  { symbol: "LINK", price: 15.20, change: 1.80, isUp: true, icon: getIconUrl("LINK") },
  { symbol: "MATIC", price: 0.68, change: -0.95, isUp: false, icon: getIconUrl("MATIC") },
  { symbol: "LTC", price: 82.40, change: 1.15, isUp: true, icon: getIconUrl("LTC") },
  { symbol: "SHIB", price: 0.000022, change: 5.40, isUp: true, icon: getIconUrl("SHIB") },
  { symbol: "AVAX", price: 34.80, change: -1.50, isUp: false, icon: getIconUrl("AVAX") },
  { symbol: "UNI", price: 7.20, change: 0.90, isUp: true, icon: getIconUrl("UNI") },
  { symbol: "ATOM", price: 8.40, change: -2.10, isUp: false, icon: getIconUrl("ATOM") },
  { symbol: "XLM", price: 0.11, change: 0.25, isUp: true, icon: getIconUrl("XLM") },
  { symbol: "XMR", price: 172.50, change: 0.60, isUp: true, icon: getIconUrl("XMR") },
  { symbol: "NEAR", price: 5.80, change: 3.10, isUp: true, icon: getIconUrl("NEAR") },
  { symbol: "ARB", price: 0.95, change: -1.80, isUp: false, icon: getIconUrl("ARB") }
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
    const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
    const alxData = { symbol: "ALX", price: alxPrice, change: 1.14, isUp: true, isNative: true, icon: null };

    try {
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(GLOBAL_SYMBOLS))}`);
      const data = await res.json();
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from market node");
      }

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

      setMarketData([alxData, ...formatted]);
    } catch (e) {
      console.warn("Market sync failed, using fallback database:", e);
      setMarketData([alxData, ...FALLBACK_COINS]);
    } finally {
      setIsLoading(false);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    if (mounted) {
      fetchMarketData();
      const interval = setInterval(fetchMarketData, 20000);
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
               <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Aset Global</h3>
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
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm relative overflow-hidden", coin.isNative ? "gold-gradient" : "bg-muted")}>
                    {coin.isNative ? (
                      <LogoIcon className="text-white p-2" />
                    ) : (
                      <>
                        <img 
                          src={coin.icon || ""} 
                          className="object-cover w-full h-full" 
                          alt={coin.symbol} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const fallback = (e.target as HTMLImageElement).nextElementSibling;
                            if (fallback) fallback.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden absolute inset-0 flex items-center justify-center bg-muted rounded-lg font-black text-[10px] text-slate-400">
                          {coin.symbol[0]}
                        </div>
                      </>
                    )}
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
                  <p className="text-sm font-black italic text-foreground">${coin.price.toFixed(coin.price < 1 ? 4 : 2)}</p>
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
