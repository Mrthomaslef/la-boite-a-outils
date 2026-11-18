// Network-first pour toujours voir la dernière version, cache en secours hors-ligne.
const CACHE = "bao-msk-v1";
const ASSETS = ["./", "index.html", "styles.css?v=1", "app.js?v=1", "data/embedded_data.js?v=1", "manifest.webmanifest", "assets/icon.svg"];
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); });
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; })
    .catch(() => caches.match(e.request)));
});
