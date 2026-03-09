
"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      const hasSeenPrompt = localStorage.getItem("ios-pwa-prompt-seen");
      if (!hasSeenPrompt) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 max-w-lg mx-auto">
      <div className="liquid-glass-dark bg-accent/95 border-primary/20 p-5 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 gold-gradient opacity-10" />
        
        <button 
          onClick={() => setShowPrompt(false)}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg p-2.5">
            <LogoIcon className="text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-sm font-black text-white uppercase tracking-tighter italic">Pasang AliBank</h3>
            <p className="text-[10px] text-white/70 font-medium leading-tight mt-0.5">
              {isIOS 
                ? "Tap ikon 'Bagikan' lalu 'Tambah ke Layar Utama' untuk akses elit." 
                : "Nikmati perbankan premium langsung dari layar utama Anda."}
            </p>
          </div>

          {!isIOS ? (
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary text-white font-black text-[10px] rounded-full px-5 h-9 hover:bg-primary/90 shadow-md uppercase tracking-widest"
            >
              Pasang <Download className="w-3 h-3 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white/10">
              <PlusSquare className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
