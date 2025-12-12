// Offline detection and caching service
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class OfflineCacheService {
  private static instance: OfflineCacheService;
  private isOnline = navigator.onLine;
  private cachePrefix = 'jasaweb-cache-';
  private defaultTTL = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): OfflineCacheService {
    if (!OfflineCacheService.instance) {
      OfflineCacheService.instance = new OfflineCacheService();
    }
    return OfflineCacheService.instance;
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      window.dispatchEvent(
        new CustomEvent('offline-status-changed', {
          detail: { isOnline: true },
        })
      );
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      window.dispatchEvent(
        new CustomEvent('offline-status-changed', {
          detail: { isOnline: false },
        })
      );
    });
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // Cache management
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
      };

      localStorage.setItem(`${this.cachePrefix}${key}`, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to cache data:', error);
      // Clean up old entries if storage is full
      this.cleanup();
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${this.cachePrefix}${key}`);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);

      // Check if expired
      if (Date.now() > entry.expiry) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      this.remove(key);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(`${this.cachePrefix}${key}`);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  // Clean up expired entries
  cleanup(): void {
    const keys = Object.keys(localStorage);
    const now = Date.now();

    keys.forEach((key) => {
      if (key.startsWith(this.cachePrefix)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          if (entry.expiry && now > entry.expiry) {
            localStorage.removeItem(key);
          }
        } catch {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      }
    });
  }

  // Get cache size in bytes (approximate)
  getCacheSize(): number {
    let size = 0;
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(this.cachePrefix)) {
        const item = localStorage.getItem(key);
        if (item) {
          size += key.length + item.length;
        }
      }
    });

    return size;
  }

  // Enhanced fetch with offline support
  async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    cacheKey: string,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    // If online, try to fetch fresh data
    if (this.isOnline) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the fresh data
        this.set(cacheKey, data, ttl);

        return data;
      } catch (error) {
        console.warn('Network request failed, trying cache:', error);

        // Fall back to cache if network fails
        const cachedData = this.get<T>(cacheKey);
        if (cachedData) {
          return cachedData;
        }

        throw error;
      }
    }

    // If offline, try cache
    const cachedData = this.get<T>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    throw new Error('Offline and no cached data available');
  }

  // Batch operations for better performance
  async fetchMultipleWithCache<T>(
    requests: Array<{
      url: string;
      options?: RequestInit;
      cacheKey: string;
      ttl?: number;
    }>
  ): Promise<Record<string, T>> {
    const results: Record<string, T> = {};

    if (this.isOnline) {
      // Try to fetch all in parallel when online
      const promises = requests.map(async (req) => {
        try {
          const data = await this.fetchWithCache<T>(
            req.url,
            req.options || {},
            req.cacheKey,
            req.ttl
          );
          return { key: req.cacheKey, data };
        } catch (error) {
          console.warn(`Failed to fetch ${req.cacheKey}:`, error);
          return null;
        }
      });

      const settled = await Promise.allSettled(promises);
      settled.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          results[result.value.key] = result.value.data;
        }
      });
    } else {
      // Load from cache when offline
      requests.forEach((req) => {
        const cachedData = this.get<T>(req.cacheKey);
        if (cachedData) {
          results[req.cacheKey] = cachedData;
        }
      });
    }

    return results;
  }
}

// Export singleton instance
export const offlineCache = OfflineCacheService.getInstance();
