// sw.js — офлайн-кэш статики, не трогаем Firebase/Perplexity/Workers
const CACHE = 'fifo-pwa-v5';
const CORE = [
  './','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/maskable-192.png','./icons/maskable-512.png'
];
const NETWORK_ONLY_HOSTS = [
  'identitytoolkit.googleapis.com','securetoken.googleapis.com',
  'firestore.googleapis.com','firebaseinstallations.googleapis.com',
  'www.googleapis.com','www.gstatic.com','gstatic.com',
  'api.perplexity.ai','workers.dev'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (NETWORK_ONLY_HOSTS.some(h=>url.hostname.endsWith(h))) return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).catch(()=>caches.match('./index.html'))); return; }
  e.respondWith((async()=>{ const cached=await caches.match(r); if(cached){ fetch(r).then(res=>{ if(res.ok&&(res.type==='basic'||res.type==='opaque')) caches.open(CACHE).then(c=>c.put(r,res.clone())); }).catch(()=>{}); return cached; } try{ const res=await fetch(r); if(res.ok&&(res.type==='basic'||res.type==='opaque')) caches.open(CACHE).then(c=>c.put(r,res.clone())); return res; }catch{ return new Response('Offline',{status:503}); } })());
});