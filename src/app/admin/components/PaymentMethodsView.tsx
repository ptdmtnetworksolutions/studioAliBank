"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Landmark,
  CreditCard,
  Wifi,
  Building2,
  Loader2,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Definisi semua metode pembayaran (sama dengan di /crypto/buy)
const ALL_PAYMENT_METHODS = [
  {
    id: "midtrans",
    name: "Instan Kliring (Virtual Account/QRIS)",
    icon: Zap,
    desc: "BCA, Mandiri, BRI, BNI, QRIS",
    provider: "Midtrans",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "ipaymu",
    name: "Instan Kliring iPaymu",
    icon: Landmark,
    desc: "Virtual Account, QRIS, Retail Store",
    provider: "iPaymu",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  {
    id: "card",
    name: "Kartu Kredit/Debit Global",
    icon: CreditCard,
    desc: "Visa, Mastercard via PayPal",
    provider: "PayPal",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    id: "nfc",
    name: "TAP NFC (Debit/E-Money)",
    icon: Wifi,
    desc: "Tapping Kartu Debit atau E-Money ke HP (Settlement via PayPal)",
    provider: "NFC + PayPal",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
  {
    id: "bank",
    name: "Transfer Bank Manual",
    icon: Building2,
    desc: "Verifikasi Manual (Kode Unik)",
    provider: "Bank Transfer",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
];

const DEFAULT_CONFIG: Record<string, boolean> = {
  midtrans: true,
  ipaymu: true,
  card: true,
  nfc: true,
  bank: true,
};

export function PaymentMethodsView() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Ambil config dari Firestore
  const configRef = useMemoFirebase(
    () => (db ? doc(db, "system", "payment_config") : null),
    [db]
  );
  const { data: storedConfig, isLoading: configLoading } = useDoc(configRef);

  const [methods, setMethods] = useState<Record<string, boolean>>(DEFAULT_CONFIG);
  const [isSaving, setIsSaving] = useState<string | null>(null); // id metode yang sedang disimpan
  const [isResetting, setIsResetting] = useState(false);

  // Sync state lokal dengan data dari Firestore
  useEffect(() => {
    if (storedConfig?.methods) {
      setMethods({ ...DEFAULT_CONFIG, ...storedConfig.methods });
    }
  }, [storedConfig]);

  const handleToggle = async (methodId: string) => {
    if (!db || !user) return;

    const newValue = !methods[methodId];
    const newMethods = { ...methods, [methodId]: newValue };

    // Optimistic update
    setMethods(newMethods);
    setIsSaving(methodId);

    try {
      await setDoc(
        doc(db, "system", "payment_config"),
        {
          methods: newMethods,
          updatedAt: serverTimestamp(),
          updatedBy: user.email,
        },
        { merge: true }
      );

      const methodName = ALL_PAYMENT_METHODS.find((m) => m.id === methodId)?.name;
      toast({
        title: newValue ? "✅ Metode Diaktifkan" : "🚫 Metode Dinonaktifkan",
        description: `${methodName} berhasil ${newValue ? "diaktifkan" : "dinonaktifkan"}.`,
      });
    } catch (err) {
      // Rollback jika gagal
      setMethods({ ...methods });
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat menyimpan konfigurasi.",
      });
    } finally {
      setIsSaving(null);
    }
  };

  const handleResetAll = async () => {
    if (!db || !user) return;
    setIsResetting(true);

    try {
      await setDoc(doc(db, "system", "payment_config"), {
        methods: DEFAULT_CONFIG,
        updatedAt: serverTimestamp(),
        updatedBy: user.email,
      });
      setMethods(DEFAULT_CONFIG);
      toast({
        title: "✅ Reset Berhasil",
        description: "Semua metode pembayaran telah diaktifkan kembali.",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Reset",
        description: "Terjadi kesalahan saat mereset konfigurasi.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const enabledCount = Object.values(methods).filter(Boolean).length;
  const totalCount = ALL_PAYMENT_METHODS.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">
            Metode Pembayaran
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola metode pembayaran yang tersedia di halaman Beli Kripto.
            Perubahan berlaku secara real-time.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          disabled={isResetting || configLoading}
          className="gap-2 self-start sm:self-auto"
        >
          {isResetting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4" />
          )}
          Reset ke Default
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 bg-card border border-border rounded-2xl">
          <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">
            Total Metode
          </p>
          <p className="text-3xl font-black">{totalCount}</p>
        </Card>
        <Card className="p-5 bg-card border border-border rounded-2xl">
          <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">
            Aktif
          </p>
          <p className="text-3xl font-black text-emerald-400">{enabledCount}</p>
        </Card>
        <Card className="p-5 bg-card border border-border rounded-2xl">
          <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-2">
            Nonaktif
          </p>
          <p className="text-3xl font-black text-rose-400">
            {totalCount - enabledCount}
          </p>
        </Card>
      </div>

      {/* Warning jika semua dinonaktifkan */}
      {enabledCount === 0 && (
        <Card className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-black text-rose-400">Semua Metode Dinonaktifkan!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Pengguna tidak dapat melakukan pembelian kripto saat ini. Aktifkan minimal satu metode pembayaran.
            </p>
          </div>
        </Card>
      )}

      {/* Info banner */}
      <Card className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-3">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Toggle di bawah akan langsung mengubah metode pembayaran yang tampil di halaman{" "}
          <span className="font-bold text-foreground">/crypto/buy</span> tanpa perlu reload aplikasi.
          Konfigurasi disimpan di Firestore dan berlaku secara real-time untuk semua pengguna.
        </p>
      </Card>

      {/* Daftar Metode Pembayaran */}
      {configLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-4">
          {ALL_PAYMENT_METHODS.map((method) => {
            const isEnabled = methods[method.id] ?? true;
            const isThisSaving = isSaving === method.id;
            const Icon = method.icon;

            return (
              <Card
                key={method.id}
                className={cn(
                  "p-5 border rounded-2xl transition-all duration-300",
                  isEnabled
                    ? "bg-card border-border"
                    : "bg-muted/30 border-border/50 opacity-60"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
                      method.bgColor,
                      method.borderColor
                    )}
                  >
                    <Icon className={cn("w-6 h-6", method.color)} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black">{method.name}</p>
                      <Badge
                        className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border-0",
                          isEnabled
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-rose-500/15 text-rose-400"
                        )}
                      >
                        {isEnabled ? (
                          <><CheckCircle2 className="w-2.5 h-2.5 mr-1 inline" />AKTIF</>
                        ) : (
                          <><AlertTriangle className="w-2.5 h-2.5 mr-1 inline" />NONAKTIF</>
                        )}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{method.desc}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1">
                      Provider: {method.provider}
                    </p>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => handleToggle(method.id)}
                    disabled={isThisSaving}
                    className={cn(
                      "relative shrink-0 w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
                      isEnabled
                        ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                        : "bg-muted-foreground/30"
                    )}
                    aria-label={`${isEnabled ? "Nonaktifkan" : "Aktifkan"} ${method.name}`}
                  >
                    {isThisSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    ) : (
                      <span
                        className={cn(
                          "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300",
                          isEnabled ? "left-[calc(100%-26px)]" : "left-0.5"
                        )}
                      />
                    )}
                  </button>
                </div>

                {/* Disabled notice */}
                {!isEnabled && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/60" />
                    <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">
                      Metode ini disembunyikan dari halaman pembelian
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Footer info */}
      <Card className="p-4 bg-muted/30 border border-border/50 rounded-2xl">
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">
          Terakhir diperbarui oleh: {storedConfig?.updatedBy || "—"} ·{" "}
          {storedConfig?.updatedAt
            ? new Date(storedConfig.updatedAt.seconds * 1000).toLocaleString("id-ID")
            : "Belum ada perubahan"}
        </p>
      </Card>
    </div>
  );
}
