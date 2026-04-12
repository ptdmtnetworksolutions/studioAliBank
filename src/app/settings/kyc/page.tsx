"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  CreditCard, 
  Camera, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Info,
  Lock,
  ChevronRight,
  Fingerprint,
  FileText,
  RefreshCw,
  X,
  Zap,
  Scan,
  Smartphone,
  MapPin,
  Phone,
  Hash,
  Calendar,
  ShieldAlert
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
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
  collection,
  limit 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { extractKtpData } from "@/ai/flows/ocr-ktp-flow";

export default function KycPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState("");
  const [mounted, setMounted] = useState(false);

  // Form State
  const [kycForm, setKycData] = useState({
    nik: "",
    nama: "",
    tempatTglLahir: "",
    jenisKelamin: "",
    alamat: "",
    rtRw: "",
    kelDesa: "",
    kecamatan: "",
    agama: "",
    statusPerkawinan: "",
    pekerjaan: "",
    kewarganegaraan: "",
    berlakuHingga: "",
    province: "",
    postalCode: "",
    whatsapp: ""
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({ idCard: "", selfie: "" });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraActiveMode] = useState<'idCard' | 'selfie' | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraActiveMode(null);
  }, []);

  const startCamera = async (mode: 'idCard' | 'selfie') => {
    try {
      stopCamera();
      const constraints = {
        video: {
          facingMode: mode === 'idCard' ? "environment" : "user",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setCameraActiveMode(mode);
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 300);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Akses Kamera Gagal', description: 'Pastikan izin kamera diberikan di browser Anda.' });
    }
  };

  const capturePhoto = async (mode: 'idCard' | 'selfie') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `${mode}_${Date.now()}.jpg`, { type: 'image/jpeg' });
            if (mode === 'idCard') {
              setIdCardFile(file);
              setPreviews(p => ({ ...p, idCard: dataUrl }));
              stopCamera();
              await runFullOcr(dataUrl);
            } else {
              setSelfieFile(file);
              setPreviews(p => ({ ...p, selfie: dataUrl }));
              stopCamera();
            }
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const checkDuplicates = async (nik: string) => {
    if (!db || !user || !nik) return false;
    try {
      const qry = query(collection(db, "users"), where("kycData.idNumber", "==", nik), limit(1));
      const snap = await getDocs(qry);
      const duplicateDoc = snap.docs.find(d => d.id !== user.uid);
      
      if (duplicateDoc) {
        const existingData = duplicateDoc.data();
        setLinkedEmail(existingData.email || "akun lain");
        setIsDuplicate(true);
        return true;
      }
      setIsDuplicate(false);
      setLinkedEmail("");
      return false;
    } catch (e) { return false; }
  };

  const runFullOcr = async (dataUrl: string) => {
    setIsOcrLoading(true);
    setIsDuplicate(false);
    try {
      const res = await extractKtpData({ photoDataUri: dataUrl });
      if (res.isKtp) {
        const extractedNik = res.nik || "";
        setKycData(prev => ({
          ...prev,
          nik: extractedNik,
          nama: res.nama || "",
          tempatTglLahir: res.tempatTglLahir || "",
          jenisKelamin: res.jenisKelamin || "",
          alamat: res.alamat || "",
          rtRw: res.rtRw || "",
          kelDesa: res.kelDesa || "",
          kecamatan: res.kecamatan || "",
          agama: res.agama || "",
          statusPerkawinan: res.statusPerkawinan || "",
          pekerjaan: res.pekerjaan || "",
          kewarganegaraan: res.kewarganegaraan || "",
          berlakuHingga: res.berlakuHingga || ""
        }));

        if (extractedNik) {
          await checkDuplicates(extractedNik);
        }
        toast({ title: "Otentikasi Berhasil", description: "Data identitas berhasil diekstraksi." });
      } else {
        toast({ variant: "destructive", title: "Bukan KTP Valid", description: "Sistem gagal mendeteksi format KTP Indonesia." });
        setIdCardFile(null); setPreviews(p => ({ ...p, idCard: "" }));
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Node AI Sibuk", description: "Gagal mengekstrak data identitas." });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleSubmitKyc = async () => {
    if (!user || !db || !storage || !idCardFile || !selfieFile || !userDocRef) {
      toast({ variant: "destructive", title: "Dokumen Tidak Lengkap" });
      return;
    }

    setIsProcessing(true);
    try {
      const idRef = ref(storage, `kyc_documents/${user.uid}/id_card.jpg`);
      await uploadBytes(idRef, idCardFile);
      const idUrl = await getDownloadURL(idRef);

      const sRef = ref(storage, `kyc_documents/${user.uid}/selfie_biometric.jpg`);
      await uploadBytes(sRef, selfieFile);
      const sUrl = await getDownloadURL(sRef);

      await updateDoc(userDocRef, {
        kycStatus: "pending",
        kycData: {
          ...kycForm,
          idNumber: kycForm.nik,
          idCardUrl: idUrl,
          selfieUrl: sUrl,
          submittedAt: new Date().toISOString()
        }
      });

      setStep(4);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengirim", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => { stopCamera(); router.back(); }} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black italic uppercase tracking-widest">AliBank KYC V3</h1>
          <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black h-4 px-1.5 uppercase mt-1">Encrypted Node</Badge>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 space-y-8 overflow-y-auto no-scrollbar">
        {step < 4 && (
          <div className="flex justify-between items-center px-4 relative mb-10">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2" />
            <div className={cn("absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500", step === 1 ? "w-0" : step === 2 ? "w-1/2" : "w-full")} />
            {[1, 2, 3].map((s) => (
              <div key={s} className={cn("w-8 h-8 rounded-full flex items-center justify-center font-black italic text-xs relative z-10 border-2 transition-all", step >= s ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground")}>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: SCAN KTP */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">SCAN KTP ASLI</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase italic leading-relaxed">Letakkan KTP di dalam bingkai untuk otentikasi identitas AI Node.</p>
            </div>

            <div className="relative aspect-[1.6/1] rounded-[2.5rem] border-4 border-dashed border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-xl">
              {isCameraActive && cameraMode === 'idCard' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-8 border-2 border-primary rounded-xl border-dashed animate-pulse" />
                  <button onClick={() => capturePhoto('idCard')} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-90 transition-transform flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                  </button>
                </>
              ) : previews.idCard ? (
                <div className="relative w-full h-full">
                  <img src={previews.idCard} alt="ID" className="w-full h-full object-cover" />
                  {isOcrLoading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-[9px] font-black uppercase tracking-widest animate-pulse">Otentikasi Identitas AI Node...</span>
                    </div>
                  )}
                  <button onClick={() => startCamera('idCard')} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6 cursor-pointer" onClick={() => startCamera('idCard')}>
                  <Camera className="w-10 h-10 text-primary/40" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">AKTIFKAN KAMERA KTP</span>
                </div>
              )}
            </div>

            {previews.idCard && !isCameraActive && (
              <Card className="p-6 rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-6 shadow-xl animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-black font-black text-[8px] uppercase px-2 h-5">Otentikasi Identitas AI Node</Badge>
                  {isOcrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (!isDuplicate ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <ShieldAlert className="w-4 h-4 text-rose-500" />)}
                </div>

                {isDuplicate && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex gap-3 animate-in shake-in">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-rose-600 uppercase italic">NIK SUDAH TERDAFTAR</p>
                      <p className="text-[9px] font-bold text-muted-foreground leading-relaxed italic">
                        NIK ini telah diverifikasi oleh akun: <span className="text-rose-600 font-black">{linkedEmail}</span>. Silakan login menggunakan akun tersebut.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  <KtpField label="NIK" value={kycForm.nik} isMono isError={isDuplicate} />
                  <KtpField label="Nama Lengkap" value={kycForm.nama} />
                  <div className="grid grid-cols-2 gap-3">
                    <KtpField label="Pekerjaan" value={kycForm.pekerjaan} />
                    <KtpField label="Agama" value={kycForm.agama} />
                  </div>
                  <KtpField label="Alamat" value={kycForm.alamat} />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => startCamera('idCard')} className="flex-1 h-14 rounded-2xl border border-border font-black text-[10px] uppercase italic">RE-SCAN</Button>
                  <Button disabled={isDuplicate || !kycForm.nik || isOcrLoading} onClick={() => setStep(2)} className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-lg">LANJUTKAN <ChevronRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* STEP 2: SUPPLEMENTARY DATA */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">DATA KORESPONDENSI</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase italic">Input data pelengkap untuk verifikasi akun perbankan.</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Provinsi</label>
                <Input value={kycForm.province} onChange={(e) => setKycData({...kycForm, province: e.target.value.toUpperCase()})} placeholder="DKI JAKARTA" className="h-14 rounded-2xl bg-muted/50 border-none font-bold uppercase" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Kode Pos</label>
                <Input value={kycForm.postalCode} onChange={(e) => setKycData({...kycForm, postalCode: e.target.value})} placeholder="5 Digit" className="h-14 rounded-2xl bg-muted/50 border-none font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">WhatsApp Aktif</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                  <Input value={kycForm.whatsapp} onChange={(e) => setKycData({...kycForm, whatsapp: e.target.value})} placeholder="0812xxxxxxxx" className="h-14 pl-12 rounded-2xl bg-muted/50 border-none font-bold" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 h-16 rounded-[2rem] font-black italic uppercase border border-border">KEMBALI</Button>
              <Button disabled={!kycForm.province || !kycForm.postalCode || !kycForm.whatsapp} onClick={() => setStep(3)} className="flex-[2] h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl">LANJUTKAN</Button>
            </div>
          </div>
        )}

        {/* STEP 3: BIOMETRIC SELFIE */}
        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">SELFIE BIOMETRIK</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase italic">Pegang KTP asli di dekat wajah Anda untuk validasi biometric pro.</p>
            </div>
            <div className="relative aspect-square max-w-[320px] mx-auto rounded-[3rem] border-4 border-dashed border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-2xl">
              {isCameraActive && cameraMode === 'selfie' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                  <button onClick={() => capturePhoto('selfie')} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-90 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100" />
                  </button>
                </>
              ) : previews.selfie ? (
                <div className="relative w-full h-full">
                  <img src={previews.selfie} alt="Selfie" className="w-full h-full object-cover" />
                  <button onClick={() => startCamera('selfie')} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6 cursor-pointer" onClick={() => startCamera('selfie')}>
                  <User className="w-12 h-12 text-primary/40" />
                  <button className="text-[10px] font-black uppercase text-primary italic tracking-widest hover:underline">AKTIFKAN KAMERA DEPAN</button>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="ghost" onClick={() => { stopCamera(); setStep(2); }} className="flex-1 h-16 rounded-[2rem] font-black italic uppercase border border-border">KEMBALI</Button>
              <Button disabled={!selfieFile || isProcessing} onClick={handleSubmitKyc} className="flex-[2] h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl">
                {isProcessing ? <Loader2 className="animate-spin w-6 h-6" /> : "AJUKAN KYC RIIL"}
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 text-center animate-in zoom-in">
            <div className="w-24 h-24 rounded-[2rem] bg-accent/5 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 gold-gradient opacity-10 animate-pulse" />
              <CheckCircle2 className="w-12 h-12 text-primary relative z-10" />
            </div>
            <div className="space-y-2 px-4">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">PERMINTAAN TERKIRIM</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic leading-relaxed">Data Anda telah dienkripsi dan dikirim ke Node AliBank V3. Verifikasi manual estimasi selesai dalam 1x24 jam.</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full max-w-xs h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl">KE DASHBOARD</Button>
          </div>
        )}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function KtpField({ label, value, isMono = false, isError = false }: { label: string; value?: string; isMono?: boolean; isError?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">{label}</p>
      <div className={cn(
        "p-3 rounded-xl border transition-all",
        isError ? "bg-rose-500/10 border-rose-500" : "bg-background/50 border-border/50"
      )}>
        <p className={cn(
          "text-[10px] font-black italic uppercase truncate",
          isError ? "text-rose-600" : "text-foreground",
          isMono && "font-mono font-bold"
        )}>{value || "MEMPROSES..."}</p>
      </div>
    </div>
  );
}