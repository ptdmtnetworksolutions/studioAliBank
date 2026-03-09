
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { MOCK_TRANSACTIONS } from "@/app/lib/mock-data";
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = MOCK_TRANSACTIONS.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-12">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-accent">Transaction History</h1>
            <p className="text-muted-foreground">Monitor and manage your financial activities</p>
          </div>
          <Button variant="outline" className="liquid-glass border-primary/20 text-primary self-start">
            <Download className="w-4 h-4 mr-2" /> Export Statement
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search description, category..." 
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
          {filtered.length > 0 ? (
            filtered.map((tx, idx) => (
              <div 
                key={idx} 
                className="liquid-glass p-5 rounded-2xl flex items-center justify-between card-hover-effect animate-in fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    tx.type === "income" ? "bg-green-100 text-green-600" : "bg-accent/10 text-accent"
                  )}>
                    {tx.type === "income" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-base text-accent">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{tx.category}</span>
                      <span className="text-xs text-muted-foreground">{tx.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-bold text-lg",
                    tx.type === "income" ? "text-green-600" : "text-accent"
                  )}>
                    {tx.type === "income" ? "+" : "-"}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Completed</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 liquid-glass rounded-3xl">
              <p className="text-muted-foreground">No transactions found matching your search.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
