/**
 * Production Monitoring Service
 * 
 * Comprehensive monitoring and metrics collection for JasaWeb platform.
 * Non-intrusive monitoring that doesn't impact performance.
 */

interface MetricsCollection {
  timestamp: Date;
  type: string;
  data: Record<string, unknown>;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface SystemHealth {
  database: 'healthy' | 'degraded' | 'down';
  cache: 'healthy' | 'degraded' | 'down';
  storage: 'healthy' | 'degraded' | 'down';
  payment: 'healthy' | 'degraded' | 'down';
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
  timestamp: Date;
}

interface PerformanceMetrics {
  apiResponseTime: Record<string, number[]>;
  errorRate: Record<string, number>;
  throughput: {
    requests: number;
    timeframe: number;
  };
  databaseQueries: {
    avgTime: number;
    slowQueries: number;
  };
  timestamp: Date;
}

interface AlertConfig {
  enabled: boolean;
  thresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  channels: Array<'log' | 'kv'>; // Future: slack, email, sms
}

class MonitoringService {
  private static instance: MonitoringService;
  private metrics: MetricsCollection[] = [];
  private maxMetricsAge: number = 24 * 60 * 60 * 1000; // 24 hours
  private alertConfig: AlertConfig = {
    enabled: true,
    thresholds: {
      responseTime: 2000, // 2 seconds
      errorRate: 0.05, // 5%
      throughput: 10 // requests per second
    },
    channels: ['log', 'kv' as const]
  };

  private constructor() {}

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record performance metrics for API endpoint
   */
  recordApiMetrics(endpoint: string, responseTime: number, status: number): void {
    const isError = status >= 400;
    
    this.addMetric({
      timestamp: new Date(),
      type: 'api_performance',
      data: {
        endpoint,
        responseTime,
        status,
        isError,
        method: 'GET' // Could be dynamic
      },
      severity: responseTime > this.alertConfig.thresholds.responseTime ? 'warning' : 'info'
    });

    this.checkAlerts(endpoint, responseTime, isError);
  }

  /**
   * Record database operation metrics
   */
  recordDatabaseMetrics(operation: string, duration: number, success: boolean): void {
    this.addMetric({
      timestamp: new Date(),
      type: 'database_performance',
      data: {
        operation,
        duration,
        success,
        isSlow: duration > 100 // Query is slow if > 100ms
      },
      severity: !success ? 'error' : duration > 100 ? 'warning' : 'info'
    });
  }

  /**
   * Record payment transaction metrics
   */
  recordPaymentMetrics(transactionId: string, amount: number, status: string, provider: 'midtrans'): void {
    this.addMetric({
      timestamp: new Date(),
      type: 'payment_transaction',
      data: {
        transactionId,
        amount,
        status,
        provider,
        isSuccessful: status === 'success' || status === 'paid'
      },
      severity: status === 'success' || status === 'paid' ? 'info' : 'warning'
    });
  }

  /**
   * Record security events for monitoring
   */
  recordSecurityEvent(event: string, details: Record<string, unknown>, severity: 'warning' | 'error' | 'critical'): void {
    this.addMetric({
      timestamp: new Date(),
      type: 'security_event',
      data: {
        event,
        details,
        ipAddress: details.ipAddress || 'unknown'
      },
      severity
    });
  }

  /**
   * Get comprehensive system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const now = new Date();
      const recentMetrics = this.getRecentMetrics(5 * 60 * 1000); // Last 5 minutes
      
      const dbHealth = await this.checkDatabaseHealth();
      const cacheHealth = await this.checkCacheHealth();
      const storageHealth = await this.checkStorageHealth();
      const paymentHealth = await this.checkPaymentHealth();
      const performance = this.calculatePerformanceMetrics(recentMetrics);

      return {
        database: dbHealth,
        cache: cacheHealth,
        storage: storageHealth,
        payment: paymentHealth,
        performance,
        timestamp: now
      };
    } catch (error) {
      this.addMetric({
        timestamp: new Date(),
        type: 'system_error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        severity: 'critical'
      });

      return this.getFallbackHealth();
    }
  }

  /**
   * Get performance metrics for dashboard
   */
  getPerformanceMetrics(timeframe: number = 60 * 60 * 1000): PerformanceMetrics {
    const recentMetrics = this.getRecentMetrics(timeframe);
    const apiMetrics = recentMetrics.filter(m => m.type === 'api_performance');
    const dbMetrics = recentMetrics.filter(m => m.type === 'database_performance');

    const apiResponseTime: Record<string, number[]> = {};
    const errorRate: Record<string, number> = {};

    // Calculate API metrics
    apiMetrics.forEach(metric => {
      const data = metric.data as { endpoint: string; responseTime: number; isError: boolean };
      if (!apiResponseTime[data.endpoint]) {
        apiResponseTime[data.endpoint] = [];
      }
      apiResponseTime[data.endpoint].push(data.responseTime);

      // Calculate error rate per endpoint
      if (!errorRate[data.endpoint]) {
        errorRate[data.endpoint] = 0;
      }
      // Simple error rate calculation
      if (data.isError) {
        errorRate[data.endpoint] += 1;
      }
    });

    // Convert to percentages
    Object.keys(errorRate).forEach(endpoint => {
      const endpointMetrics = apiMetrics.filter(m => 
        (m.data as { endpoint: string }).endpoint === endpoint
      );
      const totalRequests = endpointMetrics.length;
      if (totalRequests > 0) {
        errorRate[endpoint] = errorRate[endpoint] / totalRequests;
      }
    });

    // Database metrics
    const dbDurations = dbMetrics.map(m => (m.data as { duration: number }).duration);
    const avgDbTime = dbDurations.length > 0 ? dbDurations.reduce((a, b) => a + b) / dbDurations.length : 0;
    const slowQueries = dbMetrics.filter(m => (m.data as { isSlow: boolean }).isSlow).length;

    return {
      apiResponseTime,
      errorRate,
      throughput: {
        requests: apiMetrics.length,
        timeframe: timeframe / 1000 // in seconds
      },
      databaseQueries: {
        avgTime: avgDbTime,
        slowQueries
      },
      timestamp: new Date()
    };
  }

  /**
   * Clear old metrics to prevent memory leaks
   */
  cleanup(): void {
    const cutoffTime = Date.now() - this.maxMetricsAge;
    this.metrics = this.metrics.filter(metric => 
      metric.timestamp.getTime() > cutoffTime
    );
  }

  private addMetric(metric: MetricsCollection): void {
    this.metrics.push(metric);
    
    // Cleanup periodically
    if (this.metrics.length % 100 === 0) {
      this.cleanup();
    }
  }

  private getRecentMetrics(timeframe: number): MetricsCollection[] {
    const cutoffTime = Date.now() - timeframe;
    return this.metrics.filter(metric => 
      metric.timestamp.getTime() > cutoffTime
    );
  }

  private async checkDatabaseHealth(): Promise<SystemHealth['database']> {
    try {
      // Simple ping check - implement based on your database client
      // For now, return healthy if we have recent successful DB metrics
      const recentDbMetrics = this.getRecentMetrics(60 * 1000)
        .filter(m => m.type === 'database_performance');
      
      const successRate = recentDbMetrics.length > 0 
        ? recentDbMetrics.filter(m => m.data.success as boolean).length / recentDbMetrics.length
        : 1.0;

      if (successRate >= 0.95) return 'healthy';
      if (successRate >= 0.8) return 'degraded';
      return 'down';
    } catch {
      return 'down';
    }
  }

  private async checkCacheHealth(): Promise<SystemHealth['cache']> {
    // Implement KV health check - for now always return healthy
    // TODO: Add actual KV health check logic when needed
    return 'healthy';
  }

  private async checkStorageHealth(): Promise<SystemHealth['storage']> {
    // Implement R2 storage health check
    return 'healthy';
  }

  private async checkPaymentHealth(): Promise<SystemHealth['payment']> {
    try {
      const recentPaymentMetrics = this.getRecentMetrics(5 * 60 * 1000)
        .filter(m => m.type === 'payment_transaction');
      
      if (recentPaymentMetrics.length === 0) return 'healthy';
      
      const successRate = recentPaymentMetrics.filter(m => 
        m.data.isSuccessful as boolean
      ).length / recentPaymentMetrics.length;

      if (successRate >= 0.9) return 'healthy';
      if (successRate >= 0.7) return 'degraded';
      return 'down';
    } catch {
      return 'down';
    }
  }

  private calculatePerformanceMetrics(metrics: MetricsCollection[]): SystemHealth['performance'] {
    const apiMetrics = metrics.filter(m => m.type === 'api_performance');
    const errorMetrics = apiMetrics.filter(m => m.data.isError as boolean);
    
    const avgResponseTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + (m.data.responseTime as number), 0) / apiMetrics.length
      : 0;

    const errorRate = apiMetrics.length > 0
      ? errorMetrics.length / apiMetrics.length
      : 0;

    const throughput = apiMetrics.length / 300; // 5 minutes = 300 seconds

    return {
      avgResponseTime,
      errorRate,
      throughput
    };
  }

  private getFallbackHealth(): SystemHealth {
    return {
      database: 'down',
      cache: 'down',
      storage: 'down',
      payment: 'down',
      performance: {
        avgResponseTime: 0,
        errorRate: 1.0,
        throughput: 0
      },
      timestamp: new Date()
    };
  }

  private checkAlerts(endpoint: string, responseTime: number, isError: boolean): void {
    if (!this.alertConfig.enabled) return;

    // Response time alert
    if (responseTime > this.alertConfig.thresholds.responseTime) {
      this.triggerAlert('response_time', {
        endpoint,
        responseTime,
        threshold: this.alertConfig.thresholds.responseTime
      }, 'warning');
    }

    // Error rate alerts would be calculated over time window
    // This is a simplified implementation
    if (isError) {
      this.triggerAlert('api_error', {
        endpoint,
        responseTime
      }, 'error');
    }
  }

  private triggerAlert(type: string, data: Record<string, unknown>, severity: 'warning' | 'error' | 'critical'): void {
    this.addMetric({
      timestamp: new Date(),
      type: 'alert',
      data: {
        alertType: type,
        ...data
      },
      severity
    });

    // Send to configured channels
    if ((this.alertConfig.channels as string[]).includes('log')) {
      console.warn(`[ALERT] ${type}:`, data);
    }

    // Future: Implement KV, Slack, email, SMS notifications
  }
}

export { MonitoringService, type MetricsCollection, type SystemHealth, type PerformanceMetrics, type AlertConfig };