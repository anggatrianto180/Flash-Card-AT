// Improved Service Worker for Flash-Card-AT
const CACHE_VERSION = 'v2';
const PRECACHE = `flashcard-pro-cache-${CACHE_VERSION}`;
const RUNTIME = 'flashcard-runtime-cache';

// Files to precache for offline fallback
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install - pre-cache important resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(PRECACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== PRECACHE && key !== RUNTIME) {
          return caches.delete(key);
        }
      })
    ))
    .then(() => self.clients.claim())
  );
});

// Fetch handler
self.addEventListener('fetch', event => {
  const request = event.request;

  // Always handle navigation requests (SPA) with network-first, then cache, then offline page
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Put a copy of the response in the cache for offline use
          const copy = response.clone();
          caches.open(PRECACHE).then(cache => cache.put('/index.html', copy)).catch(()=>{});
          return response;
        })
        .catch(() => caches.match('/index.html').then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // For requests to our precached URLs (static assets), use cache-first strategy
  const url = new URL(request.url);
  const isPrecached = PRECACHE_URLS.some(u => {
    try { return new URL(u, location).href === request.url; } catch(e) { return false; }
  });

  if (isPrecached) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(networkRes => {
        caches.open(PRECACHE).then(cache => cache.put(request, networkRes.clone()));
        return networkRes;
      }))
    );
    return;
  }

  // For other requests (APIs, images), use runtime cache with network-first fallback to cache
  event.respondWith(
    fetch(request).then(networkResponse => {
      // save in runtime cache
      return caches.open(RUNTIME).then(cache => {
        try { cache.put(request, networkResponse.clone()); } catch(e) {}
        return networkResponse;
      });
    }).catch(() => caches.match(request))
  );
});

// Allow the page to trigger skipWaiting via postMessage
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
