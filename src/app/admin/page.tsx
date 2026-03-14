
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
  BookOpen,
  Banknote,
  ArrowUpRight,
  Building2,
  CheckCircle2
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
const ADMIN_WALLET = "0xc7D06CA4a4B00b19fFa1a4EFCB3cB3e12c24d777";

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
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  // ALIX MINING ENGINE V3
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);
  const [miningLogs, setMiningLogs] = useState<string[]>([]);

  // ALIX -> ETH Conversion Rate: 1 ALIX = 0.0002 ETH
  const ALIX_TO_ETH_RATE = 0.0002;

  const OWNER_EMAIL = "alidzulfikar075@gmail.com";

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

  useEffect(() => {
    let miningInterval: NodeJS.Timeout;
    if (isMining && db) {
      miningInterval = setInterval(async () => {
        const currentHash = Math.floor(Math.random() * 1200) + 2500;
        setHashrate(currentHash);

        if (Math.random() > 0.92) {
          const reward = 0.5; // Reward ALIX
          const timestamp = new Date().toLocaleTimeString();
          setMiningLogs(prev => [`[${timestamp}] BLOCK MINTED: +${reward} ALIX`, ...prev].slice(0, 5));

          const platformRef = doc(db, "system", "liquidity");
          await setDoc(platformRef, { 
            alixVaultBalance: increment(reward),
            totalAlixMinted: increment(reward),
            lastMintingPulse: new Date().toISOString()
          }, { merge: true });
        }
      }, 1500);
    } else {
      setHashrate(0);
    }
    return () => clearInterval(miningInterval);
  }, [isMining, db]);

  const handleMintToInventory = async () => {
    if (!db || !globalLiquidity) return;
    setIsSettling(true);
    try {
      const amountToTransfer = globalLiquidity.alixVaultBalance || 0;
      if (amountToTransfer <= 0) throw new Error("Tidak ada koin ALIX hasil mining.");
      await updateDoc(doc(db, "system", "liquidity"), {
        alixVaultBalance: 0,
        onChainVaultALIX: increment(amountToTransfer)
      });
      toast({ title: "ALIX Minted to Inventory" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally { setIsSettling(false); }
  };

  const handleRefillFromEarnings = async () => {
    if (!db || !globalLiquidity) return;
    const alixAmount = globalLiquidity.onChainVaultALIX || 0;
    if (alixAmount <= 0) {
      toast({ variant: "destructive", title: "ALIX Inventory Kosong" });
      return;
    }

    const ethEquivalent = alixAmount * ALIX_TO_ETH_RATE;
    setIsSettling(true);

    try {
      // PROSES OTONOM: Hanya update internal database untuk mengisi kas bank sintetis
      // Tanpa pemicuan MetaMask pada tahap ini (sesuai permintaan user)
      await updateDoc(doc(db, "system", "liquidity"), {
        onChainVaultALIX: 0, 
        syntheticEthReserve: increment(ethEquivalent),
        totalEthInjectedFromAlix: increment(ethEquivalent)
      });

      toast({ 
        title: "Vault Refilled from Earnings", 
        description: `Berhasil mengubah ALIX menjadi ${ethEquivalent.toFixed(4)} ETH di kas bank. Siap ditarik ke MetaMask!` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Refill Failed", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleRealWorldBridge = async () => {
    if (!db || !globalLiquidity || typeof window.ethereum === 'undefined') return;
    const reserveAmount = globalLiquidity.syntheticEthReserve || 0;
    if (reserveAmount <= 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Tidak ada jatah penarikan (Earnings) di kas bank." });
      return;
    }

    const onChainBal = parseFloat(onChainTotal);
    if (onChainBal < reserveAmount) {
      toast({ 
        variant: "destructive", 
        title: "Kas Bank On-Chain Tidak Cukup", 
        description: `Saldo Vault riil adalah ${onChainBal} ETH. Meskipun Anda punya earnings ${reserveAmount.toFixed(4)} ETH, kas fisik di blockchain harus diisi terlebih dahulu.` 
      });
      return;
    }

    setIsSettling(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const amountInWei = parseEther(reserveAmount.toFixed(18));
      
      toast({ title: "Memicu Blockchain...", description: "Mentransfer ETH Riil ke dompet Anda via Smart Contract." });
      const tx = await contract.releaseFunds(ADMIN_WALLET, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        await updateDoc(doc(db, "system", "liquidity"), {
          syntheticEthReserve: 0
        });
        toast({ title: "Bridge Berhasil!", description: `${reserveAmount.toFixed(4)} ETH telah terkirim ke MetaMask. Cek Etherscan!` });
        syncOnChainVault();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Blockchain Error", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleRedeemAlixToIdr = async () => {
    if (!db || !user || !globalLiquidity) return;
    setIsSettling(true);
    try {
      const amountToRedeem = globalLiquidity.onChainVaultALIX || 0;
      if (amountToRedeem <= 0) throw new Error("Inventory Kosong.");
      const totalIdr = amountToRedeem * 500000;
      await updateDoc(doc(db, "system", "liquidity"), { onChainVaultALIX: 0 });
      await updateDoc(doc(db, "users", user.uid), { totalBalance: increment(totalIdr) });
      await addDoc(collection(db, "users", user.uid, "transactions"), {
        date: new Date().toISOString(),
        description: `ALIX Redemption to IDR`,
        category: "Income",
        amount: totalIdr,
        type: "income",
        timestamp: serverTimestamp()
      });
      toast({ title: "Redemption Berhasil" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally { setIsSettling(false); }
  };

  const usersQuery = useMemo(() => (!db || !isAuthorized) ? null : query(collection(db, "users"), limit(100)), [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);

  const txQuery = useMemo(() => (!db || !isAuthorized) ? null : query(collectionGroup(db, "transactions"), limit(200)), [db, isAuthorized]);
  const { data: rawTransactions } = useCollection(txQuery);

  const pendingBridges = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions.filter(tx => tx.category === "Bridge" && tx.status === "processing").sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [rawTransactions]);

  const pendingWithdraws = useMemo(() => {
    if (!rawTransactions) return [];
    return rawTransactions.filter(tx => tx.category === "Withdraw" && tx.status === "pending").sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  }, [rawTransactions]);

  const handleApproveWithdraw = async (tx: any) => {
    if (!db) return;
    setProcessingId(tx.id);
    try {
      await updateDoc(doc(db, tx.path), { status: "success", settledAt: new Date().toISOString() });
      const userId = tx.path.split('/')[1];
      await addDoc(collection(db, "users", userId, "notifications"), {
        title: "Pencairan Berhasil",
        message: `Dana Rp ${tx.amount.toLocaleString()} telah berhasil dikirim ke rekening ${tx.bankDetails?.bank.toUpperCase()} Anda.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });
      toast({ title: "Settlement Berhasil" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally { setProcessingId(null); }
  };

  const handleApproveBridge = async (bridgeTx: any) => {
    if (!db || !isAuthorized || typeof window.ethereum === 'undefined') return;
    setProcessingId(bridgeTx.id);
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
      const tx = await contract.releaseFunds(destAddress, amountInWei);
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        await updateDoc(doc(db, bridgeTx.path), { status: "success", txHash: receipt.hash });
        toast({ title: "Release Success" });
        syncOnChainVault();
      }
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); } finally { setProcessingId(null); }
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
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Command Center</h1>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest italic truncate max-w-[300px]">NODE: {ADMIN_WALLET}</p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => window.open(`https://etherscan.io/address/${DEFAULT_CONTRACT}`, '_blank')} className="text-primary hover:text-primary/80 flex items-center gap-1 font-black text-[10px] uppercase">
                        View On Etherscan <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Lihat Smart Contract di Etherscan</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="liquid-glass border-none rounded-2xl p-5 flex flex-col gap-3 bg-primary/5 min-w-[350px]">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <p className="text-[9px] font-black text-muted-foreground uppercase">Treasury Wallet Balance</p>
                  <p className="text-lg font-black text-accent italic">{parseFloat(connectedBalance).toFixed(4)} ETH</p>
                </div>
                <Badge variant="outline" className="text-[7px] font-black uppercase bg-green-500/10 text-green-600 border-green-200">MetaMask Linked</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Input placeholder="ETH to Deposit" type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="h-11 rounded-xl bg-white/50 border-none text-xs font-black italic" />
                <Button onClick={async () => {
                  setIsDepositing(true);
                  try {
                    const provider = new BrowserProvider(window.ethereum!);
                    const signer = await provider.getSigner();
                    const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
                    const tx = await contract.deposit({ value: parseEther(depositAmount) });
                    await tx.wait(); toast({ title: "Vault Refilled" }); setDepositAmount(""); syncOnChainVault();
                  } catch (e:any) { toast({ variant: "destructive", title: "Error", description: e.message }); }
                  setIsDepositing(false);
                }} disabled={isDepositing || !depositAmount} className="h-11 px-6 gold-gradient text-white rounded-xl text-[10px] font-black uppercase italic shadow-lg">
                  {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refill Vault"}
                </Button>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* MINING NODE */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-primary/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4"><div className={cn("w-3 h-3 rounded-full shadow-lg", isMining ? "bg-green-500 animate-pulse" : "bg-red-500")} /></div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary"><Pickaxe className={cn("w-6 h-6", isMining && "animate-bounce")} /></div>
                <div><p className="text-[9px] font-black uppercase text-muted-foreground">ALIX Mining Node</p></div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="bg-black/5 p-2 rounded-xl text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Hashrate</p><p className="text-xs font-black text-primary">{hashrate} MH/s</p></div>
                <div className="bg-black/5 p-2 rounded-xl text-center"><p className="text-[7px] font-black uppercase text-muted-foreground">Yield</p><p className="text-xs font-black text-primary">{(globalLiquidity?.alixVaultBalance || 0).toFixed(2)}</p></div>
              </div>
              <Button onClick={() => setIsMining(!isMining)} className={cn("w-full h-10 rounded-xl font-black uppercase italic text-[9px] shadow-lg", isMining ? "bg-destructive text-white" : "gold-gradient text-white")}>
                {isMining ? "Stop Mining" : "Start Mining ALIX"}
              </Button>
            </Card>

            {/* MINTED INVENTORY */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-accent/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2"><Box className="w-5 h-5 text-accent" /><Badge variant="outline" className="text-[8px] font-black uppercase">Minted Inventory</Badge></div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available ALIX</p>
              <p className="text-2xl font-black text-accent italic">{(globalLiquidity?.onChainVaultALIX || 0).toFixed(2)} ALIX</p>
              <div className="flex gap-2">
                <Button onClick={handleMintToInventory} disabled={isSettling || (globalLiquidity?.alixVaultBalance || 0) <= 0} className="flex-1 h-10 rounded-xl font-black uppercase italic text-[8px] bg-accent text-white">
                  Add Stock
                </Button>
                <Button onClick={handleRedeemAlixToIdr} disabled={isSettling || (globalLiquidity?.onChainVaultALIX || 0) <= 0} className="flex-1 h-10 rounded-xl font-black uppercase italic text-[8px] gold-gradient text-white">
                  Redeem IDR
                </Button>
              </div>
            </Card>

            {/* BANK ETH RESERVE - SHOWING ON-CHAIN VS EARNINGS */}
            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-blue-500/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4"><button onClick={syncOnChainVault} disabled={syncingVault} className="p-2 rounded-full hover:bg-blue-500/10 text-blue-600"><RefreshCw className={cn("w-4 h-4", syncingVault && "animate-spin")} /></button></div>
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-blue-500" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-200 text-blue-600 cursor-help flex items-center gap-1">
                      <ShieldCheck className="w-2 h-2" /> Live Reserve
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3 rounded-xl bg-accent text-white">
                    <p className="text-[10px] font-bold">Saldo Kas Bank yang benar-benar ada di Smart Contract (On-Chain). Anda menarik gaji mining dari sini.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vault ETH Reserve</p>
              <p className="text-3xl font-black text-blue-600 italic">
                {onChainTotal} ETH
              </p>
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Mining Earnings</span>
                  <span className="text-[10px] font-black text-accent">{(globalLiquidity?.syntheticEthReserve || 0).toFixed(4)} ETH</span>
                </div>
                <Button 
                  onClick={handleRefillFromEarnings} 
                  disabled={isSettling || (globalLiquidity?.onChainVaultALIX || 0) <= 0} 
                  className="w-full h-10 rounded-xl font-black uppercase italic text-[8px] bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {isSettling ? <Loader2 className="w-3 h-3 animate-spin" /> : "Refill Vault from Earnings"}
                </Button>
              </div>
            </Card>

            {/* MAINNET BRIDGE - REDEEM TO METAMASK */}
            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2 shadow-2xl relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-4 right-4 animate-pulse"><Zap className="w-4 h-4 text-primary" /></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mainnet Payout</p>
              <p className="text-2xl font-black italic tracking-tighter uppercase">Redeem to Wallet</p>
              <p className="text-[8px] font-medium opacity-50 uppercase tracking-widest leading-tight">Cairkan hasil mining Anda dari Vault ke dompet MetaMask secara riil.</p>
              <Button 
                onClick={handleRealWorldBridge} 
                disabled={isSettling || (globalLiquidity?.syntheticEthReserve || 0) <= 0} 
                className="w-full h-10 rounded-xl font-black uppercase italic text-[9px] gold-gradient text-white shadow-xl mt-4"
              >
                {isSettling ? <Loader2 className="w-3 h-3 animate-spin" /> : "Bridge to MetaMask (On-Chain)"}
              </Button>
            </Card>
          </div>

          <Tabs defaultValue="withdraw" className="space-y-8">
            <TabsList className="bg-primary/5 p-1.5 rounded-2xl h-14 border border-primary/10">
              <TabsTrigger value="withdraw" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">Bank Settlements</TabsTrigger>
              <TabsTrigger value="bridge" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white">Bridge Queue</TabsTrigger>
              <TabsTrigger value="users" className="rounded-xl font-black uppercase text-[10px] tracking-widest px-8 data-[state=active]:gold-gradient data-[state=active]:text-white transition-all">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="withdraw">
              <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent">Bank Withdrawal Queue</h3>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Waiting for Gateway Disbursement</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Date</th>
                        <th className="px-8 py-6">Bank Info</th>
                        <th className="px-8 py-6">Amount</th>
                        <th className="px-8 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {pendingWithdraws.map((tx) => (
                        <tr key={tx.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-8 py-5 text-[10px] font-bold text-muted-foreground">
                            {new Date(tx.date).toLocaleString()}
                          </td>
                          <td className="px-8 py-5">
                            <p className="text-xs font-black uppercase text-accent">{tx.bankDetails?.bank} • {tx.bankDetails?.accountNumber}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">{tx.bankDetails?.accountName}</p>
                          </td>
                          <td className="px-8 py-5 font-black italic text-primary">Rp {tx.amount.toLocaleString()}</td>
                          <td className="px-8 py-5 text-right">
                            <Button 
                              onClick={() => handleApproveWithdraw(tx)}
                              disabled={processingId === tx.id}
                              className="h-10 px-6 rounded-xl text-white font-black italic uppercase text-[10px] gold-gradient shadow-lg"
                            >
                              {processingId === tx.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Settle Transaction</>}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {pendingWithdraws.length === 0 && (
                        <tr><td colSpan={4} className="py-24 text-center text-xs font-black uppercase text-muted-foreground opacity-30">No Bank Withdrawals Pending.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="bridge">
              <section className="liquid-glass rounded-[3rem] overflow-hidden border-none shadow-2xl">
                <div className="p-8 border-b border-primary/5 bg-blue-500/5">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-accent flex items-center gap-3">
                    <ArrowRightLeft className="w-6 h-6 text-blue-600" /> V3 Bridge Queue
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        <th className="px-8 py-6">Asset</th>
                        <th className="px-8 py-6">Wallet</th>
                        <th className="px-8 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {pendingBridges.map((bridge) => (
                        <tr key={bridge.id} className="hover:bg-primary/5">
                          <td className="px-8 py-5 font-black italic text-blue-600">{bridge.cryptoAmount} {bridge.cryptoCurrency}</td>
                          <td className="px-8 py-5 text-[10px] font-mono text-muted-foreground truncate max-w-[200px]">{bridge.toAddress}</td>
                          <td className="px-8 py-5 text-right">
                            <Button onClick={() => handleApproveBridge(bridge)} disabled={processingId === bridge.id} className="h-10 px-6 rounded-xl text-white font-black italic uppercase text-[10px] gold-gradient">
                              {processingId === bridge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Release Funds"}
                            </Button>
                          </td>
                        </tr>
                      ))}
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
                            <Button variant="outline" size="sm" onClick={() => updateDoc(doc(db, "users", u.id), { totalBalance: increment(1000000) })} className="rounded-xl border-primary/20 text-primary text-[10px] font-black">+ 1M IDR</Button>
                            <Button variant="outline" size="sm" onClick={() => updateDoc(doc(db, "users", u.id), { "cryptoBalances.ETH": increment(0.1) })} className="rounded-xl border-blue-200 text-blue-600 text-[10px] font-black">+ 0.1 ETH</Button>
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
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:gold-gradient group-hover:text-white transition-all shadow-lg"><BookOpen className="w-6 h-6" /></div>
                <span className="text-[10px] font-black uppercase text-accent group-hover:text-primary transition-colors tracking-widest italic">Tentang Koin ALIX</span>
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-6 h-6 p-1 rounded-lg gold-gradient flex items-center justify-center"><LogoIcon className="text-white" /></div>
                <p className="text-xs font-black text-accent italic uppercase tracking-tighter">AliBank Command Center</p>
              </div>
              <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Authorized Personnel Only • Gateway Production Mode</p>
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}
