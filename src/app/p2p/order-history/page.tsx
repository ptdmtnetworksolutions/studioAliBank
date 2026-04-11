
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  AlertCircle,
  MessageSquareText,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filters = ["Semua", "Selesai", "Dibatalkan", "Diproses"];

  const ordersQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "p2p_orders"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: orders, loading } = useCollection(ordersQuery);

  const filteredOrders = orders?.filter(order => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Selesai") return order.status === "completed";
    if (activeFilter === "Dibatalkan") return order.status === "cancelled";
    if (activeFilter === "Diproses") return order.status === "pending";
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 relative font-body transition-colors duration-300">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-black italic uppercase tracking-tight">Riwayat Order P2P</h1>
        </div>
        <button className="p-2 hover:bg-muted rounded-lg">
          <Download className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Main Tabs */}
      <Tabs defaultValue="berlangsung" className="w-full">
        <div className="px-4 border-b border-border/50 flex items-center justify-between bg-background">
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="berlangsung" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-full text-sm font-black uppercase italic text-muted-foreground data-[state=active]:text-foreground"
            >
              Berlangsung
            </TabsTrigger>
            <TabsTrigger 
              value="terisi" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 h-full text-sm font-black uppercase italic text-muted-foreground data-[state=active]:text-foreground"
            >
              Terisi
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Filter className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <TabsContent value="berlangsung" className="mt-0">
          {/* Filter Chips */}
          <div className="flex gap-2 px-4 py-4 overflow-x-auto no-scrollbar">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-5 py-1.5 rounded-full text-[10px] font-black uppercase italic transition-all shrink-0 border",
                  activeFilter === f 
                    ? "bg-primary border-primary text-primary-foreground shadow-lg" 
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest italic">Sinkronisasi Node P2P...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="px-4 space-y-4">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-card p-5 rounded-[1.5rem] border border-border shadow-sm group active:scale-[0.98] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                        order.type === 'buy' ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
                      )}>
                        {order.type === 'buy' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-black italic uppercase leading-none">
                          {order.type === 'buy' ? 'Beli' : 'Jual'} {order.asset}
                        </h4>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge className={cn(
                      "font-black text-[8px] uppercase px-2 h-5",
                      order.status === 'completed' ? "bg-green-500" : order.status === 'pending' ? "bg-amber-500" : "bg-muted text-muted-foreground"
                    )}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/50">
                    <div>
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Jumlah Fiat</p>
                      <p className="text-sm font-black italic text-foreground">Rp {order.amountFiat?.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Jumlah Aset</p>
                      <p className="text-sm font-black text-primary italic">{order.amountCrypto} {order.asset}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-[9px] font-black italic text-muted-foreground uppercase">
                    <span>Lawan: {order.counterpartyName}</span>
                    <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-24 px-8 text-center animate-in fade-in zoom-in duration-700">
              <div className="relative mb-6">
                <div className="w-32 h-32 text-muted-foreground/20">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect x="25" y="20" width="50" height="60" rx="12" stroke="currentColor" strokeWidth="2" />
                    <rect x="35" y="35" width="30" height="2" fill="currentColor" opacity="0.5" />
                    <rect x="35" y="45" width="30" height="2" fill="currentColor" opacity="0.5" />
                    <circle cx="65" cy="70" r="12" fill="hsl(var(--background))" stroke="currentColor" strokeWidth="2" />
                    <Clock className="absolute right-2 bottom-2 w-6 h-6 text-primary" />
                  </svg>
                </div>
              </div>
              <p className="text-muted-foreground text-xs font-black uppercase tracking-widest italic opacity-60">
                Node P2P AliBank Bersih.<br/>Belum ada riwayat order riil.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="terisi" className="mt-0">
          <div className="flex flex-col items-center justify-center pt-32 px-8 text-center opacity-20 italic">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
            <p className="text-sm font-black uppercase tracking-widest italic">
              Seluruh order P2P telah terisi atau diselesaikan.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Support Button */}
      <button 
        className="fixed bottom-24 right-6 w-14 h-14 gold-gradient rounded-2xl shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-all active:scale-95 z-40 border border-white/20"
        onClick={() => toast({ title: "Bantuan P2P", description: "Menghubungkan ke asisten intelijen AliBank..." })}
      >
        <div className="relative">
          <MessageSquareText className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        </div>
      </button>
    </div>
  );
}
