
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Zap, 
  ShieldCheck, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  Coins,
  ImageIcon,
  RefreshCw,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, Suspense } from "react";
import { useUser, useDoc, useFirestore, useStorage, useMemoFirebase } from "@/firebase";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

function ConfirmDepositContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  
  const [asset, setAsset] = useState(searchParams.get('asset') || "BTC");
  const [txid, setTxid] = useState("");
  const [amount, setAmount] = useState("");
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!user || !db || !storage || !txid || !amount || !proofImage) {
      toast({ variant: "destructive", title: "Data Tidak Lengkap", description: "Pastikan TXID, Jumlah, dan Bukti Transfer sudah terisi." });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Upload Bukti
      const fileName = `deposit_${Date.now()}.jpg`;
      const storageRef = ref(storage, `payment_proofs/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, proofImage);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Simpan Permintaan Topup (Tipe Kripto)
      await addDoc(collection(db, "topup_requests"), {
        userId: user.uid,
        userName: userData?.name || "Nasabah AliBank",
        userEmail: user.email,
        amount: 0, // Not fiat
        asset: asset,
        estimatedAsset: parseFloat(amount),
        txid: txid,
        proofImage: downloadUrl,
        status: "pending",
        type: "crypto_deposit",
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      // 3. Catat ke Audit Global
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `DEPOSIT-${Date.now()}`,
        category: "External Inflow",
        gateway: "On-Chain Node",
        amountIdr: 0,
        cryptoAmount: parseFloat(amount),
        cryptoCurrency: asset,
        txHash: txid,
        description: `Pending on-chain deposit for ${userData?.name}. Hash: ${txid.slice(0,10)}...`,
        status: "pending_verification",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      setStep('success');
      toast({ title: "Laporan Terkirim", description: "Admin AliBank akan segera memverifikasi transaksi Anda di Blockchain." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengirim", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase mb-2">Laporan Diterima</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8 italic">Data Anda sedang divalidasi oleh Node Keamanan.</p>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 space-y-4 mb-8 shadow-2xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase">Menunggu Konfirmasi Jaringan</p>
          <p className="text-3xl font-black text-primary italic">{amount} {asset}</p>
          <div className="pt-4 border-t border-primary/5">
            <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              Proses verifikasi biasanya memakan waktu 5-30 menit tergantung kepadatan jaringan blockchain.
            </p>
          </div>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body transition-colors duration-300">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-sm font-black italic uppercase tracking-widest">Konfirmasi Setoran</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 pt-8 space-y-8 overflow-y-auto no-scrollbar pb-20">
        <div className="space-y-2">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">LAPOR PENGIRIMAN</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase italic leading-relaxed">
            Beritahu sistem AliBank bahwa Anda telah mengirimkan aset agar saldo dapat segera diperbarui secara riil.
          </p>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Aset yang Dikirim</label>
              <div className="h-12 px-4 rounded-xl bg-muted/50 flex items-center justify-between border border-border/50">
                <span className="text-sm font-black italic text-foreground">{asset}</span>
                <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black uppercase h-4">Verified Network</Badge>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Transaction ID (TXID) / Hash</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input 
                  placeholder="Tempel Hash Transaksi di sini..." 
                  value={txid}
                  onChange={(e) => setTxid(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-muted/50 border-none font-mono text-[10px] font-bold" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Jumlah Persis ({asset})</label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 pl-12 rounded-2xl bg-muted/50 border-none font-black italic text-lg" 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Unggah Tangkapan Layar (Opsional)</label>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden",
                  proofPreview ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted"
                )}
              >
                {proofPreview ? (
                  <img src={proofPreview} alt="proof" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase italic">Pilih Bukti Transfer</p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              Input TXID yang salah atau manipulasi bukti akan menyebabkan pembekuan akun oleh Node Keamanan AliBank.
            </p>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={isProcessing || !txid || !amount || !proofImage}
            className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                KIRIM LAPORAN SETORAN <Zap className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </Card>
      </main>
    </div>
  );
}

export default function ConfirmDepositPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" /></div>}>
      <ConfirmDepositContent />
    </Suspense>
  );
}
