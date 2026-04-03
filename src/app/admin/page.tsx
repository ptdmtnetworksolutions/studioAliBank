
/**
 * CRITICAL: AliBank Admin Control V3.5 - TOKENOMICS & INVENTORY TERMINAL
 * Pusat Kendali Suplai, Kebijakan Moneter ALX, dan Manajemen Katalog Marketplace.
 * Otorisasi Eksklusif: alidzulfikar075@gmail.com / IJOuQpjEOMgvlYfzvQ1yfp976Oa2
 */

"use client";

import { 
  ShieldAlert, 
  ShieldCheck,
  Loader2,
  RefreshCw,
  Coins,
  Zap,
  Pickaxe,
  Box,
  ExternalLink,
  Building2,
  CheckCircle2,
  PackagePlus,
  CreditCard,
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Users,
  ArrowRightLeft,
  Activity,
  ArrowUpRight,
  LayoutGrid,
  FileText,
  Wallet,
  X,
  Lock,
  Search,
  Bell,
  MessageSquare,
  TrendingUp,
  LineChart,
  BarChart3,
  Flame,
  Settings,
  LogOut,
  ChevronRight,
  Database,
  ArrowDownRight,
  Eraser,
  HelpCircle,
  Cpu,
  Globe,
  PlusCircle,
  Key,
  Sparkles,
  Sun,
  Moon,
  Clock,
  ShoppingCart,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  CreditCard as CardIcon,
  PiggyBank,
  Skull,
  Scan,
  Copy,
  ArrowUpFromLine,
  ArrowDownToLine,
  History as HistoryIcon,
  CandlestickChart,
  Edit2,
  Save,
  AlertCircle,
  Gamepad2,
  Trophy,
  RotateCw,
  Smartphone,
  PieChart as PieIcon,
  Timer,
  Info,
  ShoppingBag,
  Layers,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useUser, useDoc, useCollection, useFirestore, useAuth, useMemoFirebase } from "@/firebase";
import { 
  collection, 
  doc, 
  updateDoc, 
  increment, 
  query,
  orderBy,
  limit,
  deleteDoc,
  getDocs,
  writeBatch,
  getDoc,
  setDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { JsonRpcProvider, formatEther, ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import Image from "next/image";
import { useTheme } from "next-themes";
import { 
  ComposedChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

// KONSTANTA GLOBAL ADMIN - ALIBANK VAULT V3
const GLOBAL_RPC = "https://ethereum-rpc.publicnode.com"; 
const ALX_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945"; 
const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";
const ETHERSCAN_API_KEY = "M1S7MDTBQSG1A3URQKYNVF31PSPE48UA8R";
const ALX_PRICE_IDR = 194004;

function AdminContent() {
  const { user, loading: userLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "dashboard");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [onChainEth, setOnChainEth] = useState<string>("0");
  const [adminWalletEth, setAdminWalletEth] = useState<string>("0");
  const [syncingVault, setSyncingVault] = useState(false);
  
  // States for User Management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState("");
  const [alxAdjustment, setAlxAdjustment] = useState("");

  // States for Tokenomics
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isProcessingToken, setIsProcessingToken] = useState(false);

  // States for Inventory
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productPriceIdr, setProductPriceIdr] = useState("");
  const [productPriceUsd, setProductPriceUsd] = useState("");
  const [productCategory, setProductCategory] = useState("Kartu Hadiah");
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  // States for Editing Product
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isEditProductDialogOpen, setIsEditProductDialogOpen] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // States for API Keys
  const [isSavingKeys, setIsSavingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState({
    paypalClientId: "",
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: "0x56268032A3B3E64CFeF1916d591087CF8dF40945"
  });

  // Detailed User States
  const [selectedUserWallets, setSelectedUserWallets] = useState<any[]>([]);
  const [selectedUserDeposits, setSelectedUserDeposits] = useState<any[]>([]);
  const [selectedUserTransactions, setSelectedUserTransactions] = useState<any[]>([]);
  const [loadingSubData, setLoadingSubData] = useState(false);

  const [vaultRecipient, setVaultRecipient] = useState("");
  const [vaultAmount, setVaultAmount] = useState("");
  const [isExecutingVaultTx, setIsExecutingVaultTx] = useState(false);
  const [onChainHistory, setOnChainHistory] = useState<any[]>([]);

  // SHIELDING QUERIES
  const liquidityDocRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "liquidity") : null), [db, isAuthorized]);
  const { data: globalLiquidity } = useDoc(liquidityDocRef);
  
  const usersQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "users"), limit(100)) : null), [db, isAuthorized]);
  const { data: allUsers } = useCollection(usersQuery);
  
  const auditQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "system", "audit", "global_transactions"), orderBy("timestamp", "desc"), limit(100)) : null), [db, isAuthorized]);
  const { data: auditLogs } = useCollection(auditQuery);

  const marketplaceQuery = useMemoFirebase(() => (db && isAuthorized ? query(collection(db, "marketplace"), orderBy("createdAt", "desc")) : null), [db, isAuthorized]);
  const { data: marketplaceProducts } = useCollection(marketplaceQuery);

  const userProfileRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userProfileRef);

  const apiKeysRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "api_keys") : null), [db, isAuthorized]);
  const { data: storedKeys } = useDoc(apiKeysRef);

  useEffect(() => {
    if (storedKeys) {
      setKeys({
        paypalClientId: storedKeys.paypalClientId || "",
        etherscanApiKey: storedKeys.etherscanApiKey || "",
        ethereumRpcUrl: storedKeys.ethereumRpcUrl || "",
        geminiApiKey: storedKeys.geminiApiKey || "",
        alxContractAddress: storedKeys.alxContractAddress || "0x56268032A3B3E64CFeF1916d591087CF8dF40945"
      });
    }
  }, [storedKeys]);

  // AGGREGATE REAL REVENUE DATA FROM AUDIT LOGS
  const candleData = useMemo(() => {
    if (!auditLogs) return Array.from({ length: 24 }, (_, i) => ({ time: `${i}:00`, close: 0, isUp: true }));

    const hours = Array.from({ length: 24 }, (_, i) => {
      const h = i.toString().padStart(2, '0');
      return { time: `${h}:00`, close: 0, isUp: true };
    });

    auditLogs.forEach(log => {
      if (log.timestamp && log.amountIdr) {
        const date = log.timestamp.toDate();
        const hour = date.getHours();
        hours[hour].close += log.amountIdr;
      }
    });

    for (let i = 1; i < hours.length; i++) {
      hours[i].isUp = hours[i].close >= hours[i-1].close;
    }

    return hours;
  }, [auditLogs]);

  useEffect(() => {
    async function fetchSubData() {
      if (!selectedUser || !db || !isUserDialogOpen || !isAuthorized) return;
      setLoadingSubData(true);
      try {
        const walletsSnap = await getDocs(collection(db, "users", selectedUser.id, "wallets"));
        setSelectedUserWallets(walletsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const depositsSnap = await getDocs(collection(db, "users", selectedUser.id, "deposits"));
        setSelectedUserDeposits(depositsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const txsSnap = await getDocs(query(collection(db, "users", selectedUser.id, "transactions"), orderBy("timestamp", "desc"), limit(50)));
        setSelectedUserTransactions(txsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err: any) {
        if (err.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: `users/${selectedUser.id}/subcollections`,
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        }
      } finally {
        setLoadingSubData(false);
      }
    }
    fetchSubData();
  }, [selectedUser, isUserDialogOpen, db, isAuthorized]);

  const syncOnChainData = useCallback(async (manual = false) => {
    if (!isAuthorized) return;
    setSyncingVault(true);
    try {
      const provider = new JsonRpcProvider(keys.ethereumRpcUrl || GLOBAL_RPC);
      const vaultBalance = await provider.getBalance(ALX_CONTRACT).catch(() => 0n);
      setOnChainEth(formatEther(vaultBalance));

      if (userData?.walletAddress) {
        const adminBal = await provider.getBalance(userData.walletAddress).catch(() => 0n);
        setAdminWalletEth(formatEther(adminBal));
      }

      try {
        const [resNormal, resInternal] = await Promise.all([
          fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${ALX_CONTRACT}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${keys.etherscanApiKey || ETHERSCAN_API_KEY}`),
          fetch(`https://api.etherscan.io/api?module=account&action=txlistinternal&address=${ALX_CONTRACT}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${keys.etherscanApiKey || ETHERSCAN_API_KEY}`)
        ]);

        const dataNormal = await resNormal.json();
        const dataInternal = await resInternal.json();
        
        const normalResults = dataNormal.status === "1" ? dataNormal.result : [];
        const internalResults = dataInternal.status === "1" ? dataInternal.result : [];

        const combinedResults = [...normalResults, ...internalResults].sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp));

        if (combinedResults.length > 0) {
          const timeAgo = (ts: string) => {
            const seconds = Math.floor((Date.now() - parseInt(ts) * 1000) / 1000);
            if (seconds < 60) return `${seconds}s ago`;
            if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
            if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
            return `${Math.floor(seconds / 86400)}d ago`;
          };

          const realHistory = combinedResults.slice(0, 20).map((tx: any) => {
            const isOut = tx.from.toLowerCase() === ALX_CONTRACT.toLowerCase();
            const val = formatEther(tx.value);
            return {
              hash: tx.hash ? (tx.hash.slice(0, 10) + "...") : "Internal",
              fullHash: tx.hash || "",
              from: tx.from,
              to: tx.to,
              value: `${parseFloat(val).toFixed(6)} ETH`,
              type: isOut ? "OUT" : "IN",
              time: timeAgo(tx.timeStamp),
              method: tx.functionName ? tx.functionName.split('(')[0] : (tx.input && tx.input !== '0x' ? 'Contract' : (tx.hash ? 'Transfer' : 'Internal'))
            };
          });
          setOnChainHistory(realHistory);
        }
      } catch (apiErr) {
        console.warn("Etherscan API failed", apiErr);
      }
      
      if (manual) {
        toast({ title: "Vault Synced", description: "Node Mainnet telah diperbarui." });
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally { 
      setSyncingVault(false); 
    }
  }, [toast, userData?.walletAddress, isAuthorized, keys.ethereumRpcUrl, keys.etherscanApiKey]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);

    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push('/admin/mobile');
    }
  }, [user, userLoading, router]);

  useEffect(() => {
    if (isAuthorized) {
      syncOnChainData(false);
    }
  }, [isAuthorized, syncOnChainData]);

  const handleUpdateUserBalance = async (type: 'idr' | 'alx', amount: string, operation: 'add' | 'sub') => {
    if (!db || !selectedUser || !amount || !isAuthorized) return;
    const num = parseFloat(amount);
    if (isNaN(num)) return;

    setIsUpdatingUser(true);
    const userRef = doc(db, "users", selectedUser.id);
    const val = operation === 'add' ? num : -num;
    
    const updateData: any = {};
    if (type === 'idr') updateData.totalBalance = increment(val);
    else updateData["cryptoBalances.ALX"] = increment(val);

    updateDoc(userRef, updateData)
      .then(async () => {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `MANUAL-ADJ-${Date.now()}`,
          category: "Manual Adjustment",
          gateway: "Super Admin",
          amountIdr: type === 'idr' ? val : 0,
          description: `Manual ${operation} ${num} ${type.toUpperCase()} for ${selectedUser.name}`,
          timestamp: serverTimestamp(),
          status: "success"
        });

        toast({ title: "Update Berhasil", description: `Saldo ${type.toUpperCase()} telah disesuaikan.` });
        setBalanceAdjustment("");
        setAlxAdjustment("");
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsUpdatingUser(false);
      });
  };

  const handleTokenOperation = async (type: 'mint' | 'burn') => {
    if (!db || !isAuthorized || isProcessingToken) return;
    const amountStr = type === 'mint' ? mintAmount : burnAmount;
    const num = parseFloat(amountStr);
    if (isNaN(num) || num <= 0) return;

    setIsProcessingToken(true);
    try {
      const sysRef = doc(db, "system", "liquidity");
      const change = type === 'mint' ? num : -num;

      await updateDoc(sysRef, {
        alixVaultBalance: increment(change),
        totalAlixSupply: increment(change),
        ...(type === 'mint' ? { totalAlixMinted: increment(num) } : { totalAlixBurned: increment(num) })
      });

      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `${type.toUpperCase()}-${Date.now()}`,
        category: "Tokenomics",
        gateway: "Super Admin Node",
        amountIdr: 0,
        description: `Authorized ALX ${type}: ${num} tokens`,
        timestamp: serverTimestamp(),
        status: "success"
      });

      toast({ title: `ALX ${type === 'mint' ? 'Minted' : 'Burned'}`, description: `${num} ALX has been updated in Vault.` });
      setMintAmount(""); setBurnAmount("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: err.message });
    } finally {
      setIsProcessingToken(false);
    }
  };

  const handleAddProduct = async () => {
    if (!db || !isAuthorized || !productName || !productPriceIdr) return;
    setIsAddingProduct(true);
    try {
      const id = `PROD-${Date.now()}`;
      await setDoc(doc(db, "marketplace", id), {
        id,
        name: productName,
        description: productDesc,
        priceIdr: parseFloat(productPriceIdr),
        priceUsd: parseFloat(productPriceUsd) || 0,
        category: productCategory,
        createdAt: new Date().toISOString()
      });
      
      toast({ title: "Product Deployed", description: `${productName} is now live in marketplace.` });
      setProductName(""); setProductDesc(""); setProductPriceIdr(""); setProductPriceUsd("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed to Add Product", description: err.message });
    } finally {
      setIsAddingProduct(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!db || !isAuthorized || !editingProduct) return;
    setIsUpdatingProduct(true);
    try {
      const prodRef = doc(db, "marketplace", editingProduct.id);
      const updateData = {
        name: editingProduct.name,
        description: editingProduct.description,
        priceIdr: parseFloat(editingProduct.priceIdr),
        priceUsd: parseFloat(editingProduct.priceUsd) || 0,
        category: editingProduct.category,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(prodRef, updateData);
      
      await addDoc(collection(db, "system", "audit", "global_transactions"), {
        id: `PROD-EDIT-${Date.now()}`,
        category: "Catalog Maintenance",
        gateway: "Super Admin",
        description: `Updated product ${editingProduct.name}`,
        timestamp: serverTimestamp(),
        status: "success"
      });

      toast({ title: "Product Updated" });
      setIsEditProductDialogOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!db || !isAuthorized) return;
    if (!confirm("Remove this product from catalog?")) return;
    try {
      await deleteDoc(doc(db, "marketplace", id));
      toast({ title: "Product Removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleSaveAPIKeys = async () => {
    if (!db || !isAuthorized || isSavingKeys) return;
    setIsSavingKeys(true);

    const docRef = doc(db, "system", "api_keys");
    setDoc(docRef, {
      ...keys,
      updatedAt: serverTimestamp(),
      updatedBy: user?.email
    }, { merge: true })
      .then(() => {
        toast({ title: "Konfigurasi Disimpan", description: "API Key sistem telah diperbarui dan disinkronkan." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: keys,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSavingKeys(false);
      });
  };

  const handleResetPassword = async () => {
    if (!auth || !selectedUser?.email || !isAuthorized) return;
    try {
      await sendPasswordResetEmail(auth, selectedUser.email);
      toast({ title: "Email Terkirim", description: `Tautan riset sandi telah dikirim ke ${selectedUser.email}` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Kirim", description: err.message });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!db || !isAuthorized) return;
    if (!confirm("Hapus data nasabah secara permanen? Tindakan ini tidak dapat dibatalkan.")) return;
    
    const userRef = doc(db, "users", userId);
    deleteDoc(userRef)
      .then(() => {
        toast({ title: "User Deleted", description: "Data nasabah telah dihapus dari sistem." });
      })
      .catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleExecuteVaultWithdrawal = async () => {
    if (!vaultRecipient || !vaultAmount || isExecutingVaultTx || !userData?.privateKey || !isAuthorized) {
      toast({ variant: "destructive", title: "Otoritas Ditolak", description: "Kunci Privat & Saldo Gas diperlukan." });
      return;
    }
    
    setIsExecutingVaultTx(true);
    try {
      const provider = new JsonRpcProvider(keys.ethereumRpcUrl || GLOBAL_RPC);
      const wallet = new ethers.Wallet(userData.privateKey, provider);
      const tx = await wallet.sendTransaction({
        to: vaultRecipient,
        value: ethers.parseEther(vaultAmount)
      });
      await tx.wait();
      
      if (db) {
        await addDoc(collection(db, "system", "audit", "global_transactions"), {
          id: `VAULT-WDR-${Date.now()}`,
          category: "External Disbursement",
          gateway: "Ali-Mainnet Node",
          amountIdr: parseFloat(vaultAmount) * 33000000, 
          recipient: vaultRecipient,
          status: "success",
          txHash: tx.hash,
          timestamp: serverTimestamp(),
          description: `Withdrawal to ${vaultRecipient}`
        });
      }
      toast({ title: "Pencairan Berhasil" });
      setVaultRecipient(""); setVaultAmount("");
      syncOnChainData(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Gagal Eksekusi", description: err.message });
    } finally {
      setIsExecutingVaultTx(false);
    }
  };

  const handlePurgeAuditLogs = async () => {
    if (!db || isPurging || !isAuthorized) return;
    if (!confirm("Hapus seluruh riwayat operasi? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsPurging(true);
    try {
      const q = query(collection(db, "system", "audit", "global_transactions"));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      toast({ title: "Sistem Dibersihkan", description: "Semua log audit telah dihapus." });
    } catch (err) {} finally { setIsPurging(false); }
  };

  const [isPurging, setIsPurging] = useState(false);

  const totalGamingEarnings = useMemo(() => {
    return selectedUserTransactions
      .filter(tx => tx.category === "Game" || tx.category === "Trade-X")
      .reduce((acc, tx) => acc + (tx.rewardAlx || 0), 0);
  }, [selectedUserTransactions]);

  const totalDepositsValue = useMemo(() => {
    return selectedUserDeposits.reduce((acc, dep) => acc + (dep.amount || 0), 0);
  }, [selectedUserDeposits]);

  const circulatingSupply = useMemo(() => {
    if (!allUsers) return 0;
    return allUsers.reduce((acc, u) => acc + (u.cryptoBalances?.ALX || 0), 0);
  }, [allUsers]);

  const displayVal = (val: number) => Math.max(0, val || 0);

  if (userLoading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!isAuthorized) return null;

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-body transition-colors duration-300">
        
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-72 bg-card border-r border-border flex flex-col sticky top-0 md:h-screen z-50">
          <div className="p-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient p-2 flex items-center justify-center shadow-lg">
              <LogoIcon className="text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter italic uppercase">AliBank</span>
          </div>

          <nav className="flex-1 px-4 space-y-2 pt-4 overflow-y-auto no-scrollbar">
            <SidebarItem icon={LayoutGrid} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Users} label="Clients" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            <SidebarItem icon={Wallet} label="Vault Control" active={activeTab === 'vault'} onClick={() => setActiveTab('vault')} />
            <SidebarItem icon={Coins} label="Tokenomics" active={activeTab === 'tokenomics'} onClick={() => setActiveTab('tokenomics')} />
            <SidebarItem icon={Key} label="API Management" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
            <SidebarItem icon={Box} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={FileText} label="Audit Logs" active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} />
          </nav>

          <div className="p-6 mt-auto space-y-6 hidden md:block">
            <div className="bg-muted/50 rounded-2xl p-4 border border-border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground">Interface Theme</span>
                <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-primary" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
              <SidebarItem icon={Settings} label="Settings" onClick={() => {}} />
              <SidebarItem icon={LogOut} label="Logout" className="text-rose-500 mt-2" onClick={() => auth?.signOut()} />
            </div>

            <div className="bg-green-600/10 border border-green-600/20 rounded-2xl p-5 space-y-4">
              <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">Kickoff Plan!</h4>
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">Upgrade to enterprise plan for real-time Web3 analytics!</p>
              <Button onClick={() => router.push('/admin/about-alix')} className="w-full bg-green-600 hover:bg-green-700 text-white text-[10px] font-black uppercase h-9 rounded-xl border-none shadow-lg">View Strategy</Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-background transition-colors">
          <header className="h-20 bg-card border-b border-border flex items-center justify-between px-6 md:px-10 sticky top-0 z-40">
            <div className="relative w-full max-sm hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search global data..." className="h-11 pl-12 bg-muted border-none rounded-xl text-xs font-bold w-full max-w-sm" />
            </div>
            <div className="flex gap-4">
               <button onClick={() => syncOnChainData(true)} className="p-2 hover:bg-muted rounded-full transition-colors hidden sm:block">
                  <RefreshCw className={cn("w-5 h-5", syncingVault && "animate-spin")} />
               </button>
               <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-black leading-none">Super Admin</p>
                  <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase">AliBank Web3 Node</p>
                </div>
                <div className="w-10 h-10 rounded-full gold-gradient p-[2px]">
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-background">
                    <Image src="https://picsum.photos/seed/admin/100/100" alt="avatar" width={40} height={40} className="object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="p-6 md:p-10 space-y-10 overflow-y-auto no-scrollbar pb-20">
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-10 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
                          <Database className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-black italic uppercase tracking-tight">AliBank Global Liquidity</h3>
                      </div>
                      <Badge className="bg-green-100 text-green-600 font-black text-[8px] px-3 h-6 rounded uppercase">LIVE SINKRON</Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-muted-foreground uppercase">Total Net Capital (IDR)</p>
                      <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Rp {displayVal(globalLiquidity?.totalFiatInjected).toLocaleString('id-ID')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Vault Reserve (USD)</span>
                        <p className="text-xl font-black italic">$ {displayVal(globalLiquidity?.totalUsdInjected).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Internal AUM</span>
                        <p className="text-xl font-black italic text-green-600">Rp {displayVal(globalLiquidity?.totalInternalAumIdr).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Node Status</span>
                        <p className="text-xl font-black italic text-blue-600 uppercase">Production</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-card rounded-[2.5rem] p-10 flex flex-col shadow-sm">
                    <h3 className="text-base font-black italic uppercase mb-8">Verified Clients</h3>
                    <div className="flex -space-x-3 mb-10">
                      {allUsers?.slice(0, 5).map((u, i) => (
                        <div key={i} className="h-12 w-12 rounded-full ring-4 ring-card overflow-hidden border border-border">
                          <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="u" width={48} height={48} className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground">
                        <span>Active Accounts</span>
                        <span>{allUsers?.length || 0}</span>
                      </div>
                      <Progress value={Math.min(100, (allUsers?.length || 0) * 2)} className="h-1" />
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[2.5rem] p-10 space-y-8 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-black italic uppercase tracking-widest flex items-center gap-2">
                        <CandlestickChart className="w-4 h-4 text-primary" /> Revenue Dynamics Pro
                      </h3>
                      <div className="flex bg-muted p-1 rounded-lg">
                        <button className="px-4 py-1.5 bg-background text-[9px] font-black uppercase rounded shadow-sm">24H Activity</button>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={candleData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                          <XAxis dataKey="time" hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <RechartsTooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-[#1A1D1F] p-3 rounded-xl border border-white/10 shadow-2xl">
                                    <p className="text-[10px] font-black text-primary uppercase mb-1">{payload[0].payload.time}</p>
                                    <p className="text-xs font-black text-white italic">Rp {payload[0].value?.toLocaleString()}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="close" barSize={12}>
                            {candleData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.isUp ? "#10b981" : "#ef4444"} />
                            ))}
                          </Bar>
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-[#1A1D1F] dark:bg-card rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><LogoIcon className="w-32 h-32 text-primary" /></div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Sovereign Asset</p>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALIX TOKEN (ALX)</h3>
                      <p className="text-[9px] font-bold text-white/30 uppercase mt-2 tracking-widest">ALX V3 PROTOCOL</p>
                    </div>
                    <div className="relative z-10 flex justify-between items-end">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Vault Inventory</p>
                        <p className="text-xl font-black italic">{displayVal(globalLiquidity?.alixVaultBalance).toLocaleString('id-ID')} ALX</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/40 mb-1">Anchor Price</p>
                        <p className="text-xl font-black italic text-primary">$ 12.24</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <QuickOpButton icon={Skull} label="Reset All Clients" sub="Production Wipe" color="text-rose-500" onClick={() => setActiveTab('users')} />
                  <QuickOpButton icon={PlusCircle} label="Mint ALX" sub="Authorized Supply" color="text-green-500" onClick={() => setActiveTab('tokenomics')} />
                  <QuickOpButton icon={Pickaxe} label="Burn ALX" sub="Deflation Protocol" color="text-orange-500" onClick={() => setActiveTab('tokenomics')} />
                  <QuickOpButton icon={RefreshCw} label="Sync Vault" sub="Etherscan Hook" color="text-blue-500" onClick={() => syncOnChainData(true)} />
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black italic uppercase tracking-widest">Recent Activity Ledger</h3>
                    <button onClick={() => setActiveTab('audit')} className="text-[10px] font-black text-primary uppercase flex items-center gap-1 hover:underline">View All Logs <ArrowUpRight className="w-3 h-3" /></button>
                  </div>
                  <Card className="border-none bg-card rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                          <tr>
                            <th className="px-8 py-5">Operation ID</th>
                            <th className="px-8 py-5">Context</th>
                            <th className="px-8 py-5">Value</th>
                            <th className="px-8 py-5 text-right">Synchronization</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {auditLogs?.slice(0, 5).map((log) => (
                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-8 py-4 text-[10px] font-mono font-bold text-accent">{log.id.slice(0, 15)}...</td>
                              <td className="px-8 py-4"><Badge className="bg-muted text-foreground border-none text-[8px] font-black h-5 uppercase px-2">{log.category}</Badge></td>
                              <td className="px-8 py-4 text-[10px] font-black italic">{log.amountIdr ? `Rp ${log.amountIdr.toLocaleString()}` : '---'}</td>
                              <td className="px-8 py-4 text-right text-[9px] font-bold text-muted-foreground italic">{log.timestamp?.toDate?.().toLocaleString() || '---'}</td>
                            </tr>
                          ))}
                          {(!auditLogs || auditLogs.length === 0) && (
                            <tr>
                              <td colSpan={4} className="px-8 py-10 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">No activity recorded</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in slide-in-from-right-10 duration-700 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic uppercase tracking-tight">Client Directory</h3>
                  <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase">
                    {allUsers?.length || 0} Registered Users
                  </Badge>
                </div>

                <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-8 py-6">Client / Identity</th>
                          <th className="px-8 py-6">UID / Account</th>
                          <th className="px-8 py-6">Liquid Balance</th>
                          <th className="px-8 py-6">ALX Holdings</th>
                          <th className="px-8 py-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {allUsers?.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                                  <Image src={`https://picsum.photos/seed/${u.uid}/100/100`} alt="avatar" width={40} height={40} className="object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-black italic uppercase">{u.name}</p>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-mono font-bold text-accent">{u.accountNumber}</span>
                                <span className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Tier: {u.tier || 'Regular'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <p className="text-sm font-black italic text-green-600">Rp {(u.totalBalance || 0).toLocaleString('id-ID')}</p>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-primary flex items-center justify-center p-1">
                                  <LogoIcon className="text-white" />
                                </div>
                                <span className="text-sm font-black italic">{(u.cryptoBalances?.ALX || 0).toFixed(4)} ALX</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <div className="flex justify-center gap-2">
                                <Button 
                                  onClick={() => { setSelectedUser(u); setIsUserDialogOpen(true); }}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-lg hover:bg-rose-100 hover:text-rose-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(!allUsers || allUsers.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">
                              No clients detected in node
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'api' && (
              <div className="animate-in fade-in duration-700 space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0">
                      <Key className="text-white w-full h-full" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">Credential Vault</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">External service integration management</p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">ENCRYPTED NODE</Badge>
                </header>

                <Card className="border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
                  
                  <div className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                          <Globe className="w-5 h-5 text-primary" /> Gateway Configs
                        </h4>
                        <KeyInput 
                          label="PayPal Client ID" 
                          icon={Globe} 
                          helpLink="https://developer.paypal.com/dashboard/applications/sandbox"
                          value={keys.paypalClientId} 
                          onChange={(v) => setKeys({...keys, paypalClientId: v})}
                          show={showKeys['paypal']}
                          onToggle={() => setShowKeys(p => ({...p, paypal: !p.paypal}))}
                        />
                        <KeyInput 
                          label="Etherscan API Key" 
                          icon={Cpu} 
                          helpLink="https://etherscan.io/myapikey"
                          value={keys.etherscanApiKey} 
                          onChange={(v) => setKeys({...keys, etherscanApiKey: v})}
                          show={showKeys['etherscan']}
                          onToggle={() => setShowKeys(p => ({...p, etherscan: !p.etherscan}))}
                        />
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                          <Database className="w-5 h-5 text-primary" /> Node Endpoints
                        </h4>
                        <KeyInput 
                          label="Ethereum RPC Node" 
                          icon={RefreshCw} 
                          helpLink="https://chainlist.org/"
                          value={keys.ethereumRpcUrl} 
                          onChange={(v) => setKeys({...keys, ethereumRpcUrl: v})}
                          show={true}
                        />
                        <KeyInput 
                          label="Gemini API Key (AI)" 
                          icon={Sparkles} 
                          helpLink="https://aistudio.google.com/app/apikey"
                          value={keys.geminiApiKey} 
                          onChange={(v) => setKeys({...keys, geminiApiKey: v})}
                          show={showKeys['gemini']}
                          onToggle={() => setShowKeys(p => ({...p, gemini: !p.gemini}))}
                        />
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                      <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                      <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                        Perhatian: Perubahan pada kunci API akan segera diterapkan ke seluruh sistem kliring dan asisten AI AliBank. Pastikan kredensial valid sebelum menyimpan.
                      </p>
                    </div>

                    <Button 
                      onClick={handleSaveAPIKeys} 
                      disabled={isSavingKeys}
                      className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base"
                    >
                      {isSavingKeys ? <Loader2 className="animate-spin" /> : (
                        <span className="flex items-center gap-3">
                          <Save className="w-5 h-5" /> SIMPAN PERUBAHAN SISTEM
                        </span>
                      )}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'tokenomics' && (
              <div className="animate-in slide-in-from-bottom-10 duration-700 space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0">
                      <Coins className="text-white w-full h-full" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">ALX Tokenomics Terminal</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Authorized supply management & monetary policy</p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">V3 PROTOCOL ACTIVE</Badge>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <TokenStatCard label="Total Supply" value={`${displayVal(globalLiquidity?.totalAlixSupply).toLocaleString()} ALX`} sub="Maximum Cap" icon={Zap} />
                  <TokenStatCard label="Circulating" value={`${circulatingSupply.toLocaleString()} ALX`} sub="Held by Users" icon={Globe} color="text-green-600" />
                  <TokenStatCard label="Vault Balance" value={`${displayVal(globalLiquidity?.alixVaultBalance).toLocaleString()} ALX`} sub="System Reserve" icon={Database} color="text-primary" />
                  <TokenStatCard label="Buyback Pool" value={`Rp ${displayVal(globalLiquidity?.buybackReserveIdr).toLocaleString()}`} sub="20% Revenue Share" icon={Flame} color="text-orange-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><LogoIcon className="w-48 h-48 text-primary" /></div>
                    <div className="relative z-10 flex items-center justify-between">
                      <h4 className="text-xl font-black italic uppercase tracking-tight">Authorized Minting Terminal</h4>
                      <Badge variant="outline" className="border-green-500/20 text-green-600 font-black text-[8px] px-3 h-6 uppercase">Legal Issuer</Badge>
                    </div>
                    <div className="relative z-10 space-y-8">
                      <div className="p-10 rounded-[2.5rem] bg-muted/50 border border-border space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-2 tracking-widest">Mint Amount (ALX)</label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              value={mintAmount} 
                              onChange={(e) => setMintAmount(e.target.value)} 
                              className="h-20 bg-background border-none rounded-3xl font-black italic text-4xl pl-10 pr-24 tracking-tighter" 
                            />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-xl font-black text-primary italic">ALX</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleTokenOperation('mint')} 
                          disabled={!mintAmount || isProcessingToken}
                          className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base"
                        >
                          {isProcessingToken ? <Loader2 className="animate-spin" /> : "EXECUTE AUTHORIZED MINT"}
                        </Button>
                      </div>
                      <div className="flex gap-4 p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                        <Info className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-[10px] font-bold text-muted-foreground italic uppercase leading-relaxed">Pencetakan token akan menambah cadangan brankas pusat AliBank. Gunakan hanya saat dibutuhkan untuk menjaga nilai koin tetap stabil di angka $12.24.</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black italic uppercase tracking-tight">Supply Distribution</h4>
                      <PieIcon className="w-5 h-5 text-muted-foreground opacity-40" />
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Vault', value: displayVal(globalLiquidity?.alixVaultBalance) },
                              { name: 'Circulating', value: circulatingSupply },
                              { name: 'Burned', value: displayVal(globalLiquidity?.totalAlixBurned) }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="hsl(var(--primary))" />
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <DistributionItem label="Vault Reserve" value={displayVal(globalLiquidity?.alixVaultBalance)} color="bg-primary" />
                      <DistributionItem label="User Holdings" value={circulatingSupply} color="bg-green-500" />
                      <DistributionItem label="Burned Suplly" value={displayVal(globalLiquidity?.totalAlixBurned)} color="bg-rose-500" />
                    </div>
                  </Card>
                </div>

                <Card className="border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                        <Pickaxe className="w-6 h-6" />
                      </div>
                      <h4 className="text-xl font-black italic uppercase tracking-tight">Buyback & Burn Protocol</h4>
                    </div>
                    <Badge className="bg-rose-100 text-rose-600 font-black text-[8px] uppercase px-3 h-6">Deflation Active</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-8">
                      <div className="relative">
                        <Input 
                          type="number" 
                          placeholder="Amount to burn permanently..." 
                          value={burnAmount} 
                          onChange={(e) => setBurnAmount(e.target.value)} 
                          className="h-16 bg-muted border-none rounded-2xl font-black italic text-xl px-8" 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <Skull className="w-5 h-5 text-rose-500 opacity-40" />
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <Button 
                        onClick={() => handleTokenOperation('burn')}
                        disabled={!burnAmount || isProcessingToken}
                        className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg border-none"
                      >
                        {isProcessingToken ? <Loader2 className="animate-spin" /> : "EXECUTE BURN"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="animate-in slide-in-from-left-10 duration-700 space-y-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[2rem] gold-gradient flex items-center justify-center shadow-xl p-4 shrink-0">
                      <PackagePlus className="text-white w-full h-full" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black italic uppercase tracking-tighter">Marketplace Inventory</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Manage global product catalog & supply chain</p>
                    </div>
                  </div>
                  <Badge className="bg-primary text-primary-foreground font-black uppercase text-[10px] px-6 h-10 rounded-full italic tracking-widest shadow-lg">V3 CATALOG ACTIVE</Badge>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <h4 className="text-xl font-black italic uppercase tracking-tight">Add New Global Product</h4>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Product Name</label>
                        <Input 
                          placeholder="e.g. Google Play Card $50" 
                          value={productName} 
                          onChange={(e) => setProductName(e.target.value)}
                          className="h-12 rounded-xl bg-muted border-none font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Category</label>
                        <select 
                          value={productCategory} 
                          onChange={(e) => setProductCategory(e.target.value)}
                          className="w-full h-12 rounded-xl bg-muted border-none px-4 text-sm font-bold outline-none"
                        >
                          <option value="Layanan Seluler">Layanan Seluler</option>
                          <option value="Kartu Hadiah">Kartu Hadiah</option>
                          <option value="Game">Game</option>
                          <option value="Infrastructure">Infrastructure</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (IDR)</label>
                          <Input 
                            type="number" 
                            placeholder="750000" 
                            value={productPriceIdr} 
                            onChange={(e) => setProductPriceIdr(e.target.value)}
                            className="h-12 rounded-xl bg-muted border-none font-bold"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (USD)</label>
                          <Input 
                            type="number" 
                            placeholder="50" 
                            value={productPriceUsd} 
                            onChange={(e) => setProductPriceUsd(e.target.value)}
                            className="h-12 rounded-xl bg-muted border-none font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Description</label>
                        <textarea 
                          placeholder="Product details..." 
                          value={productDesc}
                          onChange={(e) => setProductDesc(e.target.value)}
                          className="w-full h-24 rounded-xl bg-muted border-none p-4 text-xs font-bold outline-none resize-none"
                        />
                      </div>
                      <Button 
                        onClick={handleAddProduct}
                        disabled={isAddingProduct || !productName || !productPriceIdr}
                        className="w-full h-14 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-lg border-none"
                      >
                        {isAddingProduct ? <Loader2 className="animate-spin" /> : "DEPLOY TO MARKETPLACE"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-border flex items-center justify-between bg-muted/30">
                      <h4 className="text-xl font-black italic uppercase tracking-tight">Active Catalog</h4>
                      <Badge className="bg-primary text-primary-foreground font-black text-[8px] uppercase px-3 h-6">{marketplaceProducts?.length || 0} ITEMS</Badge>
                    </div>
                    <ScrollArea className="h-[600px]">
                      <div className="divide-y divide-border">
                        {marketplaceProducts?.map((item) => (
                          <div key={item.id} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center border border-border shadow-inner">
                                {item.category === "Infrastructure" ? <Layers className="w-6 h-6 text-muted-foreground" /> : <ShoppingBag className="w-6 h-6 text-muted-foreground" />}
                              </div>
                              <div>
                                <p className="text-sm font-black italic uppercase">{item.name}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.category} • Rp {item.priceIdr?.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => { setEditingProduct(item); setIsEditProductDialogOpen(true); }}
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button 
                                onClick={() => handleDeleteProduct(item.id)}
                                variant="ghost" 
                                size="icon" 
                                className="h-10 w-10 rounded-xl hover:bg-rose-100 hover:text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {(!marketplaceProducts || marketplaceProducts.length === 0) && (
                          <div className="py-20 text-center opacity-20">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">No Products in Catalog</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="animate-in zoom-in-95 duration-700 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-8 border-none bg-card rounded-[3rem] p-12 flex flex-col justify-between relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 flex items-center justify-center text-blue-600 shadow-inner"><Database className="w-8 h-8" /></div>
                        <div>
                          <h3 className="text-2xl font-black italic uppercase tracking-tight">Mainnet Vault Reserve</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Contract Address: {ALX_CONTRACT.slice(0,6)}...{ALX_CONTRACT.slice(-4)}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-[10px] px-4 py-1.5 rounded-full uppercase italic animate-pulse">Production Node Active</Badge>
                    </div>
                    <div className="bg-muted p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border border-border shadow-inner">
                      <div className="space-y-2 text-center md:text-left">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] flex items-center gap-2">
                          <Globe className="w-3 x-3" /> On-Chain Ethereum Balance
                        </p>
                        <p className="text-4xl md:text-6xl font-black italic tracking-tighter text-blue-600">
                          {parseFloat(onChainEth).toFixed(6)} <span className="text-3xl text-muted-foreground/40 italic">ETH</span>
                        </p>
                        <p className="text-xs font-bold text-muted-foreground mt-2 uppercase italic">≈ Rp {(parseFloat(onChainEth) * 33000000).toLocaleString('id-ID')} Total Vault Assets</p>
                      </div>
                      <Button onClick={() => syncOnChainData(true)} disabled={syncingVault} className="h-16 px-12 rounded-2xl gold-gradient text-white font-black uppercase italic tracking-widest shadow-xl border-none">
                        {syncingVault ? <Loader2 className="animate-spin" /> : "REFRESH CHAIN"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-4 border-none bg-[#1A1D1F] dark:bg-card rounded-[3rem] p-10 flex flex-col items-center justify-center gap-6 text-white text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 gold-gradient opacity-5" />
                    <div className="bg-white p-4 rounded-3xl shadow-2xl relative z-10 group cursor-pointer hover:scale-105 transition-transform duration-500 overflow-hidden">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ALX_CONTRACT}`} alt="Vault QR" className="w-32 h-32 rounded-lg" />
                      <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Scan className="w-8 h-8 text-white" /></div>
                    </div>
                    <div className="space-y-4 relative z-10 w-full">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Public Vault Address</p>
                        <p className="text-[11px] font-mono font-bold break-all bg-white/5 p-3 rounded-xl border border-white/10">{ALX_CONTRACT}</p>
                      </div>
                      <Button onClick={() => { navigator.clipboard.writeText(ALX_CONTRACT); toast({ title: "Copied" }); }} className="w-full h-12 bg-white/10 text-white rounded-xl font-black italic text-[10px]">COPY ADDRESS</Button>
                    </div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <Card className="lg:col-span-5 border-none bg-card rounded-[3rem] p-10 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner"><ArrowUpFromLine className="w-6 h-6" /></div>
                        <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tight">External Disbursement</h4>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase italic">Real-Time Web3 Settlement</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-muted-foreground uppercase">Gas Wallet Bal.</p>
                        <p className="text-xs font-black italic text-green-600">{parseFloat(adminWalletEth).toFixed(6)} ETH</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recipient Address</label>
                        <input placeholder="0x..." value={vaultRecipient} onChange={(e) => setVaultRecipient(e.target.value)} className="h-14 bg-muted border-none font-bold text-xs rounded-xl px-6 w-full outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Value (ETH)</label>
                        <input type="number" placeholder="0.00" value={vaultAmount} onChange={(e) => setVaultAmount(e.target.value)} className="h-14 bg-muted border-none font-black italic rounded-xl px-6 w-full outline-none" />
                      </div>
                      {parseFloat(adminWalletEth) === 0 && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase italic flex gap-3">
                          <Skull className="w-4 h-4 shrink-0" />
                          <span>Insufficient Gas: Top-up alamat {userData?.walletAddress} untuk mengeksekusi transaksi.</span>
                        </div>
                      )}
                      <Button onClick={handleExecuteVaultWithdrawal} disabled={isExecutingVaultTx || !vaultRecipient || !vaultAmount || parseFloat(adminWalletEth) === 0} className="w-full h-16 bg-[#1A1D1F] dark:bg-muted text-background dark:text-foreground rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none">
                        {isExecutingVaultTx ? <Loader2 className="animate-spin" /> : "EXECUTE ON-CHAIN"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="lg:col-span-7 border-none bg-card rounded-[3rem] overflow-hidden shadow-sm">
                    <div className="p-10 border-b border-border flex items-center justify-between bg-blue-500/5">
                      <h4 className="text-lg font-black italic uppercase tracking-tight">Node Transaction Records</h4>
                      <Badge className="bg-blue-100 text-blue-600 font-black text-[8px] uppercase px-3 h-6">LIVE ETHERSCAN</Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[500px]">
                        <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                          <tr>
                            <th className="px-10 py-6">Tx Hash</th>
                            <th className="px-10 py-6">Method</th>
                            <th className="px-10 py-6">Value</th>
                            <th className="px-10 py-6 text-right">Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {onChainHistory.map((tx, i) => (
                            <tr key={i} className="hover:bg-muted/30 group">
                              <td className="px-10 py-5">
                                <a href={`https://etherscan.io/tx/${tx.fullHash}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold text-blue-600 hover:underline">{tx.hash}</a>
                              </td>
                              <td className="px-10 py-5">
                                <Badge className={cn("border-none text-[8px] font-black px-2 h-5 uppercase", tx.type === 'IN' ? "bg-green-100 text-green-600" : "bg-rose-100 text-rose-600")}>{tx.method}</Badge>
                              </td>
                              <td className="px-10 py-5 text-xs font-black italic">{tx.value}</td>
                              <td className="px-10 py-5 text-right text-[10px] font-bold text-muted-foreground italic">{tx.time}</td>
                            </tr>
                          ))}
                          {onChainHistory.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-10 py-20 text-center text-[10px] font-black text-muted-foreground uppercase opacity-20 italic">No blockchain data found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="animate-in slide-in-from-right-10 duration-700">
                <Card className="border-none bg-card rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-10 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tight">System Audit Ledger</h3>
                    <div className="flex gap-3">
                      <Button onClick={handlePurgeAuditLogs} disabled={isPurging} variant="outline" className="rounded-xl border-rose-200 text-rose-600 font-black uppercase text-[10px] h-10 px-6 italic">Purge Ledger</Button>
                      <Button onClick={() => syncOnChainData(true)} className="rounded-xl gold-gradient text-white font-black uppercase text-[10px] h-10 px-6 italic border-none shadow-lg">Refresh Ledger</Button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border">
                        <tr>
                          <th className="px-10 py-8">Timestamp</th>
                          <th className="px-10 py-8">Category</th>
                          <th className="px-10 py-8">Context</th>
                          <th className="px-10 py-8 text-right">Value</th>
                          <th className="px-10 py-8 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {auditLogs?.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30">
                            <td className="px-10 py-6 text-[10px] font-bold text-muted-foreground italic">{log.timestamp?.toDate?.().toLocaleString() || '---'}</td>
                            <td className="px-10 py-6"><Badge className="bg-muted text-foreground border-none text-[8px] font-black px-3 h-5 uppercase">{log.category}</Badge></td>
                            <td className="px-10 py-6 text-[10px] font-black italic uppercase">{log.gateway || log.description || 'System Node'}</td>
                            <td className="px-10 py-6 text-right text-sm font-black italic">Rp {log.amountIdr?.toLocaleString() || '0'}</td>
                            <td className="px-10 py-6 text-center"><button onClick={async () => { if(db) await deleteDoc(doc(db, "system", "audit", "global_transactions", log.id)); }} className="p-2 text-muted-foreground hover:text-rose-500"><Trash2 className="w-4 h-4" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>

        {/* User Management Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
          <DialogContent className="max-w-4xl rounded-[3rem] p-0 bg-card border-border shadow-2xl overflow-hidden">
            <DialogHeader className="sr-only">
              <DialogTitle>Manajemen Nasabah: {selectedUser?.name}</DialogTitle>
              <DialogDescription>Terminal kontrol penuh untuk profil, finansial, dan dompet nasabah AliBank.</DialogDescription>
            </DialogHeader>
            
            <div className="gold-gradient h-32 w-full relative">
              <div className="absolute -bottom-12 left-10 w-24 h-24 rounded-[2rem] bg-background border-4 border-card flex items-center justify-center overflow-hidden shadow-xl">
                <Image src={`https://picsum.photos/seed/${selectedUser?.uid}/200/200`} alt="client" width={100} height={100} className="object-cover" />
              </div>
            </div>

            <div className="pt-16 px-10 pb-10 space-y-8">
              <header className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">{selectedUser?.name}</h2>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-2">UID: {selectedUser?.accountNumber}</Badge>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedUser?.email}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResetPassword} variant="outline" className="h-10 rounded-xl border-primary/20 text-primary font-black uppercase italic text-[10px] px-6">Riset Sandi</Button>
                  <Button onClick={() => handleDeleteUser(selectedUser?.id)} variant="outline" className="h-10 rounded-xl border-rose-200 text-rose-600 font-black uppercase italic text-[10px] px-6">Freeze Account</Button>
                </div>
              </header>

              <Tabs defaultValue="profile" className="space-y-8">
                <TabsList className="bg-muted/50 p-1 rounded-2xl h-14 w-full justify-start gap-2 border border-border overflow-x-auto no-scrollbar">
                  <TabsTrigger value="profile" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white shrink-0">Profile</TabsTrigger>
                  <TabsTrigger value="financials" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white shrink-0">Financials</TabsTrigger>
                  <TabsTrigger value="wallets" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white shrink-0">Wallets</TabsTrigger>
                  <TabsTrigger value="earnings" className="rounded-xl px-8 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white shrink-0">Earnings</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ProfileField icon={UserIcon} label="Full Name" value={selectedUser?.name} />
                    <ProfileField icon={Mail} label="Email Address" value={selectedUser?.email} />
                    <ProfileField icon={Phone} label="Phone Number" value={selectedUser?.phone || "Not Set"} />
                    <ProfileField icon={ShieldCheck} label="Account Tier" value={selectedUser?.tier || "Regular"} />
                    <div className="md:col-span-2">
                      <ProfileField icon={Key} label="Web3 Native Address" value={selectedUser?.walletAddress} isMono />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="financials" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">IDR Liquidity Pool</label>
                      <div className="p-6 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-between">
                        <p className="text-2xl md:text-3xl font-black italic text-foreground truncate mr-2">Rp {selectedUser?.totalBalance?.toLocaleString() || '0'}</p>
                        <div className="flex gap-2 shrink-0">
                          <Input placeholder="Amt" type="number" value={balanceAdjustment} onChange={(e) => setBalanceAdjustment(e.target.value)} className="w-20 h-10 bg-background border-none text-xs font-black italic" />
                          <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'add')} className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => handleUpdateUserBalance('idr', balanceAdjustment, 'sub')} className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">ALX Asset Holdings</label>
                      <div className="p-6 rounded-[2rem] bg-muted/50 border border-border flex items-center justify-between">
                        <p className="text-2xl md:text-3xl font-black italic text-primary truncate mr-2">{selectedUser?.cryptoBalances?.ALX?.toFixed(4) || '0.0000'} ALX</p>
                        <div className="flex gap-2 shrink-0">
                          <Input placeholder="ALX" type="number" value={alxAdjustment} onChange={(e) => setAlxAdjustment(e.target.value)} className="w-20 h-10 bg-background border-none text-xs font-black italic" />
                          <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'add')} className="w-8 h-8 rounded-lg gold-gradient text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => handleUpdateUserBalance('alx', alxAdjustment, 'sub')} className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><PiggyBank className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Total Wealth Deposits</p>
                        <p className="text-xl font-black italic">Rp {totalDepositsValue.toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge className="bg-primary text-white font-black italic">{selectedUserDeposits.length} ACTIVE</Badge>
                  </div>
                </TabsContent>

                <TabsContent value="wallets" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedUserWallets.length > 0 ? selectedUserWallets.map((w, i) => (
                      <div key={i} className="p-5 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center"><Wallet className="w-5 h-5 text-primary" /></div>
                          <div>
                            <p className="text-xs font-black uppercase italic">{w.name}</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">Linked Account</p>
                          </div>
                        </div>
                        <p className="text-sm font-black italic text-green-600">Rp {w.balance?.toLocaleString()}</p>
                      </div>
                    )) : (
                      <div className="col-span-full py-10 text-center opacity-20">
                        <Wallet className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-[10px] font-black uppercase">No External Wallets Linked</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="earnings" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 rounded-[2rem] bg-orange-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mx-auto shadow-inner"><RotateCw className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Ali-Spin Profit</p>
                        <p className="text-2xl font-black italic text-orange-500">{totalGamingEarnings.toFixed(4)} ALX</p>
                      </div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] bg-blue-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mx-auto shadow-inner"><Zap className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Trade-X Yield</p>
                        <p className="text-2xl font-black italic text-blue-500">Live Monitoring</p>
                      </div>
                    </Card>
                    <Card className="p-6 rounded-[2rem] bg-green-500/5 border-none text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 mx-auto shadow-inner"><Trophy className="w-6 h-6" /></div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Grand Total Rewards</p>
                        <p className="text-2xl font-black italic text-green-600">{(totalGamingEarnings * ALX_PRICE_IDR).toLocaleString()} IDR</p>
                      </div>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recent Settlement History</h4>
                    <div className="rounded-[2rem] bg-muted/30 border border-border overflow-hidden">
                      <table className="w-full text-left">
                        <tbody className="divide-y divide-border">
                          {selectedUserTransactions.slice(0, 5).map((tx, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 text-[10px] font-bold text-muted-foreground">{tx.date?.split('T')[0]}</td>
                              <td className="px-6 py-4 text-[10px] font-black italic uppercase">{tx.description}</td>
                              <td className="px-6 py-4 text-right text-[10px] font-black italic text-green-600">+{tx.rewardAlx?.toFixed(6) || 0} ALX</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="bg-muted/30 p-8 border-t border-border">
              <div className="flex items-center gap-4 text-muted-foreground grayscale opacity-40">
                <Smartphone className="w-4 h-4" /><Globe className="w-4 h-4" /><ShieldCheck className="w-4 h-4" />
                <span className="text-[8px] font-black uppercase tracking-widest italic">Encrypted Admin Terminal V3</span>
              </div>
              <Button onClick={() => setIsUserDialogOpen(false)} variant="ghost" className="h-12 px-10 rounded-xl font-black uppercase italic text-xs ml-auto">Close Console</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product Edit Dialog */}
        <Dialog open={isEditProductDialogOpen} onOpenChange={setIsEditProductDialogOpen}>
          <DialogContent className="max-w-md rounded-[2.5rem] bg-card border-border p-8 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tight">Edit Global Product</DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Modify product specifications</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Product Name</label>
                <Input 
                  value={editingProduct?.name || ""} 
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="h-12 rounded-xl bg-muted border-none font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Category</label>
                <select 
                  value={editingProduct?.category || ""} 
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full h-12 rounded-xl bg-muted border-none px-4 text-sm font-bold outline-none"
                >
                  <option value="Layanan Seluler">Layanan Seluler</option>
                  <option value="Kartu Hadiah">Kartu Hadiah</option>
                  <option value="Game">Game</option>
                  <option value="Infrastructure">Infrastructure</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (IDR)</label>
                  <Input 
                    type="number" 
                    value={editingProduct?.priceIdr || ""} 
                    onChange={(e) => setEditingProduct({...editingProduct, priceIdr: e.target.value})}
                    className="h-12 rounded-xl bg-muted border-none font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Price (USD)</label>
                  <Input 
                    type="number" 
                    value={editingProduct?.priceUsd || ""} 
                    onChange={(e) => setEditingProduct({...editingProduct, priceUsd: e.target.value})}
                    className="h-12 rounded-xl bg-muted border-none font-bold"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-2">Description</label>
                <textarea 
                  value={editingProduct?.description || ""}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full h-24 rounded-xl bg-muted border-none p-4 text-xs font-bold outline-none resize-none"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setIsEditProductDialogOpen(false)} className="rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={handleUpdateProduct} 
                disabled={isUpdatingProduct}
                className="gold-gradient text-white rounded-xl font-black uppercase italic flex-1"
              >
                {isUpdatingProduct ? <Loader2 className="animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, className }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group",
        active 
          ? "bg-primary/10 text-primary shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <Icon className={cn("w-5 h-5", active ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-sm font-black italic uppercase tracking-tight", active ? "opacity-100" : "opacity-80")}>{label}</span>
      </div>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  );
}

function QuickOpButton({ icon: Icon, label, sub, color, onClick }: any) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-3 p-6 rounded-[2.5rem] bg-card border border-border/50 hover:bg-muted/50 transition-all group shadow-sm active:scale-95 text-left w-full">
      <div className={cn("w-14 h-14 rounded-full bg-muted flex items-center justify-center border border-border group-hover:scale-110 transition-transform shadow-inner", color)}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-[11px] font-black uppercase italic leading-none">{label}</p>
        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{sub}</p>
      </div>
    </button>
  );
}

function ProfileField({ icon: Icon, label, value, isMono = false }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
        <p className={cn("text-xs font-bold truncate italic uppercase", isMono && "font-mono text-[10px]")}>{value || "---"}</p>
      </div>
    </div>
  );
}

function TokenStatCard({ label, value, sub, icon: Icon, color = "text-accent" }: any) {
  return (
    <Card className="border-none bg-card rounded-[2.5rem] p-8 space-y-4 shadow-sm">
      <div className="flex justify-between items-start">
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        <Icon className={cn("w-4 h-4 opacity-20", color)} />
      </div>
      <p className={cn("text-3xl font-black italic tracking-tighter", color)}>{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
    </Card>
  );
}

function DistributionItem({ label, value, color }: any) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", color)} />
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
      </div>
      <span className="text-[10px] font-black italic">{value?.toLocaleString()} ALX</span>
    </div>
  );
}

function KeyInput({ label, icon: Icon, value, onChange, show, onToggle, helpLink }: any) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
        {helpLink && (
          <a href={helpLink} target="_blank" rel="noopener noreferrer" className="text-[8px] font-black text-primary uppercase flex items-center gap-1 hover:underline">
            Get Key <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <Input 
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-14 pl-12 pr-12 rounded-xl bg-muted/50 border-none font-bold text-xs focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {onToggle && (
          <button 
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminControlPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
