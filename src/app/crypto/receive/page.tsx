
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ArrowLeft, 
  Download, 
  Copy, 
  ShieldCheck, 
  Globe, 
  QrCode as QrIcon,
  Info,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";

export default function CryptoReceivePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const walletAddress = userData?.walletAddress || "Sedang Menyiapkan Dompet...";

  const copyAddress = () => {
    if (!userData?.walletAddress) return;
    navigator.clipboard.writeText(userData.walletAddress);
    toast({ title: "Alamat Disalin", description: "Alamat dompet AliBank Anda telah disalin." });
  };

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
              <Download className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter">Terima Aset</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">AliBank Native Wallet Address.</p>
            </div>
          </div>
        </header>

        <Card className="liquid-glass border-none rounded-[2.5rem] p-10 flex flex-col items-center space-y-8 shadow-2xl">
          <div className="relative">
            <div className="w-64 h-64 bg-white rounded-3xl p-6 shadow-inner border-4 border-primary/10 flex items-center justify-center overflow-hidden">
              {/* QR CODE PLACEHOLDER - Representing the native wallet address */}
              <div className="w-full h-full bg-slate-50 rounded-xl flex flex-col items-center justify-center text-primary/40 p-4 text-center">
                <QrIcon className="w-24 h-24 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-tight">
                  Scan Alamat AliBank V3
                </span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-12 h-12 rounded-2xl gold-gradient flex items-center justify-center shadow-xl border-4 border-white">
              <LogoIcon className="text-white w-6 h-6" />
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Alamat Dompet Mandiri</label>
                <Lock className="w-3 h-3 text-primary" />
              </div>
              <div className="p-5 rounded-2xl bg-accent/5 border border-primary/10 relative group">
                <p className="text-[11px] font-black text-accent break-all text-center leading-relaxed">
                  {walletAddress}
                </p>
                <Button 
                  onClick={copyAddress}
                  className="w-full mt-4 h-12 bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl font-black uppercase italic text-[10px]"
                >
                  <Copy className="w-4 h-4 mr-2" /> Salin Alamat
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Badge variant="outline" className="h-10 justify-center font-black text-[8px] uppercase tracking-widest border-primary/20 text-accent">
                <Globe className="w-3 h-3 mr-2 text-primary" /> Multi-Chain Node
              </Badge>
              <Badge variant="outline" className="h-10 justify-center font-black text-[8px] uppercase tracking-widest border-primary/20 text-accent">
                <ShieldCheck className="w-3 h-3 mr-2 text-primary" /> Non-Custodial
              </Badge>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
            <Info className="w-6 h-6 text-blue-600 shrink-0" />
            <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              Ini adalah dompet mandiri AliBank Anda. Anda dapat menerima ETH dan token ERC-20 lainnya langsung ke alamat ini dari dompet eksternal mana pun (MetaMask, Binance, Indodax).
            </p>
          </div>
        </Card>

        <footer className="mt-12 text-center">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">Official AliBank Native Wallet System 2026</p>
        </footer>
      </main>
    </div>
  );
}
