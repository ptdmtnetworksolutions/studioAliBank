'use client';

/**
 * ALI-BANK TRANSACTION HISTORY — /transactions/history
 * Halaman riwayat transaksi premium untuk desktop & mobile.
 * Mendukung filter kategori (Semua, Masuk, Keluar, Kripto), pencarian dinamis,
 * dan modal detail transaksi yang elegan.
 */

import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect, Suspense } from "react";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { 
  ArrowLeft, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Zap,
  Cpu,
  Bitcoin,
  Coins,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Icon mapper untuk tipe transaksi
const getTxIcon = (tx: any, isIncome: boolean) => {
  const desc = (tx.description || '').toLowerCase();
  const cat = (tx.category || '').toLowerCase();
  
  if (desc.includes('vault') || desc.includes('onchain') || desc.includes('on-chain')) {
    return <Cpu className="w-5 h-5 text-primary" />;
  }
  if (desc.includes('spin') || cat.includes('game') || cat.includes('spin')) {
    return <Zap className="w-5 h-5 text-amber-500" />;
  }
  if (tx.cryptoCurrency === 'BTC' || tx.toCurrency === 'BTC' || tx.fromCurrency === 'BTC') {
    return <Bitcoin className="w-5 h-5 text-orange-500" />;
  }
  if (tx.cryptoCurrency === 'ALX' || tx.toCurrency === 'ALX' || tx.fromCurrency === 'ALX') {
    return <Coins className="w-5 h-5 text-yellow-500" />;
  }
  
  return isIncome 
    ? <ArrowDownLeft className="w-5 h-5 text-green-500" />
    : <ArrowUpRight className="w-5 h-5 text-rose-500" />;
};

function TransactionHistoryContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'semua' | 'masuk' | 'keluar' | 'kripto'>('semua');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.title = "Riwayat Transaksi - AliBank";
  }, []);

  // Fetch transactions dari Firestore user
  const txQuery = useMemoFirebase(() => 
    (db && user) 
      ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(100))
      : null, 
    [db, user]
  );
  const { data: rawTxs, isLoading: txsLoading } = useCollection(txQuery);

  // Parse & filter transaksi
  const parsedTransactions = useMemo(() => {
    if (!rawTxs) return [];
    
    return rawTxs.map((tx: any) => {
      const isIncome = tx.type === 'income' || tx.type === 'topup' || tx.type === 'fiat_deposit' || (tx.amount && tx.amount > 0 && !tx.type);
      const timestamp = tx.timestamp?.seconds 
        ? new Date(tx.timestamp.seconds * 1000) 
        : (tx.date ? new Date(tx.date) : new Date());

      let amountText = "";
      let isCrypto = !!(tx.cryptoCurrency || tx.cryptoAmount || tx.amountEth || tx.toCurrency || tx.fromCurrency);

      if (tx.amount !== undefined && tx.amount !== null) {
        amountText = `Rp${Math.abs(tx.amount).toLocaleString('id-ID')}`;
      } else if (tx.amountEth !== undefined && tx.amountEth !== null) {
        amountText = `${tx.amountEth} ETH`;
      } else if (tx.cryptoAmount !== undefined && tx.cryptoAmount !== null) {
        amountText = `${tx.cryptoAmount} ${tx.cryptoCurrency || 'USDT'}`;
      } else if (tx.toAmount !== undefined && tx.toAmount !== null) {
        amountText = `${tx.toAmount} ${tx.toCurrency || ''}`;
      } else if (tx.fromAmount !== undefined && tx.fromAmount !== null) {
        amountText = `${tx.fromAmount} ${tx.fromCurrency || ''}`;
      } else {
        amountText = "-";
      }

      return {
        id: tx.id,
        isIncome,
        isCrypto,
        timestamp,
        title: tx.description || tx.category || 'Transaksi',
        category: tx.category || 'Umum',
        amountText,
        currency: tx.currency || tx.cryptoCurrency || tx.toCurrency || 'IDR',
        status: tx.status || 'success',
        txHash: tx.txHash || null,
        network: tx.network || null,
        walletAddress: tx.walletAddress || null,
        raw: tx
      };
    });
  }, [rawTxs]);

  // Filter berdasarkan tab & search query
  const filteredTxs = useMemo(() => {
    return parsedTransactions.filter((tx) => {
      // 1. Filter Tab
      if (activeTab === 'masuk' && !tx.isIncome) return false;
      if (activeTab === 'keluar' && tx.isIncome) return false;
      if (activeTab === 'kripto' && !tx.isCrypto) return false;

      // 2. Filter Search
      if (searchQuery.trim() !== "") {
        const queryLower = searchQuery.toLowerCase();
        const matchesTitle = tx.title.toLowerCase().includes(queryLower);
        const matchesCategory = tx.category.toLowerCase().includes(queryLower);
        const matchesAmount = tx.amountText.toLowerCase().includes(queryLower);
        return matchesTitle || matchesCategory || matchesAmount;
      }

      return true;
    });
  }, [parsedTransactions, activeTab, searchQuery]);

  // Group transaksi berdasarkan tanggal (Hari Ini, Kemarin, Tanggal Lain)
  const groupedTxs = useMemo(() => {
    const groups: Record<string, typeof filteredTxs> = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    filteredTxs.forEach((tx) => {
      const txDate = tx.timestamp;
      let dateKey = "";

      if (txDate.toDateString() === today.toDateString()) {
        dateKey = "Hari Ini";
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        dateKey = "Kemarin";
      } else {
        dateKey = txDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(tx);
    });

    return Object.entries(groups);
  }, [filteredTxs]);

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memuat Riwayat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-body transition-colors duration-300">
      
      {/* HEADER BAR */}
      <header className="px-4 h-14 flex items-center border-b border-border sticky top-0 bg-background/80 backdrop-blur-md z-40">
        <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors mr-2 shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black uppercase italic tracking-tight flex-1">Riwayat Transaksi</h1>
      </header>

      <main className="px-4 pt-4 max-w-lg mx-auto space-y-6">
        
        {/* SEARCH & FILTER BAR */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Cari transaksi, nominal, kategori..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-muted/40 border-border rounded-xl text-xs font-medium"
            />
          </div>

          {/* TAB FILTERS */}
          <div className="flex bg-muted/40 p-1 rounded-xl border border-border/40 overflow-x-auto no-scrollbar">
            {(['semua', 'masuk', 'keluar', 'kripto'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 text-center py-2 text-[10px] font-black uppercase italic rounded-lg transition-all shrink-0 px-3",
                  activeTab === tab 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* TRANSACTION LIST */}
        <div className="space-y-6">
          {txsLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Sinkronisasi Ledger...</p>
            </div>
          ) : groupedTxs.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-40">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs font-black uppercase italic tracking-wide">Tidak Ada Transaksi</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Ganti filter atau cari kata kunci lain</p>
            </div>
          ) : (
            groupedTxs.map(([date, txs]) => (
              <div key={date} className="space-y-3">
                <h3 className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1">{date}</h3>
                
                <div className="space-y-1">
                  {txs.map((tx) => (
                    <div 
                      key={tx.id} 
                      onClick={() => setSelectedTx(tx)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-border/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                          {getTxIcon(tx.raw, tx.isIncome)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-black uppercase italic leading-none truncate group-hover:text-primary transition-colors">
                            {tx.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none bg-muted px-1.5 py-0.5 rounded">
                              {tx.category}
                            </span>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase leading-none">
                              {tx.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 pl-4">
                        <p className={cn(
                          "text-xs font-black italic leading-none",
                          tx.isIncome ? "text-green-500" : "text-foreground"
                        )}>
                          {tx.isIncome ? '+' : '-'} {tx.amountText}
                        </p>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-[6px] font-black h-3.5 uppercase border-none px-1.5 mt-1.5 leading-none",
                            tx.status === 'success' || tx.status === 'confirmed' 
                              ? "bg-green-600/10 text-green-600" 
                              : tx.status === 'pending'
                                ? "bg-orange-500/10 text-orange-500"
                                : "bg-rose-500/10 text-rose-500"
                          )}
                        >
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedTx && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-border p-6 space-y-6 animate-in slide-in-from-bottom-12 duration-300 relative shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-border/50">
              <div>
                <h3 className="text-xs font-black uppercase italic text-muted-foreground">Detail Transaksi</h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">ID: {selectedTx.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTx(null)} 
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-5">
              
              {/* Big Amount Card */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Jumlah Transaksi</p>
                <h2 className={cn(
                  "text-2xl font-black italic tracking-tight",
                  selectedTx.isIncome ? "text-green-500" : "text-foreground"
                )}>
                  {selectedTx.isIncome ? '+' : '-'} {selectedTx.amountText}
                </h2>
                <div className="pt-2">
                  <Badge 
                    className={cn(
                      "text-[8px] font-black h-5 uppercase border-none px-3 rounded-md italic",
                      selectedTx.status === 'success' || selectedTx.status === 'confirmed'
                        ? "bg-green-500/10 text-green-500"
                        : selectedTx.status === 'pending'
                          ? "bg-orange-500/10 text-orange-500"
                          : "bg-rose-500/10 text-rose-500"
                    )}
                  >
                    Status: {selectedTx.status}
                  </Badge>
                </div>
              </div>

              {/* Transaction Metadata Grid */}
              <div className="space-y-3.5 px-1">
                <DetailRow label="Deskripsi" value={selectedTx.title} />
                <DetailRow label="Kategori" value={selectedTx.category.toUpperCase()} />
                <DetailRow 
                  label="Tanggal & Waktu" 
                  value={selectedTx.timestamp.toLocaleString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })} 
                />
                
                {/* On-Chain specific metadata */}
                {selectedTx.network && (
                  <DetailRow label="Jaringan Blockchain" value={selectedTx.network} />
                )}
                {selectedTx.walletAddress && (
                  <DetailRow 
                    label="Alamat Wallet" 
                    value={selectedTx.walletAddress} 
                    isMono 
                    isCopyable 
                  />
                )}
                {selectedTx.txHash && (
                  <DetailRow 
                    label="Transaction Hash (TxID)" 
                    value={selectedTx.txHash} 
                    isMono 
                    isCopyable
                    isLink
                    linkUrl={
                      selectedTx.network?.toLowerCase().includes('polygon')
                        ? `https://polygonscan.com/tx/${selectedTx.txHash}`
                        : `https://etherscan.io/tx/${selectedTx.txHash}`
                    }
                  />
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-border/50">
              <Button 
                onClick={() => setSelectedTx(null)}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase rounded-xl tracking-wide"
              >
                Tutup Detail
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

// Reusable Detail Row component
function DetailRow({ 
  label, 
  value, 
  isMono = false, 
  isCopyable = false,
  isLink = false,
  linkUrl = "" 
}: { 
  label: string; 
  value: string; 
  isMono?: boolean; 
  isCopyable?: boolean;
  isLink?: boolean;
  linkUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-[9px] font-black uppercase text-muted-foreground pt-0.5">{label}</span>
      <div className="text-right min-w-0 flex-1 flex flex-col items-end">
        {isLink ? (
          <a 
            href={linkUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase italic"
          >
            Buka Explorer <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ) : (
          <span className={cn(
            "text-xs font-black leading-tight break-all",
            isMono ? "font-mono text-[10px] tracking-tighter" : ""
          )}>
            {value}
          </span>
        )}
        
        {isCopyable && (
          <button 
            onClick={handleCopy} 
            className="text-[8px] font-bold text-primary hover:underline mt-1 uppercase"
          >
            {copied ? 'Berhasil Disalin!' : 'Salin Nilai'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function TransactionHistoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <TransactionHistoryContent />
    </Suspense>
  );
}
