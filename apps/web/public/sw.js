// public/sw.js - Service Worker for PWA functionality
const CACHE_NAME = 'jasaweb-v1';
const STATIC_CACHE = 'jasaweb-static-v1';
const API_CACHE = 'jasaweb-api-v1';
const IMAGE_CACHE = 'jasaweb-images-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/portal',
  '/portal/mobile',
  '/manifest.webmanifest',
  '/pwa-192x192.svg',
  '/pwa-512x512.svg',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/projects',
  '/api/user/profile',
  '/api/notifications',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE &&
              cacheName !== API_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different request types
  if (url.origin === self.location.origin) {
    // Same origin requests
    if (url.pathname.startsWith('/api/')) {
      // API requests - Network First with fallback to cache
      event.respondWith(handleApiRequest(request));
    } else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
      // Image requests - Cache First
      event.respondWith(handleImageRequest(request));
    } else {
      // Static assets - Cache First with network fallback
      event.respondWith(handleStaticRequest(request));
    }
  } else {
    // Cross-origin requests (CDN, external APIs)
    event.respondWith(handleCrossOriginRequest(request));
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache');

    // Fallback to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection and cached data not available',
        timestamp: Date.now(),
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for image request');

    // Return a placeholder image or error
    return new Response(
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image unavailable</text></svg>',
      {
        status: 404,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      }
    );
  }
}

// Handle static requests with Cache First strategy
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Check if cache is stale (older than 1 hour)
    const cacheDate = cachedResponse.headers.get('date');
    if (cacheDate) {
      const cacheTime = new Date(cacheDate).getTime();
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;

      if (now - cacheTime < oneHour) {
        return cachedResponse;
      }
    } else {
      return cachedResponse;
    }
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log(
      'Service Worker: Network failed for static request, returning cache if available'
    );

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return (
        caches.match('/offline.html') ||
        new Response(
          '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html',
            },
          }
        )
      );
    }

    throw error;
  }
}

// Handle cross-origin requests
async function handleCrossOriginRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Cross-origin request failed');
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle queued offline actions
  try {
    const offlineActions = await getOfflineActions();

    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.log('Service Worker: Failed to sync action:', action.id);
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed');
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New notification from JasaWeb',
    icon: '/pwa-192x192.svg',
    badge: '/pwa-192x192.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/pwa-192x192.svg',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/pwa-192x192.svg',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('JasaWeb', options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/portal'));
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/portal');
        }
      })
    );
  }
});

// Helper functions for offline storage (using IndexedDB)
async function getOfflineActions() {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineAction(actionId) {
  // In a real implementation, this would remove from IndexedDB
  console.log('Service Worker: Removing offline action:', actionId);
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_UPDATE') {
    // Force update of specific cache
    event.waitUntil(
      caches.delete(API_CACHE).then(() => {
        console.log('Service Worker: API cache cleared');
      })
    );
  }
});
