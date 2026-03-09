
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!auth) return;
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error) {
      console.error('Login failed', error);
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
      
      <Button 
        onClick={handleLogin} 
        disabled={loading}
        className="w-full max-w-xs h-14 gold-gradient text-white font-bold rounded-2xl shadow-xl"
      >
        {loading ? 'Masuk...' : 'Masuk dengan Google'}
      </Button>
    </div>
  );
}
