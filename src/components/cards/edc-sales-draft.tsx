"use client";

import React from "react";
import { SoftPosTransactionReceipt } from "@/lib/softpos-acquirer";
import { CheckCircle2, Printer, Copy, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EdcSalesDraftProps {
  receipt: SoftPosTransactionReceipt;
  onDone: () => void;
}

export function EdcSalesDraft({ receipt, onDone }: EdcSalesDraftProps) {
  const { toast } = useToast();

  const handleCopyReceipt = () => {
    const text = `
========================================
       PT DMT NETWORK SOLUTIONS
       TERMINAL EDC SOFTPOS ALIBANK
========================================
ACQUIRER : ${receipt.acquirer}
MERCHANT : ${receipt.merchantName}
MID      : ${receipt.merchantId}
TID      : ${receipt.terminalId}
DATE/TIME: ${new Date(receipt.timestamp).toLocaleString("id-ID")}
RRN      : ${receipt.retrievalRefNumber}
STAN     : ${receipt.systemTraceAuditNumber}
----------------------------------------
BANK     : ${receipt.bankName}
CARD     : ${receipt.cardType} (${receipt.network})
PAN      : ${receipt.maskedPan}
HOLDER   : ${receipt.cardHolder}
AID      : ${receipt.emvTags.aid}
ARQC     : ${receipt.emvTags.arqc}
----------------------------------------
TRANS    : PEMBELIAN KRIPTO CONTACTLESS
TOTAL    : Rp ${receipt.amountIdr.toLocaleString("id-ID")}
ASSET    : ${receipt.cryptoAmount} ${receipt.cryptoCurrency}
APPR CODE: ${receipt.approvalCode}
STATUS   : ${receipt.status} (${receipt.hostResponseCode})
SETTLE TO: ${receipt.settlementDestination}
----------------------------------------
   NO SIGNATURE REQUIRED - PIN BYPASS
  TERIMA KASIH ATAS TRANSAKSI ANDA
========================================
`.trim();

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast({ title: "Struk Disalin", description: "Format struk EDC berhasil disalin ke clipboard." });
    }
  };

  return (
    <div className="space-y-4 max-w-sm mx-auto animate-in zoom-in-95 duration-200">
      {/* Thermal Receipt Paper Card */}
      <div className="bg-[#FAF9F5] text-slate-800 rounded-2xl p-5 shadow-2xl border border-border/80 font-mono text-[10px] space-y-3 relative overflow-hidden">
        {/* Subtle zigzag thermal tear on top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary to-amber-500" />

        {/* Header */}
        <div className="text-center space-y-1 pb-2 border-b border-dashed border-slate-300">
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 font-sans font-black text-xs uppercase tracking-tight">
            <CheckCircle2 className="w-4 h-4" />
            <span>TRANSAKSI EDC BERHASIL</span>
          </div>
          <h3 className="font-sans font-black text-xs text-slate-900 uppercase tracking-wider">{receipt.merchantName}</h3>
          <p className="text-[8px] text-slate-500 font-sans uppercase">Terminal SoftPOS Contactless v2.4</p>
          <p className="text-[8px] text-slate-500 font-sans uppercase font-bold">{receipt.acquirer}</p>
        </div>

        {/* Terminal Identifiers */}
        <div className="space-y-0.5 text-[9px] text-slate-600">
          <div className="flex justify-between">
            <span>TID: {receipt.terminalId}</span>
            <span>MID: {receipt.merchantId.slice(0, 15)}</span>
          </div>
          <div className="flex justify-between">
            <span>DATE: {new Date(receipt.timestamp).toLocaleDateString("id-ID")}</span>
            <span>TIME: {new Date(receipt.timestamp).toLocaleTimeString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>STAN: {receipt.systemTraceAuditNumber}</span>
            <span>RRN: {receipt.retrievalRefNumber}</span>
          </div>
        </div>

        {/* Card Details */}
        <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
          <div className="flex justify-between font-bold text-slate-900">
            <span>BANK:</span>
            <span className="text-right truncate max-w-[190px]">{receipt.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span>TIPE KARTU:</span>
            <span className="font-bold text-slate-900">{receipt.cardType} ({receipt.network})</span>
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-950">
            <span>NO KARTU:</span>
            <span>{receipt.maskedPan}</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>PEMEGANG:</span>
            <span className="truncate max-w-[170px] uppercase">{receipt.cardHolder}</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>AID: {receipt.emvTags.aid}</span>
            <span>ARQC: {receipt.emvTags.arqc.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Transaction Amount & Settlement */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-black text-slate-900">
            <span>TOTAL DEBET:</span>
            <span className="text-sm">Rp {receipt.amountIdr.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
            <span>ALOKASI KRIPTO:</span>
            <span>+{receipt.cryptoAmount} {receipt.cryptoCurrency}</span>
          </div>
          <div className="flex justify-between text-[9px] font-bold text-slate-700">
            <span>APPR CODE:</span>
            <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900">{receipt.approvalCode}</span>
          </div>
          <div className="flex justify-between text-[8px] text-slate-500">
            <span>RESPON:</span>
            <span>{receipt.hostResponseCode} - APPROVED</span>
          </div>
          
          <div className="mt-2 pt-1 border-t border-slate-200 text-[8px] text-slate-500 leading-tight">
            <span className="font-bold text-slate-700 block">SETTLEMENT REKENING PERUSAHAAN:</span>
            <span>{receipt.settlementDestination}</span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-dashed border-slate-300 text-[8px] text-slate-500 space-y-0.5">
          <p className="font-bold text-slate-700">PIN VERIFIED / SIGNATURE NOT REQUIRED</p>
          <p>DIPROSES SECARA ELEKTRONIK BEKERJA SAMA DENGAN MITRA SOFTPOS</p>
          <div className="flex items-center justify-center gap-1 text-[7px] text-emerald-600 font-sans font-bold pt-1">
            <ShieldCheck className="w-3 h-3" />
            PCI-CPOC & Bank Indonesia Approved
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={handleCopyReceipt}
          className="h-11 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          Salin Struk EDC
        </Button>
        <Button
          onClick={onDone}
          className="h-11 gold-gradient text-white rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center justify-center gap-1.5"
        >
          Lihat Portofolio
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

