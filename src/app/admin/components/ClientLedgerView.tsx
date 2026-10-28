
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  User, 
  FileText, 
  ShieldCheck, 
  Wallet, 
  Loader2,
  TrendingUp,
  Activity,
  AlertTriangle,
  History,
  Zap,
  Fingerprint,
  Download,
  ChevronRight,
  Landmark,
  ShieldAlert,
  SearchCheck,
  Clock,
  Globe,
  X,
  Database,
  SearchCode,
  RefreshCw,
  HandCoins,
  Skull,
  CheckCircle2,
  Coins
} from "lucide-react";
import { 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";
import { UserAvatar } from "@/components/ui/user-avatar";

const ALX_PRICE_IDR = 194004;

export function ClientLedgerView({ allUsers }: { allUsers: any[] | null }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [pendingTopups, setPendingTopups] = useState<any[]>([]);
  const [globalAuditMatches, setGlobalAuditMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForensicLoading, setIsForensicLoading] = useState(false);

  // LOGIKA PENCARIAN & SARAN NASABAH
  const suggestions = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm) return allUsers.slice(0, 10); 
    
    const s = searchTerm.toLowerCase();
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s) || 
      u.accountNumber?.includes(s)
    ).slice(0, 10);
  }, [allUsers, searchTerm]);

  useEffect(() => {
    async function fetchDeepLedger() {
      if (!selectedUser || !db) return;
      setIsLoading(true);
      setIsForensicLoading(true);
      
      try {
        // 1. Ambil Riwayat Transaksi Nasabah (Local Ledger)
        const qLocal = query(
          collection(db, "users", selectedUser.id, "transactions"),
          orderBy("timestamp", "desc"),
          limit(200)
        );
        const localSnap = await getDocs(qLocal);
        setUserTxs(localSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. Ambil Topup Requests (Hutang Manual yang belum dibayar)
        const qTopup = query(
          collection(db, "topup_requests"),
          where("userId", "==", selectedUser.id),
          where("status", "==", "pending"),
          limit(50)
        );
        const topupSnap = await getDocs(qTopup);
        setPendingTopups(topupSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 3. DEEP SCAN: Cari bukti di Audit Global
        const qGlobal = query(
          collection(db, "system", "audit", "global_transactions"),
          where("userEmail", "==", selectedUser.email),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        
        const globalSnap = await getDocs(qGlobal).catch(() => ({ docs: [] }));
        setGlobalAuditMatches(globalSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (e) {
        console.error("Ledger fetch error:", e);
      } finally {
        setIsLoading(false);
        setIsForensicLoading(false);
      }
    }
    fetchDeepLedger();
  }, [selectedUser, db]);

  const ledgerStats = useMemo(() => {
    if (!selectedUser) return { totalIn: 0, totalOut: 0, illegalDebtIdr: 0, totalCryptoDebtValIdr: 0, cryptoDebtBreakdown: [], pendingDebt: 0, totalTotalDebt: 0 };
    
    // KRITIS: Filter keluar transaksi pelunasan agar tidak merusak kalkulasi forensik
    const isNeutralCategory = (cat: string) => ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat || '');

    // 1. IDR Ledger Check
    const idrInflow = userTxs.filter(t => t.type === 'income' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrOutflow = userTxs.filter(t => t.type === 'expense' && t.amount && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.amount || 0), 0);
    const idrLedgerBal = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (selectedUser.totalBalance || 0) - idrLedgerBal);

    // 2. Crypto Ledger Check (ALX, BTC, ETH, USDT)
    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    const cryptoDebtBreakdown: any[] = [];
    let totalCryptoDebtValIdr = 0;

    assets.forEach(asset => {
      const assetInflow = userTxs.filter(t => t.type === 'income' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.toAmount || 0), 0);
      const assetOutflow = userTxs.filter(t => t.type === 'expense' && t.cryptoCurrency === asset && !isNeutralCategory(t.category)).reduce((acc, t) => acc + (t.cryptoAmount || t.fromAmount || 0), 0);
      const ledgerBal = assetInflow - assetOutflow;
      const actualBal = selectedUser.cryptoBalances?.[asset] || 0;
      const diff = Math.max(0, actualBal - ledgerBal);

      if (diff > 0.000001) {
        // Approximate valuation for total sum
        const priceMap: Record<string, number> = { ALX: ALX_PRICE_IDR, BTC: 1100000000, ETH: 35000000, USDT: 17690 };
        const valIdr = diff * (priceMap[asset] || 0);
        totalCryptoDebtValIdr += valIdr;
        cryptoDebtBreakdown.push({ asset, amount: diff, valueIdr: valIdr });
      }
    });

    const pendingManualDebt = pendingTopups.reduce((acc, curr) => acc + (curr.totalToTransfer || curr.amount || 0), 0);

    return {
      totalIn: idrInflow,
      totalOut: idrOutflow,
      illegalDebtIdr,
      totalCryptoDebtValIdr,
      cryptoDebtBreakdown,
      pendingDebt: pendingManualDebt,
      totalTotalDebt: illegalDebtIdr + totalCryptoDebtValIdr + pendingManualDebt
    };
  }, [userTxs, selectedUser, pendingTopups]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Buku Besar & Matriks Hutang</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Terminal Rekonsiliasi Aset Ilegal (IDR & Kripto)</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nasabah untuk Audit Hutang..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-card border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      {!selectedUser ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">
              Daftar Nasabah Terdaftar
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((u: any) => (
              <Card 
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="p-6 rounded-[2rem] bg-card border border-border/50 hover:border-primary/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
                      <UserAvatar avatarUrl={u.avatarUrl} photoURL={u.photoURL} name={u.name} email={u.email} size={48} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-black italic uppercase text-foreground leading-none truncate">{u.name}</h5>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase truncate">{u.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
          {/* USER CONTEXT PANEL */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[3rem] shadow-sm relative overflow-hidden border border-border/50">
            <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-48 h-48 text-primary" /></div>
            
            <div className="w-32 h-32 rounded-[2.5rem] gold-gradient flex items-center justify-center p-1.5 shadow-2xl relative z-10">
              <div className="w-full h-full rounded-[2.2rem] bg-background flex items-center justify-center overflow-hidden border-[6px] border-background">
                <UserAvatar avatarUrl={selectedUser?.avatarUrl} photoURL={selectedUser?.photoURL} name={selectedUser?.name} email={selectedUser?.email} size={128} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser.name}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase">{selectedUser.email}</p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">UID Rekening</p><p className="text-xs font-mono font-bold">{selectedUser.accountNumber}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Level</p><p className="text-xs font-black italic uppercase">{selectedUser.tier || 'Regular'}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Audit Status</p><p className={cn("text-xs font-black italic uppercase", ledgerStats.totalTotalDebt > 1000 ? "text-rose-600" : "text-green-600")}>{ledgerStats.totalTotalDebt > 1000 ? 'RISIKO TINGGI' : 'BERSIH'}</p></div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* TOTAL DEBT ALERT */}
          {ledgerStats.totalTotalDebt > 1000 && (
            <Card className="p-8 bg-rose-600 text-white rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Skull className="w-32 h-32" /></div>
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse shrink-0">
                  <ShieldAlert className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">DETEKSI HUTANG MULTI-ASET ILEGAL</h4>
                    <p className="text-sm font-bold uppercase opacity-80">Total kewajiban nasabah yang tidak ter-audit: <span className="underline decoration-2 text-yellow-300 font-black">Rp {ledgerStats.totalTotalDebt.toLocaleString()}</span></p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ledgerStats.illegalDebtIdr > 1000 && (
                      <div className="bg-black/10 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Hutang IDR</p><p className="text-xs font-black italic">Rp {ledgerStats.illegalDebtIdr.toLocaleString()}</p></div>
                    )}
                    {ledgerStats.cryptoDebtBreakdown.map((c: any) => (
                      <div key={c.asset} className="bg-black/10 p-3 rounded-xl">
                        <p className="text-[9px] font-black uppercase">Hutang {c.asset}</p>
                        <p className="text-xs font-black italic">{c.amount.toFixed(6)} {c.asset}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* RECONCILIATION SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <LedgerStatCard label="Saldo Dompet Riil (IDR)" value={`Rp ${selectedUser.totalBalance?.toLocaleString()}`} sub="Liquid Assets" color="text-foreground" icon={Wallet} />
            <LedgerStatCard label="Aset Kripto Ter-Audit" value={`${(selectedUser.cryptoBalances?.ALX || 0).toFixed(4)} ALX`} sub="Sovereign Holdings" color="text-primary" icon={Coins} />
            <LedgerStatCard 
              label="Total Hutang Injeksi" 
              value={`Rp ${(ledgerStats.illegalDebtIdr + ledgerStats.totalCryptoDebtValIdr).toLocaleString()}`} 
              sub="Unverified Inflow (IDR+Crypto)" 
              color={ledgerStats.totalTotalDebt > 1000 ? "text-rose-600" : "text-blue-500"} 
              icon={Skull} 
              isAnomaly={ledgerStats.illegalDebtIdr + ledgerStats.totalCryptoDebtValIdr > 1000}
            />
            <LedgerStatCard 
              label="Hutang Topup Pending" 
              value={`Rp ${ledgerStats.pendingDebt.toLocaleString()}`} 
              sub="Manual Payment Requests" 
              color="text-amber-600" 
              icon={HandCoins} 
              isAnomaly={ledgerStats.pendingDebt > 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-center">
                <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" /> Log Riwayat Transaksi Resmi
                </h4>
                <button className="h-10 px-5 rounded-xl gold-gradient text-white flex items-center gap-2 text-[10px] font-black uppercase italic shadow-lg">
                  <Download className="w-3.5 h-3.5 mr-2" /> Download Laporan Forensik
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                    <tr>
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Aktivitas</th>
                      <th className="px-8 py-6">Metode</th>
                      <th className="px-8 py-6 text-right">Nilai Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" /></td></tr>
                    ) : userTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-mono font-bold text-muted-foreground">
                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString('id-ID') : tx.date}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className="border-none text-[8px] font-black uppercase px-2 h-4 bg-muted text-foreground mb-1">{tx.category || 'Aktivitas'}</Badge>
                          <p className="text-[10px] font-black uppercase italic text-foreground">{tx.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black uppercase italic">{tx.gateway || "Internal Node"}</p>
                        </td>
                        <td className="px-8 py-5 text-right font-black italic">
                          <span className={tx.type === 'income' ? "text-green-600" : "text-rose-600"}>
                            {tx.type === 'income' ? '+' : '-'}
                            {tx.amount ? `Rp${tx.amount.toLocaleString()}` : `${tx.cryptoAmount || tx.toAmount || tx.fromAmount || 0} ${tx.cryptoCurrency || tx.toCurrency || tx.fromCurrency}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && userTxs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center opacity-40 italic">
                          <Skull className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-xs font-black uppercase">TIDAK ADA RIWAYAT SAH DITEMUKAN UNTUK SALDO INI.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-sm font-black uppercase italic tracking-widest px-2 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" /> Piutang Bank (Pending)
              </h4>
              
              {pendingTopups.length > 0 ? (
                <div className="space-y-4">
                  {pendingTopups.map((req) => (
                    <Card key={req.id} className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-amber-500 text-white font-black text-[8px] h-5 uppercase italic">PENDING VERIFICATION</Badge>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[10px] font-bold text-foreground leading-relaxed uppercase">
                        Permintaan aset senilai **{req.asset === 'IDR' ? `Rp ${req.totalToTransfer?.toLocaleString()}` : `${req.estimatedAsset} ${req.asset}`}** via {req.type === 'crypto_deposit' ? 'On-Chain' : 'Bank Transfer'}.
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                   <CheckCircle2 className="w-10 h-10" />
                   <p className="text-[10px] font-bold uppercase italic leading-tight">Tidak ada piutang pending.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LedgerStatCard({ label, value, sub, icon: Icon, color, isAnomaly }: any) {
  return (
    <Card className={cn(
      "border-none bg-card rounded-3xl p-8 shadow-sm h-44 flex flex-col justify-between border-2 transition-all",
      isAnomaly ? "border-rose-500 bg-rose-500/[0.02] animate-pulse" : "border-border/50"
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center", color)}>
          <Icon className="w-6 h-6" />
        </div>
        {isAnomaly && <Badge className="bg-rose-600 text-white font-black text-[7px] uppercase italic">ANOMALY</Badge>}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter truncate", color)}>{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{sub}</p>
      </div>
    </Card>
  );
}
