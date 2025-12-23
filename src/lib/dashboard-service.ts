/**
 * Dashboard Aggregation Service with Caching
 * Optimizes expensive dashboard queries using cache layer
 */

import cacheService from './redis-cache';
import { getPrisma } from './prisma';
import type { Project, Invoice } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';

interface DashboardStats {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    activeProjects: number;
    completedProjects: number;
    pendingProjects: number;
    recentRegistrations: number;
    conversionRate: number;
    averageProjectValue: number;
    monthlyGrowth: number;
    lastUpdated: string;
}

interface UserDashboardData {
    projects: (Project & { invoice?: Invoice })[];
    stats: {
        totalProjects: number;
        activeProjects: number;
        completedProjects: number;
        totalSpent: number;
        pendingInvoices: number;
    };
    lastUpdated: string;
}

interface PerformanceMetrics {
    queryTime: number;
    cacheHit: boolean;
    recordCount: number;
}

/**
 * Dashboard service with intelligent caching
 * Provides high-performance dashboard data aggregation
 */
export class DashboardService {
    private readonly PERFORMANCE_THRESHOLD = 1000; // 1 second
    private readonly CACHE_TTL = {
        GLOBAL_STATS: 300, // 5 minutes
        USER_DASHBOARD: 180, // 3 minutes
        PROJECT_LISTS: 600 // 10 minutes
    };

    constructor(
        private databasePrisma: PrismaClient | null,
        private cache: typeof cacheService
    ) {}

    /**
     * Get global admin dashboard statistics
     * Optimized with parallel queries and intelligent caching
     */
    async getGlobalStats(): Promise<DashboardStats & { performance: PerformanceMetrics }> {
        const startTime = Date.now();
        const cacheKey = 'dashboard:global:stats';
        
        return await this.cache.getOrSet(
            cacheKey,
            async () => {
                if (!this.databasePrisma) {
                    throw new Error('Database not available');
                }

                console.debug('Computing global dashboard stats from database...');
                
                // Execute all queries in parallel for optimal performance
                const [
                    userCounts,
                    projectCounts,
                    revenueData,
                    projectStatusData,
                    recentUserData,
                    monthlyTrendData
                ] = await Promise.all([
                    this.getUserCounts(),
                    this.getProjectCounts(),
                    this.getRevenueData(),
                    this.getProjectStatusDistribution(),
                    this.getRecentRegistrations(),
                    this.getMonthlyTrends()
                ]);

                // Process and calculate derived metrics
                const statusCounts = this.processStatusDistribution(projectStatusData);
                const conversionRate = this.calculateConversionRate(userCounts.total, projectCounts.total);
                const averageProjectValue = this.calculateAverageProjectValue(
                    revenueData.totalRevenue, projectCounts.total
                );
                const monthlyGrowth = this.calculateMonthlyGrowth(monthlyTrendData);

                const stats: DashboardStats = {
                    totalUsers: userCounts.total,
                    totalProjects: projectCounts.total,
                    totalRevenue: revenueData.totalRevenue,
                    activeProjects: statusCounts.in_progress,
                    completedProjects: statusCounts.completed,
                    pendingProjects: statusCounts.pending_payment,
                    recentRegistrations: recentUserData.recent,
                    conversionRate: Math.round(conversionRate * 100) / 100,
                    averageProjectValue: Math.round(averageProjectValue * 100) / 100,
                    monthlyGrowth: Math.round(monthlyGrowth * 100) / 100,
                    lastUpdated: new Date().toISOString()
                };

                const queryTime = Date.now() - startTime;
                
                if (queryTime > this.PERFORMANCE_THRESHOLD) {
                    console.warn(`Dashboard stats query took ${queryTime}ms (threshold: ${this.PERFORMANCE_THRESHOLD}ms)`);
                }

                return {
                    ...stats,
                    performance: {
                        queryTime,
                        cacheHit: false,
                        recordCount: userCounts.total + projectCounts.total
                    }
                };
            },
            { ttl: this.CACHE_TTL.GLOBAL_STATS }
        );
    }

    /**
     * Get user-specific dashboard data
     */
    async getUserDashboardData(userId: string): Promise<UserDashboardData & { performance: PerformanceMetrics }> {
        const startTime = Date.now();
        const cacheKey = `dashboard:user:${userId}`;
        
        return await this.cache.getOrSet(
            cacheKey,
            async () => {
                if (!this.databasePrisma) {
                    throw new Error('Database not available');
                }

                console.debug(`Computing dashboard data for user ${userId}...`);

                // Get user projects with related invoice data
                const projects = await this.databasePrisma.project.findMany({
                    where: { userId: userId },
                    orderBy: { createdAt: 'desc' },
                    take: 50 // Performance limit
                });

                // Get user's invoices directly for spending calculations
                const invoices = await this.databasePrisma.invoice.findMany({
                    where: {
                        project: {
                            userId: userId
                        }
                    },
                    select: {
                        amount: true,
                        status: true
                    }
                });

                // Calculate user statistics
                const stats = {
                    totalProjects: projects.length,
                    activeProjects: projects.filter((p: any) => p.status === 'in_progress').length,
                    completedProjects: projects.filter((p: any) => p.status === 'completed').length,
                    totalSpent: invoices
                        .filter(inv => inv.status === 'paid')
                        .reduce((sum, inv) => sum + Number(inv.amount), 0),
                    pendingInvoices: invoices.filter(inv => inv.status === 'unpaid').length
                };

                const queryTime = Date.now() - startTime;
                
                if (queryTime > this.PERFORMANCE_THRESHOLD) {
                    console.warn(`User dashboard query took ${queryTime}ms for user ${userId}`);
                }

                return {
                    projects,
                    stats,
                    lastUpdated: new Date().toISOString(),
                    performance: {
                        queryTime,
                        cacheHit: false,
                        recordCount: projects.length + invoices.length
                    }
                };
            },
            { ttl: this.CACHE_TTL.USER_DASHBOARD }
        );
    }

    /**
     * Get project list with caching
     */
    async getProjectsList(options: {
        status?: string;
        limit?: number;
        offset?: number;
        search?: string;
    } = {}): Promise<{ projects: Project[]; total: number; performance: PerformanceMetrics }> {
        const startTime = Date.now();
        const cacheKey = `dashboard:projects:${JSON.stringify(options)}`;
        
        return await this.cache.getOrSet(
            cacheKey,
            async () => {
                if (!this.databasePrisma) {
                    throw new Error('Database not available');
                }

                const where: any = {};
                if (options.status) {
                    where.status = options.status;
                }
                if (options.search) {
                    where.OR = [
                        { name: { contains: options.search, mode: 'insensitive' } },
                        { type: { contains: options.search, mode: 'insensitive' } }
                    ];
                }

                const [projects, total] = await Promise.all([
                    this.databasePrisma.project.findMany({
                        where,
                        orderBy: { createdAt: 'desc' },
                        take: options.limit || 50,
                        skip: options.offset || 0,
                        include: {
                            user: {
                                select: {
                                    name: true,
                                    email: true
                                }
                            }
                        }
                    }),
                    this.databasePrisma.project.count({ where })
                ]);

                const queryTime = Date.now() - startTime;

                return {
                    projects,
                    total,
                    performance: {
                        queryTime,
                        cacheHit: false,
                        recordCount: projects.length
                    }
                };
            },
            { ttl: this.CACHE_TTL.PROJECT_LISTS }
        );
    }

    /**
     * Invalidate dashboard caches when data changes
     */
    async invalidateCaches(pattern?: string): Promise<void> {
        console.debug(`Invalidating dashboard caches: ${pattern || 'all'}`);
        
        const tagsToInvalidate = pattern === 'user-only' 
            ? ['dashboard:user']
            : ['dashboard:global', 'dashboard:user', 'dashboard:projects'];

        for (const tag of tagsToInvalidate) {
            await this.cache.invalidateByTags([tag]);
        }
    }

    // Private helper methods for data aggregation

    private async getUserCounts(): Promise<{ total: number; recent: number }> {
        const [total, recent] = await Promise.all([
            this.databasePrisma!.user.count(),
            this.databasePrisma!.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            })
        ]);

        return { total, recent };
    }

    private async getProjectCounts(): Promise<{ total: number }> {
        const total = await this.databasePrisma!.project.count();
        return { total };
    }

    private async getRevenueData(): Promise<{ totalRevenue: number }> {
        const result = await this.databasePrisma!.invoice.aggregate({
            where: { status: 'paid' },
            _sum: { amount: true }
        });

        return { totalRevenue: Number(result._sum.amount) || 0 };
    }

    private async getProjectStatusDistribution(): Promise<Array<{ status: string; count: number }>> {
        const result = await this.databasePrisma!.project.groupBy({
            by: ['status'],
            _count: true
        });

        return result.map(item => ({
            status: item.status,
            count: item._count
        }));
    }

    private async getRecentRegistrations(): Promise<{ recent: number }> {
        // Already included in getUserCounts, but keeping for structure
        const recent = await this.databasePrisma!.user.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });

        return { recent };
    }

    private async getMonthlyTrends(): Promise<Array<{ month: string; projects: number; users: number }>> {
        const months = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

            const [projects, users] = await Promise.all([
                this.databasePrisma!.project.count({
                    where: {
                        createdAt: {
                            gte: month,
                            lt: nextMonth
                        }
                    }
                }),
                this.databasePrisma!.user.count({
                    where: {
                        createdAt: {
                            gte: month,
                            lt: nextMonth
                        }
                    }
                })
            ]);

            months.push({
                month: month.toISOString().slice(0, 7),
                projects,
                users
            });
        }

        return months;
    }

    private processStatusDistribution(data: Array<{ status: string; count: number }>): Record<string, number> {
        return data.reduce((acc, item) => {
            acc[item.status] = item.count;
            return acc;
        }, {} as Record<string, number>);
    }

    private calculateConversionRate(totalUsers: number, totalProjects: number): number {
        return totalUsers > 0 ? (totalProjects / totalUsers) * 100 : 0;
    }

    private calculateAverageProjectValue(totalRevenue: number, totalProjects: number): number {
        return totalProjects > 0 ? totalRevenue / totalProjects : 0;
    }

    private calculateMonthlyGrowth(monthlyData: Array<{ month: string; projects: number; users: number }>): number {
        if (monthlyData.length < 2) return 0;

        const latest = monthlyData[monthlyData.length - 1];
        const previous = monthlyData[0];

        return previous.projects > 0 
            ? ((latest.projects - previous.projects) / previous.projects) * 100 
            : 0;
    }

    /**
     * Get cache performance metrics
     */
    async getCacheMetrics(): Promise<{
        stats: any;
        health: any;
        recommendations: string[];
    }> {
        const [stats, health] = await Promise.all([
            this.cache.getStats(),
            this.cache.healthCheck()
        ]);

        const recommendations = [];
        
        if (stats.hitRate < 80) {
            recommendations.push('Consider increasing cache TTL for frequently accessed data');
        }
        
        if (!health.isHealthy) {
            recommendations.push('Cache service health check failed - check Redis connection');
        }

        if (stats.errors > 0) {
            recommendations.push(`${stats.errors} cache errors detected - check cache service logs`);
        }

        return {
            stats,
            health,
            recommendations
        };
    }
}

/**
 * Factory function to create dashboard service with proper dependencies
 */
export function createDashboardService(prismaInstance: PrismaClient): DashboardService {
    return new DashboardService(prismaInstance, cacheService);
}

// Export factory function for standalone usage
export function createDashboardServiceFromLocals(locals: any): DashboardService {
    const prismaInstance = getPrisma(locals);
    return new DashboardService(prismaInstance, cacheService);
}

export type { DashboardStats, UserDashboardData, PerformanceMetrics };