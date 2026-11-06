/* Haven's Garden v0.9-nursery — network-first HTML; Franz batch-2 assets */
const CACHE = 'havens-garden-preview-v4-nursery';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './js/assets.js',
  './js/audio.js',
  './js/game.js',
  './assets/icon/app-icon.png',
  './assets/icon/app-icon-192.png',
  './assets/icon/app-icon-512.png',
  './assets/character/haven-front.png',
  './assets/meadow/meadow-day.webp',
  './assets/bouquet/bouquet-full.png'
];

const OWN = (k) => k.indexOf('havens-garden-') === 0;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) =>
      Promise.all(ks.filter((k) => OWN(k) && k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;

  const isHTML =
    e.request.mode === 'navigate' ||
    (e.request.headers.get('accept') || '').includes('text/html') ||
    u.pathname.endsWith('.html') ||
    u.pathname.endsWith('/') ||
    u.pathname.endsWith('/sw.js');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request).then((m) => m || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return r;
      });
    })
  );
});
