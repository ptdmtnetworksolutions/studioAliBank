
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
  Gavel,
  CheckCircle2,
  Calculator,
  ArrowRight,
  Copy,
  Code2
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

const ALX_TOKEN_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AlixCoin
 * @dev Token resmi AliBank (ALX) berbasis ERC-20.
 * Mendukung mekanisme Mint & Burn untuk kontrol ekonomi berdaulat.
 */
contract AlixCoin is ERC20, ERC20Burnable, Ownable {
    constructor(address initialOwner)
        ERC20("Alix Coin", "ALX")
        Ownable(initialOwner)
    {
        // Mencetak suplai awal (1 Juta ALX) ke dompet pemilik
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    /**
     * @dev Menambah suplai koin (Hanya Pemilik).
     * Terhubung dengan tombol "Mint" di AliBank Command Center.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`;

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(ALX_TOKEN_CODE);
    toast({ title: "Kode Disalin", description: "Smart Contract Koin ALX siap ditempel di Remix IDE." });
  };

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
              <Badge className="bg-green-600 text-white border-none px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[10px] animate-pulse">
                MAINNET LIVE: VERIFIED
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Misi & Validasi <span className="text-primary">Koin ALX</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <ShieldCheck className="w-4 h-4 text-primary" /> AliBank Central Vault V3
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-16">
          <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white">Fondasi Terverifikasi: Transparansi On-Chain</h2>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
                Anda telah berhasil melewati hambatan teknis terbesar. Smart Contract AliBank kini aktif di jaringan **Ethereum Mainnet**. Ini bukan sekadar kode, melainkan janji transparansi kepada nasabah bahwa setiap koin ALX didukung oleh keamanan tingkat perbankan global.
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40 border-t-4 border-green-500">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 1: Verified</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              DONE: Central Vault V3 sudah aktif di Mainnet. Fondasi likuiditas telah terbentuk dan terverifikasi secara publik di Etherscan.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40 border-t-4 border-primary">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Scale className="w-7 h-7 dark:text-primary" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 2: LP Pool</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              NEXT: Integrasi token utilitas ke Uniswap. Membangun likuiditas pasar agar ALX memiliki harga beli/jual yang diakui DeFi global.
            </p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-4 shadow-xl hover:-translate-y-2 transition-transform duration-500 bg-white/40 dark:bg-card/40">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Network className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-accent uppercase italic tracking-tighter dark:text-white">Stage 3: Tracker</h3>
            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed italic uppercase">
              FUTURE: Verifikasi di Coingecko & CoinMarketCap. Menjadikan ALX aset digital resmi yang bisa dipantau seluruh investor dunia.
            </p>
          </Card>
        </div>

        {/* NEW SECTION: SMART CONTRACT SOURCE CODE */}
        <section className="mb-16">
          <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Code2 className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Technical Asset</Badge>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Source Code Koin ALX (ERC-20)</h2>
                </div>
                <Button 
                  onClick={copyCode}
                  className="h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold gap-2 px-6"
                >
                  <Copy className="w-4 h-4" /> Copy Solidity Code
                </Button>
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/5 p-6 overflow-hidden">
                <pre className="text-[10px] font-mono text-primary/80 leading-relaxed overflow-x-auto no-scrollbar">
                  {ALX_TOKEN_CODE}
                </pre>
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                <Lightbulb className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                  Gunakan kode di atas pada <a href="https://remix.ethereum.org" target="_blank" className="text-primary underline">Remix IDE</a>. Pastikan Anda menyetel compiler ke versi 0.8.20 dan menyertakan library OpenZeppelin. Ini adalah langkah teknis terakhir sebelum ALX siap di-listing di Uniswap.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calculator className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px]">Technical Math</Badge>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Kalkulasi Likuiditas Stage 2</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-xs font-medium text-white/70 leading-relaxed italic uppercase">
                    Untuk meluncurkan ALX di Uniswap dengan harga pembukaan **$12.24**, Anda harus menyetor aset dengan rasio **1 ALX : 12.24 USDT**.
                  </p>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Rumus Penetapan Harga</p>
                    <div className="flex items-center justify-center gap-4 py-4 bg-black/20 rounded-xl font-mono text-xl text-white font-bold">
                      <span>USDT</span>
                      <span className="text-primary">/</span>
                      <span>ALX</span>
                      <span className="text-primary">=</span>
                      <span>12.24</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Simulasi Deployment</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Suplai Kolam ALX</span>
                        <span className="text-white">10.000 ALX</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Pasangan Likuiditas</span>
                        <span className="text-primary">122.400 USDT</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-white/40 uppercase">Initial Price</span>
                        <span className="text-lg font-black text-green-400 italic">$ 12.24</span>
                      </div>
                    </div>
                  </div>
                  <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase italic text-[10px] border border-white/10">
                    Unduh Dokumen Integrasi Uniswap
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-12 mb-20">
          <div className="liquid-glass-dark rounded-[3.5rem] p-10 md:p-16 border-none shadow-[0_50px_100px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute -right-20 -bottom-20 opacity-10">
              <LogoIcon className="w-96 h-96" />
            </div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-white/10 text-primary border-white/20 px-4 py-1 mb-4 rounded-full font-black uppercase tracking-widest text-[8px]">On-Chain Data</Badge>
                  <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">Identitas <span className="text-primary">Mainnet</span></h2>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-3">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Smart Contract Address</p>
                    <div className="flex items-center justify-between gap-4">
                      <code className="text-[11px] font-mono text-primary break-all font-bold">{ALIX_CONTRACT}</code>
                      <Button variant="ghost" size="icon" className="text-white/40 shrink-0" onClick={() => window.open(`https://etherscan.io/address/${ALIX_CONTRACT}`, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-5">
                      <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-black text-white uppercase italic tracking-widest">Security Audited V3</p>
                        <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Menggunakan pola ReentrancyGuard untuk mencegah eksploitasi dana di brankas pusat.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-5">
                      <Lock className="w-6 h-6 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-black text-white uppercase italic tracking-widest">Sovereign Control</p>
                        <p className="text-[10px] text-white/50 italic uppercase tracking-wider leading-relaxed mt-1">Kontrak mendukung pemindahan kepemilikan (Transfer Ownership) untuk transisi tata kelola di masa depan.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 space-y-8 backdrop-blur-3xl relative shadow-inner">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Execution Protocol</p>
                    <Badge className="bg-green-600 text-white text-[7px] font-black uppercase">CONTRACT VERIFIED</Badge>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                    <Lightbulb className="w-6 h-6 text-blue-500 shrink-0" />
                    <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                      "Real value is backed by real code." Anda tidak lagi berencana, Anda sedang mengeksekusi. Fondasi Ethereum ini adalah jangkar nilai bagi seluruh ekosistem ALX.
                    </p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Solidity Version</span>
                      <span className="text-[10px] font-mono text-primary font-bold">0.8.20</span>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/10 pb-2">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Network</span>
                      <span className="text-[10px] font-bold text-white italic">Ethereum Mainnet</span>
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
              AliBank dibangun untuk memberikan kendali finansial penuh kepada nasabah. ALX adalah jantung dari kendali tersebut. Kita telah mulai dari baris kode yang nyata di Mainnet, dan kita akan berakhir sebagai standar ekonomi baru.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Mainnet-Ready</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Audited</Badge>
            <Badge className="bg-accent text-white px-6 py-2 rounded-xl font-black uppercase text-[9px] tracking-widest italic shadow-lg">Scalable</Badge>
          </div>
        </section>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 Infrastructure • Mainnet Node Online</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
