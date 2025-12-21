/**
 * Client Projects API
 * GET: List user's projects with pagination
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { parseQuery, createPrismaQuery, createResponse } from '@/services/shared/pagination';

export const GET: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;

        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Parse query parameters using pagination service
        const url = new URL(request.url);
        const query = parseQuery(url, {
            maxLimit: 50,
            defaultSortBy: 'createdAt',
            defaultSortOrder: 'desc',
            allowedSortFields: ['createdAt', 'updatedAt', 'name', 'status', 'type'],
            filters: { userId: user.id }
        });

        const prisma = getPrisma(locals);

        // Add search if provided
        const where = query.filters;
        const whereWithSearch = query.search 
            ? { ...where, name: { contains: query.search, mode: 'insensitive' as const } }
            : where;

        // Create Prisma query with pagination
        const prismaQuery = createPrismaQuery(query.pagination, query.sort, whereWithSearch);

        // Get total count and projects in parallel
        const [total, projects] = await Promise.all([
            prisma.project.count({ where: whereWithSearch }),
            prisma.project.findMany({
                ...prismaQuery,
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    url: true,
                    createdAt: true,
                    updatedAt: true,
                },
            }),
        ]);

        // Create paginated response
        const response = createResponse(projects, total, query.pagination);

        return jsonResponse({
            projects: response.data,
            pagination: response.pagination,
        });
    } catch (error) {
        return handleApiError(error);
    }
};