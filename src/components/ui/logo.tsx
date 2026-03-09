
'use client';

import { cn } from "@/lib/utils";

/**
 * Logo resmi AliBank "S-Infinity".
 * Desain kustom sesuai referensi gambar: Bentuk S dalam bingkai rounded square.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      {/* Bingkai Luar - Rounded Octagon/Square */}
      <rect 
        x="10" y="10" width="80" height="80" rx="22" 
        stroke="currentColor" 
        strokeWidth="6" 
        className="text-primary"
      />
      {/* Bentuk S - Stylized Zig Zag Modern */}
      <path 
        d="M65 30L35 42L65 58L35 70" 
        stroke="currentColor" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}
