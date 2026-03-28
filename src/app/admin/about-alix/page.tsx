
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ChevronLeft, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Pickaxe,
  Network,
  Coins,
  ArrowRightLeft,
  Building2,
  TrendingUp,
  Scale,
  Sparkles,
  ExternalLink,
  SearchCheck,
  Lock,
  Wallet,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Award,
  Gavel,
  History,
  FileCode
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
                Global Sovereign Asset • Institutional Grade V3
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight">
                Misi & Validasi <span className="text-primary">Koin ALX</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Verified Smart Contract
                </p>
                <Button 
                  onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')}
                  variant="link" 
                  className="p-0 h-auto text-primary font-black uppercase text-[10px] italic underline"
                >
                  View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-16">
          <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xl">
              <Award className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter">Ekonomi Baru: Standar ALX, Kekuatan AliBank</h2>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
                ALX adalah **Aset Kedaulatan Digital** resmi dari infrastruktur AliBank V3. Tidak seperti token spekulasi lainnya, setiap koin ALX yang diterbitkan secara riil didukung oleh agunan likuiditas pada cadangan kas AliBank. Smart Contract ALX mengotomatisasi distribusi bagi hasil dan mekanisme deflasi suplai untuk menjamin pertumbuhan nilai aset jangka panjang bagi pemegangnya di seluruh dunia.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <FileCode className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Verified Contract</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              ALX beroperasi pada Smart Contract V3 yang telah diaudit. Alamat kontrak {ALIX_CONTRACT} dapat diverifikasi secara publik di Mainnet Explorer.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Stabilitas Kas</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              Mekanisme cadangan likuiditas memastikan ALX memiliki volatilitas yang terukur dan dapat dikonversi menjadi USDT/IDR secara instan melalui node AliBank.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Network className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Global Liquidity</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              Kompatibilitas penuh dengan standar ERC-20 memungkinkan ALX diakui secara global di bursa desentralisasi (DEX) dan platform DeFi internasional.
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
                  <Badge className="bg-white/10 text-primary border-white/20 px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[8px]">Mainnet Architecture</Badge>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Protokol Likuiditas <span className="text-primary">Terpusat</span></h2>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg italic group-hover:scale-110 transition-transform">1</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Reserve Inflow</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Setiap dana yang masuk ke sistem perbankan secara otomatis menjadi agunan pendukung nilai ALX.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg italic group-hover:scale-110 transition-transform">2</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">Sovereign Scarcity</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Algoritma "Smart Burn" menghapus suplai secara permanen berdasarkan volume transaksi marketplace AliBank V3.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5 group">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg italic group-hover:scale-110 transition-transform">3</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic tracking-widest">On-Chain Dividend</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Pemegang ALX menerima hak likuiditas prioritas dan bagi hasil dari ekosistem digital AliBank secara otomatis.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 backdrop-blur-3xl relative shadow-inner">
                <div className="absolute -top-6 -right-6">
                  <div className="bg-primary text-white p-4 rounded-3xl shadow-2xl animate-bounce">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Institutional Verification</p>
                    <Badge className="bg-green-600 text-white text-[7px] font-black uppercase">REAL-TIME ACTIVE</Badge>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/20 flex gap-4">
                    <SearchCheck className="w-6 h-6 text-green-500 shrink-0" />
                    <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                      Kepercayaan dibangun melalui bukti nyata. Koin ALX bukan sekadar angka di aplikasi, melainkan entitas kriptografi yang terdaftar secara sah pada World Ledger 2026.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Contract Address (ETH)</span>
                      <span className="text-[10px] font-mono text-primary font-bold">{ALIX_CONTRACT.slice(0, 10)}...{ALIX_CONTRACT.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Standard Protocol</span>
                      <span className="text-[10px] font-bold text-white italic">ERC-20 (Institutional)</span>
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
            <Building2 className="w-10 h-10" />
          </div>
          <div className="space-y-4 max-w-3xl mx-auto">
            <h3 className="text-3xl font-black text-accent uppercase italic tracking-tighter">Komitmen Legalitas Global</h3>
            <p className="text-[13px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
              AliBank menjamin bahwa koin ALX adalah instrumen keuangan digital yang sah di bawah yurisdiksi infrastruktur blockchain mandiri kami. Kami membangun ALX untuk menjadi pilar utama ekonomi DeFi dunia, dengan transparansi penuh dan keamanan tingkat perbankan internasional.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Legal</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">On-Chain</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Verified</Badge>
          </div>
        </section>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter">AliBank V3 Global Node • Verified Ledger 2026</p>
          </div>
          <div className="flex justify-center gap-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Network Uptime: 100%</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <SearchCheck className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Audit Status: Passed</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
