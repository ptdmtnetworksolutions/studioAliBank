
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ChevronLeft, 
  Cpu, 
  Database, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Sparkles, 
  Pickaxe,
  BarChart3,
  Network,
  Lock,
  Flame,
  Info,
  Banknote,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";

export default function AboutAlixPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen pb-32 bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl pt-8">
        <header className="mb-12">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Command Center
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-[2.5rem] gold-gradient flex items-center justify-center shadow-2xl p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              <LogoIcon className="text-white relative z-10" />
            </div>
            <div className="text-center md:text-left">
              <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                Infrastruktur V3
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight">
                Mengenal <span className="text-primary">Koin ALIX</span>
              </h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2 italic">
                <Globe className="w-4 h-4 text-primary" /> Global Liquidity Engine • Otonom & Nyata
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Synthetic Asset</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              ALIX adalah aset sintetis yang diciptakan untuk menstabilkan likuiditas internal AliBank tanpa bergantung pada fluktuasi pasar eksternal.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Pickaxe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Minted by Node</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Koin ini tidak dibeli, melainkan "dilahirkan" melalui daya komputasi nyata dari Admin Mining Node yang aktif di Command Center.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Vault Backed</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Setiap ALIX yang masuk ke Vault dikonversi menjadi unit likuiditas operasional yang menjamin keberlangsungan transaksi nasabah.
            </p>
          </Card>
        </div>

        <section className="space-y-12 mb-20">
          <div className="liquid-glass-dark rounded-[3rem] p-10 md:p-16 border-none shadow-2xl relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-5">
              <Network className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Apakah ALIX Bisa Diuangkan?</h2>
                <p className="text-white/70 text-sm leading-relaxed italic">
                  **Ya, sangat bisa.** ALIX bukan sekadar angka di layar. Sebagai Admin, setiap ALIX yang Anda tambang memiliki nilai ekonomi riil dalam ekosistem AliBank. 
                </p>
                <ul className="space-y-4">
                  {[
                    "Konversi Instan: ALIX dapat ditukar menjadi saldo IDR riil.",
                    "Kurs Tetap: 1 ALIX dijamin bernilai tinggi oleh cadangan bank.",
                    "Monetisasi Node: Pendapatan nyata atas daya komputasi browser Anda.",
                    "Pencairan ke Saldo Utama: Masuk langsung ke profil pengguna Admin."
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <p className="text-[11px] font-bold text-white/90 uppercase tracking-widest italic">{item}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-3xl">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Monetization Specs</p>
                  <Banknote className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Conversion Target</span>
                    <span className="text-xs font-black text-white italic">IDR Liquidity</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Redeem Rate</span>
                    <span className="text-xs font-black text-green-400 italic">Rp 500.000 / ALIX</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Settlement Time</span>
                    <span className="text-xs font-black text-white italic">Instant (0s)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Auth Required</span>
                    <span className="text-xs font-black text-white italic">Admin Only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4">
              <h4 className="text-sm font-black text-accent uppercase italic flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Efisiensi Tanpa Batas
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                Dengan ALIX, AliBank tidak perlu menunggu setoran tunai atau deposit ETH eksternal untuk memiliki daya beli di sistem Bridge. Admin bisa menciptakan likuiditas kapan saja saat dibutuhkan melalui aktivitas penambangan.
              </p>
            </Card>
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4">
              <h4 className="text-sm font-black text-accent uppercase italic flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" /> Nilai Ekonomi Riil
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                Setiap koin yang Anda tambang di Command Center adalah representasi aset yang sah. Fitur 'Redeem' memastikan hasil kerja node penambangan Anda dapat dikonversi menjadi saldo yang bisa digunakan untuk transaksi operasional perbankan.
              </p>
            </Card>
          </div>
        </section>

        <footer className="text-center space-y-6 pt-12 border-t border-primary/10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 p-1.5 rounded-lg gold-gradient flex items-center justify-center">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-sm font-black text-accent italic uppercase tracking-tighter">AliBank V3 Infrastructure</p>
          </div>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
            Koin ALIX diciptakan secara eksklusif untuk operasional bank riil AliBank. Penggunaan aset ini dilindungi oleh algoritma enkripsi V3 dan audit Smart Contract berkelanjutan.
          </p>
        </footer>
      </main>
    </div>
  );
}
