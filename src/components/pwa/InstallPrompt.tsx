
"use client";

import { useState, useEffect } from "react";
import { X, Download, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
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

  if (!mounted || !showPrompt) return null;

  return (
    <div className="fixed top-24 left-4 right-4 z-[100] animate-in slide-in-from-top-10 fade-in duration-500 max-w-lg mx-auto">
      <div className="liquid-glass-dark bg-accent/95 border-primary/20 p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 gold-gradient opacity-10" />
        
        <button 
          onClick={() => {
            setShowPrompt(false);
            if (isIOS) localStorage.setItem("ios-pwa-prompt-seen", "true");
          }}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg p-2.5 border border-white/20">
            <LogoIcon className="text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <Badge className="bg-primary text-white text-[6px] font-black h-3 px-1 leading-none">NATIVE EXP</Badge>
              <h3 className="text-[11px] font-black text-white uppercase tracking-tighter italic flex items-center gap-1">
                Install AliBank <Sparkles className="w-2.5 h-2.5 text-primary" />
              </h3>
            </div>
            <p className="text-[9px] text-white/70 font-medium leading-tight line-clamp-2">
              {isIOS 
                ? "Tap 'Bagikan' lalu 'Tambah ke Layar Utama'." 
                : "Pasang AliBank ke layar utama untuk akses cepat."}
            </p>
          </div>

          {!isIOS ? (
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary text-white font-black text-[9px] rounded-full px-4 h-8 hover:bg-primary/90 shadow-lg uppercase tracking-widest border-none shrink-0"
            >
              PASANG <Download className="w-3 h-3 ml-1.5" />
            </Button>
          ) : (
            <div className="flex items-center justify-center p-2 rounded-xl bg-white/10 border border-white/10 text-primary shrink-0">
              <Smartphone className="w-4 h-4 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
