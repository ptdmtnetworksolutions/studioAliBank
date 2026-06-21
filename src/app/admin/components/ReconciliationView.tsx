"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useFirebase } from "@/firebase";
import { 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  Database, 
  Wallet, 
  Coins, 
  UserX, 
  UserCheck,
  Search,
  ArrowRight,
  Loader2,
  Lock,
  Unlock,
  ChevronRight,
  TrendingDown,
  Activity,
  Skull
} from "lucide-react";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";

export function ReconciliationView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const db = useFirestore();
  const { auth } = useFirebase();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [autoSuspend, setAutoSuspend] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Load latest run details
  const fetchLatestRun = async () => {
    if (!db) return;
    setIsLoading(true);
    try {
      // Get reconciliation status doc
      const summarySnap = await getDoc(doc(db, "system", "reconciliation"));
      let runId = "";
      if (summarySnap.exists()) {
        runId = summarySnap.data().latestRunId || "";
      }

      if (runId) {
        const runSnap = await getDoc(doc(db, "system", "reconciliation", "runs", runId));
        if (runSnap.exists()) {
          setLatestRun(runSnap.data());
        }
      } else {
        // Fallback: query last run in runs subcollection
        const runsSnap = await getDocs(
          query(collection(db, "system", "reconciliation", "runs"), orderBy("timestamp", "desc"), limit(1))
        );
        if (!runsSnap.empty) {
          setLatestRun(runsSnap.docs[0].data());
        }
      }
    } catch (err: any) {
      console.error("Error loading reconciliation details:", err);
      toast({
        variant: "destructive",
        title: "Gagal memuat log rekonsiliasi",
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestRun();
  }, [db]);

  // Trigger reconciliation run
  const handleRunReconciliation = async () => {
    if (!auth || !db) return;
    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Gagal memperoleh token autentikasi admin.");

      const res = await fetch("/api/admin/reconcile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ autoSuspend })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menjalankan rekonsiliasi.");
      }

      toast({
        title: "Rekonsiliasi Selesai",
        description: `Berhasil memeriksa ${data.totalUsersAudited} akun nasabah. ${data.flaggedUsersCount} anomali terdeteksi.`
      });
      
      setLatestRun(data);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Audit Gagal",
        description: err.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Lock / Unlock user account
  const toggleUserSuspendStatus = async (userId: string, currentlySuspended: boolean) => {
    if (!db) return;
    setIsActionLoading(userId);
    try {
      const userRef = doc(db, "users", userId);
      const newStatus = !currentlySuspended;
      
      await updateDoc(userRef, {
        isSuspended: newStatus,
        securityLockReason: newStatus ? "Suspended by admin: Reconciliation manual audit flag." : null
      });

      // Write notification
      await updateDoc(doc(collection(userRef, "notifications")), {
        title: newStatus ? "⚠️ Akun Ditangguhkan" : "✅ Akun Diaktifkan Kembali",
        message: newStatus 
          ? "Akun Anda telah ditangguhkan secara manual oleh administrator untuk pemeriksaan keamanan."
          : "Akun Anda telah diaktifkan kembali. Anda dapat bertransaksi kembali.",
        type: newStatus ? "warning" : "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({
        title: newStatus ? "Akun Ditangguhkan" : "Akun Diaktifkan",
        description: `Akun nasabah berhasil ${newStatus ? 'dibekukan' : 'diaktifkan kembali'}.`
      });

      // Update local state
      if (latestRun) {
        const updatedFlagged = latestRun.flaggedUsers.map((u: any) => {
          if (u.userId === userId) {
            return { ...u, isSuspended: newStatus };
          }
          return u;
        });
        setLatestRun({ ...latestRun, flaggedUsers: updatedFlagged });
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal mengubah status akun",
        description: err.message
      });
    } finally {
      setIsActionLoading(null);
    }
  };

  const filteredFlaggedUsers = useMemo(() => {
    if (!latestRun?.flaggedUsers) return [];
    if (!searchTerm) return latestRun.flaggedUsers;
    const s = searchTerm.toLowerCase();
    return latestRun.flaggedUsers.filter((u: any) => 
      u.name.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) ||
      u.userId.toLowerCase().includes(s)
    );
  }, [latestRun, searchTerm]);

  // Asset price reference for IDR estimations
  const priceMap: Record<string, number> = {
    ALX: 194000,
    USDT: 17690,
    ETH: 35000000,
    BTC: 1100000000,
    IDR: 1
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Rekonsiliasi & Anti-Fraud</h2>
            {latestRun?.status === 'anomalies_detected' ? (
              <Badge className="bg-rose-600 text-white font-black text-[8px] h-5 uppercase italic animate-pulse px-3">Anomaly Detected</Badge>
            ) : latestRun?.status === 'clean' ? (
              <Badge className="bg-green-600 text-white font-black text-[8px] h-5 uppercase italic px-3">System Secure</Badge>
            ) : (
              <Badge className="bg-muted text-muted-foreground font-black text-[8px] h-5 uppercase italic px-3">No Run Log</Badge>
            )}
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Sinkronisasi Saldo On-Chain, Brankas Pusat & Audit Transaksi Pengguna</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-card p-2 px-4 rounded-xl border border-border">
            <input 
              type="checkbox" 
              id="autoSuspend" 
              checked={autoSuspend} 
              onChange={(e) => setAutoSuspend(e.target.checked)} 
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <label htmlFor="autoSuspend" className="text-[10px] font-black uppercase italic text-foreground cursor-pointer">Auto-Suspend Suspects</label>
          </div>
          <Button 
            onClick={handleRunReconciliation} 
            disabled={isLoading}
            className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg hover:scale-[1.02] transition-transform"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Jalankan Rekonsiliasi Audit
          </Button>
        </div>
      </header>

      {/* QUICK STATUS METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
              <Database className="w-6 h-6" />
            </div>
            <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-widest px-2 h-5 italic">Ledger Node</Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">Nasabah Diperiksa</p>
            <p className="text-2xl font-black italic tracking-tighter text-foreground">{latestRun?.totalUsersAudited || 0} Akun</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">
              {latestRun?.timestamp ? `Terakhir: ${new Date(latestRun.timestamp.seconds * 1000).toLocaleString()}` : 'Belum pernah dijalankan'}
            </p>
          </div>
        </Card>

        <Card className={`border-none bg-card rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-44 border-2 ${latestRun?.flaggedUsersCount > 0 ? 'border-rose-500 bg-rose-500/[0.02]' : 'border-border/50'}`}>
          <div className="flex justify-between items-start">
            <div className={`w-12 h-12 rounded-2xl bg-muted flex items-center justify-center ${latestRun?.flaggedUsersCount > 0 ? 'text-rose-500' : 'text-green-600'}`}>
              {latestRun?.flaggedUsersCount > 0 ? <Skull className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <Badge variant="outline" className={`text-[7px] font-black uppercase tracking-widest px-2 h-5 italic ${latestRun?.flaggedUsersCount > 0 ? 'border-rose-500 text-rose-500' : 'border-green-500 text-green-500'}`}>
              {latestRun?.flaggedUsersCount > 0 ? 'CRITICAL' : 'SECURE'}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">Discrepancy / Phantom Alerts</p>
            <p className={`text-2xl font-black italic tracking-tighter ${latestRun?.flaggedUsersCount > 0 ? 'text-rose-500' : 'text-foreground'}`}>
              {latestRun?.flaggedUsersCount || 0} Kasus
            </p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">Indikasi saldo hasil manipulasi/injeksi</p>
          </div>
        </Card>

        <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-44">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-amber-500">
              <Wallet className="w-6 h-6" />
            </div>
            <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-widest px-2 h-5 italic">Central Vault</Badge>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">System Liquidity Health</p>
            <p className="text-2xl font-black italic tracking-tighter text-foreground">
              {latestRun?.deficiencies && Object.values(latestRun.deficiencies).some((v: any) => v > 0.01) ? (
                <span className="text-rose-500">Deficit Alert</span>
              ) : (
                <span className="text-green-600">Fully Backed</span>
              )}
            </p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">Perbandingan database vs on-chain wallet</p>
          </div>
        </Card>
      </div>

      {/* SYSTEM VAULT VS DATABASE SUMMARY */}
      <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-muted/30">
          <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Coins className="w-5 h-5 text-primary" /> Rekonsiliasi Aset Riil vs Liabilitas Database
          </h4>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit perbandingan saldo seluruh nasabah dengan saldo on-chain wallet AliBank</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-6">Nama Aset</th>
                <th className="px-8 py-6">Kustodi Database (Users Balance)</th>
                <th className="px-8 py-6">Brankas Pusat (On-Chain/Gateway)</th>
                <th className="px-8 py-6 text-right">Defisit / Discrepancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {latestRun?.totalCustody ? (
                ['IDR', 'ALX', 'USDT', 'ETH', 'BTC'].map((asset) => {
                  const custody = latestRun.totalCustody[asset] || 0;
                  const vault = latestRun.totalVault?.[asset] || 0;
                  const diff = latestRun.deficiencies?.[asset] || 0;
                  
                  return (
                    <tr key={asset} className="hover:bg-muted/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black italic text-foreground">{asset}</span>
                          {asset === 'BTC' && <Badge variant="outline" className="text-[7px] border-border text-muted-foreground">Custodial Only</Badge>}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold">
                          {asset === 'IDR' ? `Rp ${custody.toLocaleString('id-ID')}` : `${custody.toFixed(6)} ${asset}`}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">
                          ≈ Rp {(custody * (priceMap[asset] || 0)).toLocaleString('id-ID')}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold">
                          {asset === 'BTC' ? 'N/A' : (asset === 'IDR' ? `Rp ${vault.toLocaleString('id-ID')}` : `${vault.toFixed(6)} ${asset}`)}
                        </p>
                        {asset !== 'BTC' && (
                          <p className="text-[8px] font-bold text-muted-foreground uppercase">
                            ≈ Rp {(vault * (priceMap[asset] || 0)).toLocaleString('id-ID')}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right font-black italic">
                        {diff > 0.0001 ? (
                          <span className="text-rose-600 flex items-center justify-end gap-1.5 animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                            Defisit: {asset === 'IDR' ? `Rp ${diff.toLocaleString('id-ID')}` : `${diff.toFixed(6)} ${asset}`}
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center justify-end gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Balans / Backup Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center opacity-40 italic text-xs">
                    Silakan jalankan audit rekonsiliasi untuk melihat status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* SUSPECT FRAUD USER TABLE */}
      <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Akun Terdeteksi Anomali
            </h4>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Daftar nasabah yang memiliki saldo melebihi total riwayat transaksinya</p>
          </div>
          
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari tersangka fraud..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 pl-10 bg-background border-none rounded-xl text-[10px] font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-6">Nasabah</th>
                <th className="px-8 py-6">Aset Terpengaruh</th>
                <th className="px-8 py-6">Discrepancy (Saldo Hantu)</th>
                <th className="px-8 py-6">Status Akun</th>
                <th className="px-8 py-6 text-right">Tindakan Pengamanan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFlaggedUsers.map((u: any) => (
                <tr key={u.userId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-8 py-5">
                    <div>
                      <p className="text-sm font-black italic uppercase text-foreground">{u.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground font-mono">{u.email}</p>
                      <p className="text-[8px] font-bold text-primary uppercase mt-1">UID: {u.userId}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      {u.flaggedAssets.map((f: any) => (
                        <Badge key={f.asset} className="bg-rose-500/10 text-rose-500 border-none text-[8px] font-black mr-1 h-5 uppercase">
                          {f.asset}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      {u.flaggedAssets.map((f: any) => (
                        <p key={f.asset} className="text-xs font-bold text-rose-600 font-mono">
                          {f.asset}: +{f.diff.toFixed(f.asset === 'IDR' ? 0 : 6)} ({f.asset === 'IDR' ? 'IDR' : f.asset} unbacked)
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.isSuspended ? (
                      <Badge className="bg-rose-600 text-white border-none text-[8px] font-black uppercase italic px-2.5 py-1">
                        <Lock className="w-3 h-3 mr-1 inline-block" /> Suspended
                      </Badge>
                    ) : (
                      <Badge className="bg-green-600 text-white border-none text-[8px] font-black uppercase italic px-2.5 py-1">
                        <Unlock className="w-3 h-3 mr-1 inline-block" /> Active
                      </Badge>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setSelectedUserLedger(u);
                        }}
                        className="h-9 text-[9px] font-black uppercase rounded-lg border-border text-foreground hover:bg-muted"
                      >
                        Buku Besar
                      </Button>
                      
                      <Button 
                        size="sm" 
                        variant={u.isSuspended ? "default" : "destructive"} 
                        disabled={isActionLoading === u.userId}
                        onClick={() => toggleUserSuspendStatus(u.userId, u.isSuspended)}
                        className={`h-9 text-[9px] font-black uppercase rounded-lg ${u.isSuspended ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white'}`}
                      >
                        {isActionLoading === u.userId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : u.isSuspended ? (
                          <>Aktifkan</>
                        ) : (
                          <>Bekukan</>
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {latestRun && filteredFlaggedUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center opacity-40 italic text-xs">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-green-600" />
                    Tidak ada akun nasabah yang terdeteksi memiliki saldo fiktif/mismatch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* WARNING FOOTER */}
      {latestRun?.rpcErrors && latestRun.rpcErrors.length > 0 && (
        <div className="p-6 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 space-y-2">
          <p className="text-xs font-black uppercase text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Masalah Jaringan Blockchain (RPC Warning)
          </p>
          <ul className="list-disc pl-5 text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
            {latestRun.rpcErrors.map((err: string, i: number) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  function setSelectedUserLedger(user: any) {
    // Switch to client ledger tab and let admin examine
    setActiveTab('ledger');
    toast({
      title: "Membuka Buku Besar",
      description: `Membuka riwayat audit detail untuk nasabah: ${user.name}`
    });
  }
}
