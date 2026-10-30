'use client';
    
import { useState, useEffect, useRef } from 'react';
import {
  DocumentReference,
  onSnapshot,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { proxyGetDoc } from '@/lib/firestore-proxy-client';

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

    const fetchFromProxy = async () => {
      if (cancelled) return;
      const res = await proxyGetDoc<T>(docPath);
      if (cancelled) return;
      if (res.ok) {
        if (res.exists && res.data) {
          hasDataRef.current = true;
          setData(res.data);
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
          hasDataRef.current = true;
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          hasDataRef.current = false;
          setData(null);
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
    }, 6000);

    const handleSyncEvent = () => {
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