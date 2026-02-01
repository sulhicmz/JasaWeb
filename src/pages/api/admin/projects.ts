/**
 * Admin Projects API Endpoints
 * Full CRUD operations for project management
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
import { ProjectService } from '@/services/domain/ProjectService';
import type { CreateProjectData, ProjectWithUser } from '@/services/domain/ProjectService';

// ==============================================
// GET: List Projects with Pagination and Filters
// ==============================================
export const GET: APIRoute = async (context) => {
    try {
        // Validate admin access
        const authValidation = validateAdminAccess(context);
        if (!authValidation.isAuthorized) {
            return authValidation.response!;
        }

        const prisma = getPrisma(context.locals);
        const projectService = new ProjectService(prisma);

        // Parse query parameters
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || undefined;
        const status = url.searchParams.get('status') as string || undefined;
        const type = url.searchParams.get('type') as string || undefined;
        const userId = url.searchParams.get('userId') as string || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Validate pagination parameters
        if (page < 1) return errorResponse('Page harus lebih dari 0');
        if (limit < 1 || limit > 100) return errorResponse('Limit harus antara 1-100');

        // Validate sort fields
        const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'status', 'type'];
        if (!allowedSortFields.includes(sortBy)) {
            return errorResponse('Sort field tidak valid');
        }

        // Get projects using service layer
        const result = await projectService.getProjects({
            page,
            limit,
            search,
            status,
            type,
            userId,
            sortBy,
            sortOrder
        });

        return jsonResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// POST: Create New Project
// ==============================================
export const POST: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const body = await parseBody<CreateProjectData & Record<string, unknown>>(context.request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate required fields
        const validationError = validateRequired(body, ['name', 'type', 'userId']);
        if (validationError) {
            return errorResponse(validationError);
        }

        // Validate project type
        if (!['sekolah', 'berita', 'company'].includes(body.type)) {
            return errorResponse('Tipe project harus "sekolah", "berita", atau "company"');
        }

        // Validate optional status
        if (body.status && !['pending_payment', 'in_progress', 'review', 'completed'].includes(body.status)) {
            return errorResponse('Status project tidak valid');
        }

        // Validate URL format if provided
        if (body.url && body.url.trim()) {
            try {
                new URL(body.url);
            } catch {
                return errorResponse('Format URL tidak valid');
            }
        }

        const prisma = getPrisma(context.locals);
        const projectService = new ProjectService(prisma);

        // Create project using service layer
        const project = await projectService.create(body);

        return jsonResponse({ 
            message: 'Project berhasil dibuat', 
            project 
        }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};