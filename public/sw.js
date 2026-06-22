// fallow-ignore-next-line unused-files — registered at runtime via navigator.serviceWorker.register()
const CACHE_NAME = 'gamedeals-v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const EXCLUDED_PATHS = ['/api/', '/auth/', '/out/', '/_next/'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (EXCLUDED_PATHS.some((p) => url.pathname.startsWith(p))) return;
  if (url.origin !== self.location.origin) return;

  // Navigation requests: network-first (stale deals are worse than brief delay)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((c) => c || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate with TTL
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        const headerDate = cached.headers.get('sw-cached-at');
        const cachedAt = headerDate ? Number(headerDate) : 0;
        if (Date.now() - cachedAt < CACHE_TTL_MS) return cached;
      }
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            const headers = new Headers(clone.headers);
            headers.set('sw-cached-at', String(Date.now()));
            return clone.blob().then((blob) => {
              const stamped = new Response(blob, {
                status: clone.status,
                statusText: clone.statusText,
                headers,
              });
              event.waitUntil(caches.open(CACHE_NAME).then((c) => c.put(event.request, stamped)));
              return stamped;
            });
          }
          return cached || new Response('Offline', { status: 503 });
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
