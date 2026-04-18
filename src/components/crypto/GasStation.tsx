
"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Fuel, 
  ChevronDown, 
  Info, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Loader2,
  Cpu,
  RefreshCw,
  Coins,
  Layers,
  ArrowUpRight,
  Circle,
  Mountain,
  Activity,
  AlertCircle
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

const NETWORKS = [
  { id: "1", name: "Ethereum", symbol: "ETH", color: "text-blue-600", icon: Cpu },
  { id: "137", name: "Polygon", symbol: "POL", color: "text-purple-600", icon: Zap },
  { id: "56", name: "BNB Chain", symbol: "BNB", color: "text-yellow-500", icon: Coins },
  { id: "42161", name: "Arbitrum One", symbol: "ARB", color: "text-indigo-500", icon: Layers },
  { id: "10", name: "Optimism", symbol: "OP", color: "text-red-500", icon: ArrowUpRight },
  { id: "8453", name: "Base", symbol: "ETH", color: "text-blue-400", icon: Circle },
  { id: "43114", name: "Avalanche", symbol: "AVAX", color: "text-rose-600", icon: Mountain },
  { id: "59144", name: "Linea", symbol: "ETH", color: "text-slate-900", icon: Activity },
];

export function GasStation() {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [isEip1559, setIsEip1559] = useState(true);
  const [gasData, setGasData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchGasPrices = useCallback(async () => {
    setIsError(false);
    try {
      const res = await fetch(`/api/network/gas?networkId=${selectedNetwork.id}&t=${Date.now()}`, { 
        cache: 'no-store' 
      });
      
      const data = await res.json();
      
      if (data && !data.error && (data.standard || data.estimatedBaseFee)) {
        setGasData(data);
        setIsLoading(false);
      } else {
        setIsError(true);
        setIsLoading(false);
      }
    } catch (e) {
      setIsError(true);
      setIsLoading(false);
    }
  }, [selectedNetwork.id]);

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 20000);
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  const displayGas = gasData?.standard?.suggestedMaxFeePerGas 
    ? Math.round(parseFloat(gasData.standard.suggestedMaxFeePerGas)) 
    : (gasData?.estimatedBaseFee ? Math.round(parseFloat(gasData.estimatedBaseFee)) : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted transition-all group active:scale-95 border border-border shadow-sm">
          <div className="w-5 h-5 flex items-center justify-center relative">
             <Fuel className={cn("w-4 h-4 transition-colors", isError ? "text-rose-500" : "text-muted-foreground group-hover:text-primary")} />
             <div className={cn(
               "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-background flex items-center justify-center p-0.5 shadow-sm",
               selectedNetwork.color.replace('text-', 'bg-')
             )}>
                <selectedNetwork.icon className="text-white w-[80%] h-[80%]" />
             </div>
          </div>
          <span className={cn(
            "text-[11px] font-black italic",
            isError ? "text-rose-600" : "text-foreground"
          )}>
            {isLoading ? "..." : (isError ? "OFF" : `${displayGas} GWEI`)}
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[360px] rounded-[2.5rem] p-8 bg-popover border border-border shadow-2xl z-[100]" align="end" sideOffset={15}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-foreground italic uppercase">Gas Terminal Pro</h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Network Feed</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isEip1559} onCheckedChange={setIsEip1559} className="scale-75 data-[state=checked]:bg-primary" />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter italic">EIP 1559</span>
            </div>
          </div>

          {isError ? (
            <div className="p-6 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-center space-y-4">
               <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
               <p className="text-[10px] font-bold text-rose-600 uppercase italic">Node Jaringan Sedang Offline</p>
               <Button onClick={() => { setIsLoading(true); fetchGasPrices(); }} size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase">Hubungkan Kembali</Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Pilih Node Jaringan</label>
                <Select 
                  value={selectedNetwork.id} 
                  onValueChange={(val) => {
                    const net = NETWORKS.find(n => n.id === val);
                    if (net) setSelectedNetwork(net);
                    setIsLoading(true);
                  }}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-muted/50 border-border px-5 focus:ring-0 focus:ring-offset-0 group hover:border-primary/20 transition-all text-foreground">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", selectedNetwork.color)}>
                        <selectedNetwork.icon className="w-5 h-5" />
                      </div>
                      <SelectValue className="font-bold uppercase italic" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border shadow-2xl p-2 bg-popover text-foreground">
                    {NETWORKS.map(net => (
                      <SelectItem key={net.id} value={net.id} className="rounded-xl p-3 focus:bg-muted cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", net.color)}>
                            <net.icon className="w-4 h-4" />
                          </div>
                          <span className="font-black italic text-xs uppercase">{net.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between px-1 bg-muted/30 p-4 rounded-2xl border border-border">
                <span className="text-[11px] font-black text-muted-foreground uppercase italic">Base Network Fee</span>
                <span className="text-sm font-black text-foreground italic">
                  {isLoading ? "0.00" : parseFloat(gasData?.estimatedBaseFee || "0").toFixed(4)} GWEI
                </span>
              </div>

              <Card className="border-border bg-muted/20 rounded-3xl p-6 shadow-none">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Priority Tips (GWEI)</span>
                  </div>
                  
                  <div className="space-y-5">
                    <GasPriceRow 
                      label="Instant" 
                      color="text-green-600"
                      value={isLoading ? "0.00" : parseFloat(gasData?.fast?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                      desc="Konfirmasi dalam < 15 detik"
                    />
                    <div className="h-px bg-border" />
                    <GasPriceRow 
                      label="Standard" 
                      color="text-foreground"
                      value={isLoading ? "0.00" : parseFloat(gasData?.standard?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                      desc="Konfirmasi dalam < 1 menit"
                    />
                    <div className="h-px bg-border" />
                    <GasPriceRow 
                      label="Economy" 
                      color="text-muted-foreground"
                      value={isLoading ? "0.00" : parseFloat(gasData?.safeLow?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                      desc="Konfirmasi dalam < 5 menit"
                    />
                  </div>
                </div>
              </Card>

              <Button 
                onClick={() => router.push('/crypto/convert')}
                className="w-full h-16 bg-foreground text-background hover:opacity-90 rounded-3xl font-black italic uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl"
              >
                GET MORE {selectedNetwork.symbol} <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
              </Button>
            </>
          )}

          <div className="flex items-center justify-center gap-3 opacity-40 grayscale">
            <LogoIcon className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] italic text-foreground">AliBank Infrastructure V3</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GasPriceRow({ label, value, color, desc }: { label: string, value: string, color?: string, desc: string }) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-black italic", color || "text-foreground")}>{label}</span>
          <Info className="w-3 h-3 text-muted-foreground/30" />
        </div>
        <p className="text-[8px] font-bold text-muted-foreground uppercase italic">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black text-foreground italic tracking-tighter">{value}</span>
        <span className="text-[9px] font-black text-muted-foreground uppercase italic">GWEI</span>
      </div>
    </div>
  );
}
