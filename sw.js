// sw.js — аккуратное кэширование, не трогаем Firebase и воркеры
const CACHE = 'fifo-mobile-pplx-v3';
const CORE = [
  './','./index.html','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png',
  './icons/maskable-192.png','./icons/maskable-512.png'
];

const NETWORK_ONLY_HOSTS = [
  'identitytoolkit.googleapis.com','securetoken.googleapis.com',
  'firestore.googleapis.com','firebaseinstallations.googleapis.com',
  'www.googleapis.com','www.gstatic.com','gstatic.com',
  'perplexity.ai','workers.dev'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const r = e.request;
  const url = new URL(r.url);

  // Вход/регистрация — это POST/не-GET, их не трогаем вообще
  if (r.method !== 'GET') return;

  // Важные внешние домены — строго сеть, без кэша
  if (NETWORK_ONLY_HOSTS.some(h => url.hostname.endsWith(h))) return;

  // Навигация — сеть с офлайн-фолбэком
  if (r.mode === 'navigate') {
    e.respondWith(fetch(r).catch(()=>caches.match('./index.html'))); 
    return;
  }

  // Статика — cache-first
  e.respondWith(
    caches.match(r).then(cached => cached || fetch(r).then(res=>{
      if (res.ok && res.type === 'basic') {
        caches.open(CACHE).then(c => c.put(r, res.clone()));
      }
      return res;
    }))
  );
});