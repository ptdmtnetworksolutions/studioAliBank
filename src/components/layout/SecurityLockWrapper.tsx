"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { Lock, Delete, ShieldAlert, Fingerprint, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";

interface SecurityLockWrapperProps {
  children: React.ReactNode;
}

export function SecurityLockWrapper({ children }: SecurityLockWrapperProps) {
  const { user, loading: userLoading } = useUser();
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sessionUnlocked, setSessionUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || userLoading || !user) {
      setIsLocked(false);
      return;
    }

    const bridge = (window as any).AndroidBridge;
    if (bridge) {
      const pinActive = typeof bridge.isPinEnabled === "function" && bridge.isPinEnabled();
      const bioActive = typeof bridge.isBiometricEnabled === "function" && bridge.isBiometricEnabled();
      const alreadyUnlocked = sessionStorage.getItem("alibank_pos_unlocked") === "true";

      if ((pinActive || bioActive) && !alreadyUnlocked && !sessionUnlocked) {
        setIsLocked(true);
        setHasBiometrics(bioActive);

        // Bind global callback for Android biometrics result
        (window as any).onAndroidBiometricResult = (success: boolean, message: string) => {
          if (success) {
            handleUnlockSuccess();
          } else {
            setStatusMsg("Biometrik gagal. Silakan masukkan PIN.");
            if (message && message !== "Authentication succeeded" && !message.includes("cancel")) {
              setErrorMsg(message);
            }
          }
        };

        // If biometrics is active, auto-trigger it
        if (bioActive && typeof bridge.authenticateBiometric === "function") {
          setStatusMsg("Memverifikasi sidik jari/wajah...");
          bridge.authenticateBiometric();
        } else {
          setStatusMsg("Masukkan PIN Keamanan 6 Angka");
        }
      } else {
        setIsLocked(false);
      }
    }
  }, [user, userLoading, sessionUnlocked]);

  const handleUnlockSuccess = () => {
    sessionStorage.setItem("alibank_pos_unlocked", "true");
    setSessionUnlocked(true);
    setIsLocked(false);
  };

  const handleKeyPress = (char: string) => {
    if (enteredPin.length >= 6) return;
    setErrorMsg(null);
    const nextPin = enteredPin + char;
    setEnteredPin(nextPin);

    if (nextPin.length === 6) {
      const bridge = (window as any).AndroidBridge;
      if (bridge && typeof bridge.verifyPin === "function") {
        const isValid = bridge.verifyPin(nextPin);
        if (isValid) {
          handleUnlockSuccess();
        } else {
          setErrorMsg("PIN Keamanan Salah!");
          setEnteredPin("");
        }
      } else {
        // Safe fallback in case of missing bridge verify function
        handleUnlockSuccess();
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(prev => prev.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const triggerBiometricAuth = () => {
    const bridge = (window as any).AndroidBridge;
    if (bridge && typeof bridge.authenticateBiometric === "function") {
      setErrorMsg(null);
      setStatusMsg("Memverifikasi sidik jari/wajah...");
      bridge.authenticateBiometric();
    }
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0E1113] flex flex-col items-center justify-between p-6 select-none font-body text-white">
        {/* Header decoration */}
        <div className="pt-10 flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl gold-gradient p-2.5 shadow-xl flex items-center justify-center animate-pulse">
            <LogoIcon className="text-white w-full h-full" />
          </div>
          <h2 className="text-sm font-black italic uppercase tracking-widest text-[#D4AF37] mt-2">AliBank POS</h2>
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest leading-none">Security Lock Terminal</span>
        </div>

        {/* Lock State display */}
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div className="text-center space-y-1 px-4">
            <p className="text-xs font-black uppercase tracking-wider italic text-white/90">
              {statusMsg}
            </p>
            {errorMsg ? (
              <p className="text-[10px] font-bold text-rose-500 uppercase flex items-center justify-center gap-1">
                <ShieldAlert className="w-3 h-3" /> {errorMsg}
              </p>
            ) : (
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-none">
                Sesi Aplikasi Terkunci
              </p>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex gap-4 pt-2">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div
                key={idx}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  idx < enteredPin.length
                    ? "bg-[#D4AF37] scale-110 shadow-[0_0_8px_#D4AF37]"
                    : "bg-white/10 border border-white/20"
                )}
              />
            ))}
          </div>
        </div>

        {/* Keyboard Pad */}
        <div className="pb-10 w-full max-w-[280px] space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                onClick={() => handleKeyPress(n.toString())}
                className="h-16 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 hover:bg-white/10 text-2xl font-black italic transition-all flex items-center justify-center shadow-inner"
              >
                {n}
              </button>
            ))}
            
            {/* Left Button (Biometric trigger / empty) */}
            {hasBiometrics ? (
              <button
                onClick={triggerBiometricAuth}
                className="h-16 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 hover:bg-white/10 text-primary transition-all flex items-center justify-center"
                title="Verifikasi Biometrik"
                aria-label="Verifikasi Biometrik"
              >
                <Fingerprint className="w-6 h-6 text-[#D4AF37]" />
              </button>
            ) : (
              <div className="h-16" />
            )}

            {/* Zero Key */}
            <button
              onClick={() => handleKeyPress("0")}
              className="h-16 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 hover:bg-white/10 text-2xl font-black italic transition-all flex items-center justify-center"
            >
              0
            </button>

            {/* Right Button (Delete) */}
            <button
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-white/5 border border-white/5 active:bg-rose-500/10 hover:bg-rose-500/10 text-rose-500 transition-all flex items-center justify-center"
              title="Hapus Digit"
              aria-label="Hapus Digit"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
