
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ChevronRight, 
  User, 
  ShieldCheck, 
  CreditCard, 
  Bell, 
  Moon, 
  Globe, 
  Info, 
  Lock,
  Loader2,
  Plus,
  Landmark,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  Hash,
  Save,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export default function SettingsHubPage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // Dialog visibility states
  const [isAddMethodOpen, setIsAddMethodOpen] = useState(false);
  const [isPersonalInfoOpen, setIsPersonalInfoOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Change Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Form State for Withdrawal Method
  const [newMethod, setNewMethod] = useState({
    type: 'bank', // 'bank' or 'ewallet'
    provider: '',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, loading } = useDoc(userDocRef);

  useEffect(() => {
    if (userData) {
      setEditName(userData.name || "");
      setEditPhone(userData.phone || "");
    }
  }, [userData]);

  const handleUpdateProfile = async () => {
    if (!userDocRef || !editName) return;
    setIsProcessing(true);
    try {
      await updateDoc(userDocRef, {
        name: editName,
        phone: editPhone
      });
      toast({ title: "Profil Diperbarui", description: "Informasi pribadi Anda telah berhasil disimpan." });
      setIsPersonalInfoOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Memperbarui", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Konfirmasi Gagal", description: "Kata sandi konfirmasi tidak cocok." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Terlalu Pendek", description: "Kata sandi minimal harus 6 karakter." });
      return;
    }
    
    if (!user) return;
    setIsProcessing(true);
    try {
      await updatePassword(user, newPassword);
      toast({ title: "Berhasil", description: "Kata sandi Anda telah diperbarui secara aman." });
      setIsChangePasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password update error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast({ 
          variant: "destructive", 
          title: "Sesi Kedaluwarsa", 
          description: "Demi keamanan, silakan keluar dan masuk kembali sebelum mengubah kata sandi." 
        });
      } else {
        toast({ variant: "destructive", title: "Gagal", description: error.message });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddMethod = async () => {
    if (!userDocRef || !newMethod.provider || !newMethod.accountNumber) return;
    setIsProcessing(true);
    try {
      const methodId = `WDM-${Date.now()}`;
      await updateDoc(userDocRef, {
        withdrawalMethods: arrayUnion({
          id: methodId,
          ...newMethod,
          createdAt: new Date().toISOString()
        })
      });
      toast({ title: "Metode Berhasil Ditambah", description: `${newMethod.provider} telah didaftarkan.` });
      setIsAddMethodOpen(false);
      setNewMethod({ type: 'bank', provider: '', accountNumber: '', accountName: '' });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menambah", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveMethod = async (method: any) => {
    if (!userDocRef || !confirm("Hapus metode penarikan ini?")) return;
    try {
      await updateDoc(userDocRef, {
        withdrawalMethods: arrayRemove(method)
      });
      toast({ title: "Metode Dihapus" });
    } catch (err) {}
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body transition-colors duration-300">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black italic uppercase tracking-tighter">Pengaturan</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 pt-6 space-y-8 overflow-y-auto no-scrollbar">
        {/* PROFILE SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Akun & Profil</h2>
            <Badge className={cn(
              "text-[8px] font-black uppercase px-2 h-5 border-none",
              userData?.kycStatus === 'verified' ? "bg-green-500/10 text-green-600" : 
              userData?.kycStatus === 'pending' ? "bg-amber-500/10 text-amber-600" :
              userData?.kycStatus === 'rejected' ? "bg-rose-500/10 text-rose-600" :
              "bg-muted text-muted-foreground"
            )}>
              {userData?.kycStatus === 'verified' ? 'Verified' : 
               userData?.kycStatus === 'pending' ? 'Pending' :
               userData?.kycStatus === 'rejected' ? 'Rejected' : 'Unverified'}
            </Badge>
          </div>
          
          <Card className="p-0 border-none bg-muted/30 overflow-hidden rounded-[1.5rem]">
            <SettingsItem 
              icon={User} 
              label="Informasi Pribadi" 
              value={userData?.name} 
              onClick={() => setIsPersonalInfoOpen(true)} 
            />
            <div className="h-px bg-border mx-4" />
            <SettingsItem 
              icon={ShieldCheck} 
              label="Verifikasi Identitas (KYC)" 
              value={
                userData?.kycStatus === 'verified' ? "Selesai" : 
                userData?.kycStatus === 'pending' ? "Sedang Ditinjau" : 
                "Klik untuk Verifikasi"
              }
              onClick={() => router.push('/settings/kyc')} 
            />
            <div className="h-px bg-border mx-4" />
            <SettingsItem 
              icon={Lock} 
              label="Ubah Kata Sandi" 
              onClick={() => setIsChangePasswordOpen(true)} 
            />
          </Card>
        </section>

        {/* WITHDRAWAL METHODS SECTION */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest italic">Metode Penerimaan Dana</h2>
            <button 
              onClick={() => setIsAddMethodOpen(true)}
              className="text-[10px] font-black text-primary uppercase italic flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>

          <div className="space-y-3">
            {userData?.withdrawalMethods?.map((method: any) => (
              <div key={method.id} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {method.type === 'bank' ? <Landmark className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-black italic uppercase leading-none">{method.provider}</p>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">{method.accountNumber}</p>
                  </div>
                </div>
                <button onClick={() => handleRemoveMethod(method)} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(!userData?.withdrawalMethods || userData.withdrawalMethods.length === 0) && (
              <Card className="p-8 border-dashed border-2 border-border bg-transparent text-center space-y-3 rounded-2xl">
                <AlertCircle className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Belum ada rekening atau e-wallet terdaftar. Tambahkan sekarang untuk dapat mencairkan aset Anda.
                </p>
              </Card>
            )}
          </div>
        </section>

        {/* APP PREFERENCES */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Aplikasi</h2>
          <Card className="p-0 border-none bg-muted/30 overflow-hidden rounded-[1.5rem]">
            <SettingsItem icon={Globe} label="Bahasa" value="Bahasa Indonesia" onClick={() => {}} />
            <div className="h-px bg-border mx-4" />
            <SettingsItem icon={Moon} label="Tampilan Tema" value="Otomatis" onClick={() => {}} />
            <div className="h-px bg-border mx-4" />
            <SettingsItem icon={Bell} label="Notifikasi" onClick={() => router.push('/notifications')} />
          </Card>
        </section>

        {/* ABOUT */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Tentang</h2>
          <Card className="p-0 border-none bg-muted/30 overflow-hidden rounded-[1.5rem]">
            <SettingsItem icon={Info} label="Versi Aplikasi" value="v3.5.2-stable" onClick={() => {}} />
            <div className="h-px bg-border mx-4" />
            <SettingsItem icon={ShieldCheck} label="Kebijakan Privasi" onClick={() => {}} />
          </Card>
        </section>

        <footer className="py-10 text-center space-y-4 opacity-30 grayscale">
          <div className="flex items-center justify-center gap-2">
            <LogoIcon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">AliBank V3 Global Node</span>
          </div>
        </footer>
      </main>

      {/* DIALOG INFORMASI PRIBADI */}
      <Dialog open={isPersonalInfoOpen} onOpenChange={setIsPersonalInfoOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-8 shadow-2xl overflow-hidden">
          <div className="gold-gradient h-2 w-full absolute top-0 left-0" />
          <DialogHeader className="text-center space-y-2 pt-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-3.5 mb-2"><User className="text-white w-full h-full" /></div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Informasi Pribadi</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">Detail identitas nasabah AliBank V3.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> Nama Lengkap (Sesuai ID)
                </label>
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nama Lengkap"
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Alamat Email (Permanen)
                </label>
                <div className="h-12 flex items-center px-4 rounded-xl bg-muted/20 border border-border/50 text-muted-foreground font-medium text-sm">
                  {userData?.email}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Nomor Telepon
                </label>
                <Input 
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0812xxxx"
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <Hash className="w-3 h-3" /> ID Rekening (UID)
                </label>
                <div className="h-12 flex items-center justify-between px-4 rounded-xl bg-muted/20 border border-border/50">
                  <span className="font-mono font-bold text-xs text-accent">{userData?.accountNumber}</span>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[7px] font-black h-4 px-1.5">NATIVE</Badge>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0" />
              <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Pastikan nama sesuai dengan ID pemerintah untuk kelancaran proses KYC dan pencairan dana riil.
              </p>
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isProcessing || !editName}
              className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> SIMPAN PERUBAHAN
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG UBAH KATA SANDI */}
      <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-8 shadow-2xl overflow-hidden">
          <div className="gold-gradient h-2 w-full absolute top-0 left-0" />
          <DialogHeader className="text-center space-y-2 pt-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-3.5 mb-2"><Lock className="text-white w-full h-full" /></div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Ubah Kata Sandi</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">Perbarui kredensial keamanan Anda.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Kata Sandi Baru
                </label>
                <Input 
                  type="password"
                  placeholder="Min. 6 karakter" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Konfirmasi Kata Sandi
                </label>
                <Input 
                  type="password"
                  placeholder="Ulangi kata sandi baru" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Peringatan: Jika sesi Anda sudah terlalu lama, Anda mungkin perlu masuk kembali untuk melakukan perubahan ini.
              </p>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isProcessing || !newPassword || !confirmPassword}
              className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "PERBARUI KATA SANDI"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG TAMBAH METODE */}
      <Dialog open={isAddMethodOpen} onOpenChange={setIsAddMethodOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-8 shadow-2xl">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Tambah Rekening</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">Daftarkan Bank atau e-Wallet penerima dana.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setNewMethod({...newMethod, type: 'bank'})}
                className={cn("h-12 rounded-xl font-black uppercase text-[10px] border-2 transition-all", newMethod.type === 'bank' ? "border-primary bg-primary/5 text-primary" : "border-muted text-muted-foreground")}
              >
                Bank Lokal
              </button>
              <button 
                onClick={() => setNewMethod({...newMethod, type: 'ewallet'})}
                className={cn("h-12 rounded-xl font-black uppercase text-[10px] border-2 transition-all", newMethod.type === 'ewallet' ? "border-primary bg-primary/5 text-primary" : "border-muted text-muted-foreground")}
              >
                e-Wallet
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Nama Provider (BCA, DANA, dll)</label>
                <Input 
                  placeholder="Contoh: BCA" 
                  value={newMethod.provider}
                  onChange={(e) => setNewMethod({...newMethod, provider: e.target.value})}
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Nomor Rekening / No HP</label>
                <Input 
                  placeholder="0000000000" 
                  value={newMethod.accountNumber}
                  onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                  className="h-12 rounded-xl bg-muted/50 border-none font-mono font-bold" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-muted-foreground uppercase ml-1">Nama Pemilik (Sesuai ID)</label>
                <Input 
                  placeholder="Contoh: Alex Thompson" 
                  value={newMethod.accountName}
                  onChange={(e) => setNewMethod({...newMethod, accountName: e.target.value})}
                  className="h-12 rounded-xl bg-muted/50 border-none font-bold" 
                />
              </div>
            </div>

            <Button 
              onClick={handleAddMethod} 
              disabled={isProcessing || !newMethod.provider || !newMethod.accountNumber}
              className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "SIMPAN REKENING"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsItem({ icon: Icon, label, value, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-5 hover:bg-muted/50 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm font-black italic uppercase text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-[10px] font-bold text-muted-foreground uppercase italic truncate max-w-[120px]">{value}</span>}
        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
