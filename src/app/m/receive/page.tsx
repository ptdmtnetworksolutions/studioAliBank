"use client";

/**
 * ALIBANK MOBILE RECEIVE — /m/receive
 * Mobile-first screen untuk menerima aset kripto.
 * Fitur sinkron dengan /crypto/receive:
 * - Pilihan jaringan (BTC / ETH / ALX)
 * - QR Code auto-generate dari alamat wallet user
 * - Tombol Deposit ETH ke Vault On-Chain (VaultDepositModal)
 * - Salin alamat + Share
 * - Lapor pengiriman
 */

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Share2,
  Check,
  QrCode,
  Wallet,
  Hash,
  ShieldCheck,
  ChevronDown,
  Bitcoin,
  Cpu,
  Zap,
  CheckCircle2,
  ArrowDownToLine,
  Sparkles,
  Globe,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { VaultDepositModal } from "@/components/crypto/VaultDepositModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NETWORKS = [
  {
    id: "BTC",
    name: "Bitcoin",
    icon: Bitcoin,
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    network: "Native Network",
    confirmTime: "10-60m",
  },
  {
    id: "ETH",
    name: "Ethereum",
    icon: Cpu,
    color: "text-blue-500",
    bgColor: "bg-blue-600",
    network: "ERC-20 / EVM",
    confirmTime: "1-3m",
  },
  {
    id: "ALX",
    name: "Ali-Chain",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary",
    network: "Mainnet V3",
    confirmTime: "Instan",
  },
];

export default function MobileReceivePage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState(NETWORKS[0]);
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(
    () => (!db || !user ? null : doc(db, "users", user.uid)),
    [db, user]
  );
  const { data: userData } = useDoc(userDocRef);

  // Alamat berdasarkan jaringan yang dipilih
  const displayAddress = useMemo(() => {
    if (!userData) return "Sedang Menyiapkan Dompet...";
    if (selectedNetwork.id === "BTC")
      return userData.btcAddress || "Alamat BTC belum diaktifkan.";
    return userData.walletAddress || "Alamat EVM belum diaktifkan.";
  }, [userData, selectedNetwork]);

  // QR code URL — encode alamat wallet langsung (standar kripto)
  const qrImageUrl = useMemo(() => {
    if (
      !displayAddress ||
      displayAddress.includes("Sedang") ||
      displayAddress.includes("belum")
    )
      return null;
    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      displayAddress
    )}&size=280x280&margin=5&color=000000&bgcolor=ffffff&qzone=1`;
  }, [displayAddress]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text || text.includes("Sedang") || text.includes("belum")) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast({
      title: "Berhasil Disalin",
      description: `${fieldName} telah disalin ke clipboard.`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleShare = async () => {
    const shareText = `Kirim ${selectedNetwork.name} ke dompet AliBank saya:\nNama: ${
      userData?.name || "Pengguna AliBank"
    }\nAlamat: ${displayAddress}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "AliBank — Terima Aset", text: shareText });
      } catch (err) {
        handleCopy(shareText, "Informasi rekening");
      }
    } else {
      handleCopy(shareText, "Informasi rekening");
    }
  };

  if (!mounted) return null;

  const isAddressReady =
    displayAddress &&
    !displayAddress.includes("Sedang") &&
    !displayAddress.includes("belum");

  return (
    <div className="min-h-screen bg-background flex flex-col font-body pb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-safe border-b border-border/10 sticky top-0 bg-background z-40">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-black italic uppercase tracking-tight">
          Terima Aset
        </h1>
        <button
          onClick={handleShare}
          className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center"
        >
          <Share2 className="w-5 h-5 text-primary" />
        </button>
      </div>

      <div className="flex-1 px-5 pt-5 space-y-5">

        {/* Network Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full h-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-between px-5 hover:bg-muted/80 transition-all">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl bg-background flex items-center justify-center shadow-sm",
                    selectedNetwork.color
                  )}
                >
                  <selectedNetwork.icon className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black italic uppercase leading-none">
                    {selectedNetwork.name}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5">
                    {selectedNetwork.network}
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground/60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[calc(100vw-2.5rem)] bg-background border-border rounded-2xl p-2 shadow-2xl">
            {NETWORKS.map((net) => (
              <DropdownMenuItem
                key={net.id}
                onClick={() => setSelectedNetwork(net)}
                className="rounded-xl p-4 flex items-center justify-between cursor-pointer focus:bg-primary/5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl bg-muted flex items-center justify-center",
                      net.color
                    )}
                  >
                    <net.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase italic">
                      {net.name}
                    </p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">
                      {net.network} · {net.confirmTime}
                    </p>
                  </div>
                </div>
                {selectedNetwork.id === net.id && (
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* QR Card */}
        <div className="w-full bg-muted/30 rounded-[2rem] border border-border/40 flex flex-col items-center p-7 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 gold-gradient" />

          {/* User Info */}
          <div className="text-center mb-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-black text-lg flex items-center justify-center mx-auto mb-2 border border-primary/20">
              {(userData?.name || user?.email || "U")[0].toUpperCase()}
            </div>
            <h2 className="text-sm font-black tracking-tight">
              {userData?.name || "Pengguna AliBank"}
            </h2>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
              {user?.email}
            </p>
          </div>

          {/* QR Code */}
          <div className="relative mb-5">
            <div className="w-56 h-56 bg-white rounded-3xl p-4 shadow-lg border border-border flex items-center justify-center overflow-hidden">
              {qrImageUrl ? (
                <img
                  key={displayAddress}
                  src={qrImageUrl}
                  alt={`QR Code ${selectedNetwork.name}`}
                  className="w-full h-full object-contain animate-in zoom-in duration-300"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground text-center">
                  <QrCode className="w-14 h-14 mb-2 animate-pulse" />
                  <span className="text-[9px] font-bold uppercase">
                    {displayAddress.includes("Sedang")
                      ? "Memuat Alamat..."
                      : `Scan Alamat ${selectedNetwork.name}`}
                  </span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-3 -right-3 w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-md border-2 border-white">
              {selectedNetwork.id === "ALX" ? (
                <LogoIcon className="text-white w-4 h-4" />
              ) : (
                <selectedNetwork.icon className="text-white w-4 h-4" />
              )}
            </div>
          </div>

          {/* Safety */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground uppercase text-center max-w-[220px]">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span>
              Hanya kirim {selectedNetwork.name} via {selectedNetwork.network}
            </span>
          </div>
        </div>

        {/* Alamat Wallet */}
        <div className="space-y-3">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground px-1">
            Alamat Dompet ({selectedNetwork.id})
          </p>

          {/* Wallet Address Row */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">
                  {selectedNetwork.id === "BTC" ? "Bitcoin Address" : "EVM / Ali-Chain"}
                </p>
                <p className="text-[11px] font-black tracking-wider truncate font-mono">
                  {isAddressReady
                    ? `${displayAddress.slice(0, 10)}...${displayAddress.slice(-8)}`
                    : displayAddress}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleCopy(displayAddress, "Alamat wallet")}
              className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all shrink-0 ml-2"
            >
              {copiedField === "Alamat wallet" ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Full Address */}
          {isAddressReady && (
            <div
              className="px-4 py-3 rounded-2xl bg-accent/5 border border-primary/10 cursor-pointer"
              onClick={() => handleCopy(displayAddress, "Alamat lengkap")}
            >
              <p className="text-[10px] font-black text-accent break-all text-center leading-relaxed font-mono">
                {displayAddress}
              </p>
              <p className="text-[8px] font-bold text-muted-foreground uppercase text-center mt-2">
                Ketuk untuk salin alamat lengkap
              </p>
            </div>
          )}
        </div>

        {/* Deposit On-Chain — Khusus ETH */}
        {selectedNetwork.id === "ETH" && (
          <div className="relative p-5 rounded-[1.5rem] bg-gradient-to-br from-blue-950/80 to-indigo-950/80 border border-blue-500/20 overflow-hidden animate-in slide-in-from-bottom-4 duration-400">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg">
                  <ArrowDownToLine className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black italic uppercase text-white">
                      Deposit ke Vault
                    </p>
                    <span className="text-[7px] font-black bg-primary/20 text-primary border border-primary/30 px-2 py-0.5 rounded-full uppercase">
                      On-Chain
                    </span>
                  </div>
                  <p className="text-[9px] font-bold text-white/40 uppercase mt-0.5">
                    Langsung ke Smart Contract AliBank
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: ShieldCheck, text: "Non-Custodial" },
                  { icon: Globe, text: "Mainnet ETH" },
                ].map(({ icon: Icon, text }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5"
                  >
                    <Icon className="w-3 h-3 text-blue-400" />
                    <span className="text-[9px] font-black text-white/50 uppercase">
                      {text}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowDepositModal(true)}
                className="w-full h-12 rounded-xl gold-gradient text-white font-black uppercase italic text-[10px] tracking-widest shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                DEPOSIT ETH KE VAULT ON-CHAIN
              </button>
            </div>
          </div>
        )}

        {/* Lapor Pengiriman */}
        <button
          onClick={() =>
            router.push(`/crypto/confirm-deposit?asset=${selectedNetwork.id}`)
          }
          className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border hover:bg-muted/70 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <FileSearch className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black italic uppercase text-foreground">
              Sudah Kirim Aset?
            </p>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">
              Lapor pengiriman agar saldo segera diproses
            </p>
          </div>
        </button>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full h-14 rounded-2xl gold-gradient text-white font-black italic uppercase text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
        >
          <Share2 className="w-4 h-4" /> Bagikan Info Rekening
        </button>

        {/* Info */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-4">
          <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
            Pastikan hanya mengirim{" "}
            <span className="text-foreground">{selectedNetwork.name}</span> via
            jaringan{" "}
            <span className="text-foreground">{selectedNetwork.network}</span>.
            Pengiriman ke jaringan yang salah akan mengakibatkan kehilangan aset
            permanen.
          </p>
        </div>
      </div>

      {/* Vault Deposit Modal */}
      <VaultDepositModal
        open={showDepositModal}
        onClose={() => setShowDepositModal(false)}
      />
    </div>
  );
}
