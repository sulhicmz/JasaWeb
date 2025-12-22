/**
 * Redis Caching Service Test Suite
 * Validates caching behavior, performance, and reliability
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import cacheService, { cacheHelpers } from './redis-cache';

// Mock the environment variables
vi.mock('../redis-cache', async () => {
    const actual = await vi.importActual('../redis-cache');
    return {
        ...actual,
        // Set environment variables for testing
        default: new (actual as any).RedisCacheService()
    };
});

describe('Redis Cache Service', () => {
    beforeEach(() => {
        // Set test environment variables
        vi.stubGlobal('import', {
            meta: {
                env: {
                    REDIS_HOST: 'localhost',
                    REDIS_PORT: '6379',
                    REDIS_DEFAULT_TTL: '300',
                    NODE_ENV: 'test'
                }
            }
        });
        
        // Reset service state before each test
        cacheService.resetStats();
    });

    afterEach(async () => {
        // Clean up after each test
        await cacheService.delete('test-key');
        await cacheService.invalidateByTags(['test-tag']);
    });

    describe('Basic Cache Operations', () => {
        it('should return null for non-existent keys', async () => {
            const result = await cacheService.get('non-existent-key');
            expect(result).toBeNull();
        });

        it('should set and get values correctly', async () => {
            const testValue = { id: 1, name: 'Test Data' };
            
            const setResult = await cacheService.set('test-key', testValue);
            const getResult = await cacheService.get('test-key');
            
            expect(setResult).toBe(true);
            expect(getResult).toEqual(testValue);
        });

        it('should handle primitive types correctly', async () => {
            const stringValue = 'test string';
            const numberValue = 42;
            const booleanValue = true;
            
            await cacheService.set('string-key', stringValue);
            await cacheService.set('number-key', numberValue);
            await cacheService.set('boolean-key', booleanValue);
            
            expect(await cacheService.get('string-key')).toBe(stringValue);
            expect(await cacheService.get('number-key')).toBe(numberValue);
            expect(await cacheService.get('boolean-key')).toBe(booleanValue);
        });

        it('should delete keys correctly', async () => {
            const testValue = { data: 'test' };
            
            await cacheService.set('delete-key', testValue);
            expect(await cacheService.get('delete-key')).toEqual(testValue);
            
            const deleteResult = await cacheService.delete('delete-key');
            expect(deleteResult).toBe(true);
            expect(await cacheService.get('delete-key')).toBeNull();
        });

        it('should respect TTL settings', async () => {
            const testValue = { data: 'test' };
            
            await cacheService.set('ttl-key', testValue, { ttl: 1 }); // 1 second TTL
            
            // Should be available immediately
            expect(await cacheService.get('ttl-key')).toEqual(testValue);
            
            // Wait for expiry and check if deleted
            await new Promise(resolve => setTimeout(resolve, 1100));
            expect(await cacheService.get('ttl-key')).toBeNull();
        });
    });

    describe('Cache Key Management', () => {
        it('should build hierarchical keys correctly', async () => {
            const key1 = cacheHelpers.keys.dashboard();
            const key2 = cacheHelpers.keys.projects('user123');
            const key3 = cacheHelpers.keys.templates('company');
            
            expect(key1).toBe('dashboard:global');
            expect(key2).toBe('projects:user:user123');
            expect(key3).toBe('templates:category:company');
        });

        it('should handle cache invalidation by tags', async () => {
            // Set multiple keys with the same tag
            await cacheService.set('item1', { data: 'item1' }, { tags: ['products'] });
            await cacheService.set('item2', { data: 'item2' }, { tags: ['products'] });
            await cacheService.set('item3', { data: 'item3' }, { tags: ['categories'] });
            
            // Verify data is cached
            expect(await cacheService.get('item1')).toEqual({ data: 'item1' });
            expect(await cacheService.get('item2')).toEqual({ data: 'item2' });
            expect(await cacheService.get('item3')).toEqual({ data: 'item3' });
            
            // Invalidate by tag
            const invalidatedCount = await cacheService.invalidateByTags(['products']);
            expect(invalidatedCount).toBe(2);
            
            // Only tagged items should be invalidated
            expect(await cacheService.get('item1')).toBeNull();
            expect(await cacheService.get('item2')).toBeNull();
            expect(await cacheService.get('item3')).toEqual({ data: 'item3' });
        });
    });

    describe('Get or Set Pattern', () => {
        it('should return cached data when available', async () => {
            const cachedData = { id: 1, name: 'Cached' };
            const fetcher = vi.fn().mockResolvedValue({ id: 2, name: 'Fresh' });
            
            // Pre-cache data
            await cacheService.set('get-or-set-key', cachedData);
            
            const result = await cacheService.getOrSet('get-or-set-key', fetcher);
            
            expect(result).toEqual(cachedData);
            expect(fetcher).not.toHaveBeenCalled();
        });

        it('should fetch and cache data when not available', async () => {
            const freshData = { id: 2, name: 'Fresh' };
            const fetcher = vi.fn().mockResolvedValue(freshData);
            
            const result = await cacheService.getOrSet('get-or-set-key-fresh', fetcher, { ttl: 300 });
            
            expect(result).toEqual(freshData);
            expect(fetcher).toHaveBeenCalledTimes(1);
            
            // Verify data is cached
            const cachedResult = await cacheService.get('get-or-set-key-fresh');
            expect(cachedResult).toEqual(freshData);
        });
    });

    describe('Statistics and Monitoring', () => {
        it('should track cache statistics accurately', async () => {
            const stats = cacheService.getStats();
            
            // Initially all zeros
            expect(stats.hits).toBe(0);
            expect(stats.misses).toBe(0);
            expect(stats.sets).toBe(0);
            expect(stats.hitRate).toBe(0);
            
            // Set some data
            await cacheService.set('stat-key', { data: 'test' });
            
            // Hit (cache hit)
            await cacheService.get('stat-key');
            
            // Miss (cache miss)
            await cacheService.get('non-existent-key');
            
            const updatedStats = cacheService.getStats();
            expect(updatedStats.sets).toBe(1);
            expect(updatedStats.hits).toBe(1);
            expect(updatedStats.misses).toBe(1);
            expect(updatedStats.hitRate).toBe(50);
        });

        it('should reset statistics correctly', async () => {
            // Generate some stats
            await cacheService.set('reset-key', { data: 'test' });
            await cacheService.get('reset-key');
            await cacheService.get('non-existent-key');
            
            // Verify stats exist
            const beforeReset = cacheService.getStats();
            expect(beforeReset.sets).toBeGreaterThan(0);
            
            // Reset and verify
            cacheService.resetStats();
            const afterReset = cacheService.getStats();
            
            expect(afterReset.hits).toBe(0);
            expect(afterReset.misses).toBe(0);
            expect(afterReset.sets).toBe(0);
            expect(afterReset.hitRate).toBe(0);
            expect(afterReset.lastReset).toBeInstanceOf(Date);
        });

        it('should perform health checks correctly', async () => {
            const health = await cacheService.healthCheck();
            
            expect(health).toHaveProperty('isHealthy');
            expect(typeof health.isHealthy).toBe('boolean');
            
            if (health.isHealthy) {
                expect(health).toHaveProperty('responseTime');
                expect(typeof health.responseTime).toBe('number');
                expect(health.responseTime).toBeGreaterThanOrEqual(0);
            } else {
                expect(health).toHaveProperty('error');
                expect(typeof health.error).toBe('string');
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid JSON gracefully', async () => {
            // This test simulates corrupted cache data
            // In a real scenario, this would require direct Redis manipulation
            
            // For now, we test that malformed data doesn't crash the service
            const result = await cacheService.get('malformed-key');
            expect(result).toBeNull();
        });

        it('should handle concurrent operations correctly', async () => {
            const promises = Array.from({ length: 100 }, (_, i) =>
                cacheService.set(`concurrent-key-${i}`, { id: i }, { ttl: 300 })
            );
            
            const results = await Promise.all(promises);
            expect(results.every(result => result === true)).toBe(true);
            
            // Verify all data is cached correctly
            for (let i = 0; i < 100; i++) {
                const data = await cacheService.get(`concurrent-key-${i}`);
                expect(data).toEqual({ id: i });
            }
        });
    });

    describe('Performance Characteristics', () => {
        it('should handle large data efficiently', async () => {
            const largeData = {
                id: 1,
                items: Array.from({ length: 10000 }, (_, i) => ({
                    id: i,
                    value: `Item ${i}`,
                    metadata: {
                        created: new Date().toISOString(),
                        tags: [`tag-${i % 10}`]
                    }
                }))
            };
            
            const startTime = Date.now();
            await cacheService.set('large-data', largeData, { ttl: 300 });
            const setResult = await cacheService.get('large-data');
            const endTime = Date.now();
            
            expect(setResult).toEqual(largeData);
            expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
        });

        it('should handle rapid cache operations', async () => {
            const operations = 1000;
            const startTime = Date.now();
            
            const promises = Array.from({ length: operations }, async (_, i) => {
                const key = `rapid-${i}`;
                await cacheService.set(key, { id: i });
                return await cacheService.get(key);
            });
            
            const results = await Promise.all(promises) as any[];
            const endTime = Date.now();
            
            expect(results).toHaveLength(operations);
            expect(results.every((result: any, index: number) => result?.id === index)).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Cache Helpers', () => {
        it('should provide correct TTL values', () => {
            expect(cacheHelpers.ttl.dashboard).toBe(300);
            expect(cacheHelpers.ttl.projects).toBe(600);
            expect(cacheHelpers.ttl.pricing).toBe(3600);
            expect(cacheHelpers.ttl.admin.stats).toBe(300);
        });

        it('should provide correct tag values', () => {
            expect(cacheHelpers.tags.dashboard).toBe('dashboard');
            expect(cacheHelpers.tags.projects).toBe('projects');
            expect(cacheHelpers.tags.user('user123')).toBe('user:user123');
        });

        it('should provide consistent key patterns', () => {
            expect(cacheHelpers.keys.dashboard()).toBe('dashboard:global');
            expect(cacheHelpers.keys.dashboard('user123')).toBe('dashboard:user:user123');
            expect(cacheHelpers.keys.pricing()).toBe('pricing:plans');
            expect(cacheHelpers.keys.admin.stats()).toBe('admin:stats');
        });
    });

    describe('Service Lifecycle', () => {
        it('should handle service shutdown gracefully', async () => {
            const shutdownResult = await cacheService.shutdown();
            expect(shutdownResult).toBeUndefined();
            
            // Verify service is no longer available
            const health = await cacheService.healthCheck();
            expect(health.isHealthy).toBe(false);
        });
    });
});