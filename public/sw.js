// Service Worker sederhana untuk mendukung fitur PWA AliBank
const CACHE_NAME = 'alibank-cache-v1';

self.addEventListener('install', (event) => {
  console.log('AliBank SW installed');
});

self.addEventListener('fetch', (event) => {
  // Biarkan browser menangani network request secara normal
});