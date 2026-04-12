
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
  History
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuditLogsView({ auditLogs }: any) {
  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 10;

  // FILTER LOGS BASED ON SEARCH
  const filteredLogs = useMemo(() => {
    if (!auditLogs) return [];
    if (!searchTerm) return auditLogs;
    
    return auditLogs.filter((log: any) => 
      log.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [auditLogs, searchTerm]);

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage]);

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Buku Besar Audit Sistem</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Log Transaksi & Operasi Keamanan Real-Time</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-card border border-border flex items-center gap-2 text-xs font-bold uppercase italic shadow-sm hover:bg-muted transition-all">
            <Filter className="w-4 h-4" /> Filter
          </button>
          <button className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg">
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
        </div>
      </header>

      <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Cari log berdasarkan ID, nasabah, atau kategori..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="h-11 pl-12 bg-background border-none rounded-xl text-xs font-bold" 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2 h-5">Total: {filteredLogs.length} Entri</Badge>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-[10px] font-black text-muted-foreground uppercase italic">Halaman {currentPage} / {totalPages || 1}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-lg" 
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
            <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-5">Waktu</th>
                <th className="px-8 py-5">Kategori</th>
                <th className="px-8 py-5">Deskripsi Operasi</th>
                <th className="px-8 py-5 text-right">Nilai Sinkronisasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-4 text-[10px] font-bold text-muted-foreground font-mono italic">
                    {log.timestamp?.toDate?.().toLocaleString('id-ID') || '---'}
                  </td>
                  <td className="px-8 py-4">
                    <Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">
                      {log.category}
                    </Badge>
                  </td>
                  <td className="px-8 py-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase italic text-accent leading-tight">
                        {log.description || log.gateway}
                      </p>
                      {log.txHash && (
                        <p className="text-[8px] font-mono text-blue-500 truncate max-w-[200px] border-l border-blue-500/20 pl-2">
                          Hash: {log.txHash}
                        </p>
                      )}
                      {log.userEmail && (
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">
                          Nasabah: {log.userEmail}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black italic text-foreground">
                        {log.amountIdr ? `Rp ${log.amountIdr.toLocaleString('id-ID')}` : '---'}
                      </p>
                      <div className="flex items-center justify-end gap-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          log.status === 'success' || log.status === 'berhasil' ? "bg-green-500" : "bg-amber-500"
                        )} />
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">
                          {log.status}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-20 italic font-black uppercase tracking-widest text-xs">
                    Tidak ada catatan audit yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM PAGINATION CONTROLS */}
        <div className="p-6 bg-muted/30 border-t border-border flex justify-between items-center">
          <p className="text-[9px] font-bold text-muted-foreground uppercase italic">
            Menampilkan {paginatedLogs.length} dari {filteredLogs.length} entri keamanan
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 px-4 rounded-xl border-border text-[10px] font-black uppercase italic"
              disabled={currentPage === 1} 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Sebelumnya
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                // Simple logic to show pages around current page could be added here
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-9 h-9 rounded-xl text-[10px] font-black transition-all",
                      currentPage === pageNum ? "gold-gradient text-white shadow-md" : "bg-background border border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="self-end pb-2 px-1 text-muted-foreground opacity-40">...</span>}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 px-4 rounded-xl border-border text-[10px] font-black uppercase italic"
              disabled={currentPage === totalPages || totalPages === 0} 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
        <History className="w-6 h-6 text-blue-500 shrink-0" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
          Buku Besar Audit adalah rekaman permanen yang tidak dapat diubah (Immutable). Seluruh aktivitas kliring, perdagangan, dan modifikasi sistem dicatat di sini untuk kepatuhan regulator perbankan.
        </p>
      </div>
    </div>
  );
}
