
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  History, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  Delete,
  X,
  ArrowUpDown,
  CreditCard,
  Building2,
  Wallet,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Globe,
  Smartphone,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";

declare global {
  interface Window {
    paypal: any;
  }
}

const PAYMENT_METHODS = [
  { id: 'gpay', name: "Google Pay", icon: "gpay", desc: "Instan & Aman" },
  { id: 'card', name: "Kartu Kredit/Debit", icon: CreditCard, desc: "Visa, Mastercard, JCB" },
  { id: 'bank', name: "Transfer Bank", icon: Building2, desc: "BCA, Mandiri, BNI, BRI" },
];

const ASSETS = [
  { symbol: "ALX", name: "Alix Coin", priceUsd: 12.24, isNative: true },
  { symbol: "USDT", name: "TetherUS", priceUsd: 1.00, isNative: false },
  { symbol: "BTC", name: "Bitcoin", priceUsd: 66450.00, isNative: false },
];

const PAYPAL_CLIENT_ID = "AbHG-qL9bHR0-rhmrDMV7TH-PiYAFHFNimv3LfxBUPmSIMaQPrbvFd7cJah1bc8YqlUkS7i3OpD0nvGF";

export default function CryptoBuyPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'beli' | 'jual' | 'convert'>('beli');
  const [amount, setAmount] = useState("0");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');

  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
    const savedCurrency = localStorage.getItem("alibank-payment-currency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {}
    }
  }, []);

  const exchangeRate = 15850; // USDT/IDR Fixed AliBank Rate
  
  const estimatedReceive = useMemo(() => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return "0";
    const amountInUsd = num / exchangeRate;
    const priceWithMarkup = selectedAsset.isNative ? selectedAsset.priceUsd : selectedAsset.priceUsd * 1.02;
    return (amountInUsd / priceWithMarkup).toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4);
  }, [amount, selectedAsset]);

  const usdValue = useMemo(() => {
    const num = parseFloat(amount.replace(',', '.'));
    return (num / exchangeRate).toFixed(2);
  }, [amount]);

  // MOUNT REAL PAYPAL/GPAY BUTTONS
  useEffect(() => {
    if (isCheckoutDialogOpen && paypalReady && window.paypal && paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = "";
      window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: { currency_code: "USD", value: usdValue },
              description: `Beli ${estimatedReceive} ${selectedAsset.symbol} - AliBank V3`
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          setIsProcessing(true);
          try {
            const details = await actions.order.capture();
            if (details.status === 'COMPLETED') {
              await finalizePurchase(details);
            }
          } catch (err) {
            toast({ variant: "destructive", title: "Gagal Kliring", description: "Pembayaran tidak dapat diselesaikan." });
          } finally {
            setIsProcessing(false);
          }
        }
      }).render(paypalContainerRef.current);
    }
  }, [isCheckoutDialogOpen, paypalReady, usdValue, estimatedReceive, selectedAsset]);

  const finalizePurchase = async (paymentDetails: any) => {
    if (!user || !db || !userDocRef) return;
    
    try {
      const numReceive = parseFloat(estimatedReceive);
      const numPay = parseFloat(amount.replace(',', '.'));

      // Update Saldo Kripto Nasabah secara Riil
      await updateDoc(userDocRef, {
        [`cryptoBalances.${selectedAsset.symbol}`]: increment(numReceive)
      });

      // Update Likuiditas Sistem (Dana Riil Masuk)
      const sysRef = doc(db, "system", "liquidity");
      await updateDoc(sysRef, {
        totalFiatInjected: increment(numPay),
        totalUsdInjected: increment(parseFloat(usdValue))
      });

      // Catat Transaksi Audit
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Beli ${selectedAsset.symbol} via Ali-Secure Gateway`,
        category: "Bursa",
        amount: numPay,
        currency: selectedCurrency.code,
        cryptoAmount: numReceive,
        cryptoCurrency: selectedAsset.symbol,
        paymentId: paymentDetails.id,
        gateway: "Google Pay / Card",
        type: "income",
        status: "success",
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Settlement Berhasil",
        message: `Pembayaran riil terkonfirmasi. Berhasil membeli ${numReceive} ${selectedAsset.symbol}.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      setIsCheckoutDialogOpen(false);
      setStep('success');
      toast({ title: "Settlement Berhasil", description: "Dana telah diverifikasi dan masuk ke dompet Anda." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error Finalisasi", description: err.message });
    }
  };

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 12) setAmount(amount + num);
  };

  const handleDelete = () => {
    if (amount.length > 1) setAmount(amount.slice(0, -1));
    else setAmount("0");
  };

  if (!mounted) return null;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">PEMBELIAN SELESAI</h2>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-8">DANA TELAH DIAMANKAN DI BRANKAS ALIBANK</p>
        
        <Card className="w-full bg-muted/30 border-none rounded-[2rem] p-8 mb-10 space-y-4">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Aset Diterima</p>
            <p className="text-4xl font-black italic text-foreground">{estimatedReceive} {selectedAsset.symbol}</p>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
            <span>Metode</span>
            <span className="text-foreground">{selectedPayment.name}</span>
          </div>
        </Card>

        <Button className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-body overflow-hidden transition-colors duration-300">
      <Script 
        src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&enable-funding=paylater,card`}
        onLoad={() => setPaypalReady(true)}
      />

      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        <button className="p-2 hover:bg-muted rounded-full transition-colors" onClick={() => router.push('/transactions')}><History className="w-5 h-5 text-muted-foreground" /></button>
      </header>

      <main className="flex-1 px-5 pt-1 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="bg-muted/60 p-1 rounded-full flex w-fit mx-auto mb-2">
            {['Beli', 'Jual', 'Convert'].map((tab) => (
              <button key={tab} onClick={() => tab === 'Convert' ? router.push('/crypto/convert') : setActiveTab(tab.toLowerCase() as any)} className={cn("px-6 py-1.5 rounded-full text-xs font-black transition-all uppercase italic", activeTab === tab.toLowerCase() ? "bg-foreground text-background shadow-md" : "text-muted-foreground")}>{tab}</button>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <span className={cn("text-6xl font-black tracking-tighter italic", amount === "0" ? "text-muted-foreground/20" : "text-foreground")}>{parseFloat(amount).toLocaleString('id-ID')}</span>
              <div className="flex items-center gap-1 cursor-pointer bg-muted/50 px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors" onClick={() => router.push('/settings/payment-currency')}>
                <span className="text-sm font-black uppercase tracking-tighter">{selectedCurrency.code}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-bold">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs italic">{estimatedReceive} {selectedAsset.symbol}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between cursor-pointer group p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 transition-all" onClick={() => setIsAssetSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2 shadow-md", selectedAsset.isNative ? "gold-gradient" : "bg-teal-600")}>
                  {selectedAsset.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center font-black text-white text-[10px]">{selectedAsset.symbol[0]}</div>}
                </div>
                <div>
                  <p className="text-xs font-black italic">Beli</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-foreground uppercase tracking-tight">{selectedAsset.symbol}</span>
                    <Badge className="bg-green-500/10 text-green-500 text-[7px] font-black h-4 px-1.5 border-none uppercase">Premium Node</Badge>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="flex items-center justify-between cursor-pointer group p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 transition-all" onClick={() => setIsPaymentSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 overflow-hidden shadow-sm">
                  {selectedPayment.id === 'gpay' ? (
                    <svg viewBox="0 0 24 24" className="w-full h-full">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
                    </svg>
                  ) : <selectedPayment.icon className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="text-xs font-black italic">Metode pembayaran</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedPayment.name}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        <div className="pb-10 space-y-6">
          <Button disabled={amount === "0" || isProcessing} onClick={() => setIsCheckoutDialogOpen(true)} className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl text-base tracking-widest transition-all active:scale-95">
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `LANJUTKAN KE PEMBAYARAN`}
          </Button>

          <div className="grid grid-cols-3 gap-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">{n}</button>
            ))}
            <button className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 rounded-full transition-colors"><Delete className="w-7 h-7 text-foreground" /></button>
          </div>
        </div>
      </main>

      {/* SECURE CHECKOUT DIALOG */}
      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-0 overflow-hidden shadow-2xl">
          <div className="gold-gradient h-3 py-0 w-full" />
          <div className="p-8 space-y-8">
            <DialogHeader className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-2.5 mb-2"><LogoIcon className="text-white" /></div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">ALIBANK SECURE GATEWAY</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Penyelesaian Dana Riil - PCI DSS Compliant</DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-[2rem] p-6 text-center space-y-2 border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Pembayaran</p>
              <h3 className="text-3xl font-black italic text-foreground">Rp {parseFloat(amount).toLocaleString('id-ID')}</h3>
              <p className="text-[10px] font-bold text-primary italic uppercase">≈ $ {usdValue}</p>
            </div>

            <div className="space-y-4">
              <div ref={paypalContainerRef} className="min-h-[150px] flex flex-col items-center justify-center">
                {!paypalReady && <Loader2 className="animate-spin text-primary opacity-40" />}
              </div>
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase italic">Pembayaran diproses secara riil melalui node keamanan AliBank. Dana akan memotong saldo Google Pay atau Kartu Anda.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* SHEETS FOR ASSET AND PAYMENT */}
      <Sheet open={isAssetSheetOpen} onOpenChange={setIsAssetSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">Pilih Koin</SheetTitle></SheetHeader>
            <div className="space-y-2">
              {ASSETS.map((asset) => (
                <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); setIsAssetSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer", selectedAsset.symbol === asset.symbol ? "border-primary bg-primary/5" : "border-muted bg-card hover:border-primary/10")}>
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2 shadow-md", asset.isNative ? "gold-gradient" : "bg-muted")}>{asset.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-full flex items-center justify-center font-black text-white text-[10px]">{asset.symbol[0]}</div>}</div>
                    <div><h4 className="text-sm font-black italic uppercase leading-none">{asset.name}</h4><div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-bold text-muted-foreground uppercase">{asset.symbol}</span>{asset.isNative && <Badge className="bg-primary/20 text-primary text-[7px] font-black h-4 px-1.5 border-none">NATIVE</Badge>}</div></div>
                  </div>
                  <div className="text-right"><p className="text-sm font-black italic text-foreground">${asset.priceUsd.toLocaleString()}</p></div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">Metode Pembayaran</SheetTitle></SheetHeader>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} onClick={() => { setSelectedPayment(method); setIsPaymentSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer group", selectedPayment.id === method.id ? "border-primary bg-primary/5 shadow-lg" : "border-muted bg-card hover:border-primary/20")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                      {method.id === 'gpay' ? <div className="w-6 h-6"><svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/></svg></div> : <method.icon className="w-5 h-5" />}
                    </div>
                    <div><h4 className="text-sm font-black italic uppercase leading-none">{method.name}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{method.desc}</p></div>
                  </div>
                  {selectedPayment.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(252,213,53,0.8)]" />}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
