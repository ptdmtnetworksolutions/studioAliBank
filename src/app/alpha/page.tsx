
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Zap, 
  Rocket, 
  MessageSquare, 
  Share2, 
  Bookmark,
  ChevronRight,
  ShieldCheck,
  Trophy,
  History,
  Target,
  Flame,
  Activity,
  Loader2,
  CheckCircle2,
  Bell,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/ui/logo";
import { useToast } from "@/hooks/use-toast";

const ALPHA_SIGNALS = [
  { id: 1, pair: "BTC/USDT", type: "Long", entry: "66,240", target: "68,500", sl: "65,100", confidence: "92%", time: "2m ago" },
  { id: 2, pair: "ALX/USDT", type: "Long", entry: "12.24", target: "15.00", sl: "11.50", confidence: "88%", time: "15m ago" },
  { id: 3, pair: "SOL/USDT", type: "Short", entry: "142.50", target: "135.00", sl: "146.00", confidence: "75%", time: "1h ago" },
];

const TOP_TRADERS = [
  { id: 1, name: "Alpha Whale", roi: "+425.12%", winRate: "94%", followers: "1.2k", avatar: "https://picsum.photos/seed/whale/100/100" },
  { id: 2, name: "Crypto Sensei", roi: "+182.40%", winRate: "88%", followers: "850", avatar: "https://picsum.photos/seed/sensei/100/100" },
  { id: 3, name: "Bull Runner", roi: "+95.18%", winRate: "72%", followers: "2.4k", avatar: "https://picsum.photos/seed/bull/100/100" },
];

export default function AlphaHubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 font-body selection:bg-primary/20">
      {/* Header */}
      <header className="px-4 h-16 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border/50">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg font-black italic uppercase tracking-tighter leading-none">Alpha Hub</h1>
            <span className="text-[8px] font-bold text-primary uppercase tracking-[0.3em] mt-1">Intelligence Terminal V3</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-muted rounded-full relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>
          <div className="w-8 h-8 rounded-lg gold-gradient p-1.5 shadow-lg">
            <LogoIcon className="text-white" />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 pt-6 space-y-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Decrypting Alpha Data...</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10">
            {/* Featured Section */}
            <section className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all" />
                <Badge className="bg-primary text-primary-foreground font-black text-[8px] uppercase px-3 mb-4 rounded-full italic tracking-widest">Featured Insights</Badge>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground mb-3 leading-tight">MENGAPA ALX AKAN MENCAPAI $50 DALAM 12 BULAN?</h2>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed uppercase italic opacity-80">Analisis fundamental mengenai kelangkaan suplai dan utilitas AliBank V3...</p>
                <Button className="mt-6 h-10 bg-foreground text-background font-black rounded-xl text-[10px] uppercase italic px-6 hover:bg-foreground/90 transition-all">Baca Selengkapnya</Button>
              </div>
            </section>

            <Tabs defaultValue="signals" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 border border-border/50">
                  <TabsTrigger value="signals" className="rounded-xl px-6 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Signals</TabsTrigger>
                  <TabsTrigger value="traders" className="rounded-xl px-6 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Copy Trade</TabsTrigger>
                  <TabsTrigger value="feed" className="rounded-xl px-6 font-black uppercase text-[10px] italic data-[state=active]:gold-gradient data-[state=active]:text-white">Feed</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="signals" className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-foreground italic uppercase">Live Alpha Calls</h3>
                  <div className="flex items-center gap-2 text-[8px] font-black text-green-500 bg-green-500/10 px-2 py-1 rounded-full uppercase italic">
                    <Activity className="w-3 h-3" /> Real-time
                  </div>
                </div>

                <div className="space-y-4">
                  {ALPHA_SIGNALS.map((sig) => (
                    <Card key={sig.id} className="p-6 rounded-[2rem] border-none bg-card shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", sig.type === 'Long' ? 'bg-green-500/10 text-green-600' : 'bg-rose-500/10 text-rose-600')}>
                            {sig.type === 'Long' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="text-base font-black italic uppercase leading-none">{sig.pair}</h4>
                            <span className="text-[8px] font-bold text-muted-foreground uppercase">{sig.time}</span>
                          </div>
                        </div>
                        <Badge className={cn("font-black text-[8px] uppercase px-2", sig.type === 'Long' ? 'bg-green-500' : 'bg-rose-500')}>{sig.type}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 py-4 border-y border-border/50">
                        <div className="text-center"><p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Entry</p><p className="text-xs font-black italic">{sig.entry}</p></div>
                        <div className="text-center border-x border-border/50"><p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Target</p><p className="text-xs font-black text-green-500 italic">{sig.target}</p></div>
                        <div className="text-center"><p className="text-[8px] font-bold text-muted-foreground uppercase mb-1">Confidence</p><p className="text-xs font-black text-primary italic">{sig.confidence}</p></div>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[9px] font-black italic text-muted-foreground uppercase">
                        <span>Stop Loss: {sig.sl}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="traders" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-foreground italic uppercase">Master Leaders</h3>
                  <Badge variant="outline" className="border-primary/20 text-primary text-[8px] font-black uppercase italic">Verified</Badge>
                </div>

                <div className="space-y-3">
                  {TOP_TRADERS.map((trader) => (
                    <div key={trader.id} className="bg-card p-5 rounded-2xl border border-border flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border shadow-md">
                          <img src={trader.avatar} alt="trader" className="object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black italic uppercase leading-none">{trader.name}</h4>
                          <p className="text-[9px] font-bold text-muted-foreground mt-1.5 uppercase">{trader.followers} Followers • Win {trader.winRate}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-500 italic">{trader.roi}</p>
                        <button className="text-[8px] font-black text-primary uppercase hover:underline mt-1 italic tracking-widest">Copy Portfolio</button>
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="liquid-glass-dark p-8 rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden text-center space-y-4">
                  <div className="absolute inset-0 gold-gradient opacity-5" />
                  <Trophy className="w-12 h-12 text-primary mx-auto relative z-10" />
                  <h4 className="text-lg font-black uppercase italic text-white relative z-10">Jadilah Master Alpha</h4>
                  <p className="text-[10px] font-bold text-white/60 uppercase leading-relaxed italic relative z-10">
                    Bagikan strategi Anda, bangun basis pengikut, dan dapatkan komisi 10% dari profit pengikut Anda.
                  </p>
                  <Button className="w-full h-12 gold-gradient text-white rounded-xl font-black italic uppercase text-[10px] shadow-xl relative z-10">DAFTAR SEBAGAI MASTER</Button>
                </Card>
              </TabsContent>

              <TabsContent value="feed" className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-6">
                  <PostCard 
                    author="AliBank Intelligence" 
                    time="10m ago" 
                    content="BREAKING: AliBank V3 Protocol secara resmi mengintegrasikan node likuiditas Polygon Mainnet. Efisiensi transaksi meningkat 40%." 
                    tags={["Update", "Mainnet"]}
                  />
                  <PostCard 
                    author="Whale Watcher" 
                    time="1h ago" 
                    content="Aktivitas besar terdeteksi pada koin ALX. Akumulasi besar-besaran terjadi di rentang harga $12.10 - $12.30. Sinyal Bullish terdeteksi." 
                    tags={["Whale", "ALX"]}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="p-6 rounded-2xl bg-accent/5 border border-primary/10 flex gap-4">
              <ShieldCheck className="w-6 h-6 text-primary shrink-0" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                Seluruh data Alpha adalah hasil analisis node kecerdasan AliBank. Namun, perdagangan kripto memiliki risiko tinggi. Pastikan Anda melakukan riset mandiri sebelum mengeksekusi sinyal.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PostCard({ author, time, content, tags }: any) {
  return (
    <Card className="p-6 rounded-[2rem] border-border bg-card/50 space-y-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gold-gradient p-1.5 flex items-center justify-center">
            <LogoIcon className="text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black italic uppercase">{author}</h4>
            <p className="text-[8px] font-bold text-muted-foreground uppercase">{time}</p>
          </div>
        </div>
        <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black h-4 px-1.5 uppercase tracking-widest">Alpha Feed</Badge>
      </div>
      <p className="text-[11px] font-medium text-foreground leading-relaxed italic">{content}</p>
      <div className="flex gap-2">
        {tags.map((t: string) => (
          <span key={t} className="text-[8px] font-bold text-primary/60 uppercase">#{t}</span>
        ))}
      </div>
      <div className="pt-4 border-t border-border/50 flex justify-between">
        <div className="flex gap-4">
          <button className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"><MessageSquare className="w-3.5 h-3.5" /> 12</button>
          <button className="flex items-center gap-1.5 text-[9px] font-black uppercase text-muted-foreground hover:text-primary transition-colors"><Share2 className="w-3.5 h-3.5" /> Share</button>
        </div>
        <button className="text-muted-foreground hover:text-primary"><Bookmark className="w-4 h-4" /></button>
      </div>
    </Card>
  );
}
