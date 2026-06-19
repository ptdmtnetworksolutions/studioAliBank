"use client";

import { useEffect, useRef } from "react";
import { useUser, useFirestore } from "@/firebase";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";

export function NotificationWatcher() {
  const { user } = useUser();
  const db = useFirestore();
  const lastNotifiedId = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !db || !user) return;

    const bridge = (window as any).AndroidBridge;
    if (!bridge || typeof bridge.showNotification !== "function") return;

    const notifRef = collection(db, "users", user.uid, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      const notifId = doc.id;

      // Ensure it is unread and not processed yet
      if (data.read === false && lastNotifiedId.current !== notifId) {
        // Prevent notifying old cached records on first load
        const createdAt = data.createdAt ? new Date(data.createdAt).getTime() : Date.now();
        const diffMs = Date.now() - createdAt;
        
        // If created in the last 30 seconds, trigger native notification
        if (diffMs < 30000) {
          lastNotifiedId.current = notifId;
          bridge.showNotification(
            data.title || "AliBank Info",
            data.message || "Pemberitahuan baru diterima."
          );
        }
      }
    }, (error) => {
      console.warn("Notification sync listener error:", error);
    });

    return () => unsubscribe();
  }, [db, user]);

  return null;
}
