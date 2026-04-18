
"use client";

import { useUser, useDoc, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  ChevronDown, 
  ChevronUp,
  LayoutGrid,
  Zap,
  Bell,
  User,
  History,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Loader2,
  Skull,
  ShieldAlert,
  Send,
  Download,
  DollarSign,
  ArrowRightLeft,
  ChevronRight,
  MessageSquareText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState, useEffect, useMemo, useCallback } from "react";
import { doc, collection, query, orderBy, limit, increment, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies } from "@/lib/currencies";

export default function RootPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
      return;
    }
    
    // REDIRECT MOBILE USERS TO /m/
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.replace('/m/home');
    }
  }, [user, userLoading, router]);

  // REDIRECT TO DISCOVER DESKTOP (IF IN ROOT)
  useEffect(() => {
    if (mounted && user && typeof window !== "undefined" && window.innerWidth >= 768) {
      router.push('/crypto');
    }
  }, [mounted, user, router]);

  if (!mounted || userLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
        <LogoIcon className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-10">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-24 h-24 rounded-[2rem] gold-gradient mx-auto flex items-center justify-center p-6 shadow-2xl mb-8">
           <LogoIcon className="text-white" />
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">AliBank V3 Console</h1>
        <p className="text-sm font-medium text-muted-foreground uppercase italic tracking-widest">
          Redirecting to Secure Discover Node...
        </p>
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}
