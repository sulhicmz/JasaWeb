/**
 * Public Pages API
 * GET: List pages or get page by slug
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

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

        // List pages with pagination
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'updatedAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate pagination parameters
        if (page < 1) return errorResponse('Page harus lebih dari 0');
        if (limit < 1 || limit > 50) return errorResponse('Limit harus antara 1-50');

        // Validate sort fields
        const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
        if (!allowedSortFields.includes(sortBy)) {
            return errorResponse('Sort field tidak valid');
        }

        // Build where clause
        const where: any = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count and pages in parallel
        const [total, pages] = await Promise.all([
            prisma.page.count({ where }),
            prisma.page.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    updatedAt: true,
                    // Exclude content from list for performance
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return jsonResponse({
            pages,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        });
    } catch (error) {
        return handleApiError(error);
    }
};