"use client";

import { Bell, Info, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { proxyUpdateDoc, triggerFirestoreSync } from "@/lib/firestore-proxy-client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatNotificationTime, getNotificationTimeMs } from "@/lib/notification-utils";

export function NotificationCenter() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const [optimisticReadIds, setOptimisticReadIds] = useState<Set<string>>(new Set());

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "users", user.uid, "notifications");
  }, [db, user]);

  const { data: rawNotifications, isLoading: loading } = useCollection<any>(notificationsQuery);

  const notifications = useMemo(() => {
    if (!rawNotifications) return [];
    return [...rawNotifications]
      .map((n) => ({
        ...n,
        read: n.read || optimisticReadIds.has(n.id),
      }))
      .sort((a, b) => getNotificationTimeMs(b) - getNotificationTimeMs(a))
      .slice(0, 12);
  }, [rawNotifications, optimisticReadIds]);

  const unreadCount = useMemo(() => {
    if (!rawNotifications) return 0;
    return rawNotifications.filter((n) => !n.read && !optimisticReadIds.has(n.id)).length;
  }, [rawNotifications, optimisticReadIds]);

  const markAllAsRead = async () => {
    if (!db || !user || !rawNotifications) return;
    const unreadItems = rawNotifications.filter((n) => !n.read && n.id && !optimisticReadIds.has(n.id));
    if (unreadItems.length === 0) return;

    setOptimisticReadIds((prev) => {
      const next = new Set(prev);
      unreadItems.forEach((n) => next.add(n.id));
      return next;
    });

    await Promise.allSettled(
      unreadItems.map((n) =>
        proxyUpdateDoc(`users/${user.uid}/notifications/${n.id}`, { read: true })
      )
    );
    triggerFirestoreSync();
  };

  const markAsRead = async (id: string) => {
    if (!db || !user || !id) return;
    setOptimisticReadIds((prev) => new Set(prev).add(id));
    try {
      await proxyUpdateDoc(`users/${user.uid}/notifications/${id}`, { read: true });
      triggerFirestoreSync();
    } catch {}
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5">
            <Bell className="w-5 h-5 text-accent dark:text-primary" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-destructive text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-in zoom-in">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-[2rem] liquid-glass p-0 shadow-2xl border-primary/10 overflow-hidden" align="end">
        <div className="p-4 border-b border-primary/5 flex justify-between items-center bg-accent/5">
          <h3 className="text-xs font-black uppercase tracking-widest text-accent">Pusat Notifikasi</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[9px] font-black text-primary uppercase hover:underline cursor-pointer"
            >
              Tandai Semua Dibaca
            </button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto no-scrollbar">
          {loading && !rawNotifications ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-primary/5">
              {notifications.map((n: any) => {
                const timeInfo = formatNotificationTime(n);
                const isAlert = n.type === 'alert' || n.type === 'error' || n.type === 'warning';
                return (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 hover:bg-primary/5 transition-colors cursor-pointer flex gap-3",
                      !n.read && "bg-primary/[0.04]"
                    )}
                    onClick={() => !n.read && n.id && markAsRead(n.id)}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                        n.type === 'success'
                          ? "bg-green-100 text-green-600"
                          : isAlert
                          ? "bg-red-100 text-red-600"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {n.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : isAlert ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <Info className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-[11px] font-black text-accent leading-tight truncate">{n.title}</p>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[8px] text-muted-foreground/70 uppercase font-bold tracking-widest mt-1">
                        {timeInfo.relative} • {timeInfo.shortTime}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-primary/10 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Belum ada notifikasi
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => router.push('/notifications')}
          className="w-full p-3 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary cursor-pointer border-t border-primary/5"
        >
          <span>Lihat Semua Notifikasi</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </PopoverContent>
    </Popover>
  );
}
