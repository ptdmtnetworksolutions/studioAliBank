
/**
 * AliBank V3 - Professional Service Worker
 * Diperlukan untuk validasi Instalasi WebAPK (Aplikasi Native).
 */

const CACHE_NAME = 'alibank-v3-production-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

/**
 * Fetch handler wajib ada agar browser menganggap aplikasi "Installable".
 * Ini memungkinkan aplikasi berjalan offline di masa depan.
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
