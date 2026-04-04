
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Wallet, Plus, Bitcoin, Gift, ExternalLink, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

const iconMap: Record<string, any> = {
  Wallet,
  Bitcoin,
  Gift
};

export default function WalletsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const walletsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "wallets"));
  }, [db, user]);

  const { data: userWallets, loading } = useCollection(walletsQuery);

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
      
      <main className="container mx-auto px-4 max-w-4xl">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Digital Wallets</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Integrasi ekosistem pembayaran eksternal.</p>
          </div>
          <Button className="gold-gradient text-white rounded-2xl h-12 shadow-xl shadow-primary/20 font-black uppercase italic text-xs px-6">
            <Plus className="w-4 h-4 mr-2" /> Link New
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {userWallets && userWallets.length > 0 ? (
            userWallets.map((wallet, idx) => {
              const Icon = iconMap[wallet.icon] || Wallet;
              return (
                <Card key={idx} className="liquid-glass border-none shadow-sm hover:scale-[1.01] transition-all cursor-default overflow-hidden rounded-[2.5rem]">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <Badge className="bg-green-600/10 text-green-600 border-green-600/20 font-black uppercase text-[8px] tracking-widest">Connected</Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{wallet.name}</p>
                      <h3 className="text-3xl font-black text-accent italic tracking-tighter">
                        Rp {wallet.balance.toLocaleString('id-ID')}
                      </h3>
                    </div>

                    <div className="flex gap-3 mt-10">
                      <Button variant="outline" className="flex-1 rounded-xl border-primary/20 text-primary font-bold uppercase text-[10px]">Manage</Button>
                      <Button variant="ghost" className="rounded-xl text-accent h-12 w-12"><ExternalLink className="w-5 h-5" /></Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="md:col-span-2 p-20 rounded-[3rem] border-2 border-dashed border-primary/10 text-center space-y-4">
              <Link2 className="w-16 h-16 text-primary/10 mx-auto" />
              <div>
                <h4 className="text-lg font-black text-accent uppercase italic">No External Wallets</h4>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Hubungkan LinkAja, OVO, atau Dana Anda di sini.</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 liquid-glass-dark rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border-none shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 gold-gradient opacity-5" />
          <div className="flex-1 space-y-6 relative z-10">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Liquid Consolidation</h3>
            <p className="text-white/70 text-xs font-medium leading-relaxed italic">
              Aktifkan **Auto-Sweep** untuk mengonsolidasikan seluruh saldo dari e-wallet eksternal ke dalam satu portal AliBank setiap pukul 00:00 WIB.
            </p>
            <Button className="gold-gradient text-white px-10 rounded-2xl h-14 shadow-2xl font-black uppercase italic text-xs tracking-widest">
              Activate Auto-Sweep
            </Button>
          </div>
          <div className="w-full md:w-64 h-44 gold-gradient rounded-[2.5rem] rotate-2 shadow-2xl relative overflow-hidden flex items-center justify-center shrink-0 border border-white/20">
             <div className="absolute inset-0 bg-black/10" />
             <Wallet className="w-24 h-24 text-white/10" />
             <div className="absolute bottom-6 left-6">
                <p className="text-[9px] text-white/60 font-black uppercase tracking-widest">AliBank Card</p>
                <p className="text-white font-black tracking-[0.2em] text-sm">•••• 8829</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
