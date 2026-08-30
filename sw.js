const CACHE_NAME = 'eats-map-foodieland-v11';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './app.js',
  './data_bundle.js',
  './map_logic.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './fonts/DMSans-VariableFont.woff2'
];

// Install: Cache core shell and initial data
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching FoodieLand static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('SW: Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache first strategy for offline speed
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      if (res) return res;
      return fetch(e.request).then((networkRes) => {
        if (!networkRes || networkRes.status !== 200 || networkRes.type !== 'basic') {
          return networkRes;
        }
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return networkRes;
      });
    }).catch(() => {
      if (e.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});
