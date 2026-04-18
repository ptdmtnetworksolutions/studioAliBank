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
  Bitcoin,
  Cpu,
  RefreshCw
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useRouter } from "next/navigation";

const NETWORKS = [
  { id: "1", name: "Ethereum", symbol: "ETH", color: "text-blue-500", icon: Cpu },
  { id: "137", name: "Polygon", symbol: "MATIC", color: "text-purple-500", icon: Zap },
];

export function GasStation() {
  const router = useRouter();
  const db = useFirestore();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [isEip1559, setIsEip1559] = useState(true);
  const [gasData, setGasData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const apiKeysRef = useMemoFirebase(() => (db ? doc(db, "system", "api_keys") : null), [db]);
  const { data: config } = useDoc(apiKeysRef);

  const fetchGasPrices = useCallback(async () => {
    if (!config?.infuraGasApiUrl) return;
    
    try {
      // Infura Gas API expects networkId as query param
      const url = `${config.infuraGasApiUrl}?networkId=${selectedNetwork.id}`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data) {
        setGasData(data);
        setIsLoading(false);
      }
    } catch (e) {
      console.warn("Gas Station node busy");
    }
  }, [config, selectedNetwork]);

  useEffect(() => {
    fetchGasPrices();
    const interval = setInterval(fetchGasPrices, 10000);
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  const displayGas = gasData?.standard?.suggestedMaxFeePerGas 
    ? Math.round(parseFloat(gasData.standard.suggestedMaxFeePerGas)) 
    : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all group active:scale-95">
          <div className="w-5 h-5 flex items-center justify-center relative">
             <Fuel className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
             {selectedNetwork.id === "1" ? (
               <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white flex items-center justify-center p-0.5">
                  <Cpu className="text-white w-full h-full" />
               </div>
             ) : (
               <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-white flex items-center justify-center p-0.5">
                  <Zap className="text-white w-full h-full" />
               </div>
             )}
          </div>
          <span className="text-[11px] font-black text-slate-700 italic">{isLoading ? "..." : displayGas}</span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[340px] rounded-[2.5rem] p-8 bg-white border-none shadow-[0_30px_80px_rgba(0,0,0,0.15)] animate-in zoom-in duration-300" align="end" sideOffset={15}>
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-slate-400 italic">Real-time gas prices</span>
            <div className="flex items-center gap-2">
              <Switch checked={isEip1559} onCheckedChange={setIsEip1559} className="scale-75 data-[state=checked]:bg-primary" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">EIP 1559</span>
            </div>
          </div>

          {/* Network Selector */}
          <Select 
            value={selectedNetwork.id} 
            onValueChange={(val) => {
              const net = NETWORKS.find(n => n.id === val);
              if (net) setSelectedNetwork(net);
              setIsLoading(true);
            }}
          >
            <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-100 px-5 focus:ring-0 focus:ring-offset-0 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", selectedNetwork.color)}>
                  <selectedNetwork.icon className="w-5 h-5" />
                </div>
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white">
              {NETWORKS.map(net => (
                <SelectItem key={net.id} value={net.id} className="rounded-xl p-3 focus:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", net.color)}>
                      <net.icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-xs">{net.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Base Fee */}
          <div className="flex items-center gap-2 px-1">
             <span className="text-[11px] font-black text-slate-400 uppercase italic">Base fee:</span>
             <span className="text-[11px] font-black text-slate-900 italic">
               {isLoading ? "0.00" : (parseFloat(gasData?.estimatedBaseFee || "0.14")).toFixed(2)} GWEI
             </span>
          </div>

          {/* Priority Fee Table */}
          <Card className="border-slate-100 bg-white rounded-3xl p-6 shadow-sm">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-widest italic">Priority fee</span>
              </div>
              
              <div className="space-y-5">
                <GasPriceRow 
                  label="Fast" 
                  value={isLoading ? "0.00" : parseFloat(gasData?.fast?.suggestedMaxPriorityFeePerGas || "2.00").toFixed(2)} 
                />
                <div className="h-px bg-slate-50" />
                <GasPriceRow 
                  label="Average" 
                  value={isLoading ? "0.00" : parseFloat(gasData?.standard?.suggestedMaxPriorityFeePerGas || "2.00").toFixed(2)} 
                />
                <div className="h-px bg-slate-50" />
                <GasPriceRow 
                  label="Safe" 
                  value={isLoading ? "0.00" : parseFloat(gasData?.safeLow?.suggestedMaxPriorityFeePerGas || "0.00").toFixed(2)} 
                />
              </div>
            </div>
          </Card>

          {/* Footer CTA */}
          <Button 
            onClick={() => router.push('/crypto/convert')}
            className="w-full h-16 bg-slate-950 hover:bg-slate-900 text-white rounded-3xl font-black italic uppercase text-xs tracking-widest transition-all active:scale-95"
          >
            Buy more {selectedNetwork.symbol}
          </Button>

          {/* Status Branding */}
          <div className="flex items-center justify-center gap-2 opacity-20 grayscale">
            <LogoIcon className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">Powered by Ali-Node Infura</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function GasPriceRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center group cursor-default">
      <div className="flex items-center gap-2">
        <span className="text-sm font-black text-slate-900 italic">{label}</span>
        <Info className="w-3 h-3 text-slate-300" />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-black text-slate-900 italic">{value}</span>
        <span className="text-[9px] font-black text-slate-400 uppercase italic">GWEI</span>
      </div>
    </div>
  );
}
