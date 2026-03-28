
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Maximize, 
  Settings, 
  Copy, 
  ArrowUpFromLine, 
  ArrowUpRight, 
  Download, 
  Gift, 
  Banknote, 
  Smartphone, 
  RefreshCw, 
  Zap, 
  LayoutGrid, 
  Calendar,
  ChevronRight,
  Flame,
  Mail,
  Loader2,
  Hexagon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { doc, collection, query, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AliBankPayPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const txQuery = useMemo(() => (!db || !user) ? null : query(
    collection(db, "users", user.uid, "transactions"),
    orderBy("timestamp", "desc"),
    limit(10)
  ), [db, user]);
  const { data: transactions, loading: txLoading } = useCollection(txQuery);

  const copyId = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "ID Disalin", description: "ID AliBank Anda telah disalin." });
    }
  };

  if (!mounted) return null;

  const quickActions = [
    { name: "Terima", icon: Download, href: "/crypto/receive" },
    { name: "Angpau", icon: Gift, href: "#" },
    { name: "Kirim Tunai", icon: Banknote, href: "/crypto/cash-delivery" },
    { name: "Isi Ulang Seluler", icon: Smartphone, href: "#" },
    { name: "Convert", icon: RefreshCw, href: "/crypto/convert" },
    { name: "Earn Fleksibel", icon: Zap, href: "/deposits" },
    { name: "Kirim Beberapa", icon: LayoutGrid, href: "/transfer" },
    { name: "Pengiriman Berulang", icon: Calendar, href: "#", badge: true },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <Maximize className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
          <Hexagon className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
      </header>

      <main className="flex-1 px-5 pt-2 pb-10 space-y-8 overflow-y-auto no-scrollbar">
        {/* Title & ID */}
        <section className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight">Pay</h1>
          <div className="flex items-center gap-2 text-muted-foreground" onClick={copyId}>
            <span className="text-xs font-bold uppercase tracking-widest">ID AliBank: {userData?.accountNumber || "--- --- ---"}</span>
            <Copy className="w-3.5 h-3.5 cursor-pointer active:scale-90 transition-transform" />
          </div>
        </section>

        {/* Top Action Cards */}
        <section className="grid grid-cols-2 gap-4">
          <Card className="bg-muted border-none p-5 rounded-2xl flex flex-col justify-between h-36 relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shadow-sm">
            <Badge className="absolute top-3 right-3 bg-transparent text-primary font-black text-[8px] uppercase p-0">Bonus</Badge>
            <p className="text-sm font-black leading-tight italic max-w-[80%]">Kirim kepada pengguna AliBank</p>
            <div className="self-end">
              <ArrowUpFromLine className="w-6 h-6 text-foreground" />
            </div>
          </Card>

          <Card className="bg-muted border-none p-5 rounded-2xl flex items-center justify-between h-36 cursor-pointer hover:bg-muted/80 transition-colors shadow-sm">
            <p className="text-sm font-black leading-tight italic">Kirim On-Chain</p>
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-foreground" />
            </div>
          </Card>
        </section>

        {/* Quick Actions Grid */}
        <section className="grid grid-cols-4 gap-y-8 gap-x-2">
          {quickActions.map((action, idx) => (
            <div 
              key={idx} 
              onClick={() => action.href !== "#" && router.push(action.href)}
              className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
            >
              <div className="relative w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border shadow-sm group-hover:bg-muted/80">
                <action.icon className="w-5 h-5 text-foreground" />
                {action.badge && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-background" />
                )}
              </div>
              <span className="text-[10px] font-bold text-muted-foreground text-center leading-tight">{action.name}</span>
            </div>
          ))}
        </section>

        {/* Collapsible Arrow */}
        <div className="flex justify-center pt-2">
          <ChevronRight className="w-5 h-5 text-muted-foreground/30 rotate-90" />
        </div>

        <div className="h-px bg-border w-full" />

        {/* Rewards Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight italic">Dapatkan Reward!</h2>
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-muted border-none p-5 rounded-2xl flex items-center justify-between h-24 cursor-pointer group hover:bg-muted/80 transition-colors shadow-sm">
              <span className="text-xs font-black italic">Kampanye Pay</span>
              <div className="w-10 h-10 bg-rose-500 rounded-lg flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                <Mail className="w-5 h-5 text-white" />
              </div>
            </Card>
            <Card className="bg-muted border-none p-5 rounded-2xl flex items-center justify-between h-24 cursor-pointer group hover:bg-muted/80 transition-colors shadow-sm">
              <span className="text-xs font-black italic">Hot Deals</span>
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
            </Card>
          </div>
        </section>

        {/* Transactions Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => router.push('/transactions')}>
            <h2 className="text-lg font-black tracking-tight italic">Transaksi</h2>
            <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
          </div>

          <div className="space-y-6">
            {txLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
              </div>
            ) : transactions && transactions.length > 0 ? (
              transactions.map((tx: any) => (
                <div key={tx.id} className="flex justify-between items-center group">
                  <div className="space-y-1">
                    <p className="text-sm font-black italic text-foreground uppercase tracking-tight">{tx.description}</p>
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString('id-ID') : tx.date}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-black italic tracking-tighter",
                      tx.type === 'income' ? "text-green-500" : "text-foreground"
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{tx.amount ? `Rp${tx.amount.toLocaleString()}` : `${tx.cryptoAmount} ${tx.cryptoCurrency}`}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Belum ada aktivitas pembayaran</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
