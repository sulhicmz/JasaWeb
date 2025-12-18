import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { setInterval, clearInterval } from 'timers';

export interface ConnectionMetrics {
  activeConnections: number;
  totalConnections: number;
  slowQueries: number;
  averageQueryTime: number;
  lastHealthCheck: Date;
}

interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  timestamp: Date;
  target: string;
}

@Injectable()
export class DatabaseMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseMonitorService.name);
  private healthCheckInterval?: NodeJS.Timeout;
  private metrics: ConnectionMetrics = {
    activeConnections: 0,
    totalConnections: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    lastHealthCheck: new Date(),
  };
  private queryTimes: number[] = [];
  private readonly MAX_QUERY_SAMPLES = 100;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Set up periodic health checks
    this.healthCheckInterval = setInterval(
      () => this.performHealthCheck(),
      30000 // Every 30 seconds
    );

    // Monitor query performance
    const prismaClient = this.prisma as unknown as {
      $on: (event: 'query', callback: (e: PrismaQueryEvent) => void) => void;
    };
    prismaClient.$on('query', (e: PrismaQueryEvent) => {
      this.recordQueryTime(e.duration);

      if (e.duration > 1000) {
        this.metrics.slowQueries++;
        this.logger.warn(
          `Slow query detected: ${e.query.substring(0, 100)}... - Duration: ${e.duration}ms`
        );
      }
    });

    await this.performHealthCheck();
  }

  async onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  private async performHealthCheck() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      this.metrics.lastHealthCheck = new Date();

      if (responseTime > 1000) {
        this.logger.warn(`Database health check slow: ${responseTime}ms`);
      } else {
        this.logger.debug(`Database health check: ${responseTime}ms`);
      }
    } catch (error) {
      this.logger.error('Database health check failed', error);
      throw error;
    }
  }

  private recordQueryTime(duration: number) {
    this.queryTimes.push(duration);

    // Keep only the last N samples
    if (this.queryTimes.length > this.MAX_QUERY_SAMPLES) {
      this.queryTimes.shift();
    }

    // Calculate average
    this.metrics.averageQueryTime =
      this.queryTimes.reduce((sum, time) => sum + time, 0) /
      this.queryTimes.length;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  async getConnectionPoolInfo() {
    try {
      // Get connection information from PostgreSQL
      const result = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `;

      this.metrics.activeConnections = Number(result[0]?.count || 0);
      return this.metrics;
    } catch (error) {
      this.logger.error('Failed to get connection pool info', error);
      return this.metrics;
    }
  }

  async optimizeDatabase() {
    const suggestions: string[] = [];

    // Check for slow queries
    if (this.metrics.slowQueries > 10) {
      suggestions.push(
        'High number of slow queries detected. Consider adding indexes.'
      );
    }

    // Check average query time
    if (this.metrics.averageQueryTime > 500) {
      suggestions.push('High average query time. Consider query optimization.');
    }

    // Check connection count
    const poolInfo = await this.getConnectionPoolInfo();
    if (poolInfo.activeConnections > 80) {
      suggestions.push(
        'High connection count. Consider connection pool tuning.'
      );
    }

    if (suggestions.length > 0) {
      this.logger.warn('Database optimization suggestions:', suggestions);
    }

    return suggestions;
  }
}
