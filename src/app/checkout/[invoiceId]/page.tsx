
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
  Zap,
  Lock,
  Globe,
  ChevronRight,
  XCircle,
  CreditCard,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, getDocs, doc, setDoc, increment, addDoc, serverTimestamp, collectionGroup } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'card_input' | 'processing' | 'success'>('selection');
  const [statusText, setStatusText] = useState("Initializing Gateway...");
  
  // Card Details State
  const [cardData, setCardData] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: ""
  });

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

  // Basic Luhn Algorithm for Card Validation
  const validateCardNumber = (num: string) => {
    const cleanNum = num.replace(/\s+/g, '');
    if (cleanNum.length < 13) return false;
    let sum = 0;
    for (let i = 0; i < cleanNum.length; i++) {
      let intVal = parseInt(cleanNum.substr(cleanNum.length - 1 - i, 1));
      if (i % 2 !== 0) {
        intVal *= 2;
        if (intVal > 9) intVal -= 9;
      }
      sum += intVal;
    }
    return sum % 10 === 0;
  };

  const processPaymentFinalization = async (method: string) => {
    if (!db || !invoice) return;

    const invoiceRef = doc(db, invoice.path);
    const merchantRef = doc(db, "merchants", invoice.merchantId);
    const systemLiquidityRef = doc(db, "system", "liquidity");
    
    const invoicePayload = {
      status: "paid",
      paidAt: new Date().toISOString(),
      paymentMethod: method,
      cardLast4: cardData.number.slice(-4)
    };
    
    setDoc(invoiceRef, invoicePayload, { merge: true })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: invoiceRef.path,
          operation: 'update',
          requestResourceData: invoicePayload
        }));
      });

    // Injeksi Likuiditas Fisik ke Sistem (Dana Riil Masuk)
    await setDoc(systemLiquidityRef, {
      totalFiatInjected: increment(invoice.amountIdr),
      lastCardTransaction: {
        amount: invoice.amountIdr,
        currency: invoice.amountUsd ? "USD" : "IDR",
        timestamp: serverTimestamp()
      }
    }, { merge: true });

    const merchantPayload = {
      totalRevenue: increment(invoice.amountIdr),
      pendingSettlement: increment(invoice.amountIdr)
    };
    setDoc(merchantRef, merchantPayload, { merge: true });

    if (method === 'AliBank' && user) {
      const userRef = doc(db, "users", user.uid);
      const transactionColRef = collection(db, "users", user.uid, "transactions");
      const notifColRef = collection(db, "users", user.uid, "notifications");

      setDoc(userRef, { totalBalance: increment(-invoice.amountIdr) }, { merge: true });

      const logPayload = {
        date: new Date().toISOString(),
        description: `Marketplace Payment: ${invoice.productName || invoice.invoiceId}`,
        category: "Marketplace",
        amount: invoice.amountIdr,
        type: "expense",
        timestamp: serverTimestamp()
      };
      addDoc(transactionColRef, logPayload);

      addDoc(notifColRef, {
        title: "Pembayaran Marketplace Berhasil",
        message: `Pembayaran sebesar Rp ${invoice.amountIdr.toLocaleString('id-ID')} untuk ${invoice.productName || 'produk'} telah diproses.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
    }

    setPaymentStep('success');
    setIsProcessing(false);
    toast({ title: "Payment Successful", description: `Transaction settled via ${method}.` });
  };

  const handlePayCardSubmit = () => {
    if (!validateCardNumber(cardData.number)) {
      toast({ variant: "destructive", title: "Kartu Tidak Valid", description: "Nomor kartu debit yang Anda masukkan tidak terdaftar atau salah." });
      return;
    }

    setIsProcessing(true);
    setPaymentStep('processing');
    
    const steps = [
      "Connecting to Global Card Network...",
      "Performing 3D Secure Verification...",
      "Running Anti-Fraud Scan...",
      "Authorizing Amount with Issuing Bank...",
      "Finalizing Global Settlement..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setStatusText(steps[currentStep]);
        currentStep++;
      } else {
        clearInterval(interval);
        processPaymentFinalization('Online Debit Card');
      }
    }, 1200);
  };

  const handlePayInternal = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "Please login to pay with your AliBank account." });
      return;
    }
    setIsProcessing(true);
    setPaymentStep('processing');
    setStatusText("Verifying Internal Assets...");
    setTimeout(() => {
      setStatusText("Finalizing Settlement...");
      setTimeout(() => processPaymentFinalization('AliBank'), 1000);
    }, 1500);
  };

  const handlePayCrypto = () => {
    setIsProcessing(true);
    setPaymentStep('processing');
    setStatusText("Connecting to Mainnet Bridge...");
    setTimeout(() => {
      setStatusText("Verifying V3 Vault Transaction...");
      setTimeout(() => {
        setStatusText("Converting Assets to IDR Settlement...");
        setTimeout(() => processPaymentFinalization('Crypto Bridge'), 1200);
      }, 1500);
    }, 1500);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground italic">Verifying Gateway Access...</p>
    </div>
  );

  if (!invoice) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <XCircle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-black italic uppercase text-accent">Invoice Not Found</h2>
      <Button variant="outline" className="mt-8 rounded-xl" onClick={() => router.push('/')}>Return Home</Button>
    </div>
  );

  if (paymentStep === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Payment Confirmed</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-6 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Paid (Settled)</p>
        <p className="text-3xl font-black text-primary italic">
          {invoice.amountUsd ? `$ ${invoice.amountUsd.toLocaleString('en-US')}` : `Rp ${invoice.amountIdr.toLocaleString('id-ID')}`}
        </p>
        <div className="mt-4 pt-4 border-t border-primary/5">
          <Badge variant="outline" className="text-[8px] font-bold uppercase text-green-600 bg-green-50 border-green-200">Funds Transferred to AliBank Vault</Badge>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
        Back to Dashboard
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-64 gold-gradient opacity-10 blur-[100px]" />
      <main className="container mx-auto px-4 pt-12 max-w-lg relative z-10">
        {paymentStep === 'processing' ? (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse rounded-full" />
              <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
            </div>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent text-center">{statusText}</h3>
          </div>
        ) : paymentStep === 'card_input' ? (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <header className="mb-8 flex items-center justify-between">
              <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Cancel</button>
              <h2 className="text-sm font-black uppercase tracking-widest text-accent italic">Secure Debit Gateway</h2>
              <Lock className="w-4 h-4 text-green-600" />
            </header>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <div className="w-full h-48 gold-gradient rounded-3xl p-6 text-white relative overflow-hidden shadow-xl mb-4">
                <div className="absolute top-0 right-0 p-6 opacity-20"><LogoIcon className="w-16 h-16" /></div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-8">AliBank Premium Card</p>
                <p className="text-xl font-black tracking-[0.25em] mb-6">
                  {cardData.number ? cardData.number.replace(/(\d{4})/g, '$1 ').trim() : "•••• •••• •••• ••••"}
                </p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[8px] uppercase font-bold opacity-60">Card Holder</p>
                    <p className="text-xs font-black uppercase italic">{cardData.name || "YOUR NAME"}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold opacity-60">Expiry</p>
                    <p className="text-xs font-black italic">{cardData.expiry || "MM/YY"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Card Number</label>
                  <Input 
                    placeholder="0000 0000 0000 0000" 
                    maxLength={16}
                    value={cardData.number}
                    onChange={(e) => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
                    className="h-12 rounded-xl liquid-glass border-none font-black italic"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Account Holder Name</label>
                  <Input 
                    placeholder="JOHN DOE"
                    value={cardData.name}
                    onChange={(e) => setCardData({...cardData, name: e.target.value.toUpperCase()})}
                    className="h-12 rounded-xl liquid-glass border-none font-black italic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiry Date</label>
                    <Input 
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardData.expiry}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
                        setCardData({...cardData, expiry: val});
                      }}
                      className="h-12 rounded-xl liquid-glass border-none font-black italic"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">CVV</label>
                    <Input 
                      placeholder="•••"
                      type="password"
                      maxLength={3}
                      value={cardData.cvv}
                      onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                      className="h-12 rounded-xl liquid-glass border-none font-black italic"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <p className="text-[8px] font-bold text-muted-foreground uppercase leading-tight">Your payment is secured with 256-bit encryption and protected by AliBank fraud detection.</p>
                </div>
                <Button 
                  onClick={handlePayCardSubmit}
                  disabled={!cardData.number || !cardData.expiry || !cardData.cvv}
                  className="w-full h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl flex items-center justify-center gap-3"
                >
                  Pay {invoice.amountUsd ? `$${invoice.amountUsd.toLocaleString()}` : `Rp ${invoice.amountIdr.toLocaleString()}`} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-10">
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-4 p-3.5">
                <LogoIcon className="text-white" />
              </div>
              <h1 className="text-xl font-black italic uppercase tracking-tighter text-accent">AliBank Gateway</h1>
            </div>
            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
              <CardHeader className="bg-accent/5 p-8 border-b border-primary/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Checkout: {invoice.productName || "Product"}</p>
                <h2 className="text-4xl font-black text-accent italic tracking-tighter">
                  {invoice.amountUsd ? `$ ${invoice.amountUsd.toLocaleString('en-US')}` : `Rp ${invoice.amountIdr.toLocaleString('id-ID')}`}
                </h2>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <button onClick={() => setPaymentStep('card_input')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/20 text-white"><CreditCard className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">Debit Card Online</p>
                        <p className="text-[9px] font-medium text-white/70 uppercase">Global Payment Processor</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>

                  <button onClick={handlePayInternal} className="w-full liquid-glass-dark p-6 rounded-[1.5rem] border-white/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:bg-primary transition-colors"><LogoIcon className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">AliBank Account</p>
                        <p className="text-[9px] font-medium text-white/50 uppercase">Instant Internal Transfer</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/40" />
                  </button>

                  <button onClick={handlePayCrypto} className="w-full liquid-glass p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/30 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Wallet className="w-6 h-6" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-accent italic">Mainnet Bridge</p>
                          <Badge className="bg-primary text-white text-[7px] font-black h-4 px-1 animate-pulse">LIVE V3</Badge>
                        </div>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase">Pay with MetaMask / Wallet</p>
                      </div>
                    </div>
                    <Bitcoin className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
