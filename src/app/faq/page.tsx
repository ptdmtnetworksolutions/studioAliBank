"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  ChevronDown,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  AlertTriangle,
  Scale,
  Lock,
  Wallet,
  Building2,
  HelpCircle,
  Mail,
  FileCheck2,
  Layers,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

// Pre-computed guilloche rays for 100% hydration consistency
const FAQ_GUILLOCHE_RAYS = Array.from({ length: 72 }, (_, i) => {
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

interface FaqItem {
  id: string;
  category: "solvency" | "tokenomics" | "banking" | "web3" | "security" | "merchant";
  tagEn: string;
  tagId: string;
  questionEn: string;
  questionId: string;
  answerEn: string[];
  answerId: string[];
  isHighlight?: "gold" | "crimson" | "dark";
  keyTakeawayEn?: string;
  keyTakeawayId?: string;
  actionLink?: {
    href: string;
    labelEn: string;
    labelId: string;
    isExternal?: boolean;
  };
}

function FaqContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";

  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | "faq" | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    "legitimacy": true,
    "diff-alibank-alx": true,
    "full-reserve": true,
  });

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

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const categories = useMemo(
    () => [
      { id: "all", labelEn: "ALL QUESTIONS", labelId: "SEMUA PERTANYAAN" },
      { id: "solvency", labelEn: "LEGITIMACY & SOLVENCY", labelId: "LEGALITAS & SOLVENSI" },
      { id: "tokenomics", labelEn: "ALIBANK VS ALX", labelId: "ALIBANK VS ALX" },
      { id: "banking", labelEn: "BANKING & TRANSFERS", labelId: "PERBANKAN & TRANSFER" },
      { id: "web3", labelEn: "WEB3 & CUSTODY", labelId: "WEB3 & KUSTODI" },
      { id: "security", labelEn: "SECURITY & AML", labelId: "KEAMANAN & AML" },
      { id: "merchant", labelEn: "MERCHANT & QRIS", labelId: "MERCHANT & QRIS" },
    ],
    []
  );

  const faqList: FaqItem[] = useMemo(
    () => [
      // 1. Legitimacy
      {
        id: "legitimacy",
        category: "solvency",
        tagEn: "LEGITIMACY & ANTI-FRAUD",
        tagId: "LEGALITAS & ANTI-PENIPUAN",
        questionEn: "Is AliBank a legitimate financial platform or an investment scam?",
        questionId: "Apakah AliBank platform keuangan legal atau skema penipuan investasi?",
        isHighlight: "gold",
        keyTakeawayEn: "AliBank is an audited hybrid banking system, NOT a Ponzi scheme or high-yield investment program (HYIP).",
        keyTakeawayId: "AliBank adalah sistem perbankan hibrida terverifikasi, BUKAN skema Ponzi atau program investasi bodong (HYIP).",
        answerEn: [
          "AliBank is a legitimate hybrid neo-banking platform engineered on mathematics and cryptographic certainty. We categorically do NOT promise unrealistic passive daily ROIs, multi-tier recruitment schemes, or fraudulent token lockups.",
          "Our native utility asset ALX is minted and verified on Polygon PoS Mainnet (ERC-20: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd), and our central liquidity reserves are held in public Ethereum smart contracts (0x56268032A3B3E64CFeF1916d591087CF8dF40945).",
          "Anyone in the world can independently audit our open-source contract bytecodes, reserve solvency, and transaction histories on public blockchain explorers (Polygonscan and Etherscan).",
        ],
        answerId: [
          "AliBank adalah platform neobank hibrida resmi yang dirancang atas dasar kepastian matematis dan transparansi terbuka. Kami secara tegas TIDAK PERNAH menjanjikan bunga harian pasif tak masuk akal, skema perekrutan berjenjang (MLM/Ponzi), atau penguncian dana sepihak.",
          "Token utilitas ALX diterbitkan secara resmi di jaringan Polygon PoS Mainnet (ERC-20: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd), dan brankas likuiditas cadangan kami tersimpan di smart contract publik Ethereum (0x56268032A3B3E64CFeF1916d591087CF8dF40945).",
          "Siapa pun di seluruh dunia dapat mengaudit secara mandiri kode sumber kontrak, kecukupan cadangan modal, dan mutasi saldo di penjelajah blockchain publik (Polygonscan & Etherscan).",
        ],
        actionLink: {
          href: "/learn?category=por",
          labelEn: "Audit Proof of Reserves →",
          labelId: "Audit Bukti Cadangan →",
        },
      },

      // 2. AliBank vs ALX
      {
        id: "diff-alibank-alx",
        category: "tokenomics",
        tagEn: "SYSTEM ARCHITECTURE",
        tagId: "ARSITEKTUR SISTEM",
        questionEn: "What is the difference between AliBank and the ALX coin?",
        questionId: "Apa perbedaan antara AliBank dan koin utilitas ALX?",
        isHighlight: "dark",
        keyTakeawayEn: "AliBank is the overall neo-banking operating system; ALX is the decentralized on-chain utility token.",
        keyTakeawayId: "AliBank adalah sistem operasi neobank menyeluruh; ALX adalah token utilitas kripto desentralisasi di Polygon.",
        answerEn: [
          "AliBank is the complete financial operating system that provides multi-currency checking accounts, instant peer-to-peer transfers, merchant point-of-sale (POS) terminals, 0% QRIS gateways, and real-time double-entry bookkeeping.",
          "ALX (AlixCoin) is the native cryptographic utility token deployed on Polygon Mainnet. It has a strictly capped supply of 1,000,000,000 ALX and is used for transaction fee waivers, cross-chain liquidity settlement, and algorithmic staking yield.",
          "They complement each other: users get the ease and sub-second speed of a modern banking app while benefiting from the cryptographic proof and decentralization of public blockchain technology.",
        ],
        answerId: [
          "AliBank adalah sistem operasi keuangan perbankan lengkap yang menyediakan rekening giro multi-mata uang, transfer instan bebas biaya, terminal kasir merchant POS, gerbang QRIS 0%, dan pembukuan akuntansi ganda real-time.",
          "ALX (AlixCoin) adalah token utilitas kriptografis terdesentralisasi yang berjalan di jaringan Polygon Mainnet dengan batas pasokan maksimal 1.000.000.000 ALX. Koin ini berfungsi membuka status bebas biaya transfer VIP, perputaran likuiditas, dan dividen staking.",
          "Keduanya saling melengkapi: nasabah menikmati kemudahan aplikasi perbankan modern super cepat sekaligus memegang bukti cadangan aset kripto yang terdesentralisasi.",
        ],
        actionLink: {
          href: `https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`,
          labelEn: "Inspect ALX on Polygonscan →",
          labelId: "Lihat ALX di Polygonscan →",
          isExternal: true,
        },
      },

      // 3. Full Reserve Backing
      {
        id: "full-reserve",
        category: "solvency",
        tagEn: "SOLVENCY INVARIANT",
        tagId: "PERSAMAAN SOLVENSI",
        questionEn: "How are customer deposits backed 1:1 without fractional lending?",
        questionId: "Bagaimana simpanan nasabah dijamin 1:1 tanpa perbankan fraksional?",
        keyTakeawayEn: "AliBank maintains 100% full reserves at all times: Total Reserves >= Total Customer Balances.",
        keyTakeawayId: "AliBank menerapkan 100% cadangan penuh setiap detik: Total Cadangan >= Total Kewajiban Saldo.",
        answerEn: [
          "Commercial retail banks typically operate under fractional-reserve mandates, keeping as little as 5% - 10% in cash while lending the rest to long-term illiquid borrowers. This makes them vulnerable to bank runs and liquidity crunches.",
          "AliBank enforces a 100% Full-Reserve banking model. For every single rupiah or ALX token credited to a customer account, an identical amount of physical liquidity is escrowed in audited banking accounts or our public Ethereum and Polygon smart contract vaults.",
          "Our system runs a continuous autonomous reconciliation daemon. If reserve assets ever fall below customer depository obligations by even 1 satoshi, the ledger triggers a global alert and suspends administrative balance adjustments.",
        ],
        answerId: [
          "Bank komersial konvensional umumnya mempraktikkan cadangan fraksional, hanya menyimpan 5% - 10% uang cair sementara sisanya dipinjamkan ke pihak ketiga dengan jangka panjang. Hal ini membuat nasabah rentan terkena risiko gagal bayar (bank run).",
          "AliBank menjalankan standar Cadangan Penuh 100% (Full-Reserve). Untuk setiap rupiah atau token ALX di akun nasabah, tersedia cadangan fisik bernilai sama di rekening escrow perbankan dan brankas smart contract Ethereum/Polygon.",
          "Sistem kami mempekerjakan daemon rekonsiliasi otonom 24/7. Jika aset cadangan berada di bawah total simpanan nasabah walau hanya 1 rupiah, sistem seketika membunyikan peringatan audit global.",
        ],
      },

      // 4. Withdrawals
      {
        id: "withdrawals",
        category: "banking",
        tagEn: "LIQUIDITY ACCESS",
        tagId: "AKSES LIKUIDITAS",
        questionEn: "Can I withdraw my money at any time, or are funds locked?",
        questionId: "Bisakah saya menarik uang saya kapan saja, atau saldo dikunci?",
        keyTakeawayEn: "All legitimate customer funds are 100% liquid and available on demand 24/7/365 without lockup periods.",
        keyTakeawayId: "Seluruh dana nasabah sah bersifat likuid 100% dan dapat ditarik kapan saja tanpa masa tunggu.",
        answerEn: [
          "Yes. Because AliBank maintains 100% full reserves rather than loaning out your deposits, your liquid IDR and crypto balances are available for withdrawal at any moment.",
          "You can withdraw fiat IDR directly to your verified Indonesian commercial bank accounts (BCA, Mandiri, BRI, BNI, BSI) or PayPal, and you can withdraw crypto directly to any on-chain Web3 wallet address.",
          "There are zero recruitment quotas, zero multi-year lockup traps, and zero hidden withdrawal unlock fees.",
        ],
        answerId: [
          "Ya, tentu saja. Karena AliBank menjaga cadangan penuh 100% dan tidak meminjamkan simpanan Anda ke pihak lain, seluruh saldo rupiah dan kripto Anda dapat ditarik setiap saat 24 jam sehari, 7 hari seminggu.",
          "Penarikan saldo fiat IDR dapat langsung dikirim ke rekening bank nasional Anda (BCA, Mandiri, BRI, BNI, BSI) atau PayPal, dan penarikan kripto dapat dikirim ke alamat dompet Web3 mana pun.",
          "Tidak ada syarat rekrutmen anggota baru, tidak ada jebakan masa kunci tahunan, dan tidak ada biaya pembukaan penarikan yang tersembunyi.",
        ],
      },

      // 5. Zero-Tolerance AML
      {
        id: "aml-mandate",
        category: "security",
        tagEn: "COMPLIANCE & SURVEILLANCE",
        tagId: "KEPATUHAN & PENGAWASAN",
        questionEn: "Why does AliBank enforce a Zero-Tolerance Anti-Money Laundering (AML) policy?",
        questionId: "Mengapa AliBank memberlakukan kebijakan Anti-Pencucian Uang (AML) tanpa kompromi?",
        isHighlight: "crimson",
        keyTakeawayEn: "Zero-tolerance compliance protects legitimate depositors from fraudulent syndicates and regulatory seizure.",
        keyTakeawayId: "Kepatuhan nol toleransi melindungi nasabah jujur dari risiko sindikat pencucian uang dan penyitaan regulasi.",
        answerEn: [
          "AliBank is built to serve legitimate businesses, sovereign savers, and honest digital commerce. We categorically reject criminal actors attempting to utilize our zero-fee settlement rails for Money Laundering, terrorist financing, or structured fund layering.",
          "Our automated anomaly surveillance engine actively monitors all deposit, transfer, and withdrawal mutations against bank statements and on-chain signatures.",
          "Accounts identified attempting balance falsification, unbacked phantom injections, or rapid smurfing are placed into immediate atomic quarantine, and illegitimate synthetic balances are unilaterally confiscated to protect platform solvency.",
        ],
        answerId: [
          "AliBank dibangun untuk melayani pedagang sah, pebisnis independen, dan masyarakat jujur. Kami secara tegas menolak pihak-pihak kriminal yang mencoba mengeksploitasi kecepatan transaksi tanpa biaya kami untuk pencucian uang (Money Laundering) atau perputaran dana gelap.",
          "Mesin pengawasan anomali kami mengawasi setiap pergerakan dana secara otomatis dengan membandingkan mutasi terhadap bukti transfer perbankan dan transaksi on-chain.",
          "Akun yang terindikasi merekayasa saldo palsu, melakukan transfer beruntun mencurigakan (smurfing), atau meminta penarikan tanpa bukti setoran sah akan langsung dibekukan seketika, dan saldo fiktif disita untuk menjaga solvabilitas nasabah lainnya.",
        ],
        actionLink: {
          href: "/learn?category=aml",
          labelEn: "Read AML Mandate Document →",
          labelId: "Baca Dokumen Mandat AML →",
        },
      },

      // 6. Phantom Balances & Double-Entry
      {
        id: "double-entry",
        category: "security",
        tagEn: "LEDGER INTEGRITY",
        tagId: "INTEGRITAS BUKU BESAR",
        questionEn: "What is a 'Phantom Balance' and how does the double-entry ledger eliminate it?",
        questionId: "Apa itu 'Saldo Hantu' dan bagaimana buku besar ganda menghapusnya?",
        keyTakeawayEn: "Every debit must equal a credit; unauthorized synthetic balance increments are rejected at the database kernel level.",
        keyTakeawayId: "Setiap debet wajib seimbang dengan kredit; penambahan saldo fiktif tanpa lawan ditolak di tingkat kernel sistem.",
        answerEn: [
          "A 'Phantom Balance' is synthetic money created inside a flawed database without actual bank fiat or on-chain crypto backing. Fraudsters often exploit software flaws to inject fake balances and attempt instant fiat withdrawals.",
          "AliBank enforces a mathematically constrained Double-Entry Accounting Ledger: Delta Assets - Delta Liabilities - Delta Equity = 0. Money cannot be credited to an account unless it is debited from another verified account or escrow vault.",
          "Any unbalanced mutation triggers an immediate database transaction rollback and activates an automated security alert in less than 50 milliseconds.",
        ],
        answerId: [
          "Saldo Hantu (Phantom Balance) adalah saldo fiktif yang sengaja disuntikkan ke dalam basis data tanpa adanya setoran uang asli di bank atau token di blockchain. Pelaku kejahatan sering kali memanfaatkan celah sistem untuk mencairkan saldo palsu tersebut.",
          "AliBank menerapkan Buku Besar Akuntansi Ganda yang terikat hukum matematika: Perubahan Aset - Perubahan Kewajiban - Perubahan Ekuitas = 0. Uang tidak akan pernah bisa bertambah di akun Anda kecuali jika ada pengurangan sah dari akun atau brankas escrow lawan.",
          "Setiap transaksi yang tidak seimbang akan digagalkan secara atomik oleh sistem database dalam kurun waktu kurang dari 50 milidetik.",
        ],
      },

      // 7. TrustWallet Core & MetaMask
      {
        id: "trustwallet-integration",
        category: "web3",
        tagEn: "SELF-CUSTODY STANDARDS",
        tagId: "STANDAR KUSTODI MANDIRI",
        questionEn: "How does AliBank integrate with TrustWallet Core and MetaMask?",
        questionId: "Bagaimana AliBank terintegrasi dengan TrustWallet Core dan MetaMask?",
        keyTakeawayEn: "Keys are derived using open standards (BIP-39/44/84); Web3 wallets connect with zero seed exposure.",
        keyTakeawayId: "Kunci derivasi menggunakan standar terbuka (BIP-39/44/84); dompet Web3 terhubung tanpa meminta kata sandi.",
        answerEn: [
          "AliBank adheres to open cryptographic standards. User wallet addresses are derived using industry-standard BIP-39 mnemonic phrases, BIP-44 EVM derivation paths (m/44'/60'/0'/0/0), and BIP-84 Bitcoin Native SegWit paths (m/84'/0'/0'/0/0).",
          "You can connect your MetaMask or WalletConnect-compatible wallet directly to our dashboard. Authentication is performed via standard EIP-712 typed cryptographic signatures, ensuring that you never disclose your private keys or seed phrase to anyone.",
          "If you ever wish to migrate away, your addresses and on-chain assets remain 100% accessible via TrustWallet, Ledger, Trezor, or MetaMask.",
        ],
        answerId: [
          "AliBank tunduk pada standar kriptografi terbuka dunia. Alamat dompet nasabah diturunkan dari frase sandi BIP-39 standar industri, jalur EVM BIP-44 (m/44'/60'/0'/0/0), dan Bitcoin SegWit BIP-84 (m/84'/0'/0'/0/0).",
          "Anda dapat menghubungkan dompet MetaMask atau dompet WalletConnect langsung ke dasbor AliBank. Otentikasi dilakukan melalui tanda tangan digital EIP-712 yang aman tanpa pernah mengekspos frase sandi Anda.",
          "Jika Anda ingin berpindah perangkat, seluruh alamat dompet dan aset on-chain Anda tetap dapat dibuka di TrustWallet, Ledger, Trezor, atau MetaMask.",
        ],
        actionLink: {
          href: "/ecosystem?category=wallets",
          labelEn: "View Web3 Wallet Specifications →",
          labelId: "Lihat Spesifikasi Dompet Web3 →",
        },
      },

      // 8. 0% QRIS & SoftPOS
      {
        id: "merchant-fees",
        category: "merchant",
        tagEn: "MERCHANT LIQUIDITY",
        tagId: "LIKUIDITAS PEDAGANG",
        questionEn: "How does 0% QRIS and SoftPOS NFC work without merchant discount deductions?",
        questionId: "Bagaimana QRIS 0% dan SoftPOS NFC beroperasi tanpa potongan komisi kasir?",
        keyTakeawayEn: "Transactions settle directly to the merchant's high-yield AliBank balance with zero intermediary deductions.",
        keyTakeawayId: "Uang kasir masuk secara instan ke rekening AliBank merchant tanpa potongan MDR sepeser pun.",
        answerEn: [
          "Traditional payment gateways charge merchants 0.7% - 1.5% in merchant discount rates (MDR) and hold funds for 1 to 3 business days before transferring to the merchant's checking account.",
          "AliBank sponsors transaction fees for verified merchants via the ALX network liquidity buffer. Customers can pay via standardized national QRIS or tap their physical contactless cards (Mandiri e-Money, Flazz, Visa) on the merchant's NFC smartphone.",
          "Funds are credited to the merchant in real time (<200ms) with 0% fee deduction, ready for instant supplier payouts or automated yield staking.",
        ],
        answerId: [
          "Gerbang pembayaran konvensional memotong 0,7% hingga 1,5% komisi MDR dari omzet pedagang dan menahan uang selama 1 hingga 3 hari kerja sebelum dikirim ke rekening.",
          "AliBank mensponsori biaya transaksi merchant melalui cadangan likuiditas jaringan ALX. Pelanggan dapat membayar menggunakan kode QRIS standar nasional atau menempelkan kartu nirsentuh (e-money Mandiri, Flazz, debit) ke ponsel ber-NFC milik kasir.",
          "Dana penjualan langsung masuk secara seketika (<200ms) tanpa potongan biaya apa pun, siap digunakan untuk membayar pemasok atau ditabung untuk memperoleh bunga.",
        ],
      },

      // 9. KYC & Security Tiers
      {
        id: "kyc-tiers",
        category: "banking",
        tagEn: "IDENTITY VERIFICATION",
        tagId: "VERIFIKASI IDENTITAS",
        questionEn: "What are the KYC identity verification requirements and daily withdrawal limits?",
        questionId: "Apa syarat verifikasi identitas (KYC) dan batas limit penarikan harian?",
        keyTakeawayEn: "Unverified accounts can hold balances; verified accounts unlock unlimited banking and daily limits up to Rp 100.000.000.",
        keyTakeawayId: "Akun baru dapat menampung saldo; akun terverifikasi KYC membuka penarikan hingga Rp 100.000.000/hari.",
        answerEn: [
          "To comply with international anti-money laundering and counter-terrorist financing (APU-PPT) regulations, AliBank employs a tiered identity verification framework.",
          "Tier 1 (Standard): Basic email and phone authentication allows internal micro-transfers and Web3 connectivity.",
          "Tier 2 (Verified Citizen): National Identity Card (KTP/Passport) and biometric facial liveness verification unlocks daily withdrawals up to Rp 100,000,000, PayPal wire out, and direct smart contract staking.",
          "All personal identification documents are encrypted with AES-256-GCM algorithms in isolated hardware vaults with zero third-party data sharing.",
        ],
        answerId: [
          "Guna memenuhi regulasi pencegahan pencucian uang dan pendanaan terorisme (APU-PPT), AliBank menerapkan sistem verifikasi berjenjang yang aman.",
          "Tier 1 (Standar): Pendaftaran nomor telepon dan email aktif memungkinkan transfer internal nominal kecil dan koneksi Web3.",
          "Tier 2 (Nasabah Terverifikasi): Unggah foto e-KTP/Paspor dan verifikasi biometrik wajah membuka batas penarikan hingga Rp 100.000.000 per hari, transfer antarbank instan, dan hak akses staking smart contract.",
          "Seluruh dokumen pribadi dienkripsi menggunakan sandi militer AES-256-GCM pada klaster server terisolasi tanpa pernah dijual ke pihak ketiga.",
        ],
        actionLink: {
          href: "/settings/kyc",
          labelEn: "Check Your KYC Status →",
          labelId: "Cek Status Verifikasi KYC →",
        },
      },

      // 10. Ethereum 12% APY Vault
      {
        id: "eth-yield-origin",
        category: "tokenomics",
        tagEn: "DEFI LIQUIDITY ACCRUAL",
        tagId: "DIVIDEN LIKUIDITAS DEFI",
        questionEn: "How is the 12.00% APY Ethereum Yield Vault generated sustainably?",
        questionId: "Dari mana asal dividen 12,00% APY Brankas Ethereum secara berkelanjutan?",
        keyTakeawayEn: "Yield originates from on-chain liquidity protocol routing, network settlement fees, and institutional market making.",
        keyTakeawayId: "Dividen bersumber dari biaya kliring transaksi jaringan, routing likuiditas, dan penyediaan likuiditas resmi.",
        answerEn: [
          "Unlike collapsed lending programs that gambled customer deposits on unsecured hedge fund loans, AliBank's Ethereum Liquidity Vault operates on deterministic protocol mechanics.",
          "Yield is generated from network transaction routing fees, cross-chain bridge liquidity rebates, and decentralized market making spreads on Polygon and Ethereum.",
          "Accruals are calculated per Ethereum block and distributed programmatically by verified smart contracts (0x56268032A3B3E64CFeF1916d591087CF8dF40945) without human manipulation.",
        ],
        answerId: [
          "Berbeda dari platform pinjaman bermasalah yang mempertaruhkan uang nasabah ke spekulasi berisiko tinggi, Brankas Likuiditas Ethereum AliBank beroperasi dengan formula matematika pasti.",
          "Imbal hasil dividen berasal dari bagi hasil biaya transaksi jaringan, selisih kurs routing likuiditas lintas rantai, dan komisi penyedia likuiditas pasar resmi di Polygon dan Ethereum.",
          "Akumulasi dividen dihitung per blok Ethereum dan didistribusikan secara otomatis oleh smart contract resmi (0x56268032A3B3E64CFeF1916d591087CF8dF40945) tanpa intervensi manual.",
        ],
        actionLink: {
          href: `https://etherscan.io/address/${ETH_VAULT_CONTRACT}`,
          labelEn: "Audit Vault Smart Contract →",
          labelId: "Audit Smart Contract Brankas →",
          isExternal: true,
        },
      },
    ],
    []
  );

  const filteredFaq = useMemo(() => {
    return faqList.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        searchQuery === "" ||
        item.questionEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.questionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answerEn.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.answerId.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.tagEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tagId.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [faqList, activeCategory, searchQuery]);

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

            {/* FEATURES Trigger */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "features" ? null : "features")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "features" ? "text-[#111111]" : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{lang === "en" ? "FEATURES" : "FITUR"}</span>
              </button>
              {activeMegaMenu === "features" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* FAQ Trigger (Active Page: Permanent Gold Underline) */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "faq" ? null : "faq")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "faq" ? "text-[#111111]" : "text-black font-black hover:text-black"
                )}
              >
                <span>FAQ</span>
              </button>
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
            </div>
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
            MEGA MENUS (LEARN, ECOSYSTEM, NETWORK, FEATURES, FAQ)
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
                    <li><NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "What is AliBank?" : "Apa itu AliBank?"}</NextLink></li>
                    <li><NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "How is AliBank different from ALX?" : "Apa beda AliBank dengan ALX?"}</NextLink></li>
                    <li><NextLink href="/learn?category=wallet" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "What are TrustWallet Core standards?" : "Apa itu standar TrustWallet Core?"}</NextLink></li>
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
                    <li><NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">{lang === "en" ? "Zero-Tolerance AML Policy" : "Kebijakan Nol-Toleransi AML"}</NextLink></li>
                    <li><NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Real-Time Anomaly Detection" : "Deteksi Saldo Hantu Real-Time"}</NextLink></li>
                    <li><NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block">{lang === "en" ? "Explore AML Engine →" : "Pelajari Mesin AML →"}</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "USING ALIBANK" : "PENGGUNAAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/learn?category=por" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "How to audit Proof of Reserves?" : "Cara audit Bukti Cadangan (PoR)?"}</NextLink></li>
                    <li><NextLink href="/learn?category=architecture" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Why double-entry ledger matters?" : "Mengapa buku besar ganda mutlak?"}</NextLink></li>
                    <li><NextLink href="/learn?category=merchant" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Merchant POS & QRIS acceptance" : "Penerimaan Kasir POS & QRIS"}</NextLink></li>
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
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "WALLETS" : "DOMPET"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">MetaMask Web3 Bridge</NextLink></li>
                    <li><NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">TrustWallet Core (BIP-39/44)</NextLink></li>
                    <li><NextLink href="/ecosystem?category=wallets" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Hardware Wallet Custody</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "NETWORKS & VAULTS" : "JARINGAN & BRANKAS"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Polygon Mainnet (ALX)</NextLink></li>
                    <li><NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Ethereum Liquidity Vault</NextLink></li>
                    <li><NextLink href="/ecosystem?category=networks" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Bitcoin Native SegWit</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "BUILD & MERCHANTS" : "PENGEMBANG & KASIR"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/ecosystem?category=build" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Build with AliBank REST API</NextLink></li>
                    <li><NextLink href="/ecosystem?category=merchant" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Merchant POS & QRIS Terminal</NextLink></li>
                    <li><NextLink href="/ecosystem?category=build" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">Smart Contract Source Code</NextLink></li>
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
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "NETWORK" : "JARINGAN"}</h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "AliBank protocol network information, real-time ledger statistics, multi-chain settlement rails, reserve backing and governance."
                      : "Informasi jaringan protokol AliBank, statistik buku besar real-time, jalur penyelesaian multi-chain, cadangan aset riil, dan tata kelola."}
                  </p>
                  <div className="pt-2">
                    <NextLink href="/network" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline">
                      {lang === "en" ? "Explore Network Hub →" : "Buka Hub Jaringan →"}
                    </NextLink>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "NETWORK INFO" : "INFO JARINGAN"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/network" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Network Statistics" : "Statistik Jaringan"}</NextLink></li>
                    <li><NextLink href="/network#governance-section" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Funding & Governance" : "Pendanaan & Tata Kelola"}</NextLink></li>
                    <li><NextLink href="/network#aip-section" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "AIP Proposals" : "AIP (Proposal Pembaruan)"}</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "ON-CHAIN RAILS" : "JALUR ON-CHAIN"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><a href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`} target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1.5"><span>Polygon ALX Token</span><ExternalLink className="w-3 h-3 text-[#999999]" /></a></li>
                    <li><a href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`} target="_blank" rel="noopener noreferrer" className="hover:text-black flex items-center gap-1.5"><span>Ethereum Liquidity Vault</span><ExternalLink className="w-3 h-3 text-[#999999]" /></a></li>
                    <li><span className="text-[#888888]">Bitcoin Native SegWit (BIP-84)</span></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">{lang === "en" ? "SURVEILLANCE & AML" : "PENGAWASAN & AML"}</h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Zero-Tolerance AML Mandate" : "Mandat Nol Toleransi AML"}</NextLink></li>
                    <li><NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Real-Time Discrepancy Engine" : "Mesin Deteksi Saldo Hantu"}</NextLink></li>
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
                  <h3 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "FEATURES" : "FITUR UNGGULAN"}</h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Engineered for mathematical certainty: hybrid instant banking settlement, cryptographic proof of reserves, self-custody Web3 derivation, and real-time AML surveillance."
                      : "Dirancang untuk kepastian matematis: kliring perbankan instan hibrida, bukti cadangan kriptografis (PoR), kustodi mandiri Web3, dan pengawasan AML real-time."}
                  </p>
                  <div className="pt-2">
                    <NextLink href="/features" onClick={() => setActiveMegaMenu(null)} className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline">
                      {lang === "en" ? "Explore All Features →" : "Jelajahi Semua Fitur →"}
                    </NextLink>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "BANKING & SETTLEMENT" : "PERBANKAN & KLIRING"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/features#instant-transfers" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Instant P2P Transfers (<200ms)" : "Transfer P2P Instan (<200ms)"}</NextLink></li>
                    <li><NextLink href="/features#dual-currency" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Dual-Currency IDR & Crypto" : "Buku Besar Ganda IDR & Kripto"}</NextLink></li>
                    <li><NextLink href="/features#qris-pos" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "0% National QRIS Gateway" : "Gerbang QRIS 0% Biaya"}</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">{lang === "en" ? "SOVEREIGNTY & WEB3" : "KEDAULATAN & WEB3"}</h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/features#trustwallet-core" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "TrustWallet Core BIP-39/44/84" : "Derivasi Kunci BIP-39/44/84"}</NextLink></li>
                    <li><NextLink href="/features#metamask-bridge" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "MetaMask Native Web3 Bridge" : "Jembatan Native MetaMask"}</NextLink></li>
                    <li><NextLink href="/features#yield-vault" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Ethereum 12% APY Yield Vault" : "Brankas Hasil Cerdas Ethereum 12%"}</NextLink></li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">{lang === "en" ? "SECURITY & SOLVENCY" : "KEAMANAN & SOLVENSI"}</h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li><NextLink href="/features#proof-of-reserves" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "1:1 Mathematical Proof of Reserves" : "1:1 Bukti Cadangan Matematis"}</NextLink></li>
                    <li><NextLink href="/features#double-entry" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Double-Entry Constraint Equation" : "Persamaan Buku Besar Ganda"}</NextLink></li>
                    <li><NextLink href="/features#phantom-detection" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">{lang === "en" ? "Phantom Balance Tamper Freeze" : "Pembekuan Saldo Hantu Otomatis"}</NextLink></li>
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
                    <button
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Currently Viewing FAQ Hub ✓" : "Sedang di Hub FAQ ✓"}
                    </button>
                  </div>
                </div>

                {/* Col 2: Legitimacy & Reserves */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "LEGITIMACY & SOLVENCY" : "LEGALITAS & CADANGAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <a href="#legitimacy" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Is AliBank legitimate or a scam?" : "Apakah AliBank resmi atau penipuan?"}
                      </a>
                    </li>
                    <li>
                      <a href="#full-reserve" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "How are deposits backed 1:1?" : "Bagaimana simpanan dijamin 1:1?"}
                      </a>
                    </li>
                    <li>
                      <a href="#withdrawals" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Can I withdraw funds at any time?" : "Bisakah tarik uang kapan saja?"}
                      </a>
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
                      <a href="#diff-alibank-alx" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What is the difference with ALX?" : "Apa perbedaan dengan koin ALX?"}
                      </a>
                    </li>
                    <li>
                      <a href="#trustwallet-integration" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "TrustWallet Core & MetaMask guide" : "Panduan TrustWallet & MetaMask"}
                      </a>
                    </li>
                    <li>
                      <a href="#eth-yield-origin" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Ethereum 12% APY Yield Vault origin" : "Asal dividen 12% APY Ethereum"}
                      </a>
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
                      <a href="#aml-mandate" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-medium text-[#111111] block">
                        {lang === "en" ? "Zero-Tolerance AML Policy" : "Kebijakan Nol-Toleransi AML"}
                      </a>
                    </li>
                    <li>
                      <a href="#double-entry" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "What is a 'Phantom Balance'?" : "Apa itu 'Saldo Hantu'?"}
                      </a>
                    </li>
                    <li>
                      <a href="#merchant-fees" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "0% QRIS & SoftPOS merchant terms" : "Ketentuan QRIS 0% & SoftPOS"}
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
          2. HERO SECTION (Editorial Serif + Guilloche Sunburst Watermark + Key Badges)
          ========================================================================= */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-[#ECE7DE]">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 w-[540px] h-[540px] md:w-[700px] md:h-[700px] pointer-events-none opacity-[0.07]">
          <svg viewBox="0 0 400 400" className="w-full h-full text-black" fill="none" stroke="currentColor" strokeWidth="0.75">
            <circle cx="200" cy="200" r="190" strokeDasharray="3 3" />
            <circle cx="200" cy="200" r="140" />
            <circle cx="200" cy="200" r="90" strokeDasharray="2 2" />
            <circle cx="200" cy="200" r="40" />
            {FAQ_GUILLOCHE_RAYS.map((ray, i) => (
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
                ? "RADICAL FINANCIAL TRANSPARENCY"
                : "TRANSPARANSI KEUANGAN RADIKAL"}
            </span>
          </div>

          {/* Headline */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#111111] leading-[1.08]">
              {lang === "en"
                ? "Frequently Asked Questions."
                : "Pertanyaan yang Sering Diajukan."}
            </h1>
            <p className="text-base sm:text-xl text-[#555555] font-light leading-relaxed max-w-3xl">
              {lang === "en"
                ? "Clear, unequivocal answers regarding AliBank's hybrid neo-banking architecture, mathematical 1:1 reserves, anti-money laundering compliance, and token utility."
                : "Jawaban tegas dan transparan seputar arsitektur neobank hibrida AliBank, kepastian cadangan matematis 1:1, kepatuhan anti-pencucian uang (AML), dan utilitas koin ALX."}
            </p>
          </div>

          {/* 4 Quick Assurance Metric Cards */}
          <div className="pt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 border-t border-[#DFDAD0]">
            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "RESERVE SOLVENCY" : "SOLVENSI CADANGAN"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#10B981]">
                100.00%
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Zero fractional lending" : "Cadangan penuh tanpa spekulasi"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "WITHDRAWAL ACCESS" : "PENARIKAN DANA"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#111111]">
                24/7/365
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Liquid on-demand withdrawals" : "Penarikan instan tanpa masa kunci"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "TRANSACTION FEES" : "BIAYA TRANSFER"}
              </span>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-[#F4B728]">
                0.00%
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "Sponsored internal P2P & QRIS" : "Bebas biaya antar sesama akun"}
              </p>
            </div>

            <div className="p-4 sm:p-5 bg-white border border-[#DFDAD0] rounded-sm space-y-1">
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#777777] block">
                {lang === "en" ? "CONTRACT AUDIT" : "AUDIT KONTRAK"}
              </span>
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#111111]">
                Polygonscan
              </p>
              <p className="text-[11px] text-[#666666] font-light">
                {lang === "en" ? "100% verified open-source" : "Terverifikasi di penjelajah publik"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CATEGORY FILTER TABS & SEARCH BAR
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
          <div className="relative min-w-[260px] sm:min-w-[320px]">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === "en"
                  ? "Search questions, legitimacy, contracts..."
                  : "Cari pertanyaan, legalitas, kontrak..."
              }
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#DFDAD0] focus:border-[#111111] rounded-sm text-xs text-[#111111] placeholder:text-[#999999] outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ACCORDION FAQ QUESTIONS LIST
          ========================================================================= */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1280px] mx-auto px-6 space-y-10">
          {/* Results Counter */}
          <div className="flex items-center justify-between text-xs text-[#777777] font-medium border-b border-[#ECE7DE] pb-4">
            <span>
              {lang === "en"
                ? `Showing ${filteredFaq.length} of ${faqList.length} Verified Answers`
                : `Menampilkan ${filteredFaq.length} dari ${faqList.length} Jawaban Resmi`}
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

          {/* Accordion List */}
          <div className="space-y-4">
            {filteredFaq.map((item) => {
              const isOpen = !!openFaqIds[item.id];
              return (
                <div
                  key={item.id}
                  id={item.id}
                  className={cn(
                    "rounded-sm border transition-all duration-200 scroll-mt-28 overflow-hidden",
                    item.isHighlight === "gold"
                      ? "bg-[#FAF5E6] border-[#E8DAB7] shadow-sm"
                      : item.isHighlight === "crimson"
                      ? "bg-[#FFF1F2] border-[#FECDD3] shadow-sm"
                      : item.isHighlight === "dark"
                      ? "bg-[#151216] text-white border-[#38333D] shadow-sm"
                      : "bg-white border-[#DFDAD0] hover:border-[#111111] shadow-sm"
                  )}
                >
                  {/* Question Header Button */}
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full p-6 sm:p-7 text-left flex items-start justify-between gap-6 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-bold tracking-[0.2em] uppercase px-2 py-0.5 rounded-[2px]",
                            item.isHighlight === "dark"
                              ? "bg-white/10 text-[#F4B728]"
                              : item.isHighlight === "crimson"
                              ? "bg-[#E11D48]/10 text-[#E11D48]"
                              : "bg-[#F4F1EA] text-[#666666]"
                          )}
                        >
                          {lang === "en" ? item.tagEn : item.tagId}
                        </span>
                      </div>
                      <h3
                        className={cn(
                          "font-serif text-xl sm:text-2xl font-bold tracking-tight transition-colors",
                          item.isHighlight === "dark"
                            ? "text-white group-hover:text-[#F4B728]"
                            : "text-[#111111] group-hover:text-[#F4B728]"
                        )}
                      >
                        {lang === "en" ? item.questionEn : item.questionId}
                      </h3>
                    </div>

                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 mt-1",
                        item.isHighlight === "dark" ? "bg-white/10 text-white" : "bg-[#F4F1EA] text-[#444444]",
                        isOpen && "rotate-180 bg-[#111111] text-white"
                      )}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isOpen && (
                    <div
                      className={cn(
                        "px-6 pb-6 sm:px-7 sm:pb-7 space-y-4 text-sm sm:text-base font-light leading-relaxed animate-in fade-in duration-200 border-t",
                        item.isHighlight === "dark"
                          ? "border-white/10 text-[#CCCCCC]"
                          : "border-[#ECE7DE] text-[#444444]"
                      )}
                    >
                      {/* Key Takeaway Banner */}
                      {(item.keyTakeawayEn || item.keyTakeawayId) && (
                        <div
                          className={cn(
                            "p-3.5 rounded-sm text-xs font-semibold flex items-center gap-2.5 mt-4",
                            item.isHighlight === "dark"
                              ? "bg-black/40 border border-white/10 text-white"
                              : item.isHighlight === "crimson"
                              ? "bg-white border border-[#FECDD3] text-[#E11D48]"
                              : "bg-white border border-[#E8DAB7] text-[#111111]"
                          )}
                        >
                          <Check className="w-4 h-4 shrink-0 text-[#10B981]" />
                          <span>{lang === "en" ? item.keyTakeawayEn : item.keyTakeawayId}</span>
                        </div>
                      )}

                      {/* Paragraphs */}
                      <div className="space-y-3 pt-2">
                        {(lang === "en" ? item.answerEn : item.answerId).map((paragraph, pIdx) => (
                          <p key={pIdx}>{paragraph}</p>
                        ))}
                      </div>

                      {/* Action Link if available */}
                      {item.actionLink && (
                        <div className="pt-4 border-t border-[#ECE7DE]/50">
                          {item.actionLink.isExternal ? (
                            <a
                              href={item.actionLink.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "text-xs font-bold tracking-wider inline-flex items-center gap-1.5 transition-colors underline underline-offset-4",
                                item.isHighlight === "dark" ? "text-white hover:text-[#F4B728]" : "text-black hover:text-[#F4B728]"
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
                                item.isHighlight === "dark" ? "text-white hover:text-[#F4B728]" : "text-black hover:text-[#F4B728]"
                              )}
                            >
                              <span>{lang === "en" ? item.actionLink.labelEn : item.actionLink.labelId}</span>
                            </NextLink>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. STILL HAVE QUESTIONS? COMPLIANCE & SUPPORT DESK
          ========================================================================= */}
      <section className="py-20 md:py-28 bg-[#151216] text-white border-y border-[#38333D]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12 text-center">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#F4B728] uppercase">
              {lang === "en" ? "INSTITUTIONAL ASSISTANCE" : "BANTUAN KELAS INSTITUSI"}
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-white">
              {lang === "en"
                ? "Still have architectural or legal questions?"
                : "Masih memiliki pertanyaan arsitektur atau legalitas?"}
            </h2>
            <p className="text-base text-[#AAAAAA] font-light leading-relaxed">
              {lang === "en"
                ? "Our compliance and engineering desks are available for regulatory audits, institutional onboarding, and merchant POS integrations."
                : "Tim kepatuhan dan teknis kami siap membantu audit regulasi, integrasi perbankan korporasi, serta penyediaan terminal kasir merchant."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            <div className="p-6 bg-white/5 border border-white/10 rounded-sm space-y-3">
              <ShieldCheck className="w-6 h-6 text-[#10B981]" />
              <h4 className="font-serif text-lg font-bold text-white">
                {lang === "en" ? "Compliance & AML Desk" : "Layanan Kepatuhan & AML"}
              </h4>
              <p className="text-xs text-[#888888] font-light leading-relaxed">
                {lang === "en"
                  ? "Formal regulatory inquiries, APU-PPT forensic disclosures, and account reviews."
                  : "Konsultasi regulasi APU-PPT, audit transparansi, dan peninjauan status pembekuan akun."}
              </p>
              <div className="pt-2 font-mono text-xs text-[#F4B728]">
                compliance@alibank.tarroz.com
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-sm space-y-3">
              <Building2 className="w-6 h-6 text-[#F4B728]" />
              <h4 className="font-serif text-lg font-bold text-white">
                {lang === "en" ? "Merchant & POS Solutions" : "Layanan Kasir & Merchant"}
              </h4>
              <p className="text-xs text-[#888888] font-light leading-relaxed">
                {lang === "en"
                  ? "Integrate zero-fee QRIS and contactless SoftPOS NFC directly into your retail chain."
                  : "Integrasikan fasilitas QRIS 0% biaya dan SoftPOS NFC langsung ke toko ritel Anda."}
              </p>
              <div className="pt-2 font-mono text-xs text-[#F4B728]">
                merchant@alibank.tarroz.com
              </div>
            </div>

            <div className="p-6 bg-white/5 border border-white/10 rounded-sm space-y-3">
              <HelpCircle className="w-6 h-6 text-white" />
              <h4 className="font-serif text-lg font-bold text-white">
                {lang === "en" ? "24/7 Private Client Support" : "Bantuan Nasabah Privat 24/7"}
              </h4>
              <p className="text-xs text-[#888888] font-light leading-relaxed">
                {lang === "en"
                  ? "Direct assistance with fiat deposits, Web3 wallet pairing, and yield vault management."
                  : "Pendampingan langsung setoran rupiah, koneksi dompet Web3, dan pencairan tabungan."}
              </p>
              <div className="pt-2 font-mono text-xs text-[#F4B728]">
                support@alibank.tarroz.com
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. VERIFIED SMART CONTRACTS AUDIT
          ========================================================================= */}
      <section className="py-16 md:py-20 bg-[#F4F1EA] border-t border-[#DFDAD0]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#777777]">
                {lang === "en" ? "PUBLIC VERIFICATION" : "VERIFIKASI PUBLIK"}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111]">
                {lang === "en" ? "Verified On-Chain Smart Contracts" : "Smart Contract On-Chain Resmi"}
              </h3>
            </div>
            <span className="text-xs text-[#666666] font-light">
              {lang === "en"
                ? "Verify contract source code on Polygonscan and Etherscan."
                : "Periksa kode sumber kontrak di Polygonscan dan Etherscan."}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          7. INSTITUTIONAL FOOTER
          ========================================================================= */}
      <footer className="bg-[#0A0D10] text-[#888888] py-16 border-t border-[#1F2630]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
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

            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-white">
                {lang === "en" ? "RESOURCES" : "SUMBER DAYA"}
              </h4>
              <ul className="space-y-2 text-xs text-[#AAAAAA]">
                <li><NextLink href="/features" className="hover:text-white transition-colors">Features Hub</NextLink></li>
                <li><NextLink href="/network" className="hover:text-white transition-colors">Network Statistics</NextLink></li>
                <li><NextLink href="/faq" className="hover:text-white transition-colors">Frequently Asked Questions</NextLink></li>
                <li><NextLink href="/use-alibank" className="hover:text-white transition-colors">How to Use</NextLink></li>
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

export default function FaqPage() {
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
      <FaqContent />
    </Suspense>
  );
}
