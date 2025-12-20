/**
 * Admin CMS Pages API Endpoints
 * Full CRUD operations for CMS page management
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
import { CmsService } from '@/services/admin/cms';

// ==============================================
// GET: List CMS Pages with Pagination
// ==============================================
export const GET: APIRoute = async (context) => {
    try {
        // Validate admin access
        const authValidation = validateAdminAccess(context);
        if (!authValidation.isAuthorized) {
            return authValidation.response!;
        }

        const prisma = getPrisma(context.locals);
        const cmsService = new CmsService(prisma);

        // Parse query parameters
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || undefined;

        // Validate pagination
        if (page < 1 || limit < 1 || limit > 100) {
            return errorResponse('Page dan limit harus valid', 400);
        }

        const result = await cmsService.list({
            page,
            limit,
            search
        });

        return jsonResponse({
            pages: result.items,
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
// POST: Create New CMS Page
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

        const prisma = getPrisma(context.locals);
        const cmsService = new CmsService(prisma);

        // Create page using service layer
        const page = await cmsService.create({
            title: body.title as string,
            content: body.content as string
        });

        return jsonResponse({ message: 'Halaman CMS berhasil dibuat', page }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};