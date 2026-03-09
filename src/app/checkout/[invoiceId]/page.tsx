"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Wallet, 
  Bitcoin, 
  Cpu, 
  Loader2, 
  CheckCircle2, 
  ArrowLeft,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import { LogoIcon } from "@/components/ui/logo";

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');

  // Fetch specific invoice
  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !invoiceId) return;
      
      try {
        const q = query(
          collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices"),
          where("invoiceId", "==", invoiceId)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setInvoice({ ...docData, id: snapshot.docs[0].id });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [db, invoiceId]);

  const cryptoRates = {
    ETH: 0.000021, // IDR to ETH mock rate
    USDT: 0.000063 // IDR to USDT mock rate
  };

  const handlePayInternal = async () => {
    if (!user || !db || !invoice) return;
    
    setIsProcessing(true);
    setPaymentStep('processing');

    try {
      // 1. Update Invoice Status
      const invoiceRef = doc(db, "merchants", MOCK_MERCHANT.merchantId, "invoices", invoice.id);
      await updateDoc(invoiceRef, {
        status: "paid",
        paidAt: new Date().toISOString()
      });

      // 2. Update Merchant Balance (Settlement)
      const merchantRef = doc(db, "merchants", MOCK_MERCHANT.merchantId);
      await updateDoc(merchantRef, {
        totalRevenue: increment(invoice.amountIdr),
        pendingSettlement: increment(invoice.amountIdr)
      });

      // 3. Update User Balance (The customer)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        totalBalance: increment(-invoice.amountIdr)
      });

      // 4. Log Transaction
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Payment for ${invoice.invoiceId} to ${MOCK_MERCHANT.businessName}`,
        category: "Payment",
        amount: invoice.amountIdr,
        type: "expense",
        timestamp: serverTimestamp()
      });

      setPaymentStep('success');
      toast({ title: "Payment Successful", description: "The merchant has been notified." });
    } catch (err) {
      console.error(err);
      setPaymentStep('selection');
      toast({ variant: "destructive", title: "Payment Failed", description: "Internal processing error." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Verifying Gateway Access...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <XCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-black italic uppercase text-accent">Invoice Not Found</h2>
        <p className="text-muted-foreground text-sm text-center mt-2">The requested payment link is invalid or has expired.</p>
        <Button variant="outline" className="mt-8 rounded-xl" onClick={() => router.push('/')}>Return Home</Button>
      </div>
    );
  }

  if (paymentStep === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Payment Confirmed</h2>
        <p className="text-muted-foreground text-sm text-center mb-8 max-w-xs leading-relaxed">
          Your payment to <span className="font-bold text-accent">{MOCK_MERCHANT.businessName}</span> for <span className="font-bold">{invoice.invoiceId}</span> has been processed.
        </p>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-6 mb-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Paid</p>
          <p className="text-3xl font-black text-primary italic">Rp {invoice.amountIdr.toLocaleString()}</p>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 gold-gradient opacity-10 blur-[100px]" />
      
      <main className="container mx-auto px-4 pt-12 max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-4 p-3.5">
            <LogoIcon className="text-white" />
          </div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-accent">AliBank Gateway</h1>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-3 py-0.5 rounded-full text-[8px] font-black uppercase mt-2">Secure Payment Service</Badge>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
          <CardHeader className="bg-accent/5 p-8 border-b border-primary/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Payment for {MOCK_MERCHANT.businessName}</p>
            <h2 className="text-4xl font-black text-accent italic tracking-tighter">Rp {invoice.amountIdr.toLocaleString()}</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">{invoice.invoiceId}</Badge>
              <span className="text-[10px] font-bold text-muted-foreground italic uppercase">Ref: 8829-X</span>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground italic flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Select Payment Method
              </h3>
              
              <button 
                onClick={handlePayInternal}
                disabled={isProcessing}
                className="w-full liquid-glass-dark p-6 rounded-[1.5rem] border-white/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:bg-primary transition-colors">
                    <LogoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white italic">AliBank Account</p>
                    <p className="text-[9px] font-medium text-white/50 uppercase">Instant Internal Transfer</p>
                  </div>
                </div>
                {isProcessing && paymentStep === 'processing' ? <Loader2 className="animate-spin text-white" /> : <ChevronRight className="w-4 h-4 text-white/40 group-hover:translate-x-1 transition-transform" />}
              </button>

              <button 
                disabled={isProcessing}
                className="w-full liquid-glass p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group opacity-60 cursor-not-allowed"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-accent italic">Mainnet Bridge</p>
                      <Badge className="bg-orange-500 text-white text-[7px] font-black h-4 px-1">COMING SOON</Badge>
                    </div>
                    <p className="text-[9px] font-medium text-muted-foreground uppercase">Pay with MetaMask / TrustWallet</p>
                  </div>
                </div>
                <Bitcoin className="w-4 h-4 text-orange-500" />
              </button>
            </div>

            <div className="pt-4 border-t border-primary/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Crypto Equivalent</span>
                <span className="text-xs font-black text-primary italic">
                  ≈ {(invoice.amountIdr * cryptoRates[invoice.cryptoCurrency as keyof typeof cryptoRates]).toFixed(4)} {invoice.cryptoCurrency}
                </span>
              </div>
              <div className="bg-primary/5 p-4 rounded-2xl flex items-center gap-3">
                <Lock className="w-4 h-4 text-primary" />
                <p className="text-[9px] text-muted-foreground font-medium italic leading-relaxed">
                  Encryption active. This payment is secured by AliBank's multi-signature infrastructure. Your financial DNA is protected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            Powered by AliBank Intelligence <Globe className="w-2.5 h-2.5" />
          </p>
          <div className="flex gap-4 opacity-30 grayscale pointer-events-none">
            <ShieldCheck className="w-4 h-4" />
            <Globe className="w-4 h-4" />
            <Cpu className="w-4 h-4" />
          </div>
        </div>
      </main>
    </div>
  );
}
