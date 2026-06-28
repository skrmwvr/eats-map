const CACHE_NAME = 'sun-map-v6';
const ASSETS_TO_CACHE = [
  './index.html',
  './index.css',
  './app.js',
  './manifest.webmanifest',
  './fill-data/venue/nashville-transit-parking-options.json',
  './fill-data/event/victory-garden-tour-history.json',
  './fill-data/band/young-the-giant-song-sentiment.json'
];

// Install: Cache core shell and initial data
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Pre-caching static assets and offline data');
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

// Fetch: Cache first, fallback to network for shells. Network first for dynamic JSON files.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  
  // Network first strategy for bundle JSON files to allow live show-day updates
  if (url.pathname.includes('/bundles/') || url.pathname.includes('/fill-data/')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache first strategy for static shell
    e.respondWith(
      caches.match(e.request).then((cachedRes) => {
        return cachedRes || fetch(e.request);
      })
    );
  }
});
