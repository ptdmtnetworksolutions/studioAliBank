"use client";

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  ArrowLeft,
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
  Sparkles,
  Trash2,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import {
  proxyUpdateDoc,
  proxyDeleteDoc,
  triggerFirestoreSync,
} from "@/lib/firestore-proxy-client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  type NotificationCategoryId,
  resolveNotificationCategory,
  getNotificationTimeMs,
  formatNotificationTime,
  getNotificationBadgeInfo,
  getNotificationActionLink,
} from "@/lib/notification-utils";

type NotificationCategory = {
  id: NotificationCategoryId;
  name: string;
  icon: any;
  description: string;
};

const CATEGORIES: NotificationCategory[] = [
  {
    id: "transaksi",
    name: "Transaksi & Transfer",
    icon: ArrowRightLeft,
    description: "Mutasi saldo, setor, tarik, swap, & pembayaran SoftPOS",
  },
  {
    id: "akun",
    name: "Keamanan & Akun",
    icon: ShieldCheck,
    description: "Otentikasi, perangkat, limit, rekonsiliasi, & status KYC",
  },
  {
    id: "pengumuman",
    name: "Pengumuman Sistem",
    icon: Volume2,
    description: "Pembaruan node, jadwal kliring, & protokol bank",
  },
  {
    id: "marketing",
    name: "Promo & Hadiah",
    icon: Gift,
    description: "Staking yield ALX, reward game, & kampanye VIP",
  },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategoryId | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(new Set());
  const [optimisticDeletedIds, setOptimisticDeletedIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

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

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.replace("/login");
    }
  }, [mounted, authLoading, user, router]);

  // Query tanpa orderBy Firestore agar notifikasi yang memakai timestamp/Timestamp object tidak tersaring diam-diam
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "notifications");
  }, [db, user]);

  const { data: rawNotifications, isLoading: loading } = useCollection<any>(notificationsQuery);

  useEffect(() => {
    if (rawNotifications) {
      setLastSyncedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }
  }, [rawNotifications]);

  // Gabungkan status optimistis & urutkan kronologis terbaru ke terlama secara akurat
  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return rawNotifications
      .filter((n) => n?.id && !optimisticDeletedIds.has(n.id))
      .map((n) => ({
        ...n,
        read: Boolean(n.read) || optimisticReadIds.has(n.id),
        _resolvedCategory: resolveNotificationCategory(n),
        _timeMs: getNotificationTimeMs(n),
      }))
      .sort((a, b) => b._timeMs - a._timeMs);
  }, [rawNotifications, optimisticReadIds, optimisticDeletedIds]);

  const categoryStats = useMemo(() => {
    const map: Record<NotificationCategoryId, { latest: any | null; unreadCount: number; total: number }> = {
      transaksi: { latest: null, unreadCount: 0, total: 0 },
      akun: { latest: null, unreadCount: 0, total: 0 },
      pengumuman: { latest: null, unreadCount: 0, total: 0 },
      marketing: { latest: null, unreadCount: 0, total: 0 },
    };

    for (const n of notifications) {
      const cat = n._resolvedCategory as NotificationCategoryId;
      const bucket = map[cat];
      if (!bucket) continue;
      if (!bucket.latest) bucket.latest = n;
      bucket.total++;
      if (!n.read) bucket.unreadCount++;
    }

    return map;
  }, [notifications]);

  const totalUnreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const totalReadCount = useMemo(
    () => notifications.filter((n) => n.read).length,
    [notifications]
  );

  const displayedNotifications = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return notifications.filter((n) => {
      if (selectedCategory && n._resolvedCategory !== selectedCategory) return false;
      if (statusFilter === "unread" && n.read) return false;
      if (q) {
        const hay = `${n.title || ""} ${n.message || ""} ${n.txHash || ""} ${n.approvalCode || ""} ${n.rrn || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [notifications, selectedCategory, statusFilter, searchQuery]);

  const handleManualSync = useCallback(() => {
    setIsSyncing(true);
    triggerFirestoreSync();
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedAt(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 650);
  }, []);

  const markAsRead = async (id: string) => {
    if (!user || !id) return;
    setOptimisticReadIds((prev) => new Set(prev).add(id));
    try {
      await proxyUpdateDoc(`users/${user.uid}/notifications/${id}`, { read: true });
      triggerFirestoreSync();
    } catch (err) {
      console.warn("[MarkAsRead] Proxy update warning:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const unreadItems = notifications.filter((n) => !n.read && n.id);
    if (unreadItems.length === 0) {
      toast({
        title: "Pusat Pesan Bersih",
        description: "Seluruh notifikasi Anda sudah dalam status terbaca.",
      });
      return;
    }

    setOptimisticReadIds((prev) => {
      const next = new Set(prev);
      unreadItems.forEach((n) => next.add(n.id));
      return next;
    });

    try {
      await Promise.allSettled(
        unreadItems.map((n) =>
          proxyUpdateDoc(`users/${user.uid}/notifications/${n.id}`, { read: true })
        )
      );
      triggerFirestoreSync();
      toast({
        title: "Seluruh Pesan Ditandai Dibaca",
        description: `${unreadItems.length} notifikasi telah berhasil diperbarui ke status terbaca.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Sebagian Gagal Diperbarui",
        description: err?.message || "Silakan coba beberapa saat lagi.",
      });
    }
  };

  const handleDeleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !id) return;
    setOptimisticDeletedIds((prev) => new Set(prev).add(id));
    try {
      await proxyDeleteDoc(`users/${user.uid}/notifications/${id}`);
      triggerFirestoreSync();
    } catch (err) {
      console.warn("[DeleteNotification] Warning:", err);
    }
  };

  const handleClearRead = async () => {
    if (!user || isClearing) return;
    const readItems = notifications.filter((n) => n.read && n.id);
    if (readItems.length === 0) {
      toast({
        title: "Tidak Ada Pesan Terbaca",
        description: "Belum ada riwayat notifikasi terbaca untuk dibersihkan.",
      });
      return;
    }

    setIsClearing(true);
    setOptimisticDeletedIds((prev) => {
      const next = new Set(prev);
      readItems.forEach((n) => next.add(n.id));
      return next;
    });

    try {
      await Promise.allSettled(
        readItems.map((n) => proxyDeleteDoc(`users/${user.uid}/notifications/${n.id}`))
      );
      triggerFirestoreSync();
      toast({
        title: "Notifikasi Dibersihkan",
        description: `${readItems.length} notifikasi yang sudah dibaca berhasil dihapus.`,
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleCardAction = async (n: any, href: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!n.read && n.id) {
      await markAsRead(n.id);
    }
    router.push(href);
  };

  if (!mounted || (authLoading && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
      </div>
    );
  }

  const renderNotificationCard = (n: any, compact = false) => {
    const timeInfo = formatNotificationTime(n);
    const badgeInfo = getNotificationBadgeInfo(n.type);
    const actionLink = getNotificationActionLink(n);
    const isRealOnChainHash = typeof n.txHash === "string" && n.txHash.startsWith("0x") && n.txHash.length === 66;

    return (
      <div
        key={n.id}
        className={cn(
          "rounded-sm border transition-all cursor-pointer relative overflow-hidden bg-white shadow-xs group",
          compact ? "p-4" : "p-5 hover:border-[#111111]",
          n.read ? "border-[#DFDAD0] opacity-85" : "border-[#DFDAD0] ring-1 ring-[#111111]/10"
        )}
        onClick={() => !n.read && markAsRead(n.id)}
      >
        {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F4B728]" />}

        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded-sm border",
                badgeInfo.className
              )}
            >
              {badgeInfo.label}
            </span>
            {!n.read && (
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#B8820B] bg-[#F4B728]/15 px-1.5 py-0.5 rounded-sm">
                • Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1 font-mono text-[10px] text-[#777777]"
              title={timeInfo.fullDateTime}
            >
              <Clock className="w-3 h-3 text-[#999999]" />
              <span>
                {timeInfo.shortDate !== "-" ? `${timeInfo.shortDate} • ${timeInfo.shortTime}` : timeInfo.shortTime}
              </span>
            </div>
            <button
              onClick={(e) => handleDeleteOne(n.id, e)}
              className="p-1 text-[#AAAAAA] hover:text-rose-600 transition-colors rounded-sm hover:bg-rose-50 cursor-pointer"
              title="Hapus notifikasi ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <h4 className={cn("font-serif font-bold text-[#111111] tracking-tight", compact ? "text-sm" : "text-base")}>
          {n.title || "Informasi Sistem"}
        </h4>
        <p className="text-xs text-[#555555] font-light mt-1 leading-relaxed">{n.message}</p>

        {(n.terminalId || n.approvalCode || n.settlementDestination) && (
          <div className="mt-3 p-3 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[10px] sm:text-[11px] font-mono text-[#555555] space-y-1.5">
            <div className="flex justify-between items-center pb-1 border-b border-[#EAE6DF]">
              <span>
                Terminal: <strong className="text-[#111111]">{n.terminalId || "ALX-SOFTPOS-01"}</strong>
              </span>
              <span>
                Auth: <strong className="text-emerald-700 font-bold">{n.approvalCode || "APPROVED"}</strong>
              </span>
            </div>
            {n.rrn && (
              <div className="flex justify-between items-center">
                <span>
                  RRN: <strong className="text-[#111111]">{n.rrn}</strong>
                </span>
                <span>
                  Kartu: <strong className="text-[#111111]">{n.cardType || "DEBIT"}</strong>
                </span>
              </div>
            )}
            {n.settlementDestination && (
              <div className="pt-1 border-t border-[#EAE6DF] text-[10px]">
                <span>Penyaluran Dana: </span>
                <strong className="text-[#111111]">{n.settlementDestination}</strong>
              </div>
            )}
          </div>
        )}

        {(actionLink || n.txHash) && (
          <div className="mt-3 pt-2.5 border-t border-[#F0EDE6] flex items-center justify-between gap-2 flex-wrap">
            {isRealOnChainHash ? (
              <a
                href={`https://polygonscan.com/tx/${n.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#666666] hover:text-[#111111] transition-colors"
              >
                <span>Tx: {n.txHash.slice(0, 10)}...</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : n.txHash ? (
              <span className="text-[10px] font-mono text-[#888888]">Ref: {n.txHash}</span>
            ) : (
              <span className="text-[10px] font-mono text-[#999999]">{timeInfo.relative}</span>
            )}

            {actionLink && (
              <button
                onClick={(e) => handleCardAction(n, actionLink.href, e)}
                className="inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] hover:underline cursor-pointer"
              >
                <span>{actionLink.label}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ─── MOBILE RENDERING ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex flex-col font-sans selection:bg-[#F4B728] selection:text-black">
        {/* Header */}
        <header className="px-4 h-16 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-[#DFDAD0]">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-[#111111]" />
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-serif text-base font-bold text-[#111111] tracking-tight">
              Pesan & Notifikasi
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono tracking-wider uppercase text-[#666666]">
                Real-Time Node {lastSyncedAt ? `• ${lastSyncedAt}` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualSync}
              className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer text-[#111111]"
              title="Sinkronkan Real-Time"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
            </button>
            <button
              onClick={handleMarkAllRead}
              className="p-2 hover:bg-[#FAF9F6] rounded-sm border border-[#DFDAD0] transition-colors cursor-pointer text-[#111111]"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-5 pb-24">
          {/* Search & Status Pills */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari transaksi, koin, KYC, atau kode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-8 bg-white border border-[#DFDAD0] rounded-sm text-xs focus:outline-none focus:border-[#111111]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase border transition-colors",
                    statusFilter === "all"
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#555555] border-[#DFDAD0]"
                  )}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setStatusFilter("unread")}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-[10px] font-mono font-bold uppercase border transition-colors",
                    statusFilter === "unread"
                      ? "bg-[#111111] text-white border-[#111111]"
                      : "bg-white text-[#555555] border-[#DFDAD0]"
                  )}
                >
                  Belum Dibaca ({totalUnreadCount})
                </button>
              </div>
              {totalReadCount > 0 && (
                <button
                  onClick={handleClearRead}
                  disabled={isClearing}
                  className="text-[10px] font-mono font-bold text-rose-600 uppercase underline"
                >
                  Hapus Terbaca
                </button>
              )}
            </div>
          </div>

          {/* Categories Grid (Mobile) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
                Kategori Notifikasi
              </h2>
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
                const { latest, unreadCount } = categoryStats[cat.id];
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                    className={cn(
                      "p-3 rounded-sm border transition-all cursor-pointer flex flex-col justify-between gap-2.5 shadow-xs",
                      isSelected
                        ? "bg-white border-[#111111] ring-1 ring-black"
                        : "bg-white border-[#DFDAD0] hover:border-black"
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
                        {latest ? latest.title : "Belum ada aktivitas"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Activity List (Mobile) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-serif text-sm font-bold text-[#111111]">
                  {selectedCategory
                    ? CATEGORIES.find((c) => c.id === selectedCategory)?.name
                    : "Aktivitas Real-Time"}
                </h2>
              </div>
              <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#666666] rounded-sm">
                {displayedNotifications.length} Pesan
              </span>
            </div>

            <div className="space-y-3">
              {loading && !rawNotifications ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 opacity-60">
                  <Loader2 className="w-7 h-7 animate-spin text-[#111111]" />
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">
                    Sinkronisasi Node...
                  </p>
                </div>
              ) : displayedNotifications.length > 0 ? (
                displayedNotifications.map((n: any) => renderNotificationCard(n, true))
              ) : (
                <div className="py-16 text-center space-y-3 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-xs">
                  <MessageSquareText className="w-10 h-10 mx-auto text-[#AAAAAA]" />
                  <p className="font-serif text-sm font-bold text-[#111111]">Tidak Ada Notifikasi</p>
                  <p className="text-xs text-[#777777] font-light">
                    Tidak ada pesan yang cocok dengan filter yang dipilih.
                  </p>
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
      <Sidebar />

      <main className="lg:ml-64 flex-1 flex flex-col min-w-0 bg-[#FAF9F6] text-[#111111]">
        {/* HEADER */}
        <header className="h-20 bg-white/95 backdrop-blur-md border-b border-[#DFDAD0] flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h2 className="font-serif text-2xl font-bold text-[#111111] tracking-tight">
              Pesan & Notifikasi
            </h2>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase px-2.5 py-1 bg-[#FAF9F6] border border-[#DFDAD0] text-[#555555] rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-Time Ledger {lastSyncedAt ? `(${lastSyncedAt})` : ""}</span>
            </span>
            {totalUnreadCount > 0 && (
              <span className="bg-[#111111] text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm">
                {totalUnreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleManualSync}
              className="px-3 py-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-mono font-bold uppercase tracking-wider text-[#111111] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Sinkronkan pesan terbaru secara real-time"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-[#555555]", isSyncing && "animate-spin")} />
              <span>Sinkronkan</span>
            </button>
            <button
              onClick={handleMarkAllRead}
              className="px-3.5 py-2 rounded-sm bg-white hover:bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              title="Tandai semua dibaca"
            >
              <CheckCheck className="w-4 h-4 text-[#F4B728]" />
              <span>Tandai Semua Dibaca</span>
            </button>
            {totalReadCount > 0 && (
              <button
                onClick={handleClearRead}
                disabled={isClearing}
                className="px-3 py-2 rounded-sm bg-white hover:bg-rose-50 border border-[#DFDAD0] hover:border-rose-200 text-xs font-mono font-bold uppercase tracking-wider text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Hapus notifikasi yang sudah dibaca"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Terbaca</span>
              </button>
            )}
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
        <div className="p-8 space-y-6 max-w-[1300px] w-full mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: CATEGORIES (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-serif text-xs font-bold uppercase tracking-widest text-[#777777]">
                  Kategori Notifikasi
                </h3>
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
                  const { latest, unreadCount, total } = categoryStats[cat.id];
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

                      <div
                        className={cn(
                          "w-10 h-10 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] flex items-center justify-center shrink-0 group-hover:border-black transition-colors",
                          isSelected && "bg-[#111111] text-white border-black"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h4 className="font-serif text-sm font-bold text-[#111111] tracking-tight group-hover:text-black">
                            {cat.name}
                          </h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[10px] text-[#888888]">
                              {latest ? formatNotificationTime(latest).shortDate : `${total} pesan`}
                            </span>
                            {unreadCount > 0 && (
                              <span className="bg-[#111111] text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#666666] font-light leading-snug line-clamp-2">
                          {latest ? `${latest.title}: ${latest.message}` : cat.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Status Indicator Card */}
              <div className="p-5 rounded-sm bg-white border border-[#DFDAD0] shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F4B728]" />
                    <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-[#111111]">
                      Protokol Notifikasi Ledger Real-Time
                    </h4>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  Terhubung ke seluruh aktivitas sistem: Transfer P2P, Deposit On-Chain, Penarikan,
                  Swap, Bursa Spot & Futures, SoftPOS/Midtrans/iPaymu/DOKU, Tabungan, Deposito,
                  Verifikasi KYC, Staking Yield, hingga Arena Game AliBank.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: FULL ACTIVITY LIST (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Filter + Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-sm border border-[#DFDAD0] shadow-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setStatusFilter("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-sm text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer",
                      statusFilter === "all"
                        ? "bg-[#111111] text-white"
                        : "bg-[#FAF9F6] text-[#555555] hover:text-black"
                    )}
                  >
                    Semua ({notifications.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter("unread")}
                    className={cn(
                      "px-3 py-1.5 rounded-sm text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer",
                      statusFilter === "unread"
                        ? "bg-[#111111] text-white"
                        : "bg-[#FAF9F6] text-[#555555] hover:text-black"
                    )}
                  >
                    Belum Dibaca ({totalUnreadCount})
                  </button>
                </div>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari pesan, hash transaksi, atau kode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 pr-7 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs focus:outline-none focus:border-[#111111]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] hover:text-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-serif text-sm font-bold text-[#111111]">
                    {selectedCategory
                      ? `Aktivitas: ${CATEGORIES.find((c) => c.id === selectedCategory)?.name}`
                      : "Aktivitas Terbaru"}
                  </h3>
                </div>
                <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 bg-white border border-[#DFDAD0] text-[#666666] rounded-sm">
                  {displayedNotifications.length} Pesan Terdaftar
                </span>
              </div>

              <div className="space-y-3">
                {loading && !rawNotifications ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-3 bg-white border border-[#DFDAD0] rounded-sm shadow-xs">
                    <Loader2 className="w-8 h-8 animate-spin text-[#111111]" />
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">
                      Sinkronisasi Node Log...
                    </p>
                  </div>
                ) : displayedNotifications.length > 0 ? (
                  displayedNotifications.map((n: any) => renderNotificationCard(n, false))
                ) : (
                  <div className="py-20 text-center space-y-3 bg-white border border-[#DFDAD0] rounded-sm p-8 shadow-xs">
                    <MessageSquareText className="w-12 h-12 mx-auto text-[#AAAAAA]" />
                    <h4 className="font-serif text-base font-bold text-[#111111]">
                      Pusat Pesan Kosong
                    </h4>
                    <p className="text-xs text-[#777777] font-light">
                      {searchQuery
                        ? `Tidak ada notifikasi yang cocok dengan kata kunci "${searchQuery}".`
                        : statusFilter === "unread"
                        ? "Semua notifikasi pada kategori ini sudah dibaca."
                        : selectedCategory
                        ? `Tidak ada notifikasi dalam kategori ${CATEGORIES.find((c) => c.id === selectedCategory)?.name}.`
                        : "Seluruh aktivitas Anda tercatat dengan aman secara real-time di sini."}
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
