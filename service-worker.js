const CACHE_NAME = 'internetcheck-20250502-1555';
const PRECACHE_URLS = [
  '/', '/index', '/index.html', '/offline', '/offline.html',
  '/res/icons/iconfinder_Web_171330_128.png',
  '/res/icons/iconfinder_Web_171330_150.png',
  '/res/css/bootstrap.min.css',
  '/res/js/jquery-3.5.1.min.js',
  '/res/js/bootstrap.bundle.min.js',
  '/res/js/app.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      // Redirect only for navigation (HTML page loads)
      if (event.request.mode === 'navigate') {
        return Response.redirect('/offline', 302); // or '/offline.html'
      }
      // For static resources (images, CSS, etc), try cache
      return caches.match(event.request);
    })
  );
});
