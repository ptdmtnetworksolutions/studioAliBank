
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  HelpCircle, 
  History, 
  X, 
  Info, 
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function CashDeliveryPage() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-body">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <HelpCircle className="w-5 h-5 text-slate-700" />
          <History className="w-5 h-5 text-slate-700" />
        </div>
      </header>

      <main className="flex-1 px-6 pt-2 space-y-6 overflow-y-auto no-scrollbar pb-24">
        {/* Banner - Professional Compliance Info */}
        {showBanner && (
          <div className="bg-[#FFFBEB] border border-yellow-100 rounded-2xl p-4 flex items-start gap-3 relative animate-in fade-in slide-in-from-top-2">
            <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="pr-6">
              <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                Layanan ini tunduk pada <span className="text-yellow-600 font-bold">Ketentuan Penggunaan AliBank Pay</span> dan <span className="text-yellow-600 font-bold">Ketentuan Penggunaan Pengiriman Tunai</span>.
              </p>
            </div>
            <button 
              onClick={() => setShowBanner(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Title Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Pengiriman Tunai</h1>
          <p className="text-xs font-bold text-slate-400 leading-tight">Kirim kripto dan terima fiat. Cepat, aman, tarif menguntungkan</p>
        </div>

        {/* Input Terminal */}
        <div className="space-y-6">
          {/* Akan Menerima (Fiat Destination) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Akan Menerima</label>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-transparent focus-within:border-yellow-400 transition-all">
              <input 
                type="number" 
                placeholder="0.00" 
                className="bg-transparent border-none focus:ring-0 text-2xl font-black italic tracking-tighter w-1/2 placeholder:text-slate-300"
              />
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-rose-600 flex items-center justify-center text-[8px] font-black text-white">ID</div>
                <span className="text-sm font-black italic">IDR | ID</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Anda Bayar (Crypto Source) */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Anda Bayar</label>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-transparent focus-within:border-yellow-400 transition-all">
              <input 
                type="number" 
                placeholder="0.00" 
                className="bg-transparent border-none focus:ring-0 text-2xl font-black italic tracking-tighter w-1/2 placeholder:text-slate-300"
              />
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white p-1">
                  <RefreshCw className="w-full h-full" />
                </div>
                <span className="text-sm font-black italic">USDT</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-slate-400">Saldo Spot & Pendanaan: 0.001 USDT</p>
              <button className="text-[10px] font-black text-yellow-600 uppercase hover:underline">Maks.</button>
            </div>
          </div>
        </div>

        {/* Channel Selection */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Pilih Saluran</h2>
          
          <div className="space-y-3">
            {/* Channel: Bank Transfer */}
            <div className="p-5 rounded-2xl border-2 border-slate-50 bg-white flex items-center justify-between group hover:border-yellow-400 transition-all cursor-pointer shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black italic uppercase">Transfer Bank</h3>
                  <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-none h-4 px-1.5 uppercase tracking-tighter">P2P</Badge>
                </div>
                <p className="text-[10px] font-bold text-slate-400">Transfer kepada diri Anda sendiri | Tiba secara instan</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black italic text-slate-900">--</p>
                <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center ml-auto">
                   <RefreshCw className="w-3 h-3 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Channel: DANA */}
            <div className="p-5 rounded-2xl border-2 border-slate-50 bg-white flex items-center justify-between group hover:border-yellow-400 transition-all cursor-pointer shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black italic uppercase">DANA(Indonesia)</h3>
                  <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-none h-4 px-1.5 uppercase tracking-tighter">P2P</Badge>
                </div>
                <p className="text-[10px] font-bold text-slate-400">Transfer kepada diri Anda sendiri | Tiba secara instan</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black italic text-slate-900">--</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Floating Action */}
      <div className="p-6 bg-white sticky bottom-0 border-t border-slate-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <Button className="w-full h-14 bg-[#FCD535]/20 text-slate-300 font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all">
          Dapatkan Kuotasi
        </Button>
      </div>
    </div>
  );
}
