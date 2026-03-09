
'use client';

import { cn } from "@/lib/utils";

/**
 * Logo resmi AliBank "S-Infinity".
 * Desain Zig-Zag Modern dalam bingkai rounded square.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
    >
      {/* Bingkai Luar - Rounded Square */}
      <rect 
        x="10" y="10" width="80" height="80" rx="22" 
        stroke="currentColor" 
        strokeWidth="6" 
        fill="none"
      />
      {/* Bentuk S - Zig Zag Modern */}
      <path 
        d="M65 30L35 42L65 58L35 70" 
        stroke="currentColor" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
