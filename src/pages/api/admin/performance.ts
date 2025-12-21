/**
 * Performance Monitoring API Endpoint
 * Provides comprehensive performance insights including bundle analysis,
 * API performance metrics, and optimization recommendations
 */

import type { APIRoute } from 'astro';
import { jsonResponse, errorResponse } from '@/lib/api';
import { enhancedPerformanceMonitor } from '@/lib/bundle-analyzer';
import { performanceMonitor } from '@/lib/performance-monitor';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'comprehensive';

    switch (type) {
      case 'comprehensive': {
        const comprehensiveReport = enhancedPerformanceMonitor.getComprehensiveReport();
        const apiStats = performanceMonitor.getStats();
        
        return jsonResponse({
          summary: {
            overallScore: comprehensiveReport.overall.score,
            status: comprehensiveReport.overall.status,
            bundleSize: comprehensiveReport.bundle?.summary?.totalSize || 0,
            bundleScore: comprehensiveReport.bundle?.score || 0,
            apiScore: apiStats.averageResponseTime ? Math.max(0, 100 - apiStats.averageResponseTime) : 100,
            recommendationsCount: comprehensiveReport.overall.recommendations.length,
            lastUpdated: new Date().toISOString()
          },
          bundle: comprehensiveReport.bundle,
          api: {
            ...apiStats,
            score: apiStats.averageResponseTime ? Math.max(0, 100 - apiStats.averageResponseTime) : 100
          },
          recommendations: comprehensiveReport.overall.recommendations,
          thresholds: {
            maxBundleSize: 250, // KB
            maxApiLatency: 100, // ms
            targetScore: 90
          }
        });
      }

      case 'bundle': {
        const bundleReport = enhancedPerformanceMonitor.getComprehensiveReport();
        return jsonResponse({
          bundle: bundleReport.bundle,
          recommendations: bundleReport.overall.recommendations.filter(r => r.type === 'bundle')
        });
      }

      case 'validation': {
        const validation = enhancedPerformanceMonitor.validateBuildPerformance();
        return jsonResponse({
          validation,
          timestamp: new Date().toISOString()
        });
      }

      case 'api': {
        const apiApiStats = performanceMonitor.getStats();
        const thresholdChecks = performanceMonitor.checkThresholds();
        return jsonResponse({
          api: {
            ...apiApiStats,
            alerts: thresholdChecks.alerts,
            warnings: thresholdChecks.warnings,
            score: apiApiStats.averageResponseTime ? Math.max(0, 100 - apiApiStats.averageResponseTime) : 100
          },
          timestamp: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid performance report type', 400);
    }

  } catch (error) {
    console.error('Performance monitoring error:', error);
    return errorResponse('Failed to generate performance report', 500);
  }
};