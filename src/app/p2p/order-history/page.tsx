
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Download, 
  Search, 
  Filter, 
  FileText, 
  AlertCircle,
  MessageSquareText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function OrderHistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filters = ["Semua", "Selesai", "Dibatalkan"];

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-20 relative">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Riwayat Order</h1>
        </div>
        <button className="p-2 hover:bg-slate-100 rounded-lg">
          <Download className="w-5 h-5 text-slate-700" />
        </button>
      </header>

      {/* Main Tabs */}
      <Tabs defaultValue="berlangsung" className="w-full">
        <div className="px-4 border-b border-slate-100 flex items-center justify-between">
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="berlangsung" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 h-full text-sm font-bold text-slate-500 data-[state=active]:text-slate-900"
            >
              Berlangsung
            </TabsTrigger>
            <TabsTrigger 
              value="terisi" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-400 data-[state=active]:bg-transparent px-0 h-full text-sm font-bold text-slate-500 data-[state=active]:text-slate-900"
            >
              Terisi
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-slate-700" />
            <Filter className="w-5 h-5 text-slate-700" />
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
                  "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
                  activeFilter === f 
                    ? "bg-slate-100 text-slate-900" 
                    : "bg-white text-slate-400"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 text-slate-200">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect x="25" y="20" width="50" height="60" rx="4" stroke="currentColor" strokeWidth="2" />
                  <rect x="30" y="30" width="40" height="2" fill="currentColor" opacity="0.5" />
                  <rect x="30" y="40" width="40" height="2" fill="currentColor" opacity="0.5" />
                  <rect x="30" y="50" width="25" height="2" fill="currentColor" opacity="0.5" />
                  <circle cx="65" cy="70" r="12" fill="white" stroke="currentColor" strokeWidth="2" />
                  <path d="M65 65V72" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="65" cy="76" r="1" fill="currentColor" />
                </svg>
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Anda tidak memiliki riwayat order.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="terisi" className="mt-0">
          <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Belum ada order yang terisi.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Action Button */}
      <button className="fixed bottom-24 right-6 w-12 h-12 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center text-blue-500 hover:scale-110 transition-transform active:scale-95">
        <div className="relative">
          <MessageSquareText className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border-2 border-white" />
        </div>
      </button>
    </div>
  );
}
