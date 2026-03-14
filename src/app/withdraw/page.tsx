
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ArrowDownToLine, 
  Banknote, 
  Building2, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  Loader2, 
  ShieldCheck,
  Wallet,
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";

const availableBanks = [
  { id: "bca", name: "Bank Central Asia (BCA)" },
  { id: "seabank", name: "SeaBank Indonesia" },
  { id: "mandiri", name: "Bank Mandiri" },
  { id: "bni", name: "Bank Negara Indonesia (BNI)" },
  { id: "bri", name: "Bank Rakyat Indonesia (BRI)" },
  { id: "cimb", name: "CIMB Niaga" },
  { id: "jago", name: "Bank Jago" },
];

export default function WithdrawPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [targetBank, setTargetBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmation' | 'success'>('form');

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleWithdraw = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    
    if (numAmount > (userData.totalBalance || 0)) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Saldo IDR Anda tidak mencukupi untuk penarikan ini." });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Update Saldo User (Potong Saldo Langsung)
      await updateDoc(userDocRef, {
        totalBalance: increment(-numAmount)
      });

      // 2. Catat Transaksi dengan status PENDING untuk Verifikasi Gateway
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Withdraw: ${targetBank.toUpperCase()} (${accountNumber})`,
        category: "Withdraw",
        amount: numAmount,
        type: "expense",
        status: "pending", // Membutuhkan verifikasi Admin/Gateway
        bankDetails: {
          bank: targetBank,
          accountNumber,
          accountName
        },
        timestamp: serverTimestamp()
      });

      // 3. Kirim Notifikasi
      await addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Permintaan Penarikan Diterima",
        message: `Penarikan Rp ${numAmount.toLocaleString('id-ID')} ke ${targetBank.toUpperCase()} sedang diverifikasi oleh AliBank Node.`,
        type: "info",
        read: false,
        createdAt: new Date().toISOString()
      });

      setStep('success');
      toast({ title: "Permintaan Dikirim", description: "Dana Anda sedang dalam proses verifikasi sistem gateway." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-6">
        <Clock className="w-12 h-12 text-amber-600 animate-pulse" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Sedang Diproses</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Status: Pending Verification</p>
        <p className="text-3xl font-black text-primary italic">Rp {parseFloat(amount).toLocaleString('id-ID')}</p>
        <div className="mt-4 pt-4 border-t border-primary/5 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
          Dana akan masuk ke rekening {targetBank.toUpperCase()} ({accountNumber}) setelah diverifikasi oleh AliBank V3 Node (Estimasi 5-15 menit).
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
        Kembali ke Dashboard
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-4xl pt-4">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
                <ArrowDownToLine className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter">Withdraw Assets</h1>
                <p className="text-muted-foreground text-sm font-medium">Cairkan likuiditas IDR ke rekening bank riil Anda.</p>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
              V3 Node Verification Active
            </Badge>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
                {step === 'form' ? (
                  <>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Bank Tujuan</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                              <p className="text-[10px] font-bold">Pilih institusi perbankan tempat dana Anda akan dikirimkan.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select onValueChange={setTargetBank} value={targetBank}>
                          <SelectTrigger className="h-14 rounded-2xl liquid-glass border-none font-bold text-sm">
                            <SelectValue placeholder="Pilih Bank..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none liquid-glass">
                            {availableBanks.map((bank) => (
                              <SelectItem key={bank.id} value={bank.id} className="font-bold text-xs uppercase">{bank.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nomor Rekening</label>
                          <Input 
                            placeholder="0000000000"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            className="h-14 rounded-2xl liquid-glass border-none font-black italic"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Pemilik Rekening</label>
                          <Input 
                            placeholder="Sesuai Buku Tabungan"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="h-14 rounded-2xl liquid-glass border-none font-black italic"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah Penarikan (IDR)</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                              <p className="text-[10px] font-bold">Masukkan jumlah nominal yang ingin Anda tarik. Minimum penarikan adalah Rp 50.000.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">Rp</span>
                          <Input 
                            type="number" 
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-20 pl-16 text-3xl font-black italic rounded-3xl liquid-glass border-none focus:ring-primary/20"
                          />
                        </div>
                        <div className="flex justify-between px-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase">Saldo Tersedia: Rp {userData?.totalBalance?.toLocaleString() || "0"}</p>
                          <button 
                            onClick={() => setAmount(userData?.totalBalance?.toString() || "0")}
                            className="text-[9px] font-black text-primary uppercase hover:underline"
                          >
                            Tarik Semua
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => setStep('confirmation')}
                      disabled={!amount || !targetBank || !accountNumber || !accountName}
                      className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    >
                      REVIEW PENARIKAN <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black italic uppercase text-accent">Konfirmasi Penarikan</h3>
                      <p className="text-xs text-muted-foreground font-medium">Pastikan data berikut sudah benar sebelum eksekusi.</p>
                    </div>

                    <div className="space-y-4 p-6 rounded-[2rem] bg-primary/5 border border-primary/10">
                      <div className="flex justify-between py-2 border-b border-primary/5">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Bank Tujuan</span>
                        <span className="text-sm font-black text-accent">{targetBank.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-primary/5">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">No. Rekening</span>
                        <span className="text-sm font-black text-accent">{accountNumber}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-primary/5">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Atas Nama</span>
                        <span className="text-sm font-black text-accent">{accountName}</span>
                      </div>
                      <div className="flex justify-between py-4">
                        <span className="text-sm font-black uppercase text-accent">Total Dicairkan</span>
                        <span className="text-2xl font-black text-primary italic">Rp {parseFloat(amount).toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => setStep('form')}
                        className="flex-1 h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest"
                      >
                        Kembali
                      </Button>
                      <Button 
                        onClick={handleWithdraw}
                        disabled={isProcessing}
                        className="flex-[2] h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-lg"
                      >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "KONFIRMASI PENARIKAN"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="liquid-glass-dark rounded-[2.5rem] p-8 text-white border-none shadow-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                  <h4 className="text-sm font-black uppercase italic tracking-tighter">Withdraw Policy</h4>
                </div>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-[10px] font-bold text-white/70 leading-relaxed italic uppercase">
                      SETIAP PENARIKAN HARUS MELEWATI VERIFIKASI ALI-NODE V3 UNTUK KEAMANAN ASET.
                    </p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-[10px] font-bold text-white/70 leading-relaxed italic uppercase">
                      BIAYA PENARIKAN: **GRATIS (0%)**. ESTIMASI MASUK KE BANK: 5-15 MENIT.
                    </p>
                  </li>
                </ul>
              </Card>

              <Card className="liquid-glass rounded-[2rem] p-6 space-y-4 border-primary/10">
                <div className="flex items-center gap-3 text-accent">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-widest">Informasi Riil</h4>
                </div>
                <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed">
                  Untuk pengiriman dana **secara riil** ke rekening bank fisik, sistem memerlukan koneksi ke Payment Gateway API (seperti Xendit/Midtrans). Saat ini transaksi Anda masuk ke antrean verifikasi Admin.
                </p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
