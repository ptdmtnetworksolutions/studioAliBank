
/**
 * AliBank Service Worker - Versi Produksi 3.0
 * Diperlukan untuk validasi WebAPK Native dan penghapusan badge browser.
 */

const CACHE_NAME = 'alibank-v3-cache';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handler fetch minimal wajib untuk memicu 'Installable' status di Chrome/Android
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
  } else {
    event.respondWith(fetch(event.request));
  }
});
