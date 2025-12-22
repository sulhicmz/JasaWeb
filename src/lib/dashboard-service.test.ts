/**
 * Dashboard Service Test Suite
 * Validates dashboard aggregation and caching behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard-service';
import cacheService, { RedisCacheService } from './redis-cache';

// Mock the Prisma client
const mockPrisma = {
    user: {
        count: vi.fn(),
        findMany: vi.fn()
    },
    project: {
        count: vi.fn(),
        findMany: vi.fn(),
        groupBy: vi.fn()
    },
    invoice: {
        aggregate: vi.fn(),
        findMany: vi.fn()
    }
} as any;

describe('Dashboard Service', () => {
    let dashboardService: DashboardService;

    beforeEach(() => {
        vi.clearAllMocks();
        dashboardService = new DashboardService(mockPrisma, cacheService);
        cacheService.resetStats();
    });

    describe('Global Dashboard Statistics', () => {
        it('should compute global stats correctly', async () => {
            // Mock database responses
            mockPrisma.user.count
                .mockResolvedValueOnce(100) // total users
                .mockResolvedValueOnce(15)  // recent registrations from getUserCounts
                .mockResolvedValueOnce(15); // recent registrations from getRecentRegistrations

            mockPrisma.project.count.mockResolvedValue(50);
            
            mockPrisma.invoice.aggregate.mockResolvedValue({
                _sum: { amount: 25000 }
            });

            mockPrisma.project.groupBy.mockResolvedValue([
                { status: 'in_progress', _count: 20 },
                { status: 'completed', _count: 25 },
                { status: 'pending_payment', _count: 5 }
            ]);

            const result = await dashboardService.getGlobalStats();

            expect(result.totalUsers).toBe(100);
            expect(result.totalProjects).toBe(50);
            expect(result.totalRevenue).toBe(25000);
            expect(result.activeProjects).toBe(20);
            expect(result.completedProjects).toBe(25);
            expect(result.pendingProjects).toBe(5);
            expect(result.recentRegistrations).toBe(15);
            expect(result.conversionRate).toBe(50); // 50/100 * 100
            expect(result.averageProjectValue).toBe(500); // 25000/50
            expect(result.lastUpdated).toBeDefined();
        });

        it('should handle division by zero gracefully', async () => {
            // Create a fresh cache service instance to avoid cache contamination
            const freshCache = new RedisCacheService();
            const freshService = new DashboardService(mockPrisma, freshCache);
            
            mockPrisma.user.count.mockResolvedValue(0);
            mockPrisma.project.count.mockResolvedValue(0);
            mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 0 } });
            mockPrisma.project.groupBy.mockResolvedValue([]);

            const result = await freshService.getGlobalStats();

            expect(result.conversionRate).toBe(0);
            expect(result.averageProjectValue).toBe(0);
        });
    });

    describe('User Dashboard Data', () => {
        it('should compute user dashboard data correctly', async () => {
            const userId = 'user123';

            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'proj1', status: 'in_progress', name: 'Project 1' },
                { id: 'proj2', status: 'completed', name: 'Project 2' }
            ]);

            mockPrisma.invoice.findMany.mockResolvedValue([
                { amount: 1000, status: 'paid' },
                { amount: 500, status: 'unpaid' }
            ]);

            const result = await dashboardService.getUserDashboardData(userId);

            expect(result.stats.totalProjects).toBe(2);
            expect(result.stats.activeProjects).toBe(1);
            expect(result.stats.completedProjects).toBe(1);
            expect(result.stats.totalSpent).toBe(1000);
            expect(result.stats.pendingInvoices).toBe(1);
            expect(result.projects).toHaveLength(2);
            expect(result.lastUpdated).toBeDefined();
        });
    });

    describe('Projects List', () => {
        it('should return paginated projects list', async () => {
            mockPrisma.project.count.mockResolvedValue(100);
            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'proj1', name: 'Project 1', userId: 'user1' },
                { id: 'proj2', name: 'Project 2', userId: 'user2' }
            ]);

            const result = await dashboardService.getProjectsList({
                limit: 10,
                offset: 0,
                status: 'in_progress'
            });

            expect(result.projects).toHaveLength(2);
            expect(result.total).toBe(100);
            expect(result.performance.queryTime).toBeGreaterThanOrEqual(0);
        });

        it('should handle search functionality', async () => {
            mockPrisma.project.count.mockResolvedValue(1);
            mockPrisma.project.findMany.mockResolvedValue([
                { id: 'proj1', name: 'Search Result', userId: 'user1' }
            ]);

            const result = await dashboardService.getProjectsList({
                search: 'Search'
            });

            expect(result.projects).toHaveLength(1);
            expect(result.projects[0].name).toBe('Search Result');
        });
    });

    describe('Performance Metrics', () => {
        it('should track cache metrics', async () => {
            const metrics = await dashboardService.getCacheMetrics();

            expect(metrics.stats).toBeDefined();
            expect(metrics.health).toBeDefined();
            expect(metrics.recommendations).toBeDefined();
            expect(metrics.stats.hitRate).toBeGreaterThanOrEqual(0);
            expect(metrics.stats.hitRate).toBeLessThanOrEqual(100);
        });

        it('should provide optimization recommendations', async () => {
            // Simulate poor cache performance
            cacheService.resetStats();
            
            // Generate some misses
            await cacheService.get('non-existent-key');
            await cacheService.get('another-miss');

            const metrics = await dashboardService.getCacheMetrics();

            expect(metrics.recommendations).toBeInstanceOf(Array);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            // Create a fresh cache service instance to avoid cache contamination
            const freshCache = new RedisCacheService();
            const freshService = new DashboardService(mockPrisma, freshCache);
            
            // Mock the database error
            mockPrisma.user.count.mockRejectedValue(new Error('Database connection failed'));
            
            await expect(freshService.getGlobalStats()).rejects.toThrow();
        });

        it('should handle missing data gracefully', async () => {
            // Create a fresh cache service instance to avoid cache contamination
            const freshCache = new RedisCacheService();
            const freshService = new DashboardService(mockPrisma, freshCache);
            
            mockPrisma.user.count.mockResolvedValue(0);
            mockPrisma.project.count.mockResolvedValue(0);
            mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: null } });
            mockPrisma.project.groupBy.mockResolvedValue([]);

            const result = await freshService.getGlobalStats();

            expect(result.totalRevenue).toBe(0);
            expect(result.conversionRate).toBe(0);
            expect(result.averageProjectValue).toBe(0);
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate caches without errors', async () => {
            // Set up some basic data
            mockPrisma.user.count.mockResolvedValue(100);
            mockPrisma.project.count.mockResolvedValue(50);
            mockPrisma.invoice.aggregate.mockResolvedValue({ _sum: { amount: 25000 } });
            mockPrisma.project.groupBy.mockResolvedValue([]);

            // Cache the data
            await dashboardService.getGlobalStats();

            // Invalidate caches - should not throw
            await expect(dashboardService.invalidateCaches()).resolves.toBeUndefined();
            await expect(dashboardService.invalidateCaches('user-only')).resolves.toBeUndefined();
        });
    });
});