/**
 * Public Templates API
 * GET: List templates with pagination and filtering
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Parse query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '12');
        const category = url.searchParams.get('category') as string || undefined;
        const search = url.searchParams.get('search') || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate pagination parameters
        if (page < 1) return errorResponse('Page harus lebih dari 0');
        if (limit < 1 || limit > 50) return errorResponse('Limit harus antara 1-50');

        // Validate sort fields
        const allowedSortFields = ['createdAt', 'name', 'category'];
        if (!allowedSortFields.includes(sortBy)) {
            return errorResponse('Sort field tidak valid');
        }

        // Validate category if provided
        if (category && !['sekolah', 'berita', 'company'].includes(category)) {
            return errorResponse('Kategori harus "sekolah", "berita", atau "company"');
        }

        const prisma = getPrisma({} as any);

        // Build where clause
        const where: any = {};
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count and templates in parallel
        const [total, templates] = await Promise.all([
            prisma.template.count({ where }),
            prisma.template.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    imageUrl: true,
                    demoUrl: true,
                    createdAt: true,
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return jsonResponse({
            templates,
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