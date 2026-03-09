
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_BENEFICIARIES } from "@/app/lib/mock-data";
import { Send, Search, UserPlus, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TransferPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-3xl font-bold text-accent">Transfer Funds</h1>
            
            <div className="liquid-glass rounded-3xl p-6 space-y-6">
              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Select Beneficiary</label>
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  <button className="flex-shrink-0 w-24 h-28 rounded-2xl bg-primary/5 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/10 transition-colors">
                    <UserPlus className="w-6 h-6" />
                    <span className="text-[10px] font-bold uppercase">New</span>
                  </button>
                  {MOCK_BENEFICIARIES.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelected(b.id)}
                      className={cn(
                        "flex-shrink-0 w-24 h-28 rounded-2xl transition-all flex flex-col items-center justify-center gap-2",
                        selected === b.id 
                          ? "bg-primary text-primary-foreground shadow-lg scale-105" 
                          : "liquid-glass border-none hover:bg-primary/10 text-accent"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                        selected === b.id ? "bg-white text-primary" : "bg-primary/10 text-primary"
                      )}>
                        {b.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-center px-1 truncate w-full">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Amount to Transfer</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold text-accent/30">$</span>
                  <Input 
                    type="number" 
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-20 text-4xl font-bold pl-12 rounded-2xl liquid-glass border-none focus-visible:ring-primary/30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-accent/70 block mb-3">Remark (Optional)</label>
                <Input 
                  placeholder="e.g. Dinner repayment" 
                  className="h-14 rounded-xl liquid-glass border-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-green-50 flex items-center gap-3">
                <ShieldCheck className="text-green-600 w-5 h-5" />
                <p className="text-xs text-green-700 font-medium">Your transfer is secured with end-to-end encryption and AliBank Fraud Protection.</p>
              </div>

              <Button className="w-full h-16 gold-gradient text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                Continue Transfer <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-xl font-bold text-accent">Frequent Recipients</h2>
            <div className="space-y-4">
              {MOCK_BENEFICIARIES.map((b) => (
                <Card key={b.id} className="liquid-glass border-none shadow-sm card-hover-effect">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent/5 flex items-center justify-center font-bold text-accent">
                        {b.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-accent">{b.name}</p>
                        <p className="text-xs text-muted-foreground">{b.bank} • {b.acc}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                      <Send className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="p-6 rounded-3xl liquid-glass border-primary/10 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <ArrowRight className="w-8 h-8 text-primary rotate-45" />
              </div>
              <h3 className="font-bold text-accent mb-1">Set Recurring Payment</h3>
              <p className="text-sm text-muted-foreground mb-4">Automate your monthly transfers and bills easily.</p>
              <Button variant="outline" className="w-full border-primary/20 text-primary rounded-xl">Set Schedule</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
