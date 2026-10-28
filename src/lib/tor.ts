/**
 * AliBank Tor Network Verification Service
 * Checks client IP addresses against official Tor Project Exit Node registries.
 */

let exitNodesCache: Set<string> | null = null;
let lastCacheFetchTime = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Checks if an IP is a local/private network address.
 */
export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const cleanIp = ip.trim();
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('172.16.') ||
    cleanIp.startsWith('172.17.') ||
    cleanIp.startsWith('172.18.') ||
    cleanIp.startsWith('172.19.') ||
    cleanIp.startsWith('172.20.') ||
    cleanIp.startsWith('172.21.') ||
    cleanIp.startsWith('172.22.') ||
    cleanIp.startsWith('172.23.') ||
    cleanIp.startsWith('172.24.') ||
    cleanIp.startsWith('172.25.') ||
    cleanIp.startsWith('172.26.') ||
    cleanIp.startsWith('172.27.') ||
    cleanIp.startsWith('172.28.') ||
    cleanIp.startsWith('172.29.') ||
    cleanIp.startsWith('172.30.') ||
    cleanIp.startsWith('172.31.') ||
    cleanIp.startsWith('fc00:') ||
    cleanIp.startsWith('fe80:')
  );
}

/**
 * Fetches the active Tor Bulk Exit List from the official Tor Project servers.
 */
export async function getTorExitNodes(): Promise<Set<string>> {
  const now = Date.now();
  if (exitNodesCache && now - lastCacheFetchTime < CACHE_TTL_MS) {
    return exitNodesCache;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://check.torproject.org/torbulkexitlist', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AliBank-Tor-Security-Guard/1.0'
      },
      next: { revalidate: 1800 } // Next.js fetch cache if available
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const text = await res.text();
      const ips = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'));

      if (ips.length > 50) {
        exitNodesCache = new Set(ips);
        lastCacheFetchTime = now;
        return exitNodesCache;
      }
    }
  } catch (error) {
    console.warn('[TorGuard] Failed to fetch torbulkexitlist from Tor Project, falling back:', error);
  }

  // Return existing cache or empty set if fetch failed
  return exitNodesCache || new Set<string>();
}

/**
 * Verifies whether a given IP address belongs to the Tor network.
 * 1. Checks memory-cached Tor bulk exit list
 * 2. Fallback to Tor Project Onionoo API
 */
export async function isTorExitNode(ip: string): Promise<boolean> {
  if (!ip) return false;
  const cleanIp = ip.trim();

  // Step 1: Check in cached bulk exit nodes list
  const exitNodes = await getTorExitNodes();
  if (exitNodes.has(cleanIp)) {
    return true;
  }

  // Step 2: Fallback query directly to Tor Project Onionoo API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`https://onionoo.torproject.org/details?search=${encodeURIComponent(cleanIp)}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AliBank-Tor-Security-Guard/1.0' }
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.relays) && data.relays.length > 0) {
        const isExit = data.relays.some((relay: any) => 
          Array.isArray(relay.flags) && relay.flags.includes('Exit')
        );
        if (isExit) {
          if (exitNodesCache) exitNodesCache.add(cleanIp);
          return true;
        }
      }
    }
  } catch (error) {
    // Onionoo lookup timed out or failed
  }

  return false;
}

/**
 * Extracts the real client IP from incoming request headers.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}
