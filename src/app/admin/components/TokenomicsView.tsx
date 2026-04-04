
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Zap, 
  Globe, 
  Activity, 
  Flame, 
  Loader2, 
  PieChart as PieIcon, 
  AlertCircle 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as RechartsTooltip 
} from "recharts";
import { BrowserProvider } from "ethers";
import { useToast } from "@/hooks/use-toast";

export function TokenomicsView({ 
  totalSupply, 
  maxSupply, 
  remainingMintable, 
  circulationRate, 
  isPaused, 
  isLoadingAlix, 
  mintALX, 
  burnALX, 
  togglePause 
}: any) {
  const { toast } = useToast();
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMint = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({ variant: "destructive", title: "MetaMask Required" });
      return;
    }
    if (isProcessing || !mintAmount) return;
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      await mintALX(await signer.getAddress(), mintAmount, signer);
      toast({ title: "Mint Success" });
      setMintAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Mint Failed", description: err.message });
    } finally { setIsProcessing(false); }
  };

  const handleBurn = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    if (isProcessing || !burnAmount) return;
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      await burnALX(burnAmount, signer);
      toast({ title: "Burn Success" });
      setBurnAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Burn Failed", description: err.message });
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0"><Coins className="text-white w-full h-full" /></div>
          <div><h3 className="text-3xl font-black italic uppercase tracking-tighter">ALX Tokenomics Terminal</h3><p className="text-xs font-bold text-muted-foreground uppercase mt-1">Contract logic synchronized with V3.1 Protocol</p></div>
        </div>
        <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">V3.1 PROTOCOL ACTIVE</Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TokenStatCard label="Total Supply" value={`${isLoadingAlix ? '...' : Number(totalSupply).toLocaleString()} ALX`} sub={`Max: ${Number(maxSupply).toLocaleString()}`} icon={Zap} />
        <TokenStatCard label="Remaining Mintable" value={`${isLoadingAlix ? '...' : Number(remainingMintable).toLocaleString()} ALX`} sub="Available to Mint" icon={Globe} color="text-green-600" />
        <TokenStatCard label="Circulation Rate" value={`${circulationRate.toFixed(2)}%`} sub="Supply vs Max Cap" icon={Activity} color="text-blue-500" />
        <TokenStatCard label="Burn Pool" value={`${(Number(maxSupply) - Number(totalSupply)).toLocaleString()} ALX`} sub="Deflation Realized" icon={Flame} color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-black italic uppercase tracking-tight">Authorized Minting Terminal</h4>
            <Badge variant="outline" className="border-green-500/20 text-green-600 font-black text-[8px] px-3 h-6 uppercase italic">OnlyOwner Protection</Badge>
          </div>
          <div className="p-10 rounded-[2.5rem] bg-muted/50 border border-border space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Mint Amount (ALX)</label>
              <div className="relative">
                <Input type="number" placeholder="0.00" value={mintAmount} onChange={(e) => setMintAmount(e.target.value)} className="h-20 bg-background border-none rounded-3xl font-black italic text-4xl pl-10 pr-24" />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-xl font-black text-primary italic">ALX</div>
              </div>
            </div>
            <Button onClick={handleMint} disabled={!mintAmount || isProcessing} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
              {isProcessing ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN MINT"}
            </Button>
          </div>
        </Card>
        <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 flex flex-col justify-center space-y-8 shadow-sm">
          <h4 className="text-xl font-black italic uppercase tracking-tight text-center">Supply Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ name: 'Supply', value: Number(totalSupply) }, { name: 'Unminted', value: Number(remainingMintable) }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  <Cell fill="hsl(var(--primary))" />
                  <Cell fill="hsl(var(--muted))" />
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
              <span>Status Kontrak</span>
              <Badge className={cn("text-[8px] font-black h-5 uppercase", isPaused ? "bg-rose-500" : "bg-green-500")}>
                {isPaused ? "Paused" : "Active"}
              </Badge>
            </div>
            <Button onClick={async () => {
              if (typeof window === 'undefined' || !window.ethereum) return;
              const provider = new BrowserProvider(window.ethereum as any);
              const signer = await provider.getSigner();
              await togglePause(signer);
              toast({ title: "Status Updated" });
            }} variant="outline" className="w-full text-[10px] font-black uppercase italic h-10 border-primary/20">TOGGLE EMERGENCY PAUSE</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TokenStatCard({ label, value, sub, icon: Icon, color = "text-accent" }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 space-y-4 shadow-sm">
      <div className="flex justify-between items-start"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p><Icon className={cn("w-4 h-4 opacity-20", color)} /></div>
      <p className={cn("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
    </Card>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
