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
import { useState, useEffect, useMemo } from "react";
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

const MARKUP = 1.02; // 2% AliBank Profit Margin

export default function CryptoMarketPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Pasar");
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [marketData, setMarketData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil data likuiditas untuk harga ALX riil dari Firestore
  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchMarketData = async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "WLDUSDT", "POLUSDT", "USDTIDR"];
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`);
      const data = await res.json();
      
      if (!Array.isArray(data)) return;

      const formatted = data.map(res => {
        const price = parseFloat(res.lastPrice) * MARKUP;
        return {
          symbol: res.symbol.replace("USDT", "").replace("IDR", ""),
          price: price,
          change: parseFloat(res.priceChangePercent) || 0,
          isUp: (parseFloat(res.priceChangePercent) || 0) >= 0,
          volume: parseFloat(res.quoteVolume) || 0
        };
      });

      // Integrasi ALX Riil dari Firestore AliBank
      const alxPrice = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const alxData = {
        symbol: "ALX",
        price: alxPrice,
        change: 1.14 + (Math.random() * 0.05),
        isUp: true,
        isNative: true
      };

      setMarketData([alxData, ...formatted.filter(c => c.symbol !== "USDTIDR")]);
    } catch (e) {
      console.error("Market Data Sync Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [globalLiquidity]);

  useEffect(() => {
    if (!bannerApi) return;
    bannerApi.on("select", () => {
      setCurrentBanner(bannerApi.selectedScrollSnap());
    });
  }, [bannerApi]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 flex flex-col font-body transition-colors duration-300">
      {/* Header - Search & Menu */}
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

        {/* Dynamic Nav Tabs */}
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

      <main className="flex-1 px-4 pt-4 space-y-8 overflow-y-auto no-scrollbar">
        {/* TAB: FAVORIT */}
        {activeTab === "Favorit" && (
          <div className="animate-in zoom-in-95 duration-500 py-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Star className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black italic uppercase">Daftar Pantauan</h3>
              <p className="text-xs font-medium text-muted-foreground italic uppercase max-w-[200px] leading-relaxed">
                Tandai koin favorit untuk memantau harga premium AliBank secara instan.
              </p>
            </div>
            <div className="w-full space-y-4 pt-6">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left px-1">Unggulan</p>
              <div 
                className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between cursor-pointer"
                onClick={() => router.push('/crypto/market/alx')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full gold-gradient p-2 flex items-center justify-center shadow-lg"><LogoIcon className="text-white" /></div>
                  <div className="text-left">
                    <p className="text-sm font-black italic uppercase">Alix Coin (ALX)</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase italic">Native Ecosystem Token</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-none font-black italic">PRO</Badge>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PASAR */}
        {activeTab === "Pasar" && (
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
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi...</p>
                </div>
              ) : marketData.map((coin) => (
                <div 
                  key={coin.symbol} 
                  className="grid grid-cols-3 items-center group cursor-pointer active:opacity-70 transition-all" 
                  onClick={() => router.push(`/crypto/market/${coin.symbol.toLowerCase()}`)}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-sm", coin.isNative ? "gold-gradient" : "bg-muted")}>
                      {coin.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-full" />}
                    </div>
                    <div>
                      <span className="text-sm font-black italic tracking-tight text-foreground uppercase">{coin.symbol}</span>
                      {coin.isNative && <div className="text-[7px] font-black text-primary uppercase">Ali-Chain</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black italic tracking-tight text-foreground">
                      {coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: coin.price < 1 ? 4 : 2 })}
                    </p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Markup Incl.</p>
                  </div>
                  <div className="flex justify-end">
                    <div className={cn(
                      "w-20 py-1.5 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-sm transition-colors",
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

        {/* TAB: ALPHA */}
        {activeTab === "Alpha" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <header className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Alpha Pulse</h3>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase italic leading-relaxed">
                Analisis AI AliBank untuk menemukan aset dengan momentum pertumbuhan tertinggi.
              </p>
            </header>

            <div className="grid grid-cols-1 gap-4">
              {[
                { name: "BTC Momentum", score: 98, status: "Bullish", desc: "Aktivitas institusional meningkat di level premium.", icon: Activity },
                { name: "ALX Accumulation", score: 99, status: "Strong Buy", desc: "Fase akumulasi internal mendekati ambang batas listing.", icon: Flame },
              ].map((alpha, i) => (
                <Card key={i} className="bg-card border-border p-6 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><alpha.icon className="w-20 h-20" /></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-black italic uppercase">{alpha.name}</h4>
                      <Badge className="bg-green-500 text-white border-none font-black text-[8px] h-4 px-1.5 uppercase mt-1 italic">{alpha.status}</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black italic text-primary">{alpha.score}%</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">AI Score</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium italic uppercase leading-tight relative z-10">{alpha.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB: GROW */}
        {activeTab === "Grow" && (
          <div className="animate-in fade-in duration-500 space-y-8">
            {/* ALX PRIORITY CARD */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black text-foreground italic uppercase flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" /> Prioritas Pertumbuhan ALX
                </h3>
                <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2 h-5">V3 Exclusive</Badge>
              </div>

              <Card className="gold-gradient border-none rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group cursor-pointer active:scale-[0.98] transition-all" onClick={() => router.push('/deposits')}>
                <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/money/800/800')] opacity-[0.05] mix-blend-overlay" />
                <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <LogoIcon className="w-64 h-64" />
                </div>
                
                <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Sovereign Asset</p>
                      <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">ALX Sovereign Staking</h4>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black italic tracking-tighter">24.8%</span>
                    <div className="pb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest leading-none">APY Maksimum</p>
                      <p className="text-[8px] font-black text-white/60 uppercase">Reward Dibayar dalam ALX</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-white/60" />
                      <span className="text-[9px] font-black uppercase italic">Buyback Protection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-white/60" />
                      <span className="text-[9px] font-black uppercase italic">Compounding Daily</span>
                    </div>
                  </div>

                  <Button className="w-full bg-white text-primary hover:bg-white/90 h-12 rounded-xl font-black uppercase italic text-xs tracking-widest shadow-xl">
                    Mulai Hasilkan Sekarang
                  </Button>
                </div>
              </Card>
            </section>

            <div className="relative">
              <Carousel setApi={setBannerApi} className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="bg-muted/50 rounded-2xl p-6 flex items-center justify-between min-h-[140px] relative overflow-hidden border border-border/50">
                      <div className="space-y-3 max-w-[65%] relative z-10">
                        <h2 className="text-sm font-black text-foreground leading-tight italic">
                          Pinjam Koin untuk Berdagang guna Mendapatkan APY Tinggi
                        </h2>
                        <button className="text-[11px] font-black text-primary hover:underline uppercase italic">
                          Tampilkan Selengkapnya
                        </button>
                      </div>
                      <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg relative z-10 border-2 border-background">
                          <Zap className="w-6 h-6 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-base font-black text-foreground italic uppercase">Aset Lainnya</h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-card rounded-2xl p-5 border border-border flex flex-col justify-between relative overflow-hidden group active:scale-[0.98] transition-transform shadow-sm h-44 cursor-pointer" onClick={() => router.push('/deposits')}>
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-black text-foreground italic tracking-tight">USDT</span>
                    <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white p-1">
                      <LogoIcon />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-foreground italic tracking-tighter">15.73%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">APR Maks.</p>
                  </div>
                </Card>

                <div className="space-y-3">
                  <Card className="bg-card rounded-2xl p-4 border border-border flex justify-between items-center group active:scale-[0.98] transition-transform shadow-sm h-[84px] cursor-pointer" onClick={() => router.push('/deposits')}>
                    <div>
                      <span className="text-xs font-black text-foreground italic">ETH</span>
                      <p className="text-base font-black text-foreground italic tracking-tighter mt-1">12.81%</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white p-1">
                      <LogoIcon />
                    </div>
                  </Card>
                  <Card className="bg-card rounded-2xl p-4 border border-border flex justify-between items-center group active:scale-[0.98] transition-transform shadow-sm h-[84px] cursor-pointer" onClick={() => router.push('/deposits')}>
                    <div>
                      <span className="text-xs font-black text-foreground italic">SOL</span>
                      <p className="text-base font-black text-foreground italic tracking-tighter mt-1">9.7%</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white p-1.5">
                      <LogoIcon className="text-cyan-400" />
                    </div>
                  </Card>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB: DATA */}
        {activeTab === "Data" && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <section className="space-y-4">
              <h3 className="text-base font-black italic uppercase px-1">Statistik Pasar Global</h3>
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card rounded-2xl p-5 border border-border space-y-2 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Market Cap</p>
                  <p className="text-lg font-black italic text-foreground tracking-tighter">Rp42,6T</p>
                  <span className="text-[10px] font-bold text-green-500">+1.24%</span>
                </Card>
                <Card className="bg-card rounded-2xl p-5 border border-border space-y-2 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">24h Volume</p>
                  <p className="text-lg font-black italic text-foreground tracking-tighter">Rp1,2T</p>
                  <span className="text-[10px] font-bold text-rose-500">-5.82%</span>
                </Card>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-black italic uppercase px-1">Dominasi Aset</h3>
              <Card className="space-y-4 p-6 rounded-[2rem] bg-card border border-border shadow-sm">
                {[
                  { name: "BTC", value: 52.4, color: "bg-orange-500" },
                  { name: "ETH", value: 18.2, color: "bg-indigo-500" },
                  { name: "ALX", value: 4.2, color: "bg-primary" },
                  { name: "Lainnya", value: 25.2, color: "bg-muted" },
                ].map((item) => (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase italic">
                      <span>{item.name}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => router.push('/crypto/convert')}
          className="w-12 h-12 bg-card rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary border border-border active:scale-90 transition-transform"
        >
          <div className="relative">
            <LayoutGrid className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
          </div>
        </button>
      </div>
    </div>
  );
}
