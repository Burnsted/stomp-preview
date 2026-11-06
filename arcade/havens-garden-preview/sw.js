/* Haven's Garden v0.9-birthday-polish — cache-first assets; network-first HTML/JS */
const CACHE = 'havens-garden-preview-v0.9-birthday-polish';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './sw.js',
  './js/assets.js',
  './js/audio.js',
  './js/systems.js',
  './js/nursery.js',
  './js/game.js',
  './assets/greenhouse/bed-map.json',
  './assets/icon/app-icon.png',
  './assets/icon/app-icon-192.png',
  './assets/icon/app-icon-512.png',
  './assets/plates/meadow-day.webp',
  './assets/character/haven-run.png',
  './assets/props/basket.png',
  './assets/props/watering-can.png',
  './assets/bugs/bee.png',
  './assets/interior/int-small-empty.webp',
  './assets/interior/int-medium-empty.webp',
  './assets/interior/int-large-empty.webp',
  './assets/cbn/page-13-one-daisy.webp'
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

  if (isHTML || u.pathname.endsWith('.js')) {
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

  // Cache-first for art so offline PWA works after install
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((r) => {
        const clone = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
        return r;
      }).catch(() => cached);
    })
  );
});
