/**
 * Admin Blog Posts API Endpoints
 * Full CRUD operations for blog post management
 * Uses modular service layer for business logic
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    validateRequired, 
    parseBody 
} from '@/lib/api';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { BlogService } from '@/services/admin/blog';


// ==============================================
// GET: List Blog Posts with Pagination
// ==============================================
export const GET: APIRoute = async (context) => {
    try {
        // Validate admin access
        const authValidation = validateAdminAccess(context);
        if (!authValidation.isAuthorized) {
            return authValidation.response!;
        }

        const prisma = getPrisma(context.locals);
        const blogService = new BlogService(prisma);

        // Parse query parameters
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || undefined;
        const status = url.searchParams.get('status') || undefined;

        // Validate pagination
        if (page < 1 || limit < 1 || limit > 100) {
            return errorResponse('Page dan limit harus valid', 400);
        }

        const result = await blogService.list({
            page,
            limit,
            search,
            filters: status ? { status } : undefined
        });

        return jsonResponse({
            posts: result.items,
            pagination: {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }
        });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// POST: Create New Blog Post
// ==============================================
export const POST: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const body = await parseBody(context.request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate required fields
        const validationError = validateRequired(body, ['title', 'content']);
        if (validationError) {
            return errorResponse(validationError);
        }

        // Validate status if provided
        if (body.status && !['draft', 'published'].includes(body.status as string)) {
            return errorResponse('Status harus "draft" atau "published"');
        }

        const prisma = getPrisma(context.locals);
        const blogService = new BlogService(prisma);

        // Create post using service layer
        const post = await blogService.create({
            title: body.title as string,
            content: body.content as string,
            featuredImage: body.featuredImage as string,
            status: body.status as 'draft' | 'published'
        });

        return jsonResponse({ message: 'Blog post berhasil dibuat', post }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};