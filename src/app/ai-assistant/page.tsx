
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { getSpendingPatternInsight } from "@/ai/flows/spending-pattern-insight-flow";
import { budgetingAssistant } from "@/ai/flows/budgeting-assistant-flow";
import { adviseOnSavingsOpportunities } from "@/ai/flows/savings-opportunity-advisor-flow";
import { useState, useEffect, useMemo } from "react";
import { 
  TrendingDown, 
  Lightbulb, 
  PieChart, 
  ChevronRight,
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

type AIResult = {
  summary: string;
  categories: any[];
  recommendations: string[];
  budget: any;
  savings: any;
};

export default function AIAssistantPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIResult | null>(null);

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
        const transactionsForAI = realTransactions.map(t => ({
          date: t.date,
          amount: t.amount,
          category: t.category,
          description: t.description,
          type: (t.type as 'income' | 'expense') || 'expense'
        }));

        const [insight, budget, savings] = await Promise.all([
          getSpendingPatternInsight({ transactions: transactionsForAI }),
          budgetingAssistant({ transactions: transactionsForAI }),
          adviseOnSavingsOpportunities({ transactionHistory: transactionsForAI })
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
          <h2 className="text-2xl font-black text-accent mb-2 uppercase italic tracking-tighter italic">Synthesizing DNA...</h2>
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
