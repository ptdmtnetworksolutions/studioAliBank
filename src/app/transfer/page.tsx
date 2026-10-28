"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Send,
  CheckCircle2,
  Loader2,
  X,
  Bitcoin,
  Cpu,
  Zap,
  Search,
  ArrowRight,
  ShieldCheck,
  Copy,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, getDocs, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

type AssetKey = 'IDR' | 'USDT' | 'BTC' | 'ETH' | 'ALX';

const ASSET_CONFIG: Record<AssetKey, { label: string; color: string; decimals: number; icon: any }> = {
  IDR:  { label: 'Rupiah (IDR)',  color: 'bg-rose-600',       decimals: 0, icon: () => <span className="text-white font-black text-xs">Rp</span> },
  USDT: { label: 'TetherUS (USDT)', color: 'bg-teal-500',    decimals: 2, icon: Zap },
  BTC:  { label: 'Bitcoin (BTC)', color: 'bg-orange-500',     decimals: 6, icon: Bitcoin },
  ETH:  { label: 'Ethereum (ETH)', color: 'bg-blue-500',     decimals: 6, icon: Cpu },
  ALX:  { label: 'Alix Coin (ALX)', color: 'gold-gradient',  decimals: 4, icon: LogoIcon },
};

export default function TransferPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>('IDR');
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferResult, setTransferResult] = useState<any>(null);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemoFirebase(() => (!db || !user) ? null : query(
    collection(db, "users", user.uid, "transactions"),
    limit(100)
  ), [db, user]);
  const { data: rawTxs } = useCollection(txQuery);

  // Derive balance for each asset
  const balances: Record<AssetKey, number> = useMemo(() => ({
    IDR: userData?.totalBalance ?? 0,
    USDT: userData?.cryptoBalances?.USDT ?? 0,
    BTC: userData?.cryptoBalances?.BTC ?? 0,
    ETH: userData?.cryptoBalances?.ETH ?? 0,
    ALX: userData?.cryptoBalances?.ALX ?? 0,
  }), [userData]);

  // Recent recipients from transaction history
  const recentRecipients = useMemo(() => {
    if (!rawTxs) return [];
    const seen = new Set<string>();
    const results: any[] = [];
    rawTxs
      .filter(tx => tx.category === 'Transfer' && tx.type === 'expense' && tx.counterpartyId)
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .forEach(tx => {
        if (!seen.has(tx.counterpartyId)) {
          seen.add(tx.counterpartyId);
          results.push({ id: tx.counterpartyId, name: tx.counterpartyName || 'Unknown', isRecent: true });
        }
      });
    return results.slice(0, 5);
  }, [rawTxs]);

  const handleSearch = async () => {
    if (!user || searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/users/lookup?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      const data = await res.json();

      if (!res.ok || !data.user) {
        toast({ variant: "destructive", title: "Tidak Ditemukan", description: data.error || data.message || "Pengguna tidak ditemukan." });
        return;
      }

      if (data.user.id === user.uid) {
        toast({ variant: "destructive", title: "Tidak Bisa", description: "Anda tidak bisa transfer ke diri sendiri." });
        return;
      }

      setSelectedRecipient(data.user);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Gagal mencari pengguna." });
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedRecipient || !amount) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    if (num > balances[selectedAsset]) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup" });
      return;
    }
    setStep('confirm');
  };

  const handleExecute = async () => {
    if (!user || !selectedRecipient) return;
    setIsProcessing(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: userData?.name || user.email,
          recipientId: selectedRecipient.id,
          asset: selectedAsset,
          amount: parseFloat(amount),
          note,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setTransferResult(result);
      setStep('success');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Transfer Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBalance = (asset: AssetKey, val: number) => {
    if (asset === 'IDR') return `Rp${val.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`;
    return `${val.toFixed(ASSET_CONFIG[asset].decimals)} ${asset}`;
  };

  const AssetIcon = ASSET_CONFIG[selectedAsset].icon;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── MOBILE RENDERING ──────────────────────────────────────────────────────
  if (isMobile) {
    if (step === 'success') return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 animate-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-foreground text-center tracking-tighter mb-2">Transfer Berhasil</h2>
        <p className="text-muted-foreground text-sm mb-8">ID: {transferResult?.transferId}</p>
        <Card className="w-full max-w-sm bg-card border border-border rounded-[2rem] p-8 mb-8 text-center space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Terkirim</p>
          <p className="text-3xl font-black text-primary italic">{formatBalance(selectedAsset, parseFloat(amount))}</p>
          <p className="text-sm font-bold text-muted-foreground">→ {transferResult?.recipientName}</p>
          {note && <p className="text-xs text-muted-foreground italic">"{note}"</p>}
        </Card>
        <div className="flex gap-4 w-full max-w-sm">
          <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-sm" onClick={() => { setStep('form'); setAmount(''); setNote(''); setSelectedRecipient(null); }}>Transfer Lagi</Button>
          <Button className="flex-1 h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Beranda</Button>
        </div>
      </div>
    );

    if (step === 'confirm') return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 animate-in fade-in duration-300">
        <Card className="w-full max-w-md bg-card border border-border rounded-[2rem] p-8 space-y-6">
          <h2 className="text-xl font-black italic uppercase tracking-tight">Konfirmasi Transfer</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Aset</span>
              <span className="font-black">{selectedAsset}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Jumlah</span>
              <span className="font-black text-primary text-lg">{formatBalance(selectedAsset, parseFloat(amount))}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Penerima</span>
              <div className="text-right">
                <p className="font-black">{selectedRecipient.name}</p>
                <p className="text-[10px] text-muted-foreground">{selectedRecipient.accountNumber}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-[10px] font-black uppercase text-muted-foreground">Biaya</span>
              <span className="font-black text-green-500">GRATIS</span>
            </div>
            {note && (
              <div className="flex justify-between items-center py-3">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Catatan</span>
                <span className="font-bold italic text-sm">{note}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 rounded-2xl p-4">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <p className="text-[10px] font-bold uppercase">Transfer diamankan dengan enkripsi end-to-end AliBank.</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase" onClick={() => setStep('form')}>Kembali</Button>
            <Button onClick={handleExecute} disabled={isProcessing} className="flex-1 h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl">
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Sekarang"}
            </Button>
          </div>
        </Card>
      </div>
    );

    return (
      <div className="min-h-screen pb-24 bg-background">
        <Navbar />
        <main className="container mx-auto px-4 max-w-5xl pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT: FORM */}
            <div className="lg:col-span-7 space-y-6">
              <header>
                <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Transfer Aset</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Kirim aset ke sesama nasabah AliBank — instan & gratis.</p>
              </header>

              <Card className="bg-card border border-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                {/* STEP 1: ASSET SELECTOR */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">1. Pilih Aset</label>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.keys(ASSET_CONFIG) as AssetKey[]).map((a) => {
                      const cfg = ASSET_CONFIG[a];
                      const Icon = cfg.icon;
                      return (
                        <button
                          key={a}
                          onClick={() => setSelectedAsset(a)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                            selectedAsset === a
                              ? "border-primary bg-primary/10"
                              : "border-border bg-muted/40 hover:bg-muted"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", cfg.color)}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[9px] font-black uppercase">{a}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold pl-1">
                    Saldo: <span className="text-foreground">{formatBalance(selectedAsset, balances[selectedAsset])}</span>
                  </p>
                </div>

                {/* STEP 2: RECIPIENT */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">2. Penerima</label>
                  {selectedRecipient ? (
                    <div className="p-4 rounded-2xl gold-gradient text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-base">
                          {(selectedRecipient.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black italic uppercase">{selectedRecipient.name}</p>
                          <p className="text-[10px] font-bold opacity-80">AliBank · {selectedRecipient.accountNumber}</p>
                        </div>
                      </div>
                      <button onClick={() => setSelectedRecipient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentRecipients.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                          {recentRecipients.map((r, i) => (
                            <button key={i} onClick={() => setSelectedRecipient(r)}
                              className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted hover:bg-muted/80 min-w-[72px] transition-all">
                              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                {(r.name || 'U')[0]}
                              </div>
                              <span className="text-[9px] font-black uppercase truncate w-full text-center">{r.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="No. Rekening / Wallet Address / Email..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          className="h-12 rounded-2xl bg-muted border-none font-bold text-sm"
                        />
                        <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 3}
                          className="h-12 px-5 rounded-2xl gold-gradient text-white font-black uppercase text-[10px]">
                          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground font-bold pl-1">Cari by nomor rekening, wallet address, atau email AliBank.</p>
                    </div>
                  )}
                </div>

                {/* STEP 3: AMOUNT */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">3. Jumlah</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">
                      {selectedAsset === 'IDR' ? 'Rp' : selectedAsset}
                    </div>
                    <Input
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="h-16 text-3xl font-black italic pl-14 rounded-2xl bg-muted border-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {[25, 50, 100].map(pct => (
                      <button key={pct} onClick={() => setAmount((balances[selectedAsset] * pct / 100).toFixed(ASSET_CONFIG[selectedAsset].decimals))}
                        className="flex-1 h-8 rounded-xl bg-muted text-[9px] font-black uppercase hover:bg-muted/80 text-muted-foreground transition-all">
                        {pct}%
                      </button>
                    ))}
                    <button onClick={() => setAmount(balances[selectedAsset].toFixed(ASSET_CONFIG[selectedAsset].decimals))}
                      className="flex-1 h-8 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase hover:bg-primary/20 transition-all">
                      MAKS
                    </button>
                  </div>
                </div>

                {/* STEP 4: NOTE */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">4. Catatan (opsional)</label>
                  <Input placeholder="Contoh: bayar makan, bagi hasil, dll..." value={note} onChange={e => setNote(e.target.value)}
                    className="h-12 rounded-2xl bg-muted border-none font-medium text-sm" />
                </div>

                <Button
                  onClick={handleConfirm}
                  disabled={!amount || parseFloat(amount) <= 0 || !selectedRecipient || parseFloat(amount) > balances[selectedAsset]}
                  className="w-full h-16 gold-gradient text-white text-base font-black italic uppercase rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="w-5 h-5 mr-2" />
                  {parseFloat(amount) > balances[selectedAsset] ? "Saldo Tidak Cukup" : "Lanjut Konfirmasi"}
                </Button>
              </Card>
            </div>

            {/* RIGHT: INFO */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase italic">Transfer Aman</h3>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold">Dijamin & Terenkripsi</p>
                  </div>
                </div>
                <div className="space-y-3 text-[10px] font-bold text-muted-foreground uppercase">
                  {[
                    { label: "Biaya Transfer", val: "Gratis", color: "text-green-500" },
                    { label: "Waktu Proses", val: "Instan" },
                    { label: "Limit Harian", val: "Tidak Terbatas" },
                    { label: "Aset Didukung", val: "IDR, USDT, BTC, ETH, ALX" },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50">
                      <span>{item.label}</span>
                      <span className={cn("font-black text-foreground", item.color)}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Info Rekening Saya</h3>
                <div className="space-y-2">
                  {[
                    { label: "No. Rekening", val: userData?.accountNumber },
                    { label: "Wallet", val: userData?.walletAddress ? `${userData.walletAddress.slice(0, 10)}...${userData.walletAddress.slice(-6)}` : '-' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[9px] font-black uppercase text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-foreground font-mono">{item.val || '-'}</span>
                        {item.val && (
                          <button onClick={() => { navigator.clipboard.writeText(item.val!); toast({ title: "Tersalin!" }); }}
                            className="p-1 rounded hover:bg-muted">
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-black uppercase h-8 mt-2"
                  onClick={() => router.push('/m/receive')}>
                  Tampilkan QR Code Saya <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── DESKTOP RENDERING ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30 w-full">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0 bg-background text-foreground">
        {/* HEADER */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Transfer Dana</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 h-5 rounded-full font-bold uppercase tracking-widest text-[8px]">
              Layanan Perbankan
            </Badge>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-2 hover:bg-muted rounded-full relative" onClick={() => router.back()}>
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                {userData?.name?.[0] || user?.email?.[0] || "U"}
              </div>
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto overflow-y-auto">
          {step === 'success' && (
            <div className="max-w-md mx-auto py-12 flex flex-col items-center justify-center animate-in zoom-in duration-500">
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </div>
              <h2 className="text-3xl font-black italic uppercase text-foreground text-center tracking-tighter mb-2">Transfer Berhasil</h2>
              <p className="text-muted-foreground text-sm mb-8 font-mono">ID: {transferResult?.transferId}</p>
              <Card className="w-full bg-card border border-border rounded-[2rem] p-8 mb-8 text-center space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Terkirim</p>
                <p className="text-3xl font-black text-primary italic">{formatBalance(selectedAsset, parseFloat(amount))}</p>
                <p className="text-sm font-bold text-muted-foreground">→ {transferResult?.recipientName}</p>
                {note && <p className="text-xs text-muted-foreground italic">"{note}"</p>}
              </Card>
              <div className="flex gap-4 w-full">
                <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase text-sm" onClick={() => { setStep('form'); setAmount(''); setNote(''); setSelectedRecipient(null); }}>Transfer Lagi</Button>
                <Button className="flex-1 h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Beranda</Button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="max-w-md mx-auto py-12 animate-in fade-in duration-300">
              <Card className="w-full bg-card border border-border rounded-[2rem] p-8 space-y-6">
                <h2 className="text-xl font-black italic uppercase tracking-tight">Konfirmasi Transfer</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Aset</span>
                    <span className="font-black">{selectedAsset}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Jumlah</span>
                    <span className="font-black text-primary text-lg">{formatBalance(selectedAsset, parseFloat(amount))}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Penerima</span>
                    <div className="text-right">
                      <p className="font-black">{selectedRecipient.name}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedRecipient.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-border">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Biaya</span>
                    <span className="font-black text-green-500">GRATIS</span>
                  </div>
                  {note && (
                    <div className="flex justify-between items-center py-3">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Catatan</span>
                      <span className="font-bold italic text-sm">{note}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-blue-500/10 text-blue-500 rounded-2xl p-4">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <p className="text-[10px] font-bold uppercase">Transfer diamankan dengan enkripsi end-to-end AliBank.</p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl font-black uppercase" onClick={() => setStep('form')}>Kembali</Button>
                  <Button onClick={handleExecute} disabled={isProcessing} className="flex-1 h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl">
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Kirim Sekarang"}
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {step === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT: FORM */}
              <div className="lg:col-span-7 space-y-6">
                <header>
                  <h1 className="text-4xl font-black text-foreground uppercase italic tracking-tighter">Transfer Aset</h1>
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Kirim aset ke sesama nasabah AliBank — instan & gratis.</p>
                </header>

                <Card className="bg-card border border-border rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                  {/* STEP 1: ASSET SELECTOR */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">1. Pilih Aset</label>
                    <div className="grid grid-cols-5 gap-2">
                      {(Object.keys(ASSET_CONFIG) as AssetKey[]).map((a) => {
                        const cfg = ASSET_CONFIG[a];
                        const Icon = cfg.icon;
                        return (
                          <button
                            key={a}
                            onClick={() => setSelectedAsset(a)}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all",
                              selectedAsset === a
                                ? "border-primary bg-primary/10"
                                : "border-border bg-muted/40 hover:bg-muted"
                            )}
                          >
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", cfg.color)}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-[9px] font-black uppercase">{a}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold pl-1">
                      Saldo: <span className="text-foreground">{formatBalance(selectedAsset, balances[selectedAsset])}</span>
                    </p>
                  </div>

                  {/* STEP 2: RECIPIENT */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">2. Penerima</label>
                    {selectedRecipient ? (
                      <div className="p-4 rounded-2xl gold-gradient text-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-base">
                            {(selectedRecipient.name || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-black italic uppercase">{selectedRecipient.name}</p>
                            <p className="text-[10px] font-bold opacity-80">AliBank · {selectedRecipient.accountNumber}</p>
                          </div>
                        </div>
                        <button onClick={() => setSelectedRecipient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentRecipients.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                            {recentRecipients.map((r, i) => (
                              <button key={i} onClick={() => setSelectedRecipient(r)}
                                className="flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl bg-muted hover:bg-muted/80 min-w-[72px] transition-all">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                  {(r.name || 'U')[0]}
                                </div>
                                <span className="text-[9px] font-black uppercase truncate w-full text-center">{r.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="No. Rekening / Wallet Address / Email..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            className="h-12 rounded-2xl bg-muted border-none font-bold text-sm"
                          />
                          <Button onClick={handleSearch} disabled={isSearching || searchQuery.length < 3}
                            className="h-12 px-5 rounded-2xl gold-gradient text-white font-black uppercase text-[10px]">
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Search className="w-4 h-4" />}
                          </Button>
                        </div>
                        <p className="text-[9px] text-muted-foreground font-bold pl-1">Cari by nomor rekening, wallet address, atau email AliBank.</p>
                      </div>
                    )}
                  </div>

                  {/* STEP 3: AMOUNT */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">3. Jumlah</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-muted-foreground text-sm">
                        {selectedAsset === 'IDR' ? 'Rp' : selectedAsset}
                      </div>
                      <Input
                        type="number"
                        placeholder="0"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="h-16 text-3xl font-black italic pl-14 rounded-2xl bg-muted border-none text-foreground"
                      />
                    </div>
                    <div className="flex gap-2">
                      {[25, 50, 100].map(pct => (
                        <button key={pct} onClick={() => setAmount((balances[selectedAsset] * pct / 100).toFixed(ASSET_CONFIG[selectedAsset].decimals))}
                          className="flex-1 h-8 rounded-xl bg-muted text-[9px] font-black uppercase hover:bg-muted/80 text-muted-foreground transition-all">
                          {pct}%
                        </button>
                      ))}
                      <button onClick={() => setAmount(balances[selectedAsset].toFixed(ASSET_CONFIG[selectedAsset].decimals))}
                        className="flex-1 h-8 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase hover:bg-primary/20 transition-all">
                        MAKS
                      </button>
                    </div>
                  </div>

                  {/* STEP 4: NOTE */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">4. Catatan (opsional)</label>
                    <Input placeholder="Contoh: bayar makan, bagi hasil, dll..." value={note} onChange={e => setNote(e.target.value)}
                      className="h-12 rounded-2xl bg-muted border-none font-medium text-sm text-foreground" />
                  </div>

                  <Button
                    onClick={handleConfirm}
                    disabled={!amount || parseFloat(amount) <= 0 || !selectedRecipient || parseFloat(amount) > balances[selectedAsset]}
                    className="w-full h-16 gold-gradient text-white text-base font-black italic uppercase rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 border-none"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    {parseFloat(amount) > balances[selectedAsset] ? "Saldo Tidak Cukup" : "Lanjut Konfirmasi"}
                  </Button>
                </Card>
              </div>

              {/* RIGHT: INFO */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase italic text-foreground">Transfer Aman</h3>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">Dijamin & Terenkripsi</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-[10px] font-bold text-muted-foreground uppercase">
                    {[
                      { label: "Biaya Transfer", val: "Gratis", color: "text-green-500" },
                      { label: "Waktu Proses", val: "Instan" },
                      { label: "Limit Harian", val: "Tidak Terbatas" },
                      { label: "Aset Didukung", val: "IDR, USDT, BTC, ETH, ALX" },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50">
                        <span>{item.label}</span>
                        <span className={cn("font-black text-foreground", item.color)}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="bg-card border border-border rounded-[2.5rem] p-6 shadow-sm space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Info Rekening Saya</h3>
                  <div className="space-y-2">
                    {[
                      { label: "No. Rekening", val: userData?.accountNumber },
                      { label: "Wallet", val: userData?.walletAddress ? `${userData.walletAddress.slice(0, 10)}...${userData.walletAddress.slice(-6)}` : '-' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2 border-b border-border/50">
                        <span className="text-[9px] font-black uppercase text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-foreground font-mono">{item.val || '-'}</span>
                          {item.val && (
                            <button onClick={() => { navigator.clipboard.writeText(item.val!); toast({ title: "Tersalin!" }); }}
                              className="p-1 rounded hover:bg-muted border border-border/50">
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-[10px] font-black uppercase h-8 mt-2"
                    onClick={() => router.push('/m/receive')}>
                    Tampilkan QR Code Saya <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}