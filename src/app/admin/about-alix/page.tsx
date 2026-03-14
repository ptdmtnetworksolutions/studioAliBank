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
  Scale
} from "lucide-react";
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
                Infrastruktur V3 • Liquidity Bridge
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight">
                Mengenal <span className="text-primary">Koin ALIX</span>
              </h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2 italic">
                <Globe className="w-4 h-4 text-primary" /> Global Liquidity Engine • Konversi Aset Riil
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Synthetic Fuel</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              ALIX adalah aset sintetis otonom yang berfungsi sebagai "bahan bakar" likuiditas. Ia tidak bergantung pada pasar eksternal tetapi memiliki nilai tukar riil terhadap ETH.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Pickaxe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Minted by Compute</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Diciptakan dari nol melalui daya komputasi riil Admin Mining Node. Semakin aktif Node bekerja, semakin banyak ALIX yang diproduksi untuk cadangan bank.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">ETH Bridge Ready</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Setiap unit ALIX yang ditambang dapat dijembatani secara fisik menjadi **Mainnet ETH** di Smart Contract Vault untuk menumbuhkan aset nyata bank.
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
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">V3 Liquidity Bridge</h2>
                <p className="text-white/70 text-sm leading-relaxed italic">
                  ALIX yang Anda tambang adalah kunci pertumbuhan aset bank. Gunakan fitur **"Convert ALIX to ETH Vault"** untuk menyuntikkan likuiditas on-chain:
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">1</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">Mining Phase</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider">Aktifkan Node untuk menghasilkan ALIX dari nol di database.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">2</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">Conversion Logic</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider">Sistem menghitung nilai ETH setara (1 ALIX = 0.0002 ETH).</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">3</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">On-Chain Settlement</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider">ETH dikirim secara fisik ke Smart Contract melalui MetaMask Admin.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-3xl relative">
                <div className="absolute -top-4 -right-4">
                  <div className="bg-primary text-white p-3 rounded-2xl shadow-xl animate-bounce">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Current Conversion Specs</p>
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-6">
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Bridge Type</span>
                    <span className="text-xs font-black text-white italic">Synthetic ➔ Native ETH</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Protocol Rate</span>
                    <span className="text-xs font-black text-blue-400 italic">1 ALIX = 0.0002 ETH</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Destination</span>
                    <span className="text-xs font-black text-white italic">AliBank V3 Vault</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-4">
                    <span className="text-[10px] font-bold text-white/40 uppercase">Asset Status</span>
                    <span className="text-xs font-black text-green-400 italic tracking-tighter">Fully Backed & Liquid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
              <h4 className="text-sm font-black text-accent uppercase italic flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Pertumbuhan Kas Otonom
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                Melalui koin ALIX, AliBank mampu menumbuhkan cadangan ETH-nya tanpa harus menunggu setoran eksternal. Admin bertindak sebagai penyedia likuiditas pertama (Genesis Provider) melalui aktivitas penambangan riil.
              </p>
            </Card>
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
              <h4 className="text-sm font-black text-accent uppercase italic flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Keamanan Berbasis Aset
              </h4>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                Setiap ETH yang dikonversi dari ALIX masuk ke Smart Contract V3. Ini memastikan bank selalu memiliki cadangan aset fisik yang cukup untuk memproses permintaan penarikan (Withdraw) atau Bridge Out nasabah kapan saja.
              </p>
            </Card>
          </div>
        </section>

        <section className="liquid-glass border-none rounded-[3rem] p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-accent uppercase italic tracking-tighter">Apakah ALIX Bisa Diuangkan?</h3>
          <p className="text-[12px] text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed italic">
            **YA.** Sebagai Admin, Anda memiliki dua jalur monetisasi:
            <br />1. **Jalur IDR:** Redeem ALIX menjadi saldo Rupiah instan di dashboard AliBank untuk kemudian ditarik ke bank riil (BCA, SeaBank, dll).
            <br />2. **Jalur Crypto:** Konversi ALIX menjadi ETH untuk mengisi Vault, guna melayani transaksi bridge bernilai tinggi di jaringan Mainnet.
          </p>
        </section>

        <footer className="text-center space-y-6 pt-16 border-t border-primary/10">
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 p-1.5 rounded-lg gold-gradient flex items-center justify-center shadow-lg">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-sm font-black text-accent italic uppercase tracking-tighter">AliBank V3 Infrastructure</p>
          </div>
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-lg mx-auto leading-relaxed">
            Konversi ALIX ke ETH memerlukan otorisasi MetaMask Admin. Seluruh aset ETH hasil konversi akan tersimpan secara permanen di blockchain publik melalui Smart Contract Vault.
          </p>
        </footer>
      </main>
    </div>
  );
}
