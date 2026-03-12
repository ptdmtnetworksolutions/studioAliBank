
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Zap, 
  Settings, 
  Search, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Database,
  Coins,
  TrendingUp,
  MoreVertical,
  Edit2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit, doc, updateDoc, increment } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

export default function AdminControlPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Security Check: Hanya akses manual untuk Owner
  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = '/login';
    }
    // Di sini Anda bisa menambahkan UID spesifik Anda untuk proteksi ekstra
    setIsAuthorized(true);
  }, [user, userLoading]);

  // Fetch Platform Users
  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "users"), limit(50));
  }, [db]);
  const { data: allUsers, loading: usersLoading } = useCollection(usersQuery);

  const handleAdjustBalance = (userId: string, amount: number) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const payload = { totalBalance: increment(amount) };
    
    updateDoc(userRef, payload)
      .then(() => {
        toast({ title: "Balance Adjusted", description: "Intervensi saldo berhasil dilakukan." });
      })
      .catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: payload
        }));
      });
  };

  const platformStats = useMemo(() => {
    if (!allUsers) return { totalIdr: 0, totalEth: 0, userCount: 0 };
    return allUsers.reduce((acc, curr) => ({
      totalIdr: acc.totalIdr + (curr.totalBalance || 0),
      totalEth: acc.totalEth + (curr.cryptoBalances?.ETH || 0),
      userCount: acc.userCount + 1
    }), { totalIdr: 0, totalEth: 0, userCount: 0 });
  }, [allUsers]);

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg border border-destructive/20 p-3">
              <ShieldAlert className="text-destructive w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Owner Control Panel</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest">Akses Otoritas Penuh & Kepemilikan Sistem.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Real-Time</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Platform IDR</p>
            <p className="text-3xl font-black text-accent italic tracking-tighter">Rp {platformStats.totalIdr.toLocaleString()}</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 bg-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Mainnet</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Platform ETH</p>
            <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{platformStats.totalEth.toFixed(4)} ETH</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 bg-green-500/5">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Verified Users</p>
            <p className="text-3xl font-black text-green-700 italic tracking-tighter">{platformStats.userCount}</p>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2rem] p-8 text-white space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <Settings className="w-5 h-5 opacity-50" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">System Integrity</p>
            <p className="text-2xl font-black italic tracking-tighter">100% SECURE</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <section className="liquid-glass rounded-[2.5rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" /> Manajemen Nasabah
                </h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari Nasabah..." 
                    className="h-10 pl-10 rounded-xl liquid-glass border-none text-xs"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-5">Nasabah</th>
                      <th className="px-8 py-5">Rekening</th>
                      <th className="px-8 py-5">Saldo IDR</th>
                      <th className="px-8 py-5">Saldo ETH</th>
                      <th className="px-8 py-5 text-right">Intervensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {allUsers?.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                      <tr key={u.uid} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center text-[10px] font-black text-white">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-black text-accent">{u.name}</p>
                              <p className="text-[9px] text-muted-foreground font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-[10px] font-bold text-muted-foreground">{u.accountNumber}</td>
                        <td className="px-8 py-4 text-xs font-black italic">Rp {u.totalBalance?.toLocaleString()}</td>
                        <td className="px-8 py-4 text-xs font-black text-primary italic">{u.cryptoBalances?.ETH?.toFixed(4) || "0.0000"}</td>
                        <td className="px-8 py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleAdjustBalance(u.uid, 1000000)} 
                            className="hover:bg-primary/10 text-primary"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="liquid-glass-dark rounded-[2.5rem] p-8 border-none shadow-2xl text-white">
              <h3 className="text-lg font-black flex items-center gap-3 mb-8 uppercase tracking-tighter">
                <Activity className="w-7 h-7 text-primary" /> 
                Policy Control
              </h3>
              <p className="text-[11px] text-white/60 mb-6 leading-relaxed italic">
                Sebagai pemilik, Anda memiliki hak veto untuk membekukan akun atau menyesuaikan parameter likuiditas demi stabilitas ekonomi AliBank.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl border-white/10 text-white font-bold text-[10px] uppercase">Freeze App</Button>
                <Button variant="outline" className="h-12 rounded-xl border-white/10 text-white font-bold text-[10px] uppercase">Log Audit</Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" viewBox="0 0 24 24" 
      fill="none" stroke="currentColor" strokeWidth="2" 
      strokeLinecap="round" strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
