'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  proxyGetDoc,
  setCachedClientDoc,
  getCachedClientDoc,
} from '@/lib/firestore-proxy-client';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time,
 * with automatic server-side proxy fallback for Tor Browser / restricted environments.
 */
export function useDoc<T = any>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const hasDataRef = useRef<boolean>(false);
  const snapshotActiveRef = useRef<boolean>(false);

  useEffect(() => {
    if (!memoizedDocRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      hasDataRef.current = false;
      snapshotActiveRef.current = false;
      return;
    }

    let cancelled = false;
    const docPath = memoizedDocRef.path;
    setIsLoading(true);
    setError(null);
    snapshotActiveRef.current = false;

    const applySafeData = (incoming: WithId<T> | null) => {
      if (!incoming) {
        if (!hasDataRef.current) setData(null);
        return;
      }
      hasDataRef.current = true;
      setData((prev) => {
        if (!prev) return incoming;
        const prevCrypto = (prev as any).cryptoBalances;
        const incCrypto = (incoming as any).cryptoBalances;
        if (prevCrypto && incCrypto && typeof prevCrypto === 'object' && typeof incCrypto === 'object') {
          const mergedCrypto = { ...prevCrypto, ...incCrypto };
          for (const [k, v] of Object.entries(prevCrypto)) {
            const pVal = Number(v || 0);
            const iVal = Number(incCrypto[k] || 0);
            mergedCrypto[k] = Math.max(pVal, iVal);
          }
          return { ...prev, ...incoming, cryptoBalances: mergedCrypto };
        }
        return { ...prev, ...incoming };
      });
    };

    const fetchFromProxy = async () => {
      if (cancelled) return;
      const res = await proxyGetDoc<T>(docPath);
      if (cancelled) return;
      if (res.ok) {
        if (res.exists && res.data) {
          applySafeData(res.data);
        } else if (!hasDataRef.current) {
          setData(null);
        }
        setError(null);
        setIsLoading(false);
      }
    };

    // Immediate proxy fetch for instant loading in Tor / production
    fetchFromProxy();

    const unsubscribe = onSnapshot(
      memoizedDocRef,
      (snapshot: DocumentSnapshot<DocumentData>) => {
        if (cancelled) return;
        snapshotActiveRef.current = true;
        if (snapshot.exists()) {
          const snapData = { ...(snapshot.data() as T), id: snapshot.id };
          setCachedClientDoc(docPath, snapData, false);
          const merged = getCachedClientDoc(docPath) || snapData;
          applySafeData(merged);
        } else {
          const cached = getCachedClientDoc(docPath);
          if (cached) {
            applySafeData(cached);
          } else if (!hasDataRef.current) {
            setData(null);
          }
        }
        setError(null);
        setIsLoading(false);
      },
      (_err: FirestoreError) => {
        if (cancelled) return;
        // Do not wipe data or crash UI when client WebChannel is blocked by Tor;
        // rely on the server-side proxy instead.
        fetchFromProxy();
        setIsLoading(false);
      }
    );

    const pollInterval = setInterval(() => {
      if (!snapshotActiveRef.current) {
        fetchFromProxy();
      }
    }, 60000);

    const handleSyncEvent = () => {
      const cached = getCachedClientDoc(docPath);
      if (cached) {
        applySafeData(cached);
      }
      fetchFromProxy();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSyncEvent);
      window.addEventListener('alibank-firestore-sync', handleSyncEvent);
    }

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleSyncEvent);
        window.removeEventListener('alibank-firestore-sync', handleSyncEvent);
      }
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}