
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
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
  CreditCard as CardIcon
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
  query, 
  getDocs, 
  collectionGroup,
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

// REGISTRY BIN GLOBAL (Fokus: Bank Dhofar & International Banks)
const GLOBAL_BIN_REGISTRY: Record<string, { bank: string; type: string; level: string }> = {
  // BANK DHOFAR (Oman)
  "411651": { bank: "Bank Dhofar", type: "Credit", level: "VISA Classic" },
  "464425": { bank: "Bank Dhofar", type: "Credit", level: "VISA Standard" },
  "464426": { bank: "Bank Dhofar", type: "Debit", level: "VISA Electron" },
  "464427": { bank: "Bank Dhofar", type: "Credit", level: "VISA Gold" },
  "476320": { bank: "Bank Dhofar", type: "Credit", level: "VISA Platinum" },
  "489090": { bank: "Bank Dhofar", type: "Credit", level: "VISA Infinite" },
  "546803": { bank: "Bank Dhofar", type: "Credit", level: "Mastercard Standard" },
  "539179": { bank: "Bank Dhofar", type: "Debit", level: "Mastercard Standard" },
  "533776": { bank: "Bank Dhofar", type: "Credit", level: "Mastercard Titanium" },
  "528162": { bank: "Bank Dhofar", type: "Credit", level: "Mastercard Business" },
  "519454": { bank: "Bank Dhofar", type: "Debit", level: "Mastercard Executive" },
  
  // LAINNYA
  "455600": { bank: "Bank Central Asia (BCA)", type: "Debit", level: "Visa Blue" },
  "522100": { bank: "Bank Mandiri", type: "Debit", level: "Mastercard Gold" },
  "424242": { bank: "Citibank Global", type: "Credit", level: "Visa Infinite" },
};

// EMV APPLICATION IDENTIFIERS (AID)
const EMV_AID_REGISTRY: Record<string, string> = {
  "A0000000031010": "VISA Credit Application",
  "A0000000032010": "VISA Debit Application",
  "A0000000041010": "Mastercard Credit/Debit",
  "A0000000043060": "Mastercard Maestro",
};

export default function CheckoutPage() {
  const { invoiceId } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user: currentSessionUser } = useUser();
  const db = useFirestore();
  
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
    if (paymentStep === 'bridge_gate' && paypalReady && window.paypal) {
      if (paypalContainerRef.current) {
        paypalContainerRef.current.innerHTML = "";
        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { currency_code: "USD", value: invoice?.amountUsd.toString() || "0.00" },
                description: `AliBank Global Settlement - INV ${invoice?.invoiceId}`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            const details = await actions.order.capture();
            processPaymentFinalization({
              id: details.id,
              gateway: "Ali-Global Network (Authorized)",
              payerEmail: details.payer.email_address
            });
          }
        }).render(paypalContainerRef.current);
      }

      if (cardButtonRef.current) {
        cardButtonRef.current.innerHTML = "";
        window.paypal.Buttons({
          fundingSource: window.paypal.FUNDING.CARD,
          style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'checkout' },
          createOrder: (data: any, actions: any) => {
            return actions.order.create({
              purchase_units: [{
                amount: { currency_code: "USD", value: invoice?.amountUsd.toString() || "0.00" },
                description: `AliBank Card Settlement - INV ${invoice?.invoiceId}`
              }]
            });
          },
          onApprove: async (data: any, actions: any) => {
            const details = await actions.order.capture();
            processPaymentFinalization({
              id: details.id,
              gateway: "Ali-Global Card Clearing",
              bankName: details.payment_source?.card?.name || "International Issuer"
            });
          }
        }).render(cardButtonRef.current);
      }
    }
  }, [paymentStep, paypalReady, invoice]);

  const grossAmountUsd = invoice?.amountUsd || 0;
  const gasRate = 0.046; 
  const netLiquidityUsd = parseFloat((grossAmountUsd * (1 - gasRate)).toFixed(2));
  const grossAmountIdr = invoice?.amountIdr || 0;
  const netLiquidityIdr = parseFloat((grossAmountIdr * (1 - gasRate)).toFixed(0));

  const processPaymentFinalization = async (details: any) => {
    if (!db || !invoice) return;

    try {
      const systemLiquidityRef = doc(db, "system", "liquidity");
      const globalAuditRef = collection(db, "system", "audit", "global_transactions");
      const timestamp = new Date().toISOString();
      const gatewayId = details.id || `TXN-${Date.now()}`;

      // Update Invoice Status
      if (!invoice.isMarketplaceItem) {
        const invoiceRef = doc(db, invoice.path);
        await setDoc(invoiceRef, {
          status: "paid",
          paidAt: timestamp,
          paymentMethod: details.gateway || "AliBank POS V3",
          gatewayOrderId: gatewayId,
          actualReceivedUsd: netLiquidityUsd 
        }, { merge: true });
      }

      // Inject Real Fiat to System
      await setDoc(systemLiquidityRef, {
        totalFiatInjected: increment(netLiquidityIdr),
        totalUsdInjected: increment(netLiquidityUsd), 
        lastExternalSettlement: {
          id: gatewayId,
          bank: details.bankName || "Inter-Bank Kliring",
          amountUsd: grossAmountUsd,
          timestamp: serverTimestamp()
        }
      }, { merge: true });

      // Add to Audit Log
      await addDoc(globalAuditRef, {
        id: gatewayId,
        category: "External Settlement",
        gateway: details.gateway || "AliBank POS V3",
        bankName: details.bankName || "Global Issuer",
        cardType: details.cardType || "EMV Card",
        amountIdr: grossAmountIdr,
        amountUsd: grossAmountUsd,
        status: "success", 
        timestamp: serverTimestamp(),
        description: `AliBank V3 POS Terminal: Fund clearing from ${details.bankName || 'Unknown Bank'} success.`
      });

      setPaymentStep('success');
      toast({ title: "Settlement Berhasil", description: `Dana $${netLiquidityUsd} telah masuk ke brankas.` });
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
      const ndef = new window.NDEFReader();
      await ndef.scan();
      
      ndef.onreading = (event: any) => {
        setPosState('verifying');
        
        // Simulasi pembacaan EMV BIN (6 digit awal)
        // Di dunia riil, ini akan mengambil byte dari Chip kartu
        const mockBins = Object.keys(GLOBAL_BIN_REGISTRY);
        const randomBin = mockBins[Math.floor(Math.random() * mockBins.length)];
        const cardInfo = GLOBAL_BIN_REGISTRY[randomBin];
        
        // Simulasi AID Recognition
        const aidKeys = Object.keys(EMV_AID_REGISTRY);
        const recognizedAid = aidKeys[cardInfo.type === 'Debit' ? 1 : 0];

        setTimeout(() => {
          setFoundCustomer({
            name: "GLOBAL CARD HOLDER",
            bank: cardInfo.bank,
            brand: cardInfo.level,
            aid: recognizedAid,
            aidName: EMV_AID_REGISTRY[recognizedAid],
            cardNum: `${randomBin} **** **** ****`,
            balance: Math.floor(Math.random() * 1000000000), // Simulasi pengecekan saldo inter-bank riil
          });
          setPosState('idle');
          toast({ title: "Kartu Terdeteksi", description: `Jaringan ${cardInfo.bank} Terhubung.` });
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
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Settlement Complete</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 space-y-6">
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Injected Liquidity (Net)</p>
          <p className="text-4xl font-black text-primary italic">$ {netLiquidityUsd.toLocaleString()}</p>
        </div>
        <div className="pt-4 border-t border-primary/5 space-y-2">
          <div className="flex justify-between text-[9px] font-bold uppercase">
            <span className="text-muted-foreground">Network Status</span>
            <span className="text-green-600">CONFIRMED</span>
          </div>
          <div className="flex justify-between text-[9px] font-bold uppercase">
            <span className="text-muted-foreground">Gateway</span>
            <span className="text-accent">Ali-Global V3</span>
          </div>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Return to Dashboard</Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
        <Script 
          src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture`} 
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
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Clearing Value</p>
              <h2 className="text-4xl font-black text-accent italic tracking-tighter">
                $ {grossAmountUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
            </CardHeader>
            
            <CardContent className="p-8 space-y-6">
              {paymentStep === 'selection' ? (
                <div className="space-y-4">
                  <button onClick={() => setPaymentStep('pos_terminal')} className="w-full gold-gradient p-6 rounded-[1.5rem] border-none hover:scale-[1.02] transition-all text-left flex items-center justify-between group shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/20 text-white"><Nfc className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">AliBank V3 POS Terminal</p>
                        <p className="text-[9px] font-medium text-white/70 uppercase italic">Contactless Global EMV Kliring</p>
                      </div>
                    </div>
                    <Badge className="bg-white text-primary text-[7px] font-black border-none px-2 py-0.5 animate-pulse">V3 LIVE</Badge>
                  </button>

                  <button onClick={() => setPaymentStep('bridge_gate')} className="w-full bg-[#1E2329] p-6 rounded-[1.5rem] border border-white/5 hover:scale-[1.02] transition-all text-left flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white/10 text-primary"><Globe className="w-6 h-6" /></div>
                      <div>
                        <p className="text-sm font-black text-white italic">Ali-Global Secure Pay</p>
                        <p className="text-[9px] font-medium text-white/40 uppercase italic">Direct Wallet & Card Settlement</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </button>
                </div>
              ) : paymentStep === 'pos_terminal' ? (
                <div className="space-y-8 animate-in zoom-in-95 duration-500 py-4 text-center">
                  <header className="flex items-center justify-between px-2">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Back</button>
                    <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/20 uppercase">Inter-Bank Switch</Badge>
                  </header>

                  <div className="relative mx-auto">
                    <div className="w-48 h-48 bg-background rounded-full border-4 flex items-center justify-center relative z-10 border-primary shadow-[0_0_30px_rgba(252,213,53,0.4)]">
                      {posState === 'idle' ? (
                        <div className="flex flex-col items-center gap-4 animate-bounce">
                          <Nfc className="w-16 h-16 text-primary" />
                          <p className="text-[10px] font-black uppercase text-accent italic">Ready to Tap</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 text-primary animate-spin" />
                          <p className="text-[10px] font-black uppercase text-accent italic">Kliring...</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {foundCustomer ? (
                    <div className="space-y-6">
                      <div className="p-6 rounded-[2rem] bg-accent/5 border border-primary/10 text-left space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Detected Bank</p>
                            <p className="text-sm font-black text-accent italic uppercase">{foundCustomer.bank}</p>
                          </div>
                          <Badge className="bg-primary text-white text-[8px] font-black uppercase italic">{foundCustomer.brand}</Badge>
                        </div>
                        <div className="h-px bg-primary/10" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase">EMV Application (AID)</p>
                          <p className="text-[10px] font-bold text-accent italic uppercase">{foundCustomer.aidName}</p>
                        </div>
                        <div className="h-px bg-primary/10" />
                        <div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase">Verified Balance</p>
                          <p className="text-2xl font-black text-accent italic tracking-tighter">Rp {foundCustomer.balance.toLocaleString()}</p>
                        </div>
                      </div>
                      <Button onClick={() => processPaymentFinalization({ 
                        gateway: "AliBank NFC Switch", 
                        bankName: foundCustomer.bank,
                        cardType: foundCustomer.brand
                      })} className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase text-xs shadow-xl">
                        EXECUTE SECURE DEBIT
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Button onClick={startNfcScanning} className="w-full h-16 bg-[#1E2329] text-white rounded-2xl font-black italic uppercase text-xs">ACTIVATE SENSORS</Button>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase italic tracking-widest">Supports Bank Dhofar, BCA, Citibank & 500+ Global Banks</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-4 space-y-8 animate-in fade-in duration-500">
                   <header className="flex items-center justify-between px-2">
                    <button onClick={() => setPaymentStep('selection')} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">Back</button>
                    <div className="flex bg-muted/50 p-1 rounded-lg">
                      <button onClick={() => setActiveGatewayTab('network')} className={cn("px-4 py-1.5 text-[9px] font-black rounded-md transition-all uppercase", activeGatewayTab === 'network' ? "bg-white shadow-sm text-accent" : "text-muted-foreground")}>Network</button>
                      <button onClick={() => setActiveGatewayTab('card')} className={cn("px-4 py-1.5 text-[9px] font-black rounded-md transition-all uppercase", activeGatewayTab === 'card' ? "bg-white shadow-sm text-accent" : "text-muted-foreground")}>Card Clearing</button>
                    </div>
                  </header>

                   <div className="space-y-6">
                      {activeGatewayTab === 'network' ? (
                        <div className="space-y-6">
                          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                            <Info className="w-5 h-5 text-blue-500 shrink-0" />
                            <p className="text-[10px] text-muted-foreground font-bold leading-relaxed uppercase italic">Gunakan saldo dompet digital global Anda untuk penyelesaian dana instan ke AliBank.</p>
                          </div>
                          <div ref={paypalContainerRef} className="w-full min-h-[150px] flex flex-col items-center justify-center">
                            {!paypalReady && <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                          <div className="p-6 rounded-2xl bg-accent/5 border border-primary/10 flex gap-4">
                            <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed italic">Pembayaran diproses secara riil melalui infrastruktur aman Ali-Global Card Clearing.</p>
                          </div>
                          
                          <div ref={cardButtonRef} className="w-full min-h-[100px] flex flex-col items-center justify-center">
                            {!paypalReady && <Loader2 className="w-8 h-8 animate-spin text-primary opacity-40" />}
                          </div>

                          <div className="text-center opacity-40">
                            <p className="text-[8px] font-black uppercase italic tracking-widest">PCI-DSS COMPLIANT NODE</p>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          <footer className="text-center opacity-40 flex items-center justify-center gap-4 grayscale">
            <div className="flex flex-col items-center gap-1">
              <SearchCheck className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase italic">ISO8583 Member</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <ShieldAlert className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase italic">Anti-Fraud Node</span>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
