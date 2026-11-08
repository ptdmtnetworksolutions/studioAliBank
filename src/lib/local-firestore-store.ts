import fs from 'fs';
import path from 'path';
import seedStore from './local-firestore-seed.json';

const CACHE_FILE = path.join('/tmp', 'alibank-local-firestore-cache.json');

interface LocalStoreSchema {
  docs: Record<string, { data: Record<string, any>; updatedAt: number }>;
}

let memoryStore: LocalStoreSchema | null = null;

function loadStore(): LocalStoreSchema {
  if (memoryStore) return memoryStore;
  const baseDocs: Record<string, { data: Record<string, any>; updatedAt: number }> = {};
  if (seedStore && typeof (seedStore as any).docs === 'object') {
    for (const [k, v] of Object.entries((seedStore as any).docs)) {
      baseDocs[k] = v as { data: Record<string, any>; updatedAt: number };
    }
  }
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.docs === 'object') {
        for (const [k, v] of Object.entries(parsed.docs)) {
          const entry = v as { data: Record<string, any>; updatedAt: number };
          const existing = baseDocs[k];
          if (!existing || (entry.updatedAt || 0) >= (existing.updatedAt || 0)) {
            baseDocs[k] = {
              data: existing?.data ? { ...existing.data, ...entry.data } : entry.data,
              updatedAt: entry.updatedAt || Date.now(),
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn('[LocalFirestoreStore] Failed reading cache file:', e);
  }
  memoryStore = { docs: baseDocs };
  return memoryStore;
}

function saveStore(store: LocalStoreSchema) {
  memoryStore = store;
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.warn('[LocalFirestoreStore] Failed writing cache file:', e);
  }
}

export function normalizeDocPath(docPath: string): string {
  return String(docPath || '').replace(/^\/+|\/+$/g, '');
}

export function getLocalDoc(docPath: string): { exists: boolean; id: string; data: Record<string, any> | null; updatedAt: number } {
  const clean = normalizeDocPath(docPath);
  const store = loadStore();
  const entry = store.docs[clean];
  const id = clean.split('/').pop() || '';
  if (!entry || !entry.data) {
    return { exists: false, id, data: null, updatedAt: 0 };
  }
  return {
    exists: true,
    id,
    data: { ...entry.data, id },
    updatedAt: entry.updatedAt || 0,
  };
}

export function setLocalDoc(docPath: string, data: Record<string, any>, merge = true): Record<string, any> {
  const clean = normalizeDocPath(docPath);
  const id = clean.split('/').pop() || '';
  const store = loadStore();
  const existing: Record<string, any> = store.docs[clean]?.data || {};
  const terminalStatuses = ['rejected', 'approved', 'verified', 'completed'];
  const nextData: Record<string, any> = merge ? { ...existing, ...data, id } : { ...data, id };
  if (
    existing.status &&
    terminalStatuses.includes(String(existing.status).toLowerCase()) &&
    String(data?.status || '').toLowerCase() === 'pending'
  ) {
    nextData.status = existing.status;
  }
  store.docs[clean] = {
    data: nextData,
    updatedAt: Date.now(),
  };
  saveStore(store);
  return nextData;
}

export function setLocalDocsBatch(entries: Array<{ path: string; data: Record<string, any> }>, merge = true): void {
  if (!Array.isArray(entries) || entries.length === 0) return;
  const store = loadStore();
  const now = Date.now();
  const terminalStatuses = ['rejected', 'approved', 'verified', 'completed'];
  for (const item of entries) {
    const clean = normalizeDocPath(item.path);
    if (!clean || !item.data) continue;
    const id = clean.split('/').pop() || '';
    const existing: Record<string, any> = store.docs[clean]?.data || {};
    const nextData: Record<string, any> = merge ? { ...existing, ...item.data, id } : { ...item.data, id };
    if (
      existing.status &&
      terminalStatuses.includes(String(existing.status).toLowerCase()) &&
      String(item.data?.status || '').toLowerCase() === 'pending'
    ) {
      nextData.status = existing.status;
    }
    store.docs[clean] = {
      data: nextData,
      updatedAt: now,
    };
  }
  saveStore(store);
}

export function deleteLocalDoc(docPath: string): void {
  const clean = normalizeDocPath(docPath);
  const store = loadStore();
  if (clean in store.docs) {
    delete store.docs[clean];
    saveStore(store);
  }
}

function extractIncrementOperand(incomingVal: any): number {
  if (!incomingVal || typeof incomingVal !== 'object') return 0;
  if (typeof incomingVal._operand === 'number') return incomingVal._operand;
  if (typeof incomingVal.operand === 'number') return incomingVal.operand;
  if (typeof incomingVal.Dc === 'number') return incomingVal.Dc;
  for (const [k, v] of Object.entries(incomingVal)) {
    if (k !== '_methodName' && k !== '__op' && typeof v === 'number' && !isNaN(v)) {
      return v;
    }
  }
  return 0;
}

function extractArrayElements(incomingVal: any): any[] | null {
  if (!incomingVal || typeof incomingVal !== 'object') return null;
  if (Array.isArray(incomingVal._elements)) return incomingVal._elements;
  if (Array.isArray(incomingVal.Sc)) return incomingVal.Sc;
  for (const [k, v] of Object.entries(incomingVal)) {
    if (k !== '_methodName' && Array.isArray(v)) {
      return v;
    }
  }
  return null;
}

export function resolveFirestoreTransformValue(currentVal: any, incomingVal: any): any {
  if (!incomingVal || typeof incomingVal !== 'object') return incomingVal;
  if (incomingVal._methodName === 'increment' || incomingVal.__op === 'increment') {
    const delta = extractIncrementOperand(incomingVal);
    const base = typeof currentVal === 'number' && !isNaN(currentVal) ? currentVal : Number(currentVal) || 0;
    const sum = base + delta;
    return Math.abs(sum) < 0.005 ? 0 : Number(sum.toFixed(8));
  }
  if (incomingVal._methodName === 'serverTimestamp' || incomingVal.__sentinel === 'serverTimestamp') {
    const nowIso = new Date().toISOString();
    const ms = Date.now();
    return {
      __type: 'timestamp',
      seconds: Math.floor(ms / 1000),
      nanoseconds: (ms % 1000) * 1000000,
      iso: nowIso,
    };
  }
  if (incomingVal._methodName === 'arrayUnion') {
    const elements = extractArrayElements(incomingVal);
    if (elements) {
      const arr = Array.isArray(currentVal) ? [...currentVal] : [];
      for (const el of elements) {
        if (!arr.includes(el)) arr.push(el);
      }
      return arr;
    }
  }
  if (incomingVal._methodName === 'arrayRemove') {
    const elements = extractArrayElements(incomingVal);
    if (elements) {
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
    outObj[subK] = resolveFirestoreTransformValue(baseObj[subK], subV);
  }
  return outObj;
}

export function applyLocalDocUpdate(
  docPath: string,
  payloadData: Record<string, any>,
  baseData?: Record<string, any> | null,
  merge = true
): Record<string, any> {
  const clean = normalizeDocPath(docPath);
  const id = clean.split('/').pop() || '';
  const store = loadStore();
  const storedExisting = store.docs[clean]?.data || {};
  const existingData: Record<string, any> = merge
    ? { ...(baseData || {}), ...storedExisting }
    : {};

  const nextData: Record<string, any> = JSON.parse(JSON.stringify(existingData));

  for (const [k, v] of Object.entries(payloadData || {})) {
    if (v === undefined) continue;
    if (k.includes('.')) {
      const parts = k.split('.');
      let cursor = nextData;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!cursor[part] || typeof cursor[part] !== 'object' || Array.isArray(cursor[part])) {
          cursor[part] = {};
        }
        cursor = cursor[part];
      }
      const leafKey = parts[parts.length - 1];
      cursor[leafKey] = resolveFirestoreTransformValue(cursor[leafKey], v);
    } else {
      nextData[k] = resolveFirestoreTransformValue(nextData[k], v);
    }
  }

  nextData.id = id;
  store.docs[clean] = {
    data: nextData,
    updatedAt: Date.now(),
  };
  saveStore(store);
  return nextData;
}

export function addLocalCollectionDoc(
  collectionPath: string,
  payloadData: Record<string, any>
): { id: string; data: Record<string, any> } {
  const cleanCol = normalizeDocPath(collectionPath);
  const id = `loc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const docPath = `${cleanCol}/${id}`;
  const resolved = applyLocalDocUpdate(docPath, payloadData, null, false);
  return { id, data: resolved };
}

export function queryLocalCollection(
  collectionPath: string | null,
  collectionGroup: string | null,
  filters?: Array<{ field: string; op: string; value?: any }>,
  orders?: Array<{ field: string; dir: string }>,
  limitCount?: number | null
): Record<string, any>[] {
  const store = loadStore();
  const cleanCol = collectionPath ? normalizeDocPath(collectionPath) : null;
  const colSegments = cleanCol ? cleanCol.split('/') : [];

  let results: Record<string, any>[] = [];

  for (const [docPath, entry] of Object.entries(store.docs)) {
    if (!entry?.data) continue;
    const segs = docPath.split('/');
    if (collectionGroup) {
      if (segs.length >= 2 && segs[segs.length - 2] === collectionGroup) {
        results.push({ ...entry.data, id: segs[segs.length - 1] });
      }
    } else if (cleanCol) {
      if (
        segs.length === colSegments.length + 1 &&
        docPath.startsWith(cleanCol + '/')
      ) {
        results.push({ ...entry.data, id: segs[segs.length - 1] });
      }
    }
  }

  if (Array.isArray(filters) && filters.length > 0) {
    results = results.filter((doc) =>
      filters.every((f) => {
        const actual = doc[f.field];
        const expected = f.value;
        if (f.op === '==' || f.op === 'EQUAL') return actual === expected;
        if (f.op === '!=' || f.op === 'NOT_EQUAL') return actual !== expected;
        if (f.op === '>' || f.op === 'GREATER_THAN') return actual > expected;
        if (f.op === '>=' || f.op === 'GREATER_THAN_OR_EQUAL') return actual >= expected;
        if (f.op === '<' || f.op === 'LESS_THAN') return actual < expected;
        if (f.op === '<=' || f.op === 'LESS_THAN_OR_EQUAL') return actual <= expected;
        if ((f.op === 'in' || f.op === 'IN') && Array.isArray(expected)) return expected.includes(actual);
        return true;
      })
    );
  }

  if (Array.isArray(orders) && orders.length > 0) {
    const primary = orders[0];
    const isAsc = String(primary.dir || 'desc').toLowerCase() === 'asc';
    results.sort((a, b) => {
      const getVal = (item: any) => {
        const v = item?.[primary.field];
        if (typeof v === 'number') return v;
        if (v && typeof v === 'object' && typeof v.seconds === 'number') return v.seconds * 1000;
        if (typeof v === 'string') {
          const t = new Date(v).getTime();
          if (!isNaN(t)) return t;
        }
        const fb = item?.date || item?.createdAt;
        if (fb) {
          const t = new Date(fb).getTime();
          if (!isNaN(t)) return t;
        }
        return 0;
      };
      const tA = getVal(a);
      const tB = getVal(b);
      return isAsc ? tA - tB : tB - tA;
    });
  }

  if (limitCount && Number(limitCount) > 0) {
    results = results.slice(0, Number(limitCount));
  }

  return results;
}
