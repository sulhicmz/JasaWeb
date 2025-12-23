/**
 * Cache Monitoring API Endpoint
 * 
 * Provides comprehensive cache performance insights including hit rates,
 * memory usage, health status, and optimization recommendations
 */

import type { APIRoute } from 'astro';
import { jsonResponse, handleApiError } from '@/lib/api';
import { requireAdmin } from '@/services/admin/auth';
import { createDashboardCacheService } from '@/lib/dashboard-cache';

export const GET: APIRoute = async (context) => {
    try {
        // Require admin access
        const authError = requireAdmin(context);
        if (authError) return authError;

        const kv = context.locals.runtime.env?.JASAWEB_CACHE as any;
        
        if (!kv) {
            return jsonResponse({
                status: 'warning',
                message: 'Cache service not available',
                cache: null,
                recommendations: ['Configure JASAWEB_CACHE binding to enable caching']
            });
        }

        const cacheService = createDashboardCacheService(kv);
        
        // Get cache health and metrics in parallel
        const [health, metrics] = await Promise.all([
            cacheService.getCacheHealth(),
            cacheService.getCacheMetrics()
        ]);

        // Calculate performance score
        const score = calculateCachePerformanceScore(health, metrics);

        // Generate recommendations
        const recommendations = generateCacheRecommendations(health, metrics);

        return jsonResponse({
            status: 'success',
            cache: {
                health,
                metrics,
                performance: {
                    score,
                    grade: getPerformanceGrade(score),
                    hitRateTarget: 0.85,
                    memoryTarget: 100 // MB
                }
            },
            recommendations,
            configuration: {
                dashboardStatsTTL: 300, // 5 minutes
                recentDataTTL: 180, // 3 minutes
                aggregationTTL: 600, // 10 minutes
                maxMemoryUsage: 100 // MB
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        return handleApiError(error);
    }
};

/**
 * Calculate cache performance score (0-100)
 */
function calculateCachePerformanceScore(
    health: any,
    metrics: any
): number {
    let score = 100;

    // Health status impact
    if (health.status === 'error') score -= 40;
    else if (health.status === 'warning') score -= 20;

    // Cache coverage impact
    const coverageScore = ((health.statsCount + health.recentCount) / 3) * 100;
    score = score * (coverageScore / 100);

    // Memory usage impact
    const memoryUsageRatio = metrics.estimatedMemoryUsage / 100; // 100MB target
    if (memoryUsageRatio > 0.8) score -= 10;
    else if (memoryUsageRatio > 0.6) score -= 5;

    // Recommendations impact
    score -= health.recommendations.length * 5;

    return Math.max(0, Math.round(score));
}

/**
 * Get performance grade from score
 */
function getPerformanceGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    return 'D';
}

/**
 * Generate cache optimization recommendations
 */
function generateCacheRecommendations(
    health: any,
    metrics: any
): string[] {
    const recommendations: string[] = [...health.recommendations];

    // Memory usage recommendations
    if (metrics.estimatedMemoryUsage > 80) {
        recommendations.push('Memory usage is high - consider reducing TTL or implementing cache cleanup');
    }

    // Cache key recommendations
    if (metrics.totalKeys > 100) {
        recommendations.push('High number of cache keys - consider implementing cache grouping or prefix-based cleanup');
    }

    // Coverage recommendations
    if (health.statsCount === 0) {
        recommendations.push('No dashboard statistics cached - implement cache warming for critical queries');
    }

    if (health.recentCount === 0) {
        recommendations.push('No recent items cached - enable recent data caching for better user experience');
    }

    // Performance recommendations
    if (health.status === 'healthy' && metrics.totalKeys > 0) {
        recommendations.push('Cache performance is optimal - consider extending TTL for better hit rates');
    }

    return recommendations;
}