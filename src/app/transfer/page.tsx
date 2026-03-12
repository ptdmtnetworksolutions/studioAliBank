
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_BENEFICIARIES } from "@/app/lib/mock-data";
import { 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc } from "@/firebase";
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  limit 
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function TransferPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [searchAccount, setSearchAccount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'selection' | 'confirmation' | 'success'>('selection');

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const handleSearchAccount = async () => {
    if (!db || !searchAccount || searchAccount.length < 5) return;
    
    setIsSearching(true);
    try {
      const q = query(
        collection(db, "users"),
        where("accountNumber", "==", searchAccount),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const foundUser = snapshot.docs[0].data();
        if (foundUser.uid === user?.uid) {
          toast({ variant: "destructive", title: "Gagal", description: "Anda tidak bisa mentransfer ke diri sendiri." });
        } else {
          setSelectedRecipient({
            id: snapshot.docs[0].id,
            name: foundUser.name,
            accountNumber: foundUser.accountNumber,
            bank: "AliBank",
            isReal: true
          });
        }
      } else {
        toast({ variant: "destructive", title: "Tidak Ditemukan", description: "Nomor rekening AliBank tidak terdaftar." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleExecuteTransfer = () => {
    if (!user || !db || !amount || !selectedRecipient || !userData) return;

    const numAmount = parseFloat(amount);
    if (numAmount > (userData.totalBalance || 0)) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Saldo Anda tidak mencukupi untuk transaksi ini." });
      return;
    }

    setIsProcessing(true);

    // 1. Potong Saldo Pengirim
    const senderRef = doc(db, "users", user.uid);
    updateDoc(senderRef, {
      totalBalance: increment(-numAmount)
    }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: senderRef.path,
        operation: 'update',
        requestResourceData: { totalBalance: increment(-numAmount) }
      }));
    });

    // 2. Tambah Saldo Penerima (Jika sesama AliBank)
    if (selectedRecipient.isReal) {
      const recipientRef = doc(db, "users", selectedRecipient.id);
      updateDoc(recipientRef, {
        totalBalance: increment(numAmount)
      }).catch(async () => {
        // Logika kegagalan update penerima (biasanya ditangani cloud function di produksi)
      });

      // Notifikasi Penerima
      const recipientNotifRef = collection(db, "users", selectedRecipient.id, "notifications");
      addDoc(recipientNotifRef, {
        title: "Dana Masuk",
        message: `Anda menerima transfer sebesar Rp ${numAmount.toLocaleString('id-ID')} dari ${userData.name}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    // 3. Catat Transaksi Pengirim
    const txRef = collection(db, "users", user.uid, "transactions");
    const txData = {
      date: new Date().toISOString(),
      description: `Transfer ke ${selectedRecipient.name} (${selectedRecipient.accountNumber})`,
      category: "Transfer",
      amount: numAmount,
      type: "expense",
      timestamp: serverTimestamp(),
      note: note || ""
    };
    addDoc(txRef, txData);

    // 4. Notifikasi Pengirim
    const senderNotifRef = collection(db, "users", user.uid, "notifications");
    addDoc(senderNotifRef, {
      title: "Transfer Berhasil",
      message: `Berhasil mengirim Rp ${numAmount.toLocaleString('id-ID')} ke ${selectedRecipient.name}.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });

    setStep('success');
    setIsProcessing(false);
    toast({ title: "Berhasil", description: "Transfer telah diselesaikan." });
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Transfer Berhasil</h2>
        <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs leading-relaxed">
          Dana telah dikirim secara riil ke rekening <span className="font-bold text-accent">{selectedRecipient?.name}</span>.
        </p>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Terkirim</p>
          <p className="text-3xl font-black text-primary italic">Rp {parseFloat(amount).toLocaleString('id-ID')}</p>
          <div className="mt-4 pt-4 border-t border-primary/5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Referensi Transaksi</p>
            <p className="text-[10px] font-black text-accent">{Math.random().toString(36).substring(7).toUpperCase()}</p>
          </div>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <header>
              <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Transfer Dana</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Layanan pemindahan aset riil antar nasabah AliBank.</p>
            </header>
            
            <div className="liquid-glass rounded-[2.5rem] p-8 space-y-8 border-primary/10 shadow-2xl">
              {/* Recipient Selection */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Penerima</label>
                
                {selectedRecipient ? (
                  <div className="p-6 rounded-[1.5rem] gold-gradient text-white flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">
                        {selectedRecipient.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black italic uppercase">{selectedRecipient.name}</p>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{selectedRecipient.bank} • {selectedRecipient.accountNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedRecipient(null)} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                      {MOCK_BENEFICIARIES.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setSelectedRecipient({ ...b, isReal: false })}
                          className="flex-shrink-0 w-24 h-28 rounded-2xl liquid-glass border-none hover:bg-primary/10 flex flex-col items-center justify-center gap-2 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {b.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[9px] font-black uppercase text-center px-1 truncate w-full">{b.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
                          <Input 
                            placeholder="Cari Nomor Rekening AliBank..." 
                            value={searchAccount}
                            onChange={(e) => setSearchAccount(e.target.value)}
                            className="h-14 pl-12 rounded-2xl liquid-glass border-none font-bold text-xs"
                          />
                        </div>
                        <Button 
                          onClick={handleSearchAccount}
                          disabled={isSearching || searchAccount.length < 5}
                          className="h-14 px-6 rounded-2xl gold-gradient text-white font-black uppercase text-[10px]"
                        >
                          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifikasi"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount Entry */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah Transfer</label>
                  <p className="text-[10px] font-bold text-accent uppercase">Saldo: Rp {userData?.totalBalance?.toLocaleString() || "0"}</p>
                </div>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">Rp</span>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-20 text-3xl font-black italic pl-16 rounded-[2rem] liquid-glass border-none"
                  />
                </div>
              </div>

              {/* Note Entry */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Catatan Opsional</label>
                <Input 
                  placeholder="Kebutuhan bisnis, makan malam, dll..." 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-14 rounded-2xl liquid-glass border-none font-medium text-xs"
                />
              </div>

              <div className="p-6 rounded-2xl bg-green-50 flex items-center gap-4 border border-green-100">
                <ShieldCheck className="text-green-600 w-8 h-8 shrink-0" />
                <p className="text-[10px] text-green-800 font-bold uppercase tracking-widest leading-relaxed">
                  Enkripsi V3 Aktif. Transfer ini akan diproses secara instan dan tidak dapat dibatalkan setelah eksekusi.
                </p>
              </div>

              <Button 
                onClick={handleExecuteTransfer}
                disabled={isProcessing || !amount || !selectedRecipient}
                className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-[2rem] shadow-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
              >
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Konfirmasi & Kirim Dana <ArrowRight className="w-5 h-5" /></>}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" /> Favorit Nasabah
            </h2>
            <div className="space-y-4">
              {MOCK_BENEFICIARIES.map((b) => (
                <Card key={b.id} onClick={() => setSelectedRecipient({ ...b, isReal: false })} className="liquid-glass border-none shadow-sm cursor-pointer hover:border-primary/40 transition-all rounded-[1.5rem] group">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/5 flex items-center justify-center font-black text-accent group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {b.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-sm text-accent uppercase italic">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{b.bank} • {b.acc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="liquid-glass p-8 rounded-[2.5rem] bg-primary/5 border border-primary/10">
              <h4 className="text-[10px] font-black uppercase text-accent mb-3 tracking-widest">Wawasan Keamanan</h4>
              <div className="flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed uppercase tracking-widest">
                  Selalu verifikasi nama penerima sebelum memasukkan PIN atau konfirmasi akhir. AliBank tidak pernah meminta OTP Anda melalui pesan atau telepon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
