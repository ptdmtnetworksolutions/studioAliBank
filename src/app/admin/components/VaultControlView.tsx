
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { ethers, JsonRpcProvider, formatEther } from "ethers";
import { cn } from "@/lib/utils";
import { AliBankVaultABI } from "@/lib/abi/AliBankVault";

export function VaultControlView({ auditLogs }: any) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [nodeError, setNodeError] = useState<string | null>(null);

  const apiKeysRef = useMemoFirebase(() => (db ? doc(db, "system", "api_keys") : null), [db]);
  const { data: config } = useDoc(apiKeysRef);

  // MENGGUNAKAN KUNCI DARI FIREBASE (YANG ANDA PASTE) SEBAGAI PRIORITAS UTAMA
  const VAULT_CONTRACT = config?.vaultContractAddress || "0x56268032A3B3E64CFeF1916d591087CF8dF40945";
  const ETH_RPC = config?.ethereumRpcUrl || "https://ethereum-rpc.publicnode.com";

  const syncVaultBalance = useCallback(async () => {
    if (!VAULT_CONTRACT || !ETH_RPC) return;
    setIsSyncing(true);
    setNodeError(null);
    try {
      const provider = new JsonRpcProvider(ETH_RPC);
      const contract = new ethers.Contract(VAULT_CONTRACT, AliBankVaultABI, provider);
      const balance = await contract.getTotalVaultBalance().catch(async () => {
        // Fallback to raw balance if function fails
        return await provider.getBalance(VAULT_CONTRACT);
      });
      setOnChainEth(formatEther(balance));
    } catch (err: any) {
      console.error("Sync failed:", err);
      setNodeError("Gagal terhubung ke RPC Node. Pastikan Alchemy URL benar.");
    } finally {
      setIsSyncing(false);
    }
  }, [VAULT_CONTRACT, ETH_RPC]);

  useEffect(() => {
    syncVaultBalance();
  }, [syncVaultBalance]);

  const handleWithdraw = async () => {
    if (!user || isExecuting || !amount) return;
    setIsExecuting(true);
    try {
      const res = await executeVaultWithdrawalAction(recipient, amount, user.uid, user.email!);
      if (res.success) {
        toast({ title: "Penarikan Berhasil", description: res.message });
        setAmount("");
        syncVaultBalance();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Eksekusi Gagal", description: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Manajemen Brankas</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Kliring Node & Brankas ETH Mainnet AliBank</p>
        </div>
        <div className="flex gap-2">
          <Badge className={cn(
            "font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg border-none flex items-center",
            nodeError ? "bg-rose-600 text-white" : "bg-primary text-primary-foreground"
          )}>
            {nodeError ? "NODE ERROR" : "MAINNET V3 AKTIF"}
          </Badge>
          <button onClick={syncVaultBalance} disabled={isSyncing} className="p-2 bg-muted rounded-full hover:bg-primary/10 transition-colors">
            <RefreshCw className={cn("w-5 h-5 text-primary", isSyncing && "animate-spin")} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 border-none bg-[#1A1D1F] rounded-[3rem] p-10 text-white space-y-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet className="w-48 h-48" /></div>
          
          <div className="space-y-6 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Total Likuiditas Terkelola</p>
              <h3 className="text-5xl font-black italic tracking-tighter text-blue-400">
                {parseFloat(onChainEth).toFixed(6)} <span className="text-xl text-white/30">ETH</span>
              </h3>
              <p className="text-[10px] font-bold text-white/20 mt-2">≈ Rp {(parseFloat(onChainEth) * 15850 * 2000).toLocaleString()} (Nilai Kontrak)</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[8px] font-black uppercase text-white/40 mb-1 flex items-center gap-2">
                  <ServerCog className="w-3 h-3" /> Alamat Kontrak
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-mono font-bold break-all opacity-60">{VAULT_CONTRACT}</p>
                  <ExternalLink className="w-3 h-3 text-primary shrink-0 ml-2" />
                </div>
              </div>
              <div className="flex items-center gap-3 text-green-500 bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                <ShieldCheck className="w-5 h-5 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest">Terverifikasi Tanda Tangan Pemilik</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm border border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-lg">
              <ArrowUpFromLine className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-black italic uppercase tracking-tight">Terminal Penarikan</h4>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {nodeError && (
              <div className="p-4 rounded-xl bg-rose-600/10 border border-rose-600/20 flex gap-3 animate-in shake-in">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <p className="text-[10px] font-black text-rose-600 uppercase italic leading-relaxed">
                  {nodeError}
                </p>
              </div>
            )}

            <div className="p-6 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 space-y-4">
              <div className="flex gap-4">
                <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-rose-600 uppercase italic">Persyaratan Saldo GAS</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                    Dompet MetaMask Anda WAJIB memiliki minimal 0.005 ETH untuk membayar biaya GAS Mainnet. Tanpa saldo Gas, transaksi akan gagal dengan pesan "insufficient funds".
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Jumlah untuk Ditarik (ETH)</label>
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

          <Button 
            onClick={handleWithdraw} 
            disabled={isExecuting || !amount || !!nodeError}
            className="w-full h-16 gold-gradient text-white rounded-2xl font-black italic uppercase tracking-widest shadow-xl border-none hover:scale-[1.01] transition-all"
          >
            {isExecuting ? <Loader2 className="animate-spin" /> : (
              <span className="flex items-center gap-3">
                EKSEKUSI PENARIKAN <ArrowRightLeft className="w-5 h-5" />
              </span>
            )}
          </Button>
        </Card>
      </div>

      <section className="space-y-6">
        <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-3">
          <History className="w-5 h-5 text-primary" /> Log Penyelesaian Real-Time
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auditLogs?.filter((l:any) => l.category === "External Settlement" || l.txHash).slice(0, 6).map((log: any) => (
            <Card key={log.id} className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4 hover:border-primary/30 transition-all group">
              <Badge className="bg-blue-100 text-blue-600 border-none text-[7px] font-black h-4 px-2 uppercase italic">Transaksi On-Chain</Badge>
              <p className="text-[10px] font-black uppercase italic truncate text-accent">{log.description || log.category}</p>
              <div className="flex justify-between items-end border-t border-border pt-4">
                <div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Nilai</p>
                  <p className="text-sm font-black italic text-foreground">Rp {log.amountIdr?.toLocaleString()}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
