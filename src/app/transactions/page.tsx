"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Search, 
  Settings, 
  Eye, 
  EyeOff,
  ChevronDown, 
  ChevronRight, 
  History, 
  BarChart3,
  Loader2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useMemo, useEffect } from "react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useVaultBalance } from "@/hooks/useVaultBalance";

// Definisi aset yang didukung — sesuaikan dengan field cryptoBalances di Firestore
const ASSET_CONFIG: Record<string, {
  name: string;
  color: string;
  bgColor: string;
  decimals: number;
  icon: React.ReactNode;
}> = {
  USDT: {
    name: "TetherUS",
    color: "text-teal-500",
    bgColor: "bg-teal-500",
    decimals: 4,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#26A17B"/>
        <path d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.008 0-1.724-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V8H8.595v3.427h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.122 0 1.047 3.309 1.919 7.709 2.12v7.596h3.913v-7.6c4.393-.202 7.694-1.073 7.694-2.12 0-1.047-3.301-1.917-7.694-2.12" fill="white"/>
      </svg>
    )
  },
  BTC: {
    name: "Bitcoin",
    color: "text-orange-500",
    bgColor: "bg-orange-500",
    decimals: 8,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#F7931A"/>
        <path d="M22.504 13.674c.322-2.151-1.317-3.308-3.558-4.079l.727-2.914-1.774-.442-.708 2.838c-.467-.116-.947-.225-1.424-.334l.712-2.854-1.773-.442-.727 2.913c-.386-.088-.766-.175-1.135-.267l.002-.009-2.447-.611-.472 1.895s1.317.302 1.289.32c.719.179.849.654.827 1.032l-.828 3.319c.049.013.113.031.183.059l-.186-.046-1.161 4.653c-.088.218-.311.546-.814.421.018.026-1.29-.322-1.29-.322l-.882 2.03 2.309.576c.429.108.85.22 1.266.326l-.734 2.945 1.772.442.727-2.916c.485.131.956.253 1.416.368l-.724 2.9 1.773.442.734-2.94c3.024.572 5.298.341 6.254-2.394.771-2.202-.038-3.471-1.629-4.3 1.158-.267 2.031-1.03 2.263-2.604zm-4.048 5.674c-.548 2.202-4.255 1.012-5.459.714l.974-3.904c1.204.3 5.065.895 4.485 3.19zm.548-5.707c-.499 2.002-3.587.985-4.591.736l.883-3.538c1.004.25 4.231.715 3.708 2.802z" fill="white"/>
      </svg>
    )
  },
  ETH: {
    name: "Ethereum",
    color: "text-blue-500",
    bgColor: "bg-blue-600",
    decimals: 8,
    icon: (
      <svg viewBox="0 0 32 32" fill="white" className="w-5 h-5">
        <circle cx="16" cy="16" r="16" fill="#627EEA"/>
        <path d="M16.498 4v8.87l7.497 3.35z" fillOpacity=".602"/>
        <path d="M16.498 4L9 16.22l7.498-3.35z"/>
        <path d="M16.498 21.968v6.027L24 17.616z" fillOpacity=".602"/>
        <path d="M16.498 27.995v-6.028L9 17.616z"/>
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fillOpacity=".2"/>
        <path d="M9 16.22l7.498 4.353v-7.701z" fillOpacity=".602"/>
      </svg>
    )
  },
  ALX: {
    name: "Alix Coin",
    color: "text-primary",
    bgColor: "bg-primary",
    decimals: 6,
    icon: <LogoIcon className="text-white w-5 h-5" />
  }
};

// Harga pasar estimasi untuk kalkulasi nilai IDR
const PRICE_IDR: Record<string, number> = {
  BTC: 1_600_000_000,
  ETH: 55_000_000,
  USDT: 16_500,
  ALX: 12_240_000,
};

export default function AssetsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [activeTopTab, setActiveTopTab] = useState('Ringkasan');
  const [activeSubTab, setActiveSubTab] = useState('Kripto');
  const [showBalance, setShowBalance] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData, isLoading: userLoading } = useDoc(userDocRef);

  // Ambil dompet terhubung (prioritaskan external MetaMask daripada internal wallet)
  const activeWalletAddress = useMemo(() => {
    if (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized') {
      return userData.externalWalletAddress;
    }
    return userData?.walletAddress || null;
  }, [userData]);

  // Load saldo on-chain dari smart contract AliBankVault
  const { onChainBalance: vaultBalanceEth } = useVaultBalance(activeWalletAddress);

  // Otomatis sinkronkan deposit on-chain dari external wallet
  useEffect(() => {
    if (!user?.uid || !activeWalletAddress || activeWalletAddress === '0xNoWalletInitialized') return;
    
    const syncDeposits = async () => {
      try {
        await fetch(`/api/crypto/sync-deposits?userId=${user.uid}`);
      } catch (e) {
        console.warn('Gagal sinkronisasi setoran otomatis:', e);
      }
    };

    syncDeposits();
  }, [user?.uid, activeWalletAddress]);

  // Bangun daftar aset dari data Firestore user yang nyata
  const portfolioAssets = useMemo(() => {
    if (!userData) return [];
    const cryptoBalances = userData.cryptoBalances || {};
    
    return Object.entries(ASSET_CONFIG)
      .map(([symbol, config]) => {
        const amount = cryptoBalances[symbol] ?? 0;
        const priceIdr = PRICE_IDR[symbol] ?? 0;
        const valueIdr = amount * priceIdr;
        return { symbol, ...config, amount, valueIdr };
      })
      .filter(a => a.amount > 0) // Hanya tampilkan yang punya saldo
      .sort((a, b) => b.valueIdr - a.valueIdr); // Urut berdasarkan nilai terbesar
  }, [userData]);

  // Total nilai portofolio kripto custodial dalam IDR
  const totalCryptoValueIdr = useMemo(() => 
    portfolioAssets.reduce((sum, a) => sum + a.valueIdr, 0),
  [portfolioAssets]);

  // Nilai tabungan vault on-chain dalam IDR
  const vaultValueIdr = useMemo(() => 
    (vaultBalanceEth ?? 0) * (PRICE_IDR.ETH ?? 0),
  [vaultBalanceEth]);

  // Total saldo IDR fiat
  const totalIdrBalance = userData?.totalBalance ?? 0;

  // Grand total (IDR + Kripto Custodial + DeFi Vault On-Chain)
  const grandTotal = totalIdrBalance + totalCryptoValueIdr + vaultValueIdr;

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Memuat Portofolio...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background transition-colors duration-300">
      {/* Top Header Tabs */}
      <header className="px-4 h-12 flex items-center border-b border-border sticky top-0 bg-background z-50">
        <div className="flex items-center gap-5 overflow-x-auto no-scrollbar w-full">
          {['Ringkasan', 'Pendanaan', 'Earn', 'Spot'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTopTab(tab)}
              className={cn(
                "text-sm font-black transition-all relative shrink-0",
                activeTopTab === tab 
                  ? "text-foreground after:absolute after:-bottom-[13px] after:left-0 after:right-0 after:h-[2.5px] after:bg-primary" 
                  : "text-muted-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 pt-6 space-y-8 animate-in fade-in duration-500">
        {/* Total Nilai Section */}
        <div className="space-y-4 px-1">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-[11px] font-bold">Estimasi Total Nilai</span>
                <button onClick={() => setShowBalance(!showBalance)}>
                  {showBalance 
                    ? <Eye className="w-3.5 h-3.5 transition-colors" />
                    : <EyeOff className="w-3.5 h-3.5 text-primary" />
                  }
                </button>
              </div>
              <div className="flex items-end gap-2">
                <h1 className="text-4xl font-black tracking-tight italic">
                  {showBalance 
                    ? `Rp${grandTotal.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                    : '••••••••'}
                </h1>
                <div className="flex items-center gap-1 cursor-pointer pb-1">
                  <span className="text-[13px] font-black italic text-muted-foreground uppercase">IDR</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Wallet className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground">
                    IDR: {showBalance ? `Rp${totalIdrBalance.toLocaleString('id-ID')}` : '••••••'}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    Kripto: {showBalance ? `Rp${(totalCryptoValueIdr + vaultValueIdr).toLocaleString('id-ID', { maximumFractionDigits: 0 })}` : '••••••'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-foreground pt-1">
              <BarChart3 className="w-5 h-5 cursor-pointer hover:text-primary transition-colors opacity-80" />
              <History 
                className="w-5 h-5 cursor-pointer hover:text-primary transition-colors opacity-80"
                onClick={() => router.push('/transactions/history')}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none"
              onClick={() => router.push('/?open=add_funds')}
            >
              Top-Up
            </Button>
            <Button 
              className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none"
              onClick={() => router.push('/crypto/send')}
            >
              KIRIM
            </Button>
            <Button 
              className="bg-muted/80 hover:bg-muted text-foreground font-black italic text-[11px] h-10 rounded-xl uppercase tracking-tighter shadow-none"
              onClick={() => router.push('/transfer')}
            >
              TRANSFER
            </Button>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b border-border/50 px-1">
            <div className="flex gap-8">
              {['Kripto', 'IDR Fiat'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    "pb-3 text-sm font-black transition-all relative italic",
                    activeSubTab === tab 
                      ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2.5px] after:bg-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-5 text-muted-foreground pb-2 opacity-60">
              <Search className="w-5 h-5 cursor-pointer" />
              <Settings className="w-5 h-5 cursor-pointer" />
            </div>
          </div>

          {/* === TAB: KRIPTO === */}
          {activeSubTab === 'Kripto' && (
            <div className="space-y-8 pb-10 animate-in fade-in duration-300">
              {/* DeFi Vault Card */}
              {userData?.walletAddress && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 text-white">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5"></path>
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black italic tracking-tight">DeFi Vault Tabungan</h3>
                          <Badge className="bg-primary/20 text-primary text-[7px] font-black uppercase h-3.5 px-1 border-none leading-none">On-Chain</Badge>
                        </div>
                        <p className="text-[9px] font-mono text-muted-foreground tracking-tighter mt-0.5">
                          Alamat: {userData.walletAddress.substring(0, 6)}...{userData.walletAddress.substring(userData.walletAddress.length - 4)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black italic tracking-tight text-primary">
                        {showBalance 
                          ? `${vaultBalanceEth.toFixed(6).replace(/\.?0+$/, "")} ETH` 
                          : '••••••'}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-70">
                        {showBalance 
                          ? `≈ Rp${vaultValueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                          : '••••••'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                    <Button 
                      variant="outline" 
                      className="h-8 bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl font-black uppercase text-[9px] italic shadow-none"
                      onClick={() => router.push('/crypto/receive?asset=ETH')}
                    >
                      Tabung (Deposit)
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-8 bg-muted hover:bg-muted/80 text-foreground border-none rounded-xl font-black uppercase text-[9px] italic shadow-none"
                      onClick={() => router.push('/crypto/receive?asset=ETH')}
                    >
                      Kelola Vault
                    </Button>
                  </div>
                </div>
              )}

              {portfolioAssets.length === 0 && !userData?.walletAddress ? (
                <div className="py-16 flex flex-col items-center text-center opacity-50">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Wallet className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-black italic uppercase tracking-wide">Belum Ada Aset Kripto</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Beli atau terima kripto untuk memulai</p>
                  <Button 
                    className="mt-4 h-9 px-6 gold-gradient text-white border-none rounded-xl font-black uppercase text-[10px] italic tracking-widest"
                    onClick={() => router.push('/crypto/buy')}
                  >
                    Beli Sekarang
                  </Button>
                </div>
              ) : (
                portfolioAssets.length === 0 && userData?.walletAddress ? null :
                portfolioAssets.map((asset) => (
                  <div 
                    key={asset.symbol} 
                    className="space-y-3 px-1 group cursor-pointer"
                    onClick={() => router.push(`/crypto/market/${asset.symbol.toLowerCase()}`)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0", asset.bgColor)}>
                          {asset.icon}
                        </div>
                        <div>
                          <h3 className="text-sm font-black italic tracking-tight">{asset.symbol}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground leading-none">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black italic tracking-tight">
                          {showBalance 
                            ? asset.amount.toFixed(asset.decimals) 
                            : '••••••'}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5 opacity-70">
                          {showBalance 
                            ? `≈ Rp${asset.valueIdr.toLocaleString('id-ID', { maximumFractionDigits: 0 })}` 
                            : '••••••'}
                        </p>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex gap-2 pl-12 pt-0.5">
                      <Button 
                        variant="outline" 
                        className="h-7 px-4 bg-muted/40 border-none text-[9px] font-black italic rounded-md shadow-none uppercase"
                        onClick={(e) => { e.stopPropagation(); router.push('/crypto/receive'); }}
                      >
                        Terima
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-7 px-4 bg-muted/40 border-none text-[9px] font-black italic rounded-md shadow-none uppercase"
                        onClick={(e) => { e.stopPropagation(); router.push('/crypto/send'); }}
                      >
                        Kirim
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-7 px-4 bg-muted/40 border-none text-[9px] font-black italic rounded-md shadow-none uppercase"
                        onClick={(e) => { e.stopPropagation(); router.push(`/crypto/trade/${asset.symbol.toLowerCase()}`); }}
                      >
                        Dagang
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Tambah Aset */}
              <button 
                onClick={() => router.push('/crypto/buy')}
                className="w-full flex items-center gap-3 px-1 py-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center group-hover:border-primary transition-colors">
                  <span className="text-xl font-black text-muted-foreground group-hover:text-primary">+</span>
                </div>
                <span className="text-[11px] font-black text-muted-foreground uppercase italic group-hover:text-foreground transition-colors">
                  Beli / Terima Aset Kripto
                </span>
              </button>
            </div>
          )}

          {/* === TAB: IDR FIAT === */}
          {activeSubTab === 'IDR Fiat' && (
            <div className="space-y-6 pb-10 animate-in fade-in duration-300">
              {/* Saldo IDR */}
              <div className="p-5 rounded-2xl bg-muted/30 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center shadow-sm">
                      <LogoIcon className="text-white w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black italic">IDR</h3>
                      <p className="text-[10px] font-bold text-muted-foreground">Rupiah Indonesia</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black italic">
                      {showBalance ? `Rp${totalIdrBalance.toLocaleString('id-ID')}` : '••••••••'}
                    </p>
                    <Badge className="mt-1 bg-green-500/10 text-green-600 border-none text-[8px] font-black uppercase h-4 px-2">
                      Terverifikasi
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button 
                    className="h-9 bg-primary text-white border-none rounded-xl font-black uppercase text-[10px] italic shadow-none"
                    onClick={() => router.push('/?open=add_funds')}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 mr-1.5" /> Top-Up
                  </Button>
                  <Button 
                    className="h-9 bg-muted/80 text-foreground border-none rounded-xl font-black uppercase text-[10px] italic shadow-none"
                    onClick={() => router.push('/withdraw')}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" /> Tarik
                  </Button>
                </div>
              </div>

              {/* Lihat Riwayat Lengkap */}
              <button
                onClick={() => router.push('/transactions/history')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[11px] font-black uppercase italic text-muted-foreground group-hover:text-foreground">Lihat Riwayat Transaksi</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
