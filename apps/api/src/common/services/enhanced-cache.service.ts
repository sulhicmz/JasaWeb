import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

export interface CacheOptions {
  ttl?: number;
  key?: string;
  prefix?: string;
  bypass?: boolean;
}

@Injectable()
export class EnhancedCacheService {
  private readonly logger = new Logger(EnhancedCacheService.name);
  private readonly defaultTTL: number;
  private readonly keyPrefix: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService
  ) {
    this.defaultTTL = this.configService.get<number>('CACHE_TTL', 300);
    this.keyPrefix = this.configService.get<string>(
      'CACHE_KEY_PREFIX',
      'jasaweb'
    );
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (options?.bypass) {
      return null;
    }

    const fullKey = this.buildKey(key, options?.prefix);

    try {
      const value = await this.cacheManager.get<T>(fullKey);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT: ${fullKey}`);
        return value;
      }

      this.logger.debug(`Cache MISS: ${fullKey}`);
      return null;
    } catch (error) {
      this.logger.warn(`Cache get error for key ${fullKey}:`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    if (options?.bypass) {
      return;
    }

    const fullKey = this.buildKey(key, options?.prefix);
    const ttl = options?.ttl || this.defaultTTL;

    try {
      await this.cacheManager.set(fullKey, value, ttl * 1000); // Convert to milliseconds
      this.logger.debug(`Cache SET: ${fullKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.warn(`Cache set error for key ${fullKey}:`, error.message);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string, options?: CacheOptions): Promise<void> {
    const fullKey = this.buildKey(key, options?.prefix);

    try {
      await this.cacheManager.del(fullKey);
      this.logger.debug(`Cache DELETE: ${fullKey}`);
    } catch (error) {
      this.logger.warn(`Cache delete error for key ${fullKey}:`, error.message);
    }
  }

  /**
   * Clear all cache with matching prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    // Note: This is a simplified implementation
    // In a real Redis setup, you would use SCAN and DEL commands
    this.logger.warn(
      `Cache clear for prefix: ${prefix} - not fully implemented`
    );
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    if (options?.bypass) {
      return await factory();
    }

    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate multiple cache keys
   */
  async invalidateMultiple(
    keys: string[],
    options?: CacheOptions
  ): Promise<void> {
    const promises = keys.map((key) => this.delete(key, options));
    await Promise.all(promises);
  }

  /**
   * Cache invalidation for database entities
   */
  async invalidateEntityCache(
    entityType: string,
    entityId: string | number
  ): Promise<void> {
    const keys = [
      `${entityType}:${entityId}`,
      `${entityType}:list`,
      `${entityType}:search:*`,
    ];

    await this.invalidateMultiple(keys);
  }

  /**
   * Warm up cache with common data
   */
  async warmupCache(
    warmupFunctions: Array<{
      key: string;
      factory: () => Promise<any>;
      options?: CacheOptions;
    }>
  ): Promise<void> {
    this.logger.log('Starting cache warmup...');

    const promises = warmupFunctions.map(async ({ key, factory, options }) => {
      try {
        await this.getOrSet(key, factory, options);
        this.logger.debug(`Warmed up cache: ${key}`);
      } catch (error) {
        this.logger.warn(`Failed to warm up cache ${key}:`, error.message);
      }
    });

    await Promise.all(promises);
    this.logger.log('Cache warmup completed');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
    totalKeys: number;
  }> {
    // This would need to be implemented based on your cache provider
    // For Redis, you would use INFO command
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
    };
  }

  private buildKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || this.keyPrefix;
    return `${keyPrefix}:${key}`;
  }
}
