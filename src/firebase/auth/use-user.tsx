'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../provider';

export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // Sinkronkan cookie alibank_session untuk Edge Middleware
      if (typeof document !== 'undefined') {
        if (currentUser) {
          document.cookie = "alibank_session=1; path=/; max-age=2592000; SameSite=Lax";
        } else {
          document.cookie = "alibank_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        }
      }
    });
    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
