'use client';

import { firebaseConfig } from '@/firebase/config';

const AUTH_STORAGE_KEY = `firebase:authUser:${firebaseConfig.apiKey}:[DEFAULT]`;
const ALIBANK_USER_KEY = 'alibank_user';

export interface StoredAuthSession {
  uid: string;
  email: string;
  displayName?: string;
  idToken: string;
  refreshToken?: string;
  loggedInAt?: number;
}

function getJwtExpMs(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = JSON.parse(atob(base64));
      if (json.exp) return json.exp * 1000;
    }
  } catch {}
  return Date.now() + 3600 * 1000;
}

export function buildFirebaseAuthUserJson(session: StoredAuthSession) {
  const expMs = session.idToken ? getJwtExpMs(session.idToken) : Date.now() + 3600 * 1000;
  const nowStr = String(session.loggedInAt || Date.now());
  return {
    uid: session.uid,
    email: session.email,
    emailVerified: true,
    displayName: session.displayName || session.email.split('@')[0] || 'Nasabah AliBank',
    isAnonymous: false,
    providerData: [
      {
        providerId: 'password',
        uid: session.email,
        displayName: session.displayName || session.email.split('@')[0] || 'Nasabah AliBank',
        email: session.email,
        phoneNumber: null,
        photoURL: null,
      },
    ],
    stsTokenManager: {
      refreshToken: session.refreshToken || 'alibank_session_refresh',
      accessToken: session.idToken || '',
      expirationTime: expMs,
    },
    createdAt: nowStr,
    lastLoginAt: nowStr,
    apiKey: firebaseConfig.apiKey,
    appName: '[DEFAULT]',
  };
}

export function syncFirebaseAuthLocalStorage(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const alibankStr = localStorage.getItem(ALIBANK_USER_KEY);
    const fbStr = localStorage.getItem(AUTH_STORAGE_KEY);

    if (alibankStr) {
      const parsed: StoredAuthSession = JSON.parse(alibankStr);
      if (parsed?.uid && parsed?.email) {
        // Check if firebase:authUser already has a newer token/refreshToken
        if (fbStr) {
          try {
            const fbParsed = JSON.parse(fbStr);
            if (fbParsed?.uid === parsed.uid) {
              const fbAccess = fbParsed?.stsTokenManager?.accessToken;
              const fbRefresh = fbParsed?.stsTokenManager?.refreshToken;
              if (fbAccess && (!parsed.idToken || getJwtExpMs(fbAccess) > getJwtExpMs(parsed.idToken))) {
                parsed.idToken = fbAccess;
              }
              if (fbRefresh && fbRefresh !== 'alibank_session_refresh' && !parsed.refreshToken) {
                parsed.refreshToken = fbRefresh;
              }
            }
          } catch {}
        }

        if (parsed.idToken) {
          const authJson = buildFirebaseAuthUserJson(parsed);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authJson));
          try {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authJson));
          } catch {}
        }
        localStorage.setItem(ALIBANK_USER_KEY, JSON.stringify(parsed));
        return parsed;
      }
    }

    if (fbStr) {
      const fbParsed = JSON.parse(fbStr);
      if (fbParsed?.uid && fbParsed?.email) {
        const synced: StoredAuthSession = {
          uid: fbParsed.uid,
          email: fbParsed.email,
          displayName: fbParsed.displayName || '',
          idToken: fbParsed?.stsTokenManager?.accessToken || '',
          refreshToken: fbParsed?.stsTokenManager?.refreshToken || '',
          loggedInAt: Date.now(),
        };
        localStorage.setItem(ALIBANK_USER_KEY, JSON.stringify(synced));
        return synced;
      }
    }
  } catch (e) {
    console.warn('[Auth Sync] Storage sync warning:', e);
  }
  return null;
}

export function saveAlibankAuthSession(session: StoredAuthSession) {
  if (typeof window === 'undefined') return;
  try {
    const normalized: StoredAuthSession = {
      uid: session.uid,
      email: session.email,
      displayName: session.displayName || '',
      idToken: session.idToken || '',
      refreshToken: session.refreshToken || '',
      loggedInAt: session.loggedInAt || Date.now(),
    };
    localStorage.setItem(ALIBANK_USER_KEY, JSON.stringify(normalized));
    if (normalized.idToken) {
      const authJson = buildFirebaseAuthUserJson(normalized);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authJson));
      try {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authJson));
      } catch {}
    }
    document.cookie = 'alibank_session=1; path=/; max-age=2592000; SameSite=Lax';
  } catch (e) {
    console.warn('[Auth Save] Failed saving auth session:', e);
  }
}

export function updateStoredTokens(newIdToken?: string | null, newRefreshToken?: string | null) {
  if (typeof window === 'undefined' || !newIdToken) return;
  try {
    const raw = localStorage.getItem(ALIBANK_USER_KEY);
    if (!raw) return;
    const parsed: StoredAuthSession = JSON.parse(raw);
    parsed.idToken = newIdToken;
    if (newRefreshToken) {
      parsed.refreshToken = newRefreshToken;
    }
    saveAlibankAuthSession(parsed);
  } catch {}
}

export function clearAlibankAuthSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ALIBANK_USER_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {}
  try {
    document.cookie = 'alibank_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'alibank_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'alibank_refresh=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  } catch {}
}

export function getStoredAuthTokens(): { idToken: string; refreshToken: string; uid: string; email: string } {
  if (typeof window === 'undefined') {
    return { idToken: '', refreshToken: '', uid: '', email: '' };
  }
  try {
    const synced = syncFirebaseAuthLocalStorage();
    if (synced) {
      return {
        idToken: synced.idToken || '',
        refreshToken: synced.refreshToken && synced.refreshToken !== 'alibank_session_refresh' ? synced.refreshToken : '',
        uid: synced.uid || '',
        email: synced.email || '',
      };
    }
  } catch {}
  return { idToken: '', refreshToken: '', uid: '', email: '' };
}

export function reviveFirestoreData(val: any): any {
  if (val === null || val === undefined || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(reviveFirestoreData);
  }
  if (val.__type === 'timestamp' && typeof val.seconds === 'number') {
    const secs = val.seconds;
    const nanos = val.nanoseconds || 0;
    return {
      seconds: secs,
      nanoseconds: nanos,
      toDate: () => new Date(secs * 1000),
      toMillis: () => secs * 1000,
      valueOf: () => secs * 1000,
    };
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    out[k] = reviveFirestoreData(v);
  }
  return out;
}

const clientDocCache = new Map<string, { data: any; updatedAt: number; fromLocalWrite?: boolean }>();
const LOCAL_OVERRIDES_KEY = 'alibank_doc_overrides_v2';

function loadPersistedOverrides(): Record<string, { data: any; updatedAt: number }> {
  if (typeof window === 'undefined') return {};
  try {
    localStorage.removeItem('alibank_doc_overrides_v1');
    const raw = localStorage.getItem(LOCAL_OVERRIDES_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}

function savePersistedOverride(cleanPath: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    const all = loadPersistedOverrides();
    all[cleanPath] = { data, updatedAt: Date.now() };
    localStorage.setItem(LOCAL_OVERRIDES_KEY, JSON.stringify(all));
  } catch {}
}

export function setCachedClientDoc(path: string, data: any, fromLocalWrite = false) {
  const clean = String(path || '').replace(/^\/+|\/+$/g, '');
  if (!clean || !data || typeof data !== 'object') return;
  if (fromLocalWrite) {
    savePersistedOverride(clean, data);
  }
  const existing = clientDocCache.get(clean);
  if (!fromLocalWrite && existing?.fromLocalWrite && Date.now() - existing.updatedAt < 10 * 60 * 1000) {
    // Keep local write changes on top of older snapshot data
    const merged = { ...data, ...existing.data };
    clientDocCache.set(clean, { data: merged, updatedAt: existing.updatedAt, fromLocalWrite: true });
    return;
  }
  clientDocCache.set(clean, { data, updatedAt: Date.now(), fromLocalWrite });
}

export function getCachedClientDoc(path: string): any | null {
  const clean = String(path || '').replace(/^\/+|\/+$/g, '');
  const inMem = clientDocCache.get(clean)?.data;
  if (inMem) return inMem;
  const persisted = loadPersistedOverrides()[clean];
  if (persisted?.data) {
    const revived = reviveFirestoreData(persisted.data);
    clientDocCache.set(clean, { data: revived, updatedAt: persisted.updatedAt || Date.now(), fromLocalWrite: true });
    return revived;
  }
  return null;
}

export async function proxyGetDoc<T = any>(path: string): Promise<{
  ok: boolean;
  exists: boolean;
  id: string;
  data: (T & { id: string }) | null;
  status: number;
}> {
  try {
    const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
    const { idToken, refreshToken } = getStoredAuthTokens();
    const res = await fetch('/api/firestore/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'getDoc',
        path: cleanPath,
        idToken,
        refreshToken,
      }),
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (json?.newIdToken) {
      updateStoredTokens(json.newIdToken, json.newRefreshToken);
    }

    if (res.status === 401 && !json?.newIdToken) {
      const publicPaths = ['/login', '/register', '/about', '/learn', '/ecosystem', '/network', '/use-alibank'];
      const isPublicPath = typeof window !== 'undefined' && (
        window.location.pathname === '/' ||
        publicPaths.some(p => window.location.pathname.startsWith(p))
      );
      if (typeof window !== 'undefined' && !isPublicPath) {
        clearAlibankAuthSession();
        window.location.replace('/login');
      }
      return { ok: false, exists: false, id: '', data: null, status: 401 };
    }

    if (!res.ok) {
      const cached = getCachedClientDoc(cleanPath);
      if (cached) {
        return {
          ok: true,
          exists: true,
          id: cached.id || cleanPath.split('/').pop() || '',
          data: cached,
          status: 200,
        };
      }
      return { ok: false, exists: false, id: '', data: null, status: res.status };
    }

    if (json.quotaFallback && !json.exists) {
      const cached = getCachedClientDoc(cleanPath);
      if (cached) {
        return {
          ok: true,
          exists: true,
          id: cached.id || cleanPath.split('/').pop() || '',
          data: cached,
          status: 200,
        };
      }
      return { ok: false, exists: false, id: '', data: null, status: 429 };
    }

    const revived = json.exists && json.data ? reviveFirestoreData(json.data) : null;
    const finalData = revived ? { ...revived, id: json.id || revived.id } : null;
    if (finalData) {
      setCachedClientDoc(cleanPath, finalData, Boolean(json.fallbackLocal));
    }
    return {
      ok: true,
      exists: Boolean(json.exists),
      id: json.id || cleanPath.split('/').pop() || '',
      data: finalData,
      status: 200,
    };
  } catch (e) {
    return { ok: false, exists: false, id: '', data: null, status: 500 };
  }
}

export interface ExtractedQueryDescriptor {
  path: string | null;
  collectionGroup: string | null;
  filters: Array<{ field: string; op: string; value?: any; rawFirestoreValue?: any }>;
  orders: Array<{ field: string; dir: string }>;
  limitCount: number | null;
}

function extractFieldSegments(fieldObj: any): string {
  if (!fieldObj) return '';
  if (typeof fieldObj.canonicalString === 'function') {
    return fieldObj.canonicalString();
  }
  if (Array.isArray(fieldObj.segments)) {
    const offset = fieldObj.offset || 0;
    const len = fieldObj.len ?? fieldObj.segments.length;
    return fieldObj.segments.slice(offset, offset + len).join('.');
  }
  return '';
}

function parseRawValueToJs(rawVal: any): any {
  if (!rawVal || typeof rawVal !== 'object') return rawVal;
  if ('booleanValue' in rawVal) return Boolean(rawVal.booleanValue);
  if ('stringValue' in rawVal) return String(rawVal.stringValue);
  if ('integerValue' in rawVal) return Number(rawVal.integerValue);
  if ('doubleValue' in rawVal) return Number(rawVal.doubleValue);
  if ('nullValue' in rawVal) return null;
  return undefined;
}

export function extractQueryDescriptor(refOrQuery: any): ExtractedQueryDescriptor | null {
  try {
    if (!refOrQuery) return null;

    if (refOrQuery.type === 'collection' && typeof refOrQuery.path === 'string') {
      return {
        path: refOrQuery.path,
        collectionGroup: null,
        filters: [],
        orders: [],
        limitCount: null,
      };
    }

    const iq = refOrQuery._query;
    if (!iq) {
      if (typeof refOrQuery.path === 'string') {
        return {
          path: refOrQuery.path,
          collectionGroup: null,
          filters: [],
          orders: [],
          limitCount: null,
        };
      }
      return null;
    }

    const collectionGroup = typeof iq.collectionGroup === 'string' && iq.collectionGroup.length > 0
      ? iq.collectionGroup
      : null;

    let path: string | null = null;
    if (iq.path) {
      if (typeof iq.path.canonicalString === 'function') {
        path = iq.path.canonicalString() || null;
      } else if (Array.isArray(iq.path.segments)) {
        const offset = iq.path.offset || 0;
        const len = iq.path.len ?? iq.path.segments.length;
        const joined = iq.path.segments.slice(offset, offset + len).join('/');
        path = joined.length > 0 ? joined : null;
      }
    }

    const filters: Array<{ field: string; op: string; value?: any; rawFirestoreValue?: any }> = [];
    if (Array.isArray(iq.filters)) {
      for (const f of iq.filters) {
        const field = extractFieldSegments(f.field);
        if (field && f.op) {
          filters.push({
            field,
            op: f.op,
            value: parseRawValueToJs(f.value),
            rawFirestoreValue: f.value,
          });
        }
      }
    }

    const orders: Array<{ field: string; dir: string }> = [];
    if (Array.isArray(iq.explicitOrderBy)) {
      for (const o of iq.explicitOrderBy) {
        const field = extractFieldSegments(o.field);
        if (field) {
          orders.push({
            field,
            dir: o.dir || 'asc',
          });
        }
      }
    }

    const limitCount = typeof iq.limit === 'number' && iq.limit > 0 ? iq.limit : null;

    if (!path && !collectionGroup) return null;

    return {
      path,
      collectionGroup,
      filters,
      orders,
      limitCount,
    };
  } catch (e) {
    console.warn('[Firestore Proxy] Failed extracting query descriptor:', e);
    return null;
  }
}

export async function proxyGetCollection<T = any>(refOrQuery: any): Promise<{
  ok: boolean;
  docs: Array<T & { id: string }>;
  status: number;
}> {
  try {
    const descriptor = extractQueryDescriptor(refOrQuery);
    if (!descriptor) {
      return { ok: false, docs: [], status: 400 };
    }

    const { idToken, refreshToken } = getStoredAuthTokens();
    const res = await fetch('/api/firestore/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'getCollection',
        ...descriptor,
        idToken,
        refreshToken,
      }),
      cache: 'no-store',
    });

    const json = await res.json().catch(() => ({}));
    if (json?.newIdToken) {
      updateStoredTokens(json.newIdToken, json.newRefreshToken);
    }

    if (!res.ok || !Array.isArray(json.docs)) {
      return { ok: false, docs: [], status: res.status };
    }

    if (json.quotaFallback && json.docs.length === 0) {
      return { ok: false, docs: [], status: 429 };
    }

    const overrides = loadPersistedOverrides();
    const cleanColPath = descriptor.path ? String(descriptor.path).replace(/^\/+|\/+$/g, '') : null;

    let docs = json.docs.map((d: any) => {
      const revived = reviveFirestoreData(d);
      if (cleanColPath && revived?.id) {
        const docKey = `${cleanColPath}/${revived.id}`;
        const localOverride = overrides[docKey]?.data || clientDocCache.get(docKey)?.data;
        if (localOverride) {
          return { ...revived, ...reviveFirestoreData(localOverride), id: revived.id };
        }
      }
      return revived;
    });

    if (Array.isArray(descriptor.filters) && descriptor.filters.length > 0) {
      docs = docs.filter((doc: any) =>
        descriptor.filters.every((f) => {
          const actual = doc?.[f.field];
          const expected = f.value;
          if (f.op === '==' || f.op === 'EQUAL') return actual === expected;
          if (f.op === '!=' || f.op === 'NOT_EQUAL') return actual !== expected;
          return true;
        })
      );
    }

    return {
      ok: true,
      docs,
      status: 200,
    };
  } catch (e) {
    return { ok: false, docs: [], status: 500 };
  }
}

export function triggerFirestoreSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('alibank-firestore-sync'));
  }
}

export function extractRefPath(pathOrRef: any): string {
  if (!pathOrRef) return '';
  if (typeof pathOrRef === 'string') return pathOrRef.replace(/^\/+|\/+$/g, '');
  if (typeof pathOrRef.path === 'string') return pathOrRef.path.replace(/^\/+|\/+$/g, '');
  if (pathOrRef._key?.path?.canonicalString) return pathOrRef._key.path.canonicalString();
  if (pathOrRef._path?.canonicalString) return pathOrRef._path.canonicalString();
  if (Array.isArray(pathOrRef._key?.path?.segments)) {
    const segs = pathOrRef._key.path.segments;
    const offset = pathOrRef._key.path.offset || 0;
    const len = pathOrRef._key.path.len ?? segs.length;
    return segs.slice(offset, offset + len).join('/');
  }
  return '';
}

export async function proxySetDoc(
  pathOrRef: any,
  data: Record<string, any>,
  options?: { merge?: boolean }
): Promise<any> {
  const path = extractRefPath(pathOrRef);
  if (!path) throw new Error('Invalid document reference or path for proxySetDoc');
  const { idToken, refreshToken } = getStoredAuthTokens();
  const baseData = getCachedClientDoc(path);
  const res = await fetch('/api/firestore/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'setDoc',
      path,
      data,
      baseData,
      merge: Boolean(options?.merge),
      idToken,
      refreshToken,
    }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (json?.newIdToken) {
    updateStoredTokens(json.newIdToken, json.newRefreshToken);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Firestore setDoc failed (${res.status})`);
  }
  const revived = json.data ? reviveFirestoreData(json.data) : null;
  if (revived) {
    setCachedClientDoc(path, revived, true);
  }
  triggerFirestoreSync();
  return revived;
}

export async function proxyUpdateDoc(
  pathOrRef: any,
  data: Record<string, any>
): Promise<any> {
  const path = extractRefPath(pathOrRef);
  if (!path) throw new Error('Invalid document reference or path for proxyUpdateDoc');
  const { idToken, refreshToken } = getStoredAuthTokens();
  const baseData = getCachedClientDoc(path);
  const res = await fetch('/api/firestore/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'updateDoc',
      path,
      data,
      baseData,
      merge: true,
      idToken,
      refreshToken,
    }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (json?.newIdToken) {
    updateStoredTokens(json.newIdToken, json.newRefreshToken);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Firestore updateDoc failed (${res.status})`);
  }
  const revived = json.data ? reviveFirestoreData(json.data) : null;
  if (revived) {
    setCachedClientDoc(path, revived, true);
  }
  triggerFirestoreSync();
  return revived;
}

export async function proxyAddDoc(
  colPathOrRef: any,
  data: Record<string, any>
): Promise<{ id: string; path: string; data: any }> {
  const path = extractRefPath(colPathOrRef);
  if (!path) throw new Error('Invalid collection reference or path for proxyAddDoc');
  const { idToken, refreshToken } = getStoredAuthTokens();
  const res = await fetch('/api/firestore/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'addDoc',
      path,
      data,
      idToken,
      refreshToken,
    }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (json?.newIdToken) {
    updateStoredTokens(json.newIdToken, json.newRefreshToken);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Firestore addDoc failed (${res.status})`);
  }
  triggerFirestoreSync();
  const id = json.id || '';
  return {
    id,
    path: `${path}/${id}`,
    data: json.data ? reviveFirestoreData(json.data) : null,
  };
}

export async function proxyDeleteDoc(pathOrRef: any): Promise<void> {
  const path = extractRefPath(pathOrRef);
  if (!path) throw new Error('Invalid document reference or path for proxyDeleteDoc');
  const { idToken, refreshToken } = getStoredAuthTokens();
  const res = await fetch('/api/firestore/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      op: 'deleteDoc',
      path,
      idToken,
      refreshToken,
    }),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (json?.newIdToken) {
    updateStoredTokens(json.newIdToken, json.newRefreshToken);
  }
  if (!res.ok) {
    throw new Error(json?.error || `Firestore deleteDoc failed (${res.status})`);
  }
  triggerFirestoreSync();
}
