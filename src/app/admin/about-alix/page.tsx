
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
  Code2,
  QrCode,
  Info,
  Flame,
  Cpu,
  Target,
  BarChart3,
  Rocket,
  Users,
  Layers,
  TrendingDown
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
const ALX_TOKEN_CONTRACT = "0x... (Menunggu Deployment)";

const ALX_TOKEN_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title AlixCoin (ALX) - Institutional Grade V3
 * @dev Implementasi resmi Koin AliBank dengan standar keamanan internasional.
 */
contract AlixCoin is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    constructor(address initialOwner)
        ERC20("Alix Coin", "ALX")
        Ownable(initialOwner)
        ERC20Permit("Alix Coin")
    {
        // Mencetak suplai awal (1 Juta ALX) ke dompet pemilik resmi
        _mint(initialOwner, 1000000 * 10 ** decimals());
    }

    function pause() public onlyOwner { _pause(); }
    function unpause() public onlyOwner { _unpause(); }
    function mint(address to, uint256 amount) public onlyOwner { _mint(to, amount); }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
}`;

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  const copyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `Kode ${name} Disalin`, description: `Smart Contract ${name} siap dideploy.` });
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
                ZERO UPFRONT STRATEGY ACTIVE
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Capital <span className="text-primary">Generation Hub</span>
              </h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic mt-4 justify-center md:justify-start">
                <ShieldCheck className="w-4 h-4 text-primary" /> Internal Sale Protocol V3.2
              </p>
            </div>
          </div>
        </header>

        <Tabs defaultValue="strategy" className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="liquid-glass border-primary/10 rounded-2xl h-16 p-1.5 shadow-xl overflow-x-auto no-scrollbar">
              <TabsTrigger value="strategy" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Rocket className="w-4 h-4 mr-2" /> Launch Strategy
              </TabsTrigger>
              <TabsTrigger value="token" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Coins className="w-4 h-4 mr-2" /> Source Code
              </TabsTrigger>
              <TabsTrigger value="pricing" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Calculator className="w-4 h-4 mr-2" /> Pricing Logic
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="strategy" className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 shadow-2xl bg-primary/5">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase italic italic tracking-tight">Phase 1: Internal Accumulation</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase italic">
                  Jual ALX langsung di aplikasi AliBank kepada nasabah. Dana IDR yang terkumpul dari nasabah adalah modal nyata Anda untuk membeli USDT di masa depan.
                </p>
                <div className="p-6 rounded-2xl bg-background border border-primary/10 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span>Target Internal</span>
                    <span className="text-primary">Rp 194.000 / ALX</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span>Upfront Cost</span>
                    <span className="text-green-600">ZERO (Rp 0)</span>
                  </div>
                </div>
              </Card>

              <Card className="liquid-glass border-none rounded-[3rem] p-10 space-y-6 shadow-2xl bg-accent/5">
                <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-inner">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase italic italic tracking-tight">Phase 2: Global Listing</h3>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase italic">
                  Setelah kas internal terkumpul (misal Rp 20 Juta), gunakan dana tersebut untuk mengisi likuiditas di Uniswap. ALX resmi memiliki harga publik global.
                </p>
                <div className="p-6 rounded-2xl bg-background border border-accent/10 space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span>Platform</span>
                    <span className="text-accent">Uniswap V3</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span>Pairing</span>
                    <span className="text-accent">ALX / USDT</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="liquid-glass-dark rounded-[3.5rem] p-12 text-white space-y-8 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 gold-gradient opacity-5" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-lg"><Zap className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">The Master Plan</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {[
                  { step: "01", title: "Deploy Token", desc: "Luncurkan kontrak ALX di Mainnet (Hanya butuh Gas Fee)." },
                  { step: "02", title: "Internal Sale", desc: "Aktifkan menu 'Convert' di aplikasi. Nasabah mulai beli ALX." },
                  { step: "03", title: "Capital Swap", desc: "Konversi IDR hasil penjualan menjadi USDT modal Pool." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <span className="text-primary font-black italic">{item.step}</span>
                    <h4 className="font-black uppercase text-sm italic">{item.title}</h4>
                    <p className="text-[10px] text-white/50 uppercase leading-relaxed italic">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="token" className="space-y-8 animate-in fade-in duration-500">
            <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Cpu className="w-32 h-32 text-primary" /></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Protocol ALX V3.0 (Institutional)</Badge>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">ALX Smart Contract</h2>
                  </div>
                  <Button 
                    onClick={() => copyCode(ALX_TOKEN_CODE, "Alix Token")}
                    className="h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold gap-2 px-6"
                  >
                    <Copy className="w-4 h-4" /> Copy Code
                  </Button>
                </div>
                <div className="bg-black/40 rounded-2xl border border-white/5 p-6 overflow-hidden">
                  <pre className="text-[10px] font-mono text-primary/80 leading-relaxed overflow-x-auto no-scrollbar">
                    {ALX_TOKEN_CODE}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-8 animate-in fade-in duration-500">
            <header className="text-center max-w-2xl mx-auto space-y-4">
              <Badge className="gold-gradient text-white font-black uppercase text-[9px] px-6 py-1.5 rounded-full">Pricing Architecture</Badge>
              <h2 className="text-4xl font-black text-accent dark:text-white uppercase italic tracking-tighter">Value Stabilization</h2>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Anchor</p>
                <p className="text-3xl font-black text-accent dark:text-white italic tracking-tighter">$ 12.24</p>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed italic">Harga dasar global yang ditetapkan di sistem AliBank untuk menjaga prestise koin.</p>
              </Card>
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Local Exchange Rate</p>
                <p className="text-3xl font-black text-primary italic tracking-tighter">Rp 194.004</p>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed italic">Kurs konversi IDR saat nasabah membeli ALX secara internal di aplikasi.</p>
              </Card>
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 shadow-xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Target Liquidity</p>
                <p className="text-3xl font-black text-green-600 italic tracking-tighter">1 : 12.24</p>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed italic">Rasio wajib antara ALX dan USDT saat nanti membuka kolam likuiditas di Uniswap.</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 • Zero Upfront Capital Protocol</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
