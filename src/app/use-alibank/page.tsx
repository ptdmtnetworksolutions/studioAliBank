"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  ExternalLink,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Wallet,
  Globe,
  Coins,
  Store,
  QrCode,
  Smartphone,
  Lock,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Share2,
  Bookmark
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedCard {
  id: string;
  titleEn: string;
  titleId: string;
  category: string;
  excerptEn: string;
  excerptId: string;
  contentEn: string;
  contentId: string;
  isYellow?: boolean;
}

export default function UseAliBankPage() {
  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | "faq" | null>(null);
  const [selectedTutorial, setSelectedTutorial] = useState<RelatedCard | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const ALX_POLYGON_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const ETH_VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const relatedCards: RelatedCard[] = [
    {
      id: "por-guide",
      titleEn: "WHAT IS PROOF OF RESERVES?",
      titleId: "APA ITU BUKTI CADANGAN (POR)?",
      category: "CRYPTOGRAPHY, AUDIT",
      excerptEn: "Understand how mathematical proof of solvency replaces opaque fractional-reserve debt.",
      excerptId: "Pahami bagaimana kepastian matematis menggantikan risiko utang fraksional perbankan konvensional.",
      contentEn: `### Understanding Proof of Reserves
Proof of Reserves (PoR) is an algorithmic accounting mechanism verifying that AliBank holds 100% of the funds it claims to custody.
- **Central Cold Vaults**: Publicly verifiable on Ethereum (\`0x56268032A3B3E64CFeF1916d591087CF8dF40945\`) and Polygon (\`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`).
- **No Fractional Multipliers**: Traditional banks lend out your money. AliBank maintains 1:1 backing with zero unbacked phantom balances.`,
      contentId: `### Memahami Bukti Cadangan (Proof of Reserves)
Proof of Reserves (PoR) adalah mekanisme pembukuan algoritmik yang membuktikan bahwa AliBank memegang 100% cadangan aset yang didepositkan pengguna.
- **Brankas Pusat On-Chain**: Dapat diaudit langsung di Ethereum (\`0x56268032A3B3E64CFeF1916d591087CF8dF40945\`) dan Polygon (\`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`).
- **Bebas Risiko Fraksional**: Bank tradisional meminjamkan simpanan Anda. AliBank menjaga rasio cadangan 1:1 tanpa saldo hantu.`
    },
    {
      id: "download-app",
      titleEn: "ACCESS ALIBANK APP & CLI",
      titleId: "AKSES APLIKASI & TERMINAL ALIBANK",
      category: "ECOSYSTEM, GETTING STARTED",
      isYellow: true,
      excerptEn: "Web portal, Android POS merchant terminal, and developer API tools for multi-chain banking.",
      excerptId: "Portal web, terminal kasir Android POS, dan API pengembang untuk perbankan multi-chain berdaulat.",
      contentEn: `### Access Options
1. **Web Banking Portal**: Accessible across all modern desktop and mobile browsers.
2. **Android POS APK**: Specialized point-of-sale software for retail merchants with dynamic QRIS printing.
3. **Core API / CLI**: Direct JSON-RPC and REST endpoints for programmatic settlement and automated accounting.`,
      contentId: `### Pilihan Akses
1. **Portal Web Banking**: Dapat diakses langsung melalui peramban mobile maupun desktop.
2. **Aplikasi Android POS**: Perangkat lunak khusus kasir toko retail dengan cetak QRIS dinamis instan.
3. **Core API / Terminal**: Jalur REST dan JSON-RPC resmi untuk integrasi penyelesaian transaksi otomatis.`
    },
    {
      id: "audit-node",
      titleEn: "RUN AN ALIBANK AUDIT NODE",
      titleId: "JALANKAN NODE AUDIT ALIBANK",
      category: "INFRASTRUCTURE, SECURITY",
      excerptEn: "Verify ledger integrity and monitor real-time discrepancy alerts against central vault reserves.",
      excerptId: "Verifikasi integritas buku besar dan pantau peringatan anomali saldo hantu terhadap brankas pusat.",
      contentEn: `### Running an Audit Node
Anyone can operate an independent watcher node:
- Connects to the Polygon network and polls the ALX smart contract.
- Reconciles total circulating supply against off-chain settlement ledgers.
- Immediately alerts if any unauthorized minting or phantom anomaly occurs.`,
      contentId: `### Menjalankan Node Pengawas Audit
Siapa pun dapat menjalankan node audit mandiri:
- Terhubung ke jaringan Polygon untuk membaca smart contract ALX.
- Merekonsiliasi total pasokan beredar dengan buku besar transaksi.
- Memberikan sinyal waspada instan jika terdeteksi manipulasi saldo atau anomali saldo hantu.`
    },
    {
      id: "buy-alx",
      titleEn: "HOW TO BUY AND USE ALX",
      titleId: "CARA MEMBELI & MENGGUNAKAN ALX",
      category: "TUTORIALS, USING ALIBANK",
      excerptEn: "Acquire the native utility asset via decentralized exchanges, P2P order book, or direct bank deposit.",
      excerptId: "Dapatkan aset utilitas ALX melalui DEX on-chain, bursa P2P, atau deposit transfer bank instan.",
      contentEn: `### Acquiring ALX
- **Direct Fiat Deposit**: Convert IDR via dynamic QRIS or virtual accounts directly into ALX.
- **DEX Liquidity**: Swap USDT or MATIC on Polygon QuickSwap/Uniswap with verified contract \`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`.
- **Zero Surcharge**: Transfer ALX to any AliBank user in 0.4 seconds with zero internal transaction fees.`,
      contentId: `### Cara Mendapatkan ALX
- **Deposit Fiat Langsung**: Konversi Rupiah melalui QRIS dinamis atau virtual account bank langsung menjadi saldo ALX.
- **Likuiditas DEX**: Tukar USDT atau MATIC di Uniswap/QuickSwap Polygon dengan kontrak resmi \`0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd\`.
- **Bebas Potongan**: Kirim ALX ke sesama nasabah AliBank dalam 0,4 detik tanpa biaya transfer antar akun.`
    },
    {
      id: "merchant-qris",
      titleEn: "SETTLE WITH DYNAMIC QRIS",
      titleId: "PEMBAYARAN DENGAN QRIS DINAMIS",
      category: "MERCHANT, PAYMENTS",
      excerptEn: "Pay physical merchant registers and online storefronts with sub-second confirmation.",
      excerptId: "Bayar di kasir toko fisik dan toko online dengan verifikasi instan dalam hitungan milidetik.",
      contentEn: `### Dynamic QRIS Settlement
AliBank generates standard QRIS codes compliant with Indonesian National Standards (ASPI):
- Compatible with all major banking apps (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay).
- Real-time websocket notification on merchant POS terminal upon payment receipt.
- Immediate availability in merchant's withdrawal reserve.`,
      contentId: `### Pembayaran Kasir QRIS Dinamis
AliBank menerbitkan kode QRIS resmi yang patuh pada standar nasional ASPI / Bank Indonesia:
- Kompatibel dengan semua aplikasi mobile banking dan e-wallet nasional.
- Notifikasi websocket seketika di layar kasir merchant saat dana terkirim.
- Saldo langsung tersedia untuk ditarik atau dipindahkan ke rekening utama.`
    },
    {
      id: "dual-rail-tech",
      titleEn: "COMPARING ON-CHAIN VS CUSTODIAL",
      titleId: "PERBANDINGAN JALUR ON-CHAIN VS KUSTODI",
      category: "ARCHITECTURE, 101",
      excerptEn: "How AliBank balances 0.4s instant transactions with 100% transparent public blockchain security.",
      excerptId: "Bagaimana AliBank menggabungkan kecepatan transaksi 0,4 detik dengan audit publik blockchain.",
      contentEn: `### Hybrid Dual-Rail Architecture
- **Internal Ledger**: Provides the frictionless speed of modern banking with instant P2P and zero gas fees.
- **Public Blockchain Rails**: Polygon and Ethereum provide decentralized cold storage and programmatic audits.
- **Bridging**: Users can withdraw to self-custodial Web3 wallets anytime without restrictions.`,
      contentId: `### Arsitektur Hibrida Jalur Ganda
- **Buku Besar Internal**: Memberikan kecepatan transaksi super instan tanpa biaya gas untuk belanja harian.
- **Jalur Blockchain Publik**: Polygon dan Ethereum menyediakan brankas terdesentralisasi yang transparan.
- **Penarikan Mandiri**: Pengguna bebas menarik dana ke wallet Web3 mandiri kapan saja tanpa hambatan.`
    },
    {
      id: "security-tips",
      titleEn: "USEFUL SECURITY TIPS",
      titleId: "TIPS PENGAMANAN REKENING",
      category: "TUTORIALS, SECURITY",
      excerptEn: "Best practices for safeguarding your seed phrases, PINs, and verifying legitimate SSL signatures.",
      excerptId: "Panduan praktis menjaga kerahasiaan seed phrase, PIN transaksi, dan verifikasi sertifikat SSL resmi.",
      contentEn: `### Critical Security Checklist
1. **Never Share Seed Phrases**: AliBank staff will never ask for your 12-word recovery phrase or PIN.
2. **Verify URLs**: Always check that you are on \`alibank.tarroz.com\` with HTTPS active.
3. **Hardware Storage**: For long-term savings, consider withdrawing to a hardware wallet like Ledger or Trezor.`,
      contentId: `### Panduan Keamanan Penting
1. **Jangan Berikan Seed Phrase**: Petugas resmi AliBank tidak akan pernah meminta 12 kata pemulihan atau PIN Anda.
2. **Verifikasi Alamat Web**: Selalu pastikan domain yang diakses adalah \`alibank.tarroz.com\` dengan sertifikat SSL aman.
3. **Simpan di Hardware Wallet**: Untuk tabungan jangka panjang bernilai besar, simpan di dompet fisik seperti Ledger.`
    },
    {
      id: "aml-phantom-mandate",
      titleEn: "DOES ALIBANK ALLOW PHANTOM BALANCES?",
      titleId: "APAKAH ALIBANK MENTOLERANSI SALDO HANTU?",
      category: "COMPLIANCE, AML SURVEILLANCE",
      excerptEn: "Strict anti-money laundering policy: zero unbacked credit or circular manipulation tolerated.",
      excerptId: "Kebijakan tegas pencegahan pencucian uang: nol toleransi terhadap kredit fiktif dan manipulasi dana.",
      contentEn: `### Zero-Tolerance AML & Phantom Balance Policy
No. AliBank enforces a strict, mathematically audited anti-fraud architecture:
- Every rupiah and USDT must correspond to legitimate incoming deposit proofs.
- If an account balance exceeds historical transactions, the automated Discrepancy Engine locks the account instantly.
- Unbacked balances are confiscated and quarantined to protect honest depositors and uphold 100% solvency.`,
      contentId: `### Kebijakan Nol Toleransi Saldo Hantu & AML
TIDAK SAMA SEKALI. AliBank menerapkan sistem keamanan matematis yang ketat:
- Setiap saldo rupiah maupun USDT wajib memiliki bukti setoran resmi yang sah.
- Jika akun memiliki saldo yang tidak sesuai dengan mutasi riil, Discrepancy Engine otomatis membekukan akun seketika.
- Saldo tanpa bukti cadangan akan disita demi menjaga integritas simpanan nasabah yang sah.`
    },
    {
      id: "bip44-keys",
      titleEn: "WHAT ARE BIP-39/44 SEED PHRASES?",
      titleId: "APA ITU SEED PHRASE STANDAR BIP-39/44?",
      category: "CRYPTOGRAPHY, 101",
      excerptEn: "Universal cryptographic standard allowing wallet recovery across MetaMask, TrustWallet, and Ledger.",
      excerptId: "Standar kriptografi universal yang memungkinkan pemulihan aset di MetaMask, TrustWallet, dan dompet fisik.",
      contentEn: `### Universal Key Portability
AliBank adopts the Bitcoin Improvement Proposal (BIP-39 and BIP-44) standards:
- Generates 12 human-readable mnemonic words representing your cryptographic master seed.
- Complete financial sovereignty: your funds can never be arbitrarily trapped by a single application.`,
      contentId: `### Portabilitas Kunci Universal
AliBank mengadopsi standar internasional BIP-39 dan BIP-44:
- Menghasilkan 12 kata mnemonik yang mewakili kunci utama rekening kripto Anda.
- Kedaulatan finansial mutlak: aset Anda tidak akan pernah terkunci atau bergantung pada satu platform saja.`
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans antialiased selection:bg-[#F4B728] selection:text-black">
      {/* =========================================================================
          1. STICKY HEADER (Exact Zcash Standard: Clean, No Sign In / Open Account)
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
                  activeMegaMenu === "learn" ? "text-[#111111]" : "text-black font-black hover:text-black"
                )}
              >
                <span>{lang === "en" ? "LEARN" : "PELAJARI"}</span>
              </button>
              {/* Highlight line for guide */}
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
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

          {/* Right Actions: Minimalist Lang Toggle & Search Icon (No Sign In / Open Account) */}
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
            1.A MEGA MENU: LEARN
            ========================================================================= */}
        {activeMegaMenu === "learn" && (
          <>
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />
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
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    ALIBANK 101
                  </h4>
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
                      <NextLink href="/learn?category=101" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
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
                        {lang === "en" ? "Zero-Tolerance AML Policy" : "Kebijakan Nol-Toleransi AML"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=aml" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Real-Time Anomaly & Phantom Detection" : "Deteksi Saldo Hantu & Anomali"}
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
                      <NextLink href="/use-alibank" onClick={() => setActiveMegaMenu(null)} className="hover:text-black font-semibold text-[#111111] block">
                        {lang === "en" ? "How to use AliBank (Guide)" : "Panduan Cara Menggunakan AliBank"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=por" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Proof of Reserves Audit" : "Audit Bukti Cadangan (PoR)"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink href="/learn?category=merchant" onClick={() => setActiveMegaMenu(null)} className="hover:text-black block">
                        {lang === "en" ? "Merchant POS & QRIS" : "Kasir POS & QRIS"}
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

        {/* =========================================================================
            1.B MEGA MENU: ECOSYSTEM
            ========================================================================= */}
        {activeMegaMenu === "ecosystem" && (
          <>
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />
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

        {/* =========================================================================
            1.C MEGA MENU: NETWORK
            ========================================================================= */}
        {activeMegaMenu === "network" && (
          <>
            <div
              onClick={() => setActiveMegaMenu(null)}
              className="fixed inset-0 top-20 z-40 bg-black/5 backdrop-blur-[1px]"
            />
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
          2. ARTICLE HEADER & HERO MOCKUP (Exact Zcash Image 1)
          ========================================================================= */}
      <main className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
        {/* Top Breadcrumbs */}
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#888888] mb-6">
          <NextLink href="/learn" className="hover:text-black transition-colors">
            {lang === "en" ? "LEARN ALIBANK" : "PELAJARI ALIBANK"}
          </NextLink>
          <span>/</span>
          <span className="text-[#111111]">{lang === "en" ? "TUTORIALS" : "PANDUAN"}</span>
        </div>

        {/* Title & Editorial Lead */}
        <div className="space-y-6 max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-[#111111] leading-[1.08]">
            {lang === "en" ? "HOW TO USE ALIBANK" : "CARA MENGGUNAKAN ALIBANK"}
          </h1>
          <p className="text-base sm:text-lg text-[#555555] font-light leading-relaxed max-w-2xl">
            {lang === "en"
              ? "AliBank is sovereign, fast, and accessible for everyone. Use your mobile phone or computer to privately pay a friend, settle with merchants via QRIS, exchange digital assets, or custody funds with 100% mathematical reserve certainty."
              : "AliBank berdaulat, berkecepatan tinggi, dan dapat diakses oleh siapa saja. Gunakan ponsel pintar atau komputer Anda untuk bertransaksi mandiri, bayar kasir dengan QRIS, pertukaran aset kripto, dan kelola saldo dengan kepastian cadangan 100%."}
          </p>

          {/* Action Button & Metadata */}
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById("getting-started");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.18em] px-8 py-3.5 rounded-sm transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <span>{lang === "en" ? "Learn more ↓" : "Pelajari Lebih Lanjut ↓"}</span>
            </button>

            <button
              onClick={handleShare}
              className="border border-[#DFDAD0] hover:bg-[#F4F1EA] text-[#444444] text-xs font-bold uppercase tracking-wider px-4 py-3.5 rounded-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? (lang === "en" ? "Copied!" : "Tersalin!") : (lang === "en" ? "Share Guide" : "Bagikan")}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] uppercase text-[#888888] pt-2">
            <span>TUTORIALS</span>
            <span>•</span>
            <span>USING ALIBANK</span>
            <span>•</span>
            <span>ALIBANK 101</span>
          </div>
        </div>

        {/* Visual Device Mockup (Smartphone in Hand with QR Code & Balance) */}
        <div className="mt-12 md:mt-16 bg-[#161217] rounded-sm p-8 sm:p-14 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 border border-[#2D2330]">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F4B728]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 max-w-lg z-10 text-left">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4B728] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F4B728]" />
              {lang === "en" ? "MULTI-CHAIN SOVEREIGN CASH" : "UANG HIBRIDA MULTI-CHAIN"}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white leading-snug">
              {lang === "en"
                ? "Your keys, your math, your money. Everywhere you go."
                : "Kunci mandiri, kepastian matematis, dana Anda. Ke mana pun Anda pergi."}
            </h3>
            <p className="text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed">
              {lang === "en"
                ? "Experience instant settlement with dynamic QRIS, zero-fee P2P transactions, and multi-chain liquidity anchored to real central vaults on Polygon and Ethereum."
                : "Nikmati transaksi instan melalui QRIS dinamis, transfer P2P bebas biaya, dan likuiditas multi-chain yang bersandar pada brankas riil di Polygon dan Ethereum."}
            </p>
          </div>

          {/* Smartphone Mockup */}
          <div className="w-[280px] sm:w-[320px] bg-[#1E1922] border-4 border-[#332A38] rounded-[36px] p-4 shadow-2xl z-10 space-y-4">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-24 h-4 bg-[#120F14] rounded-full mx-auto" />

            {/* Inner Phone Screen */}
            <div className="bg-[#120E15] rounded-[24px] p-5 text-center space-y-4 border border-[#2A2130]">
              <div className="flex items-center justify-between text-[10px] text-[#A89F91]">
                <span className="font-bold text-[#F4B728]">AliBank App</span>
                <span>BIP-44 HD</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-xl mx-auto w-36 h-36 flex flex-col items-center justify-center shadow-md">
                <QrCode className="w-28 h-28 text-black" />
              </div>

              <div className="space-y-0.5">
                <span className="text-[10px] text-[#888888] uppercase tracking-wider block">
                  {lang === "en" ? "AVAILABLE BALANCE" : "SALDO TERSEDIA"}
                </span>
                <span className="font-serif text-2xl font-bold text-white block">
                  Rp 10.754.000
                </span>
                <span className="font-mono text-xs text-[#16A34A] block">
                  10,754.00 ALX • 100% Backed
                </span>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span className="text-[9px] uppercase tracking-widest text-[#16A34A] font-bold">
                  {lang === "en" ? "Proof of Reserves Synced" : "Cadangan Terverifikasi"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SECTION 1: SOVEREIGN DUAL-RAIL SETTLEMENT (Exact Zcash Image 2)
            ========================================================================= */}
        <section className="py-16 sm:py-20 border-b border-[#DFDAD0] space-y-8">
          <div className="max-w-3xl space-y-4 text-left">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
              {lang === "en"
                ? "Dual-Rail Settlement: High-Speed Instant vs. On-Chain Sovereign Rails"
                : "Transaksi Jalur Ganda: Kecepatan Instan vs. Kedaulatan On-Chain"}
            </h2>
            <p className="text-xs sm:text-sm text-[#444444] font-light leading-relaxed">
              {lang === "en"
                ? "When you use AliBank, you enjoy the flexibility of two unified rails: high-speed internal ledger operations for instant zero-fee daily transactions, and public decentralized smart contract rails on Polygon, Ethereum, and Bitcoin for sovereign cold storage."
                : "Saat menggunakan AliBank, Anda menikmati fleksibilitas dua jalur terpadu: transaksi buku besar internal berkecepatan tinggi tanpa biaya untuk kebutuhan sehari-hari, serta jalur smart contract terdesentralisasi di Polygon, Ethereum, dan Bitcoin untuk kedaulatan brankas dingin."}
            </p>
            <p className="text-xs sm:text-sm text-[#444444] font-light leading-relaxed">
              {lang === "en"
                ? "The internal ledger is an immutable double-entry book reconciled 24/7 against cold storage contracts. Every unit of customer custody is backed 1:1 by real assets. To protect depositors, AliBank's automated Discrepancy Engine monitors all movements—strictly disallowing any unbacked phantom balances or money laundering attempts."
                : "Buku besar internal merupakan pembukuan ganda yang terus-menerus direkonsiliasi 24/7 dengan brankas penyimpanan dingin. Setiap saldo nasabah didukung 1:1 oleh aset nyata. Demi melindungi simpanan, Mesin Deteksi Anomali AliBank memantau setiap transaksi—secara mutlak menolak injeksi saldo hantu maupun upaya pencucian uang."}
            </p>

            {/* Yellow Shield Callout Box (Exact Zcash visual element) */}
            <div className="bg-[#FAF4E6] border border-[#F4B728] p-5 rounded-sm flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-[#D99A1A] shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-[#222222] font-light leading-relaxed">
                <strong className="font-semibold block text-[#111111]">
                  {lang === "en" ? "Mathematically Backed Solvency:" : "Solvensi Terverifikasi Secara Matematis:"}
                </strong>
                <span>
                  {lang === "en"
                    ? "Only you control who receives your funds. Transparent on-chain contracts guarantee that customer liabilities never exceed real reserves."
                    : "Hanya Anda yang mengendalikan penerima dana Anda. Kontrak publik on-chain menjamin total kewajiban nasabah tidak pernah melebihi cadangan nyata."}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. SECTION 2: GETTING STARTED WITH ALIBANK (3 Step Cards with Graphics)
            ========================================================================= */}
        <section id="getting-started" className="py-16 sm:py-20 border-b border-[#DFDAD0] space-y-12">
          <div className="text-left space-y-2">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              {lang === "en" ? "Getting started with AliBank" : "Memulai dengan AliBank"}
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] font-light max-w-xl">
              {lang === "en"
                ? "Three simple steps to fund, secure, and spend your sovereign balance globally."
                : "Tiga langkah mudah untuk mengisi, mengamankan, dan membelanjakan saldo berdaulat Anda."}
            </p>
          </div>

          <div className="space-y-12">
            {/* Step 1: Exchange fiat or crypto */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border border-[#DFDAD0] bg-white p-8 sm:p-10 rounded-sm shadow-sm">
              <div className="md:col-span-7 space-y-4 text-left">
                <span className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111111]">
                  {lang === "en"
                    ? "Exchange rupiah or another currency for ALX (the native utility token)"
                    : "Tukarkan rupiah atau mata uang lain ke ALX (token utilitas utama)"}
                </h3>
                <p className="text-xs sm:text-sm text-[#555555] font-light leading-relaxed">
                  {lang === "en"
                    ? "Deposit Indonesian Rupiah seamlessly via dynamic QRIS and virtual accounts, or deposit USDT and Ethereum from your Web3 wallet. Funds are converted and settled instantly into your primary liquid balance."
                    : "Setorkan Rupiah melalui QRIS dinamis dan virtual account bank, atau setorkan USDT dan Ethereum dari dompet Web3 Anda. Saldo langsung terkonversi dan siap digunakan dalam hitungan detik."}
                </p>
                <div className="pt-2">
                  <NextLink
                    href="/ecosystem?category=liquidity"
                    className="text-xs font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1.5 hover:underline"
                  >
                    <span>{lang === "en" ? "View peer-to-peer and exchange options" : "Lihat opsi bursa P2P dan deposit"}</span>
                    <span>→</span>
                  </NextLink>
                </div>
              </div>

              {/* Graphic Card Step 1 */}
              <div className="md:col-span-5 bg-[#FAF9F6] border border-[#DFDAD0] p-6 rounded-sm text-center space-y-3">
                <Coins className="w-10 h-10 text-[#F4B728] mx-auto" />
                <h4 className="font-serif text-base font-bold text-[#111111]">
                  {lang === "en" ? "Instant Fiat & Crypto Gateway" : "Gateway Fiat & Kripto Instan"}
                </h4>
                <p className="text-xs text-[#777777] font-light">
                  QRIS • Virtual Accounts • Polygon ALX • Tether 1:1
                </p>
              </div>
            </div>

            {/* Step 2: Download wallet app */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center border border-[#DFDAD0] bg-white p-8 sm:p-10 rounded-sm shadow-sm">
              {/* Graphic Card Step 2 */}
              <div className="md:col-span-5 bg-[#FAF9F6] border border-[#DFDAD0] p-6 rounded-sm text-center space-y-3 order-last md:order-first">
                <Smartphone className="w-10 h-10 text-[#111111] mx-auto" />
                <h4 className="font-serif text-base font-bold text-[#111111]">
                  {lang === "en" ? "BIP-39/BIP-44 Multi-Chain HD Wallet" : "Dompet HD Multi-Chain BIP-39/44"}
                </h4>
                <p className="text-xs text-[#777777] font-light">
                  MetaMask • TrustWallet • Ledger • AliBank App
                </p>
              </div>

              <div className="md:col-span-7 space-y-4 text-left">
                <span className="w-7 h-7 rounded-full bg-[#111111] text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#111111]">
                  {lang === "en"
                    ? "Access your digital wallet app to hold, send, and receive ALX and USDT"
                    : "Akses aplikasi dompet digital Anda untuk menyimpan, mengirim, dan menerima dana"}
                </h3>
                <p className="text-xs sm:text-sm text-[#555555] font-light leading-relaxed">
                  {lang === "en"
                    ? "AliBank supports standard 12/24-word recovery phrases. You can access your funds via the AliBank Web & Mobile App, or import your sovereign private keys directly into MetaMask, TrustWallet, or hardware wallets like Ledger."
                    : "AliBank mendukung standar 12/24 kata pemulihan universal. Anda dapat mengakses saldo melalui aplikasi AliBank, atau mengekspor kunci pribadi Anda ke MetaMask, TrustWallet, maupun dompet fisik seperti Ledger."}
                </p>
                <div className="pt-2">
                  <NextLink
                    href="/ecosystem?category=wallets"
                    className="text-xs font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1.5 hover:underline"
                  >
                    <span>{lang === "en" ? "View digital wallets for AliBank" : "Lihat pilihan dompet digital"}</span>
                    <span>→</span>
                  </NextLink>
                </div>
              </div>
            </div>

            {/* Step 3: Pay in-person or online (Dark Obsidian Card) */}
            <div className="bg-[#120F13] text-white p-8 sm:p-12 rounded-sm space-y-6 border border-[#2B222E] text-left">
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-full bg-[#F4B728] text-black text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F4B728]">
                  {lang === "en" ? "RETAIL & ONLINE CHECKOUT" : "PEMBAYARAN KASIR TOKO & ONLINE"}
                </span>
              </div>

              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white max-w-2xl leading-snug">
                {lang === "en"
                  ? "Pay in-person at thousands of retailers via Dynamic QRIS, or send money to a friend or provider"
                  : "Bayar langsung di kasir toko dengan QRIS Dinamis, atau transfer ke siapa pun tanpa batas"}
              </h3>

              <p className="text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed max-w-3xl">
                {lang === "en"
                  ? "Scan national QRIS codes across Indonesia, settle with physical merchants with zero chargeback risk, or execute instant peer-to-peer transfers worldwide with 0.4s finality and minimal network fees."
                  : "Pindai kode QRIS nasional di seluruh toko Indonesia, selesaikan transaksi kasir fisik tanpa risiko chargeback, atau transfer P2P ke seluruh dunia dalam waktu 0,4 detik dengan biaya terjangkau."}
              </p>

              <div className="pt-2">
                <NextLink
                  href="/ecosystem?category=merchant"
                  className="bg-[#F4B728] hover:bg-[#E5A81E] text-black text-xs font-bold uppercase tracking-[0.16em] px-6 py-3.5 rounded-sm transition-colors inline-flex items-center gap-2"
                >
                  <span>{lang === "en" ? "Explore Merchant POS Network" : "Jelajahi Jaringan Kasir POS"}</span>
                  <span>→</span>
                </NextLink>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. SECTION 3: RELATED TUTORIALS (3x3 Grid, Matching Zcash Image 4)
            ========================================================================= */}
        <section className="py-16 sm:py-24 space-y-10 border-b border-[#DFDAD0]">
          <div className="text-left space-y-2">
            <h2 className="font-serif text-3xl font-bold text-[#111111] tracking-tight">
              {lang === "en" ? "Related Knowledge & Tutorials" : "Tutorial & Pengetahuan Terkait"}
            </h2>
            <p className="text-xs text-[#777777] font-light">
              {lang === "en"
                ? "Essential educational guides on mathematical solvency, multi-chain custody, and security."
                : "Panduan edukasi mendasar mengenai audit cadangan, penyimpanan multi-chain, dan pencegahan penipuan."}
            </p>
          </div>

          {/* 3x3 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#DFDAD0] bg-white divide-y md:divide-y-0 divide-[#DFDAD0]">
            {relatedCards.map((card) => {
              const isYellow = card.isYellow;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedTutorial(card)}
                  className={cn(
                    "p-7 flex flex-col justify-between cursor-pointer transition-all duration-200 border-b md:border-b md:border-r border-[#DFDAD0] group min-h-[220px]",
                    isYellow
                      ? "bg-[#F4B728] text-black hover:bg-[#E5A81E]"
                      : "bg-white hover:bg-[#FAF9F5]"
                  )}
                >
                  <div className="space-y-3 text-left">
                    <h4
                      className={cn(
                        "font-serif text-base sm:text-lg font-bold leading-snug tracking-tight transition-colors",
                        isYellow ? "text-black" : "text-[#111111] group-hover:text-[#F4B728]"
                      )}
                    >
                      {lang === "en" ? card.titleEn : card.titleId}
                    </h4>
                    <p
                      className={cn(
                        "text-xs font-light leading-relaxed line-clamp-3",
                        isYellow ? "text-black/80" : "text-[#666666]"
                      )}
                    >
                      {lang === "en" ? card.excerptEn : card.excerptId}
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between">
                    <span
                      className={cn(
                        "text-[9px] font-bold tracking-[0.16em] uppercase",
                        isYellow ? "text-black/70" : "text-[#999999]"
                      )}
                    >
                      {card.category}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-bold transition-transform group-hover:translate-x-1",
                        isYellow ? "text-black" : "text-[#111111]"
                      )}
                    >
                      →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            6. SECTION 4: READY TO USE ALIBANK? (4 Columns Banner)
            ========================================================================= */}
        <section className="py-16 sm:py-20 text-left">
          <div className="bg-[#120F12] text-white p-8 sm:p-14 rounded-sm space-y-8 border border-[#261E28]">
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              {lang === "en" ? "Ready to use AliBank?" : "Siap Menggunakan AliBank?"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-[#2E2431] pt-8">
              {/* Col 1 */}
              <div className="space-y-2">
                <h5 className="font-serif text-base font-bold text-white">
                  {lang === "en" ? "Learn" : "Pelajari"}
                </h5>
                <p className="text-xs text-[#999999] font-light leading-relaxed">
                  {lang === "en"
                    ? "Learn the basics of the hybrid protocol and proof of reserves."
                    : "Pahami dasar protokol hibrida dan audit bukti cadangan."}
                </p>
                <NextLink href="/learn" className="text-xs font-bold text-[#F4B728] hover:underline block pt-1">
                  {lang === "en" ? "Knowledge Hub →" : "Pusat Pengetahuan →"}
                </NextLink>
              </div>

              {/* Col 2 */}
              <div className="space-y-2">
                <h5 className="font-serif text-base font-bold text-white">
                  {lang === "en" ? "Use AliBank" : "Gunakan AliBank"}
                </h5>
                <p className="text-xs text-[#999999] font-light leading-relaxed">
                  {lang === "en"
                    ? "Fund your account via QRIS or USDT, trade, and pay merchants."
                    : "Isi saldo melalui QRIS atau USDT, jual-beli kripto, dan belanja."}
                </p>
                <NextLink href="/ecosystem" className="text-xs font-bold text-[#F4B728] hover:underline block pt-1">
                  {lang === "en" ? "Find Gateways →" : "Lihat Saluran Dana →"}
                </NextLink>
              </div>

              {/* Col 3 */}
              <div className="space-y-2">
                <h5 className="font-serif text-base font-bold text-white">
                  {lang === "en" ? "Connect" : "Komunitas"}
                </h5>
                <p className="text-xs text-[#999999] font-light leading-relaxed">
                  {lang === "en"
                    ? "Visit the community, report bugs, or audit the public contracts."
                    : "Bergabung dengan komunitas pengembang dan audit smart contract."}
                </p>
                <NextLink href="/network" className="text-xs font-bold text-[#F4B728] hover:underline block pt-1">
                  {lang === "en" ? "Network Info →" : "Info Jaringan →"}
                </NextLink>
              </div>

              {/* Col 4 */}
              <div className="space-y-2">
                <h5 className="font-serif text-base font-bold text-white">
                  {lang === "en" ? "Build" : "Kembangkan"}
                </h5>
                <p className="text-xs text-[#999999] font-light leading-relaxed">
                  {lang === "en"
                    ? "Build merchant POS integrations with our high-speed REST APIs."
                    : "Integrasikan kasir POS dan sistem toko Anda dengan REST API kami."}
                </p>
                <NextLink href="/ecosystem?category=build" className="text-xs font-bold text-[#F4B728] hover:underline block pt-1">
                  {lang === "en" ? "Developer Docs →" : "Dokumentasi API →"}
                </NextLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          7. DETAIL TUTORIAL MODAL
          ========================================================================= */}
      {selectedTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm max-w-2xl w-full p-6 sm:p-10 relative shadow-2xl space-y-6 text-[#111111] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTutorial(null)}
              className="absolute top-6 right-6 p-2 text-[#777777] hover:text-black rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8 text-left">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F4B728] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F4B728]" />
                {selectedTutorial.category}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] leading-snug tracking-tight">
                {lang === "en" ? selectedTutorial.titleEn : selectedTutorial.titleId}
              </h2>
            </div>

            <div className="w-full h-px bg-[#DFDAD0]" />

            <div className="space-y-4 text-xs sm:text-sm text-[#333333] font-light leading-relaxed whitespace-pre-line text-left">
              {lang === "en" ? selectedTutorial.contentEn : selectedTutorial.contentId}
            </div>

            <div className="pt-6 border-t border-[#DFDAD0] flex flex-wrap items-center justify-between gap-4">
              <NextLink
                href="/ecosystem"
                onClick={() => setSelectedTutorial(null)}
                className="text-xs font-bold text-black underline underline-offset-4 hover:text-[#F4B728] transition-colors"
              >
                {lang === "en" ? "Explore Ecosystem Tools →" : "Buka Ekosistem Terkait →"}
              </NextLink>

              <button
                onClick={() => setSelectedTutorial(null)}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
              >
                {lang === "en" ? "Close" : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. FOOTER (Exact Zcash Editorial Aesthetics)
          ========================================================================= */}
      <footer className="bg-black text-white py-16 px-6 border-t border-[#222222]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 text-xs">
          <div className="md:col-span-5 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-sm">
                A
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                AliBank
              </span>
            </div>
            <p className="font-serif text-2xl font-light text-[#EAE6DF] max-w-sm leading-snug">
              {lang === "en"
                ? "AliBank is mathematically backed electronic hybrid cash."
                : "AliBank adalah uang hibrida elektronik dengan cadangan matematis."}
            </p>
          </div>

          <div className="md:col-span-2 space-y-3 text-left">
            <h5 className="font-bold text-[10px] tracking-[0.2em] text-[#888888] uppercase">
              {lang === "en" ? "EXPLORE" : "JELAJAHI"}
            </h5>
            <ul className="space-y-2 text-[#CCCCCC]">
              <li>
                <NextLink href="/learn" className="hover:text-white transition-colors">
                  {lang === "en" ? "Learn AliBank" : "Pelajari AliBank"}
                </NextLink>
              </li>
              <li>
                <NextLink href="/ecosystem" className="hover:text-white transition-colors">
                  {lang === "en" ? "Ecosystem" : "Ekosistem"}
                </NextLink>
              </li>
              <li>
                <NextLink href="/network" className="hover:text-white transition-colors">
                  {lang === "en" ? "Network Info" : "Info Jaringan"}
                </NextLink>
              </li>
              <li>
                <NextLink href="/#features" className="hover:text-white transition-colors">
                  {lang === "en" ? "Core Features" : "Fitur Utama"}
                </NextLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3 text-left">
            <h5 className="font-bold text-[10px] tracking-[0.2em] text-[#888888] uppercase">
              {lang === "en" ? "COMPLIANCE & LEGAL" : "KEPATUHAN & HUKUM"}
            </h5>
            <ul className="space-y-2 text-[#CCCCCC]">
              <li>
                <NextLink href="/learn?category=aml" className="hover:text-white transition-colors">
                  {lang === "en" ? "Anti-Money Laundering (AML)" : "Pencegahan Pencucian Uang"}
                </NextLink>
              </li>
              <li>
                <NextLink href="/learn?category=por" className="hover:text-white transition-colors">
                  {lang === "en" ? "Proof of Reserves (PoR)" : "Bukti Cadangan (PoR)"}
                </NextLink>
              </li>
              <li>
                <NextLink href="/about" className="hover:text-white transition-colors">
                  {lang === "en" ? "Privacy & Terms" : "Privasi & Syarat"}
                </NextLink>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3 text-left">
            <h5 className="font-bold text-[10px] tracking-[0.2em] text-[#888888] uppercase">
              {lang === "en" ? "CONNECT" : "KONTAK"}
            </h5>
            <ul className="space-y-2 text-[#CCCCCC]">
              <li>
                <a
                  href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Polygonscan ALX
                </a>
              </li>
              <li>
                <a
                  href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Etherscan Vault
                </a>
              </li>
              <li>
                <NextLink href="/use-alibank" className="hover:text-white transition-colors">
                  {lang === "en" ? "How to Use Guide" : "Panduan Penggunaan"}
                </NextLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-[#222222] flex flex-col sm:flex-row items-center justify-between text-[#777777] text-[11px] gap-4">
          <p>© {new Date().getFullYear()} AliBank Institutional Network. All rights reserved.</p>
          <p>BIP-39 / BIP-44 Universal Standard • Audited by AliBank Security Guild</p>
        </div>
      </footer>
    </div>
  );
}

