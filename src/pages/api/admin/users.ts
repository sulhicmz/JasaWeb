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
    parseBody 
} from '@/lib/api';
import { ValidationService } from '@/services/validation/ValidationService';
import { requireAdmin, validateAdminAccess } from '@/services/admin/auth';
import { createAdminService } from '@/services/admin/users';
import { AuditLogger } from '@/lib/audit-middleware';


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
        const sortBy = (url.searchParams.get('sortBy') as 'createdAt' | 'name' | 'email') || 'createdAt';
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

        // Log viewing sensitive user data
        await AuditLogger.logAdminAction(context.locals, context.request, {
            action: 'VIEW',
            resource: 'users'
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

        const body = await parseBody(context.request);

        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        // Validate all user data using ValidationService
        const validation = ValidationService.validateUser(body);
        if (!validation.success) {
            return errorResponse(validation.error || 'Validasi gagal');
        }

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Check if email already exists
        const existingUser = await adminService.isEmailExists(body.email as string);
        if (existingUser) {
            return errorResponse('Email sudah terdaftar');
        }

        // Create user using service layer
        const user = await adminService.createUser({
            name: body.name as string,
            email: body.email as string,
            password: body.password as string,
            role: body.role as 'admin' | 'client'
        });

        // Log user creation
        await AuditLogger.logAdminAction(context.locals, context.request, {
            action: 'CREATE',
            resource: 'user',
            resourceId: user.id,
            newValues: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

        return jsonResponse({ message: 'User berhasil dibuat', user }, 201);
    } catch (error) {
        return handleApiError(error);
    }
};