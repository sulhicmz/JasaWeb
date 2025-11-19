interface ServiceWorkerRegistrationOptions {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
  }

  public async register(
    options: ServiceWorkerRegistrationOptions = {}
  ): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker is not supported in this browser');
      return false;
    }

    if (import.meta.env.SSR) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // New worker is available, show update notification
              options.onUpdate?.(registration);
            } else if (newWorker.state === 'installed') {
              // First install
              options.onSuccess?.(registration);
            }
          });
        }
      });

      // Check for existing updates
      if (registration.active) {
        options.onSuccess?.(registration);
      }

      console.log('Service Worker registered successfully');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      options.onError?.(error as Error);
      return false;
    }
  }

  public async unregister(): Promise<boolean> {
    if (!this.registration) {
      return true;
    }

    try {
      const success = await this.registration.unregister();
      this.registration = null;
      console.log('Service Worker unregistered successfully');
      return success;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  public async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  public async skipWaiting(): Promise<void> {
    if (!this.registration) {
      return;
    }

    const newWorker = this.registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  public getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  public isServiceWorkerSupported(): boolean {
    return this.isSupported;
  }

  // Performance monitoring
  public async getCacheMetrics(): Promise<{
    cacheNames: string[];
    totalSize: number;
    entries: Array<{ name: string; size: number }>;
  }> {
    if (!this.isSupported) {
      return { cacheNames: [], totalSize: 0, entries: [] };
    }

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      const entries: Array<{ name: string; size: number }> = [];

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        let cacheSize = 0;

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const size = await this.getResponseSize(response);
            cacheSize += size;
          }
        }

        totalSize += cacheSize;
        entries.push({ name: cacheName, size: cacheSize });
      }

      return { cacheNames, totalSize, entries };
    } catch (error) {
      console.error('Failed to get cache metrics:', error);
      return { cacheNames: [], totalSize: 0, entries: [] };
    }
  }

  public async clearCaches(): Promise<boolean> {
    if (!this.isSupported) {
      return false;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      console.log('All caches cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear caches:', error);
      return false;
    }
  }

  // Background sync
  public async registerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('Background Sync is not supported');
      return false;
    }

    try {
      await this.registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  // Push notifications
  public async subscribeToPushNotifications(
    publicKey: string
  ): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey),
      });

      console.log('Push subscription successful');
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private async getResponseSize(response: Response): Promise<number> {
    const clone = response.clone();
    const buffer = await clone.arrayBuffer();
    return buffer.byteLength;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
