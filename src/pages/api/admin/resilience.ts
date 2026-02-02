import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { resilienceService } from '@/lib/resilience';
import { checkRateLimit } from '@/lib/rate-limit';

/**
 * Get Resilience Stats API
 * GET: Returns circuit breaker statistics for monitoring
 */
export const GET: APIRoute = async ({ request, locals }) => {
    try {
        // Rate limiting for admin monitoring
        if (locals.runtime?.env?.CACHE) {
            const rateLimitResult = await checkRateLimit(
                request,
                locals.runtime.env.CACHE,
                'resilience-monitoring',
                { limit: 100, window: 60 }
            );
            if (rateLimitResult) {
                return rateLimitResult;
            }
        }

        const midtransState = resilienceService.getCircuitBreakerState('midtrans');
        const midtransStats = resilienceService.getCircuitBreakerStats('midtrans');

        return jsonResponse({
            circuitBreakers: {
                midtrans: {
                    state: midtransState,
                    failureCount: midtransStats?.failureCount || 0,
                },
            },
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Failed to get resilience stats:', error);
        return errorResponse('Failed to get resilience stats', 500);
    }
};

/**
 * Reset Circuit Breaker API
 * POST: Resets circuit breaker state (admin operation)
 */
export const POST: APIRoute = async ({ request, locals }) => {
    try {
        const user = locals.user;
        if (!user || user.role !== 'admin') {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { key } = body as { key?: string };

        if (!key || key !== 'midtrans') {
            return errorResponse('Invalid circuit breaker key', 400);
        }

        resilienceService.resetCircuitBreaker(key);

        return jsonResponse({
            success: true,
            message: `Circuit breaker '${key}' has been reset`,
            key,
            state: resilienceService.getCircuitBreakerState(key),
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('Failed to reset circuit breaker:', error);
        return errorResponse('Failed to reset circuit breaker', 500);
    }
};
