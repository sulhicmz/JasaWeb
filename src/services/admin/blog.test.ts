/**
 * Blog Service Tests
 * Unit tests for blog post management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlogService } from '@/services/admin/blog';

// Mock Prisma Client
const mockPrisma = {
    post: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
    }
};

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrisma)
}));

describe('BlogService', () => {
    let blogService: BlogService;

    beforeEach(() => {
        blogService = new BlogService(mockPrisma as any);
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should return paginated blog posts', async () => {
            const mockPosts = [
                {
                    id: '1',
                    title: 'Test Post',
                    slug: 'test-post',
                    content: 'Test content',
                    status: 'published',
                    publishedAt: new Date(),
                    createdAt: new Date()
                }
            ];

            mockPrisma.post.findMany.mockResolvedValue(mockPosts);
            mockPrisma.post.count.mockResolvedValue(1);

            const result = await blogService.list({ page: 1, limit: 10 });

            expect(result.items).toEqual(mockPosts);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });

        it('should filter by status', async () => {
            mockPrisma.post.findMany.mockResolvedValue([]);
            mockPrisma.post.count.mockResolvedValue(0);

            await blogService.list({
                filters: { status: 'published' }
            });

            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        status: 'published'
                    })
                })
            );
        });

        it('should search posts by title and content', async () => {
            mockPrisma.post.findMany.mockResolvedValue([]);
            mockPrisma.post.count.mockResolvedValue(0);

            await blogService.list({ search: 'test' });

            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: [
                            { title: { contains: 'test', mode: 'insensitive' } },
                            { content: { contains: 'test', mode: 'insensitive' } }
                        ]
                    })
                })
            );
        });
    });

    describe('create', () => {
        it('should create a new blog post with slug', async () => {
            const postData = {
                title: 'Test Post Title',
                content: 'Test content',
                status: 'draft' as const
            };

            const mockCreatedPost = {
                id: '1',
                title: postData.title,
                slug: 'test-post-title',
                content: postData.content,
                status: postData.status,
                publishedAt: null,
                createdAt: new Date()
            };

            mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

            const result = await blogService.create(postData);

            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: {
                    ...postData,
                    slug: 'test-post-title',
                    publishedAt: null
                },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockCreatedPost);
        });

        it('should set publishedAt when publishing', async () => {
            const postData = {
                title: 'Published Post',
                content: 'Content',
                status: 'published' as const
            };

            const mockCreatedPost = {
                id: '1',
                title: postData.title,
                slug: 'published-post',
                content: postData.content,
                status: postData.status,
                publishedAt: new Date(),
                createdAt: new Date()
            };

            mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

            await blogService.create(postData);

            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: {
                    ...postData,
                    slug: 'published-post',
                    publishedAt: expect.any(Date)
                },
                select: expect.any(Object)
            });
        });

        it('should generate slug from title', async () => {
            const postData = {
                title: 'Test Post with Special Characters! @#$%',
                content: 'Content',
                status: 'draft' as const
            };

            mockPrisma.post.create.mockResolvedValue({
                id: '1',
                slug: 'test-post-with-special-characters',
                title: postData.title
            });

            await blogService.create(postData);

            expect(mockPrisma.post.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    slug: 'test-post-with-special-characters-'
                }),
                select: expect.any(Object)
            });
        });
    });

    describe('update', () => {
        it('should update blog post and regenerate slug if title changed', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const mockUpdatedPost = {
                id: '1',
                title: updateData.title,
                slug: 'updated-title',
                content: updateData.content,
                status: 'draft',
                publishedAt: null,
                createdAt: new Date()
            };

            mockPrisma.post.update.mockResolvedValue(mockUpdatedPost);

            const result = await blogService.update('1', updateData);

            expect(mockPrisma.post.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    ...updateData,
                    slug: 'updated-title'
                },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockUpdatedPost);
        });

        it('should set publishedAt when publishing draft post', async () => {
            const updateData = {
                status: 'published' as const
            };

            mockPrisma.post.update.mockResolvedValue({
                id: '1',
                status: 'published',
                publishedAt: new Date()
            });

            await blogService.update('1', updateData);

            expect(mockPrisma.post.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    ...updateData,
                    publishedAt: expect.any(Date)
                },
                select: expect.any(Object)
            });
        });
    });

    describe('findBySlug', () => {
        it('should find post by slug', async () => {
            const mockPost = {
                id: '1',
                slug: 'test-slug',
                title: 'Test Post'
            };

            mockPrisma.post.findUnique.mockResolvedValue(mockPost);

            const result = await blogService.findBySlug('test-slug');

            expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
                where: { slug: 'test-slug' },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockPost);
        });
    });

    describe('getPublishedPosts', () => {
        it('should return only published posts', async () => {
            mockPrisma.post.findMany.mockResolvedValue([]);
            mockPrisma.post.count.mockResolvedValue(0);

            await blogService.getPublishedPosts();

            expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { status: 'published' }
                })
            );
        });
    });
});