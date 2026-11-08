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
  Phone,
  User,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
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

export default function RegisterPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage(null);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanName = formData.name.trim();

    try {
      // 1. Kirim pendaftaran ke Server API (anti-blokir Tor/VPN, tanpa ADC)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: formData.phone.trim(),
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            (lang === "en"
              ? "Registration failed. Please check your data and try again."
              : "Gagal mendaftar. Silakan periksa kembali data Anda.")
        );
      }

      // 2. Simpan sesi user & token terlebih dahulu
      if (typeof window !== "undefined") {
        const { saveAlibankAuthSession } = await import(
          "@/lib/firestore-proxy-client"
        );
        saveAlibankAuthSession({
          uid: data.uid,
          email: cleanEmail,
          displayName: cleanName,
          idToken: data.idToken || "",
          refreshToken: data.refreshToken || "",
          loggedInAt: Date.now(),
        });
      }

      // 3. Sinkronkan sesi di sisi client jika lingkungan browser mengizinkan
      if (auth) {
        try {
          const {
            setPersistence,
            browserLocalPersistence,
            browserSessionPersistence,
            inMemoryPersistence,
          } = await import("firebase/auth");
          try {
            await setPersistence(auth, browserLocalPersistence);
          } catch {
            try {
              await setPersistence(auth, browserSessionPersistence);
            } catch {
              await setPersistence(auth, inMemoryPersistence);
            }
          }
          await signInWithEmailAndPassword(auth, cleanEmail, formData.password);
        } catch (syncErr: any) {
          console.warn(
            "Client direct auth sync skipped (using server token session):",
            syncErr?.code || syncErr
          );
        }
      }

      toast({
        title: lang === "en" ? "Account Activated" : "Pendaftaran Berhasil",
        description:
          lang === "en"
            ? "Your AliBank sovereign ledger account is ready."
            : "Akun AliBank aktif. Selamat datang di masa depan perbankan.",
      });

      // Navigasi setelah sesi tersimpan
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
      console.error("Registration error:", error);
      const msg =
        error.message ||
        (lang === "en"
          ? "Registration failed. Please try again."
          : "Gagal mendaftar. Silakan coba lagi.");
      setErrorMessage(msg);
      toast({
        variant: "destructive",
        title: lang === "en" ? "Registration Failed" : "Gagal Mendaftar",
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
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "px-2 py-1 rounded-[2px] transition-colors",
              lang === "en" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
            )}
          >
            EN
          </button>
          <button
            type="button"
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

      {/* Centered Editorial Register Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-white border border-[#DFDAD0] rounded-sm p-8 sm:p-12 shadow-xl space-y-7 text-left animate-in fade-in duration-200">
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
                ENROLLMENT
              </span>
            </div>

            <div className="space-y-1.5 pt-2">
              <h1 className="font-serif text-3xl font-bold text-[#111111] tracking-tight">
                {lang === "en" ? "Open Account" : "Buka Rekening Baru"}
              </h1>
              <p className="text-xs text-[#666666] font-light leading-relaxed">
                {lang === "en"
                  ? "Generate your sovereign multi-chain HD ledger and self-custodial banking identity."
                  : "Buat buku besar hibrida multi-chain dan identitas perbankan mandiri Anda."}
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
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
              >
                {lang === "en" ? "Legal Full Name" : "Nama Lengkap"}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="name"
                  type="text"
                  placeholder="e.g. Alex Thompson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
              >
                {lang === "en" ? "Email Address" : "Alamat Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
              >
                {lang === "en" ? "Phone Number" : "Nomor Telepon"}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="phone"
                  type="tel"
                  placeholder="+62 812-xxxx-xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs sm:text-sm text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-black focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="block text-[10px] font-bold tracking-[0.16em] uppercase text-[#666666]"
              >
                {lang === "en" ? "Create Password" : "Buat Kata Sandi"}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder={lang === "en" ? "Min. 6 characters" : "Min. 6 karakter"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
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
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.18em] rounded-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F4B728]" />
                    <span>{lang === "en" ? "Provisioning Ledger..." : "Membuat Rekening..."}</span>
                  </>
                ) : (
                  <span>
                    {lang === "en"
                      ? "Create Account & HD Keys →"
                      : "Buka Rekening & Buat Kunci →"}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="w-full h-px bg-[#ECE7DE]" />

          {/* Sign In Prompt */}
          <div className="space-y-3 text-center">
            <p className="text-xs text-[#666666] font-light">
              {lang === "en" ? "Already have an AliBank account?" : "Sudah memiliki rekening nasabah AliBank?"}
            </p>
            <NextLink
              href="/login"
              className="w-full block py-3 border border-[#111111] hover:bg-[#FAF9F6] text-[#111111] text-xs font-bold uppercase tracking-[0.16em] rounded-sm transition-colors text-center"
            >
              {lang === "en" ? "Sign In to Existing Account →" : "Masuk ke Rekening Terdaftar →"}
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
