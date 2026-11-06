/* Haven's Garden v0.9-cbn2 — network-first HTML; concept comps + systems */
const CACHE = 'havens-garden-preview-v0.9-cbn2';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './js/assets.js',
  './js/audio.js',
  './js/systems.js',
  './js/game.js',
  './assets/icon/app-icon.png',
  './assets/icon/app-icon-192.png',
  './assets/icon/app-icon-512.png',
  './assets/character/haven-front.png',
  './assets/meadow/meadow-day.webp',
  './assets/bouquet/bouquet-full.png',
  './assets/concept/01b-meadow-wider.jpg',
  './assets/concept/03b-bug-chase-wider.jpg',
  './assets/concept/11-hive-and-jars.jpg',
  './assets/concept/13-shop-upgrades.jpg',
  './assets/plates/meadow-day.webp',
  './assets/character/haven-run.png',
  './assets/props/basket.png',
  './assets/bugs/bee.png',
  './assets/cbn/contact-12-subjects.jpg',
  './assets/cbn/page-01-bee-close-easy.webp'
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

  // Network-first for JS so v0.9-cbn2 ships promptly; fall back to cache
  if (u.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const clone = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return r;
        })
        .catch(() => caches.match(e.request))
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
