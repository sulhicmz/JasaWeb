import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    parseBody 
} from '@/lib/api';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { CmsService } from '@/services/admin/cms';

// ==============================================
// GET: Get CMS Page by ID
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
            return errorResponse('ID halaman diperlukan', 400);
        }

        const prisma = getPrisma(context.locals);
        const cmsService = new CmsService(prisma);

        const page = await cmsService.findById(id);
        if (!page) {
            return errorResponse('Halaman tidak ditemukan', 404);
        }

        return jsonResponse({ page });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// PUT: Update CMS Page
// ==============================================
export const PUT: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        if (!id) {
            return errorResponse('ID halaman diperlukan', 400);
        }

        const body = await parseBody(context.request);
        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        const prisma = getPrisma(context.locals);
        const cmsService = new CmsService(prisma);

        // Check if page exists
        const existingPage = await cmsService.findById(id);
        if (!existingPage) {
            return errorResponse('Halaman tidak ditemukan', 404);
        }

        // Update page
        const updatedPage = await cmsService.update(id, {
            title: body.title as string,
            content: body.content as string
        });

        return jsonResponse({ 
            message: 'Halaman CMS berhasil diupdate', 
            page: updatedPage 
        });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// DELETE: Delete CMS Page
// ==============================================
export const DELETE: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        if (!id) {
            return errorResponse('ID halaman diperlukan', 400);
        }

        const prisma = getPrisma(context.locals);
        const cmsService = new CmsService(prisma);

        // Check if page exists
        const existingPage = await cmsService.findById(id);
        if (!existingPage) {
            return errorResponse('Halaman tidak ditemukan', 404);
        }

        // Delete page
        await cmsService.delete(id);

        return jsonResponse({ message: 'Halaman CMS berhasil dihapus' });
    } catch (error) {
        return handleApiError(error);
    }
};