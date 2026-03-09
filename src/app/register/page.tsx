
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2, ShieldCheck, Mail, Lock, Phone, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function RegisterPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = result.user;

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accountNumber: '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        totalBalance: 15000000, // Starting balance
        savings: 5000000,
        tier: 'Premium',
        createdAt: serverTimestamp()
      });

      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun AliBank Anda telah aktif. Selamat datang!",
      });
      router.push('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Gagal Mendaftar",
        description: error.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <Link href="/login" className="self-start mb-6">
          <Button variant="ghost" size="sm" className="text-accent/60 hover:text-accent gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </Link>

        <div className="w-14 h-14 rounded-2xl gold-gradient flex items-center justify-center shadow-xl mb-4">
          <Sparkles className="text-white w-7 h-7" />
        </div>
        
        <h1 className="text-2xl font-black text-accent mb-1 tracking-tighter italic uppercase">Buka Rekening</h1>
        <p className="text-muted-foreground mb-8 text-center text-xs font-medium">
          Lengkapi data nasabah Anda untuk memulai.
        </p>

        <form onSubmit={handleRegister} className="w-full space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-accent/60 ml-1">Nama Lengkap Sesuai ID</Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                placeholder="Contoh: Alex Thompson"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="h-12 pl-12 rounded-xl liquid-glass border-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-accent/60 ml-1">Nomor Telepon Aktif</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                type="tel"
                placeholder="0812xxxx"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="h-12 pl-12 rounded-xl liquid-glass border-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-accent/60 ml-1">Email Nasabah</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="h-12 pl-12 rounded-xl liquid-glass border-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-accent/60 ml-1">Buat Kata Sandi</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              <Input 
                type="password"
                placeholder="Min. 6 karakter"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                minLength={6}
                className="h-12 pl-12 rounded-xl liquid-glass border-none"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 gold-gradient text-white font-extrabold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "AKTIFKAN REKENING"}
          </Button>
        </form>
      </div>

      <div className="mt-10 flex items-center gap-2 text-primary/40 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/5">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-[8px] font-black uppercase tracking-widest text-accent/40">Data dilindungi LPS & OJK</span>
      </div>
    </div>
  );
}
