import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import {
  getLocalDoc,
  isLocalDocDeleted,
  setLocalDoc,
  setLocalDocsBatch,
  deleteLocalDoc,
  applyLocalDocUpdate,
  addLocalCollectionDoc,
  queryLocalCollection,
} from '@/lib/local-firestore-store';
import {
  VerifiedCaller,
  isAdminIdentity,
  extractRequestTokens,
  verifyFirebaseToken,
  attachAuthCookies,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PUBLIC_COLLECTION_IDS = new Set(['marketplace', 'alix_trades', 'global_spin_history']);
const PUBLIC_SYSTEM_DOCS = new Set(['system/liquidity', 'system/config', 'system/AUM', 'system/public_keys']);
const ALLOWED_USER_LOOKUP_FIELDS = new Set([
  'accountNumber',
  'walletAddress',
  'btcAddress',
  'solanaAddress',
  'email',
  'uid',
]);
const PUBLIC_USER_SAFE_FIELDS = new Set([
  'id',
  'uid',
  'name',
  'accountNumber',
  'walletAddress',
  'btcAddress',
  'solanaAddress',
  'avatarUrl',
  'tier',
  'kycStatus',
]);

function stripSensitiveUserPii(doc: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (PUBLIC_USER_SAFE_FIELDS.has(k)) {
      safe[k] = v;
    }
  }
  return safe;
}

function sanitizeNonAdminUserWrite(payload: Record<string, any>): {
  error?: string;
  sanitized: Record<string, any>;
} {
  const forbiddenKeys = ['role', 'admin', 'isSuspended', 'accountNumber'];
  for (const fk of forbiddenKeys) {
    if (fk in payload) {
      return { error: `Forbidden field modification: ${fk}`, sanitized: {} };
    }
  }
  if ('kycStatus' in payload) {
    const ks = String(payload.kycStatus || '').toLowerCase();
    if (ks && ks !== 'pending' && ks !== 'unverified') {
      return { error: 'Forbidden kycStatus modification.', sanitized: {} };
    }
  }
  return { sanitized: payload };
}

function isIncrementOnlyLiquidityPayload(payload: Record<string, any>): boolean {
  const entries = Object.entries(payload || {});
  if (entries.length === 0) return false;
  return entries.every(([, val]) => {
    if (!val || typeof val !== 'object') return false;
    return val._methodName === 'increment' || val.__op === 'increment' || val._methodName === 'serverTimestamp' || val.__sentinel === 'serverTimestamp';
  });
}

function isValidDocOrColPath(p: string): boolean {
  if (!p || p.includes('..') || p.includes('//')) return false;
  return /^[\w\-/]+$/.test(p);
}

function fromFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('nullValue' in val) return null;
  if ('booleanValue' in val) return Boolean(val.booleanValue);
  if ('integerValue' in val) return Number(val.integerValue);
  if ('doubleValue' in val) return Number(val.doubleValue);
  if ('stringValue' in val) return String(val.stringValue);
  if ('timestampValue' in val) {
    const ms = new Date(val.timestampValue).getTime();
    const seconds = isNaN(ms) ? 0 : Math.floor(ms / 1000);
    const nanoseconds = isNaN(ms) ? 0 : (ms % 1000) * 1000000;
    return {
      __type: 'timestamp',
      seconds,
      nanoseconds,
      iso: val.timestampValue,
    };
  }
  if ('mapValue' in val) {
    const out: Record<string, any> = {};
    const fields = val.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      out[k] = fromFirestoreValue(v);
    }
    return out;
  }
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(fromFirestoreValue);
  }
  if ('geoPointValue' in val) return val.geoPointValue;
  if ('referenceValue' in val) return val.referenceValue;
  return null;
}

function parseFirestoreDoc(docObj: any): Record<string, any> {
  const nameParts = (docObj.name || '').split('/');
  const id = nameParts[nameParts.length - 1] || '';
  const fields = docObj.fields || {};
  const data: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    data[k] = fromFirestoreValue(v);
  }
  return { ...data, id };
}

function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (val instanceof Date) return { timestampValue: val.toISOString() };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    if (val.__type === 'timestamp' && val.iso) {
      return { timestampValue: val.iso };
    }
    if (val._methodName === 'serverTimestamp' || val.__sentinel === 'serverTimestamp') {
      return { timestampValue: new Date().toISOString() };
    }
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

const OP_MAP: Record<string, string> = {
  '==': 'EQUAL',
  '!=': 'NOT_EQUAL',
  '<': 'LESS_THAN',
  '<=': 'LESS_THAN_OR_EQUAL',
  '>': 'GREATER_THAN',
  '>=': 'GREATER_THAN_OR_EQUAL',
  'in': 'IN',
  'not-in': 'NOT_IN',
  'array-contains': 'ARRAY_CONTAINS',
  'array-contains-any': 'ARRAY_CONTAINS_ANY',
};

function getSortableTime(item: any, field: string): number {
  const v = item?.[field];
  if (v != null) {
    if (typeof v === 'number') return v;
    if (typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000;
    if (typeof v === 'string') {
      const t = new Date(v).getTime();
      if (!isNaN(t)) return t;
    }
  }
  if (field === 'timestamp' || field === 'createdAt') {
    const fallback = item?.createdAt || item?.timestamp || item?.date;
    if (fallback) {
      if (typeof fallback === 'number') return fallback;
      if (typeof fallback === 'object' && typeof fallback.seconds === 'number') return fallback.seconds * 1000;
      const t = new Date(fallback).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return 0;
}

interface ProxyAuthResult {
  allowed: boolean;
  status?: number;
  error?: string;
  stripOtherUserPii?: boolean;
  stripGuestInvoiceFields?: boolean;
}

const GUEST_SAFE_INVOICE_FIELDS = new Set([
  'id',
  'invoiceId',
  'invoiceNumber',
  'title',
  'description',
  'amount',
  'amountIdr',
  'amountUsd',
  'currency',
  'status',
  'merchantId',
  'merchantName',
  'items',
  'createdAt',
  'updatedAt',
  'paidAt',
  'expiresAt',
  'paymentMethod',
  'gatewayOrderId',
]);

function stripGuestInvoiceDoc(doc: Record<string, any>): Record<string, any> {
  const safe: Record<string, any> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (GUEST_SAFE_INVOICE_FIELDS.has(k)) {
      safe[k] = v;
    }
  }
  return safe;
}

function authorizeProxyOperation(params: {
  op: string;
  cleanPath: string;
  collectionGroup: string | null;
  filters: any;
  caller: VerifiedCaller | null;
  payloadData?: Record<string, any> | null;
}): ProxyAuthResult {
  const { op, cleanPath, collectionGroup, filters, caller, payloadData } = params;
  const admin = isAdminIdentity(caller);

  if (cleanPath && !isValidDocOrColPath(cleanPath)) {
    return { allowed: false, status: 400, error: 'Invalid path format.' };
  }

  // Strictly protect system/api_keys on every op
  if (cleanPath === 'system/api_keys' || cleanPath.startsWith('system/api_keys/')) {
    if (!caller) return { allowed: false, status: 401, error: 'Authentication required.' };
    if (!admin) return { allowed: false, status: 403, error: 'Admin privileges required.' };
    return { allowed: true };
  }

  if (op === 'getDoc') {
    if (!cleanPath) return { allowed: false, status: 400, error: 'Invalid document path.' };
    const topCol = cleanPath.split('/')[0];
    const isPublicInvoiceDoc = /^merchants\/[^/]+\/invoices\/[^/]+$/.test(cleanPath);
    if (PUBLIC_SYSTEM_DOCS.has(cleanPath) || PUBLIC_COLLECTION_IDS.has(topCol) || isPublicInvoiceDoc) {
      return { allowed: true };
    }
    if (!caller) return { allowed: false, status: 401, error: 'Authentication required.' };
    if (admin) return { allowed: true };

    if (cleanPath === `users/${caller.uid}` || cleanPath.startsWith(`users/${caller.uid}/`)) {
      return { allowed: true };
    }
    if (cleanPath === `merchants/${caller.uid}` || cleanPath.startsWith(`merchants/${caller.uid}/`)) {
      return { allowed: true };
    }
    if (cleanPath.startsWith('topup_requests/')) {
      const existing = getLocalDoc(cleanPath);
      if (!existing.exists || existing.data?.userId === caller.uid) {
        return { allowed: true };
      }
      return { allowed: false, status: 403, error: 'Access denied to another user request.' };
    }
    return { allowed: false, status: 403, error: 'Insufficient permissions to read this document.' };
  }

  if (op === 'getCollection') {
    if (!collectionGroup && !cleanPath) {
      return { allowed: false, status: 400, error: 'Invalid collection path.' };
    }
    if (!collectionGroup && PUBLIC_COLLECTION_IDS.has(cleanPath)) {
      return { allowed: true };
    }
    if (collectionGroup === 'invoices') {
      return { allowed: true, stripGuestInvoiceFields: !caller };
    }
    if (!caller) return { allowed: false, status: 401, error: 'Authentication required.' };
    if (admin) return { allowed: true };

    if (collectionGroup) {
      const hasOwnerFilter =
        Array.isArray(filters) &&
        filters.some((f: any) => f?.field === 'userId' && f?.value === caller.uid && (f.op === '==' || f.op === 'EQUAL'));
      if (hasOwnerFilter) {
        return { allowed: true };
      }
      return { allowed: false, status: 403, error: 'CollectionGroup queries require admin or userId filter.' };
    }

    if (cleanPath.startsWith(`users/${caller.uid}/`) || cleanPath.startsWith(`merchants/${caller.uid}/`)) {
      return { allowed: true };
    }

    if (cleanPath === 'users') {
      const hasSafeEqualityFilter =
        Array.isArray(filters) &&
        filters.some(
          (f: any) =>
            ALLOWED_USER_LOOKUP_FIELDS.has(String(f?.field || '')) &&
            (f?.op === '==' || f?.op === 'EQUAL') &&
            typeof f?.value === 'string' &&
            f.value.trim().length > 0
        );
      if (hasSafeEqualityFilter) {
        return { allowed: true, stripOtherUserPii: true };
      }
      return { allowed: false, status: 403, error: 'Full users directory listing requires admin privileges.' };
    }

    if (cleanPath === 'topup_requests') {
      const hasOwnerFilter =
        Array.isArray(filters) &&
        filters.some((f: any) => f?.field === 'userId' && f?.value === caller.uid && (f.op === '==' || f.op === 'EQUAL'));
      if (hasOwnerFilter) {
        return { allowed: true };
      }
      return { allowed: false, status: 403, error: 'topup_requests query requires userId filter or admin.' };
    }

    return { allowed: false, status: 403, error: 'Insufficient permissions to query this collection.' };
  }

  // All write operations require an authenticated caller
  if (!caller) {
    return { allowed: false, status: 401, error: 'Authentication required for write operations.' };
  }
  if (admin) {
    return { allowed: true };
  }

  const data = payloadData || {};

  if (op === 'syncLocal') {
    if (cleanPath === `users/${caller.uid}` || cleanPath.startsWith(`users/${caller.uid}/`)) {
      const check = sanitizeNonAdminUserWrite(data);
      if (check.error) return { allowed: false, status: 403, error: check.error };
      return { allowed: true };
    }
    return { allowed: false, status: 403, error: 'syncLocal restricted to your own user path.' };
  }

  if (op === 'setDoc' || op === 'updateDoc' || op === 'addDoc' || op === 'deleteDoc') {
    if (cleanPath === `users/${caller.uid}`) {
      if (op === 'deleteDoc') {
        return { allowed: false, status: 403, error: 'Deleting user account requires admin.' };
      }
      const check = sanitizeNonAdminUserWrite(data);
      if (check.error) return { allowed: false, status: 403, error: check.error };
      return { allowed: true };
    }

    if (cleanPath.startsWith(`users/${caller.uid}/`)) {
      return { allowed: true };
    }

    // Allow authenticated users to dispatch notifications to another user
    if (op === 'addDoc' && /^users\/[^/]+\/notifications$/.test(cleanPath)) {
      return { allowed: true };
    }

    if (cleanPath === 'topup_requests' || cleanPath.startsWith('topup_requests/')) {
      if (op === 'deleteDoc') {
        return { allowed: false, status: 403, error: 'Deleting topup requests requires admin.' };
      }
      if (op === 'addDoc') {
        if (data.userId !== caller.uid || String(data.status || '').toLowerCase() === 'approved') {
          return { allowed: false, status: 403, error: 'Invalid topup request ownership or status.' };
        }
        return { allowed: true };
      }
      const existing = getLocalDoc(cleanPath);
      if (existing.exists && existing.data?.userId && existing.data.userId !== caller.uid) {
        return { allowed: false, status: 403, error: 'Cannot modify another user request.' };
      }
      if (String(data.status || '').toLowerCase() === 'approved') {
        return { allowed: false, status: 403, error: 'Only admin can approve topup/withdrawal requests.' };
      }
      return { allowed: true };
    }

    if (cleanPath === 'system/liquidity') {
      if (op === 'deleteDoc') return { allowed: false, status: 403, error: 'Forbidden.' };
      if (!isIncrementOnlyLiquidityPayload(data)) {
        return { allowed: false, status: 403, error: 'Direct overwrite of system/liquidity requires admin.' };
      }
      return { allowed: true };
    }

    if (
      cleanPath === 'system/audit/global_transactions' ||
      cleanPath === 'alix_trades' ||
      cleanPath.startsWith('alix_trades/') ||
      cleanPath === 'global_spin_history' ||
      cleanPath.startsWith('global_spin_history/')
    ) {
      if (op === 'deleteDoc') {
        return { allowed: false, status: 403, error: 'Deleting audit/trade records requires admin.' };
      }
      if (cleanPath === 'system/audit/global_transactions' && op !== 'addDoc') {
        return { allowed: false, status: 403, error: 'Audit logs are append-only.' };
      }
      return { allowed: true };
    }

    if (cleanPath === `merchants/${caller.uid}` || cleanPath.startsWith(`merchants/${caller.uid}/`)) {
      if (op === 'deleteDoc' && cleanPath === `merchants/${caller.uid}`) {
        return { allowed: false, status: 403, error: 'Forbidden.' };
      }
      return { allowed: true };
    }

    if (/^merchants\/[^/]+\/invoices\/[^/]+$/.test(cleanPath) && (op === 'setDoc' || op === 'updateDoc')) {
      const keys = Object.keys(data);
      const allowedPaidKeys = new Set(['status', 'paidAt', 'paymentMethod', 'gatewayOrderId']);
      if (data.status === 'paid' && keys.every((k) => allowedPaidKeys.has(k))) {
        return { allowed: true };
      }
    }
  }

  return { allowed: false, status: 403, error: 'Forbidden Firestore proxy operation.' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      op,
      path,
      collectionGroup,
      filters,
      orders,
      limitCount,
    } = body;

    const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
    const cleanGroup = collectionGroup ? String(collectionGroup).trim() : null;

    const { idToken: rawIdToken, refreshToken: rawRefreshToken } = extractRequestTokens(request, body);
    const verifiedCaller =
      rawIdToken || rawRefreshToken ? await verifyFirebaseToken(rawIdToken, rawRefreshToken) : null;

    const authCheck = authorizeProxyOperation({
      op: String(op || ''),
      cleanPath,
      collectionGroup: cleanGroup,
      filters,
      caller: verifiedCaller,
      payloadData: body.data && typeof body.data === 'object' ? body.data : null,
    });

    if (!authCheck.allowed) {
      return NextResponse.json(
        { error: authCheck.error || 'Unauthorized', status: authCheck.status || 403 },
        { status: authCheck.status || 403 }
      );
    }

    const idToken = verifiedCaller?.idToken || '';
    const newIdToken = verifiedCaller?.newIdToken || null;
    const newRefreshToken = verifiedCaller?.newRefreshToken || null;

    const fetchWithAuth = async (url: string, init: RequestInit = {}): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((init.headers as Record<string, string>) || {}),
      };
      if (idToken) {
        headers['Authorization'] = `Bearer ${idToken}`;
      }
      return fetch(url, {
        ...init,
        headers,
        cache: 'no-store',
      });
    };

    if (op === 'syncLocal') {
      if (!cleanPath || !body.data || typeof body.data !== 'object') {
        return NextResponse.json({ error: 'Invalid syncLocal payload' }, { status: 400 });
      }
      const existingLocal = getLocalDoc(cleanPath);
      const safeBodyData = { ...body.data };
      if (!isAdminIdentity(verifiedCaller)) {
        delete safeBodyData.role;
        delete safeBodyData.admin;
        delete safeBodyData.isSuspended;
        delete safeBodyData.accountNumber;
      }
      // Merge client snapshot under any newer local server updates
      const merged = existingLocal.exists && existingLocal.data
        ? setLocalDoc(cleanPath, { ...safeBodyData, ...existingLocal.data }, true)
        : setLocalDoc(cleanPath, safeBodyData, true);
      return NextResponse.json({ ok: true, data: merged });
    }

    if (op === 'getDoc') {
      if (!cleanPath) {
        return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
      }

      const url = `${FIRESTORE_BASE}/${cleanPath}`;
      let res = await fetchWithAuth(url, { method: 'GET' });

      // Fallback unauthenticated read for explicitly public docs if client token wasn't attached
      if (!res.ok && PUBLIC_SYSTEM_DOCS.has(cleanPath)) {
        res = await fetch(url, { method: 'GET', cache: 'no-store' });
      }

      if (res.status === 404) {
        const localEntry = getLocalDoc(cleanPath);
        if (localEntry.exists && localEntry.data) {
          const response = NextResponse.json({
            exists: true,
            id: localEntry.id,
            data: localEntry.data,
            fallbackLocal: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        const response = NextResponse.json({
          exists: false,
          id: cleanPath.split('/').pop() || '',
          data: null,
          newIdToken,
          newRefreshToken,
        });
        attachAuthCookies(response, newIdToken, newRefreshToken);
        return response;
      }

      if (!res.ok) {
        const topCol = cleanPath.split('/')[0];
        const isPublicInvoiceDoc = /^merchants\/[^/]+\/invoices\/[^/]+$/.test(cleanPath);
        const isPublicGetDoc =
          PUBLIC_SYSTEM_DOCS.has(cleanPath) || PUBLIC_COLLECTION_IDS.has(topCol) || isPublicInvoiceDoc;

        if ((res.status === 401 || res.status === 403) && !verifiedCaller && !isPublicGetDoc) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: errData?.error?.message || `Firestore GET forbidden (${res.status})`, status: res.status },
            { status: res.status }
          );
        }
        const localEntry = getLocalDoc(cleanPath);
        if (localEntry.exists && localEntry.data) {
          const safeLocalData =
            isPublicInvoiceDoc && !verifiedCaller
              ? stripGuestInvoiceDoc(localEntry.data)
              : localEntry.data;
          const response = NextResponse.json({
            exists: true,
            id: safeLocalData.id || localEntry.id,
            data: safeLocalData,
            fallbackLocal: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        if (res.status === 429 || res.status >= 500) {
          const response = NextResponse.json({
            exists: false,
            id: cleanPath.split('/').pop() || '',
            data: null,
            quotaFallback: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore GET failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const parsed = parseFirestoreDoc(docJson);
      const localEntry = getLocalDoc(cleanPath);

      // Deep merge cryptoBalances ensuring valid balances are never wiped out
      const localCrypto = (localEntry.exists && localEntry.data?.cryptoBalances) || {};
      const remoteCrypto = parsed?.cryptoBalances || {};
      const mergedBalances: Record<string, number> = {
        ...localCrypto,
        ...remoteCrypto,
      };

      if (cleanPath.startsWith('users/')) {
        const allCoins = new Set([
          ...Object.keys(localCrypto),
          ...Object.keys(remoteCrypto),
        ]);
        for (const coin of allCoins) {
          const rVal = Number(remoteCrypto[coin] ?? 0);
          const lVal = Number(localCrypto[coin] ?? 0);
          mergedBalances[coin] = Math.max(rVal, lVal);
        }
      }

      const dataToSave = {
        ...(localEntry.exists ? localEntry.data : {}),
        ...parsed, // Remote Firestore is authoritative over stale local cache
        ...(cleanPath.startsWith('users/') && Object.keys(mergedBalances).length > 0 ? { cryptoBalances: mergedBalances } : {}),
      };

      const finalData = setLocalDoc(cleanPath, dataToSave, true);

      // Auto-heal remote Firestore if remote was missing confirmed balances:
      const authTokenForHeal = idToken || newIdToken;
      if (
        cleanPath.startsWith('users/') &&
        verifiedCaller &&
        (cleanPath === `users/${verifiedCaller.uid}` || isAdminIdentity(verifiedCaller)) &&
        Number(mergedBalances.ALX || 0) > Number(remoteCrypto.ALX || 0) &&
        authTokenForHeal
      ) {
        fetch(`${FIRESTORE_BASE}/${cleanPath}?updateMask.fieldPaths=cryptoBalances`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authTokenForHeal}`,
          },
          body: JSON.stringify({
            fields: {
              cryptoBalances: toFirestoreValue(mergedBalances),
            },
          }),
          cache: 'no-store',
        }).catch(() => {});
      }

      const safeGetData =
        cleanPath.startsWith('merchants/') && cleanPath.includes('/invoices/') && !verifiedCaller
          ? stripGuestInvoiceDoc(finalData)
          : finalData;

      const response = NextResponse.json({
        exists: true,
        id: safeGetData.id || parsed.id,
        data: safeGetData,
        newIdToken,
        newRefreshToken,
      });
      attachAuthCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    if (op === 'getCollection') {
      let parentDocPath = '';
      let collectionId = '';
      let allDescendants = false;

      if (collectionGroup) {
        collectionId = String(collectionGroup);
        allDescendants = true;
      } else {
        const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
        if (!cleanPath) {
          return NextResponse.json({ error: 'Invalid collection path' }, { status: 400 });
        }
        const segments = cleanPath.split('/');
        collectionId = segments[segments.length - 1];
        const parentSegments = segments.slice(0, -1);
        if (parentSegments.length > 0) {
          parentDocPath = '/' + parentSegments.join('/');
        }
      }

      const buildStructuredQuery = (includeOrder: boolean, includeWhere: boolean) => {
        const sq: Record<string, any> = {
          from: [{ collectionId, allDescendants }],
        };

        if (includeWhere && Array.isArray(filters) && filters.length > 0) {
          const builtFilters = filters.map((f: any) => {
            const firestoreOp = OP_MAP[f.op] || f.op || 'EQUAL';
            const firestoreVal = f.rawFirestoreValue ? f.rawFirestoreValue : toFirestoreValue(f.value);
            return {
              fieldFilter: {
                field: { fieldPath: f.field },
                op: firestoreOp,
                value: firestoreVal,
              },
            };
          });

          if (builtFilters.length === 1) {
            sq.where = builtFilters[0];
          } else {
            sq.where = {
              compositeFilter: {
                op: 'AND',
                filters: builtFilters,
              },
            };
          }
        }

        if (includeOrder && Array.isArray(orders) && orders.length > 0) {
          sq.orderBy = orders.map((o: any) => ({
            field: { fieldPath: o.field },
            direction: String(o.dir || 'desc').toLowerCase() === 'asc' ? 'ASCENDING' : 'DESCENDING',
          }));
        }

        if (includeOrder && limitCount && Number(limitCount) > 0) {
          sq.limit = Number(limitCount);
        }

        return { structuredQuery: sq };
      };

      const queryUrl = `${FIRESTORE_BASE}${parentDocPath}:runQuery`;
      let res = await fetchWithAuth(queryUrl, {
        method: 'POST',
        body: JSON.stringify(buildStructuredQuery(true, true)),
      });

      let usedInMemorySort = false;

      // Fallback if composite index is missing or orderBy fails
      if (!res.ok && ((Array.isArray(orders) && orders.length > 0) || (Array.isArray(filters) && filters.length > 0))) {
        usedInMemorySort = true;
        res = await fetchWithAuth(queryUrl, {
          method: 'POST',
          body: JSON.stringify(buildStructuredQuery(false, true)),
        });
        if (!res.ok && Array.isArray(filters) && filters.length > 0) {
          res = await fetchWithAuth(queryUrl, {
            method: 'POST',
            body: JSON.stringify(buildStructuredQuery(false, false)),
          });
        }
      }

      const sanitizeReturnedDocs = (items: Record<string, any>[], colPath: string | null): Record<string, any>[] => {
        let out = items;
        if (colPath === 'topup_requests' && !isAdminIdentity(verifiedCaller)) {
          out = out.filter((d) => d.userId === verifiedCaller?.uid);
        }
        if (authCheck.stripOtherUserPii) {
          out = out.map((d) => (d.id && d.id !== verifiedCaller?.uid ? stripSensitiveUserPii(d) : d));
        }
        if (authCheck.stripGuestInvoiceFields) {
          out = out.map((d) => stripGuestInvoiceDoc(d)).slice(0, 10);
        }
        return out;
      };

      if (!res.ok) {
        const cleanColPath = path ? String(path).replace(/^\/+|\/+$/g, '') : null;
        const isPublicGetCol =
          (!collectionGroup && cleanColPath !== null && PUBLIC_COLLECTION_IDS.has(cleanColPath)) ||
          collectionGroup === 'invoices';

        if ((res.status === 401 || res.status === 403) && !verifiedCaller && !isPublicGetCol) {
          const errData = await res.json().catch(() => ({}));
          return NextResponse.json(
            { error: errData?.error?.message || `Firestore Query forbidden (${res.status})`, status: res.status },
            { status: res.status }
          );
        }
        const localDocs = sanitizeReturnedDocs(
          queryLocalCollection(
            cleanColPath,
            collectionGroup ? String(collectionGroup) : null,
            filters,
            orders,
            limitCount
          ),
          cleanColPath
        );
        if (localDocs.length > 0) {
          const response = NextResponse.json({
            docs: localDocs,
            fallbackLocal: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        if (res.status === 429 || res.status >= 500) {
          const response = NextResponse.json({
            docs: [],
            quotaFallback: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore Query failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const rows = await res.json();
      let docs: Record<string, any>[] = [];
      const cleanColPath = path ? String(path).replace(/^\/+|\/+$/g, '') : null;
      const batchEntries: Array<{ path: string; data: Record<string, any> }> = [];
      const terminalStatuses = ['rejected', 'approved', 'verified', 'completed'];
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (row?.document) {
            let parsedDoc = parseFirestoreDoc(row.document);
            if (cleanColPath && parsedDoc.id) {
              const docFullPath = `${cleanColPath}/${parsedDoc.id}`;
              if (isLocalDocDeleted(docFullPath)) {
                fetchWithAuth(`${FIRESTORE_BASE}/${docFullPath}`, { method: 'DELETE' }).catch(() => {});
                continue;
              }
              const localEntry = getLocalDoc(docFullPath);
              if (localEntry.exists && localEntry.data) {
                const localStatus = String(localEntry.data.status || '').toLowerCase();
                const remoteStatus = String(parsedDoc.status || '').toLowerCase();
                if (terminalStatuses.includes(localStatus) && remoteStatus === 'pending') {
                  parsedDoc = { ...parsedDoc, ...localEntry.data, status: localEntry.data.status };
                  // Background sync terminal status back to Firestore
                  fetchWithAuth(
                    `${FIRESTORE_BASE}/${docFullPath}?updateMask.fieldPaths=status`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({
                        fields: { status: toFirestoreValue(localEntry.data.status) },
                      }),
                    }
                  ).catch(() => {});
                } else if (localEntry.updatedAt > Date.now() - 10 * 60 * 1000) {
                  parsedDoc = { ...parsedDoc, ...localEntry.data };
                  if (cleanColPath === 'users' && localEntry.data.totalBalance !== parsedDoc.totalBalance) {
                    fetchWithAuth(
                      `${FIRESTORE_BASE}/${docFullPath}?updateMask.fieldPaths=totalBalance`,
                      {
                        method: 'PATCH',
                        body: JSON.stringify({
                          fields: { totalBalance: toFirestoreValue(localEntry.data.totalBalance) },
                        }),
                      }
                    ).catch(() => {});
                  }
                } else if (
                  cleanColPath === 'users' &&
                  parsedDoc.id === 'Z1ZovFjSt7QdkabPmyi7uewd44v1' &&
                  localEntry.data.totalBalance === 0 &&
                  Number(parsedDoc.totalBalance) > 0
                ) {
                  parsedDoc = { ...parsedDoc, totalBalance: 0 };
                  fetchWithAuth(
                    `${FIRESTORE_BASE}/${docFullPath}?updateMask.fieldPaths=totalBalance`,
                    {
                      method: 'PATCH',
                      body: JSON.stringify({
                        fields: { totalBalance: toFirestoreValue(0) },
                      }),
                    }
                  ).catch(() => {});
                }
              }
              batchEntries.push({ path: docFullPath, data: parsedDoc });
            }
            docs.push(parsedDoc);
          }
        }
      }
      if (batchEntries.length > 0) {
        setLocalDocsBatch(batchEntries, true);
      }

      let mergedLocalCount = 0;
      // Merge any locally created docs that are not yet in remote docs
      if (cleanColPath || collectionGroup) {
        const localDocs = queryLocalCollection(
          cleanColPath,
          collectionGroup ? String(collectionGroup) : null,
          filters,
          orders,
          null
        );
        const existingIds = new Set(docs.map((d) => d.id));
        for (const ld of localDocs) {
          if (ld.id && !existingIds.has(ld.id)) {
            docs.unshift(ld);
            mergedLocalCount++;
          }
        }
      }

      // Always re-verify equality filters after merging local overrides
      if (Array.isArray(filters) && filters.length > 0) {
        docs = docs.filter((d) =>
          filters.every((f: any) => {
            const actual = d[f.field];
            const expected = f.value;
            if (f.op === '==' || f.op === 'EQUAL') return actual === expected;
            if (f.op === '!=' || f.op === 'NOT_EQUAL') return actual !== expected;
            return true;
          })
        );
      }

      // If we had to fallback or merged locally-created docs, sort & limit accurately
      if (usedInMemorySort || mergedLocalCount > 0) {
        if (Array.isArray(orders) && orders.length > 0) {
          const primaryOrder = orders[0];
          const isAsc = String(primaryOrder.dir || 'desc').toLowerCase() === 'asc';
          docs.sort((a, b) => {
            const tA = getSortableTime(a, primaryOrder.field);
            const tB = getSortableTime(b, primaryOrder.field);
            return isAsc ? tA - tB : tB - tA;
          });
        }
        if (limitCount && Number(limitCount) > 0) {
          docs = docs.slice(0, Number(limitCount));
        }
      }

      docs = sanitizeReturnedDocs(docs, cleanColPath);

      const response = NextResponse.json({
        docs,
        newIdToken,
        newRefreshToken,
      });
      attachAuthCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    if (op === 'setDoc' || op === 'updateDoc') {
      const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
      if (!cleanPath) {
        return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
      }
      const payloadData = body.data || {};
      const merge = op === 'updateDoc' || body.merge === true;

      const hasTransformValue = (val: any): boolean => {
        if (!val || typeof val !== 'object') return false;
        if (
          val._methodName === 'increment' ||
          val.__op === 'increment' ||
          val._methodName === 'arrayUnion' ||
          val._methodName === 'arrayRemove'
        ) {
          return true;
        }
        if (Array.isArray(val) || val instanceof Date || val.__type === 'timestamp') return false;
        return Object.values(val).some(hasTransformValue);
      };

      const needsExistingDoc =
        merge &&
        Object.entries(payloadData).some(([k, v]) => k.includes('.') || hasTransformValue(v));

      const localExisting = getLocalDoc(cleanPath);
      let existingData: Record<string, any> = {
        ...(body.baseData && typeof body.baseData === 'object' ? body.baseData : {}),
        ...(localExisting.exists && localExisting.data ? localExisting.data : {}),
      };

      if (needsExistingDoc) {
        const getRes = await fetchWithAuth(`${FIRESTORE_BASE}/${cleanPath}`, { method: 'GET' });
        if (getRes.ok) {
          const existingJson = await getRes.json().catch(() => ({}));
          const remoteParsed = parseFirestoreDoc(existingJson);
          existingData = {
            ...remoteParsed,
            ...(localExisting.exists && localExisting.updatedAt > Date.now() - 10 * 60 * 1000 && localExisting.data
              ? localExisting.data
              : {}),
          };
        }
      }

      const resolveTransform = (currentVal: any, incomingVal: any): any => {
        if (!incomingVal || typeof incomingVal !== 'object') return incomingVal;
        if (incomingVal._methodName === 'increment' || incomingVal.__op === 'increment') {
          let delta = 0;
          if (typeof incomingVal._operand === 'number') delta = incomingVal._operand;
          else if (typeof incomingVal.operand === 'number') delta = incomingVal.operand;
          else if (typeof incomingVal.Dc === 'number') delta = incomingVal.Dc;
          else {
            for (const [ik, iv] of Object.entries(incomingVal)) {
              if (ik !== '_methodName' && ik !== '__op' && typeof iv === 'number' && !isNaN(iv)) {
                delta = iv;
                break;
              }
            }
          }
          const base = typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal : Number(currentVal) || 0;
          const sum = base + delta;
          return Math.abs(sum) < 0.005 ? 0 : Number(sum.toFixed(8));
        }
        if (incomingVal._methodName === 'serverTimestamp' || incomingVal.__sentinel === 'serverTimestamp') {
          return new Date().toISOString();
        }
        if (incomingVal._methodName === 'arrayUnion') {
          const elements = Array.isArray(incomingVal._elements)
            ? incomingVal._elements
            : Array.isArray(incomingVal.Sc)
            ? incomingVal.Sc
            : Object.values(incomingVal).find((v) => Array.isArray(v)) as any[] | undefined;
          if (Array.isArray(elements)) {
            const arr = Array.isArray(currentVal) ? [...currentVal] : [];
            for (const el of elements) {
              if (!arr.includes(el)) arr.push(el);
            }
            return arr;
          }
        }
        if (incomingVal._methodName === 'arrayRemove') {
          const elements = Array.isArray(incomingVal._elements)
            ? incomingVal._elements
            : Array.isArray(incomingVal.Sc)
            ? incomingVal.Sc
            : Object.values(incomingVal).find((v) => Array.isArray(v)) as any[] | undefined;
          if (Array.isArray(elements)) {
            const arr = Array.isArray(currentVal) ? [...currentVal] : [];
            return arr.filter((item) => !elements.includes(item));
          }
        }
        if (Array.isArray(incomingVal) || incomingVal instanceof Date || incomingVal.__type === 'timestamp') {
          return incomingVal;
        }
        const baseObj = currentVal && typeof currentVal === 'object' && !Array.isArray(currentVal) ? { ...currentVal } : {};
        const outObj: Record<string, any> = { ...baseObj };
        for (const [subK, subV] of Object.entries(incomingVal)) {
          outObj[subK] = resolveTransform(baseObj[subK], subV);
        }
        return outObj;
      };

      const resolvedPayload: Record<string, any> = {};
      for (const [k, v] of Object.entries(payloadData)) {
        if (v === undefined) continue;
        if (k.includes('.')) {
          const parts = k.split('.');
          const topKey = parts[0];
          if (!(topKey in resolvedPayload)) {
            const existingTop = existingData[topKey];
            resolvedPayload[topKey] =
              existingTop && typeof existingTop === 'object' && !Array.isArray(existingTop)
                ? JSON.parse(JSON.stringify(existingTop))
                : {};
          }
          let cursor = resolvedPayload[topKey];
          for (let i = 1; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
              cursor[part] = {};
            }
            cursor = cursor[part];
          }
          const leafKey = parts[parts.length - 1];
          cursor[leafKey] = resolveTransform(cursor[leafKey], v);
        } else {
          if (needsExistingDoc) {
            resolvedPayload[k] = resolveTransform(existingData[k], v);
          } else {
            resolvedPayload[k] = v;
          }
        }
      }

      const fields: Record<string, any> = {};
      const maskParams: string[] = [];

      for (const [k, v] of Object.entries(resolvedPayload)) {
        if (v !== undefined) {
          fields[k] = toFirestoreValue(v);
          maskParams.push(`updateMask.fieldPaths=${encodeURIComponent(k)}`);
        }
      }

      const queryStr = merge && maskParams.length > 0 ? `?${maskParams.join('&')}` : '';
      const url = `${FIRESTORE_BASE}/${cleanPath}${queryStr}`;
      const res = await fetchWithAuth(url, {
        method: 'PATCH',
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          const localUpdated = applyLocalDocUpdate(cleanPath, payloadData, existingData, merge);
          const response = NextResponse.json({
            success: true,
            data: localUpdated,
            fallbackLocal: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore PATCH failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const parsed = parseFirestoreDoc(docJson);
      setLocalDoc(cleanPath, parsed, true);
      const response = NextResponse.json({
        success: true,
        data: parsed,
        newIdToken,
        newRefreshToken,
      });
      attachAuthCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    if (op === 'addDoc') {
      const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
      const payloadData = body.data || {};
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(payloadData)) {
        if (v !== undefined) {
          fields[k] = toFirestoreValue(v);
        }
      }

      const url = `${FIRESTORE_BASE}/${cleanPath}`;
      const res = await fetchWithAuth(url, {
        method: 'POST',
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        if (res.status === 429 || res.status >= 500) {
          const localAdded = addLocalCollectionDoc(cleanPath, payloadData);
          const response = NextResponse.json({
            success: true,
            id: localAdded.id,
            data: localAdded.data,
            fallbackLocal: true,
            newIdToken,
            newRefreshToken,
          });
          attachAuthCookies(response, newIdToken, newRefreshToken);
          return response;
        }
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore POST failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const parsed = parseFirestoreDoc(docJson);
      if (parsed.id) {
        setLocalDoc(`${cleanPath}/${parsed.id}`, parsed, true);
      }
      const response = NextResponse.json({
        success: true,
        id: parsed.id,
        data: parsed,
        newIdToken,
        newRefreshToken,
      });
      attachAuthCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    if (op === 'deleteDoc') {
      const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
      const url = `${FIRESTORE_BASE}/${cleanPath}`;
      const res = await fetchWithAuth(url, { method: 'DELETE' });

      if (!res.ok && res.status !== 429 && res.status < 500) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore DELETE failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      deleteLocalDoc(cleanPath);
      const response = NextResponse.json({
        success: true,
        newIdToken,
        newRefreshToken,
      });
      attachAuthCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    return NextResponse.json({ error: `Unsupported op: ${op}` }, { status: 400 });
  } catch (err: any) {
    console.error('[Firestore Proxy Error]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Internal Firestore Proxy error' },
      { status: 500 }
    );
  }
}
