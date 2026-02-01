/**
 * Admin Individual Project API Endpoints
 * GET, PUT operations for single project management
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    parseBody 
} from '@/lib/api';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { ProjectService } from '@/services/domain/ProjectService';
import type { UpdateProjectData } from '@/services/domain/ProjectService';

// ==============================================
// GET: Single Project by ID
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
            return errorResponse('Project ID diperlukan');
        }

        const prisma = getPrisma(context.locals);
        const projectService = new ProjectService(prisma);

        // Get project by ID
        const project = await projectService.findById(id);

        if (!project) {
            return errorResponse('Project tidak ditemukan', 404);
        }

        return jsonResponse({ project });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// PUT: Update Project
// ==============================================
export const PUT: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        
        if (!id) {
            return errorResponse('Project ID diperlukan');
        }

        const body = await parseBody<UpdateProjectData & Record<string, unknown>>(context.request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        const prisma = getPrisma(context.locals);
        const projectService = new ProjectService(prisma);

        // Check if project exists first
        const existingProject = await projectService.findById(id);
        if (!existingProject) {
            return errorResponse('Project tidak ditemukan', 404);
        }

        // Validate project type if provided
        if (body.type && !['sekolah', 'berita', 'company'].includes(body.type)) {
            return errorResponse('Tipe project harus "sekolah", "berita", atau "company"');
        }

        // Validate status if provided
        if (body.status && !['pending_payment', 'in_progress', 'review', 'completed'].includes(body.status)) {
            return errorResponse('Status project tidak valid');
        }

        // Validate URL format if provided
        if (body.url !== undefined && body.url && body.url.trim()) {
            try {
                new URL(body.url);
            } catch {
                return errorResponse('Format URL tidak valid');
            }
        }

        // Validate credentials if provided
        if (body.credentials !== undefined && body.credentials !== null) {
            if (typeof body.credentials !== 'object' || Array.isArray(body.credentials)) {
                return errorResponse('Credentials harus berupa object');
            }
        }

        // Update project using service layer
        const project = await projectService.update(id, body);

        return jsonResponse({ 
            message: 'Project berhasil diupdate', 
            project 
        });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// DELETE: Remove Project (Optional - if needed)
// ==============================================
export const DELETE: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        
        if (!id) {
            return errorResponse('Project ID diperlukan');
        }

        const prisma = getPrisma(context.locals);
        const projectService = new ProjectService(prisma);

        // Check if project exists
        const existingProject = await projectService.findById(id);
        if (!existingProject) {
            return errorResponse('Project tidak ditemukan', 404);
        }

        // Check if project has invoices (prevent deletion if exists)
        const invoiceCount = await (prisma as any).invoice.count({
            where: { projectId: id }
        });

        if (invoiceCount > 0) {
            return errorResponse('Tidak dapat menghapus project yang memiliki invoice', 409);
        }

        // Delete project
        await projectService.delete(id);

        return jsonResponse({ 
            message: 'Project berhasil dihapus' 
        });
    } catch (error) {
        return handleApiError(error);
    }
};