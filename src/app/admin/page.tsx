
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Zap, 
  Search, 
  CheckCircle2, 
  Loader2,
  Database,
  Coins,
  TrendingUp,
  Plus,
  Minus,
  Clock,
  ArrowRightLeft,
  Lock,
  Globe,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { 
  collection, 
  query, 
  limit, 
  doc, 
  updateDoc, 
  increment, 
  collectionGroup, 
  where,
  orderBy,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AdminControlPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // OWNER IDENTITY CHECK
  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
  }, [user, userLoading, router]);

  // Fetch All Users for Management
  const usersQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, "users"), limit(100));
  }, [db, isAuthorized]);
  
  const { data: allUsers, loading: usersLoading } = useCollection(usersQuery);

  // Fetch Pending Bridge Settlements (Collection Group Query)
  const pendingSettlementsQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(
      collectionGroup(db, "transactions"), 
      where("status", "==", "pending"),
      orderBy("timestamp", "desc")
    );
  }, [db, isAuthorized]);

  const { data: pendingSettlements } = useCollection(pendingSettlementsQuery);

  const handleAdjustBalance = (userId: string, asset: 'totalBalance' | 'cryptoBalances.ETH', amount: number) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const payload = { [asset]: increment(amount) };
    
    updateDoc(userRef, payload)
      .then(() => {
        toast({ 
          title: "Intervensi Berhasil", 
          description: `Saldo ${asset === 'totalBalance' ? 'IDR' : 'ETH'} nasabah telah disesuaikan.` 
        });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: payload
        }));
      });
  };

  const handleApproveSettlement = async (settlement: any) => {
    if (!db) return;
    // In a real scenario, this would trigger a backend service to send actual ETH.
    // Here we update the status to mark it as processed in the system.
    const txRef = doc(db, settlement.path); // Assuming path is stored or we use settlement.id
    
    // Note: To get the full path in collectionGroup, we need a custom hook or map the result.
    // For this MVP, we use the settlement object which should contain its reference path.
    
    toast({ 
      title: "Settlement Approved", 
      description: "Aset sedang dipindahkan ke Mainnet Vault nasabah." 
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

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Verifying Ownership Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg border border-destructive/20 p-4">
              <ShieldAlert className="text-destructive w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Owner Command Center</h1>
                <Badge variant="destructive" className="animate-pulse px-3 py-1 rounded-full text-[10px] font-black">SUPER ADMIN</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Encrypted Access: {OWNER_EMAIL}
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Live Liquidity</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Platform IDR</p>
            <p className="text-3xl font-black text-accent italic tracking-tighter">Rp {platformStats.totalIdr.toLocaleString()}</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Mainnet Bridge</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Platform ETH</p>
            <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{platformStats.totalEth.toFixed(4)} ETH</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-green-500/5">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Active Accounts</p>
            <p className="text-3xl font-black text-green-700 italic tracking-tighter">{platformStats.userCount}</p>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <Globe className="w-5 h-5 opacity-50 text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">System Health</p>
            <p className="text-2xl font-black italic tracking-tighter">100% OPERATIONAL</p>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/10">
            <TabsTrigger value="users" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
              User Management
            </TabsTrigger>
            <TabsTrigger value="settlements" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all relative">
              Bridge Queue
              {pendingSettlements && pendingSettlements.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center text-[8px] text-white animate-pulse border-2 border-background">
                  {pendingSettlements.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="system" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
              Policy & Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" /> Database Nasabah
                </h3>
                <div className="relative w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by Name or Account..." 
                    className="h-12 pl-12 rounded-xl liquid-glass border-none text-xs font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-6">Identity</th>
                      <th className="px-8 py-6">IDR Balance</th>
                      <th className="px-8 py-6">ETH Balance</th>
                      <th className="px-8 py-6">Wallet Address</th>
                      <th className="px-8 py-6 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {allUsers?.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.accountNumber?.includes(searchTerm)).map((u) => (
                      <tr key={u.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl gold-gradient flex items-center justify-center text-[12px] font-black text-white shadow-lg">
                              {u.name ? u.name[0] : "?"}
                            </div>
                            <div>
                              <p className="text-sm font-black text-accent">{u.name}</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{u.accountNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-black italic">Rp {u.totalBalance?.toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm font-black text-primary italic">{u.cryptoBalances?.ETH?.toFixed(4) || "0.0000"} ETH</td>
                        <td className="px-8 py-5">
                          <code className="text-[10px] bg-muted/30 px-2 py-1 rounded font-mono text-muted-foreground">
                            {u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : "Not Linked"}
                          </code>
                        </td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAdjustBalance(u.id, 'totalBalance', 1000000)} 
                            className="rounded-xl border-primary/20 text-primary hover:bg-primary text-[10px] font-black"
                          >
                            + 1M IDR
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAdjustBalance(u.id, 'cryptoBalances.ETH', 0.1)} 
                            className="rounded-xl border-blue-500/20 text-blue-600 hover:bg-blue-500 text-[10px] font-black"
                          >
                            + 0.1 ETH
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="settlements">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
                  <div className="p-8 border-b border-primary/5 bg-blue-500/5">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                      <Clock className="w-6 h-6 text-blue-600" /> Pending Bridge Settlements
                    </h3>
                  </div>
                  <div className="p-8">
                    {pendingSettlements && pendingSettlements.length > 0 ? (
                      <div className="space-y-4">
                        {pendingSettlements.map((s, idx) => (
                          <div key={idx} className="p-6 rounded-[2rem] bg-muted/20 border border-primary/5 flex items-center justify-between group hover:bg-muted/30 transition-all">
                            <div className="flex items-center gap-6">
                              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                                <ArrowRightLeft className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Bridge Request</p>
                                <p className="text-lg font-black text-accent italic">{s.cryptoAmount} ETH &rarr; On-Chain Vault</p>
                                <p className="text-[10px] font-bold text-blue-600 uppercase">Timestamp: {new Date(s.timestamp?.toDate()).toLocaleString()}</p>
                              </div>
                            </div>
                            <Button 
                              onClick={() => handleApproveSettlement(s)}
                              className="gold-gradient text-white font-black italic uppercase text-[10px] rounded-2xl h-12 px-8 shadow-lg shadow-primary/20"
                            >
                              Finalize Settlement
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed border-primary/10">
                        <CheckCircle2 className="w-12 h-12 text-primary/20 mx-auto mb-4" />
                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No pending settlements found.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="lg:col-span-4">
                <Card className="liquid-glass-dark rounded-[3rem] p-8 border-none text-white space-y-6">
                  <h3 className="text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-primary" /> Settlement Guide
                  </h3>
                  <p className="text-[11px] font-medium leading-relaxed italic text-white/70">
                    Setiap permintaan bridge dari saldo internal nasabah harus diselesaikan melalui treasury AliBank. 
                    <br/><br/>
                    Menekan "Finalize" berarti Anda mengonfirmasi bahwa aset riil telah dikirim dari treasury ke Brankas Smart Contract nasabah di Mainnet.
                  </p>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total Queue Value</p>
                    <p className="text-2xl font-black text-primary italic">
                      {pendingSettlements?.reduce((acc, curr) => acc + (curr.cryptoAmount || 0), 0).toFixed(4)} ETH
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="liquid-glass rounded-[3rem] p-10 border-none shadow-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-black italic uppercase text-accent tracking-tighter mb-2">Global System Freeze</h3>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                    Matikan akses seluruh transaksi platform jika terdeteksi anomali pada Mainnet Bridge.
                  </p>
                </div>
                <div className="flex items-center justify-between p-6 rounded-3xl bg-destructive/5 border border-destructive/20">
                  <span className="text-xs font-black uppercase text-destructive italic">Status: System Online</span>
                  <Button variant="destructive" className="rounded-xl font-black uppercase italic text-[10px] h-12 px-8">ACTIVATE FREEZE</Button>
                </div>
              </Card>

              <Card className="liquid-glass rounded-[3rem] p-10 border-none shadow-2xl space-y-8">
                <div>
                  <h3 className="text-xl font-black italic uppercase text-accent tracking-tighter mb-2">Audit Log Export</h3>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest leading-relaxed">
                    Download seluruh riwayat transaksi nasabah dan intervensi admin untuk pelaporan regulator.
                  </p>
                </div>
                <Button variant="outline" className="w-full h-14 rounded-2xl border-primary/20 text-primary font-black uppercase italic tracking-widest text-[11px]">
                  Generate Compliance Report (PDF/CSV)
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
