
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
  ArrowUpRight,
  Zap,
  Activity,
  ShieldCheck,
  Briefcase,
  Wallet
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuditLogsView({ auditLogs }: any) {
  // PAGINATION & SEARCH STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // LOGIKA ANALITIK UNTUK PEMILIK APLIKASI
  const stats = useMemo(() => {
    if (!auditLogs) return { inflow: 0, outflow: 0, fees: 0, tradeX: 0, successRate: 0 };
    
    let successCount = 0;
    const data = auditLogs.reduce((acc: any, log: any) => {
      const amt = log.amountIdr || 0;
      const isSuccess = log.status === 'success' || log.status === 'berhasil';
      
      if (isSuccess) {
        successCount++;
        // Arus Kas Masuk (Topup & Settlement)
        if (log.category === 'External Settlement' || log.category === 'Kliring Manual' || log.category === 'Kliring On-Chain') {
          acc.inflow += amt;
        }
        // Arus Kas Keluar (Penarikan)
        if (log.category === 'Withdraw' || log.category === 'Manual Withdraw Request') {
          acc.outflow += amt;
        }
        // Pendapatan Biaya (Trading Fees)
        if (log.category === 'Futures Entry' || log.category === 'Market Execution' || log.category === 'Market Trade') {
          acc.fees += amt;
        }
        // Keuntungan Trade-X (Loss Capture)
        if (log.category === 'Trade-X Capture') {
          acc.tradeX += amt;
        }
      }
      return acc;
    }, { inflow: 0, outflow: 0, fees: 0, tradeX: 0 });

    return {
      ...data,
      successRate: auditLogs.length > 0 ? (successCount / auditLogs.length) * 100 : 0
    };
  }, [auditLogs]);

  // FILTER LOGS BERDASARKAN PENCARIAN
  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!searchTerm) return auditLogs;
    
    return auditLogs.filter((log: any) => 
      log.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.gateway?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditLogs, searchTerm]);

  // LOGIKA PAGINASI
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      {/* HEADER SECTION */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Buku Besar Audit Sistem</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Analisis Finansial & Operasional AliBank V3</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-card border border-border flex items-center gap-2 text-xs font-bold uppercase italic shadow-sm hover:bg-muted transition-all">
            <Filter className="w-4 h-4" /> Filter Lanjutan
          </button>
          <button className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg">
            <Download className="w-4 h-4" /> Ekspor Laporan
          </button>
        </div>
      </header>

      {/* ANALYTIC CARDS - FINANCIAL INSIGHTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticCard 
          icon={ArrowDownLeft} 
          label="Total Inflow (Fiat)" 
          value={`Rp ${stats.inflow.toLocaleString()}`} 
          sub="Likuiditas Masuk Bersih" 
          color="text-green-500" 
        />
        <AnalyticCard 
          icon={Zap} 
          label="Pendapatan Fee" 
          value={`Rp ${stats.fees.toLocaleString()}`} 
          sub="Biaya Operasional Bursa" 
          color="text-primary" 
        />
        <AnalyticCard 
          icon={TrendingUp} 
          label="Trade-X P&L (Bank)" 
          value={`Rp ${stats.tradeX.toLocaleString()}`} 
          sub="Keuntungan Capture Margin" 
          color="text-blue-500" 
        />
        <AnalyticCard 
          icon={ShieldCheck} 
          label="Node Efficiency" 
          value={`${stats.successRate.toFixed(1)}%`} 
          sub="Skor Keberhasilan Sistem" 
          color="text-purple-500" 
        />
      </div>

      {/* LEDGER TABLE CONTAINER */}
      <Card className="border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari berdasarkan ID, nasabah, atau kategori..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-12 pl-12 bg-background border-none rounded-2xl text-xs font-bold shadow-none" 
            />
          </div>
          
          <div className="flex items-center gap-6">
            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase px-3 h-6 flex items-center">
              Record: {filteredLogs.length} Entri
            </Badge>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-muted" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-black text-muted-foreground uppercase italic px-2">
                Hal {currentPage} / {totalPages || 1}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-9 w-9 rounded-xl hover:bg-muted" 
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
                <th className="px-8 py-6">Timestamp & Status</th>
                <th className="px-8 py-6">Konteks Operasi</th>
                <th className="px-8 py-6">Entitas Nasabah</th>
                <th className="px-8 py-6 text-right">Nilai Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground font-mono italic">
                        {log.timestamp?.toDate?.().toLocaleString('id-ID') || '---'}
                      </p>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          log.status === 'success' || log.status === 'berhasil' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-amber-500"
                        )} />
                        <span className="text-[9px] font-black uppercase italic tracking-tighter opacity-60">
                          {log.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">
                          {log.category}
                        </Badge>
                        <span className="text-[8px] font-bold text-primary uppercase">{log.gateway || 'Core Node'}</span>
                      </div>
                      <p className="text-[11px] font-black uppercase italic text-accent leading-tight max-w-xs truncate">
                        {log.description}
                      </p>
                      {log.txHash && (
                        <div className="flex items-center gap-1.5 text-[8px] font-mono text-blue-500 cursor-pointer hover:underline">
                          <Zap className="w-2.5 h-2.5" /> Hash: {log.txHash.slice(0, 20)}...
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black italic uppercase text-foreground">{log.userEmail?.split('@')[0] || 'System'}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.userEmail || 'Internal Operation'}</p>
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
                      {log.cryptoAmount && (
                        <p className="text-[9px] font-bold text-primary uppercase italic">
                          {log.cryptoAmount.toFixed(6)} {log.cryptoCurrency}
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <History className="w-16 h-16" />
                      <p className="font-black uppercase tracking-[0.3em] text-xs italic">
                        Buku Besar Kosong. Menunggu Sinkronisasi Node...
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION CONTROLS */}
        <div className="p-8 bg-muted/30 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-muted-foreground uppercase italic">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} rekaman audit sistem
          </p>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 px-5 rounded-xl border-border text-[10px] font-black uppercase italic shadow-sm"
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" /> Sebelumnya
            </Button>
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={cn(
                    "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                    currentPage === i + 1 
                      ? "gold-gradient text-white shadow-lg scale-110" 
                      : "bg-background border border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="h-10 px-5 rounded-xl border-border text-[10px] font-black uppercase italic shadow-sm"
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Selanjutnya <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* FOOTER INFO - PROFESSIONAL COMPLIANCE */}
      <div className="p-8 rounded-[2.5rem] bg-accent/5 border border-primary/10 flex flex-col md:flex-row items-center gap-6">
        <div className="w-16 h-16 rounded-3xl gold-gradient flex items-center justify-center shrink-0 shadow-xl p-4">
          <LogoIcon className="text-white" />
        </div>
        <div className="space-y-1 text-center md:text-left">
          <h4 className="text-sm font-black uppercase italic tracking-tight">Kepatuhan Audit Perbankan V3</h4>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed uppercase italic max-w-3xl">
            Buku Besar Audit (Audit Ledger) adalah rekaman permanen, tidak dapat diubah (Immutable), dan dienkripsi ujung-ke-ujung. Seluruh pergerakan dana, modifikasi parameter sistem, dan aktivitas administrator dicatat secara riil untuk menjamin transparansi kedaulatan AliBank.
          </p>
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center transition-transform group-hover:scale-110", color)}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant="outline" className="border-border text-[7px] font-black uppercase tracking-widest px-2 h-5">Live Stats</Badge>
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
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      <rect x="10" y="10" width="80" height="80" rx="22" stroke="currentColor" strokeWidth="6" fill="none" />
      <path d="M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z" fill="currentColor" />
    </svg>
  );
}
