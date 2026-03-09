
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_BENEFICIARIES } from "@/app/lib/mock-data";
import { Send, ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function TransferPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleTransfer = async () => {
    if (!user || !db || !amount || !selected) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Mohon lengkapi semua data transfer.",
      });
      return;
    }

    setLoading(true);
    const numAmount = parseFloat(amount);
    const beneficiary = MOCK_BENEFICIARIES.find(b => b.id === selected);

    try {
      // 1. Catat Transaksi
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Transfer ke ${beneficiary?.name} (${note || 'Tanpa catatan'})`,
        category: "Transfer",
        amount: numAmount,
        type: "expense",
        timestamp: serverTimestamp()
      });

      // 2. Update Saldo (Simulasi di sisi pengirim)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalBalance: increment(-numAmount)
      });

      toast({
        title: "Transfer Berhasil!",
        description: `Rp ${numAmount.toLocaleString('id-ID')} telah dikirim ke ${beneficiary?.name}.`,
      });
      router.push('/');
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Transfer Gagal",
        description: "Terjadi kesalahan sistem. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl font-bold text-accent">Transfer Dana</h1>
            
            <div className="liquid-glass rounded-3xl p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Pilih Penerima</label>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  <button className="flex-shrink-0 w-24 h-28 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/10">
                    <UserPlus className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">Baru</span>
                  </button>
                  {MOCK_BENEFICIARIES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b.id)}
                      className={cn(
                        "flex-shrink-0 w-24 h-28 rounded-2xl transition-all flex flex-col items-center justify-center gap-2",
                        selected === b.id 
                          ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                          : "liquid-glass border-none hover:bg-primary/10 text-accent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        selected === b.id ? "bg-white text-primary" : "bg-primary/10 text-primary"
                      )}>
                        {b.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-center px-1 truncate w-full">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Jumlah Transfer</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-bold text-accent/30">Rp</span>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-20 text-3xl font-bold pl-16 rounded-2xl liquid-glass border-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Catatan (Opsional)</label>
                <Input 
                  placeholder="Contoh: Bayar makan malam" 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="h-14 rounded-xl liquid-glass border-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-green-50 flex items-center gap-3">
                <ShieldCheck className="text-green-600 w-5 h-5" />
                <p className="text-xs text-green-700 font-medium">Transfer Anda diamankan dengan enkripsi end-to-end.</p>
              </div>

              <Button 
                onClick={handleTransfer}
                disabled={loading || !amount || !selected}
                className="w-full h-16 gold-gradient text-white text-lg font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? 'Memproses...' : 'Lanjutkan Transfer'} <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-bold text-accent">Sering Dikirim</h2>
            <div className="space-y-4">
              {MOCK_BENEFICIARIES.map((b) => (
                <Card key={b.id} className="liquid-glass border-none shadow-sm card-hover-effect">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center font-bold text-accent">
                        {b.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-accent">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.bank} • {b.acc}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelected(b.id)} className="text-primary hover:bg-primary/10">
                      <Send className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
