
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Coins, 
  Zap, 
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
  TrendingDown,
  Pickaxe,
  ExternalLink,
  Target,
  Globe,
  Award,
  Image as ImageIcon,
  Check,
  CheckCircle,
  Circle
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
import { doc, updateDoc, setDoc } from "firebase/firestore";

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
  const [burnAmountInput, setBurnAmountInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const liquidityRef = useMemoFirebase(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const alxTransactions = auditLogs?.filter((log: any) => 
    log.cryptoCurrency === "ALX" || 
    log.description?.toLowerCase().includes("alx") || 
    log.category?.toLowerCase().includes("tokenomics") ||
    log.category === "Ali-Exchange"
  );

  const handleMint = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast({ variant: "destructive", title: "MetaMask Tidak Terdeteksi", description: "Gunakan browser dengan ekstensi Web3." });
      return;
    }
    
    if (isProcessing || !mintAmount) return;
    setIsProcessing(true);
    
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      
      const hash = await mintALX(await signer.getAddress(), mintAmount, signer);
      toast({ title: "Mint Berhasil", description: `${mintAmount} ALX telah dicetak on-chain. Hash: ${hash.slice(0,10)}...` });
      setMintAmount("");
    } catch (err: any) {
      console.error("MetaMask Error:", err);
      toast({ 
        variant: "destructive", 
        title: "Operasi Gagal", 
        description: err.message || "Pastikan Anda adalah pemilik kontrak dan MetaMask berada di jaringan Polygon." 
      });
    } finally { setIsProcessing(false); }
  };

  const handleBurn = async () => {
    if (typeof window === 'undefined' || !window.ethereum || !burnAmountInput) return;
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();
      const hash = await burnALX(burnAmountInput, signer);
      toast({ title: "Burn Berhasil", description: `${burnAmountInput} ALX dibakar. Hash: ${hash.slice(0,10)}...` });
      setBurnAmountInput("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Burn Gagal", description: err.message });
    } finally { setIsProcessing(false); }
  };

  const toggleBrandingStep = async (field: string, currentVal: boolean) => {
    if (!db) return;
    try {
      await setDoc(doc(db, "system", "branding_status"), {
        [field]: !currentVal
      }, { merge: true });
      toast({ title: "Status Diperbarui" });
    } catch (e) {}
  };

  const brandingRef = useMemoFirebase(() => (db ? doc(db, "system", "branding_status") : null), [db]);
  const { data: brandingStatus } = useDoc(brandingRef);

  const openPolygonScan = () => {
    window.open("https://polygonscan.com/token/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd", "_blank");
  };

  const openUpdateToken = () => {
    window.open("https://polygonscan.com/tokenupdate/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd", "_blank");
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0"><Coins className="text-white w-full h-full" /></div>
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">ALX Tokenomics Terminal</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase mt-1">Contract logic synchronized with Polygon Mainnet</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={openPolygonScan}
            className="rounded-full h-10 px-6 border-primary/20 text-primary font-black uppercase text-[10px] italic shadow-sm hover:bg-primary/5"
          >
            VIEW ON POLYGONSCAN <ExternalLink className="w-3.5 h-3.5 ml-2" />
          </Button>
          <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg border-none flex items-center">
            V3.1 ON-CHAIN PROTOCOL ACTIVE
          </Badge>
        </div>
      </header>

      {/* Internal vs On-Chain Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <TokenStatCard label="Internal Vault Liquidity" value={`${globalLiquidity?.alixVaultBalance?.toLocaleString() || '0'} ALX`} sub="Available for Internal Trade" icon={Database} color="text-primary" />
        <TokenStatCard label="On-Chain Total Supply" value={`${isLoadingAlix ? '...' : Number(totalSupply).toLocaleString()} ALX`} sub={`Max: ${Number(maxSupply).toLocaleString()}`} icon={Zap} />
        <TokenStatCard label="Circulation Rate" value={`${circulationRate.toFixed(2)}%`} sub="Supply vs Max Cap" icon={Activity} color="text-blue-500" />
        <TokenStatCard label="Remaining Mintable" value={`${isLoadingAlix ? '...' : Number(remainingMintable).toLocaleString()}`} sub="Available Mint Quota" icon={TrendingDown} color="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-black italic uppercase tracking-tight">Authorized Operations</h4>
            <Badge variant="outline" className="border-green-500/20 text-green-600 font-black text-[8px] px-3 h-6 uppercase italic">Owner Signature Required</Badge>
          </div>
          
          <div className="space-y-8">
            <div className="p-8 rounded-[2.5rem] bg-muted/50 border border-border space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Mint Amount (ALX)</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={mintAmount} 
                    onChange={(e) => setMintAmount(e.target.value)} 
                    className="h-16 bg-background border-none rounded-2xl font-black italic text-2xl pl-8 pr-20 focus:ring-2 focus:ring-primary/20" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-primary italic">ALX</div>
                </div>
              </div>
              <Button onClick={handleMint} disabled={!mintAmount || isProcessing} className="w-full h-14 gold-gradient text-white rounded-xl font-black uppercase italic tracking-widest shadow-xl border-none active:scale-[0.98] transition-transform">
                {isProcessing ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN MINT"}
              </Button>
            </div>

            <div className="p-8 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-rose-600/60 ml-2">Burn Amount (Deflation)</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    value={burnAmountInput} 
                    onChange={(e) => setBurnAmountInput(e.target.value)} 
                    className="h-16 bg-background border-none rounded-2xl font-black italic text-2xl pl-8 pr-20 focus:ring-2 focus:ring-rose-500/20" 
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-rose-500 italic">ALX</div>
                </div>
              </div>
              <Button onClick={handleBurn} disabled={!burnAmountInput || isProcessing} className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase italic tracking-widest shadow-xl border-none active:scale-[0.98] transition-transform">
                {isProcessing ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-2"><Pickaxe className="w-4 h-4" /> EXECUTE TOKEN BURN</span>}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 flex flex-col justify-center space-y-8 shadow-sm">
          <h4 className="text-xl font-black italic uppercase tracking-tight text-center">Supply Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'In Circulation', value: Number(totalSupply) }, 
                    { name: 'Remaining Mintable', value: Number(remainingMintable) }
                  ]} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                >
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
              <Badge className={cn("text-[8px] font-black h-5 uppercase border-none", isPaused ? "bg-rose-500 text-white" : "bg-green-500 text-white")}>
                {isPaused ? "Paused" : "Active"}
              </Badge>
            </div>
            <Button onClick={async () => {
              if (typeof window === 'undefined' || !window.ethereum) return;
              setIsProcessing(true);
              try {
                const provider = new BrowserProvider(window.ethereum as any);
                const signer = await provider.getSigner();
                await togglePause(signer);
                toast({ title: "Status Kontrak Diperbarui" });
              } catch (e: any) {
                toast({ variant: "destructive", title: "Operasi Gagal", description: e.message });
              } finally { setIsProcessing(false); }
            }} variant="outline" className="w-full text-[10px] font-black uppercase italic h-12 border-primary/20">
              {isProcessing ? <Loader2 className="animate-spin" /> : "TOGGLE EMERGENCY PAUSE"}
            </Button>
          </div>
        </Card>
      </div>

      {/* BRANDING PROGRESS TRACKER - NEW SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-12 border-none bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
          
          <div className="relative z-10 space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <Badge className="bg-primary text-black font-black text-[8px] uppercase px-3 h-5 border-none tracking-widest mb-2">ALX BRANDING COMMAND CENTER</Badge>
                <h4 className="text-3xl font-black italic uppercase tracking-tighter">Branding & Identity Status</h4>
              </div>
              <Button onClick={openUpdateToken} className="h-12 px-8 gold-gradient text-white rounded-xl font-black uppercase italic text-xs shadow-lg">
                MANAGE ON POLYGONSCAN <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BrandingStatusItem 
                title="Verify Ownership" 
                desc="Buktikan kepemilikan dompet via Signed Message di PolygonScan."
                isDone={brandingStatus?.ownershipVerified}
                onToggle={() => toggleBrandingStep('ownershipVerified', !!brandingStatus?.ownershipVerified)}
              />
              <BrandingStatusItem 
                title="Upload Logo Icon" 
                desc="Unggah Ikon Bintang AliBank (64x64 PNG) agar tampil di dompet."
                isDone={brandingStatus?.logoUploaded}
                onToggle={() => toggleBrandingStep('logoUploaded', !!brandingStatus?.logoUploaded)}
              />
              <BrandingStatusItem 
                title="Social Info Sync" 
                desc="Tautkan website, Twitter, dan deskripsi koin secara resmi."
                isDone={brandingStatus?.socialsSynced}
                onToggle={() => toggleBrandingStep('socialsSynced', !!brandingStatus?.socialsSynced)}
              />
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex gap-4">
              <Info className="w-6 h-6 text-primary shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase italic">Informasi Moderasi</p>
                <p className="text-[10px] font-medium text-white/60 leading-relaxed italic uppercase">
                  Setelah mengirim formulir di PolygonScan, tim mereka akan meninjau logo Anda dalam <span className="text-white font-bold">24-72 jam</span>. Pastikan Anda mencentang checklist di atas jika sudah menyelesaikan langkahnya.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-primary" /> Recent ALX Operations
          </h3>
          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5">On-Chain Ledger</Badge>
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
    <Card className="border-none bg-card rounded-[2.5rem] p-8 space-y-4 shadow-sm border border-border/50">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <Icon className={cn("w-4 h-4 opacity-20", color)} />
      </div>
      <p className={cn("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
    </Card>
  );
}

function BrandingStatusItem({ title, desc, isDone, onToggle }: any) {
  return (
    <button 
      onClick={onToggle}
      className={cn(
        "p-6 rounded-2xl border transition-all text-left space-y-3 active:scale-95 group",
        isDone ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10 hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-center">
        {isDone ? <CheckCircle className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-white/20 group-hover:text-primary/40" />}
        <Badge className={cn("text-[7px] font-black uppercase", isDone ? "bg-green-500 text-white" : "bg-white/10 text-white/40")}>
          {isDone ? "COMPLETE" : "PENDING"}
        </Badge>
      </div>
      <div>
        <h5 className={cn("text-sm font-black uppercase italic tracking-tight", isDone ? "text-green-400" : "text-white")}>{title}</h5>
        <p className="text-[10px] font-medium text-white/40 leading-tight italic uppercase mt-1">{desc}</p>
      </div>
    </button>
  );
}
