const CACHE = 'fifo-mobile-pplx-v1';
const CORE = ['./','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/maskable-192.png','./icons/maskable-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))) );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(c=>c || fetch(req).then(r=>{
    const copy = r.clone(); caches.open(CACHE).then(cache=>cache.put(req, copy)); return r;
  })));
});