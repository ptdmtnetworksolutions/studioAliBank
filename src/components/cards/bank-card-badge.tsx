"use client";

import React from "react";
import { CardBinResult } from "@/lib/bin-detector";
import { Wifi, ShieldCheck, Sparkles, Cpu } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BankCardBadgeProps {
  cardInfo: CardBinResult;
  cardHolder?: string;
  expiry?: string;
  isNfcTapped?: boolean;
  className?: string;
}

export function BankCardBadge({
  cardInfo,
  cardHolder = "NAMA PEMEGANG KARTU",
  expiry = "2029-12",
  isNfcTapped = false,
  className = ""
}: BankCardBadgeProps) {
  const { bank, network, cardType, cardLevel, maskedPan, isIndonesian } = cardInfo;

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden p-5 shadow-2xl transition-all duration-300 border border-white/10 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${bank.primaryColor} 0%, #0B1120 70%, ${bank.secondaryColor}44 100%)`
      }}
    >
      {/* Background glowing sheen */}
      <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-primary/10 blur-xl pointer-events-none" />

      {/* Top Header: Bank Logo + Tap NFC Wave + SoftPOS Indicator */}
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-2.5">
          <div 
            className="px-2.5 py-1 rounded-lg font-black text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5"
            style={{ backgroundColor: bank.secondaryColor, color: '#FFFFFF' }}
          >
            <span className="font-extrabold text-sm">{bank.logoText}</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-white tracking-wide">{bank.shortName}</p>
            <p className="text-[8px] font-medium text-white/70 line-clamp-1">{bank.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isNfcTapped && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[8px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              NFC TAP
            </Badge>
          )}
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/90">
            <Wifi className="w-4 h-4 rotate-90" />
          </div>
        </div>
      </div>

      {/* Chip & Contactless Sensor Graphic */}
      <div className="my-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          {/* EMV Microchip Graphic */}
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full border border-amber-900/30 rounded-sm grid grid-cols-2 gap-0.5 p-0.5 opacity-90">
              <div className="border-r border-b border-amber-900/40 rounded-tl" />
              <div className="border-b border-amber-900/40 rounded-tr" />
              <div className="border-r border-amber-900/40 rounded-bl" />
              <div className="rounded-br" />
            </div>
          </div>
          <Cpu className="w-3.5 h-3.5 text-white/40" />
        </div>

        {/* Card Type Badge: DEBIT / KREDIT */}
        <div className="flex items-center gap-1.5">
          <Badge 
            className={`text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-md uppercase border-none ${
              cardType === 'DEBIT' 
                ? 'bg-emerald-500 text-white' 
                : cardType === 'KREDIT'
                ? 'bg-amber-500 text-black'
                : 'bg-cyan-500 text-black'
            }`}
          >
            {cardType}
          </Badge>
          {cardLevel && (
            <span className="text-[9px] font-bold text-white/80 uppercase tracking-tight">
              {cardLevel}
            </span>
          )}
        </div>
      </div>

      {/* Card PAN Number (Masked / Formatted) */}
      <div className="relative z-10 mb-3">
        <p className="font-mono text-base md:text-lg font-bold tracking-[0.2em] text-white drop-shadow-md">
          {maskedPan || "•••• •••• •••• ••••"}
        </p>
      </div>

      {/* Footer: Cardholder Name, Expiry & Network Brand Logo */}
      <div className="flex justify-between items-end relative z-10 pt-2 border-t border-white/10">
        <div className="space-y-0.5">
          <p className="text-[7px] font-black uppercase text-white/60 tracking-widest">Pemegang Kartu</p>
          <p className="text-[10px] font-bold text-white uppercase tracking-wider truncate max-w-[170px]">
            {cardHolder || "NATIVE CONTACTLESS"}
          </p>
        </div>

        <div className="space-y-0.5 text-center">
          <p className="text-[7px] font-black uppercase text-white/60 tracking-widest">Valid Thru</p>
          <p className="text-[10px] font-mono font-bold text-white">
            {expiry || "2030-12"}
          </p>
        </div>

        {/* Network Logo Graphic (GPN, VISA, MASTERCARD, JCB) */}
        <div className="flex items-center justify-end pl-2">
          {network === 'GPN' ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white text-red-600 font-black text-[11px] shadow">
              <span className="text-red-600 font-extrabold tracking-tighter">GPN</span>
              <span className="text-[8px] bg-red-600 text-white px-1 rounded-sm font-bold">ID</span>
            </div>
          ) : network === 'VISA' ? (
            <div className="px-2 py-0.5 rounded bg-white text-blue-900 font-black italic text-sm tracking-tighter shadow">
              VISA
            </div>
          ) : network === 'MASTERCARD' ? (
            <div className="flex items-center -space-x-2">
              <div className="w-5 h-5 rounded-full bg-red-600 opacity-90 shadow" />
              <div className="w-5 h-5 rounded-full bg-amber-400 opacity-90 shadow" />
            </div>
          ) : network === 'JCB' ? (
            <div className="px-1.5 py-0.5 rounded bg-white text-blue-700 font-black text-xs shadow">
              JCB
            </div>
          ) : (
            <div className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-black uppercase">
              CONTACTLESS
            </div>
          )}
        </div>
      </div>

      {/* Security attribution */}
      <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[7px] font-semibold text-white/50 uppercase tracking-widest">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
          PCI-CPOC SoftPOS Certified
        </span>
        <span>Settle to: PT DMT Network Solutions (BSI)</span>
      </div>
    </div>
  );
}

