
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
  Coins
} from "lucide-react";
import { 
  doc, 
  updateDoc, 
  increment, 
  addDoc, 
  collection, 
  serverTimestamp,
  deleteDoc
} from "firebase/firestore";
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

  const handleApprove = async (req: any) => {
    if (!db || isProcessing) return;
    setIsProcessing(req.id);
    
    try {
      const userRef = doc(db, "users", req.userId);
      const updateData: any = {};
      
      const amount = req.asset === 'IDR' ? req.amount : req.estimatedAsset;

      if (req.asset === 'IDR') {
        updateData.totalBalance = increment(amount);
      } else {
        updateData[`cryptoBalances.${req.asset}`] = increment(amount);
      }

      await updateDoc(userRef, updateData);

      // Audit Ledger Global
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `TOPUP-APP-${Date.now()}`,
        category: req.type === 'crypto_deposit' ? "On-Chain Clearance" : "Manual Clearance",
        amountIdr: req.asset === 'IDR' ? req.amount : 0,
        cryptoAmount: req.asset !== 'IDR' ? req.estimatedAsset : 0,
        cryptoCurrency: req.asset !== 'IDR' ? req.asset : null,
        description: `Admin approved ${req.asset} deposit for ${req.userName}. ${req.txid ? `Hash: ${req.txid}` : `Unique Code: ${req.uniqueCode}`}`,
        status: "success",
        timestamp: serverTimestamp(),
        userEmail: req.userEmail
      });

      await addDoc(collection(db, "users", req.userId, "notifications"), {
        title: "Setoran Berhasil Diverifikasi",
        message: `Saldo ${amount} ${req.asset} Anda telah ditambahkan ke akun. Terima kasih telah menggunakan AliBank V3.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, "topup_requests", req.id), { status: "approved" });
      
      toast({ title: "Request Approved", description: `Assets credited to ${req.userName}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Approval Failed", description: err.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!db || !confirm("Reject this request?")) return;
    await updateDoc(doc(db, "topup_requests", id), { status: "rejected" });
    toast({ title: "Request Rejected" });
  };

  const pending = topupRequests?.filter((r: any) => r.status === 'pending') || [];

  return (
    <div className="animate-in fade-in duration-700 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Clearance Center</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Verifikasi Dana Masuk (Bank & Blockchain)</p>
        </div>
        <Badge className="bg-amber-100 text-amber-600 font-black px-4 h-8 rounded-full uppercase italic">{pending.length} Pending</Badge>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {pending.map((req: any) => (
          <Card key={req.id} className="border-none bg-card rounded-[2rem] p-6 shadow-sm group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center relative overflow-hidden cursor-pointer" 
                  onClick={() => setSelectedImage(req.proofImage)}
                >
                  {req.proofImage ? (
                    <img src={req.proofImage} alt="proof" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Eye className="w-4 h-4 text-white" /></div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-black italic uppercase">{req.userName}</h4>
                    <Badge variant="outline" className={cn(
                      "text-[7px] font-black px-1.5 h-4 border-none uppercase",
                      req.type === 'crypto_deposit' ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    )}>
                      {req.type === 'crypto_deposit' ? 'ON-CHAIN' : 'FIAT BANK'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {req.asset === 'IDR' ? (
                      <p className="text-xl font-black text-primary italic">Rp {req.totalToTransfer?.toLocaleString()}</p>
                    ) : (
                      <p className="text-xl font-black text-primary italic">{req.estimatedAsset} {req.asset}</p>
                    )}
                    {req.uniqueCode && <Badge variant="outline" className="border-primary/20 text-primary font-black italic text-[8px] h-5 px-2">KODE: {req.uniqueCode}</Badge>}
                  </div>
                  {req.txid && (
                    <div className="flex items-center gap-2 mt-1.5 group/hash cursor-pointer" onClick={() => window.open(req.asset === 'BTC' ? `https://mempool.space/tx/${req.txid}` : `https://etherscan.io/tx/${req.txid}`, '_blank')}>
                      <Hash className="w-3 h-3 text-blue-500" />
                      <span className="text-[9px] font-mono font-bold text-blue-500 truncate max-w-[150px] group-hover/hash:underline">{req.txid}</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-500 opacity-0 group-hover/hash:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] font-black uppercase text-muted-foreground">User Email</p>
                  <p className="text-[10px] font-bold text-accent italic">{req.userEmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="h-12 w-12 rounded-xl hover:bg-rose-100 text-rose-600" onClick={() => handleReject(req.id)}><XCircle className="w-5 h-5" /></Button>
                  <Button 
                    onClick={() => handleApprove(req)}
                    disabled={isProcessing === req.id}
                    className="h-12 px-6 gold-gradient text-white rounded-xl font-black uppercase italic shadow-lg"
                  >
                    {isProcessing === req.id ? <Loader2 className="animate-spin w-4 h-4" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve & Credit</>}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {pending.length === 0 && (
          <div className="py-20 text-center space-y-4 opacity-20 italic">
            <CheckCircle2 className="w-16 h-16 mx-auto" />
            <p className="text-sm font-black uppercase tracking-widest">All Clear. No pending requests.</p>
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
