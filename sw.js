// sw.js — аккуратное офлайн-кэширование для FiFo
// ВАЖНО: меняй версию CACHE при каждом существенном обновлении
const CACHE = 'fifo-pwa-v4';

// Статические файлы, которые точно нужны офлайн
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png'
];

// Домен(ы), для которых всегда сеть (без кэша): Firebase, Perplexity, твой Cloudflare Worker и т.п.
const NETWORK_ONLY_HOSTS = [
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'firestore.googleapis.com',
  'firebaseinstallations.googleapis.com',
  'www.googleapis.com',
  'www.gstatic.com',
  'gstatic.com',
  'api.perplexity.ai',
  'workers.dev' // все *.workers.dev
];

// ===== install: кладём базовые файлы в кэш
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

// ===== activate: чистим старые кэши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ===== fetch: строгие правила маршрутизации
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 0) Никогда не трогаем не-GET (логин/регистрация и прочие API)
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) Важные внешние домены — всегда напрямую в сеть
  if (NETWORK_ONLY_HOSTS.some((h) => url.hostname.endsWith(h))) {
    return; // не перехватываем — браузер пойдёт в сеть
  }

  // 2) Навигация (страничные переходы): сеть с офлайн-фолбэком на index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 3) Остальные GET-запросы на статику — cache-first с фоновым обновлением
  event.respondWith(cacheFirst(req));
});

async function cacheFirst(req) {
  const cached = await caches.match(req);
  if (cached) {
    // Параллельно пытаемся обновить кэш (stale-while-revalidate)
    fetchAndUpdate(req).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    // Кэшируем только успешные и кэшепригодные ответы с того же origin
    if (res.ok && (res.type === 'basic' || res.type === 'opaque')) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  } catch {
    // Если сети нет и в кэше пусто — ничего не делаем (вернётся ошибка по умолчанию)
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function fetchAndUpdate(req) {
  try {
    const res = await fetch(req);
    if (res.ok && (res.type === 'basic' || res.type === 'opaque')) {
      const copy = res.clone();
      const cache = await caches.open(CACHE);
      await cache.put(req, copy);
    }
  } catch {
    // тихо игнорируем сетевые ошибки при фоновой обновлялке
  }
}