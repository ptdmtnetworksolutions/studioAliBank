
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings2, 
  ChevronDown, 
  ArrowUpDown, 
  Loader2,
  CheckCircle2,
  Bitcoin,
  Cpu,
  Zap,
  Info,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo, useCallback } from "react";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MARKUP = 1.02; // AliBank 2% Profit Margin
const USDT_IDR_RATE = 15850;

type AssetKey = 'ALX' | 'BTC' | 'ETH' | 'USDT' | 'IDR';

interface AssetConfig {
  symbol: AssetKey;
  name: string;
  icon: any;
  color: string;
}

const ASSETS: AssetConfig[] = [
  { symbol: 'ALX', name: 'Alix Coin', icon: LogoIcon, color: 'gold-gradient' },
  { symbol: 'BTC', name: 'Bitcoin', icon: Bitcoin, color: 'bg-orange-500' },
  { symbol: 'ETH', name: 'Ethereum', icon: Cpu, color: 'bg-blue-500' },
  { symbol: 'USDT', name: 'TetherUS', icon: Zap, color: 'bg-[#0D9488]' },
  { symbol: 'IDR', name: 'Rupiah', icon: () => <span className="text-white font-black text-[10px]">Rp</span>, color: 'bg-rose-600' },
];

export default function ConvertPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [fromAsset, setFromAsset] = useState<AssetKey>('ETH');
  const [toAsset, setToAsset] = useState<AssetKey>('USDT');
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'input' | 'success'>('input');
  
  const [prices, setPrices] = useState<Record<AssetKey, number>>({
    ALX: 12.24,
    BTC: 66450,
    ETH: 2350,
    USDT: 1,
    IDR: 1 / USDT_IDR_RATE
  });

  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const fetchPrices = useCallback(async () => {
    try {
      const symbols = ["BTCUSDT", "ETHUSDT", "USDTIDRT"];
      const res = await fetch(`/api/market/ticker?symbols=${encodeURIComponent(JSON.stringify(symbols))}`);
      if (res.ok) {
        const data = await res.json();
        const newPrices = { ...prices };
        
        const btcData = data.find((d: any) => d.symbol === 'BTCUSDT');
        const ethData = data.find((d: any) => d.symbol === 'ETHUSDT');
        const usdtIdrData = data.find((d: any) => d.symbol === 'USDTIDRT');

        if (btcData) newPrices.BTC = parseFloat(btcData.lastPrice);
        if (ethData) newPrices.ETH = parseFloat(ethData.lastPrice);
        if (usdtIdrData) newPrices.IDR = 1 / parseFloat(usdtIdrData.lastPrice);
        if (globalLiquidity?.lastAlxPriceUsdt) newPrices.ALX = globalLiquidity.lastAlxPriceUsdt;

        setPrices(newPrices);
      }
    } catch (e) {
      console.warn("Price sync failed", e);
    }
  }, [globalLiquidity, prices]);

  useEffect(() => {
    setMounted(true);
    fetchPrices();
    const interval = setInterval(fetchPrices, 15000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const convertedValue = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return "0";
    const valueInUsdt = num * prices[fromAsset];
    const rawOutput = valueInUsdt / (prices[toAsset] * MARKUP);
    return toAsset === 'IDR' ? Math.floor(rawOutput * USDT_IDR_RATE).toString() : rawOutput.toFixed(6);
  }, [amount, fromAsset, toAsset, prices]);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const userBalance = useMemo(() => {
    if (!userData) return 0;
    if (fromAsset === 'IDR') return userData.totalBalance || 0;
    return userData.cryptoBalances?.[fromAsset] || 0;
  }, [userData, fromAsset]);

  const isInsufficient = useMemo(() => {
    const num = parseFloat(amount);
    if (isNaN(num)) return false;
    return num > userBalance;
  }, [amount, userBalance]);

  const handleConvert = async () => {
    if (!user || !db || !userData || isInsufficient) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsProcessing(true);
    try {
      const resultNum = parseFloat(convertedValue);
      const userRef = doc(db, "users", user.uid);

      const userUpdates: any = {};
      if (fromAsset === 'IDR') userUpdates.totalBalance = increment(-numAmount);
      else userUpdates[`cryptoBalances.${fromAsset}`] = increment(-numAmount);

      if (toAsset === 'IDR') userUpdates.totalBalance = increment(resultNum);
      else userUpdates[`cryptoBalances.${toAsset}`] = increment(resultNum);

      await updateDoc(userRef, userUpdates);

      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Swap ${fromAsset} ke ${toAsset}`,
        category: "Trading",
        fromAmount: numAmount,
        fromCurrency: fromAsset,
        toAmount: resultNum,
        toCurrency: toAsset,
        type: 'income',
        status: "success",
        timestamp: serverTimestamp()
      });

      setStep('success');
      toast({ title: "Swap Berhasil" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;

  const currentFromAsset = ASSETS.find(a => a.symbol === fromAsset)!;
  const currentToAsset = ASSETS.find(a => a.symbol === toAsset)!;

  const fromUsd = (parseFloat(amount) || 0) * prices[fromAsset];
  const toUsd = (parseFloat(convertedValue) || 0) * prices[toAsset];

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0F1113] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-black italic uppercase mb-2">Swap Berhasil</h2>
        <Card className="w-full max-w-sm bg-[#171A1D] border-none rounded-[2rem] p-8 mb-8 text-center">
          <p className="text-[10px] font-black text-white/40 uppercase">Total Diterima</p>
          <p className="text-3xl font-black text-primary italic">{convertedValue} {toAsset}</p>
        </Card>
        <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl" onClick={() => router.push('/')}>Selesai</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1113] text-white flex flex-col font-body overflow-hidden">
      {/* HEADER */}
      <header className="px-6 h-16 flex items-center justify-between sticky top-0 bg-[#0F1113] z-50">
        <button onClick={() => router.back()} className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-base font-black uppercase italic tracking-widest">Swap</h1>
        <button className="p-1 hover:bg-white/5 rounded-full transition-colors">
          <Settings2 className="w-5 h-5 text-white/60" />
        </button>
      </header>

      <main className="flex-1 flex flex-col pt-4 overflow-y-auto no-scrollbar">
        {/* FROM SECTION */}
        <div className="px-6 py-4 space-y-2">
          <div className="flex justify-between items-center h-20">
            <div className="flex-1 flex flex-col">
              <input 
                type="number" 
                placeholder="0" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-6xl font-black italic outline-none tracking-tighter text-white placeholder:text-white/10" 
              />
              <p className="text-sm font-medium text-white/30 italic mt-1">${fromUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#1C2024] hover:bg-[#252A2E] pl-2 pr-4 py-2 rounded-full border border-white/5 shadow-xl transition-all active:scale-95">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentFromAsset.color)}>
                      <currentFromAsset.icon className="text-white w-full h-full" />
                    </div>
                    <span className="text-sm font-black italic uppercase tracking-tighter">{fromAsset}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1C2024] border-white/10 text-white rounded-2xl p-2 min-w-[140px] shadow-2xl">
                  {ASSETS.filter(a => a.symbol !== toAsset).map((a) => (
                    <DropdownMenuItem key={a.symbol} onClick={() => setFromAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-white/5">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                      <span className="font-black italic uppercase text-xs">{a.symbol}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1.5 mr-1">
                 <span className={cn("text-[10px] font-black uppercase italic", isInsufficient ? "text-rose-500" : "text-white/30")}>
                    {userBalance.toFixed(fromAsset === 'IDR' ? 0 : 4)} {fromAsset}
                 </span>
                 <button 
                  onClick={() => setAmount(userBalance.toString())}
                  className="text-blue-500 font-black text-[9px] uppercase hover:underline"
                >
                  Maks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER WITH SWAP ICON */}
        <div className="relative h-px bg-white/5 w-full flex justify-center items-center my-2">
          <button 
            onClick={() => { const old = fromAsset; setFromAsset(toAsset); setToAsset(old); setAmount(""); }}
            className="w-10 h-10 bg-[#1C2024] border-[4px] border-[#0F1113] rounded-full flex items-center justify-center text-white/60 active:scale-90 transition-transform shadow-xl z-20"
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>

        {/* TO SECTION */}
        <div className="px-6 py-4 space-y-2">
          <div className="flex justify-between items-center h-20">
            <div className="flex-1 flex flex-col">
              <div className="text-6xl font-black italic tracking-tighter text-white">
                {convertedValue}
              </div>
              <p className="text-sm font-medium text-white/30 italic mt-1">${toUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 bg-[#1C2024] hover:bg-[#252A2E] pl-2 pr-4 py-2 rounded-full border border-white/5 shadow-xl transition-all active:scale-95">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center p-1.5 shadow-inner", currentToAsset.color)}>
                      <currentToAsset.icon className="text-white w-full h-full" />
                    </div>
                    <span className="text-sm font-black italic uppercase tracking-tighter">{toAsset}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1C2024] border-white/10 text-white rounded-2xl p-2 min-w-[140px] shadow-2xl">
                  {ASSETS.filter(a => a.symbol !== fromAsset).map((a) => (
                    <DropdownMenuItem key={a.symbol} onClick={() => setToAsset(a.symbol)} className="rounded-xl p-3 flex items-center gap-3 cursor-pointer focus:bg-white/5">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center p-1", a.color)}><a.icon className="text-white w-full h-full" /></div>
                      <span className="font-black italic uppercase text-xs">{a.symbol}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-white/20 italic mr-1">
                <span>Wallet 1 / AliBank</span>
                <Pencil className="w-2.5 h-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* DETAILED INFO SECTION */}
        <div className="mt-8 px-6 space-y-4 pb-10">
          <DetailRow label="Tarif" value={`1 ${fromAsset} = ${(prices[fromAsset]/prices[toAsset]/MARKUP).toFixed(4)} ${toAsset}`} icon />
          <DetailRow label="Biaya jaringan" value="$0.0004" icon />
          <DetailRow label="Selip" value="2%" edit icon />
          <DetailRow label="Dampak harga" value="0%" icon />
          <DetailRow label="Minimum yang diterima" value={`${(parseFloat(convertedValue) * 0.98).toFixed(4)} ${toAsset}`} icon />
          <DetailRow label="Penerima" value="Wallet 1 / AliBank" edit />
        </div>
      </main>

      {/* FOOTER CTA */}
      <footer className="p-6 bg-[#0F1113] pb-12 space-y-4">
        <Button 
          disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
          onClick={handleConvert}
          className={cn(
            "w-full h-16 rounded-3xl font-black italic uppercase transition-all duration-300 border-none shadow-none text-base",
            isInsufficient 
              ? "bg-[#1C2024] text-white/20" 
              : (!amount || parseFloat(amount) <= 0)
                ? "bg-[#1C2024] text-white/20"
                : "gold-gradient text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95"
          )}
        >
          {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (isInsufficient ? "Dana tidak cukup" : !amount ? "Pilih jumlah" : "Konfirmasi Swap")}
        </Button>
        <p className="text-center text-[10px] font-bold text-white/30 uppercase tracking-tighter">
          Termasuk biaya MM sebesar 0.875%.
        </p>
      </footer>
    </div>
  );
}

function DetailRow({ label, value, edit = false, icon = false }: { label: string; value: string; edit?: boolean; icon?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-medium text-white/40 italic">{label}</span>
        {icon && <Info className="w-3 h-3 text-white/10" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-black italic text-white/80">{value}</span>
        {edit && <Pencil className="w-2.5 h-2.5 text-white/20" />}
        {label === "Tarif" && <ChevronDown className="w-3 h-3 text-white/20 rotate-[-90deg]" />}
      </div>
    </div>
  );
}
