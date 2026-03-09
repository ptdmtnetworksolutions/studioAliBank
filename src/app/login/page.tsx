
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ShieldCheck, Mail, Lock, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Selamat Datang Kembali",
        description: "Berhasil masuk ke akun AliBank Anda.",
      });
      router.push('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: "Email atau kata sandi salah. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-6">
          <Sparkles className="text-white w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-black text-accent mb-2 tracking-tighter italic uppercase">AliBank</h1>
        <p className="text-muted-foreground mb-8 text-center text-sm font-medium leading-relaxed">
          Masuk ke portal perbankan premium Anda.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-accent/60 ml-1">Alamat Email</关键
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                id="email"
                type="email" 
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 pl-12 rounded-2xl liquid-glass border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-accent/60 ml-1">Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-14 pl-12 rounded-2xl liquid-glass border-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 gold-gradient text-white font-extrabold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "MASUK SEKARANG"}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-4 w-full">
          <p className="text-xs text-muted-foreground">
            Belum punya akun nasabah?
          </p>
          <Link href="/register">
            <Button variant="outline" className="w-full h-12 rounded-2xl border-primary/20 text-primary font-bold flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Buka Rekening Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-12 flex items-center gap-2 text-primary/40 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/5">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[9px] font-black uppercase tracking-widest text-accent/40">Secured by AliBank Systems</span>
      </div>
    </div>
  );
}
