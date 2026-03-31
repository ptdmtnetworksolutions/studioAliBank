
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calculator, 
  Delete, 
  Sparkles, 
  ChevronDown, 
  QrCode, 
  History,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  Globe,
  Share2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

const POS_CATEGORIES = [
  "Retail",
  "Food & Beverage",
  "Service",
  "Digital Goods",
  "Others"
];

export default function PosTerminalPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState("0");
  const [selectedCategory, setSelectedCategory] = useState("Retail");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'request'>('input');
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    if (amount === "0") {
      setAmount(num);
    } else {
      if (amount.length < 12) { // Limit to 999B
        setAmount(amount + num);
      }
    }
  };

  const handleDelete = () => {
    if (amount.length > 1) {
      setAmount(amount.slice(0, -1));
    } else {
      setAmount("0");
    }
  };

  const handleClear = () => setAmount("0");

  const handleGeneratePayment = async () => {
    if (!user || !db || amount === "0") return;
    
    setIsProcessing(true);
    const invoiceId = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const numericAmount = parseFloat(amount);

    try {
      // 1. Create Invoice in Firestore
      await addDoc(collection(db, "merchants", user.uid, "invoices"), {
        invoiceId,
        merchantId: user.uid,
        customerName: "POS Customer",
        amountIdr: numericAmount,
        amountUsd: parseFloat((numericAmount / 15850).toFixed(2)), // Approx conversion
        status: "unpaid",
        category: selectedCategory,
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp(),
        source: "POS_MACHINE_V3"
      });

      setActiveInvoiceId(invoiceId);
      setStep('request');
      toast({ title: "Permintaan Dibuat", description: `Invoice ${invoiceId} siap dibayar.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseRequest = () => {
    setStep('input');
    setAmount("0");
    setActiveInvoiceId(null);
  };

  const formattedAmount = parseFloat(amount).toLocaleString('id-ID');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body overflow-hidden">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-base font-black italic uppercase leading-none">POS TERMINAL</h1>
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mt-1">AliBank V3 Production</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-muted-foreground cursor-pointer" />
          <div className="w-8 h-8 rounded-lg gold-gradient p-1.5 shadow-lg">
            <LogoIcon className="text-white" />
          </div>
        </div>
      </header>

      {step === 'input' ? (
        <main className="flex-1 flex flex-col animate-in fade-in duration-500">
          {/* Display Area */}
          <div className="p-8 flex-1 flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Nominal Penjualan (IDR)</label>
                <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black italic">AUTO-SYNC</Badge>
              </div>
              <div className="flex items-end gap-2 overflow-hidden">
                <span className="text-3xl font-black text-primary/40 italic pb-2">Rp</span>
                <span className={cn(
                  "text-7xl font-black tracking-tighter italic transition-all truncate",
                  amount === "0" ? "text-muted-foreground/20" : "text-foreground"
                )}>
                  {formattedAmount}
                </span>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {POS_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase italic transition-all shrink-0 border",
                    selectedCategory === cat 
                      ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Keypad */}
          <div className="bg-muted/30 border-t border-border p-4 space-y-4 pb-10">
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button 
                  key={n} 
                  onClick={() => handleKeyPress(n.toString())} 
                  className="h-16 rounded-2xl bg-background border border-border shadow-sm text-2xl font-black italic active:scale-95 active:bg-muted transition-all flex items-center justify-center"
                >
                  {n}
                </button>
              ))}
              <button onClick={handleClear} className="h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-sm uppercase italic active:scale-95 transition-all">C</button>
              <button onClick={() => handleKeyPress("0")} className="h-16 rounded-2xl bg-background border border-border shadow-sm text-2xl font-black italic active:scale-95 transition-all flex items-center justify-center">0</button>
              <button onClick={handleDelete} className="h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center active:scale-95 transition-all">
                <Delete className="w-6 h-6 text-foreground" />
              </button>
            </div>

            <Button 
              onClick={handleGeneratePayment}
              disabled={isProcessing || amount === "0"}
              className="w-full h-20 gold-gradient text-white text-xl font-black italic uppercase rounded-[2rem] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : (
                <>
                  GENERATE PAYMENT <Sparkles className="w-6 h-6 ml-3" />
                </>
              )}
            </Button>
          </div>
        </main>
      ) : (
        <main className="flex-1 p-6 flex flex-col items-center justify-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="text-center space-y-2">
            <Badge className="bg-green-600 text-white font-black uppercase text-[8px] px-4 py-1.5 rounded-full shadow-lg animate-pulse">Awaiting Payment</Badge>
            <h2 className="text-3xl font-black italic text-accent uppercase tracking-tighter">Request Secured</h2>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 gold-gradient blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="w-72 h-72 bg-white dark:bg-card rounded-[3rem] p-10 shadow-2xl relative z-10 border-4 border-primary/10 flex items-center justify-center">
              <div className="w-full h-full bg-slate-50 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center text-primary/40 text-center gap-4">
                <QrCode className="w-32 h-32" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight px-6 italic">Scan using AliBank App to settle Rp {formattedAmount}</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-[1.5rem] gold-gradient flex items-center justify-center shadow-2xl border-4 border-background">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
          </div>

          <div className="w-full max-w-sm space-y-4">
            <div className="p-6 rounded-[2rem] bg-muted/50 border border-border space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Invoice ID</span>
                <span className="text-accent font-mono">{activeInvoiceId}</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total to Pay</p>
                  <p className="text-3xl font-black italic text-primary tracking-tighter">Rp {formattedAmount}</p>
                </div>
                <Badge variant="outline" className="border-primary/20 text-accent font-black uppercase italic text-[8px] h-6 px-3">{selectedCategory}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-14 rounded-2xl border-border font-black uppercase italic text-[10px] tracking-widest" onClick={() => {
                const url = `${window.location.origin}/checkout/${activeInvoiceId}`;
                navigator.clipboard.writeText(url);
                toast({ title: "Tautan Disalin", description: "Bagikan tautan ini kepada pelanggan." });
              }}>
                <Share2 className="w-4 h-4 mr-2" /> Share Link
              </Button>
              <Button className="h-14 rounded-2xl gold-gradient text-white font-black uppercase italic text-[10px] tracking-widest shadow-xl" onClick={handleCloseRequest}>
                <X className="w-4 h-4 mr-2" /> Cancel POS
              </Button>
            </div>
          </div>

          <footer className="w-full flex items-center justify-center gap-6 pt-10 opacity-40 grayscale">
            <div className="flex flex-col items-center gap-1">
              <Smartphone className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase italic">Mobile Pay</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Globe className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase italic">Cross-Chain</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <LogoIcon className="w-5 h-5" />
              <span className="text-[8px] font-black uppercase italic">V3 Protocol</span>
            </div>
          </footer>
        </main>
      )}
    </div>
  );
}
