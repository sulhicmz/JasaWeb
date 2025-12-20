import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    parseBody 
} from '@/lib/api';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { BlogService } from '@/services/admin/blog';

// ==============================================
// GET: Get Blog Post by ID
// ==============================================
export const GET: APIRoute = async (context) => {
    try {
        // Validate admin access
        const authValidation = validateAdminAccess(context);
        if (!authValidation.isAuthorized) {
            return authValidation.response!;
        }

        const { id } = context.params;
        if (!id) {
            return errorResponse('ID post diperlukan', 400);
        }

        const prisma = getPrisma(context.locals);
        const blogService = new BlogService(prisma);

        const post = await blogService.findById(id);
        if (!post) {
            return errorResponse('Post tidak ditemukan', 404);
        }

        return jsonResponse({ post });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// PUT: Update Blog Post
// ==============================================
export const PUT: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        if (!id) {
            return errorResponse('ID post diperlukan', 400);
        }

        const body = await parseBody(context.request);
        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate status if provided
        if (body.status && !['draft', 'published'].includes(body.status as string)) {
            return errorResponse('Status harus "draft" atau "published"');
        }

        const prisma = getPrisma(context.locals);
        const blogService = new BlogService(prisma);

        // Check if post exists
        const existingPost = await blogService.findById(id);
        if (!existingPost) {
            return errorResponse('Post tidak ditemukan', 404);
        }

        // Update post
        const updatedPost = await blogService.update(id, {
            title: body.title as string,
            content: body.content as string,
            featuredImage: body.featuredImage as string,
            status: body.status as 'draft' | 'published'
        });

        return jsonResponse({ 
            message: 'Blog post berhasil diupdate', 
            post: updatedPost 
        });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// DELETE: Delete Blog Post
// ==============================================
export const DELETE: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        if (!id) {
            return errorResponse('ID post diperlukan', 400);
        }

        const prisma = getPrisma(context.locals);
        const blogService = new BlogService(prisma);

        // Check if post exists
        const existingPost = await blogService.findById(id);
        if (!existingPost) {
            return errorResponse('Post tidak ditemukan', 404);
        }

        // Delete post
        await blogService.delete(id);

        return jsonResponse({ message: 'Blog post berhasil dihapus' });
    } catch (error) {
        return handleApiError(error);
    }
};