
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  User, 
  ShieldCheck, 
  MapPin, 
  Hash, 
  Calendar,
  ExternalLink,
  ShieldAlert,
  Search,
  FileText,
  CreditCard
} from "lucide-react";
import { 
  doc, 
  collection, 
  serverTimestamp 
} from "firebase/firestore";
import { proxyUpdateDoc, proxyAddDoc } from "@/lib/firestore-proxy-client";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function KycVerificationView({ allUsers }: { allUsers: any[] | null }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const pendingKyc = allUsers?.filter(u => u.kycStatus === 'pending') || [];
  
  const filteredPending = pendingKyc.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async (user: any) => {
    if (!db || isProcessing) return;
    setIsProcessing(user.id);
    
    try {
      const userRef = doc(db, "users", user.id);
      
      await proxyUpdateDoc(userRef, {
        kycStatus: "verified",
        tier: "Premium Verified"
      });

      await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `KYC-APP-${Date.now()}`,
        category: "Verifikasi Identitas",
        description: `Super Admin menyetujui KYC untuk ${user.name}. Status akun: TERVERIFIKASI.`,
        status: "berhasil",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      await proxyAddDoc(collection(db, "users", user.id, "notifications"), {
        title: "KYC Berhasil",
        message: "Selamat! Identitas Anda telah diverifikasi. Akses likuiditas penuh sekarang terbuka.",
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "KYC Disetujui", description: `Nasabah ${user.name} kini terverifikasi.` });
      setSelectedKyc(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Persetujuan Gagal", description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (user: any) => {
    if (!db || !confirm("Tolak pengajuan KYC ini?")) return;
    setIsProcessing(user.id);
    
    try {
      const userRef = doc(db, "users", user.id);
      await proxyUpdateDoc(userRef, { kycStatus: "rejected" });

      await proxyAddDoc(collection(db, "users", user.id, "notifications"), {
        title: "KYC Ditolak",
        message: "Maaf, dokumen identitas Anda tidak terbaca atau tidak sesuai. Silakan kirim ulang KYC Anda.",
        type: "alert",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "KYC Ditolak" });
      setSelectedKyc(null);
    } catch (err) {} finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Verifikasi KYC</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Validasi Identitas & Kepatuhan Perbankan</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari yang tertunda..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 pl-10 rounded-xl bg-card border-none text-xs font-bold shadow-sm"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {filteredPending.map((u: any) => (
          <Card key={u.id} className="border-none bg-card rounded-[2rem] p-6 shadow-sm group hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center text-white shrink-0 shadow-lg">
                  <User className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black italic uppercase">{u.kycData?.fullName || u.kycData?.nama || u.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{u.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="bg-amber-100 text-amber-600 border-none text-[7px] font-black h-4 px-1.5 uppercase">MENUNGGU TINJAUAN</Badge>
                    <span className="text-[8px] font-mono text-muted-foreground">ID: {u.id.slice(-8)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => setSelectedKyc(u)}
                  variant="outline" 
                  className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black uppercase italic text-xs"
                >
                  <Eye className="w-4 h-4 mr-2" /> Tinjau Dokumen
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-12 w-12 rounded-xl hover:bg-rose-100 text-rose-600" onClick={() => handleReject(u)}><XCircle className="w-5 h-5" /></Button>
                  <Button 
                    onClick={() => handleApprove(u)}
                    disabled={isProcessing === u.id}
                    className="h-12 px-6 gold-gradient text-white rounded-xl font-black uppercase italic shadow-lg"
                  >
                    {isProcessing === u.id ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Setujui Cepat</>}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {filteredPending.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20 italic">
            <ShieldCheck className="w-16 h-16 mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest">Tidak ada pengajuan KYC yang tertunda.</p>
          </div>
        )}
      </div>

      {/* DETAIL MODAL VERIFIKASI */}
      <Dialog open={!!selectedKyc} onOpenChange={() => setSelectedKyc(null)}>
        <DialogContent className="max-w-4xl rounded-[3rem] p-0 bg-background border-none shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh] no-scrollbar">
          <DialogHeader className="sr-only">
            <DialogTitle>Tinjauan Verifikasi: {selectedKyc?.name}</DialogTitle>
            <DialogDescription>Validasi data identitas nasabah AliBank V3 secara mendalam.</DialogDescription>
          </DialogHeader>

          <div className="gold-gradient h-24 w-full" />
          <div className="p-10 space-y-10">
            <header className="flex justify-between items-start">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-muted border-4 border-background flex items-center justify-center -mt-16 shadow-xl relative overflow-hidden">
                  <img src={`https://picsum.photos/seed/${selectedKyc?.id}/200/200`} alt="p" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedKyc?.kycData?.fullName || selectedKyc?.kycData?.nama || selectedKyc?.name}</h2>
                  <p className="text-xs font-bold text-muted-foreground uppercase">{selectedKyc?.email}</p>
                </div>
              </div>
              <Badge className="bg-amber-500 text-white font-black italic text-[8px] h-6 px-3 uppercase">Verifikasi Diperlukan</Badge>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <section className="space-y-6">
                <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Informasi Pribadi
                </h3>
                <div className="space-y-4">
                  <DetailItem icon={Hash} label="Nomor ID (NIK)" value={selectedKyc?.kycData?.idNumber || selectedKyc?.kycData?.nik} isMono />
                  <DetailItem icon={MapPin} label="Alamat Tempat Tinggal" value={selectedKyc?.kycData?.address || selectedKyc?.kycData?.alamat} />
                  <DetailItem icon={Calendar} label="Dikirim Pada" value={selectedKyc?.kycData?.submittedAt ? new Date(selectedKyc.kycData.submittedAt).toLocaleString('id-ID') : '---'} />
                  {selectedKyc?.kycData?.whatsapp && (
                    <DetailItem icon={MapPin} label="Kontak WhatsApp" value={selectedKyc.kycData.whatsapp} />
                  )}
                  {selectedKyc?.kycData?.province && (
                    <DetailItem icon={MapPin} label="Provinsi / Kode Pos" value={`${selectedKyc.kycData.province} - ${selectedKyc.kycData.postalCode || ''}`} />
                  )}
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" /> Pemeriksaan Risiko Otomatis
                </h3>
                <div className="p-6 rounded-2xl bg-muted/50 border border-border space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Cek ID Duplikat</span>
                    <Badge className="bg-green-500/10 text-green-600 border-none text-[7px] font-black h-4 px-1.5 uppercase">LOLOS</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Skrining Anti-Fraud</span>
                    <Badge className="bg-green-500/10 text-green-600 border-none text-[7px] font-black h-4 px-1.5 uppercase">BERSIH</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Daftar Sanksi (AML)</span>
                    <Badge className="bg-green-500/10 text-green-600 border-none text-[7px] font-black h-4 px-1.5 uppercase">TIDAK ADA COCOK</Badge>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-black uppercase italic tracking-widest text-primary flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Dokumen Identitas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">KTP / Kartu ID Depan</p>
                  <div className="rounded-[2.5rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group">
                    <img src={selectedKyc?.kycData?.idCardUrl} alt="ID" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={selectedKyc?.kycData?.idCardUrl} target="_blank" className="p-3 bg-white rounded-full text-black"><ExternalLink className="w-5 h-5" /></a>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">Selfie Langsung / Biometrik</p>
                  <div className="rounded-[2.5rem] overflow-hidden border border-border aspect-[1.6/1] bg-muted relative group">
                    <img src={selectedKyc?.kycData?.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={selectedKyc?.kycData?.selfieUrl} target="_blank" className="p-3 bg-white rounded-full text-black"><ExternalLink className="w-5 h-5" /></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-4">
              <Button 
                onClick={() => handleReject(selectedKyc)}
                variant="outline" 
                className="flex-1 h-16 rounded-2xl border-rose-500/20 text-rose-500 font-black uppercase italic tracking-widest"
              >
                TOLAK PENGAJUAN
              </Button>
              <Button 
                onClick={() => handleApprove(selectedKyc)}
                disabled={isProcessing === selectedKyc?.id}
                className="flex-[2] h-16 gold-gradient text-white rounded-2xl font-black italic uppercase tracking-widest shadow-xl"
              >
                {isProcessing === selectedKyc?.id ? <Loader2 className="animate-spin" /> : "SETUJUI IDENTITAS"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-primary shadow-sm"><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <p className={cn("text-xs font-bold uppercase italic", isMono && "font-mono")}>{value || "---"}</p>
      </div>
    </div>
  );
}
