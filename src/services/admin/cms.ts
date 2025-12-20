/**
 * CMS Service
 * Business logic for CMS page management
 */

import { PrismaClient, type Page } from '@prisma/client';
import { BaseCrudService } from './crud';

// ==============================================
// TYPES
// ==============================================

export interface CreatePageData {
    title: string;
    content: string;
}

export interface UpdatePageData {
    title?: string;
    content?: string;
}

// ==============================================
// CMS SERVICE
// ==============================================

export class CmsService extends BaseCrudService<Page, CreatePageData, UpdatePageData> {
    constructor(prisma: PrismaClient) {
        super(prisma, 'page', {
            id: true,
            title: true,
            slug: true,
            content: true,
            createdAt: true,
            updatedAt: true
        });
    }

    protected buildSearchFields(search: string): Record<string, unknown>[] {
        return [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } }
        ];
    }

    protected getDefaultListOptions() {
        return {
            page: 1,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc' as const
        };
    }

    async create(data: CreatePageData): Promise<Page> {
        const slug = this.generateSlug(data.title);
        
        const model = this.prisma[this.modelName] as unknown as {
            create: (args: { data: CreatePageData & { slug: string }; select: Record<string, unknown> }) => Promise<Page>;
        };
        return model.create({
            data: {
                ...data,
                slug
            },
            select: this.defaultSelect
        });
    }

    async update(id: string, data: UpdatePageData): Promise<Page> {
        const updateData: CreatePageData & { slug: string } = { ...data } as CreatePageData & { slug: string };
        
        // Generate new slug if title is changed
        if (data.title) {
            updateData.slug = this.generateSlug(data.title);
        }
        
        const model = this.prisma[this.modelName] as unknown as {
            update: (args: { where: { id: string }; data: unknown; select: Record<string, unknown> }) => Promise<Page>;
        };
        return model.update({
            where: { id },
            data: updateData,
            select: this.defaultSelect
        });
    }

    async findBySlug(slug: string): Promise<Page | null> {
        const model = this.prisma[this.modelName] as unknown as {
            findUnique: (args: { where: { slug: string }; select: Record<string, unknown> }) => Promise<Page | null>;
        };
        return model.findUnique({
            where: { slug },
            select: this.defaultSelect
        });
    }

    private generateSlug(title: string): string {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
}