"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { 
  PiggyBank, 
  TrendingUp, 
  ArrowRightLeft, 
  ShieldCheck, 
  Loader2, 
  HelpCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SavingsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<'to_savings' | 'from_savings'>('to_savings');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

  const handleAction = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ variant: "destructive", title: "Jumlah Tidak Valid" });
      return;
    }

    if (direction === 'to_savings' && (userData.totalBalance || 0) < numAmount) {
      toast({ variant: "destructive", title: "Saldo Likuiditas Tidak Cukup" });
      return;
    }

    if (direction === 'from_savings' && (userData.savings || 0) < numAmount) {
      toast({ variant: "destructive", title: "Saldo Tabungan Tidak Cukup" });
      return;
    }

    setIsProcessing(true);
    try {
      const payload = direction === 'to_savings' 
        ? { totalBalance: increment(-numAmount), savings: increment(numAmount) }
        : { totalBalance: increment(numAmount), savings: increment(-numAmount) };

      await updateDoc(userDocRef, payload);

      // 1. LOG AUDIT GLOBAL (UNTUK MONITORING ADMIN)
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `SAVE-MOVE-${Date.now()}`,
        category: "Savings Portfolio",
        amountIdr: numAmount,
        description: `Internal Movement: Rp ${numAmount.toLocaleString()} ${direction === 'to_savings' ? 'deposited to' : 'withdrawn from'} Savings.`,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      // 2. RIWAYAT TRANSAKSI PRIBADI
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: direction === 'to_savings' ? "Alokasi Dana ke Tabungan" : "Pencairan Dana Tabungan",
        category: "Internal Transfer",
        amount: numAmount,
        type: direction === 'to_savings' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      // 3. KIRIM NOTIFIKASI
      await addDoc(collection(db, "users", user.uid, "notifications"), {
        title: direction === 'to_savings' ? "Portofolio Tabungan Diperbarui" : "Pencairan Berhasil",
        message: direction === 'to_savings' 
          ? `Dana sebesar Rp ${numAmount.toLocaleString('id-ID')} telah dipindahkan ke Tabungan.`
          : `Dana sebesar Rp ${numAmount.toLocaleString('id-ID')} telah dicairkan ke Saldo Utama.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ 
        title: "Berhasil!", 
        description: `Dana telah dipindahkan secara instan.` 
      });
      setAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (userLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <TooltipProvider>
      {isMobile ? (
        <div className="min-h-screen pb-32 bg-[#f8f9fa]">
          <Navbar />
          
          <main className="container mx-auto px-4 max-w-4xl pt-4">
            <header className="mb-10">
              <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-6"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
                    <PiggyBank className="text-white w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter">Savings Portfolio</h1>
                    <p className="text-muted-foreground text-sm font-medium italic">Simpan dana dingin Anda dan biarkan ia tumbuh.</p>
                  </div>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
                  Yield Bearing Asset
                </Badge>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-10 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setDirection('to_savings')}
                      className={cn(
                        "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group",
                        direction === 'to_savings' 
                          ? "border-primary bg-primary/5" 
                          : "border-primary/5 hover:border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        direction === 'to_savings' ? "bg-primary text-white" : "bg-primary/10 text-primary"
                      )}>
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deposit to</p>
                      <p className="text-sm font-black text-accent uppercase">Savings</p>
                    </button>

                    <button 
                      onClick={() => setDirection('from_savings')}
                      className={cn(
                        "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group",
                        direction === 'from_savings' 
                          ? "border-accent bg-accent/5" 
                          : "border-primary/5 hover:border-primary/20"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        direction === 'from_savings' ? "bg-accent text-white" : "bg-accent/10 text-accent"
                      )}>
                        <ArrowDownLeft className="w-5 h-5" />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Withdraw from</p>
                      <p className="text-sm font-black text-accent uppercase">Savings</p>
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nominal (IDR)</label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                            <p className="text-[10px] font-bold">Dana di Tabungan dipisahkan dari Saldo Utama agar tidak terpakai secara tidak sengaja untuk belanja atau transfer harian.</p>
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
                        <p className="text-[9px] font-black text-muted-foreground uppercase">
                          {direction === 'to_savings' ? 'Saldo Utama' : 'Saldo Tabungan'}: Rp {
                            (direction === 'to_savings' ? userData?.totalBalance : userData?.savings)?.toLocaleString() || "0"
                          }
                        </p>
                        <button 
                          onClick={() => setAmount((direction === 'to_savings' ? userData?.totalBalance : userData?.savings)?.toString() || "0")}
                          className="text-[9px] font-black text-primary uppercase hover:underline"
                        >
                          Pindahkan Semua
                        </button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleAction}
                      disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                      className={cn(
                        "w-full h-16 text-white text-lg font-black italic uppercase rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95",
                        direction === 'to_savings' ? "gold-gradient" : "bg-accent hover:bg-accent/90"
                      )}
                    >
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          {direction === 'to_savings' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
                          <ArrowRightLeft className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <Card className="liquid-glass-dark rounded-[2.5rem] p-8 text-white border-none shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-20 h-20" />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">Savings Analytics</h4>
                  <div className="space-y-8 relative z-10">
                    <div>
                      <p className="text-[9px] font-bold text-white/60 uppercase">Current Portfolio Value</p>
                      <p className="text-4xl font-black italic tracking-tighter text-white">
                        Rp {(userData?.savings || 0).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Base APY</span>
                        <span className="text-xs font-black text-green-400 italic">3.20% p.a</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-white/10">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Yield Status</span>
                        <Badge className="bg-primary/20 text-primary text-[8px] font-black h-5 uppercase">Accruing</Badge>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass rounded-[2rem] p-8 space-y-4 border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">Security Policy</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                    Pemindahan dana antar portofolio internal AliBank diproses secara **instan (0 detik)** dan **tanpa biaya (0%)**. Gunakan portofolio tabungan untuk menjaga aset jangka panjang Anda.
                  </p>
                </Card>
              </div>
            </div>
          </main>
        </div>
      ) : (
        <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30 w-full">
          {/* SIDEBAR NAVIGATION */}
          <Sidebar />

          {/* MAIN CONTAINER */}
          <main className="ml-64 flex-1 flex flex-col min-w-0 bg-background text-foreground">
            {/* HEADER */}
            <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Tabungan Yield</h2>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 h-5 rounded-full font-bold uppercase tracking-widest text-[8px]">
                  Yield Bearing Asset
                </Badge>
              </div>
              <div className="flex items-center gap-6">
                <button className="p-2 hover:bg-muted rounded-full relative" onClick={() => router.back()}>
                  <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                    {userData?.name?.[0] || user?.email?.[0] || "U"}
                  </div>
                </div>
              </div>
            </header>

            {/* CONTAINER CONTENT */}
            <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* LEFT FORM COLUMN */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="bg-card border border-border rounded-[2.5rem] p-8 space-y-10 shadow-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setDirection('to_savings')}
                        className={cn(
                          "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group",
                          direction === 'to_savings' 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          direction === 'to_savings' ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deposit ke</p>
                        <p className="text-sm font-black text-foreground uppercase">Tabungan</p>
                      </button>

                      <button 
                        onClick={() => setDirection('from_savings')}
                        className={cn(
                          "p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 group",
                          direction === 'from_savings' 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/30"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                          direction === 'from_savings' ? "bg-primary text-white" : "bg-primary/10 text-primary"
                        )}>
                          <ArrowDownLeft className="w-5 h-5" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tarik dari</p>
                        <p className="text-sm font-black text-foreground uppercase">Tabungan</p>
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nominal (IDR)</label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="bg-card border border-border text-foreground p-3 rounded-xl max-w-xs">
                              <p className="text-[10px] font-bold">Dana di Tabungan dipisahkan dari Saldo Utama agar tidak terpakai secara tidak sengaja untuk belanja atau transfer harian.</p>
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
                            className="h-20 pl-16 text-3xl font-black italic rounded-3xl bg-muted/40 border-none focus:ring-primary/20 text-foreground"
                          />
                        </div>
                        <div className="flex justify-between px-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase">
                            {direction === 'to_savings' ? 'Saldo Utama' : 'Saldo Tabungan'}: Rp {
                              (direction === 'to_savings' ? userData?.totalBalance : userData?.savings)?.toLocaleString() || "0"
                            }
                          </p>
                          <button 
                            onClick={() => setAmount((direction === 'to_savings' ? userData?.totalBalance : userData?.savings)?.toString() || "0")}
                            className="text-[9px] font-black text-primary uppercase hover:underline"
                          >
                            Pindahkan Semua
                          </button>
                        </div>
                      </div>

                      <Button 
                        onClick={handleAction}
                        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                        className={cn(
                          "w-full h-16 text-white text-lg font-black italic uppercase rounded-3xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 border-none",
                          "gold-gradient"
                        )}
                      >
                        {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                          <>
                            {direction === 'to_savings' ? 'Konfirmasi Deposit' : 'Konfirmasi Penarikan'}
                            <ArrowRightLeft className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="bg-card border border-border rounded-[2.5rem] p-8 text-foreground shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <TrendingUp className="w-20 h-20" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-6">Savings Analytics</h4>
                    <div className="space-y-8 relative z-10">
                      <div>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Saldo Tabungan</p>
                        <p className="text-4xl font-black italic tracking-tighter text-foreground">
                          Rp {(userData?.savings || 0).toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-border">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Base APY</span>
                          <span className="text-xs font-black text-green-400 italic">3.20% p.a</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Yield Status</span>
                          <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black h-5 uppercase">Accruing</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-card border border-border rounded-[2rem] p-8 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">Kebijakan Keamanan</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                      Pemindahan dana antar portofolio internal AliBank diproses secara **instan (0 detik)** dan **tanpa biaya (0%)**. Gunakan portofolio tabungan untuk menjaga aset jangka panjang Anda.
                  </p>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </TooltipProvider>
  );
}