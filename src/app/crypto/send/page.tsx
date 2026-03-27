
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ArrowLeft, 
  Send, 
  Wallet, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  QrCode,
  Zap,
  Bitcoin,
  Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { BrowserProvider, parseEther } from "ethers";
import { cn } from "@/lib/utils";

export default function CryptoSendPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [assetType, setAssetType] = useState<"ETH" | "BTC" | "USDT">("ETH");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'form' | 'confirmation' | 'success'>('form');

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const handleSendExternal = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const currentBal = userData.cryptoBalances?.[assetType] || 0;
    if (numAmount > currentBal && assetType !== 'ETH') {
      toast({ variant: "destructive", title: "Saldo Tidak Cukup", description: `Saldo ${assetType} Anda tidak mencukupi.` });
      return;
    }

    setIsProcessing(true);
    try {
      if (assetType === 'ETH') {
        // Real On-Chain Send for ETH
        if (typeof window.ethereum === 'undefined') {
          throw new Error("MetaMask diperlukan untuk pengiriman ETH On-Chain.");
        }
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const tx = await signer.sendTransaction({
          to: recipientAddress,
          value: parseEther(amount)
        });
        await tx.wait();
      }

      // Update Database (Internal Ledger)
      const payload = {
        [`cryptoBalances.${assetType}`]: increment(-numAmount)
      };
      await updateDoc(userDocRef, payload);

      // Log Transaksi
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `Kirim ${assetType} ke External Wallet`,
        category: "Crypto Transfer",
        cryptoAmount: numAmount,
        cryptoCurrency: assetType,
        recipient: recipientAddress,
        type: "expense",
        status: "success",
        timestamp: serverTimestamp()
      });

      setStep('success');
      toast({ title: "Aset Terkirim", description: `${amount} ${assetType} telah dikirim ke alamat tujuan.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Mengirim", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <ShieldCheck className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-accent text-center tracking-tighter mb-2">Transaksi Sukses</h2>
      <Card className="w-full max-w-sm liquid-glass border-none rounded-[2rem] p-8 mb-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Aset Terkirim</p>
        <p className="text-3xl font-black text-primary italic">{amount} {assetType}</p>
        <div className="mt-4 pt-4 border-t border-primary/5">
          <p className="text-[8px] font-bold text-muted-foreground uppercase break-all">Tujuan: {recipientAddress}</p>
        </div>
      </Card>
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/crypto')}>
        Kembali ke Exchange
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 max-w-lg pt-4">
        <header className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
              <Send className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter">Kirim Kripto</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Pindahkan aset ke dompet eksternal.</p>
            </div>
          </div>
        </header>

        <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Aset</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ETH', icon: Cpu, color: 'text-blue-500' },
                  { id: 'BTC', icon: Bitcoin, color: 'text-orange-500' },
                  { id: 'USDT', icon: ShieldCheck, color: 'text-green-500' }
                ].map((asset) => (
                  <button 
                    key={asset.id}
                    onClick={() => setAssetType(asset.id as any)}
                    className={cn(
                      "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                      assetType === asset.id ? "border-primary bg-primary/5" : "border-primary/5"
                    )}
                  >
                    <asset.icon className={cn("w-6 h-6", assetType === asset.id ? asset.color : "text-muted-foreground")} />
                    <span className="text-[10px] font-black uppercase">{asset.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alamat Penerima</label>
              <div className="relative">
                <Input 
                  placeholder="0x... atau alamat wallet" 
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="h-14 rounded-2xl liquid-glass border-none font-bold text-xs" 
                />
                <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah {assetType}</label>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-16 rounded-2xl liquid-glass border-none font-black italic text-xl" 
                />
                <button 
                  onClick={() => setAmount((userData?.cryptoBalances?.[assetType] || 0).toString())}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase"
                >
                  MAX
                </button>
              </div>
              <p className="text-[8px] font-bold text-muted-foreground uppercase px-1">Tersedia: {userData?.cryptoBalances?.[assetType] || 0} {assetType}</p>
            </div>

            <div className="p-4 rounded-2xl bg-accent/5 border border-primary/10 flex gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Pastikan alamat tujuan benar. Transaksi blockchain tidak dapat dibatalkan setelah dieksekusi.
              </p>
            </div>

            <Button 
              onClick={handleSendExternal}
              disabled={isProcessing || !amount || !recipientAddress}
              className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-[2rem] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  KONFIRMASI PENGIRIMAN
                  <Zap className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
