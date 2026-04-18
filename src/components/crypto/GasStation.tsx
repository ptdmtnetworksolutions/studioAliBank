
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
  Activity
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

// Daftar Jaringan Prioritas dari Dokumen Infura Gas API
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

/**
 * @fileOverview Komponen Gas Station Riil dengan UI Kontras Tinggi.
 * Menarik data biaya jaringan melalui Proxy Server AliBank berdasarkan Chain ID resmi.
 */
export function GasStation() {
  const router = useRouter();
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [isEip1559, setIsEip1559] = useState(true);
  const [gasData, setGasData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchGasPrices = useCallback(async () => {
    try {
      // Menggunakan Proxy Server AliBank untuk menghindari CORS dan menjaga keamanan Project Secret
      const res = await fetch(`/api/network/gas?networkId=${selectedNetwork.id}&t=${Date.now()}`, { 
        cache: 'no-store' 
      });
      
      const data = await res.json();
      
      if (data && !data.error && data.standard) {
        setGasData(data);
        setIsLoading(false);
        setIsError(false);
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
    const interval = setInterval(fetchGasPrices, 15000);
    return () => clearInterval(interval);
  }, [fetchGasPrices]);

  // Ekstraksi nilai GWEI utama dari respon Infura
  const displayGas = gasData?.standard?.suggestedMaxFeePerGas 
    ? Math.round(parseFloat(gasData.standard.suggestedMaxFeePerGas)) 
    : (gasData?.estimatedBaseFee ? Math.round(parseFloat(gasData.estimatedBaseFee)) : 0);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 transition-all group active:scale-95 border border-slate-200 hover:border-primary/40 shadow-sm">
          <div className="w-5 h-5 flex items-center justify-center relative">
             <Fuel className={cn("w-4 h-4 transition-colors", isError ? "text-rose-500" : "text-slate-600 group-hover:text-primary")} />
             <div className={cn(
               "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white flex items-center justify-center p-0.5 shadow-sm",
               selectedNetwork.color.replace('text-', 'bg-')
             )}>
                <selectedNetwork.icon className="text-white w-[80%] h-[80%]" />
             </div>
          </div>
          <span className={cn(
            "text-[11px] font-black italic",
            isError ? "text-rose-600" : "text-slate-900"
          )}>
            {isLoading ? "..." : (isError ? "OFF" : `${displayGas} GWEI`)}
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[360px] rounded-[2.5rem] p-8 bg-white border border-slate-200 shadow-[0_30px_80px_rgba(0,0,0,0.2)] animate-in zoom-in duration-300 z-[100]" align="end" sideOffset={15}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-black text-slate-900 italic uppercase">Gas Terminal Pro</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Real-time Network Feed</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isEip1559} onCheckedChange={setIsEip1559} className="scale-75 data-[state=checked]:bg-primary" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter italic">EIP 1559</span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Node Jaringan</label>
            <Select 
              value={selectedNetwork.id} 
              onValueChange={(val) => {
                const net = NETWORKS.find(n => n.id === val);
                if (net) setSelectedNetwork(net);
                setIsLoading(true);
                setIsError(false);
              }}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-slate-200 px-5 focus:ring-0 focus:ring-offset-0 group hover:border-primary/20 transition-all text-slate-900">
                <div className="flex items-center gap-3">
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", selectedNetwork.color)}>
                    <selectedNetwork.icon className="w-5 h-5" />
                  </div>
                  <SelectValue className="font-bold uppercase italic" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl p-2 bg-white text-slate-900">
                {NETWORKS.map(net => (
                  <SelectItem key={net.id} value={net.id} className="rounded-xl p-3 focus:bg-slate-50 cursor-pointer">
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

          <div className="flex items-center justify-between px-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <span className="text-[11px] font-black text-slate-500 uppercase italic">Base Network Fee</span>
             <span className="text-sm font-black text-slate-900 italic">
               {isLoading ? "0.00" : (isError ? "N/A" : parseFloat(gasData?.estimatedBaseFee || "0").toFixed(4))} GWEI
             </span>
          </div>

          {/* Tabel Biaya Prioritas - Kontras Tinggi */}
          <Card className="border-slate-200 bg-slate-50/80 rounded-3xl p-6 shadow-none">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic">Priority Tips (GWEI)</span>
              </div>
              
              <div className="space-y-5">
                <GasPriceRow 
                  label="Instant" 
                  color="text-green-600"
                  value={isLoading || isError ? "0.00" : parseFloat(gasData?.fast?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                  desc="Konfirmasi dalam < 15 detik"
                />
                <div className="h-px bg-slate-200" />
                <GasPriceRow 
                  label="Standard" 
                  color="text-slate-900"
                  value={isLoading || isError ? "0.00" : parseFloat(gasData?.standard?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                  desc="Konfirmasi dalam < 1 menit"
                />
                <div className="h-px bg-slate-200" />
                <GasPriceRow 
                  label="Economy" 
                  color="text-slate-500"
                  value={isLoading || isError ? "0.00" : parseFloat(gasData?.safeLow?.suggestedMaxPriorityFeePerGas || "0").toFixed(2)} 
                  desc="Konfirmasi dalam < 5 menit"
                />
              </div>
            </div>
          </Card>

          <Button 
            onClick={() => router.push('/crypto/convert')}
            className="w-full h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-3xl font-black italic uppercase text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl"
          >
            GET MORE {selectedNetwork.symbol} <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
          </Button>

          <div className="flex items-center justify-center gap-3 opacity-40 grayscale">
            <LogoIcon className="w-4 h-4" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] italic text-slate-900">AliBank Infrastructure V3</span>
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
          <span className={cn("text-sm font-black italic", color || "text-slate-900")}>{label}</span>
          <Info className="w-3 h-3 text-slate-300" />
        </div>
        <p className="text-[8px] font-bold text-slate-400 uppercase italic">{desc}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-black text-slate-900 italic tracking-tighter">{value}</span>
        <span className="text-[9px] font-black text-slate-400 uppercase italic">GWEI</span>
      </div>
    </div>
  );
}
