/**
 * Unified Project Service
 * Consolidates project-related business logic from admin, client, and domain layers
 * Eliminates code duplication and provides single source of truth for project operations
 */

import type { PrismaClient } from '@prisma/client';
import { BaseCrudService } from '../admin/crud';
import type { Project } from '../../lib/types';

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

export interface ProjectStatus {
    label: string;
    variant: 'primary' | 'success' | 'warning' | 'default';
}

export interface ProjectDisplayData {
    id: string;
    name: string;
    type: string;
    status: string;
    statusLabel: string;
    createdAt: string;
    url?: string;
}

// ==============================================
// UNIFIED PROJECT SERVICE
// ==============================================

/**
 * Unified Project Service combining admin, client, and domain functionality
 * Provides comprehensive project management capabilities
 */
export class ProjectService extends BaseCrudService<ProjectWithUser, CreateProjectData, UpdateProjectData> {
    constructor(prisma: PrismaClient) {
        super(prisma, 'project', {
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    }

    // ==============================================
    // ADMIN OPERATIONS
    // ==============================================

    async updateProjectStatus(
        id: string,
        status: UpdateProjectData['status'],
        url?: string,
        credentials?: Record<string, string>
    ): Promise<ProjectWithUser> {
        const updateData: UpdateProjectData = { status };
        if (url !== undefined) updateData.url = url;
        if (credentials) updateData.credentials = credentials;

        return this.update(id, updateData);
    }

    async getProjectsByStatus(status: string): Promise<ProjectWithUser[]> {
        const projects = await this.prisma.project.findMany({
            where: { status: status as any },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        
        return projects as ProjectWithUser[];
    }

    async getProjectsByUser(userId: string): Promise<ProjectWithUser[]> {
        const projects = await this.prisma.project.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        
        return projects as ProjectWithUser[];
    }

    /**
     * Get project by ID
     */
    async getProjectById(id: string): Promise<ProjectWithUser | null> {
        const project = await this.prisma.project.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
        
        return project as ProjectWithUser | null;
    }

    /**
     * Get projects with pagination and filters
     */
    async getProjects(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        type?: string;
        userId?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }): Promise<{
        projects: ProjectWithUser[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }> {
        const {
            page,
            limit,
            search,
            status,
            type,
            userId,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = options;

        const skip = (page - 1) * limit;

        // Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { user: { name: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (status) where.status = status as any;
        if (type) where.type = type as any;
        if (userId) where.userId = userId;

        // Get total count
        const total = await this.prisma.project.count({ where });

        // Get projects
        const projects = await this.prisma.project.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take: limit,
        });

        return {
            projects: projects as ProjectWithUser[],
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    // ==============================================
    // CLIENT OPERATIONS
    // ==============================================

    /**
     * Transform project data for client display
     */
    static transformProjectForDisplay(project: Project): ProjectDisplayData {
        return {
            id: project.id,
            name: project.name,
            type: project.type,
            status: project.status,
            statusLabel: this.getProjectStatusLabel(project.status),
            createdAt: new Date(project.createdAt).toLocaleDateString('id-ID'),
            url: project.url || undefined
        };
    }

    /**
     * Get human-readable status label
     */
    static getProjectStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            pending_payment: 'Menunggu Bayar',
            in_progress: 'Dalam Proses',
            review: 'Review',
            completed: 'Selesai'
        };
        return labels[status] || status;
    }

    // ==============================================
    // DOMAIN OPERATIONS
    // ==============================================

    /**
     * Map project status to display information
     */
    static getStatusBadge(status: string): ProjectStatus {
        const statusMap: Record<string, ProjectStatus> = {
            pending_payment: { label: 'Menunggu Bayar', variant: 'warning' },
            in_progress: { label: 'Dalam Proses', variant: 'primary' },
            review: { label: 'Review', variant: 'default' },
            completed: { label: 'Selesai', variant: 'success' },
        };
        return statusMap[status] || { label: status, variant: 'default' };
    }

    /**
     * Generate project card HTML
     */
    static generateProjectCard(project: Project): string {
        const badge = this.getStatusBadge(project.status);
        const variantColor = this.getVariantColor(badge.variant);
        
        return `
            <div class="project-card">
                <div class="project-info">
                    <div class="project-name">${project.name}</div>
                    <div class="project-type">${project.type}</div>
                    <div class="project-meta">
                        <span>Dibuat: ${new Date(project.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                </div>
                <div class="project-actions">
                    <span class="status-badge" style="background: ${variantColor}">${badge.label}</span>
                    ${project.url ? `<a href="${project.url}" target="_blank" class="project-link">Kunjungi →</a>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get CSS color for status variant
     */
    private static getVariantColor(variant: string): string {
        const colorMap = {
            primary: 'var(--color-primary)',
            success: 'var(--color-success)',
            warning: 'var(--color-secondary)',
            default: 'var(--color-bg-tertiary)',
        };
        return colorMap[variant as keyof typeof colorMap] || colorMap.default;
    }

    /**
     * Load and render projects for client dashboard
     */
    static async loadProjects(): Promise<string> {
        try {
            const res = await fetch('/api/client/projects');
            const data = await res.json();

            if (!res.ok || !data.success) {
                return '<div class="empty-state">Gagal memuat proyek</div>';
            }

            if (data.data.length === 0) {
                return `
                    <div class="empty-state">
                        <p>Belum ada proyek. <a href="/layanan" style="color:var(--color-primary)">Pesan sekarang</a></p>
                    </div>
                `;
            }

            return data.data.map((project: Project) => this.generateProjectCard(project)).join('');
        } catch {
            return '<div class="empty-state">Terjadi kesalahan</div>';
        }
    }

    // ==============================================
    // VALIDATION
    // ==============================================

    /**
     * Validate project data
     */
    protected validateCreateData(data: CreateProjectData): string[] {
        const errors: string[] = [];
        
        if (!data.name || data.name.trim().length < 3) {
            errors.push('Nama proyek minimal 3 karakter');
        }
        
        if (!['sekolah', 'berita', 'company'].includes(data.type)) {
            errors.push('Tipe proyek tidak valid');
        }
        
        if (!data.userId) {
            errors.push('User ID diperlukan');
        }
        
        if (data.url && !this.isValidUrl(data.url)) {
            errors.push('URL tidak valid');
        }
        
        return errors;
    }

    /**
     * Validate update data
     */
    protected validateUpdateData(data: UpdateProjectData): string[] {
        const errors: string[] = [];
        
        if (data.name !== undefined && data.name.trim().length < 3) {
            errors.push('Nama proyek minimal 3 karakter');
        }
        
        if (data.type !== undefined && !['sekolah', 'berita', 'company'].includes(data.type)) {
            errors.push('Tipe proyek tidak valid');
        }
        
        if (data.url !== undefined && data.url !== null && !this.isValidUrl(data.url)) {
            errors.push('URL tidak valid');
        }
        
        return errors;
    }

    /**
     * Check if URL is valid
     */
    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
}