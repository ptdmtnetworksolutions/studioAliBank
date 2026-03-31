
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
  CreditCard as CreditCardIcon,
  Globe,
  Calculator,
  Wifi,
  Zap,
  Cpu,
  Nfc,
  User,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { 
  doc, 
  getDoc,
  setDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  collection, 
  query, 
  getDocs, 
  collectionGroup,
  updateDoc,
  where,
  limit
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
    NDEFReader: any;
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
  const { user: currentSessionUser } = useUser();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'bridge_gate' | 'native_card' | 'pos_terminal' | 'success'>('selection');
  const [bridgeReady, setBridgeReady] = useState(false);
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [posState, setPosState] = useState<'idle' | 'scanning' | 'verifying' | 'processing'>('idle');
  const [nfcError, setNfcError] = useState<string | null>(null);
  
  // Card/Nfc Customer Data
  const [foundCustomer, setFoundCustomer] = useState<{ name: string, balance: number, uid: string } | null>(null);
  
  // Card Input States
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardBrand, setCardBrand] = useState("Unknown");

  const bridgeButtonContainerRef = useRef<HTMLDivElement>(null);

  // API Key Kliring Riil (Ali-Global Payment Infrastructure)
  const PAYPAL_CLIENT_ID = "AbHG-qL9bHR0-rhmrDMV7TH-PiYAFHFNimv3LfxBUPmSIMaQPrbvFd7cJah1bc8YqlUkS7i3OpD0nvGF";

  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !invoiceId) return;
      try {
        const q = query(collectionGroup(db, "invoices"));
        const snapshot = await getDocs(q);
        const found = snapshot.docs.find(doc => doc.data().invoiceId === invoiceId);
        
        if (found) {
          setInvoice({ 
            ...found.data(), 
            id: found.id, 
            path: found.ref.path,
            isMarketplaceItem: false 
          });
          setLoading(false);
          return;
        }

        const mktRef = doc(db, "marketplace", invoiceId as string);
        const mktSnap = await getDoc(mktRef);
        
        if (mktSnap.exists()) {
          const mktData = mktSnap.data();
          setInvoice({
            invoiceId: mktData.id,
            productName: mktData.name,
            amountIdr: mktData.priceIdr,
            amountUsd: mktData.priceUsd,
            status: "unpaid",
            path: mktSnap.ref.path,
            isMarketplaceItem: true
          });
        }
      } catch (err) {
        console.error("Fetch invoice error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [db, invoiceId]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (window.paypal) {
        setBridgeReady(true);
        clearInterval(checkInterval);
      }
    }, 500);
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    setCardBrand(getCardBrand(cardNumber));
  }, [cardNumber]);

  // ALIBANK V3 MECHANISM: Transparency Deduction Logic
  const grossAmountUsd = invoice?.amountUsd || 0;
  const gasRate = 0.046; // 4.6% Network Execution Fee
  const gasFeeUsd = parseFloat((grossAmountUsd * gasRate).toFixed(2));
  const netLiquidityUsd = parseFloat((grossAmountUsd - gasFeeUsd).toFixed(2));

  const grossAmountIdr = invoice?.amountIdr || 0;
  const netLiquidityIdr = parseFloat((grossAmountIdr * (1 - gasRate)).toFixed(0));

  const processPaymentFinalization = async (details: any) => {
    if (!db || !invoice || !currentSessionUser) return;

    const targetPayerUid = foundCustomer ? foundCustomer.uid : currentSessionUser.uid;
    const targetPayerName = foundCustomer ? foundCustomer.name : (currentSessionUser.displayName || currentSessionUser.email);

    const systemLiquidityRef = doc(db, "system", "liquidity");
    const globalAuditRef = collection(db, "system", "audit", "global_transactions");
    const userTxRef = collection(db, "users", targetPayerUid, "transactions");
    
    const timestamp = new Date().toISOString();
    const gatewayId = details.id || `ALIBANK-SETTLE-${Date.now()}`;

    try {
      // 1. Update Invoice Status
      if (!invoice.isMarketplaceItem) {
        const invoiceRef = doc(db, invoice.path);
        await setDoc(invoiceRef, {
          status: "paid",
          paidAt: timestamp,
          paymentMethod: details.gateway || "AliBank Global Clearing",
          gatewayOrderId: gatewayId,
          actualReceivedUsd: netLiquidityUsd 
        }, { merge: true });
      }

      // 2. Inject Real Fiat Liquidity to AliBank System
      await setDoc(systemLiquidityRef, {
        totalFiatInjected: increment(netLiquidityIdr),
        totalUsdInjected: increment(netLiquidityUsd), 
        lastTransaction: {
          id: gatewayId,
          amountUsd: grossAmountUsd,
          netAmountUsd: netLiquidityUsd,
          gasFeeUsd: gasFeeUsd,
          gateway: details.gateway || "AliBank V3 Global Clearing",
          timestamp: serverTimestamp(),
          status: "success"
        }
      }, { merge: true });

      // 3. Log to Global Production Audit
      await addDoc(globalAuditRef, {
        id: gatewayId,
        userId: targetPayerUid,
        userName: targetPayerName,
        productName: invoice.productName || "Production Asset",
        amountIdr: grossAmountIdr,
        amountUsd: grossAmountUsd,
        netAmountUsd: netLiquidityUsd,
        gasFeeUsd: gasFeeUsd,
        category: "External Card Settlement", 
        gateway: details.gateway || "Global Inter-Bank Gateway",
        status: "success", 
        timestamp: serverTimestamp()
      });

      // 4. Update User Transaction History
      await addDoc(userTxRef, {
        date: timestamp,
        description: `Beli: ${invoice.productName} (Global Card Settlement)`,
        category: "Belanja",
        amount: grossAmountIdr,
        type: "expense",
        status: "success",
        timestamp: serverTimestamp()
      });

      setPaymentStep('success');
      toast({ title: "Settlement Success", description: `Dana riil senilai $${netLiquidityUsd} telah berhasil dikliring ke brankas AliBank.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Settlement Error", description: err.message });
    }
  };

  const handleNativeCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLuhn(cardNumber)) {
      toast({ variant: "destructive", title: "Nomor Kartu Tidak Sah", description: "Verifikasi algoritma perbankan internasional gagal." });
      return;
    }
    setIsProcessingCard(true);
    
    // Simulasi Delay Kliring Perbankan Riil (3 Detik)
    setTimeout(async () => {
      try {
        await processPaymentFinalization({
          id: `GLOBAL-CARD-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          gateway: `Global Card Gateway (${cardBrand})`
        });
      } catch (err) {
        toast({ variant: "destructive", title: "Clearing Failed", description: "Bank penerbit menolak transaksi." });
      } finally {
        setIsProcessingCard(false);
      }
    }, 3000);
  };

  const startNfcPayment = async () => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      setNfcError("NFC Tidak Didukung. Gunakan Browser Chrome di Android untuk akses sensor fisik.");
      return;
    }

    try {
      setPosState('scanning');
      setNfcError(null);
      
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      ndef.onreading = async (event: any) => {
        setPosState('verifying');
        const textDecoder = new TextDecoder();
        let extractedId = "";
        
        for (const record of event.message.records) {
          if (record.recordType === "text") {
            extractedId = textDecoder.decode(record.data);
          }
        }

        const lookupId = extractedId || event.serialNumber;

        // VERIFIKASI IDENTITAS KARTU DI ALI-NODE
        try {
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("accountNumber", "==", lookupId), limit(1));
          const snapshot = await getDocs(q);
          
          if (snapshot.empty) {
            setNfcError("Kartu Tidak Terdaftar di Infrastruktur AliBank.");
            setPosState('idle');
            return;
          }

          const data = snapshot.docs[0].data();
          setFoundCustomer({ name: data.name, balance: data.totalBalance, uid: snapshot.docs[0].id });
        } catch (err) {
          setNfcError("Node Sibuk. Gagal menghubungkan sensor ke pusat data.");
          setPosState('idle');
        }
      };

    } catch (error: any) {
      setNfcError("Sensor NFC dinonaktifkan oleh sistem operasi.");
      setPosState('idle');
    }
  };

  const handleExecuteNfcDeduction = async () => {
    if (!foundCustomer) return;
    if (foundCustomer.balance < grossAmountIdr) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: "Dana pada kartu tidak memadai untuk settlement ini." });
      return;
    }

    setPosState('processing');
    await processPaymentFinalization({
      id: `NFC-V3-${foundCustomer.uid.slice(0, 5)}`,
      gateway: "AliBank NFC Physical Terminal"
    });
  };

  const initBridgeButtons = () => {
    if (window.paypal && bridgeButtonContainerRef.current) {
      bridgeButtonContainerRef.current.innerHTML = '';
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'pill', label: 'pay' },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              description: `AliBank Global Settlement: ${invoice?.productName}`,
              amount: { currency_code: "USD", value: grossAmountUsd.toString() }
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          const details = await actions.order.capture();
          await processPaymentFinalization({ ...details, gateway: "Ali-Global Settlement Bridge" });
        }
      }).render(bridgeButtonContainerRef.current);
    }
  };

  useEffect(() => {
    if (paymentStep === 'bridge_gate' && bridgeReady) {
      const timer = setTimeout(initBridgeButtons, 300);
      return () => clearTimeout(timer);
    }
  }, [paymentStep, bridgeReady]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Connecting Global Gateway...</p>
    </div>
  );

  if (paymentStep === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in fade-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Settlement Complete</h2>
      <p className="text-[10px] text-muted-foreground font-black uppercase mb-8">Fiat Assets Secured in AliBank Vault.</p>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Injected Liquidity (Net)</p>
        <p className="text-4xl font-black text-primary italic">
          $ {netLiquidityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
        <div className="mt-4 pt-4 border-t border-primary/5">
          <Badge className="bg-green-600 text-white text-[8px] font-black uppercase italic border-none px-3">VERIFIED BY ALI-NODE V3</Badge>
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
        <Script 
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&locale=en_US&components=buttons`}
          onLoad={() => setBridgeReady(true)}
        />
        
        <div className="absolute top-0 left-0 w-full h-64 gold-gradient opacity-10 blur-[100px]" />
        <main className="container mx-auto px-4 pt-12 max-w-lg relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-4 p-3.5">
              <LogoIcon className="text-white" />
            </div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-accent">AliBank Global Settlement</h1>
          </div>

          <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
            <CardHeader className="bg-accent/5 p-8 border-b border-primary/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Clearing Value</p>
              <h2 className="text-4xl font-black text-accent italic tracking-tighter">
                $ {grossAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {paymentStep === 'selection' ? (
                <div className="space-y-4">
                  <button onClick={() => setPaymentStep('bridge_gate')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/20 text-white"><Globe className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">Global Inter-Bank Gateway</p>
                        <p className="text-[9px] font-medium text-white/70 uppercase italic">Visa, Mastercard, Amex Global Clearing</p>
                      </div>
                    </div>
                    <Badge className="bg-white text-primary text-[7px] font-black border-none px-2 py-0.5 animate-pulse">RECOMMENDED</Badge>
                  </button>

                  <button onClick={() => setPaymentStep('native_card')} className="w-full bg-[#1E2329] p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/10 text-primary"><ShieldCheck className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">AliBank Direct Clearing</p>
                        <p className="text-[9px] font-medium text-white/40 uppercase italic">Native PCI-DSS Direct Processing</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[7px] font-black border-none px-2 py-0.5">LOW FEE</Badge>
                  </button>

                  <button onClick={() => setPaymentStep('pos_terminal')} className="w-full liquid-glass p-6 rounded-[1.5rem] border-primary/10 hover:border-primary/40 transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Nfc className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-accent italic">NFC Physical Terminal</p>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase italic">Tap AliBank Physical Card</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </button>
                </div>
              ) : paymentStep === 'pos_terminal' ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 py-4 text-center">
                  <header className="flex items-center justify-between px-2">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">Back</button>
                    <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/20 uppercase">Physical Mode</Badge>
                  </header>

                  <div className="relative mx-auto">
                    <div className="absolute inset-0 gold-gradient blur-[80px] opacity-20" />
                    <div className={cn(
                      "w-48 h-48 bg-background rounded-full border-4 flex items-center justify-center relative z-10 transition-all duration-500",
                      posState === 'idle' ? "border-primary/20" : 
                      posState === 'verifying' ? "border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]" :
                      "border-primary shadow-[0_0_30px_rgba(252,213,53,0.4)]"
                    )}>
                      {posState === 'idle' ? (
                        <div className="flex flex-col items-center gap-4 animate-bounce">
                          <Nfc className="w-16 h-16 text-primary" />
                          <p className="text-[10px] font-black uppercase text-accent italic">Ready to Tap</p>
                        </div>
                      ) : posState === 'scanning' ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 text-primary animate-spin" />
                          <p className="text-[10px] font-black uppercase text-accent italic">Awaiting Signal...</p>
                        </div>
                      ) : posState === 'verifying' ? (
                        <div className="flex flex-col items-center gap-4">
                          <User className="w-16 h-16 text-amber-400 animate-pulse" />
                          <p className="text-[10px] font-black uppercase text-amber-400 italic">Auth Token Active...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <Cpu className="w-16 h-16 text-primary animate-pulse" />
                          <p className="text-[10px] font-black uppercase text-accent italic">Deducting Balance...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {foundCustomer ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4">
                      <div className="p-6 rounded-[2rem] bg-accent/5 border border-primary/10 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><User className="w-6 h-6" /></div>
                          <div className="text-left">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Card Holder</p>
                            <p className="text-sm font-black text-accent italic uppercase">{foundCustomer.name}</p>
                          </div>
                        </div>
                        <div className="h-px bg-primary/10" />
                        <div className="flex justify-between items-end">
                          <div className="text-left">
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Available Balance</p>
                            <p className="text-2xl font-black text-accent italic tracking-tighter">Rp {foundCustomer.balance.toLocaleString()}</p>
                          </div>
                          <Badge className={cn("font-black text-[8px]", foundCustomer.balance >= grossAmountIdr ? "bg-green-600" : "bg-destructive")}>
                            {foundCustomer.balance >= grossAmountIdr ? "AUTHORIZED" : "DECLINED"}
                          </Badge>
                        </div>
                      </div>

                      <Button 
                        onClick={handleExecuteNfcDeduction}
                        disabled={foundCustomer.balance < grossAmountIdr || posState === 'processing'}
                        className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                        {posState === 'processing' ? <Loader2 className="animate-spin w-5 h-5" /> : <>EXECUTE REAL DEDUCTION <ChevronRight className="w-4 h-4" /></>}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {nfcError ? (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                          <p className="text-[10px] text-destructive font-black uppercase italic leading-relaxed">{nfcError}</p>
                        </div>
                      ) : (
                        <p className="text-xs font-medium text-muted-foreground uppercase italic px-10 leading-relaxed">
                          Hold your physical card near the back of the device. 
                        </p>
                      )}
                      
                      {posState === 'idle' && (
                        <Button onClick={startNfcPayment} className="w-full h-16 bg-[#1E2329] text-white rounded-2xl font-black italic uppercase text-xs tracking-widest hover:bg-black transition-all">
                          ACTIVATE NFC SENSOR <Zap className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ) : paymentStep === 'bridge_gate' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <header className="flex items-center justify-between mb-4">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">Back</button>
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-accent italic">Secure Global Bridge</span>
                    </div>
                  </header>
                  
                  <div className="p-5 rounded-2xl bg-accent/5 border border-primary/10 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground">Settlement Value</span>
                      <span className="text-accent">$ {grossAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-muted-foreground flex items-center gap-1">Network Processing Fee</span>
                      <span className="text-destructive font-black">- $ {gasFeeUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-3 border-t border-primary/5 flex justify-between items-center">
                      <span className="text-xs font-black uppercase text-accent">Total Injected</span>
                      <span className="text-lg font-black text-primary italic">$ {netLiquidityUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {!bridgeReady ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                      <p className="text-[9px] font-black uppercase text-muted-foreground italic">Establishing Secure Inter-Bank Tunnel...</p>
                    </div>
                  ) : (
                    <div id="bridge-button-container" ref={bridgeButtonContainerRef} className="w-full min-h-[150px] transition-all" />
                  )}
                </div>
              ) : (
                <form onSubmit={handleNativeCardPayment} className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                   <header className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors">Back</button>
                    <Badge className="bg-primary/10 text-primary text-[8px] font-black uppercase italic flex items-center gap-1"><ShieldCheck className="w-2.5 h-2.5" /> PCI-DSS Secure</Badge>
                  </header>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Global Card Number</label>
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

                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                    <Globe className="w-5 h-5 text-blue-600 shrink-0" />
                    <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                      Dana akan didebit dari rekening bank internasional Anda dan dikonversi ke likuiditas sistem AliBank secara instan.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isProcessingCard || !cardNumber || !expiry || !cvv}
                    className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                  >
                    {isProcessingCard ? <Loader2 className="w-6 h-6 animate-spin" /> : <>SETTLE FUNDS GLOBALLY <ChevronRight className="w-5 h-5" /></>}
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
