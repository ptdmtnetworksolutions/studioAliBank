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
  LayoutGrid
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
import { useUser, useDoc, useFirestore } from "@/firebase";
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

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  useEffect(() => { setMounted(true); }, []);

  // Mekanisme Spin Utama
  const handleSpin = async () => {
    if (isSpinning || !userDocRef || !userData || !db) return;

    let balance = 0;
    if (stakeCurrency === 'IDR') balance = userData.totalBalance || 0;
    else balance = userData.cryptoBalances?.[stakeCurrency] || 0;

    // Hanya potong saldo jika bukan free spin
    if (freeSpins <= 0 && balance < betAmount) {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: `Isi ulang ${stakeCurrency} Anda.` });
      return;
    }

    setIsSpinning(true);
    setLastWin(null);

    // 1. Potong Saldo (Jika bukan free spin)
    if (freeSpins <= 0) {
      const balanceKey = stakeCurrency === 'IDR' ? "totalBalance" : `cryptoBalances.${stakeCurrency}`;
      updateDoc(userDocRef, { [balanceKey]: increment(-betAmount) });
      
      // Update likuiditas sistem (Bank Profit)
      const systemRef = doc(db, "system", "liquidity");
      updateDoc(systemRef, { 
        totalFiatInjected: increment(stakeCurrency === 'IDR' ? betAmount : 0),
        spinGrossVolumeIdr: increment(betAmount * (stakeCurrency === 'IDR' ? 1 : 15850)) 
      });
    } else {
      setFreeSpins(prev => prev - 1);
    }

    // 2. Animasi Acak (Client Side Simulation)
    let spinCount = 0;
    const interval = setInterval(() => {
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
    }, 80);
  };

  const finalizeResult = () => {
    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    
    // Cheat Logic: ALX simbol punya probabilitas sedikit lebih rendah tapi reward tinggi
    // Untuk demo, kita gunakan random murni
    setReels(finalReels);
    
    const [r1, r2, r3] = finalReels;
    let multiplier = 0;
    let earnedFreeSpins = 0;
    let winDescription = "";

    // CEK KONDISI MENANG
    if (r1 === r2 && r2 === r3) {
      // 3 Matching
      if (r1 === "ALX") {
        multiplier = 50;
        earnedFreeSpins = 10;
        winDescription = "ALX JACKPOT!";
      } else {
        multiplier = 10;
        winDescription = "BIG WIN!";
      }
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      // 2 Matching
      const match = r1 === r2 ? r1 : r3;
      if (match === "ALX") {
        multiplier = 5;
        earnedFreeSpins = 3;
        winDescription = "ALX SCATTER";
      } else {
        multiplier = 2;
        winDescription = "MATCH!";
      }
    }

    if (multiplier > 0) {
      const stakeInIdr = betAmount * (stakeCurrency === 'IDR' ? 1 : 15850);
      const winAmountInIdr = stakeInIdr * multiplier;
      const winAmountInAlx = winAmountInIdr / ALX_PRICE_IDR;

      // Berikan Hadiah dalam ALX
      updateDoc(userDocRef!, { "cryptoBalances.ALX": increment(winAmountInAlx) });
      setLastWin(winAmountInAlx);
      
      if (earnedFreeSpins > 0) setFreeSpins(prev => prev + earnedFreeSpins);

      // Log & Notif
      addDoc(collection(db!, "users", user!.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Ali-Spin Win: ${winDescription} (${multiplier}x)`,
        category: "Game",
        stake: betAmount,
        currency: stakeCurrency,
        rewardAlx: winAmountInAlx,
        status: "WIN",
        timestamp: serverTimestamp()
      });

      toast({
        title: winDescription,
        description: `Selamat! Anda mendapatkan +${winAmountInAlx.toFixed(6)} ALX ${earnedFreeSpins > 0 ? `& ${earnedFreeSpins} Free Spins!` : ""}`,
      });
    }

    setIsSpinning(false);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0F1113] text-white flex flex-col font-body overflow-hidden">
      {/* Header Elit */}
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

      {/* Stats Bar */}
      <div className="px-4 h-12 flex items-center justify-between bg-[#1C2024] shrink-0 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            <Coins className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black italic uppercase text-white leading-none">
              {stakeCurrency === 'IDR' ? `Rp ${(userData?.totalBalance ?? 0).toLocaleString()}` : `${(userData?.cryptoBalances?.[stakeCurrency] ?? 0).toFixed(6)} ${stakeCurrency}`}
            </span>
            <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Saldo Anda</span>
          </div>
        </div>
        {freeSpins > 0 && (
          <Badge className="bg-orange-500 animate-pulse text-white font-black italic text-[9px] px-3 h-6 rounded-full border-none">
            {freeSpins} FREE SPINS LEFT
          </Badge>
        )}
      </div>

      {/* Main Reel Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 gold-gradient opacity-5 blur-[120px]" />
        
        {/* Slot Machine Container */}
        <div className="w-full max-w-sm aspect-square bg-[#171A1D] rounded-[3rem] border-4 border-white/5 shadow-2xl p-8 flex flex-col items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/matrix/800/800')] opacity-[0.02] mix-blend-overlay" />
          
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

          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#171A1D] to-transparent z-20 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#171A1D] to-transparent z-20 pointer-events-none" />
        </div>

        {/* Win Display */}
        <div className="h-20 flex flex-col items-center justify-center mt-8">
          {lastWin ? (
            <div className="animate-in zoom-in duration-500 text-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-1 italic">YOU WON</p>
              <p className="text-4xl font-black italic tracking-tighter text-white">+{lastWin.toFixed(6)} ALX</p>
            </div>
          ) : (
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">Press SPIN to start</p>
          )}
        </div>
      </main>

      {/* Control Panel */}
      <div className="bg-[#171A1D] p-6 space-y-6 pb-12 shrink-0 border-t border-white/5">
        <div className="grid grid-cols-2 gap-4">
          {/* Bet Selector */}
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
              <input 
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                disabled={isSpinning}
                className="w-full bg-transparent text-center text-base font-black italic outline-none border-none p-0 focus:ring-0 appearance-none text-white"
              />
            </div>

            <button 
              onClick={() => setBetAmount(prev => prev + (stakeCurrency === 'IDR' ? 10000 : 0.001))}
              disabled={isSpinning}
              className="w-10 h-full flex items-center justify-center hover:bg-white/5 rounded-xl transition-colors disabled:opacity-20"
            >
              <Plus className="w-4 h-4 text-white/40" />
            </button>
          </div>

          {/* Spin Button */}
          <Button 
            onClick={handleSpin}
            disabled={isSpinning}
            className={cn(
              "h-16 rounded-2xl text-lg font-black italic uppercase shadow-2xl transition-all active:scale-95 border-none",
              freeSpins > 0 ? "bg-orange-500 text-white animate-pulse" : "gold-gradient text-white"
            )}
          >
            {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : (freeSpins > 0 ? "FREE SPIN" : "SPIN")}
          </Button>
        </div>

        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <Dice5 className="w-4 h-4 text-primary/40" />
            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest italic">RTP: 96.5% AliBank Standard</span>
          </div>
          <div className="flex items-center gap-4">
            <History className="w-4 h-4 text-white/40 cursor-pointer hover:text-primary transition-colors" />
            <div className="w-4 h-4 text-white/40 cursor-pointer hover:text-primary transition-colors">
              <Info className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <footer className="h-16 bg-[#171A1D] border-t border-white/5 flex items-center justify-around shrink-0 px-2 pb-safe">
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full" onClick={() => router.push('/')}>
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Dashboard</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-100 w-full text-primary">
          <RotateCw className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Ali-Spin</span>
        </button>
        <button className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity w-full">
          <Trophy className="w-5 h-5" />
          <span className="text-[8px] font-black uppercase italic">Tournament</span>
        </button>
      </footer>
    </div>
  );
}
