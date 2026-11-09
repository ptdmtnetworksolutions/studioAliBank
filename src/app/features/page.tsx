"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Zap,
  Lock,
  Layers,
  Cpu,
  Smartphone,
  CreditCard,
  Key,
  Database,
  Sliders,
  Scale,
  RefreshCw,
  FileCheck2,
  Sparkles,
  AlertTriangle,
  Building2,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pre-computed guilloche rays for 100% hydration consistency
const FEATURES_GUILLOCHE_RAYS = Array.from({ length: 72 }, (_, i) => {
  const angle = (i * 360) / 72;
  const rad = (angle * Math.PI) / 180;
  return {
    x1: Number((200 + 40 * Math.cos(rad)).toFixed(2)),
    y1: Number((200 + 40 * Math.sin(rad)).toFixed(2)),
    x2: Number((200 + 180 * Math.cos(rad)).toFixed(2)),
    y2: Number((200 + 180 * Math.sin(rad)).toFixed(2)),
    opacity: i % 3 === 0 ? 0.9 : 0.4,
  };
});

interface FeatureItem {
  id: string;
  category: "banking" | "web3" | "por" | "merchant" | "security";
  tagEn: string;
  tagId: string;
  badgeEn: string;
  badgeId: string;
  titleEn: string;
  titleId: string;
  excerptEn: string;
  excerptId: string;
  specs: {
    labelEn: string;
    labelId: string;
    value: string;
  }[];
  contentEn: string[];
  contentId: string[];
  isSpecialStyle?: "gold" | "dark" | "crimson";
  actionLink?: {
    href: string;
    labelEn: string;
    labelId: string;
    isExternal?: boolean;
  };
}

function FeaturesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>("instant-transfers");

  const ALX_POLYGON_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const ETH_VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const categories = useMemo(
    () => [
      { id: "all", labelEn: "ALL FEATURES", labelId: "SEMUA FITUR" },
      { id: "banking", labelEn: "BANKING & RAILS", labelId: "PERBANKAN & KLIRING" },
      { id: "web3", labelEn: "MULTI-CHAIN & WEB3", labelId: "MULTI-CHAIN & WEB3" },
      { id: "por", labelEn: "PROOF OF RESERVES", labelId: "BUKTI CADANGAN (POR)" },
      { id: "merchant", labelEn: "MERCHANT & POS", labelId: "MERCHANT & KASIR" },
      { id: "security", labelEn: "SECURITY & AML", labelId: "KEAMANAN & AML" },
    ],
    []
  );

  const features: FeatureItem[] = useMemo(
    () => [
      // 1. Instant Transfers
      {
        id: "instant-transfers",
        category: "banking",
        tagEn: "SETTLEMENT ENGINE",
        tagId: "MESIN PENYELESAIAN",
        badgeEn: "<200MS LATENCY",
        badgeId: "<200MS LATENSI",
        titleEn: "Instant Peer-to-Peer Atomic Settlement",
        titleId: "Penyelesaian Atomik Peer-to-Peer Instan",
        excerptEn:
          "High-throughput internal ledger enabling zero-fee, sub-200ms payments across all AliBank personal, merchant, and institutional accounts globally.",
        excerptId:
          "Buku besar internal berkecepatan tinggi yang memungkinkan transfer 0% biaya di bawah 200 milidetik antar akun perorangan, merchant, dan institusi AliBank.",
        specs: [
          { labelEn: "Execution Latency", labelId: "Latensi Eksekusi", value: "< 180 ms (99th percentile)" },
          { labelEn: "Transfer Fee", labelId: "Biaya Transfer", value: "0% (Fully Gas-Sponsored)" },
          { labelEn: "Supported Assets", labelId: "Aset Didukung", value: "IDR, USDT, ALX, ETH, BTC" },
          { labelEn: "Concurrency Model", labelId: "Model Konkurensi", value: "Optimistic Invariant Locking" },
        ],
        contentEn: [
          "Legacy interbank systems (SWIFT, local wire clearings) suffer from operational cutoffs, high intermediary fees, and multi-day settlement delays.",
          "AliBank operates an atomic in-memory double-entry clearing engine. Balance transfers debit the sender and credit the receiver in a single transactional batch, preventing partial execution states.",
          "Every internal transfer generates an immutable cryptographic transaction voucher with SHA-256 hash proofs, immediately exportable for institutional accounting.",
        ],
        contentId: [
          "Sistem kliring antarbank konvensional (seperti SWIFT atau transfer manual) terbatas jam kerja operasional, biaya perantara tinggi, dan penundaan berhari-hari.",
          "AliBank menjalankan mesin kliring akuntansi ganda atomik. Pengurangan saldo pengirim dan penambahan saldo penerima terjadi dalam satu blok transaksi instan tanpa risiko dana gantung.",
          "Setiap mutasi menghasilkan bukti transfer elektronik resmi dengan stempel hash kriptografis SHA-256 yang sah untuk rekonsiliasi keuangan bisnis.",
        ],
        isSpecialStyle: "gold",
        actionLink: {
          href: "/use-alibank",
          labelEn: "Test Instant Transfer →",
          labelId: "Coba Transfer Instan →",
        },
      },

      // 2. Dual Currency
      {
        id: "dual-currency",
        category: "banking",
        tagEn: "TREASURY & FX",
        tagId: "PERBENDAHARAAN & FX",
        badgeEn: "DUAL-LEDGER PARITY",
        badgeId: "PARITAS DUA LEDGER",
        titleEn: "Synchronized Dual-Currency IDR & Crypto Balances",
        titleId: "Sinkronisasi Saldo Ganda Rupiah (IDR) & Kripto",
        excerptEn:
          "Seamless institutional treasury view displaying fiat balances alongside on-chain digital assets with real-time conversion and zero hidden exchange spreads.",
        excerptId:
          "Tampilan perbendaharaan kelas institusi yang menampilkan saldo fiat rupiah berdampingan dengan aset digital on-chain tanpa biaya tersembunyi.",
        specs: [
          { labelEn: "Base Anchor Price", labelId: "Harga Jangkar Dasar", value: "1 ALX = $12.24 USDT" },
          { labelEn: "Oracle Feed", labelId: "Frekuensi Oracle", value: "Real-time automated sync" },
          { labelEn: "Internal Slippage", labelId: "Slippage Internal", value: "0.00% Guaranteed" },
          { labelEn: "Reporting Standard", labelId: "Standar Pelaporan", value: "Dual Fiat / Crypto View" },
        ],
        contentEn: [
          "Users and corporate treasuries no longer need disjointed apps for fiat banking and Web3 holdings. AliBank consolidates liquid IDR deposits and crypto holdings into a unified private banking dashboard.",
          "The internal treasury automatically converts balances at verified benchmark exchange rates, ensuring institutional liquidity without predatory foreign exchange markups.",
        ],
        contentId: [
          "Nasabah perorangan dan bendahara perusahaan tidak perlu lagi memisahkan rekening bank fiat konvensional dengan dompet Web3. AliBank menyatukan simpanan IDR dan portofolio kripto dalam satu dasbor privat.",
          "Sistem melakukan konversi otomatis dengan nilai tukar patokan resmi tanpa mark-up kurs valas liar yang merugikan pengguna.",
        ],
      },

      // 3. QRIS & POS Gateway
      {
        id: "qris-pos",
        category: "merchant",
        tagEn: "MERCHANT RAILS",
        tagId: "INFRASTRUKTUR KASIR",
        badgeEn: "0% NATIONAL MDR",
        badgeId: "MDR NASIONAL 0%",
        titleEn: "0% National QRIS & Point-of-Sale Gateway",
        titleId: "Gerbang Pembayaran QRIS Nasional 0% Biaya & POS",
        excerptEn:
          "Dynamic standard Indonesian QRIS generation with instant merchant wallet clearing, eliminating conventional 1-3 day bank settlement holds.",
        excerptId:
          "Pembuatan QRIS standar nasional dinamis dengan pencairan saldo instan ke dompet merchant, menghapus penundaan pencairan bank 1-3 hari kerja.",
        specs: [
          { labelEn: "MDR Merchant Fee", labelId: "Biaya MDR Merchant", value: "0.00% (Zero Deductions)" },
          { labelEn: "Settlement Speed", labelId: "Kecepatan Kliring", value: "Instant Real-Time Credit" },
          { labelEn: "Standard", labelId: "Standar Pembayaran", value: "QRIS ASPI / Bank Indonesia" },
          { labelEn: "API Integration", labelId: "Integrasi API", value: "REST Webhooks + JSON Payload" },
        ],
        contentEn: [
          "Traditional merchant acquiring services subject retail business owners to 0.7% - 1.5% merchant discount rates (MDR) and hold funds over weekends.",
          "AliBank offers zero-fee QRIS terminals. Retailers receive funds directly into their high-yield checking balance in real-time, ready for immediate vendor disbursement or staking.",
        ],
        contentId: [
          "Mesin EDC dan QRIS bank konvensional memotong 0,7% hingga 1,5% biaya transaksi pedagang dan menahan uang selama akhir pekan atau hari libur.",
          "AliBank menyediakan fasilitas terminal QRIS 0% biaya. Dana pelanggan langsung masuk secara real-time ke rekening merchant tanpa pemotongan sepeser pun.",
        ],
        actionLink: {
          href: "/ecosystem?category=merchant",
          labelEn: "Explore Merchant Solutions →",
          labelId: "Pelajari Solusi Merchant →",
        },
      },

      // 4. SoftPOS Contactless NFC
      {
        id: "softpos-nfc",
        category: "merchant",
        tagEn: "HARDWARELESS TERMINAL",
        tagId: "TERMINAL TANPA MESIN EDC",
        badgeEn: "NFC CONTACTLESS",
        badgeId: "NFC CONTACTLESS",
        titleEn: "SoftPOS Contactless Smartphone NFC Terminal",
        titleId: "Terminal SoftPOS Kontak NFC pada Smartphone",
        excerptEn:
          "Turn any NFC-equipped smartphone into a certified contactless payment terminal for prepaid electronic money cards and EMV chip tap cards.",
        excerptId:
          "Ubah smartphone berfitur NFC menjadi mesin kasir nirsentuh (tap-to-pay) untuk kartu uang elektronik (e-money) dan kartu debit/kredit tanpa perangkat keras tambahan.",
        specs: [
          { labelEn: "Card Support", labelId: "Kartu Didukung", value: "Mandiri e-Money, Flazz, TapCash, Visa/MC" },
          { labelEn: "Hardware Reqt", labelId: "Kebutuhan Hardware", value: "Standard NFC-enabled Android" },
          { labelEn: "Communication", labelId: "Protokol Komunikasi", value: "ISO/IEC 14443 Type A/B" },
          { labelEn: "Digital Receipts", labelId: "Struk Digital", value: "Cryptographically Signed SMS/Web" },
        ],
        contentEn: [
          "AliBank SoftPOS removes the requirement to rent or buy expensive proprietary EDC machines. Cashiers simply enter the purchase amount and ask customers to tap their physical card against the back of the phone.",
          "Transactions are verified with ISO/IEC 14443 secure cryptographic challenges, generating instant digital receipts with authorization numbers and RRN records.",
        ],
        contentId: [
          "Fitur SoftPOS AliBank menghapus kewajiban menyewa atau membeli mesin EDC fisik yang mahal. Kasir cukup memasukkan nominal lalu menempelkan kartu nasabah ke bodi ponsel.",
          "Transaksi diverifikasi menggunakan standar ISO/IEC 14443 yang aman dan langsung menerbitkan struk digital berstempel nomor otorisasi resmi.",
        ],
      },

      // 5. TrustWallet Core Derivation
      {
        id: "trustwallet-core",
        category: "web3",
        tagEn: "CRYPTOGRAPHIC STANDARDS",
        tagId: "STANDAR KRIPTOGRAFIS",
        badgeEn: "BIP-39 / BIP-44 / BIP-84",
        badgeId: "BIP-39 / BIP-44 / BIP-84",
        titleEn: "TrustWallet Core Hierarchical Key Derivation",
        titleId: "Derivasi Kunci Hierarkis Standar TrustWallet Core",
        excerptEn:
          "Universal self-custodial seed derivation following industry-standard BIP specifications, ensuring zero vendor lock-in and seamless wallet portability.",
        excerptId:
          "Derivasi frase pemulihan (seed phrase) mandiri berstandar industri internasional, menjamin kebebasan nasabah tanpa keterikatan sepihak.",
        specs: [
          { labelEn: "Bitcoin Derivation", labelId: "Derivasi Bitcoin", value: "m/84'/0'/0'/0/0 (Native SegWit)" },
          { labelEn: "EVM Derivation", labelId: "Derivasi EVM", value: "m/44'/60'/0'/0/0 (Ethereum/Polygon)" },
          { labelEn: "Entropy Standard", labelId: "Standar Entropi", value: "128/256-bit cryptographically secure" },
          { labelEn: "Portability", labelId: "Portabilitas", value: "Compatible with Ledger, Trezor, TrustWallet" },
        ],
        contentEn: [
          "AliBank believes that true financial sovereignty requires open standards. Your wallet addresses are mathematically derived from standard BIP-39 mnemonic seeds.",
          "If you ever choose to export your keys, your addresses and assets remain fully accessible on external software or hardware devices without dependency on AliBank servers.",
        ],
        contentId: [
          "AliBank meyakini bahwa kedaulatan finansial sejati menuntut standar terbuka. Alamat dompet Anda dihasilkan dari kalkulasi matematis frase sandi BIP-39.",
          "Jika Anda memutuskan mengekspor kunci privat, seluruh aset Anda tetap dapat diakses di dompet eksternal mana pun tanpa ketergantungan pada server AliBank.",
        ],
        actionLink: {
          href: "/ecosystem?category=wallets",
          labelEn: "View Wallet Specifications →",
          labelId: "Lihat Spesifikasi Dompet →",
        },
      },

      // 6. MetaMask Native Bridge
      {
        id: "metamask-bridge",
        category: "web3",
        tagEn: "WEB3 CONNECTIVITY",
        tagId: "KONEKTIVITAS WEB3",
        badgeEn: "EIP-712 AUTH",
        badgeId: "OTENTIKASI EIP-712",
        titleEn: "MetaMask Native Web3 Bridge & Typed Signing",
        titleId: "Jembatan Native MetaMask & Penandatanganan Terenkripsi",
        excerptEn:
          "Direct browser-based Web3 wallet link supporting cryptographic signature authentication and trustless on-chain deposit and withdrawal execution.",
        excerptId:
          "Koneksi dompet Web3 langsung di peramban yang mendukung otentikasi tanda tangan digital dan penyetoran/penarikan on-chain tanpa perantara.",
        specs: [
          { labelEn: "Interface Standard", labelId: "Standar Antarmuka", value: "EIP-1193 Provider Standard" },
          { labelEn: "Signature Standard", labelId: "Standar Tanda Tangan", value: "EIP-712 Typed Structured Data" },
          { labelEn: "Gas Estimation", labelId: "Estimasi Gas", value: "Real-time RPC fee optimization" },
          { labelEn: "Supported Chains", labelId: "Rantai Didukung", value: "Polygon, Ethereum, Arbitrum" },
        ],
        contentEn: [
          "Connect your external Web3 wallet with a single click. AliBank verifies ownership using cryptographic message signatures (personal_sign or EIP-712), eliminating the need for seed phrase disclosure.",
          "Users can deposit on-chain assets into high-yield staking contracts or trigger instant withdrawals directly from their connected browser extension.",
        ],
        contentId: [
          "Hubungkan dompet Web3 eksternal Anda hanya dengan satu klik. AliBank memverifikasi kepemilikan dompet melalui tanda tangan digital tanpa pernah meminta kata sandi rahasia Anda.",
          "Pengguna dapat menyetor aset on-chain ke brankas staking hasil tinggi atau melakukan penarikan instan langsung dari ekstensi peramban.",
        ],
      },

      // 7. Ethereum 12% APY Yield Vault
      {
        id: "yield-vault",
        category: "web3",
        tagEn: "DEFI LIQUIDITY",
        tagId: "LIKUIDITAS DEFI",
        badgeEn: "12.00% BASE APY",
        badgeId: "12,00% BASE APY",
        titleEn: "Ethereum Mainnet 12.00% APY Smart Yield Vault",
        titleId: "Brankas Hasil Cerdas Ethereum Mainnet 12,00% APY",
        excerptEn:
          "Institutional liquidity vault deployed directly to Ethereum Mainnet providing algorithmic yield accrual with transparent smart contract distribution.",
        excerptId:
          "Brankas likuiditas institusional yang diterapkan langsung di Ethereum Mainnet dengan imbal hasil algoritmik dan kontrak pintar terverifikasi.",
        specs: [
          { labelEn: "Vault Contract", labelId: "Kontrak Brankas", value: ETH_VAULT_CONTRACT },
          { labelEn: "Distribution Model", labelId: "Model Distribusi", value: "Per-block algorithmic accrual" },
          { labelEn: "Lockup Period", labelId: "Masa Kunci Dana", value: "0 Days (Liquid On-Demand)" },
          { labelEn: "Audit Status", labelId: "Status Audit", value: "Open Source Verified on Etherscan" },
        ],
        contentEn: [
          "Unlike opaque centralized lending desks that speculate with customer deposits, AliBank's staking yield is governed by deterministic on-chain smart contracts.",
          "Funds deposited into the Ethereum Liquidity Vault accrue yield transparently, and depositors can claim rewards or withdraw principal liquidity at any time without punitive penalties.",
        ],
        contentId: [
          "Berbeda dari platform pinjaman gelap yang berspekulasi dengan uang nasabah, imbal hasil AliBank dikelola oleh smart contract terbuka di Ethereum.",
          "Aset yang disimpan di brankas likuiditas bertambah secara terukur, dan nasabah dapat mengklaim dividen atau menarik pokok simpanan kapan saja tanpa potongan denda.",
        ],
        actionLink: {
          href: `https://etherscan.io/address/${ETH_VAULT_CONTRACT}`,
          labelEn: "Inspect Vault on Etherscan →",
          labelId: "Audit Brankas di Etherscan →",
          isExternal: true,
        },
      },

      // 8. Polygon ALX Rail
      {
        id: "polygon-alx",
        category: "web3",
        tagEn: "LAYER-2 UTILITY",
        tagId: "UTILITAS LAYER-2",
        badgeEn: "SUB-SECOND FINALITY",
        badgeId: "FINALITAS SUB-DETIK",
        titleEn: "Polygon Mainnet High-Throughput ALX Token Rail",
        titleId: "Jalur Token Utilitas Resmi ALX di Polygon Mainnet",
        excerptEn:
          "Audited ERC-20 utility asset minted on Polygon PoS Mainnet for fee discounts, multi-chain liquidity routing, and decentralized ecosystem rewards.",
        excerptId:
          "Aset utilitas ERC-20 terverifikasi di Polygon PoS Mainnet untuk diskon biaya transaksi, perputaran likuiditas, dan dividen ekosistem terdesentralisasi.",
        specs: [
          { labelEn: "Token Contract", labelId: "Kontrak Token", value: ALX_POLYGON_CONTRACT },
          { labelEn: "Standard", labelId: "Standar Token", value: "ERC-20 OpenZeppelin Audited" },
          { labelEn: "Total Max Supply", labelId: "Total Pasokan Maksimal", value: "1,000,000,000 ALX" },
          { labelEn: "Decimals", labelId: "Desimal Token", value: "18" },
        ],
        contentEn: [
          "The ALX token serves as the decentralized fuel of the AliBank network. Holding ALX confers VIP tier fee exemptions on internal transfers and merchant settlements.",
          "Deployed on Polygon PoS, transactions settle in approximately 2 seconds with fractions of a cent in gas fees, enabling true micro-transactions.",
        ],
        contentId: [
          "Token ALX adalah bahan bakar desentralisasi jaringan AliBank. Kepemilikan saldo ALX memberikan nasabah status VIP bebas biaya transfer dan bebas biaya kasir merchant.",
          "Dengan berjalan di jaringan Polygon, transaksi tuntas dalam kurun waktu 2 detik dengan biaya gas mikroskopis, sangat ideal untuk transaksi harian.",
        ],
        actionLink: {
          href: `https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`,
          labelEn: "Inspect ALX on Polygonscan →",
          labelId: "Audit ALX di Polygonscan →",
          isExternal: true,
        },
      },

      // 9. Proof of Reserves
      {
        id: "proof-of-reserves",
        category: "por",
        tagEn: "SOLVENCY AUDITING",
        tagId: "AUDIT KESEHATAN KEUANGAN",
        badgeEn: "1:1 FULL BACKING",
        badgeId: "1:1 DUKUNGAN PENUH",
        titleEn: "1:1 Mathematical Proof of Reserves (PoR)",
        titleId: "1:1 Bukti Cadangan Matematis Terbuka (PoR)",
        excerptEn:
          "Every single customer deposit is backed 100% by verifiable on-chain assets and escrowed bank reserves, mathematically eliminating fractional-reserve insolvency.",
        excerptId:
          "Setiap simpanan nasabah didukung 100% oleh cadangan aset on-chain dan escrow perbankan resmi yang terverifikasi, menghapus risiko kebangkrutan bank.",
        specs: [
          { labelEn: "Solvency Invariant", labelId: "Persamaan Solvensi", value: "Total Reserves >= Total Customer Balances" },
          { labelEn: "Audit Frequency", labelId: "Frekuensi Audit", value: "Continuous 24/7 Real-Time Check" },
          { labelEn: "Custody Type", labelId: "Model Kustodi", value: "Non-Fractional Full Reserve" },
          { labelEn: "Verification Link", labelId: "Verifikasi Publik", value: "Polygonscan & Etherscan" },
        ],
        contentEn: [
          "Commercial banks practice fractional-reserve banking, keeping as little as 5% to 10% in liquid reserves while lending out customer funds to high-risk ventures.",
          "AliBank operates under a strict full-reserve mandate. Customer depository liabilities are matched 1:1 by physical on-chain assets in our public liquidity contracts.",
          "Anyone in the world can run public RPC scripts against our contracts to prove that the platform maintains 100% mathematical liquidity at all times.",
        ],
        contentId: [
          "Bank konvensional menerapkan sistem cadangan fraksional, hanya menyimpan 5% hingga 10% cadangan cair sementara sisanya dipinjamkan ke bisnis berisiko.",
          "AliBank tunduk pada mandat cadangan penuh (Full-Reserve Banking). Kewajiban saldo nasabah diimbangi 1:1 oleh aset kripto fisik di smart contract publik kami.",
          "Siapa pun di seluruh dunia dapat memeriksa langsung saldo cadangan ini melalui penjelajah blockchain publik untuk membuktikan bahwa AliBank 100% solven setiap detik.",
        ],
        isSpecialStyle: "dark",
        actionLink: {
          href: "/learn?category=por",
          labelEn: "Learn How to Audit PoR →",
          labelId: "Cara Audit Mandiri PoR →",
        },
      },

      // 10. Double-Entry Constraint
      {
        id: "double-entry",
        category: "security",
        tagEn: "ACCOUNTING INVARIANT",
        tagId: "PERSAMAAN AKUNTANSI",
        badgeEn: "BALANCED EQUATION",
        badgeId: "PERSAMAAN SEIMBANG",
        titleEn: "Mathematically Constrained Double-Entry Ledger",
        titleId: "Buku Besar Persamaan Akuntansi Ganda yang Terikat Matematika",
        excerptEn:
          "Autonomous database engine where money can never be fabricated from thin air: every debit requires an exact equal credit or the transaction is atomically rejected.",
        excerptId:
          "Mesin basis data otonom yang melarang penciptaan uang fiktif: setiap mutasi debet wajib memiliki mutasi kredit yang bernilai sama persis secara absolut.",
        specs: [
          { labelEn: "Core Constraint", labelId: "Persamaan Inti", value: "ΔAssets = ΔLiabilities + ΔEquity" },
          { labelEn: "Transaction Atomicity", labelId: "Atomisitas Transaksi", value: "ACID Compliant In-Memory Engine" },
          { labelEn: "Asymmetry Tolerance", labelId: "Toleransi Ketidakseimbangan", value: "0.00000000 (Zero Drift)" },
          { labelEn: "Tamper Proofing", labelId: "Keamanan Tamper", value: "Cryptographic SHA-256 Block Chaining" },
        ],
        contentEn: [
          "In conventional soft ledger databases, balance corruption or accidental updates can create phantom money that leads to platform insolvency.",
          "AliBank enforces a mathematical invariant: every movement of funds is represented as a balanced double-entry journal entry. If a transaction attempts to alter an account balance without a corresponding verified debit or credit, the database engine aborts the execution immediately.",
        ],
        contentId: [
          "Pada basis data biasa, bug sistem atau manipulasi manual dapat memicu timbulnya 'saldo hantu' palsu yang menyebabkan defisit neraca keuangan.",
          "AliBank menerapkan invariant matematika ketat: seluruh mutasi dana dicatat sebagai jurnal ganda berpasangan. Jika terjadi percobaan mengubah saldo tanpa akun lawan yang sah, transaksi akan digagalkan secara seketika.",
        ],
      },

      // 11. Phantom Detection & Quarantine
      {
        id: "phantom-detection",
        category: "security",
        tagEn: "AML SURVEILLANCE",
        tagId: "PENGAWASAN AML",
        badgeEn: "AUTONOMOUS FREEZE",
        badgeId: "PEMBEKUAN OTOMATIS",
        titleEn: "Real-Time Phantom Balance Tamper Quarantine Shield",
        titleId: "Perisai Karantina Saldo Hantu & Manipulasi Saldo Real-Time",
        excerptEn:
          "Autonomous fraud prevention algorithms that detect unbacked balance spikes, illicit money cycling, or ledger discrepancies in under 50ms.",
        excerptId:
          "Algoritma pencegahan penipuan otonom yang mendeteksi lonjakan saldo tanpa dasar, perputaran dana gelap, atau anomali buku besar di bawah 50 milidetik.",
        specs: [
          { labelEn: "Detection Window", labelId: "Waktu Deteksi", value: "< 50 milliseconds" },
          { labelEn: "Action Type", labelId: "Tindakan Pengamanan", value: "Atomic Account & Asset Freeze" },
          { labelEn: "Reconciliation", labelId: "Rekonsiliasi Bukti", value: "On-Chain & Bank Proof Cross-Check" },
          { labelEn: "Sanction Severity", labelId: "Tingkat Ketegasan", value: "Zero Tolerance Asset Quarantine" },
        ],
        contentEn: [
          "AliBank enforces a non-negotiable Zero-Tolerance Anti-Money Laundering (AML) policy. The system continuously cross-checks account balances against audited bank transfer records and blockchain contract transactions.",
          "If an account exhibits suspicious behavior—such as unbacked balance injections, rapid layering, or withdrawal requests without matching deposits—the account is quarantined immediately and the unauthorized phantom balance is purged.",
        ],
        contentId: [
          "AliBank memberlakukan kebijakan Anti-Pencucian Uang (AML) tanpa kompromi. Sistem membandingkan mutasi akun terhadap bukti setoran perbankan resmi dan transaksi blockchain.",
          "Bila terdeteksi indikasi anomali—seperti upaya manipulasi saldo lokal, perputaran dana gelap, atau permintaan penarikan tanpa riwayat setoran yang sah—akun akan langsung dibekukan dan saldo fiktif disita secara sepihak.",
        ],
        isSpecialStyle: "crimson",
        actionLink: {
          href: "/learn?category=aml",
          labelEn: "Read Zero-Tolerance AML Policy →",
          labelId: "Baca Kebijakan Nol-Toleransi AML →",
        },
      },

      // 12. Military Vault Encryption
      {
        id: "military-vault",
        category: "security",
        tagEn: "IDENTITY SECURITY",
        tagId: "KEAMANAN IDENTITAS",
        badgeEn: "AES-256-GCM",
        badgeId: "AES-256-GCM",
        titleEn: "AES-256 Military Encrypted Biometric Identity Vault",
        titleId: "Brankas Enkripsi Militer AES-256 untuk Biometrik & Identitas",
        excerptEn:
          "Hardware-isolated, multi-tenant credential storage securing customer KYC national identification cards, biometric face vectors, and private keys.",
        excerptId:
          "Penyimpanan kredensial terisolasi perangkat keras tingkat tinggi untuk mengamankan data KTP/paspor nasabah, verifikasi biometrik, dan kunci privat.",
        specs: [
          { labelEn: "Cipher Algorithm", labelId: "Algoritma Sandi", value: "AES-256-GCM Authenticated Encryption" },
          { labelEn: "Key Derivation", labelId: "Derivasi Kunci", value: "PBKDF2 with HMAC-SHA512 (100k rounds)" },
          { labelEn: "Isolation Boundary", labelId: "Isolasi Data", value: "Zero-Knowledge Hardware Vault Cluster" },
          { labelEn: "Compliance", labelId: "Kepatuhan Regulasi", value: "APU-PPT & Global Privacy Standards" },
        ],
        contentEn: [
          "Your sensitive personal identification records, biometric facial verification scans, and contact numbers are encrypted before being written to persistent storage.",
          "Private keys and user credentials cannot be accessed even by platform database administrators, ensuring total protection against external data breaches and social engineering.",
        ],
        contentId: [
          "Dokumen sensitif seperti foto KTP, rekaman biometrik wajah, dan data pribadi nasabah dienkripsi secara ketat sebelum disimpan di server.",
          "Bahkan administrator basis data internal tidak dapat membaca kunci privat atau dokumen pengguna tanpa otorisasi terenkripsi, memberikan rasa aman mutlak.",
        ],
      },
    ],
    []
  );

  const filteredFeatures = useMemo(() => {
    return features.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.titleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerptEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerptId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [features, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans selection:bg-[#F4B728]/30 selection:text-black">
      {/* =========================================================================
          1. STICKY INSTITUTIONAL HEADER (Clean Zcash Standard, No Sign In / Open Account)
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#DFDAD0] transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <NextLink href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-lg shadow-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
              AliBank
            </span>
          </NextLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.18em] text-[#444444] uppercase h-full">
            {/* LEARN Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "learn" ? null : "learn")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "learn" ? "text-[#111111]" : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "LEARN" : "PELAJARI"}</span>
              </button>
              {activeMegaMenu === "learn" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* ECOSYSTEM Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "ecosystem" ? null : "ecosystem")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "ecosystem" ? "text-[#111111]" : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}</span>
              </button>
              {activeMegaMenu === "ecosystem" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* NETWORK Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "network" ? null : "network")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "network" ? "text-[#111111]" : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "NETWORK" : "JARINGAN"}</span>
              </button>
              {activeMegaMenu === "network" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* FEATURES Trigger (Active Page: Permanent Gold Underline) */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "features" ? null : "features")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "features" ? "text-[#111111]" : "text-black font-black hover:text-black"
                )}
              >
                <span>{lang === "en" ? "FEATURES" : "FITUR"}</span>
              </button>
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
            </div>

            <NextLink href="/#faq" className="hover:text-black transition-colors">
              FAQ
            </NextLink>
          </nav>

          {/* Actions & Language Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-[10px] font-bold tracking-widest border border-[#DFDAD0] rounded-sm p-0.5 bg-[#F4F1EA]">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-2 py-1 rounded-[2px] transition-colors",
                  lang === "en" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={cn(
                  "px-2 py-1 rounded-[2px] transition-colors",
                  lang === "id" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                )}
              >
                ID
              </button>
            </div>

            <NextLink
              href="/learn"
              className="p-2 text-[#444444] hover:text-black transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </NextLink>
          </div>
        </div>

        {/* =========================================================================
            MEGA MENUS
            ========================================================================= */}
        {/* 1. LEARN MEGA MENU */}
        {activeMegaMenu === "learn" && (
          <>
            <div onClick={() => setActiveMegaMenu(null)} className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]" />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                <div className="space-y-3 pr-4 border-r border-[#ECE7DE]">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "LEARN" : "PELAJARI"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Learn the basics of the AliBank hybrid protocol, strict anti-money laundering security, on-chain reserves, and self-sovereign multi-chain banking."
                      : "Pelajari dasar protokol hibrida AliBank, keamanan ketat anti-pencucian uang, transparansi cadangan on-chain, dan kedaulatan perbankan multi-chain."}
                  </p>
                  <div className="pt-2">
                    <NextLink
                      href="/learn"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Browse Knowledge Hub →" : "Buka Pusat Pengetahuan →"}
                    </NextLink>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">ALIBANK 101</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What is AliBank?" : "Apa itu AliBank?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "How is AliBank different from ALX?" : "Apa beda AliBank dengan ALX?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=wallet" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What are TrustWallet Core standards?" : "Apa itu standar TrustWallet Core?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & AML" : "KEAMANAN & AML"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">
                        {lang === "en" ? "Zero-Tolerance Anti-Money Laundering Policy" : "Kebijakan Nol-Toleransi Anti-Pencucian Uang"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Real-Time Anomaly & Phantom Detection" : "Deteksi Saldo Hantu & Anomali Real-Time"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What triggers an account restriction?" : "Apa yang memicu pembekuan akun?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block">
                        {lang === "en" ? "Explore AML Engine →" : "Pelajari Mesin AML →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "USING ALIBANK" : "PENGGUNAAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/learn?category=por" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "How to audit Proof of Reserves?" : "Cara audit Bukti Cadangan (PoR)?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=architecture" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Why double-entry ledger matters?" : "Mengapa buku besar ganda mutlak?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=merchant" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Merchant POS & QRIS acceptance" : "Penerimaan Kasir POS & QRIS"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 2. ECOSYSTEM MEGA MENU */}
        {activeMegaMenu === "ecosystem" && (
          <>
            <div onClick={() => setActiveMegaMenu(null)} className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]" />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                <div className="space-y-3 pr-4 border-r border-[#ECE7DE]">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Browse wallets, blockchain networks, developer tools and everything you need to become a participant in the AliBank ecosystem."
                      : "Jelajahi dompet, jaringan blockchain, alat pengembang, dan infrastruktur pendukung ekosistem AliBank."}
                  </p>
                  <div className="pt-2">
                    <NextLink
                      href="/ecosystem"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Browse Ecosystem Hub →" : "Buka Hub Ekosistem →"}
                    </NextLink>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "WALLETS" : "DOMPET"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        MetaMask Web3 Bridge
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        TrustWallet Core (BIP-39/44)
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Hardware Wallet Custody
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORKS & VAULTS" : "JARINGAN & BRANKAS"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Polygon Mainnet (ALX)
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Ethereum Liquidity Vault
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Bitcoin Native SegWit
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "BUILD & MERCHANTS" : "PENGEMBANG & KASIR"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/ecosystem?category=build" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Build with AliBank REST API
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=merchant" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Merchant POS & QRIS Terminal
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=build" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        Smart Contract Source Code
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=build" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 3. NETWORK MEGA MENU */}
        {activeMegaMenu === "network" && (
          <>
            <div onClick={() => setActiveMegaMenu(null)} className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]" />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                <div className="space-y-3 pr-4 border-r border-[#ECE7DE]">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORK" : "JARINGAN"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "AliBank protocol network information, real-time ledger statistics, multi-chain settlement rails, reserve backing and governance."
                      : "Informasi jaringan protokol AliBank, statistik buku besar real-time, jalur penyelesaian multi-chain, cadangan aset riil, dan tata kelola."}
                  </p>
                  <div className="pt-2">
                    <NextLink
                      href="/network"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Explore Network Hub →" : "Buka Hub Jaringan →"}
                    </NextLink>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORK INFO" : "INFO JARINGAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/network" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Network Statistics" : "Statistik Jaringan"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/network#governance-section" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Funding & Governance" : "Pendanaan & Tata Kelola"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/network#aip-section" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "AIPs (Improvement Proposals)" : "AIP (Proposal Pembaruan)"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/network" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "ON-CHAIN RAILS" : "JALUR ON-CHAIN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <a
                        href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span>Polygon ALX Token</span>
                        <ExternalLink className="w-3 h-3 text-[#999999]" />
                      </a>
                    </li>
                    <li>
                      <a
                        href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-black flex items-center gap-1.5 transition-colors"
                      >
                        <span>Ethereum Liquidity Vault</span>
                        <ExternalLink className="w-3 h-3 text-[#999999]" />
                      </a>
                    </li>
                    <li>
                      <span className="text-[#888888]">Bitcoin Native SegWit (BIP-84)</span>
                    </li>
                    <li>
                      <NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "Inspect all contracts →" : "Audit seluruh kontrak →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SURVEILLANCE & AML" : "PENGAWASAN & AML"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Zero-Tolerance AML Mandate" : "Mandat Nol Toleransi AML"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Real-Time Discrepancy Engine" : "Mesin Deteksi Saldo Hantu"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Sanctions & Account Freezes" : "Sanksi & Pembekuan Otomatis"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block">
                        {lang === "en" ? "Learn AML Engine →" : "Pelajari Mesin AML →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 4. FEATURES MEGA MENU */}
        {activeMegaMenu === "features" && (
          <>
            <div onClick={() => setActiveMegaMenu(null)} className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]" />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                <div className="space-y-3 pr-4 border-r border-[#ECE7DE]">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "FEATURES" : "FITUR UNGGULAN"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Engineered for mathematical certainty: hybrid instant banking settlement, cryptographic proof of reserves, self-custody Web3 derivation, and real-time AML surveillance."
                      : "Dirancang untuk kepastian matematis: kliring perbankan instan hibrida, bukti cadangan kriptografis (PoR), kustodi mandiri Web3, dan pengawasan AML real-time."}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Currently Viewing Features Hub ✓" : "Sedang di Hub Fitur ✓"}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "BANKING & SETTLEMENT" : "PERBANKAN & KLIRING"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <a href="#instant-transfers" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Instant P2P Transfers (<200ms, 0% Fee)" : "Transfer P2P Instan (<200ms, Bebas Biaya)"}
                      </a>
                    </li>
                    <li>
                      <a href="#dual-currency" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Dual-Currency IDR & Crypto Ledger" : "Buku Besar Ganda IDR & Kripto"}
                      </a>
                    </li>
                    <li>
                      <a href="#qris-pos" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "0% National QRIS & EDC Gateway" : "Gerbang QRIS & EDC 0% Biaya"}
                      </a>
                    </li>
                    <li>
                      <a href="#softpos-nfc" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "SoftPOS Contactless Smartphone NFC" : "SoftPOS Contactless Tap NFC Smartphone"}
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "SOVEREIGNTY & WEB3" : "KEDAULATAN & WEB3"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <a href="#trustwallet-core" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "TrustWallet Core BIP-39/44/84 Derivation" : "Derivasi Kunci BIP-39/44/84 TrustWallet Core"}
                      </a>
                    </li>
                    <li>
                      <a href="#metamask-bridge" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "MetaMask Native Web3 Bridge & Signing" : "Jembatan & Penandatanganan Native MetaMask"}
                      </a>
                    </li>
                    <li>
                      <a href="#yield-vault" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Ethereum 12.00% APY Smart Yield Vault" : "Brankas Hasil Cerdas Ethereum 12,00% APY"}
                      </a>
                    </li>
                    <li>
                      <a href="#polygon-alx" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Polygon Mainnet ALX Settlement Rail" : "Jalur Penyelesaian Token ALX Polygon"}
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & SOLVENCY" : "KEAMANAN & SOLVENSI"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <a href="#proof-of-reserves" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">
                        {lang === "en" ? "1:1 Mathematical Proof of Reserves (PoR)" : "1:1 Bukti Cadangan Matematis (PoR)"}
                      </a>
                    </li>
                    <li>
                      <a href="#double-entry" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Double-Entry Constraint Equation Engine" : "Buku Besar Persamaan Akuntansi Ganda"}
                      </a>
                    </li>
                    <li>
                      <a href="#phantom-detection" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Real-Time Phantom Balance Tamper Freeze" : "Pembekuan Otomatis Saldo Hantu & Anomali"}
                      </a>
                    </li>
                    <li>
                      <a href="#military-vault" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "AES-256 Military Encrypted Biometric Vault" : "Enkripsi Brankas Biometrik Militer AES-256"}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION (Editorial Serif + Guilloche Sunburst Watermark + Live Benchmarks)
          ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-[#ECE7DE]">
        {/* Radial Guilloche Background Graphic */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[540px] h-[540px] md:w-[700px] md:h-[700px] pointer-events-none opacity-[0.07]">
          <svg viewBox="0 0 400 400" className="w-full h-full text-black" fill="none" stroke="currentColor" strokeWidth="0.75">
            <circle cx="200" cy="200" r="190" strokeDasharray="3 3" />
            <circle cx="200" cy="200" r="140" />
            <circle cx="200" cy="200" r="90" strokeDasharray="2 2" />
            <circle cx="200" cy="200" r="40" />
            {FEATURES_GUILLOCHE_RAYS.map((ray, i) => (
              <line key={i} x1={ray.x1} y1={ray.y1} x2={ray.x2} y2={ray.y2} strokeOpacity={ray.opacity} />
            ))}
          </svg>
        </div>

        <div className="max-w-[1280px] mx-auto px-6 relative z-10 space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4F1EA] border border-[#DFDAD0] rounded-sm text-[10px] font-bold tracking-[0.2em] uppercase text-[#666666]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span>
              {lang === "en"
                ? "INSTITUTIONAL FINANCIAL ENGINEERING"
                : "REKAYASA KEUANGAN KELAS INSTITUSI"}
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#111111] leading-[1.08]">
              {lang === "en"
                ? "Engineered for Mathematical Certainty."
                : "Dirancang untuk Kepastian Matematis."}
            </h1>
            <p className="text-base sm:text-xl text-[#555555] font-light leading-relaxed max-w-3xl">
              {lang === "en"
                ? "AliBank eliminates the opacity of fractional-reserve banking by fusing high-throughput hybrid settlement with verifiable on-chain liquidity vaults, multi-chain BIP-39 self-custody, and autonomous real-time double-entry reconciliation."
                : "AliBank menghapus ketidakpastian perbankan cadangan fraksional dengan menyatukan kliring instan hibrida berkecepatan tinggi, bukti cadangan kriptografis on-chain publik, kustodi mandiri BIP-39, dan verifikasi saldo ganda otomatis."}
            </p>
          </div>

          {/* 4 Live Institutional Benchmarks Bar */}
          <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-[#DFDAD0]">
            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "SETTLEMENT LATENCY" : "LATENSI KLIRING"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#111111]">
                &lt; 200 ms
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Sub-second atomic P2P transfers" : "Penyelesaian P2P atomik instan"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "PROOF OF RESERVES" : "BUKTI CADANGAN (POR)"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#10B981]">
                100.00%
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "1:1 verified on Ethereum & Polygon" : "1:1 terverifikasi di blockchain publik"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "TRANSACTION FEES" : "BIAYA TRANSAKSI"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F4B728]">
                0.00%
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Zero gas friction for verified users" : "Bebas biaya transfer P2P & QRIS"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "KEY DERIVATION" : "STANDAR KUSTODI"}
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#111111]">
                BIP-39/44/84
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Compatible with TrustWallet & Ledger" : "Standar mandiri TrustWallet & Ledger"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CATEGORY FILTER TABS & SEARCH
          ========================================================================= */}
      <section className="border-b border-[#ECE7DE] bg-[#FAF9F6] sticky top-20 z-30 py-4 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3.5 py-2 rounded-sm text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-150",
                  activeCategory === cat.id
                    ? "bg-[#111111] text-white shadow-sm"
                    : "bg-white text-[#666666] border border-[#DFDAD0] hover:text-black hover:border-black"
                )}
              >
                {lang === "en" ? cat.labelEn : cat.labelId}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px] sm:min-w-[300px]">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "en"
                  ? "Search features, specs, or contracts..."
                  : "Cari fitur, spesifikasi, atau kontrak..."
              }
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DFDAD0] focus:border-[#111111] rounded-sm text-xs text-[#111111] placeholder:text-[#999999] outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. FEATURE DEEP-DIVE GRID (12 Interactive Modules)
          ========================================================================= */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          {/* Results Counter */}
          <div className="flex items-center justify-between text-xs text-[#777777] font-medium border-b border-[#ECE7DE] pb-4">
            <span>
              {lang === "en"
                ? `Showing ${filteredFeatures.length} of ${features.length} Institutional Features`
                : `Menampilkan ${filteredFeatures.length} dari ${features.length} Fitur Institusional`}
            </span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[#F4B728] hover:underline font-bold"
              >
                {lang === "en" ? "Clear Search ✕" : "Hapus Pencarian ✕"}
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredFeatures.map((item) => {
              const isExpanded = expandedFeatureId === item.id;
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className={cn(
                    "p-6 sm:p-8 rounded-sm transition-all duration-200 border flex flex-col justify-between scroll-mt-28",
                    item.isSpecialStyle === "gold"
                      ? "bg-[#FAF5E6] border-[#E8DAB7] shadow-sm"
                      : item.isSpecialStyle === "dark"
                      ? "bg-[#151216] text-white border-[#38333D] shadow-md"
                      : item.isSpecialStyle === "crimson"
                      ? "bg-[#FFF1F2] border-[#FECDD3] shadow-sm"
                      : "bg-white border-[#DFDAD0] hover:border-[#111111] shadow-sm"
                  )}
                >
                  <div className="space-y-5">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-[2px]",
                            item.isSpecialStyle === "dark"
                              ? "bg-white/10 text-[#F4B728]"
                              : item.isSpecialStyle === "crimson"
                              ? "bg-[#E11D48]/10 text-[#E11D48]"
                              : "bg-[#F4F1EA] text-[#666666]"
                          )}
                        >
                          {lang === "en" ? item.tagEn : item.tagId}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-[2px] font-mono",
                            item.isSpecialStyle === "dark"
                              ? "bg-[#F4B728] text-black"
                              : item.isSpecialStyle === "crimson"
                              ? "bg-[#E11D48] text-white"
                              : "bg-[#111111] text-white"
                          )}
                        >
                          {lang === "en" ? item.badgeEn : item.badgeId}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className={cn(
                        "font-serif text-2xl sm:text-3xl font-bold tracking-tight",
                        item.isSpecialStyle === "dark" ? "text-white" : "text-[#111111]"
                      )}
                    >
                      {lang === "en" ? item.titleEn : item.titleId}
                    </h3>

                    {/* Excerpt */}
                    <p
                      className={cn(
                        "text-sm sm:text-base font-light leading-relaxed",
                        item.isSpecialStyle === "dark" ? "text-[#BBBBBB]" : "text-[#555555]"
                      )}
                    >
                      {lang === "en" ? item.excerptEn : item.excerptId}
                    </p>

                    {/* Technical Specifications Matrix */}
                    <div
                      className={cn(
                        "p-4 rounded-sm border divide-y font-mono text-xs",
                        item.isSpecialStyle === "dark"
                          ? "bg-black/30 border-white/10 divide-white/10 text-white"
                          : "bg-[#FBF9F5] border-[#E8E4DC] divide-[#EAE6DE] text-[#222222]"
                      )}
                    >
                      {item.specs.map((spec, i) => (
                        <div key={i} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <span className={item.isSpecialStyle === "dark" ? "text-[#888888]" : "text-[#777777]"}>
                            {lang === "en" ? spec.labelEn : spec.labelId}
                          </span>
                          <span className="font-semibold text-right truncate max-w-[240px]">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Expandable Architectural Deep Dive */}
                    {isExpanded && (
                      <div
                        className={cn(
                          "pt-4 space-y-3 text-xs sm:text-sm font-light leading-relaxed animate-in fade-in duration-200 border-t",
                          item.isSpecialStyle === "dark"
                            ? "border-white/10 text-[#CCCCCC]"
                            : "border-[#ECE7DE] text-[#444444]"
                        )}
                      >
                        <h4
                          className={cn(
                            "text-xs font-bold uppercase tracking-widest",
                            item.isSpecialStyle === "dark" ? "text-[#F4B728]" : "text-[#111111]"
                          )}
                        >
                          {lang === "en" ? "ARCHITECTURAL OVERVIEW" : "TINJAUAN ARSITEKTUR"}
                        </h4>
                        {(lang === "en" ? item.contentEn : item.contentId).map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div
                    className={cn(
                      "pt-6 mt-6 border-t flex flex-wrap items-center justify-between gap-4",
                      item.isSpecialStyle === "dark" ? "border-white/10" : "border-[#ECE7DE]"
                    )}
                  >
                    <button
                      onClick={() => setExpandedFeatureId(isExpanded ? null : item.id)}
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-1.5",
                        item.isSpecialStyle === "dark"
                          ? "text-[#F4B728] hover:text-white"
                          : item.isSpecialStyle === "crimson"
                          ? "text-[#E11D48] hover:text-black"
                          : "text-[#111111] hover:text-[#F4B728]"
                      )}
                    >
                      <span>
                        {isExpanded
                          ? lang === "en"
                            ? "Collapse Details ▲"
                            : "Sembunyikan Rincian ▲"
                          : lang === "en"
                          ? "Expand Architecture Specs ▼"
                          : "Buka Spesifikasi Arsitektur ▼"}
                      </span>
                    </button>

                    {item.actionLink && (
                      item.actionLink.isExternal ? (
                        <a
                          href={item.actionLink.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "text-xs font-bold tracking-wider inline-flex items-center gap-1.5 transition-colors underline underline-offset-4",
                            item.isSpecialStyle === "dark" ? "text-white hover:text-[#F4B728]" : "text-black hover:text-[#F4B728]"
                          )}
                        >
                          <span>{lang === "en" ? item.actionLink.labelEn : item.actionLink.labelId}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <NextLink
                          href={item.actionLink.href}
                          className={cn(
                            "text-xs font-bold tracking-wider inline-flex items-center gap-1.5 transition-colors underline underline-offset-4",
                            item.isSpecialStyle === "dark" ? "text-white hover:text-[#F4B728]" : "text-black hover:text-[#F4B728]"
                          )}
                        >
                          <span>{lang === "en" ? item.actionLink.labelEn : item.actionLink.labelId}</span>
                        </NextLink>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. MATHEMATICAL INVARIANT & DUAL-LEDGER FLOWCHART
          ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#151216] text-white border-y border-[#38333D]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#F4B728] uppercase">
              {lang === "en" ? "CRYPTOGRAPHIC CERTAINTY" : "KEPASTIAN KRIPTOGRAFIS"}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {lang === "en"
                ? "The Dual-Ledger Solvency Invariant"
                : "Persamaan Solvensi Dua Buku Besar"}
            </h2>
            <p className="text-base text-[#AAAAAA] font-light leading-relaxed">
              {lang === "en"
                ? "Unlike centralized banks that run unbacked fractional reserves, AliBank ties high-speed internal transactions directly to publicly auditable smart contract vaults."
                : "Tidak seperti bank konvensional yang menyembunyikan defisit, AliBank menghubungkan transaksi super cepat langsung ke brankas kontrak pintar yang diaudit publik secara waktu nyata."}
            </p>
          </div>

          {/* 3-Tier Architecture Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-sm bg-[#F4B728] text-black font-bold flex items-center justify-center font-mono text-lg">
                1
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                {lang === "en" ? "Sub-200ms Execution Layer" : "Lapisan Eksekusi <200ms"}
              </h3>
              <p className="text-xs text-[#AAAAAA] leading-relaxed font-light">
                {lang === "en"
                  ? "Parallel in-memory double-entry accounting processes retail transfers, QRIS payments, and SoftPOS tap-to-pay with zero gas cost and instant finality."
                  : "Akuntansi ganda memproses transfer harian, kasir QRIS, dan SoftPOS tanpa gas fee dengan finalitas seketika."}
              </p>
              <div className="pt-2 font-mono text-[11px] text-[#F4B728]">
                &gt; ACID Parallel Batching
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-sm bg-[#10B981] text-black font-bold flex items-center justify-center font-mono text-lg">
                2
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                {lang === "en" ? "Real-Time PoR Daemon" : "Daemon Rekonsiliasi PoR"}
              </h3>
              <p className="text-xs text-[#AAAAAA] leading-relaxed font-light">
                {lang === "en"
                  ? "Continuous surveillance service verifies that internal depository liabilities never exceed physical assets in our on-chain reserve contracts."
                  : "Layanan pengawas otonom memverifikasi bahwa total saldo nasabah tidak pernah melebihi cadangan fisik di blockchain."}
              </p>
              <div className="pt-2 font-mono text-[11px] text-[#10B981]">
                &gt; Sum(Reserves) &gt;= Liabilities
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-sm space-y-4 relative">
              <div className="w-10 h-10 rounded-sm bg-white text-black font-bold flex items-center justify-center font-mono text-lg">
                3
              </div>
              <h3 className="font-serif text-xl font-bold text-white">
                {lang === "en" ? "Public Blockchain Proof" : "Pembuktian Blockchain Publik"}
              </h3>
              <p className="text-xs text-[#AAAAAA] leading-relaxed font-light">
                {lang === "en"
                  ? "Polygon Mainnet (ALX utility asset) and Ethereum Mainnet (Central Liquidity Vault) serve as the decentralized court of final appeal."
                  : "Kontrak Polygon ALX dan Brankas Ethereum menjadi dasar pembuktian desentralisasi yang tidak dapat dipalsukan."}
              </p>
              <div className="pt-2 font-mono text-[11px] text-white">
                &gt; Public Explorer Auditable
              </div>
            </div>
          </div>

          {/* Mathematical Invariant Box */}
          <div className="p-6 sm:p-8 bg-black/40 border border-[#F4B728]/30 rounded-sm max-w-3xl mx-auto text-center space-y-3 font-mono">
            <span className="text-[10px] tracking-[0.2em] uppercase text-[#F4B728] font-bold">
              {lang === "en" ? "MANDATORY DOUBLE-ENTRY LEDGER FORMULA" : "FORMULA WAJIB BUKU BESAR GANDA"}
            </span>
            <p className="text-lg sm:text-2xl font-bold text-white tracking-wide">
              ΔAssets - ΔLiabilities - ΔEquity ≡ 0.00000000
            </p>
            <p className="text-xs text-[#888888] font-sans font-light">
              {lang === "en"
                ? "Every transaction requires symmetrical debit and credit balancing. Any batch deviating from zero by a single satoshi triggers an immediate kernel-level panic freeze."
                : "Setiap transaksi wajib memiliki keseimbangan debet dan kredit simetris. Ketidakseimbangan sekecil apa pun memicu pembatalan otomatis di tingkat kernel database."}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. INSTITUTIONAL COMPARISON MATRIX
          ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#FAF9F6]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#777777] uppercase">
              {lang === "en" ? "BENCHMARK COMPARISON" : "PERBANDINGAN TOLOK UKUR"}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#111111]">
              {lang === "en"
                ? "AliBank vs. Legacy Banks & CEXs"
                : "AliBank vs. Bank Konvensional & CEX"}
            </h2>
            <p className="text-base text-[#666666] font-light leading-relaxed">
              {lang === "en"
                ? "See how our hybrid architecture combines the speed of private banking with the mathematical solvency and transparency of decentralized ledgers."
                : "Pelajari bagaimana arsitektur hibrida kami menggabungkan kecepatan perbankan privat dengan kepastian matematis dan transparansi blockchain."}
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto border border-[#DFDAD0] bg-white rounded-sm shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#DFDAD0] bg-[#F4F1EA]">
                  <th className="p-4 sm:p-5 font-bold tracking-wider text-[#333333] uppercase w-1/4">
                    {lang === "en" ? "Evaluation Metric" : "Metrik Evaluasi"}
                  </th>
                  <th className="p-4 sm:p-5 font-bold tracking-wider text-black uppercase w-1/3 bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F4B728]" />
                      <span>AliBank v3.1</span>
                    </div>
                  </th>
                  <th className="p-4 sm:p-5 font-bold tracking-wider text-[#666666] uppercase w-1/5">
                    {lang === "en" ? "Traditional Banks" : "Bank Konvensional"}
                  </th>
                  <th className="p-4 sm:p-5 font-bold tracking-wider text-[#666666] uppercase w-1/5">
                    {lang === "en" ? "Centralized Crypto Exchanges (CEX)" : "Bursa Kripto Sentral (CEX)"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7DE]">
                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Reserve Model" : "Model Cadangan"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#10B981] bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    100% Full Reserve (On-Chain Audited)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Fractional Reserve (&lt;10% liquid)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Commingled & Opaque / Merkle snapshots
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Internal Settlement Speed" : "Kecepatan Kliring"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#111111] bg-[#FAF5E6] border-x border-[#E8DAB7] font-mono">
                    &lt; 200 ms (24/7/365)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    1-3 Business Days (Limited Hours)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    5 - 30 Minutes (Manual batch queues)
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "P2P Transfer Costs" : "Biaya Transfer P2P"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#10B981] bg-[#FAF5E6] border-x border-[#E8DAB7] font-mono">
                    0.00% (Sponsored Gas)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Rp 2.500 - Rp 6.500 / High Wire Fees
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Internal 0%, High on-chain withdrawal gas
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Key Ownership & Sovereignty" : "Kepemilikan Kunci Kripto"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#111111] bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    Self-Custodial BIP-39/44/84 Compatible
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    No Crypto / Bank owns customer account
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    &quot;Not your keys, not your coins&quot;
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Audit Transparency" : "Transparansi Audit"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#111111] bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    Public Blockchain Explorers 24/7
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Annual Private Audits (Closed Books)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Self-attested snapshots / Third-party reports
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Merchant Payment Gateway" : "Fasilitas Kasir Merchant"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#10B981] bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    0% National QRIS + SoftPOS NFC
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    0.7% - 1.5% MDR + EDC Rental Fees
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Complex merchant APIs, no national QRIS
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-bold text-[#111111]">
                    {lang === "en" ? "Tamper & Anomaly Defense" : "Ketahanan Anomali Saldo"}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-[#E11D48] bg-[#FAF5E6] border-x border-[#E8DAB7]">
                    Autonomous Freeze &lt;50ms (Zero Tolerance)
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Manual end-of-month reconciliations
                  </td>
                  <td className="p-4 sm:p-5 text-[#666666]">
                    Vulnerable to synthetic database drift
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. VERIFIED SMART CONTRACTS AUDIT
          ========================================================================= */}
      <section className="py-16 md:py-20 bg-[#F4F1EA] border-t border-[#DFDAD0]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#777777]">
                {lang === "en" ? "IMMUTABLE SOURCE CODE" : "KODE SUMBER TERVERIFIKASI"}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                {lang === "en" ? "Verified On-Chain Smart Contracts" : "Smart Contract On-Chain Resmi"}
              </h3>
            </div>
            <span className="text-xs text-[#666666] font-light">
              {lang === "en"
                ? "Audit deployed bytecodes and live balances on public blockchain explorers."
                : "Audit bytecode resmi dan saldo cadangan di penjelajah blockchain publik."}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Polygon ALX */}
            <div className="p-6 bg-white border border-[#DFDAD0] rounded-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777]">
                  POLYGON POS MAINNET
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#10B981]/10 text-[#10B981]">
                  ALX UTILITY TOKEN
                </span>
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#111111] break-all select-all font-semibold p-3 bg-[#FAF9F6] border border-[#ECE7DE] rounded-sm">
                {ALX_POLYGON_CONTRACT}
              </p>
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => handleCopy(ALX_POLYGON_CONTRACT, "alx")}
                  className="font-bold text-[#111111] hover:text-[#F4B728] transition-colors inline-flex items-center gap-1.5"
                >
                  {copiedContract === "alx" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract === "alx" ? (lang === "en" ? "Copied!" : "Disalin!") : (lang === "en" ? "Copy Contract" : "Salin Kontrak")}</span>
                </button>
                <a
                  href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#111111] hover:text-[#F4B728] transition-colors inline-flex items-center gap-1"
                >
                  <span>Polygonscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Ethereum Vault */}
            <div className="p-6 bg-white border border-[#DFDAD0] rounded-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777]">
                  ETHEREUM MAINNET
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-[2px] bg-[#3B82F6]/10 text-[#3B82F6]">
                  CENTRAL LIQUIDITY VAULT
                </span>
              </div>
              <p className="font-mono text-xs sm:text-sm text-[#111111] break-all select-all font-semibold p-3 bg-[#FAF9F6] border border-[#ECE7DE] rounded-sm">
                {ETH_VAULT_CONTRACT}
              </p>
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => handleCopy(ETH_VAULT_CONTRACT, "eth")}
                  className="font-bold text-[#111111] hover:text-[#F4B728] transition-colors inline-flex items-center gap-1.5"
                >
                  {copiedContract === "eth" ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract === "eth" ? (lang === "en" ? "Copied!" : "Disalin!") : (lang === "en" ? "Copy Contract" : "Salin Kontrak")}</span>
                </button>
                <a
                  href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#111111] hover:text-[#F4B728] transition-colors inline-flex items-center gap-1"
                >
                  <span>Etherscan</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. INSTITUTIONAL CALL TO ACTION
          ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#111111] text-white text-center">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <span className="text-[10px] font-bold tracking-[0.25em] text-[#F4B728] uppercase">
            {lang === "en" ? "OPEN ARCHITECTURE" : "ARSITEKTUR TERBUKA"}
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white max-w-2xl mx-auto">
            {lang === "en"
              ? "Ready to Experience Institutional Financial Sovereignty?"
              : "Siap Merasakan Kedaulatan Finansial Kelas Institusi?"}
          </h2>
          <p className="text-base text-[#AAAAAA] font-light max-w-xl mx-auto leading-relaxed">
            {lang === "en"
              ? "Activate an instant private banking account, connect your hardware or Web3 wallet, and send fee-free transfers with mathematical certainty."
              : "Buka rekening perbankan privat instan, hubungkan dompet Web3 Anda, dan nikmati transaksi bebas biaya dengan kepastian matematis."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <NextLink
              href="/use-alibank"
              className="px-8 py-4 bg-[#F4B728] hover:bg-[#e2a820] text-black text-xs font-bold uppercase tracking-[0.16em] rounded-sm transition-all shadow-md inline-flex items-center gap-2"
            >
              <span>{lang === "en" ? "Open Sovereign Account" : "Buka Rekening Berdaulat"}</span>
              <ArrowRight className="w-4 h-4" />
            </NextLink>
            <NextLink
              href="/learn"
              className="px-8 py-4 bg-transparent border border-white/20 hover:border-white text-white text-xs font-bold uppercase tracking-[0.16em] rounded-sm transition-all"
            >
              {lang === "en" ? "Read Documentation" : "Baca Dokumentasi"}
            </NextLink>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. ZCASH-STYLE INSTITUTIONAL FOOTER
          ========================================================================= */}
      <footer className="bg-[#0A0D10] text-[#888888] py-16 border-t border-[#1F2630]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Col 1: Brand */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-base">
                  A
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight text-white">
                  AliBank
                </span>
              </div>
              <p className="text-xs text-[#777777] font-light leading-relaxed max-w-sm">
                {lang === "en"
                  ? "AliBank is sovereign electronic banking. Engineered for mathematical certainty with 1:1 on-chain reserve backing and sub-200ms settlement."
                  : "AliBank adalah perbankan elektronik yang berdaulat. Dirancang untuk kepastian matematis dengan cadangan 1:1 on-chain dan penyelesaian sub-200ms."}
              </p>
            </div>

            {/* Col 2: Learn */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white">
                {lang === "en" ? "LEARN" : "PELAJARI"}
              </h4>
              <ul className="space-y-2 text-xs text-[#AAAAAA]">
                <li><NextLink href="/learn?category=101" className="hover:text-white transition-colors">AliBank 101</NextLink></li>
                <li><NextLink href="/learn?category=aml" className="hover:text-white transition-colors">AML Policy</NextLink></li>
                <li><NextLink href="/learn?category=por" className="hover:text-white transition-colors">Proof of Reserves</NextLink></li>
                <li><NextLink href="/learn?category=architecture" className="hover:text-white transition-colors">Architecture</NextLink></li>
              </ul>
            </div>

            {/* Col 3: Ecosystem */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white">
                {lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}
              </h4>
              <ul className="space-y-2 text-xs text-[#AAAAAA]">
                <li><NextLink href="/ecosystem?category=wallets" className="hover:text-white transition-colors">TrustWallet Core</NextLink></li>
                <li><NextLink href="/ecosystem?category=wallets" className="hover:text-white transition-colors">MetaMask Bridge</NextLink></li>
                <li><NextLink href="/ecosystem?category=networks" className="hover:text-white transition-colors">Polygon ALX Rail</NextLink></li>
                <li><NextLink href="/ecosystem?category=merchant" className="hover:text-white transition-colors">Merchant POS</NextLink></li>
              </ul>
            </div>

            {/* Col 4: Network */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white">
                {lang === "en" ? "NETWORK" : "JARINGAN"}
              </h4>
              <ul className="space-y-2 text-xs text-[#AAAAAA]">
                <li><NextLink href="/network" className="hover:text-white transition-colors">Network Statistics</NextLink></li>
                <li><NextLink href="/network#governance-section" className="hover:text-white transition-colors">Governance</NextLink></li>
                <li><NextLink href="/network#aip-section" className="hover:text-white transition-colors">AIP Proposals</NextLink></li>
                <li><NextLink href="/features" className="hover:text-white transition-colors">All Features</NextLink></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1C232D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
            <p>&copy; {new Date().getFullYear()} AliBank Financial Network. All rights reserved.</p>
            <button
              onClick={() => setLang(lang === "en" ? "id" : "en")}
              className="text-[11px] font-bold uppercase tracking-wider text-[#AAAAAA] hover:text-white transition-colors"
            >
              {lang === "en" ? "Bahasa Indonesia 🇮🇩" : "English 🌐"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function FeaturesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-xl animate-pulse">
            A
          </div>
        </div>
      }
    >
      <FeaturesContent />
    </Suspense>
  );
}
