
"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Database, 
  CandlestickChart, 
  ArrowUpRight, 
  Skull, 
  PlusCircle, 
  Pickaxe, 
  RefreshCw, 
  TrendingUp, 
  Zap 
} from "lucide-react";
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function DashboardView({ 
  globalLiquidity, 
  allUsers, 
  candleData, 
  auditLogs, 
  setActiveTab, 
  syncOnChainData, 
  syncingVault, 
  isLoadingAlix, 
  totalSupply 
}: any) {
  
  // LOGIKA AGREGASI PENDAPATAN RIIL DARI AUDIT LEDGER
  const aggregatedStats = useMemo(() => {
    if (!auditLogs) return { tradingFees: 0, profitCapture: 0, alxSales: 0 };

    return auditLogs.reduce((acc: any, log: any) => {
      const amount = log.amountIdr || 0;
      
      // 1. Biaya Trading (Dari Futures Entry, Market Execution, dll)
      if (log.category === "Futures Entry" || log.category === "Market Execution" || log.category === "Market Trade") {
        acc.tradingFees += amount;
      }
      
      // 2. Profit Capture (Bank Profit dari kekalahan nasabah di Trade-X atau Ali-Spin)
      if (log.category === "Trade-X Capture" || log.category === "Ali-Spin Capture") {
        acc.profitCapture += amount;
      }
      
      // 3. Pendapatan Penjualan ALX (Internal Exchange)
      if (log.category === "Ali-Exchange") {
        acc.alxSales += amount;
      }

      return acc;
    }, { tradingFees: 0, profitCapture: 0, alxSales: 0 });
  }, [auditLogs]);

  // Gunakan data dari dokumen likuiditas sebagai basis utama, fallback ke agregasi log
  const tradingFeesDisplay = globalLiquidity?.totalTradingFeesIdr || aggregatedStats.tradingFees;
  const profitCaptureDisplay = globalLiquidity?.tradeXGrossVolumeIdr || aggregatedStats.profitCapture;
  const alxSalesDisplay = globalLiquidity?.totalInternalAumIdr || aggregatedStats.alxSales;

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600"><Database className="w-6 h-6" /></div>
              <h3 className="text-lg font-black italic uppercase tracking-tight">Likuiditas Global AliBank</h3>
            </div>
            <Badge className="bg-green-100 text-green-600 font-black text-[8px] px-3 h-6 rounded uppercase">LIVE SINKRON</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-muted-foreground uppercase">Total Modal Bersih (IDR)</p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString('id-ID')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Cadangan Brankas (USD)</span><p className="text-xl font-black italic">$ {(globalLiquidity?.totalUsdInjected || 0).toLocaleString()}</p></div>
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Pendapatan Futures</span><p className="text-xl font-black italic text-primary">Rp {(globalLiquidity?.futuresGrossProfitIdr || 0).toLocaleString()}</p></div>
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">AUM Internal</span><p className="text-xl font-black italic text-green-600">Rp {alxSalesDisplay.toLocaleString()}</p></div>
          </div>
        </Card>
        
        <Card className="lg:col-span-4 border-none bg-card rounded-[2.5rem] p-10 flex flex-col shadow-sm">
          <h3 className="text-base font-black italic uppercase mb-8">Nasabah Terverifikasi</h3>
          <div className="flex -space-x-3 mb-10">
            {(allUsers || []).slice(0, 5).map((u: any, i: number) => (
              <div key={i} className="h-12 w-12 rounded-full ring-4 ring-card overflow-hidden border border-border bg-muted">
                <Image src={`https://picsum.photos/seed/${u.uid || i}/100/100`} alt="u" width={48} height={48} className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
              <span>Akun Aktif</span>
              <span>{allUsers?.length || 0}</span>
            </div>
            <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1" />
          </div>
        </Card>
      </div>

      {/* REVENUE BREAKDOWN - DENGAN DATA AGREGASI RIIL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard 
          icon={Zap} 
          label="Biaya Trading Platform" 
          value={`Rp ${tradingFeesDisplay.toLocaleString()}`} 
          sub="Dari Spot & Futures" 
          color="text-yellow-500" 
        />
        <RevenueCard 
          icon={TrendingUp} 
          label="Tangkapan Profit (Loss Capture)" 
          value={`Rp ${profitCaptureDisplay.toLocaleString()}`} 
          sub="Keuntungan Trade-X & Ali-Spin" 
          color="text-green-500" 
        />
        <RevenueCard 
          icon={TrendingUp} 
          label="Pendapatan Penjualan ALX" 
          value={`Rp ${alxSalesDisplay.toLocaleString()}`} 
          sub="Distribusi ALX Internal" 
          color="text-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-8 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2"><CandlestickChart className="w-4 h-4 text-primary" /> Dinamika Pendapatan Pro</h3>
            <Badge className="bg-muted text-muted-foreground text-[8px] font-black uppercase">Aktivitas 24J</Badge>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={candleData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Bar dataKey="close" barSize={12}>
                  {candleData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.isUp ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="lg:col-span-4 border-none bg-[#1A1D1F] rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Aset Berdaulat</p>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
            <p className="text-[9px] font-bold text-white/30 uppercase mt-2">PROTOKOL ALX V3</p>
          </div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Inventaris Brankas</p>
              <p className="text-xl font-black italic">
                {globalLiquidity?.alixVaultBalance?.toLocaleString() || '0'} ALX
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Harga Jangkar</p>
              <p className="text-xl font-black italic text-primary">$ 12.24</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <QuickOpButton icon={Skull} label="Reset Semua Nasabah" sub="Pembersihan Produksi" color="text-rose-500" onClick={() => setActiveTab('users')} />
        <QuickOpButton icon={PlusCircle} label="Cetak ALX" sub="Pasokan Sah" color="text-green-500" onClick={() => setActiveTab('tokenomics')} />
        <QuickOpButton icon={Pickaxe} label="Bakar ALX" sub="Protokol Deflasi" color="text-orange-500" onClick={() => setActiveTab('tokenomics')} />
        <QuickOpButton icon={RefreshCw} label="Sinkron Brankas" sub="Koneksi Etherscan" color="text-blue-500" onClick={() => syncOnChainData(true)} syncing={syncingVault} />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black italic uppercase tracking-widest">Log Aktivitas Terbaru</h3>
          <button onClick={() => setActiveTab('audit')} className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">
            Lihat Semua Log <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                <tr>
                  <th className="px-8 py-5">ID Operasi</th>
                  <th className="px-8 py-5">Konteks</th>
                  <th className="px-8 py-5">Nilai</th>
                  <th className="px-8 py-5 text-right">Sinkronisasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs?.slice(0, 10).map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-8 py-4 text-[10px] font-mono font-bold text-accent">{log.id?.slice(0, 15)}...</td>
                    <td className="px-8 py-4"><Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">{log.category}</Badge></td>
                    <td className="px-8 py-4 text-[10px] font-black italic">
                      {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : '---'}
                    </td>
                    <td className="px-8 py-4 text-right text-[9px] font-bold text-muted-foreground italic">
                      {log.timestamp?.toDate?.().toLocaleString('id-ID') || '---'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RevenueCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none bg-card rounded-3xl p-6 shadow-sm flex items-center gap-5">
      <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center", color)}><Icon className="w-6 h-6" /></div>
      <div>
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-black italic text-foreground tracking-tighter">{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{sub}</p>
      </div>
    </Card>
  );
}

function QuickOpButton({ icon: Icon, label, sub, color, onClick, syncing }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-card border border-border/50 hover:bg-muted/50 transition-all group shadow-sm active:scale-95 text-center w-full">
      <div className={cn("w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-inner", color, syncing && "animate-spin")}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase italic">{label}</p>
        <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{sub}</p>
      </div>
    </button>
  );
}
