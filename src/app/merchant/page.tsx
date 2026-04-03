
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Store, 
  TrendingUp,
  Loader2,
  AlertCircle,
  Plus,
  Zap,
  HelpCircle,
  Calculator,
  ChevronRight,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, setDoc, increment } from "firebase/firestore";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const merchantDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "merchants", user.uid), [db, user]);
  const { data: merchantData, loading: merchantLoading } = useDoc(merchantDocRef);

  const invoicesQuery = useMemoFirebase(() => (!db || !user) ? null : query(
    collection(db, "merchants", user.uid, "invoices"),
    orderBy("createdAt", "desc"),
    limit(10)
  ), [db, user]);

  const { data: firestoreInvoices } = useCollection(invoicesQuery);

  const handleSettlement = async () => {
    if (!merchantData || !merchantDocRef || !user || !db) return;
    const amount = merchantData.pendingSettlement || 0;
    if (amount <= 0) return;

    setIsSettling(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const notifRef = collection(db, "users", user.uid, "notifications");
      
      await setDoc(userRef, { totalBalance: increment(amount) }, { merge: true });
      await setDoc(merchantDocRef, { pendingSettlement: 0 }, { merge: true });
      
      addDoc(notifRef, {
        title: "Settlement Berhasil",
        message: `Dana sebesar Rp ${amount.toLocaleString('id-ID')} telah dicairkan ke rekening utama Anda.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      toast({ title: "Settlement Success", description: `Rp ${amount.toLocaleString()} ditransfer ke saldo utama.` });
    } catch (err) {
      console.error(err);
    } finally { setIsSettling(false); }
  };

  const handleCreateInvoice = async () => {
    if (!db || !user) return;
    setIsCreatingInvoice(true);
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await addDoc(collection(db, "merchants", user.uid, "invoices"), {
        invoiceId,
        merchantId: user.uid,
        customerName: "Real-Time Client",
        amountIdr: 500000,
        status: "unpaid",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      });
      toast({ title: "Invoice Created", description: `Reference: ${invoiceId}` });
    } catch (err) {} finally { setIsCreatingInvoice(false); }
  };

  if (!mounted || merchantLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!merchantData && user) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <Store className="w-16 h-16 text-primary/20 mb-6" />
      <h2 className="text-2xl font-black text-accent uppercase italic">Activate Merchant</h2>
      <Button className="gold-gradient text-white rounded-xl h-12 px-8 font-black uppercase italic mt-8" onClick={async () => {
        if (merchantDocRef) await setDoc(merchantDocRef, { merchantId: user.uid, businessName: `${user.displayName || 'AliBank'} Business`, ownerUid: user.uid, totalRevenue: 0, pendingSettlement: 0, status: "active" });
      }}>Aktivasi Business Console</Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-4">
          <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3"><Store className="text-white w-8 h-8" /></div>
              <div>
                <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter">Business Console</h1>
                <p className="text-muted-foreground text-sm font-medium">Real-time settlement & business logic control.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/merchant/pos')} variant="outline" className="rounded-xl border-primary/20 text-primary font-black h-12 px-6 italic uppercase">
                <Calculator className="w-4 h-4 mr-2" /> POS Terminal
              </Button>
              <Button onClick={handleCreateInvoice} disabled={isCreatingInvoice} className="rounded-xl gold-gradient text-white font-black h-12 px-6 italic uppercase">
                {isCreatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} New Invoice
              </Button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gross Revenue</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                    <p className="text-[10px] font-bold">Total pendapatan kotor dari seluruh penjualan produk Anda di marketplace AliBank.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-4xl font-black text-accent italic tracking-tighter">Rp {(merchantData?.totalRevenue || 0).toLocaleString('id-ID')}</p>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2"><TrendingUp className="text-primary/10 w-16 h-16" /></div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pending Settlement</p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/40 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="bg-accent text-white border-none p-3 rounded-xl max-w-xs">
                    <p className="text-[10px] font-bold">Dana hasil penjualan yang sudah terkumpul namun belum dicairkan ke saldo utama Anda.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-4xl font-black text-primary italic tracking-tighter">Rp {(merchantData?.pendingSettlement || 0).toLocaleString('id-ID')}</p>
              <Button onClick={handleSettlement} disabled={isSettling || (merchantData?.pendingSettlement || 0) <= 0} className="w-full mt-4 gold-gradient text-white rounded-xl h-12 text-[10px] uppercase font-black italic shadow-lg">
                {isSettling ? "Processing..." : "Withdraw to Account"}
              </Button>
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 space-y-4 text-white relative overflow-hidden">
              <div className="absolute inset-0 gold-gradient opacity-5" />
              <div className="relative z-10 flex items-center gap-3">
                <Calculator className="w-6 h-6 text-primary" />
                <h3 className="text-lg font-black uppercase italic tracking-tight">POS MACHINE</h3>
              </div>
              <p className="text-[10px] text-white/60 font-medium italic leading-relaxed uppercase">
                Gunakan terminal POS untuk menerima pembayaran fisik secara instan menggunakan infrastruktur AliBank V3.
              </p>
              <Button onClick={() => router.push('/merchant/pos')} className="w-full h-12 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-xl font-black italic uppercase text-[10px] tracking-widest">
                LAUNCH TERMINAL <ChevronRight className="w-4 h-4 ml-auto" />
              </Button>
            </Card>
          </div>

          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xl font-black text-accent uppercase italic tracking-tighter">Recent Invoices</h2>
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[9px] px-3">Real-time Stream</Badge>
            </div>

            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-primary/5">
                      <th className="px-8 py-6">Invoice ID</th>
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-8 py-6">Value (IDR)</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {firestoreInvoices?.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-primary/5 transition-colors group cursor-default">
                        <td className="px-8 py-5">
                          <p className="font-mono text-xs font-bold text-accent">{inv.invoiceId}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-black italic uppercase text-muted-foreground">{inv.customerName}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black italic text-accent">Rp {inv.amountIdr?.toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5">
                          <Badge className={cn(
                            "border-none font-black text-[8px] uppercase px-3 h-5",
                            inv.status === 'paid' ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                          )}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-muted-foreground italic">
                            <Clock className="w-3 h-3" />
                            {inv.timestamp?.toDate ? inv.timestamp.toDate().toLocaleTimeString() : '---'}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(!firestoreInvoices || firestoreInvoices.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-20">
                            <AlertCircle className="w-10 h-10" />
                            <p className="text-xs font-black uppercase tracking-widest">No Invoices Found</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </TooltipProvider>
  );
}
