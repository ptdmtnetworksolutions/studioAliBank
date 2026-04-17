
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
  Database
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

export function AuditLogsView({ auditLogs }: any) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 12;

  // ANALITIK DINAMIS: Mendeteksi aktivitas mencurigakan yang ter-capture di sisi User
  const stats = useMemo(() => {
    if (!auditLogs) return { official: 0, clientSide: 0, anomalyCount: 0, totalValue: 0 };
    
    return auditLogs.reduce((acc: any, log: any) => {
      const amt = log.amountIdr || 0;
      if (log.source === 'official') acc.official++;
      else {
        acc.clientSide++;
        // Anggap transaksi client-side di atas 10jt yang tidak ada di audit global sebagai anomali
        if (amt > 10000000) acc.anomalyCount++;
      }
      acc.totalValue += amt;
      return acc;
    }, { official: 0, clientSide: 0, anomalyCount: 0, totalValue: 0 });
  }, [auditLogs]);

  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!searchTerm) return auditLogs;
    
    const s = searchTerm.toLowerCase();
    return auditLogs.filter((log: any) => 
      log.id?.toLowerCase().includes(s) ||
      log.description?.toLowerCase().includes(s) ||
      log.category?.toLowerCase().includes(s) ||
      log.userEmail?.toLowerCase().includes(s) ||
      log.source?.toLowerCase().includes(s)
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
            <h2 className="text-3xl font-black italic uppercase tracking-tighter">Rekonsiliasi Lintas Node</h2>
            <Badge className="bg-primary text-primary-foreground font-black text-[8px] h-5 uppercase italic">V3 Deep Scan</Badge>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Memantau Sinkronisasi Antara Node Inti dan Rekaman Nasabah</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg">
            <Download className="w-4 h-4" /> Ekspor Laporan Komprehensif
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticCard 
          icon={ShieldCheck} 
          label="Audit Resmi (Node Inti)" 
          value={stats.official} 
          sub="Tercatat di Global Ledger" 
          color="text-green-500" 
        />
        <AnalyticCard 
          icon={Database} 
          label="Rekaman Nasabah" 
          value={stats.clientSide} 
          sub="Terdeteksi di Sisi User" 
          color="text-blue-500" 
        />
        <AnalyticCard 
          icon={AlertCircle} 
          label="Anomali Terdeteksi" 
          value={stats.anomalyCount} 
          sub="Transaksi User Mencurigakan" 
          color="text-rose-500" 
        />
        <AnalyticCard 
          icon={TrendingUp} 
          label="Total Perputaran" 
          value={`Rp ${stats.totalValue.toLocaleString()}`} 
          sub="Akumulasi Seluruh Node" 
          color="text-primary" 
        />
      </div>

      <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari ID, Email, atau Sumber Data..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-12 pl-12 bg-background border-none rounded-2xl text-xs font-bold shadow-none" 
            />
          </div>
          
          <div className="flex items-center gap-6">
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 h-6 flex items-center">
              Ditemukan: {filteredLogs.length} Entri
            </Badge>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-black text-muted-foreground uppercase italic">
                Hal {currentPage} / {totalPages || 1}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl" 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-6">Waktu & Sumber</th>
                <th className="px-8 py-6">Deskripsi Transaksi</th>
                <th className="px-8 py-6">Entitas Nasabah</th>
                <th className="px-8 py-6 text-right">Nilai Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.map((log: any) => (
                <tr key={log.id || Math.random()} className={cn(
                  "hover:bg-muted/30 transition-colors group",
                  log.source === 'client' && "bg-blue-500/[0.02]"
                )}>
                  <td className="px-8 py-5">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono italic">
                        {log.timestamp?.toDate?.().toLocaleString('id-ID') || '---'}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className={cn(
                          "border-none text-[7px] font-black h-4 px-1.5 uppercase",
                          log.source === 'official' ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                        )}>
                          {log.source === 'official' ? 'Node Inti' : 'Rekaman Nasabah'}
                        </Badge>
                        {log.source === 'client' && <AlertCircle className="w-3 h-3 text-blue-500" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1.5">
                      <Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">
                        {log.category}
                      </Badge>
                      <p className="text-[11px] font-black uppercase italic text-accent leading-tight max-w-xs">
                        {log.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black italic uppercase text-foreground">{log.userEmail?.split('@')[0] || 'Sistem'}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.userEmail || 'Internal'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="space-y-1">
                      <p className={cn(
                        "text-sm font-black italic tracking-tighter",
                        log.amountIdr > 0 ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString('id-ID')}` : '---'}
                      </p>
                      {log.source === 'client' && <span className="text-[7px] font-bold text-blue-500 uppercase">Verifikasi Dibutuhkan</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-8 rounded-[2.5rem] bg-rose-600/5 border border-rose-600/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-600 flex items-center justify-center shrink-0 shadow-xl p-4">
          <ShieldCheck className="text-white w-full h-full" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black uppercase italic tracking-tight text-rose-600">Protokol Keamanan V3.5 - Deep Reconciliation</h4>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic max-w-3xl">
            Sistem saat ini sedang menampilkan data dari dua jalur: Audit Global dan Aktivitas Lintas Dompet Nasabah. Transaksi yang muncul dengan label <span className="text-blue-500 font-bold">"Rekaman Nasabah"</span> adalah transaksi yang tercatat secara lokal di dompet user namun belum melewati sinkronisasi Buku Besar Utama. Hal ini membantu mengidentifikasi anomali saldo yang tidak wajar.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm h-44 flex flex-col justify-between hover:shadow-md transition-all group">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-widest px-2 h-5">Live Monitor</Badge>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{label}</p>
        <p className={cn("text-2xl font-black italic tracking-tighter truncate", color)}>{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60">{sub}</p>
      </div>
    </Card>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
