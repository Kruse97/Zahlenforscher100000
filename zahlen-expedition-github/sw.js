/* Offline-Unterstützung: zuerst das Netz (damit Änderungen sofort ankommen), sonst der Speicher. */
const NAME = 'zahlen-expedition-1';
const DATEIEN = ['./', 'index.html', 'style.css', 'zahlen.js', 'aufgaben.js', 'abzeichen.js', 'bausteine.js', 'uebungen.js',
  'spiele.js', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'andika-400.woff2', 'andika-700.woff2', 'baloo-700.woff2', 'baloo-800.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(NAME).then((c) => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((namen) => Promise.all(namen.filter((n) => n.startsWith('zahlen-expedition-') && n !== NAME).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(NAME).then((c) => c.put(e.request, kopie));
        }
        return antwort;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
