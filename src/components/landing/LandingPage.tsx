"use client";

import React, { useState, useMemo } from "react";
import NextLink from "next/link";
import {
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onEnterApp?: () => void;
}

// Pre-computed guilloche rays with 2 decimal precision to guarantee 100% SSR-client hydration match
const HERO_GUILLOCHE_RAYS = Array.from({ length: 72 }, (_, i) => {
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

export function LandingPage({ onEnterApp }: LandingPageProps) {
  // English is the default language as requested
  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [copiedContract, setCopiedContract] = useState<string | null>(null);

  const ALX_POLYGON_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const ETH_VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContract(id);
    setTimeout(() => setCopiedContract(null), 2000);
  };

  const content = useMemo(() => {
    return lang === "en"
      ? {
          // Nav
          navLearn: "LEARN",
          navEcosystem: "ECOSYSTEM",
          navNetwork: "NETWORK",
          navFeatures: "FEATURES",
          navCommunity: "COMMUNITY",
          navFaq: "FAQ",
          navSignIn: "Sign In",
          navUseAlibank: "Open Account",

          // Hero
          heroTitle: "AliBank is sovereign electronic banking.",
          heroSubtitle:
            "The first hybrid neo-banking network uniting instant zero-fee settlement with on-chain cryptographic reserves and self-sovereign multi-chain custody.",
          heroCta1: "Use AliBank",
          heroCta2: "Learn AliBank",
          heroBadgeTitle: "AliBank and ALX:",
          heroBadgeSub: "What's the difference?",

          // Key Stats Bar
          stat1Val: "$12.24",
          stat1Label: "CURRENT ANCHOR PRICE (USDT)",
          stat2Val: "1,000,000,000",
          stat2Label: "OUTSTANDING ALX SUPPLY",
          stat3Val: "100% VERIFIED",
          stat3Label: "ON-CHAIN PROOF OF RESERVES",

          // Dark Statement Banner
          shieldedHeading: "Stay sovereign.",
          shieldedSub:
            "Zero fractional-reserve lending. Zero unbacked tokens. Absolute cryptographic certainty.",

          // Supported By
          supportedTitle: "AliBank is anchored by industry standards",
          supportedSubtitle:
            "AliBank is built upon audited smart contracts, decentralized Layer-2 settlement, and enterprise-grade key management protocols.",
          exploreButton: "Explore Architecture",

          // Features (6 wireframe items)
          featuresTitle: "Features",
          feat1Title: "Fair & open",
          feat1Desc:
            "AliBank is accessible to anyone with an internet connection. No artificial borders, discriminatory tiers, or arbitrary account freezes.",
          feat2Title: "Private & sovereign",
          feat2Desc:
            "You maintain full ownership of your cryptographic keys. Connect your own hardware or self-custodial wallet with zero vendor lock-in.",
          feat3Title: "You're in control",
          feat3Desc:
            "AliBank is a hybrid protocol: enjoy high-speed zero-fee internal banking rails or settle trustlessly on-chain — you choose.",
          feat4Title: "Proof of Reserves",
          feat4Desc:
            "Every single ALX token and fiat liability is backed 1:1 and verified in real-time on public Polygon and Ethereum explorers.",
          feat5Title: "Fast, low fees",
          feat5Desc:
            "Internal peer-to-peer transfers settle in under 200 milliseconds with zero transaction fees, faster and cheaper than legacy wire transfers.",
          feat6Title: "Self-balancing ledger",
          feat6Desc:
            "A mathematically constrained double-entry ledger that automatically flags anomalies, eliminates phantom balances, and guarantees solvency.",

          // Ready to use AliBank?
          readyTitle: "Ready to use ALX?",
          card1Title: "Learn",
          card1Desc:
            "Learn the architecture of the dual-ledger model, tokenomics, and mathematical reserve audits.",
          card2Title: "Use AliBank",
          card2Desc:
            "Open an instant neobank account, deposit IDR or USDT, and send fee-free transfers globally.",
          card3Title: "Connect",
          card3Desc:
            "Connect your external Web3 wallet (MetaMask, TrustWallet) directly to the on-chain Polygon contract.",
          card4Title: "Build",
          card4Desc:
            "Integrate the AliBank Merchant POS API, Webhooks, and decentralized QRIS crypto payment gateway.",

          // FAQ
          faqTitle: "Frequently Asked Questions",
          faq1Q: "Is AliBank a legitimate banking platform or an investment scam?",
          faq1A:
            "AliBank is a real hybrid neo-banking platform, NOT a high-yield investment program (HYIP) or Ponzi scheme. We do not promise unrealistic passive ROI. Our utility token ALX is deployed on Polygon Mainnet (ERC-20: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd) and our reserves are 100% auditable on Ethereum and Polygon. Anyone can verify our contract code and ledger solvency on public blockchain explorers.",
          faq2Q: "What is the difference between AliBank and the ALX coin?",
          faq2A:
            "AliBank is the overall neo-banking financial operating system providing accounts, internal P2P transfers, merchant POS, and double-entry accounting. ALX is the native cryptographic utility token minted on Polygon Mainnet used for zero-fee payment rebates, multi-chain liquidity settlement, and decentralized staking rewards.",
          faq3Q: "Can I withdraw my funds at any time?",
          faq3A:
            "Yes. AliBank does not practice fractional-reserve banking. Your funds are backed 1:1 and are not locked into multi-year lending schemes. You can withdraw your IDR, USDT, or crypto balances anytime via bank wire or on-chain wallet transfers without recruitment prerequisites.",
          faq4Q: "Does AliBank support TrustWallet and MetaMask?",
          faq4A:
            "Yes. AliBank user addresses are derived using industry-standard BIP-39, BIP-44, and BIP-84 Bitcoin SegWit cryptographic specifications. You can connect your MetaMask or any WalletConnect-compatible wallet directly to our on-chain bridge.",

          // Footer
          footerTagline: "AliBank is sovereign electronic banking.",
          footerCol1: "LEARN",
          footerCol2: "ECOSYSTEM",
          footerCol3: "NETWORK",
          footerCol4: "LEGAL",
          footerContractsTitle: "VERIFIED ON-CHAIN CONTRACTS",
        }
      : {
          // Nav
          navLearn: "PELAJARI",
          navEcosystem: "EKOSISTEM",
          navNetwork: "JARINGAN",
          navFeatures: "FITUR",
          navCommunity: "KOMUNITAS",
          navFaq: "FAQ",
          navSignIn: "Masuk",
          navUseAlibank: "Buka Rekening",

          // Hero
          heroTitle: "AliBank adalah perbankan elektronik yang berdaulat.",
          heroSubtitle:
            "Jaringan neobank hibrida pertama yang menyatukan penyelesaian instan tanpa biaya dengan cadangan kriptografi on-chain dan kedaulatan dompet multi-chain.",
          heroCta1: "Gunakan AliBank",
          heroCta2: "Pelajari AliBank",
          heroBadgeTitle: "AliBank dan ALX:",
          heroBadgeSub: "Apa perbedaannya?",

          // Key Stats Bar
          stat1Val: "$12.24",
          stat1Label: "HARGA JANGKAR SAAT INI (USDT)",
          stat2Val: "1.000.000.000",
          stat2Label: "TOTAL PASOKAN ALX ON-CHAIN",
          stat3Val: "100% TERVERIFIKASI",
          stat3Label: "BUKTI CADANGAN ON-CHAIN (POR)",

          // Dark Statement Banner
          shieldedHeading: "Tetap berdaulat.",
          shieldedSub:
            "Nol fractional-reserve. Nol token tanpa cadangan. Kepastian matematis mutlak.",

          // Supported By
          supportedTitle: "AliBank berakar pada standar industri terbuka",
          supportedSubtitle:
            "AliBank dibangun di atas smart contract terverifikasi, penyelesaian Layer-2 terdesentralisasi, dan protokol kunci kriptografi berstandar perbankan.",
          exploreButton: "Jelajahi Arsitektur",

          // Features (6 wireframe items)
          featuresTitle: "Fitur Unggulan",
          feat1Title: "Adil & Terbuka",
          feat1Desc:
            "AliBank dapat diakses oleh siapa saja dengan koneksi internet. Tanpa batasan diskriminatif, tanpa pembekuan akun sepihak.",
          feat2Title: "Pribadi & Berdaulat",
          feat2Desc:
            "Anda memegang kendali penuh atas kunci kriptografi Anda. Hubungkan dompet perangkat keras atau dompet Web3 pribadi tanpa ketergantungan.",
          feat3Title: "Anda Memegang Kendali",
          feat3Desc:
            "AliBank adalah protokol hibrida: gunakan jalur kustodi cepat tanpa biaya untuk kebutuhan harian atau selesaikan di on-chain Polygon.",
          feat4Title: "Bukti Cadangan (PoR)",
          feat4Desc:
            "Setiap koin ALX dan liabilitas fiat dicadangkan 1:1 dan dapat diverifikasi langsung di penjelajah publik Polygonscan dan Etherscan.",
          feat5Title: "Cepat & Bebas Biaya",
          feat5Desc:
            "Transfer P2P internal antar-nasabah selesai dalam waktu kurang dari 200 milidetik dengan biaya Rp 0.",
          feat6Title: "Buku Besar Seimbang",
          feat6Desc:
            "Buku besar berpasangan (Double-Entry Ledger) yang secara otomatis menolak anomali, mencegah saldo hantu, dan menjamin solvensi bank.",

          // Ready to use AliBank?
          readyTitle: "Siap Menggunakan ALX?",
          card1Title: "Pelajari",
          card1Desc:
            "Pahami arsitektur buku besar ganda, tokenomik, dan laporan audit cadangan matematis kami.",
          card2Title: "Gunakan AliBank",
          card2Desc:
            "Buka rekening neobank gratis, setor IDR atau USDT, dan nikmati transfer bebas biaya.",
          card3Title: "Hubungkan",
          card3Desc:
            "Hubungkan dompet Web3 eksternal (MetaMask, TrustWallet) langsung ke brankas on-chain Polygon.",
          card4Title: "Integrasikan",
          card4Desc:
            "Gunakan API Merchant POS AliBank, Webhooks, dan gateway pembayaran QRIS kripto.",

          // FAQ
          faqTitle: "Pertanyaan yang Sering Diajukan",
          faq1Q: "Apakah AliBank platform perbankan nyata atau skema penipuan (scam)?",
          faq1A:
            "AliBank adalah platform neobanking digital hibrida nyata, BUKAN skema investasi bodong atau penggandaan uang (HYIP). Kami tidak menjanjikan imbal hasil pasif yang mustahil. Token utilitas ALX resmi diterbitkan di Polygon Mainnet (ERC-20: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd) dan cadangan kas serta smart contract kami terbuka 100% untuk diaudit di blockchain publik oleh siapa saja.",
          faq2Q: "Apa perbedaan antara AliBank dan koin ALX?",
          faq2A:
            "AliBank adalah platform sistem operasi perbankan digital (rekening, mutasi P2P, POS kasir, buku besar ganda). Sedangkan ALX adalah koin kripto utilitas resmi yang beroperasi di Polygon Mainnet untuk rabat biaya transaksi, staking, dan jaminan likuiditas.",
          faq3Q: "Apakah saya bisa menarik saldo saya kapan saja?",
          faq3A:
            "Tentu saja. AliBank tidak menggunakan sistem fractional-reserve. Dana Anda dicadangkan 1:1 sehingga Anda bebas melakukan penarikan IDR ke rekening bank atau penarikan aset kripto ke dompet eksternal kapan pun tanpa syarat member get member.",
          faq4Q: "Apakah AliBank kompatibel dengan TrustWallet dan MetaMask?",
          faq4A:
            "Ya. Alamat dompet nasabah AliBank diturunkan menggunakan standar internasional BIP-39, BIP-44, dan Bitcoin Native SegWit BIP-84. Anda juga dapat menghubungkan MetaMask Web3 secara instan melalui jembatan native kami.",

          // Footer
          footerTagline: "AliBank adalah perbankan elektronik yang berdaulat.",
          footerCol1: "PELAJARI",
          footerCol2: "EKOSISTEM",
          footerCol3: "JARINGAN",
          footerCol4: "LEGAL",
          footerContractsTitle: "SMART CONTRACT TERVERIFIKASI ON-CHAIN",
        };
  }, [lang]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111111] font-body selection:bg-[#F4B728]/30 overflow-x-hidden antialiased">
      {/* =========================================================================
          1. HEADER & TOP NAVIGATION (Zcash-style minimalism)
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
                    : "text-[#444444] hover:text-[#111111]"
                )}
              >
                <span>{content.navLearn}</span>
              </button>
              {activeMegaMenu === "learn" && (
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
                <span>{content.navEcosystem}</span>
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
                <span>{content.navNetwork}</span>
              </button>
              {activeMegaMenu === "network" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>
            <a href="#features" onClick={() => setActiveMegaMenu(null)} className="hover:text-black transition-colors">
              {content.navFeatures}
            </a>
            <a href="#faq" onClick={() => setActiveMegaMenu(null)} className="hover:text-black transition-colors">
              {content.navFaq}
            </a>
          </nav>

          {/* Actions: Minimalist Lang Toggle & Search Icon (Clean Zcash Standard, No Sign In / Open Account) */}
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

            <NextLink
              href="/learn"
              className="p-2 text-[#444444] hover:text-black transition-colors"
              title="Search Knowledge Hub"
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
                    <NextLink
                      href="/learn"
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Browse Knowledge Hub →" : "Buka Pusat Pengetahuan →"}
                    </NextLink>
                  </div>
                </div>

                {/* Col 2: ALIBANK 101 */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    ALIBANK 101
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/learn?category=101"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "What is AliBank?" : "Apa itu AliBank?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=101"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "How is AliBank different from ALX?" : "Apa beda AliBank dengan ALX?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=wallet"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en" ? "What are TrustWallet Core standards?" : "Apa itu standar TrustWallet Core?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=101"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </NextLink>
                    </li>
                  </ul>
                </div>

                {/* Col 3: SECURITY & AML */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
                    <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#E11D48]">
                      {lang === "en" ? "SECURITY & AML" : "KEAMANAN & AML"}
                    </h4>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <NextLink
                        href="/learn?category=aml"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black font-medium text-[#111111] transition-colors block"
                      >
                        {lang === "en"
                          ? "Zero-Tolerance Anti-Money Laundering Policy"
                          : "Kebijakan Nol-Toleransi Anti-Pencucian Uang"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=aml"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en"
                          ? "Real-Time Anomaly & Phantom Detection"
                          : "Deteksi Saldo Hantu & Anomali Real-Time"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=aml"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en"
                          ? "What triggers an account restriction?"
                          : "Apa yang memicu pembekuan akun?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=aml"
                        onClick={() => setActiveMegaMenu(null)}
                        className="text-[11px] font-bold text-[#E11D48] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "Explore AML Engine →" : "Pelajari Mesin AML →"}
                      </NextLink>
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
                      <NextLink
                        href="/learn?category=por"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en"
                          ? "How to audit Proof of Reserves?"
                          : "Cara audit Bukti Cadangan (PoR)?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=architecture"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en"
                          ? "Why double-entry ledger matters?"
                          : "Mengapa buku besar ganda mutlak?"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn?category=merchant"
                        onClick={() => setActiveMegaMenu(null)}
                        className="hover:text-black transition-colors block"
                      >
                        {lang === "en"
                          ? "Merchant POS & QRIS acceptance"
                          : "Penerimaan Kasir POS & QRIS"}
                      </NextLink>
                    </li>
                    <li>
                      <NextLink
                        href="/learn"
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
            1.B MEGA MENU: ECOSYSTEM
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
      </header>

      {/* =========================================================================
          2. HERO SECTION (Classic Editorial Serif + Radial Sunburst Graphic)
          ========================================================================= */}
      <section className="relative pt-16 pb-24 md:pt-24 md:pb-36 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8">
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[4.25rem] font-normal tracking-tight text-[#111111] leading-[1.08]">
                {content.heroTitle}
              </h1>
              <p className="text-lg sm:text-xl text-[#555555] font-light leading-relaxed max-w-xl">
                {content.heroSubtitle}
              </p>

              {/* CTAs: Use AliBank directs to /use-alibank */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <NextLink
                  href="/use-alibank"
                  className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] px-8 py-4 rounded-sm transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  {content.heroCta1}
                </NextLink>
                <NextLink
                  href="/learn"
                  className="border border-[#111111] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold uppercase tracking-[0.16em] px-8 py-4 rounded-sm transition-colors"
                >
                  {content.heroCta2}
                </NextLink>
              </div>
            </div>

            {/* Right Graphic: Iconic Radial Sunburst Guilloche with Floating Badge */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              {/* Radiating Sunburst SVG */}
              <div className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] flex items-center justify-center">
                <svg
                  viewBox="0 0 400 400"
                  className="w-full h-full text-[#111111]/80 animate-[spin_120s_linear_infinite]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  suppressHydrationWarning
                >
                  {/* Central Inner Rings */}
                  <circle cx="200" cy="200" r="40" strokeWidth="1" />
                  <circle cx="200" cy="200" r="70" strokeWidth="0.5" strokeDasharray="3 3" />
                  <circle cx="200" cy="200" r="120" strokeWidth="0.6" />
                  <circle cx="200" cy="200" r="180" strokeWidth="1" />
                  {/* 72 Radiating Guilloche Rays */}
                  {HERO_GUILLOCHE_RAYS.map((ray, i) => (
                    <line
                      key={i}
                      x1={ray.x1}
                      y1={ray.y1}
                      x2={ray.x2}
                      y2={ray.y2}
                      opacity={ray.opacity}
                    />
                  ))}
                </svg>

                {/* Overlapping Interactive Floating Badge */}
                <button
                  onClick={() => setIsDiffModalOpen(true)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 bg-white border border-[#DFDAD0] p-4 sm:p-5 rounded-sm shadow-xl text-left max-w-[210px] group transition-all duration-300 hover:border-black hover:shadow-2xl cursor-pointer z-20"
                >
                  <span className="block text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-1">
                    {content.heroBadgeTitle}
                  </span>
                  <span className="block font-serif text-sm sm:text-base font-semibold text-[#111111] group-hover:text-[#F4B728] transition-colors leading-snug">
                    {content.heroBadgeSub} →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. KEY METRICS FLOATING BAR (Zcash-style elevated horizontal card)
            ========================================================================= */}
        <div className="max-w-[1040px] mx-auto px-6 relative z-20 mt-12 sm:mt-16">
          <div className="bg-white border border-[#DFDAD0] rounded-sm shadow-2xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#ECE7DE]">
            {/* Stat 1 */}
            <div className="text-center py-4 md:py-0 md:px-6">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
                {content.stat1Val}
              </p>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#777777] mt-2">
                {content.stat1Label}
              </p>
            </div>

            {/* Stat 2 */}
            <div className="text-center py-4 md:py-0 md:px-6">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
                {content.stat2Val}
              </p>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#777777] mt-2">
                {content.stat2Label}
              </p>
            </div>

            {/* Stat 3 */}
            <div className="text-center py-4 md:py-0 md:px-6">
              <p className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight text-[#16A34A]">
                {content.stat3Val}
              </p>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#777777] mt-2">
                {content.stat3Label}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. "STAY SOVEREIGN." DARK CODE MATRIX SECTION (Zcash "Stay shielded.")
          ========================================================================= */}
      <section className="relative bg-[#0D0B0E] text-white py-32 md:py-44 overflow-hidden border-y border-[#262127]">
        {/* Monospaced Cryptographic & Solidity Code Background Watermark */}
        <div className="absolute inset-0 opacity-15 select-none pointer-events-none font-mono text-[11px] leading-[18px] text-[#A3A3A3] overflow-hidden p-6 sm:p-12 whitespace-pre">
{`// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AliBankProtocol is ERC20, Ownable {
    bytes32 public constant LEDGER_ROOT = 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd;
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18;
    mapping(address => uint256) public verifiedProofOfReserves;

    event SolvencyVerified(bytes32 indexed merkleRoot, uint256 timestamp, uint256 totalAssets);

    function verifySolvency(bytes32 root, uint256 assets) external onlyOwner {
        require(assets <= MAX_SUPPLY, "Reserve: Exceeds hard cap");
        emit SolvencyVerified(root, block.timestamp, assets);
    }

    function settleP2P(address sender, address recipient, uint256 amount) internal {
        require(balanceOf(sender) >= amount, "AliBank: Insufficient backed balance");
        _transfer(sender, recipient, amount);
    }
}
// zk-SNARK Merkle Tree Proof Generator: verified non-custodial root
// Curve: secp256k1 & BIP-44 Derivation Path: m/44'/60'/0'/0/0`}
        </div>

        {/* Centered Large Serif Headline */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-normal tracking-tight text-white leading-tight">
            {content.shieldedHeading}
          </h2>
          <p className="text-sm sm:text-base text-[#9E9A9F] tracking-[0.2em] uppercase font-light max-w-xl mx-auto">
            {content.shieldedSub}
          </p>
        </div>
      </section>

      {/* =========================================================================
          5. "ALIBANK IS ANCHORED BY INDUSTRY STANDARDS" (Ecosystem & Partners)
          ========================================================================= */}
      <section id="ecosystem" className="py-24 md:py-32 bg-[#FBF9F5] border-b border-[#EAE6DF]">
        <div className="max-w-[1280px] mx-auto px-6 text-center space-y-6">
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#111111] tracking-tight">
            {content.supportedTitle}
          </h2>
          <p className="text-base sm:text-lg text-[#666666] max-w-2xl mx-auto font-light leading-relaxed">
            {content.supportedSubtitle}
          </p>

          {/* Clean Infrastructure Logos Grid */}
          <div className="pt-10 pb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center">
            {/* Polygon */}
            <a
              href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 border border-[#DFDAD0] bg-white rounded-sm hover:border-black transition-all group flex flex-col items-center justify-center gap-2"
            >
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777] group-hover:text-black">
                POLYGON
              </span>
              <span className="text-[10px] font-mono text-[#999999]">L2 Settlement</span>
            </a>

            {/* Ethereum Vault */}
            <a
              href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 border border-[#DFDAD0] bg-white rounded-sm hover:border-black transition-all group flex flex-col items-center justify-center gap-2"
            >
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777] group-hover:text-black">
                ETHEREUM
              </span>
              <span className="text-[10px] font-mono text-[#999999]">Cold Vault</span>
            </a>

            {/* TrustWallet Core */}
            <div className="p-5 border border-[#DFDAD0] bg-white rounded-sm flex flex-col items-center justify-center gap-2">
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777]">
                TRUSTWALLET
              </span>
              <span className="text-[10px] font-mono text-[#999999]">Core Standard</span>
            </div>

            {/* MetaMask */}
            <div className="p-5 border border-[#DFDAD0] bg-white rounded-sm flex flex-col items-center justify-center gap-2">
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777]">
                METAMASK
              </span>
              <span className="text-[10px] font-mono text-[#999999]">Web3 Bridge</span>
            </div>

            {/* Bitcoin SegWit */}
            <div className="p-5 border border-[#DFDAD0] bg-white rounded-sm flex flex-col items-center justify-center gap-2">
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777]">
                BITCOIN
              </span>
              <span className="text-[10px] font-mono text-[#999999]">Native SegWit</span>
            </div>

            {/* Tether USDT */}
            <div className="p-5 border border-[#DFDAD0] bg-white rounded-sm flex flex-col items-center justify-center gap-2">
              <span className="font-bold text-xs uppercase tracking-widest text-[#777777]">
                TETHER USDT
              </span>
              <span className="text-[10px] font-mono text-[#999999]">1:1 Cash Vault</span>
            </div>
          </div>

          <div>
            <a
              href="#network"
              className="border border-[#111111] hover:bg-[#111111] hover:text-white text-[#111111] text-[11px] font-bold uppercase tracking-[0.18em] px-8 py-3.5 rounded-sm transition-all inline-block"
            >
              {content.exploreButton}
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FEATURES GRID (Deep Charcoal/Plum `#151216` with Custom Wireframe Icons)
          ========================================================================= */}
      <section id="features" className="py-28 md:py-36 bg-[#151216] text-white">
        <div className="max-w-[1280px] mx-auto px-6">
          {/* Section Title */}
          <div className="text-center mb-20">
            <h2 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight text-white">
              {content.featuresTitle}
            </h2>
          </div>

          {/* 6 Wireframe Feature Cards (2 Rows × 3 Cols) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Feat 1: Fair & Open */}
            <div className="space-y-5 text-center flex flex-col items-center">
              {/* Custom Wireframe Box Icon with Top-Right Gold Accent */}
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M10 10L16 16M30 10L24 16M10 30L16 24M30 30L24 24" />
                  <rect x="16" y="16" width="8" height="8" />
                </svg>
                {/* Gold corner badge */}
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  ✓
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat1Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat1Desc}
              </p>
            </div>

            {/* Feat 2: Private & Sovereign */}
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="10" y="8" width="20" height="24" rx="2" />
                  <line x1="15" y1="14" x2="25" y2="14" />
                  <line x1="15" y1="19" x2="25" y2="19" />
                  <line x1="15" y1="24" x2="21" y2="24" />
                </svg>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  🔒
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat2Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat2Desc}
              </p>
            </div>

            {/* Feat 3: You're in Control */}
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="20" cy="15" r="5" />
                  <path d="M12 30C12 25 15.5 23 20 23C24.5 23 28 25 28 30" />
                </svg>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  ⚡
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat3Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat3Desc}
              </p>
            </div>

            {/* Feat 4: Proof of Reserves */}
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <polygon points="20,8 30,14 30,26 20,32 10,26 10,14" />
                  <line x1="20" y1="8" x2="20" y2="32" />
                </svg>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  1:1
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat4Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat4Desc}
              </p>
            </div>

            {/* Feat 5: Fast, Low Fees */}
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="20" cy="20" r="10" />
                  <polyline points="20,14 20,20 24,22" />
                </svg>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  0$
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat5Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat5Desc}
              </p>
            </div>

            {/* Feat 6: Self-Balancing Ledger */}
            <div className="space-y-5 text-center flex flex-col items-center">
              <div className="relative w-16 h-16 border border-[#555057] flex items-center justify-center rounded-sm">
                <svg viewBox="0 0 40 40" className="w-8 h-8 text-[#A39FA5]" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="20" cy="20" r="11" />
                  <circle cx="20" cy="20" r="4" />
                  <line x1="20" y1="9" x2="20" y2="5" />
                  <line x1="20" y1="31" x2="20" y2="35" />
                </svg>
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#F4B728] text-black text-[9px] font-bold flex items-center justify-center rounded-[1px]">
                  ⚖
                </div>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {content.feat6Title}
              </h3>
              <p className="text-sm text-[#A8A4AB] font-light leading-relaxed max-w-xs">
                {content.feat6Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. "READY TO USE ALX?" ASYMMETRIC 4-GRID SECTION (Zcash-style)
          ========================================================================= */}
      <section id="learn" className="relative py-28 md:py-36 bg-[#0E1318] text-white overflow-hidden">
        {/* Subtle diagonal background gradient / texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-[#1C2733] via-[#0E1318] to-black opacity-80" />

        <div className="max-w-[1280px] mx-auto px-6 relative z-10 space-y-12">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white tracking-tight">
            {content.readyTitle}
          </h2>

          {/* 4 Connected Box Grid with 1px border lines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#2D3A49] divide-y sm:divide-y-0 sm:divide-x divide-[#2D3A49] bg-[#0E1318]/70 backdrop-blur-sm">
            {/* Box 1 */}
            <div className="p-8 space-y-4 hover:bg-[#1A2532]/40 transition-colors">
              <h3 className="font-serif text-xl font-bold text-white">
                {content.card1Title}
              </h3>
              <p className="text-xs text-[#9BB0C1] font-light leading-relaxed">
                {content.card1Desc}
              </p>
              <NextLink
                href="/about"
                className="text-[11px] font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1 hover:underline pt-2"
              >
                Documentation →
              </NextLink>
            </div>

            {/* Box 2 */}
            <div className="p-8 space-y-4 hover:bg-[#1A2532]/40 transition-colors">
              <h3 className="font-serif text-xl font-bold text-white">
                {content.card2Title}
              </h3>
              <p className="text-xs text-[#9BB0C1] font-light leading-relaxed">
                {content.card2Desc}
              </p>
              <NextLink
                href="/register"
                className="text-[11px] font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1 hover:underline pt-2"
              >
                Create Account →
              </NextLink>
            </div>

            {/* Box 3 */}
            <div className="p-8 space-y-4 hover:bg-[#1A2532]/40 transition-colors">
              <h3 className="font-serif text-xl font-bold text-white">
                {content.card3Title}
              </h3>
              <p className="text-xs text-[#9BB0C1] font-light leading-relaxed">
                {content.card3Desc}
              </p>
              <a
                href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1 hover:underline pt-2"
              >
                Polygonscan →
              </a>
            </div>

            {/* Box 4 */}
            <div className="p-8 space-y-4 hover:bg-[#1A2532]/40 transition-colors">
              <h3 className="font-serif text-xl font-bold text-white">
                {content.card4Title}
              </h3>
              <p className="text-xs text-[#9BB0C1] font-light leading-relaxed">
                {content.card4Desc}
              </p>
              <NextLink
                href="/login"
                className="text-[11px] font-bold text-[#F4B728] uppercase tracking-wider inline-flex items-center gap-1 hover:underline pt-2"
              >
                Merchant Portal →
              </NextLink>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. VERIFIED SMART CONTRACTS & PROOF-OF-RESERVES TRANSPARENCY
          ========================================================================= */}
      <section id="network" className="py-24 md:py-32 bg-[#FBF9F5] border-b border-[#EAE6DF]">
        <div className="max-w-[1040px] mx-auto px-6 space-y-8">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#777777]">
              PUBLIC CRYPTOGRAPHIC AUDIT
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              {content.footerContractsTitle}
            </h2>
          </div>

          <div className="space-y-4">
            {/* Contract 1: Polygon ALX */}
            <div className="bg-white border border-[#DFDAD0] p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    ALX Utility Token (Polygon PoS)
                  </span>
                  <span className="text-[10px] bg-[#EFECE6] text-[#666666] px-2 py-0.5 rounded-sm font-mono">
                    ERC-20
                  </span>
                </div>
                <p className="font-mono text-xs text-[#555555] break-all mt-1">
                  {ALX_POLYGON_CONTRACT}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(ALX_POLYGON_CONTRACT, "alx")}
                  className="p-2 border border-[#DFDAD0] hover:border-black rounded-sm text-xs font-medium text-[#444444] transition-colors"
                >
                  {copiedContract === "alx" ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Contract 2: Ethereum Vault */}
            <div className="bg-white border border-[#DFDAD0] p-6 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                    Central Liquidity Vault (Ethereum Mainnet)
                  </span>
                  <span className="text-[10px] bg-[#EFECE6] text-[#666666] px-2 py-0.5 rounded-sm font-mono">
                    Cold Multi-Sig
                  </span>
                </div>
                <p className="font-mono text-xs text-[#555555] break-all mt-1">
                  {ETH_VAULT_CONTRACT}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(ETH_VAULT_CONTRACT, "vault")}
                  className="p-2 border border-[#DFDAD0] hover:border-black rounded-sm text-xs font-medium text-[#444444] transition-colors"
                >
                  {copiedContract === "vault" ? <Check className="w-4 h-4 text-[#16A34A]" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Verify</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. FAQ SECTION (Clear, Anti-FUD Transparency)
          ========================================================================= */}
      <section id="faq" className="py-24 md:py-32 bg-[#FBF9F5]">
        <div className="max-w-[900px] mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              {content.faqTitle}
            </h2>
          </div>

          <div className="divide-y divide-[#ECE7DE] border-y border-[#ECE7DE]">
            {[
              { q: content.faq1Q, a: content.faq1A },
              { q: content.faq2Q, a: content.faq2A },
              { q: content.faq3Q, a: content.faq3A },
              { q: content.faq4Q, a: content.faq4A },
            ].map((faq, i) => (
              <div key={i} className="py-6">
                <button
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full flex items-center justify-between text-left gap-4 group"
                >
                  <span className="font-serif text-lg sm:text-xl font-semibold text-[#111111] group-hover:text-[#F4B728] transition-colors">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-[#888888] transition-transform duration-300 shrink-0",
                      activeFaq === i && "rotate-180 text-black"
                    )}
                  />
                </button>
                {activeFaq === i && (
                  <p className="mt-4 text-sm sm:text-base text-[#555555] font-light leading-relaxed animate-in fade-in duration-300">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FOOTER (Deep Black Zcash Directory Style)
          ========================================================================= */}
      <footer className="bg-[#0A0A0A] text-white pt-24 pb-16 border-t border-[#222222]">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-12 pb-16 border-b border-[#222222]">
            {/* Brand Column */}
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
                {content.footerTagline}
              </p>
              <p className="text-xs text-[#777777] font-light max-w-sm">
                Institutional-grade dual-ledger financial operating system compliant with BIP-39 / BIP-44 key standards.
              </p>
            </div>

            {/* Nav Column 1: Learn */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                {content.footerCol1}
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <a href="#learn" className="hover:text-white transition-colors">
                    Overview
                  </a>
                </li>
                <li>
                  <a href="#network" className="hover:text-white transition-colors">
                    Proof of Reserves
                  </a>
                </li>
                <li>
                  <NextLink href="/about" className="hover:text-white transition-colors">
                    Architecture
                  </NextLink>
                </li>
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Nav Column 2: Ecosystem */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                {content.footerCol2}
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
                <li>
                  <NextLink href="/login" className="hover:text-white transition-colors">
                    Merchant Gateway
                  </NextLink>
                </li>
              </ul>
            </div>

            {/* Nav Column 3: Legal */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                {content.footerCol4}
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <a href="#faq" className="hover:text-white transition-colors">
                    Solvency Audit
                  </a>
                </li>
                <li>
                  <NextLink href="/about" className="hover:text-white transition-colors">
                    Privacy Policy
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/about" className="hover:text-white transition-colors">
                    Terms of Service
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/login" className="hover:text-white transition-colors">
                    Anti-Fraud Engine
                  </NextLink>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
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

      {/* =========================================================================
          11. INTERACTIVE MODAL: "AliBank and ALX: What's the difference?"
          ========================================================================= */}
      {isDiffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm max-w-xl w-full p-8 relative shadow-2xl space-y-6 text-[#111111]">
            <button
              onClick={() => setIsDiffModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#777777] hover:text-black rounded-sm"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#777777]">
                ARCHITECTURE BRIEFING
              </span>
              <h3 className="font-serif text-3xl font-bold text-[#111111]">
                AliBank and ALX: What&apos;s the difference?
              </h3>
            </div>

            <div className="space-y-4 text-sm text-[#444444] font-light leading-relaxed">
              <div className="p-4 bg-white border border-[#E5E0D6] rounded-sm space-y-1.5">
                <p className="font-bold text-xs uppercase tracking-wider text-[#111111]">
                  1. AliBank (The Financial Operating System)
                </p>
                <p className="text-xs text-[#555555]">
                  AliBank is the hybrid neo-banking platform providing custodial zero-fee accounts, instant peer-to-peer transfers, merchant point-of-sale (POS) processing, and real-time double-entry accounting.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E5E0D6] rounded-sm space-y-1.5">
                <p className="font-bold text-xs uppercase tracking-wider text-[#111111]">
                  2. ALX (The Cryptographic Utility Token)
                </p>
                <p className="text-xs text-[#555555]">
                  ALX is the decentralized ERC-20 utility asset minted on Polygon Mainnet ({ALX_POLYGON_CONTRACT}). It is used as the cryptographic reserve asset, fee-discount driver, and liquidity anchor for cross-border settlements.
                </p>
              </div>

              <p className="text-xs text-[#666666]">
                They work together: users enjoy the convenience of modern banking while retaining the mathematical guarantees and transparent solvency of public blockchain infrastructure.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#ECE7DE]">
              <a
                href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-black underline underline-offset-4 hover:text-[#F4B728] transition-colors"
              >
                Inspect ALX on Polygonscan →
              </a>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="px-5 py-2 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
