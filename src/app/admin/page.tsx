
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
  AlertTriangle,
  Plus,
  Wallet,
  ArrowDownCircle,
  Zap,
  Cpu,
  Sparkles,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  addDoc,
  serverTimestamp,
  setDoc
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
  "function withdraw(uint256 _amount) public",
  "function deposit() public payable"
];

const DEFAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

export default function AdminControlPage() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainTotal, setOnChainTotal] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [processingBridge, setProcessingBridge] = useState<string | null>(null);
  const [contractOwner, setContractOwner] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);

  // Mining Bot States
  const [isMining, setIsMining] = useState(false);
  const [miningPower, setMiningPower] = useState(0);
  const [minedToday, setMinedToday] = useState(0);
  const [hashrate, setHashrate] = useState(0);

  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

  const syncOnChainVault = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return;
    setSyncingVault(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        const addr = accounts[0].address.toLowerCase();
        setConnectedAddress(addr);
        const bal = await provider.getBalance(addr);
        setConnectedBalance(formatEther(bal));
      }

      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, provider);
      
      const [balance, ownerAddr] = await Promise.all([
        contract.getTotalVaultBalance().catch(() => 0n),
        contract.owner().catch(() => "0x0")
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
    if (userLoading) return;
    if (!user || user.email !== OWNER_EMAIL) {
      router.push('/');
      return;
    }
    setIsAuthorized(true);
    syncOnChainVault();
  }, [user, userLoading, router, syncOnChainVault]);

  // Mining Bot Simulation Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isMining) {
      interval = setInterval(() => {
        const reward = (Math.random() * 0.0001);
        setMinedToday(prev => prev + reward);
        setHashrate(450 + Math.random() * 50);
        setMiningPower(prev => (prev + 1) % 100);
        
        // Auto-inject to Global Database every 10 seconds simulation
        if (Math.random() > 0.9 && db) {
           const platformRef = doc(db, "system", "liquidity");
           setDoc(platformRef, { 
             totalMinedEth: increment(reward * 10),
             lastUpdate: new Date().toISOString()
           }, { merge: true });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isMining, db]);

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
        toast({ title: "Intervensi Berhasil", description: `Saldo nasabah telah disesuaikan di database.` });
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: payload
        }));
      });
  };

  const handleDepositToVault = async () => {
    if (!depositAmount || isNaN(parseFloat(depositAmount)) || typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "Input Tidak Valid", description: "Masukkan jumlah ETH yang ingin didepositkan." });
      return;
    }
    
    setIsDepositing(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amountToDeposit = parseEther(depositAmount);
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      toast({ title: "Menunggu Konfirmasi", description: "Silakan setujui pengiriman dana di MetaMask Anda." });
      const tx = await contract.deposit({ value: amountToDeposit });
      await tx.wait();
      
      toast({ title: "Refill Berhasil", description: `${depositAmount} ETH telah masuk secara nyata ke Vault AliBank V3.` });
      setDepositAmount("");
      syncOnChainVault();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Refill", description: err.message });
    } finally {
      setIsDepositing(false);
    }
  };

  const handleApproveBridge = async (bridgeTx: any) => {
    if (!db || !isAuthorized || typeof window.ethereum === 'undefined') {
      toast({ variant: "destructive", title: "MetaMask Tidak Terdeteksi", description: "Hubungkan MetaMask untuk mengeksekusi settlement." });
      return;
    }
    
    setProcessingBridge(bridgeTx.id);
    
    try {
      const description = bridgeTx.description || "";
      const addressMatch = description.match(/0x[a-fA-F0-9]{40,}/i);
      let destAddress = bridgeTx.toAddress || (addressMatch ? addressMatch[0] : null);

      if (!destAddress && bridgeTx.path) {
        const userIdFromPath = bridgeTx.path.split('/')[1];
        const userProfile = allUsers?.find(u => u.id === userIdFromPath);
        if (userProfile?.walletAddress) destAddress = userProfile.walletAddress;
      }

      if (!destAddress) throw new Error("Alamat wallet tujuan tidak ditemukan.");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      const amountInWei = parseEther(bridgeTx.cryptoAmount.toString());
      
      toast({ title: "Settlement On-Chain", description: "Mengirim ETH riil melalui V3 Node..." });
      const tx = await contract.releaseFunds(destAddress, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        const txRef = doc(db, bridgeTx.path);
        await updateDoc(txRef, { 
          status: "success", 
          executedAt: new Date().toISOString(),
          txHash: receipt.hash 
        });

        toast({ title: "Settlement Sukses", description: "Dana telah berpindah secara fisik di blockchain." });
        syncOnChainVault();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Settlement Gagal", description: err.message });
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
      userCount: users.length
    };
  }, [allUsers, globalInvoices]);

  if (userLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Verifying Command Authority...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-12 pt-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center shadow-lg border border-destructive/20 p-4">
              <ShieldAlert className="text-destructive w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Command Center</h1>
                <Badge variant="destructive" className="px-3 py-1 rounded-full text-[10px] font-black">SUPER ADMIN</Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Secure Node Access: {OWNER_EMAIL}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="liquid-glass border-none rounded-2xl p-5 flex flex-col gap-3 bg-primary/5 min-w-[300px]">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-muted-foreground uppercase flex items-center gap-1">
                  <Wallet className="w-3 h-3" /> Treasury Wallet: <span className="text-accent">{parseFloat(connectedBalance).toFixed(4)} ETH</span>
                </p>
                <Badge variant="outline" className="text-[7px] font-black uppercase">MetaMask Connected</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="0.00 ETH" 
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-11 rounded-xl bg-white/50 border-none text-xs font-black italic flex-1"
                />
                <Button 
                  onClick={handleDepositToVault} 
                  disabled={isDepositing || !depositAmount}
                  className="h-11 px-6 gold-gradient text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg"
                >
                  {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowDownCircle className="w-4 h-4 mr-2" /> Refill Vault</>}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* V3 Mining Node Card */}
          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-accent/5 relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.2)]", isMining ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Cpu className={cn("w-6 h-6", isMining ? "text-primary animate-spin-slow" : "text-muted-foreground")} />
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">V3 Mining Node</p>
                <p className="text-xs font-black text-accent uppercase italic">{isMining ? "Active & Generating" : "Node Inactive"}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Hashrate: {hashrate.toFixed(2)} MH/s</span>
                <span>Power: {miningPower}%</span>
              </div>
              <Progress value={miningPower} className="h-1.5 bg-primary/10" />
            </div>
            <div className="pt-2">
              <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Liquidity Generated (Today)</p>
              <p className="text-xl font-black text-primary italic">+{minedToday.toFixed(6)} ETH</p>
            </div>
            <Button 
              onClick={() => setIsMining(!isMining)}
              className={cn(
                "w-full h-10 rounded-xl font-black uppercase italic text-[9px] shadow-lg transition-all",
                isMining ? "bg-destructive text-white" : "gold-gradient text-white"
              )}
            >
              {isMining ? "Shutdown Node" : "Activate Autonomous Mining"}
            </Button>
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
              <Badge variant="outline" className="text-[8px] font-black uppercase">On-Chain Vault</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vault ETH Reserve</p>
            <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
          </Card>

          <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase">Internal IDR</Badge>
            </div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Liquidity</p>
            <p className="text-3xl font-black text-accent italic tracking-tighter">Rp {platformStats.totalIdr.toLocaleString()}</p>
          </Card>

          <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2 shadow-2xl relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Sparkles className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <Server className="w-5 h-5 text-primary" />
              <Badge variant="outline" className="text-[8px] font-black uppercase text-white border-white/20">V3 Infrastructure</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mainnet Reach</p>
            <p className="text-2xl font-black italic tracking-tighter">SYNCHRONIZED</p>
          </Card>
        </div>

        <Tabs defaultValue="bridge" className="space-y-8">
          <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/10">
            <TabsTrigger value="bridge" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">
              Bridge Queue
              {pendingBridges && pendingBridges.length > 0 && (
                <span className="ml-2 bg-destructive text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingBridges.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">
              User Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bridge">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-blue-500/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ArrowRightLeft className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent">V3 Node Bridge Queue</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Waiting for On-Chain Settlement</p>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                      <th className="px-8 py-6">Timestamp</th>
                      <th className="px-8 py-6">Asset Amount</th>
                      <th className="px-8 py-6">Destination Wallet</th>
                      <th className="px-8 py-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/5">
                    {pendingBridges.map((bridge) => {
                      const isInsufficient = bridge.cryptoAmount > parseFloat(onChainTotal);
                      return (
                        <tr key={bridge.id} className={cn("hover:bg-primary/5 transition-colors", isInsufficient && "bg-destructive/5")}>
                          <td className="px-8 py-5 text-[10px] font-bold text-muted-foreground">
                            {bridge.date ? new Date(bridge.date).toLocaleString() : 'Recent'}
                          </td>
                          <td className="px-8 py-5 font-black italic">
                            <span className={cn(isInsufficient ? "text-destructive" : "text-blue-600")}>
                              {bridge.cryptoAmount} {bridge.cryptoCurrency}
                            </span>
                            {isInsufficient && <Badge className="ml-2 bg-destructive/10 text-destructive border-none text-[7px]">LOW VAULT</Badge>}
                          </td>
                          <td className="px-8 py-5 text-[10px] font-mono font-medium text-muted-foreground">
                            {bridge.toAddress || bridge.description.match(/0x[a-fA-F0-9]{40,}/i)?.[0] || "Dest: Profile Wallet"}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Button 
                              onClick={() => handleApproveBridge(bridge)}
                              disabled={processingBridge === bridge.id || isInsufficient}
                              className="h-10 px-6 rounded-xl text-white font-black italic uppercase text-[10px] gold-gradient shadow-lg"
                            >
                              {processingBridge === bridge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4 mr-2" /> Release Funds</>}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!pendingBridges || pendingBridges.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-24 text-center">
                          <Activity className="w-12 h-12 mb-4 text-primary/20 mx-auto" />
                          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-30">All Bridge Requests Settled.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="users">
            <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
              <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                <h3 className="text-xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-accent">
                  <Users className="w-6 h-6 text-primary" /> User Database
                </h3>
                <Input 
                  placeholder="Search by Name or Account..." 
                  className="h-12 w-80 rounded-xl liquid-glass border-none text-xs font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                      <tr key={u.id} className="hover:bg-primary/5 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-accent">{u.name}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{u.accountNumber}</p>
                        </td>
                        <td className="px-8 py-5 text-sm font-black italic text-accent">Rp {u.totalBalance?.toLocaleString()}</td>
                        <td className="px-8 py-5 text-sm font-black text-primary italic">{(u.cryptoBalances?.ETH || 0).toFixed(4)} ETH</td>
                        <td className="px-8 py-5 text-right space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAdjustBalance(u.id, 'totalBalance', 1000000)} 
                            className="rounded-xl border-primary/20 text-primary text-[10px] font-black"
                          >
                            + 1M IDR
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleAdjustBalance(u.id, 'cryptoBalances.ETH', 0.1)} 
                            className="rounded-xl border-blue-200 text-blue-600 text-[10px] font-black"
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
        </Tabs>
      </main>
    </div>
  );
}
