import { Injectable, Logger } from '@nestjs/common';

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  params?: unknown[];
  rowCount?: number;
  index?: string[];
}

interface PerformanceStats {
  totalQueries: number;
  averageDuration: number;
  slowQueries: QueryMetrics[];
  recentQueries: QueryMetrics[];
  queryTypes: Record<string, number>;
  topSlowQueries: Array<{ query: string; count: number; avgDuration: number }>;
  lastReset: Date;
}

@Injectable()
export class DatabasePerformanceService {
  private readonly logger = new Logger(DatabasePerformanceService.name);
  private readonly queryMetrics: QueryMetrics[] = [];
  private readonly maxHistorySize = 1000;
  private readonly slowQueryThreshold = 1000; // 1 second
  private stats: PerformanceStats = {
    totalQueries: 0,
    averageDuration: 0,
    slowQueries: [],
    recentQueries: [],
    queryTypes: {},
    topSlowQueries: [],
    lastReset: new Date(),
  };

  constructor() {
    this.startPeriodicCleanup();
  }

  logQuery(
    query: string,
    duration: number,
    params?: unknown[],
    rowCount?: number
  ): void {
    const sanitizedQuery = this.sanitizeQuery(query);

    const metric: QueryMetrics = {
      query: sanitizedQuery,
      duration,
      timestamp: new Date(),
      params: this.sanitizeParams(params),
      rowCount,
    };

    this.addMetric(metric);
    this.updateStats(metric);

    if (duration > this.slowQueryThreshold) {
      this.logger.warn(
        `Slow query detected (${duration}ms): ${sanitizedQuery.substring(0, 200)}...`
      );
    }
  }

  getPerformanceStats(): PerformanceStats {
    return {
      ...this.stats,
      slowQueries: this.stats.slowQueries.slice(0, 10),
      recentQueries: this.stats.recentQueries.slice(0, 20),
    };
  }

  getQueryAnalysis(): {
    patternAnalysis: Record<string, number>;
    recommendations: string[];
    healthScore: number;
  } {
    const patternAnalysis = this.analyzePatterns();
    const recommendations = this.generateRecommendations(patternAnalysis);
    const healthScore = this.calculateHealthScore();

    return {
      patternAnalysis,
      recommendations,
      healthScore,
    };
  }

  resetMetrics(): void {
    this.queryMetrics.length = 0;
    this.stats = {
      totalQueries: 0,
      averageDuration: 0,
      slowQueries: [],
      recentQueries: [],
      queryTypes: {},
      topSlowQueries: [],
      lastReset: new Date(),
    };

    this.logger.log('Database performance metrics reset');
  }

  getPerformanceAlerts(): Array<{
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }> {
    const alerts: Array<{
      level: 'info' | 'warning' | 'error';
      message: string;
      timestamp: Date;
    }> = [];

    const now = new Date();
    const recentSlowQueries = this.stats.slowQueries.filter(
      (q) => now.getTime() - q.timestamp.getTime() < 5 * 60 * 1000
    );

    if (recentSlowQueries.length > 5) {
      alerts.push({
        level: 'error',
        message: `High number of slow queries detected: ${recentSlowQueries.length} in the last 5 minutes`,
        timestamp: now,
      });
    }

    if (this.stats.averageDuration > 500) {
      alerts.push({
        level: 'warning',
        message: `Average query duration is high: ${Math.round(this.stats.averageDuration)}ms`,
        timestamp: now,
      });
    }

    const recentQueries = this.queryMetrics.filter(
      (q) => now.getTime() - q.timestamp.getTime() < 60 * 1000
    );
    if (recentQueries.length > 100) {
      alerts.push({
        level: 'warning',
        message: `High query volume: ${recentQueries.length} queries in the last minute`,
        timestamp: now,
      });
    }

    return alerts;
  }

  private addMetric(metric: QueryMetrics): void {
    this.queryMetrics.push(metric);

    if (this.queryMetrics.length > this.maxHistorySize) {
      this.queryMetrics.splice(
        0,
        this.queryMetrics.length - this.maxHistorySize
      );
    }
  }

  private updateStats(metric: QueryMetrics): void {
    this.stats.totalQueries++;

    this.stats.averageDuration =
      (this.stats.averageDuration * (this.stats.totalQueries - 1) +
        metric.duration) /
      this.stats.totalQueries;

    this.stats.recentQueries.unshift(metric);
    if (this.stats.recentQueries.length > 20) {
      this.stats.recentQueries = this.stats.recentQueries.slice(0, 20);
    }

    if (metric.duration > this.slowQueryThreshold) {
      this.stats.slowQueries.unshift(metric);
      if (this.stats.slowQueries.length > 50) {
        this.stats.slowQueries = this.stats.slowQueries.slice(0, 50);
      }
    }

    const queryType = this.extractQueryType(metric.query);
    // Safe property assignment to prevent object injection
    const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);
    // Secure object property access to prevent Object Injection Sink
    if (
      !forbiddenKeys.has(queryType) &&
      typeof queryType === 'string' &&
      queryType in this.stats.queryTypes
    ) {
      const current = this.stats.queryTypes[queryType] || 0;
      this.stats.queryTypes[queryType] = current + 1;
    }
  }

  private sanitizeQuery(query: string): string {
    return query
      .replace(/password\s*=\s*['"][^'"]*['"]/gi, 'password=***')
      .replace(/token\s*=\s*['"][^'"]*['"]/gi, 'token=***')
      .replace(/secret\s*=\s*['"][^'"]*['"]/gi, 'secret=***')
      .substring(0, 500);
  }

  private sanitizeParams(params?: unknown[]): unknown[] | undefined {
    if (!params) return undefined;

    return params.map((param) => {
      if (typeof param === 'object' && param !== null) {
        return JSON.stringify(param)
          .replace(/password['":\s]*['"][^'"]*['"]/gi, 'password:***')
          .replace(/token['":\s]*['"][^'"]*['"]/gi, 'token:***');
      }
      return param;
    });
  }

  private extractQueryType(query: string): string {
    if (query.includes('SELECT') || query.includes('find')) return 'SELECT';
    if (query.includes('INSERT') || query.includes('create')) return 'INSERT';
    if (query.includes('UPDATE')) return 'UPDATE';
    if (query.includes('DELETE') || query.includes('remove')) return 'DELETE';
    if (query.includes('COUNT')) return 'COUNT';
    if (query.includes('GROUP')) return 'AGGREGATE';
    return 'OTHER';
  }

  private analyzePatterns(): Record<string, number> {
    const patterns: Record<string, number> = {};

    this.queryMetrics.forEach((metric) => {
      const operation = this.extractOperation(metric.query);
      // Safe property assignment to prevent object injection
      const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);
      // Secure property access to prevent Object Injection Sink
      if (!forbiddenKeys.has(operation) && typeof operation === 'string') {
        const current = Object.prototype.hasOwnProperty.call(
          patterns,
          operation
        )
          ? (patterns[operation] as number)
          : 0;
        patterns[operation] = current + 1;
      }

      const tables = this.extractTables(metric.query);
      tables.forEach((table) => {
        // Validate table name to prevent injection
        if (
          /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table) &&
          !forbiddenKeys.has(table) &&
          typeof table === 'string'
        ) {
          const key = `table:${table}`;
          const current = Object.prototype.hasOwnProperty.call(patterns, key)
            ? (patterns[key] as number)
            : 0;
          patterns[key] = current + 1;
        }
      });
    });

    return patterns;
  }

  private generateRecommendations(patterns: Record<string, number>): string[] {
    const recommendations: string[] = [];

    const reads = patterns['SELECT'] || 0;
    const writes =
      (patterns['INSERT'] || 0) +
      (patterns['UPDATE'] || 0) +
      (patterns['DELETE'] || 0);

    if (writes > reads * 0.5) {
      recommendations.push(
        'Consider implementing batching for write operations'
      );
    }

    Object.entries(patterns).forEach(([key, count]) => {
      if (key.startsWith('table:') && count > 100) {
        const table = key.replace('table:', '');
        recommendations.push(
          `Table '${table}' has high query frequency - ensure proper indexing`
        );
      }
    });

    const recentQueries = this.queryMetrics.slice(-50);
    const similarQueries = this.groupSimilarQueries(recentQueries);

    Object.entries(similarQueries).forEach(([pattern, queries]) => {
      if (queries.length > 5) {
        recommendations.push(
          `Potential N+1 query pattern detected: ${pattern}`
        );
      }
    });

    const slowSelects = this.stats.slowQueries.filter((q) =>
      q.query.includes('SELECT')
    );
    if (slowSelects.length > 10) {
      recommendations.push(
        'Multiple slow SELECT queries - review database indexes'
      );
    }

    return recommendations;
  }

  private calculateHealthScore(): number {
    let score = 100;

    const slowQueryRatio =
      this.stats.slowQueries.length / Math.max(this.stats.totalQueries, 1);
    score -= Math.min(slowQueryRatio * 30, 30);

    score -= Math.min(this.stats.averageDuration / 100, 20);

    const recentQueries = this.queryMetrics.filter(
      (q) => Date.now() - q.timestamp.getTime() < 60 * 1000
    );
    score -= Math.min(recentQueries.length / 10, 10);

    return Math.max(Math.round(score), 0);
  }

  private extractOperation(query: string): string {
    const match = query.match(/(\w+)\./);
    return match ? match[1] || 'unknown' : 'unknown';
  }

  private extractTables(query: string): string[] {
    const tables: string[] = [];
    const tableRegex = /(?:from|join|into|update)\s+(\w+)/gi;
    let match;

    while ((match = tableRegex.exec(query)) !== null) {
      if (match[1]) {
        tables.push(match[1]);
      }
    }

    return [...new Set(tables)];
  }

  private groupSimilarQueries(
    queries: QueryMetrics[]
  ): Record<string, QueryMetrics[]> {
    const groups: Record<string, QueryMetrics[]> = {};

    queries.forEach((query) => {
      const pattern = query.query
        .replace(/\d+/g, 'N')
        .replace(/['"][^'"]*['"]/g, "'X'")
        .substring(0, 100);

      // Validate pattern to prevent object injection
      const forbiddenKeys = new Set(['__proto__', 'constructor', 'prototype']);
      if (
        !forbiddenKeys.has(pattern) &&
        /^[a-zA-Z0-9'X\s\-_,()]+$/.test(pattern) &&
        typeof pattern === 'string'
      ) {
        // Secure property access to prevent Object Injection Sink
        if (!Object.prototype.hasOwnProperty.call(groups, pattern)) {
          groups[pattern] = [];
        }
        if (groups[pattern]) {
          groups[pattern].push(query);
        }
      }
    });

    return groups;
  }

  private startPeriodicCleanup(): void {
    setInterval(
      () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const initialLength = this.queryMetrics.length;

        this.queryMetrics.splice(
          0,
          this.queryMetrics.findIndex((m) => m.timestamp > oneHourAgo)
        );

        if (this.queryMetrics.length < initialLength) {
          this.logger.debug(
            `Cleaned up ${initialLength - this.queryMetrics.length} old query metrics`
          );
        }
      },
      60 * 60 * 1000
    );
  }
}
