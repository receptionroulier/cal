const CACHE_NAME = 'roulierlh-v1';

// Fichiers du shell de l'app à mettre en cache
const SHELL = [
  '/cal/index.html',
  '/cal/r.html',
  '/cal/calr.html',
  '/cal/p.html',
  '/cal/manifest.json',
  '/cal/icon-192.png',
  '/cal/icon-512.png',
];

// Installation : mise en cache du shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch : network first pour les APIs, cache first pour le shell
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Toujours en live : APIs externes (ponts, calendrier Google)
  if (
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('havre-port.com') ||
    url.hostname.includes('workers.dev')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Shell : network first, fallback cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Mise à jour du cache si la requête réussit
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
