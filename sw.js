const CACHE_NAME = "carnet-exploits-v2"; // v2 : force le renouvellement du cache existant
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
  // firebase-config.js retiré volontairement : ce fichier change parfois
  // et ne doit jamais rester bloqué en cache.
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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

self.addEventListener("fetch", (event) => {
  const url = event.request.url;

  // Firebase : toujours réseau, jamais de cache
  if (url.includes("googleapis.com") || url.includes("gstatic.com")) {
    return;
  }

  // firebase-config.js : réseau en priorité (network-first), cache en secours
  // uniquement si le réseau est indisponible
  if (url.includes("firebase-config.js")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Reste des fichiers : cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
