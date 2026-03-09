
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Plus, 
  Copy, 
  QrCode, 
  CreditCard, 
  Building2, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo } from "react";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const bankAccounts = [
  { bank: "BCA", name: "AliBank Virtual Account", number: "80008", suffix: true, color: "bg-blue-600" },
  { bank: "Mandiri", name: "AliBank VA Transfer", number: "8829", suffix: true, color: "bg-yellow-600" },
  { bank: "BNI", name: "AliBank Deposito", number: "9210", suffix: true, color: "bg-orange-600" },
  { bank: "BRI", name: "AliBank BRIVA", number: "10294", suffix: true, color: "bg-blue-800" },
];

export default function TopUpPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard.",
    });
  };

  const handleProcessDeposit = async () => {
    if (!user || !db || !amount) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid amount.",
      });
      return;
    }

    setIsProcessing(true);
    const numAmount = parseFloat(amount);

    try {
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Deposit via Digital Banking Gateway`,
        category: "Top Up",
        amount: numAmount,
        type: "income",
        timestamp: serverTimestamp()
      });

      await updateDoc(userDocRef!, {
        totalBalance: increment(numAmount)
      });

      toast({
        title: "Deposit Successful!",
        description: `Rp ${numAmount.toLocaleString('id-ID')} has been credited to your account.`,
      });
      setAmount("");
      setShowConfirmation(false);
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "System Error",
        description: "Transaction processing failed. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Deposit Gateway</h1>
            <p className="text-muted-foreground text-sm font-medium">Seamless methods to fund your premium AliBank account.</p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-2 rounded-full font-bold uppercase tracking-widest text-[10px]">
            Production Ready
          </Badge>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Tabs defaultValue="va" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 bg-primary/5 rounded-2xl p-1.5 border border-primary/10">
                <TabsTrigger value="va" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                  Bank Transfer
                </TabsTrigger>
                <TabsTrigger value="instant" className="rounded-xl font-bold uppercase text-[10px] tracking-widest data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
                  Instant Credit
                </TabsTrigger>
              </TabsList>

              <TabsContent value="va" className="mt-6 space-y-4">
                <div className="liquid-glass p-6 rounded-[2rem] border-primary/20 bg-primary/5 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-accent dark:text-primary">Transfer Instructions</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-bold">
                    Use these dedicated Virtual Account numbers in your preferred banking app.
                  </p>
                </div>

                {bankAccounts.map((item) => (
                  <div key={item.bank} className="liquid-glass p-6 rounded-[2rem] flex items-center justify-between group hover:border-primary/40 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg", item.color)}>
                        {item.bank}
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.name}</p>
                        <p className="text-lg font-black text-accent dark:text-primary">
                          {item.number}{userData?.accountNumber?.slice(-5) || "00000"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => copyToClipboard(`${item.number}${userData?.accountNumber?.slice(-5) || "00000"}`)}
                      className="rounded-xl hover:bg-primary/10 text-primary"
                    >
                      <Copy className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="instant" className="mt-6">
                <div className="liquid-glass p-8 rounded-[2.5rem] border-primary/20 space-y-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Deposit Amount</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary/30">Rp</span>
                        <Input 
                          type="number" 
                          placeholder="0"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-20 pl-16 text-3xl font-black italic rounded-3xl liquid-glass border-none focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    {!showConfirmation ? (
                      <Button 
                        onClick={() => setShowConfirmation(true)}
                        disabled={!amount || parseFloat(amount) <= 0}
                        className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase tracking-tighter rounded-3xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                      >
                        REVIEW DEPOSIT REQUEST <ArrowRight className="w-5 h-5" />
                      </Button>
                    ) : (
                      <div className="space-y-4 p-6 rounded-3xl bg-primary/5 border border-primary/10 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center py-2 border-b border-primary/5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Service Provider</span>
                          <span className="text-sm font-black text-accent">AliBank Internal Gateway</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-primary/5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Processing Fee</span>
                          <span className="text-sm font-black text-green-600">Free (Premium)</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                          <span className="text-sm font-black text-accent uppercase">Total Credit</span>
                          <span className="text-xl font-black text-primary">Rp {parseFloat(amount).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowConfirmation(false)}
                            className="h-14 rounded-2xl font-bold uppercase text-[10px] tracking-widest"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleProcessDeposit}
                            disabled={isProcessing}
                            className="h-14 gold-gradient text-white font-black italic uppercase tracking-tighter rounded-2xl shadow-lg"
                          >
                            {isProcessing ? <Zap className="w-5 h-5 animate-spin" /> : "CONFIRM DEPOSIT"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none text-white overflow-hidden relative group shadow-xl">
              <div className="absolute inset-0 gold-gradient opacity-10" />
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Premium Benefits</h3>
                <div className="space-y-4">
                  {[
                    "Up to 6% p.a. Interest Rate",
                    "Zero Monthly Admin Fees",
                    "Exclusive Wealth Insights",
                    "AI-Powered Budget Planning"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/80">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="liquid-glass p-8 rounded-[2rem] border-primary/10 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h4 className="font-bold text-accent dark:text-primary text-sm uppercase tracking-tight">Daily Limit</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Available</span>
                  <span>Rp 25.000.000 Max</span>
                </div>
                <div className="w-full h-2 bg-primary/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full gold-gradient" />
                </div>
                <p className="text-[9px] text-muted-foreground italic text-center">Standard Daily Deposit Limit for Gold Members.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
