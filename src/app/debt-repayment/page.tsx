
"use client";

import { IDR_RATE_FALLBACK } from "@/lib/currency";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft, 
  ShieldAlert, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileText,
  Clock,
  Skull,
  Landmark,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection, serverTimestamp, query, orderBy, limit } from "firebase/firestore";
import { proxyAddDoc, proxyUpdateDoc } from "@/lib/firestore-proxy-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

const ANNUAL_INTEREST_RATE = 0.05; // 5% Bunga per tahun
const LATE_PENALTY_RATE = 0.01; // 1% Denda per hari keterlambatan

export default function DebtRepaymentPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const txQuery = useMemoFirebase(() => (db && user ? query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(200)) : null), [db, user]);
  const { data: userTxs } = useCollection(txQuery);

  // LOGIKA DETEKSI HUTANG (Replikasi dari Home)
  const debtInfo = useMemo(() => {
    if (!userData || !userTxs) return { totalDebtValIdr: 0 };
    const isNeutralCategory = (cat: string) => ['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat || '');

    let idrInflow = 0;
    let idrOutflow = 0;

    userTxs.forEach((t: any) => {
      if (t.status === 'rejected' || isNeutralCategory(t.category)) return;
      const desc = String(t.description || '');

      if (t.fromCurrency || t.toCurrency) {
        if (t.toCurrency === 'IDR') idrInflow += Number(t.toAmount || t.amount || 0);
        if (t.fromCurrency === 'IDR') idrOutflow += Number(t.fromAmount || t.amount || 0);
        return;
      }

      if (t.cryptoCurrency && t.cryptoCurrency !== 'IDR') {
        if (desc.includes('ke Saldo Dompet') || desc.startsWith('Jual ')) {
          idrInflow += Math.abs(Number(t.amount || 0));
        } else if (desc.includes('via Saldo Dompet') || (desc.startsWith('Beli ') && t.type === 'expense')) {
          idrOutflow += Math.abs(Number(t.amount || 0));
        }
        return;
      }

      if (t.asset === 'IDR' || (!t.asset && !t.cryptoCurrency)) {
        const amt = Math.abs(Number(t.amount || t.amountIdr || 0));
        if (t.type === 'income') idrInflow += amt;
        else if (t.type === 'expense') idrOutflow += amt;
      }
    });

    const idrLedger = idrInflow - idrOutflow;
    const illegalDebtIdr = Math.max(0, (userData.totalBalance || 0) - idrLedger);

    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    let totalCryptoDebtValIdr = 0;
    assets.forEach(asset => {
      let cryptoIn = 0;
      let cryptoOut = 0;

      userTxs.forEach((t: any) => {
        if (t.status === 'rejected' || isNeutralCategory(t.category)) return;
        const desc = String(t.description || '');

        if (t.fromCurrency || t.toCurrency) {
          if (t.toCurrency === asset) cryptoIn += Math.abs(Number(t.toAmount || t.cryptoAmount || 0));
          if (t.fromCurrency === asset) cryptoOut += Math.abs(Number(t.fromAmount || 0));
          return;
        }

        if (t.cryptoCurrency === asset || t.asset === asset) {
          const cAmt = Math.abs(Number(t.cryptoAmount || (t.asset === asset ? t.amount : 0) || 0));
          if (desc.includes('ke Saldo Dompet') || desc.startsWith('Jual ')) {
            cryptoOut += cAmt;
          } else if (desc.startsWith('Beli ') || t.type === 'income') {
            cryptoIn += cAmt;
          } else if (t.type === 'expense') {
            cryptoOut += cAmt;
          }
        }
      });

      const onChainSynced = Number(userData.syncedOnChainBalances?.[asset] || 0);
      if (onChainSynced > cryptoIn) cryptoIn = onChainSynced;

      const diff = Math.max(0, (userData.cryptoBalances?.[asset] || 0) - (cryptoIn - cryptoOut));
      
      const dynamicAlxPriceUsdt = globalLiquidity?.lastAlxPriceUsdt || 12.24;
      const dynamicAlxPriceIdr = Math.round(dynamicAlxPriceUsdt * IDR_RATE_FALLBACK);
      const priceMap: any = { ALX: dynamicAlxPriceIdr, BTC: 1100000000, ETH: 35000000, USDT: 17690 };
      totalCryptoDebtValIdr += diff * (priceMap[asset] || 0);
    });

    return { totalDebtValIdr: Math.floor(illegalDebtIdr + totalCryptoDebtValIdr) };
  }, [userData, userTxs, globalLiquidity]);

  const schedule = useMemo(() => {
    const principal = debtInfo.totalDebtValIdr;
    const totalWithInterest = principal * (1 + ANNUAL_INTEREST_RATE);
    const monthly = Math.ceil(totalWithInterest / 12);
    
    return {
      totalToRepay: totalWithInterest,
      monthlyInstallment: monthly,
      interestAmount: principal * ANNUAL_INTEREST_RATE
    };
  }, [debtInfo.totalDebtValIdr]);

  const handleStartInstallment = async () => {
    if (!user || !db || !userDocRef) return;
    setIsProcessing(true);
    
    try {
      // 1. Buat Plan Cicilan di Firestore
      const planRef = collection(db, "users", user.uid, "debt_plans");
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + 1);

      await proxyAddDoc(planRef, {
        totalPrincipal: debtInfo.totalDebtValIdr,
        remainingBalance: schedule.totalToRepay,
        interestRate: ANNUAL_INTEREST_RATE,
        monthlyInstallment: schedule.monthlyInstallment,
        monthsPaid: 0,
        startDate: new Date().toISOString(),
        nextDueDate: dueDate.toISOString(),
        status: "active"
      });

      // 2. Beri Label Akun "Restructured"
      await proxyUpdateDoc(userDocRef, { 
        tier: "Restructured (Legal)"
      });

      // 3. Log Audit
      await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `DEBT-PLAN-${Date.now()}`,
        category: "Debt Restructuring",
        amountIdr: debtInfo.totalDebtValIdr,
        description: `Installment plan started by ${userData?.name}. Monthly: Rp ${schedule.monthlyInstallment.toLocaleString()}.`,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      toast({ title: "Kontrak Disetujui", description: "Program cicilan Anda telah aktif. Bayar cicilan pertama bulan depan." });
      router.push('/');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20 font-body transition-colors duration-300">
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-black italic uppercase tracking-widest">Restrukturisasi Hutang</h1>
        <div className="w-10" />
      </header>

      <main className="container mx-auto px-6 pt-8 max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 mx-auto flex items-center justify-center mb-4"><ShieldAlert className="text-rose-600 w-8 h-8" /></div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">PROGRAM CICILAN V3</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase italic leading-relaxed">Legalkan dana ilegal Anda melalui program cicilan 12 bulan AliBank.</p>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5"><FileText className="w-24 h-24" /></div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Kewajiban Pokok</p>
              <h3 className="text-3xl font-black italic text-foreground">Rp {debtInfo.totalDebtValIdr.toLocaleString()}</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Tenor</p>
                <p className="text-sm font-black italic">12 Bulan</p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                <p className="text-[8px] font-black text-muted-foreground uppercase">Bunga (Fixed)</p>
                <p className="text-sm font-black italic text-green-600">5.00% p.a</p>
              </div>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                <span>Cicilan Per Bulan</span>
                <span className="text-base font-black text-primary italic">Rp {schedule.monthlyInstallment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold uppercase text-muted-foreground">
                <span>Total Bunga</span>
                <span className="text-foreground">Rp {schedule.interestAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center gap-3 px-1">
             <AlertCircle className="w-5 h-5 text-rose-600" />
             <h4 className="text-xs font-black uppercase italic text-rose-600">Ketentuan & Denda</h4>
          </div>
          <Card className="p-6 rounded-[2rem] bg-rose-600/5 border border-rose-600/10 space-y-4">
            <div className="flex gap-4">
              <Clock className="w-6 h-6 text-rose-600 shrink-0" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                Keterlambatan pembayaran cicilan bulanan akan dikenakan denda sebesar <span className="text-rose-600 font-black">1% per hari</span> dari nilai angsuran bulanan.
              </p>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                Status akun Anda akan berubah menjadi <span className="text-green-600 font-black">"Legal"</span> segera setelah kontrak ini disetujui.
              </p>
            </div>
          </Card>
        </section>

        <div className="pt-4 space-y-4">
          <Button 
            onClick={handleStartInstallment}
            disabled={isProcessing || debtInfo.totalDebtValIdr <= 0}
            className="w-full h-16 gold-gradient text-white rounded-[2rem] font-black italic uppercase shadow-xl flex items-center justify-center gap-3"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>SETUJUI KONTRAK & AKTIFKAN CICILAN <Zap className="w-5 h-5" /></>
            )}
          </Button>
          <p className="text-[8px] text-center text-muted-foreground font-bold uppercase tracking-widest italic px-4">
            Dengan menekan tombol di atas, Anda menyetujui restrukturisasi aset sesuai dengan kebijakan likuiditas AliBank V3.
          </p>
        </div>
      </main>
    </div>
  );
}
