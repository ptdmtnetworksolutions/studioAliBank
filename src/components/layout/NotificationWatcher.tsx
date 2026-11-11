"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { proxyGetCollection, triggerFirestoreSync } from "@/lib/firestore-proxy-client";
import { getNotificationTimeMs, parseNotificationDate } from "@/lib/notification-utils";
import { useToast } from "@/hooks/use-toast";

export function NotificationWatcher() {
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    seenIdsRef.current = new Set();
    initializedRef.current = false;
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === "undefined" || !db || !user) return;

    const notifColRef = collection(db, "users", user.uid, "notifications");
    const bridge = (window as any).AndroidBridge;

    const processNotifications = (items: any[]) => {
      if (!Array.isArray(items) || items.length === 0) {
        initializedRef.current = true;
        return;
      }

      const sorted = [...items].sort((a, b) => getNotificationTimeMs(b) - getNotificationTimeMs(a));

      if (!initializedRef.current) {
        sorted.forEach((n) => {
          if (n?.id) seenIdsRef.current.add(n.id);
        });
        initializedRef.current = true;
        return;
      }

      let hasNewUnread = false;

      for (const n of sorted) {
        if (!n?.id || seenIdsRef.current.has(n.id)) continue;
        seenIdsRef.current.add(n.id);

        if (n.read === false) {
          hasNewUnread = true;
          const dt = parseNotificationDate(n);
          const diffMs = dt ? Date.now() - dt.getTime() : 0;

          if (diffMs >= -10000 && diffMs < 60000) {
            if (bridge && typeof bridge.showNotification === "function") {
              try {
                bridge.showNotification(
                  n.title || "AliBank Info",
                  n.message || "Pemberitahuan baru diterima."
                );
              } catch {}
            }

            // Tampilkan live toast untuk aktivitas masuk real-time (jika sedang tidak di halaman notifikasi)
            const t = String(n.title || "").toLowerCase();
            const isInboundOrAsync =
              t.includes("dana masuk") ||
              t.includes("deposit") ||
              t.includes("kyc") ||
              t.includes("midtrans") ||
              t.includes("ipaymu") ||
              t.includes("doku") ||
              t.includes("dicairkan") ||
              t.includes("ditolak") ||
              t.includes("pembekuan") ||
              t.includes("diaktifkan");

            if (pathname !== "/notifications" && isInboundOrAsync) {
              toast({
                title: n.title || "Notifikasi Baru",
                description: n.message || "Aktivitas baru tercatat di akun Anda.",
              });
            }
          }
        }
      }

      if (hasNewUnread) {
        triggerFirestoreSync();
      }
    };

    // 1. Real-time Firestore Snapshot Listener
    const unsubscribe = onSnapshot(
      notifColRef,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        processNotifications(docs);
      },
      () => {
        // Silent fallback: proxy poll handles blocked WebChannel / Tor
      }
    );

    // 2. Proxy Polling Fallback (untuk menangkap notifikasi webhook/server & Tor mode secara real-time)
    const pollViaProxy = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const res = await proxyGetCollection(notifColRef);
      if (res.ok && Array.isArray(res.docs)) {
        processNotifications(res.docs);
      }
    };

    pollViaProxy();
    const intervalId = setInterval(pollViaProxy, 15000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [db, user, pathname, router, toast]);

  return null;
}
