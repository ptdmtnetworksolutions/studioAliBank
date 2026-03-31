
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

const VAULT_CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AliBank Central Vault V3 - Institutional Grade
 * @dev Brankas Utama AliBank untuk pengelolaan likuiditas multi-aset.
 * Fitur Utama:
 * - USDT Support: Menerima setoran USDT secara riil.
 * - Institutional Minimum: Batas setoran minimal 5.000.000 USDT.
 * - ReentrancyGuard: Perlindungan dari serangan rekursif pada dana besar.
 * - Multi-Sig Compatibility: Kontrol kepemilikan oleh dewan direksi AliBank.
 */
contract AliBankVault is Ownable, ReentrancyGuard {
    IERC20 public immutable usdt;
    
    // Minimal Pembayaran: 5.000.000 USDT (USDT menggunakan 6 desimal)
    uint256 public constant MIN_DEPOSIT = 5000000 * 10**6;

    event USDTDeposited(address indexed from, uint256 amount);
    event WithdrawalExecuted(address indexed to, uint256 amount, string asset);

    constructor(address _usdtAddress, address initialOwner) Ownable(initialOwner) {
        usdt = IERC20(_usdtAddress);
    }

    /**
     * @dev Menyetorkan USDT ke Brankas AliBank.
     * Harus memenuhi syarat minimal 5.000.000 USDT.
     */
    function depositUSDT(uint256 _amount) external nonReentrant {
        require(_amount >= MIN_DEPOSIT, "AliBank: Minimum deposit is 5,000,000 USDT");
        require(usdt.transferFrom(msg.sender, address(this), _amount), "Transfer Failed");
        
        emit USDTDeposited(msg.sender, _amount);
    }

    /**
     * @dev Menarik ETH dari brankas (Hanya Pemilik/Admin).
     */
    function withdrawETH(uint256 _amount) external onlyOwner nonReentrant {
        require(address(this).balance >= _amount, "Insufficient ETH Balance");
        payable(owner()).transfer(_amount);
        
        emit WithdrawalExecuted(owner(), _amount, "ETH");
    }

    /**
     * @dev Menarik USDT dari brankas (Hanya Pemilik/Admin).
     */
    function withdrawUSDT(uint256 _amount) external onlyOwner nonReentrant {
        require(usdt.balanceOf(address(this)) >= _amount, "Insufficient USDT Balance");
        require(usdt.transfer(owner(), _amount), "Transfer Failed");
        
        emit WithdrawalExecuted(owner(), _amount, "USDT");
    }

    /**
     * @dev Fungsi fallback untuk menerima ETH langsung.
     */
    receive() external payable {}
}`;

export default function AboutAlixPage() {
  const router = useRouter();
  const { toast } = useToast();

  const copyCode = () => {
    navigator.clipboard.writeText(VAULT_CONTRACT_CODE);
    toast({ title: "Kode Disalin", description: "Smart Contract Brankas AliBank V3 siap ditempel di Remix IDE." });
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
                VAULT V3: USDT ENABLED
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

        <section className="mb-16">
          <div className="liquid-glass border-none rounded-[3rem] p-10 bg-primary/5 flex items-center gap-8 flex-col md:flex-row shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-xl">
              <Coins className="w-12 h-12" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-black text-accent uppercase italic tracking-tighter dark:text-white">Standardisasi USDT Institusional</h2>
              <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic uppercase tracking-wider">
                Sesuai kebijakan kepatuhan AliBank V3, brankas pusat kini menerima setoran **USDT (Tether)** melalui jaringan Ethereum Mainnet. Batas setoran minimum ditetapkan pada **5.000.000 USDT** untuk memastikan likuiditas grade-perbankan yang stabil.
              </p>
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
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Central Vault V3</Badge>
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
                <AlertTriangle className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-[9px] text-white/70 italic leading-relaxed uppercase font-bold">
                  Peringatan: Setoran USDT di bawah **5.000.000** akan ditolak secara otomatis oleh mesin konsensus Smart Contract (Ali-Consensus Protocol). Pastikan dompet Anda telah melakukan "Approve" USDT ke alamat kontrak ini sebelum eksekusi.
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
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Kalkulasi USDT Minimum</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <p className="text-xs font-medium text-white/70 leading-relaxed italic uppercase">
                    Untuk menjamin stabilitas nilai ALX, setiap 1 unit koin yang dicetak harus didukung oleh minimal agunan USDT di brankas pusat.
                  </p>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Batas Setoran Minimum</p>
                    <div className="flex items-center justify-center gap-4 py-4 bg-black/20 rounded-xl font-mono text-xl text-white font-bold">
                      <span className="text-primary">$</span>
                      <span>5.000.000</span>
                      <span className="text-xs text-white/40">USDT</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Metrik Kepatuhan</p>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Aset yang Diterima</span>
                        <span className="text-white">USDT (ERC-20)</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase">
                        <span className="text-white/60">Minimum Threshold</span>
                        <span className="text-primary">5.000.000,00</span>
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
