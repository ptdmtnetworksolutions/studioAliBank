
"use client";

import { Navbar } from "@/components/layout/Navbar";
import { 
  Store, 
  CreditCard, 
  ArrowUpRight, 
  Code, 
  Copy, 
  Zap, 
  RefreshCw, 
  Search, 
  Plus, 
  Link as LinkIcon, 
  ExternalLink,
  Globe,
  Settings,
  Terminal,
  CheckCircle2,
  HelpCircle,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useMemo, useEffect } from "react";
import { MOCK_MERCHANT } from "@/app/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function MerchantDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isUpdatingWebhook, setIsUpdatingWebhook] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    amountIdr: "",
    cryptoCurrency: "USDT"
  });

  const [webhookUrl, setWebhookUrl] = useState("");

  const merchantDocRef = useMemo(() => {
    if (!db) return null;
    return doc(db, "merchants", MOCK_MERCHANT.merchantId);
  }, [db]);
  const { data: merchantData } = useDoc(merchantDocRef);

  useEffect(() => {
    if (merchantData?.webhookUrl) {
      setWebhookUrl(merchantData.webhookUrl);
    }
  }, [merchantData]);

  const invoicesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
  }, [db]);

  const { data: firestoreInvoices, loading: invoicesLoading } = useCollection(invoicesQuery);

  const rotateApiKey = () => {
    if (!db || !merchantDocRef) return;
    const newKey = `ab_live_${Math.random().toString(36).substring(7)}${Math.random().toString(36).substring(7)}`;
    
    setDoc(merchantDocRef, { apiKey: newKey }, { merge: true })
      .then(() => {
        toast({ title: "API Key Rotated", description: "Your new API key is active. Update your integration immediately." });
      })
      .catch((e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: merchantDocRef.path,
          operation: 'update',
          requestResourceData: { apiKey: newKey }
        }));
      });
  };

  const updateWebhook = () => {
    if (!db || !merchantDocRef) return;
    setIsUpdatingWebhook(true);
    
    setDoc(merchantDocRef, { webhookUrl }, { merge: true })
      .then(() => {
        setIsUpdatingWebhook(false);
        toast({ title: "Webhook Updated", description: "AliBank will now send notifications to this endpoint." });
      })
      .catch((e) => {
        setIsUpdatingWebhook(false);
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: merchantDocRef.path,
          operation: 'update',
          requestResourceData: { webhookUrl }
        }));
      });
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Text copied to clipboard." });
  };

  const handleSettlement = () => {
    if (!merchantData || (merchantData.pendingSettlement || 0) <= 0) {
      toast({ variant: "destructive", title: "No Funds", description: "You have no pending settlement to withdraw." });
      return;
    }

    setIsSettling(true);
    const amount = merchantData.pendingSettlement || 0;
    const payload = { pendingSettlement: 0 };

    setDoc(merchantDocRef!, payload, { merge: true })
      .then(() => {
        setIsSettling(false);
        toast({ title: "Settlement Success", description: `Rp ${amount.toLocaleString('id-ID')} has been transferred.` });
      })
      .catch(async () => {
        setIsSettling(false);
      });
  };

  const handleCreateInvoice = () => {
    if (!db || !newInvoice.customerName || !newInvoice.amountIdr) return;
    setIsCreatingInvoice(true);
    const invoiceId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoicesColRef = collection(db, "merchants", MOCK_MERCHANT.merchantId, "invoices");
    
    const invoicePayload = {
      invoiceId,
      merchantId: MOCK_MERCHANT.merchantId,
      customerName: newInvoice.customerName,
      amountIdr: parseFloat(newInvoice.amountIdr),
      cryptoCurrency: newInvoice.cryptoCurrency,
      status: "unpaid",
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    };

    addDoc(invoicesColRef, invoicePayload)
      .then(() => {
        setIsCreatingInvoice(false);
        toast({ title: "Invoice Created", description: `Invoice ${invoiceId} has been generated.` });
        setNewInvoice({ customerName: "", amountIdr: "", cryptoCurrency: "USDT" });
      })
      .catch(async () => {
        setIsCreatingInvoice(false);
      });
  };

  const totalRev = merchantData?.totalRevenue || 0;
  const pendingSett = merchantData?.pendingSettlement ?? 0;
  const currentApiKey = merchantData?.apiKey || MOCK_MERCHANT.apiKey;

  const sdkExample = `
// AliBank SDK Integration
import { AliBankGateway } from "@alibank/sdk";

const gateway = new AliBankGateway({
  apiKey: "${currentApiKey}"
});

const pay = async () => {
  const invoice = await gateway.createInvoice({
    amount: 150000,
    customer: "Jane Doe"
  });
  window.location.href = invoice.paymentUrl;
};
  `.trim();

  const HelpIcon = ({ title, content }: { title: string, content: string }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl liquid-glass border-primary/20 p-5 shadow-2xl">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-primary" />
            <h4 className="font-black italic uppercase text-xs text-accent tracking-tighter">Fitur: {title}</h4>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground font-medium italic">
            {content}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );

  if (!mounted) return null;

  return (
    <div className="min-h-screen pb-32 bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl p-3">
              <Store className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-accent italic uppercase tracking-tighter dark:text-primary">Merchant Console</h1>
              <p className="text-muted-foreground text-sm font-medium">{MOCK_MERCHANT.businessName} • API Gateway Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Dialog>
               <DialogTrigger asChild>
                 <Button className="rounded-xl gold-gradient text-white font-black italic uppercase h-12 px-6 shadow-lg">
                   <Plus className="w-4 h-4 mr-2" /> New Invoice
                 </Button>
               </DialogTrigger>
               <DialogContent className="rounded-[2.5rem] liquid-glass-dark text-white border-primary/20">
                 <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase text-white">Create Payment Invoice</DialogTitle></DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Customer Name</Label>
                      <Input placeholder="e.g. John Doe" value={newInvoice.customerName} onChange={(e) => setNewInvoice({...newInvoice, customerName: e.target.value})} className="bg-white/5 border-white/10 text-white rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Amount (IDR)</Label>
                      <Input type="number" placeholder="Amount" value={newInvoice.amountIdr} onChange={(e) => setNewInvoice({...newInvoice, amountIdr: e.target.value})} className="bg-white/5 border-white/10 text-white rounded-xl h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-white/60">Currency</Label>
                      <Select value={newInvoice.cryptoCurrency} onValueChange={(val) => setNewInvoice({...newInvoice, cryptoCurrency: val})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl h-12"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-accent text-white rounded-xl"><SelectItem value="USDT">USDT</SelectItem><SelectItem value="ETH">ETH</SelectItem></SelectContent>
                      </Select>
                    </div>
                 </div>
                 <DialogFooter><Button onClick={handleCreateInvoice} disabled={isCreatingInvoice} className="w-full h-14 gold-gradient text-white font-black uppercase rounded-2xl shadow-xl">{isCreatingInvoice ? <RefreshCw className="animate-spin" /> : "Generate Link"}</Button></DialogFooter>
               </DialogContent>
             </Dialog>
          </div>
        </header>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-primary/5 p-1 rounded-2xl border border-primary/10">
            <TabsTrigger value="overview" className="rounded-xl font-bold uppercase text-[10px] px-6">Overview</TabsTrigger>
            <TabsTrigger value="developer" className="rounded-xl font-bold uppercase text-[10px] px-6">Developer API</TabsTrigger>
            <TabsTrigger value="settings" className="rounded-xl font-bold uppercase text-[10px] px-6">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 relative">
                <div className="absolute top-6 right-6">
                  <HelpIcon 
                    title="Total Revenue" 
                    content="Akumulasi seluruh transaksi yang berhasil diproses melalui AliBank Gateway. Angka ini mencakup pembayaran via Crypto Bridge dan Saldo Internal nasabah." 
                  />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-black text-accent">Rp {totalRev.toLocaleString('id-ID')}</p>
                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold"><ArrowUpRight className="w-3 h-3" /> Growth Active</div>
              </Card>

              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 relative">
                <div className="absolute top-6 right-6">
                  <HelpIcon 
                    title="Pending Settlement" 
                    content="Dana hasil penjualan yang sudah diverifikasi namun belum ditarik ke rekening bank Anda. Proses 'Withdraw' akan mengirimkan dana ini dalam IDR secara instan." 
                  />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Pending Settlement</p>
                <p className="text-3xl font-black text-primary">Rp {pendingSett.toLocaleString('id-ID')}</p>
                <Button onClick={handleSettlement} disabled={isSettling || pendingSett <= 0} size="sm" className="mt-2 gold-gradient text-white rounded-xl h-10 w-full uppercase font-black text-[10px]">Withdraw Now</Button>
              </Card>

              <Card className="liquid-glass border-none rounded-[2rem] p-8 space-y-2 relative">
                <div className="absolute top-6 right-6">
                  <HelpIcon 
                    title="Gateway Status" 
                    content="Indikator konektivitas node blockchain AliBank ke Ethereum Mainnet. 'Online' berarti sistem siap memproses transaksi on-chain secara real-time." 
                  />
                </div>
                <p className="text-[10px] font-black uppercase text-muted-foreground">Gateway Status</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-600 text-white uppercase font-black text-[8px]">Mainnet Online</Badge>
                  <Globe className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <p className="text-[9px] text-muted-foreground italic mt-2">All crypto nodes synchronized.</p>
              </Card>
            </div>

            <Card className="liquid-glass border-none rounded-[2.5rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 p-8">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl font-black italic uppercase flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Live Transactions</CardTitle>
                  <HelpIcon 
                    title="Live Transactions" 
                    content="Daftar invoice aktif dan riwayat pembayaran pelanggan. Anda bisa memantau status 'Paid' untuk pengiriman barang segera." 
                  />
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." className="pl-10 h-10 rounded-xl bg-primary/5 border-none text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-primary/5 text-[10px] font-black uppercase text-muted-foreground"><th className="px-8 py-4">ID</th><th className="px-8 py-4">Customer</th><th className="px-8 py-4">Amount</th><th className="px-8 py-4">Link</th><th className="px-8 py-4">Status</th><th className="px-8 py-4"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-primary/5">
                      {firestoreInvoices?.map((inv: any) => (
                        <tr key={inv.invoiceId} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                          <td className="px-8 py-4 text-xs font-bold text-accent">{inv.invoiceId}</td>
                          <td className="px-8 py-4 text-xs font-medium text-muted-foreground">{inv.customerName}</td>
                          <td className="px-8 py-4 text-xs font-black">Rp {inv.amountIdr.toLocaleString('id-ID')}</td>
                          <td className="px-8 py-4">
                             <Button variant="ghost" size="sm" className="text-primary text-[10px] font-bold" onClick={() => copyText(`${window.location.origin}/checkout/${inv.invoiceId}`)}>
                               <LinkIcon className="w-3 h-3 mr-1" /> Copy
                             </Button>
                          </td>
                          <td className="px-8 py-4">
                            <Badge className={inv.status === 'paid' ? 'bg-green-600' : 'bg-orange-500'}>{inv.status}</Badge>
                          </td>
                          <td className="px-8 py-4 text-right">
                             <Link href={`/checkout/${inv.invoiceId}`}><Button variant="ghost" size="icon" className="rounded-lg"><ExternalLink className="w-4 h-4 text-primary" /></Button></Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developer" className="space-y-8 animate-in slide-in-from-right-10 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6 relative">
                  <div className="absolute top-8 right-8">
                    <HelpIcon 
                      title="API Keys" 
                      content="Kunci rahasia untuk otentikasi server-ke-server. Jangan bagikan kunci ini. Gunakan fitur 'Rotate' jika kunci Anda bocor." 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase flex items-center gap-2"><Code className="w-6 h-6 text-primary" /> API Keys</h3>
                    <Button onClick={rotateApiKey} variant="outline" className="h-9 rounded-xl border-primary/20 text-primary text-[10px] font-black uppercase">Rotate Key</Button>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Live Secret API Key</Label>
                      <div className="relative">
                        <Input readOnly value={currentApiKey} className="h-14 pr-12 rounded-xl bg-primary/5 border-none font-mono text-xs text-accent" />
                        <Button onClick={() => copyText(currentApiKey)} variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary"><Copy className="w-4 h-4" /></Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground italic">Use this key to authorize requests from your server.</p>
                    </div>
                  </div>
                </Card>

                <Card className="liquid-glass border-none rounded-[2.5rem] p-8 space-y-6 relative">
                  <div className="absolute top-8 right-8">
                    <HelpIcon 
                      title="Webhook Settings" 
                      content="URL di server Anda yang akan dipanggil AliBank secara otomatis saat pembayaran sukses. Berguna untuk mengaktifkan order di sistem Anda secara real-time." 
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-black italic uppercase">Webhook Settings</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Notification URL</Label>
                      <Input 
                        placeholder="https://yourdomain.com/api/alibank-webhook" 
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="h-14 rounded-xl bg-primary/5 border-none text-xs text-accent" 
                      />
                    </div>
                    <Button onClick={updateWebhook} disabled={isUpdatingWebhook} className="w-full h-14 gold-gradient text-white font-black uppercase rounded-2xl">
                      {isUpdatingWebhook ? <RefreshCw className="animate-spin" /> : "Save Webhook URL"}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="liquid-glass-dark border-none rounded-[2.5rem] p-8 text-white relative">
                  <div className="absolute top-8 right-8 text-white/40">
                    <HelpIcon 
                      title="SDK Integration" 
                      content="Gunakan SDK resmi AliBank untuk mengotomatiskan pembuatan invoice dan verifikasi pembayaran langsung dari aplikasi Anda." 
                    />
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <Terminal className="w-6 h-6 text-primary" />
                    <h3 className="text-xl font-black italic uppercase">Quick Integration</h3>
                  </div>
                  <pre className="bg-black/50 p-6 rounded-2xl overflow-x-auto text-[11px] font-mono text-primary leading-relaxed border border-white/5">
                    {sdkExample}
                  </pre>
                  <Button variant="outline" className="w-full mt-6 border-white/10 text-white hover:bg-white/5 uppercase font-black text-[10px] h-12">Read Full Documentation</Button>
                </Card>

                <div className="liquid-glass p-8 rounded-[2rem] bg-primary/5 border-primary/20">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-black uppercase">Mainnet Bridge Active</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed italic">Your account is fully verified for production crypto transactions. Transactions on mainnet will be settled in IDR instantly.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="animate-in fade-in duration-500">
            <Card className="liquid-glass border-none rounded-[2.5rem] p-12 text-center max-w-2xl mx-auto space-y-6">
              <Settings className="w-16 h-16 text-primary mx-auto opacity-20" />
              <h2 className="text-2xl font-black italic uppercase">Business Settings</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">Modify your business identity, tax information, and settlement bank accounts. Changes here will be reviewed by the AliBank Compliance team.</p>
              <Button variant="outline" className="rounded-xl px-12 h-12 border-primary/20 text-primary font-bold">Edit Profile</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
