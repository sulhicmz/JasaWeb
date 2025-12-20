/**
 * Admin Users API Endpoints
 * Full CRUD operations for user management
 * Uses modular service layer for business logic
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    validateRequired, 
    isValidEmail,
    parseBody 
} from '@/lib/api';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { createAdminService } from '@/services/admin/users';
import type { CreateUserData } from '@/services/admin/users';

// ==============================================
// GET: List Users with Pagination
// ==============================================
export const GET: APIRoute = async (context) => {
    try {
        // Validate admin access
        const authValidation = validateAdminAccess(context);
        if (!authValidation.isAuthorized) {
            return authValidation.response!;
        }

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Parse query parameters
        const url = new URL(context.request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || undefined;
        const role = url.searchParams.get('role') as 'admin' | 'client' || undefined;
        const sortBy = url.searchParams.get('sortBy') as any || 'createdAt';
        const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

        // Get users using service layer
        const result = await adminService.getUsers({
            page,
            limit,
            search,
            role,
            sortBy,
            sortOrder
        });

        return jsonResponse(result);
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// POST: Create New User
// ==============================================
export const POST: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const body = await parseBody<CreateUserData>(context.request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate required fields
        const validationError = validateRequired(body, ['name', 'email', 'password', 'role']);
        if (validationError) {
            return errorResponse(validationError);
        }

        // Validate email format
        if (!isValidEmail(body.email)) {
            return errorResponse('Format email tidak valid');
        }

        // Validate role
        if (!['admin', 'client'].includes(body.role)) {
            return errorResponse('Role harus "admin" atau "client"');
        }

        // Validate password length
        if (body.password.length < 8) {
            return errorResponse('Password minimal 8 karakter');
        }

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Check if email already exists
        const existingUser = await adminService.isEmailExists(body.email);
        if (existingUser) {
            return errorResponse('Email sudah terdaftar');
        }

        // Create user using service layer
        const user = await adminService.createUser(body);

        return jsonResponse({ message: 'User berhasil dibuat', user }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};