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
const CACHE_VERSION = 'phvd-v5-android-compatible';
const scope = new URL('./', self.location.href);

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Cache the first-load bundle as well as HTML, before offline use is promised.
      const index = new URL('./index.html', scope).href;
      const response = await fetch(index, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to cache PHVD shell');
      const html = await response.clone().text();
      await cache.put(index, response);
      const assets = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
        .map(match => new URL(match[1], scope))
        .filter(url => url.origin === scope.origin && url.pathname.startsWith(scope.pathname));
      await cache.addAll(assets.map(url => url.href));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('phvd-') && k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

// Network-first, falling back to cache. Keeps the app fresh when online and
// fully usable when it isn't.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(async (hit) => hit ||
          (event.request.mode === 'navigate' ? await caches.match(new URL('./index.html', scope).href) : null) ||
          new Response('Unavailable offline', { status: 503 }))
      )
  );
});
