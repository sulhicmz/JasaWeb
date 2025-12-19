/* eslint-disable no-undef */
const CACHE_VERSION = 'jasaweb-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Cache strategies based on resource type
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'cache-first',
  fonts: 'cache-first',
};

// Critical static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/about',
  '/services',
  '/portfolio',
  '/contact',
  '/manifest.json',
  // Critical CSS and JS
  '/_astro/client.*.js',
  '/_astro/preload-helper.*.js',
  '/_astro/index.*.css',
  // Fonts
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
      // Force the new service worker to become active
      self.skipWaiting(),
    ])
  );
});

// Fetch event - implement different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Different strategies for different resource types
  let strategy = CACHE_STRATEGIES.static;

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    strategy = CACHE_STRATEGIES.api;
  }
  // Images - cache first
  else if (request.destination === 'image' || url.searchParams.has('format')) {
    strategy = CACHE_STRATEGIES.images;
  }
  // Fonts - cache first
  else if (
    request.destination === 'font' ||
    url.hostname.includes('fonts.googleapis.com')
  ) {
    strategy = CACHE_STRATEGIES.fonts;
  }

  event.respondWith(handleRequest(request, strategy));
});

// Handle requests based on strategy
async function handleRequest(request, strategy) {
  try {
    switch (strategy) {
      case 'cache-first':
        return await cacheFirst(request);
      case 'network-first':
        return await networkFirst(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('Service Worker error:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Cache first strategy - good for static assets, images, fonts
async function cacheFirst(request) {
  const cache = await caches.open(getCacheName(request));
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Clone and cache the response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    // If network fails and no cached version, return appropriate fallback
    if (request.destination === 'image') {
      return new Response(
        '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280">Image unavailable</text></svg>',
        {
          headers: { 'Content-Type': 'image/svg+xml' },
        }
      );
    }
    throw error;
  }
}

// Network first strategy - good for API calls
async function networkFirst(request) {
  const cache = await caches.open(getCacheName(request));

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the successful response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }

    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached version and network failed, throw error
    throw error;
  }
}

// Get appropriate cache name based on request type
function getCacheName(request) {
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    return API_CACHE;
  }

  if (request.destination === 'image' || request.destination === 'font') {
    return STATIC_CACHE;
  }

  return DYNAMIC_CACHE;
}

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!cacheName.startsWith(CACHE_VERSION)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all open pages
        return self.clients.claim();
      })
  );
});

// Background sync for offline actions (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle any queued offline actions
  console.log('Background sync completed');
}

// Handle push notifications (if implemented later)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from JasaWeb',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(self.registration.showNotification('JasaWeb', options));
});
