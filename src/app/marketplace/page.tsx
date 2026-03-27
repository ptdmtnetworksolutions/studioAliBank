
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShoppingBag, 
  Search, 
  Cpu, 
  Zap, 
  ShoppingCart,
  Loader2,
  Package,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  RefreshCw,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, addDoc, serverTimestamp, query } from "firebase/firestore";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type CoinData = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
};

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const itemsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "marketplace"));
  }, [db]);
  const { data: dbProducts, loading: itemsLoading } = useCollection<any>(itemsQuery);

  const [coins, setCoins] = useState<CoinData[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=20&page=1&sparkline=false"
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCoins(data);
        }
      }
    } catch (err) {
      console.warn("Market fetch error handled");
    } finally {
      setMarketLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchMarketData();
  }, [fetchMarketData]);

  const categories = ["All", "Security", "Infrastructure", "Digital Asset"];

  const filteredProducts = useMemo(() => {
    if (!dbProducts) return [];
    return dbProducts.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory, dbProducts]);

  const handleBuyProduct = async (product: any) => {
    if (!user || !db) {
      toast({ variant: "destructive", title: "Login Required", description: "Silakan login untuk berbelanja." });
      return;
    }
    
    setIsProcessing(product.id);
    const invoiceId = `MKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const invoicesColRef = collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices");
      const payload = {
        invoiceId,
        merchantId: MOCK_MERCHANT.merchantId,
        customerName: user.displayName || user.email,
        amountIdr: product.priceIdr,
        amountUsd: product.priceUsd || 0,
        cryptoCurrency: "ETH",
        status: "unpaid",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        productName: product.name
      };

      await addDoc(invoicesColRef, payload);
      router.push(`/checkout/${invoiceId}`);
    } catch (err) {
      console.error("Marketplace Error:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl p-3">
                <ShoppingBag className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">AliBank Marketplace</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-3 h-3 text-primary" /> Database Inventory & Global Market 2026
                </p>
              </div>
            </div>
          </header>

          <Tabs defaultValue="products" className="space-y-12">
            <TabsList className="bg-primary/5 p-1.5 rounded-[2rem] h-16 border border-primary/10 w-full md:w-auto">
              <TabsTrigger value="products" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                Web3 Products
              </TabsTrigger>
              <TabsTrigger value="market" className="rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                Global Market (Live)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <div className="flex flex-col md:flex-row gap-6 mb-12">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Cari inventory riil di database..." 
                    className="h-14 pl-14 rounded-2xl liquid-glass border-none text-sm font-medium focus:ring-2 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant={activeCategory === cat ? "default" : "outline"}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                        activeCategory === cat ? "gold-gradient text-white border-none shadow-lg" : "liquid-glass border-primary/10 text-accent"
                      )}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {itemsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Syncing Database Inventory...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredProducts.map((p) => (
                    <Card key={p.id} className="liquid-glass border-none rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                      <div className="relative h-64 overflow-hidden bg-white/5">
                        {p.image ? (
                          <Image 
                            src={p.image} 
                            alt={p.name} 
                            fill 
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="w-12 h-12 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 flex gap-2">
                          <Badge className="bg-white/90 backdrop-blur-md text-accent border-none font-black text-[8px] px-3 py-1 uppercase rounded-full">
                            {p.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter leading-tight">{p.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-medium mt-1 leading-relaxed line-clamp-2 italic">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-primary/5">
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Unit Price</p>
                            <p className="text-xl font-black text-primary italic tracking-tighter">
                              {p.priceUsd ? `$ ${p.priceUsd.toLocaleString('en-US')}` : `Rp ${mounted ? p.priceIdr.toLocaleString('id-ID') : '...'}`}
                            </p>
                          </div>
                          <Button 
                            onClick={() => handleBuyProduct(p)}
                            disabled={!!isProcessing}
                            className="w-12 h-12 rounded-2xl gold-gradient text-white shadow-xl hover:scale-110 transition-all p-0 flex items-center justify-center"
                          >
                            {isProcessing === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingCart className="w-5 h-5" />}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 liquid-glass rounded-[3rem] border-dashed border-2 border-primary/5">
                  <Package className="w-16 h-16 text-primary/10 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-accent uppercase italic">Inventory Empty</h3>
                  <p className="text-xs text-muted-foreground font-medium mt-2">Belum ada produk riil di database AliBank.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="market">
              <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-accent">
                      <BarChart3 className="w-6 h-6 text-primary" /> Live Global Market
                    </h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Suku bunga riil dari pasar global saat ini.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Asset</th>
                        <th className="px-8 py-6">Current Price</th>
                        <th className="px-8 py-6">24h Change</th>
                        <th className="px-8 py-6 text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {marketLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}><td colSpan={4} className="px-8 py-8 animate-pulse bg-primary/5" /></tr>
                        ))
                      ) : coins.length > 0 ? coins.map((coin) => (
                        <tr key={coin.id} className="hover:bg-primary/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-white p-1">
                                <Image src={coin.image} alt={coin.name} fill className="object-contain" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-accent">{coin.name}</p>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{coin.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-sm font-black text-accent italic">Rp {coin.current_price.toLocaleString('id-ID')}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className={cn(
                              "flex items-center gap-1 text-[10px] font-black uppercase",
                              coin.price_change_percentage_24h >= 0 ? "text-green-600" : "text-destructive"
                            )}>
                              {coin.price_change_percentage_24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {coin.price_change_percentage_24h.toFixed(2)}%
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button 
                              onClick={() => router.push(`/crypto/trade/${coin.id}`)}
                              className="h-10 px-6 rounded-xl gold-gradient text-white font-black italic uppercase text-[10px] shadow-lg hover:scale-105 transition-all"
                            >
                              Trade Now
                            </Button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={4} className="py-20 text-center">
                            <RefreshCw className="w-10 h-10 text-primary/20 mx-auto mb-4" />
                            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Gagal memuat pasar kripto riil. Silakan coba lagi.</p>
                            <Button variant="ghost" className="mt-4 text-[10px] font-black uppercase" onClick={fetchMarketData}>Muat Ulang</Button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </TooltipProvider>
  );
}
