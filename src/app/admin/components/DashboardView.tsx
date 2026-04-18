
"use client";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
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
  Zap,
  ShieldCheck,
  Globe,
  Wifi,
  WifiOff,
  Cpu,
  Smartphone,
  AlertTriangle,
  ShieldAlert
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
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const USDT_IDR_RATE = 15850;

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
  const db = useFirestore();
  const apiKeysRef = useMemoFirebase(() => (db ? doc(db, "system", "api_keys") : null), [db]);
  const { data: storedKeys } = useDoc(apiKeysRef);

  // REKONSILIASI FINANSIAL: Menghitung total likuiditas riil di dompet nasabah lintas aset
  const userLedgerStats = useMemo(() => {
    if (!allUsers) return { totalUserIdr: 0, totalUserAlx: 0, totalUserUsdt: 0, totalUserBtc: 0, totalUserEth: 0 };
    return allUsers.reduce((acc: any, u: any) => {
      acc.totalUserIdr += (u.totalBalance || 0) + (u.savings || 0);
      acc.totalUserAlx += (u.cryptoBalances?.ALX || 0);
      acc.totalUserUsdt += (u.cryptoBalances?.USDT || 0);
      acc.totalUserBtc += (u.cryptoBalances?.BTC || 0);
      acc.totalUserEth += (u.cryptoBalances?.ETH || 0);
      return acc;
    }, { totalUserIdr: 0, totalUserAlx: 0, totalUserUsdt: 0, totalUserBtc: 0, totalUserEth: 0 });
  }, [allUsers]);

  // DETEKSI ANOMALI GLOBAL: Saldo User vs Injeksi Likuiditas (IDR & Estimasi Kripto)
  // Membandingkan total kewajiban IDR yang ada di dompet nasabah vs uang riil yang masuk via gateway
  const isAnomaly = userLedgerStats.totalUserIdr > (globalLiquidity?.totalFiatInjected || 0);
  const discrepancy = userLedgerStats.totalUserIdr - (globalLiquidity?.totalFiatInjected || 0);

  const aggregatedStats = useMemo(() => {
    if (!auditLogs) return { tradingFees: 0, profitCapture: 0, alxSales: 0, debtRecovered: 0 };

    return auditLogs.reduce((acc: any, log: any) => {
      const amount = log.amountIdr || 0;
      if (log.status === 'success' || log.status === 'berhasil' || log.source === 'client') {
        if (log.category === "Futures Entry" || log.category === "Market Execution" || log.category === "Market Trade") {
          acc.tradingFees += amount;
        }
        if (log.category === "Trade-X Capture" || log.category === "Ali-Spin Capture" || log.category === "Trade-X Win") {
          acc.profitCapture += amount;
        }
        if (log.category === "Ali-Exchange" || log.category === "Market Trade") {
          acc.alxSales += amount;
        }
        if (log.category === "Debt Recovery" || log.category === "Legalization") {
          acc.debtRecovered += amount;
        }
      }
      return acc;
    }, { tradingFees: 0, profitCapture: 0, alxSales: 0, debtRecovered: 0 });
  }, [auditLogs]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NodeStatusCard label="ALX Network" status={storedKeys?.polygonRpcUrl ? "Online" : "Offline"} icon={Zap} color="text-primary" />
        <NodeStatusCard label="Vault Node" status={storedKeys?.ethereumRpcUrl ? "Online" : "Offline"} icon={Cpu} color="text-blue-500" />
        <NodeStatusCard label="PayPal Bridge" status={storedKeys?.paypalClientId ? "Online" : "Offline"} icon={Globe} color="text-indigo-500" />
        <NodeStatusCard label="Forensic Engine" status="Active" icon={ShieldAlert} color="text-rose-500" />
      </section>

      {isAnomaly && (
        <Card className="p-8 bg-rose-600 text-white rounded-[3rem] border-none shadow-2xl animate-in zoom-in duration-500 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Skull className="w-32 h-32" /></div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left relative z-10">
            <h4 className="text-2xl font-black uppercase italic tracking-tighter">ANOMALI LIKUIDITAS TERDETEKSI!</h4>
            <p className="text-sm font-bold uppercase opacity-80 leading-relaxed">
              Saldo di dompet nasabah (Rp {userLedgerStats.totalUserIdr.toLocaleString()}) melebihi catatan likuiditas masuk resmi. 
              Terdeteksi dana tak ter-audit sebesar <span className="underline decoration-2">Rp {discrepancy.toLocaleString()}</span>.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="ml-auto bg-white text-rose-600 hover:bg-white/90 border-none font-black italic uppercase text-xs h-14 px-8 rounded-2xl relative z-10" 
            onClick={() => setActiveTab('audit')}
          >
            JALANKAN AUDIT FORENSIK
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Database className="w-64 h-64" /></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600"><Database className="w-6 h-6" /></div>
              <h3 className="text-lg font-black italic uppercase tracking-tight">Kewajiban Likuiditas Riil</h3>
            </div>
            <Badge className="bg-primary text-primary-foreground font-black text-[8px] px-3 h-6 rounded uppercase italic">AUM Audit Live</Badge>
          </div>
          
          <div className="space-y-2 relative z-10">
            <p className="text-sm font-bold text-muted-foreground uppercase">Total Dana Nasabah (Under Management)</p>
            <h2 className={cn(
              "text-4xl md:text-6xl font-black tracking-tighter italic",
              isAnomaly ? "text-rose-600" : "text-accent"
            )}>
              Rp {userLedgerStats.totalUserIdr.toLocaleString('id-ID')}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground italic">Cadangan Kas Sistem:</span>
              <span className="text-[10px] font-black text-green-500 italic">Rp {(globalLiquidity?.totalFiatInjected || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-4 relative z-10">
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Revenue Fee</span><p className="text-xl font-black italic text-primary">Rp {aggregatedStats.tradingFees.toLocaleString()}</p></div>
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Recovered</span><p className="text-xl font-black italic text-green-600">Rp {aggregatedStats.debtRecovered.toLocaleString()}</p></div>
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">Koin ALX</span><p className="text-xl font-black italic text-blue-500">{userLedgerStats.totalUserAlx.toFixed(2)}</p></div>
            <div className="space-y-1"><span className="text-[10px] font-bold uppercase text-muted-foreground">USDT Node</span><p className="text-xl font-black italic text-teal-600">{userLedgerStats.totalUserUsdt.toFixed(2)}</p></div>
          </div>
        </Card>
        
        <Card className="lg:col-span-4 border-none bg-card rounded-[2.5rem] p-10 flex flex-col shadow-sm">
          <h3 className="text-base font-black italic uppercase mb-8">Populasi Nasabah</h3>
          <div className="flex -space-x-3 mb-10">
            {(allUsers || []).slice(0, 5).map((u: any, i: number) => (
              <div key={i} className="h-12 w-12 rounded-full ring-4 ring-card overflow-hidden border border-border bg-muted">
                {u.avatarUrl ? <img src={u.avatarUrl} alt="u" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-black uppercase italic text-muted-foreground">{u.name?.[0]}</div>}
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
              <span>Rekening Aktif</span>
              <span>{allUsers?.length || 0}</span>
            </div>
            <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RevenueCard icon={Zap} label="Pendapatan Fee Platform" value={`Rp ${aggregatedStats.tradingFees.toLocaleString()}`} sub="Bursa & Kliring" color="text-yellow-500" />
        <RevenueCard icon={TrendingUp} label="Total Penjualan ALX" value={`Rp ${aggregatedStats.alxSales.toLocaleString()}`} sub="AUM Internal AliBank" color="text-blue-500" />
        <RevenueCard icon={ShieldCheck} label="Audit Surplus" value={`Rp ${Math.max(0, (globalLiquidity?.totalFiatInjected || 0) - userLedgerStats.totalUserIdr).toLocaleString()}`} sub="Net Profit Unspent" color="text-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-8 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2"><CandlestickChart className="w-4 h-4 text-primary" /> Dinamika Arus Kas (24J)</h3>
            <Badge className="bg-muted text-muted-foreground text-[8px] font-black uppercase italic">Forensic Trace</Badge>
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
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Pasokan Internal</p>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
            <p className="text-[9px] font-bold text-white/30 uppercase mt-2">AME NODE V3.5</p>
          </div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Beredar di User</p>
              <p className="text-xl font-black italic">
                {userLedgerStats.totalUserAlx.toLocaleString()} ALX
              </p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Maks. Suplai</p>
              <p className="text-xl font-black italic text-primary">1B</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <QuickOpButton icon={Skull} label="Deep Audit" sub="Recon Seluruh Node" color="text-rose-500" onClick={() => setActiveTab('audit')} />
        <QuickOpButton icon={ShieldAlert} label="AML Check" sub="Deteksi Pencucian" color="text-amber-500" onClick={() => setActiveTab('audit')} />
        <QuickOpButton icon={RefreshCw} label="Wipe Sync" sub="Refresh Koneksi" color="text-orange-500" onClick={() => window.location.reload()} />
        <QuickOpButton icon={Database} label="Sync Vault" sub="On-Chain Sync" color="text-blue-500" onClick={() => syncOnChainData(true)} syncing={syncingVault} />
      </div>
    </div>
  );
}

function NodeStatusCard({ label, status, icon: Icon, color }: any) {
  const isOnline = status === "Online" || status === "Active";
  return (
    <Card className="border-none bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className={cn("w-8 h-8 rounded-lg bg-muted flex items-center justify-center", color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isOnline ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-rose-500" />}
            <span className={cn("text-[9px] font-black uppercase italic", isOnline ? "text-green-600" : "text-rose-600")}>{status}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function RevenueCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none bg-card rounded-3xl p-6 shadow-sm flex items-center gap-5">
      <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center", color)}><Icon className="w-6 h-6" /></div>
      <div>
        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1">{label}</p>
        <p className="text-xl font-black italic text-foreground tracking-tighter">{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 italic">{sub}</p>
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
