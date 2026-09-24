const VERSION = 'paistar-blog-v1';
const ROOT = new URL(self.registration.scope).pathname;
const OFFLINE = `${ROOT}offline/`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll([ROOT, OFFLINE])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim(),
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy)); }
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE))));
    return;
  }
  const path = new URL(request.url).pathname;
  if (path.includes('/_astro/') || path.includes('/pagefind/') || /\.(?:png|webp|svg|ico)$/.test(path)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => { if (response.ok) { const copy = response.clone(); caches.open(VERSION).then((cache) => cache.put(request, copy)); } return response; })));
  }
});
