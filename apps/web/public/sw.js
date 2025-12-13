const CACHE_VERSION = '2.0.0';
const STATIC_CACHE = `jasaweb-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `jasaweb-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `jasaweb-images-${CACHE_VERSION}`;

// Cache strategies
const STATIC_ASSETS = [
  '/',
  '/about',
  '/services',
  '/portfolio',
  '/contact',
  '/manifest.json',
  '/_astro/index.css',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
];

// Install event - cache critical static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to ensure new SW activates immediately
      self.skipWaiting(),
    ])
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.includes(CACHE_VERSION)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Network-first for API requests, Cache-first for static assets, Stale-while-revalidate for content
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle different request types
  if (url.origin === self.location.origin) {
    // Same origin requests
    if (url.pathname.startsWith('/api/')) {
      // Network first for API calls
      event.respondWith(networkFirst(request));
    } else if (isStaticAsset(request)) {
      // Cache first for static assets
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    } else if (isImage(request)) {
      // Cache first for images with longer TTL
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else {
      // Stale while revalidate for HTML pages
      event.respondWith(staleWhileRevalidate(request));
    }
  } else {
    // Cross-origin requests (CDN, external APIs)
    if (isImage(request)) {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
    } else {
      event.respondWith(networkFirst(request));
    }
  }
});

// Cache strategies implementation
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return (
      cachedResponse ||
      new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      })
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('Resource not available offline', {
      status: 404,
      statusText: 'Not Found',
    });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  });

  return cachedResponse || fetchPromise;
}

// Helper functions
function isStaticAsset(request) {
  return (
    request.url.includes('/_astro/') ||
    request.url.includes('.css') ||
    request.url.includes('.js') ||
    request.url.includes('.woff') ||
    request.url.includes('.woff2')
  );
}

function isImage(request) {
  return request.url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued requests when back online
  // Implementation depends on your app's needs
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from JasaWeb',
    icon: '/apple-touch-icon.png',
    badge: '/favicon-32x32.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/images/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('JasaWeb', options));
});
