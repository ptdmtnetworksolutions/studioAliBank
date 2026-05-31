
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION SIGNATURE
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Inisialisasi Firestore dengan experimentalForceLongPolling untuk mencegah
  // masalah konektivitas di lingkungan proxy seperti Firebase Studio.
  const firestore = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
  });

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore,
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
