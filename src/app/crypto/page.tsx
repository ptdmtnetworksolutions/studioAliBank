
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
  ExternalLink
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

export default function CryptoPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [vaultBalance, setVaultBalance] = useState<string>("0");
  const [contractAddress, setContractAddress] = useState("0x59B9149D05138c6709D3552783aA3b85f992C79c");
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [isContractValid, setIsContractValid] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("alibank_contract_address");
    if (saved) setContractAddress(saved);
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        variant: "destructive",
        title: "Web3 Tidak Ditemukan",
        description: "Gunakan browser di dalam aplikasi MetaMask Mobile.",
      });
      return;
    }

    setLoading(true);
    setIsContractValid(null);
    try {
      const provider = new BrowserProvider(window.ethereum);
      
      // Check network
      const network = await provider.getNetwork();
      if (network.chainId !== 11155111n) { // Sepolia chainId
        toast({
          variant: "destructive",
          title: "Jaringan Salah",
          description: "Klik pojok kiri atas MetaMask (sebelah Account 1) dan pilih 'Sepolia'.",
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
      
      if (contractAddress && contractAddress.length === 42) {
        try {
          const code = await provider.getCode(contractAddress);
          if (code === "0x" || code === "0x0") {
            setIsContractValid(false);
            setVaultBalance("0");
            toast({
              variant: "destructive",
              title: "Kontrak Tidak Ditemukan",
              description: "Kontrak tidak ada di jaringan ini. Pastikan MetaMask di jaringan SEPOLIA.",
            });
          } else {
            setIsContractValid(true);
            const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
            const vault = await contract.balances(userAddress);
            setVaultBalance(formatEther(vault));
          }
        } catch (e) {
          console.error("Gagal membaca saldo vault:", e);
          setIsContractValid(false);
        }
      }

      toast({
        title: "Dompet Terhubung",
        description: `Berhasil terhubung ke ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Koneksi Ditolak",
        description: "Gagal menghubungkan dompet.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSmartContractAction = async (action: 'deposit' | 'withdraw', amountVal: string) => {
    if (!address || !amountVal) return;
    if (!contractAddress || contractAddress.length !== 42) {
      toast({
        variant: "destructive",
        title: "Alamat Kontrak Tidak Valid",
        description: "Silakan masukkan alamat Smart Contract hasil deploy Anda.",
      });
      return;
    }
    
    setTxLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(contractAddress, CONTRACT_ABI, signer);
      
      let tx;
      if (action === 'deposit') {
        tx = await contract.deposit({ value: parseEther(amountVal) });
      } else {
        tx = await contract.withdraw(parseEther(amountVal));
      }

      toast({
        title: "Transaksi Dikirim",
        description: "Menunggu konfirmasi blockchain...",
      });

      await tx.wait();
      
      toast({
        title: "Berhasil",
        description: `Berhasil melakukan ${action === 'deposit' ? 'setoran' : 'penarikan'} ${amountVal} ETH.`,
      });
      
      connectWallet();
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Transaksi Gagal",
        description: err.reason || "Pastikan saldo mencukupi dan kontrak sudah benar.",
      });
    } finally {
      setTxLoading(false);
    }
  };

  const [inputAmount, setInputAmount] = useState("");

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Crypto Bridge</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Jembatan perbankan digital ke ekosistem Smart Contract.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            
            <Card className="liquid-glass border-none rounded-[2rem] p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-accent dark:text-primary">Konfigurasi Kontrak Pintar</h4>
                </div>
                {isContractValid === true && (
                  <Badge className="bg-green-100 text-green-700 border-green-200 flex gap-1 items-center">
                    <CheckCircle2 className="w-3 h-3" /> Terverifikasi
                  </Badge>
                )}
                {isContractValid === false && (
                  <Badge variant="destructive" className="flex gap-1 items-center">
                    <AlertCircle className="w-3 h-3" /> Jaringan Salah
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold text-muted-foreground ml-1">Alamat Kontrak (Salin dari Remix)</Label>
                <div className="relative">
                  <Input 
                    placeholder="Contoh: 0x59B..."
                    value={contractAddress}
                    onChange={(e) => {
                      setContractAddress(e.target.value);
                      localStorage.setItem("alibank_contract_address", e.target.value);
                      setIsContractValid(null);
                    }}
                    className="h-12 rounded-xl border-primary/20 bg-white/50 dark:bg-black/50 font-mono text-xs pr-10"
                  />
                  {isContractValid === true && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">Lokasi Tombol Ganti Jaringan:</p>
                  <p className="text-[9px] text-muted-foreground leading-relaxed">
                    Klik tombol lonjong berisi ikon-ikon kecil di <strong>POJOK KIRI ATAS</strong> MetaMask (tepat di sebelah kiri tulisan "Account 1"), lalu pilih <strong>Sepolia</strong>.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                      On-Chain Banking
                    </Badge>
                    <h3 className="text-xl font-bold text-accent dark:text-primary mt-2">AliBank Digital Vault</h3>
                  </div>
                  <Bitcoin className="w-8 h-8 text-primary/40 animate-bounce" />
                </div>

                {address ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saldo Wallet</p>
                        <p className="text-2xl font-black italic tracking-tighter text-accent dark:text-primary">
                          {parseFloat(balance).toFixed(4)} <span className="text-xs">ETH</span>
                        </p>
                      </div>
                      <div className="bg-accent/5 p-5 rounded-2xl border border-accent/10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Saldo Vault</p>
                        <p className="text-2xl font-black italic tracking-tighter text-accent dark:text-primary">
                          {parseFloat(vaultBalance).toFixed(4)} <span className="text-xs">ETH</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">ETH</span>
                        <Input 
                          type="number" 
                          placeholder="0.00"
                          value={inputAmount}
                          onChange={(e) => setInputAmount(e.target.value)}
                          className="h-16 pl-16 rounded-2xl liquid-glass border-none text-xl font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          onClick={() => handleSmartContractAction('deposit', inputAmount)}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          className="h-14 gold-gradient text-white font-black italic rounded-2xl flex gap-2 active:scale-95 transition-all"
                        >
                          {txLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowDownRight className="w-5 h-5" />}
                          DEPOSIT
                        </Button>
                        <Button 
                          onClick={() => handleSmartContractAction('withdraw', inputAmount)}
                          disabled={txLoading || !inputAmount || isContractValid !== true}
                          variant="outline"
                          className="h-14 border-primary/20 text-primary font-black italic rounded-2xl flex gap-2 active:scale-95 transition-all"
                        >
                          {txLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
                          WITHDRAW
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-6 border-2 border-dashed border-primary/10 rounded-[2rem]">
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                      <LinkIcon className="w-8 h-8 text-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-accent uppercase tracking-tight dark:text-primary">Layanan Kripto Belum Aktif</p>
                      <p className="text-xs text-muted-foreground px-10">Koneksikan MetaMask Anda untuk mulai berinteraksi dengan Vault AliBank.</p>
                    </div>
                    <Button 
                      onClick={connectWallet}
                      disabled={loading}
                      className="gold-gradient text-white font-black italic uppercase tracking-tighter px-10 h-14 rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "AKTIFKAN BRIDGE"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white overflow-hidden relative group shadow-2xl bg-green-900/40">
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Solusi Jaringan</h3>
                <div className="space-y-4">
                  {[
                    "Cek pojok kiri atas MetaMask (sebelah kiri tulisan Account 1).",
                    "Klik tombol ikon tersebut.",
                    "Pilih 'Sepolia Test Network'.",
                    "Kembali ke sini dan klik 'AKTIFKAN BRIDGE'."
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0 text-[10px] font-bold text-white">{i+1}</div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 space-y-4">
              <div className="flex gap-4">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <div className="space-y-2">
                  <p className="text-[9px] font-bold leading-relaxed text-muted-foreground uppercase tracking-wider">
                    <strong>PANDUAN PONSEL:</strong>
                  </p>
                  <ol className="text-[8px] text-muted-foreground list-decimal ml-4 space-y-1 uppercase font-bold leading-relaxed">
                    <li>Gunakan <strong>Browser</strong> di dalam aplikasi MetaMask Mobile.</li>
                    <li>Aktifkan <strong>"Show test networks"</strong> di Settings &gt; Advanced.</li>
                    <li>Pilih jaringan <strong>Sepolia</strong> di MetaMask.</li>
                    <li>Gunakan <code>faucets.chain.link</code> untuk mendapatkan saldo uji coba.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
