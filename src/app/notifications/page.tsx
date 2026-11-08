"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { 
  ArrowLeft, 
  Settings, 
  MessageSquareText, 
  Volume2, 
  Gift, 
  ShieldCheck, 
  Loader2,
  CheckCheck,
  ArrowRightLeft,
  ChevronLeft,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Filter,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type NotificationCategory = {
  id: string;
  name: string;
  icon: any;
  description: string;
};

const CATEGORIES: NotificationCategory[] = [
  { id: 'transaksi', name: "Transaksi & Transfer", icon: ArrowRightLeft, description: "Mutasi saldo, setor, tarik, & pembayaran SoftPOS" },
  { id: 'akun', name: "Keamanan & Akun", icon: ShieldCheck, description: "Otentikasi, device login, limit, & status KYC" },
  { id: 'pengumuman', name: "Pengumuman Sistem", icon: Volume2, description: "Pembaruan node, jadwal kliring, & protokol bank" },
  { id: 'marketing', name: "Promo & Hadiah", icon: Gift, description: "Staking reward ALX, cashback, & kampanye VIP" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.title = "Pesan & Notifikasi - AliBank V 3.1";
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: realNotifications, isLoading: loading } = useCollection<any>(notificationsQuery);

  const isNotificationInCategory = (n: any, catId: string) => {
    const t = (n.title || "").toLowerCase();
    const type = (n.type || "").toLowerCase();
    
    if (catId === 'transaksi') {
      return t.includes('top up') || t.includes('transfer') || t.includes('dana') || 
             t.includes('bayar') || t.includes('pencairan') || t.includes('settlement') || 
             t.includes('beli') || t.includes('jual') || t.includes('withdraw') || 
             t.includes('penarikan') || t.includes('klaim yield') || t.includes('softpos') ||
             t.includes('edc');
    }
    if (catId === 'akun') {
      return t.includes('akun') || t.includes('device') || t.includes('signature') || 
             t.includes('password') || t.includes('profil') || t.includes('pembekuan') || 
             t.includes('keamanan') || type === 'alert';
    }
    if (catId === 'marketing') {
      return t.includes('reward') || t.includes('promo') || t.includes('hadiah') || 
             t.includes('turnamen') || t.includes('kampanye');
    }
    if (catId === 'pengumuman') {
      return type === 'info' || t.includes('pengumuman') || t.includes('sistem') || 
             t.includes('mainnet') || t.includes('pemeliharaan');
    }
    return false;
  };

  const getCategoryData = (catId: string) => {
    if (!realNotifications) return { latest: null, unreadCount: 0 };
    
    const filtered = realNotifications.filter(n => isNotificationInCategory(n, catId));
    const unread = filtered.filter(n => !n.read).length;
    return { 
      latest: filtered[0] || null, 
      unreadCount: unread 
    };
  };

  const handleMarkAllRead = async () => {
    if (!db || !user || !realNotifications) return;
    const batch = writeBatch(db);
    let count = 0;
    realNotifications.forEach(n => {
      if (!n.read) {
        batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
        count++;
      }
    });
    if (count > 0) {
      await batch.commit();
      toast({ 
        title: "Seluruh Pesan Ditandai Dibaca", 
        description: `${count} notifikasi telah berhasil diperbarui ke status terbaca.` 
      });
    } else {
      toast({ 
        title: "Pusat Pesan Bersih", 
        description: "Tidak ada notifikasi baru yang belum dibaca." 
      });
    }
  };

  const markAsRead = async (id: string) => {
    if (!db || !user) return;
    const ref = doc(db, "users", user.uid, "notifications", id);
    await updateDoc(ref, { read: true });
  };

  const displayedNotifications = realNotifications ? (
    selectedCategory 
      ? realNotifications.filter((n: any) => isNotificationInCategory(n, selectedCategory))
      : realNotifications
  ) : [];

  const totalUnreadCount = realNotifications 
    ? realNotifications.filter((n: any) => !n.read).length 
    : 0;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
      </div>
    );
  }

  // ─── MOBILE RENDERING ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col font-sans selection:bg-[#F4B728] selection:text-black">
        {/* Header */}
        <header className="px-4 h-16 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50 border-b border-[#DFDAD0]">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#111111]" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-serif text-base font-bold text-[#111111] tracking-tight">Pesan & Notifikasi</h1>
            <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm mt-0.5">
              AliBank Event Node
            </span>
          </div>
          <button 
            onClick={handleMarkAllRead} 
            className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer text-[#111111]"
            title="Tandai semua dibaca"
          >
            <CheckCheck className="w-4 h-4" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
          {/* Categories Grid (Mobile) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">Kategori Notifikasi</h2>
              {selectedCategory && (
                <button 
                  onClick={() => setSelectedCategory(null)} 
                  className="text-[10px] font-mono font-bold text-[#111111] underline uppercase cursor-pointer"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {CATEGORIES.map((cat) => {
                const { latest, unreadCount } = getCategoryData(cat.id);
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                
                return (
                  <div 
                    key={cat.id} 
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className={cn(
                      "p-3 rounded-sm border transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-xs",
                      isSelected ? "bg-white border-[#111111] ring-1 ring-black" : "bg-white border-[#DFDAD0] hover:border-black"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      {unreadCount > 0 && (
                        <span className="bg-[#111111] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif text-xs font-bold text-[#111111]">{cat.name}</h3>
                      <p className="text-[10px] text-[#777777] font-light truncate mt-0.5">
                        {latest ? latest.title : "Tidak ada pesan"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Activity List (Mobile) */}
          <section className="space-y-3 pb-16">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-serif text-sm font-bold text-[#111111]">
                  {selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory)?.name : "Aktivitas Terbaru"}
                </h2>
              </div>
              <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#666666] rounded-sm">
                {displayedNotifications.length} Pesan
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-40">
                  <Loader2 className="w-7 h-7 animate-spin text-[#111111]" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">Sinkronisasi Node...</p>
                </div>
              ) : displayedNotifications.length > 0 ? (
                displayedNotifications.map((n: any) => (
                  <div 
                    key={n.id} 
                    className={cn(
                      "p-4 rounded-sm border transition-all cursor-pointer relative overflow-hidden bg-white shadow-xs",
                      n.read ? "border-[#DFDAD0] opacity-80" : "border-[#DFDAD0] ring-1 ring-[#111111]/10"
                    )}
                    onClick={() => !n.read && markAsRead(n.id)}
                  >
                    {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F4B728]" />}
                    
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border",
                          n.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                          n.type === 'alert' ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"
                        )}>
                          {n.type === 'success' ? 'Sukses' : n.type === 'alert' ? 'Peringatan' : n.type || 'Info'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-[#777777]">
                        <Clock className="w-3 h-3 text-[#999999]" />
                        <span>{new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-serif text-sm font-bold text-[#111111] tracking-tight">{n.title}</h3>
                    <p className="text-xs text-[#555555] font-light mt-1 leading-relaxed">{n.message}</p>

                    {(n.terminalId || n.approvalCode || n.settlementDestination) && (
                      <div className="mt-2.5 p-2.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[10px] space-y-1 font-mono text-[#555555]">
                        <div className="flex justify-between items-center">
                          <span>Terminal: <strong className="text-[#111111]">{n.terminalId || 'ALX-SOFTPOS-01'}</strong></span>
                          <span>Auth: <strong className="text-emerald-700 font-bold">{n.approvalCode || 'APPROVED'}</strong></span>
                        </div>
                        {n.rrn && (
                          <div className="flex justify-between items-center">
                            <span>RRN: <strong className="text-[#111111]">{n.rrn}</strong></span>
                            <span>Kartu: <strong className="text-[#111111]">{n.cardType || 'DEBIT'}</strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-16 text-center space-y-3 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-xs">
                  <MessageSquareText className="w-10 h-10 mx-auto text-[#AAAAAA]" />
                  <p className="font-serif text-sm font-bold text-[#111111]">Tidak Ada Notifikasi</p>
                  <p className="text-xs text-[#777777] font-light">Tidak ada pesan yang cocok dengan filter yang dipilih.</p>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    );
  }

  // ─── DESKTOP RENDERING (V 3.1 EDITORIAL PRIVATE BANKING) ───────────────────
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black w-full">
      {/* SIDEBAR NAVIGATION */}
      <Sidebar />

      {/* MAIN CONTAINER */}
      <main className="ml-64 flex-1 flex flex-col min-w-0 bg-[#FAF9F6] text-[#111111]">
        {/* HEADER */}
        <header className="h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">Pesan & Notifikasi</h2>
            <span className="text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#666666] rounded-sm">
              AliBank Event Ledger Node
            </span>
            {totalUnreadCount > 0 && (
              <span className="bg-[#111111] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm">
                {totalUnreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllRead} 
              className="px-3.5 py-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-4 h-4 text-[#F4B728]" />
              <span>Tandai Semua Dibaca</span>
            </button>
            <button 
              onClick={() => router.back()} 
              className="p-2.5 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] transition-colors cursor-pointer shadow-xs"
              title="Kembali"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <div className="p-8 space-y-8 max-w-[1300px] w-full mx-auto overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: CATEGORIES (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#777777]">Kategori Notifikasi</h3>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)} 
                    className="text-xs font-mono font-bold text-[#111111] hover:underline uppercase cursor-pointer"
                  >
                    Reset Filter [Semua]
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const { latest, unreadCount } = getCategoryData(cat.id);
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  
                  return (
                    <div 
                      key={cat.id} 
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className={cn(
                        "p-5 flex items-start gap-4 rounded-sm border transition-all cursor-pointer group bg-white shadow-xs relative overflow-hidden",
                        isSelected 
                          ? "border-[#111111] bg-[#FAF9F6] ring-1 ring-black shadow-sm" 
                          : "border-[#DFDAD0] hover:border-[#111111]"
                      )}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#111111]" />}

                      <div className={cn(
                        "w-10 h-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center shrink-0 group-hover:border-black transition-colors",
                        isSelected && "bg-[#111111] text-white border-black"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-serif text-sm font-bold text-[#111111] tracking-tight group-hover:text-black">
                            {cat.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-[#888888]">
                              {latest ? new Date(latest.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ""}
                            </span>
                            {unreadCount > 0 && (
                              <span className="bg-[#111111] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#666666] font-light leading-snug line-clamp-2">
                          {latest ? latest.message : cat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Indicator Card */}
              <div className="p-5 rounded-sm bg-white border border-[#DFDAD0] shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F4B728]" />
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111]">Protokol Notifikasi Ledger</h4>
                </div>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Semua aktivitas transaksi kliring, perubahan akun, dan otentikasi smart contract dicatat langsung ke dalam buku besar node AliBank dengan tanda waktu terverifikasi.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: FULL ACTIVITY LIST (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif text-sm font-bold text-[#111111]">
                    {selectedCategory ? `Aktivitas: ${CATEGORIES.find(c => c.id === selectedCategory)?.name}` : "Aktivitas Terbaru"}
                  </h3>
                </div>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#666666] rounded-sm">
                  {displayedNotifications.length} Pesan Terdaftar
                </span>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white border border-[#DFDAD0] rounded-sm shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">Sinkronisasi Node Log...</p>
                  </div>
                ) : displayedNotifications.length > 0 ? (
                  displayedNotifications.map((n: any) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-5 rounded-sm border transition-all cursor-pointer relative overflow-hidden bg-white shadow-xs hover:border-[#111111]",
                        n.read ? "border-[#DFDAD0] opacity-80" : "border-[#DFDAD0] ring-1 ring-[#111111]/10"
                      )}
                      onClick={() => !n.read && markAsRead(n.id)}
                    >
                      {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F4B728]" />}
                      
                      <div className="flex justify-between items-start mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={cn(
                            "font-mono text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-sm border",
                            n.type === 'success' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                            n.type === 'alert' ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200"
                          )}>
                            {n.type === 'success' ? 'Sukses' : n.type === 'alert' ? 'Peringatan' : n.type || 'Info'}
                          </span>
                          {!n.read && (
                            <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#F4B728]">
                              • Baru
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#777777]">
                          <Clock className="w-3.5 h-3.5 text-[#999999]" />
                          <span>{new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-serif text-base font-bold text-[#111111] tracking-tight">{n.title}</h4>
                      <p className="text-xs text-[#555555] font-light mt-1 leading-relaxed">{n.message}</p>

                      {(n.terminalId || n.approvalCode || n.settlementDestination) && (
                        <div className="mt-3.5 p-3 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[11px] font-mono text-[#555555] space-y-1.5">
                          <div className="flex justify-between items-center pb-1.5 border-b border-[#EAE6DF]">
                            <span>Terminal: <strong className="text-[#111111]">{n.terminalId || 'ALX-SOFTPOS-01'}</strong></span>
                            <span>Auth: <strong className="text-emerald-700 font-bold">{n.approvalCode || 'APPROVED'}</strong></span>
                          </div>
                          {n.rrn && (
                            <div className="flex justify-between items-center">
                              <span>RRN: <strong className="text-[#111111]">{n.rrn}</strong></span>
                              <span>Kartu: <strong className="text-[#111111]">{n.cardType || 'DEBIT'}</strong></span>
                            </div>
                          )}
                          {n.settlementDestination && (
                            <div className="pt-1.5 border-t border-[#EAE6DF] text-[10px]">
                              <span>Penyaluran Dana: </span>
                              <strong className="text-[#111111]">{n.settlementDestination}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-3 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-xs">
                    <MessageSquareText className="w-12 h-12 mx-auto text-[#AAAAAA]" />
                    <h4 className="font-serif text-base font-bold text-[#111111]">Pusat Pesan Kosong</h4>
                    <p className="text-xs text-[#777777] font-light">
                      {selectedCategory 
                        ? `Tidak ada notifikasi dalam kategori ${CATEGORIES.find(c => c.id === selectedCategory)?.name}.` 
                        : "Seluruh aktivitas Anda tercatat dengan aman di sini."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}