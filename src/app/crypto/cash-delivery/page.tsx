
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  HelpCircle, 
  History, 
  X, 
  Info, 
  ChevronDown,
  RefreshCw,
  Sparkles,
  Delete,
  CheckCircle2,
  Loader2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, collection, increment, serverTimestamp } from "firebase/firestore";
import { proxyUpdateDoc, proxyAddDoc } from "@/lib/firestore-proxy-client";
import { useToast } from "@/hooks/use-toast";

const channels = [
  { id: 'bca', name: "BCA", type: "P2P / INSTAN" },
  { id: 'mandiri', name: "Bank Mandiri", type: "P2P / INSTAN" },
  { id: 'bri', name: "Bank BRI", type: "P2P / INSTAN" },
  { id: 'bni', name: "Bank BNI", type: "P2P / INSTAN" },
  { id: 'bsi', name: "Bank Syariah Indonesia (BSI)", type: "P2P / INSTAN" },
  { id: 'permata', name: "Bank Permata", type: "P2P" },
  { id: 'dana', name: "DANA (Indonesia)", type: "E-WALLET" },
  { id: 'ovo', name: "OVO", type: "E-WALLET" },
  { id: 'gopay', name: "GoPay", type: "E-WALLET" },
  { id: 'transfer_bank', name: "Transfer Bank Lainnya", type: "P2P" },
];

function CashIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16 flex items-center justify-center", className)}>
      <div className="absolute inset-0 bg-slate-100 rounded-full border border-slate-200 shadow-inner" />
      <div className="relative z-10 w-10 h-6 bg-yellow-400 rounded-sm border-2 border-slate-800 flex items-center justify-center shadow-lg">
        <div className="w-6 h-3 border border-slate-800/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-800 rounded-full" />
        </div>
        <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-slate-800 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-[3px] border-l-white border-y-[2px] border-y-transparent ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export default function CashDeliveryPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const userDocRef = useMemoFirebase(
    () => (!db || !user ? null : doc(db, "users", user.uid)),
    [db, user]
  );
  const { data: userData } = useDoc(userDocRef);

  const [usdToIdrRate, setUsdToIdrRate] = useState<number>(16850);
  const [showBanner, setShowBanner] = useState(true);
  const [activeChannel, setActiveChannel] = useState<string>('bca');
  
  // Input states
  const [amountMenerima, setAmountMenerima] = useState("0");
  const [amountBayar, setAmountBayar] = useState("0");
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeInput, setActiveInput] = useState<'menerima' | 'bayar'>('menerima');

  // Track if user has modified the value
  const [menerimaModified, setMenerimaModified] = useState(false);
  const [bayarModified, setBayarModified] = useState(false);

  // Quote & Recipient Modal
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/forex/rate")
      .then((r) => r.json())
      .then((d) => {
        if (d?.rate && Number(d.rate) > 10000) {
          setUsdToIdrRate(Number(d.rate));
        }
      })
      .catch(() => {});
  }, []);

  const usdtBalance = useMemo(() => {
    return Number(userData?.cryptoBalances?.USDT || 0);
  }, [userData]);

  const minIdr = 25000;
  const minUsdt = Number((minIdr / usdToIdrRate).toFixed(4));

  const currentMenerima = parseFloat(amountMenerima.replace(',', '.')) || 0;
  const currentBayar = parseFloat(amountBayar) || 0;

  const isMenerimaTooLow = menerimaModified && currentMenerima > 0 && currentMenerima < minIdr;
  const isBayarTooLow = bayarModified && currentBayar > 0 && currentBayar < minUsdt;

  const syncFromMenerima = (idrStr: string) => {
    setAmountMenerima(idrStr);
    setMenerimaModified(true);
    const idrVal = parseFloat(idrStr.replace(',', '.')) || 0;
    if (idrVal > 0) {
      setAmountBayar((idrVal / usdToIdrRate).toFixed(4));
      setBayarModified(true);
    } else {
      setAmountBayar("0");
      setBayarModified(false);
    }
  };

  const syncFromBayar = (usdtStr: string) => {
    setAmountBayar(usdtStr);
    setBayarModified(true);
    const usdtVal = parseFloat(usdtStr) || 0;
    if (usdtVal > 0) {
      setAmountMenerima(Math.round(usdtVal * usdToIdrRate).toString());
      setMenerimaModified(true);
    } else {
      setAmountMenerima("0");
      setMenerimaModified(false);
    }
  };

  const handleMaxUsdt = () => {
    if (usdtBalance <= 0) {
      toast({
        variant: "destructive",
        title: "Saldo USDT Kosong",
        description: "Anda belum memiliki saldo USDT untuk dicairkan.",
      });
      return;
    }
    syncFromBayar(usdtBalance.toFixed(4));
  };

  const handleKeyPress = (num: string) => {
    if (activeInput === 'menerima') {
      const next = (amountMenerima === "0.00" || amountMenerima === "0") ? num : amountMenerima + num;
      syncFromMenerima(next);
    } else {
      const next = (amountBayar === "0.00" || amountBayar === "0") ? num : amountBayar + num;
      syncFromBayar(next);
    }
  };

  const handleDelete = () => {
    if (activeInput === 'menerima') {
      if (amountMenerima.length > 1) {
        syncFromMenerima(amountMenerima.slice(0, -1));
      } else {
        syncFromMenerima("0");
        setMenerimaModified(false);
      }
    } else {
      if (amountBayar.length > 1) {
        syncFromBayar(amountBayar.slice(0, -1));
      } else {
        syncFromBayar("0");
        setBayarModified(false);
      }
    }
  };

  const handleComma = () => {
    if (activeInput === 'menerima' && !amountMenerima.includes(".")) {
      setMenerimaModified(true);
      setAmountMenerima(prev => prev + ".");
    } else if (activeInput === 'bayar' && !amountBayar.includes(".")) {
      setBayarModified(true);
      setAmountBayar(prev => prev + ".");
    }
  };

  const selectedChannelName = useMemo(() => {
    return channels.find((c) => c.id === activeChannel)?.name || "Transfer Bank";
  }, [activeChannel]);

  // Button logic: lights up yellow as soon as minimum is reached
  const isButtonActive = currentMenerima >= minIdr && currentBayar >= minUsdt;

  const handleOpenQuote = () => {
    if (!isButtonActive) return;
    if (!activeChannel) {
      setActiveChannel('bca');
    }
    if (currentBayar > usdtBalance) {
      toast({
        variant: "destructive",
        title: "Saldo USDT Tidak Cukup",
        description: `Saldo tersedia ${usdtBalance.toFixed(4)} USDT, dibutuhkan ${currentBayar.toFixed(4)} USDT.`,
      });
      return;
    }
    setShowKeypad(false);
    if (!accountName && userData?.name) {
      setAccountName(userData.name);
    }
    setShowQuoteDialog(true);
  };

  const handleConfirmCashDelivery = async () => {
    if (!user || !db || !userDocRef) return;
    const cleanAcc = accountNumber.replace(/\D/g, "");
    if (cleanAcc.length < 6) {
      toast({
        variant: "destructive",
        title: "Nomor Rekening / Akun Tidak Valid",
        description: "Masukkan nomor rekening bank atau nomor HP e-wallet minimal 6 digit.",
      });
      return;
    }
    if (accountName.trim().length < 2) {
      toast({
        variant: "destructive",
        title: "Nama Penerima Wajib Diisi",
        description: "Masukkan nama lengkap pemilik rekening atau akun tujuan.",
      });
      return;
    }
    if (currentBayar > usdtBalance) {
      toast({
        variant: "destructive",
        title: "Saldo USDT Tidak Cukup",
        description: "Saldo USDT Anda tidak mencukupi.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await proxyUpdateDoc(userDocRef, {
        "cryptoBalances.USDT": increment(-currentBayar),
      });

      const txDoc = await proxyAddDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Pengiriman Tunai: ${currentBayar} USDT -> Rp ${Math.round(currentMenerima).toLocaleString("id-ID")} ke ${selectedChannelName} (${cleanAcc})`,
        category: "Withdraw",
        asset: "USDT",
        amount: Math.round(currentMenerima),
        cryptoAmount: currentBayar,
        cryptoCurrency: "USDT",
        type: "expense",
        status: "pending",
        bankDetails: {
          bank: activeChannel || "bca",
          bankName: selectedChannelName,
          accountNumber: cleanAcc,
          accountName: accountName.trim(),
        },
        timestamp: serverTimestamp(),
      });

      await proxyAddDoc(collection(db, "topup_requests"), {
        type: "cash_delivery",
        userId: user.uid,
        userName: userData?.name || user.displayName || user.email?.split("@")[0] || "Nasabah AliBank",
        userEmail: user.email || "",
        asset: "IDR",
        amount: Math.round(currentMenerima),
        totalToTransfer: Math.round(currentMenerima),
        cryptoAsset: "USDT",
        cryptoAmount: currentBayar,
        txDocId: txDoc.id,
        bankDetails: {
          bank: activeChannel || "bca",
          bankName: selectedChannelName,
          accountNumber: cleanAcc,
          accountName: accountName.trim(),
        },
        status: "pending",
        createdAt: serverTimestamp(),
      });

      await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `CD-REQ-${Date.now()}`,
        category: "Cash Delivery",
        amountIdr: Math.round(currentMenerima),
        cryptoAmount: currentBayar,
        cryptoCurrency: "USDT",
        description: `Cash Delivery: ${currentBayar} USDT (Rp ${Math.round(currentMenerima).toLocaleString("id-ID")}) ke ${selectedChannelName} (${cleanAcc} a.n. ${accountName.trim()}).`,
        status: "pending_verification",
        timestamp: serverTimestamp(),
        userEmail: user.email,
      });

      await proxyAddDoc(collection(db, "users", user.uid, "notifications"), {
        title: "Pengiriman Tunai Diproses",
        message: `Penukaran ${currentBayar} USDT menjadi Rp ${Math.round(currentMenerima).toLocaleString("id-ID")} ke ${selectedChannelName} (${cleanAcc}) sedang diproses oleh Pusat Kliring.`,
        type: "info",
        read: false,
        createdAt: new Date().toISOString(),
      });

      setShowQuoteDialog(false);
      setIsSuccess(true);
      toast({
        title: "Pengiriman Tunai Diajukan",
        description: `Dana Rp ${Math.round(currentMenerima).toLocaleString("id-ID")} sedang diproses ke ${selectedChannelName}.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Memproses",
        description: err.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
          <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-black italic uppercase tracking-tight">Pengiriman Tunai Diproses</h2>
          <p className="text-xs font-bold text-slate-500">
            Kuotasi <span className="text-slate-900 font-black">{currentBayar} USDT</span> telah dikunci untuk pencairan{" "}
            <span className="text-amber-600 font-black">Rp {Math.round(currentMenerima).toLocaleString("id-ID")}</span> ke{" "}
            <span className="text-slate-900 font-black">{selectedChannelName} ({accountNumber})</span>.
          </p>
        </div>
        <div className="w-full max-w-sm flex flex-col gap-3">
          <Button
            onClick={() => router.push("/withdraw")}
            className="w-full h-12 bg-[#FCD535] text-slate-900 hover:bg-[#FCD535]/90 font-black italic uppercase rounded-2xl"
          >
            Lihat Status Kliring
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/")}
            className="w-full h-12 font-black italic uppercase rounded-2xl"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white text-slate-900 flex flex-col font-body overflow-hidden">
      {/* Header - Fixed */}
      <header className="px-4 h-14 flex items-center justify-between bg-white z-50 shrink-0">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/withdraw")} className="p-1 hover:bg-slate-100 rounded-full" title="Riwayat Penarikan">
            <History className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 px-6 pt-2 space-y-6 overflow-y-auto no-scrollbar pb-20">
        {/* Banner */}
        {showBanner && (
          <div className="bg-[#FFFBEB] border border-yellow-100 rounded-2xl p-4 flex items-start gap-3 relative animate-in fade-in slide-in-from-top-2">
            <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="pr-6">
              <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                Layanan ini tunduk pada <span className="text-yellow-600 font-bold">Ketentuan Penggunaan AliBank Pay</span> dan <span className="text-yellow-600 font-bold">Ketentuan Penggunaan Pengiriman Tunai</span>.
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Title Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Pengiriman Tunai</h1>
          <p className="text-xs font-bold text-slate-400 leading-tight">Kirim kripto dan terima fiat. Cepat, aman, tarif menguntungkan (1 USDT ≈ Rp {usdToIdrRate.toLocaleString("id-ID")})</p>
        </div>

        {/* Input Terminal */}
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Akan Menerima</label>
            <div 
              onClick={() => { setShowKeypad(true); setActiveInput('menerima'); }}
              className={cn(
                "bg-slate-50 rounded-2xl p-4 flex items-center justify-between border-2 transition-all shadow-sm cursor-pointer",
                activeInput === 'menerima' && showKeypad ? "border-yellow-400" : "border-transparent"
              )}
            >
              <input
                type="number"
                value={amountMenerima === "0" && !menerimaModified ? "" : amountMenerima}
                placeholder="0.00"
                onFocus={() => setActiveInput('menerima')}
                onChange={(e) => syncFromMenerima(e.target.value || "0")}
                className="text-2xl font-black italic tracking-tighter w-1/2 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-300"
              />
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-[8px] font-black text-white">ID</div>
                <span className="text-sm font-black italic">IDR | ID</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            {isMenerimaTooLow && (
              <p className="text-[10px] font-bold text-rose-500 italic mt-1 px-1">Jumlah minimum adalah Rp {minIdr.toLocaleString("id-ID")} IDR</p>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Anda Bayar</label>
            <div 
              onClick={() => { setShowKeypad(true); setActiveInput('bayar'); }}
              className={cn(
                "bg-slate-50 rounded-2xl p-4 flex items-center justify-between border-2 transition-all shadow-sm cursor-pointer",
                activeInput === 'bayar' && showKeypad ? "border-yellow-400" : "border-transparent"
              )}
            >
              <input
                type="number"
                step="0.0001"
                value={amountBayar === "0" && !bayarModified ? "" : amountBayar}
                placeholder="0.00"
                onFocus={() => setActiveInput('bayar')}
                onChange={(e) => syncFromBayar(e.target.value || "0")}
                className="text-2xl font-black italic tracking-tighter w-1/2 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-300"
              />
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white p-1">
                  <RefreshCw className="w-full h-full" />
                </div>
                <span className="text-sm font-black italic">USDT</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex flex-col gap-1 px-1">
              {isBayarTooLow && (
                <p className="text-[10px] font-bold text-rose-500 italic">Jumlah minimum adalah {minUsdt} USDT</p>
              )}
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-slate-500">
                  Saldo Spot & Pendanaan: <span className="text-slate-900 font-black">{usdtBalance.toLocaleString("id-ID", { maximumFractionDigits: 4 })} USDT</span>
                </p>
                <button
                  type="button"
                  onClick={handleMaxUsdt}
                  className="text-[10px] font-black text-yellow-600 uppercase hover:underline"
                >
                  Maks.
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight px-1">Pilih Saluran Pencairan</h2>
          <div className="space-y-3">
            {channels.map((channel) => (
              <div 
                key={channel.id}
                onClick={() => { setActiveChannel(channel.id); setShowKeypad(false); }}
                className={cn(
                  "p-5 rounded-2xl border-2 bg-white flex items-center justify-between group transition-all cursor-pointer shadow-sm active:scale-[0.98]",
                  activeChannel === channel.id ? "border-yellow-400 bg-yellow-50/10" : "border-slate-50"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black italic uppercase">{channel.name}</h3>
                    <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-none h-4 px-1.5 uppercase tracking-tighter">{channel.type}</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Transfer ke rekening/akun Anda | Bebas Biaya (0%)</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black italic text-slate-900">
                    {currentMenerima > 0 ? `Rp ${Math.round(currentMenerima).toLocaleString("id-ID")}` : `Rp ${usdToIdrRate.toLocaleString("id-ID")}/USDT`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tutorial Section */}
        <div className="pt-8 pb-12 flex flex-col items-center text-center space-y-6 relative">
          <div className="absolute right-0 top-0">
            <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-500 border border-slate-50 active:scale-95 transition-transform cursor-pointer">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <CashIcon />
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Tutorial Pengiriman Tunai</h3>
          </div>
          <div className="space-y-4 w-full px-4 text-left">
            {[
              "Masukkan jumlah yang ingin Anda Bayar (USDT) atau yang akan Anda Terima (IDR)",
              "Pilih saluran bank atau e-wallet dan masukkan nomor rekening penerima",
              "Konfirmasi kuotasi dan dana IDR akan dikirimkan ke rekening Anda"
            ].map((text, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-yellow-500 font-black italic text-sm mt-0.5">{i + 1}</span>
                <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">{text}</p>
              </div>
            ))}
          </div>
          <div className="pt-10 space-y-4 w-full text-center">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <LogoIcon className="w-4 h-4 grayscale opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">AliBank Pay</span>
            </div>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter px-10 leading-tight">
              Dipersembahkan oleh P2P<br />
              Kirim Uang Tunai ke rekening bank atau e-wallet Anda sendiri
            </p>
            <p className="text-[9px] font-black text-slate-200">Version: 1.67.33</p>
          </div>
        </div>
      </main>

      {/* Sticky Bottom Area */}
      <footer className="bg-white border-t border-slate-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-50 shrink-0">
        <div className="px-6 py-4">
          <Button 
            onClick={handleOpenQuote}
            disabled={!isButtonActive}
            className={cn(
              "w-full h-14 font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all",
              isButtonActive
                ? "bg-[#FCD535] text-slate-900 hover:bg-[#FCD535]/90 shadow-lg opacity-100" 
                : "bg-slate-100 text-slate-300 cursor-not-allowed opacity-50"
            )}
          >
            Dapatkan Kuotasi
          </Button>
        </div>

        {/* Custom Numeric Keypad */}
        {showKeypad && (
          <div className="bg-white border-t border-slate-100 grid grid-cols-3 gap-y-1 pb-8 animate-in slide-in-from-bottom-10 duration-300">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} type="button" onClick={() => handleKeyPress(n.toString())} className="text-2xl font-bold active:bg-slate-50 py-4 transition-colors">{n}</button>
            ))}
            <button type="button" onClick={handleComma} className="text-2xl font-bold active:bg-slate-50 py-4 transition-colors">.</button>
            <button type="button" onClick={() => handleKeyPress("0")} className="text-2xl font-bold active:bg-slate-50 py-4 transition-colors">0</button>
            <button type="button" onClick={handleDelete} className="flex items-center justify-center active:bg-slate-50 py-4 transition-colors">
              <Delete className="w-6 h-6 text-slate-700" />
            </button>
          </div>
        )}
      </footer>

      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="max-w-md rounded-3xl bg-white text-slate-900 border border-slate-100 p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black italic uppercase tracking-tight text-slate-900">
              Kuotasi Pengiriman Tunai
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500">
              Masukkan detail rekening {selectedChannelName} tujuan pencairan dana.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase">Saluran Tujuan</span>
                <span className="font-black text-slate-900">{selectedChannelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase">Anda Bayar</span>
                <span className="font-black text-slate-900">{currentBayar} USDT</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-400 uppercase">Kurs Kuotasi</span>
                <span className="font-bold text-slate-700">1 USDT = Rp {usdToIdrRate.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-black text-slate-900 uppercase">Dana Diterima</span>
                <span className="text-base font-black text-amber-600 italic">
                  Rp {Math.round(currentMenerima).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Nomor Rekening / Nomor Akun ({selectedChannelName})
              </label>
              <Input
                placeholder="Contoh: 1234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-black"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Nama Pemilik Rekening
              </label>
              <Input
                placeholder="Nama Lengkap Sesuai Rekening"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 text-slate-900 font-black"
              />
            </div>

            <Button
              onClick={handleConfirmCashDelivery}
              disabled={isSubmitting || !accountNumber || !accountName}
              className="w-full h-14 bg-[#FCD535] text-slate-900 hover:bg-[#FCD535]/90 font-black italic uppercase rounded-2xl shadow-lg"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Pengiriman Tunai"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
