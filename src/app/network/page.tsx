"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  ExternalLink,
  X,
  Search,
  TrendingUp,
  ShieldCheck,
  Check,
  Coins,
  Cpu,
  Layers,
  Lock,
  ArrowUpRight,
  Database,
  GitBranch,
  FileCode,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIPItem {
  id: string;
  number: string;
  titleEn: string;
  titleId: string;
  category: "CORE" | "SECURITY" | "INTERFACE" | "CONSENSUS";
  status: "FINAL" | "ACCEPTED" | "REVIEW";
  author: string;
  created: string;
  summaryEn: string;
  summaryId: string;
  specEn: string;
  specId: string;
}

export default function NetworkPage() {
  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeTab, setActiveTab] = useState<"price" | "liquidity" | "volume" | "reserves" | "health">("price");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | null>(null);
  const [selectedAIP, setSelectedAIP] = useState<AIPItem | null>(null);

  const ALX_POLYGON_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const ETH_VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

  const aipList: AIPItem[] = [
    {
      id: "aip-1",
      number: "AIP-001",
      titleEn: "Zero-Tolerance Anti-Money Laundering & Real-Time Anomaly Engine",
      titleId: "Mesin Deteksi Saldo Hantu & Kebijakan Nol-Toleransi Anti-Pencucian Uang",
      category: "SECURITY",
      status: "FINAL",
      author: "AliBank Core Security Guild",
      created: "2024-10-15",
      summaryEn:
        "Mandatory 24/7 reconciliation protocol between off-chain database custody and on-chain central vaults. Automatically detects unbacked deposits, circular wash trading, and phantom balances.",
      summaryId:
        "Protokol rekonsiliasi otomatis 24/7 antara saldo kustodi database dengan brankas publik on-chain. Mendeteksi secara instan injeksi saldo tanpa bukti setoran, perputaran dana palsu, dan transaksi anomali.",
      specEn: `### 1. Specification Overview
The AIP-001 engine establishes a cryptographic bridge between the double-entry database ledger and on-chain balances:
- **Central Vault Audit**: Ethereum Vault (0x5626...0945) and Polygon Contract (0x8BAF...d1Dd) balances are polled continuously.
- **Discrepancy Trigger**: If any user account balance exceeds verifiable historical ledger deposits, a CRITICAL PHANTOM ALERT is raised instantly.
- **Automated Sanction**: The engine immediately executes an autonomous withdrawal lockdown, quarantines suspicious funds, and disallows P2P transfer privileges pending forensic verification.`,
      specId: `### 1. Ringkasan Spesifikasi
Mesin AIP-001 membentuk jembatan kriptografis antara buku besar database ganda dengan brankas on-chain:
- **Audit Brankas Pusat**: Saldo pada Ethereum Vault (0x5626...0945) dan Kontrak Polygon (0x8BAF...d1Dd) diverifikasi berulang secara otomatis.
- **Pemicu Discrepancy**: Jika saldo nasabah melebihi riwayat transaksi sah di buku besar, sistem menerbitkan CRITICAL PHANTOM ALERT seketika.
- **Sanksi Otomatis**: Sistem langsung membekukan akses penarikan, mengkarantina dana yang terindikasi anomali, dan menutup hak transfer P2P demi menjaga rasio cadangan 100%.`
    },
    {
      id: "aip-2",
      number: "AIP-002",
      titleEn: "TrustWallet Core BIP-39/BIP-44 Multi-Chain Key Derivation",
      titleId: "Derivasi Kunci Multi-Chain Berstandar TrustWallet Core (BIP-39/44)",
      category: "CORE",
      status: "FINAL",
      author: "AliBank Cryptographic Architecture Group",
      created: "2024-11-01",
      summaryEn:
        "Enables users to export and import self-sovereign seed phrases seamlessly across MetaMask, TrustWallet, and Ledger hardware without vendor lock-in.",
      summaryId:
        "Memungkinkan nasabah mengekspor dan mengimpor seed phrase berstandar internasional ke MetaMask, TrustWallet, dan hardware wallet tanpa terkunci pada satu aplikasi.",
      specEn: `### 1. Key Derivation Paths
AIP-002 enforces standard hierarchical deterministic (HD) wallet paths conforming to BIP-39, BIP-43, and BIP-44:
- Ethereum & Polygon: \`m/44'/60'/0'/0/0\`
- Bitcoin Native SegWit: \`m/84'/0'/0'/0/0\`
- Hardware Compatibility: Verified on Ledger Nano X and Trezor Model T.`,
      specId: `### 1. Jalur Derivasi Kunci
AIP-002 menerapkan standar Hierarchical Deterministic (HD) wallet yang sepenuhnya patuh pada BIP-39, BIP-43, dan BIP-44:
- Ethereum & Polygon: \`m/44'/60'/0'/0/0\`
- Bitcoin Native SegWit: \`m/84'/0'/0'/0/0\`
- Kompatibilitas Hardware: Teruji pada Ledger Nano X dan Trezor Model T.`
    },
    {
      id: "aip-3",
      number: "AIP-003",
      titleEn: "Dynamic QRIS & Offline Merchant POS Settlement Protocol",
      titleId: "Protokol Kasir POS & QRIS Dinamis Penyelesaian Instan",
      category: "INTERFACE",
      status: "FINAL",
      author: "AliBank Merchant Network",
      created: "2024-11-04",
      summaryEn:
        "Sub-second settlement bridge connecting retail merchant point-of-sale terminals with public stablecoin and fiat gateways with zero chargeback risk.",
      summaryId:
        "Jembatan penyelesaian sub-detik yang menghubungkan terminal kasir toko fisik dengan cadangan stablecoin dan mata uang fiat resmi tanpa risiko chargeback.",
      specEn: `### 1. Settlement Architecture
- Merchant generates dynamic QRIS compliant with ASPI / Bank Indonesia standards.
- Payment is validated on-chain via Polygon or instant bank clearing within 400 milliseconds.
- Automatic conversion and settlement into merchant's primary treasury balance.`,
      specId: `### 1. Arsitektur Penyelesaian
- Kasir menerbitkan QRIS dinamis berstandar resmi ASPI / Bank Indonesia.
- Pembayaran diverifikasi on-chain via Polygon atau kliring bank instan dalam waktu 400 milidetik.
- Konversi otomatis langsung masuk ke rekening kasir merchant tanpa potongan biaya tersembunyi.`
    },
    {
      id: "aip-4",
      number: "AIP-004",
      titleEn: "Automated Proof-of-Reserves Oracles via Chainlink Data Feeds",
      titleId: "Oracle Bukti Cadangan Otomatis Melalui Chainlink Data Feeds",
      category: "CONSENSUS",
      status: "ACCEPTED",
      author: "AliBank Protocol Governance",
      created: "2024-11-06",
      summaryEn:
        "Decentralized oracle feed continuously publishing off-chain bank custodian reserves and crypto vaults directly to smart contracts.",
      summaryId:
        "Feed oracle terdesentralisasi yang secara berkala mempublikasikan cadangan brankas perbankan dan kripto langsung ke smart contract publik.",
      specEn: `### 1. Oracle Integration
- Integrates Chainlink Proof-of-Reserves (PoR) contracts on Polygon.
- Cryptographic proof of real-world assets (USDT, ETH, BTC, IDR).
- If reserve ratio falls below 100%, automated smart contract circuit breakers halt minting.`,
      specId: `### 1. Integrasi Oracle
- Mengintegrasikan kontrak Chainlink Proof-of-Reserves (PoR) di jaringan Polygon.
- Bukti kriptografis cadangan aset nyata (USDT, ETH, BTC, IDR).
- Jika rasio cadangan berada di bawah 100%, circuit breaker smart contract otomatis menghentikan pencetakan saldo.`
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans antialiased selection:bg-[#F4B728] selection:text-black">
      {/* =========================================================================
          1. STICKY HEADER (Exact Zcash proportions & active gold indicator)
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

            {/* NETWORK Trigger (Active page) */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "network" ? null : "network")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "network" ? "text-[#111111]" : "text-black font-black hover:text-black"
                )}
              >
                <span>{lang === "en" ? "NETWORK" : "JARINGAN"}</span>
              </button>
              {/* Always show active gold line because we are on /network */}
              <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
            </div>

            {/* FEATURES with Mega Menu Trigger */}
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
                    <button
                      onClick={() => setActiveMegaMenu(null)}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Explore Network Hub →" : "Buka Hub Jaringan →"}
                    </button>
                  </div>
                </div>

                {/* Col 2: NETWORK INFO */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORK INFO" : "INFO JARINGAN"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setActiveTab("price");
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "Network Statistics" : "Statistik Jaringan"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          const el = document.getElementById("governance-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "Funding & Governance" : "Pendanaan & Tata Kelola"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          const el = document.getElementById("aip-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        {lang === "en" ? "AIPs (Improvement Proposals)" : "AIP (Proposal Pembaruan)"}
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveTab("reserves");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </button>
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
      </header>

      {/* =========================================================================
          2. DARK HERO SECTION (Exact Zcash Network Page Structure)
          ========================================================================= */}
      <section className="bg-[#120F12] text-white pt-16 pb-20 px-6 border-b border-[#221B21]">
        <div className="max-w-[1280px] mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white">
              {lang === "en" ? "Network Information" : "Informasi Jaringan"}
            </h1>
            <p className="max-w-2xl mx-auto text-xs sm:text-sm text-[#A89F91] font-light leading-relaxed">
              {lang === "en"
                ? "The AliBank network is decentralized, sovereign, mathematically backed by real on-chain reserves, and built with institutional-grade cryptography."
                : "Jaringan AliBank terdesentralisasi, independen, didukung secara matematis oleh cadangan aset riil on-chain, dan dibangun dengan standar kriptografi kelas institusi."}
            </p>
          </div>

          {/* Interactive Metric Tabs Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {[
              { id: "price", labelEn: "PRICE", labelId: "HARGA ALX" },
              { id: "liquidity", labelEn: "TOTAL LIQUIDITY", labelId: "TOTAL LIKUIDITAS" },
              { id: "volume", labelEn: "SETTLEMENT VOLUME", labelId: "VOLUME SETTLEMENT" },
              { id: "reserves", labelEn: "PROOF OF RESERVES", labelId: "BUKTI CADANGAN" },
              { id: "health", labelEn: "LEDGER HEALTH", labelId: "KESEHATAN BUKU BESAR" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-4 py-2 text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase rounded-sm border transition-all duration-150",
                  activeTab === tab.id
                    ? "bg-[#F4B728] text-black border-[#F4B728] shadow-md shadow-[#F4B728]/10"
                    : "bg-[#1E1820] text-[#A89F91] border-[#312735] hover:border-[#66536F] hover:text-white"
                )}
              >
                {lang === "en" ? tab.labelEn : tab.labelId}
              </button>
            ))}
          </div>

          {/* Large Floating Metric Display Card (Matching Zcash screenshot) */}
          <div className="max-w-xl mx-auto bg-white text-[#111111] p-8 sm:p-10 rounded-sm shadow-2xl border border-[#DFDAD0] text-center space-y-2 animate-in fade-in duration-200">
            {activeTab === "price" && (
              <>
                <div className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
                  $0.8540
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] pt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+4.12% (24h) • Rp 13.620 IDR</span>
                </div>
                <p className="text-[10px] text-[#888888] font-light pt-2">
                  {lang === "en"
                    ? "*Live Polygon Mainnet Oracle & Uniswap V3 Liquidity Pool"
                    : "*Data live oracle Polygon Mainnet & Pool Likuiditas Uniswap V3"}
                </p>
              </>
            )}

            {activeTab === "liquidity" && (
              <>
                <div className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
                  $3,842,500
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>+12.8% (30d) • Rp 61.287.875.000 IDR</span>
                </div>
                <p className="text-[10px] text-[#888888] font-light pt-2">
                  {lang === "en"
                    ? "*100% Backed by Real Central Vaults, Tether 1:1, and Bank Settlement Balances"
                    : "*100% Didukung oleh Brankas Pusat, Cadangan Tether 1:1, dan Saldo Kliring Perbankan"}
                </p>
              </>
            )}

            {activeTab === "volume" && (
              <>
                <div className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
                  Rp 1.482.900.000
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] pt-1">
                  <span>2,840 txs / 24h • Avg Finality: 0.4s</span>
                </div>
                <p className="text-[10px] text-[#888888] font-light pt-2">
                  {lang === "en"
                    ? "*Retail Merchant POS, P2P Sovereign Transfers, and Gateway Clearings"
                    : "*Transaksi Kasir POS Merchant, Transfer Mandiri P2P, dan Kliring Gateway"}
                </p>
              </>
            )}

            {activeTab === "reserves" && (
              <>
                <div className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
                  104.8%
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] pt-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "Solvent & Overcollateralized" : "Solven & Cadangan Surplus"}</span>
                </div>
                <p className="text-[10px] text-[#888888] font-light pt-2">
                  {lang === "en"
                    ? "*Zero Unbacked/Phantom Credit Permitted in Double-Entry Core Ledger"
                    : "*Nol Kredit Palsu/Saldo Hantu yang Ditoleransi dalam Buku Besar Utama"}
                </p>
              </>
            )}

            {activeTab === "health" && (
              <>
                <div className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
                  99.99%
                </div>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#16A34A] pt-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === "en" ? "0 Discrepancy Alerts • All Vaults Synced" : "0 Anomali • Seluruh Brankas Sinkron"}</span>
                </div>
                <p className="text-[10px] text-[#888888] font-light pt-2">
                  {lang === "en"
                    ? "*Continuous autonomous anti-money laundering and discrepancy surveillance engine"
                    : "*Mesin audit rekonsiliasi dan anti-pencucian uang otonom bekerja 24/7"}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Ambient Glowing Separator Bar (Exact Zcash Visual Transition) */}
      <div className="h-2 w-full bg-gradient-to-r from-[#F4B728]/70 via-[#E11D48]/50 to-[#F4B728]/70" />

      {/* =========================================================================
          3. SECTION 1: FUNDING & GOVERNANCE (Matching Zcash Layout & Pie Charts)
          ========================================================================= */}
      <section id="governance-section" className="max-w-[1280px] mx-auto px-6 py-16 sm:py-24 space-y-12">
        <div className="space-y-4 max-w-3xl">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
            {lang === "en" ? "Funding & Governance" : "Tata Kelola Cadangan & Pendanaan"}
          </h2>
          <p className="text-xs sm:text-sm text-[#444444] font-light leading-relaxed">
            {lang === "en"
              ? "We have entered a new era for modern neo-banking with the activation of the AliBank Multi-Chain Reserve Framework. Unlike legacy commercial banks that practice fractional reserves—loaning out up to 90% of customer deposits into opaque debts—AliBank operates on a strict non-fractional standard. Every single rupiah or USDT recorded in customer custody is backed 1:1 by audited assets stored in central cold storage vaults and high-liquidity on-chain pools."
              : "Kami memasuki era baru perbankan neo modern dengan diterapkannya AliBank Multi-Chain Reserve Framework. Berbeda dengan bank komersial konvensional yang mempraktikkan cadangan fraksional—meminjamkan hingga 90% simpanan nasabah ke piutang yang tidak transparan—AliBank beroperasi dengan standar non-fraksional yang ketat. Setiap rupiah atau USDT yang tercatat pada buku besar nasabah didukung 1:1 oleh aset nyata di brankas penyimpanan dingin dan pool likuiditas on-chain terverifikasi."}
          </p>
          <p className="text-xs sm:text-sm text-[#444444] font-light leading-relaxed">
            {lang === "en"
              ? "In November 2024, AliBank codified automated anti-money laundering surveillance directly into the core reconciliation daemon. Any attempt to inject unbacked phantom balances or circulate illicit funds triggers immediate asset quarantine, legal evidentiary logging, and administrative account freezing."
              : "Pada November 2024, AliBank meresmikan sistem pengawasan anti-pencucian uang (AML) otomatis ke dalam daemon rekonsiliasi utama. Setiap upaya injeksi saldo hantu tanpa bukti setor atau perputaran dana gelap langsung memicu karantina saldo, perekaman bukti hukum digital, dan pembekuan akun seketika."}
          </p>
        </div>

        {/* Sub-heading: Comparative Allocation */}
        <div className="space-y-8 pt-4">
          <h3 className="font-serif text-2xl font-bold text-[#111111]">
            {lang === "en" ? "Reserve Allocation & Capital Architecture" : "Alokasi Cadangan & Arsitektur Permodalan"}
          </h3>
          <p className="text-xs sm:text-sm text-[#555555] font-light max-w-3xl leading-relaxed">
            {lang === "en"
              ? "A side-by-side comparison illustrating how traditional banks expose customer deposits to fractional insolvency, contrasted with AliBank's 100% mathematically verifiable multi-chain ledger model:"
              : "Perbandingan visual berdampingan antara cara bank tradisional mengekspos simpanan nasabah pada risiko kebangkrutan fraksional, dibandingkan dengan model buku besar multi-chain AliBank yang 100% terverifikasi secara matematis:"}
          </p>

          {/* TWO SIDE-BY-SIDE COMPARATIVE PIE CHARTS (Matching Zcash Image 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 pt-4">
            {/* Chart 1: Legacy Fractional Bank */}
            <div className="border border-[#DFDAD0] bg-white p-8 rounded-sm space-y-6 shadow-sm">
              <div className="text-center space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#111111]">
                  {lang === "en" ? "Legacy Fractional Banking" : "Perbankan Fraksional Konvensional"}
                </h4>
                <p className="text-[10px] text-[#777777] font-mono uppercase tracking-wider">
                  {lang === "en" ? "Opaque Off-Balance-Sheet Model" : "Model Neraca Tertutup / Piutang Berisiko"}
                </p>
              </div>

              {/* Visual SVG Pie Chart 1 */}
              <div className="flex justify-center items-center py-4">
                <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-sm">
                  {/* Slice 1: Fractional loans 70% (252 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#8E857C"
                    strokeWidth="38"
                    strokeDasharray="351.85 502.65"
                    strokeDashoffset="0"
                  />
                  {/* Slice 2: Clearing friction 15% (54 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#B4AAA0"
                    strokeWidth="38"
                    strokeDasharray="75.4 502.65"
                    strokeDashoffset="-351.85"
                  />
                  {/* Slice 3: Overhead 10% (36 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#D6CEC6"
                    strokeWidth="38"
                    strokeDasharray="50.26 502.65"
                    strokeDashoffset="-427.25"
                  />
                  {/* Slice 4: Real Cash 5% (18 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#E11D48"
                    strokeWidth="38"
                    strokeDasharray="25.13 502.65"
                    strokeDashoffset="-477.51"
                  />
                  {/* Center Text */}
                  <text x="100" y="96" textAnchor="middle" className="text-[11px] font-bold font-serif fill-[#111111]">
                    5%
                  </text>
                  <text x="100" y="112" textAnchor="middle" className="text-[9px] font-mono uppercase fill-[#666666]">
                    Liquid Cash
                  </text>
                </svg>
              </div>

              {/* Legend 1 */}
              <div className="space-y-2 text-xs border-t border-[#ECE7DE] pt-4">
                <div className="flex items-center justify-between text-[#555555]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8E857C]" />
                    <span>{lang === "en" ? "Unbacked Fractional Loans" : "Pinjaman Kredit Tanpa Cadangan"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">70%</span>
                </div>
                <div className="flex items-center justify-between text-[#555555]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B4AAA0]" />
                    <span>{lang === "en" ? "Interbank Clearing Friction" : "Friksi Kliring Antar Bank"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">15%</span>
                </div>
                <div className="flex items-center justify-between text-[#555555]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D6CEC6]" />
                    <span>{lang === "en" ? "Administrative Overheads" : "Beban Operasional & Birokrasi"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">10%</span>
                </div>
                <div className="flex items-center justify-between text-[#E11D48]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                    <span>{lang === "en" ? "Actual Liquid Cash Buffer" : "Cadangan Tunai Riil Siap Tarik"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#E11D48]">5% (High Risk)</span>
                </div>
              </div>
            </div>

            {/* Chart 2: AliBank Multi-Chain Hybrid Ledger */}
            <div className="border border-[#F4B728] bg-white p-8 rounded-sm space-y-6 shadow-sm relative">
              <span className="absolute -top-3 right-6 bg-[#F4B728] text-black text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-sm">
                100% MATHEMATICALLY BACKED
              </span>

              <div className="text-center space-y-1">
                <h4 className="font-serif text-base sm:text-lg font-bold text-[#111111]">
                  {lang === "en" ? "AliBank Multi-Chain Architecture" : "Arsitektur Multi-Chain AliBank"}
                </h4>
                <p className="text-[10px] text-[#777777] font-mono uppercase tracking-wider">
                  {lang === "en" ? "100% Solvency • Cold Vaults & DEX" : "Solvensi 100% • Brankas Dingin & DEX"}
                </p>
              </div>

              {/* Visual SVG Pie Chart 2 */}
              <div className="flex justify-center items-center py-4">
                <svg viewBox="0 0 200 200" className="w-48 h-48 drop-shadow-sm">
                  {/* Slice 1: Central Vault 55% (198 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#F4B728"
                    strokeWidth="38"
                    strokeDasharray="276.46 502.65"
                    strokeDashoffset="0"
                  />
                  {/* Slice 2: DEX & POS Liquidity 25% (90 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#111111"
                    strokeWidth="38"
                    strokeDasharray="125.66 502.65"
                    strokeDashoffset="-276.46"
                  />
                  {/* Slice 3: Insurance Reserve 12% (43.2 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#4B5563"
                    strokeWidth="38"
                    strokeDasharray="60.32 502.65"
                    strokeDashoffset="-402.12"
                  />
                  {/* Slice 4: Protocol & AML Audits 8% (28.8 deg) */}
                  <circle
                    r="80"
                    cx="100"
                    cy="100"
                    fill="transparent"
                    stroke="#E11D48"
                    strokeWidth="38"
                    strokeDasharray="40.21 502.65"
                    strokeDashoffset="-462.44"
                  />
                  {/* Center Text */}
                  <text x="100" y="96" textAnchor="middle" className="text-[11px] font-bold font-serif fill-[#111111]">
                    100%
                  </text>
                  <text x="100" y="112" textAnchor="middle" className="text-[9px] font-mono uppercase fill-[#16A34A] font-bold">
                    Verifiable
                  </text>
                </svg>
              </div>

              {/* Legend 2 */}
              <div className="space-y-2 text-xs border-t border-[#ECE7DE] pt-4">
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F4B728]" />
                    <span>{lang === "en" ? "Central Cold Vaults (ETH, BTC, USDT, Bank)" : "Brankas Dingin Utama (ETH, BTC, USDT, Bank)"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">55%</span>
                </div>
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
                    <span>{lang === "en" ? "On-Chain DEX & POS Retail Liquidity (ALX)" : "Pool Likuiditas DEX & Kasir POS (ALX)"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">25%</span>
                </div>
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#4B5563]" />
                    <span>{lang === "en" ? "Sovereign Insolvency Insurance Reserve" : "Dana Cadangan Asuransi Kebangkrutan"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">12%</span>
                </div>
                <div className="flex items-center justify-between text-[#111111]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                    <span>{lang === "en" ? "Core Protocol Development & AML Engine" : "Pengembangan Inti Protokol & Mesin AML"}</span>
                  </span>
                  <span className="font-mono font-bold text-[#111111]">8%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Square Callout Note (Exact Zcash Image 2 Detail) */}
          <div className="border border-[#111111] p-6 bg-[#FAF9F6] flex items-start gap-4 rounded-sm">
            <div className="w-4 h-4 bg-[#111111] shrink-0 mt-0.5" />
            <p className="text-xs text-[#333333] font-light leading-relaxed">
              {lang === "en"
                ? "In addition to on-chain cold vaults, AliBank operates an independent Security Bounty Pool and cryptographic grant program to incentivize auditors, penetration testers, and developers to review our double-entry ledger integrity, enhance mobile SDK UX, and fortify anti-money laundering controls."
                : "Selain brankas penyimpanan dingin on-chain, AliBank mengoperasikan program Security Bounty Pool dan hibah kriptografis independen untuk memberikan insentif bagi auditor keamanan, penetration tester, dan pengembang guna mengaudit buku besar ganda, menyempurnakan UX SDK mobile, dan memperkokoh benteng pencegahan pencucian uang."}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION 2: ALIBANK IMPROVEMENT PROPOSALS (AIPs) (Exact Zcash 2-Col Layout)
          ========================================================================= */}
      <section id="aip-section" className="border-t border-[#DFDAD0] bg-white py-16 sm:py-24 px-6">
        <div className="max-w-[1280px] mx-auto space-y-12">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#111111] tracking-tight">
              {lang === "en" ? "AliBank Improvement Proposals (AIPs)" : "Proposal Pembaruan AliBank (AIP)"}
            </h2>
            <div className="w-full h-px bg-[#DFDAD0] mt-6" />
          </div>

          {/* 2-Column Editorial Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left Column: Topics */}
            <div className="lg:col-span-4 space-y-10">
              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-[#111111]">
                  {lang === "en" ? "About AIPs" : "Tentang AIP"}
                </h4>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  {lang === "en"
                    ? "The open governance protocol that powers mathematically verifiable upgrades across the AliBank banking architecture."
                    : "Protokol tata kelola terbuka yang memfasilitasi pembaruan kode terverifikasi di seluruh arsitektur perbankan AliBank."}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-[#111111]">
                  {lang === "en" ? "How to contribute" : "Cara Berkontribusi"}
                </h4>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  {lang === "en"
                    ? "Anyone in our developer community, institutional node operators, or retail merchants can author a draft AIP for peer review."
                    : "Siapa pun dalam komunitas pengembang, operator node institusi, atau merchant kasir dapat menyusun draf AIP untuk dievaluasi bersama."}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-serif text-xl font-bold text-[#111111]">
                  {lang === "en" ? "Security & AML Gate" : "Standar Keamanan & AML"}
                </h4>
                <p className="text-xs text-[#666666] font-light leading-relaxed">
                  {lang === "en"
                    ? "Every proposal must undergo formal verification against anti-money laundering benchmarks before multi-sig signing."
                    : "Setiap proposal wajib lolos verifikasi formal terhadap standar pencegahan pencucian uang sebelum ditandatangani multi-sig."}
                </p>
              </div>
            </div>

            {/* Right Column: Detailed Narrative & Proposals List */}
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-4 text-xs sm:text-sm text-[#444444] font-light leading-relaxed">
                <p>
                  {lang === "en"
                    ? "As a protocol, AliBank is governed by the AliBank Improvement Proposal (AIP) process. The AIP process provides an open venue and engineering structure for collectively evaluating changes to the core banking ledger, smart contracts, and settlement pipelines."
                    : "Sebagai protokol berdaulat, AliBank diatur melalui proses AliBank Improvement Proposal (AIP). Proses AIP menyediakan wadah terbuka dan struktur rekayasa perangkat lunak untuk mengevaluasi perubahan pada buku besar perbankan inti, smart contract, dan jalur penyelesaian transaksi secara kolektif."}
                </p>
                <p>
                  {lang === "en"
                    ? "Anyone can submit a draft AIP. Draft AIPs are debated by the developer community at large, then scrutinized by the core cryptographic editors and security auditors. Decisions from the AIP process are written into the AliBank specification and smart contract code. The changes are 'ratified' on-chain when the multi-sig quorum executes the mainnet deployment."
                    : "Siapa pun dapat mengajukan draf AIP. Draf diperdebatkan oleh komunitas pengembang, kemudian diperiksa secara teliti oleh tim kriptografi inti dan auditor keamanan independen. Keputusan dari proses AIP diabadikan ke dalam spesifikasi teknis dan kode smart contract AliBank. Pembaruan dinyatakan 'diratifikasi' on-chain saat quorum multi-sig mengeksekusi penyebaran ke mainnet."}
                </p>
              </div>

              {/* Proposals Registry Cards */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#888888]">
                  {lang === "en" ? "ACTIVE PROPOSALS REGISTRY" : "DAFTAR PROPOSAL AKTIF"}
                </p>

                <div className="border border-[#DFDAD0] divide-y divide-[#DFDAD0] bg-[#FAF9F6]">
                  {aipList.map((aip) => (
                    <div
                      key={aip.id}
                      onClick={() => setSelectedAIP(aip)}
                      className="p-5 sm:p-6 hover:bg-white transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1 pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-[#F4B728]">
                            {aip.number}
                          </span>
                          <span className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-sm bg-[#111111] text-white">
                            {aip.category}
                          </span>
                          <span className="text-[9px] font-bold tracking-widest uppercase text-[#16A34A] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                            {aip.status}
                          </span>
                        </div>
                        <h5 className="font-serif text-base sm:text-lg font-bold text-[#111111] group-hover:text-[#F4B728] transition-colors">
                          {lang === "en" ? aip.titleEn : aip.titleId}
                        </h5>
                        <p className="text-xs text-[#666666] font-light line-clamp-2">
                          {lang === "en" ? aip.summaryEn : aip.summaryId}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 text-xs font-bold text-[#111111] group-hover:translate-x-1 transition-transform">
                        <span>{lang === "en" ? "Read Spec" : "Baca Spek"}</span>
                        <span>→</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* View AIP Process Button (Matching Zcash Image 2) */}
              <div className="pt-4">
                <button
                  onClick={() => setSelectedAIP(aipList[0])}
                  className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.18em] px-8 py-4 rounded-sm transition-colors shadow-sm inline-flex items-center gap-3"
                >
                  <span>{lang === "en" ? "View AIP Process & Specifications" : "Lihat Proses & Spesifikasi AIP"}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. AIP SPECIFICATION DETAIL MODAL
          ========================================================================= */}
      {selectedAIP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm max-w-2xl w-full p-6 sm:p-10 relative shadow-2xl space-y-6 text-[#111111] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedAIP(null)}
              className="absolute top-6 right-6 p-2 text-[#777777] hover:text-black rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8 text-left">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-bold text-[#F4B728]">
                  {selectedAIP.number}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-sm bg-[#111111] text-white">
                  {selectedAIP.category}
                </span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#16A34A] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  {selectedAIP.status}
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] leading-snug tracking-tight">
                {lang === "en" ? selectedAIP.titleEn : selectedAIP.titleId}
              </h2>

              <p className="text-xs text-[#888888] font-mono">
                Author: {selectedAIP.author} • Created: {selectedAIP.created}
              </p>
            </div>

            <div className="w-full h-px bg-[#DFDAD0]" />

            <div className="space-y-4 text-xs sm:text-sm text-[#333333] font-light leading-relaxed whitespace-pre-line text-left">
              {lang === "en" ? selectedAIP.specEn : selectedAIP.specId}
            </div>

            <div className="pt-6 border-t border-[#DFDAD0] flex flex-wrap items-center justify-between gap-4">
              <a
                href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-black underline underline-offset-4 hover:text-[#F4B728] transition-colors inline-flex items-center gap-1.5"
              >
                <span>Verify on Polygonscan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => setSelectedAIP(null)}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors"
              >
                {lang === "en" ? "Close" : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. FOOTER (Exact Zcash Editorial Aesthetics)
          ========================================================================= */}
      <footer className="bg-black text-white py-16 px-6 border-t border-[#222222]">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 text-xs">
          <div className="md:col-span-5 space-y-4">
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

          <div className="md:col-span-2 space-y-3">
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

          <div className="md:col-span-3 space-y-3">
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

          <div className="md:col-span-2 space-y-3">
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
                <NextLink href="/login" className="hover:text-white transition-colors">
                  Merchant POS Login
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

