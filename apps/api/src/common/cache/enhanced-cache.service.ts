import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { logger } from '@jasaweb/config';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  l1?: boolean; // Use in-memory cache
  l2?: boolean; // Use Redis cache
  l3?: boolean; // Use query result cache
  key?: string; // Custom cache key
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  l1Hits: number;
  l2Hits: number;
  l3Hits: number;
}

/**
 * Enhanced multi-level caching service
 * L1: In-memory cache for frequently accessed data (5 min TTL)
 * L2: Redis cache for shared cache across instances (5 min TTL)
 * L3: Query result cache for complex database queries (10 min TTL)
 */
@Injectable()
export class EnhancedCacheService {
  private readonly l1Cache = new Map<
    string,
    { data: unknown; expiry: number }
  >();
  private readonly stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    l1Hits: 0,
    l2Hits: 0,
    l3Hits: 0,
  };

  // Default TTL values in seconds
  private readonly DEFAULT_TTL = {
    l1: 300, // 5 minutes
    l2: 300, // 5 minutes
    l3: 600, // 10 minutes
  };

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
    this.logger = logger;
  }

  private readonly logger: typeof logger;

  /**
   * Get data from cache with multi-level fallback
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { ttl = this.DEFAULT_TTL.l1, l1 = true, l2 = true } = options;

    // Try L1 cache (in-memory) first
    if (l1) {
      const l1Data = this.getL1<T>(key);
      if (l1Data !== null) {
        this.stats.hits++;
        this.stats.l1Hits++;
        return l1Data;
      }
    }

    // Try L2 cache (Redis)
    if (l2) {
      try {
        const l2Data = await this.cacheManager.get<T>(key);
        if (l2Data !== null && l2Data !== undefined) {
          this.stats.hits++;
          this.stats.l2Hits++;

          // Populate L1 cache for faster subsequent access
          if (l1) {
            this.setL1(key, l2Data, ttl);
          }

          return l2Data;
        }
      } catch (error) {
        this.logger.warn(`L2 cache error for key ${key}`, error);
      }
    }

    // L3 cache would be implemented here for query result caching
    // For now, we'll skip it as it requires additional infrastructure

    this.stats.misses++;
    return null;
  }

  /**
   * Set data in cache with multi-level storage
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { ttl = this.DEFAULT_TTL.l1, l1 = true, l2 = true } = options;

    this.stats.sets++;

    // Set in L1 cache (in-memory)
    if (l1) {
      this.setL1(key, value, ttl);
    }

    // Set in L2 cache (Redis)
    if (l2) {
      try {
        await this.cacheManager.set(key, value, ttl * 1000); // Convert to milliseconds
      } catch (error) {
        this.logger.warn(`L2 cache set error for key ${key}`, error);
      }
    }

    // L3 cache would be implemented here
  }

  /**
   * Delete data from all cache levels
   */
  async del(key: string): Promise<void> {
    this.stats.deletes++;

    // Delete from L1 cache
    this.l1Cache.delete(key);

    // Delete from L2 cache
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      this.logger.warn(`L2 cache delete error for key ${key}`, error);
    }
  }

  /**
   * Clear all cache levels
   */
  async clear(): Promise<void> {
    // Clear L1 cache
    this.l1Cache.clear();

    // Clear L2 cache
    try {
      await this.cacheManager.clear();
    } catch (error) {
      this.logger.warn('L2 cache clear error', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    Object.assign(this.stats, {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
    });
  }

  /**
   * Get or set pattern - useful for caching expensive operations
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    let cached = await this.get<T>(key, options);

    if (cached === null) {
      cached = await factory();
      await this.set(key, cached, options);
    }

    return cached;
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    // For L1 cache, we need to iterate through keys
    for (const key of this.l1Cache.keys()) {
      if (key.includes(pattern)) {
        this.l1Cache.delete(key);
      }
    }

    // For L2 cache, we'd need Redis SCAN or KEYS command
    // For now, we'll skip this as it requires Redis-specific operations
    this.logger.debug(
      `Pattern invalidation for "${pattern}" - L2 cache not implemented`
    );
  }

  /**
   * Cache warming for frequently accessed data
   */
  async warmUp<T>(
    entries: Array<{
      key: string;
      factory: () => Promise<T>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    const promises = entries.map(async ({ key, factory, options }) => {
      try {
        const data = await factory();
        await this.set(key, data, options);
      } catch (error) {
        this.logger.warn(`Cache warm-up error for key ${key}`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Get data from L1 cache (in-memory)
   */
  private getL1<T>(key: string): T | null {
    const cached = this.l1Cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now > cached.expiry) {
      this.l1Cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set data in L1 cache (in-memory)
   */
  private setL1<T>(key: string, value: T, ttl: number): void {
    // Limit L1 cache size to prevent memory issues
    const maxCacheSize = 1000;

    if (this.l1Cache.size >= maxCacheSize) {
      // Remove oldest entries
      const oldestKey = this.l1Cache.keys().next().value;
      if (oldestKey) {
        this.l1Cache.delete(oldestKey);
      }
    }

    const expiry = Date.now() + ttl * 1000;
    this.l1Cache.set(key, { data: value, expiry });
  }

  /**
   * Generate cache key with organization context
   */
  static generateKey(
    organizationId: string,
    ...parts: (string | number)[]
  ): string {
    return [organizationId, ...parts.map(String)].join(':');
  }

  /**
   * Generate stats cache key
   */
  static generateStatsKey(organizationId: string, type: string): string {
    return EnhancedCacheService.generateKey('stats', organizationId, type);
  }

  /**
   * Generate list cache key
   */
  static generateListKey(
    organizationId: string,
    type: string,
    filters?: Record<string, unknown>
  ): string {
    const filterString = filters ? JSON.stringify(filters) : '';
    return EnhancedCacheService.generateKey(
      'list',
      organizationId,
      type,
      filterString
    );
  }
}
