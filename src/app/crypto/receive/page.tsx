
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  ShieldCheck, 
  Globe, 
  QrCode as QrIcon,
  Info,
  Lock,
  ChevronDown,
  Bitcoin,
  Cpu,
  Zap,
  CheckCircle2,
  FileSearch,
  ArrowDownToLine,
  Sparkles,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { getStoredAuthTokens, triggerFirestoreSync } from "@/lib/firestore-proxy-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VaultDepositModal } from "@/components/crypto/VaultDepositModal";

const NETWORKS = [
  { id: 'BTC', name: 'Bitcoin', icon: Bitcoin, color: 'text-orange-500', network: 'Native Network', confirmTime: '10-60m' },
  { id: 'ETH', name: 'Ethereum', icon: Cpu, color: 'text-blue-500', network: 'ERC-20 / EVM', confirmTime: '1-3m' },
  { id: 'ALX', name: 'Ali-Chain (ALX / USDT)', icon: Zap, color: 'text-primary', network: 'Polygon Network', confirmTime: '~1-2m' }
];

export default function CryptoReceivePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[2]);
  const [mounted, setMounted] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleSyncOnChain = useCallback(async (silent = false) => {
    if (!user?.uid) return;
    if (!silent) setIsSyncing(true);
    try {
      const { idToken } = getStoredAuthTokens();
      const res = await fetch(`/api/crypto/sync-deposits?userId=${user.uid}`, {
        headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data) {
        triggerFirestoreSync();
        if (data.newDepositsCount > 0) {
          const alxCredited = data.creditedAmounts?.ALX ? `${data.creditedAmounts.ALX} ALX ` : '';
          const usdtCredited = data.creditedAmounts?.USDT ? `${data.creditedAmounts.USDT} USDT` : '';
          toast({
            title: "📥 Deposit On-Chain Masuk!",
            description: `Berhasil mengkreditkan ${alxCredited}${usdtCredited} dari jaringan Polygon ke saldo AliBank Anda.`,
          });
        } else if (!silent) {
          const onChainAlx = data.syncedOnChainBalances?.ALX ?? 0;
          toast({
            title: "Sinkronisasi Blockchain Selesai",
            description: `Node Polygon terhubung (Blok #${data.syncedBlock || '-'}). Saldo on-chain terdeteksi: ${onChainAlx} ALX.`,
          });
        }
      } else if (!silent) {
        toast({
          variant: "destructive",
          title: "Gagal Sinkronisasi",
          description: data?.error || "Gagal menghubungi node Polygon.",
        });
      }
    } catch (e: any) {
      if (!silent) {
        toast({
          variant: "destructive",
          title: "Kesalahan Jaringan",
          description: e?.message || "Tidak dapat memeriksa transaksi on-chain.",
        });
      }
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    if (user?.uid && userData?.walletAddress) {
      handleSyncOnChain(true);
    }
  }, [user?.uid, userData?.walletAddress, handleSyncOnChain]);

  const displayAddress = useMemo(() => {
    if (!userData) return "Sedang Menyiapkan Dompet...";
    if (selectedNetwork.id === 'BTC') return userData.btcAddress || "Alamat BTC belum diaktifkan.";
    return userData.walletAddress || "Alamat EVM belum diaktifkan.";
  }, [userData, selectedNetwork]);

  const copyAddress = () => {
    if (displayAddress.includes("Sedang")) return;
    navigator.clipboard.writeText(displayAddress);
    toast({ title: "Alamat Disalin", description: `Alamat ${selectedNetwork.name} Anda telah disalin.` });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20 font-body transition-colors duration-300">
      <Navbar />
      <main className="container mx-auto px-4 max-w-lg pt-4 space-y-8">
        <header>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
                <Download className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">Terima Aset</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Hub Likuiditas Inbound AliBank.</p>
              </div>
            </div>
          </div>
        </header>

        {/* Network Selector */}
        <div className="space-y-3 px-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Jaringan Penerimaan</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full h-16 rounded-2xl liquid-glass border-primary/20 flex items-center justify-between px-6 hover:bg-muted/50 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl bg-background flex items-center justify-center shadow-inner", selectedNetwork.color)}>
                    <selectedNetwork.icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black italic uppercase">{selectedNetwork.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{selectedNetwork.network}</p>
                  </div>
                </div>
                <ChevronDown className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-md bg-background border-border rounded-2xl p-2 shadow-2xl">
              {NETWORKS.map((net) => (
                <DropdownMenuItem 
                  key={net.id} 
                  onClick={() => setSelectedNetwork(net)}
                  className="rounded-xl p-4 flex items-center justify-between cursor-pointer focus:bg-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", net.color)}>
                      <net.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase italic">{net.name}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">{net.network}</p>
                    </div>
                  </div>
                  {selectedNetwork.id === net.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] p-10 flex flex-col items-center space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 gold-gradient opacity-20" />
          
          <div className="relative">
            <div className="w-64 h-64 bg-white rounded-3xl p-4 shadow-inner border-4 border-primary/10 flex items-center justify-center overflow-hidden">
              {displayAddress && !displayAddress.includes("Sedang") && !displayAddress.includes("belum") ? (
                <img
                  key={displayAddress}
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(displayAddress)}&size=220x220&margin=4&color=000000&bgcolor=ffffff&qzone=1`}
                  alt={`QR Code ${selectedNetwork.name} — ${displayAddress}`}
                  className="w-full h-full object-contain rounded-xl animate-in zoom-in duration-500"
                  onError={(e) => {
                    // Fallback jika API QR tidak bisa diakses
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as any).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              {/* Skeleton loading saat alamat belum ada */}
              {(!displayAddress || displayAddress.includes("Sedang") || displayAddress.includes("belum")) && (
                <div className="w-full h-full bg-slate-100 rounded-xl flex flex-col items-center justify-center text-primary/40 p-4 text-center animate-pulse">
                  <QrIcon className="w-24 h-24 mb-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                    Memuat Alamat...
                  </span>
                </div>
              )}
              {/* Fallback jika QR API error */}
              <div className="hidden w-full h-full bg-slate-50 rounded-xl flex flex-col items-center justify-center text-primary/40 p-4 text-center">
                <QrIcon className="w-24 h-24 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  Scan Alamat {selectedNetwork.name}
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl border-4 border-white">
              {selectedNetwork.id === 'ALX' ? <LogoIcon className="text-white w-6 h-6" /> : <selectedNetwork.icon className="text-white w-6 h-6" />}
            </div>
          </div>


          <div className="w-full space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alamat Dompet ({selectedNetwork.id})</label>
                <Lock className="w-3 h-3 text-primary" />
              </div>
              <div className="p-5 rounded-2xl bg-accent/5 border border-primary/10 relative group">
                <p className="text-[11px] font-black text-foreground break-all text-center leading-relaxed font-mono">
                  {displayAddress}
                </p>
                <Button 
                  onClick={copyAddress}
                  className="w-full mt-4 h-12 bg-primary text-primary-foreground hover:bg-primary/90 border-none rounded-xl font-black uppercase italic text-[10px] shadow-lg"
                >
                  <Copy className="w-4 h-4 mr-2" /> SALIN ALAMAT RIIL
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Badge variant="outline" className="h-10 justify-center font-black text-[8px] uppercase tracking-widest border-primary/20 text-foreground bg-background">
                <Globe className="w-3 h-3 mr-2 text-primary" /> {selectedNetwork.confirmTime} Est.
              </Badge>
              <Badge variant="outline" className="h-10 justify-center font-black text-[8px] uppercase tracking-widest border-primary/20 text-foreground bg-background">
                <ShieldCheck className="w-3 h-3 mr-2 text-primary" /> Non-Custodial
              </Badge>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-[9px] font-black text-blue-600 uppercase italic">INFORMASI PENTING</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Pastikan Anda hanya mengirim <span className="text-foreground">{selectedNetwork.name}</span> melalui jaringan <span className="text-foreground">{selectedNetwork.network}</span>.
              </p>
            </div>
          </div>
        </Card>

        {/* Deposit On-Chain Section — Khusus ETH */}
        {selectedNetwork.id === 'ETH' && (
          <section className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative p-6 rounded-[2rem] bg-gradient-to-br from-blue-950/80 to-indigo-950/80 border border-blue-500/20 space-y-4 overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl">
                    <ArrowDownToLine className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black italic uppercase text-white">Deposit ETH ke Vault</h4>
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[7px] font-black h-4 px-2 uppercase">On-Chain</Badge>
                    </div>
                    <p className="text-[9px] font-bold text-white/40 uppercase mt-0.5">Langsung masuk ke Smart Contract AliBank di Mainnet ETH</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    { icon: ShieldCheck, text: 'Non-Custodial' },
                    { icon: Globe, text: 'Ethereum Mainnet' },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
                      <Icon className="w-3 h-3 text-blue-400" />
                      <span className="text-[9px] font-black text-white/50 uppercase">{text}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setShowDepositModal(true)}
                  className="w-full h-12 gold-gradient text-white border-none rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  DEPOSIT ETH KE VAULT ON-CHAIN
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Action Bottom */}
        <section className="space-y-4">
          <div className="p-6 rounded-[2rem] bg-muted/50 border border-border space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <FileSearch className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black italic uppercase">Sudah Kirim Aset dari MetaMask?</h4>
                <p className="text-[9px] font-bold text-muted-foreground uppercase">Sinkronkan langsung dari jaringan Polygon atau kirim laporan TXID.</p>
              </div>
            </div>
            <Button 
              onClick={() => handleSyncOnChain(false)}
              disabled={isSyncing}
              className="w-full h-12 gold-gradient text-white rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2"
            >
              {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {isSyncing ? "MEMERIKSA BLOCKCHAIN POLYGON..." : "CEK & SINKRONKAN DEPOSIT ON-CHAIN OTOMATIS"}
            </Button>
            <Button 
              onClick={() => router.push(`/crypto/confirm-deposit?asset=${selectedNetwork.id}`)}
              className="w-full h-12 bg-accent text-white rounded-xl font-black uppercase italic text-[10px] tracking-widest shadow-lg"
            >
              INPUT TXID / LAPOR PENGIRIMAN MANUAL
            </Button>
          </div>
        </section>

        {/* Vault Deposit Modal */}
        <VaultDepositModal open={showDepositModal} onClose={() => setShowDepositModal(false)} />

        <footer className="mt-12 text-center space-y-4">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Official AliBank Native Wallet System 2026</p>
          <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
            <LogoIcon className="w-4 h-4" />
            <span className="text-[7px] font-bold uppercase tracking-widest">ISO8583 COMPLIANT NODE</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
