
import { cn } from "@/lib/utils";

/**
 * Logo resmi AliBank "Bintang Kejora".
 * Desain Bintang Empat Sudut Melengkung yang elegan dalam bingkai rounded square.
 * Menggunakan suppressHydrationWarning untuk mencegah error hydration pada elemen SVG.
 */
export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={cn("w-full h-full", className)}
      suppressHydrationWarning
    >
      <rect 
        x="10" y="10" width="80" height="80" rx="22" 
        stroke="currentColor" 
        strokeWidth="6" 
        fill="none"
      />
      <path 
        d="M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z" 
        fill="currentColor"
      />
    </svg>
  );
}
