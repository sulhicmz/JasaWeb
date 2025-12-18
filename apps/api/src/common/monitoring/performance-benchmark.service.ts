import { Injectable, Logger } from '@nestjs/common';
import { DatabasePerformanceService } from './database-performance.service';
import { EnhancedCacheService } from '../cache/enhanced-cache.service';

interface BenchmarkResult {
  name: string;
  duration: number;
  operations: number;
  opsPerSecond: number;
  memoryUsage?: number;
  cacheHitRate?: number;
  databaseQueries?: number;
  averageQueryTime?: number;
  timestamp: Date;
}

interface PerformanceBenchmark {
  name: string;
  description: string;
  baseline: BenchmarkResult | null;
  current: BenchmarkResult | null;
  improvement: number; // percentage improvement
  status: 'improved' | 'degraded' | 'stable' | 'baseline';
}

@Injectable()
export class PerformanceBenchmarkService {
  private readonly logger = new Logger(PerformanceBenchmarkService.name);
  private benchmarks: PerformanceBenchmark[] = [];

  constructor(
    private readonly dbPerformance: DatabasePerformanceService,
    private readonly cache: EnhancedCacheService
  ) {}

  async runDashboardBenchmark(
    organizationId: string
  ): Promise<BenchmarkResult> {
    this.logger.log(
      `Running dashboard performance benchmark for org: ${organizationId}`
    );

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Simulate typical dashboard operations
    const operations = [];

    // Test dashboard stats endpoint
    const statsStart = Date.now();
    await this.cache.get(`dashboard:stats:${organizationId}`);
    operations.push({ type: 'cache_get', duration: Date.now() - statsStart });

    // Test project overview
    const projectStart = Date.now();
    await this.cache.get(`dashboard:projects:${organizationId}`);
    operations.push({ type: 'cache_get', duration: Date.now() - projectStart });

    // Test multiple cache operations
    const cacheTests = 10;
    const cacheStart = Date.now();
    for (let i = 0; i < cacheTests; i++) {
      await this.cache.get(`test:${organizationId}:${i}`);
    }
    operations.push({
      type: 'cache_batch',
      duration: Date.now() - cacheStart,
      count: cacheTests,
    });

    const totalDuration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;

    // Get performance metrics
    const cacheStats = this.cache.getStats();
    const dbStats = this.dbPerformance.getPerformanceStats();

    const result: BenchmarkResult = {
      name: 'dashboard_performance',
      duration: totalDuration,
      operations: operations.length,
      opsPerSecond: Math.round((operations.length / totalDuration) * 1000),
      memoryUsage: endMemory - startMemory,
      cacheHitRate:
        cacheStats.hits + cacheStats.misses > 0
          ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
          : 0,
      databaseQueries: dbStats.totalQueries,
      averageQueryTime: dbStats.averageDuration,
      timestamp: new Date(),
    };

    this.logger.log(
      `Dashboard benchmark completed: ${result.opsPerSecond} ops/sec, ${result.cacheHitRate?.toFixed(1)}% cache hit rate`
    );
    return result;
  }

  async runDatabaseBenchmark(): Promise<BenchmarkResult> {
    this.logger.log('Running database performance benchmark');

    const startTime = Date.now();
    const startQueries = this.dbPerformance.getPerformanceStats().totalQueries;

    // Simulate database operations
    const operations = [];

    // Test query pattern analysis
    const analysisStart = Date.now();
    this.dbPerformance.getQueryAnalysis();
    operations.push({
      type: 'query_analysis',
      duration: Date.now() - analysisStart,
    });

    // Test performance alerts
    const alertsStart = Date.now();
    this.dbPerformance.getPerformanceAlerts();
    operations.push({
      type: 'performance_alerts',
      duration: Date.now() - alertsStart,
    });

    // Test metrics retrieval
    const metricsStart = Date.now();
    this.dbPerformance.getPerformanceStats();
    operations.push({
      type: 'metrics_retrieval',
      duration: Date.now() - metricsStart,
    });

    const totalDuration = Date.now() - startTime;
    const endQueries = this.dbPerformance.getPerformanceStats().totalQueries;

    const result: BenchmarkResult = {
      name: 'database_performance',
      duration: totalDuration,
      operations: operations.length,
      opsPerSecond: Math.round((operations.length / totalDuration) * 1000),
      databaseQueries: endQueries - startQueries,
      averageQueryTime:
        this.dbPerformance.getPerformanceStats().averageDuration,
      timestamp: new Date(),
    };

    this.logger.log(
      `Database benchmark completed: ${result.opsPerSecond} ops/sec`
    );
    return result;
  }

  async runCacheBenchmark(): Promise<BenchmarkResult> {
    this.logger.log('Running cache performance benchmark');

    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    // Reset cache stats for clean measurement
    this.cache.resetStats();

    const testKeys = 100;
    const operations = [];

    // Test cache sets
    const setStart = Date.now();
    for (let i = 0; i < testKeys; i++) {
      await this.cache.set(`benchmark:test:${i}`, {
        data: `test-data-${i}`,
        index: i,
      });
    }
    operations.push({
      type: 'cache_set',
      duration: Date.now() - setStart,
      count: testKeys,
    });

    // Test cache gets
    const getStart = Date.now();
    for (let i = 0; i < testKeys; i++) {
      await this.cache.get(`benchmark:test:${i}`);
    }
    operations.push({
      type: 'cache_get',
      duration: Date.now() - getStart,
      count: testKeys,
    });

    // Test cache invalidation
    const invalidateStart = Date.now();
    for (let i = 0; i < 10; i++) {
      await this.cache.del(`benchmark:test:${i}`);
    }
    operations.push({
      type: 'cache_invalidate',
      duration: Date.now() - invalidateStart,
      count: 10,
    });

    const totalDuration = Date.now() - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const cacheStats = this.cache.getStats();

    const result: BenchmarkResult = {
      name: 'cache_performance',
      duration: totalDuration,
      operations: testKeys * 2 + 10, // sets + gets + invalidations
      opsPerSecond: Math.round(((testKeys * 2 + 10) / totalDuration) * 1000),
      memoryUsage: endMemory - startMemory,
      cacheHitRate:
        cacheStats.hits + cacheStats.misses > 0
          ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
          : 0,
      timestamp: new Date(),
    };

    this.logger.log(
      `Cache benchmark completed: ${result.opsPerSecond} ops/sec, ${result.cacheHitRate?.toFixed(1)}% hit rate`
    );
    return result;
  }

  async runFullBenchmark(
    organizationId?: string
  ): Promise<PerformanceBenchmark[]> {
    this.logger.log('Running full performance benchmark suite');

    const results: PerformanceBenchmark[] = [];

    // Run individual benchmarks
    const dashboardResult = await this.runDashboardBenchmark(
      organizationId || 'benchmark-org'
    );
    const databaseResult = await this.runDatabaseBenchmark();
    const cacheResult = await this.runCacheBenchmark();

    // Update or create benchmarks
    results.push(this.updateBenchmark('dashboard', dashboardResult));
    results.push(this.updateBenchmark('database', databaseResult));
    results.push(this.updateBenchmark('cache', cacheResult));

    // Log summary
    const overallImprovement =
      results.reduce((sum, b) => sum + b.improvement, 0) / results.length;
    this.logger.log(
      `Full benchmark completed. Overall improvement: ${overallImprovement.toFixed(1)}%`
    );

    return results;
  }

  getBenchmarkHistory(): PerformanceBenchmark[] {
    return this.benchmarks;
  }

  getBenchmarkSummary(): {
    totalBenchmarks: number;
    averageImprovement: number;
    improvedCount: number;
    degradedCount: number;
    stableCount: number;
    latestRun: Date | null;
  } {
    const totalBenchmarks = this.benchmarks.length;
    const averageImprovement =
      totalBenchmarks > 0
        ? this.benchmarks.reduce((sum, b) => sum + b.improvement, 0) /
          totalBenchmarks
        : 0;

    const improvedCount = this.benchmarks.filter(
      (b) => b.status === 'improved'
    ).length;
    const degradedCount = this.benchmarks.filter(
      (b) => b.status === 'degraded'
    ).length;
    const stableCount = this.benchmarks.filter(
      (b) => b.status === 'stable'
    ).length;

    const latestRun =
      this.benchmarks.length > 0
        ? Math.max(
            ...this.benchmarks.map((b) => b.current?.timestamp?.getTime() || 0)
          )
        : null;

    return {
      totalBenchmarks,
      averageImprovement,
      improvedCount,
      degradedCount,
      stableCount,
      latestRun: latestRun ? new Date(latestRun) : null,
    };
  }

  generatePerformanceReport(): {
    summary: ReturnType<PerformanceBenchmarkService['getBenchmarkSummary']>;
    benchmarks: PerformanceBenchmark[];
    recommendations: string[];
    healthScore: number;
  } {
    const summary = this.getBenchmarkSummary();
    const recommendations = this.generateRecommendations();
    const healthScore = this.calculateHealthScore();

    return {
      summary,
      benchmarks: this.benchmarks,
      recommendations,
      healthScore,
    };
  }

  private updateBenchmark(
    name: string,
    current: BenchmarkResult
  ): PerformanceBenchmark {
    let benchmark = this.benchmarks.find((b) => b.name === name);

    if (!benchmark) {
      benchmark = {
        name,
        description: this.getBenchmarkDescription(name),
        baseline: current,
        current: current,
        improvement: 0,
        status: 'baseline',
      };
      this.benchmarks.push(benchmark);
    } else {
      const previous = benchmark.current;
      benchmark.current = current;

      if (previous) {
        const improvement =
          ((previous.duration - current.duration) / previous.duration) * 100;
        benchmark.improvement = Math.round(improvement * 100) / 100;

        if (benchmark.improvement > 5) {
          benchmark.status = 'improved';
        } else if (benchmark.improvement < -5) {
          benchmark.status = 'degraded';
        } else {
          benchmark.status = 'stable';
        }
      }
    }

    return benchmark;
  }

  private getBenchmarkDescription(name: string): string {
    switch (name) {
      case 'dashboard':
        return 'Dashboard API performance including cache operations and data retrieval';
      case 'database':
        return 'Database query performance and monitoring system efficiency';
      case 'cache':
        return 'Cache service performance including set, get, and invalidation operations';
      default:
        return 'Performance benchmark';
    }
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    this.benchmarks.forEach((benchmark) => {
      if (benchmark.status === 'degraded') {
        recommendations.push(
          `${benchmark.name} performance has degraded by ${Math.abs(benchmark.improvement).toFixed(1)}% - investigate`
        );
      } else if (benchmark.improvement < 10) {
        recommendations.push(
          `${benchmark.name} performance could be optimized further`
        );
      }

      if (
        benchmark.current?.opsPerSecond &&
        benchmark.current.opsPerSecond < 100
      ) {
        recommendations.push(
          `${benchmark.name} operations per second is below optimal target`
        );
      }

      if (
        benchmark.current?.cacheHitRate !== undefined &&
        benchmark.current.cacheHitRate < 80
      ) {
        recommendations.push(
          `Low cache hit rate in ${benchmark.name} - review caching strategy`
        );
      }

      if (
        benchmark.current?.averageQueryTime &&
        benchmark.current.averageQueryTime > 500
      ) {
        recommendations.push(
          `High average query time in ${benchmark.name} - optimize database queries`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable targets');
    }

    return recommendations;
  }

  private calculateHealthScore(): number {
    if (this.benchmarks.length === 0) return 100;

    let totalScore = 0;

    this.benchmarks.forEach((benchmark) => {
      let score = 100;

      // Factor in improvement/degradation
      if (benchmark.status === 'improved') {
        score += Math.min(benchmark.improvement, 20);
      } else if (benchmark.status === 'degraded') {
        score -= Math.min(Math.abs(benchmark.improvement), 30);
      }

      // Factor in operations per second
      if (benchmark.current?.opsPerSecond) {
        if (benchmark.current.opsPerSecond > 500) {
          score += 10;
        } else if (benchmark.current.opsPerSecond < 100) {
          score -= 15;
        }
      }

      // Factor in cache hit rate
      if (benchmark.current?.cacheHitRate) {
        if (benchmark.current.cacheHitRate > 90) {
          score += 10;
        } else if (benchmark.current.cacheHitRate < 70) {
          score -= 10;
        }
      }

      totalScore += Math.max(Math.min(score, 100), 0);
    });

    return Math.round(totalScore / this.benchmarks.length);
  }
}
