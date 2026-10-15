// PhiksNiyar Service Worker for PWA Offline Resilience
const CACHE_NAME = 'phiksniyar-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/phiksniyar-logo.png',
  '/logo.png',
  '/icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA: Non-fatal cache add error during install:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip API routes and external requests from aggressive caching
  if (url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // HTML Page Navigation: Network First, Fallback to Offline Page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return caches.match('/offline.html');
        });
      })
    );
    return;
  }

  // Static Assets (Images, Icons, CSS, JS): Cache First with Network Fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Fetch in background to revalidate cache
        fetch(request)
          .then((fresh) => {
            if (fresh && fresh.status === 200) {
              caches.open(CACHE_NAME).then((c) => c.put(request, fresh));
            }
          })
          .catch(() => {});
        return cached;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
        return response;
      });
    })
  );
});
