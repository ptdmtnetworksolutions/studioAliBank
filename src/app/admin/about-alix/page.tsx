
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
  BarChart3
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

const VAULT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AliBank Central Vault V3 - Multi-Asset & Institutional
 */
contract AliBankVault {
    address public owner;
    
    mapping(address => uint256) public ethBalances;
    bool private _locked;

    event ETHDeposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya pemilik AliBank");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "Keamanan: Transaksi sedang diproses");
        _locked = true;
        _;
        _locked = false;
    }

    function depositETH() public payable {
        require(msg.value > 0, "Minimal deposit 1 Wei");
        ethBalances[msg.sender] += msg.value;
        emit ETHDeposited(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) public onlyOwner nonReentrant {
        require(address(this).balance >= _amount, "Saldo brankas tidak cukup");
        payable(owner).transfer(_amount);
        emit Withdrawn(owner, _amount);
    }

    receive() external payable {
        depositETH();
    }
}`;

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  const copyCode = (code: string, name: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: `Kode ${name} Disalin`, description: `Smart Contract ${name} siap ditempel di Remix IDE.` });
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({ title: "Alamat Disalin", description: "Alamat infrastruktur siap digunakan di Wallet Luar." });
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
                INFRASTRUCTURE V3.2 LIVE
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Sovereign <span className="text-primary">Ecosystem Hub</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Centralized Security • Decentralized Assets
                </p>
              </div>
            </div>
          </div>
        </header>

        <Tabs defaultValue="token" className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="liquid-glass border-primary/10 rounded-2xl h-16 p-1.5 shadow-xl overflow-x-auto no-scrollbar">
              <TabsTrigger value="token" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white whitespace-nowrap">
                <Coins className="w-4 h-4 mr-2" /> Alix Token (ALX)
              </TabsTrigger>
              <TabsTrigger value="vault" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white whitespace-nowrap">
                <Lock className="w-4 h-4 mr-2" /> Central Vault
              </TabsTrigger>
              <TabsTrigger value="liquidity" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white whitespace-nowrap">
                <TrendingUp className="w-4 h-4 mr-2" /> Liquidity Strategy
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="token" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
            <section>
              <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
                <div className="w-24 h-24 rounded-[2rem] bg-background flex items-center justify-center text-primary shrink-0 shadow-xl border-4 border-primary/20">
                  <LogoIcon className="w-12 h-12" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white leading-none">Token Kedaulatan ALX</h2>
                    <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">Deploy koin ini di Remix IDE untuk mengaktifkan Ekonomi AliBank.</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="bg-black/10 dark:bg-white/5 p-4 rounded-xl font-mono text-[11px] break-all text-accent dark:text-white w-full border border-primary/10">
                      {ALX_TOKEN_CONTRACT}
                    </div>
                    <Button onClick={() => copyAddress(ALX_TOKEN_CONTRACT)} className="gold-gradient text-white font-black uppercase italic text-[10px] h-12 px-8 rounded-xl shrink-0">
                      <Copy className="w-4 h-4 mr-2" /> Salin Alamat
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[8px] uppercase">ERC-20 Standard</Badge>
                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[8px] uppercase">Mintable</Badge>
                    <Badge className="bg-rose-100 text-rose-600 border-none font-black text-[8px] uppercase">Burnable</Badge>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cpu className="w-32 h-32 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Protocol ALX V3.0 (Institutional)</Badge>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">ALX Institutional Source Code</h2>
                    </div>
                    <Button 
                      onClick={() => copyCode(ALX_TOKEN_CODE, "Alix Token")}
                      className="h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold gap-2 px-6"
                    >
                      <Copy className="w-4 h-4" /> Copy Token Code
                    </Button>
                  </div>

                  <div className="bg-black/40 rounded-2xl border border-white/5 p-6 overflow-hidden">
                    <pre className="text-[10px] font-mono text-primary/80 leading-relaxed overflow-x-auto no-scrollbar">
                      {ALX_TOKEN_CODE}
                    </pre>
                  </div>

                  <div className="mt-8 p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex gap-4">
                    <Flame className="w-6 h-6 text-orange-500 shrink-0" />
                    <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                      PENTING: Gunakan Compiler **0.8.24** atau lebih tinggi di Remix IDE. Kode ini menggunakan standar OpenZeppelin 5.0 terbaru.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="vault" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
            <section>
              <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
                <div className="w-24 h-24 rounded-[2rem] bg-background flex items-center justify-center text-primary shrink-0 shadow-xl border-4 border-primary/20">
                  <QrCode className="w-12 h-12" />
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white leading-none">Alamat Brankas Pusat</h2>
                    <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">Seluruh aset fisik AliBank diamankan di alamat kontrak ini.</p>
                  </div>
                  <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="bg-black/10 dark:bg-white/5 p-4 rounded-xl font-mono text-[11px] break-all text-accent dark:text-white w-full border border-primary/10">
                      {VAULT_CONTRACT}
                    </div>
                    <Button onClick={() => copyAddress(VAULT_CONTRACT)} className="gold-gradient text-white font-black uppercase italic text-[10px] h-12 px-8 rounded-xl shrink-0">
                      <Copy className="w-4 h-4 mr-2" /> Salin Alamat
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[8px] uppercase">Ethereum Mainnet</Badge>
                    <Badge className="bg-green-100 text-green-600 border-none font-black text-[8px] uppercase">Multi-Asset Support</Badge>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Code2 className="w-32 h-32 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Central Vault V3.1</Badge>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Vault Source Code</h2>
                    </div>
                    <Button 
                      onClick={() => copyCode(VAULT_CODE, "Vault Brankas")}
                      className="h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold gap-2 px-6"
                    >
                      <Copy className="w-4 h-4" /> Copy Vault Code
                    </Button>
                  </div>

                  <div className="bg-black/40 rounded-2xl border border-white/5 p-6 overflow-hidden">
                    <pre className="text-[10px] font-mono text-primary/80 leading-relaxed overflow-x-auto no-scrollbar">
                      {VAULT_CODE}
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="liquidity" className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <header className="text-center max-w-3xl mx-auto space-y-4">
              <Badge className="gold-gradient text-white font-black uppercase text-[9px] px-6 py-1.5 rounded-full">Stage 2: Global Listing</Badge>
              <h2 className="text-4xl font-black text-accent dark:text-white uppercase italic tracking-tighter">Strategi Likuiditas Uniswap</h2>
              <p className="text-xs font-medium text-muted-foreground uppercase leading-relaxed italic">
                Pelajari cara memberikan nilai nyata pada ALX melalui Uniswap Liquidity Pool.
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                    <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">Target Harga: $12.24</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic uppercase">
                  Agar harga pembukaan ALX di Uniswap sesuai dengan sistem AliBank ($12.24), Anda harus menggunakan rumus rasio tetap saat pembuatan Pool.
                </p>
                <div className="p-6 rounded-2xl bg-accent/5 border border-primary/10 space-y-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Formula Dasar</p>
                  <div className="bg-black/20 dark:bg-white/5 p-4 rounded-xl font-mono text-center text-lg font-bold">
                    Price = USDT / ALX
                  </div>
                </div>
              </Card>

              <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight">Kalkulator Modal</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase italic">
                    <span className="text-muted-foreground">Token ALX</span>
                    <span className="text-accent">1.000 ALX</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase italic">
                    <span className="text-muted-foreground">Modal USDT</span>
                    <span className="text-primary">12.240 USDT</span>
                  </div>
                  <div className="h-px bg-primary/10" />
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase italic">
                    <span className="text-muted-foreground">Token ALX</span>
                    <span className="text-accent">10.000 ALX</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-bold uppercase italic">
                    <span className="text-muted-foreground">Modal USDT</span>
                    <span className="text-primary">122.400 USDT</span>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground italic leading-relaxed font-bold uppercase">
                  Catatan: USDT adalah "uang nyata" yang menjamin likuiditas nasabah. Dana ini akan disimpan di Smart Contract Uniswap.
                </p>
              </Card>
            </div>

            <section className="liquid-glass-dark rounded-[3.5rem] p-12 text-white space-y-10 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 gold-gradient opacity-5" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-primary shadow-lg"><Sparkles className="w-8 h-8" /></div>
                <div>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tight leading-none">The Market Maker Protocol</h3>
                  <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-2">Menjadi Penyedia Likuiditas Pertama</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                <div className="space-y-4">
                  <div className="text-primary font-black text-2xl italic">01.</div>
                  <h4 className="font-black uppercase text-sm italic">Add Liquidity</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed uppercase">Buka Uniswap V2/V3, pilih pair ALX/USDT. Masukkan jumlah koin dan USDT sesuai rasio target harga.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-primary font-black text-2xl italic">02.</div>
                  <h4 className="font-black uppercase text-sm italic">Mint LP Tokens</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed uppercase">Uniswap akan memberikan Anda token LP sebagai bukti kepemilikan modal di kolam tersebut.</p>
                </div>
                <div className="space-y-4">
                  <div className="text-primary font-black text-2xl italic">03.</div>
                  <h4 className="font-black uppercase text-sm italic">Price Discovery</h4>
                  <p className="text-[10px] text-white/60 leading-relaxed uppercase">Saat orang mulai membeli ALX, USDT di kolam bertambah, dan harga ALX naik secara otomatis.</p>
                </div>
              </div>
              <div className="pt-8 border-t border-white/10 text-center relative z-10">
                <p className="text-[11px] font-bold text-white/40 uppercase italic tracking-widest">
                  ALIBANK LIQUIDITY ENGINE • POWERED BY UNISWAP V3 PROTOCOL
                </p>
              </div>
            </section>
          </TabsContent>
        </Tabs>

        <section className="mt-16">
          <div className="liquid-glass-dark rounded-[3.5rem] p-12 border-none shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calculator className="w-32 h-32 text-primary" />
            </div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px]">Economic Alignment</Badge>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Sinergi Token & Brankas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-xs font-medium text-white/70 leading-relaxed italic uppercase">
                    Koin ALX bertindak sebagai unit hitung digital yang mewakili nilai likuiditas di Brankas Pusat. Setiap kali admin melakukan **Minting**, itu harus didasarkan pada penambahan dana riil (USDT/ETH) ke dalam Brankas atau Pool.
                  </p>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Kesesuaian Aset</p>
                    <div className="flex items-center justify-center gap-4 py-4 bg-black/20 rounded-xl font-mono text-xl text-white font-bold">
                      <span className="text-primary">ALX</span>
                      <span>↔</span>
                      <span className="text-primary">VAULT</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Langkah Deployment</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">1. Salin Kode ALX</span>
                        <span className="text-primary">DONE</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">2. Tempel di Remix IDE</span>
                        <span className="text-white">PENDING</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">3. Compile & Deploy</span>
                        <span className="text-white">WAITING</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-white/40 uppercase">Status Operasional</span>
                        <span className="text-lg font-black text-orange-400 italic">READY</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center space-y-8 pt-20 border-t border-primary/10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 p-2 rounded-xl gold-gradient flex items-center justify-center shadow-2xl">
              <LogoIcon className="text-white" />
            </div>
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 Infrastructure • Tokenomics Engine</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
