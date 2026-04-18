
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
import { doc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useMemo, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMetaMask } from "@/hooks/useMetaMask";

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  // MetaMask SDK Integration
  const { account, connect, disconnect, isConnecting } = useMetaMask();

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

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

        {/* METAMASK SDK SECTION - THE NATIVE BRIDGE */}
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
                    {account ? (
                       <Badge className="bg-green-600 text-white font-black text-[8px] uppercase px-3 h-6 border-none animate-pulse">Connected</Badge>
                    ) : (
                       <Badge variant="outline" className="border-primary/20 text-primary font-black text-[8px] uppercase px-3 h-6">Not Linked</Badge>
                    )}
                 </div>

                 {account ? (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
                             <img src="https://raw.githubusercontent.com/MetaMask/metamask-extension/develop/app/images/logo/metamask-fox.svg" className="w-full h-full" alt="fox" />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-accent truncate">{account}</span>
                       </div>
                       <button onClick={disconnect} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors">
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
