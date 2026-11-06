/* Haven's Garden v0.9-birthday-preview — Franz greenhouse-layers-v1; cache-first art */
const CACHE = 'havens-garden-birthday-preview-v0.9-birthday-preview';
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
  './assets/greenhouse-layers-v1/maps/small.json',
  './assets/greenhouse-layers-v1/maps/medium.json',
  './assets/greenhouse-layers-v1/maps/large.json',
  './assets/greenhouse-layers-v1/maps/outdoor.json',
  './assets/greenhouse-layers-v1/maps/growth.json',
  './assets/greenhouse-layers-v1/plates/greenhouse-small-interior-nolip.webp',
  './assets/greenhouse-layers-v1/layers/small/soil_dry.webp',
  './assets/greenhouse-layers-v1/layers/small/front_lip.webp',
  './assets/greenhouse-layers-v1/growth/seedling.webp',
  './assets/greenhouse-layers-v1/growth/bloom.webp',
  './assets/icon/app-icon.png',
  './assets/icon/app-icon-192.png',
  './assets/icon/app-icon-512.png',
  './assets/plates/meadow-day.webp',
  './assets/character/haven-run.png',
  './assets/props/basket.png',
  './assets/props/watering-can.png',
  './assets/bugs/bee.png',
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
    u.pathname.endsWith('/');
  const isSW = u.pathname.endsWith('/sw.js') || u.pathname.endsWith('sw.js');
  const isJS = u.pathname.endsWith('.js');

  if (isHTML || isSW) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  if (isJS) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      });
    })
  );
});
