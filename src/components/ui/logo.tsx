
'use client';

import { cn } from "@/lib/utils";

/**
 * Logo resmi AliBank "Bintang Kejora".
 * Replikasi dari desain sparkle kustom dengan dua bintang empat sudut.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      {/* Bintang Utama */}
      <path 
        d="M12 4C12 4 13.2 10.5 19 12C13.2 13.5 12 20 12 20C12 20 10.8 13.5 5 12C10.8 10.5 12 4 12 4Z" 
        fill="currentColor" 
        stroke="currentColor" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Bintang Kecil Kiri Bawah */}
      <path 
        d="M6 17C6 17 6.6 19.5 8.5 20.5C6.6 21.5 6 24 6 24C6 24 5.4 21.5 3.5 20.5C5.4 19.5 6 17 6 17Z" 
        fill="currentColor"
      />
      {/* Sparkle Kecil Kiri Atas */}
      <circle cx="5" cy="8" r="1" fill="currentColor" />
    </svg>
  );
}
