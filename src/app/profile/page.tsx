"use client";

import { useRouter } from "next/navigation";
import {
  X,
  Maximize,
  Headset,
  Settings,
  Share2,
  Copy,
  ChevronRight,
  User,
  Zap,
  ShieldAlert,
  LogOut,
  Crown,
  Star,
  Loader2,
  Link2,
  Unlink,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  Users,
  Ticket,
  ArrowRightLeft,
  CalendarDays,
  Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useUser, useDoc, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, getFirestore, getDoc } from "firebase/firestore";
import { getApps, getApp, initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { useMemo, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import Image from "next/image";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { ethers } from "ethers";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

const COIN_NAMES: Record<string, string> = {
  "ALX": "Alix Coin",
  "BTC": "Bitcoin",
  "ETH": "Ethereum",
  "BNB": "Binance Coin",
  "SOL": "Solana",
  "XRP": "Ripple",
  "ADA": "Cardano",
  "DOGE": "Dogecoin",
  "TRX": "TRON",
  "DOT": "Polkadot",
  "LINK": "Chainlink",
  "MATIC": "Polygon",
  "LTC": "Litecoin",
  "SHIB": "Shiba Inu",
  "AVAX": "Avalanche",
  "UNI": "Uniswap",
  "ATOM": "Cosmos",
  "XLM": "Stellar",
  "XMR": "Monero",
  "NEAR": "Near Protocol",
  "ARB": "Arbitrum",
  "USDT": "Tether USD",
  "IDR": "Rupiah",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // MetaMask SDK Integration
  const { account, connect, disconnect, isConnecting } = useMetaMask();

  useEffect(() => {
    setMounted(true);
    document.title = "Profil Saya - AliBank V3";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Alamat dompet terhubung yang aktif (dari MetaMask session atau Firestore link)
  const activeAddress = useMemo(() => {
    if (account) return account;
    if (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized') {
      return userData.externalWalletAddress;
    }
    return null;
  }, [account, userData]);

  // Web3 On-Chain Balances
  const { onChainBalance: vaultBalanceEth, isLoading: isVaultLoading } = useVaultBalance(activeAddress);
  const [externalAlxBalance, setExternalAlxBalance] = useState<number>(0);
  const [isAlxLoading, setIsAlxLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!activeAddress) {
      setExternalAlxBalance(0);
      return;
    }

    let active = true;
    const fetchAlxBalance = async () => {
      setIsAlxLoading(true);
      
      let dynamicRpc = "";
      let infuraId = "";
      let dynamicAddress = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";

      try {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const db = getFirestore(app);
        const keySnap = await getDoc(doc(db, "system", "public_keys"));
        if (keySnap.exists()) {
          const data = keySnap.data();
          if (data.polygonRpcUrl) dynamicRpc = data.polygonRpcUrl;
          if (data.infuraProjectId) infuraId = data.infuraProjectId;
          if (data.alxContractAddress) dynamicAddress = data.alxContractAddress;
        }
      } catch (e) {
        console.warn("Firestore RPC fetch failed, using fallbacks.");
      }

      const FALLBACK_POLY_RPCS = [
        "https://rpc.ankr.com/polygon",
        "https://polygon-bor-rpc.publicnode.com",
        "https://1rpc.io/matic",
        "https://polygon-rpc.com"
      ];

      const rpcsToTry = [];
      if (infuraId) {
        rpcsToTry.push(`https://polygon-mainnet.infura.io/v3/${infuraId}`);
      }
      if (dynamicRpc) rpcsToTry.push(dynamicRpc);
      rpcsToTry.push(...FALLBACK_POLY_RPCS);

      let success = false;
      for (const rpcUrl of rpcsToTry) {
        if (!active) break;
        try {
          const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
            staticNetwork: ethers.Network.from(137)
          });
          const contract = new ethers.Contract(dynamicAddress, [
            "function balanceOf(address owner) view returns (uint256)"
          ], provider);
          const balanceWei = await contract.balanceOf(activeAddress);
          const balanceEth = parseFloat(ethers.formatEther(balanceWei));
          if (active) {
            setExternalAlxBalance(balanceEth);
            success = true;
            break;
          }
        } catch (e: any) {
          console.warn(`Gagal membaca saldo ALX dari RPC ${rpcUrl}:`, e.message || e);
        }
      }

      if (active) {
        setIsAlxLoading(false);
      }
    };

    fetchAlxBalance();
    const interval = setInterval(fetchAlxBalance, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [activeAddress]);

  const isAdmin = useMemo(() => {
    return user && (user.email === OWNER_EMAIL || user.uid === OWNER_UID);
  }, [user]);

  const tierInfo = useMemo(() => {
    const alxBalance = userData?.cryptoBalances?.ALX || 0;
    if (alxBalance >= 10000) return { name: "Platinum VIP", color: "text-primary", bg: "bg-primary/10", icon: Crown, discount: "Zero Fee" };
    if (alxBalance >= 1000) return { name: "Gold Member", color: "text-amber-500", bg: "bg-amber-500/10", icon: Star, discount: "15% Discount" };
    return { name: "Regular", color: "text-muted-foreground", bg: "bg-muted", icon: User, discount: "No Discount" };
  }, [userData]);

  const copyUid = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "UID Disalin", description: "Nomor ID nasabah telah disalin." });
    }
  };

  const handleLinkMetaMask = async () => {
    try {
      const address = await connect();
      if (address && userDocRef) {
        await updateDoc(userDocRef, {
          externalWalletAddress: address,
          lastWalletSync: new Date().toISOString()
        });
        toast({ title: "MetaMask Tertaut", description: "Alamat dompet riil Anda telah disinkronkan." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Koneksi Gagal" });
    }
  };

  const handleDisconnectWallet = async () => {
    try {
      await disconnect();
      if (userDocRef) {
        await updateDoc(userDocRef, {
          externalWalletAddress: "0xNoWalletInitialized",
          lastWalletSync: null
        });
        toast({ title: "Tautan Dompet Dihapus", description: "MetaMask berhasil diputuskan." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Gagal Memutuskan Dompet" });
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
      toast({ title: "Berhasil Keluar", description: "Anda telah keluar dari akun AliBank." });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Gagal Keluar", description: "Terjadi kesalahan saat mencoba keluar." });
    }
  };

  if (!mounted) return null;

  // MOBILE VIEW LAYOUT
  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground pb-20 flex flex-col font-body transition-colors duration-300">
        <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex items-center gap-4">
            <Maximize className="w-5 h-5 text-foreground cursor-pointer" />
            <Headset className="w-5 h-5 text-foreground cursor-pointer" />
            <Settings
              className="w-5 h-5 text-foreground cursor-pointer hover:text-primary transition-colors"
              onClick={() => router.push('/settings')}
            />
          </div>
        </header>

        <main className="flex-1 px-5 pt-2 space-y-8 overflow-y-auto no-scrollbar pb-10">
          <section className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-border relative shadow-xl">
                {userData?.avatarUrl ? (
                  <Image src={userData.avatarUrl} alt="Avatar" width={80} height={80} className="object-cover w-full h-full" />
                ) : (
                  <>
                    <div className="absolute inset-0 bg-yellow-400 rounded-full scale-90" />
                    <User className="w-12 h-12 text-slate-100 dark:text-slate-900 relative z-10 mt-2" />
                  </>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight">{userData?.name || "Nasabah AliBank"}</h1>
                  <Share2 className="w-4 h-4 text-muted-foreground/60 cursor-pointer" />
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground" onClick={copyUid}>
                  <span className="text-[11px] font-bold">UID: {userData?.accountNumber || "--- --- ---"}</span>
                  <Copy className="w-3 h-3 cursor-pointer active:scale-90 transition-transform" />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge className={cn(
                    "text-[10px] font-black h-5 border-none px-2 rounded-md italic",
                    userData?.kycStatus === 'verified' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {userData?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
                  </Badge>
                  <div
                    className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md cursor-pointer hover:opacity-80 transition-opacity", tierInfo.bg)}
                    onClick={() => router.push('/crypto/market/alx')}
                  >
                    <tierInfo.icon className={cn("w-3 h-3", tierInfo.color)} />
                    <span className={cn("text-[10px] font-black uppercase italic", tierInfo.color)}>{tierInfo.name}</span>
                    <ChevronRight className={cn("w-3 h-3", tierInfo.color)} />
                  </div>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground/40 mt-6" onClick={() => router.push('/settings')} />
          </section>

          {/* METAMASK SDK SECTION */}
          <section className="animate-in slide-in-from-top-4 duration-500">
            <Card className="liquid-glass border-primary/20 p-6 rounded-[2.5rem] shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <LogoIcon className="w-24 h-24" />
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black italic uppercase text-foreground">MetaMask Native Bridge</h3>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Otentikasi Dompet Web3 Riil</p>
                  </div>
                  {activeAddress ? (
                    <Badge className="bg-green-600 text-white font-black text-[8px] uppercase px-3 h-6 border-none animate-pulse">Connected</Badge>
                  ) : (
                    <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] uppercase px-3 h-6">Not Linked</Badge>
                  )}
                </div>

                {activeAddress ? (
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                        <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/app/images/logo/metamask-fox.svg" className="w-full h-full" alt="fox" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-accent truncate">{activeAddress}</span>
                    </div>
                    <button onClick={handleDisconnectWallet} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors">
                      <Unlink className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <Button
                    onClick={handleLinkMetaMask}
                    disabled={isConnecting}
                    className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-lg group"
                  >
                    {isConnecting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                      <span className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 group-hover:rotate-45 transition-transform" /> TAUTKAN METAMASK SDK
                      </span>
                    )}
                  </Button>
                )}
                {(activeAddress || (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized')) && (
                  <div className="space-y-3 p-4 rounded-2xl bg-muted/40 border border-border">
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground italic mb-1">Live Web3 Portfolio</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground">AliBank Vault (Ethereum)</span>
                      <span className="text-[11px] font-black text-amber-500 italic">
                        {isVaultLoading ? "..." : `${vaultBalanceEth.toFixed(4)} ETH`}
                      </span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-foreground">Dompet ALX (Polygon)</span>
                      <span className="text-[11px] font-black text-primary italic">
                        {isAlxLoading ? "..." : `${externalAlxBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ALX`}
                      </span>
                    </div>
                  </div>
                )}
                <p className="text-[8px] font-medium text-muted-foreground leading-relaxed italic text-center px-4 uppercase">
                  Hubungkan dompet eksternal Anda untuk penarikan dana otomatis dan tanda tangan transaksi on-chain yang lebih aman melalui node Infura AliBank.
                </p>
              </div>
            </Card>
          </section>

          {isAdmin && (
            <section className="animate-in fade-in zoom-in duration-500">
              <Button
                onClick={() => router.push('/admin')}
                className="w-full h-16 gold-gradient text-white rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Security Protocol</p>
                    <p className="text-sm font-black uppercase italic tracking-tight">Access Command Center</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </Button>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Disarankan</h2>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
            </div>

            <div className="grid grid-cols-4 gap-y-8">
              {[
                { name: "P2P", icon: Users, color: "text-yellow-500", href: "/p2p/order-history" },
                { name: "Alpha", icon: Smile, color: "text-yellow-500", isAlpha: true, href: "/alpha" },
                { name: "Hub Reward", icon: Ticket, color: "text-white", href: "#" },
                { name: "Konversi", icon: Maximize, color: "text-yellow-500", rotate: 45, href: "/crypto/convert" },
                { name: "WOTD", icon: LayoutGrid, color: "text-yellow-500", href: "#" },
                { name: "Margin", icon: ArrowRightLeft, color: "text-white", rotate: -45, href: "/crypto/trade/futures" },
                { name: "Acara Alpha", icon: CalendarDays, color: "text-yellow-500", hasBadge: true, href: "/alpha" },
                { name: "Lainnya", icon: LayoutGrid, color: "text-white", href: "/marketplace" },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-transform" onClick={() => item.href !== "#" && router.push(item.href)}>
                  <div className="relative">
                    {item.isAlpha ? (
                      <div className="w-6 h-6 rounded-full border-2 border-yellow-500 flex items-center justify-center p-0.5">
                        <div className="w-full h-full rounded-full bg-yellow-500 flex items-center justify-center text-background font-black text-[10px]">α</div>
                      </div>
                    ) : item.hasBadge ? (
                      <div className="relative">
                        <item.icon className={cn("w-6 h-6", item.color)} />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded flex items-center justify-center text-[6px] font-black text-background">α</div>
                      </div>
                    ) : (
                      <item.icon className={cn("w-6 h-6", item.color)} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-foreground text-center leading-tight">{item.name}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-6 space-y-4">
            <button className="w-full bg-muted/20 hover:bg-muted/40 transition-all rounded-2xl p-5 flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center p-1.5 shadow-sm">
                  <LogoIcon className="text-foreground" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black tracking-tighter italic uppercase">AliBank</span>
                  <span className="text-xs font-black text-yellow-500 italic">Lite</span>
                </div>
              </div>
              <div className="w-10 h-10 bg-muted/40 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Smile className="w-6 h-6" />
              </div>
            </button>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest gap-3 shadow-lg"
            >
              <LogOut className="w-5 h-5" /> KELUAR DARI APLIKASI
            </Button>
          </footer>
        </main>
      </div>
    );
  }

  // DESKTOP VIEW LAYOUT (PREMIUM SIDEBAR + PANEL GRID)
  return (
    <div className="min-h-screen bg-background text-foreground flex font-body selection:bg-primary/30">

      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-foreground uppercase italic tracking-tight">Akun Nasabah</h2>
          </div>
          <div className="flex items-center gap-6">
            <Settings
              className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              onClick={() => router.push('/settings')}
            />
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden border border-border">
              {userData?.avatarUrl ? (
                <img src={userData.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-black italic text-[10px] uppercase">
                  {userData?.name?.[0] || 'U'}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1200px] w-full mx-auto">

          {/* USER BIO & DETAILS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* PROFILE BIO CARD */}
            <Card className="md:col-span-2 rounded-[2.5rem] bg-card border border-border p-8 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[250px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-border relative shadow-xl shrink-0">
                  {userData?.avatarUrl ? (
                    <img src={userData.avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-yellow-400 rounded-full scale-90" />
                      <User className="w-14 h-14 text-slate-100 dark:text-slate-900 relative z-10 mt-2" />
                    </>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight">{userData?.name || "Nasabah AliBank"}</h1>
                    <Badge className={cn(
                      "text-[10px] font-black h-5 border-none px-2 rounded-md italic w-fit mx-auto sm:mx-0",
                      userData?.kycStatus === 'verified' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {userData?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground font-medium font-mono">{user?.email}</p>

                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground cursor-pointer" onClick={copyUid}>
                    <span className="text-xs font-bold font-mono">Nasabah ID (UID): {userData?.accountNumber || "--- --- ---"}</span>
                    <Copy className="w-3.5 h-3.5 hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-6 border-t border-border/50">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner", tierInfo.bg)}>
                    <tierInfo.icon className={cn("w-5 h-5", tierInfo.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">Loyalty Tier</p>
                    <span className={cn("text-xs font-black uppercase italic leading-none block mt-1", tierInfo.color)}>{tierInfo.name}</span>
                  </div>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-initial h-10 rounded-xl border-border hover:bg-muted font-bold text-xs" onClick={() => router.push('/settings')}>
                    Edit Profil
                  </Button>
                  <Button className="flex-1 sm:flex-initial h-10 gold-gradient text-white rounded-xl font-black italic uppercase text-xs" onClick={() => router.push('/crypto/market/alx')}>
                    Upgrade Tier
                  </Button>
                </div>
              </div>
            </Card>

            {/* SECURITY/TIER SIDE CARD */}
            <Card className="rounded-[2.5rem] bg-card border border-border p-8 shadow-sm flex flex-col justify-between text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/5 opacity-5" />
              <div className="space-y-4">
                <Crown className="w-12 h-12 text-primary mx-auto" />
                <h3 className="text-base font-black uppercase italic text-foreground tracking-wide">AliBank Tier Benefit</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tingkatkan saldo koin ALX Anda untuk membuka tier yang lebih tinggi dan nikmati potongan biaya transaksi hingga bebas biaya.
                </p>
              </div>
              <div className="mt-6 p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-1">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Keuntungan Anda saat ini</p>
                <p className="text-sm font-black italic text-primary">{tierInfo.discount}</p>
              </div>
            </Card>
          </div>

          {/* WEB3 BRIDGE SECTION */}
          <Card className="liquid-glass border-primary/20 p-8 rounded-[2.5rem] shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <LogoIcon className="w-32 h-32" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black italic shrink-0">Web3</div>
                  <div>
                    <h3 className="text-base font-black italic uppercase text-foreground leading-none">MetaMask Web3 Native Bridge</h3>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 block">Otentikasi Dompet Jaringan Blockchain Riil</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hubungkan dompet eksternal MetaMask Anda ke akun AliBank. Nikmati deposit & penarikan instan dan penandatanganan transaksi on-chain yang lebih aman melalui node Infura AliBank.
                </p>
                {(account || (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized')) && (
                  <div className="grid grid-cols-2 gap-4 pt-3">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-muted-foreground block tracking-wider leading-none">Vault Balance (Ethereum)</span>
                        <span className="text-[10px] font-bold text-foreground block mt-1 uppercase italic">AliBankVault SC</span>
                      </div>
                      <span className="text-sm font-black text-amber-500 italic">
                        {isVaultLoading ? "..." : `${vaultBalanceEth.toFixed(4)} ETH`}
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-black uppercase text-muted-foreground block tracking-wider leading-none">On-Chain Token (Polygon)</span>
                        <span className="text-[10px] font-bold text-foreground block mt-1 uppercase italic">AlixCoin ALX</span>
                      </div>
                      <span className="text-sm font-black text-primary italic">
                        {isAlxLoading ? "..." : `${externalAlxBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ALX`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center">
                {activeAddress ? (
                  <div className="w-full space-y-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4 w-full">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                          <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/app/images/logo/metamask-fox.svg" className="w-full h-full" alt="fox" />
                        </div>
                        <span className="text-xs font-mono font-bold text-accent truncate">{activeAddress}</span>
                      </div>
                      <button onClick={handleDisconnectWallet} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors">
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                    <Badge className="bg-green-600 text-white font-black text-[9px] uppercase px-4 h-6 border-none mx-auto block w-fit animate-pulse">Connected Web3</Badge>
                  </div>
                ) : (
                  <Button
                    onClick={handleLinkMetaMask}
                    disabled={isConnecting}
                    className="w-full h-14 gold-gradient text-white rounded-2xl font-black italic uppercase shadow-lg group"
                  >
                    {isConnecting ? <Loader2 className="animate-spin w-5 h-5" /> : (
                      <span className="flex items-center gap-3">
                        <Link2 className="w-5 h-5 group-hover:rotate-45 transition-transform" /> TAUTKAN METAMASK SDK
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* DYNAMIC RECOMMENDED GRID SECTION */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase italic text-muted-foreground tracking-widest pl-1">Fitur & Utilitas Rekomendasi</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: "P2P Trading", desc: "Perdagangan fiat antar nasabah", icon: Users, color: "text-amber-500", href: "/p2p/order-history" },
                { name: "Alpha Hub", desc: "Koneksi copy-trade otomatis", icon: Smile, color: "text-amber-500", isAlpha: true, href: "/alpha" },
                { name: "Konversi Kripto", desc: "Swap instan bebas slip", icon: Maximize, color: "text-amber-500", href: "/crypto/convert" },
                { name: "Margin Trading", desc: "Futures dengan leverage 20x", icon: ArrowRightLeft, color: "text-foreground", href: "/crypto/trade/futures" },
              ].map((item, idx) => (
                <Card
                  key={idx}
                  onClick={() => item.href !== "#" && router.push(item.href)}
                  className="p-6 rounded-[2rem] bg-card border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group min-h-[160px]"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-inner">
                      {item.isAlpha ? <span className="font-black text-sm italic">α</span> : <item.icon className="w-5 h-5" />}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="space-y-1 mt-4">
                    <h4 className="text-sm font-black uppercase italic">{item.name}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ADMIN ACTION WIDGET */}
          {isAdmin && (
            <section className="animate-in fade-in zoom-in duration-500">
              <Button
                onClick={() => router.push('/admin')}
                className="w-full h-16 gold-gradient text-white rounded-2xl flex items-center justify-between px-6 shadow-xl shadow-primary/20 hover:scale-[1.01] transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none opacity-80">Security Protocol</p>
                    <p className="text-sm font-black uppercase italic tracking-tight">Access Command Center</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 opacity-60" />
              </Button>
            </section>
          )}

          {/* DANGER/OUT BLOCK */}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <LogoIcon className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-[10px] font-black uppercase text-muted-foreground leading-none">AliBank Client Core</p>
                <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 block">v3.2.1-Autonomous</span>
              </div>
            </div>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="h-12 px-8 rounded-xl font-black uppercase italic tracking-widest gap-3 shadow-lg w-full sm:w-auto shrink-0"
            >
              <LogOut className="w-5 h-5" /> KELUAR AKUN
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

