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
  Sparkles,
  ArrowLeft,
  Home,
  Loader2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { id: "Layanan Seluler", name: "Layanan Seluler", icon: Smartphone },
  { id: "Kartu Hadiah", name: "Kartu Hadiah", icon: Gift },
  { id: "Game", name: "Game", icon: Gamepad2 },
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

  const itemsQuery = useMemo(() => {
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
    <div className="min-h-screen bg-[#1E2329] text-white flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-[#1E2329] z-50">
        <button onClick={() => router.push('/')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Marketplace</h1>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <History className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-4 space-y-8 overflow-y-auto no-scrollbar pb-32">
        {/* Favorit */}
        <section className="space-y-2">
          <h2 className="text-base font-black italic">Favorit</h2>
          <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
            Buat daftar pintasan favorit Anda dengan menambahkan ikon <span className="text-slate-400">★</span> dalam program mini yang sering Anda gunakan.
          </p>
        </section>

        {/* Kategori */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black italic">Kategori</h2>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={cn(
                  "flex items-center gap-3 bg-[#2B3139] px-5 py-4 rounded-xl min-w-max border transition-all active:scale-95",
                  activeCategory === cat.id ? "border-primary bg-[#363D47]" : "border-white/5"
                )}
              >
                <cat.icon className={cn("w-5 h-5", activeCategory === cat.id ? "text-primary" : "text-slate-300")} />
                <span className="text-xs font-black italic">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Spesial untuk Anda */}
        <section className="space-y-4">
          <h2 className="text-base font-black italic">Spesial untuk Anda</h2>
          <div className="bg-[#2B3139] rounded-2xl p-6 flex items-center justify-between relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all">
            <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="space-y-2 z-10">
              <h3 className="text-base font-black leading-tight">Dapatkan Diskon hingga 6% de...</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Nikmati Diskon 3-6% Maksimum 20 USDC</p>
            </div>
            <div className="relative z-10 w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl scale-125" />
              <div className="w-10 h-8 bg-slate-700 rounded-md border border-white/10 flex items-center justify-center relative shadow-lg">
                <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-[8px] font-black text-black">%</span>
                </div>
                <div className="absolute -left-1 w-2 h-2 bg-[#2B3139] rounded-full border border-white/5" />
              </div>
            </div>
          </div>
        </section>

        {/* Populer / Products */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black italic">Populer</h2>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </div>

          <div className="space-y-1">
            {/* Hardcoded static items to match the image aesthetics */}
            <div className="flex items-center gap-4 py-4 px-1 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                <TicketPercent className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1 flex items-center justify-between border-b border-white/5 pb-4 group-last:border-none">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black italic">Hot Deals</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-500 text-[7px] font-black uppercase h-4 px-1.5 border-none">Hot</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">Belanja penawaran eksklusif dengan diskon ...</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </div>
            </div>

            {/* Render dynamic items from Firestore if any */}
            {loading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary/20" /></div>
            ) : filteredProducts.map((p) => (
              <div 
                key={p.id} 
                onClick={() => router.push(`/checkout/${p.id}`)}
                className="flex items-center gap-4 py-4 px-1 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2B3139] flex items-center justify-center shrink-0 border border-white/5">
                  <ShoppingBag className="w-5 h-5 text-slate-300" />
                </div>
                <div className="flex-1 flex items-center justify-between border-b border-white/5 pb-4 group-last:border-none">
                  <div>
                    <h3 className="text-sm font-black italic uppercase">{p.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">Rp {p.priceIdr?.toLocaleString()} • {p.category}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 py-4 px-1 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 flex items-center justify-between pb-4">
                <h3 className="text-sm font-black italic">Ruang Obrolan</h3>
                <ChevronRight className="w-4 h-4 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="py-10 text-center space-y-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Tidak ada lagi data</p>
          </div>
        </section>
      </main>

      {/* Floating Assistant */}
      <div className="fixed bottom-24 right-6 z-[60]">
        <div className="w-12 h-12 bg-[#2B3139] rounded-2xl shadow-2xl border border-white/5 flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100" />
          <LogoIcon className="w-6 h-6 relative z-10" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[#1E2329] animate-pulse" />
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 bg-[#1E2329] border-t border-white/5 z-50">
        <Button 
          onClick={() => router.push('/')}
          className="w-full h-12 bg-[#2B3139] hover:bg-[#363D47] text-white rounded-xl font-black italic uppercase text-xs flex items-center justify-center gap-2 shadow-xl"
        >
          <Home className="w-4 h-4" /> Kembali ke halaman utama
        </Button>
      </footer>
    </div>
  );
}
