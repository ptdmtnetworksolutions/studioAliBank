"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  ChevronDown,
  X,
  Search,
  ArrowRight,
  Lock,
  Scale,
  AlertTriangle,
  FileCheck2,
  Database,
  Coins
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Article {
  id: string;
  category: "all" | "aml" | "101" | "por" | "policy" | "wallet" | "merchant" | "architecture";
  tag: string;
  title: string;
  excerpt: string;
  content: string;
  isSpecialStyle?: "yellow" | "dark" | "normal";
}

function FormattedArticleContent({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}-${Date.now()}`} className="space-y-3 my-4 pl-1">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  const renderInline = (lineText: string) => {
    // Regex matches **bold text** and `code text`
    const parts = lineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[#111111]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 bg-[#EAE6DF] font-mono text-xs rounded-sm text-[#111111] break-all border border-[#DFDAD0]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Heading ###
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4
          key={`h4-${i}`}
          className="font-serif text-lg sm:text-xl font-bold text-[#111111] mt-6 mb-3 border-b border-[#E8E4DC] pb-2"
        >
          {renderInline(line.replace("### ", ""))}
        </h4>
      );
      continue;
    }

    // Heading ##
    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-serif text-xl sm:text-2xl font-bold text-[#111111] mt-7 mb-3 border-b border-[#DFDAD0] pb-2.5"
        >
          {renderInline(line.replace("## ", ""))}
        </h3>
      );
      continue;
    }

    // Math block ($$ ... $$)
    if (line.startsWith("$$") && line.endsWith("$$")) {
      flushList();
      const formula = line.slice(2, -2).trim();
      elements.push(
        <div
          key={`math-${i}`}
          className="my-5 p-4 bg-[#F5F2EA] border border-[#DFDAD0] rounded-sm text-center font-mono text-xs sm:text-sm text-[#111111] shadow-inner"
        >
          {formula}
        </div>
      );
      continue;
    }

    // Bullet point list item (- or *)
    if (line.startsWith("- ") || line.startsWith("* ")) {
      const itemText = line.slice(2);
      currentList.push(
        <li
          key={`li-${i}`}
          className="flex items-start gap-3 text-sm text-[#333333] font-light leading-relaxed"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F4B728] mt-2 shrink-0" />
          <span className="flex-1">{renderInline(itemText)}</span>
        </li>
      );
      continue;
    }

    // Numbered list item (e.g. "1. ")
    if (/^\d+\.\s/.test(line)) {
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        flushList();
        elements.push(
          <div
            key={`num-${i}`}
            className="flex items-start gap-3.5 my-3 text-sm text-[#333333] font-light leading-relaxed"
          >
            <span className="w-6 h-6 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {numMatch[1]}
            </span>
            <div className="flex-1 pt-0.5">{renderInline(numMatch[2])}</div>
          </div>
        );
        continue;
      }
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p
        key={`p-${i}`}
        className="text-sm sm:text-base text-[#444444] font-light leading-relaxed my-3"
      >
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-1 text-left">{elements}</div>;
}

function LearnContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as any) || "all";
  
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | "faq" | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

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
      { id: "all", labelEn: "ALL", labelId: "SEMUA" },
      { id: "aml", labelEn: "SECURITY & AML", labelId: "KEAMANAN & AML" },
      { id: "101", labelEn: "ALIBANK 101", labelId: "ALIBANK 101" },
      { id: "architecture", labelEn: "ARCHITECTURE", labelId: "ARSITEKTUR" },
      { id: "por", labelEn: "PROOF OF RESERVES", labelId: "BUKTI CADANGAN" },
      { id: "policy", labelEn: "MONETARY POLICY", labelId: "KEBIJAKAN MONETER" },
      { id: "wallet", labelEn: "USING & WALLETS", labelId: "DOMPET & PENGGUNAAN" },
      { id: "merchant", labelEn: "MERCHANT POS", labelId: "KASIR MERCHANT" },
    ],
    []
  );

  const articles: Article[] = useMemo(
    () => [
      // 1. AML Core
      {
        id: "aml-mandate",
        category: "aml",
        tag: "COMPLIANCE, AML SURVEILLANCE",
        title:
          lang === "en"
            ? "ALIBANK ZERO-TOLERANCE ANTI-MONEY LAUNDERING (AML) MANDATE"
            : "MANDAT ANTI-PENCUCIAN UANG (AML) NOL TOLERANSI ALIBANK",
        excerpt:
          lang === "en"
            ? "AliBank enforces severe, non-negotiable protocols against money laundering, terrorist financing, and illicit capital cycling. Explore how our massive system upgrade detects anomalies in real time."
            : "AliBank memberlakukan protokol tanpa kompromi terhadap pencucian uang dan perputaran modal terlarang. Pelajari pembaruan sistem masif kami dalam mendeteksi anomali secara waktu nyata.",
        content:
          lang === "en"
            ? `AliBank is an institutional-grade hybrid financial network engineered on mathematics and cryptographic certainty. We categorically reject and actively purge any attempt by individuals, criminal syndicates, or unauthorized actors to exploit our infrastructure as a Money Laundering platform or fraudulent cycling vehicle.

### 1. The Massive System Security & AML Upgrade
To combat sophisticated financial crime and illegitimate fund layering, AliBank has deployed an unyielding, autonomous surveillance and reconciliation engine operating at the core of our ledger. Every single incoming and outgoing balance movement is continuously reconciled against:
- Physical on-chain liquidity vaults on Ethereum (0x56268032A3B3E64CFeF1916d591087CF8dF40945).
- Audited ERC-20 smart contracts on Polygon Mainnet (0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd).
- Bank gateway deposit confirmations and cryptographically signed settlement vouchers.

### 2. Immediate Automated Sanctions Against Indicated Offenders
When our anti-fraud algorithms detect suspicious transaction patterns—such as rapid smurfing, unbacked phantom balance injections, structured layering, or balance discrepancies—the platform executes decisive automated countermeasures:
- **Instant Account Freezing:** Withdrawal capabilities and P2P transfers are locked immediately without prior notification to prevent asset flight.
- **Full Asset Quarantine:** The flagged funds are isolated in a restricted ledger compartment pending strict forensic compliance verification.
- **Phantom Balance Confiscation:** If funds were generated artificially without verifiable bank or on-chain backing, our admin ledger executes immediate unilateral confiscation to protect the 1:1 solvency of legitimate depositors.
- **Legal Reporting:** Formal audit dossiers, wallet provenance graphs, and digital identity logs are submitted directly to relevant international and local law enforcement agencies.

### 3. Absolute Protection for Honest Depositors
Our aggressive stance against financial crime exists to guarantee that legitimate users, merchants, and sovereign savers enjoy absolute solvency, zero fractional-reserve risk, and total peace of mind.`
            : `AliBank adalah jaringan keuangan hibrida kelas institusi yang beroperasi atas dasar kepastian matematis dan kriptografi terbuka. Kami secara tegas menolak dan secara masif menindak segala upaya pihak-pihak yang mencoba memanfaatkan AliBank sebagai wadah Pencucian Uang (Money Laundering) atau perputaran dana gelap.

### 1. Pembaruan Sistem Masif & Pengawasan AML Real-Time
Untuk mencegah kejahatan keuangan dan rekayasa transaksi palsu, AliBank telah meluncurkan pembaruan sistem keamanan berskala besar yang bekerja secara otonom di inti buku besar (ledger):
- Rekonsiliasi otomatis 24/7 terhadap brankas on-chain Ethereum (0x56268032A3B3E64CFeF1916d591087CF8dF40945).
- Audit langsung terhadap kontrak pintar token ALX di Polygon (0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd).
- Pencocokan mutasi debet/kredit terhadap bukti transfer bank dan gateway resmi.

### 2. Tindakan Tegas & Masif Terhadap Pelaku Terindikasi
Apabila sistem mendeteksi kejanggalan transaksi (seperti upaya injeksi saldo hantu, perputaran dana berulang tanpa dasar riil, atau selisih saldo vs bukti setoran), sistem langsung mengeksekusi sanksi otomatis:
- **Pembekuan Akun Seketika:** Akses penarikan dana dan transfer P2P langsung dikunci untuk mengamankan likuiditas.
- **Karantina Aset:** Dana yang terindikasi anomali dipisahkan dari sirkulasi publik hingga audit forensik selesai.
- **Penyitaan Saldo Tanpa Cadangan (Unbacked):** Saldo yang terbukti tidak memiliki cadangan riil akan disita dan dinolkan oleh admin demi menjaga rasio cadangan 100% milik nasabah sah.
- **Pemberkasan Hukum:** Jejak audit digital dan identitas pelaku didokumentasikan untuk diteruskan ke pihak berwenang sesuai hukum yang berlaku.

### 3. Kepastian Keamanan Bagi Nasabah Sah
Tindakan tegas ini merupakan komitmen AliBank agar nasabah sah dan mitra bisnis dapat bertransaksi dengan aman, tanpa risiko terseret masalah hukum atau kerugian akibat skema ilegal.`,
      },

      // 2. Anomaly Engine
      {
        id: "phantom-engine",
        category: "aml",
        tag: "ENGINEERING, ANTI-FRAUD",
        title:
          lang === "en"
            ? "HOW THE PHANTOM ALERT & RECONCILIATION ENGINE OPERATES"
            : "CARA KERJA MESIN REKONSILIASI & PENDETEKSI SALDO HANTU",
        excerpt:
          lang === "en"
            ? "Deep dive into our mathematical anomaly engine that compares database liabilities against real on-chain vault reserves to identify spoofed balances."
            : "Penjelasan mendalam tentang bagaimana sistem secara matematis membandingkan total saldo nasabah dengan saldo brankas riil untuk mendeteksi rekayasa saldo.",
        content:
          lang === "en"
            ? `The AliBank Autonomous Reconciliation Engine operates on a simple, unbreakable mathematical equation:

$$\\sum \\text{User Ledger Balances} \\le \\text{Physical On-Chain Vault} + \\text{Verified Bank Cash Reserves}$$

If at any split-second this equation breaks (for example, if a rogue database entry attempts to credit 1,000,000 USDT without a corresponding deposit voucher), the Reconciliation Engine triggers a **Discrepancy / Phantom Alert**.

The account is immediately flagged in the Super Admin terminal, and the automated liquidity guard prevents fractional reserve withdrawals. Every single rupiah and token in AliBank must have a verifiable parent transaction in the immutable ledger.`
            : `Mesin Rekonsiliasi AliBank beroperasi dengan rumus matematika mutlak yang tidak dapat direkayasa:

$$\\sum \\text{Total Saldo Nasabah} \\le \\text{Saldo Brankas On-Chain} + \\text{Kas Bank Terverifikasi}$$

Jika rumus ini tidak seimbang barang 1 sen pun (misalnya ada akun yang tiba-tiba memiliki saldo besar tanpa riwayat transfer bank/kripto yang sah), sistem seketika membunyikan **Phantom Alert (Peringatan Saldo Hantu)**.

Akun tersebut langsung masuk daftar karantina di dasbor admin, dan penarikan diblokir otomatis. Setiap rupiah dan koin di AliBank wajib memiliki jejak asal-usul (provenance) yang sah.`,
      },

      // 3. Special Yellow Card: Proof of Reserves
      {
        id: "por-card",
        category: "por",
        tag: "VERIFICATION, SOLVENCY",
        title:
          lang === "en"
            ? "VERIFIED ON-CHAIN PROOF OF RESERVES (100% SOLVENCY)"
            : "BUKTI CADANGAN ON-CHAIN TERVERIFIKASI (100% SOLVEN)",
        excerpt:
          lang === "en"
            ? "Zero fractional reserve lending. Direct, open access to audit AliBank's Ethereum cold vault and Polygon ALX contract on public explorers."
            : "Nol fractional-reserve. Akses terbuka untuk mengaudit brankas Ethereum dan token Polygon AliBank di blockchain publik.",
        isSpecialStyle: "yellow",
        content:
          lang === "en"
            ? `Traditional commercial banks operate on Fractional Reserve Banking: they lend out up to 90% of your deposited money to third parties, keeping only 10% in their vault. When a crisis hits, bank runs happen and depositors are left waiting.

AliBank completely abolishes fractional reserve banking. We maintain a strict **1:1 reserve ratio** at all times:
- Every ALX token exists on Polygon Mainnet: Contract \`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`
- Central cold liquidity is stored on Ethereum Mainnet: Address \`0x56268032A3B3E64CFeF1916d591087CF8dF40945\`

Anyone in the world can open Etherscan or Polygonscan and verify our solvency without requiring permissions or signing non-disclosure agreements.`
            : `Bank tradisional menggunakan sistem Fractional Reserve Banking: mereka meminjamkan hingga 90% uang nasabah ke pihak lain, dan hanya menyisakan sedikit kas di brankas. Saat krisis likuiditas terjadi, nasabah tidak bisa menarik uangnya secara bersamaan.

AliBank menghapus sistem fractional-reserve tersebut. Kami menerapkan rasio cadangan **1:1 setiap saat**:
- Setiap koin ALX tercatat di Polygon Mainnet: Kontrak \`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`
- Brankas likuiditas dingin tercatat di Ethereum Mainnet: Alamat \`0x56268032A3B3E64CFeF1916d591087CF8dF40945\`

Siapapun di seluruh dunia dapat membuka Etherscan atau Polygonscan untuk mengaudit solvensi kami secara independen tanpa perlu meminta izin.`,
      },

      // 4. AliBank 101: What is AliBank
      {
        id: "alibank-101",
        category: "101",
        tag: "BASICS, INTRODUCTION",
        title:
          lang === "en"
            ? "WHAT IS ALIBANK AND HOW IS IT DIFFERENT FROM TRADITIONAL BANKS?"
            : "APA ITU ALIBANK DAN APA BEDANYA DENGAN BANK TRADISIONAL?",
        excerpt:
          lang === "en"
            ? "Understand the hybrid architecture combining high-speed neo-banking convenience with decentralized blockchain security."
            : "Pahami arsitektur hibrida yang menyatukan kenyamanan bank digital dengan keamanan blockchain terdesentralisasi.",
        content:
          lang === "en"
            ? `AliBank is a next-generation hybrid neo-banking platform. It gives you the best of two worlds:

1. **High-Speed Neo-Banking Rails:** Instant account creation, sub-second peer-to-peer transfers, zero internal fees, and intuitive merchant POS checkouts.
2. **Decentralized Multi-Chain Sovereignty:** Full compatibility with self-custodial Web3 wallets (MetaMask, TrustWallet) using BIP-39 and BIP-44 key standards.

Unlike traditional banks that restrict cross-border transfers and impose predatory fees, AliBank operates 24/7/365 across fiat and cryptocurrency seamlessly.`
            : `AliBank adalah platform neobank hibrida generasi baru yang menggabungkan dua keunggulan utama:

1. **Kecepatan Bank Digital Modern:** Pembuatan rekening instan, transfer P2P kurang dari 1 detik, bebas biaya transfer internal, dan sistem kasir POS merchant yang praktis.
2. **Kedaulatan Kriptografi Multi-Chain:** Kompatibel penuh dengan dompet Web3 non-kustodial (MetaMask, TrustWallet) menggunakan standar internasional BIP-39 dan BIP-44.

Berbeda dari bank konvensional yang membatasi transaksi luar negeri dan membebankan biaya tinggi, AliBank beroperasi 24 jam sehari, 7 hari seminggu tanpa henti.`,
      },

      // 5. Special Dark Card: Double-Entry Ledger
      {
        id: "double-entry",
        category: "architecture",
        tag: "ARCHITECTURE, SECURITY",
        title:
          lang === "en"
            ? "DOUBLE-ENTRY LEDGER: MATHEMATICAL INTEGRITY IN CODE"
            : "BUKU BESAR GANDA: INTEGRITAS MATEMATIKA DALAM KODE",
        excerpt:
          lang === "en"
            ? "How strict cryptographic double-entry accounting prevents balance tampering, unauthorized credit, and transaction race conditions."
            : "Bagaimana pembukuan berpasangan mencegah manipulasi saldo, kredit ilegal, dan race condition pada transaksi.",
        isSpecialStyle: "dark",
        content:
          lang === "en"
            ? `In financial computer science, single-entry balance fields (such as simply doing \`user.balance += amount\`) are fundamentally flawed and vulnerable to race conditions and injection attacks.

AliBank uses an immutable **Double-Entry Ledger Architecture**:
- Every transaction consists of equal debit and credit journal entries.
- Saldo amounts are computed dynamically from cryptographically sealed ledger entries.
- If an attacker tries to alter a single database field, the ledger verification checksum fails immediately, and the transaction is aborted.

This mathematical rigor ensures that no money can be created out of thin air.`
            : `Dalam ilmu komputer perbankan, sistem pembukuan tunggal (seperti sekadar mengubah \`user.balance += nominal\`) sangat rawan terhadap manipulasi dan serangan injeksi.

AliBank menggunakan **Arsitektur Buku Besar Berpasangan (Double-Entry Ledger)** yang tidak dapat diubah:
- Setiap transaksi selalu memiliki jurnal debet dan kredit yang seimbang.
- Saldo akun dihitung secara dinamis dari catatan mutasi yang disegel kriptografi.
- Jika ada upaya memanipulasi kolom database, checksum audit seketika gagal dan transaksi dibatalkan otomatis.

Kepastian matematis ini menjamin tidak ada uang yang bisa dicetak dari ketiadaan.`,
      },

      // 6. Wallets & TrustWallet Core
      {
        id: "wallet-standards",
        category: "wallet",
        tag: "TUTORIALS, BIP STANDARDS",
        title:
          lang === "en"
            ? "CRYPTOGRAPHIC KEY DERIVATION: BIP-39 & BIP-44 COMPLIANCE"
            : "PENURUNAN KUNCI KRIPTOGRAFI: STANDAR BIP-39 & BIP-44",
        excerpt:
          lang === "en"
            ? "Learn how AliBank wallet addresses are mathematically derived to match TrustWallet Core and MetaMask standards."
            : "Pelajari bagaimana alamat dompet AliBank diturunkan secara matematis sesuai standar TrustWallet Core dan MetaMask.",
        content:
          lang === "en"
            ? `AliBank does not invent proprietary, insecure encryption schemes. We adopt the battle-tested cryptographic standards powering Bitcoin and Ethereum:

- **BIP-39:** Mnemonic seed phrase generation converting 128/256-bit entropy into human-readable words.
- **BIP-44:** Multi-account hierarchy path (\`m/44'/60'/0'/0/0\` for Polygon/Ethereum and \`m/84'/0'/0'/0/0\` for Bitcoin Native SegWit \`bc1q...\`).

This means the wallet address you hold inside AliBank is fully authentic, portable, and mathematically compliant with TrustWallet, MetaMask, and Ledger hardware devices.`
            : `AliBank tidak membuat enkripsi sendiri yang belum teruji. Kami mengadopsi standar kriptografi terbuka yang digunakan oleh Bitcoin dan Ethereum di seluruh dunia:

- **BIP-39:** Pembuatan frasa pemulihan mnemonik dari entropi kriptografi 128/256-bit.
- **BIP-44:** Struktur hierarki multirantai (\`m/44'/60'/0'/0/0\` untuk Polygon/Ethereum dan \`m/84'/0'/0'/0/0\` untuk Bitcoin Native SegWit \`bc1q...\`).

Artinya, alamat dompet yang Anda miliki di AliBank adalah alamat autentik yang kompatibel 100% dengan TrustWallet, MetaMask, dan perangkat keras seperti Ledger.`,
      },

      // 7. Difference AliBank vs ALX
      {
        id: "alibank-vs-alx",
        category: "101",
        tag: "ALIBANK 101, TOKENOMICS",
        title:
          lang === "en"
            ? "WHAT IS THE DIFFERENCE BETWEEN ALIBANK AND THE ALX COIN?"
            : "APA PERBEDAAN ANTARA ALIBANK DAN KOIN ALX?",
        excerpt:
          lang === "en"
            ? "Clear explanation distinguishing AliBank the hybrid neo-banking network from ALX the native cryptographic utility asset."
            : "Penjelasan tegas yang membedakan platform perbankan AliBank dengan koin kripto utilitas resmi ALX.",
        content:
          lang === "en"
            ? `Many users ask: Is AliBank a coin, or is ALX a bank? Here is the clear distinction:

### AliBank
AliBank is the complete **Financial Operating System**. It encompasses:
- Personal and business digital banking accounts.
- The double-entry ledger database and multi-chain node infrastructure.
- Instant peer-to-peer settlement network.
- Merchant Point-of-Sale (POS) and QRIS payment gateway.
- Anti-Money Laundering (AML) and compliance surveillance engines.

### ALX (Alix Coin)
ALX is the **Native Cryptographic Utility Token** minted on Polygon Mainnet (ERC-20). It serves specific functions within the ecosystem:
- Staking yields and fee rebates for VIP account holders.
- Cross-chain collateral and liquidity pool anchor.
- On-chain settlement token verifiable on public blockchain explorers.`
            : `Banyak pengguna bertanya: Apakah AliBank itu koin, atau ALX itu bank? Berikut penjelasannya:

### AliBank
AliBank adalah **Sistem Operasi Perbankan Finansial Lengkap**. Meliputi:
- Rekening perbankan digital nasabah pribadi dan bisnis.
- Infrastruktur buku besar berpasangan dan node multi-chain.
- Jaringan transfer instan P2P antar-pengguna bebas biaya.
- Kasir Merchant POS dan gateway pembayaran QRIS kripto.
- Mesin audit kepatuhan dan pencegahan pencucian uang (AML).

### ALX (Alix Coin)
ALX adalah **Token Kriptografi Utilitas Resmi** yang diterbitkan di Polygon Mainnet (ERC-20). Fungsinya:
- Pemberian diskon biaya dan imbal hasil staking bagi nasabah VIP.
- Jaminan likuiditas cadangan lintas jaringan (cross-chain collateral).
- Token transaksi on-chain publik yang terdaftar di Polygonscan.`,
      },

      // 8. Merchant POS & QRIS
      {
        id: "merchant-pos",
        category: "merchant",
        tag: "BUSINESS, MERCHANT POS",
        title:
          lang === "en"
            ? "HOW MERCHANTS ACCEPT CRYPTO & QRIS PAYMENTS WITH ALIBANK POS"
            : "CARA MERCHANT MENERIMA PEMBAYARAN KRIPTO & QRIS DENGAN ALIBANK POS",
        excerpt:
          lang === "en"
            ? "Discover how physical stores and digital retailers integrate the AliBank POS terminal for instantaneous settlement with zero chargeback risk."
            : "Pelajari bagaimana toko fisik dan merchant online menggunakan kasir POS AliBank untuk menerima pembayaran tanpa risiko penipuan.",
        content:
          lang === "en"
            ? `Chargebacks, stolen credit card fraud, and 3% to 5% merchant interchange fees cost retailers billions of dollars annually.

The **AliBank Merchant POS Solution** provides:
- **Instant Final Settlement:** Funds settle immediately into merchant accounts in either IDR, USDT, or ALX with zero chargeback risk.
- **Dynamic QRIS & Crypto QR Codes:** Customers can scan with either domestic e-wallets (Gopay, OVO, Dana) or international Web3 wallets (MetaMask, TrustWallet).
- **Zero Merchant Hardware Lock-in:** Run the AliBank POS application directly on Android terminals, tablets, or web browsers.`
            : `Risiko penipuan kartu kredit, chargeback palsu, dan biaya merchant bank 3% hingga 5% sangat membebani para pemilik usaha.

**Solusi Kasir AliBank Merchant POS** menghadirkan:
- **Penyelesaian Dana Seketika (Instant Settlement):** Uang langsung masuk ke saldo kasir dalam IDR, USDT, atau ALX tanpa risiko penarikan sepihak (chargeback).
- **QRIS Dinamis & QR Kripto:** Pelanggan bisa membayar menggunakan dompet digital lokal maupun dompet Web3 internasional (MetaMask/TrustWallet).
- **Bisa Digunakan di Perangkat Apa Saja:** Aplikasi kasir AliBank POS dapat dijalankan di mesin POS Android, tablet, smartphone, maupun komputer web kasir.`,
      },

      // 9. Account Suspension & Recovery
      {
        id: "aml-suspension",
        category: "aml",
        tag: "COMPLIANCE, LEGAL",
        title:
          lang === "en"
            ? "WHAT TRIGGERS AN AML RESTRICTION AND HOW IS DISPUTE RESOLVED?"
            : "APA YANG MEMICU PEMBEKUAN AML DAN BAGAIMANA CARA PENYELESAIANNYA?",
        excerpt:
          lang === "en"
            ? "Understanding the legitimate compliance verification process if an account encounters an anomaly flag."
            : "Pahami proses verifikasi kepatuhan hukum yang sah jika suatu akun terindikasi anomali.",
        content:
          lang === "en"
            ? `AliBank is designed to protect lawful commerce. However, when an account exhibits red flags—such as:
- Depositing from known mixer contracts or sanctioned wallet addresses.
- Structuring transactions to evade standard identity thresholds.
- Experiencing a mathematical discrepancy between profile balance and ledger transaction history.

The system places a temporary **Restriksi Likuiditas (Liquidity Restriction)** on the account.

### How Honest Depositors Clear an AML Flag:
1. Log into your AliBank profile and open the **Pusat Rekonsiliasi & Legalitas**.
2. Submit official proof of source of funds (bank deposit receipt, on-chain TX hash, or business invoice).
3. The Super Admin compliance desk will verify the documents against our central banking gateway logs.
4. Once verified, the legalizing transaction is minted on the ledger, and full account privileges are reinstated immediately.`
            : `AliBank dirancang untuk melindungi perdagangan yang sah. Namun, apabila suatu akun menunjukkan tanda-tanda mencurigakan—seperti:
- Melakukan setoran dari kontrak mixer ilegal atau alamat yang terkena sanksi.
- Memecah transaksi secara janggal untuk menghindari batas KYC.
- Memiliki saldo yang tidak sesuai dengan total mutasi di buku besar (anomali saldo unbacked).

Sistem akan otomatis mengaktifkan status **Restriksi Likuiditas** pada akun tersebut.

### Cara Nasabah Sah Menyelesaikan Klarifikasi:
1. Masuk ke halaman Profil Anda dan buka menu **Pusat Rekonsiliasi & Legalitas**.
2. Unggah bukti sah asal-usul dana (bukti transfer bank, struk setoran tunai, atau TX hash blockchain).
3. Tim kepatuhan admin akan memvalidasi bukti tersebut dengan catatan kas gateway bank.
4. Setelah diverifikasi sah, mutasi legal akan dicatatkan di buku besar dan akses akun dipulihkan sepenuhnya.`,
      },
    ],
    [lang]
  );

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory =
        activeCategory === "all" || art.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [articles, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111111] font-body selection:bg-[#F4B728]/30 overflow-x-hidden antialiased">
      {/* =========================================================================
          1. HEADER & TOP NAVIGATION WITH MEGA MENU (Zcash Style)
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE6DF] transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Badge */}
          <NextLink href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#F4B728] flex items-center justify-center shadow-sm text-black font-serif font-black text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
              AliBank
            </span>
          </NextLink>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.18em] text-[#444444] uppercase h-full">
            {/* LEARN with Mega Menu Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "learn" ? null : "learn")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "learn"
                    ? "text-[#111111]"
                    : "text-black font-black hover:text-black"
                )}
              >
                <span>{lang === "en" ? "LEARN" : "PELAJARI"}</span>
              </button>
              {(activeMegaMenu === "learn" || activeCategory !== "all") && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* ECOSYSTEM with Mega Menu Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "ecosystem" ? null : "ecosystem")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "ecosystem"
                    ? "text-[#111111]"
                    : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}</span>
              </button>
              {activeMegaMenu === "ecosystem" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>
            {/* NETWORK with Mega Menu Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "network" ? null : "network")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "network"
                    ? "text-[#111111]"
                    : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "NETWORK" : "JARINGAN"}</span>
              </button>
              {activeMegaMenu === "network" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* FEATURES with Mega Menu Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "features" ? null : "features")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "features"
                    ? "text-[#111111]"
                    : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "FEATURES" : "FITUR"}</span>
              </button>
              {activeMegaMenu === "features" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* FAQ with Mega Menu Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "faq" ? null : "faq")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "faq"
                    ? "text-[#111111]"
                    : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>FAQ</span>
              </button>
              {activeMegaMenu === "faq" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>
          </nav>

          {/* Actions & Language Switcher (Clean Zcash Standard, No Sign In / Open Account) */}
          <div className="flex items-center gap-4">
            <div className="flex items-center text-[10px] font-bold tracking-widest border border-[#DFDAD0] rounded-sm p-0.5 bg-[#F4F1EA]">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-2 py-1 rounded-[2px] transition-colors",
                  lang === "en"
                    ? "bg-[#111111] text-white"
                    : "text-[#666666] hover:text-black"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={cn(
                  "px-2 py-1 rounded-[2px] transition-colors",
                  lang === "id"
                    ? "bg-[#111111] text-white"
                    : "text-[#666666] hover:text-black"
                )}
              >
                ID
              </button>
            </div>

            <button
              onClick={() => {
                const el = document.getElementById("search-input");
                el?.focus();
              }}
              className="p-2 text-[#444444] hover:text-black transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =========================================================================
            1.A MEGA MENU: LEARN (Zcash exact structure & precise alignment)
            ========================================================================= */}
        {activeMegaMenu === "learn" && (
          <>
            {/* Click-outside backdrop */}
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />

            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                {/* Col 1: Overview */}
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
                    <button
                      onClick={() => {
                        setActiveCategory("all");
                        setActiveMegaMenu(null);
                      }}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Browse Knowledge Hub →" : "Buka Pusat Pengetahuan →"}
                    </button>
                  </div>
                </div>

                {/* Col 2: ALIBANK 101 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    ALIBANK 101
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "alibank-101") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "What is AliBank?" : "Apa itu AliBank?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "alibank-vs-alx") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "How is AliBank different from ALX?" : "Apa beda AliBank dengan ALX?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "wallet-standards") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "What are TrustWallet Core standards?" : "Apa itu standar TrustWallet Core?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("101");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Col 3: SECURITY & AML (Flat aligned with other columns) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & AML" : "KEAMANAN & AML"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "aml-mandate") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left font-medium text-[#111111] transition-colors"
                      >
                        {lang === "en"
                          ? "Zero-Tolerance Anti-Money Laundering Policy"
                          : "Kebijakan Nol-Toleransi Anti-Pencucian Uang"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "phantom-engine") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en"
                          ? "Real-Time Anomaly & Phantom Detection"
                          : "Deteksi Saldo Hantu & Anomali Real-Time"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "aml-suspension") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en"
                          ? "What triggers an account restriction?"
                          : "Apa yang memicu pembekuan akun?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("aml");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "Explore AML Engine →" : "Pelajari Mesin AML →"}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Col 4: USING ALIBANK */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "USING ALIBANK" : "PENGGUNAAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "por-card") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en"
                          ? "How to audit Proof of Reserves?"
                          : "Cara audit Bukti Cadangan (PoR)?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "double-entry") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en"
                          ? "Why double-entry ledger matters?"
                          : "Mengapa buku besar ganda mutlak?"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedArticle(articles.find((a) => a.id === "merchant-pos") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en"
                          ? "Merchant POS & QRIS acceptance"
                          : "Penerimaan Kasir POS & QRIS"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("merchant");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* =========================================================================
            1.B MEGA MENU: ECOSYSTEM (Matching Zcash exactly)
            ========================================================================= */}
        {activeMegaMenu === "ecosystem" && (
          <>
            {/* Click-outside backdrop */}
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />

            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                {/* Col 1: Overview */}
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

                {/* Col 2: WALLETS */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "WALLETS" : "DOMPET"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/ecosystem?category=wallets"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        MetaMask Web3 Bridge
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=wallets"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        TrustWallet Core (BIP-39/44)
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=wallets"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Hardware Wallet Custody
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=wallets"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 3: NETWORKS & VAULTS */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORKS & VAULTS" : "JARINGAN & BRANKAS"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/ecosystem?category=networks"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Polygon Mainnet (ALX)
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=networks"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Ethereum Liquidity Vault
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=networks"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Bitcoin Native SegWit
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=networks"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 4: BUILD */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "BUILD & MERCHANTS" : "PENGEMBANG & KASIR"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/ecosystem?category=build"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Build with AliBank REST API
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=merchant"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Merchant POS & QRIS Terminal
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=build"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        Smart Contract Source Code
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/ecosystem?category=build"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
        {/* =========================================================================
            1.C MEGA MENU: NETWORK (Exact Zcash screenshot structure)
            ========================================================================= */}
        {activeMegaMenu === "network" && (
          <>
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                {/* Col 1: Overview */}
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

                {/* Col 2: NETWORK INFO */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORK INFO" : "INFO JARINGAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/network"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "Network Statistics" : "Statistik Jaringan"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/network#governance-section"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "Funding & Governance" : "Pendanaan & Tata Kelola"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/network#aip-section"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "AIPs (Improvement Proposals)" : "AIP (Proposal Pembaruan)"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/network"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 3: ON-CHAIN RAILS */}
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
                      <NextLink
                        href="/ecosystem?category=networks"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "Inspect all contracts →" : "Audit seluruh kontrak →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 4: SURVEILLANCE & AML */}
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
                {/* Col 1: Overview */}
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
                    <NextLink
                      href="/features"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Explore All Features →" : "Jelajahi Semua Fitur →"}
                    </NextLink>
                  </div>
                </div>

                {/* Col 2: BANKING & SETTLEMENT */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "BANKING & SETTLEMENT" : "PERBANKAN & KLIRING"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/features#instant-transfers" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Instant P2P Transfers (<200ms, 0% Fee)" : "Transfer P2P Instan (<200ms, Bebas Biaya)"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#dual-currency" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Dual-Currency IDR & Crypto Ledger" : "Buku Besar Ganda IDR & Kripto"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#qris-pos" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "0% National QRIS & EDC Gateway" : "Gerbang QRIS & EDC 0% Biaya"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#softpos-nfc" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "SoftPOS Contactless Smartphone NFC" : "SoftPOS Contactless Tap NFC Smartphone"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 3: SOVEREIGNTY & MULTI-CHAIN */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "SOVEREIGNTY & WEB3" : "KEDAULATAN & WEB3"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/features#trustwallet-core" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "TrustWallet Core BIP-39/44/84 Derivation" : "Derivasi Kunci BIP-39/44/84 TrustWallet Core"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#metamask-bridge" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "MetaMask Native Web3 Bridge & Signing" : "Jembatan & Penandatanganan Native MetaMask"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#yield-vault" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Ethereum 12.00% APY Smart Yield Vault" : "Brankas Hasil Cerdas Ethereum 12,00% APY"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#polygon-alx" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Polygon Mainnet ALX Settlement Rail" : "Jalur Penyelesaian Token ALX Polygon"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 4: SECURITY & SOLVENCY */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & SOLVENCY" : "KEAMANAN & SOLVENSI"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/features#proof-of-reserves" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">
                        {lang === "en" ? "1:1 Mathematical Proof of Reserves (PoR)" : "1:1 Bukti Cadangan Matematis (PoR)"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#double-entry" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Double-Entry Constraint Equation Engine" : "Buku Besar Persamaan Akuntansi Ganda"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#phantom-detection" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Real-Time Phantom Balance Tamper Freeze" : "Pembekuan Otomatis Saldo Hantu & Anomali"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/features#military-vault" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "AES-256 Military Encrypted Biometric Vault" : "Enkripsi Brankas Biometrik Militer AES-256"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 5. FAQ MEGA MENU */}
        {activeMegaMenu === "faq" && (
          <>
            <div onClick={() => setActiveMegaMenu(null)} className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]" />
            <div className="absolute top-20 left-0 w-full bg-white border-b border-[#DFDAD0] shadow-xl z-50 animate-in fade-in duration-150">
              <div className="max-w-[1280px] mx-auto px-6 py-10 pb-12 grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 text-left">
                {/* Col 1: Overview */}
                <div className="space-y-3 pr-4 border-r border-[#ECE7DE]">
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "FREQUENTLY ASKED" : "PERTANYAAN UMUM"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Essential answers regarding platform legitimacy, 100% full-reserve banking, AML anti-fraud policies, tokenomics, and self-custodial account management."
                      : "Jawaban mendasar seputar legalitas protokol, kepastian cadangan 100% tanpa risiko fraksional, kebijakan anti-fraud AML, dan kustodi mandiri."}
                  </p>
                  <div className="pt-2">
                    <NextLink
                      href="/faq"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Explore FAQ Knowledge Hub →" : "Buka Pusat Tanya Jawab →"}
                    </NextLink>
                  </div>
                </div>

                {/* Col 2: Legitimacy & Reserves */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "LEGITIMACY & SOLVENCY" : "LEGALITAS & CADANGAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/faq#legitimacy" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Is AliBank legitimate or a scam?" : "Apakah AliBank resmi atau penipuan?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#full-reserve" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "How are deposits backed 1:1?" : "Bagaimana simpanan dijamin 1:1?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#withdrawals" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Can I withdraw funds at any time?" : "Bisakah tarik uang kapan saja?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq?category=solvency" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all solvency answers →" : "Lihat jawaban solvensi →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 3: AliBank vs ALX & Web3 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "ALIBANK VS ALX & WEB3" : "ALIBANK VS ALX & WEB3"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/faq#diff-alibank-alx" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What is the difference with ALX?" : "Apa perbedaan dengan koin ALX?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#trustwallet-integration" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "TrustWallet Core & MetaMask guide" : "Panduan TrustWallet & MetaMask"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#eth-yield-origin" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Ethereum 12% APY Yield Vault origin" : "Asal dividen 12% APY Ethereum"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq?category=tokenomics" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block">
                        {lang === "en" ? "See all tokenomics →" : "Lihat semua tokenomics →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 4: Security & Merchants */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & COMPLIANCE" : "KEAMANAN & KEPATUHAN"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink href="/faq#aml-mandate" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">
                        {lang === "en" ? "Zero-Tolerance AML Policy" : "Kebijakan Nol-Toleransi AML"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#double-entry" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What is a 'Phantom Balance'?" : "Apa itu 'Saldo Hantu'?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq#merchant-fees" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "0% QRIS & SoftPOS merchant terms" : "Ketentuan QRIS 0% & SoftPOS"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/faq?category=security" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block">
                        {lang === "en" ? "Explore Security FAQ →" : "Lihat FAQ Keamanan →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* =========================================================================
          2. MAIN CONTENT (Exact 2-Column Layout of Zcash "Learn Zcash" Page)
          ========================================================================= */}
      <main className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
            {lang === "en" ? "Learn AliBank" : "Pelajari AliBank"}
          </h1>
          <div className="w-full h-px bg-[#DFDAD0] mt-8" />
        </div>

        {/* 2-Column Grid: Filter Sidebar (Left) + Articles Grid (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar: Filter List */}
          <aside className="lg:col-span-3 space-y-6">
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#888888] uppercase mb-4">
                {lang === "en" ? "FILTER BY" : "SARING BERDASARKAN"}
              </p>

              <div className="flex flex-col space-y-2 text-xs font-bold uppercase tracking-wider">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "text-left py-2 px-3 rounded-sm transition-all duration-150 flex items-center justify-between",
                      activeCategory === cat.id
                        ? "bg-[#111111] text-white"
                        : "text-[#555555] hover:text-black hover:bg-[#EFECE6]"
                    )}
                  >
                    <span>{lang === "en" ? cat.labelEn : cat.labelId}</span>
                    {activeCategory === cat.id && <span className="text-[#F4B728]">&bull;</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Search */}
            <div className="pt-6 border-t border-[#DFDAD0]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Search topics..." : "Cari topik..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DFDAD0] rounded-sm text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </aside>

          {/* Right Main Content */}
          <div className="lg:col-span-9 space-y-8">
            {/* FEATURED BOX: ANTI-MONEY LAUNDERING MANDATE (Matching Zcash "HOW TO USE ZCASH") */}
            {(activeCategory === "all" || activeCategory === "aml") && !searchQuery && (
              <div className="border border-[#111111] p-8 bg-white rounded-sm shadow-sm space-y-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#E11D48] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                  {lang === "en" ? "FEATURED • AML & FRAUD PREVENTION" : "UNGGULAN • AML & PENCEGAHAN PENIPUAN"}
                </span>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                  {lang === "en"
                    ? "ALIBANK ZERO-TOLERANCE ANTI-MONEY LAUNDERING & SYSTEM INTEGRITY MANDATE"
                    : "MANDAT TEGAS: PENCEGAHAN PENCUCIAN UANG (AML) & PENGAWASAN SISTEM ALIBANK"}
                </h2>

                <p className="text-sm text-[#555555] font-light leading-relaxed">
                  {lang === "en"
                    ? "AliBank enforces severe, non-negotiable protocols against money laundering, illegal capital cycling, and fraudulent transaction spoofing. Through our latest massive system upgrade, the AliBank Autonomous Audit Engine continuously reconciles ledger debits against physical on-chain vaults (Ethereum & Polygon). Any anomaly, phantom balance injection, or structured illicit transaction triggers automated quarantine, asset freezing, and irreversible suspension."
                    : "AliBank memberlakukan aturan keras tanpa kompromi terhadap segala bentuk pencucian uang dan perputaran modal terlarang. Melalui pembaruan sistem masif terkini, mesin audit otonom AliBank mencocokkan mutasi buku besar terhadap brankas on-chain (Ethereum & Polygon) secara berkelanjutan. Setiap kejanggalan atau upaya injeksi saldo hantu akan memicu pembekuan otomatis seketika."}
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedArticle(articles[0])}
                    className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] px-6 py-3 rounded-sm transition-colors"
                  >
                    {lang === "en" ? "Read Full Policy" : "Baca Kebijakan Lengkap"}
                  </button>
                </div>
              </div>
            )}

            {/* 3-COLUMN EDITORIAL ARTICLE GRID (Exact Zcash Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#DFDAD0] bg-white divide-y md:divide-y-0 divide-[#DFDAD0]">
              {filteredArticles.map((art, idx) => {
                const isYellow = art.isSpecialStyle === "yellow";
                const isDark = art.isSpecialStyle === "dark";

                return (
                  <div
                    key={art.id}
                    onClick={() => setSelectedArticle(art)}
                    className={cn(
                      "p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 border-b md:border-b md:border-r border-[#DFDAD0] group min-h-[260px]",
                      isYellow
                        ? "bg-[#F4B728] text-black hover:bg-[#E5A81E]"
                        : isDark
                        ? "bg-[#111111] text-white hover:bg-black"
                        : "bg-white hover:bg-[#FAF9F5]"
                    )}
                  >
                    <div className="space-y-3">
                      <h3
                        className={cn(
                          "font-serif text-lg font-bold leading-snug tracking-tight transition-colors",
                          isYellow
                            ? "text-black"
                            : isDark
                            ? "text-white"
                            : "text-[#111111] group-hover:text-[#F4B728]"
                        )}
                      >
                        {art.title}
                      </h3>
                      <p
                        className={cn(
                          "text-xs font-light leading-relaxed line-clamp-4",
                          isYellow ? "text-black/80" : isDark ? "text-white/80" : "text-[#666666]"
                        )}
                      >
                        {art.excerpt}
                      </p>
                    </div>

                    <div className="pt-6">
                      <span
                        className={cn(
                          "text-[9px] font-bold tracking-[0.18em] uppercase",
                          isYellow ? "text-black/70" : isDark ? "text-[#F4B728]" : "text-[#999999]"
                        )}
                      >
                        {art.tag}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* =========================================================================
          3. ARTICLE DETAIL MODAL
          ========================================================================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm max-w-2xl w-full p-8 relative shadow-2xl space-y-6 text-[#111111] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 p-2 text-[#777777] hover:text-black rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#E11D48]">
                {selectedArticle.tag}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] leading-tight">
                {selectedArticle.title}
              </h2>
            </div>

            <div className="w-full h-px bg-[#DFDAD0]" />

            <div className="py-2">
              <FormattedArticleContent text={selectedArticle.content} />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-[#DFDAD0]">
              <span className="text-[10px] font-mono text-[#888888]">
                ALIBANK PROTOCOL KNOWLEDGE BASE
              </span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
              >
                {lang === "en" ? "Close Article" : "Tutup Artikel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. FOOTER (Identical Zcash Directory Style)
          ========================================================================= */}
      <footer className="bg-[#0A0A0A] text-white pt-24 pb-16 border-t border-[#222222] mt-24">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 pb-16 border-b border-[#222222]">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F4B728] flex items-center justify-center text-black font-serif font-black text-lg">
                  A
                </div>
                <span className="font-serif text-xl font-bold tracking-tight text-white">
                  AliBank
                </span>
              </div>
              <p className="font-serif text-lg text-[#CCCCCC] font-normal leading-snug max-w-sm">
                AliBank is sovereign electronic banking.
              </p>
              <p className="text-xs text-[#777777] font-light max-w-sm">
                Zero-tolerance Anti-Money Laundering architecture with 100% on-chain verifiable Proof of Reserves.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                LEARN
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <button onClick={() => setActiveCategory("aml")} className="hover:text-white transition-colors">
                    Security & AML Mandate
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("por")} className="hover:text-white transition-colors">
                    Proof of Reserves
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("101")} className="hover:text-white transition-colors">
                    AliBank 101
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("merchant")} className="hover:text-white transition-colors">
                    Merchant POS
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                ECOSYSTEM
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <a
                    href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Polygon Token (ALX)
                  </a>
                </li>
                <li>
                  <a
                    href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Ethereum Vault
                  </a>
                </li>
                <li>
                  <NextLink href="/login" className="hover:text-white transition-colors">
                    Web3 Bridge
                  </NextLink>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                LEGAL & AUDIT
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <NextLink href="/about" className="hover:text-white transition-colors">
                    Terms of Service
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/about" className="hover:text-white transition-colors">
                    Privacy Policy
                  </NextLink>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("aml")} className="hover:text-white transition-colors">
                    Anti-Fraud Engine
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#666666]">
            <p>&copy; {new Date().getFullYear()} AliBank Financial Network. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setLang(lang === "en" ? "id" : "en")}
                className="hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider"
              >
                {lang === "en" ? "Bahasa Indonesia 🇮🇩" : "English 🌐"}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-lg animate-pulse">
            A
          </div>
        </div>
      }
    >
      <LearnContent />
    </Suspense>
  );
}

