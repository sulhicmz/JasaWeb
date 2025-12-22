/**
 * Performance Monitoring Service
 * 
 * Real-time performance monitoring and optimization recommendations
 * for the JasaWeb platform with comprehensive metrics tracking.
 */

export interface PerformanceMetrics {
  bundle: BundleMetrics;
  api: ApiMetrics;
  database: DatabaseMetrics;
  cache: CacheMetrics;
  timestamp: string;
}

export interface BundleMetrics {
  size: number; // KB
  gzippedSize: number; // KB
  chunkCount: number;
  largestChunk: number; // KB
  compressionRatio: number; // decimal
  score: number; // 0-100
}

export interface ApiMetrics {
  averageLatency: number; // ms
  p95Latency: number; // ms
  p99Latency: number; // ms
  errorRate: number; // decimal
  throughput: number; // requests/second
  score: number; // 0-100
}

export interface DatabaseMetrics {
  queryTime: number; // ms
  connectionPool: number; // percentage
  indexUsage: number; // percentage
  slowQueries: number; // count
  score: number; // 0-100
}

export interface CacheMetrics {
  hitRate: number; // decimal
  missRate: number; // decimal
  evictionRate: number; // decimal
  memoryUsage: number; // MB
  score: number; // 0-100
}

export interface PerformanceThresholds {
  bundle: {
    maxSize: number; // KB
    maxChunkSize: number; // KB
    minCompression: number; // decimal
  };
  api: {
    maxLatency: number; // ms
    maxP99Latency: number; // ms
    maxErrorRate: number; // decimal
    minThroughput: number; // req/s
  };
  database: {
    maxQueryTime: number; // ms
    minIndexUsage: number; // decimal
    maxPoolUsage: number; // decimal
  };
  cache: {
    minHitRate: number; // decimal
    maxMemory: number; // MB
  };
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  bundle: {
    maxSize: 250, // KB
    maxChunkSize: 50, // KB
    minCompression: 0.3, // 30%
  },
  api: {
    maxLatency: 100, // ms
    maxP99Latency: 200, // ms
    maxErrorRate: 0.01, // 1%
    minThroughput: 100, // req/s
  },
  database: {
    maxQueryTime: 50, // ms
    minIndexUsage: 0.85, // 85%
    maxPoolUsage: 0.9, // 90%
  },
  cache: {
    minHitRate: 0.85, // 85%
    maxMemory: 100, // MB
  }
};

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;

  constructor(thresholds?: PerformanceThresholds) {
    this.thresholds = thresholds || PERFORMANCE_THRESHOLDS;
  }

  /**
   * Record current performance metrics
   */
  recordMetrics(metrics: Omit<PerformanceMetrics, 'timestamp'>): void {
    const fullMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(fullMetrics);
    
    // Keep only last 100 measurements to prevent memory bloat
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  /**
   * Get latest performance metrics
   */
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Analyze performance and generate recommendations
   */
  analyzePerformance(): {
    overall: {
      score: number;
      status: 'excellent' | 'good' | 'fair' | 'poor';
      trend: 'improving' | 'stable' | 'degrading';
    };
    recommendations: PerformanceRecommendation[];
    alerts: PerformanceAlert[];
  } {
    const latest = this.getLatestMetrics();
    if (!latest) {
      return {
        overall: { score: 0, status: 'poor', trend: 'stable' },
        recommendations: [],
        alerts: []
      };
    }

    const recommendations = this.generateRecommendations(latest);
    const alerts = this.generateAlerts(latest);
    const score = this.calculateOverallScore(latest);
    const trend = this.calculateTrend();

    return {
      overall: {
        score,
        status: this.getPerformanceStatus(score),
        trend
      },
      recommendations,
      alerts
    };
  }

  private generateRecommendations(metrics: PerformanceMetrics): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];

    // Bundle recommendations
    if (metrics.bundle.size > this.thresholds.bundle.maxSize) {
      recommendations.push({
        type: 'bundle',
        priority: 'high',
        title: 'Bundle Size Optimization',
        description: `Bundle size (${metrics.bundle.size}KB) exceeds target (${this.thresholds.bundle.maxSize}KB)`,
        impact: 'high',
        effort: 'medium',
        actions: [
          'Remove unused dependencies',
          'Implement code splitting for large components',
          'Optimize asset delivery with lazy loading'
        ]
      });
    }

    if (metrics.bundle.largestChunk > this.thresholds.bundle.maxChunkSize) {
      recommendations.push({
        type: 'bundle',
        priority: 'medium',
        title: 'Chunk Size Optimization',
        description: `Largest chunk (${metrics.bundle.largestChunk}KB) exceeds optimal size (${this.thresholds.bundle.maxChunkSize}KB)`,
        impact: 'medium',
        effort: 'low',
        actions: [
          'Split large chunks into smaller modules',
          'Review import statements for unused modules',
          'Consider dynamic imports for rarely used features'
        ]
      });
    }

    // API recommendations
    if (metrics.api.averageLatency > this.thresholds.api.maxLatency) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        title: 'API Latency Optimization',
        description: `Average API latency (${metrics.api.averageLatency}ms) exceeds target (${this.thresholds.api.maxLatency}ms)`,
        impact: 'high',
        effort: 'medium',
        actions: [
          'Add database indexes for slow queries',
          'Implement response caching for frequently accessed data',
          'Review and optimize database query patterns'
        ]
      });
    }

    if (metrics.api.errorRate > this.thresholds.api.maxErrorRate) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        title: 'Error Rate Reduction',
        description: `API error rate (${(metrics.api.errorRate * 100).toFixed(2)}%) exceeds target (${this.thresholds.api.maxErrorRate * 100}%)`,
        impact: 'high',
        effort: 'high',
        actions: [
          'Improve error handling and input validation',
          'Implement circuit breaker patterns',
          'Add comprehensive monitoring and alerting'
        ]
      });
    }

    // Database recommendations
    if (metrics.database.queryTime > this.thresholds.database.maxQueryTime) {
      recommendations.push({
        type: 'database',
        priority: 'medium',
        title: 'Database Query Optimization',
        description: `Average query time (${metrics.database.queryTime}ms) exceeds target (${this.thresholds.database.maxQueryTime}ms)`,
        impact: 'medium',
        effort: 'high',
        actions: [
          'Review and optimize slow queries',
          'Add strategic database indexes',
          'Consider query result caching'
        ]
      });
    }

    // Cache recommendations
    if (metrics.cache.hitRate < this.thresholds.cache.minHitRate) {
      recommendations.push({
        type: 'cache',
        priority: 'medium',
        title: 'Cache Hit Rate Improvement',
        description: `Cache hit rate (${(metrics.cache.hitRate * 100).toFixed(1)}%) below target (${this.thresholds.cache.minHitRate * 100}%)`,
        impact: 'medium',
        effort: 'low',
        actions: [
          'Review cache invalidation strategy',
          'Adjust cache TTL settings',
          'Implement cache warming for critical data'
        ]
      });
    }

    return recommendations;
  }

  private generateAlerts(metrics: PerformanceMetrics): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];

    // Critical alerts
    if (metrics.bundle.size > this.thresholds.bundle.maxSize * 1.2) {
      alerts.push({
        level: 'critical',
        type: 'bundle',
        title: 'Bundle Size Critical',
        message: `Bundle size is 20%+ over maximum threshold`,
        timestamp: new Date().toISOString()
      });
    }

    if (metrics.api.errorRate > this.thresholds.api.maxErrorRate * 2) {
      alerts.push({
        level: 'critical',
        type: 'api',
        title: 'High Error Rate',
        message: `Error rate is 2x+ the acceptable threshold`,
        timestamp: new Date().toISOString()
      });
    }

    // Warning alerts
    if (metrics.api.p99Latency > this.thresholds.api.maxP99Latency) {
      alerts.push({
        level: 'warning',
        type: 'api',
        title: 'High P99 Latency',
        message: `99th percentile latency exceeds threshold`,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  }

  private calculateOverallScore(metrics: PerformanceMetrics): number {
    // Weighted scoring: Bundle 30%, API 40%, Database 20%, Cache 10%
    const bundleWeight = 0.3;
    const apiWeight = 0.4;
    const dbWeight = 0.2;
    const cacheWeight = 0.1;

    return Math.round(
      metrics.bundle.score * bundleWeight +
      metrics.api.score * apiWeight +
      metrics.database.score * dbWeight +
      metrics.cache.score * cacheWeight
    );
  }

  private getPerformanceStatus(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  private calculateTrend(): 'improving' | 'stable' | 'degrading' {
    if (this.metrics.length < 3) return 'stable';

    const recent = this.metrics.slice(-3);
    const scores = recent.map(m => this.calculateOverallScore(m));
    
    const trend = scores[2] - scores[0]; // Compare oldest to newest
    const threshold = 2; // Minimum change to be considered a trend

    if (trend > threshold) return 'improving';
    if (trend < -threshold) return 'degrading';
    return 'stable';
  }

  /**
   * Get performance history for dashboard visualization
   */
  getPerformanceHistory(hours: number = 24): PerformanceMetrics[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);

    return this.metrics.filter(m => new Date(m.timestamp) >= cutoff);
  }

  /**
   * Generate performance dashboard data
   */
  generateDashboardData(): {
    current: PerformanceMetrics | null;
    analysis: {
      overall: {
        score: number;
        status: 'excellent' | 'good' | 'fair' | 'poor';
        trend: 'improving' | 'stable' | 'degrading';
      };
      recommendations: PerformanceRecommendation[];
      alerts: PerformanceAlert[];
    };
    history: PerformanceMetrics[];
    healthChecks: HealthCheck[];
  } {
    return {
      current: this.getLatestMetrics(),
      analysis: this.analyzePerformance(),
      history: this.getPerformanceHistory(24),
      healthChecks: this.generateHealthChecks()
    };
  }

  private generateHealthChecks(): HealthCheck[] {
    const latest = this.getLatestMetrics();
    if (!latest) return [];

    const checks: HealthCheck[] = [];

    checks.push({
      name: 'Bundle Size',
      status: latest.bundle.size <= this.thresholds.bundle.maxSize ? 'healthy' : 'warning',
      value: `${latest.bundle.size}KB`,
      threshold: `≤ ${this.thresholds.bundle.maxSize}KB`,
      score: latest.bundle.score
    });

    checks.push({
      name: 'API Latency',
      status: latest.api.averageLatency <= this.thresholds.api.maxLatency ? 'healthy' : 'warning',
      value: `${latest.api.averageLatency}ms`,
      threshold: `≤ ${this.thresholds.api.maxLatency}ms`,
      score: latest.api.score
    });

    checks.push({
      name: 'Database Performance',
      status: latest.database.queryTime <= this.thresholds.database.maxQueryTime ? 'healthy' : 'warning',
      value: `${latest.database.queryTime}ms`,
      threshold: `≤ ${this.thresholds.database.maxQueryTime}ms`,
      score: latest.database.score
    });

    checks.push({
      name: 'Cache Hit Rate',
      status: latest.cache.hitRate >= this.thresholds.cache.minHitRate ? 'healthy' : 'warning',
      value: `${(latest.cache.hitRate * 100).toFixed(1)}%`,
      threshold: `≥ ${this.thresholds.cache.minHitRate * 100}%`,
      score: latest.cache.score
    });

    return checks;
  }
}

export interface PerformanceRecommendation {
  type: 'bundle' | 'api' | 'database' | 'cache';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  actions: string[];
}

export interface PerformanceAlert {
  level: 'info' | 'warning' | 'critical';
  type: 'bundle' | 'api' | 'database' | 'cache';
  title: string;
  message: string;
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  threshold: string;
  score: number;
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();