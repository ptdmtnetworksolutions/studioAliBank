"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Key, 
  Globe, 
  Cpu, 
  RefreshCw, 
  Lock, 
  Database, 
  Save, 
  Loader2, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Zap,
  Building2,
  Wallet,
  ShieldCheck,
  Bell,
  Flame
} from "lucide-react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useFirestore, useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export function ApiManagementView({ storedKeys }: any) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState({
    infuraProjectId: "",
    infuraProjectSecret: "",
    infuraGasApiUrl: "",
    paypalClientId: "",
    paypalClientSecret: "",
    paypalWebhookId: "",
    midtransMerchantId: "",
    midtransClientKey: "",
    midtransServerKey: "",
    ipaymuVa: "",
    ipaymuApiKey: "",
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    polygonRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: "",
    vaultContractAddress: "",
    vaultPrivateKey: ""
  });

  useEffect(() => {
    if (storedKeys) {
      setKeys({
        infuraProjectId: storedKeys.infuraProjectId || "",
        infuraProjectSecret: storedKeys.infuraProjectSecret || "",
        infuraGasApiUrl: storedKeys.infuraGasApiUrl || "",
        paypalClientId: storedKeys.paypalClientId || "",
        paypalClientSecret: storedKeys.paypalClientSecret || "",
        paypalWebhookId: storedKeys.paypalWebhookId || "",
        midtransMerchantId: storedKeys.midtransMerchantId || "" ,
        midtransClientKey: storedKeys.midtransClientKey || "",
        midtransServerKey: storedKeys.midtransServerKey || "",
        ipaymuVa: storedKeys.ipaymuVa || "",
        ipaymuApiKey: storedKeys.ipaymuApiKey || "",
        etherscanApiKey: storedKeys.etherscanApiKey || "",
        ethereumRpcUrl: storedKeys.ethereumRpcUrl || "",
        polygonRpcUrl: storedKeys.polygonRpcUrl || "",
        geminiApiKey: storedKeys.geminiApiKey || "",
        alxContractAddress: storedKeys.alxContractAddress || "",
        vaultContractAddress: storedKeys.vaultContractAddress || "",
        vaultPrivateKey: storedKeys.vaultPrivateKey || ""
      });
    }
  }, [storedKeys]);

  const handleSave = async () => {
    if (!db || isSaving) return;
    setIsSaving(true);
    
    const docRef = doc(db, "system", "api_keys");
    const publicDocRef = doc(db, "system", "public_keys");

    const publicKeys = {
      infuraProjectId: keys.infuraProjectId,
      infuraGasApiUrl: keys.infuraGasApiUrl,
      paypalClientId: keys.paypalClientId,
      midtransClientKey: keys.midtransClientKey,
      polygonRpcUrl: keys.polygonRpcUrl,
      ethereumRpcUrl: keys.ethereumRpcUrl,
      alxContractAddress: keys.alxContractAddress,
      vaultContractAddress: keys.vaultContractAddress,
    };
    
    Promise.all([
      setDoc(docRef, {
        ...keys,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      }, { merge: true }),
      setDoc(publicDocRef, {
        ...publicKeys,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email
      }, { merge: true })
    ])
      .then(() => {
        toast({ title: "Brankas Kredensial Diperbarui", description: "Node kliring AliBank telah disinkronkan." });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: keys,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const toggleShow = (id: string) => setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="animate-in fade-in slide-in-from-top-10 duration-700 space-y-10">
      <header className="flex justify-between items-end px-2">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Brankas Kredensial</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Kendali Gateway & Infrastruktur Node</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-none font-black italic text-[8px] h-6 px-3 uppercase">Lapisan Keamanan V3.5 Aktif</Badge>
      </header>

      <Card className="border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Key className="w-64 h-64 text-primary" /></div>
        
        <div className="space-y-10 relative z-10">
          {/* INFURA SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <Zap className="w-4 h-4" /> MetaMask Developer (Infura Node)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KeyField 
                label="Infura Project ID" 
                icon={Zap} 
                value={keys.infuraProjectId} 
                placeholder="30ba607f..."
                onChange={(v: any) => setKeys({...keys, infuraProjectId: v})}
                show={true}
                description="Kunci publik utama untuk otentikasi node RPC."
              />
              <KeyField 
                label="Infura Project Secret" 
                icon={Lock} 
                value={keys.infuraProjectSecret} 
                placeholder="Project Secret..."
                onChange={(v: any) => setKeys({...keys, infuraProjectSecret: v})}
                show={showKeys['inf_sec']}
                onToggle={() => toggleShow('inf_sec')}
                description="Hanya digunakan di sisi server untuk keamanan maksimal."
              />
              <div className="md:col-span-2">
                <KeyField 
                  label="Infura Gas API Endpoint" 
                  icon={Flame} 
                  value={keys.infuraGasApiUrl} 
                  placeholder="https://gas.api.infura.io/v3/..."
                  onChange={(v: any) => setKeys({...keys, infuraGasApiUrl: v})}
                  show={true}
                  description="URL real-time estimasi biaya transaksi blockchain."
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border/50 w-full" />

          {/* VAULT SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Brankas Pusat (Tanda Tangan Privat)
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <KeyField 
                label="Kontrak Pintar Brankas (Vault)" 
                icon={ShieldCheck} 
                value={keys.vaultContractAddress} 
                placeholder="0x56268032A3B3E64CFeF1916d591087CF8dF40945"
                onChange={(v: any) => setKeys({...keys, vaultContractAddress: v})}
                show={true}
                description="Alamat kontrak Ethereum Mainnet untuk penyimpanan likuiditas utama."
              />
              <KeyField 
                label="Kunci Privat Brankas (0x...)" 
                icon={Lock} 
                value={keys.vaultPrivateKey} 
                placeholder="0x..."
                onChange={(v:any) => setKeys({...keys, vaultPrivateKey: v})} 
                show={showKeys['vp']} 
                onToggle={() => toggleShow('vp')}
                description="Kunci privat MetaMask Anda untuk tanda tangan transaksi on-chain otomatis."
              />
            </div>
          </section>

          <div className="h-px bg-border/50 w-full" />

          {/* PAYPAL SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <Globe className="w-4 h-4" /> Kliring Global (PayPal)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KeyField 
                label="PayPal Client ID" 
                icon={Globe} 
                value={keys.paypalClientId} 
                placeholder="AW-..." 
                onChange={(v:any) => setKeys({...keys, paypalClientId: v})} 
                show={showKeys['pp_id']} 
                onToggle={() => toggleShow('pp_id')} 
              />
              <KeyField 
                label="PayPal Client Secret" 
                icon={Lock} 
                value={keys.paypalClientSecret} 
                placeholder="E..." 
                onChange={(v:any) => setKeys({...keys, paypalClientSecret: v})} 
                show={showKeys['pp_sec']} 
                onToggle={() => toggleShow('pp_sec')} 
              />
              <div className="md:col-span-2">
                <KeyField 
                  label="PayPal Webhook ID" 
                  icon={Bell} 
                  value={keys.paypalWebhookId} 
                  placeholder="WH-..." 
                  onChange={(v:any) => setKeys({...keys, paypalWebhookId: v})} 
                  show={showKeys['pp_wh']} 
                  onToggle={() => toggleShow('pp_wh')} 
                  description="Gunakan ini untuk notifikasi penyelesaian pembayaran sisi server yang lebih aman."
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border/50 w-full" />

          {/* MIDTRANS SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Kliring Lokal (Midtrans)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KeyField label="Midtrans Merchant ID" icon={Building2} value={keys.midtransMerchantId} placeholder="M2..." onChange={(v:any) => setKeys({...keys, midtransMerchantId: v})} show={true} />
              <KeyField label="Midtrans Client Key" icon={Key} value={keys.midtransClientKey} placeholder="Mid-client-..." onChange={(v:any) => setKeys({...keys, midtransClientKey: v})} show={showKeys['mt_c']} onToggle={() => toggleShow('mt_c')} />
              <div className="md:col-span-2">
                <KeyField label="Midtrans Server Key (Sensitif)" icon={Lock} value={keys.midtransServerKey} placeholder="Mid-server-..." onChange={(v:any) => setKeys({...keys, midtransServerKey: v})} show={showKeys['mt_s']} onToggle={() => toggleShow('mt_s')} description="Server Key digunakan untuk otentikasi aman antar server. Jangan pernah bagikan." />
              </div>
            </div>
          </section>

          <div className="h-px bg-border/50 w-full" />

          {/* IPAYMU SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Kliring Lokal (iPaymu)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KeyField label="iPaymu Virtual Account (VA)" icon={Building2} value={keys.ipaymuVa} placeholder="117900..." onChange={(v:any) => setKeys({...keys, ipaymuVa: v})} show={true} />
              <KeyField label="iPaymu API Key" icon={Lock} value={keys.ipaymuApiKey} placeholder="QbGcoO..." onChange={(v:any) => setKeys({...keys, ipaymuApiKey: v})} show={showKeys['ip_key']} onToggle={() => toggleShow('ip_key')} description="API Key akun iPaymu Anda untuk otentikasi transaksi." />
            </div>
          </section>

          <div className="h-px bg-border/50 w-full" />

          {/* BLOCKCHAIN & AI SECTION */}
          <section className="space-y-6">
            <h3 className="text-sm font-black italic uppercase tracking-widest text-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Node Blockchain & AI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <KeyField 
                label="Node RPC Ethereum (Mainnet)" 
                icon={Cpu} 
                value={keys.ethereumRpcUrl} 
                placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
                onChange={(v: any) => setKeys({...keys, ethereumRpcUrl: v})} 
                show={true} 
                description="Gunakan node dari Alchemy untuk Brankas ETH."
              />
              <KeyField 
                label="Node RPC Polygon (Kontrol ALX)" 
                icon={Zap} 
                value={keys.polygonRpcUrl} 
                placeholder="https://polygon-mainnet.g.alchemy.com/v2/..."
                onChange={(v: any) => setKeys({...keys, polygonRpcUrl: v})} 
                show={true} 
                description="Gunakan node dari Alchemy untuk Operasional Koin ALX."
              />
              <KeyField label="Kunci API Gemini" icon={Lock} value={keys.geminiApiKey} placeholder="AIza..." onChange={(v: any) => setKeys({...keys, geminiApiKey: v})} show={showKeys['gm']} onToggle={() => toggleShow('gm')} />
              <KeyField label="Kontrak Pintar Koin ALX" icon={ShieldCheck} value={keys.alxContractAddress} placeholder="0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd" onChange={(v: any) => setKeys({...keys, alxContractAddress: v})} show={true} />
            </div>
          </section>
        </div>

        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Pastikan seluruh kredensial bersifat PRODUKSI. Perubahan di sini akan segera mengubah perilaku terminal pembayaran nasabah secara global.</p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base">
          {isSaving ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-3"><Save className="w-5 h-5" /> SINKRONISASI BRANKAS GLOBAL</span>}
        </Button>
      </Card>
    </div>
  );
}

function KeyField({ label, icon: Icon, value, placeholder, onChange, show, onToggle, description }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Icon className="w-4 h-4" /></div>
        <Input 
          type={show ? "text" : "password"} 
          value={value} 
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} 
          className="h-14 pl-12 pr-12 bg-muted/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
        />
        {onToggle && <button onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
      </div>
      {description && <p className="text-[8px] font-bold text-muted-foreground/60 uppercase italic px-2">{description}</p>}
    </div>
  );
}
