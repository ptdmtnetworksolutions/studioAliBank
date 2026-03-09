
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Download, Loader2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function TransactionsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

  const transactionsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );
  }, [db, user]);

  const { data: transactions, loading } = useCollection(transactionsQuery);

  const filtered = transactions?.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen pb-12 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Riwayat Transaksi</h1>
            <p className="text-muted-foreground">Pantau aktivitas finansial asli Anda dari database</p>
          </div>
          <Button variant="outline" className="liquid-glass border-primary/20 text-primary self-start">
            <Download className="w-4 h-4 mr-2" /> Ekspor Laporan
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari deskripsi, kategori..." 
              className="pl-10 h-12 rounded-2xl liquid-glass border-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-12 w-12 rounded-2xl liquid-glass border-none flex items-center justify-center">
            <Filter className="w-5 h-5 text-accent" />
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Mengambil data transaksi...</p>
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((tx, idx) => (
              <div 
                key={idx} 
                className="liquid-glass p-5 rounded-2xl flex items-center justify-between card-hover-effect animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                    tx.type === "income" ? "bg-green-100 text-green-600" : "bg-accent/10 text-accent"
                  )}>
                    {tx.type === "income" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-base text-accent">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{tx.category}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-lg",
                    tx.type === "income" ? "text-green-600" : "text-accent"
                  )}>
                    {tx.type === "income" ? "+" : "-"}Rp {tx.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-black">Berhasil</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 liquid-glass rounded-3xl border-dashed border-2 border-primary/10">
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">Belum ada transaksi ditemukan.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Coba lakukan transfer pertama Anda!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
