
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
  Zap
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
    paypalClientId: "",
    etherscanApiKey: "",
    ethereumRpcUrl: "",
    geminiApiKey: "",
    alxContractAddress: ""
  });

  useEffect(() => {
    if (storedKeys) setKeys(storedKeys);
  }, [storedKeys]);

  const handleSave = async () => {
    if (!db || isSaving) return;
    setIsSaving(true);
    
    const docRef = doc(db, "system", "api_keys");
    
    setDoc(docRef, {
      ...keys,
      updatedAt: serverTimestamp(),
      updatedBy: user?.email
    }, { merge: true })
      .then(() => {
        toast({ title: "Credential Vault Updated", description: "Node kliring AliBank telah disinkronkan." });
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
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Credential Vault</h2>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Pusat Kendali Gateway & Infrastruktur Node</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-none font-black italic text-[8px] h-6 px-3 uppercase">Security Layer V3.5 Active</Badge>
      </header>

      <Card className="border-none bg-card rounded-[3rem] p-10 space-y-10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Key className="w-64 h-64 text-primary" /></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <KeyField label="PayPal Client ID (Gateway Kliring)" icon={Globe} value={keys.paypalClientId} onChange={(v:any) => setKeys({...keys, paypalClientId: v})} show={showKeys['pp']} onToggle={() => toggleShow('pp')} />
          <KeyField label="Etherscan API Key" icon={Database} value={keys.etherscanApiKey} onChange={(v:any) => setKeys({...keys, etherscanApiKey: v})} show={showKeys['et']} onToggle={() => toggleShow('et')} />
          <KeyField label="Ethereum RPC Node (Mainnet)" icon={Cpu} value={keys.ethereumRpcUrl} onChange={(v:any) => setKeys({...keys, ethereumRpcUrl: v})} show={true} />
          <KeyField label="Gemini API Key (AI Assistant)" icon={Lock} value={keys.geminiApiKey} onChange={(v:any) => setKeys({...keys, geminiApiKey: v})} show={showKeys['gm']} onToggle={() => toggleShow('gm')} />
          <div className="md:col-span-2">
            <KeyField label="ALX Smart Contract Address (Polygon)" icon={Zap} value={keys.alxContractAddress} onChange={(v:any) => setKeys({...keys, alxContractAddress: v})} show={true} />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">Setiap pembaruan pada API Key di atas akan secara otomatis mengubah perilaku sistem kliring pada aplikasi nasabah secara real-time. Pastikan kredensial bersifat PRODUCTION.</p>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="w-full h-16 gold-gradient text-white rounded-2xl font-black uppercase italic tracking-widest shadow-xl border-none text-base">
          {isSaving ? <Loader2 className="animate-spin" /> : <span className="flex items-center gap-3"><Save className="w-5 h-5" /> SYNCHRONIZE GLOBAL NODES</span>}
        </Button>
      </Card>
    </div>
  );
}

function KeyField({ label, icon: Icon, value, onChange, show, onToggle }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"><Icon className="w-4 h-4" /></div>
        <Input 
          type={show ? "text" : "password"} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="h-14 pl-12 pr-12 bg-muted/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all" 
        />
        {onToggle && <button onClick={onToggle} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>}
      </div>
    </div>
  );
}
