const CACHE_NAME = 'fieldapp-wrapper-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];
// Your Apps Script URL (the iframe URL) — optional to attempt caching it
const APP_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhnETVFrBNeqrzpC1h084tg6K6nJtcT6l5837l4JqumxkFTmeqjzPOjbxbxArnbid9og/exec';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // cache static wrapper assets
        const requests = ASSETS.map(u => new Request(u, {cache: 'reload'}));
        // try to add the apps script url as no-cors (may produce opaque response)
        requests.push(new Request(APP_SCRIPT_URL, {mode: 'no-cors'}));
        return cache.addAll(requests).catch(()=>{ /* ignore individual failures */ });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(resp => {
        // cache same-origin responses for offline
        if (event.request.url.startsWith(self.location.origin) && resp && resp.status === 200) {
          const respClone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
        }
        return resp;
      }).catch(()=> {
        // fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
