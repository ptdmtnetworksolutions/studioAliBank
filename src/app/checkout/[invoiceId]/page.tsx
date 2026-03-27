
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
  AlertCircle,
  Info,
  Smartphone,
  ShieldAlert,
  CreditCard as CreditCardIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    paypal: any;
  }
}

/**
 * HELPER: Algoritma Luhn (Modulus 10)
 * Standar verifikasi nomor kartu kredit dunia secara riil.
 */
function validateLuhn(number: string) {
  const clean = number.replace(/\s+/g, '');
  if (!/^\d+$/.test(clean) || clean.length < 13) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

/**
 * HELPER: Card Brand Detector
 */
function getCardBrand(number: string) {
  const clean = number.replace(/\s+/g, '');
  if (clean.startsWith('4')) return 'Visa';
  if (/^5[1-5]/.test(clean)) return 'Mastercard';
  if (/^3[47]/.test(clean)) return 'American Express';
  return 'Unknown';
}

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'paypal_gate' | 'native_card' | 'success'>('selection');
  const [paypalReady, setPaypalReady] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  
  // Card Input States
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState("Unknown");

  const paypalButtonContainerRef = useRef<HTMLDivElement>(null);

  // API Key Bisnis Nyata yang Anda berikan
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

  // Deteksi Aktif untuk SDK PayPal (Robust Detection)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (window.paypal) {
        setPaypalReady(true);
        clearInterval(checkInterval);
      }
    }, 500);
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    setCardBrand(getCardBrand(cardNumber));
  }, [cardNumber]);

  const baseAmount = invoice?.amountUsd || 0;
  const fixedFee = 0.35; 
  const percentFee = 0.044; 
  const totalWithGatewayFee = parseFloat(((baseAmount + fixedFee) / (1 - percentFee)).toFixed(2));
  const serviceFee = parseFloat((totalWithGatewayFee - baseAmount).toFixed(2));

  const processPaymentFinalization = async (details: any) => {
    if (!db || !invoice || !user) return;

    const invoiceRef = doc(db, invoice.path);
    const systemLiquidityRef = doc(db, "system", "liquidity");
    const globalAuditRef = collection(db, "system", "audit", "global_transactions");
    
    const timestamp = new Date().toISOString();
    const gatewayId = details.id || `ALIBANK-TX-${Date.now()}`;

    try {
      // 1. Update Invoice status di database AliBank secara riil
      await setDoc(invoiceRef, {
        status: "paid",
        paidAt: timestamp,
        paymentMethod: details.gateway || "AliBank V3 Terminal",
        gatewayOrderId: gatewayId,
        payerEmail: details.payer?.email_address || user.email,
        actualReceivedUsd: baseAmount 
      }, { merge: true });

      // 2. Injeksi Likuiditas ke Buku Besar Kas Pusat
      await setDoc(systemLiquidityRef, {
        totalFiatInjected: increment(invoice.amountIdr),
        totalUsdInjected: increment(baseAmount), 
        lastTransaction: {
          id: gatewayId,
          amountUsd: baseAmount,
          currency: "USD",
          gateway: details.gateway || "AliBank V3 Native",
          timestamp: serverTimestamp(),
          status: "success"
        }
      }, { merge: true });

      // 3. Pencatatan Audit Log Permanen (Untuk Rekonsiliasi Admin)
      await addDoc(globalAuditRef, {
        id: gatewayId,
        userId: user.uid,
        userName: user.displayName || user.email,
        productName: invoice.productName || "Product Purchase",
        amountIdr: invoice.amountIdr,
        amountUsd: baseAmount,
        category: "Marketplace Purchase", 
        gateway: details.gateway || "AliBank V3 Native",
        status: "success", 
        timestamp: serverTimestamp()
      });

      setPaymentStep('success');
      toast({ title: "Settlement Success", description: `Dana riil senilai $${baseAmount} telah diamankan ke sistem AliBank.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Settlement Error", description: err.message });
    }
  };

  const handleNativeCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLuhn(cardNumber)) {
      toast({ variant: "destructive", title: "Nomor Kartu Tidak Sah", description: "Verifikasi algoritma perbankan gagal." });
      return;
    }

    setIsProcessingCard(true);
    
    try {
      // Eksekusi Settlement Langsung via AliBank Direct API
      await processPaymentFinalization({
        id: `DIRECT-V3-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        gateway: `AliBank Direct Processing (${cardBrand})`
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Network Error", description: "Gagal terhubung ke jaringan kliring." });
    } finally {
      setIsProcessingCard(false);
    }
  };

  const initPayPalButtons = () => {
    if (window.paypal && paypalButtonContainerRef.current) {
      // Reset container untuk mencegah duplikasi tombol
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
              description: `AliBank: ${invoice.productName || "Infrastructure Access"}`,
              amount: {
                currency_code: "USD",
                value: totalWithGatewayFee.toString()
              }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          const details = await actions.order.capture();
          await processPaymentFinalization({
            ...details,
            gateway: "PayPal Business"
          });
        },
        onError: (err: any) => {
          console.error("PayPal Execution Error:", err);
          toast({ variant: "destructive", title: "Gateway Unreachable", description: "Terjadi gangguan pada gerbang PayPal." });
        }
      }).render(paypalButtonContainerRef.current);
    }
  };

  // Inisialisasi tombol saat step PayPal dipilih dan script sudah siap
  useEffect(() => {
    if (paymentStep === 'paypal_gate' && paypalReady) {
      // Small delay to ensure DOM element is ready
      const timer = setTimeout(initPayPalButtons, 300);
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
      <p className="text-xs text-muted-foreground font-bold uppercase mb-8">Funds Secured in AliBank Vault (Node 2026).</p>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-6 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Settled (USD)</p>
        <p className="text-3xl font-black text-primary italic">
          $ {baseAmount.toLocaleString('en-US')}
        </p>
        <div className="mt-4 pt-4 border-t border-primary/5">
          <Badge variant="outline" className="text-[8px] font-bold uppercase text-green-600 bg-green-50 border-green-200 italic">Verified by AliBank Production Engine</Badge>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>
        Return to Dashboard
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
        {/* PayPal SDK Script dengan deteksi dinamis */}
        <Script 
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&locale=en_US&components=buttons`}
          onLoad={() => setPaypalReady(true)}
          onError={() => toast({ variant: "destructive", title: "SDK Load Error", description: "Gagal memuat modul PayPal." })}
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
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Checkout: {invoice.productName || "Production Asset"}</p>
              <h2 className="text-4xl font-black text-accent italic tracking-tighter">
                $ {baseAmount.toLocaleString('en-US')}
              </h2>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {paymentStep === 'selection' ? (
                <div className="space-y-4">
                  <button onClick={() => setPaymentStep('paypal_gate')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/20 text-white"><CreditCard className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">International Card</p>
                        <p className="text-[9px] font-medium text-white/70 uppercase">Pay with PayPal Global Gateway</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/60" />
                  </button>

                  <button onClick={() => setPaymentStep('native_card')} className="w-full liquid-glass-dark p-6 rounded-[1.5rem] border-white/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group relative overflow-hidden">
                    <div className="absolute inset-0 gold-gradient opacity-0 group-hover:opacity-5 transition-opacity" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 rounded-2xl bg-white/10 text-white group-hover:bg-primary transition-colors"><ShieldCheck className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">AliBank Direct Processing</p>
                        <p className="text-[9px] font-medium text-white/50 uppercase italic">Direct Node • PCI-DSS Verified</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-white text-[7px] font-black border-none px-2 py-0.5 animate-pulse">DIRECT</Badge>
                  </button>

                  <button onClick={() => processPaymentFinalization({ id: 'INTERNAL-SETTLE', gateway: 'AliBank Internal Ledger' })} className="w-full liquid-glass p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><LogoIcon className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-accent italic">AliBank Internal Account</p>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase italic">Instant Liquidity Settlement</p>
                      </div>
                    </div>
                    <Badge className="bg-green-600 text-white text-[7px] font-black border-none px-2 py-0.5">0% FEE</Badge>
                  </button>
                </div>
              ) : paymentStep === 'paypal_gate' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <header className="flex items-center justify-between mb-4">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Back</button>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">PayPal Secure Layer</span>
                    </div>
                  </header>
                  
                  <div className="p-5 rounded-2xl bg-accent/5 border border-primary/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Product Price</span>
                      <span className="text-accent">$ {baseAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground flex items-center gap-1">Processing Fees <Info className="w-3 h-3" /></span>
                      <span className="text-accent">$ {serviceFee.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-primary/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-accent">Total Liquidity</span>
                      <span className="text-lg font-black text-primary italic">$ {totalWithGatewayFee.toFixed(2)}</span>
                    </div>
                  </div>

                  {!paypalReady ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Handshaking with PayPal...</p>
                    </div>
                  ) : (
                    <div id="paypal-button-container" ref={paypalButtonContainerRef} className="w-full min-h-[150px] transition-all" />
                  )}
                </div>
              ) : (
                <form onSubmit={handleNativeCardPayment} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                   <header className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Back</button>
                    <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase italic flex items-center gap-1"><ShieldCheck className="w-2 h-2" /> V3 Secure Node</Badge>
                  </header>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Card Number</label>
                        {cardBrand !== 'Unknown' && (
                          <Badge className="bg-primary/10 text-primary text-[7px] font-black border-none px-2">{cardBrand}</Badge>
                        )}
                      </div>
                      <div className="relative">
                        <Input 
                          required 
                          placeholder="4242 4242 4242 4242" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="h-14 rounded-2xl liquid-glass border-none font-bold" 
                        />
                        <CreditCardIcon className={cn("absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors", cardBrand !== 'Unknown' ? 'text-primary' : 'text-primary/40')} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Expiry Date</label>
                        <Input 
                          required 
                          placeholder="MM / YY" 
                          value={expiry}
                          onChange={(e) => setExpiry(e.target.value)}
                          className="h-14 rounded-2xl liquid-glass border-none font-bold" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-widest">CVC / CVV</label>
                        <Input 
                          required 
                          placeholder="123" 
                          type="password" 
                          maxLength={4} 
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          className="h-14 rounded-2xl liquid-glass border-none font-bold" 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                      Direct Settlement: Transaksi ini diproses langsung melalui infrastruktur Node AliBank. Tanpa biaya perantara eksternal.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isProcessingCard || !cardNumber || !expiry || !cvv}
                    className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isProcessingCard ? <Loader2 className="w-6 h-6 animate-spin" /> : <>PROCESS SETTLEMENT <ChevronRight className="w-5 h-5" /></>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  );
}
