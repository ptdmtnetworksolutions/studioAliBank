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
  AlertCircle,
  ShieldCheck,
  Lock,
  ArrowRightLeft,
  Database,
  Info,
  Clock,
  History,
  CheckCircle2,
  TrendingDown
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
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function TokenomicsView({ 
  totalSupply, 
  maxSupply, 
  remainingMintable, 
  circulationRate, 
  isPaused, 
  isLoadingAlix, 
  mintALX, 
  burnALX, 
  togglePause,
  auditLogs
}: any) {
  const { toast } = useToast();
  const db = useFirestore();
  const [mintAmount, setMintAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fatch Internal Vault Balance (Firestore)
  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const alxTransactions = auditLogs?.filter((log: any) => 
    log.cryptoCurrency === "ALX" || 
    log.description?.toLowerCase().includes("alx") || 
    log.category?.toLowerCase().includes("tokenomics") ||
    log.category === "Ali-Exchange" ||
    log.description?.includes("ALX")
  );

  const handleMint = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({ variant: "destructive", title: "MetaMask Tidak Terdeteksi", description: "Gunakan browser dengan ekstensi Web3." });
      return;
    }
    
    if (isProcessing || !mintAmount) return;
    setIsProcessing(true);
    
    try {
      // Pastikan MetaMask siap & terhubung
      const provider = new BrowserProvider(window.ethereum as any);
      
      // Cek apakah extension merespons
      try {
        await (window.ethereum as any).request({ method: 'eth_accounts' });
      } catch (e) {
        throw new Error("MetaMask terkunci atau tidak merespons.");
      }

      const signer = await provider.getSigner();
      await mintALX(await signer.getAddress(), mintAmount, signer);
      toast({ title: "Mint Berhasil", description: `${mintAmount} ALX telah dicetak on-chain.` });
      setMintAmount("");
    } catch (err: any) {
      console.error("MetaMask Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Koneksi MetaMask Gagal", 
        description: err.message || "Pastikan Anda sudah login ke dompet MetaMask Anda." 
      });
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

      {/* Internal vs On-Chain Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TokenStatCard label="Internal Vault Liquidity" value={`${globalLiquidity?.alixVaultBalance?.toLocaleString() || '0'} ALX`} sub="Available for Internal Trade" icon={Database} color="text-primary" />
        <TokenStatCard label="On-Chain Total Supply" value={`${isLoadingAlix ? '...' : Number(totalSupply).toLocaleString()} ALX`} sub={`Max: ${Number(maxSupply).toLocaleString()}`} icon={Zap} />
        <TokenStatCard label="Circulation Rate" value={`${circulationRate.toFixed(2)}%`} sub="Supply vs Max Cap" icon={Activity} color="text-blue-500" />
        <TokenStatCard label="Internal Gross Sales" value={`Rp ${globalLiquidity?.totalInternalAumIdr?.toLocaleString() || '0'}`} sub="Revenue from ALX Sales" icon={TrendingDown} color="text-green-600" />
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
            <Button onClick={handleMint} disabled={!mintAmount || isProcessing} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base">
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
              try {
                const provider = new BrowserProvider(window.ethereum as any);
                const signer = await provider.getSigner();
                await togglePause(signer);
                toast({ title: "Status Kontrak Diperbarui" });
              } catch (e) {
                toast({ variant: "destructive", title: "Gagal Menghubungkan MetaMask" });
              }
            }} variant="outline" className="w-full text-[10px] font-black uppercase italic h-10 border-primary/20">TOGGLE EMERGENCY PAUSE</Button>
          </div>
        </Card>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Recent ALX Operations
          </h3>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5">Internal & On-Chain</Badge>
        </div>
        <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                <tr>
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Activity</th>
                  <th className="px-8 py-5">Value (IDR)</th>
                  <th className="px-8 py-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alxTransactions?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-8 py-4 text-[10px] font-mono font-bold text-muted-foreground italic">
                      {log.timestamp?.toDate?.().toLocaleString() || '---'}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col">
                        <Badge className="bg-muted text-foreground border-none text-[7px] font-black h-4 uppercase px-1.5 w-fit mb-1">{log.category}</Badge>
                        <span className="text-[10px] font-black uppercase italic text-accent">{log.description?.slice(0, 60)}...</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-[11px] font-black italic text-primary">
                      {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : '---'}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-green-600 uppercase italic">
                        <CheckCircle2 className="w-3 h-3" /> Confirmed
                      </div>
                    </td>
                  </tr>
                ))}
                {(!alxTransactions || alxTransactions.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-8 py-10 text-center opacity-30 italic text-xs font-bold uppercase tracking-widest">No ALX records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </section>
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