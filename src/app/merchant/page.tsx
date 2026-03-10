
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Store, 
  CreditCard, 
  ArrowUpRight, 
  Code, 
  Copy, 
  Zap, 
  RefreshCw, 
  Search, 
  Plus, 
  Link as LinkIcon, 
  ExternalLink,
  Globe,
  Settings,
  Terminal,
  CheckCircle2,
  HelpCircle,
  Info,
  Building2,
  User,
  ShieldCheck,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const merchantDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, "merchants", MOCK_MERCHANT.merchantId);
  }, [db]);
  const { data: merchantData } = useDoc(merchantDocRef);

  const invoicesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [db]);

  const { data: firestoreInvoices } = useCollection(invoicesQuery);

  const handleSettlement = () => {
    if (!merchantData || (merchantData.pendingSettlement || 0) <= 0) {
      toast({ variant: "destructive", title: "No Funds", description: "You have no pending settlement." });
      return;
    }
    setIsSettling(true);
    const amount = merchantData.pendingSettlement || 0;
    setDoc(merchantDocRef!, { pendingSettlement: 0 }, { merge: true })
      .then(() => {
        setIsSettling(false);
        toast({ title: "Settlement Success", description: `Rp ${amount.toLocaleString()} telah ditransfer ke rekening utama.` });
      })
      .catch(() => setIsSettling(false));
  };

  const handleCreateInvoice = () => {
    if (!db) return;
    setIsCreatingInvoice(true);
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoicesColRef = collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices");
    
    addDoc(invoicesColRef, {
      invoiceId,
      merchantId: MOCK_MERCHANT.merchantId,
      customerName: "New Customer",
      amountIdr: 250000,
      status: "unpaid",
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    }).then(() => {
      setIsCreatingInvoice(false);
      toast({ title: "Invoice Generated" });
    });
  };

  const totalRev = merchantData?.totalRevenue || 0;
  const pendingSett = merchantData?.pendingSettlement ?? 0;

  if (!mounted) return null;

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
              <p className="text-muted-foreground text-sm font-medium">Bermitra dengan AliBank. Bayar sesuai penggunaan, tanpa biaya langganan kaku.</p>
            </div>
          </div>
          <Button onClick={handleCreateInvoice} disabled={isCreatingInvoice} className="rounded-xl gold-gradient text-white font-black h-12 px-6">
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-black text-accent">Rp {totalRev.toLocaleString('id-ID')}</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2"><TrendingUp className="text-primary/20 w-12 h-12" /></div>
            <p className="text-[10px] font-black uppercase text-muted-foreground">Settlement Ready</p>
            <p className="text-3xl font-black text-primary">Rp {pendingSett.toLocaleString('id-ID')}</p>
            <Button onClick={handleSettlement} disabled={isSettling || pendingSett <= 0} className="w-full mt-2 gold-gradient text-white rounded-xl h-10 text-[10px] uppercase font-black">
              Withdraw Funds
            </Button>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2rem] p-8 text-white space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="text-primary w-4 h-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">Business Model</p>
            </div>
            <p className="text-sm font-bold italic leading-tight">Biaya Layanan: 1% flat per settlement.</p>
            <p className="text-[9px] opacity-60">AliBank tidak memungut biaya bulanan untuk penggunaan dashboard bisnis ini.</p>
          </Card>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
          <CardHeader className="border-b border-primary/5 p-8">
            <CardTitle className="text-xl font-black italic uppercase">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground">
                    <th className="px-8 py-4">Invoice ID</th>
                    <th className="px-8 py-4">Customer</th>
                    <th className="px-8 py-4">Gross Amount</th>
                    <th className="px-8 py-4">Platform Fee (1%)</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5">
                  {firestoreInvoices?.map((inv: any) => (
                    <tr key={inv.invoiceId} className="hover:bg-primary/5 transition-colors">
                      <td className="px-8 py-4 text-xs font-bold text-accent">{inv.invoiceId}</td>
                      <td className="px-8 py-4 text-xs font-medium text-muted-foreground">{inv.customerName}</td>
                      <td className="px-8 py-4 text-xs font-black">Rp {inv.amountIdr.toLocaleString()}</td>
                      <td className="px-8 py-4 text-xs font-bold text-primary">Rp {(inv.amountIdr * 0.01).toLocaleString()}</td>
                      <td className="px-8 py-4"><Badge>{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
