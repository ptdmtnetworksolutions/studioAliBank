
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
  LayoutGrid
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

const traders = [
  { id: 1, name: "你的那双眼还能看多远", badge: "Futures", roi: "+61.1%", sub: "ROI 7H", color: "bg-muted" },
  { id: 2, name: "abccan", badge: "Futures", roi: "+59.42%", sub: "ROI 7H", color: "bg-yellow-500/10" },
  { id: 3, name: "MasterTrader_Alpha", badge: "Futures", roi: "+58.21%", sub: "ROI 7H", color: "bg-blue-500/10" },
];

export default function CryptoMarketPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Grow");
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        {/* Secondary Tabs */}
        <div className="flex items-center justify-between border-b border-border px-1">
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {["Favorit", "Pasar", "Alpha", "Grow", "Data"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "py-2 text-sm font-black transition-all relative shrink-0",
                  activeTab === tab ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 space-y-8 overflow-y-auto no-scrollbar">
        {/* Hero Carousel */}
        <div className="relative">
          <Carousel setApi={setBannerApi} className="w-full">
            <CarouselContent>
              <CarouselItem>
                <div className="bg-muted/50 rounded-2xl p-6 flex items-center justify-between min-h-[140px] relative overflow-hidden border border-border/50">
                  <div className="space-y-3 max-w-[65%] relative z-10">
                    <h2 className="text-sm font-black text-foreground leading-tight">
                      Pinjam Koin untuk Berdagang guna Mendapatkan APY Tinggi
                    </h2>
                    <button className="text-[11px] font-black text-primary hover:underline">
                      Tampilkan Selengkapnya
                    </button>
                  </div>
                  <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl scale-125" />
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg relative z-10 border-2 border-background">
                      <Zap className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="absolute -right-2 top-0 w-6 h-6 bg-muted rounded-full border border-border" />
                  </div>
                </div>
              </CarouselItem>
              <CarouselItem>
                <div className="bg-muted/50 rounded-2xl p-6 flex items-center justify-between min-h-[140px] border border-border/50">
                  <div className="space-y-2">
                    <h2 className="text-sm font-black text-foreground leading-tight">Program Loyalitas AliBank V3</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Dapatkan Rewards Harian</p>
                  </div>
                  <Sparkles className="w-12 h-12 text-primary opacity-20" />
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-4">
            {[0, 1].map((i) => (
              <div key={i} className={cn("h-1 rounded-full transition-all duration-300", currentBanner === i ? "w-4 bg-foreground" : "w-1 bg-muted")} />
            ))}
          </div>
        </div>

        {/* Mulai Hasilkan Sekarang Juga */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-foreground">Mulai Hasilkan Sekarang Juga</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Left Big Card */}
            <div className="bg-card rounded-2xl p-5 border border-border flex flex-col justify-between relative overflow-hidden group active:scale-[0.98] transition-transform shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-sm font-black text-foreground italic tracking-tight">USDC</span>
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white p-1">
                  <LogoIcon />
                </div>
              </div>
              <div className="h-16 w-full my-4">
                <svg viewBox="0 0 100 40" className="w-full h-full opacity-30">
                  <path d="M0 35 Q 25 30, 50 20 T 100 5" fill="none" stroke="#16a34a" strokeWidth="2" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-black text-foreground italic tracking-tighter">5.73%</p>
                <p className="text-[10px] font-bold text-muted-foreground">APR Maks.</p>
              </div>
            </div>

            {/* Right Stacked Cards */}
            <div className="space-y-3">
              <div className="bg-card rounded-2xl p-4 border border-border flex justify-between items-center group active:scale-[0.98] transition-transform shadow-sm">
                <div>
                  <span className="text-xs font-black text-foreground italic tracking-tight">ETH</span>
                  <p className="text-base font-black text-foreground italic tracking-tighter mt-1">195.81%</p>
                  <p className="text-[9px] font-bold text-muted-foreground">APR Maks.</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white p-1">
                  <LogoIcon />
                </div>
              </div>
              <div className="bg-card rounded-2xl p-4 border border-border flex justify-between items-center group active:scale-[0.98] transition-transform shadow-sm">
                <div>
                  <span className="text-xs font-black text-foreground italic tracking-tight">SOL</span>
                  <p className="text-base font-black text-foreground italic tracking-tighter mt-1">93.7%</p>
                  <p className="text-[9px] font-bold text-muted-foreground">APR Maks.</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white p-1.5">
                  <LogoIcon className="text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pedagang Teratas */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black text-foreground">Pedagang Teratas yang Dapat Disalin</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
          </div>

          <div className="space-y-6">
            {traders.map((trader) => (
              <div key={trader.id} className="flex items-center justify-between group cursor-pointer active:bg-muted rounded-xl p-1 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shadow-sm", trader.color)}>
                    <UserIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground leading-tight">{trader.name}</p>
                    <Badge variant="outline" className="bg-muted text-[8px] font-black h-4 px-1.5 mt-1 border-none uppercase tracking-tighter">
                      {trader.badge}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-500 italic tracking-tighter">{trader.roi}</p>
                  <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">{trader.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Floating Action Button - Quick Convert */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => router.push('/crypto/convert')}
          className="w-12 h-12 bg-card rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary border border-border active:scale-90 transition-transform"
        >
          <div className="relative">
            <LayoutGrid className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
          </div>
        </button>
      </div>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
