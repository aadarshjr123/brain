/* Brain service worker (ADR-0010). Classic script, no build step.
 * Pages: network first, offline copy as fallback. Hashed assets: cache first. Other same-origin: stale-while-revalidate.
 * Bump VERSION when this file's logic changes: activation deletes caches from older versions. */
const VERSION = 'v1';
const PAGES = `brain-pages-${VERSION}`;
const ASSETS = `brain-assets-${VERSION}`;
const SHELL = ['/', '/explore', '/cheatsheet', '/offline'];
const MAX_ASSETS = 200;
const MAX_PAGES = 200;

/** Which strategy a request gets. Pure, so it is unit-tested. */
function routeFor(url, mode, method, origin) {
  if (method !== 'GET') return 'network';
  const u = new URL(url);
  if (u.origin !== origin) return 'network';
  if (u.pathname.startsWith('/_vercel/') || u.pathname.startsWith('/debug/')) return 'network';
  if (mode === 'navigate') return 'page';
  if (u.pathname.startsWith('/_next/static/')) return 'immutable';
  if (u.pathname.startsWith('/_next/')) return 'network'; // RSC payloads, image optimiser: always fresh
  return 'revalidate';
}

/** Keep at most `max` entries, dropping the oldest first. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names.filter((n) => n.startsWith('brain-') && !n.endsWith(VERSION)).map((n) => caches.delete(n)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const strategy = routeFor(request.url, request.mode, request.method, self.location.origin);
  if (strategy === 'network') return;

  if (strategy === 'page') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches
                .open(PAGES)
                .then((c) => c.put(request, copy))
                .then(() => trim(PAGES, MAX_PAGES)),
            );
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request, { ignoreSearch: true })) ||
            (await caches.match('/offline')) ||
            Response.error(),
        ),
    );
    return;
  }

  if (strategy === 'immutable') {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              event.waitUntil(
                caches
                  .open(ASSETS)
                  .then((c) => c.put(request, copy))
                  .then(() => trim(ASSETS, MAX_ASSETS)),
              );
            }
            return response;
          }),
      ),
    );
    return;
  }

  // revalidate
  event.respondWith(
    caches.match(request).then((hit) => {
      const fresh = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(ASSETS).then((c) => c.put(request, copy)));
          }
          return response;
        })
        .catch(() => hit || Response.error());
      return hit || fresh;
    }),
  );
});
