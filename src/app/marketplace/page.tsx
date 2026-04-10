"use client";

import { useRouter } from "next/navigation";
import { 
  X, 
  Search, 
  History, 
  Smartphone, 
  Gift, 
  Gamepad2, 
  ChevronRight, 
  TicketPercent, 
  ShoppingBag,
  MessageSquare,
  ArrowLeft,
  Home,
  Loader2,
  Layers
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "Layanan Seluler", name: "Layanan Seluler", icon: Smartphone },
  { id: "Kartu Hadiah", name: "Kartu Hadiah", icon: Gift },
  { id: "Game", name: "Game", icon: Gamepad2 },
  { id: "Infrastructure", name: "Infrastructure", icon: Layers },
];

export default function MarketplacePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "marketplace"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: products, loading } = useCollection<any>(itemsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!activeCategory) return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Marketplace</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {/* Favorit */}
        <section className="space-y-2">
          <h2 className="text-base font-black italic">Favorit</h2>
          <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
            Buat daftar pintasan favorit Anda dengan menambahkan ikon <span className="text-primary">★</span> dalam program mini yang sering Anda gunakan.
          </p>
        </section>

        {/* Kategori */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black italic">Kategori</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "flex items-center gap-3 bg-muted px-5 py-4 rounded-xl min-w-max border transition-all active:scale-95",
                  activeCategory === cat.id ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <cat.icon className={cn("w-5 h-5", activeCategory === cat.id ? "text-primary" : "text-muted-foreground")} />
                <span className="text-xs font-black italic">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Spesial untuk Anda */}
        <section className="space-y-4">
          <h2 className="text-base font-black italic">Spesial untuk Anda</h2>
          <div className="bg-muted rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all border border-border">
            <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="space-y-2 z-10">
              <h3 className="text-base font-black leading-tight">Dapatkan Diskon hingga 6% de...</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Nikmati Diskon 3-6% Maksimum 20 USDC</p>
            </div>
            <div className="relative z-10 w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125" />
              <div className="w-10 h-8 bg-card rounded-md border border-border flex items-center justify-center relative shadow-lg">
                <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-black text-primary-foreground">%</span>
                </div>
                <div className="absolute -left-1 w-2 h-2 bg-muted rounded-full border border-border" />
              </div>
            </div>
          </div>
        </section>

        {/* Populer / Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black italic">Populer</h2>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="space-y-1">
            {/* Hardcoded static items to match the image aesthetics */}
            <div className="flex items-center gap-4 py-4 px-1 hover:bg-muted rounded-xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <TicketPercent className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 flex items-center justify-between border-b border-border pb-4 group-last:border-none">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black italic">Hot Deals</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-500 text-[7px] font-black uppercase h-4 px-1.5 border-none">Hot</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground italic mt-0.5">Belanja penawaran eksklusif dengan diskon ...</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Render dynamic items from Firestore if any */}
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
            ) : filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/checkout/${p.id}`)}
                className="flex items-center gap-4 py-4 px-1 hover:bg-muted rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border">
                  {p.category === "Infrastructure" ? <Layers className="w-5 h-5 text-muted-foreground" /> : <ShoppingBag className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-border pb-4 group-last:border-none">
                  <div>
                    <h3 className="text-sm font-black italic uppercase">{p.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground italic mt-0.5">Rp {p.priceIdr?.toLocaleString()} • {p.category}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 py-4 px-1 hover:bg-muted rounded-xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 flex items-center justify-between pb-4">
                <h3 className="text-sm font-black italic">Ruang Obrolan</h3>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="py-10 text-center space-y-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tidak ada lagi data</p>
          </div>
        </section>
      </main>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border z-50">
        <Button 
          onClick={() => router.push('/')}
          className="w-full h-12 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-black italic uppercase text-xs flex items-center justify-center gap-2 shadow-xl"
        >
          <Home className="w-4 h-4" /> Kembali ke halaman utama
        </Button>
      </footer>
    </div>
  );
}