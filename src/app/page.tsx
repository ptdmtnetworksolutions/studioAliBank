
"use client";

import { useUser, useDoc, useFirestore } from "@/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Menu, 
  Headset, 
  Maximize, 
  Search, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  ChevronRight,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Zap,
  Award,
  Bell,
  Scan,
  User,
  X,
  CreditCard,
  ArrowRightLeft,
  CirclePlay,
  ArrowRight,
  Landmark,
  HandCoins,
  Globe,
  Trophy,
  ListTodo,
  ShoppingBag,
  Download,
  Users,
  Flame,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo, Suspense } from "react";
import { doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { currencies, type Currency } from "@/lib/currencies";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'bursa' | 'dompet'>('bursa');
  const [bannerApi, setBannerApi] = useState<CarouselApi>();
  const [swiftApi, setSwiftApi] = useState<CarouselApi>();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentSwift, setCurrentSwift] = useState(0);
  const [isTambahDanaOpen, setIsTambahDanaOpen] = useState(false);
  const [isTambahDanaExpanded, setIsTambahDanaExpanded] = useState(false);
  
  // Market Tabs State
  const [marketFilter, setMarketFilter] = useState("Populer");
  const [assetCategory, setAssetCategory] = useState("Kripto");

  // Dynamic Currency State
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currencies.find(c => c.code === "IDR")!);

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

    const savedCurrency = localStorage.getItem("alibank-payment-currency");
    if (savedCurrency) {
      try {
        setSelectedCurrency(JSON.parse(savedCurrency));
      } catch (e) {}
    }

    if (searchParams.get('open') === 'add_funds') {
      setIsTambahDanaOpen(true);
    }
  }, [user, userLoading, router, searchParams]);

  useEffect(() => {
    if (!bannerApi) return;
    bannerApi.on("select", () => {
      setCurrentBanner(bannerApi.selectedScrollSnap());
    });
  }, [bannerApi]);

  useEffect(() => {
    if (!swiftApi) return;
    swiftApi.on("select", () => {
      setCurrentSwift(swiftApi.selectedScrollSnap());
    });
  }, [swiftApi]);

  const copyAddress = () => {
    if (userData?.walletAddress) {
      navigator.clipboard.writeText(userData.walletAddress);
      toast({ title: "Alamat Disalin", description: "Alamat dompet telah disalin ke clipboard." });
    }
  };

  const openAddFunds = () => {
    setIsTambahDanaOpen(true);
    router.push('/?open=add_funds', { scroll: false });
  };

  const closeAddFunds = (open: boolean) => {
    setIsTambahDanaOpen(open);
    if (!open) {
      setIsTambahDanaExpanded(false);
      router.push('/', { scroll: false });
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
    { name: "Alpha", color: "bg-blue-50 text-blue-600" },
    { name: "Sekuritas", color: "bg-purple-50 text-purple-600" },
    { name: "Earn", color: "bg-yellow-50 text-yellow-600" },
    { name: "Referral", color: "bg-green-50 text-green-600" },
    { name: "Lainnya", color: "bg-gray-50 text-gray-600" },
  ];

  const marketCoins = [
    { symbol: "BNB", price: "611.94", idr: "10.390.735,08", change: "-2.83", isUp: false },
    { symbol: "BTC", price: "66.262,29", idr: "1.125.133.021,58", change: "-3.76", isUp: false },
    { symbol: "ETH", price: "1.987,12", idr: "33.741.277,73", change: "-3.98", isUp: false },
    { symbol: "SOL", price: "82.63", idr: "1.403.056,57", change: "-4.69", isUp: false },
    { symbol: "WLD", price: "0.2480", idr: "4.211,04", change: "-15.04", isUp: false },
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F7] pb-32 text-slate-900 selection:bg-yellow-200">
      {/* Top Header Navigation */}
      <header className="px-4 pt-4 pb-2 sticky top-0 z-50 bg-[#F7F7F7]">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-500" />
            </div>
            <div className="relative">
              <Bell className="w-6 h-6 text-slate-700" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FCD535] text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#F7F7F7]">18</span>
            </div>
          </div>
          
          <div className="flex bg-slate-200/60 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('bursa')}
              className={cn(
                "px-6 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'bursa' ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              )}
            >
              Bursa
            </button>
            <button 
              onClick={() => setActiveTab('dompet')}
              className={cn(
                "px-6 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'dompet' ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
              )}
            >
              Dompet
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Headset className="w-6 h-6 text-slate-700" />
            <Scan className="w-6 h-6 text-slate-700" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder={activeTab === 'bursa' ? "BTC Turun 5% Geopolitik" : "Cari Koin..."}
            className="h-11 pl-11 pr-4 bg-white border-none rounded-md text-sm font-medium placeholder:text-slate-400 shadow-sm"
          />
        </div>
      </header>

      <main className="px-4 pt-2">
        {activeTab === 'bursa' ? (
          /* BURSA VIEW (EXCHANGE) */
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Balance Section */}
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="text-xs font-bold">Estimasi Total Nilai(IDR)</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900">
                  Rp{(userData?.totalBalance ?? 0).toLocaleString('id-ID')}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-slate-400">PNL hari ini</span>
                  <span className="text-rose-500">-Rp0.04042939 (-0.20%)</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
              <Button className="bg-[#FCD535] hover:bg-[#FCD535]/90 text-slate-900 font-bold px-4 h-10 rounded-lg shadow-none text-xs" onClick={openAddFunds}>
                Tambah Dana
              </Button>
            </div>

            {/* AliBank Banner Carousel */}
            <div className="relative group">
              <Carousel setApi={setBannerApi} className="w-full">
                <CarouselContent>
                  <CarouselItem>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-sm relative cursor-pointer h-[100px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
                          <Award className="w-6 h-6 text-slate-900" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tantangan AliBank</p>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">Hadiah Bersama 500.000 ALIX</h3>
                        </div>
                      </div>
                      <Button className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[10px] h-8 px-4 rounded-md shadow-none shrink-0">Ikuti</Button>
                      <button className="absolute top-2 right-2 text-slate-300 hover:text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CarouselItem>

                  <CarouselItem>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-sm relative cursor-pointer h-[100px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0">
                          <Trophy className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Turnamen Referral Bulan Maret</p>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">Undang Teman, Raih Hadiah 3.000 USDC!</h3>
                        </div>
                      </div>
                      <Button className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[10px] h-8 px-4 rounded-md shadow-none shrink-0">Ikuti</Button>
                      <button className="absolute top-2 right-2 text-slate-300 hover:text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CarouselItem>

                  <CarouselItem>
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center justify-between shadow-sm relative cursor-pointer h-[100px]">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center border border-yellow-100 shrink-0">
                          <ListTodo className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[11px] font-medium text-slate-400">Tugas yang Menunggu</p>
                          <h3 className="text-sm font-black text-slate-900 leading-tight">Beberapa tindakan tugas perlu dilakukan</h3>
                          <p className="text-[10px] text-slate-400 font-medium">2 tugas harus diselesaikan</p>
                        </div>
                      </div>
                      <Button className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[10px] h-8 px-4 rounded-md shadow-none shrink-0">Lihat</Button>
                      <button className="absolute top-2 right-2 text-slate-300 hover:text-slate-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CarouselItem>
                </CarouselContent>
              </Carousel>
              
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                <div className={cn("h-1 rounded-full transition-all duration-300", currentBanner === 0 ? "w-4 bg-slate-900" : "w-1.5 bg-slate-200")} />
                <div className={cn("h-1 rounded-full transition-all duration-300", currentBanner === 1 ? "w-4 bg-slate-900" : "w-1.5 bg-slate-200")} />
                <div className={cn("h-1 rounded-full transition-all duration-300", currentBanner === 2 ? "w-4 bg-slate-900" : "w-1.5 bg-slate-200")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm group cursor-pointer relative overflow-hidden h-40">
                <Carousel setApi={setSwiftApi} className="w-full h-full">
                  <CarouselContent className="h-full ml-0">
                    <CarouselItem className="pl-0 h-full" onClick={() => router.push('/crypto/deposit-methods?type=setor')}>
                      <div className="p-4 h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-xs">$</div>
                          <span className="text-xs font-black text-slate-400">USD</span>
                        </div>
                        <Badge className="bg-green-100 text-green-600 text-[8px] font-black h-4 px-1.5 mb-2 border-none w-fit uppercase">Setor</Badge>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Transfer Bank (SWIFT)</h4>
                        <div className="mt-auto">
                          <Landmark className="w-6 h-6 text-slate-900" />
                        </div>
                      </div>
                    </CarouselItem>
                    
                    <CarouselItem className="pl-0 h-full" onClick={() => router.push('/crypto/deposit-methods?type=tarik')}>
                      <div className="p-4 h-full flex flex-col bg-slate-50/30">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center font-bold text-xs">$</div>
                          <span className="text-xs font-black text-slate-400">USD</span>
                        </div>
                        <Badge className="bg-red-100 text-red-600 text-[8px] font-black h-4 px-1.5 mb-2 border-none w-fit uppercase">Tarik</Badge>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">Transfer Bank (SWIFT)</h4>
                        <div className="mt-auto">
                          <Landmark className="w-6 h-6 text-slate-900 opacity-60" />
                        </div>
                      </div>
                    </CarouselItem>
                  </CarouselContent>
                </Carousel>
                
                <div className="absolute bottom-3 right-4 flex gap-1 z-10">
                  <div className={cn("h-1 rounded-full transition-all duration-300", currentSwift === 0 ? "w-3 bg-slate-900" : "w-1 bg-slate-200")} />
                  <div className={cn("h-1 rounded-full transition-all duration-300", currentSwift === 1 ? "w-3 bg-slate-900" : "w-1 bg-slate-200")} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm group cursor-pointer relative overflow-hidden h-40">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-400">Kirim Tunai</span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
                <p className="text-[11px] font-black text-slate-900 mt-2 leading-tight">Kirim Kripto dan Terima Fiat</p>
                <div className="mt-4">
                  <p className="text-[8px] font-bold text-slate-400 uppercase">Kurs Ref.</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-black text-slate-900">Rp17,062</p>
                      <p className="text-[8px] font-bold text-slate-400">USDT/IDR</p>
                    </div>
                    <div className="h-6 w-12">
                      <svg viewBox="0 0 100 40" className="w-full h-full">
                        <path d="M0 30 Q 30 10, 60 30 T 100 10" fill="none" stroke="#16a34a" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW SECTION: Market List (As seen in reference image) */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-2 gap-6">
                {["Favorit", "Populer", "Alpha", "Baru", "Tertinggi"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setMarketFilter(tab)}
                    className={cn(
                      "text-sm font-bold transition-all shrink-0",
                      marketFilter === tab ? "text-slate-900 border-b-2 border-slate-900 pb-1" : "text-slate-400"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setAssetCategory("Kripto")}
                  className={cn("text-sm font-black italic tracking-tight transition-colors", assetCategory === "Kripto" ? "text-slate-900" : "text-slate-300")}
                >
                  Kripto
                </button>
                <button 
                  onClick={() => setAssetCategory("Futures")}
                  className={cn("text-sm font-black italic tracking-tight transition-colors", assetCategory === "Futures" ? "text-slate-900" : "text-slate-300")}
                >
                  Futures
                </button>
              </div>

              <div className="grid grid-cols-3 text-[10px] font-bold text-slate-300 uppercase tracking-widest px-1">
                <span>Nama</span>
                <span className="text-right">Harga Terakhir</span>
                <span className="text-right">Prbh% 24j</span>
              </div>

              <div className="space-y-6">
                {marketCoins.map((coin) => (
                  <div key={coin.symbol} className="grid grid-cols-3 items-center group cursor-pointer active:opacity-70 transition-opacity">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black italic tracking-tight text-slate-900">{coin.symbol}</span>
                      <Flame className="w-3.5 h-3.5 text-yellow-500" />
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-sm font-black italic tracking-tight text-slate-900">{coin.price}</p>
                      <p className="text-[9px] font-bold text-slate-300">Rp{coin.idr}</p>
                    </div>
                    <div className="flex justify-end">
                      <div className={cn(
                        "w-20 py-1.5 rounded-lg flex items-center justify-center text-[11px] font-black italic shadow-sm",
                        coin.isUp ? "bg-green-500 text-white" : "bg-rose-500 text-white"
                      )}>
                        {coin.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full text-center py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
                Tampilkan Selengkapnya
              </button>
            </div>

            {/* Announcement Section */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-black italic tracking-tight text-slate-900">Pengumuman</h2>
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm min-h-[100px] flex items-center justify-center text-center">
                <p className="text-xs font-bold text-slate-400">Belum ada pengumuman terbaru.</p>
              </div>
            </div>
          </div>
        ) : (
          /* DOMPET VIEW (WALLET) */
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center p-1">
                  <LogoIcon className="text-white" />
                </div>
                <span className="text-sm font-bold text-slate-900">AliBank Private</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <button onClick={copyAddress} className="p-1 hover:bg-slate-100 rounded">
                <Copy className="w-4 h-4 text-slate-400" />
              </button>
            </div>

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

            <div className="grid grid-cols-5 gap-4 mb-8">
              {services.map((service, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                    <LayoutGrid className="w-6 h-6 text-slate-700" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{service.name}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6 px-1">
              <div className="flex items-center justify-between">
                <div className="flex gap-6 overflow-x-auto no-scrollbar pb-1">
                  <button className="text-sm font-bold text-slate-400 shrink-0">Daftar Pantauan</button>
                  <button className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-1 shrink-0">Pencarian Populer</button>
                  <button className="text-sm font-bold text-slate-400 shrink-0">Sedang Tren</button>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                {marketCoins.slice(0, 3).map((coin, idx) => (
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
                          <span className="text-sm font-black text-slate-900 italic tracking-tight">{coin.symbol}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Vol 24h: Rp503,38M</p>
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
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) - AI Sparkles */}
      <div className="fixed bottom-24 right-6 z-40">
        <button 
          onClick={() => router.push('/ai-assistant')}
          className="w-14 h-14 gold-gradient rounded-2xl shadow-[0_15px_30px_rgba(184,134,11,0.3)] flex items-center justify-center text-white active:scale-90 transition-transform group"
        >
          <Sparkles className="w-7 h-7 group-hover:rotate-12 transition-transform" />
        </button>
      </div>

      {/* Bottom Sheet Tambah Dana */}
      <Sheet open={isTambahDanaOpen} onOpenChange={closeAddFunds}>
        <SheetContent side="bottom" className="rounded-t-[2.5rem] p-0 border-none bg-white h-auto pb-10">
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-6" />
          <div className="px-6 space-y-8">
            <div className="flex items-center justify-between">
              <SheetHeader>
                <SheetTitle className="text-xl font-black text-slate-900 tracking-tight">Tambah Dana</SheetTitle>
                <SheetDescription className="sr-only">Pilih metode untuk menambahkan dana ke akun AliBank Anda.</SheetDescription>
              </SheetHeader>
              <div 
                className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-full border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                onClick={() => { router.push('/settings/payment-currency'); }}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white",
                  selectedCurrency.color
                )}>
                  {selectedCurrency.symbol.length > 2 ? selectedCurrency.code[0] : selectedCurrency.symbol}
                </div>
                <span className="text-xs font-black text-slate-900">{selectedCurrency.code}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            <div className="space-y-4">
              <div 
                className="p-6 rounded-[1.5rem] border border-slate-100 bg-white flex items-center gap-5 active:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/buy'); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                  <ShoppingBag className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 italic uppercase tracking-tight leading-none">Beli dengan {selectedCurrency.code}</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1.5 leading-tight">Manfaatkan berbagai cara pembayaran!</p>
                </div>
              </div>

              <div 
                className="p-6 rounded-[1.5rem] border border-slate-100 bg-white flex items-center gap-5 active:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/receive'); }}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 italic uppercase tracking-tight leading-none">Penyetoran On-Chain</h3>
                  <p className="text-xs font-bold text-slate-400 mt-1.5 leading-tight">Setor kripto dari bursa/dompet lain ke AliBank</p>
                </div>
              </div>

              {isTambahDanaExpanded && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div 
                    className="p-6 rounded-[1.5rem] border border-slate-100 bg-white flex items-center gap-5 active:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                    onClick={() => { setIsTambahDanaOpen(false); router.push('/p2p/order-history'); }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 italic uppercase tracking-tight leading-none">Beli Kripto dari P2P</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1.5 leading-tight">Transfer Bank, Transfer Dompet Digital, Pembayaran Seluler, dan banyak lagi</p>
                    </div>
                  </div>

                  <div 
                    className="p-6 rounded-[1.5rem] border border-slate-100 bg-white flex items-center gap-5 active:bg-slate-50 transition-all cursor-pointer group shadow-sm"
                    onClick={() => { setIsTambahDanaOpen(false); router.push('/crypto/receive'); }}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
                      <HandCoins className="w-6 h-6 text-slate-900" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 italic uppercase tracking-tight leading-none">Terima melalui AliBank Pay</h3>
                      <p className="text-xs font-bold text-slate-400 mt-1.5 leading-tight">Terima kripto dari pengguna AliBank lain.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsTambahDanaExpanded(!isTambahDanaExpanded)}
              className="w-full flex items-center justify-center gap-1 text-[10px] font-black text-slate-400 py-2 hover:text-slate-600 transition-colors uppercase tracking-widest"
            >
              {isTambahDanaExpanded ? (
                <>Lihat Lebih Sedikit <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Tampilkan Selengkapnya <ChevronDown className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
