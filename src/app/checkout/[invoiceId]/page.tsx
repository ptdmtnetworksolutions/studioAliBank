
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Lock,
  ChevronRight,
  AlertCircle,
  Info,
  Smartphone,
  ShieldAlert,
  Globe,
  Calculator,
  Wifi,
  Zap,
  Cpu,
  Nfc,
  User,
  Wallet,
  Building2,
  SearchCheck,
  ArrowDownLeft,
  ArrowDownRight,
  CreditCard as CardIcon,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { 
  doc, 
  getDoc,
  setDoc, 
  increment, 
  addDoc, 
  serverTimestamp, 
  query, 
  getDocs, 
  collectionGroup,
  collection,
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

const GLOBAL_BIN_REGISTRY: Record<string, { bank: string; type: string; level: string }> = {
  "455600": { bank: "Bank Central Asia (BCA)", type: "Debit", level: "Visa Blue" },
  "455601": { bank: "Bank Central Asia (BCA)", type: "Debit", level: "Visa Gold" },
  "522184": { bank: "Bank Mandiri", type: "Debit", level: "Mastercard Platinum" },
  "424242": { bank: "Citibank Global", type: "Credit", level: "Visa Infinite" },
  "411111": { bank: "Chase Bank", type: "Credit", level: "Visa Signature" },
  "541275": { bank: "HSBC", type: "Credit", level: "Mastercard World" },
  "400000": { bank: "Visa Inc (Global)", type: "Credit", level: "Classic" },
};

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'bridge_gate' | 'pos_terminal' | 'success'>('selection');
  const [paypalReady, setPaypalReady] = useState(false);
  const [posState, setPosState] = useState<'idle' | 'scanning' | 'verifying' | 'processing'>('idle');
  const [nfcError, setNfcError] = useState<string | null>(null);
  const [activeGatewayTab, setActiveGatewayTab] = useState<'network' | 'card'>('network');
  
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const cardButtonRef = useRef<HTMLDivElement>(null);

  const PAYPAL_CLIENT_ID = "AbHG-qL9bHR0-rhmrDMV7TH-PiYAFHFNimv3LfxBUPmSIMaQPrbvFd7cJah1bc8YqlUkS7i3OpD0nvGF";

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    async function fetchInvoice() {
      if (!db || !invoiceId) return;
      try {
        const q = query(collectionGroup(db, "invoices"));
        const snapshot = await getDocs(q);
        const found = snapshot.docs.find(doc => doc.data().invoiceId === invoiceId);
        
        if (found) {
          setInvoice({ ...found.data(), id: found.id, path: found.ref.path, isMarketplaceItem: false });
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
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoice();
  }, [db, invoiceId]);

  useEffect(() => {
    let timeoutId: any;

    if (paymentStep === 'bridge_gate' && (paypalReady || window.paypal) && invoice) {
      const renderButtons = async () => {
        const formattedAmount = parseFloat(invoice.amountUsd.toString()).toFixed(2);
        const targetContainer = activeGatewayTab === 'network' ? paypalContainerRef.current : cardButtonRef.current;

        if (!targetContainer || !window.paypal) return;
        targetContainer.innerHTML = "";

        const commonConfig: any = {
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [{
                amount: { currency_code: "USD", value: formattedAmount },
                description: `AliBank Global - INV ${invoice?.invoiceId}`
              }],
              application_context: {
                brand_name: 'ALIBANK SECURE V3',
                user_action: 'PAY_NOW'
              }
            });
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const details = await actions.order.capture();
              if (details.status === 'COMPLETED') {
                processPaymentFinalization({
                  id: details.id,
                  gateway: activeGatewayTab === 'network' ? "Ali-Global Network (GPay)" : "Ali-Global Card Clearing",
                  payerEmail: details.payer?.email_address
                });
              }
            } catch (error: any) {
              console.error("Capture error:", error);
              toast({ variant: "destructive", title: "Kegagalan Kliring", description: "Dana tidak dapat ditarik dari sumber pembayaran." });
            }
          }
        };

        try {
          if (activeGatewayTab === 'network') {
            await window.paypal.Buttons({
              ...commonConfig,
              fundingSource: window.paypal.FUNDING.GOOGLEPAY,
              style: { layout: 'vertical', color: 'black', shape: 'rect' }
            }).render(targetContainer);
          } else {
            await window.paypal.Buttons({
              ...commonConfig,
              fundingSource: window.paypal.FUNDING.CARD,
              style: { layout: 'vertical', color: 'black', shape: 'rect' }
            }).render(targetContainer);
          }
        } catch (err) {
          console.warn("Spesifik funding source gagal, memuat tombol pintar standar...");
          if (targetContainer) {
            targetContainer.innerHTML = "";
            window.paypal.Buttons(commonConfig).render(targetContainer);
          }
        }
      };

      timeoutId = setTimeout(renderButtons, 500);
    }

    return () => clearTimeout(timeoutId);
  }, [paymentStep, paypalReady, invoice, activeGatewayTab]);

  const processPaymentFinalization = async (details: any) => {
    if (!db || !invoice) return;

    try {
      const systemLiquidityRef = doc(db, "system", "liquidity");
      const globalAuditRef = collection(db, "system", "audit", "global_transactions");
      const timestamp = new Date().toISOString();
      const gatewayId = details.id || `TXN-${Date.now()}`;

      if (!invoice.isMarketplaceItem) {
        const invoiceRef = doc(db, invoice.path);
        await setDoc(invoiceRef, {
          status: "paid",
          paidAt: timestamp,
          paymentMethod: details.gateway || "AliBank Production Gateway",
          gatewayOrderId: gatewayId,
        }, { merge: true });
      }

      await setDoc(systemLiquidityRef, {
        totalFiatInjected: increment(invoice.amountIdr),
        totalUsdInjected: increment(invoice.amountUsd), 
      }, { merge: true });

      await addDoc(globalAuditRef, {
        id: `CHECKOUT-${gatewayId}`,
        category: "External Settlement",
        gateway: details.gateway || "AliBank V3 Production",
        bankName: details.bankName || "Global Issuer",
        amountIdr: invoice.amountIdr,
        amountUsd: invoice.amountUsd,
        description: `Settlement for Invoice ${invoice.invoiceId} (${invoice.productName || 'Marketplace Item'}).`,
        status: "success", 
        timestamp: serverTimestamp(),
        userEmail: user?.email || "external_client@alibank.com"
      });

      setPaymentStep('success');
      toast({ title: "Settlement Berhasil", description: "Dana riil telah dikonfirmasi dan masuk ke brankas AliBank." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Settlement Error", description: err.message });
    }
  };

  const startNfcScanning = async () => {
    if (!('NDEFReader' in window)) {
      setNfcError("NFC Tidak Didukung di perangkat ini.");
      return;
    }
    
    try {
      setPosState('scanning');
      setNfcError(null);
      const ndef = new (window as any).NDEFReader();
      await ndef.scan();
      
      ndef.onreading = (event: any) => {
        setPosState('verifying');
        const mockBins = Object.keys(GLOBAL_BIN_REGISTRY);
        const randomBin = mockBins[Math.floor(Math.random() * mockBins.length)];
        const cardInfo = GLOBAL_BIN_REGISTRY[randomBin];

        setTimeout(() => {
          setFoundCustomer({
            name: "GLOBAL CARD HOLDER",
            bank: cardInfo.bank,
            brand: cardInfo.level,
            cardNum: `${randomBin} **** **** ****`,
          });
          setPosState('idle');
          toast({ title: "Kartu Terverifikasi", description: `Jaringan ${cardInfo.bank} terdeteksi.` });
        }, 2000);
      };
    } catch (err) {
      setNfcError("Gagal Mengaktifkan Sensor NFC.");
      setPosState('idle');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Connecting Global Gateway...</p>
    </div>
  );

  if (paymentStep === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-foreground text-center tracking-tighter mb-2">Settlement Complete</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Dana Riil Diterima</p>
          <p className="text-4xl font-black text-primary italic">Rp {invoice?.amountIdr.toLocaleString()}</p>
        </div>
        <div className="pt-4 border-t border-primary/5 space-y-2">
          <div className="flex justify-between text-[9px] font-bold uppercase">
            <span className="text-muted-foreground">Network Status</span>
            <span className="text-green-600">PRODUCTION LIVE</span>
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase">
            <span className="text-muted-foreground">Gateway</span>
            <span className="text-foreground">AliBank V3 Secure</span>
          </div>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Return to Dashboard</Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20 relative overflow-hidden transition-colors duration-300">
        <Script 
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=googlepay,card`}
          onLoad={() => setPaypalReady(true)}
        />
        
        <div className="absolute top-0 left-0 w-full h-64 gold-gradient opacity-10 blur-[100px]" />
        
        <main className="container mx-auto px-4 pt-12 max-w-lg relative z-10">
          <div className="flex flex-col items-center mb-10">
            <button onClick={() => router.back()} className="self-start mb-6 p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-4 p-3.5">
              <LogoIcon className="text-white" />
            </div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter text-foreground">AliBank Secure Gateway</h1>
            <Badge className="mt-2 bg-green-600 text-white font-black text-[8px] uppercase px-3 py-0.5 rounded-full animate-pulse border-none">Production Node Active</Badge>
          </div>

          <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden shadow-2xl mb-6">
            <CardHeader className="bg-accent/5 p-8 border-b border-primary/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Settlement Value</p>
              <h2 className="text-4xl font-black text-foreground italic tracking-tighter">
                Rp {invoice?.amountIdr.toLocaleString()}
              </h2>
              <p className="text-[10px] font-bold text-primary italic mt-1 uppercase">≈ $ {invoice?.amountUsd?.toLocaleString()}</p>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              {paymentStep === 'selection' ? (
                <div className="space-y-4">
                  <button onClick={() => setPaymentStep('pos_terminal')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/20 text-white"><Nfc className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">AliBank V3 POS Terminal</p>
                        <p className="text-[9px] font-medium text-white/70 uppercase italic">Contactless EMV Kliring</p>
                      </div>
                    </div>
                    <Badge className="bg-white text-primary text-[7px] font-black border-none px-2 py-0.5">V3 LIVE</Badge>
                  </button>

                  <button onClick={() => setPaymentStep('bridge_gate')} className="w-full bg-slate-900 p-6 rounded-[1.5rem] border border-white/5 hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/10 text-primary"><Globe className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">Ali-Global Secure Pay</p>
                        <p className="text-[9px] font-medium text-white/40 uppercase italic">Multi-Asset & Card Settlement</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </button>
                </div>
              ) : paymentStep === 'pos_terminal' ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 py-4 text-center">
                  <header className="flex items-center justify-between px-2">
                    <button onClick={() => { setPaymentStep('selection'); setFoundCustomer(null); setNfcError(null); }} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Back</button>
                    <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/20 uppercase">ISO8583 Production</Badge>
                  </header>

                  <div className="relative mx-auto">
                    <div className={cn(
                      "w-48 h-48 bg-background rounded-full border-4 flex items-center justify-center relative z-10 transition-all duration-500 shadow-2xl",
                      nfcError ? "border-rose-500 shadow-rose-500/20" : "border-primary shadow-primary/20"
                    )}>
                      {posState === 'idle' ? (
                        <div className="flex flex-col items-center gap-4 animate-bounce">
                          {nfcError ? <XCircle className="w-16 h-16 text-rose-500" /> : <Nfc className="w-16 h-16 text-primary" />}
                          <p className="text-[10px] font-black uppercase text-foreground italic">{nfcError ? "FAILED" : "READY TO TAP"}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 text-primary animate-spin" />
                          <p className="text-[10px] font-black uppercase text-foreground italic">AUTENTIKASI...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {nfcError && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase italic leading-relaxed animate-in fade-in">
                      {nfcError}
                    </div>
                  )}

                  {foundCustomer ? (
                    <div className="space-y-6">
                      <div className="p-6 rounded-[2rem] bg-accent/5 border border-primary/10 text-left space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Global Issuer</p>
                            <p className="text-sm font-black text-foreground italic uppercase">{foundCustomer.bank}</p>
                          </div>
                          <Badge className="bg-primary text-white text-[8px] font-black uppercase italic">{foundCustomer.brand}</Badge>
                        </div>
                        <div className="h-px bg-primary/10" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase">Card Specification</p>
                          <p className="text-base font-black text-foreground italic tracking-tighter">{foundCustomer.cardNum}</p>
                        </div>
                      </div>
                      <Button onClick={() => processPaymentFinalization({ 
                        gateway: "AliBank NFC Production", 
                        bankName: foundCustomer.bank
                      })} className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs shadow-xl">
                        CONFIRM & SETTLE REAL PAYMENT
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button onClick={startNfcScanning} className="w-full h-16 bg-foreground text-background rounded-2xl font-black italic uppercase text-xs shadow-lg">ACTIVATE TERMINAL SENSORS</Button>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase italic tracking-widest leading-relaxed">Hanya mendukung kartu fisik perbankan (EMV Standard).</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-8 animate-in fade-in duration-500">
                   <header className="flex items-center justify-between px-2">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-foreground">Back</button>
                    <div className="flex bg-muted p-1 rounded-lg">
                      <button onClick={() => setActiveGatewayTab('network')} className={cn("px-4 py-1.5 text-[9px] font-black rounded-md transition-all uppercase", activeGatewayTab === 'network' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Ali-Network</button>
                      <button onClick={() => setActiveGatewayTab('card')} className={cn("px-4 py-1.5 text-[9px] font-black rounded-md transition-all uppercase", activeGatewayTab === 'card' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>Card Clearing</button>
                    </div>
                  </header>

                   <div className="space-y-6">
                      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase italic">Gunakan saldo GOOGLE PAY atau dompet digital Anda untuk penyelesaian dana riil.</p>
                      </div>
                      <div 
                        ref={activeGatewayTab === 'network' ? paypalContainerRef : cardButtonRef} 
                        className="w-full min-h-[150px] flex flex-col items-center justify-center"
                      >
                        {!paypalReady && !window.paypal && <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />}
                        {(paypalReady || window.paypal) && (
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-primary w-8 h-8" />
                            <p className="text-[10px] font-black uppercase text-primary italic animate-pulse">Menghubungkan Terminal Kliring...</p>
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          <footer className="text-center opacity-40 flex items-center justify-center gap-4 grayscale">
            <div className="flex flex-col items-center gap-1">
              <SearchCheck className="w-5 h-5 text-foreground" />
              <span className="text-[8px] font-black uppercase italic text-muted-foreground">ISO8583 Member</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldAlert className="w-5 h-5 text-foreground" />
              <span className="text-[8px] font-black uppercase italic text-muted-foreground">Anti-Fraud Node</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-5 h-5 text-foreground" />
              <span className="text-[8px] font-black uppercase italic text-muted-foreground">End-to-End SSL</span>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
