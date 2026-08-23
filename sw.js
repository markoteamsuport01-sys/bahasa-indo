/* Service worker — offline shell cache.
   Bump CACHE version whenever the shell changes to force update. */
const CACHE = 'bic-shell-v5';
const SHELL = [
  './',
  './index.html',
  './admin.html',
  './app.css',
  './shared.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // API + non-GET: always network, never cache (dynamic data).
  if (req.method !== 'GET' || url.pathname.startsWith('/api/')) {
    e.respondWith(fetch(req).catch(() => new Response(
      JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } }
    )));
    return;
  }

  // Shell + assets: cache-first, refresh in background.
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && (url.origin === location.origin)) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
