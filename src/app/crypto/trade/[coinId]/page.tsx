
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Info, 
  Loader2,
  History,
  LayoutGrid,
  BarChart3,
  Search,
  MessageSquare,
  Newspaper,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function CryptoTradePage() {
  const { coinId } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [coinData, setCoinData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderAmount, setOrderAmount] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [marketCoins, setMarketCoins] = useState<any[]>([]);
  
  // Percent states
  const [buyPercent, setBuyPercent] = useState(0);
  const [sellPercent, setSellPercent] = useState(0);

  // Refs for TradingView
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchCoinDetail();
    fetchMarketCoins();
  }, [coinId]);

  const fetchCoinDetail = async () => {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
      const data = await res.json();
      setCoinData(data);
    } catch (err) {
      console.error("Coin detail ledger sync interrupted");
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketCoins = async () => {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=10&page=1&sparkline=false");
      const data = await res.json();
      setMarketCoins(data);
    } catch (err) {}
  };

  useEffect(() => {
    if (mounted && coinData && container.current) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.type = "text/javascript";
      script.async = true;
      script.onload = () => {
        if (window.TradingView) {
          new window.TradingView.widget({
            "autosize": true,
            "symbol": `BINANCE:${coinData.symbol.toUpperCase()}USDT`,
            "interval": "15",
            "timezone": "Asia/Jakarta",
            "theme": "light",
            "style": "1",
            "locale": "id",
            "toolbar_bg": "#f1f3f6",
            "enable_publishing": false,
            "hide_top_toolbar": false,
            "save_image": false,
            "container_id": container.current?.id
          });
        }
      };
      document.head.appendChild(script);
    }
  }, [mounted, coinData]);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const priceIdr = coinData?.market_data?.current_price?.idr || 0;
  const change24h = coinData?.market_data?.price_change_percentage_24h || 0;

  const handleBuyPercentChange = (val: number[]) => {
    const percent = val[0];
    setBuyPercent(percent);
    if (!userData || !priceIdr) return;
    
    const maxBalance = userData.totalBalance || 0;
    const targetAmount = (maxBalance * percent) / 100;
    setOrderAmount(targetAmount.toFixed(0));
    setOrderQty((targetAmount / priceIdr).toFixed(8));
  };

  const handleSellPercentChange = (val: number[]) => {
    const percent = val[0];
    setSellPercent(percent);
    if (!userData || !coinData || !priceIdr) return;
    
    const assetKey = coinData.symbol.toUpperCase();
    const maxQty = userData.cryptoBalances?.[assetKey] || 0;
    const targetQty = (maxQty * percent) / 100;
    setOrderQty(targetQty.toFixed(8));
    setOrderAmount((targetQty * priceIdr).toFixed(0));
  };

  const handleTrade = async (type: 'buy' | 'sell') => {
    if (!user || !db || !userDocRef || !coinData) return;
    
    const amount = parseFloat(orderAmount);
    const qty = parseFloat(orderQty);
    if (!amount || isNaN(amount)) return;

    setIsProcessing(true);
    try {
      const assetKey = coinData.symbol.toUpperCase();
      const payload = type === 'buy' 
        ? { totalBalance: increment(-amount), [`cryptoBalances.${assetKey}`]: increment(qty) }
        : { totalBalance: increment(amount), [`cryptoBalances.${assetKey}`]: increment(-qty) };

      if (type === 'buy' && (userData?.totalBalance || 0) < amount) {
        throw new Error("Insufficient Liquidity.");
      }
      if (type === 'sell' && (userData?.cryptoBalances?.[assetKey] || 0) < qty) {
        throw new Error(`Insufficient ${assetKey} Balance.`);
      }

      await updateDoc(userDocRef, payload);

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${type === 'buy' ? 'Spot Buy' : 'Spot Sell'} ${coinData.name} via AliBank V3 Node`,
        category: "Trading",
        amount: amount,
        cryptoAmount: qty,
        cryptoCurrency: assetKey,
        type: type === 'buy' ? 'expense' : 'income',
        status: "settled",
        timestamp: serverTimestamp()
      });

      toast({ title: "Order Settled", description: `Order ${type} ${coinData.name} has been successfully executed on-ledger.` });
      setOrderAmount(""); setOrderQty("");
      setBuyPercent(0); setSellPercent(0);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Execution Failed", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading || !coinData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse italic">Synchronizing Institutional Terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <Navbar />
      
      {/* Trading Header Bar */}
      <div className="bg-white border-b border-primary/10 px-4 py-3 sticky top-16 z-30">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src={coinData.image.small} alt={coinData.name} fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-black text-accent uppercase tracking-tighter">{coinData.symbol}/IDR</h1>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Production Pair</p>
              </div>
            </div>
          </div>

          <div className="flex gap-8 items-center overflow-x-auto no-scrollbar py-1">
            <div className="shrink-0">
              <p className={cn("text-xl font-black italic tracking-tighter", change24h >= 0 ? "text-green-600" : "text-destructive")}>
                Rp {priceIdr.toLocaleString('id-ID')}
              </p>
              <p className={cn("text-[10px] font-black uppercase", change24h >= 0 ? "text-green-600" : "text-destructive")}>
                {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h Pulse)
              </p>
            </div>
            <div className="hidden md:block shrink-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">High Mark</p>
              <p className="text-xs font-black text-accent italic">Rp {coinData.market_data.high_24h.idr.toLocaleString()}</p>
            </div>
            <div className="hidden md:block shrink-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Low Mark</p>
              <p className="text-xs font-black text-accent italic">Rp {coinData.market_data.low_24h.idr.toLocaleString()}</p>
            </div>
            <div className="hidden lg:block shrink-0">
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">24h Vol Position</p>
              <p className="text-xs font-black text-accent italic">Rp {(coinData.market_data.total_volume.idr / 1e12).toFixed(2)}T</p>
            </div>
          </div>
          
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-1 uppercase font-black text-[9px] hidden xl:flex">Live Production Ledger V3</Badge>
        </div>
      </div>

      <main className="container mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Section: Order Ledger & Market Intelligence */}
        <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white h-[450px] flex flex-col">
            <div className="p-4 border-b border-primary/5 bg-accent/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" /> Order Ledger Snapshot
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              <div className="space-y-1">
                {/* Order Ledger Depth (Asks) - Calculated based on real price */}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-destructive font-bold italic">
                    <span>{(priceIdr * (1 + (10-i) * 0.0005)).toLocaleString('id-ID')}</span>
                    <span>{(0.1 + (Math.sin(i) + 1) * 0.5).toFixed(4)}</span>
                  </div>
                ))}
              </div>
              <div className="py-3 border-y border-primary/10 text-center bg-primary/[0.02]">
                <p className="text-base font-black text-accent italic">Rp {priceIdr.toLocaleString('id-ID')}</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase">Real-Time Spot</p>
              </div>
              <div className="space-y-1">
                {/* Order Ledger Depth (Buys) - Calculated based on real price */}
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex justify-between text-[10px] text-green-600 font-bold italic">
                    <span>{(priceIdr * (1 - (i+1) * 0.0005)).toLocaleString('id-ID')}</span>
                    <span>{(0.1 + (Math.cos(i) + 1) * 0.5).toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm p-5 space-y-4 bg-white">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Quantitative Signals
            </h3>
            <div className="space-y-3">
              <div className={cn(
                "p-3 rounded-xl border",
                change24h >= 0 ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
              )}>
                <p className={cn(
                  "text-[10px] font-black uppercase mb-1",
                  change24h >= 0 ? "text-green-700" : "text-red-700"
                )}>
                  Sentiment Rating: {change24h >= 0 ? "Bullish" : "Bearish"}
                </p>
                <p className={cn(
                  "text-[10px] font-medium italic",
                  change24h >= 0 ? "text-green-800" : "text-red-800"
                )}>
                  {change24h >= 0 
                    ? "High probability execution detected based on current liquidity flow."
                    : "Caution: Distribution patterns detected in higher timeframes."}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-black text-primary uppercase mb-1">Fee Tier: Platinum Sovereign</p>
                <p className="text-[10px] text-muted-foreground font-medium italic uppercase tracking-widest">Commission: 0% Settled.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Middle Section: Chart & Trade Forms */}
        <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          {/* Chart Area */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white relative h-[500px]">
            <div id="tradingview_widget" ref={container} className="w-full h-full" />
          </Card>

          {/* Trade Panel */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <Tabs defaultValue="buy" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-primary/5 p-1.5 border-b border-primary/10 rounded-none">
                <TabsTrigger value="buy" className="font-black uppercase text-xs data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all">Buy {coinData.symbol}</TabsTrigger>
                <TabsTrigger value="sell" className="font-black uppercase text-xs data-[state=active]:bg-destructive data-[state=active]:text-white transition-all">Sell {coinData.symbol}</TabsTrigger>
              </TabsList>

              <TabsContent value="buy" className="p-8 space-y-8">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available Liquidity</p>
                  <p className="text-xs font-black text-accent">Rp {userData?.totalBalance?.toLocaleString('id-ID') || "0"}</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Liquidity Allocation (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary/40">Rp</span>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={orderAmount}
                        onChange={(e) => {
                          setOrderAmount(e.target.value);
                          setOrderQty((parseFloat(e.target.value) / priceIdr).toFixed(8));
                        }}
                        className="h-14 pl-12 rounded-2xl bg-accent/5 border-none font-black italic text-lg" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4 px-2">
                    <Slider 
                      value={[buyPercent]} 
                      max={100} 
                      step={25} 
                      onValueChange={handleBuyPercentChange}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase px-1">
                      <span className={cn(buyPercent === 0 && "text-primary")}>0%</span>
                      <span className={cn(buyPercent === 25 && "text-primary")}>25%</span>
                      <span className={cn(buyPercent === 50 && "text-primary")}>50%</span>
                      <span className={cn(buyPercent === 75 && "text-primary")}>75%</span>
                      <span className={cn(buyPercent === 100 && "text-primary")}>100%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Asset Delivery Estimation</label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        readOnly 
                        value={orderQty}
                        placeholder="0.00" 
                        className="h-14 pr-16 rounded-2xl bg-primary/5 border-none font-black italic text-lg" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary uppercase">{coinData.symbol}</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleTrade('buy')}
                  disabled={isProcessing || !orderAmount}
                  className="w-full h-16 bg-green-600 hover:bg-green-700 text-white font-black uppercase italic text-lg rounded-[2rem] shadow-xl transition-all mt-4"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Confirm Institutional Buy: ${coinData.symbol}`}
                </Button>
              </TabsContent>

              <TabsContent value="sell" className="p-8 space-y-8">
                <div className="flex justify-between items-end mb-2">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Sovereign Asset Balance</p>
                  <p className="text-xs font-black text-accent">{(userData?.cryptoBalances?.[coinData.symbol.toUpperCase()] || 0).toFixed(8)} {coinData.symbol.toUpperCase()}</p>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Asset Liquidation ({coinData.symbol})</label>
                    <div className="relative">
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        value={orderQty}
                        onChange={(e) => {
                          setOrderQty(e.target.value);
                          setOrderAmount((parseFloat(e.target.value) * priceIdr).toFixed(0));
                        }}
                        className="h-14 rounded-2xl bg-accent/5 border-none font-black italic text-lg" 
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary uppercase">{coinData.symbol}</span>
                    </div>
                  </div>

                  <div className="space-y-4 px-2">
                    <Slider 
                      value={[sellPercent]} 
                      max={100} 
                      step={25} 
                      onValueChange={handleSellPercentChange}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-black text-muted-foreground uppercase px-1">
                      <span className={cn(sellPercent === 0 && "text-primary")}>0%</span>
                      <span className={cn(sellPercent === 25 && "text-primary")}>25%</span>
                      <span className={cn(sellPercent === 50 && "text-primary")}>50%</span>
                      <span className={cn(sellPercent === 75 && "text-primary")}>75%</span>
                      <span className={cn(sellPercent === 100 && "text-primary")}>100%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Liquidity Return (IDR)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-primary/40">Rp</span>
                      <Input 
                        type="number" 
                        readOnly 
                        value={orderAmount}
                        placeholder="0" 
                        className="h-14 pl-12 rounded-2xl bg-primary/5 border-none font-black italic text-lg" 
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handleTrade('sell')}
                  disabled={isProcessing || !orderQty}
                  className="w-full h-16 bg-destructive hover:bg-destructive/90 text-white font-black uppercase italic text-lg rounded-[2rem] shadow-xl transition-all mt-4"
                >
                  {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `Confirm Asset Liquidation: ${coinData.symbol}`}
                </Button>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Section: Assets List & Market Pulse Intelligence */}
        <div className="lg:col-span-3 space-y-6 order-3 lg:order-3">
          <Card className="rounded-2xl border-none shadow-sm overflow-hidden bg-white">
            <div className="p-4 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Active Trading Pairs
              </h3>
              <Search className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="divide-y divide-primary/5 max-h-[300px] overflow-y-auto no-scrollbar">
              {marketCoins.map((coin) => (
                <button 
                  key={coin.id} 
                  onClick={() => router.push(`/crypto/trade/${coin.id}`)}
                  className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors text-left",
                    coin.id === coinId && "bg-primary/5 border-l-2 border-primary"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-6 h-6">
                      <Image src={coin.image} alt={coin.name} fill className="object-contain" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-accent uppercase tracking-tighter">{coin.symbol}/IDR</p>
                      <p className={cn("text-[9px] font-bold", coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-destructive")}>
                        {coin.price_change_percentage_24h >= 0 ? "+" : ""}{coin.price_change_percentage_24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] font-black text-accent italic">Rp {coin.current_price.toLocaleString('id-ID')}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm p-6 space-y-4 bg-white">
            <h3 className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-primary" /> Institutional Insights
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-accent leading-tight hover:text-primary cursor-pointer transition-colors italic">Analisis Ledger V3: Peningkatan Volume Institusional pada Aset Lapis 1.</p>
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Real-time • AliBank Insight 2026</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-accent leading-tight hover:text-primary cursor-pointer transition-colors italic">Laporan Audit Jaringan: Sinkronisasi Node Global Berjalan dengan Latensi Rendah.</p>
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Global Feed • World Ledger</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm p-6 space-y-4 liquid-glass-dark text-white">
            <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Market Pulse & Intelligence
            </h3>
            <div className="space-y-3 h-[150px] overflow-y-auto no-scrollbar pr-1">
              <div className="text-[9px] font-medium leading-relaxed italic border-l-2 border-primary pl-2 py-1 bg-white/5">
                <span className="font-black text-primary uppercase">System Sentinel:</span> Likuiditas pada pasangan {coinData.symbol}/IDR meningkat 15% dalam 1 jam terakhir.
              </div>
              <div className="text-[9px] font-medium leading-relaxed italic">
                <span className="font-black text-white/60 uppercase">Alpha Node:</span> Aliran dana keluar terdeteksi pada bursa kompetitor, potensi volatilitas naik.
              </div>
              <div className="text-[9px] font-medium leading-relaxed italic">
                <span className="font-black text-white/60 uppercase">Global Auditor:</span> Transaksi lintas jaringan (Cross-Chain) untuk USDT/IDR telah diselesaikan secara massal.
              </div>
            </div>
            <div className="relative">
              <Input placeholder="Broadcast signal..." className="h-10 text-[10px] bg-white/10 border-none rounded-xl pr-10 placeholder:text-white/40 font-bold uppercase tracking-widest" />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 text-primary hover:bg-transparent">
                <Zap className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <footer className="container mx-auto px-4 mt-12 mb-20">
        <div className="liquid-glass p-8 rounded-[3rem] border-primary/20 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="font-black text-accent uppercase italic tracking-tighter text-lg mb-1">Production Asset Integrity & Compliance</h4>
              <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed uppercase tracking-widest">
                Seluruh aktivitas perdagangan pada AliBank Terminal 2026 diaudit secara riil oleh protokol Smart Contract V3. Keputusan perdagangan sepenuhnya berada di bawah otoritas nasabah. AliBank menjamin ketersediaan likuiditas 1:1 untuk seluruh aset yang terdaftar pada sistem ledger utama.
              </p>
            </div>
          </div>
          <div className="pt-6 border-t border-primary/5 text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">AliBank Terminal • Powered by TradingView Production Technology • Verified by CoinGecko Data • 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
