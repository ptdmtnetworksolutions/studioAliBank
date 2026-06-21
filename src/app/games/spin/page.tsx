
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { 
  ArrowLeft, 
  RotateCw, 
  Zap, 
  Trophy, 
  Coins, 
  History, 
  Info,
  ChevronDown,
  Plus,
  Minus,
  Loader2,
  Gift,
  Flame,
  Volume2,
  VolumeX,
  Sparkles,
  Dice5,
  LayoutGrid,
  FileText,
  TrendingUp,
  Wallet,
  Delete
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

const SYMBOLS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "ALX"];
const ALX_PRICE_IDR = 194004;

export default function AliSpinPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();

  const [mounted, setMounted] = useState(false);
  const [reels, setReels] = useState(["7", "7", "7"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [stakeCurrency, setStakeCurrency] = useState<'IDR' | 'ALX' | 'USDT' | 'ETH' | 'BTC'>('IDR');
  const [betAmount, setBetAmount] = useState(10000);
  const [freeSpins, setFreeSpins] = useState(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const audioCtx = useRef<AudioContext | null>(null);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);
  const dynamicAlxPriceUsdt = globalLiquidity?.lastAlxPriceUsdt || 12.24;
  const alxPriceIdr = useMemo(() => Math.round(dynamicAlxPriceUsdt * 15850), [dynamicAlxPriceUsdt]);

  useEffect(() => { 
    setMounted(true);
    return () => {
      if (audioCtx.current) audioCtx.current.close();
    };
  }, []);

  const playSound = (type: 'spin' | 'win' | 'loss') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtx.current) audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      if (type === 'spin') {
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1); });
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'loss') {
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const handleSpin = async () => {
    if (isSpinning || !userDocRef || !userData || !db) return;

    let balance = 0;
    if (stakeCurrency === 'IDR') balance = userData.totalBalance || 0;
    else balance = userData.cryptoBalances?.[stakeCurrency] || 0;

    if (freeSpins <= 0 && balance < betAmount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup" });
      return;
    }

    setIsSpinning(true);
    setLastWin(null);

    const amountInIdr = betAmount * (stakeCurrency === 'IDR' ? 1 : 17690);

    if (freeSpins <= 0) {
      const balanceKey = stakeCurrency === 'IDR' ? "totalBalance" : `cryptoBalances.${stakeCurrency}`;
      updateDoc(userDocRef, { [balanceKey]: increment(-betAmount) });
      
      const systemRef = doc(db, "system", "liquidity");
      updateDoc(systemRef, { 
        totalFiatInjected: increment(amountInIdr),
        spinGrossVolumeIdr: increment(amountInIdr) 
      });

      // Record bet transaction to user history for reconciliation audit compatibility
      addDoc(collection(db, "users", user!.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Taruhan Ali-Spin (${betAmount} ${stakeCurrency})`,
        category: "Game",
        amount: stakeCurrency === 'IDR' ? betAmount : 0,
        cryptoAmount: stakeCurrency !== 'IDR' ? betAmount : 0,
        cryptoCurrency: stakeCurrency !== 'IDR' ? stakeCurrency : null,
        type: 'expense',
        status: "success",
        timestamp: serverTimestamp()
      });
    } else {
      setFreeSpins(prev => prev - 1);
    }

    let spinCount = 0;
    const interval = setInterval(() => {
      playSound('spin');
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      spinCount++;
      if (spinCount > 20) {
        clearInterval(interval);
        finalizeResult();
      }
    }, 100);
  };

  const finalizeResult = async () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setReels(finalReels);
    
    const [r1, r2, r3] = finalReels;
    let multiplier = 0;
    let earnedFreeSpins = 0;
    let winDescription = "";

    if (r1 === r2 && r2 === r3) {
      if (r1 === "ALX") { multiplier = 50; earnedFreeSpins = 10; winDescription = "ALX JACKPOT!"; }
      else { multiplier = 10; winDescription = "BIG WIN!"; }
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      const match = r1 === r2 ? r1 : r3;
      if (match === "ALX") { multiplier = 5; earnedFreeSpins = 3; winDescription = "ALX SCATTER"; }
      else { multiplier = 2; winDescription = "MATCH!"; }
    }

    const globalAuditRef = collection(db!, "system", "audit", "global_transactions");
    const amountInIdr = betAmount * (stakeCurrency === 'IDR' ? 1 : 17690);

    if (multiplier > 0) {
      playSound('win');
      const winAmountInIdr = amountInIdr * multiplier;
      const winAmountInAlx = winAmountInIdr / alxPriceIdr;

      await updateDoc(userDocRef!, { "cryptoBalances.ALX": increment(winAmountInAlx) });
      const systemRef = doc(db!, "system", "liquidity");
      await updateDoc(systemRef, { 
        alixVaultBalance: increment(-winAmountInAlx),
        totalAlixSoldInternally: increment(winAmountInAlx)
      });

      setLastWin(winAmountInAlx);
      if (earnedFreeSpins > 0) setFreeSpins(prev => prev + earnedFreeSpins);

      // Audit Log for Admin
      await addDoc(globalAuditRef, {
        id: `SPIN-WIN-${Date.now()}`,
        category: "Ali-Spin Win",
        amountIdr: amountInIdr,
        description: `User ${userData?.name} won ${multiplier}x on Ali-Spin. Reward: ${winAmountInAlx.toFixed(6)} ALX.`,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user?.email
      });

      await addDoc(collection(db!, "users", user!.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Ali-Spin Win: ${winDescription} (${multiplier}x)`,
        category: "Game",
        cryptoAmount: winAmountInAlx,
        cryptoCurrency: "ALX",
        type: "income",
        status: "WIN",
        timestamp: serverTimestamp()
      });

      toast({ title: winDescription, description: `Dapatkan +${winAmountInAlx.toFixed(6)} ALX` });
    } else {
      playSound('loss');
      // Record loss to global audit for profit monitoring
      await addDoc(globalAuditRef, {
        id: `SPIN-LOSS-${Date.now()}`,
        category: "Ali-Spin Capture",
        amountIdr: amountInIdr,
        description: `Bank Profit: User ${userData?.name} lost ${betAmount} ${stakeCurrency} on Ali-Spin.`,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: user?.email
      });
    }
    setIsSpinning(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F1113] text-white flex flex-col font-body overflow-hidden">
      <header className="px-4 h-16 flex items-center justify-between bg-[#171A1D] border-b border-white/5 shrink-0">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-white/60" />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-base font-black italic tracking-tighter uppercase text-primary">Ali-Spin Pro</h1>
          <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Fortune Engine V3</span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          {soundEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-white/20" />}
        </button>
      </header>

      <div className="px-4 h-14 flex items-center justify-between bg-[#1C2024] shrink-0 border-b border-white/5">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shadow-inner">
              <Coins className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black italic uppercase text-white leading-none">
                {stakeCurrency === 'IDR' ? `Rp ${(userData?.totalBalance ?? 0).toLocaleString('id-ID')}` : `${(userData?.cryptoBalances?.[stakeCurrency] ?? 0).toFixed(6)} ${stakeCurrency}`}
              </span>
              <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Saldo Taruhan</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <LogoIcon className="text-primary w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black italic uppercase text-primary leading-none">
                {(userData?.cryptoBalances?.ALX ?? 0).toFixed(6)} ALX
              </span>
              <span className="text-[7px] font-bold text-primary/40 uppercase tracking-widest leading-none mt-0.5">
                ≈ Rp {((userData?.cryptoBalances?.ALX ?? 0) * alxPriceIdr).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {freeSpins > 0 && (
          <Badge className="bg-orange-500 animate-pulse text-white font-black italic text-[9px] px-3 h-6 rounded-full border-none shadow-xl shadow-orange-500/20">
            {freeSpins} SPINS
          </Badge>
        )}
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 gold-gradient opacity-5 blur-[120px]" />
        
        <div className="w-full max-w-sm aspect-square bg-[#171A1D] rounded-[3rem] border-4 border-white/5 shadow-2xl p-8 flex flex-col items-center justify-between relative overflow-hidden group">
          <div className="flex justify-center gap-4 w-full h-full items-center relative z-10">
            {reels.map((symbol, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 h-48 bg-[#0F1113] rounded-3xl border-2 border-white/5 flex items-center justify-center text-6xl font-black italic shadow-inner transition-all duration-300",
                  isSpinning ? "scale-95 opacity-50 blur-[1px]" : "scale-100 opacity-100",
                  symbol === "ALX" ? "text-primary drop-shadow-[0_0_15px_rgba(252,213,53,0.4)]" : "text-white/80"
                )}
              >
                {symbol === "ALX" ? <LogoIcon className="w-16 h-16" /> : symbol}
              </div>
            ))}
          </div>
        </div>

        <div className="h-24 flex flex-col items-center justify-center mt-8">
          {lastWin ? (
            <div className="animate-in zoom-in duration-500 text-center space-y-1">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">YOU WON</p>
              <p className="text-4xl font-black italic tracking-tighter text-white">+{lastWin.toFixed(6)} ALX</p>
              <p className="text-xs font-black text-green-500 uppercase tracking-widest italic bg-green-500/10 px-3 py-1 rounded-full">
                ≈ Rp {(lastWin * alxPriceIdr).toLocaleString('id-ID')}
              </p>
            </div>
          ) : (
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Press SPIN to start</p>
          )}
        </div>
      </main>

      <div className="bg-[#171A1D] p-4 space-y-4 pb-12 shrink-0 border-t border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1C2024] rounded-2xl p-1 flex items-center justify-between border border-white/5 h-16 relative">
            <button 
              onClick={() => setBetAmount(prev => Math.max(1000, prev - (stakeCurrency === 'IDR' ? 10000 : 0.001)))}
              disabled={isSpinning}
              className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20"
            >
              <Minus className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex-1 text-center flex flex-col items-center justify-center overflow-hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild disabled={isSpinning}>
                  <button className="flex items-center gap-1 text-[8px] font-black italic uppercase leading-none text-primary hover:text-primary/80 transition-colors mb-1">
                    {stakeCurrency} <ChevronDown className="w-2 h-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-[#1C2024] border-white/10 text-white rounded-xl">
                  {(['IDR', 'ALX', 'USDT', 'ETH', 'BTC'] as const).map((curr) => (
                    <DropdownMenuItem key={curr} onClick={() => { setStakeCurrency(curr); setBetAmount(curr === 'IDR' ? 10000 : 0.01); }} className="font-black text-[10px] uppercase italic focus:bg-primary/20">
                      {curr}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <input type="number" value={betAmount} onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)} disabled={isSpinning} className="w-full bg-transparent text-center text-base font-black italic outline-none border-none p-0 focus:ring-0 appearance-none text-white" />
            </div>
            <button onClick={() => setBetAmount(prev => prev + (stakeCurrency === 'IDR' ? 10000 : 0.001))} disabled={isSpinning} className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20">
              <Plus className="w-4 h-4 text-white/40" />
            </button>
          </div>
          <Button onClick={handleSpin} disabled={isSpinning} className={cn("h-16 rounded-2xl text-lg font-black italic uppercase shadow-2xl transition-all active:scale-95 border-none", freeSpins > 0 ? "bg-orange-500 text-white animate-pulse" : "gold-gradient text-white")}>
            {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : (freeSpins > 0 ? "FREE SPIN" : "SPIN")}
          </Button>
        </div>
      </div>
    </div>
  );
}
