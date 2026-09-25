// Offline support for Merhaba Antalya.
// Everything the app needs is precached on install. Requests are answered from the
// cache first (instant, and works with no signal) while a fresh copy is fetched in
// the background, so an updated page shows up on the next launch.
// Bump VERSION when this file's ASSETS list changes.
const VERSION = 'v1';
const CACHE = 'merhaba-antalya-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('merhaba-antalya-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  const network = fetch(req).then(res => {
    if (!res.ok) return res;
    const copy = res.clone();
    return caches.open(CACHE).then(cache => cache.put(req, copy)).then(() => res);
  });
  event.waitUntil(network.then(() => {}, () => {}));

  event.respondWith(
    caches.match(req, { ignoreSearch: true })
      .then(hit => hit || network)
      .catch(() => req.mode === 'navigate' ? caches.match('./index.html') : Response.error())
  );
});
