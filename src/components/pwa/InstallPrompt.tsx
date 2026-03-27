
"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

/**
 * Komponen InstallPrompt Profesional.
 * Muncul di atas layar (top-24) untuk memicu instalasi WebAPK Native.
 */
export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  const checkStandalone = useCallback(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  }, []);

  useEffect(() => {
    setMounted(true);
    
    // Jangan munculkan jika aplikasi sudah terinstal (Standalone)
    if (checkStandalone()) return;

    const handleBeforeInstallPrompt = (e: any) => {
      // Mencegah browser menampilkan dialog default seketika
      e.preventDefault();
      setDeferredPrompt(e);
      
      const lastDismissed = localStorage.getItem("alibank-pwa-dismissed");
      const cooldown = 30 * 60 * 1000; // Muncul kembali setelah 30 menit jika diabaikan
      
      if (!lastDismissed || Date.now() - parseInt(lastDismissed) > cooldown) {
        setShowPrompt(true);
      }
    };

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice && !checkStandalone()) {
      const hasSeenPrompt = localStorage.getItem("ios-pwa-prompt-seen");
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [checkStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Memicu dialog instalasi native sistem operasi
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("alibank-pwa-dismissed", Date.now().toString());
    if (isIOS) localStorage.setItem("ios-pwa-prompt-seen", "true");
  };

  if (!mounted || !showPrompt) return null;

  return (
    <div className="fixed top-24 left-4 right-4 z-[9999] animate-in slide-in-from-top-10 fade-in duration-700 max-w-lg mx-auto pointer-events-auto">
      <div className="liquid-glass-dark bg-black/95 border-primary/30 p-5 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
        <div className="absolute inset-0 gold-gradient opacity-10" />
        
        <button 
          onClick={closePrompt}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg p-3 border border-white/20">
            <LogoIcon className="text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary text-white text-[7px] font-black h-4 px-2 leading-none uppercase tracking-widest border-none">Official WebAPK</Badge>
              <h3 className="text-xs font-black text-white uppercase tracking-tighter italic">AliBank App</h3>
            </div>
            <p className="text-[10px] text-white/70 font-medium leading-tight line-clamp-2 italic">
              {isIOS 
                ? "Tap 'Share' lalu 'Add to Home Screen' untuk instalasi native iPhone." 
                : "Pasang aplikasi resmi untuk akses tanpa badge browser & fitur long-press."}
            </p>
          </div>

          {!isIOS ? (
            <Button 
              onClick={handleInstallClick}
              className="bg-primary text-white font-black text-[10px] rounded-full px-5 h-10 hover:bg-primary/90 shadow-xl uppercase tracking-widest border-none shrink-0"
            >
              PASANG <Download className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center justify-center p-2 rounded-xl bg-white/10 text-primary shrink-0">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
