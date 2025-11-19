const CACHE_NAME = 'jasaweb-v1';
const STATIC_CACHE_NAME = 'jasaweb-static-v1';
const DYNAMIC_CACHE_NAME = 'jasaweb-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/about',
  '/portfolio',
  '/services',
  '/contact',
  '/login',
  '/_astro/index.css',
  '/favicon.ico',
];

// Cache strategies
const cacheStrategies = {
  // Cache first for static assets
  static: async (request: Request): Promise<Response> => {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      return cached;
    }
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.warn('Failed to fetch static asset:', error);
      throw error;
    }
  },

  // Network first for API calls
  networkFirst: async (request: Request): Promise<Response> => {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    try {
      const response = await fetch(request);
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      console.warn('Network failed, trying cache:', error);
      const cached = await cache.match(request);
      if (cached) {
        return cached;
      }
      throw error;
    }
  },

  // Stale while revalidate for content
  staleWhileRevalidate: async (request: Request): Promise<Response> => {
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    const cached = await cache.match(request);
    
    const fetchPromise = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    });
    
    if (cached) {
      return cached;
    }
    
    return fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME && 
                cacheName !== CACHE_NAME) {
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
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests (except for specific domains)
  if (!url.origin.includes(self.location.origin) && 
      !url.origin.includes('fonts.googleapis.com') &&
      !url.origin.includes('cdn.jsdelivr.net')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Static assets - cache first
        if (url.pathname.includes('/_astro/') || 
            url.pathname.includes('/images/') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.woff') ||
            url.pathname.endsWith('.woff2')) {
          return await cacheStrategies.static(request);
        }
        
        // API calls - network first
        if (url.pathname.startsWith('/api/')) {
          return await cacheStrategies.networkFirst(request);
        }
        
        // HTML pages - stale while revalidate
        if (request.headers.get('accept')?.includes('text/html')) {
          return await cacheStrategies.staleWhileRevalidate(request);
        }
        
        // Default - network first
        return await cacheStrategies.networkFirst(request);
      } catch (error) {
        console.error('Service Worker: Fetch error:', error);
        
        // Return offline page for navigation requests
        if (request.headers.get('accept')?.includes('text/html')) {
          const cache = await caches.open(STATIC_CACHE_NAME);
          const offlinePage = await cache.match('/');
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        throw error;
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      (async () => {
        try {
          // Get pending actions from IndexedDB
          const pendingActions = await getPendingActions();
          
          // Process each pending action
          for (const action of pendingActions) {
            try {
              await fetch(action.url, action.options);
              await removePendingAction(action.id);
            } catch (error) {
              console.error('Failed to sync action:', action, error);
            }
          }
          
          console.log('Background sync completed');
        } catch (error) {
          console.error('Background sync failed:', error);
        }
      })()
    );
  }
});

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data?.text() || 'New notification from JasaWeb',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
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
  
  event.waitUntil(
    self.registration.showNotification('JasaWeb', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB (simplified implementation)
async function getPendingActions(): Promise<any[]> {
  // In a real implementation, this would use IndexedDB
  // For now, return empty array
  return [];
}

async function removePendingAction(id: string): Promise<void> {
  // In a real implementation, this would remove from IndexedDB
  console.log('Removing pending action:', id);
}

// Export for TypeScript
declare global {
  interface WorkerGlobalScope {
    skipWaiting(): Promise<void>;
    clients: Clients;
  }
  
  interface ExtendableEvent {
    waitUntil(promise: Promise<any>): void;
  }
  
  interface FetchEvent {
    request: Request;
    respondWith(promise: Promise<Response> | Response): void;
  }
  
  interface SyncEvent {
    tag: string;
    waitUntil(promise: Promise<any>): void;
  }
  
  interface PushEvent {
    data?: PushMessageData;
    waitUntil(promise: Promise<any>): void;
  }
  
  interface NotificationEvent {
    action: string;
    notification: Notification;
    waitUntil(promise: Promise<any>): void;
  }
}