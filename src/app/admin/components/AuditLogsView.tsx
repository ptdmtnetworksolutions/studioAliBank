
"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  History,
  TrendingUp,
  ArrowDownLeft,
  Zap,
  ShieldCheck,
  Activity,
  AlertCircle,
  Database,
  ShieldAlert,
  ArrowUpRight,
  User,
  AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export function AuditLogsView({ auditLogs, allUsers }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 15;

  // ANALITIK FORENSIK: Deteksi Ketidaksesuaian Saldo Lintas Node
  const forensicStats = useMemo(() => {
    if (!auditLogs || !allUsers) return { anomalies: [], totalValue: 0, riskyCount: 0 };
    
    let totalValue = 0;
    let riskyCount = 0;
    
    // Identifikasi transaksi berisiko (Besar & Cepat)
    const anomalies = auditLogs.filter((log: any) => {
      const amt = log.amountIdr || 0;
      totalValue += amt;
      
      const isLarge = amt > 10000000;
      const isManual = log.category === "Manual Adjustment";
      const isClientSource = log.source === 'client';
      
      if (isLarge || isManual) riskyCount++;
      
      return isLarge || isClientSource || isManual;
    });

    return { anomalies, totalValue, riskyCount };
  }, [auditLogs, allUsers]);

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!searchTerm) return auditLogs;
    
    const s = searchTerm.toLowerCase();
    return auditLogs.filter((log: any) => 
      log.id?.toLowerCase().includes(s) ||
      log.description?.toLowerCase().includes(s) ||
      log.category?.toLowerCase().includes(s) ||
      log.userEmail?.toLowerCase().includes(s) ||
      log.gateway?.toLowerCase().includes(s)
    );
  }, [auditLogs, searchTerm]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Forensik Keuangan</h2>
            <Badge className="bg-rose-600 text-white font-black text-[8px] h-5 uppercase italic animate-pulse">Deep Scan Active</Badge>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Audit Menyeluruh Lintas Nasabah & Deteksi Sumber Dana Gaib</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg">
            <Download className="w-4 h-4" /> Cetak Laporan Kepatuhan
          </button>
        </div>
      </header>

      {/* FORENSIC INDICATORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ForensicCard 
          icon={ShieldAlert} 
          label="Anomali Terdeteksi" 
          value={forensicStats.anomalies.length} 
          sub="Transaksi Butuh Review" 
          color="text-rose-500" 
          status="CRITICAL"
        />
        <ForensicCard 
          icon={Activity} 
          label="Transaksi Berisiko" 
          value={forensicStats.riskyCount} 
          sub="Di atas Rp10jt / Manual" 
          color="text-amber-500" 
          status="WARNING"
        />
        <ForensicCard 
          icon={Database} 
          label="Rekaman Lintas Node" 
          value={auditLogs?.length || 0} 
          sub="Total Entri Buku Besar" 
          color="text-blue-500" 
          status="SYNCED"
        />
        <ForensicCard 
          icon={TrendingUp} 
          label="Total Perputaran" 
          value={`Rp ${forensicStats.totalValue.toLocaleString()}`} 
          sub="Akumulasi Seluruh Node" 
          color="text-primary" 
          status="LIVE"
        />
      </div>

      <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari Email Nasabah, ID Transaksi, atau Gateway..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-12 pl-12 bg-background border-none rounded-2xl text-xs font-bold shadow-none" 
            />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-[10px] font-black text-muted-foreground uppercase italic">Hal {currentPage} / {totalPages || 1}</span>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-6">Konteks & Waktu</th>
                <th className="px-8 py-6">Sumber / Gateway</th>
                <th className="px-8 py-6">Nasabah</th>
                <th className="px-8 py-6">Status Audit</th>
                <th className="px-8 py-6 text-right">Nilai Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.map((log: any) => {
                const isAnomaly = (log.amountIdr > 10000000) || (log.category === "Manual Adjustment") || log.source === 'client';
                
                return (
                  <tr key={log.id || Math.random()} className={cn(
                    "hover:bg-muted/30 transition-colors group",
                    isAnomaly && "bg-rose-500/[0.02]"
                  )}>
                    <td className="px-8 py-5">
                      <div className="space-y-1.5">
                        <Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">
                          {log.category}
                        </Badge>
                        <p className="text-[10px] font-bold text-muted-foreground font-mono italic">
                          {log.timestamp?.toDate?.().toLocaleString('id-ID') || '---'}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-muted text-primary"><Zap className="w-3.5 h-3.5" /></div>
                        <div>
                          <p className="text-[11px] font-black uppercase italic text-foreground">{log.gateway || log.source || "Node Inti"}</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.description?.slice(0, 40)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <User className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black italic uppercase text-foreground">{log.userEmail?.split('@')[0] || 'Sistem'}</p>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.userEmail || 'Internal'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      {isAnomaly ? (
                        <div className="flex items-center gap-2 text-rose-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase italic">Dicurigai</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <ShieldCheck className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase italic">Tervalidasi</span>
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="space-y-1">
                        <p className={cn(
                          "text-sm font-black italic tracking-tighter",
                          isAnomaly ? "text-rose-600" : "text-foreground"
                        )}>
                          Rp {log.amountIdr?.toLocaleString('id-ID') || '0'}
                        </p>
                        {log.amountUsd && <p className="text-[8px] font-bold text-muted-foreground uppercase italic">$ {log.amountUsd.toFixed(2)}</p>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-500 flex items-center justify-center shrink-0 shadow-xl p-4">
          <ShieldAlert className="text-white w-full h-full" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black uppercase italic tracking-tight text-amber-600">Protokol Keamanan V3.5 - Pencucian Uang (AML)</h4>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic max-w-3xl">
            Sistem secara otomatis menandai transaksi di atas <span className="text-rose-600 font-bold">Rp10.000.000</span> atau transaksi yang dilakukan secara manual oleh nasabah tanpa verifikasi gateway yang sah. Anda disarankan melakukan pembekuan saldo jika menemukan ketidaksesuaian pada tab <span className="text-blue-500 font-bold">"Rekaman Nasabah"</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function ForensicCard({ icon: Icon, label, value, sub, color, status }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm h-44 flex flex-col justify-between hover:shadow-md transition-all group border border-border/50">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-widest px-2 h-5 italic">{status}</Badge>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{label}</p>
        <p className={cn("text-2xl font-black italic tracking-tighter truncate", color)}>{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{sub}</p>
      </div>
    </Card>
  );
}
