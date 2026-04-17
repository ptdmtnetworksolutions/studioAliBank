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
 * Return NULL jika benar-benar tidak bisa diekstrak.
 */
function safeExtractPath(
  ref: CollectionReference<DocumentData> | Query<DocumentData>
): string | null {
  try {
    // Case 1: CollectionReference — punya .path langsung
    if (ref.type === 'collection') {
      return (ref as CollectionReference).path || null;
    }

    // Case 2: Query internal
    const internalQuery = (ref as unknown as InternalQuery)._query;
    if (!internalQuery) return null;

    // ✅ FIX UTAMA: Collection Group query punya collectionGroup, bukan path
    // Contoh: collectionGroup(db, 'transactions')
    const collectionGroupId = (internalQuery as any)?.collectionGroup;
    if (typeof collectionGroupId === 'string' && collectionGroupId.length > 0) {
      // Prefix dengan '__group__/' agar isValidPath tidak menolaknya
      // dan kita tahu ini collection group untuk keperluan logging
      return `__group__/${collectionGroupId}`;
    }

    // Case 3: Query biasa dengan path
    const canonicalPath = internalQuery?.path?.canonicalString?.();
    if (typeof canonicalPath === 'string' && canonicalPath.length > 0) {
      return canonicalPath;
    }

    // Case 4: Fallback ke property path langsung
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

/**
 * Validasi path adalah string Firestore yang sah.
 */
function isValidPath(path: string | null): path is string {
  if (!path || typeof path !== 'string') return false;
  if (path === '/' || path === '') return false;
  // Tolak semua string yang terlihat seperti fallback / nama bukan koleksi
  const RESERVED_FALLBACKS = new Set(['query', 'unknown', 'undefined', 'null', 'collection']);
  if (RESERVED_FALLBACKS.has(path.toLowerCase())) return false;
  // Path Firestore: huruf, angka, underscore, dash, slash
  // Ditambah support untuk prefix __group__ kita
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
    // Guard 1: Null / undefined
    if (!memoizedTargetRefOrQuery) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Guard 2: Ekstrak path — jika null, hentikan
    const rawPath = safeExtractPath(memoizedTargetRefOrQuery);

    if (!isValidPath(rawPath)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[useCollection] Path tidak valid: "${rawPath}". ` +
          `Subscription dibatalkan. RefType: ${memoizedTargetRefOrQuery.type}`,
          memoizedTargetRefOrQuery
        );
      }
      setData(null);
      setIsLoading(false);
      setError(null);
      return; // ← STOP total, tidak lanjut ke onSnapshot
    }

    const path = rawPath; // TypeScript sekarang tahu ini string

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

        if (process.env.NODE_ENV === 'development') {
          console.error(
            `[useCollection] ❌ Firestore DENIED path: "${path}"\n` +
            `Pastikan: 1) User sudah login, 2) Aturan keamanan mendukung kueri ini.`,
            err
          );
        }
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  // Memo guard
  if (
    process.env.NODE_ENV === 'development' &&
    memoizedTargetRefOrQuery &&
    !memoizedTargetRefOrQuery.__memo
  ) {
    console.error(
      '[useCollection] ⚠️ Ref/Query tidak di-memoize! ' +
      'Gunakan useMemoFirebase().'
    );
  }

  return { data, isLoading, error };
}