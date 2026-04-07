
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
  ShieldAlert,
  Copy,
  Landmark,
  Upload,
  Image as ImageIcon,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";
import { LogoIcon } from "@/components/ui/logo";
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
  { id: 'bank', name: "Transfer Bank (BCA)", icon: Building2, desc: "Verifikasi Manual (Kode Unik)" },
  { id: 'va', name: "Virtual Account", icon: Landmark, desc: "Instan Kliring Multi-Bank" },
];

const ASSETS = [
  { symbol: "ALX", name: "Alix Coin", priceUsd: 12.24, isNative: true },
  { symbol: "USDT", name: "TetherUS", priceUsd: 1.00, isNative: false },
  { symbol: "BTC", name: "Bitcoin", priceUsd: 66450.00, isNative: false },
];

export default function CryptoBuyPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'beli' | 'jual' | 'convert'>('beli');
  const [amount, setAmount] = useState("0");
  const [uniqueCode, setUniqueCode] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const [proofImage, setProofImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const renderInProgress = useRef(false);
  const retryCount = useRef(0);

  // Ambil API Keys secara dinamis dari Firestore system/api_keys
  const apiKeysRef = useMemoFirebase(() => (db ? doc(db, "system", "api_keys") : null), [db]);
  const { data: systemKeys } = useDoc(apiKeysRef);

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

  useEffect(() => {
    if (selectedPayment.id === 'bank') {
      setUniqueCode(Math.floor(100 + Math.random() * 899));
    } else {
      setUniqueCode(0);
    }
  }, [selectedPayment]);

  const exchangeRate = 15850; 
  
  const totalAmountIdr = useMemo(() => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return 0;
    const baseAmountIdr = selectedCurrency.code === 'USD' ? num * exchangeRate : num;
    return baseAmountIdr + uniqueCode;
  }, [amount, uniqueCode, selectedCurrency]);

  const estimatedReceive = useMemo(() => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num) || num <= 0) return "0";
    const amountInUsd = selectedCurrency.code === 'USD' ? num : num / exchangeRate;
    const priceWithMarkup = selectedAsset.isNative ? selectedAsset.priceUsd : selectedAsset.priceUsd * 1.02;
    return (amountInUsd / priceWithMarkup).toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4);
  }, [amount, selectedAsset, selectedCurrency]);

  const usdValue = useMemo(() => {
    const num = parseFloat(amount.replace(',', '.'));
    if (isNaN(num)) return "0.00";
    if (selectedCurrency.code === 'USD') return num.toFixed(2);
    return (num / exchangeRate).toFixed(2);
  }, [amount, selectedCurrency]);

  // Optimal PayPal Button Rendering
  const renderPayPalButtons = useCallback(async () => {
    if (!paypalContainerRef.current || !isCheckoutDialogOpen) return;
    if (selectedPayment.id !== 'gpay' && selectedPayment.id !== 'card') return;

    // Wait for window.paypal to be available
    if (typeof window === 'undefined' || !window.paypal) {
      if (retryCount.current < 10) {
        retryCount.current++;
        setTimeout(renderPayPalButtons, 1000);
      } else {
        setGatewayError("Gagal memuat terminal kliring. Pastikan koneksi internet stabil.");
      }
      return;
    }

    if (renderInProgress.current) return;
    renderInProgress.current = true;
    setGatewayError(null);

    // Clear container
    paypalContainerRef.current.innerHTML = "";

    const buttonConfig: any = {
      style: { 
        layout: 'vertical', 
        color: 'black', 
        shape: 'rect',
        label: 'pay'
      },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { 
              currency_code: "USD", 
              value: usdValue 
            },
            description: `AliBank Purchase: ${estimatedReceive} ${selectedAsset.symbol}`
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
          toast({ variant: "destructive", title: "Kliring Gagal", description: "Pembayaran tidak dapat diproses." });
        } finally {
          setIsProcessing(false);
        }
      },
      onError: (err: any) => {
        console.error("PayPal Error:", err);
        setGatewayError("Terjadi kesalahan pada modul pembayaran PayPal.");
        renderInProgress.current = false;
      }
    };

    try {
      if (selectedPayment.id === 'gpay') {
        await window.paypal.Buttons({
          ...buttonConfig,
          fundingSource: window.paypal.FUNDING.GOOGLEPAY
        }).render(paypalContainerRef.current);
      } else {
        await window.paypal.Buttons(buttonConfig).render(paypalContainerRef.current);
      }
      renderInProgress.current = false;
    } catch (err) {
      console.warn("Retrying standard render...");
      try {
        await window.paypal.Buttons(buttonConfig).render(paypalContainerRef.current);
      } catch (e) {
        setGatewayError("Gagal merender tombol pembayaran.");
      }
      renderInProgress.current = false;
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, usdValue, estimatedReceive, selectedAsset.symbol, toast]);

  useEffect(() => {
    if (isCheckoutDialogOpen) {
      retryCount.current = 0;
      setTimeout(renderPayPalButtons, 500);
    } else {
      renderInProgress.current = false;
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, renderPayPalButtons]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProofImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitManualRequest = async () => {
    if (!user || !db || !userData || !proofImage) return;
    setIsProcessing(true);
    try {
      const requestId = `TRQ-${Date.now()}`;
      await addDoc(collection(db, "topup_requests"), {
        requestId,
        userId: user.uid,
        userName: userData.name,
        userEmail: user.email,
        amount: parseFloat(amount.replace(',', '.')),
        currency: selectedCurrency.code,
        uniqueCode,
        totalToTransfer: totalAmountIdr,
        asset: selectedAsset.symbol,
        estimatedAsset: parseFloat(estimatedReceive),
        proofImage,
        status: "pending",
        timestamp: serverTimestamp()
      });

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Top Up ${selectedAsset.symbol} (Menunggu Verifikasi)`,
        category: "Bursa",
        amount: totalAmountIdr,
        type: "income",
        status: "pending_verification",
        timestamp: serverTimestamp()
      });

      setIsCheckoutDialogOpen(false);
      setStep('success');
      toast({ title: "Permintaan Dikirim", description: "Admin akan memverifikasi bukti transfer Anda." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const finalizePurchase = async (paymentDetails: any) => {
    if (!user || !db || !userDocRef || !userData) return;
    setIsProcessing(true);
    const numReceive = parseFloat(estimatedReceive);
    const numPayIdr = totalAmountIdr;
    try {
      await updateDoc(userDocRef, { [`cryptoBalances.${selectedAsset.symbol}`]: increment(numReceive) });
      const sysRef = doc(db, "system", "liquidity");
      await updateDoc(sysRef, { 
        totalFiatInjected: increment(numPayIdr), 
        totalUsdInjected: increment(parseFloat(usdValue)) 
      });
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `BUY-${paymentDetails.id || Date.now()}`,
        category: "External Settlement",
        gateway: selectedPayment.name,
        amountIdr: numPayIdr,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });
      setIsCheckoutDialogOpen(false);
      setStep('success');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error Sync", description: "Kegagalan sinkronisasi saldo riil." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 12) setAmount(amount + num);
  };

  const handleComma = () => {
    if (!amount.includes(",")) {
      setAmount(prev => prev === "0" ? "0," : prev + ",");
    }
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
          {selectedPayment.id === 'bank' ? <Loader2 className="w-12 h-12 text-amber-500 animate-spin" /> : <CheckCircle2 className="w-12 h-12 text-green-600" />}
        </div>
        <h2 className="text-2xl font-black italic uppercase tracking-tight mb-2">
          {selectedPayment.id === 'bank' ? 'SEDANG DIVERIFIKASI' : 'PEMBELIAN SELESAI'}
        </h2>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-8 italic">
          {selectedPayment.id === 'bank' ? 'Admin sedang mencocokkan kode unik mutasi Anda.' : 'Dana telah diamankan di Brankas AliBank V3'}
        </p>
        <Card className="w-full bg-muted/30 border-none rounded-[2rem] p-8 mb-10 space-y-4 shadow-inner">
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Aset Estimasi</p>
            <p className="text-4xl font-black italic text-foreground">{estimatedReceive} {selectedAsset.symbol}</p>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
            <span>Status Settlement</span>
            <span className="text-foreground">{selectedPayment.id === 'bank' ? 'PENDING' : 'SUCCESS'}</span>
          </div>
        </Card>
        <Button className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      {systemKeys?.paypalClientId && (
        <Script 
          key="paypal-sdk-v5"
          src={`https://www.paypal.com/sdk/js?client-id=${systemKeys.paypalClientId}&currency=USD&intent=capture&enable-funding=googlepay,card`} 
          strategy="afterInteractive"
          onLoad={() => setPaypalReady(true)} 
        />
      )}
      
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
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn("text-6xl font-black tracking-tighter italic", amount === "0" ? "text-muted-foreground/20" : "text-foreground")}>
                {amount}
              </span>
              <div className="flex items-center gap-1 cursor-pointer bg-muted/50 px-3 py-1.5 rounded-xl border border-border" onClick={() => router.push('/settings/payment-currency')}>
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
            <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 cursor-pointer" onClick={() => setIsAssetSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2", selectedAsset.isNative ? "gold-gradient" : "bg-teal-600")}>{selectedAsset.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center font-black text-white text-[10px]">{selectedAsset.symbol[0]}</div>}</div>
                <div><p className="text-xs font-black italic">Beli</p><div className="flex items-center gap-2"><span className="text-sm font-black text-foreground uppercase">{selectedAsset.symbol}</span><Badge className="bg-green-500/10 text-green-600 text-[7px] font-black h-4 px-1.5 border-none uppercase">Premium Node</Badge></div></div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 cursor-pointer" onClick={() => setIsPaymentSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 overflow-hidden shadow-sm">{selectedPayment.id === 'gpay' ? <div className="w-6 h-6"><svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/></svg></div> : (selectedPayment.icon && <selectedPayment.icon className="w-5 h-5 text-primary" />)}</div>
                <div><p className="text-xs font-black italic">Metode pembayaran</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedPayment.name}</p></div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
          </div>
        </div>
        <div className="pb-10 space-y-6">
          <Button disabled={amount === "0" || isProcessing} onClick={() => setIsCheckoutDialogOpen(true)} className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl text-base tracking-widest transition-all">{isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : `LANJUTKAN KE PEMBAYARAN`}</Button>
          <div className="grid grid-cols-3 gap-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (<button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">{n}</button>))}
            <button onClick={handleComma} className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 rounded-full transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 rounded-full transition-colors"><Delete className="w-7 h-7 text-foreground" /></button>
          </div>
        </div>
      </main>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-0 overflow-hidden shadow-2xl">
          <div className="gold-gradient h-3 py-0 w-full" />
          <div className="p-8 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-2.5 mb-2"><LogoIcon className="text-white" /></div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">ALIBANK SECURE GATEWAY</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {selectedPayment.id === 'bank' ? 'Penyelesaian Dana Riil - BCA Manual Clearance' : 'Global Card Clearing Network'}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-[2rem] p-6 text-center space-y-2 border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Bayar (Termasuk Kode Unik)</p>
              <h3 className="text-3xl font-black italic text-foreground">Rp {totalAmountIdr.toLocaleString('id-ID')}</h3>
              {uniqueCode > 0 && <p className="text-[10px] font-black text-primary uppercase">Kode Unik: +{uniqueCode}</p>}
            </div>

            <div className="space-y-4">
              {(selectedPayment.id === 'gpay' || selectedPayment.id === 'card') ? (
                <div key={`${selectedPayment.id}-${systemKeys?.paypalClientId}`} className="min-h-[150px] flex flex-col items-center justify-center">
                  {!systemKeys?.paypalClientId ? (
                    <p className="text-[10px] font-bold text-rose-500 uppercase">Menunggu API Key dari Vault...</p>
                  ) : gatewayError ? (
                    <div className="text-center p-4 space-y-3">
                      <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                      <p className="text-[10px] font-bold text-rose-500 uppercase italic leading-relaxed">{gatewayError}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="h-10 text-[10px] font-black uppercase rounded-xl border-primary/20 text-primary">
                        <RefreshCw className="w-3.5 h-3.5 mr-2" /> Segarkan Terminal
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      <div ref={paypalContainerRef} className="w-full" />
                      {!paypalReady && (
                        <div className="flex flex-col items-center gap-3 py-6">
                          <Loader2 className="animate-spin text-primary w-8 h-8" />
                          <p className="text-[10px] font-black uppercase text-primary italic animate-pulse">Menghubungkan Terminal Kliring...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : selectedPayment.id === 'bank' ? (
                <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-accent/5 border border-primary/20 space-y-4">
                    <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-muted-foreground">Bank Tujuan</p><Badge className="bg-primary text-black font-black italic text-[8px] h-5">BCA</Badge></div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Nomor Rekening</p>
                      <div className="flex items-center justify-between"><p className="text-2xl font-black italic tracking-widest text-foreground">3210902545</p><button onClick={() => { navigator.clipboard.writeText('3210902545'); toast({ title: "Salin Berhasil" }); }} className="p-2 hover:bg-primary/10 rounded-lg text-primary"><Copy className="w-4 h-4" /></button></div>
                    </div>
                    <div className="space-y-1"><p className="text-[10px] font-bold text-muted-foreground uppercase">Atas Nama</p><p className="text-sm font-black uppercase italic">ALIBANK GLOBAL VAULT</p></div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unggah Bukti Transfer</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-32 border-2 border-dashed border-primary/20 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-muted/20 hover:bg-muted/40 transition-all overflow-hidden"
                    >
                      {proofImage ? (
                        <img src={proofImage} alt="proof" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-primary/40" />
                          <p className="text-[10px] font-black uppercase text-primary/60">Klik untuk upload foto</p>
                        </>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>

                  <Button onClick={submitManualRequest} disabled={isProcessing || !proofImage} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "KONFIRMASI PEMBAYARAN"}
                  </Button>
                </div>
              ) : (
                <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-blue-500/5 border border-blue-500/10 space-y-4">
                    <div className="flex justify-between items-center"><p className="text-[10px] font-black uppercase text-muted-foreground">Virtual Account</p><Badge className="bg-blue-500 text-white font-black italic text-[8px] h-5 uppercase">BCA VA</Badge></div>
                    <div className="flex items-center justify-between"><p className="text-2xl font-black italic tracking-widest text-foreground">8829321090</p><button className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-500"><Copy className="w-4 h-4" /></button></div>
                  </div>
                  <Button onClick={() => finalizePurchase({ id: `VA-BCA-${Date.now()}` })} disabled={isProcessing} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase italic shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "CEK STATUS INSTAN"}
                  </Button>
                </div>
              )}
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                  {selectedPayment.id === 'bank' 
                    ? "Dana akan diverifikasi manual oleh AliBank Node. Pastikan kode unik sesuai." 
                    : "Transaksi diproses melalui node keamanan PayPal SSL terenkripsi."}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="px-6 space-y-3">
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">Metode Pembayaran</SheetTitle></SheetHeader>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} onClick={() => { setSelectedPayment(method as any); setIsPaymentSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer group", selectedPayment.id === method.id ? "border-primary bg-primary/5 shadow-lg" : "border-muted bg-card hover:border-primary/20")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 overflow-hidden shadow-sm">{method.id === 'gpay' ? <div className="w-6 h-6"><svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.83c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/></svg></div> : <method.icon className="w-5 h-5" />}
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
