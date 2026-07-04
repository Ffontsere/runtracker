const CACHE = 'runtracker-v42';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './chart.umd.min.js',
  './papaparse.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))));
});

self.addEventListener('message', e => {
  if (e.data === 'skip') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// NETWORK-FIRST for navigation/HTML so updates always apply; cache as offline fallback.
self.addEventListener('fetch', e => {
  const req = e.request;
  const isHTML = req.mode === 'navigate' || (req.destination === 'document') || req.url.endsWith('index.html') || req.url.endsWith('/');
  if (isHTML) {
    e.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
  } else {
    // cache-first for static assets (libs, fonts)
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(res => {
        if (res.status === 200) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(req, clone)); }
        return res;
      }).catch(() => null))
    );
  }
});
