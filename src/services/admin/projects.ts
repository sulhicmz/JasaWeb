/**
 * Admin Project Management Service
 * Business logic for admin project CRUD operations
 * Extends base CRUD utilities with project-specific functionality
 */

import type { PrismaClient } from '@prisma/client';
import { BaseCrudService, type ListOptions } from './crud';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

export interface ProjectWithUser {
    id: string;
    name: string;
    type: 'sekolah' | 'berita' | 'company';
    status: 'pending_payment' | 'in_progress' | 'review' | 'completed';
    url: string | null;
    credentials: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
    };
}

export interface CreateProjectData {
    name: string;
    type: 'sekolah' | 'berita' | 'company';
    userId: string;
    status?: 'pending_payment' | 'in_progress' | 'review' | 'completed';
    url?: string;
    credentials?: Record<string, unknown>;
}

export interface UpdateProjectData {
    name?: string;
    type?: 'sekolah' | 'berita' | 'company';
    status?: 'pending_payment' | 'in_progress' | 'review' | 'completed';
    url?: string | null;
    credentials?: Record<string, string> | null;
}

// ==============================================
// PROJECT SERVICE CLASS
// ==============================================

export class ProjectService extends BaseCrudService<
    ProjectWithUser,
    CreateProjectData,
    UpdateProjectData
> {
    constructor(prisma: PrismaClient) {
        super(
            prisma,
            'project',
            {
                id: true,
                name: true,
                type: true,
                status: true,
                url: true,
                credentials: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            } as Record<string, unknown>
        );
    }

    protected buildSearchFields(search: string): Record<string, unknown>[] {
        return [
            { name: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
        ];
    }

    protected getDefaultListOptions(): Required<Omit<ListOptions, 'filters' | 'search'>> {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc'
        };
    }

    protected buildWhereClause(options: ListOptions): Record<string, unknown> {
        const where: Record<string, unknown> = {};

        // Add search functionality
        if (options.search) {
            where.OR = this.buildSearchFields(options.search);
        }

        // Add specific filters
        if (options.filters) {
            if (options.filters.status) {
                where.status = options.filters.status;
            }
            if (options.filters.type) {
                where.type = options.filters.type;
            }
            if (options.filters.userId) {
                where.userId = options.filters.userId;
            }
        }

        return where;
    }

    // ==============================================
    // PROJECT-SPECIFIC METHODS
    // ==============================================

    async getProjects(options: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
        type?: string;
        userId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Promise<{
        projects: ProjectWithUser[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const filters: Record<string, unknown> = {};
        if (options.status) filters.status = options.status;
        if (options.type) filters.type = options.type;
        if (options.userId) filters.userId = options.userId;

        const result = await this.list({
            page: options.page,
            limit: options.limit,
            search: options.search,
            filters,
            sortBy: options.sortBy,
            sortOrder: options.sortOrder
        });

        return {
            projects: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }
        };
    }

    async getProjectById(id: string): Promise<ProjectWithUser | null> {
        return this.findById(id);
    }

    async createProject(data: CreateProjectData): Promise<ProjectWithUser> {
        // Validate user exists
        const user = await (this.prisma as PrismaClient & {
            user: {
                findUnique: (args: { where: { id: string } }) => Promise<{ id: string } | null>;
            };
        }).user.findUnique({
            where: { id: data.userId }
        });

        if (!user) {
            throw new Error('User tidak ditemukan');
        }

        // Validate project type
        if (!['sekolah', 'berita', 'company'].includes(data.type)) {
            throw new Error('Tipe project harus "sekolah", "berita", atau "company"');
        }

        // Validate status if provided
        if (data.status && !['pending_payment', 'in_progress', 'review', 'completed'].includes(data.status)) {
            throw new Error('Status project tidak valid');
        }

        // Create project
        const projectData: CreateProjectData = {
            name: data.name,
            type: data.type,
            userId: data.userId,
            status: data.status || 'pending_payment'
        };

        if (data.url !== undefined) projectData.url = data.url;
        if (data.credentials !== undefined) projectData.credentials = data.credentials;

        return this.create(projectData);
    }

    async updateProject(id: string, data: UpdateProjectData): Promise<ProjectWithUser> {
        // Validate project exists
        const existingProject = await this.findById(id);
        if (!existingProject) {
            throw new Error('Project tidak ditemukan');
        }

        const updateData: Partial<UpdateProjectData> = {};

        // Validate and add fields
        if (data.name !== undefined) updateData.name = data.name;
        if (data.type !== undefined) {
            if (!['sekolah', 'berita', 'company'].includes(data.type)) {
                throw new Error('Tipe project harus "sekolah", "berita", atau "company"');
            }
            updateData.type = data.type;
        }
        if (data.status !== undefined) {
            if (!['pending_payment', 'in_progress', 'review', 'completed'].includes(data.status)) {
                throw new Error('Status project tidak valid');
            }
            updateData.status = data.status;
        }
        if (data.url !== undefined) updateData.url = data.url;
        if (data.credentials !== undefined) updateData.credentials = data.credentials;

        return this.update(id, updateData);
    }

    async getProjectStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        recentlyUpdated: ProjectWithUser[];
    }> {
        const prismaExtended = this.prisma as PrismaClient & {
            project: {
                count: () => Promise<number>;
                groupBy: (args: { by: string[]; _count: boolean }) => Promise<Array<{
                    status?: string;
                    type?: string;
                    _count: number;
                }>>;
                findMany: (args: {
                    take: number;
                    orderBy: Record<string, 'desc'>;
                    include: {
                        user: {
                            select: {
                                id: boolean;
                                name: boolean;
                                email: boolean;
                                phone: boolean;
                            };
                        };
                    };
                }) => Promise<ProjectWithUser[]>;
            };
        };

        const [
            total,
            statusStats,
            typeStats,
            recentProjects
        ] = await Promise.all([
            prismaExtended.project.count(),
            prismaExtended.project.groupBy({
                by: ['status'],
                _count: true
            }),
            prismaExtended.project.groupBy({
                by: ['type'],
                _count: true
            }),
            prismaExtended.project.findMany({
                take: 5,
                orderBy: { updatedAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true
                        }
                    }
                }
            })
        ]);

        const byStatus = statusStats.reduce((acc: Record<string, number>, item) => {
            if (item.status) acc[item.status] = item._count;
            return acc;
        }, {});

        const byType = typeStats.reduce((acc: Record<string, number>, item) => {
            if (item.type) acc[item.type] = item._count;
            return acc;
        }, {});

        return {
            total,
            byStatus,
            byType,
            recentlyUpdated: recentProjects as ProjectWithUser[]
        };
    }
}

// ==============================================
// SERVICE FACTORY
// ==============================================

export function createProjectService(prisma: PrismaClient): ProjectService {
    return new ProjectService(prisma);
}