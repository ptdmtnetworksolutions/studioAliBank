'use client';

import React, { createContext, useContext, useEffect } from 'react';
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

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      toast({
        variant: "destructive",
        title: "Izin Ditolak",
        description: "Anda tidak memiliki izin untuk melakukan aksi ini. Periksa Security Rules Anda.",
      });
      // Di pengembangan, biarkan error muncul di overlay
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
  }, [toast]);

  return (
    <FirebaseContext.Provider value={{ app, db, auth }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().db;
export const useAuth = () => useFirebase().auth;
