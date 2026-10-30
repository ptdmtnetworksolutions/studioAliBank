import { NextRequest, NextResponse } from 'next/server';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const PROJECT_ID = firebaseConfig.projectId;
const API_KEY = firebaseConfig.apiKey;
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

function isJwtExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (!payload.exp) return false;
    // Consider expired if less than 60s remaining
    return Date.now() >= (payload.exp - 60) * 1000;
  } catch {
    return true;
  }
}

async function refreshFirebaseToken(refreshToken: string): Promise<{ idToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`https://securetoken.googleapis.com/v1/token?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(refreshToken)}`,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.id_token) {
      return {
        idToken: data.id_token,
        refreshToken: data.refresh_token || refreshToken,
      };
    }
    return null;
  } catch {
    return null;
  }
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
  if (field === 'timestamp') {
    const fallback = item?.date || item?.createdAt;
    if (fallback) {
      const t = new Date(fallback).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return 0;
}

function attachTokenCookies(res: NextResponse, newIdToken: string | null, newRefreshToken: string | null) {
  if (newIdToken) {
    res.cookies.set({
      name: 'alibank_token',
      value: newIdToken,
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
  if (newRefreshToken) {
    res.cookies.set({
      name: 'alibank_refresh',
      value: newRefreshToken,
      path: '/',
      maxAge: 2592000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
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

    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    let idToken: string = (body.idToken || headerToken || request.cookies.get('alibank_token')?.value || '').trim();
    let refreshToken: string = (body.refreshToken || request.cookies.get('alibank_refresh')?.value || '').trim();

    let newIdToken: string | null = null;
    let newRefreshToken: string | null = null;

    if ((!idToken || isJwtExpired(idToken)) && refreshToken) {
      const refreshed = await refreshFirebaseToken(refreshToken);
      if (refreshed) {
        idToken = refreshed.idToken;
        refreshToken = refreshed.refreshToken;
        newIdToken = refreshed.idToken;
        newRefreshToken = refreshed.refreshToken;
      }
    }

    const fetchWithAuth = async (url: string, init: RequestInit = {}): Promise<Response> => {
      const makeHeaders = (token: string) => {
        const h: Record<string, string> = {
          'Content-Type': 'application/json',
          ...(init.headers as Record<string, string> || {}),
        };
        if (token) {
          h['Authorization'] = `Bearer ${token}`;
        }
        return h;
      };

      let res = await fetch(url, {
        ...init,
        headers: makeHeaders(idToken),
        cache: 'no-store',
      });

      if ((res.status === 401 || res.status === 403) && refreshToken && !newIdToken) {
        const refreshed = await refreshFirebaseToken(refreshToken);
        if (refreshed) {
          idToken = refreshed.idToken;
          refreshToken = refreshed.refreshToken;
          newIdToken = refreshed.idToken;
          newRefreshToken = refreshed.refreshToken;
          res = await fetch(url, {
            ...init,
            headers: makeHeaders(idToken),
            cache: 'no-store',
          });
        }
      }

      return res;
    };

    if (op === 'getDoc') {
      const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
      if (!cleanPath) {
        return NextResponse.json({ error: 'Invalid document path' }, { status: 400 });
      }

      const url = `${FIRESTORE_BASE}/${cleanPath}`;
      let res = await fetchWithAuth(url, { method: 'GET' });

      // Fallback unauthenticated read for public docs if token was invalid
      if (!res.ok && cleanPath === 'system/public_keys') {
        res = await fetch(url, { method: 'GET', cache: 'no-store' });
      }

      if (res.status === 404) {
        const response = NextResponse.json({
          exists: false,
          id: cleanPath.split('/').pop() || '',
          data: null,
          newIdToken,
          newRefreshToken,
        });
        attachTokenCookies(response, newIdToken, newRefreshToken);
        return response;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore GET failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const parsed = parseFirestoreDoc(docJson);
      const response = NextResponse.json({
        exists: true,
        id: parsed.id,
        data: parsed,
        newIdToken,
        newRefreshToken,
      });
      attachTokenCookies(response, newIdToken, newRefreshToken);
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

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore Query failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const rows = await res.json();
      let docs: Record<string, any>[] = [];
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (row?.document) {
            docs.push(parseFirestoreDoc(row.document));
          }
        }
      }

      // If we had to fallback or if in-memory sorting/limiting is needed
      if (usedInMemorySort) {
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

      const response = NextResponse.json({
        docs,
        newIdToken,
        newRefreshToken,
      });
      attachTokenCookies(response, newIdToken, newRefreshToken);
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

      let existingData: Record<string, any> = {};
      if (needsExistingDoc) {
        const getRes = await fetchWithAuth(`${FIRESTORE_BASE}/${cleanPath}`, { method: 'GET' });
        if (getRes.ok) {
          const existingJson = await getRes.json().catch(() => ({}));
          existingData = parseFirestoreDoc(existingJson);
        }
      }

      const resolveTransform = (currentVal: any, incomingVal: any): any => {
        if (!incomingVal || typeof incomingVal !== 'object') return incomingVal;
        if (incomingVal._methodName === 'increment' || incomingVal.__op === 'increment') {
          const delta = Number(incomingVal._operand ?? incomingVal.operand ?? 0);
          const base = typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal : Number(currentVal) || 0;
          return base + delta;
        }
        if (incomingVal._methodName === 'serverTimestamp' || incomingVal.__sentinel === 'serverTimestamp') {
          return new Date().toISOString();
        }
        if (incomingVal._methodName === 'arrayUnion' && Array.isArray(incomingVal._elements)) {
          const arr = Array.isArray(currentVal) ? [...currentVal] : [];
          for (const el of incomingVal._elements) {
            if (!arr.includes(el)) arr.push(el);
          }
          return arr;
        }
        if (incomingVal._methodName === 'arrayRemove' && Array.isArray(incomingVal._elements)) {
          const arr = Array.isArray(currentVal) ? [...currentVal] : [];
          return arr.filter((item) => !incomingVal._elements.includes(item));
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
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore PATCH failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const response = NextResponse.json({
        success: true,
        data: parseFirestoreDoc(docJson),
        newIdToken,
        newRefreshToken,
      });
      attachTokenCookies(response, newIdToken, newRefreshToken);
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
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore POST failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const docJson = await res.json();
      const parsed = parseFirestoreDoc(docJson);
      const response = NextResponse.json({
        success: true,
        id: parsed.id,
        data: parsed,
        newIdToken,
        newRefreshToken,
      });
      attachTokenCookies(response, newIdToken, newRefreshToken);
      return response;
    }

    if (op === 'deleteDoc') {
      const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
      const url = `${FIRESTORE_BASE}/${cleanPath}`;
      const res = await fetchWithAuth(url, { method: 'DELETE' });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return NextResponse.json(
          { error: errData?.error?.message || `Firestore DELETE failed (${res.status})`, status: res.status },
          { status: res.status }
        );
      }

      const response = NextResponse.json({
        success: true,
        newIdToken,
        newRefreshToken,
      });
      attachTokenCookies(response, newIdToken, newRefreshToken);
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
