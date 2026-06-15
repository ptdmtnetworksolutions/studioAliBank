
"use client";

import { Bell, Info, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { user } = useUser();
  const db = useFirestore();

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [db, user]);

  const { data: notifications, isLoading: loading } = useCollection<any>(notificationsQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter((n) => !n.read).length || 0;
  }, [notifications]);

  const markAllAsRead = async () => {
    if (!db || !user || !notifications) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read && n.id) {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(ref, { read: true });
      }
    });
    await batch.commit();
  };

  const markAsRead = async (id: string) => {
    if (!db || !user) return;
    const ref = doc(db, "users", user.uid, "notifications", id);
    await updateDoc(ref, { read: true });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button variant="ghost" size="icon" className="rounded-2xl bg-white/50 border border-primary/5 shadow-sm dark:bg-white/5">
            <Bell className="w-5 h-5 text-accent dark:text-primary" />
          </Button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-black animate-in zoom-in">
              {unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-[2rem] liquid-glass p-0 shadow-2xl border-primary/10" align="end">
        <div className="p-4 border-b border-primary/5 flex justify-between items-center bg-accent/5">
          <h3 className="text-xs font-black uppercase tracking-widest text-accent">Notification Center</h3>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-[9px] font-black text-primary uppercase hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-[350px] overflow-y-auto no-scrollbar">
          {loading ? (
            <div className="p-10 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary/40" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-primary/5">
              {notifications.map((n: any, idx: number) => (
                <div 
                  key={idx} 
                  className={cn(
                    "p-4 hover:bg-primary/5 transition-colors cursor-pointer flex gap-3",
                    !n.read && "bg-primary/[0.03]"
                  )}
                  onClick={() => !n.read && n.id && markAsRead(n.id)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                    n.type === 'success' ? "bg-green-100 text-green-600" : 
                    n.type === 'alert' ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"
                  )}>
                    {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                     n.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between items-start">
                      <p className="text-[11px] font-black text-accent leading-tight">{n.title}</p>
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">{n.message}</p>
                    <p className="text-[8px] text-muted-foreground/60 uppercase font-bold tracking-widest mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Bell className="w-10 h-10 text-primary/10 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No notifications yet</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-primary/5 text-center">
          <p className="text-[8px] font-black uppercase tracking-widest text-primary/60">Secured by AliBank Engine</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
