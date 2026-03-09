
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_WALLETS } from "@/app/lib/mock-data";
import { Wallet, Plus, Bitcoin, Gift, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

const iconMap: Record<string, any> = {
  Wallet,
  Bitcoin,
  Gift
};

export default function WalletsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Digital Wallets</h1>
            <p className="text-muted-foreground">Manage your linked e-wallets and assets</p>
          </div>
          <Button className="gold-gradient text-white rounded-2xl h-12 shadow-lg shadow-primary/20">
            <Plus className="w-5 h-5 mr-2" /> Connect New
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MOCK_WALLETS.map((wallet) => {
            const Icon = iconMap[wallet.icon] || Wallet;
            return (
              <Card key={wallet.id} className="liquid-glass border-none shadow-sm card-hover-effect overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{wallet.name}</p>
                    <h3 className="text-3xl font-bold text-accent">
                      ${mounted ? wallet.balance.toLocaleString() : wallet.balance.toFixed(2)}
                    </h3>
                  </div>

                  <div className="flex gap-2 mt-8">
                    <Button variant="outline" className="flex-1 rounded-xl border-primary/20 text-primary">Details</Button>
                    <Button variant="ghost" className="rounded-xl text-accent"><ExternalLink className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <button className="liquid-glass rounded-3xl border-2 border-dashed border-primary/20 p-8 flex flex-col items-center justify-center text-center group hover:bg-primary/5 transition-colors">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <h4 className="font-bold text-accent">Add New Wallet</h4>
            <p className="text-xs text-muted-foreground max-w-[200px] mt-1">
              Supports 50+ e-wallets and cryptocurrency platforms.
            </p>
          </button>
        </div>

        <div className="mt-12 liquid-glass-dark rounded-3xl p-10 flex flex-col md:flex-row items-center gap-8 border-primary/20">
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-bold text-accent">Consolidate your funds</h3>
            <p className="text-accent/70 leading-relaxed">
              Enable Auto-Sweep to automatically transfer balances from your e-wallets to your main AliBank account when they reach a certain threshold.
            </p>
            <Button className="bg-primary text-white px-8 rounded-xl h-12 shadow-xl shadow-primary/20">
              Enable Auto-Sweep
            </Button>
          </div>
          <div className="w-full md:w-64 h-40 gold-gradient rounded-3xl rotate-3 shadow-2xl relative overflow-hidden flex items-center justify-center">
             <div className="absolute top-0 left-0 w-full h-full bg-black/5"></div>
             <Wallet className="w-20 h-20 text-white/20" />
             <div className="absolute bottom-4 left-4">
                <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest">AliBank Card</p>
                <p className="text-white font-bold">**** 8829</p>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
