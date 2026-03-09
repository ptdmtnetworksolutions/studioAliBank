
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { getSpendingPatternInsight } from "@/ai/flows/spending-pattern-insight-flow";
import { budgetingAssistant } from "@/ai/flows/budgeting-assistant-flow";
import { adviseOnSavingsOpportunities } from "@/ai/flows/savings-opportunity-advisor-flow";
import { MOCK_TRANSACTIONS } from "@/app/lib/mock-data";
import { useState, useEffect } from "react";
import { 
  Sparkles, 
  TrendingDown, 
  Lightbulb, 
  PieChart, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  Zap,
  PiggyBank,
  BrainCircuit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type AIResult = {
  summary: string;
  categories: any[];
  recommendations: string[];
  budget: any;
  savings: any;
};

export default function AIAssistantPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIResult | null>(null);

  useEffect(() => {
    async function fetchAI() {
      try {
        const transactionsForAI = MOCK_TRANSACTIONS.map(t => ({
          ...t,
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAI();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 flex flex-col items-center justify-center h-[70vh]">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
            <BrainCircuit className="w-16 h-16 text-primary animate-bounce relative z-10" />
          </div>
          <h2 className="text-2xl font-bold text-accent mb-2">Analyzing your financial DNA...</h2>
          <p className="text-muted-foreground animate-pulse">Our AI is synthesizing your transaction patterns</p>
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
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-accent">AliBank Intelligence</h1>
              <p className="text-muted-foreground">Personalized financial advisory powered by advanced spending analysis.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Executive Summary */}
            <section className="liquid-glass rounded-[2rem] p-8 border-primary/20 relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 mb-6 rounded-full font-bold uppercase tracking-wider text-[10px]">
                Financial Insight Summary
              </Badge>
              <h2 className="text-2xl font-medium text-accent leading-relaxed italic">
                "{data?.summary}"
              </h2>
            </section>

            {/* Spending & Budgeting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-6">
                <h3 className="text-xl font-bold text-accent flex items-center gap-3">
                  <PieChart className="w-6 h-6 text-primary" /> Spending Mix
                </h3>
                <div className="space-y-5">
                  {data?.categories.map((cat, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-accent text-sm">{cat.name}</span>
                        <span className="text-sm font-medium text-primary">${cat.totalSpent.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-3 bg-primary/5 rounded-full overflow-hidden">
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
                <h3 className="text-xl font-bold text-accent flex items-center gap-3">
                  <TrendingDown className="w-6 h-6 text-primary" /> Optimal Budget
                </h3>
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-primary/5 flex justify-between items-center border border-primary/10">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Expected Income</p>
                      <p className="text-2xl font-bold text-green-700">${data?.budget.estimatedMonthlyIncome.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-accent/5 flex justify-between items-center border border-accent/5">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Recommended Spending</p>
                      <p className="text-2xl font-bold text-accent">${data?.budget.totalMonthlyExpenses.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic px-2">
                    Our model suggests a {((data?.budget.estimatedMonthlyIncome - data?.budget.totalMonthlyExpenses) / data?.budget.estimatedMonthlyIncome * 100).toFixed(0)}% savings rate for your profile.
                  </p>
                </div>
              </Card>
            </div>

            {/* Savings Opportunities Section */}
            <section className="space-y-6">
              <h3 className="text-2xl font-bold text-accent flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" /> Instant Savings Wins
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data?.savings.savingsOpportunities.map((op: any, idx: number) => (
                  <div key={idx} className="liquid-glass-dark p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/30 transition-all cursor-default group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-2 rounded-xl bg-primary/10 text-primary">
                        <PiggyBank className="w-5 h-5" />
                      </div>
                      <Badge className="bg-primary text-white font-bold">{op.potentialSavings}</Badge>
                    </div>
                    <h4 className="font-bold text-accent mb-2">{op.opportunity}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{op.recommendation}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: Smart Strategies & Actions */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-primary/20 shadow-2xl">
              <h3 className="text-xl font-bold flex items-center gap-3 mb-8">
                <Lightbulb className="w-7 h-7 text-primary" /> 
                Next Steps
              </h3>
              <div className="space-y-6">
                {data?.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="mt-1 shrink-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-accent/80 group-hover:text-primary transition-colors">
                      {rec}
                    </p>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-10 gold-gradient text-white h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 text-lg hover:scale-[1.02] transition-transform">
                Apply Smart Plan
              </Button>
            </Card>

            <div className="liquid-glass rounded-[2rem] p-8 border-none relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-bold text-accent mb-2">Premium Support</h4>
                <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                  Need more specific advice? Book a session with a dedicated AliBank Wealth Manager.
                </p>
                <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 h-12 rounded-xl flex justify-between group">
                  Speak to an Expert <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
