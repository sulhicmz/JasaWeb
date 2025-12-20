/**
 * Blog Service
 * Business logic for blog post management
 */

import { PrismaClient, PostStatus, type Post } from '@prisma/client';
import { BaseCrudService, type ListOptions, type PaginationResult } from './crud';

// ==============================================
// TYPES
// ==============================================

export interface CreatePostData {
    title: string;
    content: string;
    featuredImage?: string;
    status?: PostStatus;
}

export interface UpdatePostData {
    title?: string;
    content?: string;
    featuredImage?: string;
    status?: PostStatus;
}

export type PostWithDates = Omit<Post, 'publishedAt'> & {
    publishedAt: string | null;
};

// ==============================================
// BLOG SERVICE
// ==============================================

export class BlogService extends BaseCrudService<Post, CreatePostData, UpdatePostData> {
    constructor(prisma: PrismaClient) {
        super(prisma, 'post', {
            id: true,
            title: true,
            slug: true,
            content: true,
            featuredImage: true,
            status: true,
            publishedAt: true,
            createdAt: true
        });
    }

    protected buildSearchFields(search: string): any[] {
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

    async create(data: CreatePostData): Promise<Post> {
        const slug = this.generateSlug(data.title);
        
        const model = this.prisma[this.modelName] as any;
        return model.create({
            data: {
                ...data,
                slug,
                publishedAt: data.status === 'published' ? new Date() : null
            },
            select: this.defaultSelect
        });
    }

    async update(id: string, data: UpdatePostData): Promise<Post> {
        const updateData: any = { ...data };
        
        // Generate new slug if title is changed
        if (data.title) {
            updateData.slug = this.generateSlug(data.title);
        }
        
        // Set publishedAt when publishing
        if (data.status === 'published') {
            updateData.publishedAt = new Date();
        }
        
        return await super.update(id, updateData);
    }

    async findBySlug(slug: string): Promise<Post | null> {
        const model = this.prisma[this.modelName] as any;
        return model.findUnique({
            where: { slug },
            select: this.defaultSelect
        });
    }

    async getPublishedPosts(options: ListOptions = {}): Promise<PaginationResult<Post>> {
        return this.list({
            ...options,
            filters: {
                ...options.filters,
                status: 'published'
            }
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