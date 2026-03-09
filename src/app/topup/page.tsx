
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Plus, 
  Copy, 
  QrCode, 
  CreditCard, 
  Building2, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

const bankAccounts = [
  { bank: "BCA", name: "AliBank Virtual Account", number: "80008", suffix: true, color: "bg-blue-600" },
  { bank: "Mandiri", name: "AliBank VA Transfer", number: "8829", suffix: true, color: "bg-yellow-600" },
  { bank: "BNI", name: "AliBank Deposito", number: "9210", suffix: true, color: "bg-orange-600" },
  { bank: "BRI", name: "AliBank BRIVA", number: "10294", suffix: true, color: "bg-blue-800" },
];

export default function TopUpPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Berhasil!",
      description: "Nomor rekening berhasil disalin.",
    });
  };

  const handleSimulateReceive = async () => {
    if (!user || !db || !amount) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Masukkan jumlah saldo yang ingin disimulasikan masuk.",
      });
      return;
    }

    setIsProcessing(true);
    const numAmount = parseFloat(amount);

    try {
      // 1. Simulasikan dana masuk dari bank luar
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Top Up / Terima Dana via Virtual Account`,
        category: "Top Up",
        amount: numAmount,
        type: "income",
        timestamp: serverTimestamp()
      });

      // 2. Update saldo akun utama
      await updateDoc(userDocRef!, {
        totalBalance: increment(numAmount)
      });

      toast({
        title: "Saldo Berhasil Masuk!",
        description: `Simulasi transfer Rp ${numAmount.toLocaleString('id-ID')} berhasil diterima.`,
      });
      setAmount("");
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Gagal mensimulasikan transfer masuk.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Terima Dana</h1>
          <p className="text-muted-foreground text-sm font-medium">Metode mudah untuk memindahkan dana ke rekening AliBank Anda.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Tabs defaultValue="va" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-14 bg-primary/5 rounded-2xl p-1.5 border border-primary/10">
                <TabsTrigger value="va" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                  Virtual Account
                </TabsTrigger>
                <TabsTrigger value="qris" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                  QRIS Universal
                </TabsTrigger>
                <TabsTrigger value="sim" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                  Simulasi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="va" className="mt-6 space-y-4">
                <div className="liquid-glass p-6 rounded-[2rem] border-primary/20 bg-primary/5 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-accent dark:text-primary">Instruksi Transfer</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-bold">
                    Gunakan nomor VA berikut di aplikasi bank pilihan Anda (m-banking/ATM).
                  </p>
                </div>

                {bankAccounts.map((item) => (
                  <div key={item.bank} className="liquid-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-primary/40 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg", item.color)}>
                        {item.bank}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.name}</p>
                        <p className="text-lg font-black text-accent dark:text-primary">
                          {item.number}{userData?.accountNumber?.slice(-5) || "00000"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(`${item.number}${userData?.accountNumber?.slice(-5) || "00000"}`)}
                      className="rounded-xl hover:bg-primary/10 text-primary"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="qris" className="mt-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden flex flex-col items-center p-10 space-y-8 bg-white dark:bg-black/40">
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-accent dark:text-primary">QRIS AliBank</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pindai dengan aplikasi bank atau e-wallet apa saja</p>
                  </div>
                  
                  <div className="relative w-64 h-64 bg-white p-4 rounded-3xl border-4 border-primary/20 shadow-2xl">
                    <Image 
                      src="https://picsum.photos/seed/qris/300/300" 
                      alt="QRIS Mockup" 
                      width={300}
                      height={300}
                      className="rounded-xl grayscale opacity-50"
                    />
                    <div className="absolute inset-0 flex items-center justify-center flex-col bg-black/5 rounded-2xl backdrop-blur-[1px]">
                      <QrCode className="w-16 h-16 text-primary animate-pulse" />
                      <p className="text-[8px] font-black text-accent mt-2 uppercase tracking-widest">Sedang Dihasilkan...</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 w-full opacity-40 grayscale">
                    <Image src="https://picsum.photos/seed/bca/50/50" alt="BCA" width={50} height={50} className="rounded-lg" />
                    <Image src="https://picsum.photos/seed/gopay/50/50" alt="GoPay" width={50} height={50} className="rounded-lg" />
                    <Image src="https://picsum.photos/seed/shopee/50/50" alt="Shopee" width={50} height={50} className="rounded-lg" />
                    <Image src="https://picsum.photos/seed/dana/50/50" alt="Dana" width={50} height={50} className="rounded-lg" />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="sim" className="mt-6">
                <div className="liquid-glass p-8 rounded-[2.5rem] border-primary/20 space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex gap-4 dark:bg-amber-900/20 dark:border-amber-900/40">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-800 text-sm uppercase tracking-tight dark:text-amber-400">Mode Simulasi</h4>
                      <p className="text-[10px] text-amber-700 leading-relaxed dark:text-amber-500">
                        Ini adalah fitur simulasi untuk mencoba bagaimana aplikasi menerima dana dari bank lain secara otomatis (mensimulasikan webhook Payment Gateway).
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah simulasi saldo masuk</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">Rp</span>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-20 pl-16 text-3xl font-black italic rounded-3xl liquid-glass border-none focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSimulateReceive}
                      disabled={isProcessing || !amount}
                      className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase tracking-tighter rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                      {isProcessing ? <Zap className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-white" />}
                      SIMULASIKAN TERIMA DANA
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white overflow-hidden relative group">
              <div className="absolute inset-0 gold-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Mengapa Top Up di AliBank?</h3>
                <div className="space-y-4">
                  {[
                    "Bunga tabungan harian s/d 6%",
                    "Gratis biaya admin bulanan",
                    "Akses ke produk Deposito Elite",
                    "Analisis pengeluaran berbasis AI"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="liquid-glass p-8 rounded-[2rem] border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-accent dark:text-primary text-sm uppercase tracking-tight">Limit Harian</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Tersisa</span>
                  <span>Maks. Rp 25.000.000</span>
                </div>
                <div className="w-full h-2 bg-primary/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full gold-gradient" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
