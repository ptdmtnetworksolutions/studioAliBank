
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
  EyeOff
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
const ALX_CONTRACT = process.env.NEXT_PUBLIC_ALX_ADDRESS || "0x8BAFCa0a5a5F288DCc0af6da6951dD3D59E0d1Dd";

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
    paypalClientId: "",
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: ALX_CONTRACT
  });

  const apiKeysRef = useMemoFirebase(() => (db && isAuthorized ? doc(db, "system", "api_keys") : null), [db, isAuthorized]);
  const { data: storedKeys, loading: keysLoading } = useDoc(apiKeysRef);

  useEffect(() => {
    if (storedKeys) {
      setKeys({
        paypalClientId: storedKeys.paypalClientId || "",
        etherscanApiKey: storedKeys.etherscanApiKey || "",
        ethereumRpcUrl: storedKeys.ethereumRpcUrl || "",
        geminiApiKey: storedKeys.geminiApiKey || "",
        alxContractAddress: storedKeys.alxContractAddress || ALX_CONTRACT
      });
    }
  }, [storedKeys]);

  useEffect(() => {
    if (userLoading) return;
    if (!user || (user.email !== OWNER_EMAIL && user.uid !== OWNER_UID)) {
      router.push('/login');
      return;
    }
    setIsAuthorized(true);
  }, [user, userLoading, router]);

  const handleSaveKeys = async () => {
    if (!db || !isAuthorized || isSaving) return;
    setIsSaving(true);

    const docRef = doc(db, "system", "api_keys");
    setDoc(docRef, {
      ...keys,
      updatedAt: serverTimestamp(),
      updatedBy: user?.email
    }, { merge: true })
      .then(() => {
        toast({ title: "Konfigurasi Disimpan", description: "Seluruh API Key sistem telah diperbarui secara riil." });
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
            <div className="w-20 h-20 rounded-[1.5rem] gold-gradient flex items-center justify-center shadow-xl p-5">
              <Key className="text-white w-full h-full" />
            </div>
            <div className="text-center md:text-left">
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[8px] mb-2 tracking-widest">Security Layer V3</Badge>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Credential <span className="text-primary">Vault</span></h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1 italic flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Pengelolaan API Key Eksternal AliBank
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <Card className="liquid-glass border-none rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><LogoIcon className="w-64 h-64 text-primary" /></div>
            
            <div className="space-y-8 relative z-10">
              <section className="space-y-6">
                <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary" /> Gateway Configurations
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <KeyField 
                    label="PayPal Client ID" 
                    icon={Globe} 
                    value={keys.paypalClientId} 
                    placeholder="AbHG-qL9bHR0..."
                    onChange={(v) => setKeys({...keys, paypalClientId: v})}
                    show={showKeys['paypal']}
                    onToggle={() => toggleShow('paypal')}
                  />
                  <KeyField 
                    label="Etherscan API Key" 
                    icon={Cpu} 
                    value={keys.etherscanApiKey} 
                    placeholder="M1S7MDTBQSG1..."
                    onChange={(v) => setKeys({...keys, etherscanApiKey: v})}
                    show={showKeys['etherscan']}
                    onToggle={() => toggleShow('etherscan')}
                  />
                  <KeyField 
                    label="Ethereum RPC Node" 
                    icon={RefreshCw} 
                    value={keys.ethereumRpcUrl} 
                    placeholder="https://ethereum-rpc.publicnode.com"
                    onChange={(v) => setKeys({...keys, ethereumRpcUrl: v})}
                    show={true}
                  />
                  <KeyField 
                    label="Gemini API Key (AI Insight)" 
                    icon={Lock} 
                    value={keys.geminiApiKey} 
                    placeholder="AIzaSy..."
                    onChange={(v) => setKeys({...keys, geminiApiKey: v})}
                    show={showKeys['gemini']}
                    onToggle={() => toggleShow('gemini')}
                  />
                  <KeyField 
                    label="ALX Smart Contract Address" 
                    icon={Database} 
                    value={keys.alxContractAddress} 
                    placeholder="0x..."
                    onChange={(v) => setKeys({...keys, alxContractAddress: v})}
                    show={true}
                  />
                </div>
              </section>

              <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Perhatian: Perubahan pada API Key akan berdampak langsung pada operasional kliring riil, sinkronisasi Mainnet, dan asisten AI. Pastikan kredensial valid sebelum disimpan.
                </p>
              </div>

              <Button 
                onClick={handleSaveKeys} 
                disabled={isSaving || keysLoading}
                className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : (
                  <span className="flex items-center gap-3">
                    <Save className="w-5 h-5" /> SIMPAN PERUBAHAN SISTEM
                  </span>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <footer className="mt-20 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 opacity-30 grayscale">
            <LogoIcon className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">AliBank V3 Encrypted Vault</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function KeyField({ label, icon: Icon, value, placeholder, onChange, show, onToggle }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <Input 
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 pl-12 pr-12 rounded-xl bg-muted/50 border-none font-bold text-xs focus:ring-2 focus:ring-primary/20 transition-all"
        />
        {onToggle && (
          <button 
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
