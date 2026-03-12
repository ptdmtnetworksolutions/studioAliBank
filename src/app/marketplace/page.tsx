
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
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import Image from "next/image";
import { cn } from "@/lib/utils";

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

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const categories = ["All", "Security", "Infrastructure", "Digital Asset"];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const handleBuy = async (product: typeof products[0]) => {
    if (!user || !db) return;
    
    setIsProcessing(product.id);
    const invoiceId = `MKT-${Math.floor(100000 + Math.random() * 900000)}`;
    
    try {
      const invoicesColRef = collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices");
      await addDoc(invoicesColRef, {
        invoiceId,
        merchantId: MOCK_MERCHANT.merchantId,
        customerName: user.displayName || user.email,
        amountIdr: product.priceIdr,
        cryptoCurrency: "ETH",
        status: "unpaid",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        productName: product.name
      });

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
              <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Marketplace Crypto</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-primary" /> Premium Web3 Hardware & Digital Assets
              </p>
            </div>
          </div>
        </header>

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
                <div className="absolute bottom-4 right-4 bg-primary/90 text-white p-2 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-white" />
                  <span className="text-[10px] font-black">{p.rating}</span>
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
                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">Price Settlement</p>
                    <p className="text-xl font-black text-primary italic tracking-tighter">
                      Rp {mounted ? p.priceIdr.toLocaleString('id-ID') : '...'}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleBuy(p)}
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

        {filteredProducts.length === 0 && (
          <div className="py-32 text-center flex flex-col items-center justify-center space-y-4">
            <Package className="w-16 h-16 text-primary/10" />
            <h2 className="text-xl font-black text-accent uppercase italic">No items found</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Coba kategori lain atau kata kunci berbeda.</p>
          </div>
        )}

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
