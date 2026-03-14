
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldAlert, 
  Users, 
  Search, 
  CheckCircle2, 
  Loader2,
  Database,
  Coins,
  TrendingUp,
  Clock,
  Lock,
  RefreshCw,
  Activity,
  ShoppingBag,
  ArrowUpRight,
  ArrowRightLeft,
  Check,
  X,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { 
  collection, 
  query, 
  limit, 
  doc, 
  updateDoc, 
  increment, 
  collectionGroup, 
  addDoc
} from "firebase/firestore";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";

const CONTRACT_ABI = [
  "function getTotalVaultBalance() public view returns (uint256)",
  "function owner() public view returns (address)",
  "function releaseFunds(address _to, uint256 _amount) public",
  "function withdraw(uint256 _amount) public"
];

const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

export default function AdminControlPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainTotal, setOnChainTotal] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [processingBridge, setProcessingBridge] = useState<string | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
  }, [user, userLoading, router]);

  const syncOnChainVault = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;
    setSyncingVault(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      if (accounts.length > 0) setConnectedAddress(accounts[0].address.toLowerCase());

      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      
      const [balance, ownerAddr] = await Promise.all([
        contract.getTotalVaultBalance(),
        contract.owner()
      ]);

      setOnChainTotal(formatEther(balance));
      setContractOwner(ownerAddr.toLowerCase());
    } catch (err) {
      console.error("Vault Sync Error:", err);
    } finally {
      setSyncingVault(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) syncOnChainVault();
  }, [isAuthorized, syncOnChainVault]);

  const usersQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, "users"), limit(100));
  }, [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);

  const allInvoicesQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(collectionGroup(db, "invoices"), limit(200));
  }, [db, isAuthorized]);
  const { data: rawInvoices } = useCollection(allInvoicesQuery);

  const globalInvoices = useMemo(() => {
    if (!rawInvoices) return [];
    return [...rawInvoices].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [rawInvoices]);

  const txQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(collectionGroup(db, "transactions"), limit(200));
  }, [db, isAuthorized]);
  const { data: rawTransactions } = useCollection(txQuery);

  const pendingBridges = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions
      .filter(tx => tx.category === "Bridge" && tx.status === "processing")
      .sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
  }, [rawTransactions]);

  const handleAdjustBalance = (userId: string, asset: string, amount: number) => {
    if (!db) return;
    const userRef = doc(db, "users", userId);
    const payload = { [asset]: increment(amount) };
    
    updateDoc(userRef, payload)
      .then(() => {
        toast({ title: "Intervensi Berhasil", description: `Saldo nasabah telah disesuaikan.` });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: payload
        }));
      });
  };

  const handleApproveBridge = async (bridgeTx: any) => {
    if (!db || !isAuthorized || typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "Infrastruktur Tidak Siap", description: "Pastikan MetaMask terhubung." });
      return;
    }
    
    setProcessingBridge(bridgeTx.id);
    
    try {
      // 1. Ekstrak Alamat Wallet
      const description = bridgeTx.description || "";
      const addressMatch = description.match(/0x[a-fA-F0-9]{40,}/i);
      let destAddress = bridgeTx.toAddress || (addressMatch ? addressMatch[0] : null);

      if (!destAddress && bridgeTx.path) {
        const pathParts = bridgeTx.path.split('/');
        const userIdFromPath = pathParts[1];
        const userProfile = allUsers?.find(u => u.id === userIdFromPath);
        if (userProfile?.walletAddress) destAddress = userProfile.walletAddress;
      }

      if (!destAddress) throw new Error("Alamat wallet tujuan tidak ditemukan.");

      // 2. Verifikasi Otoritas Wallet yang Terhubung
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentWallet = (await signer.getAddress()).toLowerCase();
      
      if (contractOwner && currentWallet !== contractOwner) {
        throw new Error(`Wallet yang terhubung (${currentWallet.slice(0,6)}) bukan pemilik Smart Contract. Harap gunakan wallet Owner (${contractOwner.slice(0,6)}) di MetaMask.`);
      }

      // 3. Interaksi Blockchain
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      const amountInWei = parseEther(bridgeTx.cryptoAmount.toString());
      
      // Cek Saldo Vault sebelum kirim
      const vaultBalance = await contract.getTotalVaultBalance();
      if (vaultBalance < amountInWei) {
        throw new Error("Saldo ETH di Smart Contract (Vault) tidak mencukupi untuk penarikan ini.");
      }

      toast({ title: "Menunggu Konfirmasi", description: "Silakan setujui pengiriman dana di MetaMask Anda." });
      
      const tx = await contract.releaseFunds(destAddress, amountInWei);
      toast({ title: "Transaksi Diproses", description: "Menunggu konfirmasi blok Mainnet..." });
      
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        // 4. Update Database
        const txRef = doc(db, bridgeTx.path);
        await updateDoc(txRef, { 
          status: "success", 
          executedAt: new Date().toISOString(),
          txHash: receipt.hash 
        });

        const userId = bridgeTx.path.split('/')[1];
        if (userId) {
          await addDoc(collection(db, "users", userId, "notifications"), {
            title: "Settlement Berhasil",
            message: `Dana ${bridgeTx.cryptoAmount} ETH telah terkirim ke wallet Anda.`,
            type: "success",
            read: false,
            createdAt: new Date().toISOString()
          });
        }

        toast({ title: "Settlement Sukses", description: "Dana telah berpindah secara fisik ke dompet nasabah." });
        syncOnChainVault();
      }
    } catch (err: any) {
      console.error("Settlement Error:", err);
      let errMsg = err.reason || err.message || "Gagal melakukan interaksi blockchain.";
      if (errMsg.includes("execution reverted")) {
        errMsg = "Eksekusi ditolak Smart Contract. Pastikan Anda adalah OWNER dan saldo Vault mencukupi.";
      }
      toast({ variant: "destructive", title: "Settlement Gagal", description: errMsg });
    } finally {
      setProcessingBridge(null);
    }
  };

  const platformStats = useMemo(() => {
    const users = allUsers || [];
    const invoices = globalInvoices || [];
    
    return {
      totalIdr: users.reduce((acc, curr) => acc + (curr.totalBalance || 0), 0),
      totalSales: invoices.filter(i => i.status === 'paid').reduce((acc, curr) => acc + (curr.amountIdr || 0), 0),
      userCount: users.length,
      paidInvoices: invoices.filter(i => i.status === 'paid').length
    };
  }, [allUsers, globalInvoices]);

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Verifying Ownership...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-12 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg border border-destructive/20 p-4">
              <ShieldAlert className="text-destructive w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Owner Command Center</h1>
                <Badge variant="destructive" className="px-3 py-1 rounded-full text-[10px] font-black">SUPER ADMIN</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Encrypted Access: {OWNER_EMAIL}
              </p>
            </div>
          </div>

          {contractOwner && connectedAddress && connectedAddress !== contractOwner && (
            <div className="bg-amber-100 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-right-4">
              <AlertTriangle className="text-amber-600 w-6 h-6" />
              <div>
                <p className="text-[10px] font-black uppercase text-amber-800">Wallet Warning</p>
                <p className="text-[11px] font-bold text-amber-700 leading-tight">Ganti Wallet MetaMask Anda ke alamat Owner ({contractOwner.slice(0,10)}...) untuk mengeksekusi Bridge.</p>
              </div>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Platform IDR</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Liquidity</p>
            <p className="text-3xl font-black text-accent italic tracking-tighter">Rp {platformStats.totalIdr.toLocaleString()}</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-blue-500/5 relative overflow-hidden group">
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={syncOnChainVault} 
                disabled={syncingVault} 
                className="p-2 rounded-full hover:bg-blue-500/10 text-blue-600 transition-all hover:rotate-180 duration-500"
              >
                <RefreshCw className={cn("w-4 h-4", syncingVault && "animate-spin")} />
              </button>
            </div>
            <div className="flex items-center justify-between mb-2">
              <Coins className="w-5 h-5 text-blue-500" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">On-Chain V3</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vault Reserve</p>
            <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-green-500/5">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-5 h-5 text-green-500" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Marketplace Volume</p>
            <p className="text-3xl font-black text-green-700 italic tracking-tighter">Rp {platformStats.totalSales.toLocaleString()}</p>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase text-white border-white/20">System Status</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mainnet Reach</p>
            <p className="text-2xl font-black italic tracking-tighter">OPERATIONAL</p>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-8">
          <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/10">
            <TabsTrigger value="users" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
              User Management
            </TabsTrigger>
            <TabsTrigger value="bridge" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all relative">
              Bridge Queue
              {pendingBridges && pendingBridges.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-[8px] flex items-center justify-center rounded-full animate-bounce">
                  {pendingBridges.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">
              Marketplace Audit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between flex-wrap gap-4">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-accent">
                  <Users className="w-6 h-6 text-primary" /> Database Nasabah
                </h3>
                <div className="relative w-full md:w-80">
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
                        <td className="px-8 py-5 text-sm font-black italic text-accent">Rp {u.totalBalance?.toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm font-black text-primary italic">{(u.cryptoBalances?.ETH || 0).toFixed(4)} ETH</td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAdjustBalance(u.id, 'totalBalance', 1000000)} 
                            className="rounded-xl border-primary/20 text-primary hover:bg-primary hover:text-white text-[10px] font-black transition-all"
                          >
                            + 1M IDR
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="bridge">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent">V3 Node Bridge Queue</h3>
                    {contractOwner && (
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">Requester: Wallet {contractOwner.slice(0,10)}...</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-black text-blue-600 border-blue-200">WAITING SETTLEMENT</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Asset Amount</th>
                      <th className="px-8 py-6">Source (AliBank)</th>
                      <th className="px-8 py-6">Destination Wallet</th>
                      <th className="px-8 py-6 text-right">Execute</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {pendingBridges.map((bridge) => (
                      <tr key={bridge.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-5 text-[10px] font-bold text-muted-foreground">
                          {bridge.date ? new Date(bridge.date).toLocaleString() : 'Recent'}
                        </td>
                        <td className="px-8 py-5 font-black text-blue-600 italic">
                          {bridge.cryptoAmount} {bridge.cryptoCurrency}
                        </td>
                        <td className="px-8 py-5 text-xs font-black text-accent">
                          {bridge.path ? bridge.path.split('/')[1].slice(0,8) : '...'}
                        </td>
                        <td className="px-8 py-5 text-[10px] font-mono font-medium text-muted-foreground">
                          {bridge.toAddress || bridge.description.match(/0x[a-fA-F0-9]{40,}/i)?.[0] || "V3 External Wallet"}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button 
                            onClick={() => handleApproveBridge(bridge)}
                            disabled={processingBridge === bridge.id}
                            className={cn(
                              "h-10 px-6 rounded-xl text-white font-black italic uppercase text-[10px] shadow-lg",
                              connectedAddress === contractOwner ? "gold-gradient" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {processingBridge === bridge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Release Funds</>}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!pendingBridges || pendingBridges.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-24 text-center">
                          <div className="flex flex-col items-center opacity-30">
                            <Activity className="w-12 h-12 mb-4" />
                            <p className="text-xs font-black uppercase tracking-widest">All Bridge Requests Settled.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="marketplace">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-green-500/5">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-accent">
                  <ShoppingBag className="w-6 h-6 text-green-600" /> Global Sales Ledger
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-6">Invoice ID</th>
                      <th className="px-8 py-6">Product</th>
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-8 py-6">Amount</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {globalInvoices?.map((inv) => (
                      <tr key={inv.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-5 font-black text-accent text-xs">{inv.invoiceId}</td>
                        <td className="px-8 py-5 text-xs font-bold text-muted-foreground">{inv.productName || "Direct Payment"}</td>
                        <td className="px-8 py-5 text-xs font-medium">{inv.customerName}</td>
                        <td className="px-8 py-5 text-xs font-black italic text-primary">Rp {inv.amountIdr?.toLocaleString()}</td>
                        <td className="px-8 py-5">
                          <Badge variant="outline" className={cn(
                            "text-[8px] font-black uppercase px-3 py-1 rounded-full",
                            inv.status === 'paid' ? "bg-green-100 text-green-600 border-green-200" : "bg-primary/10 text-primary border-primary/20"
                          )}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                            <ArrowUpRight className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {(!globalInvoices || globalInvoices.length === 0) && (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                          <Loader2 className="w-10 h-10 animate-spin text-primary/10 mx-auto mb-4" />
                          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">No Marketplace Activity Detected.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
