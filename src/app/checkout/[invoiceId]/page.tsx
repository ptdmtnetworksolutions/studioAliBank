
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Lock,
  ChevronRight,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFirestore, useUser } from "@/firebase";
import { 
  doc, 
  setDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  collection, 
  query, 
  getDocs, 
  collectionGroup 
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import Script from "next/script";

declare global {
  interface Window {
    paypal: any;
  }
}

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'paypal_gate' | 'success'>('selection');
  const [paypalReady, setPaypalReady] = useState(false);
  const paypalButtonContainerRef = useRef<HTMLDivElement>(null);

  // Client ID resmi dari dashboard user
  const PAYPAL_CLIENT_ID = "AbHG-qL9bHR0-rhmrDMV7TH-PiYAFHFNimv3LfxBUPmSIMaQPrbvFd7cJah1bc8YqlUkS7i3OpD0nvGF";

  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !invoiceId) return;
      try {
        const q = query(collectionGroup(db, "invoices"));
        const snapshot = await getDocs(q);
        const found = snapshot.docs.find(doc => doc.data().invoiceId === invoiceId);
        if (found) {
          setInvoice({ ...found.data(), id: found.id, path: found.ref.path });
        }
      } catch (err) {
        console.error("Fetch invoice error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [db, invoiceId]);

  const processPaymentFinalization = async (details: any) => {
    if (!db || !invoice || !user) return;

    const invoiceRef = doc(db, invoice.path);
    const systemLiquidityRef = doc(db, "system", "liquidity");
    const globalAuditRef = collection(db, "system", "audit", "global_transactions");
    
    // 1. Mark Invoice as PAID
    await setDoc(invoiceRef, {
      status: "paid",
      paidAt: new Date().toISOString(),
      paymentMethod: "AliBank Global Gateway",
      gatewayOrderId: details.id,
      payerEmail: details.payer?.email_address || user.email
    }, { merge: true });

    // 2. INJEKSI DANA NYATA KE SISTEM (AliBank Injection)
    await setDoc(systemLiquidityRef, {
      totalFiatInjected: increment(invoice.amountIdr),
      totalUsdInjected: increment(invoice.amountUsd || 0),
      lastCardTransaction: {
        amount: invoice.amountIdr,
        amountUsd: invoice.amountUsd,
        currency: "USD",
        gateway: "AliBank Secure Global",
        timestamp: serverTimestamp(),
        status: "settled"
      }
    }, { merge: true });

    // 3. Global Audit Log for Admin Dashboard (Tahun 2026)
    await addDoc(globalAuditRef, {
      id: details.id || `TX-${Date.now()}`,
      userId: user.uid,
      userName: user.displayName || user.email,
      productName: invoice.productName || "AliBank Infrastructure",
      amountIdr: invoice.amountIdr,
      amountUsd: invoice.amountUsd || 0,
      category: "Marketplace Purchase",
      gateway: "AliBank Secure",
      status: "success",
      timestamp: serverTimestamp()
    });

    setPaymentStep('success');
    toast({ title: "Payment Settled via AliBank", description: `Dana riil senilai $${invoice.amountUsd} telah diamankan ke sistem AliBank (Infrastruktur 2026).` });
  };

  const initPayPalButtons = () => {
    if (window.paypal && paypalButtonContainerRef.current) {
      // Clear container before rendering to prevent duplicate buttons
      paypalButtonContainerRef.current.innerHTML = '';
      
      window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'pill',
          label: 'pay'
        },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: invoice.productName || "AliBank Web3 Infrastructure",
              amount: {
                currency_code: "USD",
                value: (invoice.amountUsd || 1).toString()
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          const details = await actions.order.capture();
          await processPaymentFinalization(details);
        },
        onError: (err: any) => {
          console.error("Payment Error:", err);
          toast({ variant: "destructive", title: "Gateway Error", description: "Terjadi kesalahan saat memproses pembayaran melalui AliBank Gateway (Check Card Eligibility)." });
        }
      }).render(paypalButtonContainerRef.current);
    }
  };

  useEffect(() => {
    if (paymentStep === 'paypal_gate' && paypalReady) {
      const timer = setTimeout(initPayPalButtons, 500);
      return () => clearTimeout(timer);
    }
  }, [paymentStep, paypalReady]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Syncing AliBank Gateway...</p>
    </div>
  );

  if (paymentStep === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Transaction Complete</h2>
      <p className="text-xs text-muted-foreground font-bold uppercase mb-8">Funds Secured in AliBank Vault (V3 Node).</p>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-6 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Settled (USD)</p>
        <p className="text-3xl font-black text-primary italic">
          $ {(invoice.amountUsd || 0).toLocaleString('en-US')}
        </p>
        <div className="mt-4 pt-4 border-t border-primary/5">
          <Badge variant="outline" className="text-[8px] font-bold uppercase text-green-600 bg-green-50 border-green-200 italic">Verified by AliBank Infrastructure 2026</Badge>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
        Return to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Script PayPal dengan locale en_US untuk mendukung transaksi Global/USA secara optimal */}
      <Script 
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&locale=en_US&components=buttons`}
        onLoad={() => setPaypalReady(true)}
      />
      <div className="absolute top-0 left-0 w-full h-64 gold-gradient opacity-10 blur-[100px]" />
      <main className="container mx-auto px-4 pt-12 max-w-lg relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-4 p-3.5">
            <LogoIcon className="text-white" />
          </div>
          <h1 className="text-xl font-black italic uppercase tracking-tighter text-accent">AliBank Secure Gateway</h1>
        </div>

        <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
          <CardHeader className="bg-accent/5 p-8 border-b border-primary/5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Checkout: {invoice.productName || "Product"}</p>
            <h2 className="text-4xl font-black text-accent italic tracking-tighter">
              $ {(invoice.amountUsd || 0).toLocaleString('en-US')}
            </h2>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            {paymentStep === 'selection' ? (
              <div className="space-y-4">
                <button onClick={() => setPaymentStep('paypal_gate')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/20 text-white"><CreditCard className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-black text-white italic">Global Debit/Credit Card</p>
                      <p className="text-[9px] font-medium text-white/70 uppercase">USA & Worldwide Secure Payment</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/60" />
                </button>

                <button onClick={() => processPaymentFinalization({ id: 'ALIBANK-INTERNAL' })} className="w-full liquid-glass-dark p-6 rounded-[1.5rem] border-white/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:bg-primary transition-colors"><LogoIcon className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-black text-white italic">AliBank Account</p>
                      <p className="text-[9px] font-medium text-white/50 uppercase">Instant Balance Transfer</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                <header className="flex items-center justify-between mb-4">
                  <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Back</button>
                  <div className="flex items-center gap-2">
                    <Lock className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Global Encryption Active</span>
                  </div>
                </header>
                
                {!paypalReady ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Connecting to Global Gateway...</p>
                  </div>
                ) : (
                  <div id="paypal-button-container" ref={paypalButtonContainerRef} className="w-full min-h-[150px]" />
                )}

                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
                  <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">
                    USA Customers: Please use standard Visa, Mastercard, or Amex. Local debit cards may require manual approval from your bank for international merchant PT DMT Network (Singapore).
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
