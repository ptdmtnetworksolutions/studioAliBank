"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  History, 
  ChevronDown, 
  ChevronRight, 
  Delete,
  ArrowUpDown,
  CreditCard,
  Building2,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Smartphone,
  ShieldAlert,
  Copy,
  Landmark,
  Upload,
  RefreshCw,
  Zap,
  QrCode,
  Info,
  AlertCircle,
  Plus,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { useUser, useDoc, useFirestore, useMemoFirebase, useStorage } from "@/firebase";
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
  const [selectedWithdrawalAccount, setSelectedWithdrawalAccount] = useState<any>(null);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(15850);
  const [isRateLoading, setIsRateLoading] = useState(true);
  
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [isCurrencySheetOpen, setIsCurrencySheetOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [midtransReady, setMidtransReady] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const [currencySearch, setCurrencySearch] = useState("");
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

  // FIX: Sinkronisasi Kurs USD/IDR Real-Time dari Node Bursa
  const fetchRealTimeRate = useCallback(async () => {
    try {
      setIsRateLoading(true);
      const res = await fetch(`/api/market/ticker?symbol=USDTIDR`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.lastPrice) {
          const newRate = parseFloat(data.lastPrice);
          setDynamicUsdtRate(newRate);
        }
      }
    } catch (e) {
      console.warn("Failed to fetch real-time rate", e);
    } finally {
      setIsRateLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchRealTimeRate();
    const interval = setInterval(fetchRealTimeRate, 15000);

    const savedCurrency = localStorage.getItem("alibank-payment-currency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {}
    }
    return () => clearInterval(interval);
  }, [fetchRealTimeRate]);

  const getRateToIdr = useCallback((code: string) => {
    if (code === 'IDR') return 1;
    if (code === 'USD') return dynamicUsdtRate;
    if (code === 'EUR') return dynamicUsdtRate * 1.08;
    if (code === 'GBP') return dynamicUsdtRate * 1.26;
    if (code === 'SGD') return dynamicUsdtRate * 0.74;
    return 1;
  }, [dynamicUsdtRate]);

  const isVerified = userData?.kycStatus === 'verified';
  const hasWithdrawalMethods = userData?.withdrawalMethods && userData.withdrawalMethods.length > 0;

  useEffect(() => {
    if (activeTab === 'jual' && userData?.cryptoBalances) {
      const cryptoBalance = userData.cryptoBalances[selectedAsset.symbol] || 0;
      if (cryptoBalance > 0) {
        const valInUsd = cryptoBalance * selectedAsset.priceUsd;
        const valInIdr = valInUsd * dynamicUsdtRate;
        const valInFiat = valInIdr / getRateToIdr(selectedCurrency.code);
        
        const formatted = selectedCurrency.code === 'IDR' 
          ? Math.floor(valInFiat).toString()
          : valInFiat.toFixed(2).replace('.', ',');
        
        setAmount(formatted);
      } else {
        setAmount("0");
      }

      if (hasWithdrawalMethods && !selectedWithdrawalAccount) {
        setSelectedWithdrawalAccount(userData.withdrawalMethods[0]);
      }
    }
  }, [activeTab, selectedAsset.symbol, userData?.cryptoBalances, selectedCurrency.code, getRateToIdr, hasWithdrawalMethods, selectedWithdrawalAccount, dynamicUsdtRate]);

  useEffect(() => {
    if (selectedPayment.id === 'bank' && activeTab === 'beli') {
      setUniqueCode(Math.floor(100 + Math.random() * 899));
    } else {
      setUniqueCode(0);
    }
  }, [selectedPayment, activeTab]);

  const totalAmountIdr = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return 0;
    const baseAmountIdr = num * getRateToIdr(selectedCurrency.code);
    return Math.floor(baseAmountIdr + uniqueCode);
  }, [amount, uniqueCode, selectedCurrency, getRateToIdr]);

  const estimatedCrypto = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return "0";
    const amountInIdr = num * getRateToIdr(selectedCurrency.code);
    const amountInUsd = amountInIdr / dynamicUsdtRate;
    
    const markup = activeTab === 'beli' ? (selectedAsset.isNative ? 1 : 1.02) : 1;
    const priceWithMarkup = selectedAsset.priceUsd * markup;
    
    return (amountInUsd / priceWithMarkup).toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4);
  }, [amount, selectedAsset, selectedCurrency, activeTab, getRateToIdr, dynamicUsdtRate]);

  const usdValue = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num)) return "0.00";
    const amountInIdr = num * getRateToIdr(selectedCurrency.code);
    return (amountInIdr / dynamicUsdtRate).toFixed(2);
  }, [amount, selectedCurrency, getRateToIdr, dynamicUsdtRate]);

  const handleCurrencySelect = (currency: Currency) => {
    const oldRate = getRateToIdr(selectedCurrency.code);
    const newRate = getRateToIdr(currency.code);
    const currentNum = parseFloat(amount.replace(',', '.')) || 0;
    
    if (currentNum > 0) {
      const converted = (currentNum * oldRate) / newRate;
      setAmount(converted.toFixed(currency.code === 'IDR' ? 0 : 2).replace('.', ','));
    }
    
    setSelectedCurrency(currency);
    setIsCurrencySheetOpen(false);
    setCurrencySearch("");
    localStorage.setItem("alibank-payment-currency", JSON.stringify(currency));
  };

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 12) setAmount(amount + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
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

  // FIX: Logika Rendering PayPal yang lebih stabil dengan Auto-Retry
  const renderPayPalButtons = useCallback(async () => {
    if (!paypalContainerRef.current || !isCheckoutDialogOpen || !systemKeys?.paypalClientId) return;
    if (selectedPayment.id !== 'card') return;

    if (typeof window === 'undefined' || !window.paypal) {
      if (retryCount.current < 20) {
        retryCount.current++;
        setTimeout(renderPayPalButtons, 1000);
      } else {
        setGatewayError("Gagal memuat terminal kliring PayPal. Silakan segarkan halaman.");
      }
      return;
    }

    if (renderInProgress.current) return;
    renderInProgress.current = true;
    setGatewayError(null);

    paypalContainerRef.current.innerHTML = "";

    try {
      await window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
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
        onError: (err: any) => {
          console.error("PayPal Error:", err);
          setGatewayError("Terjadi hambatan pada node PayPal.");
          renderInProgress.current = false;
        }
      }).render(paypalContainerRef.current);
      renderInProgress.current = false;
    } catch (err) {
      renderInProgress.current = false;
      console.warn("PayPal Render Error, retrying...", err);
      setTimeout(renderPayPalButtons, 1000);
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, usdValue, estimatedCrypto, selectedAsset.symbol, systemKeys?.paypalClientId, toast, activeTab]);

  useEffect(() => {
    if (isCheckoutDialogOpen && selectedPayment.id === 'card') {
      retryCount.current = 0;
      renderInProgress.current = false;
      const timer = setTimeout(() => {
        renderPayPalButtons();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, paypalReady, renderPayPalButtons]);

  const finalizeTransaction = async (paymentDetails: any) => {
    if (!user || !db || !userDocRef || !userData) return;
    setIsProcessing(true);
    
    const cryptoAmount = parseFloat(estimatedCrypto);
    const fiatAmountIdr = totalAmountIdr;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const filteredCurrencies = useMemo(() => {
    return currencies.filter(c => 
      c.code.toLowerCase().includes(currencySearch.toLowerCase()) || 
      c.name.toLowerCase().includes(currencySearch.toLowerCase())
    );
  }, [currencySearch]);

  const currentCryptoBalance = useMemo(() => {
    if (!userData?.cryptoBalances) return 0;
    return userData.cryptoBalances[selectedAsset.symbol] || 0;
  }, [userData, selectedAsset]);

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
          src={`https://www.paypal.com/sdk/js?client-id=${systemKeys.paypalClientId}&currency=USD&intent=capture`} 
          onLoad={() => setPaypalReady(true)} 
          onError={() => setGatewayError("Gagal memuat terminal PayPal.")}
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
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black italic h-6 uppercase flex items-center gap-1.5 px-2.5">
             <RefreshCw className={cn("w-2.5 h-2.5", isRateLoading && "animate-spin")} />
             Kurs: Rp{dynamicUsdtRate.toLocaleString()}
           </Badge>
           <button className="p-2 hover:bg-muted rounded-full transition-colors" onClick={() => router.push('/transactions')}><History className="w-5 h-5 text-muted-foreground" /></button>
        </div>
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
                  activeTab === tab.toLowerCase() ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center gap-2">
              <span className={cn("text-6xl font-black tracking-tighter italic", amount === "0" ? "text-muted-foreground/20" : "text-foreground")}>{amount}</span>
              <div 
                className="flex items-center gap-1 cursor-pointer bg-muted/50 px-3 py-1.5 rounded-xl border border-border transition-all active:scale-95" 
                onClick={() => setIsCurrencySheetOpen(true)}
              >
                <span className="text-sm font-black uppercase tracking-tighter">{selectedCurrency.code}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2 text-muted-foreground font-bold italic">
                <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs">{estimatedCrypto} {selectedAsset.symbol}</span>
              </div>
              {activeTab === 'jual' && (
                <button 
                  onClick={() => {
                    const valInUsd = currentCryptoBalance * selectedAsset.priceUsd;
                    const valInIdr = valInUsd * dynamicUsdtRate;
                    const valInFiat = valInIdr / getRateToIdr(selectedCurrency.code);
                    setAmount(selectedCurrency.code === 'IDR' ? Math.floor(valInFiat).toString() : valInFiat.toFixed(2).replace('.', ','));
                  }}
                  className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase italic hover:underline animate-in fade-in"
                >
                  Saldo: {currentCryptoBalance.toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4)} {selectedAsset.symbol} (MAKS)
                </button>
              )}
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
                  {activeTab === 'beli' ? <selectedPayment.icon className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-black italic">{activeTab === 'beli' ? 'Metode pembayaran' : 'Metode penerimaan'}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase",
                    activeTab === 'jual' && !hasWithdrawalMethods ? "text-rose-500" : "text-muted-foreground"
                  )}>
                    {activeTab === 'beli' 
                      ? selectedPayment.name 
                      : (selectedWithdrawalAccount ? `${selectedWithdrawalAccount.provider} - ${selectedWithdrawalAccount.accountNumber}` : "Pilih Rekening Penerima")}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
          </div>

          {!isVerified && activeTab === 'jual' && (
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-3 animate-in fade-in">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-amber-600 uppercase">Verifikasi Diperlukan</p>
                <p className="text-[9px] font-medium text-muted-foreground leading-relaxed italic">
                  Akun Anda belum melewati verifikasi KYC. Penjualan aset dan penarikan dana hanya tersedia untuk nasabah yang sudah terverifikasi oleh Admin.
                </p>
                <button onClick={() => router.push('/profile')} className="text-[9px] font-black text-primary uppercase underline mt-1">Lengkapi KYC Sekarang</button>
              </div>
            </div>
          )}
        </div>

        <div className="pb-10 space-y-6">
          <Button 
            disabled={amount === "0" || isProcessing || (activeTab === 'jual' && (!isVerified || !hasWithdrawalMethods))} 
            onClick={() => setIsCheckoutDialogOpen(true)} 
            className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl text-base tracking-widest transition-all"
          >
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 
              (!isVerified && activeTab === 'jual' ? 'KYC DIPERLUKAN' : (activeTab === 'beli' ? 'LANJUTKAN KE PEMBAYARAN' : 'LANJUTKAN PENJUALAN'))
            }
          </Button>
          
          <div className="grid grid-cols-3 gap-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">{n}</button>
            ))}
            <button onClick={() => setAmount(prev => prev.includes(',') ? prev : prev + ',')} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 transition-colors">
              <Delete className="w-7 h-7" />
            </button>
          </div>
        </div>
      </main>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={(open) => {
        setIsCheckoutDialogOpen(open);
        if (!open) {
          renderInProgress.current = false;
        }
      }}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-0 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="gold-gradient h-3 w-full" />
          <div className="p-8 space-y-8">
            <DialogHeader className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-2.5 mb-2"><LogoIcon className="text-white" /></div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">ALIBANK SECURE GATEWAY</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Konfirmasi {activeTab === 'beli' ? 'Pembelian' : 'Penjualan'} - {activeTab === 'beli' ? selectedPayment.name : selectedWithdrawalAccount?.provider}
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
              {activeTab === 'jual' ? (
                <div className="animate-in fade-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-muted/50 border border-border space-y-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase italic">Rekening Penerima</p>
                      <p className="text-base font-black italic uppercase">{selectedWithdrawalAccount?.provider}</p>
                      <p className="text-sm font-bold text-accent font-mono">{selectedWithdrawalAccount?.accountNumber}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">AN: {selectedWithdrawalAccount?.accountName}</p>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black text-muted-foreground uppercase">Status Node</p>
                      <Badge className="bg-green-500 text-white text-[7px] font-black uppercase h-4 px-2 border-none">Verified Payout</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => finalizeTransaction({ id: `WD-${Date.now()}`, gateway: "AliBank Internal Payout" })} 
                    disabled={isProcessing} 
                    className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : "KONFIRMASI PENJUALAN RIIL"}
                  </Button>
                </div>
              ) : selectedPayment.id === 'midtrans' ? (
                <div className="animate-in fade-in zoom-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-accent/5 border border-primary/20 flex flex-col items-center gap-4">
                    <QrCode className="w-32 h-32 text-primary opacity-40" />
                    <p className="text-[10px] font-bold text-muted-foreground text-center uppercase italic">
                      Gunakan Virtual Account atau QRIS untuk penyelesaian pembayaran instan.
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
                    <div 
                      ref={paypalContainerRef} 
                      className="w-full flex justify-center"
                      style={{ minHeight: '150px' }}
                    >
                       {!paypalReady && (
                         <div className="flex flex-col items-center gap-2">
                           <Loader2 className="animate-spin text-primary" />
                           <p className="text-[8px] font-black uppercase italic text-primary">Menyiapkan Tombol PayPal...</p>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in duration-500 space-y-6">
                  <div className="p-6 rounded-[1.5rem] bg-muted/50 border border-border space-y-4">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase italic">Bank AliBank Center (BCA)</p>
                      <div className="flex justify-between items-center">
                        <span className="text-base font-black italic uppercase">8829 4410 0021</span>
                        <Copy className="w-4 h-4 text-primary cursor-pointer active:scale-90 transition-transform" onClick={() => { navigator.clipboard.writeText("882944100021"); toast({title: "Rekening Disalin"}); }} />
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground">AN: AliBank Vault Center</p>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-muted-foreground uppercase italic">
                        Jumlah Wajib Transfer
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-black text-primary italic">Rp {totalAmountIdr.toLocaleString('id-ID')}</span>
                        <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black">KODE: {uniqueCode}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase italic text-muted-foreground ml-1">Unggah Bukti Transfer</p>
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
              
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-4">
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

      <Sheet open={isCurrencySheetOpen} onOpenChange={(open) => {
        setIsCurrencySheetOpen(open);
        if (!open) setCurrencySearch("");
      }}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-[80vh] overflow-hidden flex flex-col">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6 shrink-0" />
          <div className="px-6 pb-2 shrink-0">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tight">Pilih Mata Uang</SheetTitle>
              <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pilih mata uang pembayaran default Anda.</SheetDescription>
            </SheetHeader>
            
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari Mata Uang atau Negara..."
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                className="h-12 pl-12 bg-muted/50 border-none rounded-xl text-xs font-bold placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none"
              />
            </div>
          </div>

          <div className="px-6 pb-6 overflow-y-auto no-scrollbar flex-1">
            <div className="space-y-1">
              {filteredCurrencies.map((c) => (
                <div 
                  key={c.code} 
                  onClick={() => handleCurrencySelect(c)}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all",
                    selectedCurrency.code === c.code ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm border-2 border-background shrink-0", 
                      c.color
                    )}>
                      {c.symbol.length > 2 ? c.code[0] : c.symbol}
                    </div>
                    <div>
                      <h4 className="text-base font-black italic uppercase leading-none">{c.code}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 italic">{c.name}</p>
                    </div>
                  </div>
                  {selectedCurrency.code === c.code && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
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
            <SheetHeader>
              <SheetTitle className="text-xl font-black italic uppercase tracking-tight">
                {activeTab === 'beli' ? 'Metode Pembayaran' : 'Metode Penerimaan'}
              </SheetTitle>
              {activeTab === 'jual' && (
                <SheetDescription className="text-[10px] font-bold uppercase italic">
                  Pilih salah satu rekening atau e-wallet yang telah Anda daftarkan di Profil.
                </SheetDescription>
              )}
            </SheetHeader>
            
            <div className="space-y-3 pt-4">
              {activeTab === 'beli' ? (
                PAYMENT_METHODS.map((method) => (
                  <div key={method.id} onClick={() => { setSelectedPayment(method as any); setIsPaymentSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer group", selectedPayment.id === method.id ? "border-primary bg-primary/5 shadow-lg" : "border-muted bg-card hover:border-primary/20")}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 overflow-hidden shadow-sm text-primary">
                        <method.icon className="w-5 h-5" />
                      </div>
                      <div><h4 className="text-sm font-black italic uppercase leading-none">{method.name}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{method.desc}</p></div>
                    </div>
                    {selectedPayment.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  {hasWithdrawalMethods ? (
                    userData.withdrawalMethods.map((method: any, idx: number) => (
                      <div 
                        key={idx} 
                        onClick={() => { setSelectedWithdrawalAccount(method); setIsPaymentSheetOpen(false); }} 
                        className={cn(
                          "p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer group", 
                          selectedWithdrawalAccount?.id === method.id ? "border-primary bg-primary/5 shadow-lg" : "border-muted bg-card hover:border-primary/20"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 shadow-sm text-primary">
                            <Landmark className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black italic uppercase leading-none">{method.provider}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{method.accountNumber} - {method.accountName}</p>
                          </div>
                        </div>
                        {selectedWithdrawalAccount?.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 space-y-6">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-20">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-muted-foreground uppercase italic px-10">
                        Anda belum mendaftarkan metode penerimaan (Bank/eWallet) di pengaturan profil Anda.
                      </p>
                      <Button onClick={() => router.push('/settings/wallet')} className="gold-gradient text-white rounded-xl h-12 px-8 font-black uppercase italic text-[10px]">
                        <Plus className="w-4 h-4 mr-2" /> Tambah Metode Sekarang
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
