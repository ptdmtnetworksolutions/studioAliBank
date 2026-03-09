
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Bitcoin, 
  Wallet, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Link as LinkIcon,
  RefreshCw,
  Info,
  ArrowDownRight,
  ChevronRight,
  Cpu,
  Settings,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Coins,
  TrendingUp,
  ArrowRightLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { BrowserProvider, formatEther, parseEther, Contract } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CONTRACT_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 _amount) public",
  "function balances(address) public view returns (uint256)",
  "function getContractBalance() public view returns (uint256)"
];

// Alamat Kontrak Resmi AliBank
const DEFAULT_CONTRACT = "0x59B9149D05138c6709D3552783aA3b85f992C79c";

const SUPPORTED_ASSETS = [
  { name: "Bitcoin", symbol: "BTC", icon: Bitcoin, color: "text-orange-500", price: "$68,432.10", change: "+2.4%" },
  { name: "Ethereum", symbol: "ETH", icon: Cpu, color: "text-blue-500", price: "$3,245.80", change: "+1.8%", active: true },
  { name: "Tether", symbol: "USDT", icon: ShieldCheck, color: "text-green-500", price: "$1.00", change: "0.0%" },
  { name: "Binance Coin", symbol: "BNB", icon: Coins, color: "text-yellow-500", price: "$590.20", change: "-0.5%" },
];

export default function CryptoPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [contractAddress] = useState(DEFAULT_CONTRACT);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [isContractValid, setIsContractValid] = useState<boolean | null>(null);
  const [inputAmount, setInputAmount] = useState("");

  const connectWallet = async () => {
    // PWA Smart Redirect Logic
    if (typeof window.ethereum === 'undefined') {
      // Jika di mobile, redirect langsung ke MetaMask app link
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const dappUrl = window.location.href.split('://')[1];
        window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
        return;
      }
      
      toast({
        variant: "destructive",
        title: "MetaMask Required",
        description: "Gunakan Browser MetaMask atau install ekstensi MetaMask di desktop.",
      });
      return;
    }

    setLoading(true);
    setIsContractValid(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      // Verification for Sepolia
      if (network.chainId !== 11155111n) { 
        toast({
          variant: "destructive",
          title: "Jaringan Salah",
          description: "Mohon pindah ke Sepolia Test Network di MetaMask Anda.",
        });
        setIsContractValid(false);
        setLoading(false);
        return;
      }

      const accounts = await provider.send("eth_requestAccounts", []);
      const userAddress = accounts[0];
      const ethBalance = await provider.getBalance(userAddress);
      
      setAddress(userAddress);
      setBalance(formatEther(ethBalance));
      
      // Verify Contract Code on the current network
      try {
        const code = await provider.getCode(contractAddress);
        if (code === "0x" || code === "0x0") {
          setIsContractValid(false);
          setVaultBalance("0");
        } else {
          setIsContractValid(true);
          const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
          const vault = await contract.balances(userAddress);
          setVaultBalance(formatEther(vault));
        }
      } catch (e) {
        setIsContractValid(false);
      }

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Koneksi Gagal",
        description: "Gagal menghubungkan ke dompet digital Anda.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'deposit' | 'withdraw') => {
    if (!address || !inputAmount) return;
    
    setTxLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, CONTRACT_ABI, signer);
      
      let tx;
      if (action === 'deposit') {
        tx = await contract.deposit({ value: parseEther(inputAmount) });
      } else {
        tx = await contract.withdraw(parseEther(inputAmount));
      }

      toast({
        title: "Transaksi Terkirim",
        description: "Menunggu konfirmasi jaringan blockchain...",
      });

      await tx.wait();
      
      toast({
        title: "Berhasil",
        description: `Transaksi ${action} sebesar ${inputAmount} ETH telah dikonfirmasi.`,
      });
      
      connectWallet();
      setInputAmount("");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Transaksi Gagal",
        description: err.reason || "Pastikan saldo ETH dan biaya Gas mencukupi.",
      });
    } finally {
      setTxLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-6xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl">
                <ArrowRightLeft className="text-white w-6 h-6" />
              </div>
              <h1 className="text-4xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Crypto Bridge</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium">Infrastruktur perbankan elit untuk ekosistem aset terdesentralisasi.</p>
          </div>
          
          <div className="flex gap-2">
            {isContractValid === true && (
              <Badge className="bg-green-100 text-green-700 border-green-200 flex gap-2 items-center px-4 py-2 rounded-full font-bold">
                <CheckCircle2 className="w-4 h-4" /> Sistem Aktif
              </Badge>
            )}
            <Badge variant="outline" className="border-primary/20 text-primary px-4 py-2 rounded-full uppercase text-[10px] font-black tracking-widest">
              Live: Sepolia Protocol
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-8">
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SUPPORTED_ASSETS.map((asset) => (
                <Card key={asset.symbol} className="liquid-glass border-none p-5 rounded-[2rem] hover:scale-105 transition-transform cursor-pointer">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={cn("p-3 rounded-2xl bg-white/50 dark:bg-black/50 shadow-inner", asset.color)}>
                      <asset.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">{asset.name}</p>
                      <p className="text-sm font-bold text-accent dark:text-primary">{asset.price}</p>
                      <p className={cn("text-[9px] font-bold", asset.change.startsWith('+') ? "text-green-600" : "text-red-600")}>
                        {asset.change}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 relative overflow-hidden shadow-2xl">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px]" />
              
              <div className="relative z-10 space-y-10">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="bg-primary text-white font-black uppercase tracking-widest text-[9px] px-3 py-1 mb-2">
                      Ethereum Custody Vault
                    </Badge>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Digital Asset Protection</h3>
                  </div>
                  <Cpu className="w-10 h-10 text-primary animate-pulse" />
                </div>

                {address ? (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white/10 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-2">Web3 Wallet Balance</p>
                        <p className="text-4xl font-black italic tracking-tighter text-white">
                          {parseFloat(balance).toFixed(4)} <span className="text-sm opacity-50">ETH</span>
                        </p>
                      </div>
                      <div className="bg-primary/20 p-8 rounded-[2rem] border border-primary/20 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">AliBank Vault Balance</p>
                        <p className="text-4xl font-black italic tracking-tighter text-primary">
                          {parseFloat(vaultBalance).toFixed(4)} <span className="text-sm opacity-50 text-white">ETH</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-black text-white/20">ETH</span>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="h-20 pl-24 rounded-[2rem] bg-white/5 border-none text-2xl font-black text-white focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          onClick={() => handleAction('deposit')}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          className="h-16 gold-gradient text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                          {txLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowDownRight className="w-6 h-6 mr-2" />}
                          Deposit to Vault
                        </Button>
                        <Button 
                          onClick={() => handleAction('withdraw')}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          variant="outline"
                          className="h-16 border-white/20 text-white hover:bg-white/5 font-black italic uppercase tracking-tighter rounded-2xl active:scale-95 transition-all"
                        >
                          {txLoading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <ArrowUpRight className="w-6 h-6 mr-2" />}
                          Withdraw Funds
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center space-y-8 border-2 border-dashed border-white/10 rounded-[3rem]">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                      <LinkIcon className="w-12 h-12 text-primary/40" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-black text-white italic uppercase tracking-tight">Koneksi Protokol Terputus</p>
                      <p className="text-xs text-white/40 px-20 font-medium leading-relaxed">Hubungkan dompet digital Anda untuk sinkronisasi aset kripto dengan sistem AliBank.</p>
                    </div>
                    <Button 
                      onClick={connectWallet}
                      disabled={loading}
                      className="gold-gradient text-white font-black italic uppercase tracking-tighter px-16 h-18 rounded-3xl shadow-2xl hover:scale-110 active:scale-95 transition-all"
                    >
                      {loading ? <RefreshCw className="w-6 h-6 animate-spin" /> : "AKTIFKAN WEB3 BRIDGE"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 shadow-xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent dark:text-primary mb-8 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Global Market Status
              </h4>
              <div className="space-y-6">
                {SUPPORTED_ASSETS.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center", asset.color)}>
                        <asset.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-accent dark:text-primary">{asset.symbol}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-accent dark:text-primary">{asset.price}</p>
                      <p className={cn("text-[9px] font-bold", asset.change.startsWith('+') ? "text-green-600" : "text-red-600")}>
                        {asset.change}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-10 border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest h-12 rounded-xl">
                Asset Insights <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Card>

            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 text-white border-none shadow-2xl relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
               <div className="relative z-10 space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary shadow-glow" />
                </div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter">Secured Protocol</h4>
                <p className="text-[11px] text-white/70 leading-relaxed font-medium uppercase tracking-wider">
                  Dana Anda dikelola oleh Smart Contract yang terdesentralisasi dan telah diaudit secara profesional. AliBank menjamin keamanan kustodian aset digital Anda.
                </p>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
