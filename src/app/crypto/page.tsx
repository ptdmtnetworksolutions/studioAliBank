
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { BrowserProvider, formatEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function CryptoPage() {
  const { toast } = useToast();
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>("0");
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      toast({
        variant: "destructive",
        title: "Dompet Tidak Ditemukan",
        description: "Silakan pasang MetaMask atau ekstensi dompet Web3 lainnya.",
      });
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const balance = await provider.getBalance(accounts[0]);
      
      setAddress(accounts[0]);
      setBalance(formatEther(balance));
      
      toast({
        title: "Dompet Terhubung!",
        description: `Berhasil terhubung ke ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal Menghubungkan",
        description: "Permintaan koneksi ditolak atau dibatalkan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl">
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Bitcoin className="text-white w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Crypto Bridge</h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Koneksikan dompet digital Anda ke ekosistem AliBank Premium.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Web3 Status & Wallet Card */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest px-3 py-1">
                      Web3 Integration
                    </Badge>
                    <h3 className="text-xl font-bold text-accent dark:text-primary mt-2">Saldo Aset On-Chain</h3>
                  </div>
                  <Wallet className="w-8 h-8 text-primary/40" />
                </div>

                {address ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Alamat Terhubung</p>
                      <p className="text-xs font-mono bg-primary/5 p-3 rounded-xl border border-primary/10 text-accent break-all dark:text-primary">
                        {address}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Saldo ETH</p>
                      <p className="text-4xl font-black italic tracking-tighter text-accent dark:text-primary">
                        {parseFloat(balance).toFixed(4)} <span className="text-xl">ETH</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center space-y-6 border-2 border-dashed border-primary/10 rounded-[2rem]">
                    <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                      <LinkIcon className="w-8 h-8 text-primary/30" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-accent uppercase tracking-tight dark:text-primary">Belum Ada Dompet Terhubung</p>
                      <p className="text-xs text-muted-foreground px-10">Gunakan MetaMask untuk menghubungkan aset kripto Anda dengan aman ke AliBank.</p>
                    </div>
                    <Button 
                      onClick={connectWallet}
                      disabled={loading}
                      className="gold-gradient text-white font-black italic uppercase tracking-tighter px-10 h-14 rounded-2xl shadow-xl active:scale-95 transition-all"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "HUBUNGKAN DOMPET"}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            <div className="liquid-glass p-8 rounded-[2rem] border-primary/10 flex gap-5 items-center">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-accent dark:text-primary uppercase tracking-tight">Smart Contract Keamanan</h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">Seluruh transaksi bridge diamankan oleh audit smart contract Multi-Signature untuk menjamin dana nasabah tetap aman.</p>
              </div>
            </div>
          </div>

          {/* Sidebar Info & Assets */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white overflow-hidden relative group shadow-2xl">
              <div className="absolute inset-0 gold-gradient opacity-10" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Manfaat Kripto di AliBank</h3>
                <div className="space-y-4">
                  {[
                    "Konversi Instan ke Rupiah",
                    "Bunga Staking s/d 12% p.a.",
                    "Pinjaman Jaminan Aset Kripto",
                    "Akses Eksklusif Launchpad"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/80">{item}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl h-12 text-[10px] font-black uppercase tracking-widest mt-4">
                  PELAJARI SMART CONTRACT <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>

            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex gap-4">
              <Info className="w-5 h-5 text-primary shrink-0" />
              <p className="text-[9px] font-medium leading-relaxed text-muted-foreground uppercase tracking-wider">
                <strong>Pemberitahuan:</strong> AliBank tidak pernah meminta Private Key Anda. Harap berhati-hati terhadap segala bentuk penipuan Web3.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
