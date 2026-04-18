
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
  Globe
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
  const [isLoading, setIsLoading] = useState(false);

  const filteredUsers = useMemo(() => {
    if (!allUsers || !searchTerm) return [];
    const s = searchTerm.toLowerCase();
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s) || 
      u.accountNumber?.includes(s)
    ).slice(0, 5);
  }, [allUsers, searchTerm]);

  useEffect(() => {
    async function fetchLedger() {
      if (!selectedUser || !db) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "users", selectedUser.id, "transactions"),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        const snapshot = await getDocs(q);
        setUserTxs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Ledger fetch error:", e);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLedger();
  }, [selectedUser, db]);

  const ledgerStats = useMemo(() => {
    if (!userTxs.length) return { totalIn: 0, totalOut: 0, discrepancy: 0 };
    
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

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Buku Besar Nasabah</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Terminal Rekonsiliasi Dana Riil & Pembuktian Audit</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nasabah (UID/Email/Nama)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-card border-none rounded-2xl text-xs font-bold shadow-sm"
          />
          {filteredUsers.length > 0 && !selectedUser && (
            <div className="absolute top-14 left-0 right-0 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden">
              {filteredUsers.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => { setSelectedUser(u); setSearchTerm(""); }}
                  className="p-4 flex items-center gap-4 hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center font-black text-white">{u.name[0]}</div>
                  <div>
                    <p className="text-xs font-black uppercase italic">{u.name}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {!selectedUser ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 opacity-20 italic">
          <SearchCheck className="w-20 h-20" />
          <div className="space-y-1">
            <h4 className="text-xl font-black uppercase tracking-widest">Pilih Nasabah</h4>
            <p className="text-sm font-bold uppercase">Gunakan pencarian untuk memulai audit investigasi.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
          {/* USER CONTEXT PANEL */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[3rem] shadow-sm relative overflow-hidden">
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

            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 rounded-full"><X className="w-5 h-5" /></Button>
          </div>

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

          {/* MAIN LEDGER TABLE */}
          <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
            <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-center">
              <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                <History className="w-5 h-5 text-primary" /> Rincian Riwayat Buku Besar
              </h4>
              <button className="h-10 px-5 rounded-xl gold-gradient text-white flex items-center gap-2 text-[10px] font-black uppercase italic shadow-lg">
                <Download className="w-3.5 h-3.5" /> Ekspor Bukti Audit
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1100px]">
                <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                  <tr>
                    <th className="px-8 py-6">Timestamp & Ref Node</th>
                    <th className="px-8 py-6">Kategori / Sumber</th>
                    <th className="px-8 py-6">Metode & Gateway</th>
                    <th className="px-8 py-6">Status Keamanan</th>
                    <th className="px-8 py-6 text-right">Nilai Nominal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" /></td>
                    </tr>
                  ) : userTxs.map((tx) => {
                    const nominal = tx.amountIdr || tx.amount || tx.stakeAmount || 0;
                    const isAdjustment = tx.category === "Adjustment" || tx.category === "Manual Adjustment";
                    const isLarge = nominal > 10000000;
                    
                    return (
                      <tr key={tx.id} className={cn(
                        "hover:bg-muted/30 transition-colors group",
                        (isAdjustment || isLarge) && "bg-rose-500/[0.01]"
                      )}>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <p className="text-[10px] font-mono font-bold text-muted-foreground">
                              {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString('id-ID') : tx.date}
                            </p>
                            <p className="text-[8px] font-mono font-medium text-blue-500 uppercase tracking-tighter">NODE: {tx.id.slice(0, 16)}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            <Badge variant="outline" className={cn(
                              "border-none text-[8px] font-black uppercase px-2 h-4",
                              isAdjustment ? "bg-amber-100 text-amber-600" : "bg-muted text-foreground"
                            )}>
                              {tx.category || 'Aktivitas'}
                            </Badge>
                            <p className="text-[11px] font-black uppercase italic text-foreground max-w-[250px] truncate">{tx.description}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-primary border border-border">
                              {tx.gateway === 'PayPal' ? <Globe className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-[10px] font-black uppercase italic leading-none">{tx.gateway || "Ali-Bridge Node"}</p>
                               <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">{tx.bankName || "Blockchain Confirmed"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {tx.status === 'success' || tx.status === 'berhasil' ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <ShieldCheck className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase italic">Diverifikasi</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-500 animate-pulse">
                              <Clock className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase italic">Pending Node</span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="space-y-1">
                             <p className={cn(
                               "text-sm font-black italic tracking-tighter",
                               tx.type === 'income' ? "text-green-600" : "text-rose-600"
                             )}>
                               {tx.type === 'income' ? '+' : '-'}Rp{nominal.toLocaleString()}
                             </p>
                             {tx.cryptoAmount > 0 && (
                               <p className="text-[8px] font-bold text-primary uppercase italic">{tx.cryptoAmount.toFixed(6)} {tx.cryptoCurrency}</p>
                             )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!isLoading && userTxs.length === 0 && (
              <div className="py-20 text-center space-y-4 opacity-20 italic">
                <Fingerprint className="w-16 h-16 mx-auto" />
                <p className="text-sm font-black uppercase tracking-widest">Buku Besar Kosong</p>
              </div>
            )}
          </Card>

          {/* LEGAL FOOTER */}
          <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl gold-gradient flex items-center justify-center shrink-0 shadow-xl p-4">
                <LogoIcon className="text-white w-full h-full" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black uppercase italic tracking-tight text-accent">Sertifikasi Audit Digital V3.5</h4>
                <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic max-w-2xl">
                  Laporan ini disahkan oleh protokol AliBank Sovereign Node. Setiap entri transaksi dijamin tidak dapat dimanipulasi (*Immutable Ledger*) dan sah digunakan sebagai bukti kepatuhan AML dan KYC di wilayah hukum Republik Indonesia.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 opacity-40 grayscale shrink-0">
               <LogoIcon className="w-8 h-8" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">AliBank Compliance Dept.</span>
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
      "border-none bg-card rounded-[2.5rem] p-8 shadow-sm h-44 flex flex-col justify-between border-2 transition-all",
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
