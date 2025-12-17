import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly enableCache: boolean;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService
  ) {
    this.enableCache = this.configService.get<boolean>('ENABLE_CACHE', true);
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    if (!this.enableCache) {
      return undefined;
    }

    try {
      const value = await this.cacheManager.get<T>(key);
      if (value !== undefined && value !== null) {
        this.logger.debug(`Cache HIT for key: ${key}`);
        return value;
      }
      this.logger.debug(`Cache MISS for key: ${key}`);
      return undefined;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      const cacheTTL = ttl || this.configService.get<number>('CACHE_TTL', 3600);
      await this.cacheManager.set(key, value, cacheTTL * 1000); // Convert to milliseconds
      this.logger.debug(`Cache SET for key: ${key}, TTL: ${cacheTTL}s`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      // Try to access the store's clear method if available
      const cache: any = this.cacheManager;
      if (cache.store && cache.store.clear) {
        await cache.store.clear();
      } else if (cache.store && cache.store.reset) {
        await cache.store.reset();
      } else {
        // Fallback: get all keys and delete them
        const keys = await this.keys('*');
        if (keys.length > 0) {
          await this.mdel(keys);
        }
      }
      this.logger.debug('Cache RESET completed');
    } catch (error) {
      this.logger.error('Cache RESET error:', error);
    }
  }

  /**
   * Get multiple values from cache
   */
  async mget<T>(keys: string[]): Promise<(T | undefined)[]> {
    if (!this.enableCache) {
      return keys.map(() => undefined);
    }

    try {
      const promises = keys.map((key) => this.get<T>(key));
      return Promise.all(promises);
    } catch (error) {
      this.logger.error('Cache MGET error:', error);
      return keys.map(() => undefined);
    }
  }

  /**
   * Set multiple values in cache
   */
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      const promises = entries.map((entry) =>
        this.set(entry.key, entry.value, entry.ttl)
      );
      await Promise.all(promises);
      this.logger.debug(`Cache MSET for ${entries.length} entries`);
    } catch (error) {
      this.logger.error('Cache MSET error:', error);
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async mdel(keys: string[]): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      const promises = keys.map((key) => this.del(key));
      await Promise.all(promises);
      this.logger.debug(`Cache MDELETE for ${keys.length} keys`);
    } catch (error) {
      this.logger.error('Cache MDELETE error:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    if (!this.enableCache) {
      return false;
    }

    try {
      const value = await this.get(key);
      return value !== undefined;
    } catch (error) {
      this.logger.error(`Cache HAS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get cache keys matching pattern (Redis only)
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.enableCache) {
      return [];
    }

    try {
      // Note: This might not work with all cache stores
      const cache: any = this.cacheManager;
      if (cache.store && cache.store.keys) {
        return await cache.store.keys(pattern);
      }
      this.logger.warn('Cache store does not support keys operation');
      return [];
    } catch (error) {
      this.logger.error(`Cache KEYS error for pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Generate cache key with namespace and organization context
   */
  generateKey(
    namespace: string,
    identifier: string,
    organizationId?: string
  ): string {
    const parts = [namespace, identifier];
    if (organizationId) {
      parts.push(`org:${organizationId}`);
    }
    return parts.join(':');
  }

  /**
   * Generate cache key for user-specific data
   */
  generateUserKey(
    namespace: string,
    userId: string,
    organizationId?: string
  ): string {
    return this.generateKey(namespace, `user:${userId}`, organizationId);
  }

  /**
   * Generate cache key for project-specific data
   */
  generateProjectKey(
    namespace: string,
    projectId: string,
    organizationId?: string
  ): string {
    return this.generateKey(namespace, `project:${projectId}`, organizationId);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await this.mdel(keys);
        this.logger.debug(
          `Cache INVALIDATE pattern: ${pattern}, keys affected: ${keys.length}`
        );
      }
    } catch (error) {
      this.logger.error(
        `Cache INVALIDATE error for pattern ${pattern}:`,
        error
      );
    }
  }

  /**
   * Warm up cache with initial data
   */
  async warmup(
    entries: Array<{ key: string; value: any; ttl?: number }>
  ): Promise<void> {
    if (!this.enableCache) {
      return;
    }

    this.logger.debug(`Cache WARMUP starting for ${entries.length} entries`);
    await this.mset(entries);
    this.logger.debug(`Cache WARMUP completed`);
  }

  /**
   * Get cache statistics (if available)
   */
  async getStats(): Promise<any> {
    if (!this.enableCache) {
      return { enabled: false };
    }

    try {
      const cache: any = this.cacheManager;
      if (cache.store && cache.store.getStats) {
        return {
          enabled: true,
          ...(await cache.store.getStats()),
        };
      }
      return { enabled: true };
    } catch (error) {
      this.logger.error('Cache STATS error:', error);
      return { enabled: true, error: 'Stats unavailable' };
    }
  }
}
