
"use client";

import { useState } from "react";
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
  ArrowRightLeft 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { executeVaultWithdrawalAction } from "@/app/actions/vault-actions";
import { useUser } from "@/firebase";

export function VaultControlView({ onChainEth, VAULT_CONTRACT, auditLogs }: any) {
  const { user } = useUser();
  const { toast } = useToast();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);

  const handleWithdraw = async () => {
    if (!user || isExecuting || !recipient || !amount) return;
    setIsExecuting(true);
    try {
      const res = await executeVaultWithdrawalAction(recipient, amount, user.uid, user.email!);
      if (res.success) {
        toast({ title: "Withdrawal Sent", description: `TX Hash: ${res.hash.slice(0, 20)}...` });
        setRecipient(""); setAmount("");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Execution Failed", description: err.message });
    } finally { setIsExecuting(false); }
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Vault Control</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Kliring Node & Brankas ETH Mainnet</p>
        </div>
        <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">ETH NODE ACTIVE</Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 border-none bg-[#1A1D1F] rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet className="w-48 h-48" /></div>
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Vault Net Balance</p>
            <h3 className="text-5xl font-black italic tracking-tighter text-blue-400">{parseFloat(onChainEth).toFixed(6)} <span className="text-xl text-white/30">ETH</span></h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[8px] font-black uppercase text-white/40 mb-1">Vault Node Address</p>
              <p className="text-[9px] font-mono font-bold break-all opacity-60">{VAULT_CONTRACT}</p>
            </div>
            <div className="flex items-center gap-3 text-green-500">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Audited by V3 Protocol</span>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><ArrowUpFromLine className="w-6 h-6" /></div>
            <h4 className="text-xl font-black italic uppercase tracking-tight">Manual Disbursement Terminal</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recipient Address</label>
              <Input 
                placeholder="0x..." 
                value={recipient} 
                onChange={(e) => setRecipient(e.target.value)}
                className="h-14 bg-muted border-none rounded-2xl font-mono text-xs font-bold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Amount (ETH)</label>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="h-14 bg-muted border-none rounded-2xl font-black italic text-lg" 
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="w-6 h-6 text-blue-500 shrink-0" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              Operasi ini bersifat permanen dan dieksekusi melalui Secure Node di server. Kunci privat dilindungi oleh Google Secret Manager.
            </p>
          </div>

          <Button 
            onClick={handleWithdraw} 
            disabled={isExecuting || !recipient || !amount}
            className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none"
          >
            {isExecuting ? <Loader2 className="animate-spin" /> : "EXECUTE DISBURSEMENT"}
          </Button>
        </Card>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3"><History className="w-5 h-5 text-primary" /> On-Chain Sync History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditLogs?.filter((l:any) => l.txHash).slice(0, 6).map((log: any) => (
            <Card key={log.id} className="p-6 rounded-2xl bg-card border border-border shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <Badge className="bg-blue-100 text-blue-600 border-none text-[7px] font-black h-5 uppercase px-2">Mainnet Tx</Badge>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-[10px] font-black uppercase italic truncate">{log.description || log.category}</p>
              <div className="flex justify-between items-end border-t border-border pt-4">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Value</p>
                  <p className="text-sm font-black italic">Rp {log.amountIdr?.toLocaleString()}</p>
                </div>
                <button className="p-2 bg-muted rounded-lg"><ArrowRightLeft className="w-3 h-3" /></button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
