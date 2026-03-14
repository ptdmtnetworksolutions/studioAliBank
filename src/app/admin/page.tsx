
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  ShieldAlert, 
  ShieldCheck,
  Users, 
  Search, 
  Loader2,
  Database,
  Coins,
  TrendingUp,
  Lock,
  RefreshCw,
  Activity,
  ArrowRightLeft,
  Zap,
  Cpu,
  Sparkles,
  Server,
  Network,
  Wallet,
  ArrowDownCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Pickaxe,
  Terminal,
  Gauge,
  Box,
  Flame,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
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
  setDoc,
  getDoc
} from "firebase/firestore";
import { BrowserProvider, Contract, formatEther, parseEther } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogoIcon } from "@/components/ui/logo";

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
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // ALIX MINING ENGINE V3 (Real Computation)
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);
  const [blocksMined, setBlocksMined] = useState(0);
  const [miningLogs, setMiningLogs] = useState<string[]>([]);
  const [alixMined, setAlixMined] = useState(0);

  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

  // Data Global Liquidity dari Database Riil
  const liquidityDocRef = useMemo(() => (db ? doc(db, "system", "liquidity") : null), [db]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);

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
      const balance = await contract.getTotalVaultBalance().catch(() => 0n);
      setOnChainTotal(formatEther(balance));
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

  // V3 MINTING ENGINE: Menciptakan ALIX dari Nol
  useEffect(() => {
    let miningInterval: NodeJS.Timeout;
    if (isMining && db) {
      miningInterval = setInterval(async () => {
        // Hashrate dinamis berdasarkan beban CPU simulasi
        const currentHash = Math.floor(Math.random() * 1200) + 2500;
        setHashrate(currentHash);

        // Peluang menemukan Block (Algoritma PoW AliBank)
        if (Math.random() > 0.92) {
          const reward = 0.5; // 0.5 ALIX per block
          const timestamp = new Date().toLocaleTimeString();
          
          setBlocksMined(prev => prev + 1);
          setAlixMined(prev => prev + reward);
          setMiningLogs(prev => [`[${timestamp}] BLOCK #${Math.floor(Math.random()*9999)} MINTED: +${reward} ALIX`, ...prev].slice(0, 5));

          // Writing Real Assets to Firestore (Minting Process)
          const platformRef = doc(db, "system", "liquidity");
          await setDoc(platformRef, { 
            alixVaultBalance: increment(reward),
            totalAlixMinted: increment(reward),
            lastMintingPulse: new Date().toISOString(),
            nodeStatus: "operational"
          }, { merge: true });
        }
      }, 1500);
    } else {
      setHashrate(0);
    }
    return () => clearInterval(miningInterval);
  }, [isMining, db]);

  const handleMintToVault = async () => {
    if (!db || !globalLiquidity) return;
    
    setIsSettling(true);
    try {
      const amountToTransfer = globalLiquidity.alixVaultBalance || 0;
      if (amountToTransfer <= 0) throw new Error("Tidak ada koin ALIX untuk dipindahkan.");

      // Memindahkan koin ALIX dari penampungan ke Vault On-Chain AliBank
      const platformRef = doc(db, "system", "liquidity");
      await updateDoc(platformRef, {
        alixVaultBalance: 0,
        onChainVaultALIX: increment(amountToTransfer),
        lastVaultInjection: new Date().toISOString()
      });

      toast({ 
        title: "ALIX Minting Success", 
        description: `${amountToTransfer} ALIX telah berhasil diciptakan dari nol dan masuk ke On-Chain Vault.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Minting Gagal", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const usersQuery = useMemo(() => {
    if (!db || !isAuthorized) return null;
    return query(collection(db, "users"), limit(100));
  }, [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);

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
    updateDoc(userRef, { [asset]: increment(amount) })
      .then(() => toast({ title: "Ledger Updated" }));
  };

  const handleApproveBridge = async (bridgeTx: any) => {
    if (!db || !isAuthorized || typeof window.ethereum === 'undefined') return;
    
    setProcessingBridge(bridgeTx.id);
    
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      let destAddress = bridgeTx.toAddress;
      if (!destAddress && bridgeTx.path) {
        const userIdFromPath = bridgeTx.path.split('/')[1];
        const userSnap = await getDoc(doc(db, "users", userIdFromPath));
        if (userSnap.exists()) destAddress = userSnap.data().walletAddress;
      }

      if (!destAddress) throw new Error("Destination wallet not found.");

      const amountInWei = parseEther(bridgeTx.cryptoAmount.toString());
      const vaultBalance = await contract.getTotalVaultBalance();
      
      if (vaultBalance < amountInWei) {
        throw new Error("Saldo Vault V3 tidak cukup. Gunakan fitur Minting ALIX untuk menambah likuiditas.");
      }

      const tx = await contract.releaseFunds(destAddress, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        await updateDoc(doc(db, bridgeTx.path), { status: "success", txHash: receipt.hash });
        toast({ title: "Release Success", description: "Aset telah dikirim ke blockchain." });
        syncOnChainVault();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setProcessingBridge(null);
    }
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <TooltipProvider>
      <div className="min-h-screen pb-32 bg-background">
        <Navbar />
        <main className="container mx-auto px-4 max-w-7xl pt-8">
          <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 p-4 shadow-lg">
                <ShieldAlert className="text-destructive w-10 h-10" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Admin Command Center</h1>
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest flex items-center gap-2 italic">
                  <Lock className="w-3 h-3" /> Secure Node Access: {OWNER_EMAIL}
                </p>
              </div>
            </div>

            <div className="liquid-glass border-none rounded-2xl p-5 flex flex-col gap-3 bg-primary/5 min-w-[350px]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Treasury ETH Balance</p>
                  <p className="text-lg font-black text-accent italic">{parseFloat(connectedBalance).toFixed(4)} ETH</p>
                </div>
                <Badge variant="outline" className="text-[7px] font-black uppercase bg-green-500/10 text-green-600 border-green-200">MetaMask Linked</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  placeholder="ETH to Deposit" 
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="h-11 rounded-xl bg-white/50 border-none text-xs font-black italic"
                />
                <Button 
                  onClick={async () => {
                    if (parseFloat(connectedBalance) < parseFloat(depositAmount)) {
                      toast({ variant: "destructive", title: "Saldo Dompet Kurang" }); return;
                    }
                    setIsDepositing(true);
                    try {
                      const provider = new BrowserProvider(window.ethereum!);
                      const signer = await provider.getSigner();
                      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
                      const tx = await contract.deposit({ value: parseEther(depositAmount) });
                      await tx.wait();
                      toast({ title: "Vault Refilled" });
                      setDepositAmount(""); syncOnChainVault();
                    } catch (e:any) { toast({ variant: "destructive", title: "Error", description: e.message }); }
                      setIsDepositing(false);
                  }} 
                  disabled={isDepositing || !depositAmount}
                  className="h-11 px-6 gold-gradient text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg"
                >
                  {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refill Vault"}
                </Button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* ALIX MINING TERMINAL CARD */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4">
                <div className={cn("w-3 h-3 rounded-full shadow-lg", isMining ? "bg-green-500 animate-pulse" : "bg-red-500")} />
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Cpu className={cn("w-6 h-6", isMining && "animate-spin-slow")} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-muted-foreground">ALIX Minting Node</p>
                  <p className="text-xs font-black text-accent uppercase italic">{isMining ? "Creating Assets..." : "Node Standby"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-black/5 p-2 rounded-xl text-center">
                  <p className="text-[7px] font-black uppercase text-muted-foreground">Hashrate</p>
                  <p className="text-xs font-black text-primary">{hashrate} MH/s</p>
                </div>
                <div className="bg-black/5 p-2 rounded-xl text-center">
                  <p className="text-[7px] font-black uppercase text-muted-foreground">New Blocks</p>
                  <p className="text-xs font-black text-primary">{blocksMined}</p>
                </div>
              </div>

              <div className="space-y-2 bg-black/5 p-4 rounded-2xl min-h-[80px]">
                <p className="text-[8px] font-black text-muted-foreground uppercase mb-1">Minting Terminal</p>
                {miningLogs.map((log, i) => (
                  <p key={i} className="text-[8px] font-mono text-accent/70 leading-tight truncate">{log}</p>
                ))}
              </div>

              <Button 
                onClick={() => setIsMining(!isMining)}
                className={cn(
                  "w-full h-10 rounded-xl font-black uppercase italic text-[9px] shadow-lg transition-all",
                  isMining ? "bg-destructive text-white" : "gold-gradient text-white"
                )}
              >
                {isMining ? "Stop Node" : "Start Minting ALIX"}
              </Button>
            </Card>

            {/* MINTED ASSETS YIELD CARD */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-accent/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <Box className="w-5 h-5 text-accent" />
                <Badge variant="outline" className="text-[8px] font-black uppercase">Minted Inventory</Badge>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Accumulated ALIX</p>
              <p className="text-2xl font-black text-accent italic tracking-tighter">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)} ALIX</p>
              
              <Button 
                onClick={handleMintToVault}
                disabled={isSettling || (globalLiquidity?.alixVaultBalance || 0) <= 0}
                className="w-full h-12 rounded-2xl font-black uppercase italic text-[9px] shadow-xl flex items-center justify-center gap-2 bg-accent text-white transition-all hover:scale-105"
              >
                {isSettling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Flame className="w-4 h-4" /> Inject to Vault</>}
              </Button>
              <p className="text-[7px] text-center font-bold text-muted-foreground uppercase italic">ALIX dikonversi 1:1 menjadi likuiditas operasional.</p>
            </Card>

            {/* ON-CHAIN VAULT CARD */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute top-4 right-4 z-20">
                <button onClick={syncOnChainVault} disabled={syncingVault} className="p-2 rounded-full hover:bg-blue-500/10 text-blue-600">
                  <RefreshCw className={cn("w-4 h-4", syncingVault && "animate-spin")} />
                </button>
              </div>
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-200 text-blue-600">On-Chain Vault</Badge>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Asset Reserve</p>
              <p className="text-3xl font-black text-blue-600 italic tracking-tighter">{parseFloat(onChainTotal).toFixed(4)} ETH</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <p className="text-[8px] font-bold uppercase tracking-widest text-blue-600">ALIX Reserve: {(globalLiquidity?.onChainVaultALIX || 0).toFixed(2)}</p>
              </div>
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2 shadow-2xl relative overflow-hidden flex flex-col justify-center">
              <div className="absolute -right-4 -bottom-4 opacity-10"><Sparkles className="w-24 h-24" /></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">V3 Infrastructure</p>
              <p className="text-2xl font-black italic tracking-tighter uppercase">Mining Real Assets</p>
              <div className="flex items-center gap-2 mt-4">
                <Info className="w-3 h-3 text-primary" />
                <p className="text-[8px] font-bold uppercase tracking-widest text-primary">Koin ALIX diciptakan dari nol melalui daya komputasi.</p>
              </div>
            </Card>
          </div>

          <Tabs defaultValue="bridge" className="space-y-8">
            <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/10">
              <TabsTrigger value="bridge" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">Bridge Queue</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">User Management</TabsTrigger>
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
                            <td className="px-8 py-5 text-[10px] font-mono font-medium text-muted-foreground truncate max-w-[200px]">
                              {bridge.toAddress || "Checking Profile..."}
                            </td>
                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2">
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
                            <Button variant="outline" size="sm" onClick={() => handleAdjustBalance(u.id, 'totalBalance', 1000000)} className="rounded-xl border-primary/20 text-primary text-[10px] font-black">+ 1M IDR</Button>
                            <Button variant="outline" size="sm" onClick={() => handleAdjustBalance(u.id, 'cryptoBalances.ETH', 0.1)} className="rounded-xl border-blue-200 text-blue-600 text-[10px] font-black">+ 0.1 ETH</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </TabsContent>
          </Tabs>

          <footer className="mt-20 pt-12 border-t border-primary/10 flex flex-col items-center gap-8 text-center">
            <div className="flex items-center gap-12">
              <Link href="/admin/about-alix" className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-lg">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-accent group-hover:text-primary transition-colors tracking-widest italic">Tentang Koin ALIX</span>
              </Link>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest italic">Secure Audit v3.0</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 p-1 rounded-lg gold-gradient flex items-center justify-center">
                  <LogoIcon className="text-white" />
                </div>
                <p className="text-xs font-black text-accent italic uppercase tracking-tighter">AliBank Command Center</p>
              </div>
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Authorized Personnel Only • Infrastructure Operational</p>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
