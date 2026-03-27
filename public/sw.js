
/**
 * AliBank V3 Production Service Worker
 * Syarat utama untuk instalasi WebAPK Native dan penghapusan badge browser.
 */

const CACHE_NAME = 'alibank-v3-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
];

// Instalasi Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Aktivasi dan Pembersihan Cache Lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Handler (Wajib ada agar dianggap 'Installable' oleh Chrome)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
