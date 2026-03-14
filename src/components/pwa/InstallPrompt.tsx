"use client";

import { useState, useEffect } from "react";
import { X, Download, PlusSquare, Sparkles, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/ui/logo";

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Jangan munculkan prompt jika sudah terinstal
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
    <div className="fixed bottom-24 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500 max-w-lg mx-auto">
      <div className="liquid-glass-dark bg-accent/95 border-primary/20 p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 gold-gradient opacity-10" />
        
        <button 
          onClick={() => {
            setShowPrompt(false);
            if (isIOS) localStorage.setItem("ios-pwa-prompt-seen", "true");
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 shadow-lg p-3 border border-white/20">
            <LogoIcon className="text-primary" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-primary text-white text-[7px] font-black h-4 px-1">NATIVE EXP</Badge>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter italic flex items-center gap-2">
                Install AliBank <Sparkles className="w-3 h-3 text-primary" />
              </h3>
            </div>
            <p className="text-[10px] text-white/70 font-medium leading-tight">
              {isIOS 
                ? "Tap ikon 'Bagikan' lalu 'Tambah ke Layar Utama' untuk memasang aplikasi iOS." 
                : "Pasang AliBank ke Android Anda untuk akses cepat tanpa browser."}
            </p>
          </div>

          {!isIOS ? (
            <Button 
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary text-white font-black text-[10px] rounded-full px-6 h-10 hover:bg-primary/90 shadow-lg uppercase tracking-widest border-none"
            >
              PASANG <Download className="w-3 h-3 ml-2" />
            </Button>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/10 border border-white/10 text-primary">
              <Smartphone className="w-5 h-5 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { Badge } from "../ui/badge";
