
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShoppingBag, 
  Search, 
  Cpu, 
  Wallet, 
  Zap, 
  Star, 
  ArrowRight, 
  Filter,
  ShoppingCart,
  Loader2,
  Package,
  Sparkles,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from "firebase/firestore";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const products = [
  {
    id: "mkt-1",
    name: "Ledger Stax Pro",
    description: "Hardware wallet generasi terbaru dengan layar E-Ink lengkung untuk keamanan aset V3 Anda.",
    priceIdr: 4500000,
    category: "Security",
    rating: 4.9,
    image: "https://picsum.photos/seed/ledger/400/400",
    imageHint: "hardware wallet"
  },
  {
    id: "mkt-2",
    name: "GPU Mining Cluster V1",
    description: "Akses cloud mining eksklusif AliBank dengan jaminan hashrate di jaringan Mainnet.",
    priceIdr: 12500000,
    category: "Infrastructure",
    rating: 4.7,
    image: "https://picsum.photos/seed/gpu/400/400",
    imageHint: "mining rig"
  },
  {
    id: "mkt-3",
    name: "Platinum NFT Membership",
    description: "Kartu akses elit digital yang memberikan diskon biaya swap 50% selamanya.",
    priceIdr: 8900000,
    category: "Digital Asset",
    rating: 5.0,
    image: "https://picsum.photos/seed/nft-card/400/400",
    imageHint: "digital membership"
  },
  {
    id: "mkt-4",
    name: "Titan Crypto Key",
    description: "Kunci fisik FIDO2 dengan integrasi Web3 untuk otentikasi transaksi AliBank.",
    priceIdr: 1200000,
    category: "Security",
    rating: 4.5,
    image: "https://picsum.photos/seed/key/400/400",
    imageHint: "security key"
  }
];

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
  
  // Market State
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [marketLoading, setMarketLoading] = useState(true);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=20&page=1&sparkline=false"
      );
      if (response.ok) {
        const data = await response.json();
        setCoins(data);
      }
    } catch (err) {
      console.error("Market fetch error:", err);
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
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const handleBuyProduct = async (product: typeof products[0]) => {
    if (!user || !db) return;
    
    setIsProcessing(product.id);
    const invoiceId = `MKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const invoicesColRef = collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices");
      const payload = {
        invoiceId,
        merchantId: MOCK_MERCHANT.merchantId,
        customerName: user.displayName || user.email,
        amountIdr: product.priceIdr,
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
                <Globe className="w-3 h-3 text-primary" /> Integrated Web3 Shopping & Global Assets
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
                  placeholder="Cari hardware wallet, NFT, atau mining rigs..." 
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((p) => (
                <Card key={p.id} className="liquid-glass border-none rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-500 shadow-xl">
                  <div className="relative h-64 overflow-hidden">
                    <Image 
                      src={p.image} 
                      alt={p.name} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      data-ai-hint={p.imageHint}
                    />
                    <div className="absolute top-4 left-4">
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
                        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Price</p>
                        <p className="text-xl font-black text-primary italic tracking-tighter">
                          Rp {mounted ? p.priceIdr.toLocaleString('id-ID') : '...'}
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
          </TabsContent>

          <TabsContent value="market">
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-accent">
                    <BarChart3 className="w-6 h-6 text-primary" /> Crypto Asset List
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Live rates from Global Market • 0% Transaction Fee for Platinum Clients</p>
                </div>
                <Button variant="ghost" size="icon" onClick={fetchMarketData} className="text-primary hover:bg-primary/10 rounded-full">
                  <BarChart3 className="w-5 h-5" />
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-6">Asset</th>
                      <th className="px-8 py-6">Current Price</th>
                      <th className="px-8 py-6">24h Change</th>
                      <th className="px-8 py-6">Market Cap</th>
                      <th className="px-8 py-6 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {marketLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={5} className="px-8 py-8 animate-pulse bg-primary/5" />
                        </tr>
                      ))
                    ) : coins.map((coin) => (
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
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-bold text-muted-foreground">Rp {(coin.market_cap / 1e12).toFixed(2)}T</p>
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
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <section className="mt-20 liquid-glass-dark rounded-[3rem] p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-xl space-y-6">
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight">AliBank Elite Concierge</h2>
              <p className="text-white/70 text-sm font-medium italic leading-relaxed">
                Ingin memesan perangkat mining kustom atau aset digital khusus? Tim Concierge kami siap membantu pengadaan barang mewah dengan penyelesaian pembayaran instan via Smart Contract V3.
              </p>
              <Button className="gold-gradient text-white h-14 px-10 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-2xl">
                Contact Concierge <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <div className="w-full md:w-80 h-52 gold-gradient rounded-[2.5rem] shadow-2xl p-8 text-white relative flex flex-col justify-between group cursor-pointer border border-white/10">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-2xl bg-white/20"><Cpu className="w-6 h-6" /></div>
                <Badge className="bg-green-500 text-white text-[7px] font-black uppercase animate-pulse">Mainnet Active</Badge>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Verified Seller Status</p>
                <p className="text-xl font-black italic">AliBank Official Store</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
