/**
 * Public Templates API
 * GET: List templates with pagination and filtering
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';

import { parseQuery, createPrismaQuery, createResponse, addSearchCondition } from '@/lib/pagination';
import { withCache } from '@/lib/cache';

export const GET: APIRoute = async ({ request, locals }) => {
    return withCache(request, { env: locals.runtime.env }, async () => {
        // Parse query parameters using pagination service
        const url = new URL(request.url);
        const query = parseQuery(url, {
            maxLimit: 50,
            defaultLimit: 12,
            defaultSortBy: 'createdAt',
            defaultSortOrder: 'desc',
            allowedSortFields: ['createdAt', 'name', 'category'],
        });

        // Validate category if provided
        const category = query.filters.category as string | undefined;
        if (category && !['sekolah', 'berita', 'company'].includes(category)) {
            throw new Error('Kategori harus "sekolah", "berita", atau "company"');
        }

        const prisma = getPrisma(locals);

        // Build where clause with search
        let where = { ...query.filters };
        if (query.search) {
            where = addSearchCondition(where, query.search, ['name', 'category']);
        }

        // Create Prisma query with pagination
        const prismaQuery = createPrismaQuery(query.pagination, query.sort, where);

        // Get total count and templates in parallel
        const [total, templates] = await Promise.all([
            prisma.template.count({ where }),
            prisma.template.findMany({
                ...prismaQuery,
                select: {
                    id: true,
                    name: true,
                    category: true,
                    imageUrl: true,
                    demoUrl: true,
                    createdAt: true,
                },
            }),
        ]);

        // Create paginated response
        const response = createResponse(templates, total, query.pagination);

        return {
            templates: response.data,
            pagination: response.pagination,
        };
    }, { ttl: 1800 }); // 30 minutes cache for templates
};