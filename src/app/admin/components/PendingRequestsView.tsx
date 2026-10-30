
"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Loader2, 
  Image as ImageIcon,
  Clock,
  User as UserIcon,
  Banknote,
  ArrowRight,
  Globe,
  ExternalLink,
  Hash,
  Coins,
  Building2,
  ArrowDownToLine,
  Copy
} from "lucide-react";
import { 
  doc, 
  increment, 
  collection, 
  serverTimestamp
} from "firebase/firestore";
import { proxyUpdateDoc, proxyAddDoc } from "@/lib/firestore-proxy-client";
import { useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function PendingRequestsView({ topupRequests }: any) {
  const db = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'withdraw'>('all');

  const isWithdrawReq = (req: any) => req?.type === 'withdraw' || req?.type === 'cash_delivery';

  const handleApprove = async (req: any) => {
    if (!db || isProcessing) return;
    if (req.status !== 'pending') {
      toast({
        variant: "destructive",
        title: "Permintaan Sudah Diproses",
        description: "Permintaan ini sudah tidak dalam status pending (mungkin telah diproses atau dibatalkan nasabah).",
      });
      return;
    }
    setIsProcessing(req.id);
    
    try {
      const userRef = doc(db, "users", req.userId);

      if (isWithdrawReq(req)) {
        // PENARIKAN TUNAI (WITHDRAW / CASH DELIVERY)
        // Saldo nasabah sudah dipotong saat pengajuan withdraw; kita tandai transaksi nasabah sebagai 'success'
        const withdrawIdr = Number(req.amount || req.totalToTransfer || 0);
        const bankLabel = req.bankDetails?.bankName || req.bankDetails?.bank?.toUpperCase() || "Bank Tujuan";
        const accNum = req.bankDetails?.accountNumber || "-";
        const accName = req.bankDetails?.accountName || req.userName || "-";

        if (req.txDocId) {
          try {
            await proxyUpdateDoc(doc(db, "users", req.userId, "transactions", req.txDocId), {
              status: "success"
            });
          } catch {}
        }

        // Sinkronisasi kas / likuiditas IDR bank pusat saat dana keluar
        if (withdrawIdr > 0) {
          try {
            await proxyUpdateDoc("system/liquidity", {
              totalFiatInjected: increment(-withdrawIdr)
            });
          } catch {}
        }

        await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `WD-APP-${Date.now()}`,
          category: "Kliring Penarikan",
          amountIdr: withdrawIdr,
          cryptoAmount: req.cryptoAmount || 0,
          cryptoCurrency: req.cryptoAsset || null,
          description: `Admin menyetujui pencairan tunai Rp ${withdrawIdr.toLocaleString("id-ID")} untuk ${req.userName} ke ${bankLabel} (${accNum} a.n. ${accName}).`,
          status: "berhasil",
          timestamp: serverTimestamp(),
          userEmail: req.userEmail
        });

        await proxyAddDoc(collection(db, "users", req.userId, "notifications"), {
          title: "Penarikan Tunai Berhasil Dicairkan",
          message: `Dana sebesar Rp ${withdrawIdr.toLocaleString("id-ID")} telah berhasil dicairkan ke rekening ${bankLabel} (${accNum} a.n. ${accName}).`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        await proxyUpdateDoc(doc(db, "topup_requests", req.id), { status: "approved" });

        toast({
          title: "Pencairan Disetujui",
          description: `Penarikan Rp ${withdrawIdr.toLocaleString("id-ID")} ke ${bankLabel} telah ditandai selesai.`
        });
      } else {
        // SETORAN MASUK (DEPOSIT FIAT / CRYPTO)
        const updateData: any = {};
        const amount = req.asset === 'IDR' ? Number(req.amount || req.totalToTransfer || 0) : Number(req.estimatedAsset || req.amount || 0);

        if (req.asset === 'IDR') {
          updateData.totalBalance = increment(amount);
        } else {
          updateData[`cryptoBalances.${req.asset}`] = increment(amount);
        }

        await proxyUpdateDoc(userRef, updateData);

        // Catat di riwayat transaksi nasabah agar sinkron dengan audit forensik saldo
        await proxyAddDoc(collection(db, "users", req.userId, "transactions"), {
          date: new Date().toISOString(),
          description: req.type === 'crypto_deposit'
            ? `Deposit On-Chain ${amount} ${req.asset} (Terverifikasi)`
            : `Setoran Saldo Rp ${amount.toLocaleString("id-ID")} (Terverifikasi)`,
          category: "TopUp",
          asset: req.asset || "IDR",
          amount: req.asset === 'IDR' ? amount : Number(req.amount || 0),
          cryptoAmount: req.asset !== 'IDR' ? amount : 0,
          cryptoCurrency: req.asset !== 'IDR' ? req.asset : null,
          type: "income",
          status: "success",
          timestamp: serverTimestamp()
        });

        // Audit Ledger Global
        await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `TOPUP-APP-${Date.now()}`,
          category: req.type === 'crypto_deposit' ? "Kliring On-Chain" : "Kliring Manual",
          amountIdr: req.asset === 'IDR' ? amount : 0,
          cryptoAmount: req.asset !== 'IDR' ? amount : 0,
          cryptoCurrency: req.asset !== 'IDR' ? req.asset : null,
          description: `Admin menyetujui setoran ${req.asset} untuk ${req.userName}. ${req.txid ? `Hash: ${req.txid}` : `Kode Unik: ${req.uniqueCode || '-'}`}`,
          status: "berhasil",
          timestamp: serverTimestamp(),
          userEmail: req.userEmail
        });

        await proxyAddDoc(collection(db, "users", req.userId, "notifications"), {
          title: "Setoran Berhasil Diverifikasi",
          message: `Saldo ${req.asset === 'IDR' ? `Rp ${amount.toLocaleString('id-ID')}` : `${amount} ${req.asset}`} Anda telah ditambahkan ke akun. Terima kasih telah menggunakan AliBank V3.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });

        await proxyUpdateDoc(doc(db, "topup_requests", req.id), { status: "approved" });
        
        toast({ title: "Permintaan Disetujui", description: `Aset dikreditkan ke ${req.userName}` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Persetujuan Gagal", description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (req: any) => {
    if (!db || isProcessing) return;
    const isWd = isWithdrawReq(req);
    if (req.status !== 'pending') {
      toast({
        variant: "destructive",
        title: "Permintaan Sudah Diproses",
        description: "Permintaan ini sudah tidak dalam status pending.",
      });
      return;
    }
    const confirmMsg = isWd
      ? `Tolak penarikan ini dan kembalikan (refund) saldo ke akun ${req.userName}?`
      : `Tolak permintaan setoran dari ${req.userName}?`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(req.id);
    try {
      if (isWd) {
        const userRef = doc(db, "users", req.userId);
        const withdrawIdr = Number(req.amount || req.totalToTransfer || 0);

        if (req.cryptoAsset && Number(req.cryptoAmount) > 0) {
          await proxyUpdateDoc(userRef, {
            [`cryptoBalances.${req.cryptoAsset}`]: increment(Number(req.cryptoAmount))
          });
        } else if (withdrawIdr > 0) {
          await proxyUpdateDoc(userRef, {
            totalBalance: increment(withdrawIdr)
          });
        }

        if (req.txDocId) {
          try {
            await proxyUpdateDoc(doc(db, "users", req.userId, "transactions", req.txDocId), {
              status: "rejected",
              category: "Withdraw",
              description: `Penarikan Ditolak Kliring (Dana Direfund)`
            });
          } catch {}
        }

        await proxyAddDoc(collection(db, "users", req.userId, "notifications"), {
          title: "Penarikan Ditolak & Dana Dikembalikan",
          message: req.cryptoAsset && Number(req.cryptoAmount) > 0
            ? `Permintaan pengiriman tunai ditolak oleh kliring. Saldo ${req.cryptoAmount} ${req.cryptoAsset} telah dikembalikan utuh ke dompet Anda.`
            : `Permintaan penarikan Rp ${withdrawIdr.toLocaleString("id-ID")} ditolak oleh kliring dan dana telah dikembalikan utuh ke saldo utama Anda.`,
          type: "error",
          read: false,
          createdAt: new Date().toISOString()
        });

        await proxyAddDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `WD-REJ-${Date.now()}`,
          category: "Refund Penarikan",
          amountIdr: withdrawIdr,
          description: `Admin menolak penarikan ${req.userName} dan mengembalikan dana Rp ${withdrawIdr.toLocaleString("id-ID")}.`,
          status: "dibatalkan",
          timestamp: serverTimestamp(),
          userEmail: req.userEmail
        });
      }

      await proxyUpdateDoc(doc(db, "topup_requests", req.id), { status: "rejected" });
      toast({
        title: isWd ? "Penarikan Ditolak & Dana Direfund" : "Permintaan Ditolak",
        description: isWd ? `Saldo telah dikembalikan ke akun ${req.userName}.` : undefined
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Menolak Permintaan", description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingAll = (topupRequests || []).filter((r: any) => String(r.status || 'pending').toLowerCase() === 'pending');
  const pendingWithdrawCount = pendingAll.filter((r: any) => isWithdrawReq(r)).length;
  const pendingDepositCount = pendingAll.length - pendingWithdrawCount;

  const pending = pendingAll.filter((r: any) => {
    if (filterType === 'withdraw') return isWithdrawReq(r);
    if (filterType === 'deposit') return !isWithdrawReq(r);
    return true;
  });

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Pusat Kliring</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Verifikasi Dana Masuk (Bank & Blockchain) & Pencairan Tarik Tunai</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            className="rounded-full text-[10px] font-black uppercase h-8 px-4"
          >
            Semua ({pendingAll.length})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'deposit' ? 'default' : 'outline'}
            onClick={() => setFilterType('deposit')}
            className="rounded-full text-[10px] font-black uppercase h-8 px-4"
          >
            Setoran Masuk ({pendingDepositCount})
          </Button>
          <Button
            size="sm"
            variant={filterType === 'withdraw' ? 'default' : 'outline'}
            onClick={() => setFilterType('withdraw')}
            className="rounded-full text-[10px] font-black uppercase h-8 px-4"
          >
            Penarikan Tunai ({pendingWithdrawCount})
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {pending.map((req: any) => {
          const isWd = isWithdrawReq(req);
          const bankLabel = req.bankDetails?.bankName || req.bankDetails?.bank?.toUpperCase() || "Bank Tujuan";
          const accNum = req.bankDetails?.accountNumber || "-";
          const accName = req.bankDetails?.accountName || req.userName || "-";

          return (
            <Card key={req.id} className="border-none bg-card rounded-[2rem] p-6 shadow-sm group">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                  {isWd ? (
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                      <ArrowDownToLine className="w-7 h-7 text-amber-500" />
                    </div>
                  ) : (
                    <div 
                      className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center relative overflow-hidden cursor-pointer shrink-0" 
                      onClick={() => req.proofImage && setSelectedImage(req.proofImage)}
                    >
                      {req.proofImage ? (
                        <img src={req.proofImage} alt="bukti" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      ) : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-4 h-4 text-white" /></div>
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-black italic uppercase">{req.userName}</h4>
                      <Badge variant="outline" className={cn(
                        "text-[7px] font-black px-2 h-4 border-none uppercase",
                        isWd
                          ? "bg-amber-500/20 text-amber-500"
                          : req.type === 'crypto_deposit'
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      )}>
                        {isWd
                          ? (req.type === 'cash_delivery' ? 'PENGIRIMAN TUNAI (CRYPTO -> IDR)' : 'PENARIKAN TUNAI (WITHDRAW)')
                          : req.type === 'crypto_deposit'
                          ? 'ON-CHAIN DEPOSIT'
                          : 'FIAT BANK DEPOSIT'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {req.asset === 'IDR' || isWd ? (
                        <p className="text-xl font-black text-primary italic">
                          Rp {(Number(req.amount || req.totalToTransfer || 0)).toLocaleString('id-ID')}
                        </p>
                      ) : (
                        <p className="text-xl font-black text-primary italic">{req.estimatedAsset} {req.asset}</p>
                      )}
                      {req.cryptoAsset && Number(req.cryptoAmount) > 0 && (
                        <Badge variant="outline" className="border-amber-500/30 text-amber-500 font-black italic text-[8px] h-5 px-2">
                          DARI: {req.cryptoAmount} {req.cryptoAsset}
                        </Badge>
                      )}
                      {req.uniqueCode && (
                        <Badge variant="outline" className="border-primary/20 text-primary font-black italic text-[8px] h-5 px-2">
                          KODE: {req.uniqueCode}
                        </Badge>
                      )}
                    </div>

                    {isWd && (
                      <div className="mt-2 p-2.5 rounded-xl bg-muted/60 border border-border flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px]">
                        <span className="font-black uppercase text-foreground flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-primary" /> {bankLabel}
                        </span>
                        <span className="font-mono font-bold text-primary flex items-center gap-1">
                          No. Rek: {accNum}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(String(accNum));
                              toast({ title: "Nomor Rekening Disalin", description: accNum });
                            }}
                            className="p-0.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary"
                            title="Salin Nomor Rekening"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </span>
                        <span className="font-bold text-muted-foreground uppercase">
                          a.n. {accName}
                        </span>
                      </div>
                    )}

                    {req.txid && (
                      <div className="flex items-center gap-2 mt-1.5 group/hash cursor-pointer" onClick={() => window.open(req.asset === 'BTC' ? `https://mempool.space/tx/${req.txid}` : `https://etherscan.io/tx/${req.txid}`, '_blank')}>
                        <Hash className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] font-mono font-bold text-blue-500 truncate max-w-[150px] group-hover/hash:underline">{req.txid}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-blue-500 opacity-0 group-hover/hash:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-end">
                  <div className="text-right hidden sm:block">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Email Nasabah</p>
                    <p className="text-[10px] font-bold text-accent italic">{req.userEmail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      disabled={isProcessing === req.id}
                      className="h-12 px-4 rounded-xl hover:bg-rose-500/10 text-rose-500 font-black uppercase text-[10px]"
                      onClick={() => handleReject(req)}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      {isWd ? "Tolak & Refund" : "Tolak"}
                    </Button>
                    <Button 
                      onClick={() => handleApprove(req)}
                      disabled={isProcessing === req.id}
                      className="h-12 px-6 gold-gradient text-white rounded-xl font-black uppercase italic shadow-lg"
                    >
                      {isProcessing === req.id ? (
                        <Loader2 className="animate-spin w-4 h-4" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {isWd ? "Setujui Pencairan" : "Setujui & Kreditkan"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {pending.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20 italic">
            <CheckCircle2 className="w-16 h-16 mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest">Semua Bersih. Tidak ada permintaan tertunda.</p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-xl p-0 bg-transparent border-none">
          <DialogHeader className="sr-only"><DialogTitle>Bukti Pembayaran</DialogTitle></DialogHeader>
          <img src={selectedImage || ""} alt="Full Proof" className="w-full h-full rounded-[2rem] shadow-2xl" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
