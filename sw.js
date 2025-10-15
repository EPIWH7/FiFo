// sw.js — аккуратное кэширование только GET и только статического
const CACHE = 'fifo-mobile-pplx-v2';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

// Домены, которые НЕЛЬЗЯ трогать сервис-воркеру (Firebase, Perplexity, твой воркер и т.п.)
const NETWORK_ONLY_HOSTS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'www.googleapis.com',
  'www.gstatic.com',
  'gstatic.com',
  'perplexity.ai',
  'workers.dev'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 1) Никогда не трогаем не-GET (POST/PUT/DELETE) — это как раз login/signup
  if (req.method !== 'GET') return;

  // 2) Внешние критичные домены — строго сеть
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.endsWith(h))) return;

  // 3) Для навигации — network-first с офлайн-фолбэком
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 4) Для прочих GET статики — cache-first
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Кэшируем только успешные и кэшепригодные ответы
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});