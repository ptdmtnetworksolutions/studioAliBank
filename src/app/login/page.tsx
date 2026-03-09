'use client';

import { useState, useEffect } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle, Loader2, ShieldCheck, Globe, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentDomain, setCurrentDomain] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentDomain(window.location.hostname);
    }
  }, []);

  const handleLogin = async () => {
    if (!auth || !db) {
      toast({
        variant: "destructive",
        title: "Sistem Belum Siap",
        description: "Firebase belum terinisialisasi dengan benar.",
      });
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Inisialisasi saldo awal untuk nasabah baru
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Nasabah AliBank',
          email: user.email,
          photoURL: user.photoURL,
          accountNumber: '88' + Math.floor(1000000000 + Math.random() * 9000000000).toString(),
          totalBalance: 15000000, // Saldo awal Rp 15jt
          savings: 5000000,
          createdAt: serverTimestamp(),
          tier: 'Premium'
        });
        
        toast({
          title: "Selamat Datang!",
          description: "Akun AliBank Anda telah berhasil dibuat dengan saldo awal Rp 15.000.000.",
        });
      }

      router.push('/');
    } catch (error: any) {
      const authError = error as AuthError;
      console.error('Login failed:', authError.code, authError.message);
      
      let errorMessage = "Terjadi kesalahan saat masuk. Silakan coba lagi.";
      
      if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = "Metode login Google belum diaktifkan di Firebase Console.";
      } else if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = "Jendela login ditutup atau diblokir oleh browser. Harap izinkan pop-up untuk domain ini.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        errorMessage = `Domain "${currentDomain}" belum diizinkan. Harap tambahkan domain ini ke 'Authorized Domains' di Firebase Console Authentication Settings.`;
      }

      toast({
        variant: "destructive",
        title: "Gagal Masuk",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-accent/10 blur-[100px] rounded-full" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        <div className="w-24 h-24 rounded-[2.5rem] gold-gradient flex items-center justify-center shadow-2xl mb-8">
          <Sparkles className="text-white w-12 h-12" />
        </div>
        
        <h1 className="text-5xl font-black text-accent mb-4 tracking-tighter italic text-center uppercase">AliBank</h1>
        <p className="text-muted-foreground mb-8 text-center max-w-xs font-medium leading-relaxed">
          Era baru perbankan premium. Cerdas, elegan, dan aman di genggaman Anda.
        </p>

        {currentDomain.includes('cloudworkstations.dev') && (
          <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800 rounded-2xl">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-xs font-bold uppercase tracking-wider">Info Penting Domain</AlertTitle>
            <AlertDescription className="text-[10px] leading-relaxed">
              Pastikan domain <strong>{currentDomain}</strong> sudah ditambahkan di Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="w-full max-w-xs space-y-4">
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full h-16 gold-gradient text-white font-extrabold rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Masuk dengan Google
              </>
            )}
          </Button>
          
          <div className="flex items-center gap-2 justify-center text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-6">
            <div className="w-8 h-[1px] bg-muted" />
            <span>Premium Security</span>
            <div className="w-8 h-[1px] bg-muted" />
          </div>
        </div>
      </div>

      <div className="mt-16 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-primary/40 bg-primary/5 px-4 py-2 rounded-full border border-primary/5">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">End-to-End Encrypted System</span>
        </div>
        
        <div className="flex items-center gap-2 text-muted-foreground/40 text-[9px] font-bold uppercase tracking-tighter">
          <Globe className="w-3 h-3" />
          <span>DOMAIN AKTIF: {currentDomain}</span>
        </div>
      </div>
    </div>
  );
}
