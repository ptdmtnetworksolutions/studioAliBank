"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings2, 
  History, 
  ChevronDown, 
  ArrowUpDown, 
  Info, 
  Gift, 
  Sparkles,
  RefreshCw,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { 
  LineChart, 
  Line, 
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const mockChartData = [
  { time: '00:00', price: 620 },
  { time: '01:00', price: 625 },
  { time: '02:00', price: 622 },
  { time: '03:00', price: 631 },
  { time: '04:00', price: 628 },
  { time: '05:00', price: 615 },
  { time: '06:00', price: 606 },
  { time: '07:00', price: 611 },
];

export default function ConvertPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-24 relative flex flex-col">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-white z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Convert</h1>
        <div className="w-8" /> 
      </header>

      <main className="flex-1 px-4 py-2 space-y-6 overflow-y-auto no-scrollbar">
        {/* Promo Banner */}
        <div className="bg-[#FFFBEB] border border-yellow-100 rounded-xl p-4 flex items-start gap-3">
          <Gift className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-slate-700 leading-tight">
            Berdagang untuk Berbagi Reward USDC senilai 50.000 USDC
          </p>
        </div>

        {/* Mode Selector & Icons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg cursor-pointer">
            Instan <ChevronDown className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-4 text-slate-700">
            <Settings2 className="w-5 h-5 cursor-pointer hover:text-slate-900" />
            <History className="w-5 h-5 cursor-pointer hover:text-slate-900" />
          </div>
        </div>

        {/* Rate Info */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-slate-900">
              1 ALIX = 12.450,00 IDR <span className="text-rose-500 font-black">-2.62%</span>
            </p>
            <RefreshCw className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-48 w-full relative">
          <div className="absolute top-0 left-0 text-[10px] font-black text-slate-300">631,68</div>
          <div className="absolute bottom-4 right-0 text-[10px] font-black text-slate-300">606,02</div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mockChartData}>
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#FCD535" 
                strokeWidth={2} 
                dot={false} 
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Time Selectors */}
        <div className="flex items-center justify-center gap-8 py-2">
          {['1H', '1M', '1B'].map(t => (
            <button key={t} className={cn(
              "text-xs font-black px-4 py-1.5 rounded-md transition-all",
              t === '1H' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
            )}>{t}</button>
          ))}
          <Info className="w-4 h-4 text-slate-400 cursor-pointer" />
        </div>

        {/* Conversion Form */}
        <div className="relative pt-6">
          {/* Tooltip box */}
          {showTooltip && (
            <div className="absolute -top-2 left-0 bg-[#475569] text-white text-[10px] px-3 py-2 rounded-lg z-30 flex items-center gap-2 font-bold shadow-lg animate-in fade-in slide-in-from-bottom-1">
              <span>Anda dapat memilih hingga 5 mata uang sekarang</span>
              <button 
                onClick={() => setShowTooltip(false)}
                className="ml-1 p-0.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute -bottom-1 left-4 w-2 h-2 bg-[#475569] rotate-45" />
            </div>
          )}

          <div className="space-y-1">
            {/* From */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 flex items-center justify-between border-2 border-transparent focus-within:border-[#FCD535] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center p-2 shadow-sm">
                  <LogoIcon className="text-[#FCD535]" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-xl font-black italic tracking-tight">ALIX</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-200 italic tracking-tighter">0.000016</p>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center -my-4 relative z-20">
              <button className="w-10 h-10 bg-white border border-slate-100 rounded-full shadow-lg flex items-center justify-center text-slate-900 active:scale-90 transition-transform hover:bg-slate-50">
                <ArrowUpDown className="w-5 h-5" />
              </button>
            </div>

            {/* To */}
            <div className="bg-[#F8FAFC] rounded-2xl p-5 flex items-center justify-between border-2 border-transparent focus-within:border-[#FCD535] transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D9488] flex items-center justify-center text-white p-2 shadow-sm">
                  <RefreshCw className="w-full h-full" />
                </div>
                <div className="flex items-center gap-1 cursor-pointer">
                  <span className="text-xl font-black italic tracking-tight">IDR</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-200 italic tracking-tighter">0.01</p>
              </div>
            </div>
          </div>

          {/* Magic Button */}
          <div className="flex justify-end mt-4 pr-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-500 shadow-sm animate-pulse cursor-pointer">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer Action */}
      <div className="p-4 bg-white sticky bottom-0 border-t border-slate-50">
        <Button className="w-full h-14 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] font-black italic uppercase rounded-2xl border-none shadow-none text-base tracking-widest transition-all">
          Pratinjau
        </Button>
      </div>
    </div>
  );
}
