import { Injectable } from '@nestjs/common';

// Simple mock cache service for testing
@Injectable()
export class MockEnhancedCacheService {
  private cache = new Map<string, { data: unknown; expiry: number }>();

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  async set<T>(
    key: string,
    value: T,
    options?: { ttl?: number }
  ): Promise<void> {
    const ttl = options?.ttl || 300; // Default 5 minutes
    const expiry = Date.now() + ttl * 1000;
    this.cache.set(key, { data: value, expiry });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  getStats() {
    return {
      hits: 0,
      misses: 0,
      sets: this.cache.size,
      deletes: 0,
      l1Hits: 0,
      l2Hits: 0,
      l3Hits: 0,
    };
  }

  resetStats(): void {
    // Mock implementation
  }

  async warmUp(): Promise<void> {
    // Mock implementation
  }

  async invalidatePattern(): Promise<void> {
    // Mock implementation
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    let cached = await this.get<T>(key);
    if (cached === null) {
      cached = await factory();
      await this.set(key, cached, options);
    }
    return cached;
  }
}
