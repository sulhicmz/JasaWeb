import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  memoryUsage: NodeJS.MemoryUsage;
  timestamp: Date;
  endpoint?: string;
  method?: string;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private metrics: PerformanceMetrics[] = [];
  private cacheMetrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    totalRequests: 0,
  };

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async recordRequestMetric(
    endpoint: string,
    method: string,
    responseTime: number,
    cacheHit: boolean
  ): Promise<void> {
    const metric: PerformanceMetrics = {
      responseTime,
      cacheHitRate: this.cacheMetrics.hitRate,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date(),
      endpoint,
      method,
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Update cache metrics
    this.cacheMetrics.totalRequests++;
    if (cacheHit) {
      this.cacheMetrics.hits++;
    } else {
      this.cacheMetrics.misses++;
    }
    this.cacheMetrics.hitRate =
      this.cacheMetrics.hits / this.cacheMetrics.totalRequests;

    // Log slow requests
    if (responseTime > 1000) {
      this.logger.warn(
        `Slow request detected: ${method} ${endpoint} - ${responseTime}ms`
      );
    }
  }

  async getPerformanceMetrics(): Promise<{
    averageResponseTime: number;
    p95ResponseTime: number;
    cacheHitRate: number;
    memoryUsage: NodeJS.MemoryUsage;
    totalRequests: number;
  }> {
    if (this.metrics.length === 0) {
      return {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        cacheHitRate: 0,
        memoryUsage: process.memoryUsage(),
        totalRequests: 0,
      };
    }

    const responseTimes = this.metrics
      .map((m) => m.responseTime)
      .sort((a, b) => a - b);
    const averageResponseTime =
      responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p95ResponseTime = responseTimes[p95Index] || 0;

    return {
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime: Math.round(p95ResponseTime),
      cacheHitRate: Math.round(this.cacheMetrics.hitRate * 100) / 100,
      memoryUsage: process.memoryUsage(),
      totalRequests: this.metrics.length,
    };
  }

  async getCacheMetrics(): Promise<CacheMetrics> {
    return { ...this.cacheMetrics };
  }

  async clearMetrics(): Promise<void> {
    this.metrics = [];
    this.cacheMetrics = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalRequests: 0,
    };
  }

  async checkPerformanceThresholds(): Promise<{
    isHealthy: boolean;
    issues: string[];
  }> {
    const metrics = await this.getPerformanceMetrics();
    const issues: string[] = [];

    // Check response time thresholds
    if (metrics.averageResponseTime > 500) {
      issues.push(
        `Average response time (${metrics.averageResponseTime}ms) exceeds threshold (500ms)`
      );
    }

    if (metrics.p95ResponseTime > 2000) {
      issues.push(
        `P95 response time (${metrics.p95ResponseTime}ms) exceeds threshold (2000ms)`
      );
    }

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.5 && metrics.totalRequests > 100) {
      issues.push(
        `Cache hit rate (${(metrics.cacheHitRate * 100).toFixed(1)}%) below threshold (50%)`
      );
    }

    // Check memory usage
    const memoryUsageMB = metrics.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      issues.push(
        `Memory usage (${memoryUsageMB.toFixed(1)}MB) exceeds threshold (500MB)`
      );
    }

    return {
      isHealthy: issues.length === 0,
      issues,
    };
  }
}
