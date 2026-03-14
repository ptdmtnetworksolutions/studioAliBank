
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
  ExternalLink
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
                Infrastruktur V3 • Hybrid Liquidity
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight">
                Mengenal <span className="text-primary">Koin ALIX</span>
              </h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-2 italic">
                <Globe className="w-4 h-4 text-primary" /> Autonomous ETH Creation • Mining Engine
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
              ALIX adalah aset sintetis otonom yang diciptakan langsung oleh AliBank melaui hashing daya komputasi. Ia berfungsi sebagai cadangan kas internal bank.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Pickaxe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Zero-Cost Minting</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Diciptakan dari nol melalui daya komputasi riil Admin Mining Node. Anda tidak perlu mengeluarkan saldo MetaMask untuk mendapatkan koin ALIX baru.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter">Mainnet Bridge</h3>
            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
              Setiap unit ALIX yang ditambang dapat dicairkan menjadi **ETH Nyata** di dompet MetaMask Anda melalui protokol jembatan likuiditas V3.
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
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Mengapa Etherscan Tidak Melihat Injeksi?</h2>
                <p className="text-white/70 text-sm leading-relaxed italic">
                  Saat Anda melakukan **"Inject ALIX"**, sistem menggunakan metode **Synthetic Injection** di database internal AliBank. Ini dilakukan agar penambahan likuiditas bersifat instan dan tanpa biaya Gas (Rp 0).
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">1</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">Internal Ledger</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider">Transaksi sintetis hanya dicatat di buku besar digital bank (Firestore) untuk efisiensi.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg">2</div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic">Zero Blockchain Load</p>
                      <p className="text-[10px] text-white/50 italic uppercase tracking-wider">Etherscan tidak mencatat ini karena tidak ada pemanggilan fungsi Smart Contract yang memotong saldo Anda.</p>
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
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Pencairan ke MetaMask</p>
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] text-white/60 leading-relaxed italic uppercase">Agar terekam di **Etherscan** dan masuk ke dompet **MetaMask**, Anda harus melakukan **Bridge Out**.</p>
                  <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Status On-Chain</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-white italic">Real-World Settlement</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="liquid-glass border-none rounded-[3rem] p-10 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-accent uppercase italic tracking-tighter">Cara Mencairkan ke MetaMask</h3>
          <p className="text-[12px] text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed italic">
            Setelah Anda memiliki saldo **Synthetic ETH** dari hasil mining ALIX, Anda dapat mengklik tombol **"Bridge to MetaMask"** di Command Center. Sistem akan memicu transaksi blockchain riil yang mengirimkan ETH dari kas Vault AliBank ke alamat dompet Anda. Transaksi inilah yang akan muncul di **Etherscan** sebagai penarikan dana nyata.
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
            Infrastruktur hibrida yang menggabungkan kecepatan Database internal dan keamanan Blockchain Ethereum Mainnet.
          </p>
        </footer>
      </main>
    </div>
  );
}
