"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Camera, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Info,
  Lock,
  ChevronRight,
  Fingerprint
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useFirestore, useMemoFirebase, useStorage } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  collection 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export default function KycPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // KYC Data State
  const [kycForm, setKycData] = useState({
    fullName: "",
    idNumber: "",
    idType: "KTP",
    address: ""
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({ idCard: "", selfie: "" });

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'idCard' | 'selfie') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'idCard') {
        setIdCardFile(file);
        setPreviews(p => ({ ...p, idCard: URL.createObjectURL(file) }));
      } else {
        setSelfieFile(file);
        setPreviews(p => ({ ...p, selfie: URL.createObjectURL(file) }));
      }
    }
  };

  const checkDuplicates = async () => {
    if (!db || !user || !userData) return false;
    
    setIsProcessing(true);
    try {
      // 1. Cek Duplikasi NIK di seluruh koleksi users
      const nikQuery = query(
        collection(db, "users"), 
        where("kycData.idNumber", "==", kycForm.idNumber)
      );
      const nikSnap = await getDocs(nikQuery);
      const nikDuplicate = nikSnap.docs.find(d => d.id !== user.uid);

      if (nikDuplicate) {
        const dupData = nikDuplicate.data();
        toast({
          variant: "destructive",
          title: "NIK Sudah Terdaftar",
          description: `Nomor NIK ini sudah terdaftar pada akun dengan email: ${dupData.email}. Silakan gunakan akun tersebut.`,
        });
        return true;
      }

      // 2. Cek Duplikasi Nomor Telepon
      const phoneQuery = query(
        collection(db, "users"),
        where("phone", "==", userData.phone)
      );
      const phoneSnap = await getDocs(phoneQuery);
      const phoneDuplicate = phoneSnap.docs.find(d => d.id !== user.uid);

      if (phoneDuplicate) {
        const dupData = phoneDuplicate.data();
        toast({
          variant: "destructive",
          title: "Nomor Telepon Sudah Terdaftar",
          description: `Nomor telepon Anda sudah terdaftar pada akun dengan email: ${dupData.email}.`,
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error("Duplicate check error:", err);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isDuplicate = await checkDuplicates();
      if (isDuplicate) return;
      setStep(2);
    } else {
      setStep(step + 1);
    }
  };

  const handleSubmitKyc = async () => {
    if (!user || !db || !storage || !idCardFile || !selfieFile) return;
    setIsProcessing(true);

    try {
      // 1. Upload ID Card
      const idRef = ref(storage, `kyc_documents/${user.uid}/id_card_${Date.now()}.jpg`);
      await uploadBytes(idRef, idCardFile);
      const idUrl = await getDownloadURL(idRef);

      // 2. Upload Selfie
      const selfieRef = ref(storage, `kyc_documents/${user.uid}/selfie_${Date.now()}.jpg`);
      await uploadBytes(selfieRef, selfieFile);
      const selfieUrl = await getDownloadURL(selfieRef);

      // 3. Update User Profile in Firestore
      await updateDoc(userDocRef!, {
        kycStatus: "pending",
        kycData: {
          fullName: kycForm.fullName,
          idNumber: kycForm.idNumber,
          idType: kycForm.idType,
          address: kycForm.address,
          idCardUrl: idUrl,
          selfieUrl: selfieUrl,
          submittedAt: new Date().toISOString()
        }
      });

      toast({ title: "KYC Terkirim", description: "Admin akan memverifikasi identitas Anda dalam 24 jam." });
      setStep(4); // Success state
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengunggah", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  if (userData?.kycStatus === 'verified') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-accent tracking-tighter mb-2">TERVERIFIKASI</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest italic mb-8">Akun Anda telah divalidasi oleh Node Keamanan AliBank.</p>
        <Button onClick={() => router.push('/settings')} className="w-full max-w-xs h-14 gold-gradient text-white rounded-2xl font-black italic uppercase">Kembali ke Pengaturan</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black italic uppercase leading-none">Verifikasi Identitas</h1>
          <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">KYC V3.5 Protocol</span>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 space-y-8 overflow-y-auto no-scrollbar">
        {/* PROGRESS INDICATOR */}
        {step < 4 && (
          <div className="flex justify-between items-center px-4 relative mb-10">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div className={cn("absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500", step === 1 ? "w-0" : step === 2 ? "w-1/2" : "w-full")} />
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black italic text-xs relative z-10 border-2 transition-all duration-500", step >= s ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground")}>
                {s}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Data Pribadi</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Lengkapi informasi identitas sesuai dokumen resmi Anda.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Lengkap (Sesuai KTP)</label>
                <Input 
                  value={kycForm.fullName}
                  onChange={(e) => setKycData({...kycForm, fullName: e.target.value})}
                  placeholder="Masukkan Nama Lengkap"
                  className="h-14 rounded-2xl bg-muted/50 border-none font-bold italic"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nomor Identitas (NIK)</label>
                <Input 
                  value={kycForm.idNumber}
                  onChange={(e) => setKycData({...kycForm, idNumber: e.target.value})}
                  placeholder="320xxxxxxxxxxxxx"
                  className="h-14 rounded-2xl bg-muted/50 border-none font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Alamat Tinggal</label>
                <Input 
                  value={kycForm.address}
                  onChange={(e) => setKycData({...kycForm, address: e.target.value})}
                  placeholder="Alamat Lengkap"
                  className="h-14 rounded-2xl bg-muted/50 border-none font-bold italic"
                />
              </div>
            </div>

            <Button 
              disabled={!kycForm.fullName || !kycForm.idNumber || isProcessing}
              onClick={handleNextStep}
              className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl"
            >
              {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : (
                <>LANJUTKAN KE DOKUMEN <ChevronRight className="w-5 h-5 ml-2" /></>
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Unggah Dokumen</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Unggah foto KTP Anda dengan pencahayaan yang jelas.</p>
            </div>

            <div className="space-y-6">
              <input type="file" ref={idInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'idCard')} />
              <div 
                onClick={() => idInputRef.current?.click()}
                className={cn(
                  "aspect-[1.6/1] rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all overflow-hidden relative group",
                  previews.idCard ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted"
                )}
              >
                {previews.idCard ? (
                  <img src={previews.idCard} alt="ID Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform">
                      <CreditCard className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase text-foreground">Klik untuk Unggah KTP</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase italic mt-1">Pastikan seluruh data terbaca</p>
                    </div>
                  </>
                )}
              </div>

              <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                <Info className="w-6 h-6 text-blue-500 shrink-0" />
                <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Dokumen akan dienkripsi dan hanya digunakan untuk proses verifikasi kepatuhan perbankan AliBank V3.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[10px]">Kembali</Button>
              <Button 
                disabled={!idCardFile}
                onClick={() => setStep(3)}
                className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl"
              >
                LANJUT KE SELFIE
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Foto Biometrik</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Ambil foto selfie sambil memegang KTP Anda.</p>
            </div>

            <div className="space-y-6">
              <input type="file" ref={selfieInputRef} className="hidden" accept="image/*" capture="user" onChange={(e) => handleFileChange(e, 'selfie')} />
              <div 
                onClick={() => selfieInputRef.current?.click()}
                className={cn(
                  "aspect-square max-w-[280px] mx-auto rounded-full border-4 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all overflow-hidden relative group",
                  previews.selfie ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted"
                )}
              >
                {previews.selfie ? (
                  <img src={previews.selfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-primary/40 group-hover:scale-110 transition-transform">
                      <Camera className="w-8 h-8" />
                    </div>
                    <p className="text-[10px] font-black uppercase text-foreground">Klik untuk Ambil Foto</p>
                  </>
                )}
              </div>

              <div className="bg-muted/30 p-6 rounded-[2rem] border border-border space-y-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <span className="text-[10px] font-black uppercase italic">Analisis Node Keamanan</span>
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase italic"><CheckCircle2 className="w-3 h-3 text-green-500" /> Wajah menghadap ke depan</li>
                  <li className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase italic"><CheckCircle2 className="w-3 h-3 text-green-500" /> KTP tidak menutupi wajah</li>
                  <li className="flex items-center gap-2 text-[8px] font-bold text-muted-foreground uppercase italic"><CheckCircle2 className="w-3 h-3 text-green-500" /> Latar belakang polos</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[10px]">Kembali</Button>
              <Button 
                disabled={!selfieFile || isProcessing}
                onClick={handleSubmitKyc}
                className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "KIRIM VERIFIKASI"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-700 text-center">
            <div className="w-32 h-32 rounded-[3rem] bg-accent/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 gold-gradient opacity-10 animate-pulse" />
              <Fingerprint className="w-16 h-16 text-primary relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">DATA TERKIRIM</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic max-w-xs mx-auto leading-relaxed">
                Terima kasih. Berkas Anda telah masuk ke antrean verifikasi Node AliBank V3. Status Anda akan diperbarui dalam waktu maksimal 24 jam.
              </p>
            </div>
            <Button onClick={() => router.push('/settings')} className="w-full max-w-xs h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl">
              Kembali ke Dashboard
            </Button>
          </div>
        )}
      </main>

      {/* FOOTER SECURITY */}
      {step < 4 && (
        <footer className="px-6 py-10 opacity-30 grayscale flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest italic">Secured by AliBank Encryption</span>
          </div>
          <p className="text-[7px] font-bold text-center uppercase leading-tight max-w-[200px]">
            Data Anda dilindungi oleh SSL 256-bit dan enkripsi end-to-end pada server node otonom kami.
          </p>
        </footer>
      )}
    </div>
  );
}
