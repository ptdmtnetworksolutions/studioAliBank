'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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

  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const rawPath = safeExtractPath(memoizedTargetRefOrQuery);

    if (!isValidPath(rawPath)) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const path = rawPath;
    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (err: FirestoreError) => {
        const contextualError = new FirestorePermissionError({
          operation: 'list',
          path,
        });
        setError(contextualError);
        setData(null);
        setIsLoading(false);
        errorEmitter.emit('permission-error', contextualError);
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  return { data, isLoading, error };
}