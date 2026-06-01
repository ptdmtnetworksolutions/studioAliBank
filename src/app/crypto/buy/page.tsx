
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
  Search,
  Wifi,
  X,
  Banknote,
  Clock
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
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [selectedPayment, setSelectedPayment] = useState(PAYMENT_METHODS[0]);
  const [dynamicUsdtRate, setDynamicUsdtRate] = useState(15850);
  const [isRateLoading, setIsRateLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string>("");
  
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [isCurrencySheetOpen, setIsCurrencySheetOpen] = useState(false);
  const [isCheckoutDialogOpen, setIsCheckoutDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalRendered, setPaypalRendered] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'pending_verification' | 'success'>('input');
  
  // Bank transfer state
  const [bankStep, setBankStep] = useState<'instructions' | 'upload'>('instructions');
  const [uniqueCode, setUniqueCode] = useState(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const [currencySearch, setCurrencySearch] = useState("");
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const renderInProgress = useRef(false);
  const retryCount = useRef(0);

  // Check if PayPal SDK is already loaded (e.g. page reload / script cached)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.paypal) {
      setPaypalReady(true);
    }
  }, []);

  const apiKeysRef = useMemoFirebase(() => (db && user ? doc(db, "system", "public_keys") : null), [db, user]);
  const { data: systemKeys } = useDoc(apiKeysRef);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const fetchRealTimeRate = useCallback(async () => {
    try {
      setIsRateLoading(true);
      const res = await fetch(`/api/market/ticker?symbol=USDTIDRT&t=${Date.now()}`, { 
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.lastPrice) {
          const newRate = parseFloat(data.lastPrice);
          setDynamicUsdtRate(newRate);
          setLastSync(new Date().toLocaleTimeString());
          setIsRateLoading(false);
        }
      } else {
        throw new Error('Upstream failed');
      }
    } catch (e) {
      console.warn("Real-time rate sync failed, maintaining previous state:", e);
      setIsRateLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchRealTimeRate();
    const interval = setInterval(fetchRealTimeRate, 15000);
    return () => clearInterval(interval);
  }, [fetchRealTimeRate]);

  const getRateToIdr = useCallback((code: string) => {
    if (code === 'IDR') return 1;
    if (code === 'USD') return dynamicUsdtRate;
    const rates: Record<string, number> = {
      'EUR': dynamicUsdtRate * 1.08,
      'GBP': dynamicUsdtRate * 1.26,
      'SGD': dynamicUsdtRate * 0.74,
      'AUD': dynamicUsdtRate * 0.65,
      'JPY': dynamicUsdtRate * 0.0066,
      'MYR': dynamicUsdtRate * 0.21,
    };
    return rates[code] || dynamicUsdtRate;
  }, [dynamicUsdtRate]);

  const totalAmountIdr = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return 0;
    const baseAmountIdr = num * getRateToIdr(selectedCurrency.code);
    return Math.floor(baseAmountIdr);
  }, [amount, selectedCurrency, getRateToIdr]);

  const estimatedCrypto = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num) || num <= 0) return "0";
    const amountInIdr = num * getRateToIdr(selectedCurrency.code);
    const amountInUsd = amountInIdr / dynamicUsdtRate;
    const priceWithMarkup = selectedAsset.priceUsd * (selectedAsset.isNative ? 1 : 1.02);
    return (amountInUsd / priceWithMarkup).toFixed(selectedAsset.symbol === 'BTC' ? 8 : 4);
  }, [amount, selectedAsset, selectedCurrency, getRateToIdr, dynamicUsdtRate]);

  const usdValue = useMemo(() => {
    const cleanAmount = amount.replace(',', '.');
    const num = parseFloat(cleanAmount);
    if (isNaN(num)) return "0.00";
    const amountInIdr = num * getRateToIdr(selectedCurrency.code);
    return (amountInIdr / dynamicUsdtRate).toFixed(2);
  }, [amount, selectedCurrency, getRateToIdr, dynamicUsdtRate]);

  const handleKeyPress = (num: string) => {
    if (amount === "0") setAmount(num);
    else if (amount.length < 12) setAmount(amount + num);
  };

  const handleDelete = () => {
    setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
  };

  const finalizeTransaction = async (paymentDetails: any) => {
    if (!user || !db || !userDocRef || !userData) return;
    setIsProcessing(true);
    
    const cryptoAmount = parseFloat(estimatedCrypto);
    const fiatAmountIdr = totalAmountIdr;

    try {
      const userUpdates: any = {};
      
      if (activeTab === 'jual') {
        const userCryptoBalance = userData?.cryptoBalances?.[selectedAsset.symbol] ?? 0;
        if (userCryptoBalance < cryptoAmount) {
          throw new Error(`Saldo ${selectedAsset.symbol} Anda tidak mencukupi untuk melakukan penjualan.`);
        }
        userUpdates[`cryptoBalances.${selectedAsset.symbol}`] = increment(-cryptoAmount);
        userUpdates.totalBalance = increment(fiatAmountIdr);
      } else {
        userUpdates[`cryptoBalances.${selectedAsset.symbol}`] = increment(cryptoAmount);
      }

      await updateDoc(userDocRef, userUpdates);
      
      if (activeTab === 'jual') {
        await updateDoc(doc(db, "system", "liquidity"), {
          totalUsdInjected: increment(-parseFloat(usdValue)),
          totalFiatInjected: increment(-fiatAmountIdr)
        });
      } else {
        await updateDoc(doc(db, "system", "liquidity"), {
          totalUsdInjected: increment(parseFloat(usdValue)),
          totalFiatInjected: increment(fiatAmountIdr)
        });
      }

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `${activeTab === 'jual' ? 'SELL' : 'BUY'}-${paymentDetails.id || Date.now()}`,
        category: "Market Execution",
        gateway: activeTab === 'jual' ? "Saldo Dompet" : (paymentDetails.gateway || selectedPayment.name),
        amountIdr: fiatAmountIdr,
        cryptoAmount: cryptoAmount,
        cryptoCurrency: selectedAsset.symbol,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user.email
      });

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: activeTab === 'jual' 
          ? `Jual ${selectedAsset.symbol} ke Saldo Dompet` 
          : `Beli ${selectedAsset.symbol} via ${paymentDetails.gateway || selectedPayment.name}`,
        category: "Trading",
        amount: fiatAmountIdr,
        cryptoAmount: cryptoAmount,
        cryptoCurrency: selectedAsset.symbol,
        type: 'income',
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

  // Initialize bank transfer: generate unique code and show instructions
  const handleInitBankTransfer = () => {
    const code = Math.floor(100 + Math.random() * 899);
    setUniqueCode(code);
    setBankStep('instructions');
    setProofFile(null);
    setProofPreview(null);
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setBankStep('upload');
  };

  const handleSubmitBankTransfer = async () => {
    if (!user || !db || !userData) return;
    setIsUploadingProof(true);
    const finalAmount = totalAmountIdr + uniqueCode;

    try {
      let proofImageUrl = "";

      // Upload proof image if provided
      if (proofFile && storage) {
        const storageRef = ref(storage, `transfer_proofs/${user.uid}/${Date.now()}_${proofFile.name}`);
        await uploadBytes(storageRef, proofFile);
        proofImageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "topup_requests"), {
        userId: user.uid,
        userName: userData.name || user.email,
        userEmail: user.email,
        amount: totalAmountIdr,
        uniqueCode: uniqueCode,
        totalToTransfer: finalAmount,
        asset: selectedAsset.symbol,
        estimatedAsset: parseFloat(estimatedCrypto),
        proofImage: proofImageUrl,
        status: "pending",
        type: "bank_transfer",
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });

      setIsCheckoutDialogOpen(false);
      setStep('pending_verification');
      toast({ title: "Bukti Dikirim", description: "Admin akan memverifikasi dalam 1x24 jam." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengirim Bukti", description: err.message });
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleMidtransPayment = async () => {
    if (!user || !db) {
      toast({ variant: "destructive", title: "Sesi Tidak Valid", description: "Silakan login ulang." });
      return;
    }

    // Check if Snap SDK is loaded
    if (typeof window === 'undefined' || !window.snap) {
      toast({ 
        variant: "destructive", 
        title: "Gateway Belum Siap", 
        description: "SDK Midtrans Snap sedang dimuat. Tunggu beberapa detik lalu coba lagi." 
      });
      return;
    }

    if (!systemKeys?.midtransClientKey) {
      toast({ variant: "destructive", title: "Konfigurasi Error", description: "Gateway Midtrans belum aktif di Vault. Hubungi admin." });
      return;
    }
    
    setIsProcessing(true);
    try {
      const orderId = `ALIBANK-BUY-${Date.now()}`;
      const res = await createMidtransSnapTokenAction(
        orderId,
        totalAmountIdr,
        userData?.name || user.email || "User",
        user.email || ""
      );

      if (!res.token) {
        throw new Error('Token pembayaran tidak diterima dari Midtrans.');
      }

      window.snap.pay(res.token, {
        onSuccess: (result: any) => {
          setIsProcessing(false);
          finalizeTransaction({ id: result.transaction_id, gateway: "Midtrans Snap" });
        },
        onPending: (result: any) => {
          setIsProcessing(false);
          setIsCheckoutDialogOpen(false);
          setStep('pending_verification');
          toast({ title: "Pembayaran Tertunda", description: "Selesaikan pembayaran sesuai instruksi Midtrans." });
        },
        onError: (result: any) => {
          setIsProcessing(false);
          toast({ variant: "destructive", title: "Pembayaran Gagal", description: "Terjadi kesalahan di gateway Midtrans." });
        },
        onClose: () => {
          setIsProcessing(false);
        }
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Snap Error", description: err.message });
      setIsProcessing(false);
    }
  };
  // Reset bank transfer state when dialog opens
  useEffect(() => {
    if (isCheckoutDialogOpen && selectedPayment.id === 'bank') {
      setBankStep('instructions');
      setUniqueCode(0);
      setProofFile(null);
      setProofPreview(null);
    }
  }, [isCheckoutDialogOpen, selectedPayment.id]);

  const renderPayPalButtons = useCallback(async () => {
    if (!paypalContainerRef.current || !isCheckoutDialogOpen || !systemKeys?.paypalClientId) return;
    if (selectedPayment.id !== 'card') return;

    // Check both the state flag and the actual window object
    const paypalSdkLoaded = (typeof window !== 'undefined') && !!window.paypal;
    if (!paypalSdkLoaded) {
      if (retryCount.current < 30) {
        retryCount.current++;
        setTimeout(renderPayPalButtons, 500);
      } else {
        setGatewayError("Gagal memuat SDK PayPal. Periksa koneksi internet Anda dan muat ulang halaman.");
      }
      return;
    }

    if (renderInProgress.current) return;
    renderInProgress.current = true;
    setGatewayError(null);

    // Clear any previous buttons
    if (paypalContainerRef.current) {
      paypalContainerRef.current.innerHTML = "";
    }

    try {
      await window.paypal.Buttons({
        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
        createOrder: (_data: any, actions: any) => {
          return actions.order.create({
            purchase_units: [{
              amount: { currency_code: "USD", value: usdValue },
              description: `AliBank Buy: ${estimatedCrypto} ${selectedAsset.symbol}`
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
          setIsProcessing(true);
          try {
            const details = await actions.order.capture();
            if (details.status === 'COMPLETED') {
              await finalizeTransaction({ id: details.id, gateway: "PayPal" });
            }
          } catch (err) {
            toast({ variant: "destructive", title: "Kliring Gagal", description: "Pembayaran tidak dapat diselesaikan." });
          } finally {
            setIsProcessing(false);
          }
        },
        onCancel: () => {
          renderInProgress.current = false;
        },
        onError: (_err: any) => {
          setGatewayError("Hambatan node PayPal terdeteksi. Silakan coba lagi.");
          renderInProgress.current = false;
        }
      }).render(paypalContainerRef.current);
      setPaypalRendered(true);
      renderInProgress.current = false;
    } catch (err) {
      renderInProgress.current = false;
      if (retryCount.current < 5) {
        retryCount.current++;
        setTimeout(renderPayPalButtons, 1500);
      } else {
        setGatewayError("Gagal merender tombol PayPal.");
      }
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, usdValue, estimatedCrypto, selectedAsset.symbol, systemKeys?.paypalClientId, toast]);

  useEffect(() => {
    if (isCheckoutDialogOpen && selectedPayment.id === 'card') {
      retryCount.current = 0;
      renderInProgress.current = false;
      setPaypalRendered(false);
      setGatewayError(null);
      // Small delay to let DOM settle, then try rendering
      setTimeout(renderPayPalButtons, 600);
    }
  }, [isCheckoutDialogOpen, selectedPayment.id, renderPayPalButtons]);

  // When paypalReady fires (onLoad callback), trigger rendering if dialog is open
  useEffect(() => {
    if (paypalReady && isCheckoutDialogOpen && selectedPayment.id === 'card' && !paypalRendered) {
      retryCount.current = 0;
      renderInProgress.current = false;
      setTimeout(renderPayPalButtons, 300);
    }
  }, [paypalReady, isCheckoutDialogOpen, selectedPayment.id, paypalRendered, renderPayPalButtons]);

  if (!mounted) return null;

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase text-center mb-2">
          {activeTab === 'jual' ? "Penjualan Berhasil" : "Pembelian Berhasil"}
        </h2>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 space-y-4 mb-8 text-center shadow-2xl">
          <p className="text-[10px] font-black text-muted-foreground uppercase">
            {activeTab === 'jual' ? "Jumlah Dikreditkan" : "Jumlah Diterima"}
          </p>
          <p className="text-3xl font-black text-primary italic">
            {activeTab === 'jual' ? `Rp ${totalAmountIdr.toLocaleString('id-ID')}` : `${estimatedCrypto} ${selectedAsset.symbol}`}
          </p>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl" onClick={() => router.push('/')}>Beranda</Button>
      </div>
    );
  }

  if (step === 'pending_verification') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black italic uppercase mb-2">Menunggu Verifikasi</h2>
        <p className="text-xs text-muted-foreground uppercase mb-8 italic">Permintaan pengisian saldo Anda telah masuk ke antrean kliring.</p>
        <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 space-y-4 mb-8 shadow-2xl text-center">
          <p className="text-[10px] font-black uppercase">Instruksi Pembayaran</p>
          <p className="text-2xl font-black text-foreground italic">Cek Detail di Pusat Kliring</p>
          <div className="pt-4 border-t border-primary/5">
             <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
               Saldo akan otomatis masuk setelah Admin memverifikasi dana riil di rekening bank.
             </p>
          </div>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl" onClick={() => router.push('/')}>Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      {systemKeys?.paypalClientId && (
        <Script 
          key={`paypal-sdk-${systemKeys.paypalClientId}`}
          src={`https://www.paypal.com/sdk/js?client-id=${systemKeys.paypalClientId}&currency=USD&intent=capture`} 
          strategy="afterInteractive"
          onLoad={() => {
            setPaypalReady(true);
          }}
          onError={() => {
            setGatewayError("Gagal menghubungi server kliring PayPal. Periksa koneksi internet Anda.");
          }}
        />
      )}
      <Script 
        src={systemKeys?.midtransClientKey?.startsWith('SB-') 
          ? "https://app.sandbox.midtrans.com/snap/snap.js" 
          : "https://app.midtrans.com/snap/snap.js"}
        data-client-key={systemKeys?.midtransClientKey}
      />
      
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black italic h-6 uppercase flex items-center gap-1.5 px-2.5">
             <Wifi className={cn("w-2.5 h-2.5", isRateLoading ? "animate-pulse text-amber-500" : "text-green-500")} />
             Kurs: Rp{isRateLoading ? "..." : dynamicUsdtRate.toLocaleString('id-ID')}
           </Badge>
           <button className="p-2 hover:bg-muted rounded-full" onClick={() => router.push('/transactions')}><History className="w-5 h-5 text-muted-foreground" /></button>
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
              <div className="flex items-center gap-1 cursor-pointer bg-muted/50 px-3 py-1.5 rounded-xl border border-border" onClick={() => setIsCurrencySheetOpen(true)}>
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
                <div><p className="text-xs font-black italic">{activeTab === 'jual' ? 'Jual' : 'Beli'}</p><div className="flex items-center gap-2"><span className="text-sm font-black text-foreground uppercase">{selectedAsset.symbol}</span><Badge className="bg-green-500/10 text-green-600 text-[7px] font-black h-4 px-1.5 border-none uppercase">Live Node</Badge></div></div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
            </div>
            
            <div 
              className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 cursor-pointer" 
              onClick={() => {
                if (activeTab !== 'jual') {
                  setIsPaymentSheetOpen(true);
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center p-2 shadow-sm text-primary">
                  {activeTab === 'jual' ? (
                    <Landmark className="w-5 h-5" />
                  ) : (
                    <selectedPayment.icon className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-black italic">
                    {activeTab === 'jual' ? "Penerima" : "Metode pembayaran"}
                  </p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">
                    {activeTab === 'jual' ? "Saldo Dompet AliBank (Instan)" : selectedPayment.name}
                  </p>
                </div>
              </div>
              {activeTab !== 'jual' && <ChevronRight className="w-4 h-4 text-muted-foreground/30" />}
            </div>
          </div>
        </div>

        <div className="pb-10 space-y-6">
          <Button disabled={amount === "0" || isProcessing} onClick={() => setIsCheckoutDialogOpen(true)} className="w-full h-16 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl text-base tracking-widest">
            {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : 'LANJUTKAN'}
          </Button>
          <div className="grid grid-cols-3 gap-y-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} onClick={() => handleKeyPress(n.toString())} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">{n}</button>
            ))}
            <button onClick={() => setAmount(prev => prev.includes(',') ? prev : prev + ',')} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">,</button>
            <button onClick={() => handleKeyPress("0")} className="text-3xl font-black italic active:bg-muted py-3 transition-colors">0</button>
            <button onClick={handleDelete} className="flex items-center justify-center active:bg-muted py-3 transition-colors"><Delete className="w-7 h-7" /></button>
          </div>
        </div>
      </main>

      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader className="text-left">
              <SheetTitle className="text-xl font-black italic uppercase tracking-tight">Metode Pembayaran</SheetTitle>
              <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase">Pilih gerbang kliring untuk penyelesaian dana.</SheetDescription>
            </SheetHeader>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <div 
                  key={method.id} 
                  onClick={() => { setSelectedPayment(method); setIsPaymentSheetOpen(false); }}
                  className={cn(
                    "p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer",
                    selectedPayment.id === method.id ? "border-primary bg-primary/5" : "border-muted bg-card"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary"><method.icon className="w-5 h-5" /></div>
                    <div className="text-left">
                      <p className="text-sm font-black italic uppercase">{method.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{method.desc}</p>
                    </div>
                  </div>
                  {selectedPayment.id === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isCheckoutDialogOpen} onOpenChange={setIsCheckoutDialogOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] bg-background border-none p-0 overflow-hidden shadow-2xl">
          <div className="gold-gradient h-3 w-full" />
          <div className="p-8 space-y-8">
            <DialogHeader className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl gold-gradient mx-auto flex items-center justify-center shadow-xl p-2.5 mb-2"><LogoIcon className="text-white" /></div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tight">
                {activeTab === 'jual' ? "ALIBANK CRYPTO EXCHANGE" : "ALIBANK SECURE GATEWAY"}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {activeTab === 'jual' 
                  ? `Konfirmasi Jual ${selectedAsset.symbol} ke Saldo Dompet` 
                  : `Konfirmasi Beli via ${selectedPayment.name}`}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted/50 rounded-[2rem] p-6 text-center space-y-2 border border-border">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                {activeTab === 'jual' ? "Total Diterima" : "Total Bayar"}
              </p>
              <h3 className="text-3xl font-black italic text-foreground">Rp {totalAmountIdr.toLocaleString('id-ID')}</h3>
              <p className="text-[10px] font-black text-primary uppercase">
                {activeTab === 'jual' 
                  ? `Menjual ≈ ${estimatedCrypto} ${selectedAsset.symbol}` 
                  : `≈ $ ${usdValue}`}
              </p>
            </div>

            <div className="space-y-4">
              {activeTab === 'jual' ? (
                <Button 
                  onClick={() => finalizeTransaction({ id: 'SELL-' + Date.now(), gateway: 'Saldo Dompet' })}
                  disabled={isProcessing}
                  className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : "KONFIRMASI PENJUALAN"}
                </Button>
              ) : selectedPayment.id === 'card' ? (
                <div className="min-h-[160px] flex flex-col items-center justify-center">
                  {gatewayError ? (
                    <div className="text-center p-4 space-y-3">
                      <ShieldAlert className="w-8 h-8 text-rose-500 mx-auto" />
                      <p className="text-[10px] font-bold text-rose-500 uppercase italic">{gatewayError}</p>
                      <button 
                        onClick={() => { setGatewayError(null); retryCount.current = 0; renderInProgress.current = false; setPaypalRendered(false); setTimeout(renderPayPalButtons, 300); }}
                        className="text-[9px] font-black uppercase underline text-primary"
                      >Coba Lagi</button>
                    </div>
                  ) : (
                    <>
                      {/* PayPal container - always rendered so ref is stable */}
                      <div ref={paypalContainerRef} className="w-full" style={{ minHeight: '150px' }} />
                      {/* Overlay loading spinner while PayPal SDK is loading */}
                      {(!paypalReady || !paypalRendered) && !gatewayError && (
                        <div className="flex flex-col items-center gap-3 py-4">
                          <Loader2 className="animate-spin text-primary w-6 h-6" />
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            {!paypalReady ? "Menghubungi server PayPal..." : "Memuat tombol pembayaran..."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : selectedPayment.id === 'midtrans' ? (
                <Button 
                  onClick={handleMidtransPayment} 
                  disabled={isProcessing}
                  className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-xl flex items-center justify-center gap-3"
                >
                  {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : <><Zap className="w-5 h-5" /> BAYAR DENGAN SNAP</>}
                </Button>
              ) : (
                // BANK TRANSFER FLOW
                <div className="space-y-4">
                  {bankStep === 'instructions' ? (
                    <div className="space-y-4">
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                        <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">Rekening Tujuan Transfer</p>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Bank</span>
                            <span className="text-sm font-black italic">BCA</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">No. Rekening</span>
                            <span className="text-sm font-black italic font-mono">3210902545</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Atas Nama</span>
                            <span className="text-sm font-black italic">DZ******* **I **DLO</span>
                          </div>
                        </div>
                        <div className="h-px bg-amber-500/20" />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-amber-700">Total Transfer (inc. kode unik)</span>
                          <span className="text-lg font-black italic text-amber-700">
                            Rp {uniqueCode > 0 ? (totalAmountIdr + uniqueCode).toLocaleString('id-ID') : totalAmountIdr.toLocaleString('id-ID')}
                          </span>
                        </div>
                        {uniqueCode > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Kode Unik (3 digit terakhir)</span>
                            <Badge className="bg-primary/20 text-primary font-black italic border-none text-sm px-3">{uniqueCode}</Badge>
                          </div>
                        )}
                      </div>
                      {uniqueCode === 0 ? (
                        <Button 
                          onClick={handleInitBankTransfer}
                          className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic shadow-xl"
                        >
                          <Banknote className="w-5 h-5 mr-2" /> Tampilkan Instruksi Transfer
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => setBankStep('upload')}
                          className="w-full h-14 bg-slate-800 text-white rounded-2xl font-black uppercase italic shadow-xl"
                        >
                          <Upload className="w-5 h-5 mr-2" /> Sudah Transfer? Upload Bukti
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Upload Bukti Transfer</p>
                      <input 
                        ref={proofInputRef}
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProofSelect}
                      />
                      {proofPreview ? (
                        <div className="relative rounded-2xl overflow-hidden border border-border">
                          <img src={proofPreview} alt="Bukti" className="w-full max-h-48 object-cover" />
                          <button 
                            onClick={() => { setProofFile(null); setProofPreview(null); }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => proofInputRef.current?.click()}
                          className="w-full h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Tap untuk pilih foto bukti transfer</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => setBankStep('instructions')}
                          className="h-12 rounded-xl font-black uppercase italic text-[10px]"
                        >
                          Kembali
                        </Button>
                        <Button 
                          onClick={handleSubmitBankTransfer}
                          disabled={isUploadingProof}
                          className="h-12 gold-gradient text-white rounded-xl font-black uppercase italic shadow-lg text-[10px]"
                        >
                          {isUploadingProof ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Konfirmasi</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex gap-3 mt-4">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">Node keamanan SSL AliBank V3 melindungi setiap transaksi Anda.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isCurrencySheetOpen} onOpenChange={setIsCurrencySheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-[80vh] overflow-hidden flex flex-col">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6 shrink-0" />
          <div className="px-6 pb-2 shrink-0">
            <SheetHeader className="text-left mb-6">
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tight">Pilih Mata Uang</SheetTitle>
              <SheetDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Pilih mata uang pembayaran.</SheetDescription>
            </SheetHeader>
            <div className="relative mb-4"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Cari Mata Uang..." value={currencySearch} onChange={(e) => setCurrencySearch(e.target.value)} className="h-12 pl-12 bg-muted/50 border-none rounded-xl text-xs font-bold" /></div>
          </div>
          <div className="px-6 pb-6 overflow-y-auto no-scrollbar flex-1">
            <div className="space-y-1">
              {currencies.filter(c => c.code.toLowerCase().includes(currencySearch.toLowerCase())).map((c) => (
                <div key={c.code} onClick={() => { setSelectedCurrency(c); setIsCurrencySheetOpen(false); setCurrencySearch(""); }} className={cn("flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all", selectedCurrency.code === c.code ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50")}>
                  <div className="flex items-center gap-4"><div className={cn("w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-xs shadow-sm border-2 border-background shrink-0", c.color)}>{c.symbol.length > 2 ? c.code[0] : c.symbol}</div><div><h4 className="text-base font-black italic uppercase leading-none">{c.code}</h4><p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 italic">{c.name}</p></div></div>
                  {selectedCurrency.code === c.code && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssetSheetOpen} onOpenChange={setIsAssetSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-background h-auto pb-10">
          <div className="w-10 h-1 bg-muted rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-6">
            <SheetHeader><SheetTitle className="text-xl font-black italic uppercase tracking-tight">Pilih Aset</SheetTitle></SheetHeader>
            <div className="space-y-2">
              {ASSETS.map((asset) => (
                <div key={asset.symbol} onClick={() => { setSelectedAsset(asset); setIsAssetSheetOpen(false); }} className={cn("p-5 rounded-2xl border-2 flex items-center justify-between transition-all cursor-pointer", selectedAsset.symbol === asset.symbol ? "border-primary bg-primary/5" : "border-muted bg-card hover:border-primary/10")}>
                  <div className="flex items-center gap-4"><div className={cn("w-10 h-10 rounded-full flex items-center justify-center p-2 shadow-md", asset.isNative ? "gold-gradient" : "bg-muted")}>{asset.isNative ? <LogoIcon className="text-white" /> : <div className="w-full h-full bg-slate-400 rounded-full flex items-center justify-center font-black text-white text-[10px]">{asset.symbol[0]}</div>}</div><div><h4 className="text-sm font-black italic uppercase leading-none">{asset.name}</h4><div className="flex items-center gap-2 mt-1.5"><span className="text-[10px] font-bold text-muted-foreground uppercase">{asset.symbol}</span></div></div></div>
                  <div className="text-right"><p className="text-sm font-black italic text-foreground">${asset.priceUsd.toLocaleString()}</p></div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
