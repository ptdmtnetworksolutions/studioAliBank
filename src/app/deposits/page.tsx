
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { PiggyBank, TrendingUp, Calendar, ChevronRight, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";

const depositProducts = [
  { 
    name: "Elite Fixed Deposit", 
    rate: "4.85%", 
    term: "12-24 Bulan", 
    min: "Rp 10.000.000", 
    tag: "Terpopuler",
    color: "bg-primary/10 text-primary"
  },
  { 
    name: "Flexi Saver", 
    rate: "3.20%", 
    term: "Tanpa Kunci", 
    min: "Rp 1.000.000", 
    tag: "Likuiditas Tinggi",
    color: "bg-green-100 text-green-700"
  },
  { 
    name: "Growth Certificate", 
    rate: "5.10%", 
    term: "36+ Bulan", 
    min: "Rp 25.000.000", 
    tag: "Imbal Hasil Terbaik",
    color: "bg-blue-100 text-blue-700"
  }
];

export default function DepositsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const depositsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "deposits"));
  }, [db, user]);

  const { data: userDeposits, loading } = useCollection(depositsQuery);

  const totalInterest = useMemo(() => {
    if (!userDeposits) return 0;
    return userDeposits.reduce((acc, curr) => acc + (curr.accruedInterest || 0), 0);
  }, [userDeposits]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Wealth Management</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Ganti tabungan pasif dengan instrumen deposito elit.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-sm font-black text-accent uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" /> Portofolio Aktif
            </h2>
            <div className="space-y-4">
              {userDeposits && userDeposits.length > 0 ? (
                userDeposits.map((dep, idx) => (
                  <div key={idx} className="liquid-glass p-6 rounded-[2rem] border-primary/10 hover:border-primary/30 transition-all cursor-default">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-black text-accent uppercase italic text-sm">{dep.type}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">Maturity: {new Date(dep.maturityDate).toLocaleDateString()}</p>
                      </div>
                      <Badge className="bg-primary text-white font-black italic">{dep.rate}</Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-2xl font-black text-accent italic tracking-tighter">
                          Rp {dep.amount.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Principal Amount</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-primary p-0 h-auto hover:bg-transparent font-bold text-[10px] uppercase">
                        Ledger <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 rounded-[2rem] border-2 border-dashed border-primary/10 text-center space-y-2">
                  <PiggyBank className="w-10 h-10 text-primary/20 mx-auto" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Belum ada deposito riil.</p>
                </div>
              )}
            </div>
            
            <div className="p-8 rounded-[2rem] gold-gradient text-white shadow-xl shadow-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6" />
                <h3 className="font-black uppercase italic tracking-tighter">Yield Realized</h3>
              </div>
              <p className="text-4xl font-black italic tracking-tighter">
                Rp {totalInterest.toLocaleString('id-ID')}
              </p>
              <p className="text-[9px] text-white/70 mt-1 font-bold uppercase tracking-widest">Akumulasi bunga berjalan</p>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <h2 className="text-sm font-black text-accent uppercase tracking-widest">Market Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {depositProducts.map((product) => (
                <Card key={product.name} className="liquid-glass border-none shadow-sm group hover:scale-[1.02] transition-transform cursor-pointer rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8">
                    <div className="flex justify-between items-center mb-4">
                      <Badge className={product.color + " font-black uppercase text-[8px] tracking-widest"}>{product.tag}</Badge>
                      <span className="text-2xl font-black text-primary italic tracking-tighter">{product.rate} p.a.</span>
                    </div>
                    <CardTitle className="text-xl font-black text-accent uppercase italic">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" /> Holding Term
                        </span>
                        <span className="text-accent">{product.term}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" /> Min. Entry
                        </span>
                        <span className="text-accent">{product.min}</span>
                      </div>
                    </div>
                    <Button className="w-full h-14 bg-accent text-white hover:bg-accent/90 rounded-2xl font-black uppercase italic tracking-widest text-xs shadow-lg">
                      Open Placement
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="liquid-glass p-8 rounded-[3rem] border-primary/20 flex flex-col md:flex-row items-center gap-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-black text-accent uppercase italic tracking-tighter mb-1 text-lg">Financial Guarantee</h4>
                <p className="text-[10px] text-muted-foreground font-medium italic leading-relaxed uppercase tracking-widest">
                  Seluruh deposito riil nasabah AliBank dijamin oleh Lembaga Penjamin Simpanan (LPS) hingga Rp 2 Miliar per entitas akun.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
