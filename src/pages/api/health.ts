import type { APIRoute } from 'astro';
import { jsonResponse, handleApiError } from '@/lib/api';
import { getEnvironmentInfo } from '@/lib/config';

/**
 * API Health Check & Environment Status
 * Provides system status without exposing sensitive information
 */
export const GET: APIRoute = async () => {
    try {
        // Get safe environment information
        const envInfo = getEnvironmentInfo();

        return jsonResponse({
            status: 'healthy',
            environment: envInfo.environment,
            services: envInfo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return handleApiError(error);
    }
};