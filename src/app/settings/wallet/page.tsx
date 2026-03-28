
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Copy, 
  ChevronRight, 
  ShieldCheck, 
  Smile,
  Globe,
  Wallet,
  Settings,
  Lock,
  Network,
  Users,
  Smartphone,
  Scan,
  BookOpen,
  Share2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function WalletSettingsPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemo(() => (!db || !user) ? null : doc(db, "users", user.uid), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const copyUid = () => {
    if (userData?.accountNumber) {
      navigator.clipboard.writeText(userData.accountNumber);
      toast({ title: "UID Disalin", description: "Nomor UID Anda telah disalin." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#1E2329] text-white flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center sticky top-0 bg-[#1E2329] z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-lg font-black tracking-tight mr-10">Pengaturan</h1>
      </header>

      <main className="flex-1 px-4 pt-2 pb-20 space-y-8 overflow-y-auto no-scrollbar">
        {/* UMUM SECTION */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Umum</h2>
          <div className="space-y-1">
            <div className="flex items-center justify-between py-4 px-1 group cursor-default">
              <span className="text-base font-black italic">UID</span>
              <div className="flex items-center gap-3" onClick={copyUid}>
                <span className="text-base font-bold text-slate-400">{userData?.accountNumber || "--- --- ---"}</span>
                <Copy className="w-4 h-4 text-slate-500 cursor-pointer active:scale-90 transition-transform" />
              </div>
            </div>

            <MenuItem label="Manajemen Dompet" />
            <MenuItem label="Buku Alamat" />
            <MenuItem label="Jaringan Khusus" />
            <MenuItem label="Tautan Sosial" value="Tautkan Sekarang" />
          </div>
        </section>

        <div className="h-px bg-white/5 w-full" />

        {/* PREFERENSI SECTION */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Preferensi</h2>
          <div className="space-y-1">
            <MenuItem label="Bahasa" value="Bahasa Indonesia" />
            <MenuItem label="Mata Uang" value="IDR" />
          </div>
        </section>

        <div className="h-px bg-white/5 w-full" />

        {/* KEAMANAN SECTION */}
        <section className="space-y-4 relative">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Keamanan</h2>
          <div className="space-y-1">
            <MenuItem label="Cadangan Dompet Tanpa Kunci" />
            <MenuItem label="Metode Verifikasi" />
            <MenuItem label="Pusat Keamanan" />
            <MenuItem label="Tanda Tangan Otomatis Aman" />
          </div>

          {/* Floating Robot Icon - Positioned exactly as in image */}
          <div className="absolute right-0 -top-4">
            <div className="w-10 h-10 bg-[#2B3139] rounded-xl shadow-2xl border border-white/5 flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer relative">
              <Smile className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-[#1E2329] animate-pulse" />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MenuItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between py-4 px-1 group cursor-pointer hover:bg-white/[0.02] transition-colors rounded-xl">
      <span className="text-base font-black italic">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm font-bold text-slate-500">{value}</span>}
        <ChevronRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
