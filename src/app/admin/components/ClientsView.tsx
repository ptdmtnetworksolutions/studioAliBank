
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Edit2, 
  Trash2, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Key, 
  Wallet, 
  Plus, 
  Minus, 
  Loader2,
  User,
  FileText,
  MapPin,
  Hash,
  Calendar,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Globe,
  Landmark
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
        const [tSnap] = await Promise.all([
          getDocs(query(collection(db, "users", selectedUser.id, "transactions"), orderBy("timestamp", "desc"), limit(10)))
        ]);
        setUserTxs(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {} finally { setLoadingSub(false); }
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
      status: "berhasil"
    });
    toast({ title: "Pembaruan Berhasil" });
    setBalanceAdjustment(""); setAlxAdjustment("");
  };

  const handleDelete = async (uid: string) => {
    if (!confirm("Hapus nasabah permanen?")) return;
    await deleteDoc(doc(db!, "users", uid));
    toast({ title: "Nasabah Dihapus" });
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-10 duration-700 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Nasabah</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manajemen Database Nasabah AliBank</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nasabah..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-12 bg-card border-none rounded-xl text-xs font-bold shadow-sm"
          />
        </div>
      </header>

      <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-5">Nasabah</th>
                <th className="px-8 py-5">ID Rekening</th>
                <th className="px-8 py-5">Saldo IDR</th>
                <th className="px-8 py-5">Saldo ALX</th>
                <th className="px-8 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers?.map((u: any) => (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-border shrink-0 bg-muted flex items-center justify-center">
                        {u.avatarUrl ? (
                          <Image src={u.avatarUrl} alt="avatar" width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <User className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase leading-none">{u.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 lowercase">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-[10px] font-mono font-bold text-accent">{u.accountNumber}</td>
                  <td className="px-8 py-4 text-[11px] font-black italic">Rp {u.totalBalance?.toLocaleString()}</td>
                  <td className="px-8 py-4 text-[11px] font-black italic text-primary">{u.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX</td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => { setSelectedUser(u); setIsDialogOpen(true); }}><Edit2 className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-100 hover:text-rose-600" onClick={() => handleDelete(u.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-0 bg-background border-none shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] no-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>Profil Nasabah: {selectedUser?.name}</DialogTitle>
            <DialogDescription>Kelola parameter finansial, saldo koin ALX, dan pengaturan keamanan nasabah AliBank secara riil.</DialogDescription>
          </DialogHeader>
          
          <div className="gold-gradient h-32 w-full relative">
            <div className="absolute -bottom-10 left-10 w-24 h-24 rounded-[2rem] bg-background border-8 border-background overflow-hidden shadow-xl flex items-center justify-center">
              {selectedUser?.avatarUrl ? (
                <Image src={selectedUser.avatarUrl} alt="avatar" width={100} height={100} className="object-cover w-full h-full" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="pt-14 px-10 pb-10 space-y-8">
            <header className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{selectedUser?.name}</h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedUser?.email}</p>
              </div>
              <div className="flex gap-2">
                <Badge className={cn(
                  "font-black italic text-[8px] px-3 h-6 uppercase",
                  selectedUser?.kycStatus === 'verified' ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {selectedUser?.kycStatus === 'verified' ? 'Nasabah Terverifikasi' : 'Pengguna Standar'}
                </Badge>
                <Badge className="bg-muted text-foreground font-black italic text-[8px] px-3 h-6 uppercase">Sesi Aktif</Badge>
              </div>
            </header>

            <Tabs defaultValue="finance" className="space-y-6">
              <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 w-full justify-start gap-2 border border-border">
                <TabsTrigger value="finance" className="rounded-xl px-6 font-black uppercase text-[10px] italic">Keuangan</TabsTrigger>
                <TabsTrigger value="kyc" className="rounded-xl px-6 font-black uppercase text-[10px] italic">Data KYC</TabsTrigger>
                <TabsTrigger value="wallets" className="rounded-xl px-6 font-black uppercase text-[10px] italic">Dompet</TabsTrigger>
                <TabsTrigger value="security" className="rounded-xl px-6 font-black uppercase text-[10px] italic">Keamanan</TabsTrigger>
              </TabsList>

              <TabsContent value="finance" className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Pool IDR</label>
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col gap-4">
                      <p className="text-xl font-black italic">Rp {selectedUser?.totalBalance?.toLocaleString()}</p>
                      <div className="flex gap-2">
                        <Input placeholder="Jumlah" type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} className="h-10 bg-background border-none text-xs font-black" />
                        <button onClick={() => handleAdjust('idr', 'add')} className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => handleAdjust('idr', 'sub')} className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Kepemilikan ALX</label>
                    <div className="p-5 rounded-2xl bg-muted/50 border border-border flex flex-col gap-4">
                      <p className="text-xl font-black italic text-primary">{selectedUser?.cryptoBalances?.ALX?.toFixed(4)} ALX</p>
                      <div className="flex gap-2">
                        <Input placeholder="ALX" type="number" value={alxAdjustment} onChange={(e) => setAlxAdjustment(e.target.value)} className="h-10 bg-background border-none text-xs font-black" />
                        <button onClick={() => handleAdjust('alx', 'add')} className="w-10 h-10 rounded-lg gold-gradient text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                        <button onClick={() => handleAdjust('alx', 'sub')} className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kyc" className="space-y-8 animate-in fade-in duration-300">
                {selectedUser?.kycData ? (
                  <div className="space-y-10">
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Detail Identitas
                        </h3>
                        <Badge className={cn(
                          "text-[8px] font-black uppercase px-2 h-5 border-none",
                          selectedUser.kycStatus === 'verified' ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                        )}>
                          Status: {selectedUser.kycStatus}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <KycDetail icon={Hash} label="NIK" value={selectedUser.kycData.idNumber} isMono />
                        <KycDetail icon={User} label="Nama Lengkap" value={selectedUser.kycData.nama} />
                        <KycDetail icon={Calendar} label="Tempat/Tgl Lahir" value={selectedUser.kycData.tempatTglLahir} />
                        <KycDetail icon={ShieldCheck} label="Jenis Kelamin" value={selectedUser.kycData.jenisKelamin} />
                        <KycDetail icon={MapPin} label="Alamat KTP" value={selectedUser.kycData.alamat} />
                        <KycDetail icon={FileText} label="RT/RW" value={selectedUser.kycData.rtRw} />
                        <KycDetail icon={MapPin} label="Kel/Desa" value={selectedUser.kycData.kelDesa} />
                        <KycDetail icon={MapPin} label="Kecamatan" value={selectedUser.kycData.kecamatan} />
                        <KycDetail icon={ShieldCheck} label="Agama" value={selectedUser.kycData.agama} />
                        <KycDetail icon={User} label="Status Perkawinan" value={selectedUser.kycData.statusPerkawinan} />
                        <KycDetail icon={Briefcase} label="Pekerjaan" value={selectedUser.kycData.pekerjaan} />
                        <KycDetail icon={Globe} label="Kewarganegaraan" value={selectedUser.kycData.kewarganegaraan} />
                        <KycDetail icon={Clock} label="Berlaku Hingga" value={selectedUser.kycData.berlakuHingga} />
                        <KycDetail icon={MapPin} label="Provinsi" value={selectedUser.kycData.province} />
                        <KycDetail icon={Hash} label="Kode Pos" value={selectedUser.kycData.postalCode} />
                        <KycDetail icon={Smartphone} label="WhatsApp" value={selectedUser.kycData.whatsapp} />
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> Dokumen Terkirim
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">KTP / Kartu Identitas Depan</p>
                          <div className="rounded-[2.5rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group">
                            {selectedUser.kycData.idCardUrl && <img src={selectedUser.kycData.idCardUrl} alt="ID" className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={selectedUser.kycData.idCardUrl} target="_blank" className="p-3 bg-white rounded-full text-black shadow-xl"><ExternalLink className="w-5 h-5" /></a>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">Selfie Biometrik Langsung</p>
                          <div className="rounded-[2.5rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group">
                            {selectedUser.kycData.selfieUrl && <img src={selectedUser.kycData.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <a href={selectedUser.kycData.selfieUrl} target="_blank" className="p-3 bg-white rounded-full text-black shadow-xl"><ExternalLink className="w-5 h-5" /></a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                ) : (
                  <div className="py-20 text-center space-y-4 opacity-20 italic">
                    <ShieldCheck className="w-16 h-16 mx-auto" />
                    <p className="text-sm font-black uppercase tracking-widest">Nasabah belum melengkapi proses KYC.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wallets" className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                    <Landmark className="w-4 h-4" /> Metode Penarikan
                  </h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase italic">Hanya Sumber Terverifikasi</Badge>
                </div>

                <div className="space-y-3">
                  {selectedUser?.withdrawalMethods?.map((method: any, i: number) => (
                    <div key={i} className="p-6 rounded-[1.5rem] bg-muted/30 border border-border flex justify-between items-center group hover:border-primary/30 transition-all">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center text-primary shadow-sm">
                          {method.type === 'bank' ? <Landmark className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black italic uppercase leading-none">{method.provider}</p>
                            <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black h-4 px-1.5 uppercase">
                              {method.type}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono font-bold text-accent mt-1.5">{method.accountNumber}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-tight">AN: {method.accountName}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">Terdaftar</p>
                        <p className="text-[10px] font-black italic">{method.createdAt ? new Date(method.createdAt).toLocaleDateString() : '---'}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedUser?.withdrawalMethods || selectedUser.withdrawalMethods.length === 0) && (
                    <div className="py-20 text-center space-y-4 opacity-20 italic">
                      <Wallet className="w-12 h-12 mx-auto" />
                      <p className="text-sm font-black uppercase tracking-widest">Nasabah belum mendaftarkan metode penarikan.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4 animate-in fade-in duration-300">
                <Button variant="outline" className="w-full h-12 rounded-xl border-primary/20 text-primary font-black uppercase italic text-xs" onClick={() => sendPasswordResetEmail(auth!, selectedUser.email)}>Kirim Reset Password</Button>
                <div className="p-4 rounded-xl bg-accent/5 border border-primary/10">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Alamat Native: <span className="text-accent font-mono ml-2 break-all">{selectedUser?.walletAddress}</span></p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KycDetail({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center gap-4 group hover:border-primary/30 transition-all">
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm shrink-0"><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{label}</p>
        <p className={cn(
          "text-[10px] font-bold uppercase italic truncate",
          isMono ? "font-mono text-accent" : "text-foreground"
        )}>{value || "---"}</p>
      </div>
    </div>
  );
}
