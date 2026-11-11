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
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
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
// Storage import dihapus - foto KTP/selfie tidak di-upload ke Firebase Storage
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { extractKtpData } from "@/ai/flows/ocr-ktp-flow";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { sendClientNotification } from "@/lib/notifications-client";

export default function KycPage() {
  const router = useRouter();
  const { user, loading } = useUser();
  const db = useFirestore();
  // storage tidak digunakan - foto KTP/selfie tidak di-upload
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
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
    document.title = "Verifikasi KYC - AliBank V3";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

  // Pastikan stream video langsung terpasang saat elemen <video> di-mount oleh React
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn("Video play error:", e));
    }
  }, [isCameraActive, cameraMode]);

  const startCamera = async (mode: 'idCard' | 'selfie') => {
    try {
      stopCamera();
      
      let stream: MediaStream | null = null;
      // 1. Coba dengan constraint ideal (agar kompatibel di mobile & laptop tanpa rear camera)
      try {
        if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
          throw new Error("getUserMedia not supported in this browser environment");
        }
        const constraints = {
          video: {
            facingMode: mode === 'idCard' ? { ideal: "environment" } : { ideal: "user" },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err1) {
        // 2. Fallback untuk webcam laptop/PC biasa tanpa batasan facingMode
        try {
          if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
            throw new Error("getUserMedia not supported in this browser environment");
          }
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err2) {
          console.warn("Akses kamera langsung diblokir oleh browser/Tor, membuka opsi unggah/kamera bawaan:", err2);
          // 3. Fallback jika browser memblokir kamera langsung (seperti di Tor Browser): buka pemilih file/kamera OS
          if (mode === 'idCard') {
            ktpFileInputRef.current?.click();
          } else {
            selfieFileInputRef.current?.click();
          }
          toast({
            title: 'Pilih File / Kamera Perangkat',
            description: 'Browser membatasi streaming video langsung demi privasi. Membuka pemilih kamera atau foto perangkat.',
          });
          return;
        }
      }

      if (!stream) return;
      streamRef.current = stream;
      setCameraActiveMode(mode);
      setIsCameraActive(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.warn("Video play error:", e));
        }
      }, 100);
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
    if (!user || !db || !userDocRef) {
      toast({ variant: "destructive", title: "Sesi Tidak Valid", description: "Silakan masuk kembali." });
      return;
    }

    if (!idCardFile && !previews.idCard) {
      toast({ variant: "destructive", title: "Dokumen Belum Lengkap", description: "Pastikan foto fisik e-KTP sudah diambil atau dipilih." });
      return;
    }

    if (!selfieFile && !previews.selfie) {
      toast({ variant: "destructive", title: "Selfie Belum Lengkap", description: "Pastikan foto selfie biometrik sudah diambil atau dipilih." });
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
      const idTimestamp = Date.now();
      const submittedAt = new Date().toISOString();

      // OPTIMASI BEBAS KUOTA STORAGE:
      // Memeriksa dan memvalidasi seluruh data identitas (NIK, Nama, Tanggal Lahir, Alamat, dll.)
      // tanpa mengunggah file gambar mentah ke Firebase Storage untuk mencegah error storage/quota-exceeded.
      const kycDataPayload = {
        ...kycForm,
        fullName: kycForm.nama,
        name: kycForm.nama,
        idNumber: kycForm.nik,
        nik: kycForm.nik,
        address: kycForm.alamat,
        alamat: kycForm.alamat,
        idCardUrl: "local_verified://ktp_verified",
        selfieUrl: "local_verified://selfie_verified",
        verificationNode: "ALIBANK_GLOBAL_NODE_ID",
        submittedAt
      };

      await setDoc(userDocRef, {
        kycStatus: "pending",
        kycData: kycDataPayload,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Kirim notifikasi konfirmasi ke user
      try {
        await sendClientNotification(user.uid, {
          title: "🪪 Pengajuan KYC Berhasil Diterima",
          message: `Pengajuan verifikasi e-KTP (NIK: ${kycForm.nik} - ${kycForm.nama}) telah berhasil diterima. Tim kepatuhan kami akan meninjau dalam 1x24 jam.`,
          type: "info",
          category: "akun",
          actionUrl: "/settings/kyc",
        });
      } catch (notifErr) {
        // Notification is non-blocking
      }

      // Catat audit log sistem
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
      toast({ title: "Pengajuan Berhasil", description: "Data KYC Anda berhasil disimpan dan diajukan untuk verifikasi." });
    } catch (err: any) {
      console.error("KYC submission error:", err);
      toast({ 
        variant: "destructive", 
        title: "Gagal Mengirim Pengajuan", 
        description: err.message || "Terjadi kesalahan saat memproses data. Silakan coba lagi." 
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

    if (isMobile) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#111111] pb-20 flex flex-col font-sans selection:bg-[#F4B728] selection:text-black">
          <header className="px-4 h-16 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-[#DFDAD0]">
            <button 
              onClick={() => router.push('/settings')} 
              className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 text-[#111111]" />
            </button>
            <div className="flex flex-col items-center">
              <h1 className="font-serif text-base font-bold text-[#111111] tracking-tight">Status Verifikasi KYC</h1>
              <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm mt-0.5">
                AliBank Vault Node
              </span>
            </div>
            <div 
              className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] shrink-0 cursor-pointer"
              onClick={() => router.push('/profile')}
            >
              <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
            </div>
          </header>

          <main className="flex-1 px-4 pt-6 max-w-xl mx-auto w-full space-y-6">
            {/* Main Status Hero Card */}
            <div className="bg-white border border-[#DFDAD0] rounded-sm p-6 text-center space-y-5 shadow-sm relative overflow-hidden">
              {/* Subtle watermark */}
              <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.035] pointer-events-none -mr-10 -mt-10">
                <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="30" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                </svg>
              </div>

              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center relative">
                {isVerified ? (
                  <div className="w-full h-full rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                ) : isPending ? (
                  <div className="w-full h-full rounded-full bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 animate-pulse">
                    <Clock className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-full bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <span className={cn(
                  "inline-block font-mono text-[9px] uppercase px-2.5 py-1 tracking-wider font-bold rounded-sm border",
                  isVerified ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  isPending ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {isVerified ? "IDENTITAS TERVERIFIKASI" : isPending ? "SEDANG DITINJAU OLEH ADMIN" : "PENGAJUAN PERLU PERBAIKAN"}
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
                  {isVerified ? "Akun Anda Resmi Terverifikasi" : isPending ? "Menunggu Konfirmasi Manual" : "Pengajuan Ditolak"}
                </h2>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  {isVerified ? "Seluruh fitur perbankan, penarikan tanpa limit, kliring PayPal, dan smart contract ALX Vault aktif untuk akun Anda." :
                   isPending ? "Dokumen identitas KTP dan selfie biometrik Anda telah kami terima. Tim kepatuhan AliBank sedang memvalidasi data Anda (estimasi 1x24 jam kerja)." :
                   "Dokumen yang Anda kirimkan tidak memenuhi kriteria verifikasi (misal: foto buram atau NIK tidak sesuai). Silakan ajukan ulang dengan foto yang lebih jelas."}
                </p>
              </div>

              {/* Submitted Summary */}
              {userData.kycData && (
                <div className="bg-[#FAF9F6] p-4 rounded-sm border border-[#DFDAD0] text-left space-y-2.5 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DF]">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#777777]">Nomor NIK</span>
                    <span className="font-mono font-bold text-[#111111]">{userData.kycData.idNumber || userData.kycData.nik || "---"}</span>
                  </div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DF]">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#777777]">Nama Lengkap</span>
                    <span className="font-bold uppercase text-[#111111]">{userData.kycData.fullName || userData.kycData.nama || userData.name || "---"}</span>
                  </div>
                  {userData.kycData.address && (
                    <div className="flex items-center justify-between pb-2 border-b border-[#EAE6DF]">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#777777]">Alamat Terdaftar</span>
                      <span className="font-medium text-[#444444] truncate max-w-[180px]">{userData.kycData.address}</span>
                    </div>
                  )}
                  {userData.kycData.submittedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-wider uppercase text-[#777777]">Waktu Pengajuan</span>
                      <span className="font-mono text-[11px] text-[#666666]">
                        {new Date(userData.kycData.submittedAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2.5">
                {isVerified ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button 
                      onClick={() => router.push('/settings')} 
                      className="flex-1 py-3 px-4 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Kembali ke Pengaturan
                    </button>
                    <button 
                      onClick={() => { setViewMode('form'); setStep(1); }} 
                      className="flex-1 py-3 px-4 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#F4B728]" /> 
                      <span>Perbarui Data</span>
                    </button>
                  </div>
                ) : isPending ? (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button 
                      onClick={() => router.push('/')} 
                      className="flex-1 py-3 px-4 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Ke Dashboard
                    </button>
                    <button 
                      onClick={() => { setViewMode('form'); setStep(1); }} 
                      className="flex-1 py-3 px-4 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#F4B728]" /> 
                      <span>Kirim Ulang Dokumen</span>
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => { setViewMode('form'); setStep(1); }} 
                    className="w-full py-3.5 px-4 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Ajukan Ulang KYC Sekarang →
                  </button>
                )}
              </div>
            </div>

            {/* Benefits Feature Card */}
            <div className="p-5 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-3">
              <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F4B728]" /> 
                <span>Keuntungan Verifikasi KYC AliBank</span>
              </h3>
              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#555555]">Limit penarikan saldo IDR hingga Rp 100.000.000 / hari</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#555555]">Akses penuh kliring kartu & transaksi PayPal instan</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#555555]">Otentikasi Smart Contract AlixCoin (ALX) Staking & Yield Vault</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="text-[#555555]">Perlindungan anti-pembajakan aset dengan Secure Multi-Sign Vault</span>
                </li>
              </ul>
            </div>

            {/* Security Notice Card */}
            <div className="p-5 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-2">
              <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#111111]" /> 
                <span>Keamanan Standar Perbankan</span>
              </h3>
              <p className="text-xs text-[#666666] font-light leading-relaxed">
                Seluruh data identitas e-KTP dan foto biometrik disimpan menggunakan enkripsi tingkat militer AES-256 dan dilindungi protokol kepatuhan Anti-Pencucian Uang (APU-PPT).
              </p>
            </div>
          </main>
        </div>
      );
    }

    // DESKTOP STATUS VIEW (V 3.1 Editorial Private Banking Style)
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black">
        <Sidebar />

        <main className="ml-64 flex-1 flex flex-col min-w-0">
          <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">Status Verifikasi KYC</h2>
              <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm">
                AliBank Vault Node
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/settings')}
                className="px-3.5 py-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Pengaturan</span>
              </button>
              <div 
                className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] shrink-0 cursor-pointer hover:border-black transition-colors" 
                onClick={() => router.push('/profile')}
                title="Profil Pengguna"
              >
                <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
              </div>
            </div>
          </header>

          <div className="p-8 space-y-8 max-w-[1300px] w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (8 cols): Hero Status Card */}
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 sm:p-10 shadow-sm space-y-6 relative overflow-hidden">
                  {/* Radial Guilloche Watermark */}
                  <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.035] pointer-events-none -mr-16 -mt-16">
                    <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                      <circle cx="100" cy="100" r="30" strokeWidth="1" />
                      <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                      <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                    </svg>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left relative z-10">
                    <div className="w-16 h-16 rounded-full shrink-0 flex items-center justify-center border shadow-xs">
                      {isVerified ? (
                        <div className="w-full h-full rounded-full bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] flex items-center justify-center">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                      ) : isPending ? (
                        <div className="w-full h-full rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center">
                          <Clock className="w-8 h-8 animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] flex items-center justify-center">
                          <ShieldAlert className="w-8 h-8" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 flex-1 min-w-0">
                      <span className={cn(
                        "font-mono text-[9px] font-bold uppercase px-2.5 py-1 rounded-sm tracking-wider border inline-block",
                        isVerified ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" :
                        isPending ? "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]" :
                        "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                      )}>
                        {isVerified ? "IDENTITAS TERVERIFIKASI" : isPending ? "SEDANG DITINJAU OLEH ADMIN" : "PENGAJUAN PERLU PERBAIKAN"}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                        {isVerified ? "Akun Anda Resmi Terverifikasi" : isPending ? "Menunggu Konfirmasi Manual" : "Pengajuan Ditolak"}
                      </h2>
                      <p className="text-xs text-[#666666] font-light leading-relaxed">
                        {isVerified ? "Seluruh fitur perbankan, penarikan tanpa limit, kliring PayPal, dan smart contract ALX Vault aktif untuk akun Anda." :
                         isPending ? "Dokumen identitas KTP dan selfie biometrik Anda telah kami terima. Tim kepatuhan AliBank sedang memvalidasi data Anda (estimasi 1x24 jam kerja)." :
                         "Dokumen yang Anda kirimkan tidak memenuhi kriteria verifikasi (misal: foto buram atau NIK tidak sesuai). Silakan ajukan ulang dengan foto yang lebih jelas."}
                      </p>
                    </div>
                  </div>

                  {/* Submitted Summary Box */}
                  {userData.kycData && (
                    <div className="bg-[#FAF9F6] p-6 rounded-sm border border-[#DFDAD0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-left relative z-10">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Nomor NIK</span>
                        <p className="text-sm font-mono font-bold text-[#111111]">{userData.kycData.idNumber || userData.kycData.nik || "---"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Nama Lengkap</span>
                        <p className="text-sm font-bold uppercase text-[#111111]">{userData.kycData.fullName || userData.kycData.nama || userData.name || "---"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Alamat Terdaftar</span>
                        <p className="text-xs text-[#666666]">{userData.kycData.address || userData.kycData.alamat || "---"}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Waktu Pengajuan</span>
                        <p className="text-xs font-mono text-[#666666]">
                          {userData.kycData.submittedAt ? new Date(userData.kycData.submittedAt).toLocaleString('id-ID') : "---"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-2 flex flex-wrap gap-3 relative z-10">
                    {isVerified ? (
                      <>
                        <button 
                          onClick={() => router.push('/settings')} 
                          className="flex-1 py-3 px-5 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                        >
                          Kembali ke Pengaturan
                        </button>
                        <button 
                          onClick={() => { setViewMode('form'); setStep(1); }} 
                          className="flex-1 py-3 px-5 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#F4B728]" />
                          <span>Perbarui Data</span>
                        </button>
                      </>
                    ) : isPending ? (
                      <>
                        <button 
                          onClick={() => router.push('/')} 
                          className="flex-1 py-3 px-5 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                        >
                          Ke Dashboard
                        </button>
                        <button 
                          onClick={() => { setViewMode('form'); setStep(1); }} 
                          className="flex-1 py-3 px-5 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#F4B728]" />
                          <span>Kirim Ulang Dokumen</span>
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => { setViewMode('form'); setStep(1); }} 
                        className="w-full py-3.5 px-5 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-sm transition-colors cursor-pointer"
                      >
                        Ajukan Ulang KYC Sekarang →
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (4 cols): Benefits & Security Notice */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-4">
                  <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F4B728]" /> 
                    <span>Keuntungan Verifikasi KYC AliBank</span>
                  </h3>
                  <ul className="space-y-3 text-xs">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#555555]">Limit penarikan saldo IDR hingga Rp 100.000.000 / hari</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#555555]">Akses penuh kliring kartu & transaksi PayPal instan</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#555555]">Otentikasi Smart Contract AlixCoin (ALX) Staking & Yield Vault</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[#555555]">Perlindungan anti-pembajakan aset dengan Secure Multi-Sign Vault</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-3">
                  <h3 className="font-serif text-sm font-bold text-[#111111] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#111111]" /> 
                    <span>Keamanan Standar Perbankan</span>
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    Seluruh data identitas e-KTP dan foto biometrik disimpan menggunakan enkripsi tingkat militer AES-256 dan dilindungi protokol kepatuhan Anti-Pencucian Uang (APU-PPT).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // MOBILE VIEW: MULTI-STEP KYC WIZARD FORM
  // ==========================================
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body">
        {/* Hidden File Inputs */}
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

          {/* STEP 1: SCAN / UPLOAD KTP (MOBILE) */}
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

              {/* Editable Form Card (MOBILE) */}
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

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Nama Lengkap Sesuai KTP *</label>
                      <Input 
                        value={kycForm.nama} 
                        onChange={(e) => setKycData({ ...kycForm, nama: e.target.value.toUpperCase() })} 
                        placeholder="Nama lengkap sesuai KTP" 
                        className="h-12 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>

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

                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Alamat KTP</label>
                      <Input 
                        value={kycForm.alamat} 
                        onChange={(e) => setKycData({ ...kycForm, alamat: e.target.value.toUpperCase() })} 
                        placeholder="Jalan / Gang / No. Rumah" 
                        className="h-11 rounded-xl bg-muted/40 font-bold uppercase text-xs" 
                      />
                    </div>

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

          {/* STEP 2: DATA KORESPONDENSI (MOBILE) */}
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

          {/* STEP 3: SELFIE BIOMETRIK (MOBILE) */}
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

          {/* STEP 4: SUCCESS CONFIRMATION (MOBILE) */}
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

  // ==========================================
  // DESKTOP VIEW: MULTI-STEP KYC WIZARD FORM (V 3.1 EDITORIAL PRIVATE BANKING)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black">
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

      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">Verifikasi Identitas KYC</h2>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm">
              AliBank Vault Node
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                stopCamera();
                if (userData?.kycStatus && userData.kycStatus !== 'unverified') {
                  setViewMode('status');
                } else {
                  router.push('/settings');
                }
              }}
              className="px-3.5 py-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <div 
              className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] shrink-0 cursor-pointer hover:border-black transition-colors" 
              onClick={() => router.push('/profile')}
              title="Profil Pengguna"
            >
              <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1300px] w-full mx-auto">
          {/* STEPPER HEADER PROGRESS */}
          {step < 4 && (
            <div className="p-4 rounded-sm bg-white border border-[#DFDAD0] shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { num: 1, title: "Foto & Scan e-KTP", subtitle: "Verifikasi Identitas Resmi", icon: CreditCard },
                  { num: 2, title: "Data Korespondensi", subtitle: "Domisili & Kontak Aktif", icon: MapPin },
                  { num: 3, title: "Selfie Biometrik", subtitle: "Pencocokan Wajah & e-KTP", icon: Camera }
                ].map((s) => (
                  <div key={s.num} className={cn(
                    "p-3.5 rounded-sm border flex items-center gap-3 transition-all",
                    step === s.num ? "border-[#111111] bg-[#FAF9F6] shadow-xs" :
                    step > s.num ? "border-emerald-200 bg-emerald-50/40 text-[#666666]" :
                    "border-transparent bg-transparent opacity-50"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-sm flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors",
                      step === s.num ? "bg-[#111111] text-white" :
                      step > s.num ? "bg-emerald-600 text-white" :
                      "bg-[#FAF9F6] border border-[#DFDAD0] text-[#777777]"
                    )}>
                      {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-xs font-serif font-bold uppercase tracking-tight truncate", step === s.num ? "text-[#111111]" : "text-[#777777]")}>
                        {s.title}
                      </p>
                      <p className="text-[10px] text-[#888888] truncate">{s.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 1: SCAN / UPLOAD KTP (DESKTOP) */}
          {step === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
              {/* Left Column (5 cols): Camera / Upload Box */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-bold text-[#111111] flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#F4B728]" /> 
                      <span>Foto Fisik e-KTP Asli</span>
                    </h3>
                    <p className="text-xs text-[#666666] font-light">
                      Posisikan fisik e-KTP Anda di tempat terang dan seluruh 4 sudut tidak terpotong.
                    </p>
                  </div>

                  {/* Camera / Image Container */}
                  <div className="relative aspect-[1.6/1] rounded-sm border-2 border-dashed border-[#DFDAD0] bg-[#FAF9F6] overflow-hidden flex items-center justify-center">
                    {isCameraActive && cameraMode === 'idCard' ? (
                      <>
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-4 border-2 border-[#F4B728] rounded-sm border-dashed animate-pulse pointer-events-none" />
                        <div className="absolute top-3 left-4 bg-black/80 px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Kamera KTP Aktif
                        </div>
                        <button 
                          onClick={() => capturePhoto('idCard')} 
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-[#111111] shadow-lg active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#111111]" />
                        </button>
                        <button 
                          onClick={stopCamera} 
                          className="absolute top-3 right-3 p-1.5 rounded-sm bg-black/70 text-white hover:bg-black cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : previews.idCard ? (
                      <div className="relative w-full h-full">
                        <img src={previews.idCard} alt="KTP Preview" className="w-full h-full object-cover" />
                        {isOcrLoading && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 text-white p-4 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#F4B728]" />
                            <span className="text-[10px] font-mono uppercase tracking-widest text-[#F4B728] animate-pulse">
                              AI OCR Membaca Data KTP...
                            </span>
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button 
                            onClick={() => ktpFileInputRef.current?.click()} 
                            className="px-3 py-1.5 rounded-sm bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black backdrop-blur-sm cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" /> Ganti Foto
                          </button>
                          <button 
                            onClick={() => startCamera('idCard')} 
                            className="p-2 rounded-sm bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center p-6 w-full">
                        <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center shadow-xs">
                          <CreditCard className="w-6 h-6 text-[#F4B728]" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-serif text-xs font-bold text-[#111111] uppercase tracking-wide">Pilih Metode Pengambilan KTP</p>
                          <p className="text-[10px] text-[#666666]">Gunakan kamera laptop/webcam atau unggah file foto KTP</p>
                        </div>
                        <div className="flex flex-wrap gap-2.5 justify-center w-full max-w-xs">
                          <button 
                            type="button" 
                            onClick={() => startCamera('idCard')} 
                            className="flex-1 py-2.5 px-3 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#F4B728]" /> Buka Kamera
                          </button>
                          <button 
                            type="button" 
                            onClick={() => ktpFileInputRef.current?.click()} 
                            className="flex-1 py-2.5 px-3 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Unggah Foto
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Guidelines Card */}
                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-3">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#F4B728]" /> 
                    <span>Panduan Foto e-KTP</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-[#666666]">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Gunakan fisik e-KTP asli (bukan fotokopi atau hasil print).</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pastikan NIK 16 digit dan nama terbaca tajam tanpa pantulan flash.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>KTP masih berlaku (seumur hidup) dan tidak terpotong sudutnya.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column (7 cols): Editable e-KTP Data Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-8 rounded-sm bg-white border border-[#DFDAD0] space-y-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE6DF]">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm font-bold">
                        Data Identitas e-KTP
                      </span>
                      <span className="text-xs text-[#666666] font-light">
                        {previews.idCard ? "Hasil terbaca AI — silakan periksa dan koreksi jika perlu" : "Dapat diisi langsung atau gunakan kamera di sebelah kiri"}
                      </span>
                    </div>
                    {isOcrLoading ? (
                      <div className="flex items-center gap-1.5 text-[#111111] text-[10px] font-mono font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B728]" /> Membaca...
                      </div>
                    ) : isDuplicate ? (
                      <span className="bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded-sm font-bold">Duplikat</span>
                    ) : previews.idCard ? (
                      <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-[9px] uppercase px-2 py-0.5 rounded-sm font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Siap
                      </span>
                    ) : null}
                  </div>

                  {ocrFailedNotice && previews.idCard && (
                    <div className="p-3.5 rounded-sm bg-amber-50 border border-amber-200 flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 font-medium leading-relaxed">
                        Data KTP belum terbaca otomatis sepenuhnya. Silakan lengkapi NIK dan Nama Anda pada formulir di bawah ini.
                      </p>
                    </div>
                  )}

                  {isDuplicate && (
                    <div className="p-3.5 rounded-sm bg-rose-50 border border-rose-200 flex gap-3">
                      <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">NIK SUDAH TERDAFTAR</p>
                        <p className="text-xs text-[#555555] leading-relaxed">
                          NIK ini telah diverifikasi oleh akun: <span className="text-rose-700 font-bold">{linkedEmail}</span>. Silakan gunakan NIK Anda sendiri.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* NIK Input */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5 flex items-center justify-between">
                        <span>Nomor Induk Kependudukan (NIK 16 Digit) *</span>
                        <span className="font-mono text-[10px]">{kycForm.nik.length}/16</span>
                      </label>
                      <Input 
                        value={kycForm.nik} 
                        onChange={(e) => handleNikInputChange(e.target.value)}
                        placeholder="Contoh: 3171xxxxxxxxxxxx" 
                        className={cn(
                          "h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-mono font-bold text-sm tracking-wider text-[#111111]",
                          isDuplicate && "border-rose-400 bg-rose-50 text-rose-700"
                        )} 
                      />
                    </div>

                    {/* Nama Lengkap Input */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Nama Lengkap Sesuai KTP *</label>
                      <Input 
                        value={kycForm.nama} 
                        onChange={(e) => setKycData({ ...kycForm, nama: e.target.value.toUpperCase() })} 
                        placeholder="Nama lengkap sesuai e-KTP" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-bold uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Tempat / Tgl Lahir */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Tempat/Tgl Lahir</label>
                      <Input 
                        value={kycForm.tempatTglLahir} 
                        onChange={(e) => setKycData({ ...kycForm, tempatTglLahir: e.target.value.toUpperCase() })} 
                        placeholder="JAKARTA, 01-01-1995" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Jenis Kelamin */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Jenis Kelamin</label>
                      <Input 
                        value={kycForm.jenisKelamin} 
                        onChange={(e) => setKycData({ ...kycForm, jenisKelamin: e.target.value.toUpperCase() })} 
                        placeholder="LAKI-LAKI / PEREMPUAN" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Alamat */}
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Alamat KTP</label>
                      <Input 
                        value={kycForm.alamat} 
                        onChange={(e) => setKycData({ ...kycForm, alamat: e.target.value.toUpperCase() })} 
                        placeholder="Jalan / Gang / Nomor Rumah" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* RT/RW */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">RT / RW</label>
                      <Input 
                        value={kycForm.rtRw} 
                        onChange={(e) => setKycData({ ...kycForm, rtRw: e.target.value })} 
                        placeholder="001/002" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-mono font-medium text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Kecamatan */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Kecamatan</label>
                      <Input 
                        value={kycForm.kecamatan} 
                        onChange={(e) => setKycData({ ...kycForm, kecamatan: e.target.value.toUpperCase() })} 
                        placeholder="Nama Kecamatan" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Agama */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Agama</label>
                      <Input 
                        value={kycForm.agama} 
                        onChange={(e) => setKycData({ ...kycForm, agama: e.target.value.toUpperCase() })} 
                        placeholder="ISLAM / KRISTEN / LAINNYA" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>

                    {/* Pekerjaan */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Pekerjaan</label>
                      <Input 
                        value={kycForm.pekerjaan} 
                        onChange={(e) => setKycData({ ...kycForm, pekerjaan: e.target.value.toUpperCase() })} 
                        placeholder="KARYAWAN / WIRASWASTA" 
                        className="h-11 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#EAE6DF]">
                    <button 
                      type="button" 
                      onClick={() => {
                        setIdCardFile(null);
                        setPreviews(p => ({ ...p, idCard: "" }));
                        setOcrFailedNotice(false);
                      }} 
                      className="flex-1 py-3 px-4 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] font-bold text-xs uppercase tracking-wider text-[#111111] transition-colors cursor-pointer shadow-xs"
                    >
                      Foto Ulang
                    </button>
                    <button 
                      type="button"
                      disabled={isDuplicate || !kycForm.nik || kycForm.nik.length < 10 || !kycForm.nama || isOcrLoading || !previews.idCard} 
                      onClick={() => setStep(2)} 
                      className="flex-[2] py-3 px-4 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Lanjutkan ke Kontak</span>
                      <ChevronRight className="w-4 h-4 text-[#F4B728]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: DATA KORESPONDENSI (DESKTOP) */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
              {/* Left Column (5 cols): Context & Summary */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] space-y-4 shadow-sm">
                  <h3 className="font-serif text-base font-bold text-[#111111] flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#F4B728]" /> 
                    <span>Data Korespondensi</span>
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    AliBank memerlukan nomor WhatsApp aktif dan alamat domisili untuk verifikasi keamanan 2FA, konfirmasi transaksi limit tinggi, serta pengiriman kartu debit fisik.
                  </p>

                  <div className="bg-[#FAF9F6] p-4 rounded-sm space-y-2 border border-[#DFDAD0] text-xs">
                    <div className="flex justify-between pb-2 border-b border-[#EAE6DF]">
                      <span className="text-[#777777] font-medium">Nama Terdaftar</span>
                      <span className="font-bold uppercase text-[#111111]">{kycForm.nama || "---"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#777777] font-medium">Nomor NIK</span>
                      <span className="font-mono font-bold text-[#111111]">{kycForm.nik || "---"}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] shadow-sm space-y-2">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#111111]" /> 
                    <span>Jaminan Kerahasiaan</span>
                  </h4>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    Nomor WhatsApp dan alamat domisili Anda tidak akan pernah dibagikan kepada pihak ketiga untuk keperluan komersial atau promosi spam.
                  </p>
                </div>
              </div>

              {/* Right Column (7 cols): Contact Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-8 rounded-sm bg-white border border-[#DFDAD0] space-y-5 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Provinsi Domisili Saat Ini *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
                      <Input 
                        value={kycForm.province} 
                        onChange={(e) => setKycData({...kycForm, province: e.target.value.toUpperCase()})} 
                        placeholder="CONTOH: DKI JAKARTA / JAWA BARAT" 
                        className="h-11 pl-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-medium uppercase text-xs text-[#111111]" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Kode Pos Domisili (5 Digit) *</label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#777777]" />
                      <Input 
                        value={kycForm.postalCode} 
                        onChange={(e) => setKycData({...kycForm, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5)})} 
                        placeholder="Contoh: 12340" 
                        className="h-11 pl-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-mono font-medium text-xs text-[#111111]" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] ml-0.5">Nomor WhatsApp Aktif *</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F4B728]" />
                      <Input 
                        value={kycForm.whatsapp} 
                        onChange={(e) => setKycData({...kycForm, whatsapp: e.target.value.replace(/[^\d+]/g, '')})} 
                        placeholder="08xxxxxxxxxx" 
                        className="h-11 pl-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] focus:border-black font-mono font-medium text-xs text-[#111111]" 
                      />
                    </div>
                    <p className="text-[10px] text-[#777777] ml-0.5">Digunakan untuk konfirmasi verifikasi dan keamanan transaksi tingkat tinggi.</p>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-[#EAE6DF]">
                    <button 
                      type="button" 
                      onClick={() => setStep(1)} 
                      className="flex-1 py-3 px-4 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] font-bold uppercase tracking-wider text-[#111111] text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Kembali
                    </button>
                    <button 
                      type="button"
                      disabled={!kycForm.province || !kycForm.postalCode || !kycForm.whatsapp} 
                      onClick={() => setStep(3)} 
                      className="flex-[2] py-3 px-4 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <span>Lanjutkan ke Selfie</span>
                      <ChevronRight className="w-4 h-4 text-[#F4B728]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SELFIE BIOMETRIK (DESKTOP) */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">
              {/* Left Column (5 cols): Selfie Camera */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-sm bg-white border border-[#DFDAD0] space-y-4 shadow-sm text-center">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-bold text-[#111111] flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4 text-[#F4B728]" /> 
                      <span>Selfie Biometrik</span>
                    </h3>
                    <p className="text-xs text-[#666666] font-light">
                      Pegang fisik e-KTP Anda di samping wajah untuk verifikasi kesesuaian identitas.
                    </p>
                  </div>

                  {/* Selfie Camera / Image Box */}
                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-sm border-2 border-dashed border-[#DFDAD0] bg-[#FAF9F6] overflow-hidden flex items-center justify-center">
                    {isCameraActive && cameraMode === 'selfie' ? (
                      <>
                        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                        <div className="absolute inset-4 border-2 border-[#F4B728] rounded-full border-dashed animate-pulse pointer-events-none" />
                        <div className="absolute top-3 bg-black/80 px-2.5 py-1 rounded-sm text-[9px] font-mono uppercase text-white flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Kamera Depan Aktif
                        </div>
                        <button 
                          onClick={() => capturePhoto('selfie')} 
                          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-white border-2 border-[#111111] shadow-lg active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-9 h-9 rounded-full bg-[#111111]" />
                        </button>
                        <button 
                          onClick={stopCamera} 
                          className="absolute top-3 right-3 p-1.5 rounded-sm bg-black/70 text-white hover:bg-black cursor-pointer"
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
                            className="px-3 py-1.5 rounded-sm bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black backdrop-blur-sm cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" /> Ganti Foto
                          </button>
                          <button 
                            onClick={() => startCamera('selfie')} 
                            className="p-2 rounded-sm bg-black/80 text-white hover:bg-black backdrop-blur-sm cursor-pointer"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center p-6 w-full">
                        <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center shadow-xs">
                          <User className="w-6 h-6 text-[#F4B728]" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-serif text-xs font-bold text-[#111111] uppercase tracking-wide">Metode Foto Selfie</p>
                          <p className="text-[10px] text-[#666666]">Gunakan webcam atau unggah foto selfie memegang KTP</p>
                        </div>
                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                          <button 
                            type="button" 
                            onClick={() => startCamera('selfie')} 
                            className="py-2.5 px-3 rounded-sm bg-[#111111] hover:bg-black text-white font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#F4B728]" /> Buka Webcam
                          </button>
                          <button 
                            type="button" 
                            onClick={() => selfieFileInputRef.current?.click()} 
                            className="py-2.5 px-3 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" /> Unggah Dari File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column (7 cols): Checklist & Submit */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-8 rounded-sm bg-white border border-[#DFDAD0] space-y-5 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-serif text-base font-bold text-[#111111] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#F4B728]" /> 
                      <span>Ringkasan Dokumen Pengajuan</span>
                    </h3>
                    <p className="text-xs text-[#666666] font-light">
                      Pastikan seluruh informasi yang Anda serahkan telah sesuai dengan dokumen resmi Anda.
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[#111111]">Foto Fisik e-KTP</span>
                      </div>
                      <span className="font-mono text-xs font-bold text-[#111111]">{kycForm.nik}</span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[#111111]">Nama Lengkap</span>
                      </div>
                      <span className="font-bold uppercase text-xs text-[#111111]">{kycForm.nama}</span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-[#111111]">Korespondensi</span>
                      </div>
                      <span className="text-xs font-medium text-[#666666]">{kycForm.province} • {kycForm.whatsapp}</span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        {previews.selfie ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="font-medium text-[#111111]">Foto Selfie Biometrik</span>
                      </div>
                      <span className={cn("text-xs font-bold", previews.selfie ? "text-emerald-700" : "text-amber-700")}>
                        {previews.selfie ? "Siap Diunggah" : "Wajib Dilengkapi"}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#777777] font-light leading-relaxed pt-2">
                    Dengan menekan tombol di bawah, saya menyatakan bahwa data dan foto yang saya unggah adalah asli milik saya sendiri dan siap bertanggung jawab secara hukum atas kebenaran data tersebut.
                  </p>

                  <div className="flex gap-3 pt-4 border-t border-[#EAE6DF]">
                    <button 
                      type="button" 
                      onClick={() => { stopCamera(); setStep(2); }} 
                      className="flex-1 py-3 px-4 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] font-bold uppercase tracking-wider text-[#111111] text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      Kembali
                    </button>
                    <button 
                      type="button"
                      disabled={!selfieFile || isProcessing} 
                      onClick={handleSubmitKyc} 
                      className="flex-[2] py-3 px-4 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin w-4 h-4 text-[#F4B728]" /> Mengirim Dokumen...
                        </span>
                      ) : (
                        <span>Ajukan Verifikasi KYC →</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION (DESKTOP) */}
          {step === 4 && (
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-6 text-center animate-in zoom-in-95 max-w-lg mx-auto py-10 px-8 bg-white border border-[#DFDAD0] rounded-sm shadow-sm relative overflow-hidden">
              {/* Radial Guilloche Watermark */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.035] pointer-events-none -mr-16 -mt-16">
                <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="30" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                </svg>
              </div>

              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="inline-block bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[9px] uppercase px-3 py-1 font-bold rounded-sm tracking-wider">
                  STATUS: SEDANG DITINJAU
                </span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-[#111111]">Pengajuan KYC Berhasil Dikirim</h2>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Dokumen identitas e-KTP dan selfie Anda telah berhasil dienkripsi dan masuk ke antrean verifikasi kepatuhan AliBank V3. Tim kepatuhan kami akan meninjau pengajuan ini dalam 1x24 jam kerja.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                <button 
                  onClick={() => router.push('/')} 
                  className="flex-1 py-3 px-4 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Kembali ke Dashboard
                </button>
                <button 
                  onClick={() => { setViewMode('status'); setStep(1); }} 
                  className="flex-1 py-3 px-4 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] rounded-sm font-bold uppercase tracking-wider text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Lihat Status Pengajuan
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}