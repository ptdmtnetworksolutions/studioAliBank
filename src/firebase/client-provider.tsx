'use client';

import React, { useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { FirebaseProvider } from './provider';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebase = useMemo(() => {
    // Inisialisasi Firebase App (pastikan hanya sekali)
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    /**
     * Stabilisasi Koneksi Firestore:
     * Menggunakan experimentalForceLongPolling untuk mengatasi masalah konektivitas 
     * di lingkungan jaringan yang membatasi gRPC atau HTTP2 stream.
     */
    let db;
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
      });
    } catch (e) {
      // Jika sudah diinisialisasi (misal saat hot reload), ambil instance yang ada
      db = getFirestore(app);
    }
    
    const auth = getAuth(app);
    return { app, db, auth };
  }, []);

  return (
    <FirebaseProvider app={firebase.app} db={firebase.db} auth={firebase.auth}>
      {children}
    </FirebaseProvider>
  );
};
