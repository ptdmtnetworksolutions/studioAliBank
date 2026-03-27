// AliBank Official Service Worker
const CACHE_NAME = 'alibank-v3-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.webmanifest',
  'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect x=\'0\' y=\'0\' width=\'100\' height=\'100\' fill=\'black\'/%3E%3Cpath d=\'M50 20C52 48 80 50 80 50C80 50 52 52 50 80C48 52 20 50 20 50C20 50 48 48 50 20Z\' fill=\'%23B8860B\'/%3E%3C/svg%3E'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Biarkan browser menangani fetch standar
  // Namun fetch handler ini wajib ada agar PWA dianggap Installable oleh Chrome
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
