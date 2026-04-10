"use client";

import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Settings, 
  MessageSquareText, 
  Volume2, 
  Gift, 
  User, 
  Calendar, 
  LayoutGrid,
  Loader2,
  Brush,
  ArrowRightLeft,
  ChevronRight,
  Bell,
  Clock,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useState, useEffect } from "react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
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
  { id: 'transaksi', name: "Transaksi", icon: ArrowRightLeft, color: "bg-green-500/10 text-green-600" },
  { id: 'akun', name: "Keamanan & Akun", icon: User, color: "bg-blue-500/10 text-blue-600" },
  { id: 'pengumuman', name: "Pengumuman", icon: Volume2, color: "bg-amber-500/10 text-amber-600" },
  { id: 'marketing', name: "Promo & Reward", icon: Gift, color: "bg-rose-500/10 text-rose-600" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const notificationsQuery = useMemoFirebase(() => {
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
    
    const filtered = realNotifications.filter(n => {
      const t = (n.title || "").toLowerCase();
      const msg = (n.message || "").toLowerCase();
      const type = (n.type || "").toLowerCase();
      
      if (catId === 'transaksi') return t.includes('top up') || t.includes('transfer') || t.includes('dana') || t.includes('bayar') || t.includes('pencairan') || t.includes('settlement') || t.includes('beli') || t.includes('jual') || t.includes('withdraw');
      if (catId === 'akun') return t.includes('akun') || t.includes('device') || t.includes('signature') || t.includes('password') || t.includes('profil') || type === 'alert';
      if (catId === 'marketing') return t.includes('reward') || t.includes('promo') || t.includes('hadiah') || t.includes('turnamen') || t.includes('kampanye');
      if (catId === 'pengumuman') return type === 'info' || t.includes('pengumuman') || t.includes('sistem') || t.includes('mainnet');
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

  const markAsRead = async (id: string) => {
    if (!db || !user) return;
    const ref = doc(db, "users", user.uid, "notifications", id);
    await updateDoc(ref, { read: true });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/30">
      {/* Header */}
      <header className="px-4 h-14 flex items-center justify-between sticky top-0 bg-background z-50 border-b border-border/50">
        <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-black tracking-tight italic uppercase">Pesan & Notifikasi</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleMarkAllRead} className="p-2 hover:bg-muted rounded-full transition-colors">
            <Brush className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar">
        {/* Categories Section */}
        <div className="space-y-1 py-2">
          {CATEGORIES.map((cat) => {
            const { latest, unreadCount } = getCategoryData(cat.id);
            const Icon = cat.icon;
            
            return (
              <div 
                key={cat.id} 
                className="px-4 py-4 flex items-center gap-4 hover:bg-muted active:bg-muted transition-colors cursor-pointer group"
              >
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", cat.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1 min-w-0 border-b border-border pb-4 group-last:border-none">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-black tracking-tight text-foreground italic uppercase">{cat.name}</h3>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">
                        {latest ? new Date(latest.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ""}
                      </span>
                      {unreadCount > 0 && (
                        <div className="bg-primary text-primary-foreground text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                          {unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground truncate leading-tight italic">
                    {latest ? latest.message : "Tidak ada pesan baru dalam kategori ini"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Activity List */}
        <section className="px-4 py-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] italic">Aktivitas Terbaru</h2>
            <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase italic">Live Sync</Badge>
          </div>

          <div className="space-y-4 pb-20">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-30">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi Pesan...</p>
              </div>
            ) : realNotifications && realNotifications.length > 0 ? (
              realNotifications.map((n: any) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-5 rounded-[2rem] border transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group",
                    n.read ? "bg-muted/20 border-border/50 opacity-60" : "bg-card border-primary/20 shadow-xl shadow-primary/5"
                  )}
                  onClick={() => !n.read && markAsRead(n.id)}
                >
                  {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1.5 gold-gradient" />}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center",
                        n.type === 'success' ? "bg-green-100 text-green-600" : 
                        n.type === 'alert' ? "bg-rose-100 text-rose-600" : "bg-primary/10 text-primary"
                      )}>
                        {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : 
                         n.type === 'alert' ? <AlertTriangle className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                      </div>
                      <Badge className={cn(
                        "border-none text-[7px] font-black uppercase px-2 h-4",
                        n.type === 'success' ? "bg-green-500 text-white" : 
                        n.type === 'alert' ? "bg-rose-500 text-white" : "bg-primary text-black"
                      )}>
                        {n.type || 'INFO'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase italic">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <h3 className="text-sm font-black italic uppercase tracking-tight text-foreground group-hover:text-primary transition-colors">{n.title}</h3>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1.5 leading-relaxed italic">{n.message}</p>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 opacity-20 italic">
                <MessageSquareText className="w-12 h-12 mx-auto" />
                <p className="text-xs font-black uppercase tracking-widest">Pusat Pesan Kosong</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}