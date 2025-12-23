/**
 * Redis Cache Service for Dashboard Analytics
 * 
 * High-performance caching layer for dashboard aggregation queries
 * using Cloudflare Workers KV with TTL-based cache invalidation
 */

import type { KVNamespace } from './types';
import { cacheGet, cacheSet, cacheDelete, cacheInvalidateByPrefix } from './kv';

export interface CacheConfig {
    /** TTL in seconds for dashboard statistics */
    dashboardStatsTTL: number;
    /** TTL in seconds for recent data */
    recentDataTTL: number;
    /** TTL in seconds for aggregation queries */
    aggregationTTL: number;
}

const DEFAULT_CACHE_CONFIG: CacheConfig = {
    dashboardStatsTTL: 300, // 5 minutes - fast updates for real-time feel
    recentDataTTL: 180, // 3 minutes - recent data updates more frequently
    aggregationTTL: 600, // 10 minutes - aggregation queries cached longer
};

export interface DashboardStatsCache {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    activeProjects: number;
    pendingPayments: number;
    lastUpdated: string;
}

export interface RecentItemsCache<T> {
    items: T[];
    lastUpdated: string;
}

/**
 * Redis-style Cache Service for Dashboard Operations
 * Optimized for high-frequency dashboard access patterns
 */
export class DashboardCacheService {
    private kv: KVNamespace;
    private config: CacheConfig;

    constructor(kv: KVNamespace, config?: Partial<CacheConfig>) {
        this.kv = kv;
        this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    }

    // ========================================
    // CACHE KEY BUILDERS
    // ========================================

    private static readonly KEYS = {
        dashboardStats: () => 'dashboard:stats:v1',
        recentUsers: () => 'dashboard:recent:users:v1',
        recentProjects: () => 'dashboard:recent:projects:v1',
        userStats: (userId: string) => `dashboard:user:${userId}:stats:v1`,
        revenueByPeriod: (period: string) => `dashboard:revenue:${period}:v1`,
        projectStatusCounts: () => 'dashboard:projects:status:counts:v1',
        invoiceStats: () => 'dashboard:invoices:stats:v1',
    } as const;

    // ========================================
    // DASHBOARD STATISTICS CACHING
    // ========================================

    /**
     * Get cached dashboard statistics
     */
    async getDashboardStats(): Promise<DashboardStatsCache | null> {
        return cacheGet<DashboardStatsCache>(
            this.kv,
            DashboardCacheService.KEYS.dashboardStats()
        );
    }

    /**
     * Set dashboard statistics cache
     */
    async setDashboardStats(stats: Omit<DashboardStatsCache, 'lastUpdated'>): Promise<void> {
        const cacheData: DashboardStatsCache = {
            ...stats,
            lastUpdated: new Date().toISOString()
        };

        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.dashboardStats(),
            cacheData,
            { ttl: this.config.dashboardStatsTTL }
        );
    }

    /**
     * Get or set dashboard statistics (cache-aside pattern)
     */
    async getOrSetDashboardStats(
        fetcher: () => Promise<Omit<DashboardStatsCache, 'lastUpdated'>>
    ): Promise<DashboardStatsCache> {
        const cached = await this.getDashboardStats();
        if (cached) {
            return cached;
        }

        const stats = await fetcher();
        await this.setDashboardStats(stats);
        
        return {
            ...stats,
            lastUpdated: new Date().toISOString()
        };
    }

    // ========================================
    // RECENT ITEMS CACHING
    // ========================================

    /**
     * Get cached recent users
     */
    async getRecentUsers(): Promise<RecentItemsCache<any> | null> {
        return cacheGet<RecentItemsCache<any>>(
            this.kv,
            DashboardCacheService.KEYS.recentUsers()
        );
    }

    /**
     * Set cached recent users
     */
    async setRecentUsers(users: any[]): Promise<void> {
        const cacheData: RecentItemsCache<any> = {
            items: users,
            lastUpdated: new Date().toISOString()
        };

        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.recentUsers(),
            cacheData,
            { ttl: this.config.recentDataTTL }
        );
    }

    /**
     * Get or set recent users
     */
    async getOrSetRecentUsers<T>(
        fetcher: () => Promise<T[]>
    ): Promise<RecentItemsCache<T>> {
        const cached = await this.getRecentUsers();
        if (cached) {
            return cached as RecentItemsCache<T>;
        }

        const users = await fetcher();
        await this.setRecentUsers(users);
        
        return {
            items: users,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Get cached recent projects
     */
    async getRecentProjects(): Promise<RecentItemsCache<any> | null> {
        return cacheGet<RecentItemsCache<any>>(
            this.kv,
            DashboardCacheService.KEYS.recentProjects()
        );
    }

    /**
     * Set cached recent projects
     */
    async setRecentProjects(projects: any[]): Promise<void> {
        const cacheData: RecentItemsCache<any> = {
            items: projects,
            lastUpdated: new Date().toISOString()
        };

        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.recentProjects(),
            cacheData,
            { ttl: this.config.recentDataTTL }
        );
    }

    /**
     * Get or set recent projects
     */
    async getOrSetRecentProjects<T>(
        fetcher: () => Promise<T[]>
    ): Promise<RecentItemsCache<T>> {
        const cached = await this.getRecentProjects();
        if (cached) {
            return cached as RecentItemsCache<T>;
        }

        const projects = await fetcher();
        await this.setRecentProjects(projects);
        
        return {
            items: projects,
            lastUpdated: new Date().toISOString()
        };
    }

    // ========================================
    // USER-SPECIFIC CACHING
    // ========================================

    /**
     * Get cached user-specific dashboard stats
     */
    async getUserStats(userId: string): Promise<any | null> {
        return cacheGet<any>(
            this.kv,
            DashboardCacheService.KEYS.userStats(userId)
        );
    }

    /**
     * Set cached user-specific dashboard stats
     */
    async setUserStats(userId: string, stats: any): Promise<void> {
        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.userStats(userId),
            {
                ...stats,
                lastUpdated: new Date().toISOString()
            },
            { ttl: this.config.dashboardStatsTTL }
        );
    }

    // ========================================
    // AGGREGATION CACHING
    // ========================================

    /**
     * Get cached revenue by period
     */
    async getRevenueByPeriod(period: string): Promise<any | null> {
        return cacheGet<any>(
            this.kv,
            DashboardCacheService.KEYS.revenueByPeriod(period)
        );
    }

    /**
     * Set cached revenue by period
     */
    async setRevenueByPeriod(period: string, data: any): Promise<void> {
        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.revenueByPeriod(period),
            {
                ...data,
                lastUpdated: new Date().toISOString()
            },
            { ttl: this.config.aggregationTTL }
        );
    }

    /**
     * Get cached project status counts
     */
    async getProjectStatusCounts(): Promise<any | null> {
        return cacheGet<any>(
            this.kv,
            DashboardCacheService.KEYS.projectStatusCounts()
        );
    }

    /**
     * Set cached project status counts
     */
    async setProjectStatusCounts(data: any): Promise<void> {
        await cacheSet(
            this.kv,
            DashboardCacheService.KEYS.projectStatusCounts(),
            {
                ...data,
                lastUpdated: new Date().toISOString()
            },
            { ttl: this.config.aggregationTTL }
        );
    }

    // ========================================
    // CACHE INVALIDATION
    // ========================================

    /**
     * Invalidate dashboard statistics cache
     * Call this when any underlying data changes
     */
    async invalidateDashboardStats(): Promise<void> {
        await cacheDelete(this.kv, DashboardCacheService.KEYS.dashboardStats());
        await cacheDelete(this.kv, DashboardCacheService.KEYS.projectStatusCounts());
        await cacheDelete(this.kv, DashboardCacheService.KEYS.invoiceStats());
    }

    /**
     * Invalidate recent items cache
     */
    async invalidateRecentItems(): Promise<void> {
        await cacheDelete(this.kv, DashboardCacheService.KEYS.recentUsers());
        await cacheDelete(this.kv, DashboardCacheService.KEYS.recentProjects());
    }

    /**
     * Invalidate user-specific cache
     */
    async invalidateUserStats(userId: string): Promise<void> {
        await cacheDelete(this.kv, DashboardCacheService.KEYS.userStats(userId));
    }

    /**
     * Invalidate all dashboard cache
     * Use this for major data changes or maintenance
     */
    async invalidateAllDashboardCache(): Promise<void> {
        await cacheInvalidateByPrefix(this.kv, 'dashboard:');
    }

    // ========================================
    // CACHE HEALTH & MONITORING
    // ========================================

    /**
     * Check cache health and performance
     */
    async getCacheHealth(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        statsCount: number;
        recentCount: number;
        lastUpdated: string | null;
        recommendations: string[];
    }> {
        const dashboardStats = await this.getDashboardStats();
        const recentUsers = await this.getRecentUsers();
        const recentProjects = await this.getRecentProjects();

        const recommendations: string[] = [];
        const itemCounts = [dashboardStats, recentUsers, recentProjects].filter(Boolean).length;

        if (itemCounts < 2) {
            recommendations.push('Low cache hit rate - consider warming up cache');
        }

        if (dashboardStats) {
            const age = Date.now() - new Date(dashboardStats.lastUpdated).getTime();
            if (age > this.config.dashboardStatsTTL * 1000 * 0.8) {
                recommendations.push('Dashboard cache nearing expiration - refresh recommended');
            }
        }

        return {
            status: itemCounts >= 2 ? 'healthy' : itemCounts >= 1 ? 'warning' : 'error',
            statsCount: dashboardStats ? 1 : 0,
            recentCount: (recentUsers ? 1 : 0) + (recentProjects ? 1 : 0),
            lastUpdated: dashboardStats?.lastUpdated || null,
            recommendations
        };
    }

    /**
     * Get cache performance metrics
     */
    async getCacheMetrics(): Promise<{
        totalKeys: number;
        estimatedMemoryUsage: number; // KB
        oldestCache: string | null;
        newestCache: string | null;
    }> {
        // List all dashboard cache keys
        const list = await this.kv.list({ prefix: 'dashboard:' });
        
        if (list.keys.length === 0) {
            return {
                totalKeys: 0,
                estimatedMemoryUsage: 0,
                oldestCache: null,
                newestCache: null
            };
        }

        // Estimate memory usage (rough calculation)
        const estimatedMemoryUsage = list.keys.length * 2; // Rough estimate in KB

        return {
            totalKeys: list.keys.length,
            estimatedMemoryUsage,
            oldestCache: 'N/A', // KV doesn't provide creation timestamps
            newestCache: 'N/A'
        };
    }
}

/**
 * Create dashboard cache service instance
 */
export function createDashboardCacheService(
    kv: KVNamespace,
    config?: Partial<CacheConfig>
): DashboardCacheService {
    return new DashboardCacheService(kv, config);
}