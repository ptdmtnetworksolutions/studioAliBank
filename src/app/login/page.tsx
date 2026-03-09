
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider, AuthError } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!auth) {
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
      // Menambahkan custom parameters untuk memastikan alur login bersih
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      const authError = error as AuthError;
      console.error('Login failed:', authError.code, authError.message);
      
      let errorMessage = "Terjadi kesalahan saat masuk. Silakan coba lagi.";
      
      if (authError.code === 'auth/operation-not-allowed') {
        errorMessage = "Metode login Google belum diaktifkan di Firebase Console.";
      } else if (authError.code === 'auth/unauthorized-domain') {
        errorMessage = "Domain ini belum diizinkan untuk melakukan autentikasi.";
      } else if (authError.code === 'auth/popup-closed-by-user') {
        errorMessage = "Jendela login ditutup sebelum selesai.";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center shadow-2xl mb-8">
        <Sparkles className="text-white w-10 h-10" />
      </div>
      <h1 className="text-4xl font-bold text-accent mb-2">AliBank</h1>
      <p className="text-muted-foreground mb-12 text-center max-w-xs">
        Selamat datang di era baru perbankan premium dan cerdas.
      </p>
      
      <div className="w-full max-w-xs space-y-4">
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          className="w-full h-14 gold-gradient text-white font-bold rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
        >
          {loading ? 'Memproses...' : 'Masuk dengan Google'}
        </Button>
        
        <p className="text-[10px] text-center text-muted-foreground px-4 leading-relaxed">
          Pastikan Anda telah mengaktifkan **Google Auth** di Firebase Console agar fitur ini berfungsi.
        </p>
      </div>

      <div className="mt-20 flex items-center gap-2 text-primary/40">
        <AlertCircle className="w-4 h-4" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Sistem Keamanan AliBank</span>
      </div>
    </div>
  );
}
