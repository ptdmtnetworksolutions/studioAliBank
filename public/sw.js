// AliBank V3 - Minimalist Service Worker for WebAPK compatibility
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through fetching logic
  event.respondWith(fetch(event.request));
});