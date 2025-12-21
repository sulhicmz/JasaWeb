/**
 * Public Pages API
 * GET: List pages or get page by slug
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { paginationService } from '@/services/shared/pagination';

export const GET: APIRoute = async ({ url }) => {
    try {
        const prisma = getPrisma({} as any);

        // Check if slug is provided (for single page)
        const slug = url.searchParams.get('slug');
        
        if (slug) {
            // Get single page by slug
            const page = await prisma.page.findUnique({
                where: { slug },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    content: true,
                    updatedAt: true,
                },
            });

            if (!page) {
                return errorResponse('Halaman tidak ditemukan', 404);
            }

            return jsonResponse(page);
        }

        // Parse query parameters using centralized pagination service
        const query = paginationService.parseQuery(url, {
            defaultLimit: 20,
            maxLimit: 50,
            defaultSortBy: 'updatedAt',
            defaultSortOrder: 'desc',
            allowedSortFields: ['createdAt', 'updatedAt', 'title']
        });

        // Validate pagination parameters
        const validation = paginationService.validatePagination(query.pagination);
        if (!validation.isValid) {
            return errorResponse(validation.error!, 400);
        }

        // Build where clause with pagination service helpers
        let where: Record<string, unknown> = {};
        if (query.filters.status) {
            where.status = query.filters.status;
        }

        // Add search condition if provided
        if (query.search) {
            where = paginationService.addSearchCondition(
                where, 
                query.search, 
                ['title', 'content']
            );
        }

        // Create Prisma query with pagination and sorting
        const baseQuery = paginationService.createPrismaQuery(
            query.pagination,
            query.sort,
            where
        );

        // Add selective fields for list performance
        const prismaQuery = {
            ...baseQuery,
            select: {
                id: true,
                title: true,
                slug: true,
                updatedAt: true,
            }
        };

        // Get total count and pages in parallel
        const [total, pages] = await Promise.all([
            prisma.page.count({ where }),
            prisma.page.findMany(prismaQuery),
        ]);

        // Create standardized response
        const result = paginationService.createResponse(pages, total, query.pagination);

        return jsonResponse({
            pages: result.data,
            pagination: result.pagination,
        });
    } catch (error) {
        return handleApiError(error);
    }
};