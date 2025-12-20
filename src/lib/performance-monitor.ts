/**
 * Performance Monitoring Middleware
 * Provides real-time API performance tracking and alerts
 */

interface PerformanceMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  memoryUsage?: number;
  error?: string;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowestRequests: PerformanceMetric[];
  fastestRequests: PerformanceMetric[];
  errorRate: number;
  requestsByEndpoint: Record<string, {
    count: number;
    avgResponseTime: number;
    errorRate: number;
  }>;
  requestsByHour: Record<string, number>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private readonly slowThreshold = 2000; // 2 seconds
  private readonly criticalThreshold = 5000; // 5 seconds

  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log slow requests
    if (metric.responseTime > this.slowThreshold) {
      console.warn(`[PERFORMANCE] Slow request: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }

    // Log critical slow requests
    if (metric.responseTime > this.criticalThreshold) {
      console.error(`[PERFORMANCE] Critical slow request: ${metric.method} ${metric.endpoint} - ${metric.responseTime}ms`);
    }

    // Log errors
    if (metric.error) {
      console.error(`[PERFORMANCE] Error: ${metric.method} ${metric.endpoint} - ${metric.error}`);
    }
  }

  /**
   * Get performance statistics
   */
  public getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowestRequests: [],
        fastestRequests: [],
        errorRate: 0,
        requestsByEndpoint: {},
        requestsByHour: {}
      };
    }

    const totalRequests = this.metrics.length;
    const averageResponseTime = this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Sort by response time
    const sortedMetrics = [...this.metrics].sort((a, b) => b.responseTime - a.responseTime);
    const slowestRequests = sortedMetrics.slice(0, 10);
    const fastestRequests = sortedMetrics.slice(-10).reverse();

    // Group by endpoint
    const requestsByEndpoint: Record<string, any> = {};
    this.metrics.forEach(metric => {
      const key = `${metric.method} ${metric.endpoint}`;
      if (!requestsByEndpoint[key]) {
        requestsByEndpoint[key] = {
          count: 0,
          totalResponseTime: 0,
          errors: 0
        };
      }
      requestsByEndpoint[key].count++;
      requestsByEndpoint[key].totalResponseTime += metric.responseTime;
      if (metric.statusCode >= 400) {
        requestsByEndpoint[key].errors++;
      }
    });

    // Calculate averages and error rates by endpoint
    Object.keys(requestsByEndpoint).forEach(key => {
      const data = requestsByEndpoint[key];
      requestsByEndpoint[key] = {
        count: data.count,
        avgResponseTime: data.totalResponseTime / data.count,
        errorRate: (data.errors / data.count) * 100
      };
    });

    // Group by hour
    const requestsByHour: Record<string, number> = {};
    this.metrics.forEach(metric => {
      const hour = new Date(metric.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      requestsByHour[hour] = (requestsByHour[hour] || 0) + 1;
    });

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      slowestRequests,
      fastestRequests,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsByEndpoint,
      requestsByHour
    };
  }

  /**
   * Check if performance thresholds are exceeded
   */
  public checkThresholds(): {
    alerts: string[];
    warnings: string[];
  } {
    const stats = this.getStats();
    const alerts: string[] = [];
    const warnings: string[] = [];

    // Check overall performance
    if (stats.averageResponseTime > this.criticalThreshold) {
      alerts.push(`Critical: Average response time ${stats.averageResponseTime}ms exceeds ${this.criticalThreshold}ms`);
    } else if (stats.averageResponseTime > this.slowThreshold) {
      warnings.push(`Warning: Average response time ${stats.averageResponseTime}ms exceeds ${this.slowThreshold}ms`);
    }

    // Check error rate
    if (stats.errorRate > 10) {
      alerts.push(`Critical: Error rate ${stats.errorRate}% exceeds 10%`);
    } else if (stats.errorRate > 5) {
      warnings.push(`Warning: Error rate ${stats.errorRate}% exceeds 5%`);
    }

    // Check specific endpoints
    Object.entries(stats.requestsByEndpoint).forEach(([endpoint, data]) => {
      if (data.avgResponseTime > this.criticalThreshold) {
        alerts.push(`Critical: Endpoint ${endpoint} avg response time ${data.avgResponseTime}ms`);
      } else if (data.avgResponseTime > this.slowThreshold) {
        warnings.push(`Warning: Endpoint ${endpoint} avg response time ${data.avgResponseTime}ms`);
      }

      if (data.errorRate > 10) {
        alerts.push(`Critical: Endpoint ${endpoint} error rate ${data.errorRate}%`);
      } else if (data.errorRate > 5) {
        warnings.push(`Warning: Endpoint ${endpoint} error rate ${data.errorRate}%`);
      }
    });

    return { alerts, warnings };
  }

  /**
   * Clear old metrics (older than specified hours)
   */
  public clearOldMetrics(hoursOld: number = 24): void {
    const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
  }
}

/**
 * Middleware function for adding performance monitoring to API routes
 */
export function withPerformanceMonitoring(request: Request, handler: () => Promise<Response>): Promise<Response> {
  return new Promise(async (resolve) => {
    const startTime = performance.now();
    const url = new URL(request.url);
    
    try {
      const response = await handler();
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Record metric
      const metric: PerformanceMetric = {
        endpoint: url.pathname,
        method: request.method,
        statusCode: response.status,
        responseTime,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined
      };

      performanceMonitor.recordMetric(metric);

      // Add performance headers
      response.headers.set('X-Response-Time', `${responseTime}ms`);
      response.headers.set('X-Performance-Monitor', 'tracked');

      resolve(response);
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Record error metric
      const metric: PerformanceMetric = {
        endpoint: url.pathname,
        method: request.method,
        statusCode: 500,
        responseTime,
        timestamp: Date.now(),
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || undefined,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      performanceMonitor.recordMetric(metric);

      // Return error response
      resolve(new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime}ms`,
          'X-Performance-Monitor': 'error'
        }
      }));
    }
  });
}

/**
 * API endpoint for performance stats (admin only)
 */
export async function getPerformanceStats(): Promise<Response> {
  const stats = performanceMonitor.getStats();
  const thresholdChecks = performanceMonitor.checkThresholds();

  return new Response(JSON.stringify({
    ...stats,
    alerts: thresholdChecks.alerts,
    warnings: thresholdChecks.warnings,
    lastUpdated: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Cleanup old metrics periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    performanceMonitor.clearOldMetrics(24); // Keep last 24 hours
  }, 60 * 60 * 1000); // Run every hour
}

export type { PerformanceMetric, PerformanceStats };