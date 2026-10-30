
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  User, 
  FileText, 
  ShieldCheck, 
  Wallet, 
  Loader2,
  TrendingUp,
  Activity,
  AlertTriangle,
  History,
  Zap,
  Fingerprint,
  Download,
  ChevronRight,
  Landmark,
  ShieldAlert,
  SearchCheck,
  Clock,
  Globe,
  X,
  Database,
  SearchCode,
  RefreshCw,
  HandCoins,
  Skull,
  CheckCircle2,
  Coins
} from "lucide-react";
import { 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";
import { UserAvatar } from "@/components/ui/user-avatar";
import { proxyGetCollection } from "@/lib/firestore-proxy-client";

const ALX_PRICE_IDR = 194004;

export function ClientLedgerView({ allUsers }: { allUsers: any[] | null }) {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [pendingTopups, setPendingTopups] = useState<any[]>([]);
  const [approvedTopups, setApprovedTopups] = useState<any[]>([]);
  const [globalAuditMatches, setGlobalAuditMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isForensicLoading, setIsForensicLoading] = useState(false);

  // Otomatis pilih nasabah jika diklik dari tab Rekonsiliasi & Anti-Fraud
  useEffect(() => {
    if (!allUsers || allUsers.length === 0) return;
    if (typeof window === "undefined") return;
    const preselectedUid = sessionStorage.getItem("alibank_admin_selected_ledger_uid");
    if (preselectedUid) {
      const found = allUsers.find((u: any) => u.id === preselectedUid || u.uid === preselectedUid);
      if (found) {
        setSelectedUser(found);
      }
      sessionStorage.removeItem("alibank_admin_selected_ledger_uid");
    }
  }, [allUsers]);

  // LOGIKA PENCARIAN & SARAN NASABAH
  const suggestions = useMemo(() => {
    if (!allUsers) return [];
    if (!searchTerm) return allUsers.slice(0, 10); 
    
    const s = searchTerm.toLowerCase();
    return allUsers.filter(u => 
      u.name?.toLowerCase().includes(s) || 
      u.email?.toLowerCase().includes(s) || 
      u.accountNumber?.includes(s)
    ).slice(0, 10);
  }, [allUsers, searchTerm]);

  useEffect(() => {
    async function fetchDeepLedger() {
      if (!selectedUser || !db) return;
      setIsLoading(true);
      setIsForensicLoading(true);
      
      try {
        // 1. Ambil Riwayat Transaksi Nasabah (Local Ledger) dengan fallback Proxy REST
        const qLocal = query(
          collection(db, "users", selectedUser.id, "transactions"),
          orderBy("timestamp", "desc"),
          limit(300)
        );
        try {
          const localSnap = await getDocs(qLocal);
          setUserTxs(localSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          const proxyRes = await proxyGetCollection(qLocal);
          setUserTxs(proxyRes?.docs || []);
        }

        // 2. Ambil Topup Requests (Pending & Approved)
        const qTopup = query(
          collection(db, "topup_requests"),
          where("userId", "==", selectedUser.id),
          limit(100)
        );
        try {
          const topupSnap = await getDocs(qTopup);
          const allReqs = topupSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          setPendingTopups(allReqs.filter(r => r.status === 'pending' && r.type !== 'withdraw' && r.type !== 'cash_delivery'));
          setApprovedTopups(allReqs.filter(r => r.status === 'approved' && r.type !== 'withdraw' && r.type !== 'cash_delivery'));
        } catch {
          const proxyReqs = await proxyGetCollection(qTopup);
          const allReqs: any[] = proxyReqs?.docs || [];
          setPendingTopups(allReqs.filter(r => r.status === 'pending' && r.type !== 'withdraw' && r.type !== 'cash_delivery'));
          setApprovedTopups(allReqs.filter(r => r.status === 'approved' && r.type !== 'withdraw' && r.type !== 'cash_delivery'));
        }

        // 3. DEEP SCAN: Cari bukti di Audit Global
        const qGlobal = query(
          collection(db, "system", "audit", "global_transactions"),
          where("userEmail", "==", selectedUser.email),
          orderBy("timestamp", "desc"),
          limit(100)
        );
        try {
          const globalSnap = await getDocs(qGlobal);
          setGlobalAuditMatches(globalSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch {
          const proxyGlobal = await proxyGetCollection(qGlobal);
          setGlobalAuditMatches(proxyGlobal?.docs || []);
        }

      } catch (e) {
        console.error("Ledger fetch error:", e);
      } finally {
        setIsLoading(false);
        setIsForensicLoading(false);
      }
    }
    fetchDeepLedger();
  }, [selectedUser, db]);

  const ledgerStats = useMemo(() => {
    if (!selectedUser) return { totalIn: 0, totalOut: 0, illegalDebtIdr: 0, totalCryptoDebtValIdr: 0, cryptoDebtBreakdown: [], pendingDebt: 0, totalTotalDebt: 0 };
    
    const isOwnerAccount =
      String(selectedUser.email || '').toLowerCase() === 'alidzulfikar075@gmail.com' ||
      selectedUser.id === 'IJOuQpjEOMgvlYfzvQ1yfp976Oa2' ||
      selectedUser.role === 'admin';

    let idrInflow = 0;
    let idrOutflow = 0;
    const cryptoInflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };
    const cryptoOutflows: Record<string, number> = { ALX: 0, USDT: 0, ETH: 0, BTC: 0 };

    let hasLegalization = false;
    let hasDepositApprovedTx = false;
    let hasTradeXTx = false;

    userTxs.forEach(t => {
      if (t.status === 'rejected' || t.status === 'cancelled') return;
      const cat = String(t.category || '');
      const desc = String(t.description || '');

      if (['Legalization', 'Adjustment', 'Debt Recovery', 'Debt Restructuring'].includes(cat)) {
        hasLegalization = true;
        return;
      }
      if (cat === 'Security Lock') return;
      if (cat === 'Deposit' && desc.includes('Setoran Disetujui')) {
        hasDepositApprovedTx = true;
      }

      // 0. Trade-X Pro
      if (cat === 'Trade-X' || t.stakeCurrency || t.rewardAlx !== undefined) {
        hasTradeXTx = true;
        const stakeCur = String(t.stakeCurrency || 'IDR');
        const stakeAmt = Math.abs(Number(t.stakeAmount || 0));
        const rewardAlx = Math.abs(Number(t.rewardAlx || 0));

        if (stakeCur === 'IDR') idrOutflow += stakeAmt;
        else if (stakeCur in cryptoOutflows) cryptoOutflows[stakeCur] += stakeAmt;

        if (rewardAlx > 0) cryptoInflows.ALX += rewardAlx;
        return;
      }

      // 1. Swap / Convert
      if (t.fromCurrency && t.toCurrency) {
        const fromCur = String(t.fromCurrency);
        const toCur = String(t.toCurrency);
        const fromAmt = Math.abs(Number(t.fromAmount || 0));
        const toAmt = Math.abs(Number(t.toAmount || 0));

        if (fromCur === 'IDR') idrOutflow += fromAmt;
        else if (fromCur in cryptoOutflows) cryptoOutflows[fromCur] += fromAmt;

        if (toCur === 'IDR') idrInflow += toAmt;
        else if (toCur in cryptoInflows) cryptoInflows[toCur] += toAmt;
        return;
      }

      // 2. Jual Kripto ke Saldo Dompet IDR
      if (desc.includes('Jual ') && desc.includes('ke Saldo Dompet')) {
        const sym = String(t.cryptoCurrency || t.asset || '');
        const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
        const idrAmt = Math.abs(Number(t.amount || 0));
        if (sym in cryptoOutflows) cryptoOutflows[sym] += cryptoAmt;
        idrInflow += idrAmt;
        return;
      }

      // 3. Beli Kripto via Saldo Dompet / Ali-Premium
      if (
        desc.startsWith('Beli ') &&
        (desc.includes('Saldo Dompet') || desc.includes('(Ali-Premium)') || t.type === 'expense')
      ) {
        const sym = String(t.cryptoCurrency || t.asset || '');
        const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
        const idrAmt = Math.abs(Number(t.amount || 0));
        idrOutflow += idrAmt;
        if (sym in cryptoInflows) cryptoInflows[sym] += cryptoAmt;
        return;
      }

      // 4. Beli Kripto via Gateway Eksternal
      if (desc.startsWith('Beli ') && t.type === 'income' && t.cryptoCurrency) {
        const sym = String(t.cryptoCurrency);
        const cryptoAmt = Math.abs(Number(t.cryptoAmount || 0));
        if (sym in cryptoInflows) cryptoInflows[sym] += cryptoAmt;
        return;
      }

      // 5. Transaksi Kripto Murni
      const sym = String(t.cryptoCurrency || (t.asset && t.asset !== 'IDR' ? t.asset : ''));
      const cryptoAmt = Math.abs(Number(t.cryptoAmount || (sym ? t.amount : 0) || 0));
      if (sym && sym in cryptoInflows && cryptoAmt > 0) {
        if (t.type === 'income') cryptoInflows[sym] += cryptoAmt;
        else if (t.type === 'expense') cryptoOutflows[sym] += cryptoAmt;
        return;
      }

      // 6. Transaksi Fiat IDR Murni
      const idrAmt = Math.abs(Number(t.amount || 0));
      if (idrAmt > 0) {
        if (t.type === 'income') idrInflow += idrAmt;
        else if (t.type === 'expense') idrOutflow += idrAmt;
      }
    });

    if (!hasDepositApprovedTx) {
      approvedTopups.forEach(req => {
        const asset = String(req.asset || 'IDR');
        const amt = Math.abs(Number(req.estimatedAsset || req.amount || 0));
        if (amt <= 0) return;
        if (asset === 'IDR') idrInflow += amt;
        else if (asset in cryptoInflows) cryptoInflows[asset] += amt;
      });
    }

    globalAuditMatches.forEach(g => {
      if (g.status !== 'success' && g.status !== 'berhasil') return;
      const gCat = String(g.category || '');
      if (!hasTradeXTx && gCat === 'Trade-X Win' && g.cryptoCurrency === 'ALX') {
        cryptoInflows.ALX += Math.abs(Number(g.cryptoAmount || 0));
      } else if (gCat === 'Futures Settlement' && !g.userLoggedInTx) {
        const desc = String(g.description || '');
        if (desc.includes('User Profit')) {
          const match = desc.match(/PNL:\s*([0-9.]+)\s*USDT/i);
          if (match && match[1]) {
            cryptoInflows.USDT += parseFloat(match[1]);
          }
        }
      }
    });

    if (selectedUser.syncedOnChainBalances && typeof selectedUser.syncedOnChainBalances === 'object') {
      (['ALX', 'USDT', 'ETH', 'BTC'] as const).forEach(coin => {
        const onChainBal = Number(selectedUser.syncedOnChainBalances[coin] || 0);
        if (onChainBal > cryptoInflows[coin]) {
          cryptoInflows[coin] = onChainBal;
        }
      });
    }

    const idrLedgerBal = idrInflow - idrOutflow;
    const illegalDebtIdr = (hasLegalization || isOwnerAccount)
      ? 0
      : Math.max(0, (selectedUser.totalBalance || 0) - idrLedgerBal);

    // 2. Crypto Ledger Check (ALX, BTC, ETH, USDT)
    const assets = ['ALX', 'BTC', 'ETH', 'USDT'];
    const cryptoDebtBreakdown: any[] = [];
    let totalCryptoDebtValIdr = 0;

    if (!hasLegalization && !isOwnerAccount) {
      assets.forEach(asset => {
        const ledgerBal = (cryptoInflows[asset] || 0) - (cryptoOutflows[asset] || 0);
        const actualBal = selectedUser.cryptoBalances?.[asset] || 0;
        const diff = Math.max(0, actualBal - ledgerBal);

        if (diff > 0.001) {
          const priceMap: Record<string, number> = { ALX: ALX_PRICE_IDR, BTC: 1100000000, ETH: 35000000, USDT: 17690 };
          const valIdr = diff * (priceMap[asset] || 0);
          totalCryptoDebtValIdr += valIdr;
          cryptoDebtBreakdown.push({ asset, amount: diff, valueIdr: valIdr });
        }
      });
    }

    const pendingManualDebt = pendingTopups.reduce((acc, curr) => acc + (curr.totalToTransfer || curr.amount || 0), 0);

    return {
      totalIn: idrInflow,
      totalOut: idrOutflow,
      illegalDebtIdr,
      totalCryptoDebtValIdr,
      cryptoDebtBreakdown,
      pendingDebt: pendingManualDebt,
      totalTotalDebt: illegalDebtIdr + totalCryptoDebtValIdr + pendingManualDebt
    };
  }, [userTxs, selectedUser, pendingTopups, approvedTopups, globalAuditMatches]);

  return (
    <div className="animate-in fade-in duration-700 space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Buku Besar & Matriks Hutang</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Terminal Rekonsiliasi Aset Ilegal (IDR & Kripto)</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Cari Nasabah untuk Audit Hutang..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 bg-card border-none rounded-2xl text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </header>

      {!selectedUser ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2">
            <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">
              Daftar Nasabah Terdaftar
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((u: any) => (
              <Card 
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="p-6 rounded-[2rem] bg-card border border-border/50 hover:border-primary/40 cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-2xl bg-background flex items-center justify-center overflow-hidden">
                      <UserAvatar avatarUrl={u.avatarUrl} photoURL={u.photoURL} name={u.name} email={u.email} size={48} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-sm font-black italic uppercase text-foreground leading-none truncate">{u.name}</h5>
                    <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase truncate">{u.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-700">
          {/* USER CONTEXT PANEL */}
          <div className="flex flex-col md:flex-row items-center gap-8 bg-card p-8 rounded-[3rem] shadow-sm relative overflow-hidden border border-border/50">
            <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-48 h-48 text-primary" /></div>
            
            <div className="w-32 h-32 rounded-[2.5rem] gold-gradient flex items-center justify-center p-1.5 shadow-2xl relative z-10">
              <div className="w-full h-full rounded-[2.2rem] bg-background flex items-center justify-center overflow-hidden border-[6px] border-background">
                <UserAvatar avatarUrl={selectedUser?.avatarUrl} photoURL={selectedUser?.photoURL} name={selectedUser?.name} email={selectedUser?.email} size={128} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser.name}</h3>
              <p className="text-xs font-bold text-muted-foreground uppercase">{selectedUser.email}</p>
              <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">UID Rekening</p><p className="text-xs font-mono font-bold">{selectedUser.accountNumber}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Level</p><p className="text-xs font-black italic uppercase">{selectedUser.tier || 'Regular'}</p></div>
                 <div className="p-3 bg-muted rounded-xl border border-border"><p className="text-[8px] font-black text-muted-foreground uppercase">Audit Status</p><p className={cn("text-xs font-black italic uppercase", ledgerStats.totalTotalDebt > 1000 ? "text-rose-600" : "text-green-600")}>{ledgerStats.totalTotalDebt > 1000 ? 'RISIKO TINGGI' : 'BERSIH'}</p></div>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* TOTAL DEBT ALERT */}
          {ledgerStats.totalTotalDebt > 1000 && (
            <Card className="p-8 bg-rose-600 text-white rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Skull className="w-32 h-32" /></div>
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-pulse shrink-0">
                  <ShieldAlert className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h4 className="text-2xl font-black uppercase italic tracking-tighter">DETEKSI HUTANG MULTI-ASET ILEGAL</h4>
                    <p className="text-sm font-bold uppercase opacity-80">Total kewajiban nasabah yang tidak ter-audit: <span className="underline decoration-2 text-yellow-300 font-black">Rp {ledgerStats.totalTotalDebt.toLocaleString()}</span></p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {ledgerStats.illegalDebtIdr > 1000 && (
                      <div className="bg-black/10 p-3 rounded-xl"><p className="text-[9px] font-black uppercase">Hutang IDR</p><p className="text-xs font-black italic">Rp {ledgerStats.illegalDebtIdr.toLocaleString()}</p></div>
                    )}
                    {ledgerStats.cryptoDebtBreakdown.map((c: any) => (
                      <div key={c.asset} className="bg-black/10 p-3 rounded-xl">
                        <p className="text-[9px] font-black uppercase">Hutang {c.asset}</p>
                        <p className="text-xs font-black italic">{c.amount.toFixed(6)} {c.asset}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* RECONCILIATION SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <LedgerStatCard label="Saldo Dompet Riil (IDR)" value={`Rp ${selectedUser.totalBalance?.toLocaleString()}`} sub="Liquid Assets" color="text-foreground" icon={Wallet} />
            <LedgerStatCard label="Aset Kripto Ter-Audit" value={`${(selectedUser.cryptoBalances?.ALX || 0).toFixed(4)} ALX`} sub="Sovereign Holdings" color="text-primary" icon={Coins} />
            <LedgerStatCard 
              label="Total Hutang Injeksi" 
              value={`Rp ${(ledgerStats.illegalDebtIdr + ledgerStats.totalCryptoDebtValIdr).toLocaleString()}`} 
              sub="Unverified Inflow (IDR+Crypto)" 
              color={ledgerStats.totalTotalDebt > 1000 ? "text-rose-600" : "text-blue-500"} 
              icon={Skull} 
              isAnomaly={ledgerStats.illegalDebtIdr + ledgerStats.totalCryptoDebtValIdr > 1000}
            />
            <LedgerStatCard 
              label="Hutang Topup Pending" 
              value={`Rp ${ledgerStats.pendingDebt.toLocaleString()}`} 
              sub="Manual Payment Requests" 
              color="text-amber-600" 
              icon={HandCoins} 
              isAnomaly={ledgerStats.pendingDebt > 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
              <div className="p-8 border-b border-border bg-muted/30 flex justify-between items-center">
                <h4 className="text-lg font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" /> Log Riwayat Transaksi Resmi
                </h4>
                <button className="h-10 px-5 rounded-xl gold-gradient text-white flex items-center gap-2 text-[10px] font-black uppercase italic shadow-lg">
                  <Download className="w-3.5 h-3.5 mr-2" /> Download Laporan Forensik
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                    <tr>
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Aktivitas</th>
                      <th className="px-8 py-6">Metode</th>
                      <th className="px-8 py-6 text-right">Nilai Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {isLoading ? (
                      <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" /></td></tr>
                    ) : userTxs.map((tx) => (
                      <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-mono font-bold text-muted-foreground">
                            {tx.timestamp?.toDate ? tx.timestamp.toDate().toLocaleString('id-ID') : tx.date}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className="border-none text-[8px] font-black uppercase px-2 h-4 bg-muted text-foreground mb-1">{tx.category || 'Aktivitas'}</Badge>
                          <p className="text-[10px] font-black uppercase italic text-foreground">{tx.description}</p>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-[10px] font-black uppercase italic">{tx.gateway || "Internal Node"}</p>
                        </td>
                        <td className="px-8 py-5 text-right font-black italic">
                          <span className={tx.type === 'income' ? "text-green-600" : "text-rose-600"}>
                            {tx.type === 'income' ? '+' : '-'}
                            {tx.amount ? `Rp${tx.amount.toLocaleString()}` : `${tx.cryptoAmount || tx.toAmount || tx.fromAmount || 0} ${tx.cryptoCurrency || tx.toCurrency || tx.fromCurrency}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!isLoading && userTxs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-20 text-center opacity-40 italic">
                          <Skull className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-xs font-black uppercase">TIDAK ADA RIWAYAT SAH DITEMUKAN UNTUK SALDO INI.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="lg:col-span-4 space-y-6">
              <h4 className="text-sm font-black uppercase italic tracking-widest px-2 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-primary" /> Piutang Bank (Pending)
              </h4>
              
              {pendingTopups.length > 0 ? (
                <div className="space-y-4">
                  {pendingTopups.map((req) => (
                    <Card key={req.id} className="p-6 rounded-[2rem] bg-amber-500/5 border border-amber-500/20 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <Badge className="bg-amber-500 text-white font-black text-[8px] h-5 uppercase italic">PENDING VERIFICATION</Badge>
                        <Clock className="w-4 h-4 text-amber-500" />
                      </div>
                      <p className="text-[10px] font-bold text-foreground leading-relaxed uppercase">
                        Permintaan aset senilai **{req.asset === 'IDR' ? `Rp ${req.totalToTransfer?.toLocaleString()}` : `${req.estimatedAsset} ${req.asset}`}** via {req.type === 'crypto_deposit' ? 'On-Chain' : 'Bank Transfer'}.
                      </p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                   <CheckCircle2 className="w-10 h-10" />
                   <p className="text-[10px] font-bold uppercase italic leading-tight">Tidak ada piutang pending.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LedgerStatCard({ label, value, sub, icon: Icon, color, isAnomaly }: any) {
  return (
    <Card className={cn(
      "border-none bg-card rounded-3xl p-8 shadow-sm h-44 flex flex-col justify-between border-2 transition-all",
      isAnomaly ? "border-rose-500 bg-rose-500/[0.02] animate-pulse" : "border-border/50"
    )}>
      <div className="flex justify-between items-start">
        <div className={cn("w-12 h-12 rounded-2xl bg-muted flex items-center justify-center", color)}>
          <Icon className="w-6 h-6" />
        </div>
        {isAnomaly && <Badge className="bg-rose-600 text-white font-black text-[7px] uppercase italic">ANOMALY</Badge>}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none mb-1.5">{label}</p>
        <p className={cn("text-xl font-black italic tracking-tighter truncate", color)}>{value}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 opacity-60 italic">{sub}</p>
      </div>
    </Card>
  );
}
