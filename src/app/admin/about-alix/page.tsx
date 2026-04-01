
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
  Cpu
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

/**
 * @title Alix Token (ALX) - Official AliBank Sovereign Asset
 * @dev Standar ERC-20 dengan fitur Minting & Burning terkendali.
 * Seluruh sirkulasi ALX didukung oleh cadangan likuiditas di Brankas Pusat.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract AlixToken is IERC20 {
    string public name = "Alix Coin";
    string public symbol = "ALX";
    uint8 public decimals = 18;
    uint256 private _totalSupply;
    address public owner;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    constructor() {
        owner = msg.sender;
        // Initial Supply: 1.000.000 ALX
        _mint(msg.sender, 1000000 * 10**uint256(decimals));
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Hanya otoritas AliBank");
        _;
    }

    function totalSupply() public view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view override returns (uint256) {
        return _balances[account];
    }

    function transfer(address recipient, uint256 amount) public override returns (bool) {
        _transfer(msg.sender, recipient, amount);
        return true;
    }

    function allowance(address ownerAddr, address spender) public view override returns (uint256) {
        return _allowances[ownerAddr][spender];
    }

    function approve(address spender, uint256 amount) public override returns (bool) {
        _approve(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public override returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, msg.sender, _allowances[sender][msg.sender] - amount);
        return true;
    }

    /**
     * @dev Fungsi Otoritas: Mencetak ALX baru berdasarkan injeksi likuiditas.
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    /**
     * @dev Fungsi Otoritas: Membakar ALX untuk menjaga kelangkaan aset.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) internal {
        require(sender != address(0), "Transfer dari alamat nol");
        require(recipient != address(0), "Transfer ke alamat nol");
        _balances[sender] -= amount;
        _balances[recipient] += amount;
        emit Transfer(sender, recipient, amount);
    }

    function _mint(address account, uint256 amount) internal {
        _totalSupply += amount;
        _balances[account] += amount;
        emit Transfer(address(0), account, amount);
        emit Mint(account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        _balances[account] -= amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
        emit Burn(account, amount);
    }

    function _approve(address ownerAddr, address spender, uint256 amount) internal {
        _allowances[ownerAddr][spender] = amount;
        emit Approval(ownerAddr, spender, amount);
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
            <TabsList className="liquid-glass border-primary/10 rounded-2xl h-16 p-1.5 shadow-xl">
              <TabsTrigger value="token" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Coins className="w-4 h-4 mr-2" /> Alix Token (ALX)
              </TabsTrigger>
              <TabsTrigger value="vault" className="rounded-xl px-10 font-black uppercase text-[11px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">
                <Lock className="w-4 h-4 mr-2" /> Central Vault
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="token" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
            {/* TOKEN INFO */}
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

            {/* TOKEN CODE */}
            <section>
              <div className="liquid-glass-dark rounded-[3rem] p-12 border-none shadow-2xl space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cpu className="w-32 h-32 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2">Protocol ALX V1.0</Badge>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">ALX Token Source Code</h2>
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
                      PENTING: Gunakan Compiler **0.8.20** atau lebih tinggi di Remix IDE. Setuju untuk mencetak 1.000.000 ALX ke alamat deployer Anda sebagai suplai awal kedaulatan.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="vault" className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
            {/* VAULT INFO */}
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

            {/* VAULT CODE */}
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
                    Koin ALX bertindak sebagai unit hitung digital yang mewakili nilai likuiditas di Brankas Pusat. Setiap kali admin melakukan **Minting**, itu harus didasarkan pada penambahan dana riil (USDT/ETH) ke dalam Brankas.
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
