/**
 * CMS Service Tests
 * Unit tests for CMS page management functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CmsService } from '@/services/admin/cms';

// Mock Prisma Client
const mockPrisma = {
    page: {
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

describe('CmsService', () => {
    let cmsService: CmsService;

    beforeEach(() => {
        cmsService = new CmsService(mockPrisma as any);
        vi.clearAllMocks();
    });

    describe('list', () => {
        it('should return paginated CMS pages', async () => {
            const mockPages = [
                {
                    id: '1',
                    title: 'Test Page',
                    slug: 'test-page',
                    content: 'Test content',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            mockPrisma.page.findMany.mockResolvedValue(mockPages);
            mockPrisma.page.count.mockResolvedValue(1);

            const result = await cmsService.list({ page: 1, limit: 10 });

            expect(result.items).toEqual(mockPages);
            expect(result.total).toBe(1);
            expect(result.page).toBe(1);
            expect(result.limit).toBe(10);
            expect(result.totalPages).toBe(1);
        });

        it('should search pages by title and content', async () => {
            mockPrisma.page.findMany.mockResolvedValue([]);
            mockPrisma.page.count.mockResolvedValue(0);

            await cmsService.list({ search: 'test' });

            expect(mockPrisma.page.findMany).toHaveBeenCalledWith(
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
        it('should create a new CMS page with slug', async () => {
            const pageData = {
                title: 'Test Page Title',
                content: 'Test content'
            };

            const mockCreatedPage = {
                id: '1',
                title: pageData.title,
                slug: 'test-page-title',
                content: pageData.content,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.page.create.mockResolvedValue(mockCreatedPage);

            const result = await cmsService.create(pageData);

            expect(mockPrisma.page.create).toHaveBeenCalledWith({
                data: {
                    ...pageData,
                    slug: 'test-page-title'
                },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockCreatedPage);
        });

        it('should generate slug from title', async () => {
            const pageData = {
                title: 'Test Page with Special Characters! @#$%',
                content: 'Content'
            };

            mockPrisma.page.create.mockResolvedValue({
                id: '1',
                slug: 'test-page-with-special-characters',
                title: pageData.title
            });

            await cmsService.create(pageData);

            expect(mockPrisma.page.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    slug: 'test-page-with-special-characters-'
                }),
                select: expect.any(Object)
            });
        });
    });

    describe('update', () => {
        it('should update CMS page and regenerate slug if title changed', async () => {
            const updateData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const mockUpdatedPage = {
                id: '1',
                title: updateData.title,
                slug: 'updated-title',
                content: updateData.content,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            mockPrisma.page.update.mockResolvedValue(mockUpdatedPage);

            const result = await cmsService.update('1', updateData);

            expect(mockPrisma.page.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    ...updateData,
                    slug: 'updated-title'
                },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockUpdatedPage);
        });
    });

    describe('findBySlug', () => {
        it('should find page by slug', async () => {
            const mockPage = {
                id: '1',
                slug: 'test-slug',
                title: 'Test Page'
            };

            mockPrisma.page.findUnique.mockResolvedValue(mockPage);

            const result = await cmsService.findBySlug('test-slug');

            expect(mockPrisma.page.findUnique).toHaveBeenCalledWith({
                where: { slug: 'test-slug' },
                select: expect.any(Object)
            });
            expect(result).toEqual(mockPage);
        });
    });

    describe('delete', () => {
        it('should delete page by id', async () => {
            mockPrisma.page.delete.mockResolvedValue(undefined);

            await cmsService.delete('1');

            expect(mockPrisma.page.delete).toHaveBeenCalledWith({
                where: { id: '1' }
            });
        });
    });
});