"use client";

/**
 * ALIBANK MOBILE P2P RECEIVE — /m/receive
 * Premium mobile-first screen for receiving P2P transfers using QR and wallet address.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Copy, Share2, Check, QrCode, User, Wallet, Hash, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

export default function MobileReceivePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  if (!mounted) return null;

  const qrData = JSON.stringify({
    type: "alibank-p2p",
    name: userData?.name || user?.email || "Pengguna AliBank",
    accountNumber: userData?.accountNumber || "",
    walletAddress: userData?.walletAddress || "",
    email: user?.email || "",
  });

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Berhasil Disalin",
      description: `${fieldName} telah disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = async () => {
    const shareText = `Kirim dana ke akun AliBank saya:\nNama: ${userData?.name || "Pengguna AliBank"}\nNo. Rekening: ${userData?.accountNumber || "-"}\nWallet: ${userData?.walletAddress || "-"}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "AliBank Kirim/Terima",
          text: shareText,
        });
      } catch (err) {
        // Fallback copy if sharing fails or is cancelled
      }
    } else {
      handleCopy(shareText, "Informasi rekening");
    }
  };

  const qrImageUrl = userData?.walletAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=0e1117&bgcolor=ffffff`
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col font-body pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe border-b border-border/10">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black italic uppercase tracking-tight">Terima Transfer</h1>
        <button onClick={handleShare} className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
          <Share2 className="w-5 h-5 text-primary" />
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
        {/* QR Card Container */}
        <div className="w-full max-w-sm bg-muted/30 rounded-[2.5rem] p-8 border border-border/40 flex flex-col items-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 gold-gradient opacity-80" />

          {/* User Info Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary font-black text-xl flex items-center justify-center mx-auto mb-3 border border-primary/20">
              {(userData?.name || "U")[0].toUpperCase()}
            </div>
            <h2 className="text-lg font-black tracking-tight">{userData?.name || "Pengguna AliBank"}</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{user?.email}</p>
          </div>

          {/* QR Code Graphic */}
          <div className="relative mb-6">
            <div className="w-60 h-60 bg-white rounded-3xl p-5 shadow-lg border border-border flex items-center justify-center overflow-hidden">
              {qrImageUrl ? (
                <img
                  src={qrImageUrl}
                  alt="AliBank P2P QR Code"
                  className="w-full h-full object-contain animate-in zoom-in duration-300"
                  onError={(e) => {
                    // Fallback visual if QR server fails
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground text-center">
                  <QrCode className="w-16 h-16 mb-2 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase">Memuat QR Code...</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-md border-2 border-white">
              <LogoIcon className="text-white w-5 h-5" />
            </div>
          </div>

          {/* Safety Subtext */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase text-center max-w-[240px]">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span>Tunjukkan QR code ini ke pengirim sesama AliBank</span>
          </div>
        </div>

        {/* Copy Identifiers Section */}
        <div className="w-full max-w-sm space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">Atau salin informasi rekening:</p>

          {/* Account Number */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Hash className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Nomor Rekening</p>
                <p className="text-xs font-black tracking-wider">{userData?.accountNumber || "-"}</p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(userData?.accountNumber, "Nomor rekening")}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
            >
              {copiedField === "Nomor rekening" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Wallet Address */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Alamat Wallet (Ali-Chain / EVM)</p>
                <p className="text-xs font-black tracking-wider truncate font-mono">{userData?.walletAddress || "-"}</p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(userData?.walletAddress, "Alamat wallet")}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all shrink-0"
            >
              {copiedField === "Alamat wallet" ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Share Actions Footer */}
      <div className="p-4 space-y-3">
        <button
          onClick={handleShare}
          className="w-full h-14 rounded-2xl gold-gradient text-white font-black italic uppercase text-sm shadow-xl flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" /> Bagikan Info Rekening
        </button>
        <button
          onClick={() => router.push("/m/home")}
          className="w-full h-14 rounded-2xl bg-muted text-muted-foreground hover:text-foreground font-black uppercase text-sm"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
}
