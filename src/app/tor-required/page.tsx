"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  ExternalLink, 
  RotateCw, 
  Terminal, 
  Lock, 
  Unlock,
  Key,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoIcon } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";

export default function TorRequiredPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<{
    clientIp?: string;
    isTor?: boolean;
    isPrivate?: boolean;
    isBypassed?: boolean;
  }>({});
  const [bypassing, setBypassing] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tor/status?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setStatusData(data);
        if (data.isTor || data.isBypassed) {
          toast({
            title: "Akses Diizinkan!",
            description: "Koneksi Tor terverifikasi. Mengarahkan ke AliBank...",
          });
          setTimeout(() => {
            router.push("/");
          }, 1200);
        }
      }
    } catch (err) {
      console.error("Gagal memeriksa status Tor:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleToggleBypass = async (enable: boolean) => {
    setBypassing(true);
    try {
      const res = await fetch("/api/tor/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: enable ? "bypass" : "enforce" })
      });
      if (res.ok) {
        if (enable) {
          toast({
            title: "Mode Simulasi Tor Diaktifkan",
            description: "Bypass aktif untuk sesi browser ini. Mengarahkan ke aplikasi...",
          });
          setTimeout(() => {
            router.push("/");
            router.refresh();
          }, 1000);
        } else {
          toast({
            title: "Proteksi Tor Diaktifkan Kembali",
            description: "Akses kembali dibatasi hanya untuk Tor Browser.",
          });
          fetchStatus();
        }
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Gagal Mengubah Mode",
        description: "Terjadi kesalahan saat memproses permintaan."
      });
    } finally {
      setBypassing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-500/30 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 p-2 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black">
            <LogoIcon />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight uppercase italic text-amber-400">AliBank</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tor Onion Security Layer</p>
          </div>
        </div>

        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 px-3 py-1 font-mono text-[10px] flex items-center gap-1.5 uppercase font-bold">
          <Lock className="w-3 h-3 text-amber-400 animate-pulse" />
          Tor Protocol Enforced
        </Badge>
      </header>

      {/* Main Security Card */}
      <main className="max-w-2xl w-full mx-auto my-auto z-10 py-6">
        <Card className="rounded-[2.5rem] bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-10 backdrop-blur-xl relative overflow-hidden space-y-8">
          
          {/* Security Banner Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 mx-auto flex items-center justify-center shadow-xl shadow-amber-500/10 text-amber-400">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight text-white">
              Akses Khusus Tor Browser
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto font-medium leading-relaxed">
              Demi privasi keuangan total, anonimitas identitas, dan enkripsi on-chain, aplikasi AliBank V3 hanya dapat dibuka melalui jaringan resmi <strong className="text-amber-400">Tor Browser</strong>.
            </p>
          </div>

          {/* Diagnostics Terminal Box */}
          <div className="rounded-2xl bg-black/60 border border-slate-800/80 p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Diagnostik Jaringan Pengunjung
              </span>
              <span className="text-[10px] text-slate-500">Node Guard v3.8</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Alamat IP Terdeteksi:</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5">
                  {statusData.clientIp || "Mendeteksi..."}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 uppercase">Status Relai Tor:</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {loading ? (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <RotateCw className="w-3 h-3 animate-spin" /> Memeriksa...
                    </span>
                  ) : statusData.isTor ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi Tor Exit Node
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Non-Tor Clearnet (Ditolak)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <a 
              href="https://www.torproject.org/download/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black uppercase italic tracking-wider text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Globe className="w-4 h-4" />
              Unduh Tor Browser Resmi
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={fetchStatus}
              disabled={loading}
              className="w-full h-11 rounded-xl border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-bold text-xs"
            >
              <RotateCw className={`w-3.5 h-3.5 mr-2 ${loading ? "animate-spin" : ""}`} />
              Cek Ulang Status Koneksi
            </Button>
          </div>

          {/* Developer Testing / Simulation Section */}
          <div className="border-t border-slate-800/80 pt-6">
            <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase text-amber-400/90 tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  Mode Pengujian Pengembang (Trial)
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ingin menguji aplikasi di browser ini tanpa membuka Tor Browser?
                </p>
              </div>

              <Button
                size="sm"
                variant={statusData.isBypassed ? "destructive" : "secondary"}
                onClick={() => handleToggleBypass(!statusData.isBypassed)}
                disabled={bypassing}
                className="h-8 px-3 rounded-lg text-[10px] font-bold uppercase shrink-0"
              >
                {bypassing ? (
                  <RotateCw className="w-3 h-3 animate-spin mr-1" />
                ) : statusData.isBypassed ? (
                  <Lock className="w-3 h-3 mr-1" />
                ) : (
                  <Unlock className="w-3 h-3 mr-1" />
                )}
                {statusData.isBypassed ? "Aktifkan Proteksi Tor" : "Bypass Sesi (Uji Coba)"}
              </Button>
            </div>
          </div>

        </Card>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 z-10">
        <p className="text-[10px] text-slate-500 font-mono">
          AliBank Web3 Distributed Financial System • Onion Guard Protocol Active
        </p>
      </footer>
    </div>
  );
}
