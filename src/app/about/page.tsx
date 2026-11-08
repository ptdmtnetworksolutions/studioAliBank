import { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Tentang AliBank - Hybrid Web3 Neobank & Transparent Financial Network",
  description:
    "Pelajari siapa AliBank, infrastruktur perbankan digital hibrida dengan bukti cadangan riil 1:1 (Proof-of-Reserves), smart contract terverifikasi di Polygon & Ethereum, serta dompet multi-chain standar TrustWallet Core.",
  openGraph: {
    title: "AliBank V3 - The Premier Hybrid Digital Banking & Web3 Platform",
    description:
      "Perbankan digital hibrida dengan bukti cadangan 1:1, transfer instan 0 biaya, dan kedaulatan dompet Web3 terverifikasi.",
    url: "https://alibank.tarroz.com/about",
    siteName: "AliBank",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "AliBank V3 - Hybrid Neobank & Web3 Network",
    description: "100% Solvency Proof-of-Reserves, Multi-Chain TrustWallet Core, and Zero-Fee Instant P2P.",
  },
  keywords: [
    "AliBank",
    "neobank",
    "web3 bank",
    "proof of reserves",
    "alix coin",
    "polygon mainnet",
    "ethereum vault",
    "bitcoin segwit",
    "trustwallet core",
    "perbankan digital indonesia",
    "crypto banking"
  ],
};

export default function AboutPage() {
  return <LandingPage />;
}
