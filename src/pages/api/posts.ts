/**
 * Public Posts API
 * GET: List blog posts with pagination and filtering
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Parse query parameters
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const status = url.searchParams.get('status') as string || 'published';
        const search = url.searchParams.get('search') || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'publishedAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate pagination parameters
        if (page < 1) return errorResponse('Page harus lebih dari 0');
        if (limit < 1 || limit > 50) return errorResponse('Limit harus antara 1-50');

        // Validate sort fields
        const allowedSortFields = ['createdAt', 'publishedAt', 'title'];
        if (!allowedSortFields.includes(sortBy)) {
            return errorResponse('Sort field tidak valid');
        }

        const prisma = getPrisma({} as any);

        // Build where clause
        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Get total count and posts in parallel
        const [total, posts] = await Promise.all([
            prisma.post.count({ where }),
            prisma.post.findMany({
                where,
                orderBy: { [sortBy]: sortOrder },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    featuredImage: true,
                    status: true,
                    publishedAt: true,
                    createdAt: true,
                    // Include snippet of content for preview
                    content: true,
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);

        // Create content snippets for SEO
        const postsWithSnippets = posts.map(post => ({
            ...post,
            content: post.content.length > 200 
                ? post.content.substring(0, 200) + '...' 
                : post.content,
        }));

        const totalPages = Math.ceil(total / limit);

        return jsonResponse({
            posts: postsWithSnippets,
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