
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  Auth,
} from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { syncFirebaseAuthLocalStorage } from '@/lib/firestore-proxy-client';

let cachedAuth: Auth | null = null;
let cachedFirestore: Firestore | null = null;

// IMPORTANT: DO NOT MODIFY THIS FUNCTION SIGNATURE
export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    syncFirebaseAuthLocalStorage();
  }
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!cachedFirestore) {
    try {
      cachedFirestore = initializeFirestore(firebaseApp, {
        experimentalForceLongPolling: true,
      });
    } catch {
      cachedFirestore = getFirestore(firebaseApp);
    }
  }

  if (!cachedAuth) {
    try {
      cachedAuth = initializeAuth(firebaseApp, {
        persistence: [
          browserLocalPersistence,
          browserSessionPersistence,
          inMemoryPersistence,
        ],
      });
    } catch {
      cachedAuth = getAuth(firebaseApp);
    }
  }

  return {
    firebaseApp,
    auth: cachedAuth,
    firestore: cachedFirestore,
    storage: getStorage(firebaseApp)
  };
}

export { 
  FirebaseProvider, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useStorage, 
  useFirebaseApp, 
  useMemoFirebase, 
  useUser 
} from './provider';

export { FirebaseClientProvider } from './client-provider';

// Ekspor hook secara eksplisit untuk menghindari masalah resolusi Turbopack
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
export { useCollection, useDoc };

export { 
  setDocumentNonBlocking, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from './non-blocking-updates';

export { 
  initiateAnonymousSignIn, 
  initiateEmailSignUp, 
  initiateEmailSignIn 
} from './non-blocking-login';

export { FirestorePermissionError } from './errors';
export { errorEmitter } from './error-emitter';
