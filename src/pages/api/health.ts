import type { APIRoute } from 'astro';
import { jsonResponse, handleApiError } from '@/lib/api';
import { getEnvironmentInfo } from '@/lib/config';
import { MonitoringService } from '@/lib/monitoring';

/**
 * API Health Check & Environment Status
 * Provides comprehensive system status with monitoring integration
 */
export const GET: APIRoute = async ({ locals: _locals }) => {
    try {
        // Get safe environment information
        const envInfo = getEnvironmentInfo();

        // Get comprehensive system health from monitoring service
        const monitoring = MonitoringService.getInstance();
        const systemHealth = await monitoring.getSystemHealth();

        // Determine overall health status
        const isHealthy = 
            systemHealth.database !== 'down' &&
            systemHealth.cache !== 'down' &&
            systemHealth.storage !== 'down' &&
            systemHealth.payment !== 'down' &&
            systemHealth.performance.errorRate < 0.9;

        return jsonResponse({
            status: isHealthy ? 'healthy' : 'unhealthy',
            environment: envInfo.environment,
            services: {
                database: systemHealth.database,
                cache: systemHealth.cache,
                storage: systemHealth.storage,
                payment: systemHealth.payment
            },
            performance: {
                avgResponseTime: Math.round(systemHealth.performance.avgResponseTime),
                errorRate: Math.round(systemHealth.performance.errorRate * 100) / 100,
                throughput: Math.round(systemHealth.performance.throughput * 100) / 100
            },
            timestamp: systemHealth.timestamp.toISOString(),
            uptime: 'running' // Could be enhanced with actual uptime tracking
        });
    } catch (error) {
        // Record health check error
        const monitoring = MonitoringService.getInstance();
        monitoring.recordSecurityEvent('health_check_error', {
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 'critical');

        return handleApiError(error);
    }
};