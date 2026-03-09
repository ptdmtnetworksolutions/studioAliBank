self.addEventListener('install', (event) => {
  console.log('AliBank Service Worker: Installed');
});

self.addEventListener('activate', (event) => {
  console.log('AliBank Service Worker: Activated');
});

self.addEventListener('fetch', (event) => {
  // Handler dasar untuk PWA
});