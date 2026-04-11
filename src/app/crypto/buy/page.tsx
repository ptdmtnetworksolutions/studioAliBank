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
  ImageIcon,
  RefreshCw,
  Zap,
  QrCode,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { useUser, useFirestore, useDoc, useMemoFirebase, useStorage } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { createMidtransSnapTokenAction } from "@/app/actions/midtrans-actions";
import Script from "next/script";

declare global {
  interface Window {
    paypal: any;
    snap: any;
  }
}

const PAYMENT_METHODS = [
  { id: 'midtrans', name: "Instan Kliring (Virtual Account/QRIS)", icon: Zap, desc: "BCA, Mandiri, BRI, BNI, QRIS" },
  { id: 'card', name: "Kartu Kredit/Debit Global", icon: CreditCard, desc: "Visa, Mastercard via PayPal" },
  { id: 'bank', name: "Transfer Bank Manual", icon: Building2, desc: "Verifikasi Manual (Kode Unik)" },
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
  const storage = useStorage();
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
  const [midtransReady, setMidtransReady] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const renderInProgress = useRef(false);
  const retryCount = useRef(0);

  const apiKeysRef = useMemoFirebase(() => (db && user ? doc(db, "system", "api_keys") : null), [db, user]);
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
    if (selectedPayment.id === 'bank' && activeTab === 'beli') {
      setUniqueCode(Math.floor(100 + Math.random() * 899));
    } else {
      setUniqueCode(0);
    }
  }, [selectedPayment, activeTab]);

  const exchangeRate = 15850; 
  
  const totalAmountIdr = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return 0;
    const baseAmountIdr = selectedCurrency.code === 'USD' ? num * exchangeRate : num;
    return Math.floor(baseAmountIdr + uniqueCode);
  }, [amount, uniqueCode, selectedCurrency]);

  const estimatedCrypto = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return "0";
    const amountInUsd = selectedCurrency.code === 'USD' ? num : num / exchangeRate;
    
    // Markup 2% untuk platform fee saat beli
    const markup = activeTab === 'beli' ? (selectedAsset.isNative ? 1 : 1.02) : 1;
    const priceWithMarkup = selectedAsset.priceUsd * markup;
    
    return (amountInUsd / priceWithMarkup).toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4);
  }, [amount, selectedAsset, selectedCurrency, activeTab]);

  const usdValue = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num)) return "0.00";
    if (selectedCurrency.code === 'USD') return num.toFixed(2);
    return (num / exchangeRate).toFixed(2);
  }, [amount, selectedCurrency]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setProofPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleManualBankPayment = async () => {
    if (!user || !db || !storage || !proofImage) return;
    setIsProcessing(true);

    try {
      const fileName = `proof_${Date.now()}.jpg`;
      const storageRef = ref(storage, `payment_proofs/${user.uid}/${fileName}`);
      const uploadResult = await uploadBytes(storageRef, proofImage);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      await addDoc(collection(db, "topup_requests"), {
        userId: user.uid,
        userName: userData?.name || "Nasabah AliBank",
        userEmail: user.email,
        amount: totalAmountIdr,
        asset: selectedAsset.symbol,
        estimatedAsset: parseFloat(estimatedCrypto),
        uniqueCode,
        totalToTransfer: totalAmountIdr,
        proofImage: downloadUrl,
        status: "pending",
        type: activeTab,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `TOPUP-REQ-${Date.now()}`,
        category: activeTab === 'beli' ? "Manual Topup Request" : "Manual Withdraw Request",
        gateway: "BCA Manual",
        amountIdr: totalAmountIdr,
        description: `Pending ${activeTab} request from ${userData?.name}. Unique code: ${uniqueCode}`,
        status: "pending_verification",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      setStep('success');
      toast({ title: "Permintaan Terkirim", description: "Admin akan memverifikasi transaksi Anda segera." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Proses", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMidtransPayment = async () => {
    if (!user || !userData || !systemKeys?.midtransServerKey) {
      toast({ variant: "destructive", title: "Gateway Unconfigured", description: "Midtrans keys missing in Vault." });
      return;
    }

    setIsProcessing(true);
    try {
      const orderId = `ALI-TRADE-${activeTab.toUpperCase()}-${Date.now()}`;
      const { token } = await createMidtransSnapTokenAction(
        orderId,
        totalAmountIdr,
        userData.name,
        user.email!,
        systemKeys.midtransServerKey
      );

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: async (result: any) => {
            await finalizeTransaction({ id: result.transaction_id, gateway: "Midtrans" });
          },
          onPending: (result: any) => {
            toast({ title: "Pembayaran Tertunda", description: "Silakan selesaikan pembayaran di aplikasi bank Anda." });
            setIsCheckoutDialogOpen(false);
          },
          onError: (result: any) => {
            toast({ variant: "destructive", title: "Pembayaran Gagal" });
          },
          onClose: () => {
            setIsProcessing(false);
          }
        });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Kliring Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPayPalButtons = useCallback(async () => {
    if (!paypalContainerRef.current || !isCheckoutDialogOpen || !systemKeys?.paypalClientId) return;
    if (selectedPayment.id !== 'card') return;

    if (typeof window === 'undefined' || !window.paypal) {
      if (retryCount.current < 10) {
        retryCount.current++;
        setTimeout(renderPayPalButtons, 1000);
      } else {
        setGatewayError("Gagal memuat terminal kliring PayPal.");
      }
      return;
    }

    if (renderInProgress.current) return;
    renderInProgress.current = true;
    setGatewayError(null);

    paypalContainerRef.current.innerHTML = "";

    try {
      await window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect' },
        createOrder: (data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: { currency_code: "USD", value: usdValue },
              description: `AliBank ${activeTab.toUpperCase()}: ${estimatedCrypto} ${selectedAsset.symbol}`
            }]
          });
        },
        onApprove: async (data: any, actions: any) => {
          setIsProcessing(true);
          try {
            const details = await actions.order.capture();
            if (details.status === 'COMPLETED') {
              await finalizeTransaction({ id: details.id, gateway: "PayPal" });
            }
          } catch (err) {
            toast({ variant: "destructive", title: "Kliring Gagal" });
          } finally {
            setIsProcessing(false);
          }
        },
        onError: () => {
          setGatewayError("Terjadi hambatan pada node PayPal.");
          renderInProgress.current = false;
        }
      }).render(paypalContainerRef.current);
      renderInProgress.current = false;
    } catch (err) {
      renderInProgress.current = false;
      setTimeout(renderPayPalButtons, 1000);
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, usdValue, estimatedCrypto, selectedAsset.symbol, systemKeys?.paypalClientId, toast, activeTab]);

  useEffect(() => {
    if (isCheckoutDialogOpen && paypalReady && selectedPayment.id === 'card') {
      retryCount.current = 0;
      renderPayPalButtons();
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, paypalReady, renderPayPalButtons]);

  const finalizeTransaction = async (paymentDetails: any) => {
    if (!user || !db || !userDocRef || !userData) return;
    setIsProcessing(true);
    
    const cryptoAmount = parseFloat(estimatedCrypto);
    const fiatAmountIdr = totalAmountIdr;

    // VALIDASI SALDO UNTUK JUAL
    if (activeTab === 'jual') {
      const currentCryptoBal = userData.cryptoBalances?.[selectedAsset.symbol] || 0;
      if (currentCryptoBal < cryptoAmount) {
        toast({ variant: "destructive", title: "Saldo Aset Tidak Cukup" });
        setIsProcessing(false);
        return;
      }
    }

    try {
      const userUpdates: any = {};
      const systemUpdates: any = {
        totalUsdInjected: increment(activeTab === 'beli' ? parseFloat(usdValue) : -parseFloat(usdValue)),
        totalFiatInjected: increment(activeTab === 'beli' ? fiatAmountIdr : -fiatAmountIdr)
      };

      if (activeTab === 'beli') {
        userUpdates[`cryptoBalances.${selectedAsset.symbol}`] = increment(cryptoAmount);
      } else {
        userUpdates[`cryptoBalances.${selectedAsset.symbol}`] = increment(-cryptoAmount);
        userUpdates.totalBalance = increment(fiatAmountIdr);
        
        // Kembalikan ALX ke brankas jika nasabah menjual
        if (selectedAsset.symbol === 'ALX') {
          systemUpdates.alixVaultBalance = increment(cryptoAmount);
        }
      }

      await updateDoc(userDocRef, userUpdates);
      const sysRef = doc(db, "system", "liquidity");
      await updateDoc(sysRef, systemUpdates);

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `${activeTab.toUpperCase()}-${paymentDetails.id || Date.now()}`,
        category: "Market Execution",
        gateway: paymentDetails.gateway || selectedPayment.name,
        amountIdr: fiatAmountIdr,
        cryptoAmount: cryptoAmount,
        cryptoCurrency: selectedAsset.symbol,
        status: "success",
        type: activeTab,
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `${activeTab === 'beli' ? 'Beli' : 'Jual'} ${selectedAsset.symbol} via ${selectedPayment.name}`,
        category: "Trading",
        amount: fiatAmountIdr,
        cryptoAmount: cryptoAmount,
        cryptoCurrency: selectedAsset.symbol,
        type: activeTab === 'beli' ? 'expense' : 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      setIsCheckoutDialogOpen(false);
      setStep('success');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Error", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 12) setAmount(amount + num);
  };

  if (!mounted) return (
    <div className="h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary w-8 h-8" />
    </div>
  );

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase text-center mb-2">
          {activeTab === 'beli' ? 'Pembelian Berhasil' : 'Penjualan Berhasil'}
        </h2>
        <p className="text-xs text-muted-foreground text-center mb-8 italic uppercase tracking-widest">Tervalidasi oleh Node AliBank V3</p>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 space-y-4 mb-8 text-center shadow-2xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase">
            {activeTab === 'beli' ? 'Jumlah Diterima' : 'Jumlah Dicairkan'}
          </p>
          <p className="text-3xl font-black text-primary italic">
            {activeTab === 'beli' ? `${estimatedCrypto} ${selectedAsset.symbol}` : `Rp ${totalAmountIdr.toLocaleString('id-ID')}`}
          </p>
          <div className="pt-4 border-t border-primary/5">
            <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">
              ID Transaksi: ALI-{activeTab.toUpperCase()}-{Date.now().toString().slice(-8)}
            </p>
          </div>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/')}>Beranda</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      {systemKeys?.paypalClientId && (
        <Script 
          src={`https://www.paypal.com/sdk/js?client-id=${systemKeys.paypalClientId}&currency=USD`} 
          onLoad={() => setPaypalReady(true)} 
        />
      )}
      {systemKeys?.midtransClientKey && (
        <Script 
          src={systemKeys.midtransServerKey?.startsWith('SB-') 
            ? "https://app.sandbox.midtrans.com/snap/snap.js" 
            : "https://app.midtrans.com/snap/snap.js"}
          data-client-key={systemKeys.midtransClientKey}
          onLoad={() => setMidtransReady(true)}
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
              <button 
                key={tab} 
                onClick={() => tab === 'Convert' ? router.push('/crypto/convert') : setActiveTab(tab.toLowerCase() as any)} 
                className={cn(
                  "px-8 py-1.5 rounded-full text-xs font-black transition-all uppercase italic", 
                  activeTab === tab.toLowerCase() ? "bg-background text-foreground shadow-md" : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn("text-6xl font-black tracking-tighter italic", amount === "0" ? "text-muted-foreground/20" : "text-foreground")}>{amount}</span>
              <div className="flex items-center gap-1 cursor-pointer bg-muted/50 px-3 py-1.5 rounded-xl border border-border" onClick={() => router.push('/settings/payment-currency')}>
                <span className="text-sm font-black uppercase tracking-tighter">{selectedCurrency.code}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground font-bold italic">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs">{estimatedCrypto} {selectedAsset.symbol}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 cursor-pointer" onClick={() => setIsAssetSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2", selectedAsset.isNative ? "gold-gradient" : "bg-teal-600")}>{selectedAsset.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-white/20 rounded-full flex items-center justify-center font-black text-white text-[10px]">{selectedAsset.symbol[0]}</div>}</div>
                <div><p className="text-xs font-black italic">{activeTab === 'beli' ? 'Beli' : 'Jual'}</p><div className="flex items-center gap-2"><span className="text-sm font-black text-foreground uppercase">{selectedAsset.symbol}</span><Badge className="bg-green-500/10 text-green-600 text-[7px] font-black h-4 px-1.5 border-none uppercase">Premium Node</Badge></div></div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 cursor-pointer" onClick={() => setIsPaymentSheetOpen(true)}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 shadow-sm text-primary">
                  <selectedPayment.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black italic">{activeTab === 'beli' ? 'Metode pembayaran' : 'Metode penerimaan'}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedPayment.name}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
          </div>
        </div>

        <div className="pb-10 space-y-6">
          <Button 
            disabled={amount === "0" || isProcessing} 
            onClick={() => setIsCheckoutDialogOpen(true)} 
            className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl text-base tracking-widest transition-all"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (activeTab === 'beli' ? 'LANJUTKAN KE PEMBAYARAN' : 'LANJUTKAN PENJUALAN')}
          </Button>
          
          <div className="grid grid-cols-3 gap-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (<button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">{n}</button>))}
            <button onClick={() => setAmount(prev => prev.includes(',') ? prev : prev + ',')} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 transition-colors"><Delete className="w-7 h-7" /></button>
          </div>
        </div>
      </main>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="gold-gradient h-3 w-full" />
          <div className="p-8 space-y-8">
            <DialogHeader className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-2.5 mb-2"><LogoIcon className="text-white" /></div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">ALIBANK SECURE GATEWAY</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Konfirmasi {activeTab === 'beli' ? 'Pembelian' : 'Penjualan'} - {selectedPayment.name}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-[2rem] p-6 text-center space-y-2 border border-border">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {activeTab === 'beli' ? 'Total Bayar' : 'Total Dicairkan'}
              </p>
              <h3 className="text-3xl font-black italic text-foreground">Rp {totalAmountIdr.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] font-black text-primary uppercase">≈ $ {usdValue}</p>
            </div>

            <div className="space-y-4">
              {selectedPayment.id === 'midtrans' ? (
                <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-accent/5 border border-primary/20 flex flex-col items-center gap-4">
                    <QrCode className="w-32 h-32 text-primary opacity-40" />
                    <p className="text-[10px] font-bold text-muted-foreground text-center uppercase italic">
                      Gunakan Virtual Account atau QRIS untuk penyelesaian {activeTab === 'beli' ? 'pembayaran' : 'penerimaan'} instan.
                    </p>
                  </div>
                  <Button onClick={handleMidtransPayment} disabled={isProcessing || !midtransReady} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "KONFIRMASI SEKARANG"}
                  </Button>
                </div>
              ) : selectedPayment.id === 'card' ? (
                <div className="min-h-[150px] flex flex-col items-center justify-center">
                  {gatewayError ? (
                    <div className="text-center p-4">
                      <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-rose-500 uppercase italic">{gatewayError}</p>
                    </div>
                  ) : (
                    <div ref={paypalContainerRef} className="w-full" />
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-muted/50 border border-border space-y-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase italic">Bank AliBank Center (BCA)</p>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-black italic uppercase">8829 4410 0021</span>
                        <Copy className="w-4 h-4 text-primary cursor-pointer active:scale-90" onClick={() => { navigator.clipboard.writeText("882944100021"); toast({title: "Rekening Disalin"}); }} />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground">AN: AliBank Vault Center</p>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase italic">
                        {activeTab === 'beli' ? 'Jumlah Wajib Transfer' : 'Estimasi Dana Diterima'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-primary italic">Rp {totalAmountIdr.toLocaleString('id-ID')}</span>
                        {activeTab === 'beli' && <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black">KODE: {uniqueCode}</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase italic text-muted-foreground ml-1">Unggah Bukti {activeTab === 'beli' ? 'Transfer' : 'Penerimaan'}</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all overflow-hidden",
                        proofPreview ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted"
                      )}
                    >
                      {proofPreview ? (
                        <img src={proofPreview} alt="proof" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <p className="text-[10px] font-bold text-muted-foreground uppercase italic">Pilih Gambar Bukti</p>
                        </>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleManualBankPayment} 
                    disabled={isProcessing || !proofImage} 
                    className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : "KONFIRMASI TRANSAKSI"}
                  </Button>
                </div>
              )}
              
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[9px] font-bold text-muted-foreground leading-relaxed uppercase italic">Node keamanan SSL AliBank V3 melindungi transaksi {activeTab} Anda.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isAssetSheetOpen} onOpenChange={setIsAssetSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">Pilih Aset</SheetTitle></SheetHeader>
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
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">
              {activeTab === 'beli' ? 'Metode Pembayaran' : 'Metode Penerimaan'}
            </SheetTitle></SheetHeader>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div key={method.id} onClick={() => { setSelectedPayment(method as any); setIsPaymentSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer group", selectedPayment.id === method.id ? "border-primary bg-primary/5 shadow-lg" : "border-muted bg-card hover:border-primary/20")}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 overflow-hidden shadow-sm text-primary">
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div><h4 className="text-sm font-black italic uppercase leading-none">{method.name}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{method.desc}</p></div>
                  </div>
                  {selectedPayment.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
