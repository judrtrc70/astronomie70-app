const CACHE_NAME = "ciel70-shell-v1";
const SHELL_FILES = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Coquille de l'appli : cache d'abord (rapide, fonctionne hors-ligne).
// Tout le reste (agenda Google, carte du ciel, ISS, éphémérides) part au réseau
// car ce sont des données live qui n'ont pas de sens hors-ligne.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isShellRequest = url.origin === self.location.origin;

  if (!isShellRequest) return; // laisse passer les requêtes externes normalement

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
