
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ChevronLeft, 
  ShieldCheck, 
  Globe, 
  Coins,
  Zap,
  Calculator,
  Copy,
  Code2,
  Rocket,
  Cpu,
  Lock,
  TrendingUp,
  Database,
  Flame,
  UserPlus,
  Trophy,
  Activity
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl pt-8">
        <header className="mb-12">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Pusat Kendali
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[2.5rem] gold-gradient flex items-center justify-center shadow-2xl p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <LogoIcon className="text-white relative z-10" />
            </div>
            <div className="text-center md:text-left flex-1">
              <Badge className="bg-primary text-primary-foreground border-none px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                ALX V3 PROTOCOL - UTILITY MODE
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Alix Coin <span className="text-primary">Ecosystem</span>
              </h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic mt-4 justify-center md:justify-start">
                <ShieldCheck className="w-4 h-4 text-primary" /> Strategi Utilitas & Dukungan Harga Riil
              </p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="utility" className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="liquid-glass border-primary/10 rounded-2xl h-16 p-1.5 shadow-xl overflow-x-auto no-scrollbar">
              <TabsTrigger value="utility" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Zap className="w-4 h-4 mr-2" /> Core Utility
              </TabsTrigger>
              <TabsTrigger value="support" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Flame className="w-4 h-4 mr-2" /> Price Support
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Rocket className="w-4 h-4 mr-2" /> Growth Roadmap
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="utility" className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UtilityCard 
                icon={Activity} 
                title="Exchange Fee Token" 
                desc="Demand organik diciptakan dengan menjadikan ALX sebagai mata uang utama untuk membayar biaya transaksi di AliBank Exchange."
              />
              <UtilityCard 
                icon={Trophy} 
                title="Staking Rewards" 
                desc="Kunci aset ALX Anda untuk mendapatkan persentase keuntungan langsung dari kolam biaya transaksi harian AliBank."
              />
              <UtilityCard 
                icon={UserPlus} 
                title="Tier Membership" 
                desc="Hold ALX dalam jumlah tertentu untuk menaikkan level akun Anda, membuka diskon biaya lebih besar dan akses VIP."
              />
              <UtilityCard 
                icon={Globe} 
                title="Project Listing" 
                desc="Seluruh proyek blockchain baru yang ingin melantai di AliBank wajib membayar biaya listing menggunakan koin ALX."
              />
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-8 animate-in fade-in duration-500">
            <Card className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Flame className="w-32 h-32 text-primary" /></div>
              <div className="relative z-10 space-y-6">
                <Badge className="bg-rose-600 text-white font-black uppercase text-[8px] mb-2 tracking-[0.3em]">DEFLATIONARY ENGINE ACTIVE</Badge>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">20% Revenue Buyback & Burn</h2>
                <p className="text-white/70 text-lg leading-relaxed italic max-w-3xl">
                  AliBank berkomitmen menggunakan 20% dari total pendapatan operasional bursa setiap bulan untuk membeli kembali ALX dari pasar dan menghapusnya secara permanen dari sirkulasi. 
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black uppercase text-primary mb-2">Organic Demand</p>
                    <p className="text-xs font-medium text-white/60">Volume bursa naik = Permintaan ALX naik.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black uppercase text-primary mb-2">Scarcity Model</p>
                    <p className="text-xs font-medium text-white/60">Suplai berkurang seiring pertumbuhan sistem.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black uppercase text-primary mb-2">Value Growth</p>
                    <p className="text-xs font-medium text-white/60">Tekanan beli konstan dari kas cadangan bank.</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-8 animate-in fade-in duration-500">
            <header className="text-center max-w-2xl mx-auto space-y-4">
              <Badge className="gold-gradient text-white font-black uppercase text-[9px] px-6 py-1.5 rounded-full">Evolution Strategy</Badge>
              <h2 className="text-4xl font-black text-accent dark:text-white uppercase italic tracking-tighter">Listing & Scaling</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <Badge variant="outline" className="border-primary/20 text-primary">PHASE 1</Badge>
                <h4 className="text-lg font-black uppercase italic">Internal Accumulation</h4>
                <p className="text-[10px] text-muted-foreground uppercase leading-relaxed italic">Penjualan internal di aplikasi guna membangun cadangan kas untuk likuiditas bursa global.</p>
              </Card>
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <Badge variant="outline" className="border-accent/20 text-accent">PHASE 2</Badge>
                <h4 className="text-lg font-black uppercase italic">Global Listing</h4>
                <p className="text-[10px] text-muted-foreground uppercase leading-relaxed italic">Peluncuran di Uniswap V3 dengan harga awal $12.24 per ALX menggunakan modal dari Phase 1.</p>
              </Card>
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <Badge variant="outline" className="border-green-600/20 text-green-600">PHASE 3</Badge>
                <h4 className="text-lg font-black uppercase italic">Institutional Utility</h4>
                <p className="text-[10px] text-muted-foreground uppercase leading-relaxed italic">Eksekusi penuh Buyback & Burn 20% dari seluruh volume bursa untuk mendukung harga jangka panjang.</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 • Utility Driven Economy</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function UtilityCard({ icon: Icon, title, desc }: any) {
  return (
    <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-sm hover:scale-[1.02] transition-transform group">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-inner">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-base font-black uppercase italic tracking-tight">{title}</h4>
        <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic mt-2">{desc}</p>
      </div>
    </Card>
  );
}
