"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  ChevronDown,
  X,
  Search,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Wallet,
  Globe,
  Cpu,
  Coins,
  Store,
  Terminal,
  Layers,
  Lock,
  ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EcosystemItem {
  id: string;
  category: "all" | "wallets" | "networks" | "liquidity" | "merchant" | "build";
  tag: string;
  title: string;
  excerpt: string;
  content: string;
  url?: string;
  external?: boolean;
  isSpecialStyle?: "yellow" | "dark" | "normal";
}

function FormattedContent({ text }: { text: string }) {
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

function EcosystemContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as any) || "all";

  const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<EcosystemItem | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");
  const [activeMegaMenu, setActiveMegaMenu] = useState<"learn" | "ecosystem" | "network" | "features" | null>(null);

  const ALX_POLYGON_CONTRACT = "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";
  const ETH_VAULT_CONTRACT = "0x56268032A3B3E64CFeF1916d591087CF8dF40945";

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
  }, [searchParams]);

  const categories = useMemo(
    () => [
      { id: "all", labelEn: "ALL", labelId: "SEMUA" },
      { id: "wallets", labelEn: "WALLETS & CUSTODY", labelId: "DOMPET & KUSTODI" },
      { id: "networks", labelEn: "BLOCKCHAIN NETWORKS", labelId: "JARINGAN BLOCKCHAIN" },
      { id: "liquidity", labelEn: "LIQUIDITY & RESERVES", labelId: "LIKUIDITAS & CADANGAN" },
      { id: "merchant", labelEn: "MERCHANT & POS", labelId: "MERCHANT & KASIR" },
      { id: "build", labelEn: "DEVELOPER TOOLS", labelId: "ALAT PENGEMBANG" },
    ],
    []
  );

  const ecosystemItems: EcosystemItem[] = useMemo(
    () => [
      // 1. Polygon Mainnet (ALX) - Special Yellow Card
      {
        id: "polygon-alx",
        category: "networks",
        tag: "LAYER-2, SMART CONTRACT",
        title:
          lang === "en"
            ? "POLYGON POS MAINNET: ALX NATIVE UTILITY TOKEN"
            : "POLYGON POS MAINNET: TOKEN UTILITAS RESMI ALX",
        excerpt:
          lang === "en"
            ? "Sub-2 second block finality and near-zero gas fee settlement. Verified ERC-20 smart contract auditable on Polygonscan."
            : "Penyelesaian transaksi di bawah 2 detik dengan gas fee sangat rendah. Smart contract ERC-20 resmi terverifikasi di Polygonscan.",
        isSpecialStyle: "yellow",
        url: `https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`,
        external: true,
        content:
          lang === "en"
            ? `The ALX utility token is deployed natively on **Polygon PoS Mainnet** to provide high-throughput, low-cost liquidity for the AliBank global network.

### Smart Contract Specifications
- **Contract Address:** \`${ALX_POLYGON_CONTRACT}\`
- **Standard:** ERC-20 OpenZeppelin Audited
- **Decimals:** 18
- **Maximum Hard Cap:** 1,000,000,000 ALX
- **Live Explorer:** Polygonscan Verified Source Code

### Role in the AliBank Ecosystem
1. **Zero-Fee Gas Rebates:** Holding ALX unlocks tiered fee waivers on internal P2P transfers and merchant POS transactions.
2. **Staking Yield:** Deposit ALX or connected Ethereum assets into the verified Vault Staking protocol to earn algorithmic yield.
3. **Decentralized Settlement:** Instant on-chain transfers between self-custodial wallets and the AliBank custodial ledger.`
            : `Token utilitas ALX diterbitkan secara resmi di **Polygon PoS Mainnet** untuk menghadirkan transaksi berkecepatan tinggi dengan biaya rendah bagi ekosistem AliBank.

### Spesifikasi Smart Contract
- **Alamat Kontrak:** \`${ALX_POLYGON_CONTRACT}\`
- **Standar:** ERC-20 Terverifikasi OpenZeppelin
- **Desimal:** 18
- **Batas Pasokan Maksimal:** 1.000.000.000 ALX
- **Penjelajah Publik:** Kode sumber terverifikasi di Polygonscan

### Fungsi dalam Ekosistem AliBank
1. **Rabat Biaya Transaksi:** Kepemilikan koin ALX membuka status bebas biaya transfer P2P dan transaksi kasir merchant.
2. **Imbal Hasil Staking:** Masukkan aset ke protokol Vault Staking resmi untuk memperoleh dividen algoritmik.
3. **Penyelesaian On-Chain:** Transfer instan antara dompet pribadi nasabah dan buku besar AliBank.`,
      },

      // 2. Ethereum Vault - Special Dark Card
      {
        id: "eth-vault",
        category: "networks",
        tag: "CENTRAL VAULT, COLD STORAGE",
        title:
          lang === "en"
            ? "ETHEREUM MAINNET CENTRAL LIQUIDITY VAULT"
            : "BRANKAS LIKUIDITAS UTAMA ETHEREUM MAINNET",
        excerpt:
          lang === "en"
            ? "Multi-signature central cold storage vault securing institutional ETH and USDT liquidity backing user account balances."
            : "Brankas penyimpanan dingin multi-signature di jaringan Ethereum untuk mengamankan cadangan likuiditas riil 1:1.",
        isSpecialStyle: "dark",
        url: `https://etherscan.io/address/${ETH_VAULT_CONTRACT}`,
        external: true,
        content:
          lang === "en"
            ? `To guarantee that AliBank maintains strict **100% Proof of Reserves (PoR)**, central backing assets are held on the Ethereum Mainnet.

### Vault Specifications
- **Vault Address:** \`${ETH_VAULT_CONTRACT}\`
- **Network:** Ethereum Mainnet (Layer-1 Security)
- **Architecture:** Cold multi-signature contract requiring quorum execution.
- **Audit:** Publicly inspectable on Etherscan 24/7.

Every single rupiah and crypto liability in our database is mathematically bounded by the verified holdings of this vault.`
            : `Demi menjamin bahwa AliBank menerapkan **100% Bukti Cadangan Riil (Proof-of-Reserves)**, aset cadangan likuiditas utama disimpan langsung di jaringan Ethereum Mainnet.

### Spesifikasi Brankas
- **Alamat Brankas:** \`${ETH_VAULT_CONTRACT}\`
- **Jaringan:** Ethereum Mainnet (Keamanan Layer-1)
- **Arsitektur:** Kontrak multi-signature dingin dengan otorisasi berbasis kuorum.
- **Audit Publik:** Dapat diaudit langsung melalui Etherscan kapan saja tanpa izin.

Setiap liabilitas rupiah dan saldo kripto nasabah dibatasi secara matematis oleh cadangan nyata pada brankas ini.`,
      },

      // 3. MetaMask Web3 Native Bridge
      {
        id: "metamask-bridge",
        category: "wallets",
        tag: "WEB3, NON-CUSTODIAL",
        title:
          lang === "en"
            ? "METAMASK WEB3 NATIVE BRIDGE INTEGRATION"
            : "INTEGRASI JEMBATAN WEB3 NATIVE METAMASK",
        excerpt:
          lang === "en"
            ? "Connect your MetaMask browser extension or mobile app for frictionless non-custodial deposits, staking, and signature authentication."
            : "Hubungkan ekstensi peramban atau aplikasi mobile MetaMask Anda untuk deposit mandiri, staking, dan tanda tangan digital on-chain.",
        content:
          lang === "en"
            ? `AliBank features a direct **Web3 Native Bridge** allowing users to connect their personal MetaMask wallets without parting with their private keys.

### Capabilities:
- **Instant Polygon & Ethereum Sync:** Automatically detects ALX token holdings and Ethereum vault balances.
- **Cryptographic Sign-In:** Authenticate account ownership with non-custodial cryptographic signatures (EIP-712).
- **Direct Staking Deposit:** Stake ETH or ALX directly into the audited smart contract.`
            : `AliBank menyediakan **Jembatan Web3 Native** yang memungkinkan nasabah menghubungkan dompet pribadi MetaMask tanpa harus menyerahkan kunci pribadi (private key).

### Kemampuan Jembatan:
- **Sinkronisasi Otomatis Polygon & Ethereum:** Mendeteksi saldo token ALX dan saldo brankas Ethereum secara instan.
- **Masuk Akun via Kriptografi:** Verifikasi kepemilikan akun dengan tanda tangan digital aman (EIP-712).
- **Deposit Staking Mandiri:** Setor aset langsung ke smart contract resmi untuk imbal hasil staking.`,
      },

      // 4. TrustWallet Core Standards (BIP-39 / BIP-44)
      {
        id: "trustwallet-core",
        category: "wallets",
        tag: "STANDARDS, BIP DERIVATION",
        title:
          lang === "en"
            ? "TRUSTWALLET CORE PROTOCOL & BIP DERIVATION PATHS"
            : "STANDAR PROTOKOL TRUSTWALLET CORE & JALUR DERIVASI BIP",
        excerpt:
          lang === "en"
            ? "Mathematical key derivation ensuring full wallet portability and identical addresses across TrustWallet, MetaMask, and Ledger."
            : "Penurunan kunci matematis yang menjamin alamat dompet AliBank identik dan kompatibel 100% dengan TrustWallet dan MetaMask.",
        content:
          lang === "en"
            ? `AliBank strictly adheres to international Bitcoin and Ethereum Improvement Proposals:

- **BIP-39 Mnemonic:** Standard 12 or 24-word recovery phrases.
- **BIP-44 Multi-Account:** Derivation path \`m/44'/60'/0'/0/0\` for EVM (Polygon and Ethereum).
- **BIP-84 Native SegWit:** Derivation path \`m/84'/0'/0'/0/0\` generating authentic Bitcoin SegWit addresses (\`bc1q...\`).

Your assets are never trapped in a proprietary walled garden.`
            : `AliBank menerapkan standar proposal pengembangan Bitcoin dan Ethereum secara terbuka:

- **Mnemonik BIP-39:** Frasa pemulihan standar 12 atau 24 kata.
- **Hierarki BIP-44:** Jalur derivasi \`m/44'/60'/0'/0/0\` untuk EVM (Polygon dan Ethereum).
- **BIP-84 Native SegWit:** Jalur derivasi \`m/84'/0'/0'/0/0\` yang menghasilkan alamat Bitcoin SegWit asli (\`bc1q...\`).

Aset Anda sepenuhnya portabel dan bebas dari ketergantungan sistem tertutup.`,
      },

      // 5. Merchant POS & QRIS Gateway
      {
        id: "merchant-gateway",
        category: "merchant",
        tag: "PAYMENTS, MERCHANT POS",
        title:
          lang === "en"
            ? "ALIBANK MERCHANT POS & DYNAMIC QRIS CRYPTO GATEWAY"
            : "KASIR MERCHANT POS & GATEWAY PEMBAYARAN QRIS DINAMIS",
        excerpt:
          lang === "en"
            ? "Turn any Android device or web browser into a merchant payment terminal accepting dynamic QRIS and multi-chain crypto with zero chargeback fraud."
            : "Ubah smartphone atau komputer menjadi mesin kasir POS yang menerima QRIS dan kripto instan tanpa risiko penipuan chargeback.",
        content:
          lang === "en"
            ? `The **AliBank Merchant POS Solution** bridges traditional retail commerce with crypto liquidity:

- **Instant Settlement:** Zero waiting periods; transactions settle immediately in IDR, USDT, or ALX.
- **Zero Chargeback Risk:** Blockchain and ledger transactions are mathematically final.
- **Dynamic QRIS Integration:** Scan with domestic Indonesian e-wallets or international Web3 apps.`
            : `**Solusi Kasir AliBank Merchant POS** menjembatani perdagangan ritel fisik dengan likuiditas aset kripto:

- **Penyelesaian Seketika:** Uang masuk ke saldo kasir seketika tanpa masa tunggu kliring.
- **Bebas Risiko Chargeback:** Transaksi bersifat final secara matematis.
- **Dukungan QRIS Lengkap:** Pelanggan bisa membayar menggunakan dompet digital lokal (Gopay, OVO, Dana) maupun dompet Web3 internasional.`,
      },

      // 6. Tether USDT 1:1 Cash Reserve
      {
        id: "usdt-reserve",
        category: "liquidity",
        tag: "RESERVES, STABLECOIN",
        title:
          lang === "en"
            ? "TETHER (USDT) 1:1 LIQUIDITY BACKING & SOLVENCY"
            : "CADANGAN LIKUIDITAS TETHER (USDT) 1:1 & SOLVENSI",
        excerpt:
          lang === "en"
            ? "Audited digital dollar reserves backing user fiat balances and cross-border currency conversion corridors."
            : "Cadangan dolar digital terverifikasi yang menjamin saldo pengguna dan koridor konversi mata uang lintas batas.",
        content:
          lang === "en"
            ? `AliBank maintains real Tether (USDT) reserves to anchor our internal foreign exchange rates and guarantee 100% solvency for members holding dollar balances.

Our automated Anti-Fraud engine continuously verifies that the sum of all customer USDT liabilities is less than or equal to physical USDT reserves in our custody.`
            : `AliBank mencadangkan likuiditas Tether (USDT) riil untuk menjamin solvensi 100% nasabah yang memegang saldo dolar digital.

Mesin Anti-Fraud AliBank secara otonom memverifikasi bahwa total liabilitas USDT nasabah selalu didukung oleh cadangan USDT riil yang memadai.`,
      },

      // 7. Developer REST API & Webhooks
      {
        id: "dev-api",
        category: "build",
        tag: "DEVELOPERS, REST API",
        title:
          lang === "en"
            ? "DEVELOPER REST API, WEBHOOKS & CLIENT SDK"
            : "REST API PENGEMBANG, WEBHOOKS & SDK KLIEN",
        excerpt:
          lang === "en"
            ? "Integrate automated payroll, merchant checkout flows, and wallet provenance verification into your software stack."
            : "Integrasikan penggajian otomatis, alur pembayaran toko online, dan verifikasi mutasi ke dalam aplikasi Anda.",
        content:
          lang === "en"
            ? `Build powerful financial applications on top of the AliBank network using our standardized REST APIs:

- **Cryptographic Authentication:** API Key and HMAC signature verification.
- **Real-Time Webhooks:** Event notifications for completed deposits, P2P transfers, and POS settlements.
- **Open Documentation:** Interactive OpenAPI/Swagger endpoints.`
            : `Bangun aplikasi keuangan modern di atas jaringan AliBank dengan REST API berstandar internasional:

- **Autentikasi Kriptografi:** Perlindungan menggunakan API Key dan tanda tangan digital HMAC.
- **Webhooks Real-Time:** Notifikasi seketika untuk mutasi deposit, transfer P2P, dan pembayaran kasir.
- **Dokumentasi Lengkap:** Endpoint terstruktur untuk integrasi cepat.`,
      },

      // 8. Bitcoin Native SegWit (BIP-84)
      {
        id: "btc-segwit",
        category: "networks",
        tag: "BITCOIN, SEGWIT",
        title:
          lang === "en"
            ? "BITCOIN NATIVE SEGWIT (BIP-84) ADDRESS INFRASTRUCTURE"
            : "INFRASTRUKTUR ALAMAT BITCOIN NATIVE SEGWIT (BIP-84)",
        excerpt:
          lang === "en"
            ? "Direct on-chain Bitcoin deposit addresses starting with bc1q... for maximum fee efficiency and SegWit block optimization."
            : "Alamat setoran Bitcoin langsung di on-chain berawalan bc1q... untuk efisiensi biaya transaksi maksimal.",
        content:
          lang === "en"
            ? `AliBank generates authentic **Native SegWit (bech32)** addresses starting with \`bc1q...\` for all customer Bitcoin deposits.

Benefits include:
- Up to 40% lower transaction fees compared to legacy legacy addresses (\`1...\`).
- Full compatibility with the Lightning Network and modern hardware wallets.`
            : `AliBank menghasilkan alamat Bitcoin **Native SegWit (bech32)** asli yang berawalan \`bc1q...\` untuk seluruh setoran nasabah.

Keunggulan:
- Biaya transfer on-chain hingga 40% lebih hemat dibanding alamat lama (\`1...\`).
- Kompatibilitas penuh dengan dompet perangkat keras modern.`,
      },

      // 9. Peer-to-Peer Order Hub
      {
        id: "p2p-hub",
        category: "liquidity",
        tag: "MARKETPLACE, P2P RAILS",
        title:
          lang === "en"
            ? "ZERO-FEE PEER-TO-PEER (P2P) LIQUIDITY ORDER HUB"
            : "HUB ORDER LIKUIDITAS PEER-TO-PEER (P2P) BEBAS BIAYA",
        excerpt:
          lang === "en"
            ? "Direct member-to-member liquidity marketplace for exchanging IDR, USDT, and ALX with automated ledger escrow security."
            : "Pasar likuiditas langsung antar-nasabah untuk pertukaran IDR, USDT, dan ALX dengan perlindungan escrow otomatis.",
        content:
          lang === "en"
            ? `The **AliBank P2P Order Hub** enables users to exchange fiat currency and digital assets directly with other verified members without paying exchange intermediary markups.

Transactions are protected by internal ledger escrow locks, ensuring zero counterparty default risk.`
            : `**AliBank P2P Order Hub** memungkinkan pengguna melakukan jual-beli fiat dan kripto secara langsung dengan pengguna terverifikasi lainnya tanpa potongan biaya perantara.

Setiap transaksi dilindungi oleh sistem escrow otomatis di buku besar AliBank untuk mencegah penipuan.`,
      },
    ],
    [lang]
  );

  const filteredItems = useMemo(() => {
    return ecosystemItems.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [ecosystemItems, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#111111] font-body selection:bg-[#F4B728]/30 overflow-x-hidden antialiased">
      {/* =========================================================================
          1. HEADER & TOP NAVIGATION WITH MEGA MENU (Zcash Style)
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-[#FBF9F5]/95 backdrop-blur-md border-b border-[#EAE6DF] transition-colors">
        <div className="max-w-[1280px] mx-auto px-6 h-20 flex items-center justify-between">
          <NextLink href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-[#F4B728] flex items-center justify-center shadow-sm text-black font-serif font-black text-xl tracking-tight transition-transform duration-300 group-hover:scale-105">
              A
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight text-[#111111]">
              AliBank
            </span>
          </NextLink>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold tracking-[0.18em] text-[#444444] uppercase h-full">
            {/* LEARN Trigger */}
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
                <span>{lang === "en" ? "LEARN" : "PELAJARI"}</span>
              </button>
              {activeMegaMenu === "learn" && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#F4B728] z-50 pointer-events-none" />
              )}
            </div>

            {/* ECOSYSTEM Trigger (Active page) */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setActiveMegaMenu(activeMegaMenu === "ecosystem" ? null : "ecosystem")}
                className={cn(
                  "relative h-full flex items-center text-[11px] font-bold tracking-[0.18em] transition-colors uppercase",
                  activeMegaMenu === "ecosystem"
                    ? "text-[#111111]"
                    : "text-black font-black hover:text-black"
                )}
              >
                <span>{lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}</span>
              </button>
              {(activeMegaMenu === "ecosystem" || activeCategory !== "all") && (
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

            <NextLink href="/#faq" className="hover:text-black transition-colors">
              FAQ
            </NextLink>
          </nav>

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
            1.B MEGA MENU: ECOSYSTEM (Zcash exact structure)
            ========================================================================= */}
        {activeMegaMenu === "ecosystem" && (
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
                    {lang === "en" ? "ECOSYSTEM" : "EKOSISTEM"}
                  </h3>
                  <p className="text-xs text-[#666666] font-light leading-relaxed">
                    {lang === "en"
                      ? "Browse wallets, blockchain networks, developer tools and everything you need to become a participant in the AliBank ecosystem."
                      : "Jelajahi dompet, jaringan blockchain, alat pengembang, dan infrastruktur pendukung ekosistem AliBank."}
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setActiveCategory("all");
                        setActiveMegaMenu(null);
                      }}
                      className="text-[11px] font-bold tracking-wider text-[#F4B728] hover:underline"
                    >
                      {lang === "en" ? "Browse Ecosystem Hub →" : "Buka Hub Ekosistem →"}
                    </button>
                  </div>
                </div>

                {/* Col 2: WALLETS */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "WALLETS" : "DOMPET"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "metamask-bridge") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        MetaMask Web3 Bridge
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "trustwallet-core") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        TrustWallet Core (BIP-39/44)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("wallets");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Col 3: EXCHANGES & NETWORKS */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-[#111111]">
                    {lang === "en" ? "NETWORKS & VAULTS" : "JARINGAN & BRANKAS"}
                  </h4>
                  <ul className="space-y-2.5 text-xs text-[#555555]">
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "polygon-alx") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        Polygon Mainnet (ALX)
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "eth-vault") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        Ethereum Liquidity Vault
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "btc-segwit") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        Bitcoin Native SegWit
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("networks");
                          setActiveMegaMenu(null);
                        }}
                        className="text-[11px] font-bold text-[#F4B728] hover:underline pt-1 block"
                      >
                        {lang === "en" ? "See all →" : "Lihat semua →"}
                      </button>
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
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "dev-api") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        Build with AliBank REST API
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setSelectedItem(ecosystemItems.find((i) => i.id === "merchant-gateway") || null);
                          setActiveMegaMenu(null);
                        }}
                        className="hover:text-black text-left transition-colors"
                      >
                        Merchant POS & QRIS Terminal
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setActiveCategory("build");
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
      </header>

      {/* =========================================================================
          2. MAIN CONTENT (Exact 2-Column Layout of Zcash Ecosystem Page)
          ========================================================================= */}
      <main className="max-w-[1280px] mx-auto px-6 py-12 md:py-16">
        <div className="mb-10">
          <h1 className="font-serif text-5xl sm:text-6xl font-normal tracking-tight text-[#111111]">
            {lang === "en" ? "AliBank Ecosystem" : "Ekosistem AliBank"}
          </h1>
          <div className="w-full h-px bg-[#DFDAD0] mt-8" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Sidebar Filter */}
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

            <div className="pt-6 border-t border-[#DFDAD0]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                <input
                  type="text"
                  placeholder={lang === "en" ? "Search ecosystem..." : "Cari ekosistem..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-[#DFDAD0] rounded-sm text-xs font-medium focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </aside>

          {/* Right Main Grid */}
          <div className="lg:col-span-9 space-y-8">
            {/* FEATURED BOX */}
            {(activeCategory === "all" || activeCategory === "networks") && !searchQuery && (
              <div className="border border-[#111111] p-8 bg-white rounded-sm shadow-sm space-y-4">
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F4B728] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F4B728]" />
                  {lang === "en" ? "FEATURED • MULTI-CHAIN INFRASTRUCTURE" : "UNGGULAN • INFRASTRUKTUR MULTI-CHAIN"}
                </span>

                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] tracking-tight">
                  {lang === "en"
                    ? "ALIBANK OPEN MULTI-CHAIN FINANCIAL OPERATING SYSTEM"
                    : "SISTEM OPERASI KEUANGAN MULTI-CHAIN TERBUKA ALIBANK"}
                </h2>

                <p className="text-sm text-[#555555] font-light leading-relaxed">
                  {lang === "en"
                    ? "AliBank unites custodial high-throughput banking with public blockchain rails. We provide verified smart contract settlements on Polygon, cold storage vaults on Ethereum, and universal key portability conforming to TrustWallet Core standards."
                    : "AliBank menyatukan perbankan berkecepatan tinggi dengan jaringan blockchain publik. Kami menghadirkan smart contract terverifikasi di Polygon, brankas penyimpanan dingin di Ethereum, dan portabilitas kunci berstandar TrustWallet Core."}
                </p>

                <div className="pt-2 flex flex-wrap gap-4">
                  <a
                    href={`https://polygonscan.com/token/${ALX_POLYGON_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-[0.16em] px-6 py-3 rounded-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span>Polygonscan ALX</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://etherscan.io/address/${ETH_VAULT_CONTRACT}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-[#111111] hover:bg-[#111111]/5 text-[#111111] text-xs font-bold uppercase tracking-[0.16em] px-6 py-3 rounded-sm transition-colors inline-flex items-center gap-2"
                  >
                    <span>Etherscan Vault</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* 3-COLUMN EDITORIAL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#DFDAD0] bg-white divide-y md:divide-y-0 divide-[#DFDAD0]">
              {filteredItems.map((item) => {
                const isYellow = item.isSpecialStyle === "yellow";
                const isDark = item.isSpecialStyle === "dark";

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
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
                        {item.title}
                      </h3>
                      <p
                        className={cn(
                          "text-xs font-light leading-relaxed line-clamp-4",
                          isYellow ? "text-black/80" : isDark ? "text-white/80" : "text-[#666666]"
                        )}
                      >
                        {item.excerpt}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[9px] font-bold tracking-[0.18em] uppercase",
                          isYellow ? "text-black/70" : isDark ? "text-[#F4B728]" : "text-[#999999]"
                        )}
                      >
                        {item.tag}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-bold transition-transform group-hover:translate-x-1",
                          isYellow ? "text-black" : isDark ? "text-[#F4B728]" : "text-[#111111]"
                        )}
                      >
                        →
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
          3. DETAIL MODAL
          ========================================================================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF9F6] border border-[#DFDAD0] rounded-sm max-w-2xl w-full p-6 sm:p-10 relative shadow-2xl space-y-6 text-[#111111] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-6 right-6 p-2 text-[#777777] hover:text-black rounded-sm transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 pr-8 text-left">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#F4B728] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F4B728]" />
                {selectedItem.tag}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#111111] leading-snug tracking-tight">
                {selectedItem.title}
              </h2>
            </div>

            <div className="w-full h-px bg-[#DFDAD0]" />

            <div className="py-2">
              <FormattedContent text={selectedItem.content} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#DFDAD0]">
              {selectedItem.url ? (
                <a
                  href={selectedItem.url}
                  target={selectedItem.external ? "_blank" : undefined}
                  rel={selectedItem.external ? "noopener noreferrer" : undefined}
                  className="text-xs font-bold text-black underline underline-offset-4 hover:text-[#F4B728] transition-colors inline-flex items-center gap-1"
                >
                  <span>Launch / Verify Resource</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-[10px] font-mono text-[#888888] tracking-wider uppercase">
                  ALIBANK VERIFIED ECOSYSTEM
                </span>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="px-6 py-2.5 bg-[#111111] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-colors shadow-sm"
              >
                {lang === "en" ? "Close" : "Tutup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. FOOTER
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
                Multi-chain liquidity infrastructure compliant with BIP-39, BIP-44, and Ethereum Layer-2 protocols.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                LEARN
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <NextLink href="/learn?category=aml" className="hover:text-white transition-colors">
                    Security & AML Mandate
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/learn?category=por" className="hover:text-white transition-colors">
                    Proof of Reserves
                  </NextLink>
                </li>
                <li>
                  <NextLink href="/learn?category=101" className="hover:text-white transition-colors">
                    AliBank 101
                  </NextLink>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#888888]">
                ECOSYSTEM
              </h4>
              <ul className="space-y-2.5 text-xs text-[#BBBBBB]">
                <li>
                  <button onClick={() => setActiveCategory("networks")} className="hover:text-white transition-colors">
                    Polygon Smart Contract
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("networks")} className="hover:text-white transition-colors">
                    Ethereum Liquidity Vault
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("wallets")} className="hover:text-white transition-colors">
                    MetaMask Web3 Bridge
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveCategory("merchant")} className="hover:text-white transition-colors">
                    Merchant POS Terminal
                  </button>
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
                  <NextLink href="/learn?category=aml" className="hover:text-white transition-colors">
                    Anti-Fraud Engine
                  </NextLink>
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

export default function EcosystemPage() {
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
      <EcosystemContent />
    </Suspense>
  );
}
