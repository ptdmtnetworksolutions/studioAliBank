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
  Layers,
  User,
  LayoutGrid,
  ArrowRightLeft,
  Zap,
  Ticket,
  Settings,
  ShieldCheck,
  Star
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const [isMobile, setIsMobile] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Marketplace - AliBank V3";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const itemsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "marketplace"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: products, isLoading } = useCollection<any>(itemsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!activeCategory) return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  if (!mounted) return null;

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/30 w-full">
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
                {isLoading ? (
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
      ) : (
        <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30 w-full">
          {/* SIDEBAR NAVIGATION */}
          <aside className="w-64 bg-card border-r border-border flex flex-col fixed h-screen z-50">
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg text-white">
                <LogoIcon />
              </div>
              <span className="font-bold text-xl tracking-tighter italic uppercase">AliBank</span>
            </div>
            <nav className="flex-1 px-4 space-y-1 pt-4">
              <SidebarItem icon={User} label="Profil Saya" href="/profile" />
              <SidebarItem icon={LayoutGrid} label="Dashboard" href="/" />
              <SidebarItem icon={ArrowRightLeft} label="Move crypto" href="/crypto/buy" />
              <SidebarItem icon={Zap} label="Discover" href="/crypto" />
              <SidebarItem icon={Ticket} label="Card / Marketplace" active href="#" />
              <SidebarItem icon={Settings} label="Settings" href="/settings" />
            </nav>
            <div className="p-6 border-t border-border space-y-4">
              <div className="flex items-center justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                <span>Sovereign Hub</span>
                <span className="flex items-center gap-1 text-green-500">
                  <ShieldCheck className="w-2.5 h-2.5" /> SECURE
                </span>
              </div>
            </div>
          </aside>

          {/* MAIN CONTAINER */}
          <main className="ml-64 flex-1 flex flex-col min-w-0">
            {/* HEADER */}
            <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Marketplace & Program Mini</h2>
              </div>
              <div className="flex items-center gap-6">
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                    U
                  </div>
                </div>
              </div>
            </header>

            {/* CONTAINER CONTENT */}
            <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT / CENTER COLUMN */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* PROMO BANNER */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-8 shadow-sm flex items-center justify-between relative overflow-hidden group min-h-[160px]">
                    <div className="absolute inset-0 gold-gradient opacity-[0.02] group-hover:opacity-[0.05] transition-opacity" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="space-y-3 z-10">
                      <Badge className="bg-primary/20 text-primary text-[8px] font-black uppercase tracking-wider px-2 h-5 border-none">Spesial Untuk Anda</Badge>
                      <h3 className="text-xl font-black italic tracking-tight">Dapatkan Diskon hingga 6%</h3>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic max-w-sm">Nikmati potongan biaya 3-6% maksimal senilai 20 USDC untuk setiap program pilihan.</p>
                    </div>

                    <div className="relative z-10 w-20 h-20 flex items-center justify-center shrink-0">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl scale-125 animate-pulse" />
                      <div className="w-16 h-12 bg-card rounded-xl border border-border flex items-center justify-center relative shadow-xl transform group-hover:rotate-6 transition-transform">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow">
                          <span className="text-[10px] font-black text-primary-foreground">%</span>
                        </div>
                        <div className="absolute -left-1.5 w-3 h-3 bg-muted rounded-full border border-border" />
                      </div>
                    </div>
                  </Card>

                  {/* CATEGORIES CARD */}
                  <Card className="rounded-[2rem] bg-card border border-border p-6 space-y-4">
                    <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest pl-1">Pilih Kategori</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {CATEGORIES.map((cat) => (
                        <button 
                          key={cat.id}
                          onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                          className={cn(
                            "flex items-center gap-3 bg-muted/40 hover:bg-muted/80 p-4 rounded-xl border transition-all active:scale-95 text-left group",
                            activeCategory === cat.id ? "border-primary bg-primary/5 text-primary" : "border-border/60 text-foreground"
                          )}
                        >
                          <cat.icon className={cn("w-5 h-5 shrink-0", activeCategory === cat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                          <span className="text-xs font-bold truncate">{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  {/* PRODUCTS GRID */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest">Produk Populer ({filteredProducts.length})</h3>
                    </div>

                    {isLoading ? (
                      <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {filteredProducts.map((p) => (
                          <Card 
                            key={p.id} 
                            onClick={() => router.push(`/checkout/${p.id}`)}
                            className="p-6 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group min-h-[160px]"
                          >
                            <div className="flex justify-between items-start">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-inner">
                                {p.category === "Infrastructure" ? <Layers className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                              </div>
                              <Badge className="bg-muted text-muted-foreground text-[8px] font-bold h-5 px-2 border-none">
                                {p.category}
                              </Badge>
                            </div>
                            <div className="space-y-2 mt-6">
                              <h4 className="text-sm font-black uppercase italic leading-none group-hover:text-primary transition-colors">{p.name}</h4>
                              <p className="text-xs font-black text-foreground italic leading-none">Rp {p.priceIdr?.toLocaleString()}</p>
                            </div>
                          </Card>
                        ))}
                        
                        {filteredProducts.length === 0 && (
                          <Card className="col-span-2 p-12 border-dashed border-2 border-border bg-transparent text-center space-y-4 rounded-[2.5rem]">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-xs font-black uppercase italic">Tidak Ada Produk</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed max-w-sm mx-auto italic">
                                Belum ada program mini yang terdaftar di bawah kategori ini untuk saat ini.
                              </p>
                            </div>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                  
                </div>

                {/* RIGHT COLUMN / SIDEBAR WIDGETS */}
                <div className="space-y-8">
                  
                  {/* FAVORIT WIDGET */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-6 shadow-sm space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <h3 className="text-sm font-black uppercase italic">Program Favorit</h3>
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                      Sukai program mini atau produk layanan digital dengan menandai ikon bintang untuk menyimpan jalan pintas cepat di dashboard Anda.
                    </p>
                  </Card>

                  {/* PROMO & AKTIVITAS */}
                  <Card className="rounded-[2.5rem] bg-card border border-border p-6 shadow-sm space-y-6">
                    <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest pl-1">Promo & Aktivitas</h3>
                    <div className="space-y-4">
                      
                      {/* HOT DEALS CARD */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 text-orange-500">
                            <TicketPercent className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black uppercase italic leading-none group-hover:text-orange-500 transition-colors">Hot Deals</p>
                              <Badge className="bg-rose-500/10 text-rose-500 text-[6px] font-black h-3.5 px-1 border-none uppercase">Hot</Badge>
                            </div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 block">Penawaran waktu terbatas</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>

                      {/* RUANG OBROLAN CARD */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-500">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase italic leading-none group-hover:text-blue-500 transition-colors">Ruang Obrolan</p>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 block">Koneksi diskusi finansial</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>

                    </div>
                  </Card>

                </div>

              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}

function SidebarItem({ icon: Icon, label, active = false, href }: any) {
  const router = useRouter();
  return (
    <div onClick={() => href !== "#" && router.push(href)} className={cn("flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all group relative", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
      <div className="flex items-center gap-3">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
        <span className="text-sm font-bold">{label}</span>
      </div>
      {active && <div className="w-1 h-5 bg-primary rounded-full absolute left-0 top-1/2 -translate-y-1/2" />}
    </div>
  );
}