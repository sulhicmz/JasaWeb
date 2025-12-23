/**
 * Admin Service Layer
 * Centralized business logic for admin operations
 * Follows atomic modularity principle - reusable across API routes
 */

import type { PrismaClient } from '@prisma/client';
import type { Project } from '@prisma/client';
import type { KVNamespace } from '@/lib/types';
import { hashPassword } from '@/lib/auth';
import { createDashboardCacheService } from '@/lib/dashboard-cache';

// ==============================================
// SERVICE INTERFACES
// ==============================================

export interface AdminDashboardStats {
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    activeProjects: number;
    pendingPayments: number;
    recentUsers: {
        id: string;
        name: string;
        email: string;
        role: string;
        createdAt: Date;
    }[];
    recentProjects: (Project & { 
        user: {
            id: string;
            name: string;
            email: string;
        };
    })[];
}

export interface CreateUserData extends Record<string, unknown> {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role: 'admin' | 'client';
}

export interface UpdateUserData extends Record<string, unknown> {
    name?: string;
    email?: string;
    phone?: string;
    role?: 'admin' | 'client';
}

export interface UserListOptions {
    page?: number;
    limit?: number;
    search?: string;
    role?: 'admin' | 'client';
    sortBy?: 'name' | 'email' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsers {
    users: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: Date;
    }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ==============================================
// USER MANAGEMENT SERVICE
// ==============================================

export class AdminUserService {
    private cacheService: ReturnType<typeof createDashboardCacheService>;

    constructor(
        private prisma: PrismaClient,
        kv?: KVNamespace
    ) {
        this.cacheService = kv ? createDashboardCacheService(kv) : null as any;
    }

    /**
     * Get dashboard statistics with Redis caching
     */
    async getDashboardStats(): Promise<AdminDashboardStats> {
        // If cache service is available, try cache-aside pattern
        if (this.cacheService) {
            return this.getDashboardStatsWithCache();
        }

        // Fallback to direct database queries
        return this.getDashboardStatsFromDB();
    }

    /**
     * Get dashboard statistics using cache-aside pattern
     */
    private async getDashboardStatsWithCache(): Promise<AdminDashboardStats> {
        // Try to get recent users and projects from cache first
        const [cachedRecentUsers, cachedRecentProjects] = await Promise.all([
            this.cacheService.getOrSetRecentUsers(() => 
                this.prisma.user.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        createdAt: true
                    }
                })
            ),
            this.cacheService.getOrSetRecentProjects(() =>
                this.prisma.project.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                })
            )
        ]);

        // Get or set main dashboard stats from cache
        const cachedStats = await this.cacheService.getOrSetDashboardStats(
            async () => {
                const [
                    totalUsers,
                    totalProjects,
                    totalRevenue,
                    activeProjects,
                    pendingPayments
                ] = await Promise.all([
                    this.prisma.user.count(),
                    this.prisma.project.count(),
                    this.prisma.invoice.aggregate({
                        where: { status: 'paid' },
                        _sum: { amount: true }
                    }),
                    this.prisma.project.count({
                        where: { status: { in: ['in_progress', 'review'] } }
                    }),
                    this.prisma.invoice.count({
                        where: { status: 'unpaid' }
                    })
                ]);

                return {
                    totalUsers,
                    totalProjects,
                    totalRevenue: Number(totalRevenue._sum.amount || 0),
                    activeProjects,
                    pendingPayments
                };
            }
        );

        return {
            totalUsers: cachedStats.totalUsers,
            totalProjects: cachedStats.totalProjects,
            totalRevenue: cachedStats.totalRevenue,
            activeProjects: cachedStats.activeProjects,
            pendingPayments: cachedStats.pendingPayments,
            recentUsers: cachedRecentUsers.items,
            recentProjects: cachedRecentProjects.items
        };
    }

    /**
     * Get dashboard statistics directly from database (fallback)
     */
    private async getDashboardStatsFromDB(): Promise<AdminDashboardStats> {
        const [
            totalUsers,
            totalProjects,
            totalRevenue,
            activeProjects,
            pendingPayments,
            recentUsers,
            recentProjects
        ] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.project.count(),
            this.prisma.invoice.aggregate({
                where: { status: 'paid' },
                _sum: { amount: true }
            }),
            this.prisma.project.count({
                where: { status: { in: ['in_progress', 'review'] } }
            }),
            this.prisma.invoice.count({
                where: { status: 'unpaid' }
            }),
            this.prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            }),
            this.prisma.project.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            })
        ]);

        return {
            totalUsers,
            totalProjects,
            totalRevenue: Number(totalRevenue._sum.amount || 0),
            activeProjects,
            pendingPayments,
            recentUsers,
            recentProjects
        };
    }

    /**
     * Get paginated list of users
     */
    async getUsers(options: UserListOptions = {}): Promise<PaginatedUsers> {
        const {
            page = 1,
            limit = 10,
            search,
            role,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};
        
        if (role) {
            where.role = role;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        // Get users and total count
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    createdAt: true
                }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(id: string): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: Date;
    } | null> {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });
    }

    /**
     * Create new user
     */
    async createUser(data: CreateUserData): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: Date;
    }> {
        const hashedPassword = await hashPassword(data.password);

        const user = await this.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone || null,
                password: hashedPassword,
                role: data.role
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });

        // Invalidate dashboard cache when user is created
        if (this.cacheService) {
            await Promise.all([
                this.cacheService.invalidateDashboardStats(),
                this.cacheService.invalidateRecentItems()
            ]);
        }

        return user;
    }

    /**
     * Update existing user
     */
    async updateUser(id: string, data: UpdateUserData): Promise<{
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: Date;
    }> {
        const user = await this.prisma.user.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.role && { role: data.role })
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });

        // Invalidate relevant cache when user is updated
        if (this.cacheService) {
            await Promise.all([
                this.cacheService.invalidateDashboardStats(),
                this.cacheService.invalidateRecentItems(),
                this.cacheService.invalidateUserStats(id)
            ]);
        }

        return user;
    }

    /**
     * Delete user
     */
    async deleteUser(id: string): Promise<void> {
        // Check if user has projects
        const projectCount = await this.prisma.project.count({
            where: { userId: id }
        });

        if (projectCount > 0) {
            throw new Error('Cannot delete user with existing projects');
        }

        await this.prisma.user.delete({
            where: { id }
        });

        // Invalidate cache when user is deleted
        if (this.cacheService) {
            await Promise.all([
                this.cacheService.invalidateDashboardStats(),
                this.cacheService.invalidateRecentItems(),
                this.cacheService.invalidateUserStats(id)
            ]);
        }
    }

    /**
     * Check if email exists (excluding current user)
     */
    async isEmailExists(email: string, excludeId?: string): Promise<boolean> {
        const where: Record<string, unknown> = { email };
        
        if (excludeId) {
            where.NOT = { id: excludeId };
        }

        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        return user !== null;
    }
}

// ==============================================
// FACTORY FUNCTION
// ==============================================

export function createAdminService(
    prisma: PrismaClient,
    kv?: KVNamespace
): AdminUserService {
    return new AdminUserService(prisma, kv);
}