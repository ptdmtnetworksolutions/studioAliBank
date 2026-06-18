"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSpendingPatternInsight } from "@/ai/flows/spending-pattern-insight-flow";
import { budgetingAssistant } from "@/ai/flows/budgeting-assistant-flow";
import { adviseOnSavingsOpportunities } from "@/ai/flows/savings-opportunity-advisor-flow";
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingDown, 
  Lightbulb, 
  PieChart, 
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Zap,
  PiggyBank,
  BrainCircuit,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type AIResult = {
  summary: string;
  categories: any[];
  recommendations: string[];
  budget: any;
  savings: any;
};

export default function AIAssistantPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIResult | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const [mounted, setMounted] = useState(false);
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

  const transactionsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: realTransactions, isLoading: txLoading } = useCollection(transactionsQuery);

  useEffect(() => {
    async function analyzeWithAI() {
      if (txLoading || !realTransactions || realTransactions.length === 0) {
        if (!txLoading) setLoading(false);
        return;
      }

      try {
        const getRawAmount = (t: any) => {
          if (typeof t.amount === 'number') return t.amount;
          if (typeof t.cryptoAmount === 'number') return t.cryptoAmount;
          if (typeof t.amountEth === 'number') return t.amountEth;
          if (typeof t.toAmount === 'number') return t.toAmount;
          if (typeof t.fromAmount === 'number') return t.fromAmount;
          return 0;
        };

        const formatDate = (dateStr: any) => {
          if (!dateStr) return new Date().toISOString().split('T')[0];
          try {
            return new Date(dateStr).toISOString().split('T')[0];
          } catch (e) {
            return new Date().toISOString().split('T')[0];
          }
        };

        const transactionsMapped = realTransactions.map(t => {
          const rawAmt = getRawAmount(t);
          const dateFormatted = formatDate(t.date);
          const isExpense = t.type === 'expense' || t.type === 'withdraw' || t.type === 'fiat_withdrawal' || t.type === 'withdraw_defi' || (t.description || '').toLowerCase().includes('withdraw') || (t.description || '').toLowerCase().includes('bet');
          
          return {
            date: dateFormatted,
            description: t.description || t.category || "Transaksi",
            category: t.category || "Umum",
            rawAmount: rawAmt,
            isExpense
          };
        });

        // 1. For spending pattern insight: positive for expense, negative for income
        const transactionsForInsight = transactionsMapped.map(t => ({
          date: t.date,
          description: t.description,
          category: t.category,
          amount: t.isExpense ? Math.abs(t.rawAmount) : -Math.abs(t.rawAmount)
        }));

        // 2. For budgeting assistant: positive amount and explicit type enum
        const transactionsForBudget = transactionsMapped.map(t => ({
          date: t.date,
          description: t.description,
          category: t.category,
          amount: Math.abs(t.rawAmount),
          type: (t.isExpense ? 'expense' : 'income') as 'income' | 'expense'
        }));

        // 3. For savings advisor: positive for income, negative for expense
        const transactionsForSavings = transactionsMapped.map(t => ({
          date: t.date,
          description: t.description,
          category: t.category,
          amount: t.isExpense ? -Math.abs(t.rawAmount) : Math.abs(t.rawAmount)
        }));

        const [insight, budget, savings] = await Promise.all([
          getSpendingPatternInsight({ transactions: transactionsForInsight }),
          budgetingAssistant({ transactions: transactionsForBudget }),
          adviseOnSavingsOpportunities({ transactionHistory: transactionsForSavings })
        ]);

        setData({
          summary: insight.overallSummary,
          categories: insight.keyCategories,
          recommendations: insight.recommendations,
          budget: budget.monthlyBudget,
          savings: savings
        });
      } catch (err) {
        console.error("AI Analysis Error:", err);
      } finally {
        setLoading(false);
      }
    }
    analyzeWithAI();
  }, [realTransactions, txLoading]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── MOBILE RENDERING ──────────────────────────────────────────────────────
  if (isMobile) {
    if (loading || txLoading) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 flex flex-col items-center justify-center h-[70vh]">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <div className="w-16 h-16 animate-bounce relative z-10 p-2">
                <LogoIcon className="text-primary" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-accent mb-2 uppercase italic tracking-tighter">Synthesizing DNA...</h2>
            <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Processing real transaction clusters</p>
          </div>
        </div>
      );
    }

    if (!data && !loading) {
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 flex flex-col items-center justify-center h-[70vh] text-center">
            <BrainCircuit className="w-16 h-16 text-primary/20 mb-6" />
            <h2 className="text-2xl font-black text-accent uppercase italic">Data Insufficient</h2>
            <p className="max-w-xs text-xs text-muted-foreground mt-2 font-medium">Lakukan minimal 1 transaksi riil agar AI Intelligence dapat mulai menganalisis profil finansial Anda.</p>
            <Button className="mt-8 rounded-xl gold-gradient text-white font-bold px-8 h-12" onClick={() => window.location.href = '/'}>Mulai Transaksi</Button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-20 bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 max-w-7xl">
          <header className="mb-12">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20 p-2.5">
                <LogoIcon className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">AI intelligence</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Real-time financial synthesis engine.</p>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <section className="liquid-glass rounded-[2rem] p-8 border-primary/20 relative overflow-hidden group">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-6 rounded-full font-black uppercase tracking-widest text-[10px]">
                  Executive Summary
                </Badge>
                <h2 className="text-2xl font-bold text-accent leading-relaxed italic">
                  "{data?.summary}"
                </h2>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6">
                  <h3 className="text-sm font-black text-accent flex items-center gap-3 uppercase tracking-widest">
                    <PieChart className="w-5 h-5 text-primary" /> Sector Allocation
                  </h3>
                  <div className="space-y-5">
                    {data?.categories.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="font-black text-accent text-[10px] uppercase tracking-tighter">{cat.name}</span>
                          <span className="text-xs font-black text-primary italic">Rp {cat.totalSpent.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2 bg-primary/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full gold-gradient rounded-full" 
                            style={{ width: `${cat.percentageOfTotal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6">
                  <h3 className="text-sm font-black text-accent flex items-center gap-3 uppercase tracking-widest">
                    <TrendingDown className="w-5 h-5 text-primary" /> Projected Optimal
                  </h3>
                  <div className="space-y-4">
                    <div className="p-5 rounded-2xl bg-primary/5 flex justify-between items-center border border-primary/10">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Target Income</p>
                        <p className="text-2xl font-black text-green-700 italic tracking-tighter">Rp {data?.budget.estimatedMonthlyIncome.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="p-5 rounded-2xl bg-accent/5 flex justify-between items-center border border-accent/5">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Max Expense</p>
                        <p className="text-2xl font-black text-accent italic tracking-tighter">Rp {data?.budget.totalMonthlyExpenses.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              <section className="space-y-6">
                <h3 className="text-xl font-black text-accent flex items-center gap-3 uppercase tracking-tighter italic">
                  <Zap className="w-6 h-6 text-primary" /> Liquidity Optimization
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data?.savings.savingsOpportunities.map((op: any, idx: number) => (
                    <div key={idx} className="liquid-glass p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/30 transition-all cursor-default group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <PiggyBank className="w-5 h-5" />
                        </div>
                        <Badge className="bg-primary text-white font-black text-[9px] uppercase italic">{op.potentialSavings}</Badge>
                      </div>
                      <h4 className="font-black text-accent mb-2 uppercase tracking-tighter">{op.opportunity}</h4>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">{op.recommendation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-primary/20 shadow-2xl">
                <h3 className="text-lg font-black flex items-center gap-3 mb-8 uppercase tracking-tighter text-white">
                  <Lightbulb className="w-7 h-7 text-primary" /> 
                  Next Moves
                </h3>
                <div className="space-y-6">
                  {data?.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="mt-1 shrink-0">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                      <p className="text-[11px] font-bold leading-relaxed text-white/80 group-hover:text-primary transition-colors italic">
                        {rec}
                      </p>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-10 gold-gradient text-white h-14 rounded-2xl font-black italic uppercase text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Execute Plan
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ─── DESKTOP RENDERING ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30 w-full">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0 bg-background text-foreground">
        {/* HEADER */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Asisten AI Finansial</h2>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-3 h-5 rounded-full font-bold uppercase tracking-widest text-[8px]">
              Sistem & Lainnya
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
          {loading || txLoading ? (
            <div className="flex flex-col items-center justify-center h-[70vh]">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <div className="w-16 h-16 animate-bounce relative z-10 p-2">
                  <LogoIcon className="text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-black text-foreground mb-2 uppercase italic tracking-tighter">Menganalisis Pola Pengeluaran...</h2>
              <p className="text-xs font-bold text-muted-foreground animate-pulse uppercase tracking-widest">Memproses klaster transaksi riil</p>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center">
              <BrainCircuit className="w-16 h-16 text-primary/20 mb-6" />
              <h2 className="text-2xl font-black text-foreground uppercase italic">Data Transaksi Tidak Cukup</h2>
              <p className="max-w-md text-xs text-muted-foreground mt-2 font-bold uppercase tracking-wide">Lakukan minimal 1 transaksi riil agar kecerdasan AI kami dapat mulai menganalisis profil finansial Anda.</p>
              <Button className="mt-8 rounded-xl gold-gradient text-white font-black italic uppercase px-8 h-12 border-none" onClick={() => router.push('/')}>Mulai Transaksi</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <section className="bg-card border border-border rounded-[2rem] p-8 relative overflow-hidden group">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-6 rounded-full font-black uppercase tracking-widest text-[10px]">
                    Ringkasan Eksekutif
                  </Badge>
                  <h2 className="text-2xl font-bold text-foreground leading-relaxed italic">
                    "{data?.summary}"
                  </h2>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-sm">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                      <PieChart className="w-5 h-5 text-primary" /> Alokasi Sektor
                    </h3>
                    <div className="space-y-5">
                      {data?.categories.map((cat, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="font-black text-foreground text-[10px] uppercase tracking-tighter">{cat.name}</span>
                            <span className="text-xs font-black text-primary italic">Rp {cat.totalSpent.toLocaleString()}</span>
                          </div>
                          <div className="w-full h-2 bg-primary/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full gold-gradient rounded-full" 
                              style={{ width: `${cat.percentageOfTotal}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="bg-card border border-border rounded-[2rem] p-8 space-y-6 shadow-sm">
                    <h3 className="text-sm font-black text-foreground flex items-center gap-3 uppercase tracking-widest">
                      <TrendingDown className="w-5 h-5 text-primary" /> Proyeksi Optimal
                    </h3>
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-primary/5 flex justify-between items-center border border-primary/10">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Target Pendapatan</p>
                          <p className="text-2xl font-black text-green-500 italic tracking-tighter">Rp {data?.budget.estimatedMonthlyIncome.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-5 rounded-2xl bg-muted flex justify-between items-center border border-border">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Batas Pengeluaran Maks</p>
                          <p className="text-2xl font-black text-accent italic tracking-tighter">Rp {data?.budget.totalMonthlyExpenses.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                <section className="space-y-6">
                  <h3 className="text-xl font-black text-foreground flex items-center gap-3 uppercase tracking-tighter italic">
                    <Zap className="w-6 h-6 text-primary" /> Optimalisasi Likuiditas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data?.savings.savingsOpportunities.map((op: any, idx: number) => (
                      <div key={idx} className="bg-card border border-border p-6 rounded-[1.5rem] hover:border-primary/30 transition-all cursor-default group shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <PiggyBank className="w-5 h-5" />
                          </div>
                          <Badge className="bg-primary text-primary-foreground border-none font-black text-[9px] uppercase italic">{op.potentialSavings}</Badge>
                        </div>
                        <h4 className="font-black text-foreground mb-2 uppercase tracking-tighter">{op.opportunity}</h4>
                        <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">{op.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4 space-y-6">
                <Card className="bg-card rounded-[2.5rem] p-8 border border-border shadow-sm">
                  <h3 className="text-lg font-black flex items-center gap-3 mb-8 uppercase tracking-tighter text-foreground">
                    <Lightbulb className="w-7 h-7 text-primary" /> 
                    Langkah Berikutnya
                  </h3>
                  <div className="space-y-6">
                    {data?.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex gap-4 group">
                        <div className="mt-1 shrink-0">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-primary" />
                          </div>
                        </div>
                        <p className="text-[11px] font-bold leading-relaxed text-muted-foreground group-hover:text-primary transition-colors italic">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full mt-10 gold-gradient text-white h-14 rounded-2xl font-black italic uppercase text-sm shadow-xl hover:scale-[1.01] transition-transform border-none">
                    Eksekusi Rencana
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
