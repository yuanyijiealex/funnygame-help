// Minimal service worker for stability (no caching)
const VERSION = 'stability-2';

self.addEventListener('install', event => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clear all caches and take control
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n)))).then(() => self.clients.claim())
  );
});

// Network-only; fallback to offline page for navigations
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = new Request(event.request, { cache: 'reload' });
  event.respondWith(
    fetch(req).catch(() => {
      if (event.request.mode === 'navigate') {
        return fetch('/offline.html');
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});

// Ignore page-caching messages for stability
self.addEventListener('message', () => {});

console.log('[Service Worker] Stability mode active');
