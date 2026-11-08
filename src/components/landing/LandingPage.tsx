"use client";

import React, { useState, useMemo } from "react";
import Link from "next/navigation";
import NextLink from "next/link";
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Globe,
  Coins,
  Building2,
  Cpu,
  ArrowRight,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Zap,
  Key,
  RefreshCw,
  Award,
  Smartphone,
  Wallet,
  ChevronRight,
  HelpCircle,
  Users,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  Scale,
  FileCheck2,
  Database,
  QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LogoIcon } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onEnterApp?: () => void;
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const [lang, setLang] = useState<"id" | "en">("id");
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const t = useMemo(() => {
    return lang === "id"
      ? {
          // Nav
          navAbout: "Tentang",
          navProof: "Bukti Cadangan (PoR)",
          navSecurity: "Keamanan",
          navFeatures: "Fitur",
          navFaq: "FAQ",
          navSignIn: "Masuk",
          navRegister: "Buka Rekening",
          // Hero
          heroBadge: "MAINNET LIVE • 100% SOLVENSI TERVERIFIKASI",
          heroTitle1: "Perbankan Digital Hibrida",
          heroTitle2: "Kecepatan Neobank. Transparansi Blockchain.",
          heroDesc:
            "AliBank bukan platform investasi abal-abal atau skema cepat kaya. Kami adalah infrastruktur keuangan modern yang menggabungkan buku besar perbankan ganda (Double-Entry Ledger), cadangan likuiditas riil 1:1, dan dompet multi-chain desentralisasi standar TrustWallet Core (Polygon, Ethereum, Bitcoin SegWit).",
          heroCta1: "Buka Rekening Digital (Gratis)",
          heroCta2: "Periksa Bukti On-Chain",
          // Stats
          stat1Label: "Solvensi Cadangan Kas & Aset",
          stat1Val: "100% 1:1",
          stat2Label: "Biaya Transfer P2P Antar-Nasabah",
          stat2Val: "Rp 0 (Bebas Biaya)",
          stat3Label: "Jaringan Multi-Chain Native",
          stat3Val: "Polygon • ETH • BTC",
          stat4Label: "Waktu Penyelesaian Transaksi",
          stat4Val: "< 1 Detik Realtime",
          // Anti-Scam Section
          whyNotScamTitle: "Mengapa AliBank 100% Nyata & Bukan Scam / Penipuan?",
          whyNotScamSubtitle:
            "Di era maraknya aplikasi bodong berkedok investasi, AliBank hadir dengan transparansi kriptografi mutlak di mana Anda tidak perlu 'percaya', melainkan bisa 'membuktikan sendiri' di blockchain publik.",
          proof1Title: "Cadangan 1:1 (Proof-of-Reserves)",
          proof1Desc:
            "Setiap saldo IDR dan kripto nasabah dicadangkan 100% di brankas likuiditas nyata dan smart contract publik. Kami tidak meminjamkan dana Anda secara sembunyi-sembunyi seperti bank konvensional (Fractional Reserve).",
          proof2Title: "Smart Contract Terverifikasi Publik",
          proof2Desc:
            "Kontrak token ALX dan Brankas Ethereum AliBank terdaftar resmi di blockchain publik (Polygonscan & Etherscan). Siapa pun di seluruh dunia dapat mengaudit saldo dan kode sumbernya secara langsung.",
          proof3Title: "Kriptografi Standar TrustWallet Core",
          proof3Desc:
            "Alamat dompet nasabah diturunkan menggunakan standar internasional BIP-39, BIP-44, dan BIP-84 Bitcoin SegWit (bc1q...). Alamat yang Anda miliki di AliBank identik dan kompatibel dengan TrustWallet & MetaMask.",
          proof4Title: "Kedaulatan Dompet Non-Kustodial",
          proof4Desc:
            "Anda dapat menghubungkan dompet Web3 pribadi (MetaMask) Anda ke AliBank. Dana Anda tidak pernah 'disandera'; Anda bebas menyetor dan menarik aset kapan pun tanpa syarat member get member.",
          // Comparison
          compTitle: "Perbandingan Nyata: Platform Bodong vs Bank Lama vs AliBank",
          colScam: "Platform Bodong / Ponzi",
          colBank: "Bank Konvensional",
          colAli: "AliBank V3 Hybrid",
          compRow1: "Bukti Kepemilikan Dana",
          compRow1Scam: "Angka palsu di layar tanpa aset riil",
          compRow1Bank: "Tergantung laporan berkala bank",
          compRow1Ali: "Bisa diaudit detik ini juga di Polygonscan & Etherscan",
          compRow2: "Biaya Transfer & Kecepatan",
          compRow2Scam: "Biaya penarikan dipersulit",
          compRow2Bank: "Biaya admin bulanan & antar-bank",
          compRow2Ali: "P2P Rp0 bebas biaya & instan < 1 detik",
          compRow3: "Sumber Keuntungan Yield",
          compRow3Scam: "Uang dari setoran anggota baru (Pasti Runtuh)",
          compRow3Bank: "Bunga tabungan minim (< 1% per tahun)",
          compRow3Ali: "Fee kliring nyata, volume transaksi merchant & DeFi",
          compRow4: "Koneksi ke Web3 / Dompet Luar",
          compRow4Scam: "Tidak ada (database manipulatif)",
          compRow4Bank: "Tidak mendukung kripto",
          compRow4Ali: "Bisa dihubungkan langsung ke MetaMask & TrustWallet",
          // Features
          featTitle: "Ekosistem Finansial Terpadu Kelas Dunia",
          featSubtitle: "Semua kebutuhan perbankan harian dan aset masa depan Anda dalam satu genggaman.",
          feat1Title: "Rekening Multi-Mata Uang & Kripto",
          feat1Desc: "Kelola Rupiah (IDR), Tether (USDT), Bitcoin (BTC), Ethereum (ETH), dan Alix Coin (ALX) dalam satu nomor akun terpadu (UID 88...).",
          feat2Title: "Transfer P2P Tanpa Biaya",
          feat2Desc: "Kirim Rupiah dan koin ke sesama pengguna AliBank secara instan tanpa biaya transfer apa pun menggunakan nomor UID atau email.",
          feat3Title: "Tabungan Yield Berbunga Harian",
          feat3Desc: "Dapatkan imbal hasil tabungan riil 7% hingga 12% APY yang dihitung prorata harian dan dapat ditarik kapan saja tanpa denda.",
          feat4Title: "Solusi Merchant POS & Kasir Toko",
          feat4Desc: "Bagi pemilik usaha: terima pembayaran kasir via kartu tap NFC, QRIS, dan kripto dengan settlement real-time ke rekening Anda.",
          feat5Title: "MetaMask Web3 Native Bridge",
          feat5Desc: "Integrasi dua arah antara akun perbankan internal dengan dompet terdesentralisasi Anda di blockchain Polygon dan Ethereum.",
          feat6Title: "Inflow Gateway Lengkap",
          feat6Desc: "Dukungan setoran via Midtrans Snap, iPaymu, DOKU, PayPal, Virtual Account BCA/BRI/Mandiri, dan setoran on-chain otomatis.",
          // Contracts
          contractsTitle: "Transparansi On-Chain: Verifikasi Sendiri di Blockchain",
          contractsSubtitle: "Kami membuka alamat kontrak publik agar Anda dapat memeriksa likuiditas langsung di penjelajah blok resmi.",
          alxBadge: "Polygon Mainnet (ERC-20)",
          alxDesc: "Token utilitas utama AliBank dengan total pasokan terbatas.",
          vaultBadge: "Ethereum Mainnet (Smart Contract)",
          vaultDesc: "Kontrak Brankas Kustodian AliBank untuk pengamanan cadangan kas institusional.",
          usdtBadge: "Polygon USDT (Tether Resmi)",
          usdtDesc: "Stablecoin cadangan USD terverifikasi untuk lindung nilai nilai tukar.",
          btnViewExplorer: "Buka di Explorer",
          // Security
          secTitle: "Arsitektur Keamanan Standar Perbankan",
          sec1: "Enkripsi Berlapis AES-256 GCM pada seluruh komunikasi data dan penyimpanan dokumen.",
          sec2: "Mesin Buku Besar Ganda (Double-Entry Ledger) yang mencegah saldo hantu atau manipulasi sepihak.",
          sec3: "Dukungan Jaringan Privat Tor untuk perlindungan privasi dan anonimitas tingkat tinggi.",
          sec4: "Sistem Anti-Fraud Otomatis dengan pemantauan anomali mutasi 24 jam sehari.",
          // FAQ
          faqTitle: "Pertanyaan yang Sering Diajukan (FAQ)",
          faqSubtitle: "Jawaban lugas dan transparan untuk pertanyaan paling kritis tentang AliBank.",
          faq1Q: "Apakah AliBank ini aplikasi investasi bodong atau skema Ponzi?",
          faq1A:
            "Sama sekali BUKAN. Skema Ponzi membayar anggota lama menggunakan uang anggota baru dan tidak memiliki produk riil atau aset cadangan. AliBank adalah platform perbankan digital dan gerbang pembayaran (payment platform). Di AliBank, seluruh saldo nasabah dicadangkan 1:1 di brankas kas riil dan blockchain publik. AliBank tidak pernah mewajibkan mencari member baru ('member-get-member') untuk mencairkan saldo.",
          faq2Q: "Bagaimana cara saya membuktikan koin AliBank benar-benar ada di Blockchain?",
          faq2A:
            "Anda dapat langsung membuka tautan resmi Polygonscan untuk kontrak ALX Coin (0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd). Di sana Anda bisa melihat seluruh pasokan koin, pemegang koin, dan transaksi secara publik dan tidak dapat dipalsukan oleh siapa pun.",
          faq3Q: "Apakah saya bisa menarik uang saya ke rekening bank lokal atau e-wallet di Indonesia?",
          faq3A:
            "YA, PASTI BISA. AliBank terintegrasi dengan jaringan perbankan Indonesia (BCA, Mandiri, BNI, BRI) serta e-wallet terkemuka (GoPay, OVO, DANA). Anda dapat melakukan penarikan rupiah kapan saja melalui menu Tarik Tunai atau mencairkan koin kripto Anda langsung ke dompet eksternal.",
          faq4Q: "Apakah AliBank mendukung dompet Web3 pribadi seperti MetaMask dan TrustWallet?",
          faq4A:
            "YA. AliBank memiliki fitur 'MetaMask Web3 Native Bridge'. Anda dapat menghubungkan dompet pribadi Anda untuk menyetor dan menarik aset on-chain. Selain itu, generator alamat internal AliBank menggunakan algoritma TrustWallet Core (BIP-39/44/84) sehingga kompatibel secara kriptografis.",
          faq5Q: "Dari mana asal bunga Tabungan Yield AliBank?",
          faq5A:
            "Bunga Tabungan Yield AliBank (7% - 12% APY) bersumber dari pembagian keuntungan riil likuiditas: biaya pedagang (Merchant MDR) dari transaksi POS/QRIS toko, spread pertukaran valuta asing & kripto, dan hasil yield kontrak staking di Ethereum/Polygon. Ini murni perputaran ekonomi produktif, bukan perputaran uang member.",
          // CTA
          ctaTitle: "Mulai Pengalaman Perbankan Cerdas & Transparan Hari Ini",
          ctaDesc: "Buka rekening AliBank dalam 2 menit. Rasakan perbankan tanpa biaya tersembunyi dengan keamanan blockchain kelas dunia.",
          ctaBtn: "Daftar Akun AliBank Sekarang",
          ctaLogin: "Sudah memiliki akun? Masuk di sini",
          // Footer
          footerDisclaimer:
            "Pernyataan Risiko: AliBank adalah platform finansial digital hibrida. Nilai aset kripto dapat berfluktuasi berdasarkan dinamika pasar global. Layanan kustodian dilindungi oleh pembukuan ganda dan bukti cadangan on-chain 1:1. AliBank berkomitmen penuh pada transparansi, perlindungan nasabah, dan pencegahan penipuan finansial.",
          footerRights: "Hak Cipta Dilindungi Undang-Undang. AliBank V3 Financial Network.",
        }
      : {
          // Nav
          navAbout: "About",
          navProof: "Proof of Reserves",
          navSecurity: "Security",
          navFeatures: "Features",
          navFaq: "FAQ",
          navSignIn: "Sign In",
          navRegister: "Open Account",
          // Hero
          heroBadge: "MAINNET LIVE • 100% VERIFIED SOLVENCY",
          heroTitle1: "The Hybrid Digital Banking",
          heroTitle2: "Neobank Velocity. Blockchain Transparency.",
          heroDesc:
            "AliBank is not a speculative scheme. We are institutional-grade financial infrastructure engineered with strict double-entry ledger accounting, 1:1 verified solvency reserves, and native TrustWallet Core multi-chain architecture (Polygon, Ethereum, Bitcoin SegWit).",
          heroCta1: "Open Digital Account (Free)",
          heroCta2: "Inspect On-Chain Proof",
          // Stats
          stat1Label: "Cash & Asset Reserve Solvency",
          stat1Val: "100% 1:1 Backed",
          stat2Label: "Internal P2P Transfer Fee",
          stat2Val: "$0.00 (Zero Fee)",
          stat3Label: "Native Multi-Chain Networks",
          stat3Val: "Polygon • ETH • BTC",
          stat4Label: "Transaction Settlement Speed",
          stat4Val: "< 1 Sec Realtime",
          // Anti-Scam Section
          whyNotScamTitle: "Why AliBank is 100% Genuine & Not a Scam Platform",
          whyNotScamSubtitle:
            "In an era of counterfeit schemes and empty investment promises, AliBank stands on immutable cryptographic transparency. You do not need to take our word for it—you can verify everything on the public blockchain.",
          proof1Title: "1:1 Proof-of-Reserves",
          proof1Desc:
            "Every fiat and crypto balance is 100% backed in verifiable central liquidity vaults and public smart contracts. We do not engage in hidden fractional-reserve lending.",
          proof2Title: "Publicly Verified Smart Contracts",
          proof2Desc:
            "AliBank ALX token contracts and Ethereum Vault contracts are publicly registered on Polygonscan and Etherscan. Anyone worldwide can inspect balances, code, and transactions in real time.",
          proof3Title: "TrustWallet Core Cryptography",
          proof3Desc:
            "Customer wallet addresses are generated using international standards: BIP-39, BIP-44, and BIP-84 Bitcoin SegWit (bc1q...). Addresses generated on AliBank are fully compatible with TrustWallet & MetaMask.",
          proof4Title: "Non-Custodial Sovereignty",
          proof4Desc:
            "Connect your personal Web3 wallet (MetaMask) anytime. Your assets are never locked or conditioned on referral schemes ('member-get-member'). Deposit and withdraw freely.",
          // Comparison
          compTitle: "Real Comparison: Ponzi Scams vs Legacy Banks vs AliBank",
          colScam: "Fraudulent / Ponzi Scams",
          colBank: "Traditional Legacy Banks",
          colAli: "AliBank V3 Hybrid",
          compRow1: "Proof of Asset Ownership",
          compRow1Scam: "Fake numbers on screen without reserves",
          compRow1Bank: "Opaque periodic bank statements",
          compRow1Ali: "Publicly auditable right now on Polygonscan & Etherscan",
          compRow2: "Transfer Fees & Speed",
          compRow2Scam: "Withdrawals withheld or delayed",
          compRow2Bank: "High wire fees & multi-day clearing",
          compRow2Ali: "P2P instant < 1 sec with zero transaction fees",
          compRow3: "Yield Generation Source",
          compRow3Scam: "Money taken from newer members (Doomed to collapse)",
          compRow3Bank: "Negligible deposit interest (< 1% APY)",
          compRow3Ali: "Real merchant POS MDR fees, FX spreads & staking yield",
          compRow4: "Web3 / External Wallet Connectivity",
          compRow4Scam: "None (Closed manipulated database)",
          compRow4Bank: "Crypto prohibited or heavily restricted",
          compRow4Ali: "Direct bridge to MetaMask & TrustWallet",
          // Features
          featTitle: "Unified World-Class Financial Ecosystem",
          featSubtitle: "All your everyday banking and decentralized wealth management in one cohesive platform.",
          feat1Title: "Multi-Currency & Digital Asset Account",
          feat1Desc: "Manage Indonesian Rupiah (IDR), Tether (USDT), Bitcoin (BTC), Ethereum (ETH), and Alix Coin (ALX) under one unified UID (88...).",
          feat2Title: "Zero-Fee Instant P2P Payments",
          feat2Desc: "Send fiat or digital assets to any fellow AliBank user instantly with 0 transaction fees using their UID or email.",
          feat3Title: "High-Yield Daily Compounding Savings",
          feat3Desc: "Earn competitive 7% to 12% APY backed by commercial merchant processing volume, with daily compounding and no lockup traps.",
          feat4Title: "Enterprise Merchant POS & SoftPOS",
          feat4Desc: "For business merchants: accept contactless NFC cards, QRIS, and crypto at retail terminals with instant ledger settlement.",
          feat5Title: "MetaMask Web3 Native Bridge",
          feat5Desc: "Bi-directional bridge connecting your custodial account with self-custody Web3 wallets across Polygon and Ethereum.",
          feat6Title: "Comprehensive Inflow Gateways",
          feat6Desc: "Deposit via Midtrans Snap, iPaymu, DOKU, PayPal, Virtual Accounts, and automated multi-node on-chain deposit listeners.",
          // Contracts
          contractsTitle: "On-Chain Transparency: Verify Directly on the Blockchain",
          contractsSubtitle: "We openly publish our public contract addresses so you can verify our liquidity and source code on official explorers.",
          alxBadge: "Polygon Mainnet (ERC-20)",
          alxDesc: "Primary utility token of the AliBank ecosystem with mathematically capped total supply.",
          vaultBadge: "Ethereum Mainnet (Smart Contract)",
          vaultDesc: "AliBank Custodial Vault Smart Contract engineered for institutional reserve solvency.",
          usdtBadge: "Polygon USDT (Official Tether)",
          usdtDesc: "Official USD stablecoin reserve providing rock-solid exchange rate stabilization.",
          btnViewExplorer: "View on Explorer",
          // Security
          secTitle: "Bank-Grade Security Architecture",
          sec1: "Multi-layer AES-256 GCM encryption safeguarding all transaction channels and user identities.",
          sec2: "Double-Entry Atomic Ledger Engine preventing phantom balances, race conditions, or unilateral edits.",
          sec3: "Native Tor Network routing support for state-of-the-art privacy and anti-surveillance protection.",
          sec4: "Autonomous 24/7 Anti-Fraud Reconciliation Engine actively auditing balance integrity in real time.",
          // FAQ
          faqTitle: "Frequently Asked Questions (FAQ)",
          faqSubtitle: "Direct, transparent answers addressing the most critical questions about AliBank.",
          faq1Q: "Is AliBank a scam, fraudulent app, or Ponzi scheme?",
          faq1A:
            "Absolutely NOT. Ponzi schemes pay older participants with newer participants' deposits, offer unrealistic guarantees without real assets, and eventually collapse. AliBank is an authentic hybrid digital banking and payment technology platform. All client funds are backed 1:1 by real cash and verifiable on-chain liquidity. AliBank never requires recruitment or referral quotas ('member-get-member') to withdraw your money.",
          faq2Q: "How can I prove that my AliBank coins actually exist on the public blockchain?",
          faq2A:
            "You can directly visit the official Polygonscan explorer for the ALX Coin contract (0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd). There you can verify total supply, holders, and transactions. Everything is transparent, immutable, and mathematically tamper-proof.",
          faq3Q: "Can I withdraw my money to my local bank account or e-wallet?",
          faq3A:
            "YES, WITHOUT RESTRICTIONS. AliBank is integrated with payment settlement networks (BCA, Mandiri, BNI, BRI) and leading electronic wallets. You can withdraw Indonesian Rupiah directly to your verified bank account or transfer your cryptocurrency to external Web3 wallets at any time.",
          faq4Q: "Does AliBank support personal Web3 wallets like MetaMask and TrustWallet?",
          faq4A:
            "YES. AliBank features an active 'MetaMask Web3 Native Bridge'. You can connect your private Web3 wallet to deposit and withdraw on-chain assets. Furthermore, AliBank's internal wallet generation follows TrustWallet Core standards (BIP-39/44/84), ensuring complete cryptographic compatibility.",
          faq5Q: "Where does the yield for AliBank's High-Yield Savings come from?",
          faq5A:
            "AliBank's yield (7% - 12% APY) is generated from authentic, productive financial utility: Merchant Processing MDR fees from retail POS & QRIS terminals, foreign exchange & crypto swap spreads, and verified staking yields on Ethereum/Polygon. It is driven by actual commercial velocity, not incoming user deposits.",
          // CTA
          ctaTitle: "Experience Transparent, Next-Gen Banking Today",
          ctaDesc: "Open your AliBank digital account in less than 2 minutes. Enjoy zero hidden fees with world-class blockchain security.",
          ctaBtn: "Register Your AliBank Account Now",
          ctaLogin: "Already have an account? Sign In",
          // Footer
          footerDisclaimer:
            "Risk Disclaimer: AliBank is a hybrid digital financial technology platform. Cryptocurrency valuations fluctuate in response to global market conditions. Custodial balances are safeguarded by double-entry ledger bookkeeping and 1:1 verifiable on-chain reserves. AliBank is steadfastly committed to transparency, customer asset protection, and the eradication of financial fraud.",
          footerRights: "All Rights Reserved. AliBank V3 Financial Network.",
        };
  }, [lang]);

  // Schema.org Structured Data for Global Search Engines (SEO)
  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FinancialService",
        "@id": "https://alibank.tarroz.com/#organization",
        name: "AliBank",
        alternateName: "AliBank V3 Financial Network",
        url: "https://alibank.tarroz.com",
        logo: "https://alibank.tarroz.com/icons/icon-512x512.png",
        description:
          "Hybrid Digital Banking & Web3 Multi-Chain Platform. Verified 1:1 Proof of Reserves, Zero-Gas P2P Transfers, and Non-Custodial TrustWallet Core Integration.",
        currenciesAccepted: "IDR, USD, USDT, ALX, BTC, ETH, SOL",
        paymentAccepted: "Cash, Credit Card, Bank Transfer, QRIS, Cryptocurrency",
        areaServed: "Worldwide",
        serviceType: [
          "Digital Banking",
          "Cryptocurrency Exchange",
          "Merchant POS Payment Processing",
          "Proof of Reserves Auditing",
          "Yield Savings & Custodial Escrow"
        ],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "AliBank Financial Services",
          itemListElement: [
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Zero-Fee P2P Money Transfer",
                description: "Instant peer-to-peer IDR and crypto transfers with zero transaction fees."
              }
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "1:1 Proof-of-Reserves Custody",
                description: "100% solvency backed by audited Ethereum Vault and Polygon contracts."
              }
            },
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Merchant SoftPOS Terminal",
                description: "Contactless NFC, QRIS, and multi-asset payment acquisition for retail merchants."
              }
            }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "@id": "https://alibank.tarroz.com/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Is AliBank safe, legitimate, and not a scam or Ponzi scheme?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "AliBank is an authentic, institutional-grade hybrid digital banking platform. All client balances are 100% backed 1:1 by real cash and verifiable on-chain liquidity on Polygon Mainnet and Ethereum. AliBank never uses member-get-member mechanics or locks user funds."
            }
          },
          {
            "@type": "Question",
            name: "How can I verify AliBank coins and smart contracts on the blockchain?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You can verify the official ALX Coin contract on Polygonscan (0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd) and the AliBank Vault contract on Ethereum (0x56268032A3B3E64CFeF1916d591087CF8dF40945) directly."
            }
          },
          {
            "@type": "Question",
            name: "Can I connect MetaMask and TrustWallet to AliBank?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. AliBank features an active MetaMask Web3 Native Bridge and derives multi-chain wallet addresses conforming to TrustWallet Core standards (BIP-39, BIP-44, and BIP-84 Bitcoin SegWit)."
            }
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] text-foreground font-body selection:bg-primary/30 relative overflow-x-hidden">
      {/* Inject SEO Structured JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-[800px] -left-40 w-[600px] h-[600px] bg-emerald-500/5 blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-[1800px] -right-40 w-[600px] h-[600px] bg-blue-500/5 blur-[160px] pointer-events-none -z-10" />

      {/* ==================== STICKY HEADER ==================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0B0E11]/85 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <NextLink href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20 p-2 group-hover:scale-105 transition-transform">
              <LogoIcon className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-2xl tracking-tighter italic uppercase text-foreground group-hover:text-primary transition-colors leading-none">
                ALIBANK
              </span>
              <span className="text-[9px] font-bold tracking-widest text-primary/80 uppercase">
                HYBRID WEB3 NEODIGITAL BANK
              </span>
            </div>
          </NextLink>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
            <a href="#about" className="hover:text-primary transition-colors">
              {t.navAbout}
            </a>
            <a href="#proof-of-reserves" className="hover:text-primary transition-colors">
              {t.navProof}
            </a>
            <a href="#security" className="hover:text-primary transition-colors">
              {t.navSecurity}
            </a>
            <a href="#features" className="hover:text-primary transition-colors">
              {t.navFeatures}
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              {t.navFaq}
            </a>
          </nav>

          {/* Action Buttons & Language Switcher */}
          <div className="flex items-center gap-3">
            {/* Bilingual Switcher */}
            <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10 text-xs">
              <button
                onClick={() => setLang("id")}
                className={cn(
                  "px-2.5 py-1 rounded-full font-bold transition-all text-[11px]",
                  lang === "id"
                    ? "bg-primary text-black shadow-md"
                    : "text-muted-foreground hover:text-white"
                )}
                aria-label="Bahasa Indonesia"
              >
                ID 🇮🇩
              </button>
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-2.5 py-1 rounded-full font-bold transition-all text-[11px]",
                  lang === "en"
                    ? "bg-primary text-black shadow-md"
                    : "text-muted-foreground hover:text-white"
                )}
                aria-label="English"
              >
                EN 🌐
              </button>
            </div>

            {/* Sign In */}
            <NextLink href="/login">
              <Button
                variant="ghost"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl h-10 px-4"
              >
                {t.navSignIn}
              </Button>
            </NextLink>

            {/* Register / App */}
            <NextLink href="/register">
              <Button className="gold-gradient text-black font-black text-xs uppercase tracking-wider italic rounded-xl h-10 px-5 shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                {t.navRegister}
              </Button>
            </NextLink>
          </div>
        </div>
      </header>

      {/* ==================== HERO SECTION ==================== */}
      <section className="pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 max-w-7xl mx-auto text-center relative">
        {/* Verification Status Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-black tracking-wider uppercase mb-8 shadow-inner animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <ShieldCheck className="w-4 h-4" />
          <span>{t.heroBadge}</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight uppercase italic max-w-5xl mx-auto leading-[1.08] mb-6">
          <span className="text-white block">{t.heroTitle1}</span>
          <span className="bg-gradient-to-r from-primary via-amber-300 to-yellow-500 bg-clip-text text-transparent block">
            {t.heroTitle2}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-muted-foreground/90 max-w-3xl mx-auto font-normal leading-relaxed mb-10">
          {t.heroDesc}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-16">
          <NextLink href="/register" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-14 px-8 gold-gradient text-black font-black italic uppercase text-sm tracking-wider rounded-2xl shadow-xl shadow-primary/25 hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2">
              <span>{t.heroCta1}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </NextLink>
          <a href="#proof-of-reserves" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-14 px-8 rounded-2xl border-white/15 bg-white/5 hover:bg-white/10 text-white font-bold text-sm uppercase tracking-wider backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <FileCheck2 className="w-4 h-4 text-primary" />
              <span>{t.heroCta2}</span>
            </Button>
          </a>
        </div>

        {/* Live Trust Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
          <Card className="p-5 rounded-3xl bg-white/[0.03] border-white/10 backdrop-blur-md hover:border-primary/40 transition-all">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
              {t.stat1Label}
            </p>
            <p className="text-2xl md:text-3xl font-black italic text-emerald-400">
              {t.stat1Val}
            </p>
            <span className="text-[10px] text-white/50 block mt-1">Audit Terbuka Realtime</span>
          </Card>
          <Card className="p-5 rounded-3xl bg-white/[0.03] border-white/10 backdrop-blur-md hover:border-primary/40 transition-all">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
              {t.stat2Label}
            </p>
            <p className="text-2xl md:text-3xl font-black italic text-primary">
              {t.stat2Val}
            </p>
            <span className="text-[10px] text-white/50 block mt-1">Sesama Nasabah UID 88...</span>
          </Card>
          <Card className="p-5 rounded-3xl bg-white/[0.03] border-white/10 backdrop-blur-md hover:border-primary/40 transition-all">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
              {t.stat3Label}
            </p>
            <p className="text-xl md:text-2xl font-black italic text-white truncate">
              {t.stat3Val}
            </p>
            <span className="text-[10px] text-white/50 block mt-1">TrustWallet Core Standard</span>
          </Card>
          <Card className="p-5 rounded-3xl bg-white/[0.03] border-white/10 backdrop-blur-md hover:border-primary/40 transition-all">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-1">
              {t.stat4Label}
            </p>
            <p className="text-2xl md:text-3xl font-black italic text-blue-400">
              {t.stat4Val}
            </p>
            <span className="text-[10px] text-white/50 block mt-1">Double-Entry Core Engine</span>
          </Card>
        </div>
      </section>

      {/* ==================== ANTI-SCAM & LEGITIMACY PROOF ==================== */}
      <section id="proof-of-reserves" className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs font-bold uppercase tracking-widest px-4 py-1.5 mb-4">
            TRANSPARANSI TINGKAT TINGGI • ZERO SCAM TOLERANCE
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight text-white mb-4">
            {t.whyNotScamTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t.whyNotScamSubtitle}
          </p>
        </div>

        {/* 4 Cryptographic Proof Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.proof1Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.proof1Desc}
            </p>
          </Card>

          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-primary/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-5">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.proof2Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.proof2Desc}
            </p>
          </Card>

          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-blue-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5">
              <Key className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.proof3Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.proof3Desc}
            </p>
          </Card>

          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-amber-500/40 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.proof4Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.proof4Desc}
            </p>
          </Card>
        </div>

        {/* Direct Side-by-Side Comparison Table */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 overflow-x-auto">
          <h3 className="text-xl sm:text-2xl font-black uppercase italic text-white mb-6 text-center">
            {t.compTitle}
          </h3>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/10 text-muted-foreground uppercase text-[10px] tracking-wider font-bold">
                <th className="py-4 px-4 w-1/4">Parameter</th>
                <th className="py-4 px-4 w-1/4 text-rose-400">{t.colScam}</th>
                <th className="py-4 px-4 w-1/4 text-muted-foreground">{t.colBank}</th>
                <th className="py-4 px-4 w-1/4 text-primary font-black bg-primary/5 rounded-t-xl">{t.colAli}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-4 px-4 font-bold text-white">{t.compRow1}</td>
                <td className="py-4 px-4 text-rose-400/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{t.compRow1Scam}</span>
                </td>
                <td className="py-4 px-4 text-muted-foreground">{t.compRow1Bank}</td>
                <td className="py-4 px-4 font-bold text-emerald-400 bg-primary/5">
                  ✓ {t.compRow1Ali}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">{t.compRow2}</td>
                <td className="py-4 px-4 text-rose-400/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{t.compRow2Scam}</span>
                </td>
                <td className="py-4 px-4 text-muted-foreground">{t.compRow2Bank}</td>
                <td className="py-4 px-4 font-bold text-emerald-400 bg-primary/5">
                  ✓ {t.compRow2Ali}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">{t.compRow3}</td>
                <td className="py-4 px-4 text-rose-400/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{t.compRow3Scam}</span>
                </td>
                <td className="py-4 px-4 text-muted-foreground">{t.compRow3Bank}</td>
                <td className="py-4 px-4 font-bold text-emerald-400 bg-primary/5">
                  ✓ {t.compRow3Ali}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-white">{t.compRow4}</td>
                <td className="py-4 px-4 text-rose-400/90 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{t.compRow4Scam}</span>
                </td>
                <td className="py-4 px-4 text-muted-foreground">{t.compRow4Bank}</td>
                <td className="py-4 px-4 font-bold text-emerald-400 bg-primary/5 rounded-b-xl">
                  ✓ {t.compRow4Ali}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== VERIFIED CONTRACTS ON-CHAIN ==================== */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-widest px-3 py-1 mb-3">
            VERIFIKASI BLOCKCHAIN TERBUKA
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-black uppercase italic text-white mb-2">
            {t.contractsTitle}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t.contractsSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ALX Polygon */}
          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-primary/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-primary tracking-wider">
                  {t.alxBadge}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-mono break-all text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd
              </h4>
              <p className="text-xs text-muted-foreground mb-6">
                {t.alxDesc}
              </p>
            </div>
            <a
              href="https://polygonscan.com/token/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-black gold-gradient rounded-xl py-3 px-4 shadow-md hover:brightness-110 transition-all"
            >
              <span>{t.btnViewExplorer} (Polygonscan)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Card>

          {/* AliBankVault Ethereum */}
          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-blue-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                  {t.vaultBadge}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-mono break-all text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                0x56268032A3B3E64CFeF1916d591087CF8dF40945
              </h4>
              <p className="text-xs text-muted-foreground mb-6">
                {t.vaultDesc}
              </p>
            </div>
            <a
              href="https://etherscan.io/address/0x56268032A3B3E64CFeF1916d591087CF8dF40945"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 rounded-xl py-3 px-4 shadow-md transition-all"
            >
              <span>{t.btnViewExplorer} (Etherscan)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Card>

          {/* USDT Polygon */}
          <Card className="p-6 rounded-3xl bg-white/[0.02] border-white/10 hover:border-teal-500/50 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black uppercase text-teal-400 tracking-wider">
                  {t.usdtBadge}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
              </div>
              <h4 className="text-base font-bold text-white mb-2 font-mono break-all text-xs bg-white/5 p-3 rounded-xl border border-white/5">
                0xc2132D05D31c914a87C6611C10748AEb04B58e8F
              </h4>
              <p className="text-xs text-muted-foreground mb-6">
                {t.usdtDesc}
              </p>
            </div>
            <a
              href="https://polygonscan.com/token/0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-white bg-teal-600 hover:bg-teal-500 rounded-xl py-3 px-4 shadow-md transition-all"
            >
              <span>{t.btnViewExplorer} (Tether Contract)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Card>
        </div>
      </section>

      {/* ==================== CORE FEATURES ==================== */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold uppercase tracking-widest px-4 py-1.5 mb-4">
            FITUR & KAPABILITAS
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight text-white mb-4">
            {t.featTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.featSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-primary/40 transition-all">
            <Coins className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat1Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat1Desc}
            </p>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition-all">
            <Zap className="w-8 h-8 text-emerald-400 mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat2Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat2Desc}
            </p>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-amber-500/40 transition-all">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat3Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat3Desc}
            </p>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-blue-500/40 transition-all">
            <QrCode className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat4Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat4Desc}
            </p>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-purple-500/40 transition-all">
            <Wallet className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat5Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat5Desc}
            </p>
          </Card>

          <Card className="p-8 rounded-3xl bg-white/[0.02] border-white/10 hover:border-rose-500/40 transition-all">
            <Building2 className="w-8 h-8 text-rose-400 mb-4" />
            <h3 className="text-lg font-black italic uppercase text-white mb-2">
              {t.feat6Title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.feat6Desc}
            </p>
          </Card>
        </div>
      </section>

      {/* ==================== SECURITY ARCHITECTURE ==================== */}
      <section id="security" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-white/5">
        <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="max-w-3xl">
            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold uppercase tracking-widest px-3 py-1 mb-4">
              INFRASTRUKTUR TAHAN ANCAMAN
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black uppercase italic text-white mb-6">
              {t.secTitle}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t.sec1}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t.sec2}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t.sec3}</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t.sec4}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ SECTION ==================== */}
      <section id="faq" className="py-20 md:py-28 px-4 sm:px-6 max-w-4xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/30 text-xs font-bold uppercase tracking-widest px-4 py-1.5 mb-4">
            KLARIFIKASI & TRANSPARANSI
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight text-white mb-3">
            {t.faqTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.faqSubtitle}
          </p>
        </div>

        <div className="space-y-4">
          {[
            { q: t.faq1Q, a: t.faq1A },
            { q: t.faq2Q, a: t.faq2A },
            { q: t.faq3Q, a: t.faq3A },
            { q: t.faq4Q, a: t.faq4A },
            { q: t.faq5Q, a: t.faq5A },
          ].map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <Card
                key={idx}
                className={cn(
                  "p-5 rounded-2xl border transition-all cursor-pointer",
                  isOpen
                    ? "bg-white/[0.04] border-primary/40 shadow-lg"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                )}
                onClick={() => setActiveFaq(isOpen ? null : idx)}
              >
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-sm sm:text-base font-bold text-white leading-snug">
                    {item.q}
                  </h4>
                  <ChevronRight
                    className={cn(
                      "w-5 h-5 text-primary shrink-0 transition-transform",
                      isOpen ? "rotate-90" : "rotate-0"
                    )}
                  />
                </div>
                {isOpen && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 pt-3 border-t border-white/5 leading-relaxed">
                    {item.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* ==================== FINAL CTA BANNER ==================== */}
      <section className="py-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="p-10 sm:p-16 rounded-[2.5rem] bg-gradient-to-b from-primary/15 via-white/[0.03] to-transparent border border-primary/30 relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 p-3">
            <LogoIcon className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tight text-white mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <NextLink href="/register">
              <Button className="h-14 px-8 gold-gradient text-black font-black italic uppercase text-sm tracking-wider rounded-2xl shadow-xl shadow-primary/25 hover:brightness-110 active:scale-95 transition-all">
                {t.ctaBtn}
              </Button>
            </NextLink>
            <NextLink href="/login">
              <Button
                variant="ghost"
                className="h-14 px-6 text-xs uppercase font-bold text-muted-foreground hover:text-white"
              >
                {t.ctaLogin}
              </Button>
            </NextLink>
          </div>
        </div>
      </section>

      {/* ==================== GLOBAL FOOTER ==================== */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gold-gradient flex items-center justify-center p-1.5">
              <LogoIcon className="text-white" />
            </div>
            <span className="font-black text-xl italic uppercase text-white">ALIBANK</span>
          </div>

          <div className="flex flex-wrap gap-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <a href="#about" className="hover:text-primary transition-colors">
              {t.navAbout}
            </a>
            <a href="#proof-of-reserves" className="hover:text-primary transition-colors">
              {t.navProof}
            </a>
            <a href="#security" className="hover:text-primary transition-colors">
              {t.navSecurity}
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              {t.navFaq}
            </a>
            <NextLink href="/login" className="hover:text-primary transition-colors">
              {t.navSignIn}
            </NextLink>
            <NextLink href="/register" className="hover:text-primary transition-colors">
              {t.navRegister}
            </NextLink>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/70 leading-relaxed border-t border-white/5 pt-6 mb-4">
          {t.footerDisclaimer}
        </p>

        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
          © {new Date().getFullYear()} {t.footerRights}
        </p>
      </footer>
    </div>
  );
}

