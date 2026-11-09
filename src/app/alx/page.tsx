"use client";

import React, { useState } from "react";
import NextLink from "next/link";
import {
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Coins,
  Flame,
  Zap,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  Lock,
  Globe,
  ArrowRight,
  FileCheck2,
  Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AlixTokenPage() {
  const [lang, setLang] = useState<"en" | "id">("id");
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedDossier, setCopiedDossier] = useState(false);

  const CONTRACT_ADDRESS = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const DEPLOYER_ADDRESS = "0xc7D06CA4a4B00b19fFa1a4EFCB3cB3e12c24d777";
  const UNISWAP_TRADE_URL = "https://app.uniswap.org/explore/tokens/polygon/0x8bafca0a5a5f288dcc0af6da6951dd3d59e0d1dd";
  const POLYGONSCAN_URL = "https://polygonscan.com/token/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";

  const handleCopy = (text: string, type: "contract" | "dossier") => {
    navigator.clipboard.writeText(text);
    if (type === "contract") {
      setCopiedContract(true);
      setTimeout(() => setCopiedContract(false), 2000);
    } else {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2000);
    }
  };

  const dossierText = `Token Name: Alix Coin
Symbol: ALX
Contract: 0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd
Network: Polygon Mainnet (Chain ID 137)
Decimals: 18
Max Supply: 1,000,000,000 ALX
Website: https://alibank.tarroz.com
Token Hub: https://alibank.tarroz.com/alx
Logo URL: https://alibank.tarroz.com/alx-logo.png
Official Contact: support@alibank.tarroz.com
Explorer: https://polygonscan.com/token/0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd
Uniswap: https://app.uniswap.org/explore/tokens/polygon/0x8bafca0a5a5f288dcc0af6da6951dd3d59e0d1dd
Description: Alix Coin (ALX) is the sovereign utility and settlement token of the AliBank V3 hybrid neobank ecosystem on Polygon Mainnet. Featuring zero-fee P2P clearing, SoftPOS merchant acquiring, and a 20% deflationary buyback-and-burn engine backed by 100% verified Proof-of-Reserves.`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#111111] font-sans selection:bg-[#F4B728]/30">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            name: "Alix Coin (ALX)",
            description:
              "Token utilitas kedaulatan moneter resmi ekosistem perbankan hibrida AliBank V3 di Polygon Mainnet.",
            url: "https://alibank.tarroz.com/alx",
            logo: "https://alibank.tarroz.com/alx-logo.png",
            provider: {
              "@type": "Organization",
              name: "PT DMT Network Solutions",
              url: "https://alibank.tarroz.com",
            },
          }),
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/95 backdrop-blur-md border-b border-[#DFDAD0]">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <NextLink href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F4B728] flex items-center justify-center font-bold text-black text-lg shadow-sm">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
              AliBank
            </span>
          </NextLink>

          <div className="flex items-center gap-4">
            <div className="flex items-center border border-[#DFDAD0] rounded-full p-1 bg-white text-[11px] font-bold">
              <button
                onClick={() => setLang("en")}
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  lang === "en" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLang("id")}
                className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  lang === "id" ? "bg-[#111111] text-white" : "text-[#666666] hover:text-black"
                )}
              >
                ID
              </button>
            </div>

            <NextLink
              href="/"
              className="text-[11px] font-bold tracking-wider uppercase text-[#444444] hover:text-black"
            >
              {lang === "en" ? "BACK TO HOME" : "KEMBALI"}
            </NextLink>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 border-b border-[#DFDAD0] relative overflow-hidden bg-white">
        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4B728]/15 border border-[#F4B728]/40 mb-6">
            <ShieldCheck className="w-4 h-4 text-[#B8860B]" />
            <span className="text-[11px] font-bold tracking-widest text-[#B8860B] uppercase">
              {lang === "en" ? "POLYGON MAINNET VERIFIED ASSET" : "ASET TERVERIFIKASI POLYGON MAINNET"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8 space-y-6">
              <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-[#111111] leading-[1.1]">
                Alix Coin <span className="italic font-normal text-[#8A7D68]">(ALX)</span>
              </h1>
              <p className="text-lg text-[#555555] leading-relaxed max-w-2xl">
                {lang === "en"
                  ? "The sovereign utility, settlement, and liquidity token powering the AliBank V3 hybrid neobank ecosystem. Deployed on Polygon Mainnet with full ERC-20 and EIP-2612 gasless compliance."
                  : "Token utilitas, penyelesaian likuiditas, dan kedaulatan moneter resmi pada ekosistem neobank hibrida AliBank V3. Berjalan di atas jaringan Polygon Mainnet dengan standar ERC-20 dan fitur gasless permit EIP-2612."}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href={UNISWAP_TRADE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-[#111111] text-white hover:bg-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md"
                >
                  <Coins className="w-4 h-4 text-[#F4B728]" />
                  <span>{lang === "en" ? "Trade on Uniswap" : "Beli di Uniswap"}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                <a
                  href={POLYGONSCAN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-12 px-6 bg-white border border-[#DFDAD0] hover:bg-[#FAF9F6] text-[#111111] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  <Globe className="w-4 h-4 text-[#555555]" />
                  <span>Polygonscan</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </a>

                <button
                  onClick={() => handleCopy(dossierText, "dossier")}
                  className="inline-flex items-center gap-2 h-12 px-6 bg-[#FAF9F6] border border-[#DFDAD0] hover:border-black text-[#111111] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  {copiedDossier ? <Check className="w-4 h-4 text-emerald-600" /> : <FileCheck2 className="w-4 h-4" />}
                  <span>{copiedDossier ? (lang === "en" ? "Copied!" : "Tersalin!") : (lang === "en" ? "Copy Listing Dossier" : "Salin Berkas Pendaftaran")}</span>
                </button>
              </div>
            </div>

            {/* Token Badge Card */}
            <div className="lg:col-span-4 bg-[#FAF9F6] border border-[#DFDAD0] rounded-3xl p-8 space-y-6 shadow-sm">
              <div className="w-20 h-20 rounded-2xl bg-[#12151A] flex items-center justify-center p-3 shadow-lg">
                <img src="/alx-logo.svg" alt="ALX Logo" className="w-full h-full object-contain" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-[#EAE6DF] pb-2">
                  <span className="text-[#666666] font-bold uppercase">Token Name</span>
                  <span className="font-bold text-[#111111]">Alix Coin</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-[#EAE6DF] pb-2">
                  <span className="text-[#666666] font-bold uppercase">Symbol</span>
                  <span className="font-bold text-[#111111]">ALX</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-[#EAE6DF] pb-2">
                  <span className="text-[#666666] font-bold uppercase">Network</span>
                  <span className="font-bold text-[#111111]">Polygon Mainnet</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-[#EAE6DF] pb-2">
                  <span className="text-[#666666] font-bold uppercase">Decimals</span>
                  <span className="font-bold text-[#111111]">18</span>
                </div>
                <div className="flex justify-between items-center text-xs border-b border-[#EAE6DF] pb-2">
                  <span className="text-[#666666] font-bold uppercase">Max Supply</span>
                  <span className="font-bold text-[#111111]">1,000,000,000 ALX</span>
                </div>
              </div>

              {/* Copy Contract Box */}
              <div className="p-3.5 bg-white border border-[#DFDAD0] rounded-2xl space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#666666] uppercase">
                  <span>Contract Address</span>
                  <button
                    onClick={() => handleCopy(CONTRACT_ADDRESS, "contract")}
                    className="flex items-center gap-1 text-[#111111] hover:text-[#B8860B]"
                  >
                    {copiedContract ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedContract ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-[#111111] break-all font-semibold">
                  {CONTRACT_ADDRESS}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Utility Pillars */}
      <section className="py-20 border-b border-[#DFDAD0]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-bold tracking-widest text-[#B8860B] uppercase">
              {lang === "en" ? "TOKENOMICS & ARCHITECTURE" : "TOKENOMIK & ARSITEKTUR"}
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#111111]">
              {lang === "en" ? "Engineered for Institutional Settlement" : "Dirancang untuk Kliring Skala Institusi"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white border border-[#DFDAD0] rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F4B728]/15 text-[#B8860B] flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#111111]">
                {lang === "en" ? "SoftPOS & Merchant Acquirer" : "Settlement Pedagang SoftPOS"}
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                {lang === "en"
                  ? "Directly integrated with AliBank mobile smartphone EDC terminals, allowing instant retail contactless payments settled directly into ALX tokens."
                  : "Terhubung langsung dengan terminal smartphone EDC AliBank, memungkinkan transaksi ritel kartu contactless langsung dikonversi menjadi saldo ALX."}
              </p>
            </div>

            <div className="bg-white border border-[#DFDAD0] rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#111111]">
                {lang === "en" ? "20% Revenue Buyback & Burn" : "Buyback & Burn Otomatis 20%"}
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                {lang === "en"
                  ? "20% of net monthly operational profits from AliBank exchange and clearing fees are dedicated to buying back ALX from open markets and burning them permanently."
                  : "20% dari total laba operasional kliring dan bursa AliBank dialokasikan setiap bulan untuk membeli kembali ALX dari pasar dan menghapusnya secara permanen."}
              </p>
            </div>

            <div className="bg-white border border-[#DFDAD0] rounded-3xl p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#111111]">
                {lang === "en" ? "100% Proof-of-Reserves" : "100% Bukti Cadangan Terbuka"}
              </h3>
              <p className="text-sm text-[#555555] leading-relaxed">
                {lang === "en"
                  ? "Audited on-chain institutional vaults backing every circulating ALX with transparent fiat and multi-chain reserves."
                  : "Brankas institusi on-chain yang diaudit secara real-time, memastikan setiap koin ALX didukung cadangan fiat dan aset digital yang terverifikasi."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 text-center space-y-3">
          <p className="font-serif text-lg font-bold text-[#111111]">AliBank V3 Financial Network</p>
          <p className="text-xs text-[#666666]">
            PT DMT Network Solutions · Official Support: support@alibank.tarroz.com
          </p>
          <p className="text-xs text-[#888888]">
            Alix Coin (ALX) Contract: {CONTRACT_ADDRESS}
          </p>
        </div>
      </footer>
    </div>
  );
}

