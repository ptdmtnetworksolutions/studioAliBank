
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  HelpCircle, 
  History, 
  X, 
  Info, 
  ChevronDown,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

const channels = [
  { id: 'transfer_bank', name: "Transfer Bank", type: "P2P" },
  { id: 'dana', name: "DANA(Indonesia)", type: "P2P" },
  { id: 'ovo', name: "OVO", type: "P2P" },
  { id: 'bca', name: "BCA", type: "P2P" },
  { id: 'permata', name: "Bank Permata", type: "P2P" },
  { id: 'bri', name: "Bank BRI", type: "P2P" },
  { id: 'mandiri', name: "Bank Mandiri", type: "P2P" },
];

export function CashIcon({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16 flex items-center justify-center", className)}>
      <div className="absolute inset-0 bg-slate-100 rounded-full border border-slate-200 shadow-inner" />
      <div className="relative z-10 w-10 h-6 bg-yellow-400 rounded-sm border-2 border-slate-800 flex items-center justify-center shadow-lg">
        <div className="w-6 h-3 border border-slate-800/30 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-slate-800 rounded-full" />
        </div>
        <div className="absolute -right-1 -bottom-1 w-3 h-3 bg-slate-800 rounded-full flex items-center justify-center">
          <div className="w-0 h-0 border-l-[3px] border-l-white border-y-[2px] border-y-transparent ml-0.5" />
        </div>
      </div>
    </div>
  );
}

export default function CashDeliveryPage() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(true);
  const [activeChannel, setActiveChannel] = useState<string | null>(null);

  return (
    <div className="h-screen bg-white text-slate-900 flex flex-col font-body overflow-hidden">
      {/* Header - Fixed */}
      <header className="px-4 h-14 flex items-center justify-between bg-white z-50 shrink-0">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <HelpCircle className="w-5 h-5 text-slate-700" />
          <History className="w-5 h-5 text-slate-700" />
        </div>
      </header>

      {/* Main Scrollable Area */}
      <main className="flex-1 px-6 pt-2 space-y-6 overflow-y-auto no-scrollbar pb-10">
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
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Akan Menerima</label>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-transparent focus-within:border-yellow-400 transition-all shadow-sm">
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

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider">Anda Bayar</label>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-transparent focus-within:border-yellow-400 transition-all shadow-sm">
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
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight px-1">Pilih Saluran</h2>
          
          <div className="space-y-3">
            {channels.map((channel) => (
              <div 
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={cn(
                  "p-5 rounded-2xl border-2 bg-white flex items-center justify-between group transition-all cursor-pointer shadow-sm active:scale-[0.98]",
                  activeChannel === channel.id ? "border-yellow-400 bg-yellow-50/10" : "border-slate-50"
                )}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black italic uppercase">{channel.name}</h3>
                    <Badge variant="outline" className="bg-slate-50 text-[8px] font-black border-none h-4 px-1.5 uppercase tracking-tighter">{channel.type}</Badge>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400">Transfer kepada diri Anda sendiri | Tiba secara instan</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black italic text-slate-900">--</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tutorial Section */}
        <div className="pt-8 pb-12 flex flex-col items-center text-center space-y-6 relative">
          <div className="absolute right-0 top-0">
            <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-500 border border-slate-50 active:scale-95 transition-transform cursor-pointer">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          
          <CashIcon />
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Tutorial Pengiriman Tunai</h3>
          </div>
          <div className="space-y-4 w-full px-4 text-left">
            <div className="flex gap-4">
              <span className="text-yellow-500 font-black italic text-sm mt-0.5">1</span>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">
                Masukkan jumlah yang ingin Anda Bayar atau yang akan Anda Terima
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-yellow-500 font-black italic text-sm mt-0.5">2</span>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">
                Pilih saluran dan pilih akun penerima
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-yellow-500 font-black italic text-sm mt-0.5">3</span>
              <p className="text-[11px] font-bold text-slate-400 uppercase leading-relaxed tracking-tight">
                Tunggu hingga uang tiba
              </p>
            </div>
          </div>

          <div className="pt-10 space-y-4 w-full text-center">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <LogoIcon className="w-4 h-4 grayscale opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">AliBank Pay</span>
            </div>
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter px-10 leading-tight">
              Dipersembahkan oleh P2P<br />
              Kirim Uang Tunai ke rekening bank atau e-wallet Anda sendiri
            </p>
            <p className="text-[9px] font-black text-slate-200">Version: 1.67.33</p>
          </div>
        </div>
      </main>

      {/* Fixed Sticky Footer */}
      <footer className="p-6 bg-white border-t border-slate-50 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] z-50 shrink-0 pb-safe">
        <Button 
          disabled={!activeChannel}
          className={cn(
            "w-full h-14 font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all",
            activeChannel 
              ? "bg-[#FCD535] text-slate-900 hover:bg-[#FCD535]/90 shadow-lg" 
              : "bg-[#FCD535]/20 text-slate-300"
          )}
        >
          Dapatkan Kuotasi
        </Button>
      </footer>
    </div>
  );
}
