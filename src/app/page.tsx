
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_USER, MOCK_TRANSACTIONS } from "@/app/lib/mock-data";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  ChevronRight, 
  CreditCard, 
  QrCode, 
  Zap, 
  Smartphone,
  Sparkles,
  Wallet,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

const quickServices = [
  { name: "Top Up", icon: Smartphone, color: "bg-blue-100 text-blue-600", desc: "Mobile & Wallets" },
  { name: "Bills", icon: Zap, color: "bg-orange-100 text-orange-600", desc: "Utilities & Fees" },
  { name: "QR Pay", icon: QrCode, color: "bg-purple-100 text-purple-600", desc: "Scan & Transfer" },
  { name: "More", icon: Plus, color: "bg-green-100 text-green-600", desc: "Add Services" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Financial Overview */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Elegant Hero Balance Card */}
            <div className="gold-gradient rounded-[2.5rem] p-10 text-white overflow-hidden relative shadow-[0_32px_64px_-16px_rgba(184,134,11,0.3)] min-h-[300px] flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-[100px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-white/70 text-sm font-bold uppercase tracking-[0.2em] mb-2">Total Combined Balance</p>
                    <h2 className="text-6xl font-extrabold tracking-tighter drop-shadow-md">
                      ${MOCK_USER.totalBalance.toLocaleString()}
                    </h2>
                    <p className="text-white/60 text-xs mt-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Updated just now
                    </p>
                  </div>
                  <Badge variant="outline" className="text-white border-white/40 bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full font-bold">
                    PREMIUM MEMBER
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 h-14 font-bold shadow-lg">
                    <Plus className="w-5 h-5 mr-2" /> Quick Deposit
                  </Button>
                  <Button variant="outline" className="text-white border-white/40 bg-white/10 hover:bg-white/20 rounded-2xl px-8 h-14 font-bold backdrop-blur-md">
                    <ArrowUpRight className="w-5 h-5 mr-2" /> New Transfer
                  </Button>
                </div>
              </div>
            </div>

            {/* Monthly Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="liquid-glass border-none rounded-[2rem] p-8 card-hover-effect">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <ArrowDownLeft className="text-primary w-7 h-7" />
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 font-bold px-3">+12.4%</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Inflow This Month</p>
                  <p className="text-3xl font-bold text-accent">$5,240.00</p>
                </div>
              </Card>
              
              <Card className="liquid-glass border-none rounded-[2rem] p-8 card-hover-effect">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center">
                    <ArrowUpRight className="text-accent w-7 h-7" />
                  </div>
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 font-bold px-3">On Track</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Outflow This Month</p>
                  <p className="text-3xl font-bold text-accent">$2,110.25</p>
                </div>
              </Card>
            </div>

            {/* Quick Services Grid */}
            <section>
              <h3 className="text-xl font-bold mb-6 text-accent flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Premium Services
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {quickServices.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button 
                      key={service.name} 
                      className="liquid-glass p-6 rounded-[2rem] flex flex-col items-center gap-4 card-hover-effect group text-center"
                    >
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-inner", service.color)}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-accent block">{service.name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{service.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Transactions Activity */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-accent">Recent Transactions</h3>
                <Link href="/transactions" className="text-sm font-bold text-primary flex items-center hover:gap-2 transition-all">
                  Full History <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
              <div className="space-y-4">
                {MOCK_TRANSACTIONS.slice(0, 4).map((tx, idx) => (
                  <div 
                    key={idx} 
                    className="liquid-glass p-5 rounded-2xl flex items-center justify-between card-hover-effect group cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12",
                        tx.type === "income" ? "bg-green-100 text-green-600" : "bg-accent/5 text-accent"
                      )}>
                        {tx.type === "income" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-accent group-hover:text-primary transition-colors">{tx.description}</p>
                        <p className="text-xs text-muted-foreground font-medium">{tx.date} • {tx.category}</p>
                      </div>
                    </div>
                    <p className={cn(
                      "font-bold text-lg",
                      tx.type === "income" ? "text-green-600" : "text-accent"
                    )}>
                      {tx.type === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Assets & Intelligence */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* AI Assistant Promo Card */}
            <div className="p-8 rounded-[2.5rem] liquid-glass-dark border-primary/20 relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 gold-gradient rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-bold text-accent mb-3">AI Financial Advisor</h4>
                <p className="text-sm text-accent/70 mb-8 leading-relaxed">
                  "Based on your 15% increase in dining expenses, we recommend adjusting your entertainment budget."
                </p>
                <Link href="/ai-assistant">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group/btn">
                    Get Smart Insights <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Savings & Deposits */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 shadow-sm">
              <CardHeader className="px-0 pt-0 pb-6 border-b border-primary/10">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary" />
                  Wealth Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-6 space-y-6">
                {MOCK_USER.deposits.map((dep) => (
                  <div key={dep.id} className="p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-accent text-sm group-hover:text-primary transition-colors">{dep.type}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Maturity {dep.maturity}</p>
                      </div>
                      <Badge variant="secondary" className="bg-primary text-white font-bold">{dep.rate}</Badge>
                    </div>
                    <p className="text-2xl font-extrabold text-accent">${dep.amount.toLocaleString()}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 h-12 rounded-xl font-bold">
                  Explore High-Yield Products
                </Button>
              </CardContent>
            </Card>

            {/* Connected Wallets */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 shadow-sm">
              <CardHeader className="px-0 pt-0 pb-6 border-b border-primary/10">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-primary" />
                  E-Wallets
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pt-6 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold text-accent">FinPay Wallet</span>
                  </div>
                  <span className="text-sm font-extrabold text-accent">$450.25</span>
                </div>
                <Button variant="ghost" className="w-full text-sm font-bold text-muted-foreground hover:bg-accent/5 rounded-xl h-12">
                  + Link New Platform
                </Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
