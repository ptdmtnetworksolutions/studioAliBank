"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Key, 
  ShieldCheck, 
  Save, 
  Loader2, 
  AlertCircle,
  Lock,
  Globe,
  Database,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  CreditCard,
  Building2,
  Wallet,
  Bell,
  Flame
} from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/layout/Navbar";
import { LogoIcon } from "@/components/ui/logo";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const OWNER_EMAIL = "alidzulfikar075@gmail.com";
const OWNER_UID = "IJOuQpjEOMgvlYfzvQ1yfp976Oa2";

export default function APIKeysPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>}>
      <APIKeysContent />
    </Suspense>
  );
}

function APIKeysContent() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // API Key States
  const [keys, setKeys] = useState({
    infuraProjectId: "30ba607f7b6845bca3a645b110a0db22",
    infuraProjectSecret: "",
    infuraGasApiUrl: "https://gas.api.infura.io/v3/30ba607f7b6845bca3a645b110a0db22",
    paypalClientId: "",
    paypalClientSecret: "",
    paypalWebhookId: "",
    midtransMerchantId: "",
    midtransClientKey: "",
    midtransServerKey: "",
    ipaymuVa: "",
    ipaymuApiKey: "",
    ipaymuSandbox: false,
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    polygonRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: "",
    vaultContractAddress: "",
    vaultPrivateKey: "" 
  });

  const apiKeysRef = useMemoFirebase(() => (db && user ? doc(db, "system", "api_keys") : null), [db, user]);
  const { data: storedKeys, isLoading: keysLoading } = useDoc(apiKeysRef);

  useEffect(() => {
    if (storedKeys) {
      setKeys({
        infuraProjectId: storedKeys.infuraProjectId || "30ba607f7b6845bca3a645b110a0db22",
        infuraProjectSecret: storedKeys.infuraProjectSecret || "",
        infuraGasApiUrl: storedKeys.infuraGasApiUrl || "https://gas.api.infura.io/v3/30ba607f7b6845bca3a645b110a0db22",
        paypalClientId: storedKeys.paypalClientId || "",
        paypalClientSecret: storedKeys.paypalClientSecret || "",
        paypalWebhookId: storedKeys.paypalWebhookId || "",
        midtransMerchantId: storedKeys.midtransMerchantId || "",
        midtransClientKey: storedKeys.midtransClientKey || "",
        midtransServerKey: storedKeys.midtransServerKey || "",
        ipaymuVa: storedKeys.ipaymuVa || "",
        ipaymuApiKey: storedKeys.ipaymuApiKey || "",
        ipaymuSandbox: storedKeys.ipaymuSandbox ?? false,
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

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.email !== 'aldzulfikar075@gmail.com' && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
  }, [user, userLoading, router]);

  const handleSaveKeys = async () => {
    if (!db || !isAuthorized || isSaving) return;
    setIsSaving(true);

    const docRef = doc(db, "system", "api_keys");
    const publicDocRef = doc(db, "system", "public_keys");

    const publicKeys = {
      infuraProjectId: keys.infuraProjectId,
      infuraGasApiUrl: keys.infuraGasApiUrl,
      paypalClientId: keys.paypalClientId,
      midtransClientKey: keys.midtransClientKey,
      ipaymuVa: keys.ipaymuVa,
      ipaymuSandbox: keys.ipaymuSandbox,
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
        toast({ 
          title: "Vault Diperbarui", 
          description: "Seluruh terminal pembayaran dan node sistem telah disinkronkan secara riil." 
        });
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

  const toggleShow = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (userLoading || !isAuthorized) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-body selection:bg-primary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-4xl pt-8 pb-32">
        <header className="mb-12">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Pusat Kendali
          </button>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-[1.5rem] bg-slate-900 flex items-center justify-center shadow-2xl p-5 border border-white/5 relative overflow-hidden group">
              <div className="absolute inset-0 gold-gradient opacity-10 group-hover:opacity-20 transition-opacity" />
              <Key className="text-primary w-full h-full relative z-10" />
            </div>
            <div className="text-center md:text-left">
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2 tracking-widest px-3 py-1 rounded-full">Security Protocol V3.5</Badge>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Credential <span className="text-primary">Vault</span></h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 italic flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Manajemen Kliring & Node Infrastruktur AliBank
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <Card className="liquid-glass-dark border-none rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
            
            <div className="space-y-10 relative z-10">
              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-primary" /> AliBank Central Vault
                  </h3>
                  <Badge className="bg-rose-600 text-white text-[8px] font-black italic uppercase px-2 h-5">Sensitive Data</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KeyField 
                    label="MetaMask / Infura Project ID" 
                    icon={Zap} 
                    value={keys.infuraProjectId} 
                    placeholder="30ba607f..."
                    onChange={(v: any) => setKeys({...keys, infuraProjectId: v})}
                    show={true}
                    description="Kunci identitas publik untuk sinkronisasi node RPC Ethereum & Polygon."
                  />
                  <KeyField 
                    label="MetaMask / Infura Project Secret" 
                    icon={Lock} 
                    value={keys.infuraProjectSecret} 
                    placeholder="Masukkan secret di sini..."
                    onChange={(v: any) => setKeys({...keys, infuraProjectSecret: v})}
                    show={showKeys['infura_sec']}
                    onToggle={() => toggleShow('infura_sec')}
                    description="Hanya digunakan di sisi server untuk otentikasi node prioritas yang aman."
                  />
                  <div className="md:col-span-2">
                    <KeyField 
                      label="Infura Gas API Endpoint" 
                      icon={Flame} 
                      value={keys.infuraGasApiUrl} 
                      placeholder="https://gas.api.infura.io/v3/..."
                      onChange={(v: any) => setKeys({...keys, infuraGasApiUrl: v})}
                      show={true}
                      description="Digunakan untuk estimasi biaya jaringan (Gas) yang akurat secara real-time."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <KeyField 
                      label="Kontrak Pintar Brankas (Vault)" 
                      icon={ShieldCheck} 
                      value={keys.vaultContractAddress} 
                      placeholder="0x56268032A3B3E64CFeF1916d591087CF8dF40945"
                      onChange={(v: any) => setKeys({...keys, vaultContractAddress: v})}
                      show={true}
                      description="Alamat kontrak Ethereum Mainnet untuk penyimpanan likuiditas utama."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <KeyField 
                      label="Vault Private Key (0x...)" 
                      icon={Lock} 
                      value={keys.vaultPrivateKey} 
                      placeholder="0x..."
                      onChange={(v: any) => setKeys({...keys, vaultPrivateKey: v})} 
                      show={showKeys['vault']}
                      onToggle={() => toggleShow('vault')}
                      description="Kunci privat MetaMask untuk tanda tangan on-chain otomatis oleh sistem."
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/5 w-full" />

              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                    <Globe className="w-5 h-5 text-primary" /> Global Kliring (PayPal)
                  </h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black italic uppercase px-2 h-5">USD Gateway</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KeyField 
                    label="PayPal Client ID" 
                    icon={Globe} 
                    value={keys.paypalClientId} 
                    placeholder="AW-..."
                    onChange={(v: any) => setKeys({...keys, paypalClientId: v})}
                    show={showKeys['paypal_id']}
                    onToggle={() => toggleShow('paypal_id')}
                  />
                  <KeyField 
                    label="PayPal Client Secret" 
                    icon={Lock} 
                    value={keys.paypalClientSecret} 
                    placeholder="E..."
                    onChange={(v: any) => setKeys({...keys, paypalClientSecret: v})}
                    show={showKeys['paypal_secret']}
                    onToggle={() => toggleShow('paypal_secret')}
                  />
                  <div className="md:col-span-2">
                    <KeyField 
                      label="PayPal Webhook ID" 
                      icon={Bell} 
                      value={keys.paypalWebhookId} 
                      placeholder="WH-..."
                      onChange={(v: any) => setKeys({...keys, paypalWebhookId: v})}
                      show={showKeys['paypal_wh']}
                      onToggle={() => toggleShow('paypal_wh')}
                      description="URL Webhook: https://studio--darmedia-pos.us-central1.hosted.app/api/paypal/webhook"
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/5 w-full" />

              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" /> Lokal Kliring (Midtrans)
                  </h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black italic uppercase px-2 h-5">IDR Gateway</Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KeyField 
                    label="Merchant ID" 
                    icon={Building2} 
                    value={keys.midtransMerchantId} 
                    placeholder="M287..."
                    onChange={(v: any) => setKeys({...keys, midtransMerchantId: v})}
                    show={true}
                  />
                  <KeyField 
                    label="Client Key" 
                    icon={Key} 
                    value={keys.midtransClientKey} 
                    placeholder="Mid-client-..."
                    onChange={(v: any) => setKeys({...keys, midtransClientKey: v})}
                    show={showKeys['mt_client']}
                    onToggle={() => toggleShow('mt_client')}
                  />
                  <div className="md:col-span-2">
                    <KeyField 
                      label="Server Key (Sensitive)" 
                      icon={Lock} 
                      value={keys.midtransServerKey} 
                      placeholder="Mid-server-..."
                      onChange={(v: any) => setKeys({...keys, midtransServerKey: v})}
                      show={showKeys['mt_server']}
                      onToggle={() => toggleShow('mt_server')}
                    />
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/5 w-full" />

              <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary" /> Lokal Kliring (iPaymu)
                  </h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black italic uppercase px-2 h-5">IDR Gateway</Badge>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KeyField 
                    label="iPaymu Virtual Account (VA)" 
                    icon={Building2} 
                    value={keys.ipaymuVa} 
                    placeholder="117900..."
                    onChange={(v: any) => setKeys({...keys, ipaymuVa: v})}
                    show={true}
                  />
                  <KeyField 
                    label="iPaymu API Key" 
                    icon={Lock} 
                    value={keys.ipaymuApiKey} 
                    placeholder="QbGcoO..."
                    onChange={(v: any) => setKeys({...keys, ipaymuApiKey: v})}
                    show={showKeys['ipaymu_key']}
                    onToggle={() => toggleShow('ipaymu_key')}
                  />
                  <div className="md:col-span-2 flex flex-col space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">iPaymu Environment Mode</label>
                    <div className="flex bg-white/5 p-1 rounded-2xl w-full max-w-[300px] border border-white/5">
                      <button
                        type="button"
                        onClick={() => setKeys({...keys, ipaymuSandbox: false})}
                        className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-xl transition-all ${!keys.ipaymuSandbox ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"}`}
                      >
                        Production
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeys({...keys, ipaymuSandbox: true})}
                        className={`flex-1 py-2 text-[10px] font-black uppercase italic rounded-xl transition-all ${keys.ipaymuSandbox ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-white"}`}
                      >
                        Sandbox
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="h-px bg-white/5 w-full" />

              <section className="space-y-8">
                <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary" /> Blockchain & AI Nodes
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <KeyField 
                    label="Ethereum RPC Node (Alchemy)" 
                    icon={Cpu} 
                    value={keys.ethereumRpcUrl} 
                    placeholder="https://eth-mainnet.g.alchemy.com/v2/your-key"
                    onChange={(v: any) => setKeys({...keys, ethereumRpcUrl: v})} 
                    show={true} 
                  />
                  <KeyField 
                    label="Polygon RPC Node (Alchemy)" 
                    icon={Zap} 
                    value={keys.polygonRpcUrl} 
                    placeholder="https://polygon-mainnet.g.alchemy.com/v2/your-key"
                    onChange={(v: any) => setKeys({...keys, polygonRpcUrl: v})} 
                    show={true} 
                  />
                  <div className="md:col-span-2">
                    <KeyField 
                      label="Kontrak Pintar Koin ALX" 
                      icon={ShieldCheck} 
                      value={keys.alxContractAddress} 
                      placeholder="0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd"
                      onChange={(v: any) => setKeys({...keys, alxContractAddress: v})}
                      show={true}
                    />
                  </div>
                </div>
              </section>

              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Peringatan: Project Secret MetaMask/Infura bersifat sangat rahasia. Jangan pernah membagikan kunci ini kepada siapa pun karena dapat memberikan akses tak terbatas ke kuota node Anda.
                </p>
              </div>

              <Button 
                onClick={handleSaveKeys} 
                disabled={isSaving || keysLoading}
                className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base group"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center gap-3">
                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" /> SIMPAN KONFIGURASI VAULT
                  </span>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <footer className="mt-20 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-30 grayscale group">
            <LogoIcon className="w-5 h-5 group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">AliBank V3 Encrypted Vault System</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function KeyField({ label, icon: Icon, value, placeholder, onChange, show, onToggle, description }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end px-2">
        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
        {description && (
          <Badge className="bg-white/5 text-muted-foreground text-[7px] font-bold h-4 border-none uppercase px-1.5">Info</Badge>
        )}
      </div>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <Input 
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 pl-12 pr-12 rounded-2xl bg-white/5 border-white/5 font-mono text-xs focus:ring-2 focus:ring-primary/20 transition-all text-white placeholder:text-white/10"
        />
        {onToggle && (
          <button 
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {description && (
        <p className="text-[8px] font-bold text-muted-foreground/60 uppercase italic px-2 leading-tight">{description}</p>
      )}
    </div>
  );
}
