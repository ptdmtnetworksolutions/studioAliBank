
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Send, 
  ArrowRight, 
  ShieldCheck, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  X,
  History
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from "@/firebase";
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

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const transactionsQuery = useMemoFirebase(() => (!db || !user) ? null : query(
    collection(db, "users", user.uid, "transactions"),
    limit(100)
  ), [db, user]);

  const { data: rawTxs } = useCollection(transactionsQuery);

  const realRecentRecipients = useMemo(() => {
    if (!rawTxs) return [];
    
    const recentTxs = rawTxs
      .filter(tx => tx.category === "Transfer")
      .sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

    const recipients: any[] = [];
    const seen = new Set();
    recentTxs.forEach(tx => {
      if (tx.description.includes('(')) {
        const match = tx.description.match(/Transfer ke (.*) \((.*)\)/);
        if (match && !seen.has(match[2])) {
          seen.add(match[2]);
          recipients.push({ name: match[1], accountNumber: match[2], bank: "AliBank", isReal: true });
        }
      }
    });
    return recipients.slice(0, 5);
  }, [rawTxs]);

  const handleSearchAccount = async () => {
    if (!db || !searchAccount || searchAccount.length < 5) return;
    setIsSearching(true);
    try {
      const q = query(collection(db, "users"), where("accountNumber", "==", searchAccount), limit(1));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const foundUser = snapshot.docs[0].data();
        if (foundUser.uid === user?.uid) {
          toast({ variant: "destructive", title: "Gagal", description: "Anda tidak bisa mentransfer ke diri sendiri." });
        } else {
          setSelectedRecipient({ id: snapshot.docs[0].id, name: foundUser.name, accountNumber: foundUser.accountNumber, bank: "AliBank", isReal: true });
        }
      } else {
        toast({ variant: "destructive", title: "Tidak Ditemukan", description: "Nomor rekening AliBank tidak terdaftar." });
      }
    } catch (err) {} finally { setIsSearching(false); }
  };

  const handleExecuteTransfer = () => {
    if (!user || !db || !amount || !selectedRecipient || !userData) return;
    const numAmount = parseFloat(amount);
    if (numAmount > (userData.totalBalance || 0)) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup" });
      return;
    }

    setIsProcessing(true);
    const senderRef = doc(db, "users", user.uid);
    updateDoc(senderRef, { totalBalance: increment(-numAmount) });

    if (selectedRecipient.isReal && selectedRecipient.id) {
      const recipientRef = doc(db, "users", selectedRecipient.id);
      updateDoc(recipientRef, { totalBalance: increment(numAmount) });

      const recipientNotifRef = collection(db, "users", selectedRecipient.id, "notifications");
      addDoc(recipientNotifRef, {
        title: "Dana Masuk",
        message: `Anda menerima transfer sebesar Rp ${numAmount.toLocaleString('id-ID')} dari ${userData.name}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    const txRef = collection(db, "users", user.uid, "transactions");
    const notifRef = collection(db, "users", user.uid, "notifications");

    addDoc(txRef, {
      date: new Date().toISOString(),
      description: `Transfer ke ${selectedRecipient.name} (${selectedRecipient.accountNumber})`,
      category: "Transfer",
      amount: numAmount,
      type: "expense",
      timestamp: serverTimestamp(),
      note: note || ""
    });

    addDoc(notifRef, {
      title: "Transfer Berhasil",
      message: `Berhasil mengirim Rp ${numAmount.toLocaleString('id-ID')} ke ${selectedRecipient.name}.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString()
    });

    setStep('success');
    setIsProcessing(false);
    toast({ title: "Berhasil", description: "Transfer telah diselesaikan secara riil." });
  };

  if (step === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"><CheckCircle2 className="w-12 h-12 text-green-600" /></div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Transfer Berhasil</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Terkirim</p>
        <p className="text-3xl font-black text-primary italic">Rp {parseFloat(amount).toLocaleString('id-ID')}</p>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
    </div>
  );

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
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Penerima</label>
                {selectedRecipient ? (
                  <div className="p-6 rounded-[1.5rem] gold-gradient text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center font-black text-lg">{selectedRecipient.name[0]}</div>
                      <div>
                        <p className="text-sm font-black italic uppercase">{selectedRecipient.name}</p>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{selectedRecipient.bank} • {selectedRecipient.accountNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedRecipient(null)} className="p-2 rounded-xl bg-white/10"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                      {realRecentRecipients.map((b, idx) => (
                        <button key={idx} onClick={() => setSelectedRecipient(b)} className="flex-shrink-0 w-24 h-28 rounded-2xl liquid-glass border-none hover:bg-primary/10 flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{b.name[0]}</div>
                          <span className="text-[9px] font-black uppercase text-center px-1 truncate w-full">{b.name}</span>
                        </button>
                      ))}
                    </div>
                    <div className="relative flex gap-2">
                      <Input placeholder="Cari Nomor Rekening AliBank..." value={searchAccount} onChange={(e) => setSearchAccount(e.target.value)} className="h-14 rounded-2xl liquid-glass border-none font-bold text-xs" />
                      <Button onClick={handleSearchAccount} disabled={isSearching || searchAccount.length < 5} className="h-14 px-6 rounded-2xl gold-gradient text-white font-black uppercase text-[10px]">
                        {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verifikasi"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah Transfer</label>
                <Input type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-20 text-3xl font-black italic pl-16 rounded-[2rem] liquid-glass border-none" />
              </div>
              <Button onClick={handleExecuteTransfer} disabled={isProcessing || !amount || !selectedRecipient} className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-[2rem] shadow-xl">
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : "Konfirmasi & Kirim"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
