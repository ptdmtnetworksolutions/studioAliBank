
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Target, 
  ShieldCheck, 
  Activity,
  ChevronRight,
  Clock,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

const ALPHA_SIGNALS = [
  { id: 1, pair: "ALX/USDT", type: "Long", entry: "12.24", target: "15.50", sl: "11.20", confidence: "94%", trend: "Strong Bullish" },
  { id: 2, pair: "BTC/USDT", type: "Long", entry: "66,410", target: "69,200", sl: "65,000", confidence: "88%", trend: "Accumulation" },
  { id: 3, pair: "ETH/USDT", type: "Long", entry: "2,286", target: "2,450", sl: "2,150", confidence: "82%", trend: "Breakout" },
  { id: 4, pair: "SOL/USDT", type: "Short", entry: "85.72", target: "78.00", sl: "89.50", confidence: "76%", trend: "Rejection" },
];

export function AlphaMarketView({ marketCoins }: { marketCoins: any[] }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-6">
      {/* Alpha Intelligence Summary */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center p-1.5 shadow-lg">
            <Sparkles className="text-white w-full h-full" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Alpha Intelligence</p>
            <p className="text-xs font-bold text-foreground mt-1">4 Sinyal Aktif Terdeteksi</p>
          </div>
        </div>
        <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase italic animate-pulse">Live Analysis</Badge>
      </div>

      {/* Signals List */}
      <div className="space-y-4">
        {ALPHA_SIGNALS.map((sig) => {
          const coinData = marketCoins.find(c => sig.pair.startsWith(c.symbol));
          const currentPrice = coinData ? coinData.price : parseFloat(sig.entry.replace(',', ''));
          
          return (
            <Card 
              key={sig.id} 
              className="p-5 rounded-[1.5rem] border-none bg-card shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer group"
              onClick={() => router.push(`/crypto/market/${sig.pair.split('/')[0].toLowerCase()}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                    sig.type === 'Long' ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
                  )}>
                    {sig.type === 'Long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black italic uppercase">{sig.pair}</h4>
                      {sig.pair.startsWith("ALX") && <LogoIcon className="w-3 h-3 text-primary" />}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{sig.trend}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-black italic", sig.type === 'Long' ? "text-green-500" : "text-rose-500")}>
                    {sig.type === 'Long' ? 'CALL LONG' : 'CALL SHORT'}
                  </p>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{sig.confidence} Confidence</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-border/50">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Entry</p>
                  <p className="text-xs font-black italic text-foreground">{sig.entry}</p>
                </div>
                <div className="text-center border-x border-border/50 px-2">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Target</p>
                  <p className="text-xs font-black text-green-500 italic">{sig.target}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Current</p>
                  <p className="text-xs font-black text-primary italic">
                    {currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase italic">Aktif 5m lalu</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-primary" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase italic">Verified</span>
                  </div>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-black text-primary uppercase italic hover:underline">
                  Execute <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Alpha Performance Info */}
      <div className="p-4 rounded-2xl bg-muted/30 border border-border flex gap-3 italic">
        <Activity className="w-5 h-5 text-primary shrink-0" />
        <p className="text-[9px] font-medium text-muted-foreground leading-relaxed uppercase">
          Sinyal Alpha didukung oleh <span className="text-foreground font-black">Ali-Intelligence Node</span> yang memproses data likuiditas global dan volatilitas pasar secara riil.
        </p>
      </div>
    </div>
  );
}
