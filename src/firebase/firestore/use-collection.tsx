'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { proxyGetCollection, mergeCollectionDocsWithLocalCache, extractQueryDescriptor } from '@/lib/firestore-proxy-client';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

/**
 * Ekstrak path secara aman.
 * Menangani: CollectionReference, Query biasa, dan CollectionGroup query.
 */
function safeExtractPath(
  ref: CollectionReference<DocumentData> | Query<DocumentData>
): string | null {
  try {
    if (ref.type === 'collection') {
      return (ref as CollectionReference).path || null;
    }

    const internalQuery = (ref as unknown as InternalQuery)._query;
    if (!internalQuery) return null;

    const collectionGroupId = (internalQuery as any)?.collectionGroup;
    if (typeof collectionGroupId === 'string' && collectionGroupId.length > 0) {
      return `__group__/${collectionGroupId}`;
    }

    const canonicalPath = internalQuery?.path?.canonicalString?.();
    if (typeof canonicalPath === 'string' && canonicalPath.length > 0) {
      return canonicalPath;
    }

    if (Array.isArray((internalQuery as any)?.path?.segments)) {
      const segs = (internalQuery as any).path.segments;
      const offset = (internalQuery as any).path.offset || 0;
      const len = (internalQuery as any).path.len ?? segs.length;
      const joined = segs.slice(offset, offset + len).join('/');
      if (joined.length > 0) return joined;
    }

    const directPath = (ref as any)?.path;
    if (typeof directPath === 'string' && directPath.length > 0) {
      return directPath;
    }

    return null;
  } catch (e) {
    console.warn('[useCollection] safeExtractPath gagal:', e);
    return null;
  }
}

function isValidPath(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  if (path === '/' || path === '') return false;
  const RESERVED_FALLBACKS = new Set(['query', 'unknown', 'undefined', 'null', 'collection']);
  if (RESERVED_FALLBACKS.has(path.toLowerCase())) return false;
  return /^[\w\-]+(\/[\w\-]+)*$/.test(path);
}

export function useCollection<T = any>(
  memoizedTargetRefOrQuery: (
    | (CollectionReference<DocumentData> | Query<DocumentData>)
    & { __memo?: boolean }
  ) | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;

  const [data, setData] = useState<ResultItemType[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const snapshotActiveRef = useRef<boolean>(false);
  const hasDataRef = useRef<boolean>(false);

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      snapshotActiveRef.current = false;
      hasDataRef.current = false;
      return;
    }

    const rawPath = safeExtractPath(memoizedTargetRefOrQuery);

    if (!isValidPath(rawPath)) {
      setData(null);
      setIsLoading(false);
      setError(null);
      snapshotActiveRef.current = false;
      hasDataRef.current = false;
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    snapshotActiveRef.current = false;
    let proxyDocsCache: ResultItemType[] = [];
    const descriptor = extractQueryDescriptor(memoizedTargetRefOrQuery);
    const collectionPathForMerge = rawPath.startsWith('__group__/') ? null : rawPath;

    const applyDescriptorFilters = (list: ResultItemType[]) => {
      if (!descriptor?.filters || descriptor.filters.length === 0) return list;
      return list.filter((item: any) =>
        descriptor.filters.every((f) => {
          const actual = item?.[f.field];
          const expected = f.value;
          if (f.op === '==' || f.op === 'EQUAL') return actual === expected;
          if (f.op === '!=' || f.op === 'NOT_EQUAL') return actual !== expected;
          return true;
        })
      );
    };

    const fetchFromProxy = async () => {
      if (cancelled) return;
      const res = await proxyGetCollection<T>(memoizedTargetRefOrQuery);
      if (cancelled) return;
      if (res.ok) {
        proxyDocsCache = res.docs;
        if (res.docs.length > 0) hasDataRef.current = true;
        setData(res.docs);
        setError(null);
        setIsLoading(false);
      }
    };

    // Immediate proxy fetch for instant loading in Tor / production
    fetchFromProxy();

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (cancelled) return;
        snapshotActiveRef.current = true;
        const remoteResults: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        const remoteIds = new Set(remoteResults.map(r => r.id));
        const localOnlyFromProxy = proxyDocsCache.filter(
          (pd) => pd.id && !remoteIds.has(pd.id) && pd.id.startsWith('loc_')
        );
        const mergedRaw = mergeCollectionDocsWithLocalCache<T>(
          collectionPathForMerge,
          remoteResults,
          localOnlyFromProxy
        );
        const merged = applyDescriptorFilters(mergedRaw);
        if (merged.length > 0) {
          hasDataRef.current = true;
          setData(merged);
        } else if (!snapshot.metadata?.fromCache || !hasDataRef.current || remoteResults.length > 0) {
          // Izinkan pengosongan data bila memang hasil filter/penghapusan valid dari server/cache
          setData([]);
        }
        setError(null);
        setIsLoading(false);
      },
      (_err: FirestoreError) => {
        if (cancelled) return;
        // Rely on server-side proxy when client WebChannel is blocked by Tor
        fetchFromProxy();
        setIsLoading(false);
      }
    );

    const pollInterval = setInterval(() => {
      if (!snapshotActiveRef.current || (typeof document !== 'undefined' && document.visibilityState === 'visible')) {
        // Poll faster when snapshot is down; gentle sync when notifications/active view is open
        if (!snapshotActiveRef.current || rawPath.includes('notifications')) {
          fetchFromProxy();
        }
      }
    }, rawPath.includes('notifications') ? 10000 : 30000);

    const handleSyncEvent = () => {
      fetchFromProxy();
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchFromProxy();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleSyncEvent);
      window.addEventListener('alibank-firestore-sync', handleSyncEvent);
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(pollInterval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleSyncEvent);
        window.removeEventListener('alibank-firestore-sync', handleSyncEvent);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}