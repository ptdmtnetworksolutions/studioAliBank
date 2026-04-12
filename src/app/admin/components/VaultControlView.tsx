
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ShieldCheck, 
  Wallet, 
  ArrowUpFromLine, 
  Loader2, 
  Info, 
  History, 
  CheckCircle2, 
  ArrowRightLeft,
  Lock,
  Zap,
  Globe,
  Database,
  AlertTriangle,
  ExternalLink,
  ArrowDownToLine,
  RefreshCw,
  ServerCog
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { executeVaultWithdrawalAction } from "@/app/actions/vault-actions";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

export function VaultControlView({ onChainEth, VAULT_CONTRACT, auditLogs }: any) {
  const { user } = useUser();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeNode, setActiveNode] = useState("Mainnet-V3");

  const handleWithdraw = async () => {
    if (!user || isExecuting || !recipient || !amount) return;
    setIsExecuting(true);
    try {
      const res = await executeVaultWithdrawalAction(recipient, amount, user.uid, user.email!);
      if (res.success) {
        toast({ title: "Disbursement Sent", description: `TX Hash: ${res.hash.slice(0, 20)}...` });
        setRecipient(""); setAmount("");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Execution Failed", description: err.message });
    } finally { setIsExecuting(false); }
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Vault Management System</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Kliring Node & Brankas Multi-Chain AliBank</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">VAULT V3 ACTIVE</Badge>
          <Badge variant="outline" className="border-green-500/20 text-green-500 font-black text-[10px] px-4 h-10 rounded-full italic">NODE ONLINE</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vault Status Card */}
        <Card className="lg:col-span-4 border-none bg-[#1A1D1F] rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet className="w-48 h-48" /></div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Total Managed Liquidity</p>
              <h3 className="text-5xl font-black italic tracking-tighter text-blue-400">
                {parseFloat(onChainEth).toFixed(6)} <span className="text-xl text-white/30">ETH</span>
              </h3>
              <p className="text-[10px] font-bold text-white/20 mt-2">≈ Rp {(parseFloat(onChainEth) * 15850 * 2000).toLocaleString()} (Consolidated)</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[8px] font-black uppercase text-white/40 mb-1 flex items-center gap-2">
                  <ServerCog className="w-3 h-3" /> Contract Proxy Address
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono font-bold break-all opacity-60">{VAULT_CONTRACT}</p>
                  <ExternalLink className="w-3 h-3 text-primary shrink-0 ml-2" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-green-500 bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Audited by AME Protocol</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Withdrawal Terminal */}
        <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg">
                <ArrowUpFromLine className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-black italic uppercase tracking-tight">Disbursement Terminal</h4>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black uppercase text-muted-foreground">Select Node:</span>
              <select className="bg-muted text-[10px] font-black uppercase italic border-none rounded-lg px-3 py-1.5 outline-none">
                <option>Ethereum Mainnet</option>
                <option>Ali-Chain V3</option>
                <option>Polygon POS</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Destination Address</label>
              <div className="relative group">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary" />
                <Input 
                  placeholder="0x... (External Wallet / CEX)" 
                  value={recipient} 
                  onChange={(e) => setRecipient(e.target.value)}
                  className="h-14 pl-12 bg-muted/50 border-none rounded-2xl font-mono text-xs font-bold focus:ring-2 focus:ring-primary/20" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Amount to Settle (ETH)</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-14 pl-12 bg-muted/50 border-none rounded-2xl font-black italic text-lg focus:ring-2 focus:ring-primary/20" 
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="w-6 h-6 text-blue-500 shrink-0" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              Operasi ini akan menarik dana dari Smart Contract Brankas Pusat. Transaksi bersifat final, tidak dapat dibatalkan, dan akan tercatat secara permanen di Audit Ledger AliBank.
            </p>
          </div>

          <Button 
            onClick={handleWithdraw} 
            disabled={isExecuting || !recipient || !amount}
            className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none hover:scale-[1.01] transition-all"
          >
            {isExecuting ? <Loader2 className="animate-spin" /> : (
              <span className="flex items-center gap-3">
                EXECUTE ON-CHAIN DISBURSEMENT <ArrowRightLeft className="w-5 h-5" />
              </span>
            )}
          </Button>
        </Card>
      </div>

      {/* SYNC HISTORY */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
            <History className="w-5 h-5 text-primary" /> Real-Time Settlement Logs
          </h3>
          <button className="text-[9px] font-black uppercase italic text-primary hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Refresh Logs
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditLogs?.filter((l:any) => l.category === "Vault Operations" || l.txHash).slice(0, 6).map((log: any) => (
            <Card key={log.id} className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4 hover:border-primary/30 transition-all group">
              <div className="flex justify-between items-start">
                <Badge className="bg-blue-100 text-blue-600 border-none text-[7px] font-black h-5 uppercase px-2">On-Chain Tx</Badge>
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase italic truncate text-accent">{log.description || log.category}</p>
              <div className="flex justify-between items-end border-t border-border pt-4">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Settlement Value</p>
                  <p className="text-sm font-black italic text-foreground">Rp {log.amountIdr?.toLocaleString()}</p>
                </div>
                <button className="p-2 bg-muted rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
