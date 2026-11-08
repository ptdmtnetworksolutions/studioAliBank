"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  KeyRound
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Pre-computed guilloche rays with 2 decimal precision to guarantee 100% SSR-client hydration match
const GUILLOCHE_RAYS = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 360) / 72;
  const rad = (angle * Math.PI) / 180;
  return {
    x1: Number((200 + 40 * Math.cos(rad)).toFixed(2)),
    y1: Number((200 + 40 * Math.sin(rad)).toFixed(2)),
    x2: Number((200 + 190 * Math.cos(rad)).toFixed(2)),
    y2: Number((200 + 190 * Math.sin(rad)).toFixed(2)),
  };
});

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = email.trim();
    const targetEmail =
      cleanEmail.toLowerCase() === "aldzulfikar075@gmail.com"
        ? "alidzulfikar075@gmail.com"
        : cleanEmail;

    try {
      // 1. Verifikasi kredensial via Server API (IP datacenter bersih, bebas blokir Tor)
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (lang === "en" ? "Invalid email or password. Please try again." : "Email atau kata sandi salah. Silakan coba lagi."));
      }

      // 2. Simpan sesi user, token, dan Firebase Auth localStorage untuk Edge Middleware & Client Provider
      if (typeof window !== "undefined") {
        const { saveAlibankAuthSession } = await import("@/lib/firestore-proxy-client");
        saveAlibankAuthSession({
          uid: data.uid,
          email: data.email || targetEmail,
          displayName: data.displayName || "",
          idToken: data.idToken || "",
          refreshToken: data.refreshToken || "",
          loggedInAt: Date.now(),
        });
      }

      // 3. Sinkronkan sesi Firebase Auth di client jika lingkungan browser mengizinkan
      if (auth) {
        try {
          const { setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } = await import("firebase/auth");
          try {
            await setPersistence(auth, browserLocalPersistence);
          } catch {
            try {
              await setPersistence(auth, browserSessionPersistence);
            } catch {
              await setPersistence(auth, inMemoryPersistence);
            }
          }
          await signInWithEmailAndPassword(auth, targetEmail, password);
        } catch (clientErr: any) {
          console.warn("Client direct auth sync skipped (using server token session):", clientErr?.code || clientErr);
        }
      }

      toast({
        title: lang === "en" ? "Welcome Back" : "Selamat Datang Kembali",
        description: lang === "en" ? "Successfully signed into your AliBank account." : "Berhasil masuk ke akun AliBank Anda.",
      });

      // Navigasi setelah sesi tersimpan dan state termuat penuh
      if (typeof window !== "undefined") {
        const isMobile = window.innerWidth < 768;
        const dest = isMobile ? "/m/home" : "/";
        setTimeout(() => {
          window.location.replace(dest);
        }, 300);
      } else {
        router.replace("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const msg = error.message || (lang === "en" ? "Invalid email or password. Please try again." : "Email atau kata sandi salah. Silakan coba lagi.");
      setErrorMessage(msg);
      toast({
        variant: "destructive",
        title: lang === "en" ? "Sign In Failed" : "Gagal Masuk",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans antialiased flex flex-col justify-between relative overflow-hidden selection:bg-[#F4B728] selection:text-black">
      {/* Background Radial Sunburst Guilloche (Matching Landing Page Aesthetic) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none opacity-[0.035]">
        <svg
          viewBox="0 0 400 400"
          className="w-full h-full text-[#111111]"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          suppressHydrationWarning
        >
          <circle cx="200" cy="200" r="40" strokeWidth="1" />
          <circle cx="200" cy="200" r="80" strokeWidth="0.5" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="140" strokeWidth="0.6" />
          <circle cx="200" cy="200" r="190" strokeWidth="1" />
          {GUILLOCHE_RAYS.map((ray, i) => (
            <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} />
          ))}
        </svg>
      </div>

      {/* Top Minimal Navigation Bar */}
      <header className="w-full max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between z-10">
        <NextLink
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#666666] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === "en" ? "Back to AliBank" : "Kembali ke AliBank"}</span>
        </NextLink>

        {/* Minimalist Lang Toggle */}
        <div className="flex items-center text-[10px] font-bold tracking-widest border border-[#DFDAD0] rounded-sm p-0.5 bg-[#F4F1EA]">
          <button
            onClick={() => setLang("en")}
            className={cn(
              "px-2 py-1 rounded-[2px] transition-colors",
              lang === "en" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLang("id")}
            className={cn(
              "px-2 py-1 rounded-[2px] transition-colors",
              lang === "id" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
            )}
          >
            ID
          </button>
        </div>
      </header>

      {/* Centered Editorial Sign In Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-white border border-[#DFDAD0] rounded-sm p-8 sm:p-12 shadow-xl space-y-8 text-left animate-in fade-in duration-200">
          {/* Logo & Headline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <NextLink href="/" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                  A
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#111111] group-hover:opacity-80 transition-opacity">
                  AliBank
                </span>
              </NextLink>

              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#888888] bg-[#F4F1EA] border border-[#DFDAD0] px-2 py-1 rounded-sm">
                PORTAL
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <h1 className="font-serif text-3xl font-bold text-[#111111] tracking-tight">
                {lang === "en" ? "Sign In" : "Masuk ke Akun"}
              </h1>
              <p className="text-xs text-[#666666] font-light leading-relaxed">
                {lang === "en"
                  ? "Access your sovereign multi-chain ledger, proof-of-reserves vaults, and banking services."
                  : "Akses buku besar hibrida multi-chain, brankas cadangan, dan layanan perbankan Anda."}
              </p>
            </div>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 bg-[#FFF1F2] border border-[#FECDD3] text-[#9F1239] text-xs flex items-start gap-2.5 rounded-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
              >
                {lang === "en" ? "Email Address" : "Alamat Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
                >
                  {lang === "en" ? "Password" : "Kata Sandi"}
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.18em] rounded-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F4B728]" />
                    <span>{lang === "en" ? "Verifying..." : "Memverifikasi..."}</span>
                  </>
                ) : (
                  <span>{lang === "en" ? "Sign In to Ledger →" : "Masuk ke Rekening →"}</span>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="w-full h-px bg-[#ECE7DE]" />

          {/* Register Prompt */}
          <div className="space-y-3 text-center">
            <p className="text-xs text-[#666666] font-light">
              {lang === "en" ? "Don't have an AliBank account yet?" : "Belum memiliki rekening nasabah AliBank?"}
            </p>
            <NextLink
              href="/register"
              className="w-full block py-3 border border-[#111111] hover:bg-[#FAF9F6] text-[#111111] text-xs font-bold uppercase tracking-[0.16em] rounded-sm transition-colors text-center"
            >
              {lang === "en" ? "Open Account (BIP-39 HD) →" : "Buka Rekening Baru (BIP-39 HD) →"}
            </NextLink>
          </div>
        </div>
      </main>

      {/* Footer Security Badges */}
      <footer className="w-full max-w-[1280px] mx-auto px-6 py-6 text-center text-[10px] text-[#777777] flex flex-col sm:flex-row items-center justify-between gap-3 z-10 border-t border-[#ECE7DE]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>
            {lang === "en"
              ? "BIP-39 / BIP-44 Universal HD Derivation • 100% Verifiable Reserves"
              : "Standar Universal BIP-39 / BIP-44 • 100% Cadangan Terverifikasi"}
          </span>
        </div>
        <div>
          <span>© {new Date().getFullYear()} AliBank Financial Network. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
