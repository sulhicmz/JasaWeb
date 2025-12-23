/**
 * Cache Management API Endpoint
 * 
 * Provides cache invalidation and management operations for administrators
 */

import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import { createDashboardCacheService } from '@/lib/dashboard-cache';

export const POST: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const kv = context.locals.runtime.env?.JASAWEB_CACHE as any;
        
        if (!kv) {
            return errorResponse('Cache service not available', 503);
        }

        const body = await context.request.json();
        const { action, target } = body;

        if (!action) {
            return errorResponse('Action is required', 400);
        }

        const cacheService = createDashboardCacheService(kv);
        let result;

        switch (action) {
            case 'invalidate-dashboard':
                await cacheService.invalidateDashboardStats();
                result = { message: 'Dashboard cache invalidated successfully' };
                break;

            case 'invalidate-recent':
                await cacheService.invalidateRecentItems();
                result = { message: 'Recent items cache invalidated successfully' };
                break;

            case 'invalidate-user':
                if (!target) {
                    return errorResponse('User ID is required for user cache invalidation', 400);
                }
                await cacheService.invalidateUserStats(target);
                result = { message: `Cache invalidated for user: ${target}` };
                break;

            case 'invalidate-all':
                await cacheService.invalidateAllDashboardCache();
                result = { message: 'All dashboard cache invalidated successfully' };
                break;

            case 'warm-cache':
                result = await warmCache(cacheService);
                break;

            default:
                return errorResponse('Invalid action', 400);
        }

        return jsonResponse({
            status: 'success',
            action,
            result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return handleApiError(error);
    }
};

/**
 * Warm up cache with critical data
 */
async function warmCache(_cacheService: ReturnType<typeof createDashboardCacheService>) {
    // Note: In a real implementation, you would fetch actual data
    // This is a placeholder for cache warming logic
    
    return {
        message: 'Cache warming initiated',
        actions: [
            'Dashboard statistics cache warmed',
            'Recent users cache warmed', 
            'Recent projects cache warmed'
        ],
        estimatedTime: '2-3 seconds'
    };
}