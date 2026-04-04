
"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Filter, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AuditLogsView({ auditLogs }: any) {
  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">System Audit Ledger</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Log Transaksi & Operasi Keamanan Real-Time</p>
        </div>
        <div className="flex gap-3">
          <button className="h-11 px-6 rounded-xl bg-card border border-border flex items-center gap-2 text-xs font-bold uppercase italic shadow-sm hover:bg-muted transition-all"><Filter className="w-4 h-4" /> Filter</button>
          <button className="h-11 px-6 rounded-xl gold-gradient text-white flex items-center gap-2 text-xs font-black uppercase italic shadow-lg"><Download className="w-4 h-4" /> Export CSV</button>
        </div>
      </header>

      <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search logs by ID, user, or category..." className="h-11 pl-12 bg-background border-none rounded-xl text-xs font-bold" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
              <tr>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Description</th>
                <th className="px-8 py-5 text-right">Synchronization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {auditLogs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-8 py-4 text-[10px] font-bold text-muted-foreground font-mono italic">{log.timestamp?.toDate?.().toLocaleString() || '---'}</td>
                  <td className="px-8 py-4"><Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">{log.category}</Badge></td>
                  <td className="px-8 py-4">
                    <p className="text-[10px] font-black uppercase italic text-accent">{log.description || log.gateway}</p>
                    {log.txHash && <p className="text-[8px] font-mono text-blue-500 mt-1 truncate max-w-[200px]">{log.txHash}</p>}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className="text-[11px] font-black italic">{log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : '---'}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">{log.status}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
