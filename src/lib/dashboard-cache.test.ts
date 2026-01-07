/**
 * Dashboard Cache Service Tests
 * 
 * Comprehensive test coverage for Redis-style caching implementation
 * including cache-aside patterns, TTL management, and invalidation strategies
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDashboardCacheService } from '@/lib/dashboard-cache';

// Mock KVNamespace
const mockKV = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn()
} as any;

describe('DashboardCacheService', () => {
    let cacheService: ReturnType<typeof createDashboardCacheService>;

    beforeEach(() => {
        vi.clearAllMocks();
        cacheService = createDashboardCacheService(mockKV);
    });

    describe('Dashboard Statistics Caching', () => {
        it('should cache dashboard statistics', async () => {
            const stats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5
            };

            await cacheService.setDashboardStats(stats);

            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:stats:v1',
                expect.stringContaining('"totalUsers":100'),
                { expirationTtl: 300 }
            );
        });

        it('should retrieve cached dashboard statistics', async () => {
            const cachedStats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5,
                lastUpdated: '2025-12-23T10:00:00.000Z'
            };

            mockKV.get.mockResolvedValue(cachedStats);

            const result = await cacheService.getDashboardStats();

            expect(mockKV.get).toHaveBeenCalledWith('dashboard:stats:v1', 'json');
            expect(result).toEqual(cachedStats);
        });

        it('should return null when cache miss', async () => {
            mockKV.get.mockResolvedValue(null);

            const result = await cacheService.getDashboardStats();

            expect(result).toBeNull();
        });

        it('should use cache-aside pattern for dashboard stats', async () => {
            const dbStats = {
                totalUsers: 150,
                totalProjects: 75,
                totalRevenue: 37500,
                activeProjects: 30,
                pendingPayments: 8
            };

            const fetcher = vi.fn().mockResolvedValue(dbStats);
            mockKV.get.mockResolvedValueOnce(null); // Cache miss

            const result = await cacheService.getOrSetDashboardStats(fetcher);

            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:stats:v1',
                expect.stringContaining('"totalUsers":150'),
                { expirationTtl: 300 }
            );
            expect(result).toEqual(expect.objectContaining({
                ...dbStats,
                lastUpdated: expect.any(String)
            }));
        });

        it('should return cached value when available', async () => {
            const cachedStats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5,
                lastUpdated: '2025-12-23T10:00:00.000Z'
            };

            const fetcher = vi.fn().mockResolvedValue({}); // Should not be called
            mockKV.get.mockResolvedValue(cachedStats);

            const result = await cacheService.getOrSetDashboardStats(fetcher);

            expect(fetcher).not.toHaveBeenCalled();
            expect(result).toEqual(cachedStats);
        });
    });

    describe('Recent Items Caching', () => {
        it('should cache recent users', async () => {
            const users = [
                { id: '1', name: 'John Doe', email: 'john@example.com', role: 'client', createdAt: new Date() }
            ];

            await cacheService.setRecentUsers(users);

            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:recent:users:v1',
                expect.stringContaining('"items":'),
                { expirationTtl: 180 }
            );
        });

        it('should cache recent projects', async () => {
            const projects = [
                { id: '1', name: 'Project 1', status: 'in_progress', createdAt: new Date() }
            ];

            await cacheService.setRecentProjects(projects);

            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:recent:projects:v1',
                expect.stringContaining('"items":'),
                { expirationTtl: 180 }
            );
        });

        it('should use cache-aside pattern for recent items', async () => {
            const dbUsers = [
                { id: '1', name: 'John Doe', email: 'john@example.com', role: 'client' }
            ];
            const fetcher = vi.fn().mockResolvedValue(dbUsers);
            mockKV.get.mockResolvedValueOnce(null);

            const result = await cacheService.getOrSetRecentUsers(fetcher);

            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                items: dbUsers,
                lastUpdated: expect.any(String)
            });
        });
    });

    describe('User-Specific Caching', () => {
        it('should cache user-specific stats', async () => {
            const userId = 'user-123';
            const userStats = { totalProjects: 5, unpaidInvoices: 2 };

            await cacheService.setUserStats(userId, userStats);

            expect(mockKV.put).toHaveBeenCalledWith(
                `dashboard:user:${userId}:stats:v1`,
                expect.stringContaining('"totalProjects":5'),
                { expirationTtl: 300 }
            );
        });

        it('should retrieve user-specific stats', async () => {
            const userId = 'user-123';
            const userStats = { 
                totalProjects: 5, 
                unpaidInvoices: 2,
                lastUpdated: '2025-12-23T10:00:00.000Z'
            };

            mockKV.get.mockResolvedValue(userStats);

            const result = await cacheService.getUserStats(userId);

            expect(mockKV.get).toHaveBeenCalledWith(`dashboard:user:${userId}:stats:v1`, 'json');
            expect(result).toEqual(userStats);
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate dashboard stats', async () => {
            mockKV.list.mockResolvedValue({ keys: [] });
            await cacheService.invalidateDashboardStats();

            expect(mockKV.delete).toHaveBeenCalledWith('dashboard:stats:v1');
            expect(mockKV.delete).toHaveBeenCalledWith('dashboard:projects:status:counts:v1');
            expect(mockKV.delete).toHaveBeenCalledWith('dashboard:invoices:stats:v1');
        });

        it('should invalidate recent items', async () => {
            await cacheService.invalidateRecentItems();

            expect(mockKV.delete).toHaveBeenCalledWith('dashboard:recent:users:v1');
            expect(mockKV.delete).toHaveBeenCalledWith('dashboard:recent:projects:v1');
        });

        it('should invalidate user-specific cache', async () => {
            const userId = 'user-123';

            await cacheService.invalidateUserStats(userId);

            expect(mockKV.delete).toHaveBeenCalledWith(`dashboard:user:${userId}:stats:v1`);
        });

        it('should invalidate all dashboard cache', async () => {
            const mockKeys = {
                keys: [
                    { name: 'dashboard:stats:v1' },
                    { name: 'dashboard:recent:users:v1' },
                    { name: 'dashboard:user:123:stats:v1' }
                ]
            };
            mockKV.list.mockResolvedValue(mockKeys);

            await cacheService.invalidateAllDashboardCache();

            expect(mockKV.list).toHaveBeenCalledWith({ prefix: 'dashboard:' });
            expect(mockKV.delete).toHaveBeenCalledTimes(3);
            mockKeys.keys.forEach(key => {
                expect(mockKV.delete).toHaveBeenCalledWith(key.name);
            });
        });
    });

    describe('Cache Health Monitoring', () => {
        it('should report healthy cache status', async () => {
            const dashboardStats = { lastUpdated: new Date().toISOString() };
            const recentUsers = { lastUpdated: new Date().toISOString() };
            const recentProjects = { lastUpdated: new Date().toISOString() };

            mockKV.get
                .mockResolvedValueOnce(dashboardStats)
                .mockResolvedValueOnce(recentUsers)
                .mockResolvedValueOnce(recentProjects);

            const health = await cacheService.getCacheHealth();

            expect(health.status).toBe('healthy');
            expect(health.statsCount).toBe(1);
            expect(health.recentCount).toBe(2);
            expect(health.recommendations).toHaveLength(0);
        });

        it('should report warning status for partial cache', async () => {
            const dashboardStats = { lastUpdated: new Date().toISOString() };
            
            mockKV.get
                .mockResolvedValueOnce(dashboardStats)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null);

            const health = await cacheService.getCacheHealth();

            expect(health.status).toBe('warning');
            expect(health.recommendations).toHaveLength(1);
            expect(health.recommendations[0]).toContain('Low cache hit rate');
        });

        it('should report error status for empty cache', async () => {
            mockKV.get.mockResolvedValue(null);

            const health = await cacheService.getCacheHealth();

            expect(health.status).toBe('error');
            expect(health.recommendations).toHaveLength(1);
        });

        it('should recommend cache refresh when nearing expiration', async () => {
            // Set up a dashboard cache that's older than 80% of TTL (5 min TTL = 300 sec, 80% = 240 sec)
            const oldDate = new Date();
            oldDate.setSeconds(oldDate.getSeconds() - 250); // More than 240 seconds ago
            
            const dashboardStats = { lastUpdated: oldDate.toISOString() }; // Old enough to trigger warning
            
            mockKV.get
                .mockResolvedValueOnce(dashboardStats)
                .mockResolvedValueOnce(null) // No recent users
                .mockResolvedValueOnce(null); // No recent projects

            const health = await cacheService.getCacheHealth();

            // Should have at least 1 recommendation (either low hit rate or expiration warning)
            expect(health.recommendations.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Cache Metrics', () => {
        it('should report empty cache metrics', async () => {
            mockKV.list.mockResolvedValue({ keys: [] });

            const metrics = await cacheService.getCacheMetrics();

            expect(metrics.totalKeys).toBe(0);
            expect(metrics.estimatedMemoryUsage).toBe(0);
            expect(metrics.oldestCache).toBeNull();
            expect(metrics.newestCache).toBeNull();
        });

        it('should report cache metrics with keys', async () => {
            const mockKeys = {
                keys: [
                    { name: 'dashboard:stats:v1' },
                    { name: 'dashboard:recent:users:v1' },
                    { name: 'dashboard:user:123:stats:v1' }
                ]
            };
            mockKV.list.mockResolvedValue(mockKeys);

            const metrics = await cacheService.getCacheMetrics();

            expect(metrics.totalKeys).toBe(3);
            expect(metrics.estimatedMemoryUsage).toBe(6); // 3 * 2KB
        });
    });

    describe('Configuration', () => {
        it('should use custom TTL configuration', async () => {
            const customConfig = {
                dashboardStatsTTL: 600,
                recentDataTTL: 300,
                aggregationTTL: 900
            };

            const customCacheService = createDashboardCacheService(mockKV, customConfig);
            
            const stats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5
            };

            await customCacheService.setDashboardStats(stats);

            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:stats:v1',
                expect.stringContaining('"totalUsers":100'),
                { expirationTtl: 600 }
            );
        });

        it('should use default configuration when not provided', async () => {
            const stats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5
            };

            await cacheService.setDashboardStats(stats);

            expect(mockKV.put).toHaveBeenCalledWith(
                'dashboard:stats:v1',
                expect.stringContaining('"totalUsers":100'),
                { expirationTtl: 300 } // Default TTL
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle KV get errors gracefully', async () => {
            mockKV.get.mockRejectedValue(new Error('KV Error'));

            const result = await cacheService.getDashboardStats().catch(() => null);

            expect(result).toBeNull();
        });

        it('should handle KV put errors gracefully', async () => {
            mockKV.put.mockRejectedValue(new Error('KV Error'));

            const stats = {
                totalUsers: 100,
                totalProjects: 50,
                totalRevenue: 25000,
                activeProjects: 20,
                pendingPayments: 5
            };

            // Should not throw error
            await expect(cacheService.setDashboardStats(stats)).rejects.toThrow('KV Error');
        });

        it('should handle cache-aside fetcher errors gracefully', async () => {
            const fetcher = vi.fn().mockRejectedValue(new Error('Database Error'));
            mockKV.get.mockResolvedValue(null);

            await expect(cacheService.getOrSetDashboardStats(fetcher)).rejects.toThrow('Database Error');
            
            expect(fetcher).toHaveBeenCalledTimes(1);
            expect(mockKV.put).not.toHaveBeenCalled();
        });
    });
});