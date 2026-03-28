
"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings, 
  MessageSquareText, 
  Volume2, 
  Gift, 
  Sparkles, 
  User, 
  Calendar, 
  LayoutGrid,
  Loader2,
  Brush,
  Smile
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type NotificationCategory = {
  id: string;
  name: string;
  icon: any;
  color: string;
};

const CATEGORIES: NotificationCategory[] = [
  { id: 'obrolan', name: "Obrolan", icon: MessageSquareText, color: "bg-[#2B3139]" },
  { id: 'pengumuman', name: "Pengumuman", icon: Volume2, color: "bg-[#2B3139]" },
  { id: 'kampanye', name: "Kampanye", icon: Gift, color: "bg-[#2B3139]" },
  { id: 'ai', name: "AliBank AI", icon: Sparkles, color: "bg-[#2B3139]" },
  { id: 'akun', name: "Akun", icon: User, color: "bg-[#2B3139]" },
  { id: 'marketing', name: "Pemasaran & Aktivitas", icon: Calendar, color: "bg-[#2B3139]" },
  { id: 'square', name: "Square", icon: LayoutGrid, color: "bg-[#2B3139]" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const notificationsQuery = useMemo(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
  }, [db, user]);

  const { data: realNotifications, loading } = useCollection<any>(notificationsQuery);

  const getCategoryData = (catId: string) => {
    if (!realNotifications) return { latest: null, unreadCount: 0 };
    
    // Logic: Map real notification types/titles to categories
    const filtered = realNotifications.filter(n => {
      const title = (n.title || "").toLowerCase();
      const type = (n.type || "").toLowerCase();
      
      if (catId === 'akun') return title.includes('akun') || title.includes('device') || type === 'alert';
      if (catId === 'marketing') return title.includes('reward') || title.includes('promo') || title.includes('pemasaran');
      if (catId === 'pengumuman') return type === 'info' || title.includes('pengumuman');
      if (catId === 'success') return type === 'success';
      return false;
    });

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
      toast({ title: "Pesan Dibersihkan", description: "Semua notifikasi telah ditandai sebagai terbaca." });
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#1E2329] text-white flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-[#1E2329] z-50">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight">Pesan</h1>
        <div className="flex items-center gap-4">
          <button onClick={handleMarkAllRead} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Brush className="w-5 h-5 text-slate-400" />
          </button>
          <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pt-2">
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const { latest, unreadCount } = getCategoryData(cat.id);
            const Icon = cat.icon;
            
            return (
              <div 
                key={cat.id} 
                className="px-4 py-4 flex items-center gap-4 hover:bg-white/[0.03] active:bg-white/[0.05] transition-colors cursor-pointer group"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm", cat.color)}>
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
                
                <div className="flex-1 min-w-0 border-b border-white/[0.02] pb-4 group-last:border-none">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-black tracking-tight text-slate-100 italic">{cat.name}</h3>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        {latest ? new Date(latest.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ""}
                      </span>
                      {unreadCount > 0 && (
                        <div className="bg-primary text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-500 truncate leading-tight italic">
                    {latest ? latest.message : "Tidak ada pesan baru"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {loading && (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
          </div>
        )}
      </main>

      {/* Floating Robot Icon */}
      <div className="fixed bottom-10 right-6 z-[60]">
        <div className="w-12 h-12 bg-[#2B3139] rounded-2xl shadow-2xl border border-white/5 flex items-center justify-center text-primary active:scale-90 transition-transform cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100" />
          <Smile className="w-7 h-7 relative z-10" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-[#1E2329] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
