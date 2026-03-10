
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Store, 
  CreditCard, 
  ArrowUpRight, 
  Plus, 
  Zap, 
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, setDoc, increment } from "firebase/firestore";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const merchantDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "merchants", user.uid);
  }, [db, user]);

  const { data: merchantData, loading: merchantLoading } = useDoc(merchantDocRef);

  const invoicesQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "merchants", user.uid, "invoices"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
  }, [db, user]);

  const { data: firestoreInvoices, loading: invoicesLoading } = useCollection(invoicesQuery);

  const handleSettlement = async () => {
    if (!merchantData || !merchantDocRef || !user) return;
    const amount = merchantData.pendingSettlement || 0;
    if (amount <= 0) return;

    setIsSettling(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Update User Balance
      await setDoc(userRef, { totalBalance: increment(amount) }, { merge: true });
      // Reset Merchant Pending
      await setDoc(merchantDocRef, { pendingSettlement: 0 }, { merge: true });
      
      toast({ title: "Settlement Success", description: `Rp ${amount.toLocaleString()} ditransfer ke saldo utama.` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettling(false);
    }
  };

  const handleCreateInvoice = async () => {
    if (!db || !user) return;
    setIsCreatingInvoice(true);
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    
    try {
      const invoicesColRef = collection(db, "merchants", user.uid, "invoices");
      await addDoc(invoicesColRef, {
        invoiceId,
        merchantId: user.uid,
        customerName: "Real-Time Client",
        amountIdr: 500000,
        status: "unpaid",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      });
      toast({ title: "Invoice Created", description: `Reference: ${invoiceId}` });
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  if (!mounted || merchantLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Auto-init merchant if not exists
  if (!merchantData && !merchantLoading && user) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
         <Store className="w-16 h-16 text-primary/20 mb-6" />
         <h2 className="text-2xl font-black text-accent uppercase italic">Activate Merchant</h2>
         <p className="max-w-xs text-xs text-muted-foreground mt-2 mb-8 font-medium">Anda belum mengaktifkan profil bisnis. Klik tombol di bawah untuk mulai menerima pembayaran.</p>
         <Button 
            className="gold-gradient text-white rounded-xl h-12 px-8 font-black uppercase italic"
            onClick={async () => {
              if (merchantDocRef) {
                await setDoc(merchantDocRef, {
                  merchantId: user.uid,
                  businessName: `${user.displayName || 'AliBank'} Business`,
                  ownerUid: user.uid,
                  totalRevenue: 0,
                  pendingSettlement: 0,
                  status: "active"
                });
              }
            }}
          >
            Aktivasi Business Console
          </Button>
       </div>
     );
  }

  const totalRev = merchantData?.totalRevenue || 0;
  const pendingSett = merchantData?.pendingSettlement || 0;

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
              <Store className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Business Console</h1>
              <p className="text-muted-foreground text-sm font-medium">Real-time settlement & business logic control.</p>
            </div>
          </div>
          <Button onClick={handleCreateInvoice} disabled={isCreatingInvoice} className="rounded-xl gold-gradient text-white font-black h-12 px-6 italic uppercase">
            {isCreatingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} New Invoice
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gross Revenue</p>
            <p className="text-3xl font-black text-accent italic tracking-tighter">Rp {totalRev.toLocaleString('id-ID')}</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2"><TrendingUp className="text-primary/10 w-16 h-16 group-hover:scale-110 transition-transform" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pending Settlement</p>
            <p className="text-3xl font-black text-primary italic tracking-tighter">Rp {pendingSett.toLocaleString('id-ID')}</p>
            <Button onClick={handleSettlement} disabled={isSettling || pendingSett <= 0} className="w-full mt-2 gold-gradient text-white rounded-xl h-10 text-[10px] uppercase font-black italic">
              {isSettling ? "Processing..." : "Withdraw to Account"}
            </Button>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2rem] p-8 text-white space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-primary w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Fee Policy</p>
            </div>
            <p className="text-sm font-bold italic leading-tight">Biaya Layanan: 1% flat per settlement.</p>
            <p className="text-[9px] opacity-60 font-medium">Dana akan dipotong otomatis saat penarikan ke rekening utama.</p>
          </Card>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl">
          <CardHeader className="border-b border-primary/5 p-8 bg-accent/5">
            <CardTitle className="text-xl font-black italic uppercase tracking-tighter">Real-Time Ledger</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    <th className="px-8 py-5">Reference</th>
                    <th className="px-8 py-5">Client</th>
                    <th className="px-8 py-5">Gross Amount</th>
                    <th className="px-8 py-5">Platform Fee</th>
                    <th className="px-8 py-5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {firestoreInvoices?.map((inv: any) => (
                    <tr key={inv.invoiceId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-8 py-4 text-xs font-black text-accent">{inv.invoiceId}</td>
                      <td className="px-8 py-4 text-xs font-medium text-muted-foreground">{inv.customerName}</td>
                      <td className="px-8 py-4 text-xs font-black italic">Rp {inv.amountIdr.toLocaleString()}</td>
                      <td className="px-8 py-4 text-xs font-bold text-primary italic">Rp {(inv.amountIdr * 0.01).toLocaleString()}</td>
                      <td className="px-8 py-4">
                        <Badge variant="outline" className={inv.status === 'paid' ? 'bg-green-600/10 text-green-600 border-green-600/20' : 'bg-primary/10 text-primary'}>
                          {inv.status.toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(!firestoreInvoices || firestoreInvoices.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <AlertCircle className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Belum ada invoice riil.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
