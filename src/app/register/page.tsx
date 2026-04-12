
'use client';

import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, Phone, User, ArrowLeft, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/logo';
import { ethers } from 'ethers';

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
      // Create random internal AliBank Wallet (Metamask equivalent)
      const internalWallet = ethers.Wallet.createRandom();
      
      // Generate Simulated BTC Address (bc1... SegWit format)
      const mockBtcSuffix = Array.from({length: 38}, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
      const mockBtcAddress = `bc1q${mockBtcSuffix}`;
      
      const result = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        accountNumber: '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
        totalBalance: 0,
        savings: 0,
        tier: 'Regular',
        kycStatus: 'unverified',
        walletAddress: internalWallet.address,
        btcAddress: mockBtcAddress,
        privateKey: internalWallet.privateKey,
        cryptoBalances: {
          BTC: 0,
          ETH: 0,
          USDT: 0,
          ALX: 0
        },
        createdAt: serverTimestamp()
      });

      toast({
        title: "Pendaftaran Berhasil",
        description: "Akun AliBank aktif. Selamat datang di masa depan perbankan.",
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
      
      <div className="relative z-10 flex flex-col items-center w-full max-sm px-2">
        <Link href="/login" className="self-start mb-6">
          <Button variant="ghost" size="sm" className="text-accent/60 hover:text-accent gap-2">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Button>
        </Link>

        <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center shadow-xl mb-4 p-3.5">
          <LogoIcon className="text-white" />
        </div>
        
        <h1 className="text-2xl font-black text-accent mb-1 tracking-tighter italic uppercase">Buka Rekening Elit</h1>
        <p className="text-muted-foreground mb-8 text-center text-xs font-medium uppercase tracking-widest">
          Aktifkan layanan perbankan & dompet Web3 mandiri.
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
                className="h-12 pl-12 rounded-xl bg-muted/30 border-none"
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
                className="h-12 pl-12 rounded-xl bg-muted/30 border-none"
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
                className="h-12 pl-12 rounded-xl bg-muted/30 border-none"
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
                className="h-12 pl-12 rounded-xl bg-muted/30 border-none"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 gold-gradient text-white font-extrabold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-6"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "BUKA REKENING & DOMPET WEB3"}
          </Button>
        </form>
      </div>

      <div className="mt-10 flex items-center gap-2 text-primary/40 bg-primary/5 px-4 py-1.5 rounded-full border border-primary/5">
        <Wallet className="w-4 h-4" />
        <span className="text-[8px] font-black uppercase tracking-widest text-accent/40">Powered by AliBank Global Node</span>
      </div>
    </div>
  );
}
