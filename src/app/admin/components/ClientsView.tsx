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
  Cpu
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
import { sendPasswordResetEmail } from "firebase/auth";
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
          limit(50)
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
      category: "Penyesuaian Manual",
      amountIdr: type === 'idr' ? val : 0,
      description: `${op === 'add' ? 'Tambah' : 'Kurang'} manual ${amt} ${type.toUpperCase()} untuk ${selectedUser.name}`,
      timestamp: serverTimestamp(),
      status: "berhasil",
      userEmail: selectedUser.email
    });
    toast({ title: "Pembaruan Berhasil" });
    setBalanceAdjustment(""); setAlxAdjustment("");
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Bekukan & Hapus nasabah permanen?")) return;
    await deleteDoc(doc(db!, "users", uid));
    toast({ title: "Nasabah Dihapus" });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-10 duration-700 space-y-8">
      <header className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Nasabah</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manajemen & Audit Database Nasabah AliBank</p>
        </div>
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nama, Email, atau UID..." 
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
                <th className="px-8 py-6">ID Rekening</th>
                <th className="px-8 py-6">Saldo IDR</th>
                <th className="px-8 py-6">Saldo ALX</th>
                <th className="px-8 py-6">Aset Kripto Lain</th>
                <th className="px-8 py-6 text-right">Tindakan Audit</th>
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
                        {u.kycStatus === 'verified' && <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-card"><Check className="w-2 h-2 text-white" /></div>}
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase leading-none">{u.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1.5 lowercase">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <Badge variant="outline" className="font-mono font-bold text-accent border-accent/20 px-2 h-6">{u.accountNumber}</Badge>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[13px] font-black italic text-foreground">Rp {u.totalBalance?.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Tabungan: Rp{u.savings?.toLocaleString() || 0}</p>
                  </td>
                  <td className="px-8 py-5 text-[13px] font-black italic text-primary">
                    {u.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-4">
                      <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase">USDT</span><span className="text-[11px] font-bold text-teal-600">{u.cryptoBalances?.USDT?.toFixed(2) || '0.00'}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase">BTC</span><span className="text-[11px] font-bold text-orange-500">{u.cryptoBalances?.BTC?.toFixed(8) || '0.0000'}</span></div>
                      <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase">ETH</span><span className="text-[11px] font-bold text-blue-500">{u.cryptoBalances?.ETH?.toFixed(6) || '0.0000'}</span></div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-primary/10 hover:text-primary" onClick={() => { setSelectedUser(u); setIsDialogOpen(true); }}><ShieldAlert className="w-5 h-5" /></Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl hover:bg-rose-100 hover:text-rose-600" onClick={() => handleDelete(u.id)}><Trash2 className="w-5 h-5" /></Button>
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
            <DialogTitle>Audit & Profil: {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="gold-gradient h-40 w-full relative">
            <div className="absolute -bottom-12 left-12 w-32 h-32 rounded-[2.5rem] bg-background border-[10px] border-background overflow-hidden shadow-2xl flex items-center justify-center">
              {selectedUser?.avatarUrl ? (
                <Image src={selectedUser.avatarUrl} alt="avatar" width={120} height={120} className="object-cover w-full h-full" />
              ) : (
                <User className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <div className="absolute top-6 right-8 flex gap-3">
               <Badge className="bg-black/20 text-white backdrop-blur-md border-none px-4 py-1.5 rounded-full font-black uppercase text-[9px] tracking-widest italic">
                  ALX-PROTOCOL SECURE NODE
               </Badge>
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
              <div className="flex flex-col items-end gap-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">ID Rekening Utama</p>
                <p className="text-xl font-mono font-bold text-accent tracking-widest">{selectedUser?.accountNumber}</p>
              </div>
            </header>

            <Tabs defaultValue="audit" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="bg-muted/50 p-1.5 rounded-[2rem] h-14 border border-border gap-2">
                  <TabsTrigger value="audit" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><ShieldCheck className="w-4 h-4 mr-2" /> Audit Saldo</TabsTrigger>
                  <TabsTrigger value="finance" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><Wallet className="w-4 h-4 mr-2" /> Penyesuaian</TabsTrigger>
                  <TabsTrigger value="kyc" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><FileText className="w-4 h-4 mr-2" /> Data KYC</TabsTrigger>
                  <TabsTrigger value="wallets" className="rounded-[1.5rem] px-10 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white"><Smartphone className="w-4 h-4 mr-2" /> Dompet</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="audit" className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AuditSummaryCard 
                    label="Total Inflow (Lengkap)" 
                    value={`Rp ${userTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0).toLocaleString()}`} 
                    sub="Seluruh Dana Masuk" 
                    icon={TrendingUp} 
                    color="text-green-600" 
                  />
                  <AuditSummaryCard 
                    label="Total Outflow" 
                    value={`Rp ${userTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || t.amountIdr || 0), 0).toLocaleString()}`} 
                    sub="Penarikan & Belanja" 
                    icon={TrendingDown} 
                    color="text-rose-600" 
                  />
                  <AuditSummaryCard 
                    label="Trade-X Volume" 
                    value={`Rp ${userTxs.filter(t => t.category === 'Trade-X').reduce((acc, t) => acc + (t.stakeAmount || 0) * 194004, 0).toLocaleString()}`} 
                    sub="Aktivitas Prediksi Tinggi" 
                    icon={Zap} 
                    color="text-primary" 
                  />
                </div>

                <Card className="border-none bg-muted/30 rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 border-b border-border bg-muted/50 flex justify-between items-center">
                    <h4 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><History className="w-4 h-4 text-primary" /> Buku Besar Aktivitas Nasabah</h4>
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5 italic">Real-Time Ledger</Badge>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-muted/80 text-[8px] font-black uppercase text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-8 py-4">Waktu</th>
                          <th className="px-8 py-4">Kategori</th>
                          <th className="px-8 py-4">Deskripsi Operasi</th>
                          <th className="px-8 py-4 text-right">Nilai Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {userTxs.map((tx) => (
                          <tr key={tx.id} className="hover:bg-muted/50 transition-colors group">
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
                        {userTxs.length === 0 && (
                          <tr><td colSpan={4} className="py-12 text-center opacity-20 italic font-black uppercase tracking-widest text-xs">Belum ada rekaman transaksi terdeteksi.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
                
                <div className="p-8 rounded-[2.5rem] bg-rose-600/5 border border-rose-600/10 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-rose-600 flex items-center justify-center shrink-0 shadow-xl shadow-rose-600/20">
                    <AlertTriangle className="text-white w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase italic tracking-tight text-rose-600">Protokol Anti-Pencucian Uang (AML)</h4>
                    <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic">
                      Sistem mendeteksi aktivitas nasabah berdasarkan pola frekuensi dan lonjakan saldo. Transaksi di atas **Rp 10.000.000** yang dilakukan oleh nasabah tanpa KYC lengkap akan secara otomatis ditandai untuk peninjauan manual lebih lanjut oleh Super Admin.
                    </p>
                  </div>
                </div>
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
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Kepemilikan Aset ALX</label>
                    <div className="p-8 rounded-[2.5rem] bg-muted/50 border border-border flex flex-col gap-6 shadow-inner">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Saldo ALX Saat Ini</p>
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

                <div className="p-8 rounded-[2.5rem] bg-slate-900 border border-white/5 space-y-6">
                   <h4 className="text-xs font-black uppercase italic tracking-widest text-primary flex items-center gap-2"><Cpu className="w-4 h-4" /> Manajemen Portofolio Kripto Lintas Jaringan</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <CryptoControlItem icon={Bitcoin} label="Bitcoin (BTC)" value={selectedUser?.cryptoBalances?.BTC || 0} color="text-orange-500" />
                      <CryptoControlItem icon={Cpu} label="Ethereum (ETH)" value={selectedUser?.cryptoBalances?.ETH || 0} color="text-blue-500" />
                      <CryptoControlItem icon={Zap} label="Tether (USDT)" value={selectedUser?.cryptoBalances?.USDT || 0} color="text-teal-500" />
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="kyc" className="space-y-8 animate-in fade-in duration-500">
                {selectedUser?.kycData ? (
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Detail Identitas Terverifikasi AI
                        </h3>
                        <Badge className="bg-green-500 text-white border-none font-black italic text-[9px] uppercase px-4 h-7">KYC PROCESSED</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <KycDetail icon={Hash} label="NIK" value={selectedUser.kycData.idNumber} isMono />
                        <KycDetail icon={User} label="Nama Lengkap" value={selectedUser.kycData.nama} />
                        <KycDetail icon={Calendar} label="Tempat/Tgl Lahir" value={selectedUser.kycData.tempatTglLahir} />
                        <KycDetail icon={ShieldCheck} label="Jenis Kelamin" value={selectedUser.kycData.jenisKelamin} />
                        <KycDetail icon={MapPin} label="Alamat KTP" value={selectedUser.kycData.alamat} />
                        <KycDetail icon={Clock} label="Berlaku Hingga" value={selectedUser.kycData.berlakuHingga} />
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Dokumen Biometrik Terlampir
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">KTP / Kartu Identitas</p>
                          <div className="rounded-[3rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group shadow-xl">
                            {selectedUser.kycData.idCardUrl && <img src={selectedUser.kycData.idCardUrl} alt="ID" className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={selectedUser.kycData.idCardUrl} target="_blank" className="p-4 bg-white rounded-full text-black shadow-2xl"><ExternalLink className="w-6 h-6" /></a>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">Selfie Biometrik Langsung</p>
                          <div className="rounded-[3rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group shadow-xl">
                            {selectedUser.kycData.selfieUrl && <img src={selectedUser.kycData.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={selectedUser.kycData.selfieUrl} target="_blank" className="p-4 bg-white rounded-full text-black shadow-2xl"><ExternalLink className="w-6 h-6" /></a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="py-32 text-center space-y-6 opacity-20 italic">
                    <ShieldCheck className="w-20 h-20 mx-auto" />
                    <p className="text-base font-black uppercase tracking-[0.3em]">Nasabah belum melakukan verifikasi identitas.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wallets" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedUser?.withdrawalMethods?.map((method: any, i: number) => (
                    <Card key={i} className="p-8 rounded-[2.5rem] bg-muted/30 border border-border flex justify-between items-center group hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-primary shadow-inner">
                          {method.type === 'bank' ? <Landmark className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="text-base font-black italic uppercase leading-none">{method.provider}</p>
                            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black h-5 px-2 uppercase italic">{method.type}</Badge>
                          </div>
                          <p className="text-sm font-mono font-bold text-accent mt-2 tracking-widest">{method.accountNumber}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Atas Nama: {method.accountName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Status Link</p>
                        <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />
                      </div>
                    </Card>
                  ))}
                  {(!selectedUser?.withdrawalMethods || selectedUser.withdrawalMethods.length === 0) && (
                    <div className="col-span-2 py-32 text-center space-y-6 opacity-20 italic">
                      <Wallet className="w-20 h-20 mx-auto" />
                      <p className="text-base font-black uppercase tracking-[0.3em]">Belum ada metode penarikan terdaftar.</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditSummaryCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition-all group border border-border/50">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-[0.2em] px-2 h-5 italic">Audit Core</Badge>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-2">{label}</p>
        <p className={cn("text-2xl font-black italic tracking-tighter truncate", color)}>{value}</p>
        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1.5 opacity-60 italic">{sub}</p>
      </div>
    </Card>
  );
}

function CryptoControlItem({ icon: Icon, label, value, color }: any) {
  return (
    <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group hover:border-primary/20 transition-all">
       <div className="flex items-center gap-4">
          <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shadow-inner", color)}>
             <Icon className="w-5 h-5" />
          </div>
          <div>
             <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</p>
             <p className="text-base font-black italic text-white">{typeof value === 'number' ? value.toFixed(value < 1 ? 6 : 2) : value}</p>
          </div>
       </div>
       <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors" />
    </div>
  );
}

function KycDetail({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="p-5 rounded-[1.5rem] bg-muted/50 border border-border flex items-center gap-5 hover:border-primary/20 transition-all group">
      <div className="w-12 h-12 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm group-hover:gold-gradient group-hover:text-white transition-all shrink-0"><Icon className="w-6 h-6" /></div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{label}</p>
        <p className={cn(
          "text-[11px] font-bold uppercase italic truncate",
          isMono ? "font-mono text-accent" : "text-foreground"
        )}>{value || "---"}</p>
      </div>
    </div>
  );
}

function Check({ className }: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}