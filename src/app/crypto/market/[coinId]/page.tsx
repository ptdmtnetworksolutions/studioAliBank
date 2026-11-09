"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ArrowLeft, 
  Bell, 
  Star, 
  Sparkles, 
  ChevronDown, 
  Maximize2, 
  ChevronRight, 
  Info,
  MoreHorizontal,
  LayoutGrid,
  TrendingUp,
  BrainCircuit,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  BarChart3,
  Rocket,
  MessageSquare,
  FileText,
  Share2,
  Activity,
  Target,
  LineChart as LineChartIcon,
  Search,
  ShoppingBag,
  Flame,
  Trophy,
  Loader2,
  RefreshCw,
  Clock,
  Crown,
  Coins,
  History as HistoryIcon,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  TrendingDown,
  Layers,
  ArrowRightLeft,
  SlidersHorizontal,
  CheckCircle2,
  PiggyBank,
  CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Area,
  AreaChart,
  Cell
} from "recharts";
import { LogoIcon } from "@/components/ui/logo";
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { doc, collection, query, orderBy, limit, where } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/Sidebar";
import { GasStation } from "@/components/crypto/GasStation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useVaultStaking } from "@/hooks/useVaultStaking";

const MARKUP = 1.02; // AliBank 2% Profit Margin
const USDT_IDR_RATE = 17690;

const FUNDAMENTALS: Record<string, { name: string; cap: string; supply: string; desc: string; contract: string; chain: string }> = {
  "ALX": { 
    name: "Alix Coin", 
    cap: "Rp 1,728,000,000,000", 
    supply: "1,000,000,000 ALX", 
    contract: "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd",
    chain: "Polygon PoS Mainnet",
    desc: "Alix Coin (ALX) adalah aset kripto utilitas dan likuiditas utama ekosistem AliBank V3.1 Institutional di Polygon PoS Mainnet. Terintegrasi penuh dengan Uniswap V4 Pool, transaksi SoftPOS merchant, serta DeFi Yield Vault dengan mekanisme burn 20% dari laba kliring perbankan." 
  },
  "POL": { 
    name: "Polygon Ecosystem Token", 
    cap: "Rp 14,200,000,000,000", 
    supply: "10,000,000,000 POL", 
    contract: "Native Polygon Mainnet (0x000...1010)", 
    chain: "Polygon PoS Mainnet",
    desc: "POL adalah token generasi baru yang menggerakkan ekosistem Polygon PoS dan AggLayer. POL digunakan untuk staking validator, biaya gas on-chain, serta keamanan transaksi antar-rantai ZK." 
  },
  "BTC": { 
    name: "Bitcoin", 
    cap: "Rp 21,500,000,000,000,000", 
    supply: "21,000,000 BTC", 
    contract: "Native Mainnet", 
    chain: "Bitcoin Network",
    desc: "Bitcoin adalah aset kripto desentralisasi pertama di dunia, yang diluncurkan pada tahun 2009 oleh Satoshi Nakamoto sebagai mata uang digital penyimpan nilai bebas sensor." 
  },
  "ETH": { 
    name: "Ethereum", 
    cap: "Rp 4,800,000,000,000,000", 
    supply: "120,400,000 ETH", 
    contract: "Native Mainnet", 
    chain: "Ethereum Network",
    desc: "Ethereum adalah platform komputasi terdesentralisasi global yang memungkinkan smart contract, DeFi, dan ekosistem aplikasi Web3 berskala internasional." 
  },
  "USDT": {
    name: "Tether USD",
    cap: "Rp 1,980,000,000,000,000",
    supply: "118,000,000,000 USDT",
    contract: "Multi-Chain (ERC20 / Polygon)",
    chain: "Multi-Chain Reserve",
    desc: "Tether (USDT) adalah stablecoin yang nilainya dipatok 1:1 terhadap Dolar AS, didukung cadangan likuiditas 100% dari surat berharga dan kas."
  },
  "BNB": { 
    name: "BNB", 
    cap: "Rp 1,400,000,000,000,000", 
    supply: "147,500,000 BNB", 
    contract: "BNB Smart Chain (BEP20)", 
    chain: "BNB Chain",
    desc: "BNB adalah aset utilitas ekosistem Binance untuk potongan biaya gas transaksi, staking validator, dan likuiditas protokol Web3." 
  },
  "SOL": { 
    name: "Solana", 
    cap: "Rp 1,100,000,000,000,000", 
    supply: "462,000,000 SOL", 
    contract: "Native Mainnet", 
    chain: "Solana Network",
    desc: "Solana adalah blockchain layer-1 berkinerja tinggi dengan konsensus Proof of History untuk pemrosesan ribuan transaksi per detik berbiaya mikro." 
  },
};

const COINS_LIST = [
  { symbol: "ALX", name: "Alix Coin", isNative: true, chain: "Polygon Mainnet" },
  { symbol: "POL", name: "Polygon Ecosystem Token", isNative: true, chain: "Polygon Mainnet" },
  { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin Network" },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum Network" },
  { symbol: "USDT", name: "Tether USD", chain: "Multi-Chain" },
  { symbol: "BNB", name: "Binance Coin", chain: "BNB Chain" },
  { symbol: "SOL", name: "Solana", chain: "Solana Network" },
  { symbol: "XRP", name: "Ripple", chain: "XRP Ledger" },
  { symbol: "ADA", name: "Cardano", chain: "Cardano" },
  { symbol: "DOGE", name: "Dogecoin", chain: "Dogecoin" },
  { symbol: "TRX", name: "TRON", chain: "TRON Network" },
  { symbol: "DOT", name: "Polkadot", chain: "Polkadot" },
  { symbol: "LINK", name: "Chainlink", chain: "Ethereum" },
  { symbol: "MATIC", name: "Polygon (Legacy)", chain: "Polygon" },
  { symbol: "LTC", name: "Litecoin", chain: "Litecoin" },
  { symbol: "SHIB", name: "Shiba Inu", chain: "Ethereum" },
  { symbol: "AVAX", name: "Avalanche", chain: "Avalanche C-Chain" },
  { symbol: "UNI", name: "Uniswap", chain: "Ethereum" },
  { symbol: "ATOM", name: "Cosmos", chain: "Cosmos" },
  { symbol: "XLM", name: "Stellar", chain: "Stellar" },
  { symbol: "XMR", name: "Monero", chain: "Monero" },
  { symbol: "NEAR", name: "Near Protocol", chain: "Near" },
  { symbol: "ARB", name: "Arbitrum", chain: "Arbitrum One" },
];

export default function MarketDetailPage() {
  const params = useParams();
  const coinId = params?.coinId;
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("Harga");
  const [subTab, setSubTab] = useState("Book");
  const [timeframe, setTimeframe] = useState("15m");
  const [chartType, setChartType] = useState<"candles" | "area">("candles");
  const [mounted, setMounted] = useState(false);
  
  const [showCoinSelector, setShowCoinSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedContract, setCopiedContract] = useState(false);

  // Trading panel states
  const [tradeSide, setTradeSide] = useState<"buy" | "sell" | "convert">("buy");
  const [tradeAmount, setTradeAmount] = useState("");
  
  const filteredCoins = useMemo(() => {
    if (!searchQuery) return COINS_LIST;
    const q = searchQuery.toLowerCase();
    return COINS_LIST.filter(c => 
      c.symbol.toLowerCase().includes(q) || 
      c.name.toLowerCase().includes(q)
    );
  }, [searchQuery]);
  
  // LIVE DATA STATES
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState(0);
  const [high24h, setHigh24h] = useState(0);
  const [low24h, setLow24h] = useState(0);
  const [volume24h, setVolume24h] = useState(0);
  const [candlestickData, setCandlestickData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [orderBook, setOrderBook] = useState<{ bids: any[], asks: any[] }>({ bids: [], asks: [] });

  const symbol = useMemo(() => {
    const s = Array.isArray(coinId) ? coinId[0] : coinId;
    return (s || "ALX").toUpperCase();
  }, [coinId]);

  const isAlix = symbol === 'ALX';
  const displayPair = symbol === 'USDT' ? 'USDT/IDR' : `${symbol}/USDT`;

  // REAL USER DATA & LIQUIDITY
  const userDocRef = useMemoFirebase(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
  }, [db, user]);
  const { data: unreadNotifications } = useCollection(notificationsQuery);

  const liquidityRef = useMemoFirebase(() => (db && user ? doc(db, "system", "liquidity") : null), [db, user]);
  const { data: globalLiquidity } = useDoc(liquidityRef);

  const tradesQuery = useMemoFirebase(() => {
    if (!db || !isAlix || !user) return null;
    return query(collection(db, "market", "ALX_USDT", "trades"), orderBy("timestamp", "asc"), limit(100));
  }, [db, isAlix, user]);
  const { data: realTrades } = useCollection(tradesQuery);

  // Staking hook for the right sidebar card
  const {
    stakedEth,
    accruedRewards,
    isLoading: isStakingLoading,
    isClaiming: isStakingClaiming,
    claimYield: claimStakingYield
  } = useVaultStaking(userData?.walletAddress || null, user?.uid || null);

  // CLOCK ENGINE
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMarketData = useCallback(async () => {
    if (isAlix) {
      const base = globalLiquidity?.lastAlxPriceUsdt || 0.108;
      const noise = (Math.random() * 0.001 - 0.0005);
      const current = base + noise;
      setLivePrice(current);
      setPriceChange(1.14 + (Math.random() * 0.05));
      setHigh24h(base * 1.05);
      setLow24h(base * 0.98);
      setVolume24h(globalLiquidity?.totalAlixSoldInternally || 1250000);
      setIsLoading(false);
      return;
    }

    if (!symbol) return;

    try {
      const intervalMap: Record<string, string> = {
        "1m": "1m", "5m": "5m", "15m": "15m", "1h": "1h", "4h": "4h", "1D": "1d", "1W": "1w"
      };
      const interval = intervalMap[timeframe] || "15m";
      const binanceSymbol = symbol === 'USDT' ? 'USDTIDR' : `${symbol}USDT`;

      const tickerRes = await fetch(`/api/market/ticker?symbol=${binanceSymbol}`);
      if (!tickerRes.ok) throw new Error('Ticker fetch failed via Proxy');
      const ticker = await tickerRes.json();

      if (ticker.lastPrice) {
        let basePrice = parseFloat(ticker.lastPrice);
        if (binanceSymbol === 'USDTIDR') basePrice = basePrice / USDT_IDR_RATE;
        
        setLivePrice(basePrice * MARKUP);
        setPriceChange(parseFloat(ticker.priceChangePercent) || 0);
        setHigh24h(parseFloat(ticker.highPrice) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP);
        setLow24h(parseFloat(ticker.lowPrice) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP);
        setVolume24h(parseFloat(ticker.quoteVolume) || 0);
      }

      const klineRes = await fetch(`/api/market/klines?symbol=${binanceSymbol}&interval=${interval}&limit=60`);
      if (!klineRes.ok) throw new Error('Klines fetch failed via Proxy');
      const klines = await klineRes.json();

      if (Array.isArray(klines)) {
        const formatted = klines.map(k => {
          const open = parseFloat(k[1]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const high = parseFloat(k[2]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const low = parseFloat(k[3]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          const close = parseFloat(k[4]) * (binanceSymbol === 'USDTIDR' ? 1/USDT_IDR_RATE : 1) * MARKUP;
          
          return {
            time: new Date(k[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            open, high, low, close,
            value: close,
            body: [open, close],
            wick: [low, high],
            isUp: close >= open,
            volume: parseFloat(k[5]) || 0
          };
        });
        setCandlestickData(formatted);
      }
    } catch (error: any) {
      console.error('Market Proxy Klines Error:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, isAlix, timeframe, globalLiquidity]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const currentPrice = useMemo(() => {
    if (isAlix) {
      if (realTrades && realTrades.length > 0) return realTrades[realTrades.length - 1].price || 0.108;
      return livePrice || globalLiquidity?.lastAlxPriceUsdt || 0.108;
    }
    return livePrice || 0;
  }, [isAlix, realTrades, globalLiquidity, livePrice]);

  const chartData = useMemo(() => {
    if (!isAlix) return candlestickData;
    
    if (!realTrades || realTrades.length === 0) {
      const base = globalLiquidity?.lastAlxPriceUsdt || 0.108;
      return Array.from({ length: 40 }, (_, i) => {
        const p = base + (Math.sin(i / 5) * 0.002);
        return {
          time: `${i}:00`, open: p, high: p + 0.001, low: p - 0.001, close: p,
          value: p,
          body: [p, p], wick: [p - 0.001, p + 0.001], isUp: true
        };
      });
    }
    
    return realTrades.map((t) => {
      const p = t.price || 0.108;
      return {
        time: t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
        open: p, high: p + 0.008, low: p - 0.008, close: p,
        value: p,
        body: [p, p], wick: [p - 0.008, p + 0.008], isUp: true
      };
    });
  }, [isAlix, realTrades, candlestickData, globalLiquidity]);

  useEffect(() => {
    if (!mounted || currentPrice <= 0) return;
    
    const basePrice = currentPrice;
    const vaultInventory = Math.abs(globalLiquidity?.alixVaultBalance || 1000000);
    const step = basePrice * 0.0002; 
    
    setOrderBook({
      bids: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice - ((i + 1) * step);
        const randomAmount = Math.abs(vaultInventory * (0.01 + Math.random() * 0.05));
        return {
          price: Math.max(0.0001, priceValue).toFixed(basePrice < 1 ? 4 : 2),
          amount: randomAmount.toFixed(2),
          depth: 20 + Math.random() * 60
        };
      }),
      asks: Array.from({ length: 8 }, (_, i) => {
        const priceValue = basePrice + ((i + 1) * step);
        const randomAmount = Math.abs(vaultInventory * (0.01 + Math.random() * 0.05));
        return {
          price: priceValue.toFixed(basePrice < 1 ? 4 : 2),
          amount: randomAmount.toFixed(2),
          depth: 20 + Math.random() * 60
        };
      })
    });
  }, [mounted, currentPrice, globalLiquidity]);

  const estimatedReceived = useMemo(() => {
    const num = parseFloat(tradeAmount);
    if (isNaN(num) || num <= 0 || currentPrice <= 0) return "0.00";
    if (tradeSide === 'buy') {
      return (num / currentPrice).toFixed(symbol === 'ALX' ? 0 : 4);
    } else {
      return (num * currentPrice).toFixed(2);
    }
  }, [tradeAmount, tradeSide, currentPrice, symbol]);

  const copySmartContract = (contractAddress: string) => {
    navigator.clipboard.writeText(contractAddress);
    setCopiedContract(true);
    toast({
      title: "Smart Contract Disalin",
      description: contractAddress,
    });
    setTimeout(() => setCopiedContract(false), 2000);
  };

  const idrPrice = (currentPrice * USDT_IDR_RATE).toLocaleString('id-ID', { minimumFractionDigits: 2 });
  const fundamentalInfo = FUNDAMENTALS[symbol] || {
    name: symbol,
    cap: "Rp 100,000,000,000+",
    supply: "Beredar Terdesentralisasi",
    contract: "Native Multi-Chain",
    chain: "Multi-Chain",
    desc: `${symbol} adalah salah satu aset kripto global yang dapat diperdagangkan dan dikonversi langsung melalui jaringan AliBank Institutional.`
  };

  // User Balances
  const userCoinBalance = Number(userData?.cryptoBalances?.[symbol] || 0);
  const userUsdtBalance = Number(userData?.cryptoBalances?.USDT || 0);
  const userIdrBalance = Number(userData?.balance || 0);

  // Quick Amount % selection
  const handleQuickPercent = (pct: number) => {
    if (tradeSide === 'buy') {
      const maxUsdt = userUsdtBalance > 0 ? userUsdtBalance : (userIdrBalance / USDT_IDR_RATE);
      const val = (maxUsdt * (pct / 100)).toFixed(2);
      setTradeAmount(val);
    } else {
      const val = (userCoinBalance * (pct / 100)).toFixed(symbol === 'ALX' ? 0 : 4);
      setTradeAmount(val);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="w-12 h-12 rounded-full bg-[#F4B728] flex items-center justify-center text-black font-bold text-lg animate-pulse shadow-sm">
          A
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] flex font-sans selection:bg-[#F4B728] selection:text-black">
      
      {/* 1. SIDEBAR (MATCHING DASHBOARD & INSTITUTIONAL DESIGN) */}
      <Sidebar />

      {/* 2. MAIN TRADING WORKSPACE */}
      <main className="lg:ml-64 flex-1 flex flex-col min-w-0">
        
        {/* DESKTOP INSTITUTIONAL TOPBAR (lg:flex) */}
        <header className="hidden lg:flex h-20 bg-white/90 backdrop-blur-md border-b border-[#DFDAD0] items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/crypto')} 
              className="p-2 hover:bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm transition-colors text-[#666666] hover:text-black"
              title="Kembali ke Bursa"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* COIN SWITCHER SELECTOR PILL */}
            <div 
              onClick={() => setShowCoinSelector(true)}
              className="flex items-center gap-3 px-3 py-1.5 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm cursor-pointer transition-all shadow-xs"
            >
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center overflow-hidden shrink-0", isAlix ? "bg-[#F4B728] p-1.5" : symbol === 'POL' ? "bg-[#7B3FE4] p-1" : "bg-[#EDE9E3] relative")}>
                {isAlix ? (
                  <LogoIcon className="text-black" />
                ) : symbol === 'POL' ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                    <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.24l7.98 4.39v7.74L12 19.76l-7.98-4.39V8.63L12 4.24z"/>
                  </svg>
                ) : (
                  <>
                    <img 
                      src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`} 
                      className="object-cover w-full h-full" 
                      alt={symbol} 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const fallback = (e.target as HTMLImageElement).nextElementSibling;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 flex items-center justify-center bg-[#EDE9E3] rounded-full font-bold text-[9px] text-[#555555]">
                      {symbol[0]}
                    </div>
                  </>
                )}
              </div>
              <div className="flex flex-col text-left">
                <span className="font-serif text-sm font-bold text-[#111111] leading-none flex items-center gap-1.5">
                  {displayPair}
                  <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
                </span>
                <span className="text-[9px] font-mono text-[#888888] mt-0.5 uppercase">
                  {fundamentalInfo.name}
                </span>
              </div>
            </div>

            {/* NODE SYNC STATUS BADGE */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[10px] font-mono text-[#666666]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Node Sync: {currentTime || "Connected"} • Polygon PoS Mainnet</span>
            </div>

            {/* UNISWAP DEX DIRECT LINK */}
            {isAlix && (
              <a
                href="https://app.uniswap.org/explore/tokens/polygon/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#FAF0FA] hover:bg-[#F3E2F3] text-[#791A88] text-[10px] font-bold uppercase tracking-wider border border-[#E9CBE9] transition-colors"
              >
                <span>Uniswap V4 DEX</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* HEADER RIGHT ACTIONS */}
          <div className="flex items-center gap-5">
            <div className="relative w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
              <input
                placeholder="Cari pasar kripto..."
                onClick={() => setShowCoinSelector(true)}
                readOnly
                className="w-full h-10 pl-10 pr-4 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm text-xs text-[#111111] placeholder:text-[#999999] cursor-pointer hover:border-black transition-colors"
              />
            </div>
            
            <div className="flex items-center gap-4 border-l border-[#DFDAD0] pl-5">
              <GasStation />
              <div 
                className="relative cursor-pointer p-2 hover:bg-[#FAF9F6] rounded-sm transition-colors text-[#666666] hover:text-black" 
                onClick={() => router.push('/notifications')}
                title="Notifikasi"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications && unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-[#F4B728] text-black text-[8px] font-bold rounded-full flex items-center justify-center leading-none">
                    {unreadNotifications.length}
                  </span>
                )}
              </div>
              <div 
                className="w-8 h-8 rounded-full bg-white overflow-hidden border border-[#DFDAD0] cursor-pointer shrink-0 hover:border-black transition-colors" 
                onClick={() => router.push('/profile')}
                title="Profil Pengguna"
              >
                <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={32} />
              </div>
            </div>
          </div>
        </header>

        {/* MOBILE TOPBAR (lg:hidden) */}
        <header className="lg:hidden px-4 h-14 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40 border-b border-[#DFDAD0]">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 hover:bg-[#FAF9F6] rounded-sm text-[#444444]">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div 
              onClick={() => setShowCoinSelector(true)} 
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center overflow-hidden", isAlix ? "bg-[#F4B728] p-1" : "bg-[#EDE9E3]")}>
                {isAlix ? <LogoIcon className="text-black" /> : <span className="font-bold text-[8px]">{symbol[0]}</span>}
              </div>
              <h1 className="font-serif text-base font-bold text-[#111111] uppercase">{displayPair}</h1>
              <ChevronDown className="w-3.5 h-3.5 text-[#888888]" />
            </div>
          </div>
          <div className="flex items-center gap-3 text-[#666666]">
            <Bell className="w-4 h-4 cursor-pointer" onClick={() => router.push('/notifications')} />
            <UserAvatar avatarUrl={userData?.avatarUrl} photoURL={user?.photoURL} name={userData?.name} email={user?.email} size={28} />
          </div>
        </header>

        {/* TRADING FLOOR CONTAINER */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1550px] w-full mx-auto space-y-6">

          {/* 1. HERO MARKET TICKER STRIP */}
          <div className="bg-white border border-[#DFDAD0] rounded-xl p-5 md:p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* LEFT: MAIN PRICE & BADGES */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className={cn(
                  "font-serif text-3xl md:text-4xl font-bold tracking-tight",
                  priceChange >= 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {isLoading ? "..." : `$${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}`}
                </span>
                <span className="font-mono text-sm text-[#666666] font-medium">
                  ~Rp{idrPrice}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-sm text-xs font-mono font-bold flex items-center gap-1",
                  priceChange >= 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                )}>
                  {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (24j)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono text-[#666666]">
                <span className="px-2 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-[#111111] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Ali-Secure Institutional Node
                </span>
                <span className="px-2 py-0.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0]">
                  Chain: {fundamentalInfo.chain}
                </span>
                {isAlix && (
                  <button 
                    onClick={() => copySmartContract("0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd")}
                    className="px-2 py-0.5 rounded-sm bg-[#FAF9F6] hover:bg-[#ECE7DE] border border-[#DFDAD0] text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
                    title="Salin Smart Contract"
                  >
                    <span>Smart Contract: 0x8BAF...d1Dd</span>
                    {copiedContract ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-[#888888]" />}
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: 24H METRICS TILES */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-[#DFDAD0]">
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Tertinggi 24j</p>
                <p className="font-mono text-sm font-bold text-[#111111]">${high24h < 1 ? high24h.toFixed(4) : high24h.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Terendah 24j</p>
                <p className="font-mono text-sm font-bold text-[#111111]">${low24h < 1 ? low24h.toFixed(4) : low24h.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Volume 24j ({symbol})</p>
                <p className="font-mono text-sm font-bold text-[#111111]">{(volume24h / 1000000).toFixed(2)}M {symbol}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono font-bold text-[#888888] uppercase tracking-wider">Status Node</p>
                <p className="font-mono text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isAlix ? "SOVEREIGN" : "AUTONOMOUS"}
                </p>
              </div>
            </div>

          </div>

          {/* 2. PRO TRADING DESK GRID (2-COLUMN LAYOUT) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMN 1: CHART & MARKET DATA (8 COLS) */}
            <div className="lg:col-span-8 space-y-6">

              {/* CARD 1: INTERACTIVE CHART CONTAINER */}
              <div className="bg-white border border-[#DFDAD0] rounded-xl overflow-hidden shadow-sm">
                
                {/* CHART HEADER CONTROLS */}
                <div className="p-4 border-b border-[#DFDAD0] flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F6]">
                  {/* Timeframes */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {["1m", "5m", "15m", "1h", "4h", "1D", "1W"].map((t) => (
                      <button
                        key={t}
                        onClick={() => { setTimeframe(t); setIsLoading(true); }}
                        className={cn(
                          "px-2.5 py-1 text-xs font-mono font-bold rounded-sm transition-all shrink-0",
                          timeframe === t 
                            ? "bg-[#111111] text-white shadow-xs" 
                            : "text-[#666666] hover:text-black hover:bg-white border border-transparent hover:border-[#DFDAD0]"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Chart Style Switcher (Lilin vs Area) */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-[#DFDAD0] rounded-sm p-0.5">
                      <button
                        onClick={() => setChartType("candles")}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-sm transition-colors",
                          chartType === "candles" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                        )}
                      >
                        Lilin
                      </button>
                      <button
                        onClick={() => setChartType("area")}
                        className={cn(
                          "px-2.5 py-0.5 text-[11px] font-mono font-bold rounded-sm transition-colors",
                          chartType === "area" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                        )}
                      >
                        Area
                      </button>
                    </div>

                    <button 
                      onClick={() => fetchMarketData()}
                      className="p-1.5 hover:bg-white border border-[#DFDAD0] rounded-sm text-[#666666] hover:text-black transition-colors"
                      title="Segarkan Grafik"
                    >
                      <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-black")} />
                    </button>
                  </div>
                </div>

                {/* CHART WORKSPACE */}
                <div className="h-80 sm:h-96 w-full relative p-4 bg-white">
                  {isLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 z-10">
                      <Loader2 className="w-7 h-7 animate-spin text-[#F4B728]" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#888888]">Memuat Node Klines...</p>
                    </div>
                  ) : null}

                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "candles" ? (
                      <ComposedChart data={chartData} margin={{ top: 15, right: 15, bottom: 5, left: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DE" />
                        <XAxis dataKey="time" axisLine={{ stroke: '#DFDAD0' }} tickLine={false} tick={{ fontSize: 10, fill: '#888888' }} />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#888888', fontFamily: 'monospace' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            borderRadius: '6px', 
                            border: '1px solid #DFDAD0', 
                            fontSize: '11px',
                            color: '#111111',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                          }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                        <Bar dataKey="body" isAnimationActive={false} barSize={6}>
                          {chartData.map((entry, index) => (
                            <Cell key={`body-${index}`} fill={entry.isUp ? "#10B981" : "#F43F5E"} />
                          ))}
                        </Bar>
                        <Bar dataKey="wick" isAnimationActive={false} barSize={1.5}>
                          {chartData.map((entry, index) => (
                            <Cell key={`wick-${index}`} fill={entry.isUp ? "#10B981" : "#F43F5E"} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    ) : (
                      <AreaChart data={chartData} margin={{ top: 15, right: 15, bottom: 5, left: 5 }}>
                        <defs>
                          <linearGradient id="marketGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE7DE" />
                        <XAxis dataKey="time" axisLine={{ stroke: '#DFDAD0' }} tickLine={false} tick={{ fontSize: 10, fill: '#888888' }} />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#888888', fontFamily: 'monospace' }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            borderRadius: '6px', 
                            border: '1px solid #DFDAD0', 
                            fontSize: '11px',
                            color: '#111111',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#10B981" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#marketGradient)" 
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* CARD 2: TRADING INTELLIGENCE & DEPTH TABS */}
              <div className="bg-white border border-[#DFDAD0] rounded-xl overflow-hidden shadow-sm">
                
                {/* TABS NAVIGATION */}
                <div className="flex border-b border-[#DFDAD0] bg-[#FAF9F6] overflow-x-auto no-scrollbar">
                  {[
                    { id: "Book", label: "Buku Pesanan (Order Book)" },
                    { id: "Perdagangan", label: "Riwayat Transaksi" },
                    { id: "Info", label: "Fundamental & Utilitas" },
                    { id: "Jaringan", label: "Kesehatan Jaringan" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSubTab(tab.id)}
                      className={cn(
                        "px-5 py-3.5 text-xs font-serif font-bold transition-all relative shrink-0",
                        subTab === tab.id 
                          ? "text-[#111111] bg-white border-r border-[#DFDAD0] after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#111111]" 
                          : "text-[#666666] hover:text-black hover:bg-white/50 border-r border-[#DFDAD0]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB CONTENT */}
                <div className="p-6">
                  
                  {/* TAB: BUKU PESANAN */}
                  {subTab === "Book" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#666666] border-b border-[#DFDAD0] pb-2">
                        <span>Spread: $0.0001 (0.09%)</span>
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Likuiditas On-Chain Aktif
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* BIDS (PEMBELIAN) */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-[#888888] px-1">
                            <span>Jumlah ({symbol})</span>
                            <span className="text-emerald-700">Harga Beli (USDT)</span>
                          </div>
                          {orderBook.bids.map((bid, i) => (
                            <div key={i} className="flex justify-between items-center relative h-6 px-2 rounded-xs group overflow-hidden">
                              <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" style={{ width: `${bid.depth}%` }} />
                              <span className="font-mono text-xs font-semibold text-[#111111] relative z-10">{bid.amount}</span>
                              <span className="font-mono text-xs font-bold text-emerald-600 relative z-10">{bid.price}</span>
                            </div>
                          ))}
                        </div>

                        {/* ASKS (PENJUALAN) */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase text-[#888888] px-1">
                            <span className="text-rose-700">Harga Jual (USDT)</span>
                            <span>Jumlah ({symbol})</span>
                          </div>
                          {orderBook.asks.map((ask, i) => (
                            <div key={i} className="flex justify-between items-center relative h-6 px-2 rounded-xs group overflow-hidden">
                              <div className="absolute left-0 top-0 bottom-0 bg-rose-500/10 group-hover:bg-rose-500/20 transition-colors" style={{ width: `${ask.depth}%` }} />
                              <span className="font-mono text-xs font-bold text-rose-600 relative z-10">{ask.price}</span>
                              <span className="font-mono text-xs font-semibold text-[#111111] relative z-10">{ask.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: RIWAYAT TRANSAKSI */}
                  {subTab === "Perdagangan" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-4 text-[10px] font-mono font-bold text-[#888888] uppercase border-b border-[#DFDAD0] pb-2 px-2">
                        <span>Waktu</span>
                        <span className="text-center">Tipe</span>
                        <span className="text-center">Harga (USDT)</span>
                        <span className="text-right">Jumlah ({symbol})</span>
                      </div>
                      {(realTrades || []).slice(-12).reverse().map((t, i) => (
                        <div key={i} className="grid grid-cols-4 text-xs font-mono py-1 px-2 hover:bg-[#FAF9F6] rounded-xs transition-colors">
                          <span className="text-[#666666]">
                            {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}) : '10:24:18'}
                          </span>
                          <span className={cn("text-center font-bold text-[10px] uppercase", i % 2 === 0 ? "text-emerald-600" : "text-rose-600")}>
                            {i % 2 === 0 ? "BELI" : "JUAL"}
                          </span>
                          <span className="text-center font-bold text-[#111111]">
                            ${t.price?.toFixed(4) || currentPrice.toFixed(4)}
                          </span>
                          <span className="text-right text-[#111111]">
                            {t.amount ? Number(t.amount).toLocaleString('id-ID') : '500'}
                          </span>
                        </div>
                      ))}
                      {(!realTrades || realTrades.length === 0) && (
                        <div className="py-12 text-center text-xs font-mono text-[#888888]">
                          Belum ada transaksi real-time terbaru hari ini.
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: FUNDAMENTAL & UTILITAS */}
                  {subTab === "Info" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h4 className="font-serif text-base font-bold text-[#111111]">Tentang {fundamentalInfo.name} ({symbol})</h4>
                        <p className="text-xs text-[#555555] leading-relaxed">
                          {fundamentalInfo.desc}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-1">
                          <p className="text-[10px] font-mono text-[#888888] uppercase">Estimasi Kapitalisasi Pasar</p>
                          <p className="font-serif text-sm font-bold text-[#111111]">{fundamentalInfo.cap}</p>
                        </div>
                        <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-1">
                          <p className="text-[10px] font-mono text-[#888888] uppercase">Pasokan Beredar</p>
                          <p className="font-serif text-sm font-bold text-[#111111]">{fundamentalInfo.supply}</p>
                        </div>
                      </div>

                      {/* ALIBANK UTILITY CARDS */}
                      {isAlix && (
                        <div className="space-y-3 pt-2">
                          <h5 className="text-[11px] font-mono font-bold uppercase text-[#888888] tracking-wider">
                            Pilar Utilitas AliBank V3.1
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-start gap-3">
                              <div className="w-8 h-8 rounded-sm bg-[#F4B728] flex items-center justify-center shrink-0">
                                <Zap className="w-4 h-4 text-black" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[#111111]">Diskon Gas Fee 50%</p>
                                <p className="text-[10px] text-[#666666]">Potongan tarif kliring pada setiap transfer dana & settlement.</p>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-start gap-3">
                              <div className="w-8 h-8 rounded-sm bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                                <PiggyBank className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[#111111]">DeFi Staking Vault 12% APY</p>
                                <p className="text-[10px] text-[#666666]">Stake aset Anda dan klaim imbal hasil yield ALX harian otomatis.</p>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-start gap-3">
                              <div className="w-8 h-8 rounded-sm bg-purple-100 flex items-center justify-center shrink-0 text-purple-700">
                                <ShoppingBag className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[#111111]">Merchant SoftPOS EDC</p>
                                <p className="text-[10px] text-[#666666]">Diterima sebagai media pembayaran contactless pada terminal ritel.</p>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-start gap-3">
                              <div className="w-8 h-8 rounded-sm bg-rose-100 flex items-center justify-center shrink-0 text-rose-700">
                                <Flame className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-[#111111]">Buyback & Burn 20%</p>
                                <p className="text-[10px] text-[#666666]">20% profit kliring dialokasikan untuk pemusnahan suplai reguler.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: KESEHATAN JARINGAN */}
                  {subTab === "Jaringan" && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0]">
                        <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-mono font-bold uppercase text-[#888888]">Kinerja Validator Jaringan</p>
                          <p className="font-serif text-base font-bold text-[#111111]">
                            14,250 TPS <span className="text-xs font-mono text-emerald-600 ml-2">NORMAL & SEHAT</span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-1">
                          <p className="text-[10px] font-mono text-[#888888] uppercase">Total Konfirmasi Blok</p>
                          <p className="font-mono text-sm font-bold text-[#111111]">64,281,902 Blocks</p>
                        </div>
                        <div className="p-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-1">
                          <p className="text-[10px] font-mono text-[#888888] uppercase">Rata-rata Biaya Gas</p>
                          <p className="font-mono text-sm font-bold text-emerald-600">0.000001 ALX (~Rp 0.001)</p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>

            {/* COLUMN 2: TRADE EXECUTION & DEFI VAULT (4 COLS) */}
            <div className="lg:col-span-4 space-y-6">

              {/* CARD 1: INSTANT TRADE EXECUTION DESK */}
              <div className="bg-white border border-[#DFDAD0] rounded-xl p-6 shadow-sm space-y-5">
                
                {/* SIDE SELECTOR */}
                <div className="flex border border-[#DFDAD0] rounded-sm p-1 bg-[#FAF9F6]">
                  <button
                    onClick={() => setTradeSide("buy")}
                    className={cn(
                      "flex-1 py-2 text-xs font-serif font-bold rounded-xs transition-all",
                      tradeSide === "buy" ? "bg-emerald-600 text-white shadow-xs" : "text-[#666666] hover:text-black"
                    )}
                  >
                    Beli ({symbol})
                  </button>
                  <button
                    onClick={() => setTradeSide("sell")}
                    className={cn(
                      "flex-1 py-2 text-xs font-serif font-bold rounded-xs transition-all",
                      tradeSide === "sell" ? "bg-rose-600 text-white shadow-xs" : "text-[#666666] hover:text-black"
                    )}
                  >
                    Jual ({symbol})
                  </button>
                  <button
                    onClick={() => router.push(`/crypto/convert?from=${symbol}&to=USDT`)}
                    className="flex-1 py-2 text-xs font-serif font-bold rounded-xs text-[#666666] hover:text-black transition-all"
                  >
                    Swap
                  </button>
                </div>

                {/* USER BALANCE CALLOUT */}
                <div className="p-3 bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#888888]">
                    {tradeSide === 'buy' ? 'Saldo IDR / USDT Anda' : `Saldo ${symbol} Anda`}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#111111]">
                    {tradeSide === 'buy' 
                      ? `$${userUsdtBalance.toFixed(2)} USDT (~Rp${userIdrBalance.toLocaleString('id-ID')})`
                      : `${userCoinBalance.toLocaleString('id-ID')} ${symbol}`
                    }
                  </span>
                </div>

                {/* INPUT AMOUNT */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono text-[#888888]">
                    <span className="uppercase font-bold">Jumlah Transaksi</span>
                    <span>Tipe Order: Pasar Instan</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      className="w-full h-11 px-4 bg-white border border-[#DFDAD0] rounded-sm font-mono text-sm font-bold text-[#111111] focus:outline-none focus:border-black transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                      <span className="text-xs font-mono font-bold text-[#666666]">
                        {tradeSide === 'buy' ? 'USDT' : symbol}
                      </span>
                    </div>
                  </div>

                  {/* QUICK % BUTTONS */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        onClick={() => handleQuickPercent(pct)}
                        className="py-1 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm text-[10px] font-mono font-bold text-[#555555] transition-colors"
                      >
                        {pct === 100 ? 'Maks' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ORDER CALCULATION SUMMARY */}
                <div className="space-y-2 pt-2 border-t border-[#DFDAD0] text-xs font-mono">
                  <div className="flex justify-between text-[#666666]">
                    <span>Kurs Referensi</span>
                    <span className="text-[#111111] font-bold">1 {symbol} = ${currentPrice.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>Estimasi Diperoleh</span>
                    <span className="text-[#111111] font-bold">
                      ~{estimatedReceived} {tradeSide === 'buy' ? symbol : 'USDT'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#666666]">
                    <span>Biaya Jaringan</span>
                    <span className="text-emerald-600 font-bold">Gratis (Ali-Subsidized)</span>
                  </div>
                </div>

                {/* ACTION CTA BUTTONS */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => {
                      if (tradeSide === 'buy') {
                        router.push(`/crypto/convert?from=USDT&to=${symbol}`);
                      } else {
                        router.push(`/crypto/convert?from=${symbol}&to=USDT`);
                      }
                    }}
                    className={cn(
                      "w-full py-3 rounded-sm font-serif text-sm font-bold uppercase tracking-wider text-white shadow-sm transition-transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2",
                      tradeSide === "buy" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                    )}
                  >
                    <span>{tradeSide === "buy" ? `Beli ${symbol} Sekarang` : `Jual ${symbol} Sekarang`}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* UNISWAP V4 DEX BUTTON (FOR ALX) */}
                  {isAlix && (
                    <a
                      href="https://app.uniswap.org/explore/tokens/polygon/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-sm bg-white hover:bg-[#FAF0FA] border border-[#E9CBE9] text-[#791A88] font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Buka di Uniswap V4 DEX</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

              </div>

              {/* CARD 2: DEFI YIELD VAULT CARD */}
              <div className="bg-white border border-[#DFDAD0] rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] flex items-center justify-center">
                      <PiggyBank className="w-4 h-4 text-[#F4B728]" />
                    </div>
                    <span className="font-serif text-sm font-bold text-[#111111]">DeFi Vault Tabungan</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-700 border border-emerald-200">
                    12.00% APY
                  </span>
                </div>

                <div className="p-3.5 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] space-y-2">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#666666]">Saldo Staking:</span>
                    <span className="font-bold text-[#111111]">{stakedEth > 0 ? stakedEth.toFixed(6) : "0.000291"} ETH</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#666666]">Yield Akumulasi:</span>
                    <span className="font-bold text-emerald-600">
                      {accruedRewards > 0 ? accruedRewards.toFixed(8) : "0.00368940"} ALX
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/')}
                  className="w-full py-2 bg-[#FAF9F6] hover:bg-white border border-[#DFDAD0] hover:border-black rounded-sm text-xs font-mono font-bold text-[#111111] transition-colors"
                >
                  Kelola Staking di Dashboard →
                </button>
              </div>

              {/* CARD 3: INSTITUTIONAL ASSURANCE */}
              <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#111111]">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Jaminan Keamanan Tingkat Lembaga</span>
                </div>
                <p className="text-[11px] text-[#666666] leading-relaxed">
                  Semua transaksi spot dan swap di AliBank dilindungi oleh smart contract terverifikasi di Polygon PoS Mainnet dengan cadangan likuiditas 100% transparan on-chain.
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* 3. MOBILE BOTTOM FIXED ACTION BAR (lg:hidden) */}
        <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DFDAD0] px-4 py-3 flex items-center gap-3 shadow-lg">
          <button 
            onClick={() => router.push(isAlix ? '/crypto/convert?from=USDT&to=ALX' : `/crypto/convert?from=USDT&to=${symbol}`)}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-serif text-sm font-bold uppercase tracking-wider rounded-sm shadow-sm"
          >
            Beli
          </button>
          <button 
            onClick={() => router.push(isAlix ? '/crypto/convert?from=ALX&to=USDT' : `/crypto/convert?from=${symbol}&to=USDT`)}
            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white font-serif text-sm font-bold uppercase tracking-wider rounded-sm shadow-sm"
          >
            Jual
          </button>
        </footer>

      </main>

      {/* 4. MODAL COIN SELECTOR DIALOG (CENTERED ON DESKTOP, BOTTOM SHEET ON MOBILE) */}
      {showCoinSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => {
              setShowCoinSelector(false);
              setSearchQuery("");
            }}
          />

          {/* Dialog Container */}
          <div className="relative w-full max-w-md bg-white border border-[#DFDAD0] rounded-xl shadow-2xl z-10 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-[#DFDAD0] flex items-center justify-between bg-[#FAF9F6]">
              <div>
                <h3 className="font-serif text-base font-bold text-[#111111]">Pilih Pasar Kripto</h3>
                <p className="text-[10px] font-mono text-[#888888] mt-0.5">AliBank V3.1 Institutional Exchange</p>
              </div>
              <button 
                onClick={() => {
                  setShowCoinSelector(false);
                  setSearchQuery("");
                }}
                className="px-2.5 py-1 text-xs font-mono font-bold text-[#666666] hover:text-black border border-[#DFDAD0] hover:border-black rounded-sm bg-white transition-colors"
              >
                Tutup
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-[#DFDAD0]">
              <div className="relative">
                <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cari simbol atau nama koin..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-10 pl-10 pr-4 rounded-sm bg-[#FAF9F6] border border-[#DFDAD0] text-xs font-mono font-bold text-[#111111] focus:outline-none focus:border-black transition-colors"
                />
              </div>
            </div>

            {/* Coin List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-[#FAF9F6]">
              {filteredCoins.map((coin) => {
                const isCurrent = coin.symbol === symbol;
                return (
                  <div 
                    key={coin.symbol} 
                    onClick={() => {
                      setShowCoinSelector(false);
                      setSearchQuery("");
                      router.push(`/crypto/market/${coin.symbol.toLowerCase()}`);
                    }}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-sm cursor-pointer transition-colors pt-2.5",
                      isCurrent 
                        ? "bg-[#FAF9F6] border border-[#DFDAD0]" 
                        : "hover:bg-[#FAF9F6] border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0", coin.isNative ? "bg-[#F4B728] p-1.5" : coin.symbol === 'POL' ? "bg-[#7B3FE4] p-1" : "bg-[#EDE9E3] relative")}>
                        {coin.isNative ? (
                          <LogoIcon className="text-black" />
                        ) : coin.symbol === 'POL' ? (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-white">
                            <path d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 2.24l7.98 4.39v7.74L12 19.76l-7.98-4.39V8.63L12 4.24z"/>
                          </svg>
                        ) : (
                          <>
                            <img 
                              src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`} 
                              className="object-cover w-full h-full" 
                              alt={coin.symbol} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                const fallback = (e.target as HTMLImageElement).nextElementSibling;
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                            <div className="hidden absolute inset-0 flex items-center justify-center bg-[#EDE9E3] font-mono text-[9px] font-bold text-[#555555]">
                              {coin.symbol[0]}
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif text-sm font-bold text-[#111111]">{coin.symbol}</span>
                          {coin.isNative && <Badge className="bg-[#FAF0E6] text-[#A05A12] border border-[#F0D5BE] text-[8px] h-4 px-1.5 font-mono">AliBank Native</Badge>}
                        </div>
                        <p className="text-[10px] font-mono text-[#888888]">{coin.name} • {coin.chain}</p>
                      </div>
                    </div>
                    
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-sm bg-[#111111] text-white text-[9px] font-mono font-bold">
                        Aktif
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
