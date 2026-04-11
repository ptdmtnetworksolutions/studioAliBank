
"use client";

import { useRouter } from "next/navigation";
import { 
  Search, 
  MoreHorizontal, 
  ChevronRight, 
  ArrowUpRight,
  Info,
  Sparkles,
  Zap,
  TrendingUp,
  LayoutGrid,
  Star,
  Activity,
  BarChart3,
  Flame,
  Loader2,
  Trophy,
  User as UserIcon,
  ArrowUpDown,
  TrendingDown,
  ShieldCheck,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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

const FALLBACK_COINS = [
  { symbol: "ALX", price: 12.24, change: 1.14, isUp: true, isNative: true, icon: null },
  { symbol: "BTC", price: 66262.29, change: -3.76, isUp: false, icon: getIconUrl("BTC") },
  { symbol: "ETH", price: 1987.12, change: -3.98, isUp: false, icon: getIconUrl("ETH") },
  { symbol: "SOL", price: 82.63, change: -4.69, isUp: false, icon: getIconUrl("SOL") },
  { symbol: "BNB", price: 582.41, change: -2.14, isUp: false, icon: getIconUrl("BNB") },
  { symbol: "USDT", price: 1.00, change: 0.01, isUp: true, icon: getIconUrl("USDT") },
];

export default function CryptoMarketPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Pasar");
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [marketData, setMarketData] = useState<any[]>(FALLBACK_COINS);
  const [isLoading, setIsLoading] = useState(true);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchMarketData = useCallback(async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", 
        "ADAUSDT", "DOGEUSDT", "TRXUSDT", "DOTUSDT", "LINKUSDT", 
        "LTCUSDT", "BCHUSDT", "SHIBUSDT", "AVAXUSDT", "NEARUSDT", 
        "ATOMUSDT", "PEPEUSDT", "FILUSDT", "LDOUSDT", "APTUSDT", 
        "ARBUSDT", "RNDRUSDT", "OPUSDT", "WLDUSDT", "POLUSDT", "USDTIDR"
      ];
      
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
      
      if (!res.ok) throw new Error('Failed to fetch from proxy node');
      
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!Array.isArray(data)) return;

      const formatted = data.map(item => {
        let symbol = item.symbol;
        if (symbol.endsWith("USDT")) {
          symbol = symbol.replace("USDT", "");
        } else if (symbol.endsWith("IDR")) {
          symbol = symbol.replace("IDR", "");
        }
        
        if (symbol === "") symbol = "USDT";

        let price = parseFloat(item.lastPrice);
        if (item.symbol === "USDTIDR") {
          price = price / USDT_IDR_RATE;
        }
        
        price = price * MARKUP;

        return {
          symbol: symbol,
          price: price,
          change: parseFloat(item.priceChangePercent) || 0,
          isUp: (parseFloat(item.priceChangePercent) || 0) >= 0,
          volume: parseFloat(item.quoteVolume) || 0,
          icon: getIconUrl(symbol)
        };
      });

      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxData = {
        symbol: "ALX",
        price: alxPrice,
        change: 1.14 + (Math.random() * 0.05),
        isUp: true,
        isNative: true,
        icon: null
      };

      const sorted = [alxData, ...formatted.filter(c => c.symbol !== "USDT"), formatted.find(c => c.symbol === "USDT")].filter(Boolean);
      setMarketData(sorted);
    } catch (e) {
      console.warn("Market Sync failed, maintaining previous state:", e);
    } finally {
      setIsLoading(false);
    }
  }, [globalLiquidity]);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  useEffect(() => {
    if (!mounted) return;
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(coin => {
        const moveFactor = coin.symbol === "ALX" ? 0.0001 : 0.0003;
        const move = (Math.random() * moveFactor * 2 - moveFactor); 
        const newPrice = coin.price * (1 + move);
        
        return {
          ...coin,
          price: newPrice,
          change: (coin.change ?? 0) + (Math.random() * 0.02 - 0.01)
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col font-body transition-colors duration-300">
      <header className="px-4 pt-4 pb-2 sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              placeholder="Cari Coin/Pasangan/Derivatif"
              className="w-full h-10 pl-10 pr-4 bg-muted border-none rounded-md text-sm font-medium placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <MoreHorizontal className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-border px-1">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {["Favorit", "Pasar", "Alpha", "Grow", "Data"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 text-sm font-black transition-all relative shrink-0 italic uppercase",
                  activeTab === tab ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {activeTab === "Alpha" ? (
          <AlphaMarketView marketCoins={marketData} />
        ) : activeTab === "Pasar" && (
          <div className="animate-in slide-in-from-right-4 duration-500 space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-base font-black text-foreground italic uppercase">Semua Kripto</h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase italic animate-pulse">
                <Activity className="w-3 h-3" /> Live Node
              </div>
            </div>

            <div className="grid grid-cols-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
              <span>Nama</span>
              <span className="text-right">Harga Premium</span>
              <span className="text-right">24j %</span>
            </div>

            <div className="space-y-6">
              {isLoading && marketData.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi...</p>
                </div>
              ) : marketData.map((coin) => (
                <div 
                  key={coin.symbol} 
                  className="grid grid-cols-3 items-center group cursor-pointer active:opacity-70 transition-all" 
                  onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-border bg-muted",
                      coin.isNative && "gold-gradient"
                    )}>
                      {coin.isNative ? (
                        <LogoIcon className="text-white p-2" />
                      ) : (
                        <Image 
                          src={coin.icon || `https://placehold.co/100x100/1E2329/white?text=${coin.symbol}`} 
                          alt={coin.symbol} 
                          width={40} 
                          height={40}
                          className="object-cover"
                          onError={(e: any) => {
                            e.target.src = `https://placehold.co/100x100/1E2329/white?text=${coin.symbol}`;
                          }}
                        />
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-black italic tracking-tight text-foreground uppercase">{coin.symbol}</span>
                      {coin.isNative && <div className="text-[7px] font-black text-primary uppercase leading-none mt-0.5">Ali-Chain</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black italic tracking-tight text-foreground">
                      {coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                    </p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">
                      Rp{(coin.price * USDT_IDR_RATE).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <div className={cn(
                      "w-20 py-1.5 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-sm transition-colors duration-500",
                      coin.isUp ? "bg-green-500 text-white" : "bg-rose-500 text-white"
                    )}>
                      {coin.change >= 0 ? '+' : ''}{(coin.change ?? 0).toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
