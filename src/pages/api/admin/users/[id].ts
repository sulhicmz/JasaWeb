/**
 * Admin User Management API Endpoints (PUT/DELETE)
 * Individual user operations by ID
 * Uses modular service layer for business logic
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { 
    jsonResponse, 
    errorResponse, 
    handleApiError, 
    isValidEmail,
    parseBody 
} from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import { createAdminService } from '@/services/admin/users';
import type { UpdateUserData } from '@/services/admin/users';

// ==============================================
// PUT: Update User by ID
// ==============================================
export const PUT: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        
        if (!id) {
            return errorResponse('User ID diperlukan');
        }

        const body = await parseBody<UpdateUserData>(context.request);
        if (!body) {
            return errorResponse('Request body tidak valid');
        }

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Check if user exists
        const existingUser = await adminService.getUserById(id);
        if (!existingUser) {
            return errorResponse('User tidak ditemukan', 404);
        }

        // Validate email if provided
        if (body.email) {
            if (!isValidEmail(body.email)) {
                return errorResponse('Format email tidak valid');
            }

            // Check if email already exists (excluding current user)
            const emailExists = await adminService.isEmailExists(body.email, id);
            if (emailExists) {
                return errorResponse('Email sudah digunakan oleh user lain');
            }
        }

        // Validate role if provided
        if (body.role && !['admin', 'client'].includes(body.role)) {
            return errorResponse('Role harus "admin" atau "client"');
        }

        // Update user using service layer
        const updatedUser = await adminService.updateUser(id, body);

        return jsonResponse({ 
            message: 'User berhasil diupdate', 
            user: updatedUser 
        });
    } catch (error) {
        return handleApiError(error);
    }
};

// ==============================================
// DELETE: Delete User by ID
// ==============================================
export const DELETE: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const { id } = context.params;
        
        if (!id) {
            return errorResponse('User ID diperlukan');
        }

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Check if user exists
        const existingUser = await adminService.getUserById(id);
        if (!existingUser) {
            return errorResponse('User tidak ditemukan', 404);
        }

        // Delete user using service layer
        await adminService.deleteUser(id);

        return jsonResponse({ 
            message: 'User berhasil dihapus' 
        });
    } catch (error) {
        return handleApiError(error);
    }
};