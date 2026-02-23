const CACHE = 'expenses-pwa-v3';
const scopePath = new URL(self.registration.scope).pathname;
const basePath = scopePath.endsWith('/') ? scopePath : `${scopePath}/`;
const apiPath = `${basePath}api/`;
const ASSETS = [
  basePath,
  `${basePath}index.html`,
  `${basePath}manifest.json`,
  `${basePath}icon.svg`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isApiCall = isSameOrigin && requestUrl.pathname.startsWith(apiPath);

  if (isApiCall) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isNavigation = event.request.mode === 'navigate';
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch(() => caches.match(`${basePath}index.html`))
    );
    return;
  }

  if (!isSameOrigin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match(basePath));
    })
  );
});
