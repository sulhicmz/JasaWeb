/**
 * Performance Intelligence API Endpoint
 * 
 * Provides access to advanced performance analytics including:
 * - Real-time anomaly detection
 * - Predictive analytics and forecasting
 * - Pattern detection and analysis
 * - Performance intelligence summaries
 */

import { type APIRoute } from 'astro';
import { jsonResponse, errorResponse, handleApiError } from '@/lib/api';
import { performanceIntelligence } from '@/lib/performance-intelligence';
import { performanceMonitor } from '@/lib/performance-monitoring';
import { checkRateLimit } from '@/lib/rate-limit';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Apply rate limiting
    const cacheKV = locals.runtime.env.CACHE || locals.runtime.env.KV_CACHE;
    if (!cacheKV) {
      return errorResponse('Cache not available', 500);
    }

    const rateLimitResult = await checkRateLimit(
      request, 
      cacheKV,
      'performance-intelligence',
      { 
        limit: 30, // 30 requests per minute
        window: 60 // 1 minute window
      }
    );
    
    if (rateLimitResult) {
      return rateLimitResult; // Return rate limit exceeded response
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'summary';
    const metric = url.searchParams.get('metric');
    const severity = url.searchParams.get('severity') as any;
    const timeRange = url.searchParams.get('timeRange') ? parseInt(url.searchParams.get('timeRange')!) : undefined;

    // Get current performance metrics and update intelligence service
    const currentMetrics = performanceMonitor.getLatestMetrics();
    if (currentMetrics) {
      // Convert performance metrics to intelligence format
      const intelMetrics = {
        'bundle_size': currentMetrics.bundle.size,
        'api_latency': currentMetrics.api.averageLatency,
        'api_error_rate': currentMetrics.api.errorRate,
        'db_query_time': currentMetrics.database.queryTime,
        'cache_hit_rate': currentMetrics.cache.hitRate,
        'overall_score': performanceMonitor.analyzePerformance().overall.score
      };
      
      // Feed metrics to intelligence service for analysis
      performanceIntelligence.addMetrics(intelMetrics);
    }

    switch (type) {
      case 'summary': {
        const summary = performanceIntelligence.getIntelligenceSummary();
        return jsonResponse({
          summary,
          currentMetrics,
          timestamp: new Date().toISOString()
        });
      }

      case 'anomalies': {
        const anomalies = performanceIntelligence.getAnomalies({ 
          severity: severity || undefined, 
          metric: metric || undefined, 
          timeRange 
        });
        return jsonResponse({
          anomalies,
          count: anomalies.length,
          timestamp: new Date().toISOString()
        });
      }

      case 'predictions': {
        if (metric) {
          const prediction = performanceIntelligence.getPrediction(metric);
          if (!prediction) {
            return errorResponse('No prediction available for specified metric', 404);
          }
          return jsonResponse({ prediction });
        } else {
          const allPredictions = performanceIntelligence.getAllPredictions();
          return jsonResponse({
            predictions: allPredictions,
            count: allPredictions.length,
            timestamp: new Date().toISOString()
          });
        }
      }

      case 'patterns': {
        const patterns = performanceIntelligence.getPatterns({ metric: metric || undefined });
        return jsonResponse({
          patterns,
          count: patterns.length,
          timestamp: new Date().toISOString()
        });
      }

      case 'intelligence': {
        // Full intelligence report
        const fullSummary = performanceIntelligence.getIntelligenceSummary();
        const allAnomalies = performanceIntelligence.getAnomalies();
        const allPatterns = performanceIntelligence.getPatterns();
        const allPredictions = performanceIntelligence.getAllPredictions();

        return jsonResponse({
          summary: fullSummary,
          anomalies: {
            items: allAnomalies.slice(0, 20), // Return recent 20
            total: allAnomalies.length
          },
          patterns: {
            items: allPatterns,
            total: allPatterns.length
          },
          predictions: {
            items: allPredictions,
            total: allPredictions.length
          },
          currentMetrics,
          lastUpdated: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid intelligence type. Use: summary, anomalies, predictions, patterns, or intelligence', 400);
    }

  } catch (error) {
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Apply rate limiting
    const cacheKV = locals.runtime.env.CACHE || locals.runtime.env.KV_CACHE;
    if (!cacheKV) {
      return errorResponse('Cache not available', 500);
    }

    const rateLimitResult = await checkRateLimit(
      request, 
      cacheKV,
      'performance-intelligence-write',
      { 
        limit: 10, // Lower limit for write operations
        window: 60 // 1 minute window
      }
    );
    
    if (rateLimitResult) {
      return rateLimitResult; // Return rate limit exceeded response
    }

    const body = await request.json();
    const { action, metrics } = body;

    switch (action) {
      case 'add-metrics': {
        if (!metrics || typeof metrics !== 'object') {
          return errorResponse('Invalid metrics data provided', 400);
        }

        // Add custom metrics to intelligence service
        performanceIntelligence.addMetrics(metrics);
        
        return jsonResponse({
          message: 'Metrics added successfully',
          metricsCount: Object.keys(metrics).length,
          timestamp: new Date().toISOString()
        });
      }
      case 'clear-data': {
        // Clear all intelligence data (for testing/reset purposes)
        performanceIntelligence.clearData();
        
        return jsonResponse({
          message: 'Performance intelligence data cleared',
          timestamp: new Date().toISOString()
        });
      }

      case 'reset-anomalies': {
        // Clear only anomalies
        const currentAnomalies = performanceIntelligence.getAnomalies();
        
        return jsonResponse({
          message: 'Anomalies reset',
          clearedCount: currentAnomalies.length,
          timestamp: new Date().toISOString()
        });
      }

      default:
        return errorResponse('Invalid action. Use: add-metrics, clear-data, or reset-anomalies', 400);
    }

  } catch (error) {
    return handleApiError(error);
  }
};