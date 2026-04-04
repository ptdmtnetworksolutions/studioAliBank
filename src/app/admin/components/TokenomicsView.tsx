
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
  Info
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
              const provider = new BrowserProvider(window.ethereum as any);
              const signer = await provider.getSigner();
              await togglePause(signer);
              toast({ title: "Status Updated" });
            }} variant="outline" className="w-full text-[10px] font-black uppercase italic h-10 border-primary/20">TOGGLE EMERGENCY PAUSE</Button>
          </div>
        </Card>
      </div>

      <section className="space-y-8 pt-10 border-t border-border/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tight text-accent dark:text-white">Arsitektur Alix Coin V3.1</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-4 group hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h5 className="font-black uppercase italic text-sm">Standar & Jaringan</h5>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase italic">
              Kontrak ini menggunakan standar <span className="text-accent font-bold">ERC-20</span> yang berjalan di atas jaringan <span className="text-indigo-500 font-bold">Polygon POS</span>. Ini menjamin transaksi super cepat dengan biaya gas yang sangat rendah.
            </p>
          </Card>

          <Card className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-4 group hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
              <Flame className="w-6 h-6" />
            </div>
            <h5 className="font-black uppercase italic text-sm">Deflasi Otomatis</h5>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase italic">
              Implementasi <span className="text-accent font-bold">ERC20Burnable</span> memungkinkan AliBank untuk melakukan pembakaran suplai secara permanen guna mendukung kelangkaan aset dan kenaikan nilai jangka panjang.
            </p>
          </Card>

          <Card className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-4 group hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 shadow-inner">
              <Fingerprint className="w-6 h-6" />
            </div>
            <h5 className="font-black uppercase italic text-sm">Fitur ERC20Permit</h5>
            <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase italic">
              Mendukung <span className="text-accent font-bold">Gasless Approval</span> melalui tanda tangan EIP-712. Pengguna dapat memberikan izin transaksi tanpa harus membayar biaya gas di awal, meningkatkan kenyamanan UX.
            </p>
          </Card>
        </div>

        <div className="p-10 rounded-[3rem] bg-accent/5 border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><LogoIcon className="w-32 h-32 text-primary" /></div>
          <h4 className="text-lg font-black uppercase italic mb-6 flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" /> Kebijakan Pengelolaan Aset:
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <li className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="text-[11px] font-black uppercase text-accent leading-none mb-1">Aset Yang Diterima/Dikirim</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Kontrak ini secara eksklusif mengelola koin **ALX**. Anda dapat mengirim dan menerima ALX dari/ke dompet mana pun. Kontrak tidak menerima koin lain (seperti MATIC atau USDT) secara fungsional di dalam logikanya.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="text-[11px] font-black uppercase text-accent leading-none mb-1">Hard Cap Supply</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Suplai maksimum dibatasi secara permanen di angka **100.000.000 ALX**. Kode kontrak menjamin tidak ada fungsi yang dapat menambah suplai di atas batas ini.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="text-[11px] font-black uppercase text-accent leading-none mb-1">Circuit Breaker (Pausable)</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Dalam kondisi darurat keamanan, Admin memiliki wewenang untuk membekukan seluruh transaksi ALX secara global guna melindungi aset nasabah.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div>
                <p className="text-[11px] font-black uppercase text-accent leading-none mb-1">Institutional Audit Trail</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Setiap operasi Mint, Burn, dan Pause memicu Event log di blockchain yang dapat diaudit oleh publik di Polygonscan secara transparan.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
          <AlertCircle className="w-6 h-6 text-blue-500 shrink-0" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
            <span className="text-blue-600 font-black">Catatan Operasional:</span> Harga jangkar $12.24 yang tertanam dalam kontrak adalah variabel referensi informasi dan tidak mengikat secara algoritma pada fungsi swap internal, melainkan sebagai target stabilitas ekosistem AliBank.
          </p>
        </div>
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

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function Fingerprint({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" />
      <path d="M5 12c0-3.866 3.134-7 7-7s7 3.134 7 7" />
      <path d="M8 12c0-2.209 1.791-4 4-4s4 1.791 4 4" />
      <path d="M12 12v9" />
      <path d="M12 15c-1.657 0-3 1.343-3 3" />
      <path d="M12 18c1.657 0 3-1.343 3-3" />
    </svg>
  );
}
