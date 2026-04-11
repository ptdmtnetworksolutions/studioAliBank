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
  Smartphone
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
  collection 
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
  const [mounted, setMounted] = useState(false);

  const [kycForm, setKycData] = useState({
    fullName: "",
    idNumber: "",
    idType: "KTP",
    address: ""
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
  const { data: userData } = useDoc(userDocRef);

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
      
      // Ensure video element is connected to stream after state update renders it
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 150);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        variant: 'destructive',
        title: 'Akses Kamera Gagal',
        description: 'Mohon izinkan akses kamera pada pengaturan browser Anda.',
      });
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
              await runRealOcr(dataUrl);
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

  const runRealOcr = async (dataUrl: string) => {
    setIsOcrLoading(true);
    try {
      const result = await extractKtpData({ photoDataUri: dataUrl });
      if (result.isKtp) {
        setKycData(prev => ({
          ...prev,
          fullName: result.fullName || prev.fullName,
          idNumber: result.idNumber || prev.idNumber,
          address: result.address || prev.address
        }));
        toast({ title: "Node AI Aktif", description: "Data identitas berhasil diekstraksi secara otomatis." });
      } else {
        toast({ variant: "destructive", title: "Dokumen Tidak Valid", description: "Gambar tidak terdeteksi sebagai KTP. Silakan ambil ulang." });
        setIdCardFile(null);
        setPreviews(p => ({ ...p, idCard: "" }));
      }
    } catch (err) {
      console.error("OCR Error:", err);
      toast({ variant: "destructive", title: "Kegagalan Node AI", description: "Gagal memproses dokumen secara riil. Silakan coba lagi." });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const checkDuplicates = async () => {
    if (!db || !user || !kycForm.idNumber) return false;
    setIsProcessing(true);
    try {
      const nikQuery = query(collection(db, "users"), where("kycData.idNumber", "==", kycForm.idNumber));
      const nikSnap = await getDocs(nikQuery);
      const nikDuplicate = nikSnap.docs.find(d => d.id !== user.uid);
      if (nikDuplicate) {
        toast({ variant: "destructive", title: "NIK Terdaftar", description: "Nomor NIK ini sudah digunakan oleh akun lain." });
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
      const idRef = ref(storage, `kyc_documents/${user.uid}/id_card_${Date.now()}.jpg`);
      await uploadBytes(idRef, idCardFile);
      const idUrl = await getDownloadURL(idRef);

      const selfieRef = ref(storage, `kyc_documents/${user.uid}/selfie_${Date.now()}.jpg`);
      await uploadBytes(selfieRef, selfieFile);
      const selfieUrl = await getDownloadURL(selfieRef);

      await updateDoc(userDocRef!, {
        kycStatus: "pending",
        kycData: {
          ...kycForm,
          idCardUrl: idUrl,
          selfieUrl: selfieUrl,
          submittedAt: new Date().toISOString()
        }
      });
      setStep(4);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Unggah", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => { stopCamera(); router.back(); }} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black italic uppercase leading-none">KYC Protocol V3.5</h1>
          <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[7px] font-black h-4 px-1.5 uppercase tracking-widest mt-1">AI Verified</Badge>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 space-y-8 overflow-y-auto no-scrollbar">
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
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Informasi Awal</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Data akan divalidasi oleh Node AI secara otomatis.</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Lengkapi Form Ini (Atau skip untuk Scan Otomatis)</label>
                <Input value={kycForm.fullName} onChange={(e) => setKycData({...kycForm, fullName: e.target.value})} placeholder="Nama Lengkap" className="h-14 rounded-2xl bg-muted/50 border-none font-bold italic" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nomor NIK</label>
                <Input value={kycForm.idNumber} onChange={(e) => setKycData({...kycForm, idNumber: e.target.value})} placeholder="16 Digit NIK" className="h-14 rounded-2xl bg-muted/50 border-none font-mono font-bold" />
              </div>
            </div>
            <Button disabled={isProcessing} onClick={handleNextStep} className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl group">
              {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <span className="flex items-center gap-2">MULAI SCAN KTP <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Scan Dokumen</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Node AI OCR akan mengekstrak identitas secara riil.</p>
            </div>
            <div className="relative aspect-[1.6/1] rounded-[2.5rem] border-4 border-dashed border-primary/20 bg-muted overflow-hidden flex items-center justify-center group shadow-2xl">
              {isCameraActive && cameraMode === 'idCard' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[20px] border-black/40 pointer-events-none" />
                  <div className="absolute inset-8 border-2 border-primary rounded-xl border-dashed animate-pulse pointer-events-none" />
                  <button onClick={() => capturePhoto('idCard')} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-90 transition-transform flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full border-2 border-black/5 bg-slate-100" />
                  </button>
                </>
              ) : previews.idCard ? (
                <div className="relative w-full h-full">
                  <img src={previews.idCard} alt="ID Preview" className="w-full h-full object-cover" />
                  {isOcrLoading && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 text-white">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Analisis AI Riil...</span>
                    </div>
                  )}
                  <button onClick={() => startCamera('idCard')} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"><CreditCard className="w-8 h-8" /></div>
                  <button onClick={() => startCamera('idCard')} className="text-xs font-black uppercase text-primary italic tracking-widest hover:underline">AKTIFKAN KAMERA SCAN</button>
                </div>
              )}
            </div>

            {/* HASIL SCAN AI */}
            {previews.idCard && !isCameraActive && kycForm.idNumber && (
              <Card className="p-6 rounded-[2.5rem] bg-accent/5 border border-primary/10 space-y-5 animate-in slide-in-from-top-4 duration-500 shadow-xl">
                <div className="flex items-center justify-between">
                  <Badge className="bg-primary text-black font-black text-[8px] uppercase px-2 h-5 italic border-none">Data Hasil Scan AI</Badge>
                  <div className="flex items-center gap-1 text-green-500 text-[8px] font-black uppercase italic">
                    <CheckCircle2 className="w-3 h-3" /> Dokumen Terdeteksi
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nama Lengkap</p>
                    <div className="p-3.5 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-black italic uppercase text-foreground">{kycForm.fullName || "---"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Nomor NIK</p>
                    <div className="p-3.5 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-xs font-mono font-bold text-accent">{kycForm.idNumber || "---"}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Alamat Sesuai KTP</p>
                    <div className="p-3.5 rounded-xl bg-background/50 border border-border/50">
                      <p className="text-[10px] font-medium text-foreground leading-relaxed italic uppercase">{kycForm.address || "---"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-2">
                  <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">Pastikan data di atas sesuai dengan fisik KTP. Jika ada kesalahan pembacaan, silakan ambil ulang foto dengan pencahayaan yang lebih baik.</p>
                </div>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { stopCamera(); setStep(1); }} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[10px]">Kembali</Button>
              <Button disabled={!idCardFile || isOcrLoading} onClick={() => setStep(3)} className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl">LANJUT KE BIOMETRIK</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Verifikasi Wajah</h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Lakukan pemindaian wajah untuk mencocokkan data biometrik.</p>
            </div>
            <div className="relative aspect-square max-w-[320px] mx-auto rounded-[3rem] border-4 border-dashed border-primary/20 bg-muted overflow-hidden flex items-center justify-center shadow-2xl">
              {isCameraActive && cameraMode === 'selfie' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                  <div className="absolute inset-0 border-2 border-primary rounded-full m-10 border-dashed animate-pulse pointer-events-none" />
                  <button onClick={() => capturePhoto('selfie')} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-2xl active:scale-90 transition-transform">
                    <div className="w-12 h-12 rounded-full border-2 border-black/10 bg-slate-100" />
                  </button>
                </>
              ) : previews.selfie ? (
                <div className="relative w-full h-full">
                  <img src={previews.selfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                  <button onClick={() => startCamera('selfie')} className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors"><RefreshCw className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Camera className="w-8 h-8" /></div>
                  <button onClick={() => startCamera('selfie')} className="text-xs font-black uppercase text-primary italic tracking-widest hover:underline">AKTIFKAN KAMERA BIOMETRIK</button>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => { stopCamera(); setStep(2); }} className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[10px]">Kembali</Button>
              <Button disabled={!selfieFile || isProcessing} onClick={handleSubmitKyc} className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl">
                {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : "KIRIM VERIFIKASI"}
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
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic max-w-xs mx-auto leading-relaxed">Terima kasih. Berkas Anda telah masuk ke antrean verifikasi Node AliBank V3 secara aman.</p>
            </div>
            <Button onClick={() => router.push('/')} className="w-full max-w-xs h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl">Kembali ke Beranda</Button>
          </div>
        )}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
