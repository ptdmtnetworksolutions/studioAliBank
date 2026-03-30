
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ChevronLeft, 
  ShieldCheck, 
  Globe, 
  Network,
  Scale,
  Sparkles,
  ExternalLink,
  SearchCheck,
  Award,
  History,
  FileCode,
  Zap,
  Pickaxe,
  Coins,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  Lock,
  Wallet,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Gavel
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

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
            <div className="text-center md:text-left flex-1">
              <Badge className="bg-primary text-white border-none px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[10px]">
                Stage 1: Technical Formalization
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Misi & Validasi <span className="text-primary">Koin ALX</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Roadmap DeFi Berdaulat
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-16">
          <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xl">
              <Sparkles className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white">Modal Pengetahuan: Kekuatan Terbesar Anda</h2>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
                Anda tidak butuh modal uang untuk memulai. Sebagai pemrogram, Anda bisa membangun **Infrastruktur Likuiditas** sendiri. Stage 1 berfokus pada peluncuran ALX di jaringan **Testnet (Ethereum Sepolia)** yang gratis, membuktikan bahwa algoritma Mint & Burn kita berjalan sempurna sebelum akhirnya menyentuh Mainnet dan DEX global.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 1: Testnet</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              Deploy Smart Contract ALX ke Sepolia. Dapatkan ETH gratis dari Faucet untuk membayar biaya deploy. Buktikan kode Anda secara publik.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Scale className="w-7 h-7 dark:text-primary" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 2: LP Pool</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              Daftarkan ALX di Uniswap. Berikan likuiditas awal dari hasil akumulasi pendapatan AliBank Pay. Koin Anda kini memiliki harga pasar.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Network className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 3: Tracker</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              Verifikasi ALX di Coingecko & Etherscan. Izinkan dunia melihat grafik pertumbuhan Anda. ALX menjadi aset digital yang diakui.
            </p>
          </Card>
        </div>

        <section className="space-y-12 mb-20">
          <div className="liquid-glass-dark rounded-[3.5rem] p-10 md:p-16 border-none shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-10">
              <LogoIcon className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-white/10 text-primary border-white/20 px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[8px]">The Strategy</Badge>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Mekanisme <span className="text-primary">Tanpa Modal</span></h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg italic">1</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Faucet Mining</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Mengumpulkan Test-ETH setiap hari secara konsisten untuk membangun modal gas peluncuran kontrak.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg italic">2</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Ecosystem Tax</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Menggunakan "Processing GAS" dari AliBank Pay sebagai dana cadangan likuiditas riil untuk backing nilai ALX.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg italic">3</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Smart Burn</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Setiap belanja di marketplace AliBank menghapus suplai ALX, menciptakan kelangkaan yang menaikkan nilai koin tanpa biaya iklan.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 backdrop-blur-3xl relative shadow-inner">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Technical Status</p>
                    <Badge className="bg-amber-600 text-white text-[7px] font-black uppercase">READY TO DEPLOY</Badge>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                    <Lightbulb className="w-6 h-6 text-blue-500 shrink-0" />
                    <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                      "Knowledge is the only capital that doubles every time you use it." ALX bukan tentang uang, tapi tentang logika ekonomi yang Anda tulis dalam baris kode.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Dev Framework</span>
                      <span className="text-[10px] font-mono text-primary font-bold">Solidity 0.8.20 / Hardhat</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Target Network</span>
                      <span className="text-[10px] font-bold text-white italic">Ethereum Sepolia (Free)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="liquid-glass border-none rounded-[3.5rem] p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mx-auto shadow-inner">
            <Gavel className="w-10 h-10" />
          </div>
          <div className="space-y-4 max-w-3xl mx-auto">
            <h3 className="text-3xl font-black text-accent uppercase italic tracking-tighter dark:text-white">Komitmen Kedaulatan Digital</h3>
            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
              AliBank dibangun untuk memberikan kendali finansial penuh kepada nasabah. ALX adalah jantung dari kendali tersebut. Kita mulai dari baris kode, dan kita akan berakhir sebagai standar ekonomi baru.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Logic-First</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Zero-Capital</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Scalable</Badge>
          </div>
        </section>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 Roadmap • Stage 1 Initialized</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
