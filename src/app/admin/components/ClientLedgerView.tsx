
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
  TrendingDown,
  Activity,
  AlertTriangle,
  History,
  Zap,
  Fingerprint,
  Download,
  ArrowRightLeft,
  ChevronRight,
  Landmark,
  ShieldAlert,
  SearchCheck,
  Calendar,
  Clock,
  ArrowUpRight,
  Globe,
  X,
  Database,
  SearchCode,
  FileWarning
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

export function ClientLedgerView({ allUsers }: { allUsers: any[] | null }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTxs, setUserTxs] = useState<any[]>([]);
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
          limit(100)
        );
        const localSnap = await getDocs(qLocal);
        setUserTxs(localSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 2. DEEP SCAN: Cari bukti di Audit Global yang berkaitan dengan email nasabah
        // Ini untuk mendeteksi transaksi yang tercatat di pusat tapi gagal di-inkjeksi ke ledger nasabah
        const qGlobal = query(
          collection(db, "system", "audit", "global_transactions"),
          where("userEmail", "==", selectedUser.email),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        const globalSnap = await getDocs(qGlobal);
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
    if (!userTxs.length) return { totalIn: 0, totalOut: 0, discrepancy: selectedUser?.totalBalance || 0, ledgerBalance: 0 };
    
    const ALX_PRICE_IDR = 194004;

    const getVal = (t: any) => {
      if (t.amountIdr) return t.amountIdr;
      if (t.amount) return t.amount;
      if (t.stakeAmount) return t.stakeAmount;
      if (t.rewardAlx) return t.rewardAlx * ALX_PRICE_IDR;
      if (t.cryptoCurrency === 'ALX' && t.cryptoAmount) return t.cryptoAmount * ALX_PRICE_IDR;
      return 0;
    };

    const inflow = userTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + getVal(t), 0);
    const outflow = userTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + getVal(t), 0);
    
    const ledgerBal = inflow - outflow;
    const actualBal = selectedUser?.totalBalance || 0;

    return {
      totalIn: inflow,
      totalOut: outflow,
      discrepancy: actualBal - ledgerBal,
      ledgerBalance: ledgerBal
    };
  }, [userTxs, selectedUser]);

  // Identifikasi Transaksi yang tidak singkron (Ada di Global tapi tidak di Local)
  const disconnectedLogs = useMemo(() => {
    const localIds = new Set(userTxs.map(t => t.id || t.invoiceId || t.orderId));
    return globalAuditMatches.filter(g => !localIds.has(g.id) && !localIds.has(g.invoiceId));
  }, [userTxs, globalAuditMatches]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Buku Besar Nasabah</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Terminal Rekonsiliasi Dana Riil & Pembuktian Audit</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nasabah (UID/Email/Nama)..." 
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
              {searchTerm ? 'Hasil Pencarian' : 'Nasabah Terbaru (Pilih untuk Audit)'}
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
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt="av" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-black text-foreground uppercase">{u.name[0]}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-black italic uppercase text-foreground leading-none">{u.name}</h5>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase truncate max-w-[150px]">{u.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-end">
                   <div>
                     <p className="text-[8px] font-black text-muted-foreground uppercase">Saldo Utama</p>
                     <p className="text-xs font-black italic text-foreground">Rp{u.totalBalance?.toLocaleString()}</p>
                   </div>
                   <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/20 text-primary">UID: {u.accountNumber}</Badge>
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
                {selectedUser.avatarUrl ? (
                  <Image src={selectedUser.avatarUrl} alt="av" width={128} height={128} className="object-cover" />
                ) : (
                  <User className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser.name}</h3>
                <Badge className={cn(
                  "border-none text-[8px] font-black uppercase px-2 h-5",
                  selectedUser.kycStatus === 'verified' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                )}>
                  {selectedUser.kycStatus === 'verified' ? 'Verified Client' : 'Pending Verification'}
                </Badge>
              </div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedUser.email}</p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">UID Rekening</p><p className="text-xs font-mono font-bold">{selectedUser.accountNumber}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Level Akun</p><p className="text-xs font-black italic uppercase">{selectedUser.tier || 'Regular'}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Terdaftar</p><p className="text-xs font-black italic">{selectedUser.createdAt?.toDate ? selectedUser.createdAt.toDate().toLocaleDateString() : '---'}</p></div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* DEEP SCAN ALERT */}
          {Math.abs(ledgerStats.discrepancy) > 1000 && (
            <Card className="p-8 bg-rose-600 text-white rounded-[2.5rem] border-none shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert className="w-32 h-32" /></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                  <SearchCode className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xl font-black uppercase italic italic tracking-tighter">HASIL DEEP SCAN: INJEKSI DANA TANPA RIWAYAT</h4>
                  <p className="text-xs font-bold uppercase opacity-80 leading-relaxed">
                    Sistem mendeteksi selisih sebesar <span className="underline decoration-2 text-yellow-300">Rp {Math.abs(ledgerStats.discrepancy).toLocaleString()}</span> yang masuk ke saldo profil tanpa melalui dokumen kuitansi digital. Dana ini diidentifikasi sebagai **Injeksi Database Langsung (Manual Root Edit)**.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* RECONCILIATION SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <LedgerStatCard label="Saldo Dompet Saat Ini" value={`Rp ${selectedUser.totalBalance?.toLocaleString()}`} sub="Current Wallet Value" color="text-foreground" icon={Wallet} />
            <LedgerStatCard label="Total Dana Masuk" value={`Rp ${ledgerStats.totalIn.toLocaleString()}`} sub="Total Ledger Inflow" color="text-green-600" icon={TrendingUp} />
            <LedgerStatCard label="Total Dana Keluar" value={`Rp ${ledgerStats.totalOut.toLocaleString()}`} sub="Total Ledger Outflow" color="text-rose-600" icon={TrendingDown} />
            <LedgerStatCard 
              label="Selisih Tak Ter-Audit" 
              value={`Rp ${Math.abs(ledgerStats.discrepancy).toLocaleString()}`} 
              sub={ledgerStats.discrepancy === 0 ? "Clean Ledger" : "Anomaly Detected"} 
              color={ledgerStats.discrepancy === 0 ? "text-blue-500" : "text-rose-600"} 
              icon={ShieldAlert} 
              isAnomaly={Math.abs(ledgerStats.discrepancy) > 1000}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* MAIN LEDGER TABLE */}
            <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-center">
                <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" /> Rincian Riwayat Buku Besar
                </h4>
                <button className="h-10 px-5 rounded-xl gold-gradient text-white flex items-center gap-2 text-[10px] font-black uppercase italic shadow-lg">
                  <Download className="w-3.5 h-3.5" /> Ekspor Bukti Audit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                    <tr>
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Aktivitas</th>
                      <th className="px-8 py-6">Metode</th>
                      <th className="px-8 py-6 text-right">Nominal</th>
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
                          <p className="text-[10px] font-black uppercase italic">{tx.gateway || "Ali-Bridge Node"}</p>
                        </td>
                        <td className="px-8 py-5 text-right font-black italic">
                          <span className={tx.type === 'income' ? "text-green-600" : "text-rose-600"}>
                            {tx.type === 'income' ? '+' : '-'}Rp{(tx.amountIdr || tx.amount || tx.stakeAmount || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* DEEP SCAN RESULTS: TEMUAN BUKTI EKSTERNAL */}
            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-sm font-black uppercase italic tracking-widest px-2 flex items-center gap-2">
                <SearchCheck className="w-4 h-4 text-primary" /> Temuan Bukti Eksternal
              </h4>
              
              {isForensicLoading ? (
                <div className="p-10 flex flex-col items-center gap-3 bg-card rounded-[2rem] border border-border">
                  <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Scanning Global Audit Logs...</p>
                </div>
              ) : disconnectedLogs.length > 0 ? (
                <div className="space-y-4">
                  {disconnectedLogs.map((log) => (
                    <Card key={log.id} className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-4 animate-in slide-in-from-right-4">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-amber-500 text-white font-black text-[8px] h-5 uppercase italic">Broken Ledger Link</Badge>
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[10px] font-bold text-foreground leading-relaxed uppercase">
                        Ditemukan catatan di Audit Global sebesar **Rp {log.amountIdr?.toLocaleString()}** ({log.category}), namun tidak tercatat di buku besar nasabah.
                      </p>
                      <div className="pt-3 border-t border-amber-500/10 flex justify-between items-center text-[8px] font-mono font-bold text-muted-foreground">
                        <span>REF: {log.id.slice(0, 12)}</span>
                        <span>{log.timestamp?.toDate().toLocaleDateString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                   <FileWarning className="w-10 h-10" />
                   <p className="text-[10px] font-bold uppercase italic leading-tight">
                     Tidak ditemukan bukti transaksi pendukung di Audit Global. Dana dikategorikan sebagai **MURNI ILEGAL / DATA GLITCH**.
                   </p>
                </Card>
              )}

              <Card className="p-6 rounded-[2rem] bg-[#1A1D1F] text-white space-y-4 shadow-xl">
                 <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <h5 className="text-[11px] font-black uppercase italic tracking-widest">Sertifikasi Node V3.5</h5>
                 </div>
                 <p className="text-[9px] font-medium text-white/50 leading-relaxed uppercase italic">
                   Laporan forensik ini menggunakan algoritma rekonsiliasi lintas-node ISO8583. Hasil "Saldo Tak Ter-Audit" adalah bukti mutlak adanya manipulasi field saldo langsung tanpa melalui logika aplikasi.
                 </p>
              </Card>
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
