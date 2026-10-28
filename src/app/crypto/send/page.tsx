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
  Cpu,
  Lock,
  Key,
  Info,
  ArrowRightLeft,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { ethers, JsonRpcProvider } from "ethers";
import { cn } from "@/lib/utils";

const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com";

export default function CryptoSendPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [assetType, setAssetType] = useState<"ETH" | "BTC" | "USDT" | "ALX">("ETH");
  const [sendMode, setSendMode] = useState<"custodial" | "self-custodial">("custodial");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [txHash, setTxHash] = useState("");
  const [onChainBal, setOnChainBal] = useState("0");
  const [gasInfo, setGasInfo] = useState<{ fast: number, standard: number } | null>(null);

  const apiKeysRef = useMemoFirebase(() => (db ? doc(db, "system", "public_keys") : null), [db]);
  const { data: config } = useDoc(apiKeysRef);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const hasPrivateKey = !!userData?.privateKey;

  // Sync sendMode with selected asset
  useEffect(() => {
    if (assetType !== 'ETH') {
      setSendMode("custodial");
    }
  }, [assetType]);

  // FETCH REAL-TIME GAS ESTIMATES via Infura Gas API
  const fetchGasPrice = useCallback(async () => {
    const gasApiUrl = config?.infuraGasApiUrl;
    if (!gasApiUrl) return;

    try {
      const res = await fetch(gasApiUrl);
      const data = await res.json();
      if (data.standard) {
        setGasInfo({
          fast: parseFloat(data.fast.suggestedMaxFeePerGas),
          standard: parseFloat(data.standard.suggestedMaxFeePerGas)
        });
      }
    } catch (e) {
      console.warn("Gas API sync failed, using default RPC fallback.");
    }
  }, [config?.infuraGasApiUrl]);

  useEffect(() => {
    async function sync() {
      if (userData?.walletAddress && sendMode === 'self-custodial') {
        try {
          const provider = new JsonRpcProvider(GLOBAL_RPC);
          const bal = await provider.getBalance(userData.walletAddress);
          setOnChainBal(ethers.formatEther(bal));
        } catch (e) {
          console.warn("Balance sync failed", e);
        }
      }
    }
    sync();
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 30000);
    return () => clearInterval(interval);
  }, [userData?.walletAddress, sendMode, fetchGasPrice]);

  const handleActivateSignature = async () => {
    if (!userDocRef || isActivating) return;
    setIsActivating(true);
    try {
      const newWallet = ethers.Wallet.createRandom();
      await updateDoc(userDocRef, {
        walletAddress: newWallet.address,
        privateKey: newWallet.privateKey
      });
      toast({ title: "Native Signature Aktif", description: "Dompet AliBank Anda sekarang mendukung tanda tangan mandiri." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Aktivasi", description: err.message });
    } finally {
      setIsActivating(false);
    }
  };

  const handleMaxAmount = () => {
    if (sendMode === 'self-custodial') {
      const currentBal = parseFloat(onChainBal);
      const safeMax = Math.max(0, currentBal - 0.0006); 
      setAmount(safeMax.toFixed(18).replace(/\.?0+$/, ""));
    } else {
      const bal = userData?.cryptoBalances?.[assetType] || 0;
      setAmount(bal.toString());
    }
  };

  const handleSendNative = async () => {
    if (!user || !db || !userDocRef || !userData) return;
    
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsProcessing(true);
    try {
      if (sendMode === 'self-custodial') {
        if (assetType !== 'ETH') throw new Error("Hanya ETH yang mendukung tanda tangan mandiri.");
        if (!hasPrivateKey) throw new Error("Aktifkan Native Signature terlebih dahulu.");
        
        const provider = new JsonRpcProvider(GLOBAL_RPC);
        const internalWallet = new ethers.Wallet(userData.privateKey, provider);
        
        const feeData = await provider.getFeeData();
        const gasPrice = gasInfo ? ethers.parseUnits(gasInfo.standard.toString(), 'gwei') : (feeData.gasPrice || ethers.parseUnits('20', 'gwei'));
        const gasLimit = BigInt(21000);
        const totalFee = gasPrice * gasLimit;
        const valueToSend = ethers.parseEther(amount);
        const totalNeeded = valueToSend + totalFee;

        const currentBalance = await provider.getBalance(userData.walletAddress);
        
        if (currentBalance < totalNeeded) {
          throw new Error(`Saldo tidak cukup untuk biaya Gas (${ethers.formatEther(totalFee).slice(0,8)} ETH).`);
        }

        const tx = await internalWallet.sendTransaction({
          to: recipientAddress,
          value: valueToSend,
          gasLimit: gasLimit,
          gasPrice: gasPrice
        });
        
        toast({ title: "Transaksi Disiarkan", description: "Menunggu konfirmasi blok Mainnet..." });
        await tx.wait();

        await addDoc(collection(db, "users", user.uid, "transactions"), {
          date: new Date().toISOString(),
          description: `Kirim ETH ke ${recipientAddress.slice(0,6)}...`,
          category: "Crypto Transfer",
          cryptoAmount: numAmount,
          cryptoCurrency: "ETH",
          recipient: recipientAddress,
          type: "expense",
          status: "success",
          txHash: tx.hash,
          timestamp: serverTimestamp()
        });

        setTxHash(tx.hash);
        setStep('success');
        toast({ title: "Instruksi Berhasil", description: "Transaksi ETH telah berhasil disiarkan ke Mainnet." });
      } else {
        // Custodial withdrawal using our new server endpoint `/api/crypto/withdraw`
        const currentBal = userData.cryptoBalances?.[assetType] || 0;
        if (numAmount > currentBal) {
          throw new Error(`Saldo ${assetType} Anda tidak mencukupi.`);
        }

        const idToken = await user.getIdToken();
        const res = await fetch('/api/crypto/withdraw', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            asset: assetType,
            amount: numAmount,
            recipient: recipientAddress,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setTxHash(data.txHash);
        setStep('success');
        toast({ title: "Penarikan Berhasil", description: `${assetType} berhasil ditransfer secara on-chain.` });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Eksekusi", description: err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'success') return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-in zoom-in duration-500">
      <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <ShieldCheck className="w-12 h-12 text-green-600" />
      </div>
      <h2 className="text-3xl font-black italic uppercase text-foreground text-center tracking-tighter mb-2">PENGIRIMAN BERHASIL</h2>
      <p className="text-[10px] font-black text-muted-foreground uppercase mb-8 tracking-widest">Tervalidasi oleh Infrastruktur AliBank V3</p>
      
      <Card className="w-full max-w-sm liquid-glass rounded-[2.5rem] p-8 mb-8 text-center space-y-4 shadow-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Jumlah Yang Dikirim</p>
          <p className="text-3xl font-black text-foreground dark:text-primary italic">{amount} {assetType}</p>
        </div>
        <div className="pt-4 border-t border-primary/5 space-y-2">
          <p className="text-[8px] font-bold text-muted-foreground uppercase break-all">Alamat Tujuan: {recipientAddress}</p>
          {txHash && (
            <div className="p-2 rounded bg-muted/50 border border-border/40">
              <p className="text-[8px] font-bold text-muted-foreground uppercase">TRANSACTION HASH:</p>
              <p className="text-[8px] font-black text-slate-800 dark:text-primary break-all font-mono mt-1 select-all">{txHash}</p>
              <a 
                href={assetType === 'ALX' || assetType === 'USDT' ? `https://polygonscan.com/tx/${txHash}` : `https://etherscan.io/tx/${txHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-[8px] font-black text-blue-500 uppercase underline mt-2 block"
              >
                Lihat di Penjelajah Blok ↗
              </a>
            </div>
          )}
        </div>
      </Card>
      
      <Button className="w-full max-w-sm h-14 gold-gradient text-white font-black italic uppercase rounded-2xl shadow-xl" onClick={() => router.push('/crypto')}>
        Kembali ke Pusat Kripto
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <main className="container mx-auto px-4 max-w-lg pt-4">
        <header className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-amber-500 dark:hover:text-primary transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
              <Send className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground italic uppercase tracking-tighter">Transfer Kripto</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Hub Pengiriman Aset Mandiri.</p>
            </div>
          </div>
        </header>

        <Card className="liquid-glass rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pilih Jaringan & Aset</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'ETH', icon: Cpu, color: 'text-blue-500', network: 'Ethereum' },
                  { id: 'BTC', icon: Bitcoin, color: 'text-orange-500', network: 'Bitcoin' },
                  { id: 'USDT', icon: ShieldCheck, color: 'text-green-500', network: 'Polygon' },
                  { id: 'ALX', icon: Zap, color: 'text-yellow-500', network: 'Polygon' }
                ].map((asset) => (
                  <button 
                    key={asset.id}
                    onClick={() => setAssetType(asset.id as any)}
                    className={cn(
                      "p-3 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                      assetType === asset.id 
                        ? "border-primary bg-primary/10 text-amber-600 dark:text-primary" 
                        : "border-slate-200 dark:border-white/5 bg-transparent hover:bg-muted/50"
                    )}
                  >
                    <asset.icon className={cn("w-5 h-5", assetType === asset.id ? asset.color : "text-muted-foreground")} />
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase leading-none">{asset.id}</p>
                      <p className="text-[6px] font-bold text-muted-foreground uppercase mt-1">{asset.network}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SEND MODE SWITCHER (ONLY FOR ETH) */}
            {assetType === 'ETH' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Metode Pengiriman</label>
                <div className="flex bg-muted/60 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSendMode("custodial")}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase italic rounded-lg transition-all",
                      sendMode === "custodial" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Ali-Bridge / Vault (Instan)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode("self-custodial")}
                    className={cn(
                      "flex-1 py-2 text-[9px] font-black uppercase italic rounded-lg transition-all",
                      sendMode === "self-custodial" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Tanda Tangan Mandiri (Native)
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alamat Penerima Eksternal</label>
              <div className="relative">
                <Input 
                  placeholder={assetType === 'BTC' ? "Contoh: 1FSj... atau alamat BTC" : "Contoh: 0x... atau alamat wallet"} 
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="h-14 rounded-2xl liquid-glass font-bold text-xs" 
                />
                <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 dark:text-primary/40 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Jumlah Pengiriman ({assetType})</label>
              <div className="relative">
                <Input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="h-16 rounded-2xl liquid-glass font-black italic text-xl" 
                />
                <button 
                  onClick={handleMaxAmount}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-600 dark:text-primary uppercase bg-primary/15 dark:bg-primary/10 px-2 py-1 rounded-md"
                >
                  MAX
                </button>
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-[8px] font-bold text-muted-foreground uppercase">
                  Tersedia: {sendMode === 'self-custodial' ? parseFloat(onChainBal).toFixed(8) : (userData?.cryptoBalances?.[assetType] || 0)} {assetType}
                </p>
                <div className="flex items-center gap-1 text-[7px] font-black text-amber-600 dark:text-primary uppercase">
                  <Flame className={cn("w-2.5 h-2.5", gasInfo && "animate-pulse text-orange-500")} /> 
                  {sendMode === 'self-custodial' ? (gasInfo ? `Gas: ${gasInfo.standard.toFixed(1)} Gwei` : 'Auto Gas') : 'Biaya: Gratis'}
                </div>
              </div>
            </div>

            {sendMode === 'self-custodial' && !hasPrivateKey ? (
              <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4 animate-in fade-in zoom-in">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-[10px] font-bold text-destructive uppercase leading-relaxed italic">
                    DOMPET ANDA BELUM MEMILIKI TANDA TANGAN MANDIRI (NATIVE SIGNATURE). AKTIFKAN SEKARANG UNTUK EKSEKUSI RIIL.
                  </p>
                </div>
                <Button 
                  onClick={handleActivateSignature} 
                  disabled={isActivating}
                  className="w-full h-12 bg-destructive text-white rounded-xl font-black uppercase italic text-[10px]"
                >
                  {isActivating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />} 
                  AKTIFKAN SIGNATURE RESMI
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-3">
                {sendMode === 'self-custodial' ? <Lock className="w-5 h-5 text-blue-600 shrink-0" /> : <ArrowRightLeft className="w-5 h-5 text-blue-600 shrink-0" />}
                <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  {sendMode === 'self-custodial' 
                    ? "Informasi: Transaksi ETH akan langsung dikirimkan ke jaringan Mainnet secara instan menggunakan estimasi Gas dari Infura API."
                    : `Informasi: Transaksi ${assetType} akan dikirimkan secara on-chain dari Brankas Likuiditas AliBank ke alamat tujuan secara instan.`}
                </p>
              </div>
            )}

            <Button 
              onClick={handleSendNative}
              disabled={isProcessing || !amount || !recipientAddress || (sendMode === 'self-custodial' && !hasPrivateKey)}
              className="w-full h-16 gold-gradient text-white text-lg font-black italic uppercase rounded-[2rem] shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  {sendMode === 'self-custodial' ? 'KONFIRMASI & KIRIM' : 'KIRIM VIA ALI-BRIDGE'}
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
