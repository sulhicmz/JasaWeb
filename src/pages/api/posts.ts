/**
 * Public Posts API
 * GET: List blog posts with pagination and filtering
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, handleApiError } from '@/lib/api';
import { parseQuery, createPrismaQuery, createResponse, addSearchCondition } from '@/services/shared/pagination';

export const GET: APIRoute = async ({ request }) => {
    try {
        // Parse query parameters using pagination service
        const url = new URL(request.url);
        const query = parseQuery(url, {
            maxLimit: 50,
            defaultSortBy: 'publishedAt',
            defaultSortOrder: 'desc',
            allowedSortFields: ['createdAt', 'publishedAt', 'title'],
            filters: { status: 'published' },
            search: '' // Default to published posts
        });

        const prisma = getPrisma({} as any);

        // Build where clause with search
        let where = { ...query.filters };
        if (query.search) {
            where = addSearchCondition(where, query.search, ['title', 'content']);
        }

        // Create Prisma query with pagination
        const prismaQuery = createPrismaQuery(query.pagination, query.sort, where);

        // Get total count and posts in parallel
        const [total, posts] = await Promise.all([
            prisma.post.count({ where }),
            prisma.post.findMany({
                ...prismaQuery,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    featuredImage: true,
                    status: true,
                    publishedAt: true,
                    createdAt: true,
                    // Include full content for snippet generation
                    content: true,
                },
            }),
        ]);

        // Create content snippets for SEO
        const postsWithSnippets = posts.map(post => ({
            ...post,
            content: post.content.length > 200 
                ? post.content.substring(0, 200) + '...' 
                : post.content,
        }));

        // Create paginated response
        const response = createResponse(postsWithSnippets, total, query.pagination);

        return jsonResponse({
            posts: response.data,
            pagination: response.pagination,
        });
    } catch (error) {
        return handleApiError(error);
    }
};