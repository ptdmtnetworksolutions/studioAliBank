/**
 * AliBank V3 Production Service Worker
 * Memberikan kemampuan offline dan validasi instalasi Native PWA.
 */

const CACHE_NAME = 'alibank-v3-cache-v1';
const OFFLINE_URL = '/offline.html';

// File minimal yang perlu di-cache untuk validasi PWA
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/globals.css'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

/**
 * Fetch handler wajib ada agar browser memicu dialog "Install App" 
 * alih-alih hanya "Add to Home Screen".
 */
self.addEventListener('fetch', (event) => {
  // Strategi Network-First untuk data perbankan yang sensitif
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
