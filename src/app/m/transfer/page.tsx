"use client";

/**
 * ALIBANK MOBILE TRANSFER — /m/transfer
 * Premium mobile-first P2P transfer with step-flow UX.
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send, ArrowLeft, X, Search, Loader2, CheckCircle2,
  Bitcoin, Cpu, Zap, ShieldCheck, ChevronDown, ChevronRight,
  Delete,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where, getDocs, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

type AssetKey = 'IDR' | 'USDT' | 'BTC' | 'ETH' | 'ALX';
type Step = 'asset' | 'recipient' | 'amount' | 'confirm' | 'success';

const ASSET_CONFIG: Record<AssetKey, { label: string; color: string; decimals: number; prefix: string }> = {
  IDR:  { label: 'Rupiah',    color: 'bg-rose-500',        decimals: 0, prefix: 'Rp' },
  USDT: { label: 'TetherUS',  color: 'bg-teal-500',        decimals: 2, prefix: '' },
  BTC:  { label: 'Bitcoin',   color: 'bg-orange-500',      decimals: 6, prefix: '' },
  ETH:  { label: 'Ethereum',  color: 'bg-blue-500',        decimals: 6, prefix: '' },
  ALX:  { label: 'Alix Coin', color: 'gold-gradient',      decimals: 4, prefix: '' },
};

function AssetIcon({ asset, className }: { asset: AssetKey; className?: string }) {
  const icons: Record<AssetKey, React.ReactNode> = {
    IDR:  <span className={cn("font-black", className)}>Rp</span>,
    USDT: <Zap className={cn("w-5 h-5", className)} />,
    BTC:  <Bitcoin className={cn("w-5 h-5", className)} />,
    ETH:  <Cpu className={cn("w-5 h-5", className)} />,
    ALX:  <LogoIcon className={cn("w-5 h-5", className)} />,
  };
  return <>{icons[asset]}</>;
}

export default function MobileTransferPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('asset');
  const [selectedAsset, setSelectedAsset] = useState<AssetKey>('IDR');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [recipient, setRecipient] = useState<any>(null);
  const [amountStr, setAmountStr] = useState('0');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transferId, setTransferId] = useState('');

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemoFirebase(() => (!db || !user) ? null : query(
    collection(db, "users", user.uid, "transactions"), limit(50)
  ), [db, user]);
  const { data: rawTxs } = useCollection(txQuery);

  const balances: Record<AssetKey, number> = useMemo(() => ({
    IDR:  userData?.totalBalance ?? 0,
    USDT: userData?.cryptoBalances?.USDT ?? 0,
    BTC:  userData?.cryptoBalances?.BTC ?? 0,
    ETH:  userData?.cryptoBalances?.ETH ?? 0,
    ALX:  userData?.cryptoBalances?.ALX ?? 0,
  }), [userData]);

  const recentRecipients = useMemo(() => {
    if (!rawTxs) return [];
    const seen = new Set<string>();
    return rawTxs
      .filter(tx => tx.category === 'Transfer' && tx.type === 'expense' && tx.counterpartyId)
      .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      .reduce((acc: any[], tx) => {
        if (!seen.has(tx.counterpartyId)) {
          seen.add(tx.counterpartyId);
          acc.push({ id: tx.counterpartyId, name: tx.counterpartyName || '?' });
        }
        return acc;
      }, [])
      .slice(0, 4);
  }, [rawTxs]);

  const numAmount = parseFloat(amountStr) || 0;
  const cfg = ASSET_CONFIG[selectedAsset];

  const formatDisplay = (asset: AssetKey, val: number) =>
    asset === 'IDR'
      ? `Rp${val.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
      : `${val.toFixed(ASSET_CONFIG[asset].decimals)} ${asset}`;

  // ── NUMPAD INPUT ─────────────────────────────────────────────────────────────
  const handleNumpad = (key: string) => {
    if (key === 'DEL') {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (cfg.decimals === 0 || amountStr.includes('.')) return;
      setAmountStr(prev => prev + '.');
    } else {
      setAmountStr(prev => prev === '0' ? key : prev + key);
    }
  };

  // ── SEARCH RECIPIENT ─────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!db || searchQuery.length < 3) return;
    setIsSearching(true);
    try {
      const [s1, s2, s3] = await Promise.all([
        getDocs(query(collection(db, "users"), where("accountNumber", "==", searchQuery), limit(1))),
        getDocs(query(collection(db, "users"), where("walletAddress", "==", searchQuery), limit(1))),
        getDocs(query(collection(db, "users"), where("email", "==", searchQuery.toLowerCase()), limit(1))),
      ]);
      const snap = !s1.empty ? s1 : !s2.empty ? s2 : s3;
      if (!snap.empty) {
        const found = snap.docs[0];
        if (found.id === user?.uid) {
          toast({ variant: "destructive", title: "Tidak bisa transfer ke diri sendiri." });
          return;
        }
        setRecipient({ id: found.id, ...found.data() });
        setStep('amount');
        setSearchQuery('');
      } else {
        toast({ variant: "destructive", title: "Pengguna tidak ditemukan." });
      }
    } catch {
      toast({ variant: "destructive", title: "Gagal mencari pengguna." });
    } finally {
      setIsSearching(false);
    }
  };

  // ── EXECUTE TRANSFER ─────────────────────────────────────────────────────────
  const handleExecute = async () => {
    if (!user || !recipient) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: user.uid,
          senderName: userData?.name || user.email,
          recipientId: recipient.id,
          asset: selectedAsset,
          amount: numAmount,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTransferId(data.transferId);
      setStep('success');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Transfer Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREENS
  // ─────────────────────────────────────────────────────────────────────────────

  const Header = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <div className="flex items-center gap-4 p-4 pt-safe">
      <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <h1 className="text-base font-black italic uppercase tracking-tight">{title}</h1>
    </div>
  );

  // ── SUCCESS ───────────────────────────────────────────────────────────────────
  if (step === 'success') return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
      <div className="w-28 h-28 rounded-full bg-green-500/15 flex items-center justify-center mb-6 animate-in spin-in-90 duration-700">
        <CheckCircle2 className="w-16 h-16 text-green-500" />
      </div>
      <h2 className="text-3xl font-black italic uppercase tracking-tighter text-center mb-2">Terkirim!</h2>
      <p className="text-muted-foreground text-xs font-bold text-center mb-8">ID: {transferId}</p>
      <div className="w-full max-w-xs bg-muted/40 rounded-[2rem] p-6 space-y-4 mb-8">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Jumlah Terkirim</p>
          <p className="text-3xl font-black text-primary italic">{formatDisplay(selectedAsset, numAmount)}</p>
        </div>
        <div className="border-t border-border/50 pt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-bold uppercase">Penerima</span>
            <span className="font-black">{recipient?.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground font-bold uppercase">Biaya</span>
            <span className="font-black text-green-500">Gratis</span>
          </div>
          {note && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-bold uppercase">Catatan</span>
              <span className="font-bold italic">{note}</span>
            </div>
          )}
        </div>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <button onClick={() => { setStep('asset'); setAmountStr('0'); setRecipient(null); setNote(''); }}
          className="w-full h-14 rounded-2xl bg-muted font-black uppercase text-sm">
          Transfer Lagi
        </button>
        <button onClick={() => router.push('/m/home')}
          className="w-full h-14 rounded-2xl gold-gradient text-white font-black italic uppercase text-sm shadow-xl">
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );

  // ── CONFIRM ───────────────────────────────────────────────────────────────────
  if (step === 'confirm') return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Konfirmasi" onBack={() => setStep('amount')} />
      <div className="flex-1 p-4 space-y-4">
        {/* Summary card */}
        <div className="bg-muted/40 rounded-[2rem] p-6 space-y-4">
          <div className="text-center">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Mengirim</p>
            <p className="text-4xl font-black text-primary italic">{formatDisplay(selectedAsset, numAmount)}</p>
          </div>
          <div className="border-t border-border/50 pt-4 space-y-3">
            {[
              { label: "Kepada", val: recipient?.name },
              { label: "Rekening", val: recipient?.accountNumber || '-' },
              { label: "Aset", val: selectedAsset },
              { label: "Biaya", val: "Gratis", color: "text-green-500" },
              ...(note ? [{ label: "Catatan", val: note }] : []),
            ].map(item => (
              <div key={item.label} className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground font-bold uppercase text-[9px]">{item.label}</span>
                <span className={cn("font-black", item.color)}>{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 bg-blue-500/10 text-blue-500 rounded-2xl p-4">
          <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-[9px] font-bold uppercase leading-relaxed">Transfer dijamin aman dengan sistem enkripsi AliBank dan tidak bisa dibatalkan setelah dikonfirmasi.</p>
        </div>
      </div>
      <div className="p-4 pb-safe space-y-3">
        <button onClick={handleExecute} disabled={isProcessing}
          className="w-full h-16 rounded-[2rem] gold-gradient text-white text-base font-black italic uppercase shadow-xl disabled:opacity-70 flex items-center justify-center gap-2">
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Kirim Sekarang</>}
        </button>
      </div>
    </div>
  );

  // ── AMOUNT INPUT ──────────────────────────────────────────────────────────────
  if (step === 'amount') return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Jumlah Transfer" onBack={() => setStep('recipient')} />
      {/* Recipient badge */}
      <div className="mx-4 mb-2">
        <div className="flex items-center gap-3 bg-muted/60 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
            {(recipient?.name || 'U')[0]}
          </div>
          <div className="flex-1">
            <p className="text-xs font-black">{recipient?.name}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase">AliBank · {recipient?.accountNumber}</p>
          </div>
          <button onClick={() => setStep('recipient')} className="p-1 rounded-lg bg-muted">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Asset badge + amount display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
        <button onClick={() => setStep('asset')}
          className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-black uppercase mb-6", cfg.color)}>
          <AssetIcon asset={selectedAsset} className="text-white" />
          {cfg.label} <ChevronDown className="w-3 h-3" />
        </button>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-black text-muted-foreground">{cfg.prefix}</span>
          <span className={cn("font-black italic tracking-tighter transition-all", numAmount > 0 ? "text-foreground" : "text-muted-foreground",
            amountStr.length > 8 ? "text-4xl" : "text-6xl")}>
            {amountStr}
          </span>
          {selectedAsset !== 'IDR' && <span className="text-xl font-black text-muted-foreground">{selectedAsset}</span>}
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase">
          Saldo: {formatDisplay(selectedAsset, balances[selectedAsset])}
        </p>
        {numAmount > balances[selectedAsset] && (
          <p className="text-[10px] font-bold text-red-500 uppercase mt-1">⚠ Melebihi saldo</p>
        )}
        {/* Quick pct buttons */}
        <div className="flex gap-3 mt-6">
          {[25, 50, 75, 100].map(pct => (
            <button key={pct} onClick={() => setAmountStr((balances[selectedAsset] * pct / 100).toFixed(cfg.decimals === 0 ? 0 : cfg.decimals))}
              className="px-4 py-2 rounded-full bg-muted text-[9px] font-black uppercase text-muted-foreground hover:bg-muted/80">
              {pct}%
            </button>
          ))}
        </div>
        {/* Note input */}
        <input
          placeholder="Catatan (opsional)"
          value={note}
          onChange={e => setNote(e.target.value)}
          className="mt-4 w-full text-center bg-transparent text-xs font-medium text-muted-foreground placeholder:text-muted-foreground/50 border-b border-border/40 pb-2 outline-none"
        />
      </div>

      {/* Numpad */}
      <div className="p-4 space-y-2">
        {[['1','2','3'],['4','5','6'],['7','8','9'],['.','0','DEL']].map((row, ri) => (
          <div key={ri} className="grid grid-cols-3 gap-2">
            {row.map(key => (
              <button key={key} onClick={() => handleNumpad(key)}
                className={cn(
                  "h-14 rounded-2xl font-black text-xl flex items-center justify-center transition-all active:scale-95",
                  key === 'DEL' ? "bg-red-500/10 text-red-500" :
                  key === '.' && cfg.decimals === 0 ? "bg-muted/30 text-muted-foreground/30 cursor-not-allowed" :
                  "bg-muted hover:bg-muted/80"
                )}>
                {key === 'DEL' ? <Delete className="w-5 h-5" /> : key}
              </button>
            ))}
          </div>
        ))}
        <button
          onClick={() => setStep('confirm')}
          disabled={numAmount <= 0 || numAmount > balances[selectedAsset]}
          className="w-full h-14 rounded-2xl gold-gradient text-white font-black italic uppercase text-sm shadow-xl disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> Konfirmasi Transfer
        </button>
      </div>
    </div>
  );

  // ── RECIPIENT ────────────────────────────────────────────────────────────────
  if (step === 'recipient') return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Pilih Penerima" onBack={() => setStep('asset')} />
      <div className="p-4 space-y-6">
        {/* Search bar */}
        <div className="flex gap-2">
          <input
            placeholder="No. Rekening / Wallet / Email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 h-12 rounded-2xl bg-muted px-4 text-sm font-bold border-none outline-none placeholder:text-muted-foreground"
          />
          <button onClick={handleSearch} disabled={isSearching || searchQuery.length < 3}
            className="w-12 h-12 rounded-2xl gold-gradient text-white flex items-center justify-center disabled:opacity-50">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>

        {/* Recent recipients */}
        {recentRecipients.length > 0 && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Terakhir Dikirim</p>
            <div className="space-y-2">
              {recentRecipients.map((r, i) => (
                <button key={i} onClick={() => { setRecipient(r); setStep('amount'); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted hover:bg-muted/80 transition-all">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                    {(r.name || 'U')[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black">{r.name}</p>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase">AliBank</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground rotate-[-90deg]" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── ASSET SELECTION ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Transfer Aset" onBack={() => router.push('/m/home')} />
      <div className="p-4 space-y-3">
        {/* EXTERNAL WALLET TRANSFER SHORTCUT */}
        <button 
          onClick={() => router.push('/crypto/send')}
          className="w-full p-4 rounded-2xl bg-primary/10 hover:bg-primary/15 border-2 border-primary/20 flex items-center justify-between transition-all mb-4 text-left group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-white shrink-0 shadow-md">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-black uppercase italic text-foreground">Kirim Ke Dompet Eksternal</p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase leading-tight mt-0.5">
                MetaMask, TrustWallet, Indodax, Pintu
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-0.5 transition-transform" />
        </button>

        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pl-1">Atau kirim ke sesama pengguna AliBank:</p>
        {(Object.keys(ASSET_CONFIG) as AssetKey[]).map(asset => {
          const c = ASSET_CONFIG[asset];
          const bal = balances[asset];
          return (
            <button key={asset} onClick={() => { setSelectedAsset(asset); setStep('recipient'); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted hover:bg-muted/80 active:scale-[0.99] transition-all">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0", c.color)}>
                <AssetIcon asset={asset} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-black uppercase">{asset}</p>
                <p className="text-[10px] text-muted-foreground font-bold">{c.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">
                  {asset === 'IDR'
                    ? `Rp${bal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}`
                    : `${bal.toFixed(c.decimals)}`}
                </p>
                <p className="text-[9px] text-muted-foreground font-bold uppercase">{asset === 'IDR' ? 'Saldo' : 'Token'}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
