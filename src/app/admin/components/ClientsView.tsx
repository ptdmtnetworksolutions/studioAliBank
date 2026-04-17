
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  FileText, 
  ShieldCheck, 
  Wallet, 
  Plus, 
  Minus, 
  Loader2,
  ExternalLink,
  Smartphone,
  Hash,
  Calendar,
  Clock,
  Briefcase,
  Globe,
  Landmark,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  History,
  Zap,
  Bitcoin,
  Cpu,
  CheckCircle2,
  Check,
  MapPin,
  ChevronRight,
  ShieldX,
  Lock,
  ArrowUpRight
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function ClientsView({ allUsers }: any) {
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [alxAdjustment, setAlxAdjustment] = useState("");
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);

  const filteredUsers = allUsers?.filter((u: any) => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.accountNumber?.includes(searchTerm)
  );

  useEffect(() => {
    async function fetchDetails() {
      if (!selectedUser || !db || !isDialogOpen) return;
      setLoadingSub(true);
      try {
        const q = query(
          collection(db, "users", selectedUser.id, "transactions"), 
          orderBy("timestamp", "desc"), 
          limit(100)
        );
        const snapshot = await getDocs(q);
        setUserTxs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Audit fetch failed:", e);
      } finally { setLoadingSub(false); }
    }
    fetchDetails();
  }, [selectedUser, isDialogOpen, db]);

  const handleAdjust = async (type: 'idr' | 'alx', op: 'add' | 'sub') => {
    if (!db || !selectedUser) return;
    const amt = parseFloat(type === 'idr' ? balanceAdjustment : alxAdjustment);
    if (isNaN(amt)) return;

    const ref = doc(db, "users", selectedUser.id);
    const val = op === 'add' ? amt : -amt;
    const key = type === 'idr' ? "totalBalance" : "cryptoBalances.ALX";

    await updateDoc(ref, { [key]: increment(val) });
    await addDoc(collection(db, "system", "audit", "global_transactions"), {
      id: `ADJ-${Date.now()}`,
      category: "Manual Adjustment",
      gateway: "Admin Terminal",
      amountIdr: type === 'idr' ? val : 0,
      description: `Penyesuaian manual ${amt} ${type.toUpperCase()} oleh Admin untuk ${selectedUser.name}`,
      timestamp: serverTimestamp(),
      status: "berhasil",
      userEmail: selectedUser.email
    });
    toast({ title: "Audit Log Tercatat", description: "Perubahan saldo telah disiarkan ke buku besar global." });
    setBalanceAdjustment(""); setAlxAdjustment("");
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("BEKUKAN & HAPUS NASABAH? Tindakan ini permanen dan akan mematikan akses likuiditas nasabah.")) return;
    await deleteDoc(doc(db!, "users", uid));
    toast({ title: "Nasabah Dinonaktifkan" });
  };

  // REKONSILIASI FORENSIK NASABAH
  const forensicCheck = useMemo(() => {
    if (!selectedUser || userTxs.length === 0) return { discrepancy: 0, isClean: true };
    const inflow = userTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0);
    const outflow = userTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0);
    const calculated = inflow - outflow;
    const actual = (selectedUser.totalBalance || 0) + (selectedUser.savings || 0);
    
    // Toleransi 100 rupiah untuk pembulatan
    const diff = actual - calculated;
    return { 
      discrepancy: diff, 
      isClean: Math.abs(diff) < 100,
      totalActivity: userTxs.length
    };
  }, [selectedUser, userTxs]);

  return (
    <div className="animate-in fade-in slide-in-from-right-10 duration-700 space-y-8">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Nasabah</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit Keamanan & Kontrol Likuiditas Dompet</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Email atau UID Nasabah..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-card border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-6">Entitas Nasabah</th>
                <th className="px-8 py-6">Status Audit</th>
                <th className="px-8 py-6">Saldo IDR</th>
                <th className="px-8 py-6">Saldo ALX</th>
                <th className="px-8 py-6">Aset Kripto Lain</th>
                <th className="px-8 py-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers?.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => { setSelectedUser(u); setIsDialogOpen(true); }}>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center relative">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt="avatar" width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase leading-none">{u.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1.5 lowercase">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {u.totalBalance > 10000000 ? (
                      <Badge className="bg-amber-100 text-amber-600 border-none text-[8px] font-black uppercase px-2 h-5">HIGH BALANCE</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-600 border-none text-[8px] font-black uppercase px-2 h-5">NORMAL</Badge>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[13px] font-black italic text-foreground">Rp {u.totalBalance?.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase italic">UID: {u.accountNumber}</p>
                  </td>
                  <td className="px-8 py-5 text-[13px] font-black italic text-primary">
                    {u.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase">USDT</span><span className="text-[11px] font-bold text-teal-600">{u.cryptoBalances?.USDT?.toFixed(2) || '0.00'}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase">BTC</span><span className="text-[11px] font-bold text-orange-500">{u.cryptoBalances?.BTC?.toFixed(8) || '0.0000'}</span></div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-all" title="Audit Forensik"><ArrowUpRight className="w-5 h-5" /></button>
                      <button className="p-2 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all" onClick={() => handleDelete(u.id)} title="Bekukan Akun"><ShieldX className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl rounded-[3.5rem] p-0 bg-background border-none shadow-2xl overflow-hidden overflow-y-auto max-h-[95vh] no-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>Audit Forensik: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="gold-gradient h-40 w-full relative">
            <div className="absolute -bottom-12 left-12 w-32 h-32 rounded-[2.5rem] bg-background border-[10px] border-background overflow-hidden shadow-2xl flex items-center justify-center">
              {selectedUser?.avatarUrl ? (
                <Image src={selectedUser.avatarUrl} alt="avatar" width={120} height={120} className="object-cover w-full h-full" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="pt-16 px-12 pb-12 space-y-10">
            <header className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser?.name}</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{selectedUser?.email}</p>
                <div className="flex gap-2 mt-4">
                   <Badge className={cn(
                    "font-black italic text-[9px] px-4 h-7 uppercase border-none",
                    selectedUser?.kycStatus === 'verified' ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {selectedUser?.kycStatus === 'verified' ? 'Verified Client' : 'Pending Verification'}
                  </Badge>
                  <Badge variant="outline" className="border-primary/20 text-primary font-black italic text-[9px] px-4 h-7 uppercase">
                    Level: {selectedUser?.tier || 'Regular'}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="text-[10px] font-black uppercase text-muted-foreground italic">Skor Risiko AML</p>
                {forensicCheck.isClean ? (
                  <Badge className="bg-green-100 text-green-600 border-none font-black text-[10px] px-4 h-8 uppercase">Sangat Aman</Badge>
                ) : (
                  <Badge className="bg-rose-600 text-white border-none font-black text-[10px] px-4 h-8 uppercase animate-bounce">Tinggi (Anomali)</Badge>
                )}
              </div>
            </header>

            <Tabs defaultValue="audit" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="bg-muted/50 p-1.5 rounded-[2rem] h-14 border border-border gap-2">
                  <TabsTrigger value="audit" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><ShieldCheck className="w-4 h-4 mr-2" /> Audit Forensik</TabsTrigger>
                  <TabsTrigger value="finance" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><Wallet className="w-4 h-4 mr-2" /> Penyesuaian Saldo</TabsTrigger>
                  <TabsTrigger value="kyc" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><FileText className="w-4 h-4 mr-2" /> Dokumen KYC</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="audit" className="space-y-8 animate-in fade-in duration-500">
                {!forensicCheck.isClean && (
                  <Card className="p-6 bg-rose-600 text-white rounded-3xl border-none shadow-xl flex items-center gap-6">
                    <AlertTriangle className="w-10 h-10 shrink-0" />
                    <div>
                      <h4 className="text-lg font-black uppercase italic">Ketidaksesuaian Dana Terdeteksi!</h4>
                      <p className="text-xs font-bold uppercase opacity-80">Ada selisih Rp {Math.abs(forensicCheck.discrepancy).toLocaleString()} antara catatan transaksi dan saldo riil dompet nasabah. Periksa indikasi Top-Up Ilegal.</p>
                    </div>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ForensicStatCard label="Total Dana Masuk" value={`Rp ${userTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0).toLocaleString()}`} icon={TrendingUp} color="text-green-600" />
                  <ForensicStatCard label="Total Dana Keluar" value={`Rp ${userTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0).toLocaleString()}`} icon={TrendingDown} color="text-rose-600" />
                  <ForensicStatCard label="Saldo Tak Ter-Audit" value={`Rp ${Math.abs(forensicCheck.discrepancy).toLocaleString()}`} icon={ShieldAlert} color={forensicCheck.isClean ? "text-muted-foreground" : "text-rose-600"} />
                </div>

                <Card className="border-none bg-muted/30 rounded-[2.5rem] overflow-hidden shadow-inner">
                  <div className="p-6 border-b border-border bg-muted/50 flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Log Aktivitas Dompet Riil</h4>
                    <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase px-2 h-5 italic">Deep Reconciliation Mode</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/80 text-[8px] font-black uppercase text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-8 py-4">Waktu</th>
                          <th className="px-8 py-4">Kategori / Sumber</th>
                          <th className="px-8 py-4">Deskripsi</th>
                          <th className="px-8 py-4 text-right">Nilai Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {userTxs.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/50 transition-colors">
                            <td className="px-8 py-4 text-[9px] font-mono font-bold text-muted-foreground italic">
                              {tx.timestamp?.toDate?.().toLocaleString() || tx.date || '---'}
                            </td>
                            <td className="px-8 py-4">
                              <Badge variant="outline" className="border-primary/20 text-accent font-black text-[7px] uppercase px-1.5 h-4 italic">{tx.category || 'Aktivitas'}</Badge>
                            </td>
                            <td className="px-8 py-4 text-[10px] font-bold text-foreground uppercase italic leading-tight">
                              {tx.description}
                            </td>
                            <td className="px-8 py-4 text-right">
                              <span className={cn(
                                "text-[11px] font-black italic",
                                tx.type === 'income' ? "text-green-600" : "text-rose-600"
                              )}>
                                {tx.type === 'income' ? '+' : '-'}Rp{(tx.amount || tx.amountIdr || 0).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="finance" className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Kontrol Likuiditas IDR</label>
                    <div className="p-8 rounded-[2.5rem] bg-muted/50 border border-border flex flex-col gap-6 shadow-inner">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Saldo Saat Ini</p>
                        <p className="text-3xl font-black italic tracking-tighter">Rp {selectedUser?.totalBalance?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-3">
                        <Input placeholder="Input Jumlah..." type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} className="h-14 bg-background border-none rounded-2xl text-base font-black italic focus:ring-2 focus:ring-primary/20" />
                        <button onClick={() => handleAdjust('idr', 'add')} className="w-14 h-14 rounded-2xl bg-green-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Plus className="w-6 h-6" /></button>
                        <button onClick={() => handleAdjust('idr', 'sub')} className="w-14 h-14 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Minus className="w-6 h-6" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Aset ALX Nasabah</label>
                    <div className="p-8 rounded-[2.5rem] bg-muted/50 border border-border flex flex-col gap-6 shadow-inner">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Saldo ALX</p>
                        <p className="text-3xl font-black italic tracking-tighter text-primary">{selectedUser?.cryptoBalances?.ALX?.toFixed(4)} ALX</p>
                      </div>
                      <div className="flex gap-3">
                        <Input placeholder="Input ALX..." type="number" value={alxAdjustment} onChange={(e) => setAlxAdjustment(e.target.value)} className="h-14 bg-background border-none rounded-2xl text-base font-black italic focus:ring-2 focus:ring-primary/20" />
                        <button onClick={() => handleAdjust('alx', 'add')} className="w-14 h-14 rounded-2xl gold-gradient text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Plus className="w-6 h-6" /></button>
                        <button onClick={() => handleAdjust('alx', 'sub')} className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"><Minus className="w-6 h-6" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kyc" className="animate-in fade-in duration-500">
                {selectedUser?.kycData ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                      <h4 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><FileText className="w-4 h-4" /> Data Identitas Terenkripsi</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <KycItem label="NIK" value={selectedUser.kycData.idNumber} isMono />
                        <KycItem label="Nama KTP" value={selectedUser.kycData.nama} />
                        <KycItem label="Alamat" value={selectedUser.kycData.alamat} />
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h4 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><Lock className="w-4 h-4" /> Bukti Biometrik</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="aspect-[1.6/1] rounded-2xl bg-muted overflow-hidden border border-border relative group">
                           {selectedUser.kycData.idCardUrl && <img src={selectedUser.kycData.idCardUrl} alt="ID" className="w-full h-full object-cover" />}
                        </div>
                        <div className="aspect-[1.6/1] rounded-2xl bg-muted overflow-hidden border border-border relative group">
                           {selectedUser.kycData.selfieUrl && <img src={selectedUser.kycData.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />}
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-20 italic font-black uppercase tracking-widest">Nasabah belum melengkapi dokumen identitas.</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ForensicStatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="p-6 rounded-[2rem] bg-muted/50 border border-border flex items-center gap-5 shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner", color + " bg-white/10")}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter", color)}>{value}</p>
      </div>
    </div>
  );
}

function KycItem({ label, value, isMono = false }: any) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border">
      <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">{label}</p>
      <p className={cn("text-xs font-bold uppercase italic", isMono && "font-mono")}>{value || "---"}</p>
    </div>
  );
}
