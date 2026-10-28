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
  ShieldAlert,
  Upload,
  Eye,
  Check,
  Clock,
  Sparkles,
  Edit3
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useFirestore, useMemoFirebase, useStorage } from "@/firebase";
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  collection,
  limit,
  addDoc 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extractKtpData } from "@/ai/flows/ocr-ktp-flow";

export default function KycPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'status' | 'form'>('status');
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [linkedEmail, setLinkedEmail] = useState("");
  const [ocrFailedNotice, setOcrFailedNotice] = useState(false);

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
    kewarganegaraan: "WNI",
    berlakuHingga: "SEUMUR HIDUP",
    province: "",
    postalCode: "",
    whatsapp: ""
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [previews, setPreviews] = useState({ idCard: "", selfie: "" });

  const ktpFileInputRef = useRef<HTMLInputElement>(null);
  const selfieFileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraActiveMode] = useState<'idCard' | 'selfie' | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => { 
    setMounted(true); 
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, user, loading, router]);

  // Set default view mode based on existing user KYC status
  useEffect(() => {
    if (userData) {
      if (userData.kycStatus === 'verified' || userData.kycStatus === 'pending') {
        setViewMode('status');
      } else {
        setViewMode('form');
      }

      // Pre-fill existing data if available
      if (userData.kycData) {
        setKycData(prev => ({
          ...prev,
          nik: userData.kycData.idNumber || userData.kycData.nik || prev.nik,
          nama: userData.kycData.fullName || userData.kycData.nama || userData.name || prev.nama,
          tempatTglLahir: userData.kycData.tempatTglLahir || prev.tempatTglLahir,
          jenisKelamin: userData.kycData.jenisKelamin || prev.jenisKelamin,
          alamat: userData.kycData.address || userData.kycData.alamat || prev.alamat,
          rtRw: userData.kycData.rtRw || prev.rtRw,
          kelDesa: userData.kycData.kelDesa || prev.kelDesa,
          kecamatan: userData.kycData.kecamatan || prev.kecamatan,
          agama: userData.kycData.agama || prev.agama,
          statusPerkawinan: userData.kycData.statusPerkawinan || prev.statusPerkawinan,
          pekerjaan: userData.kycData.pekerjaan || prev.pekerjaan,
          province: userData.kycData.province || prev.province,
          postalCode: userData.kycData.postalCode || prev.postalCode,
          whatsapp: userData.kycData.whatsapp || userData.phone || prev.whatsapp
        }));
      } else if (userData.name || userData.phone) {
        setKycData(prev => ({
          ...prev,
          nama: prev.nama || userData.name || "",
          whatsapp: prev.whatsapp || userData.phone || ""
        }));
      }
    }
  }, [userData]);

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
      toast({ 
        variant: 'destructive', 
        title: 'Kamera Tidak Tersedia', 
        description: 'Tidak dapat mengakses kamera. Anda dapat memilih opsi "Unggah Foto / Galeri".' 
      });
    }
  };

  const capturePhoto = async (mode: 'idCard' | 'selfie') => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
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

  // Handle file selection via standard input/gallery
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'idCard' | 'selfie') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Format Tidak Didukung', description: 'Silakan pilih file gambar (JPG, PNG, atau WEBP).' });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (mode === 'idCard') {
        setIdCardFile(file);
        setPreviews(p => ({ ...p, idCard: dataUrl }));
        await runFullOcr(dataUrl);
      } else {
        setSelfieFile(file);
        setPreviews(p => ({ ...p, selfie: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    // Reset file input value so re-selecting same file triggers change
    e.target.value = "";
  };

  const checkDuplicates = async (nik: string) => {
    const cleanNik = nik.trim();
    if (!db || !user || !cleanNik || cleanNik.length < 10) {
      setIsDuplicate(false);
      setLinkedEmail("");
      return false;
    }
    try {
      const qry = query(collection(db, "users"), where("kycData.idNumber", "==", cleanNik), limit(1));
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
    } catch (e) { 
      // Firestore index or permission fallback
      setIsDuplicate(false);
      return false; 
    }
  };

  const runFullOcr = async (dataUrl: string) => {
    setIsOcrLoading(true);
    setIsDuplicate(false);
    setOcrFailedNotice(false);
    try {
      const res = await extractKtpData({ photoDataUri: dataUrl });
      if (res && res.isKtp) {
        const extractedNik = res.nik || "";
        setKycData(prev => ({
          ...prev,
          nik: extractedNik || prev.nik,
          nama: res.nama || prev.nama || userData?.name || "",
          tempatTglLahir: res.tempatTglLahir || prev.tempatTglLahir,
          jenisKelamin: res.jenisKelamin || prev.jenisKelamin,
          alamat: res.alamat || prev.alamat,
          rtRw: res.rtRw || prev.rtRw,
          kelDesa: res.kelDesa || prev.kelDesa,
          kecamatan: res.kecamatan || prev.kecamatan,
          agama: res.agama || prev.agama,
          statusPerkawinan: res.statusPerkawinan || prev.statusPerkawinan,
          pekerjaan: res.pekerjaan || prev.pekerjaan,
          kewarganegaraan: res.kewarganegaraan || prev.kewarganegaraan || "WNI",
          berlakuHingga: res.berlakuHingga || prev.berlakuHingga || "SEUMUR HIDUP"
        }));

        if (extractedNik) {
          await checkDuplicates(extractedNik);
        }
        toast({ title: "KTP Terbaca Otomatis", description: "Data identitas berhasil diekstraksi. Silakan periksa kembali." });
      } else {
        // Fallback: don't delete photo, just inform user to enter data manually
        setOcrFailedNotice(true);
        if (!kycForm.nama && userData?.name) {
          setKycData(p => ({ ...p, nama: userData.name }));
        }
        toast({ 
          title: "Periksa Data Manual", 
          description: "Data KTP belum terbaca otomatis sepenuhnya. Anda dapat mengisi NIK dan Nama secara manual di bawah." 
        });
      }
    } catch (err) {
      setOcrFailedNotice(true);
      if (!kycForm.nama && userData?.name) {
        setKycData(p => ({ ...p, nama: userData.name }));
      }
      toast({ 
        title: "Input Data Manual", 
        description: "AI scanner tidak merespons. Silakan lengkapi NIK dan Nama Anda secara manual." 
      });
    } finally {
      setIsOcrLoading(false);
    }
  };

  const handleNikInputChange = async (val: string) => {
    const numericVal = val.replace(/\D/g, '').slice(0, 16);
    setKycData(p => ({ ...p, nik: numericVal }));
    if (numericVal.length === 16) {
      await checkDuplicates(numericVal);
    } else {
      setIsDuplicate(false);
      setLinkedEmail("");
    }
  };

  const handleSubmitKyc = async () => {
    if (!user || !db || !storage || !idCardFile || !selfieFile || !userDocRef) {
      toast({ variant: "destructive", title: "Dokumen Belum Lengkap", description: "Pastikan foto KTP dan foto selfie biometrik sudah terunggah." });
      return;
    }

    if (!kycForm.nik || kycForm.nik.length < 10) {
      toast({ variant: "destructive", title: "NIK Tidak Valid", description: "Masukkan nomor NIK KTP Anda yang valid." });
      return;
    }

    if (!kycForm.nama) {
      toast({ variant: "destructive", title: "Nama Wajib Diisi", description: "Masukkan nama lengkap sesuai KTP." });
      return;
    }

    if (isDuplicate) {
      toast({ variant: "destructive", title: "NIK Sudah Terdaftar", description: "NIK ini sudah digunakan oleh akun lain." });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Upload KTP to Firebase Storage
      const idTimestamp = Date.now();
      const idRef = ref(storage, `kyc_documents/${user.uid}/id_card_${idTimestamp}.jpg`);
      await uploadBytes(idRef, idCardFile);
      const idUrl = await getDownloadURL(idRef);

      // 2. Upload Selfie to Firebase Storage
      const sRef = ref(storage, `kyc_documents/${user.uid}/selfie_${idTimestamp}.jpg`);
      await uploadBytes(sRef, selfieFile);
      const sUrl = await getDownloadURL(sRef);

      // 3. Save comprehensive KYC payload with setDoc (merge: true) for resilience
      const submittedAt = new Date().toISOString();
      const kycDataPayload = {
        ...kycForm,
        fullName: kycForm.nama,
        name: kycForm.nama,
        idNumber: kycForm.nik,
        nik: kycForm.nik,
        address: kycForm.alamat,
        alamat: kycForm.alamat,
        idCardUrl: idUrl,
        selfieUrl: sUrl,
        submittedAt
      };

      await setDoc(userDocRef, {
        kycStatus: "pending",
        kycData: kycDataPayload,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // 4. Send confirmation notification to user
      try {
        await addDoc(collection(db, "users", user.uid, "notifications"), {
          title: "Pengajuan KYC Terkirim",
          message: `Pengajuan verifikasi KTP (NIK: ${kycForm.nik}) berhasil diterima. Tim verifikasi kami akan meninjau dalam 1x24 jam.`,
          type: "info",
          read: false,
          createdAt: submittedAt
        });
      } catch (notifErr) {
        // Notification is non-blocking
      }

      // 5. Add audit log
      try {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `KYC-SUB-${idTimestamp}`,
          category: "Verifikasi Identitas",
          description: `Nasabah ${kycForm.nama} (${user.email}) mengajukan KYC NIK ${kycForm.nik}.`,
          status: "pending",
          timestamp: serverTimestamp(),
          userEmail: user.email || ""
        });
      } catch (auditErr) {
        // Audit log is non-blocking
      }

      setStep(4);
      toast({ title: "Pengajuan Berhasil", description: "Dokumen KYC Anda telah terkirim untuk verifikasi." });
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Gagal Mengirim Pengajuan", 
        description: err.message || "Terjadi kesalahan saat mengunggah dokumen. Silakan periksa koneksi internet Anda." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted || loading || isUserDataLoading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-4">Memuat data verifikasi...</span>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: STATUS SCREEN (VERIFIED / PENDING / REJECTED)
  // ==========================================
  if (viewMode === 'status' && userData?.kycStatus && userData.kycStatus !== 'unverified') {
    const isVerified = userData.kycStatus === 'verified';
    const isPending = userData.kycStatus === 'pending';
    const isRejected = userData.kycStatus === 'rejected';

    return (
      <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
        <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
          <button onClick={() => router.push('/settings')} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-black italic uppercase tracking-widest">Status Verifikasi KYC</h1>
            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black h-4 px-2 uppercase mt-0.5">AliBank V3 Vault</Badge>
          </div>
          <div className="w-10" />
        </header>

        <main className="flex-1 px-6 pt-6 max-w-xl mx-auto w-full space-y-6">
          {/* Main Status Hero Card */}
          <Card className={cn(
            "p-8 rounded-[2.5rem] border text-center space-y-5 shadow-xl relative overflow-hidden",
            isVerified ? "bg-gradient-to-b from-green-500/10 via-background to-background border-green-500/30" :
            isPending ? "bg-gradient-to-b from-amber-500/10 via-background to-background border-amber-500/30" :
            "bg-gradient-to-b from-rose-500/10 via-background to-background border-rose-500/30"
          )}>
            <div className="mx-auto w-20 h-20 rounded-[2rem] flex items-center justify-center relative shadow-lg">
              {isVerified ? (
                <div className="w-full h-full rounded-[2rem] bg-green-500/20 text-green-500 flex items-center justify-center border border-green-500/40">
                  <ShieldCheck className="w-10 h-10" />
                </div>
              ) : isPending ? (
                <div className="w-full h-full rounded-[2rem] bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/40 animate-pulse">
                  <Clock className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-full h-full rounded-[2rem] bg-rose-500/20 text-rose-500 flex items-center justify-center border border-rose-500/40">
                  <ShieldAlert className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Badge className={cn(
                "font-black text-[9px] uppercase px-3 py-1 h-6 tracking-widest border-none",
                isVerified ? "bg-green-500 text-white" :
                isPending ? "bg-amber-500 text-white" :
                "bg-rose-500 text-white"
              )}>
                {isVerified ? "IDENTITAS TERVERIFIKASI" : isPending ? "SEDANG DITINJAU OLEH ADMIN" : "PENGAJUAN PERLU PERBAIKAN"}
              </Badge>
              <h2 className="text-2xl font-black italic uppercase tracking-tight">
                {isVerified ? "Akun Anda Resmi Terverifikasi" : isPending ? "Menunggu Konfirmasi Manual" : "Pengajuan Ditolak"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isVerified ? "Seluruh fitur perbankan, penarikan tanpa limit, kliring PayPal, dan smart contract ALX Vault aktif untuk akun Anda." :
                 isPending ? "Dokumen identitas KTP dan selfie biometrik Anda telah kami terima. Tim kepatuhan AliBank sedang memvalidasi data Anda (estimasi 1x24 jam kerja)." :
                 "Dokumen yang Anda kirimkan tidak memenuhi kriteria verifikasi (misal: foto buram atau NIK tidak sesuai). Silakan ajukan ulang dengan foto yang lebih jelas."}
              </p>
            </div>

            {/* Submitted Summary */}
            {userData.kycData && (
              <div className="bg-muted/40 p-5 rounded-2xl border border-border/50 text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Nomor NIK</span>
                  <span className="text-xs font-mono font-bold">{userData.kycData.idNumber || userData.kycData.nik || "---"}</span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Nama Lengkap</span>
                  <span className="text-xs font-bold uppercase">{userData.kycData.fullName || userData.kycData.nama || userData.name || "---"}</span>
                </div>
                {userData.kycData.submittedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">Waktu Pengajuan</span>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {new Date(userData.kycData.submittedAt).toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col gap-3">
              {isVerified ? (
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/settings')} className="flex-1 h-14 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black uppercase italic text-xs">
                    KEMBALI KE PENGATURAN
                  </Button>
                  <Button onClick={() => { setViewMode('form'); setStep(1); }} variant="outline" className="flex-1 h-14 rounded-2xl border-primary/30 text-primary font-black uppercase italic text-xs">
                    <Edit3 className="w-4 h-4 mr-2" /> PERBARUI DATA
                  </Button>
                </div>
              ) : isPending ? (
                <div className="flex gap-3">
                  <Button onClick={() => router.push('/')} className="flex-1 h-14 rounded-2xl bg-muted hover:bg-muted/80 text-foreground font-black uppercase italic text-xs">
                    KE DASHBOARD
                  </Button>
                  <Button onClick={() => { setViewMode('form'); setStep(1); }} variant="outline" className="flex-1 h-14 rounded-2xl border-amber-500/30 text-amber-600 font-black uppercase italic text-xs">
                    <RefreshCw className="w-4 h-4 mr-2" /> KIRIM ULANG DOKUMEN
                  </Button>
                </div>
              ) : (
                <Button onClick={() => { setViewMode('form'); setStep(1); }} className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-lg">
                  AJUKAN ULANG KYC SEKARANG
                </Button>
              )}
            </div>
          </Card>

          {/* Benefits Feature Card */}
          <Card className="p-6 rounded-[2rem] bg-card border-border/50 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Keuntungan Verifikasi KYC AliBank
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Limit penarikan saldo IDR hingga Rp 100.000.000 / hari</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Akses penuh kliring kartu & transaksi PayPal instan</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Otentikasi Smart Contract AlixCoin (ALX) Staking & Yield Vault</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>Perlindungan anti-pembajakan aset dengan Secure Multi-Sign Vault</span>
              </li>
            </ul>
          </Card>
        </main>
      </div>
    );
  }

  // ==========================================
  // VIEW MODE: MULTI-STEP KYC WIZARD FORM
  // ==========================================
  return (
    <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
      {/* Hidden File Inputs for Gallery / Desktop file upload */}
      <input 
        type="file" 
        ref={ktpFileInputRef} 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => handleFileChange(e, 'idCard')} 
      />
      <input 
        type="file" 
        ref={selfieFileInputRef} 
        accept="image/*" 
        capture="user" 
        className="hidden" 
        onChange={(e) => handleFileChange(e, 'selfie')} 
      />

      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-50 border-b border-border/50">
        <button 
          onClick={() => { 
            stopCamera(); 
            if (userData?.kycStatus && userData.kycStatus !== 'unverified') {
              setViewMode('status');
            } else {
              router.push('/settings'); 
            }
          }} 
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-sm font-black italic uppercase tracking-widest">Verifikasi Identitas KYC</h1>
          <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black h-4 px-1.5 uppercase mt-0.5">WNI Verified Node</Badge>
        </div>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-6 max-w-xl mx-auto w-full space-y-6 overflow-y-auto no-scrollbar">
        {step < 4 && (
          <div className="flex justify-between items-center px-4 relative mb-6">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2" />
            <div className={cn(
              "absolute top-1/2 left-4 h-0.5 bg-primary -translate-y-1/2 transition-all duration-500", 
              step === 1 ? "w-0" : step === 2 ? "w-1/2" : "w-full"
            )} />
            {[
              { num: 1, label: "KTP" },
              { num: 2, label: "Kontak" },
              { num: 3, label: "Selfie" }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-1 z-10">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-black italic text-xs border-2 transition-all shadow-sm", 
                  step >= s.num ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-border text-muted-foreground"
                )}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[9px] font-black uppercase text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* STEP 1: SCAN / UPLOAD KTP */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black italic uppercase tracking-tight">Foto KTP Asli</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Posisikan fisik e-KTP Anda di tempat terang dan tidak terpotong.
              </p>
            </div>

            {/* Camera / Image Container */}
            <div className="relative aspect-[1.6/1] rounded-[2rem] border-2 border-dashed border-primary/30 bg-muted/60 overflow-hidden flex items-center justify-center shadow-lg">
              {isCameraActive && cameraMode === 'idCard' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-6 border-2 border-primary rounded-xl border-dashed animate-pulse pointer-events-none" />
                  <div className="absolute top-3 left-4 bg-black/60 px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Kamera KTP Aktif
                  </div>
                  <button 
                    onClick={() => capturePhoto('idCard')} 
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200" />
                  </button>
                  <button 
                    onClick={stopCamera} 
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : previews.idCard ? (
                <div className="relative w-full h-full">
                  <img src={previews.idCard} alt="KTP Preview" className="w-full h-full object-cover" />
                  {isOcrLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                        AI Node Membaca Data KTP...
                      </span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => ktpFileInputRef.current?.click()} 
                      className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-black backdrop-blur-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti Foto
                    </button>
                    <button 
                      onClick={() => startCamera('idCard')} 
                      className="p-2 rounded-xl bg-black/70 text-white hover:bg-black backdrop-blur-sm"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6 w-full">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide">Pilih Metode Pengambilan KTP</p>
                    <p className="text-[10px] text-muted-foreground">Kamera langsung atau unggah foto dari memori perangkat</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center w-full max-w-xs">
                    <Button 
                      type="button" 
                      onClick={() => startCamera('idCard')} 
                      className="flex-1 h-12 rounded-xl bg-primary text-black font-black uppercase text-[10px] italic shadow-md"
                    >
                      <Camera className="w-4 h-4 mr-1.5" /> BUKA KAMERA
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => ktpFileInputRef.current?.click()} 
                      variant="outline" 
                      className="flex-1 h-12 rounded-xl border-border font-black uppercase text-[10px] italic hover:bg-muted"
                    >
                      <Upload className="w-4 h-4 mr-1.5" /> UNGGAH FOTO
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Notice if OCR finished or if manual input is needed */}
            {ocrFailedNotice && previews.idCard && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold leading-relaxed">
                  Data KTP tidak terbaca otomatis. Anda dapat langsung melengkapi NIK, Nama, dan data lainnya pada formulir di bawah.
                </p>
              </div>
            )}

            {/* Editable Form Card - Always accessible once photo is chosen */}
            {previews.idCard && !isCameraActive && (
              <Card className="p-6 rounded-[2rem] bg-card border border-border/60 space-y-5 shadow-lg animate-in slide-in-from-top-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/20 text-primary font-black text-[9px] uppercase px-2 h-5">
                      Data e-KTP
                    </Badge>
                    <span className="text-[10px] font-bold text-muted-foreground italic">Silakan periksa & koreksi</span>
                  </div>
                  {isOcrLoading ? (
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-bold">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Membaca...
                    </div>
                  ) : isDuplicate ? (
                    <Badge className="bg-rose-500 text-white font-black text-[8px] uppercase">Duplikat</Badge>
                  ) : (
                    <Badge className="bg-green-500/10 text-green-600 font-black text-[8px] uppercase flex items-center gap-1">
                      <Check className="w-3 h-3" /> Siap
                    </Badge>
                  )}
                </div>

                {isDuplicate && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-rose-600 uppercase">NIK SUDAH TERDAFTAR</p>
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                        NIK ini telah diverifikasi oleh akun: <span className="text-rose-600 font-black">{linkedEmail}</span>. Silakan gunakan NIK Anda sendiri.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                  {/* NIK Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center justify-between">
                      <span>NIK (16 Digit) *</span>
                      <span className="font-mono text-[9px]">{kycForm.nik.length}/16</span>
                    </label>
                    <Input 
                      value={kycForm.nik} 
                      onChange={(e) => handleNikInputChange(e.target.value)}
                      placeholder="Masukkan 16 digit NIK" 
                      className={cn(
                        "h-12 rounded-xl bg-muted/40 font-mono font-bold text-sm tracking-wider",
                        isDuplicate && "border-rose-500 bg-rose-500/5 text-rose-600"
                      )} 
                    />
                  </div>

                  {/* Nama Lengkap Input */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Lengkap Sesuai KTP *</label>
                    <Input 
                      value={kycForm.nama} 
                      onChange={(e) => setKycData({ ...kycForm, nama: e.target.value.toUpperCase() })} 
                      placeholder="Nama lengkap sesuai KTP" 
                      className="h-12 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                    />
                  </div>

                  {/* Tempat / Tgl Lahir & Jenis Kelamin */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Tempat/Tgl Lahir</label>
                      <Input 
                        value={kycForm.tempatTglLahir} 
                        onChange={(e) => setKycData({ ...kycForm, tempatTglLahir: e.target.value.toUpperCase() })} 
                        placeholder="KOTA, DD-MM-YYYY" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Jenis Kelamin</label>
                      <Input 
                        value={kycForm.jenisKelamin} 
                        onChange={(e) => setKycData({ ...kycForm, jenisKelamin: e.target.value.toUpperCase() })} 
                        placeholder="LAKI-LAKI / PEREMPUAN" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Alamat KTP</label>
                    <Input 
                      value={kycForm.alamat} 
                      onChange={(e) => setKycData({ ...kycForm, alamat: e.target.value.toUpperCase() })} 
                      placeholder="Jalan / Gang / No. Rumah" 
                      className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                    />
                  </div>

                  {/* RT/RW & Kecamatan */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">RT / RW</label>
                      <Input 
                        value={kycForm.rtRw} 
                        onChange={(e) => setKycData({ ...kycForm, rtRw: e.target.value })} 
                        placeholder="001/002" 
                        className="h-11 rounded-xl bg-muted/40 font-mono font-bold text-xs" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Kecamatan</label>
                      <Input 
                        value={kycForm.kecamatan} 
                        onChange={(e) => setKycData({ ...kycForm, kecamatan: e.target.value.toUpperCase() })} 
                        placeholder="Kecamatan" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>
                  </div>

                  {/* Pekerjaan & Agama */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Agama</label>
                      <Input 
                        value={kycForm.agama} 
                        onChange={(e) => setKycData({ ...kycForm, agama: e.target.value.toUpperCase() })} 
                        placeholder="ISLAM / KRISTEN / DLL" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Pekerjaan</label>
                      <Input 
                        value={kycForm.pekerjaan} 
                        onChange={(e) => setKycData({ ...kycForm, pekerjaan: e.target.value.toUpperCase() })} 
                        placeholder="KARYAWAN / WIRASWASTA" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIdCardFile(null);
                      setPreviews(p => ({ ...p, idCard: "" }));
                      setOcrFailedNotice(false);
                    }} 
                    className="flex-1 h-12 rounded-xl border-border font-black text-xs uppercase"
                  >
                    FOTO ULANG
                  </Button>
                  <Button 
                    type="button"
                    disabled={isDuplicate || !kycForm.nik || kycForm.nik.length < 10 || !kycForm.nama || isOcrLoading} 
                    onClick={() => setStep(2)} 
                    className="flex-[2] h-12 gold-gradient text-white rounded-xl font-black uppercase italic shadow-lg"
                  >
                    LANJUTKAN <ChevronRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* STEP 2: DATA KORESPONDENSI */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black italic uppercase tracking-tight">Data Korespondensi</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Informasi domisili dan nomor WhatsApp aktif untuk notifikasi perbankan.
              </p>
            </div>

            <Card className="p-6 rounded-[2rem] bg-card border border-border/60 space-y-4 shadow-lg">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Provinsi Domisili Saat Ini *</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={kycForm.province} 
                    onChange={(e) => setKycData({...kycForm, province: e.target.value.toUpperCase()})} 
                    placeholder="CONTOH: DKI JAKARTA / JAWA BARAT" 
                    className="h-12 pl-10 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Kode Pos *</label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    value={kycForm.postalCode} 
                    onChange={(e) => setKycData({...kycForm, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5)})} 
                    placeholder="5 Digit Kode Pos (misal: 12340)" 
                    className="h-12 pl-10 rounded-xl bg-muted/40 font-mono font-bold text-xs" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nomor WhatsApp Aktif *</label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                  <Input 
                    value={kycForm.whatsapp} 
                    onChange={(e) => setKycData({...kycForm, whatsapp: e.target.value.replace(/[^\d+]/g, '')})} 
                    placeholder="08xxxxxxxxxx" 
                    className="h-12 pl-10 rounded-xl bg-muted/40 font-mono font-bold text-xs" 
                  />
                </div>
                <p className="text-[9px] text-muted-foreground ml-1">Digunakan untuk konfirmasi verifikasi dan keamanan transaksi tingkat tinggi.</p>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep(1)} 
                className="flex-1 h-14 rounded-2xl font-black italic uppercase border-border text-xs"
              >
                KEMBALI
              </Button>
              <Button 
                type="button"
                disabled={!kycForm.province || !kycForm.postalCode || !kycForm.whatsapp} 
                onClick={() => setStep(3)} 
                className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl text-xs"
              >
                LANJUTKAN KE SELFIE <ChevronRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SELFIE BIOMETRIK */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-400">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black italic uppercase tracking-tight">Selfie Biometrik</h2>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Pegang fisik KTP Anda di samping wajah untuk verifikasi kesesuaian identitas.
              </p>
            </div>

            {/* Selfie Camera / Image Box */}
            <div className="relative aspect-square max-w-[320px] mx-auto rounded-[2.5rem] border-2 border-dashed border-primary/30 bg-muted/60 overflow-hidden flex items-center justify-center shadow-2xl">
              {isCameraActive && cameraMode === 'selfie' ? (
                <>
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  <div className="absolute inset-0 border-[30px] border-black/30 pointer-events-none rounded-[2.5rem]" />
                  <div className="absolute top-3 bg-black/60 px-3 py-1 rounded-full text-[9px] font-black uppercase text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    Kamera Depan Aktif
                  </div>
                  <button 
                    onClick={() => capturePhoto('selfie')} 
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary shadow-2xl active:scale-95 transition-transform flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200" />
                  </button>
                  <button 
                    onClick={stopCamera} 
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-white hover:bg-black"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : previews.selfie ? (
                <div className="relative w-full h-full">
                  <img src={previews.selfie} alt="Selfie Preview" className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button 
                      onClick={() => selfieFileInputRef.current?.click()} 
                      className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-black backdrop-blur-sm"
                    >
                      <Upload className="w-3.5 h-3.5" /> Ganti Foto
                    </button>
                    <button 
                      onClick={() => startCamera('selfie')} 
                      className="p-2 rounded-xl bg-black/70 text-white hover:bg-black backdrop-blur-sm"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 text-center p-6 w-full">
                  <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <User className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wide">Pilih Metode Foto Selfie</p>
                    <p className="text-[10px] text-muted-foreground">Kamera depan atau upload foto bersama KTP</p>
                  </div>
                  <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                    <Button 
                      type="button" 
                      onClick={() => startCamera('selfie')} 
                      className="h-11 rounded-xl bg-primary text-black font-black uppercase text-[10px] italic shadow-md"
                    >
                      <Camera className="w-4 h-4 mr-1.5" /> BUKA KAMERA DEPAN
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => selfieFileInputRef.current?.click()} 
                      variant="outline" 
                      className="h-11 rounded-xl border-border font-black uppercase text-[10px] italic hover:bg-muted"
                    >
                      <Upload className="w-4 h-4 mr-1.5" /> UNGGAH DARI GALERI
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist summary */}
            <Card className="p-4 rounded-2xl bg-card border-border/50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-bold">Foto KTP</span>
                </span>
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                  {kycForm.nik}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="font-bold">Nama Lengkap</span>
                </span>
                <span className="text-[10px] font-bold uppercase truncate max-w-[150px]">
                  {kycForm.nama}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  {previews.selfie ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="font-bold">Foto Selfie Biometrik</span>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">
                  {previews.selfie ? "Sudah Diunggah" : "Wajib"}
                </span>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { stopCamera(); setStep(2); }} 
                className="flex-1 h-14 rounded-2xl font-black italic uppercase border-border text-xs"
              >
                KEMBALI
              </Button>
              <Button 
                type="button"
                disabled={!selfieFile || isProcessing} 
                onClick={handleSubmitKyc} 
                className="flex-[2] h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl text-xs"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin w-5 h-5" /> MENGIRIM DOKUMEN...
                  </span>
                ) : (
                  "AJUKAN VERIFIKASI KYC"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS CONFIRMATION */}
        {step === 4 && (
          <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-[2rem] bg-green-500/10 border border-green-500/30 flex items-center justify-center relative shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div className="space-y-2 px-2">
              <Badge className="bg-amber-500 text-white font-black text-[9px] uppercase px-3 py-1">
                STATUS: SEDANG DITINJAU
              </Badge>
              <h2 className="text-2xl font-black italic uppercase tracking-tight">Pengajuan KYC Terkirim!</h2>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Dokumen identitas e-KTP dan selfie Anda telah berhasil dienkripsi dan masuk ke antrean verifikasi kepatuhan AliBank V3. Tim verifikator kami akan meninjau pengajuan ini dalam 1x24 jam.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
              <Button 
                onClick={() => router.push('/')} 
                className="h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl text-xs"
              >
                KEMBALI KE DASHBOARD
              </Button>
              <Button 
                onClick={() => { setViewMode('status'); setStep(1); }} 
                variant="outline" 
                className="h-12 rounded-2xl border-border font-black uppercase text-xs"
              >
                LIHAT STATUS PENGAJUAN
              </Button>
            </div>
          </div>
        )}
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}