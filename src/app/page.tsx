
"use client";

import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Menu, 
  Headset, 
  Maximize, 
  Search, 
  Copy, 
  ChevronDown, 
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Award,
  CirclePlay,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("bursa");

  const userDocRef = useMemo(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(userDocRef);

  useEffect(() => {
    setMounted(true);
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet telah disalin ke clipboard." });
    }
  };

  if (!mounted || userLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-2xl gold-gradient animate-pulse flex items-center justify-center p-3">
          <LogoIcon className="text-white" />
        </div>
      </div>
    );
  }

  const services = [
    { name: "Alpha", icon: "/icons/alpha.svg", color: "bg-blue-50 text-blue-600" },
    { name: "Sekuritas", icon: "/icons/security.svg", color: "bg-purple-50 text-purple-600" },
    { name: "Earn", icon: "/icons/earn.svg", color: "bg-yellow-50 text-yellow-600" },
    { name: "Referral", icon: "/icons/referral.svg", color: "bg-green-50 text-green-600" },
    { name: "Lainnya", icon: "/icons/more.svg", color: "bg-gray-50 text-gray-600" },
  ];

  const marketData = [
    { name: "ALIX", symbol: "ALIX", price: "12.450", change: "+4.85", isUp: true, tags: ["Sovereign", "AI"] },
    { name: "PIXEL", symbol: "PIXEL", price: "0,50607", change: "-10,19", isUp: false, tags: ["AI"] },
    { name: "扭羊歌", symbol: "KAT", price: "4,7939", change: "-13,17", isUp: false, tags: ["AI", "Meme"] },
  ];

  return (
    <div className="min-h-screen bg-white pb-24 text-slate-900 selection:bg-yellow-200">
      {/* Top Header Navigation */}
      <header className="px-4 pt-4 pb-2 sticky top-0 z-50 bg-white border-b border-slate-50">
        <div className="flex items-center justify-between gap-4 mb-4">
          <Button variant="ghost" size="icon" className="text-slate-900 h-8 w-8">
            <Menu className="w-6 h-6" />
          </Button>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('bursa')}
              className={cn(
                "px-6 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'bursa' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
              )}
            >
              Bursa
            </button>
            <button 
              onClick={() => setActiveTab('dompet')}
              className={cn(
                "px-6 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'dompet' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
              )}
            >
              Dompet
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Headset className="w-5 h-5 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize className="w-5 h-5 text-slate-600" />
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Pencarian Teratas: PIXEL" 
            className="h-11 pl-11 pr-4 bg-slate-50 border-none rounded-full text-sm font-medium placeholder:text-slate-400"
          />
        </div>
      </header>

      <main className="px-4 pt-2">
        {/* Profile & Wallet Switcher */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center p-1">
              <LogoIcon className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-900">AliBank</span>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </div>
          <button onClick={copyAddress} className="p-1 hover:bg-slate-100 rounded">
            <Copy className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Big Balance Section */}
        <div className="flex justify-between items-center mb-8 px-1">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 italic">
              Rp{(userData?.totalBalance ?? 0).toLocaleString('id-ID')}
            </h1>
          </div>
          <Button 
            onClick={() => router.push('/crypto/receive')}
            className="bg-[#FCD535] hover:bg-[#FCD535]/90 text-slate-900 font-bold px-8 h-11 rounded-lg border-none shadow-none text-sm"
          >
            Terima
          </Button>
        </div>

        {/* Service Grid Icons */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {services.map((service, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                <LayoutGrid className="w-6 h-6 text-slate-700" />
              </div>
              <span className="text-[10px] font-bold text-slate-600">{service.name}</span>
            </div>
          ))}
        </div>

        {/* Promo Carousel Card */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 mb-6 flex items-center justify-between shadow-sm relative overflow-hidden group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-xl italic shadow-lg">K</div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Berbagi 35 Juta KAT bersama Katana</h3>
            </div>
          </div>
          <Button className="bg-[#FCD535] hover:bg-[#FCD535]/90 text-slate-900 font-bold text-[10px] h-8 px-4 rounded-md shadow-none">Ikuti</Button>
          
          {/* Carousel dots indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-3 h-1 bg-slate-900 rounded-full" />
            <div className="w-1 h-1 bg-slate-200 rounded-full" />
          </div>
        </div>

        {/* Quick Earn Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group cursor-pointer">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 italic">Meme Rush</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-xl font-black text-slate-900 tracking-tighter">2,66K <span className="text-[10px] font-bold text-slate-400 block uppercase">token baru dalam 1 jam</span></p>
            <div className="flex items-center gap-1 mt-3">
              <div className="w-5 h-5 rounded-full bg-orange-500 border border-white" />
              <div className="w-5 h-5 rounded-full bg-blue-500 -ml-2 border border-white" />
              <div className="w-5 h-5 rounded-full bg-green-500 -ml-2 border border-white" />
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 group cursor-pointer">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-500 italic">Earn</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-xl font-black text-green-600 tracking-tighter">9% <span className="text-[10px] font-bold text-slate-400 block uppercase">APY</span></p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[8px] text-white font-bold italic border border-white shadow-sm">W</div>
              <span className="text-[10px] font-black text-slate-900 italic">WETH</span>
            </div>
          </div>
        </div>

        {/* Market List Section */}
        <div className="space-y-6 px-1">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-1">
              <button className="text-sm font-bold text-slate-400 shrink-0">Daftar Pantauan</button>
              <button className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 shrink-0">Pencarian Populer</button>
              <button className="text-sm font-bold text-slate-400 shrink-0">Sedang Tren</button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <Badge className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-[10px] border-none font-bold uppercase italic"><LayoutGrid className="w-3 h-3 mr-1" /> Semua</Badge>
            <Badge variant="outline" className="bg-white text-slate-400 rounded-lg px-3 py-1.5 text-[10px] border-slate-100 font-bold uppercase">BSC</Badge>
            <Badge variant="outline" className="bg-white text-slate-400 rounded-lg px-3 py-1.5 text-[10px] border-slate-100 font-bold uppercase">Solana</Badge>
            <Badge variant="outline" className="bg-white text-slate-400 rounded-lg px-3 py-1.5 text-[10px] border-slate-100 font-bold uppercase">Ethereum</Badge>
          </div>

          <div className="space-y-6 pt-2">
            {marketData.map((coin, idx) => (
              <div key={idx} onClick={() => router.push(`/crypto/trade/${coin.symbol.toLowerCase()}`)} className="flex items-center justify-between group cursor-pointer active:bg-slate-50 p-1 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
                    {coin.symbol === 'ALIX' ? <LogoIcon className="text-yellow-400 p-2" /> : <div className="text-white font-black italic">{coin.symbol[0]}</div>}
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center p-0.5">
                      <LogoIcon className="text-slate-900" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-slate-900 italic tracking-tight">{coin.name}</span>
                      <div className="flex gap-1">
                        {coin.tags.map((tag, tIdx) => (
                          <Badge key={tIdx} className="bg-green-50 text-green-600 text-[7px] px-1 py-0 border-none font-black h-3">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Rp17,93M | Rp503,38M</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 italic tracking-tighter">Rp{coin.price}</p>
                  <p className={cn(
                    "text-xs font-black italic tracking-tighter mt-0.5",
                    coin.isUp ? "text-green-600" : "text-rose-500"
                  )}>
                    {coin.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
