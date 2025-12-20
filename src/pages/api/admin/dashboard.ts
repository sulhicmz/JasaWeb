/**
 * Admin Dashboard API Endpoint
 * Provides comprehensive statistics for admin dashboard
 * Uses modular service layer for business logic
 */
import type { APIRoute } from 'astro';
import { getPrisma } from '@/lib/prisma';
import { jsonResponse, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import { createAdminService } from '@/services/admin/users';

export const GET: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const prisma = getPrisma(context.locals);
        const adminService = createAdminService(prisma);

        // Get dashboard statistics using service layer
        const stats = await adminService.getDashboardStats();

        return jsonResponse(stats);
    } catch (error) {
        return handleApiError(error);
    }
};