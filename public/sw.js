/**
 * Offline cache for the PHVD web app.
 *
 * The app makes no network calls of its own - all measurements stay in
 * localStorage on the device - so caching the shell is enough to make it work
 * with no connection at all. That matters: a NICU is exactly the sort of place
 * where the wifi drops.
 *
 * Bump CACHE_VERSION on every deploy or clients will keep serving the old bundle.
 */
const CACHE_VERSION = 'phvd-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(['./', './index.html']))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first, falling back to cache. Keeps the app fresh when online and
// fully usable when it isn't.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match('./index.html'))
      )
  );
});
