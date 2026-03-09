'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { errorEmitter } from './error-emitter';
import { useToast } from '@/hooks/use-toast';

interface FirebaseContextProps {
  app: FirebaseApp | null;
  db: Firestore | null;
  auth: Auth | null;
}

const FirebaseContext = createContext<FirebaseContextProps>({
  app: null,
  db: null,
  auth: null,
});

export const FirebaseProvider: React.FC<{
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  children: React.ReactNode;
}> = ({ app, db, auth, children }) => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (app && db && auth) {
      setIsInitialized(true);
    }

    const handlePermissionError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Izin Ditolak",
        description: "Anda tidak memiliki izin untuk melakukan aksi ini. Periksa Security Rules Anda.",
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.error("Firestore Permission Error Context:", error.context);
        // Jangan melempar error di sini untuk mencegah loop UI crash
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [app, db, auth, toast]);

  return (
    <FirebaseContext.Provider value={{ app, db, auth }}>
      {isInitialized ? children : (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl gold-gradient animate-pulse shadow-lg" />
            <p className="text-accent font-medium animate-pulse">Menghubungkan ke AliBank...</p>
          </div>
        </div>
      )}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().db;
export const useAuth = () => useFirebase().auth;
