/**
 * Admin Service Layer
 * Centralized business logic for admin operations
 * Follows atomic modularity principle - reusable across API routes
 */

import type { PrismaClient } from '@prisma/client';
import type { Project } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

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
    constructor(private prisma: PrismaClient) {}

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<AdminDashboardStats> {
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
        const where: any = {};
        
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
            data,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                createdAt: true
            }
        });

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
    }

    /**
     * Check if email exists (excluding current user)
     */
    async isEmailExists(email: string, excludeId?: string): Promise<boolean> {
        const where: any = { email };
        
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

export function createAdminService(prisma: PrismaClient): AdminUserService {
    return new AdminUserService(prisma);
}