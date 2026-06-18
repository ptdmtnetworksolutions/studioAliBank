"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { PiggyBank, TrendingUp, Calendar, ChevronRight, ShieldCheck, Zap, Loader2, HelpCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, query, addDoc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

const depositProducts = [
  { 
    name: "Elite Fixed Deposit", 
    rate: "4.85%", 
    term: "12-24 Bulan", 
    min: 10000000, 
    tag: "Terpopuler",
    color: "bg-primary/10 text-primary"
  },
  { 
    name: "Flexi Saver", 
    rate: "3.20%", 
    term: "Tanpa Kunci", 
    min: 1000000, 
    tag: "Likuiditas Tinggi",
    color: "bg-green-500/10 text-green-500"
  },
  { 
    name: "Growth Certificate", 
    rate: "5.10%", 
    term: "36+ Bulan", 
    min: 25000000, 
    tag: "Imbal Hasil Terbaik",
    color: "bg-blue-500/10 text-blue-500"
  }
];

export default function DepositsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => { 
    setMounted(true); 
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const depositsQuery = useMemoFirebase(() => (!db || !user) ? null : query(collection(db, "users", user.uid, "deposits")), [db, user]);
  const { data: userDeposits, isLoading: loading } = useCollection(depositsQuery);

  const totalInterest = useMemo(() => {
    if (!userDeposits) return 0;
    return userDeposits.reduce((acc, curr) => acc + (curr.accruedInterest || 0), 0);
  }, [userDeposits]);

  const handleOpenPlacement = async (product: any) => {
    if (!user || !db || !userData) return;
    if (userData.totalBalance < product.min) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: `Minimum penempatan untuk ${product.name} adalah Rp ${product.min.toLocaleString('id-ID')}.` });
      return;
    }

    setIsPlacing(product.name);
    try {
      const depositsColRef = collection(db, "users", user.uid, "deposits");
      const notifColRef = collection(db, "users", user.uid, "notifications");
      const txColRef = collection(db, "users", user.uid, "transactions");

      const maturity = new Date();
      maturity.setFullYear(maturity.getFullYear() + 1);

      await addDoc(depositsColRef, {
        type: product.name,
        amount: product.min,
        rate: product.rate,
        maturityDate: maturity.toISOString(),
        accruedInterest: 0,
        createdAt: new Date().toISOString()
      });

      await updateDoc(userDocRef!, { totalBalance: increment(-product.min) });

      await addDoc(txColRef, {
        date: new Date().toISOString(),
        description: `Penempatan Deposito: ${product.name}`,
        category: "Investasi",
        amount: product.min,
        type: "expense",
        timestamp: serverTimestamp()
      });

      await addDoc(notifColRef, {
        title: "Penempatan Deposito Aktif",
        message: `Berhasil menempatkan Rp ${product.min.toLocaleString('id-ID')} pada ${product.name}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Penempatan Berhasil", description: "Dana Anda kini berkembang di instrumen elit." });
    } catch (err) {
      console.error(err);
    } finally { setIsPlacing(null); }
  };

  if (!mounted || loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <TooltipProvider>
      {isMobile ? (
        <div className="min-h-screen pb-32 bg-[#f8f9fa]">
          <Navbar />
          <main className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Wealth Management</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Ganti tabungan pasif dengan instrumen deposito elit.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary" /> Portofolio Aktif
                  </h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                      <p className="text-[10px] font-bold">Daftar instrumen deposito yang sedang berjalan dan menghasilkan imbal hasil tahunan (yield) bagi kekayaan Anda.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-4">
                  {userDeposits && userDeposits.length > 0 ? (
                    userDeposits.map((dep, idx) => (
                      <div key={idx} className="liquid-glass p-6 rounded-[2rem] border-primary/10 hover:border-primary/30 transition-all cursor-default">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="font-black text-accent uppercase italic text-sm">{dep.type}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">Maturity: {new Date(dep.maturityDate).toLocaleDateString()}</p>
                          </div>
                          <Badge className="bg-primary text-white font-black italic">{dep.rate}</Badge>
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-2xl font-black text-accent italic tracking-tighter">Rp {dep.amount.toLocaleString('id-ID')}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Principal Amount</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 rounded-[2rem] border-2 border-dashed border-primary/10 text-center space-y-2">
                      <PiggyBank className="w-10 h-10 text-primary/20 mx-auto" />
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Belum ada deposito riil.</p>
                    </div>
                  )}
                </div>
                <div className="p-8 rounded-[2rem] gold-gradient text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6" />
                    <h3 className="font-black uppercase italic tracking-tighter">Yield Realized</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-white/40 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                        <p className="text-[10px] font-bold">Total bunga atau keuntungan yang telah dihasilkan dari seluruh dana yang Anda investasikan di instrumen deposito.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-4xl font-black italic tracking-tighter">Rp {totalInterest.toLocaleString('id-ID')}</p>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-accent uppercase tracking-widest">Market Opportunities</h2>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                      <p className="text-[10px] font-bold">Pilihan produk investasi eksklusif AliBank dengan suku bunga kompetitif untuk pertumbuhan kekayaan jangka panjang Anda.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {depositProducts.map((product) => (
                    <Card key={product.name} className="liquid-glass border-none shadow-sm group hover:scale-[1.02] transition-transform cursor-pointer rounded-[2.5rem] overflow-hidden">
                      <CardHeader className="p-8">
                        <div className="flex justify-between items-center mb-4">
                          <Badge className={product.color + " font-black uppercase text-[8px] tracking-widest"}>{product.tag}</Badge>
                          <span className="text-2xl font-black text-primary italic tracking-tighter">{product.rate} p.a.</span>
                        </div>
                        <CardTitle className="text-xl font-black text-accent uppercase italic">{product.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="px-8 pb-8">
                        <div className="space-y-4 mb-8">
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Holding Term</span>
                            <span className="text-accent">{product.term}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                            <span className="text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Min. Entry</span>
                            <span className="text-accent">Rp {product.min.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                        <Button onClick={() => handleOpenPlacement(product)} disabled={isPlacing === product.name} className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-lg">
                          {isPlacing === product.name ? <Loader2 className="w-4 h-4 animate-spin" /> : "Open Placement"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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
                <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Setor & Deposito</h2>
                <Badge className="bg-primary/10 text-primary border-primary/20 px-3 h-5 rounded-full font-bold uppercase tracking-widest text-[8px]">
                  Wealth Management
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
                
                {/* LEFT COLUMN: ACTIVE PORTFOLIOS */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" /> Portofolio Aktif
                    </h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border border-border text-foreground p-3 rounded-xl max-w-xs">
                        <p className="text-[10px] font-bold">Daftar instrumen deposito yang sedang berjalan dan menghasilkan imbal hasil tahunan (yield) bagi kekayaan Anda.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-4">
                    {userDeposits && userDeposits.length > 0 ? (
                      userDeposits.map((dep, idx) => (
                        <div key={idx} className="bg-card border border-border p-6 rounded-[2rem] hover:border-primary/30 transition-all cursor-default">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-black text-foreground uppercase italic text-sm">{dep.type}</p>
                              <p className="text-[10px] text-muted-foreground font-bold">Maturity: {new Date(dep.maturityDate).toLocaleDateString()}</p>
                            </div>
                            <Badge className="bg-primary text-primary-foreground border-none font-black italic">{dep.rate}</Badge>
                          </div>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-2xl font-black text-foreground italic tracking-tighter">Rp {dep.amount.toLocaleString('id-ID')}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Principal Amount</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-10 rounded-[2rem] border-2 border-dashed border-border text-center space-y-2">
                        <PiggyBank className="w-10 h-10 text-primary/25 mx-auto" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Belum ada deposito aktif.</p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 rounded-[2rem] gold-gradient text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                      <TrendingUp className="w-6 h-6" />
                      <h3 className="font-black uppercase italic tracking-tighter">Yield Realized</h3>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-white/40 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-card border border-border text-foreground p-3 rounded-xl max-w-xs">
                          <p className="text-[10px] font-bold">Total bunga atau keuntungan yang telah dihasilkan dari seluruh dana yang Anda investasikan di instrumen deposito.</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="text-4xl font-black italic tracking-tighter relative z-10">Rp {totalInterest.toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {/* RIGHT COLUMN: MARKET OPPORTUNITIES */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Peluang Deposito Elit</h2>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-card border border-border text-foreground p-3 rounded-xl max-w-xs">
                        <p className="text-[10px] font-bold">Pilihan produk investasi eksklusif AliBank dengan suku bunga kompetitif untuk pertumbuhan kekayaan jangka panjang Anda.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {depositProducts.map((product) => (
                      <Card key={product.name} className="bg-card border border-border shadow-sm group hover:scale-[1.01] hover:border-primary/30 transition-all cursor-pointer rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8">
                          <div className="flex justify-between items-center mb-4">
                            <Badge className={product.color + " font-black uppercase text-[8px] tracking-widest border-none"}>{product.tag}</Badge>
                            <span className="text-2xl font-black text-primary italic tracking-tighter">{product.rate} p.a.</span>
                          </div>
                          <CardTitle className="text-xl font-black text-foreground uppercase italic">{product.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Holding Term</span>
                              <span className="text-foreground">{product.term}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Min. Entry</span>
                              <span className="text-foreground">Rp {product.min.toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                          <Button onClick={() => handleOpenPlacement(product)} disabled={isPlacing === product.name} className="w-full h-14 gold-gradient text-white border-none rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-lg active:scale-95 transition-all">
                            {isPlacing === product.name ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : "Open Placement"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </main>
        </div>
      )}
    </TooltipProvider>
  );
}
