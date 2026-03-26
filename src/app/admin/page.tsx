
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
  CheckCircle2,
  PackagePlus
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
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainTotal, setOnChainTotal] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [connectedBalance, setConnectedBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // ALIX MINING ENGINE V3
  const [isMining, setIsMining] = useState(false);
  const [hashrate, setHashrate] = useState(0);
  const [miningLogs, setMiningLogs] = useState<string[]>([]);

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
          const reward = 0.5;
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

  const handleSeedProducts = async () => {
    if (!db) return;
    setIsSeeding(true);
    try {
      const mktRef = collection(db, "marketplace");
      const premiumProduct = {
        id: "prod-master-node-v3",
        name: "AliBank V3 Global Master Node",
        description: "Infrastruktur Web3 tingkat tinggi dengan kapasitas likuiditas global dan hak bagi hasil mining maksimal. Mendukung transaksi lintas benua secara otonom.",
        priceIdr: 15500000000, // Approx $1M
        category: "Infrastructure",
        stock: 5,
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop",
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(mktRef, premiumProduct.id), premiumProduct);
      toast({ title: "Premium Products Online", description: "Produk Master Node $1M telah ditambahkan ke database marketplace." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal", description: err.message });
    } finally {
      setIsSeeding(false);
    }
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
      await updateDoc(doc(db, "system", "liquidity"), {
        onChainVaultALIX: 0, 
        syntheticEthReserve: increment(ethEquivalent),
        totalEthInjectedFromAlix: increment(ethEquivalent)
      });

      toast({ 
        title: "Liquidity Rights Validated", 
        description: `Berhasil memvalidasi hak tarik sebesar ${ethEquivalent.toFixed(4)} ETH dari hasil mining.` 
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Validation Failed", description: err.message });
    } finally {
      setIsSettling(false);
    }
  };

  const handleRealWorldBridge = async () => {
    if (!db || !globalLiquidity || typeof window.ethereum === 'undefined') return;
    const reserveAmount = globalLiquidity.syntheticEthReserve || 0;
    const physicalAmount = parseFloat(onChainTotal) || 0;

    if (reserveAmount <= 0) {
      toast({ variant: "destructive", title: "Gagal", description: "Anda belum memiliki jatah penarikan dari hasil mining." });
      return;
    }

    if (reserveAmount > physicalAmount) {
      toast({ 
        variant: "destructive", 
        title: "Kas Bank Sedang Kosong", 
        description: `Anda memiliki hak tarik ${reserveAmount.toFixed(4)} ETH, namun kas fisik bank (On-Chain) baru tersedia ${physicalAmount.toFixed(4)} ETH.` 
      });
      return;
    }

    setIsSettling(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(DEFAULT_CONTRACT, CONTRACT_ABI, signer);
      
      const amountInWei = parseEther(reserveAmount.toFixed(18));
      
      toast({ title: "Mencairkan Profit...", description: "Mentransfer ETH dari Kas Bank ke MetaMask Anda." });
      
      const tx = await contract.releaseFunds(ADMIN_WALLET, amountInWei);
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        await updateDoc(doc(db, "system", "liquidity"), {
          syntheticEthReserve: 0
        });
        toast({ title: "Profit Cair!", description: `${reserveAmount.toFixed(4)} ETH telah terkirim ke dompet pribadi Anda.` });
        syncOnChainVault();
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Blockchain Error", description: err.message });
    } finally {
      setIsSettling(false);
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
                <h1 className="text-4xl font-black text-accent uppercase italic tracking-tighter">Command Center</h1>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest italic truncate max-w-[300px]">NODE: {ADMIN_WALLET}</p>
                  <button onClick={() => window.open(`https://etherscan.io/address/${DEFAULT_CONTRACT}`, '_blank')} className="text-primary hover:text-primary/80 flex items-center gap-1 font-black text-[10px] uppercase">
                    View On Etherscan <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSeedProducts} 
                disabled={isSeeding}
                className="h-14 px-6 rounded-2xl bg-blue-600 text-white font-black uppercase text-[10px] italic shadow-xl hover:bg-blue-700"
              >
                {isSeeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <><PackagePlus className="w-4 h-4 mr-2" /> Seed Premium Inventory</>}
              </Button>

              <div className="liquid-glass border-none rounded-2xl p-5 flex flex-col gap-3 bg-primary/5 min-w-[350px]">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">Treasury (Initial Funding)</p>
                    <p className="text-lg font-black text-accent italic">{parseFloat(connectedBalance).toFixed(4)} ETH</p>
                  </div>
                  <Badge variant="outline" className="text-[7px] font-black uppercase bg-green-500/10 text-green-600 border-green-200">Owner Wallet</Badge>
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
                    {isDepositing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Fill Physical Liquidity"}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-4 bg-accent/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-2"><Box className="w-5 h-5 text-accent" /><Badge variant="outline" className="text-[8px] font-black uppercase">Inventory</Badge></div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Available ALIX</p>
              <p className="text-2xl font-black text-accent italic">{(globalLiquidity?.onChainVaultALIX || 0).toFixed(2)} ALIX</p>
              <Button 
                onClick={handleMintToInventory} 
                disabled={isSettling || (globalLiquidity?.alixVaultBalance || 0) <= 0} 
                className="w-full h-10 rounded-xl font-black uppercase italic text-[8px] bg-accent text-white"
              >
                Add Stock
              </Button>
            </Card>

            <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-2 bg-blue-500/5 relative overflow-hidden group">
              <div className="absolute top-4 right-4"><button onClick={syncOnChainVault} disabled={syncingVault} className="p-2 rounded-full hover:bg-blue-500/10 text-blue-600"><RefreshCw className={cn("w-4 h-4", syncingVault && "animate-spin")} /></button></div>
              <div className="flex items-center justify-between mb-2">
                <Coins className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-[8px] font-black uppercase border-blue-200 text-blue-600 flex items-center gap-1">
                  <ShieldCheck className="w-2 h-2" /> Bank Vault
                </Badge>
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">On-Chain Cash (ETH)</p>
              <p className="text-3xl font-black text-blue-600 italic">
                {parseFloat(onChainTotal).toFixed(4)} ETH
              </p>
              
              <div className="pt-4 space-y-2">
                <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg">
                  <span className="text-[8px] font-black text-muted-foreground uppercase">Liquidity Rights</span>
                  <span className="text-[10px] font-black text-accent">{(globalLiquidity?.syntheticEthReserve || 0).toFixed(4)} ETH</span>
                </div>
                <Button 
                  onClick={handleRefillFromEarnings} 
                  disabled={isSettling || (globalLiquidity?.onChainVaultALIX || 0) <= 0} 
                  className="w-full h-10 rounded-xl font-black uppercase italic text-[8px] bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                >
                  Convert ALIX to Rights
                </Button>
              </div>
            </Card>

            <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white space-y-2 shadow-2xl relative overflow-hidden group flex flex-col justify-center">
              <div className="absolute top-4 right-4 animate-pulse"><Zap className="w-4 h-4 text-primary" /></div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Payout Engine</p>
              <p className="text-2xl font-black italic tracking-tighter uppercase">Cairkan Profit</p>
              <p className="text-[8px] font-medium opacity-50 uppercase tracking-widest leading-tight">Gunakan hak tarik ALIX untuk mengambil ETH dari kas bank ke dompet Anda.</p>
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
                      {/* Mapping pending withdraws code remains same... */}
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
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase text-accent tracking-widest italic">Secure Audit v3.0</span>
              </div>
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
