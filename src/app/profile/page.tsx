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
  ShieldAlert,
  LogOut,
  Crown,
  Star,
  Loader2,
  Link2,
  Unlink,
  ShieldCheck,
  LayoutGrid,
  Users,
  Ticket,
  ArrowRightLeft,
  CalendarDays,
  Smile,
  Camera
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useUser, useDoc, useFirestore, useAuth, useStorage, useMemoFirebase } from "@/firebase";
import { doc, updateDoc, getFirestore, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApps, getApp, initializeApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";
import { signOut } from "firebase/auth";
import { useMemo, useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useMetaMask } from "@/hooks/useMetaMask";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { ethers } from "ethers";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // MetaMask SDK Integration
  const { account, connect, disconnect, isConnecting } = useMetaMask();

  useEffect(() => {
    setMounted(true);
    document.title = "Profil Saya - AliBank V3.1";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user || !storage || !userDocRef) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Ukuran Terlalu Besar", description: "Maksimal ukuran foto adalah 5MB." });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      await updateDoc(userDocRef, {
        avatarUrl: downloadUrl
      });
      
      toast({ title: "Foto Profil Diperbarui", description: "Foto profil baru Anda kini aktif di seluruh sistem AliBank." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Unggah", description: err.message || "Gagal mengunggah foto profil." });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

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
    if (alxBalance >= 10000) return { name: "Platinum VIP", color: "text-[#111111]", bg: "bg-[#F4B728]/20", icon: Crown, discount: "Zero Fee (Bebas Biaya)" };
    if (alxBalance >= 1000) return { name: "Gold Member", color: "text-amber-700", bg: "bg-amber-100", icon: Star, discount: "15% Diskon Biaya" };
    return { name: "Regular", color: "text-[#666666]", bg: "bg-[#F4F1EA]", icon: User, discount: "Tarif Standar" };
  }, [userData]);

  const copyUid = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "UID Disalin", description: "Nomor ID nasabah telah disalin ke papan klip." });
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
        toast({ title: "MetaMask Tertaut", description: "Alamat dompet Web3 Anda telah berhasil disinkronkan." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Koneksi Gagal", description: "Tidak dapat menghubungkan dompet MetaMask." });
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
    try {
      const { clearAlibankAuthSession } = await import('@/lib/firestore-proxy-client');
      clearAlibankAuthSession();
      if (auth) {
        await signOut(auth).catch(() => {});
      }
      router.replace('/');
      toast({ title: "Berhasil Keluar", description: "Anda telah keluar dari akun AliBank." });
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Gagal Keluar", description: "Terjadi kesalahan saat mencoba keluar." });
    }
  };

  if (!mounted) return null;

  // MOBILE VIEW LAYOUT (V 3.1 Minimalist Paper)
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] pb-24 flex flex-col font-sans selection:bg-[#F4B728] selection:text-black">
        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
        <header className="px-5 h-16 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] z-50">
          <button onClick={() => router.back()} className="p-2 hover:bg-[#FAF9F6] rounded-sm transition-colors text-[#666666] hover:text-black">
            <X className="w-5 h-5" />
          </button>
          <span className="font-serif text-base font-bold text-[#111111]">Akun Nasabah</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 hover:bg-[#FAF9F6] rounded-sm transition-colors text-[#666666] hover:text-black"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 pt-6 space-y-6 overflow-y-auto no-scrollbar">
          {/* User Bio Card */}
          <div className="bg-white border border-[#DFDAD0] rounded-sm p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-center overflow-hidden">
                  <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={64} />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
                  title="Ubah Foto Profil"
                >
                  {isUploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin text-[#F4B728]" /> : <Camera className="w-3 h-3" />}
                </button>
              </div>

              <div className="space-y-1 min-w-0">
                <h1 className="font-serif text-lg font-bold text-[#111111] truncate">{userData?.name || "Nasabah AliBank"}</h1>
                <p className="text-[11px] font-mono text-[#777777] truncate">{user?.email}</p>
                <div className="flex items-center gap-1.5 text-[#888888] cursor-pointer pt-0.5" onClick={copyUid}>
                  <span className="text-[10px] font-mono">UID: {userData?.accountNumber || "--- --- ---"}</span>
                  <Copy className="w-3 h-3 hover:text-black transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ECE7DE]">
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                userData?.kycStatus === 'verified'
                  ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
                  : "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
              )}>
                {userData?.kycStatus === 'verified' ? 'Terverifikasi' : 'Belum Verifikasi'}
              </span>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0]">
                <tierInfo.icon className="w-3.5 h-3.5 text-[#B48200]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#111111]">{tierInfo.name}</span>
              </div>
            </div>
          </div>

          {/* Web3 Bridge Card */}
          <div className="bg-white border border-[#DFDAD0] rounded-sm p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#111111]">MetaMask Native Bridge</h3>
                <p className="text-[10px] font-light text-[#777777] mt-0.5">Otentikasi Dompet Jaringan Web3</p>
              </div>
              {activeAddress ? (
                <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm">Connected</span>
              ) : (
                <span className="bg-[#FAF9F6] border border-[#DFDAD0] text-[#888888] text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm">Not Linked</span>
              )}
            </div>

            {activeAddress ? (
              <div className="p-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm flex items-center justify-between gap-3">
                <span className="text-[10px] font-mono text-[#111111] truncate">{activeAddress}</span>
                <button onClick={handleDisconnectWallet} className="p-1.5 hover:bg-[#FFF1F2] text-rose-600 rounded-sm transition-colors">
                  <Unlink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLinkMetaMask}
                disabled={isConnecting}
                className="w-full py-3 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {isConnecting ? <Loader2 className="w-4 h-4 animate-spin text-[#F4B728]" /> : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>Tautkan MetaMask SDK</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full py-3.5 bg-white hover:bg-[#FFF1F2] border border-[#FECDD3] text-rose-600 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </main>
      </div>
    );
  }

  // DESKTOP VIEW LAYOUT (V 3.1 Editorial Private Banking Style)
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black">
      <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />

      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">Akun Nasabah</h2>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm">
              Sovereign Identity
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/settings')}
              className="p-2 bg-[#FAF9F6] hover:bg-[#F4F1EA] border border-[#DFDAD0] rounded-sm transition-colors text-[#666666] hover:text-black cursor-pointer"
              title="Pengaturan Akun"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            <div 
              className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] shrink-0 cursor-pointer hover:border-black transition-colors" 
              onClick={() => fileInputRef.current?.click()} 
              title="Ubah Foto Profil"
            >
              <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1300px] w-full mx-auto">

          {/* USER BIO & DETAILS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* PROFILE BIO CARD */}
            <div className="lg:col-span-2 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[250px] space-y-6">
              {/* Radial Guilloche Watermark */}
              <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.035] pointer-events-none -mr-16 -mt-16">
                <svg viewBox="0 0 200 200" className="w-full h-full text-black" fill="none" stroke="currentColor">
                  <circle cx="100" cy="100" r="30" strokeWidth="1" />
                  <circle cx="100" cy="100" r="60" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="100" cy="100" r="90" strokeWidth="0.8" />
                </svg>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 rounded-full bg-[#FAF9F6] border-2 border-[#DFDAD0] flex items-center justify-center overflow-hidden shadow-xs">
                    <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={96} />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    title="Ubah Foto Profil"
                  >
                    {isUploadingAvatar ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#F4B728]" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <h1 className="font-serif text-3xl font-bold tracking-tight text-[#111111]">
                      {userData?.name || "Nasabah AliBank"}
                    </h1>
                    <span 
                      onClick={() => router.push('/settings/kyc')}
                      className={cn(
                        "text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-sm border w-fit mx-auto sm:mx-0 cursor-pointer transition-colors",
                        userData?.kycStatus === 'verified' 
                          ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" 
                          : "bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]"
                      )}
                    >
                      {userData?.kycStatus === 'verified' ? 'Terverifikasi' : 'Verifikasi KYC Diperlukan →'}
                    </span>
                  </div>

                  <p className="text-xs font-mono text-[#666666]">{user?.email}</p>

                  <div 
                    className="flex items-center justify-center sm:justify-start gap-2 text-[#777777] cursor-pointer pt-1" 
                    onClick={copyUid}
                    title="Klik untuk menyalin Nasabah ID"
                  >
                    <span className="text-xs font-mono bg-[#FAF9F6] border border-[#DFDAD0] px-2.5 py-0.5 rounded-sm text-[#444444]">
                      Nasabah ID (UID): {userData?.accountNumber || "--- --- ---"}
                    </span>
                    <Copy className="w-3.5 h-3.5 hover:text-black transition-colors" />
                  </div>
                </div>
              </div>

              {/* Tier & Actions Bottom Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[#ECE7DE] relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#FFFDF5] border border-[#FDE68A] flex items-center justify-center shrink-0">
                    <tierInfo.icon className="w-4.5 h-4.5 text-[#D97706]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#888888] leading-none">Loyalty Tier</p>
                    <span className="text-xs font-serif font-bold text-[#111111] leading-none block mt-1">{tierInfo.name}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 w-full sm:w-auto">
                  {userData?.kycStatus !== 'verified' && (
                    <button 
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      onClick={() => router.push('/settings/kyc')}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi KYC</span>
                    </button>
                  )}
                  <button 
                    className="px-4 py-2 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer" 
                    onClick={() => router.push('/settings')}
                  >
                    Edit Profil
                  </button>
                  <button 
                    className="px-4 py-2 bg-[#111111] hover:bg-black text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer" 
                    onClick={() => router.push('/crypto/market/alx')}
                  >
                    Upgrade Tier →
                  </button>
                </div>
              </div>
            </div>

            {/* SECURITY/TIER SIDE CARD */}
            <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm flex flex-col justify-between text-center space-y-6">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#FFFDF5] border border-[#FDE68A] flex items-center justify-center mx-auto text-[#D97706]">
                  <Crown className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#111111] tracking-tight">AliBank Tier Benefit</h3>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Tingkatkan saldo koin ALX Anda untuk membuka tier yang lebih tinggi dan nikmati pemotongan biaya transaksi hingga bebas biaya.
                </p>
              </div>

              <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Keuntungan Anda Saat Ini</p>
                <p className="font-mono text-sm font-bold text-[#111111]">{tierInfo.discount}</p>
              </div>
            </div>
          </div>

          {/* WEB3 BRIDGE SECTION */}
          <div className="bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-[#111111] text-[#F4B728] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    W3
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#111111] leading-none">MetaMask Web3 Native Bridge</h3>
                    <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider mt-1 block">Otentikasi Dompet Jaringan Blockchain Riil</span>
                  </div>
                </div>

                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Hubungkan dompet eksternal MetaMask Anda ke akun AliBank. Nikmati deposit & penarikan instan dan penandatanganan transaksi on-chain yang lebih aman melalui node Infura AliBank.
                </p>

                {(account || (userData?.externalWalletAddress && userData?.externalWalletAddress !== '0xNoWalletInitialized')) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#888888] block">Vault Balance (Ethereum)</span>
                        <span className="text-xs font-mono font-bold text-[#111111] block">AliBankVault SC</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {isVaultLoading ? "..." : `${vaultBalanceEth.toFixed(4)} ETH`}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#888888] block">On-Chain Token (Polygon)</span>
                        <span className="text-xs font-mono font-bold text-[#111111] block">AlixCoin ALX</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-[#111111]">
                        {isAlxLoading ? "..." : `${externalAlxBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} ALX`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center">
                {activeAddress ? (
                  <div className="w-full space-y-3">
                    <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-between gap-3 w-full">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-1 shrink-0 border border-[#DFDAD0]">
                          <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/app/images/logo/metamask-fox.svg" className="w-full h-full" alt="fox" />
                        </div>
                        <span className="text-xs font-mono text-[#111111] truncate font-bold">{activeAddress}</span>
                      </div>
                      <button onClick={handleDisconnectWallet} title="Putuskan Tautan" className="p-2 hover:bg-[#FFF1F2] text-rose-600 rounded-sm transition-colors cursor-pointer">
                        <Unlink className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] font-mono text-[9px] font-bold uppercase px-3 py-1 rounded-sm mx-auto block w-fit">
                      Connected Web3
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleLinkMetaMask}
                    disabled={isConnecting}
                    className="w-full py-3.5 bg-[#111111] hover:bg-black text-white rounded-sm font-bold uppercase tracking-wider text-xs shadow-sm flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                  >
                    {isConnecting ? <Loader2 className="w-4 h-4 animate-spin text-[#F4B728]" /> : (
                      <>
                        <Link2 className="w-4 h-4" />
                        <span>Tautkan MetaMask SDK</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC RECOMMENDED GRID SECTION */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#777777] pl-0.5">
              Fitur & Utilitas Rekomendasi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: "P2P Trading", desc: "Perdagangan fiat antar nasabah", icon: Users, href: "/p2p/order-history" },
                { name: "Alpha Hub", desc: "Koneksi copy-trade otomatis", icon: Smile, href: "/alpha" },
                { name: "Konversi Kripto", desc: "Swap instan bebas slip", icon: Maximize, href: "/crypto/convert" },
                { name: "Margin Trading", desc: "Futures dengan leverage 20x", icon: ArrowRightLeft, href: "/crypto/trade/futures" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => item.href !== "#" && router.push(item.href)}
                  className="p-6 bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black rounded-sm shadow-sm flex flex-col justify-between cursor-pointer transition-all group min-h-[140px]"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-9 h-9 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] group-hover:border-black flex items-center justify-center text-[#111111] transition-colors">
                      <item.icon className="w-4.5 h-4.5" />
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#888888] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <div className="space-y-0.5 mt-4">
                    <h4 className="font-serif text-sm font-bold text-[#111111]">{item.name}</h4>
                    <p className="text-[10px] text-[#777777] font-light uppercase tracking-wider">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ADMIN ACTION WIDGET */}
          {isAdmin && (
            <div 
              onClick={() => router.push('/admin')}
              className="p-6 bg-[#111111] hover:bg-black text-white rounded-sm flex items-center justify-between shadow-sm cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-sm bg-white/10 flex items-center justify-center text-[#F4B728]">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-[#999999]">Security Protocol</p>
                  <p className="font-serif text-base font-bold tracking-tight">Access Command Center</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#999999]" />
            </div>
          )}

          {/* DANGER/OUT BLOCK */}
          <div className="pt-6 border-t border-[#ECE7DE] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-xs shadow-xs">
                A
              </div>
              <div>
                <p className="text-xs font-serif font-bold text-[#111111] leading-none">AliBank Institutional Core</p>
                <span className="text-[9px] font-mono text-[#888888] uppercase mt-1 block">v3.1-Sovereign Ledger</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-white hover:bg-[#FFF1F2] border border-[#FECDD3] hover:border-rose-400 text-rose-700 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
