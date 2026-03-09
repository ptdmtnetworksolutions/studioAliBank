
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Store, 
  CreditCard, 
  ArrowUpRight, 
  Users, 
  Code, 
  Copy, 
  Zap, 
  CheckCircle2, 
  Clock, 
  XCircle,
  BarChart3,
  RefreshCw,
  Search,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { MOCK_MERCHANT, MOCK_INVOICES } from "@/app/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(MOCK_MERCHANT.apiKey);
    toast({ title: "Copied!", description: "API Key copied to clipboard." });
  };

  const handleSettlement = () => {
    setIsSettling(true);
    setTimeout(() => {
      setIsSettling(false);
      toast({ 
        title: "Settlement Initiated", 
        description: `Rp ${MOCK_MERCHANT.pendingSettlement.toLocaleString('id-ID')} is being transferred to your bank account.` 
      });
    }, 1500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-600 text-white font-bold text-[10px] uppercase">Paid</Badge>;
      case "unpaid": return <Badge variant="outline" className="text-orange-600 border-orange-200 font-bold text-[10px] uppercase">Pending</Badge>;
      case "expired": return <Badge variant="secondary" className="text-muted-foreground font-bold text-[10px] uppercase">Expired</Badge>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
              <Store className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Merchant Console</h1>
              <p className="text-muted-foreground text-sm font-medium">{MOCK_MERCHANT.businessName} • Production Mode</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-xl border-primary/20 text-primary font-bold h-12 px-6">
               <BarChart3 className="w-4 h-4 mr-2" /> Reports
             </Button>
             <Button className="rounded-xl gold-gradient text-white font-black italic uppercase h-12 px-6 shadow-lg">
               New Invoice
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Dashboard Stats */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="liquid-glass border-none rounded-[2rem] p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-black text-accent">Rp {MOCK_MERCHANT.totalRevenue.toLocaleString('id-ID')}</p>
                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
                  <ArrowUpRight className="w-3 h-3" /> +12.5% this month
                </div>
              </Card>
              <Card className="liquid-glass border-none rounded-[2rem] p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settlement Balance</p>
                <p className="text-2xl font-black text-primary">Rp {MOCK_MERCHANT.pendingSettlement.toLocaleString('id-ID')}</p>
                <p className="text-[9px] text-muted-foreground italic font-medium">Ready for withdrawal</p>
              </Card>
              <Card className="liquid-glass border-none rounded-[2rem] p-6 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Active Invoices</p>
                <p className="text-2xl font-black text-accent">42</p>
                <p className="text-[9px] text-muted-foreground italic font-medium">12 pending payment</p>
              </Card>
            </div>

            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 pb-6">
                <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" /> Recent Invoices
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search invoices..." 
                    className="pl-10 h-10 rounded-xl bg-primary/5 border-none text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Customer</th>
                        <th className="px-6 py-4">Amount (IDR)</th>
                        <th className="px-6 py-4">Crypto Equivalent</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {MOCK_INVOICES.map((inv) => (
                        <tr key={inv.invoiceId} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                          <td className="px-6 py-4 text-xs font-bold text-accent">{inv.invoiceId}</td>
                          <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{inv.customerName}</td>
                          <td className="px-6 py-4 text-xs font-black">Rp {inv.amountIdr.toLocaleString()}</td>
                          <td className="px-6 py-4 text-xs font-bold text-primary italic">
                            {inv.amountCrypto} {inv.cryptoCurrency}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(inv.status)}</td>
                          <td className="px-6 py-4 text-right">
                             <Button variant="ghost" size="icon" className="rounded-lg hover:bg-white">
                               <ChevronRight className="w-4 h-4 text-primary" />
                             </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Tools */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard className="w-24 h-24" />
              </div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Settlement Hub</h3>
                <div className="p-6 rounded-2xl bg-white/10 border border-white/10 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Payable Amount</p>
                  <p className="text-3xl font-black italic">Rp {MOCK_MERCHANT.pendingSettlement.toLocaleString()}</p>
                </div>
                <Button 
                  onClick={handleSettlement}
                  disabled={isSettling}
                  className="w-full h-14 gold-gradient text-white font-black italic uppercase rounded-xl shadow-lg flex items-center justify-center gap-3"
                >
                  {isSettling ? <RefreshCw className="animate-spin" /> : <Zap className="w-5 h-5" />}
                  Instant Settlement
                </Button>
                <p className="text-[9px] text-white/50 text-center italic leading-relaxed">
                  Funds will be credited to your linked BCA account (**** 8821) within 15 minutes.
                </p>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-primary" />
                <h4 className="text-sm font-black uppercase italic tracking-widest">Developer API</h4>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Live Secret Key</label>
                  <div className="relative">
                    <Input 
                      readOnly 
                      value={MOCK_MERCHANT.apiKey} 
                      className="h-12 pr-12 rounded-xl bg-primary/5 border-none font-mono text-xs text-accent"
                    />
                    <Button 
                      onClick={copyApiKey}
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-primary"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                  <p className="text-[10px] font-bold text-accent italic leading-relaxed">
                    Use this key to integrate AliBank Payment Gateway into your store. 
                    <span className="text-primary hover:underline cursor-pointer block mt-1">View Documentation →</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 text-center bg-primary/5">
              <Users className="w-10 h-10 text-primary mx-auto mb-4" />
              <h4 className="text-sm font-black uppercase mb-1">Affiliate Program</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic mb-4">
                Invite other merchants and earn 0.05% of their total transaction volume.
              </p>
              <Button variant="outline" className="w-full rounded-xl border-primary/20 text-primary text-xs font-bold">
                Generate Invite Link
              </Button>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
