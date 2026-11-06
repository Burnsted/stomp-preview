/* havens-garden-v0-6-1 — network-first; tip cache only */
const C='havens-garden-v0-6-1';
const ASSETS=['./','./index.html','./sw.js'];
const OWN=k=>k.indexOf('havens-garden-')===0;
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>OWN(k)&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(cache=>cache.put(e.request,c));return r;}).catch(()=>caches.match(e.request)));
});
