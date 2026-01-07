/**
 * Business Intelligence Service
 * Aggregates complex metrics for analytics and reporting
 */

import { PrismaClient } from '@prisma/client';
import { createDashboardCacheService } from '@/lib/dashboard-cache';
import type { KVNamespace } from '@/lib/types';

export interface RevenueAnalytics {
    totalRevenue: number;
    revenueByPeriod: {
        date: string;
        amount: number;
    }[];
    averageRevenuePerUser: number;
    revenueByProjectType: {
        type: string;
        amount: number;
        percentage: number;
    }[];
}

export interface UserGrowthAnalytics {
    totalUsers: number;
    newUsersByPeriod: {
        date: string;
        count: number;
    }[];
    activeUsers: number; // Users with recent activity
}

export interface ProjectAnalytics {
    totalProjects: number;
    projectsByStatus: {
        status: string;
        count: number;
    }[];
    projectsByType: {
        type: string;
        count: number;
    }[];
    conversionRate: number; // Users with paid projects / Total Users
}

export class BusinessIntelligenceService {
    private cacheService: ReturnType<typeof createDashboardCacheService> | null;

    constructor(
        private prisma: PrismaClient,
        kv?: KVNamespace
    ) {
        this.cacheService = kv ? createDashboardCacheService(kv) : null;
    }

    /**
     * Get Revenue Analytics
     */
    async getRevenueAnalytics(period: 'daily' | 'monthly' = 'monthly'): Promise<RevenueAnalytics> {
        // Try cache for history
        let revenueByPeriod = this.cacheService ? await this.cacheService.getBIRevenueHistory(period) : null;

        if (!revenueByPeriod) {
            // Calculate revenue by period
            // Note: Prisma doesn't support date truncation directly easily without raw queries or processing in JS
            // For simplicity and DB agnostic, we'll fetch and process. For scale, use raw SQL.

            const invoices = await this.prisma.invoice.findMany({
                where: { status: 'paid' },
                select: { amount: true, paidAt: true }
            });

            const grouped = new Map<string, number>();

            invoices.forEach(inv => {
                if (!inv.paidAt) return;
                const date = period === 'daily'
                    ? inv.paidAt.toISOString().split('T')[0]
                    : inv.paidAt.toISOString().slice(0, 7); // YYYY-MM

                const current = grouped.get(date) || 0;
                grouped.set(date, current + Number(inv.amount));
            });

            // Fill gaps or just sort? Let's just sort for now.
            revenueByPeriod = Array.from(grouped.entries())
                .map(([date, amount]) => ({ date, amount }))
                .sort((a, b) => a.date.localeCompare(b.date));

            if (this.cacheService) {
                await this.cacheService.setBIRevenueHistory(period, { items: revenueByPeriod });
            }
        } else {
            revenueByPeriod = revenueByPeriod.items;
        }

        // Revenue by Project Type
        let revenueByType = this.cacheService ? await this.cacheService.getBIRevenueByType() : null;

        if (!revenueByType) {
            const byType = await this.prisma.invoice.findMany({
                where: { status: 'paid' },
                include: { project: { select: { type: true } } }
            });

            const typeGroups = new Map<string, number>();
            let total = 0;

            byType.forEach(inv => {
                const type = inv.project.type;
                const amount = Number(inv.amount);
                const current = typeGroups.get(type) || 0;
                typeGroups.set(type, current + amount);
                total += amount;
            });

            revenueByType = Array.from(typeGroups.entries()).map(([type, amount]) => ({
                type,
                amount,
                percentage: total > 0 ? (amount / total) * 100 : 0
            }));

            if (this.cacheService) {
                await this.cacheService.setBIRevenueByType({ items: revenueByType });
            }
        } else {
            revenueByType = revenueByType.items;
        }

        // Totals
        const totalRevenueResult = await this.prisma.invoice.aggregate({
            where: { status: 'paid' },
            _sum: { amount: true }
        });
        const totalRevenue = Number(totalRevenueResult._sum.amount || 0);

        const totalUsers = await this.prisma.user.count();
        const averageRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0;

        return {
            totalRevenue,
            revenueByPeriod,
            averageRevenuePerUser,
            revenueByProjectType: revenueByType
        };
    }

    /**
     * Get User Growth Analytics
     */
    async getUserGrowthAnalytics(period: 'daily' | 'monthly' = 'monthly'): Promise<UserGrowthAnalytics> {
        let newUsersByPeriod = this.cacheService ? await this.cacheService.getBIUserGrowth(period) : null;

        if (!newUsersByPeriod) {
             const users = await this.prisma.user.findMany({
                select: { createdAt: true }
            });

            const grouped = new Map<string, number>();

            users.forEach(u => {
                const date = period === 'daily'
                    ? u.createdAt.toISOString().split('T')[0]
                    : u.createdAt.toISOString().slice(0, 7); // YYYY-MM

                const current = grouped.get(date) || 0;
                grouped.set(date, current + 1);
            });

            newUsersByPeriod = Array.from(grouped.entries())
                .map(([date, count]) => ({ date, count }))
                .sort((a, b) => a.date.localeCompare(b.date));

            if (this.cacheService) {
                await this.cacheService.setBIUserGrowth(period, { items: newUsersByPeriod });
            }
        } else {
            newUsersByPeriod = newUsersByPeriod.items;
        }

        const totalUsers = await this.prisma.user.count();

        // Active Users (proxy: Users who logged in or created projects in last 30 days)
        // Since we don't have a reliable lastLogin field on User, we check AuditLogs or recent Projects
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const activeUserIds = new Set<string>();

        // Users with recent projects
        const recentProjectUsers = await this.prisma.project.findMany({
            where: { updatedAt: { gte: thirtyDaysAgo } },
            select: { userId: true },
            distinct: ['userId']
        });
        recentProjectUsers.forEach(p => activeUserIds.add(p.userId));

        // Users with recent audit logs (login, etc)
        const recentAuditUsers = await this.prisma.auditLog.findMany({
            where: {
                timestamp: { gte: thirtyDaysAgo },
                userId: { not: null }
            },
            select: { userId: true },
            distinct: ['userId']
        });
        recentAuditUsers.forEach(l => { if(l.userId) activeUserIds.add(l.userId); });

        return {
            totalUsers,
            newUsersByPeriod,
            activeUsers: activeUserIds.size
        };
    }

    /**
     * Get Project Analytics
     */
    async getProjectAnalytics(): Promise<ProjectAnalytics> {
        const totalProjects = await this.prisma.project.count();

        const [byStatus, byType] = await Promise.all([
            this.prisma.project.groupBy({
                by: ['status'],
                _count: { status: true }
            }),
            this.prisma.project.groupBy({
                by: ['type'],
                _count: { type: true }
            })
        ]);

        const projectsByStatus = byStatus.map(g => ({ status: g.status, count: g._count.status }));
        const projectsByType = byType.map(g => ({ type: g.type, count: g._count.type }));

        // Conversion Rate
        const totalUsers = await this.prisma.user.count();
        const paidUsers = await this.prisma.invoice.findMany({
            where: { status: 'paid' },
            select: { project: { select: { userId: true } } },
            distinct: ['projectId'] // Actually we want distinct users
        });

        // Improve distinct user count
        const uniquePaidUsers = new Set(paidUsers.map(p => p.project.userId)).size;

        const conversionRate = totalUsers > 0 ? (uniquePaidUsers / totalUsers) * 100 : 0;

        return {
            totalProjects,
            projectsByStatus,
            projectsByType,
            conversionRate
        };
    }

    /**
     * Get High-level Summary
     */
    async getBISummary() {
        // Check cache
        const cached = this.cacheService ? await this.cacheService.getBISummary() : null;
        if (cached) return cached;

        const [revenue, users, projects] = await Promise.all([
            this.getRevenueAnalytics(),
            this.getUserGrowthAnalytics(),
            this.getProjectAnalytics()
        ]);

        const summary = {
            revenue: {
                total: revenue.totalRevenue,
                arpu: revenue.averageRevenuePerUser
            },
            users: {
                total: users.totalUsers,
                active: users.activeUsers
            },
            projects: {
                total: projects.totalProjects,
                conversionRate: projects.conversionRate
            },
            generatedAt: new Date().toISOString()
        };

        if (this.cacheService) {
            await this.cacheService.setBISummary(summary);
        }

        return summary;
    }
}

export function createBIService(prisma: PrismaClient, kv?: KVNamespace) {
    return new BusinessIntelligenceService(prisma, kv);
}
