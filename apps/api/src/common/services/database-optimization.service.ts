import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface QueryOptimization {
  tableName: string;
  indexName: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  parameters?: any[];
}

@Injectable()
export class DatabaseOptimizationService {
  private readonly logger = new Logger(DatabaseOptimizationService.name);
  private slowQueries: SlowQuery[] = [];

  constructor(private prisma: PrismaService) {}

  /**
   * Get recommended indexes for better performance
   */
  async getRecommendedIndexes(): Promise<QueryOptimization[]> {
    const recommendations: QueryOptimization[] = [];

    // Common query patterns that would benefit from indexes
    const commonQueries = [
      {
        tableName: 'users',
        columns: ['email'],
        type: 'btree' as const,
        reason: 'Frequent user lookups by email for authentication',
      },
      {
        tableName: 'organizations',
        columns: ['tenant_id'],
        type: 'btree' as const,
        reason: 'Multi-tenant queries filter by tenant_id',
      },
      {
        tableName: 'projects',
        columns: ['organization_id', 'status'],
        type: 'btree' as const,
        reason: 'Project listings filtered by organization and status',
      },
      {
        tableName: 'milestones',
        columns: ['project_id', 'due_date'],
        type: 'btree' as const,
        reason: 'Milestone queries by project and date filtering',
      },
      {
        tableName: 'tickets',
        columns: ['project_id', 'status', 'assigned_to'],
        type: 'btree' as const,
        reason: 'Ticket filtering by project, status, and assignee',
      },
      {
        tableName: 'audit_logs',
        columns: ['organization_id', 'created_at'],
        type: 'btree' as const,
        reason: 'Audit log queries by organization and date range',
      },
    ];

    for (const query of commonQueries) {
      const indexExists = await this.checkIndexExists(
        query.tableName,
        query.columns
      );

      if (!indexExists) {
        recommendations.push({
          ...query,
          indexName: `idx_${query.tableName}_${query.columns.join('_')}`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Create recommended indexes
   */
  async createRecommendedIndexes(): Promise<void> {
    const recommendations = await this.getRecommendedIndexes();

    for (const rec of recommendations) {
      try {
        await this.createIndex(rec);
        this.logger.log(`Created index: ${rec.indexName}`);
      } catch (error) {
        this.logger.error(
          `Failed to create index ${rec.indexName}:`,
          error.message
        );
      }
    }
  }

  /**
   * Analyze slow queries
   */
  async analyzeSlowQueries(): Promise<{
    slowQueries: SlowQuery[];
    recommendations: string[];
  }> {
    const recommendations: string[] = [];

    // Analyze collected slow queries
    const queryPatterns = this.groupSlowQueries();

    for (const [pattern, queries] of Object.entries(queryPatterns)) {
      if (queries.length > 5) {
        recommendations.push(
          `Consider optimizing query pattern: ${pattern} (executed ${queries.length} times slowly)`
        );
      }
    }

    return {
      slowQueries: this.slowQueries.slice(-50), // Last 50 slow queries
      recommendations,
    };
  }

  /**
   * Record slow query for analysis
   */
  recordSlowQuery(query: string, duration: number, parameters?: any[]): void {
    if (duration > 1000) {
      // Only record queries taking more than 1 second
      this.slowQueries.push({
        query,
        duration,
        timestamp: new Date(),
        parameters,
      });

      // Keep only last 1000 slow queries
      if (this.slowQueries.length > 1000) {
        this.slowQueries = this.slowQueries.slice(-1000);
      }

      this.logger.warn(
        `Slow query detected (${duration}ms): ${query.substring(0, 100)}...`
      );
    }
  }

  /**
   * Get database performance metrics
   */
  async getDatabaseMetrics(): Promise<{
    connectionCount: number;
    activeConnections: number;
    cacheHitRatio: number;
    indexUsage: Array<{
      tableName: string;
      indexName: string;
      usage: number;
    }>;
  }> {
    try {
      // Get connection stats
      const connectionStats = (await this.prisma.$queryRaw`
        SELECT count(*) as total_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      `) as Array<{ total_connections: bigint }>;

      // Get index usage
      const indexStats = (await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan as usage
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
        LIMIT 20
      `) as Array<{
        schemaname: string;
        tablename: string;
        indexname: string;
        usage: bigint;
      }>;

      return {
        connectionCount: Number(connectionStats[0]?.total_connections || 0),
        activeConnections: Number(connectionStats[0]?.total_connections || 0),
        cacheHitRatio: 0, // Would need additional query to get cache stats
        indexUsage: indexStats.map((stat) => ({
          tableName: stat.tablename,
          indexName: stat.indexname,
          usage: Number(stat.usage),
        })),
      };
    } catch (error) {
      this.logger.error('Failed to get database metrics:', error.message);
      return {
        connectionCount: 0,
        activeConnections: 0,
        cacheHitRatio: 0,
        indexUsage: [],
      };
    }
  }

  /**
   * Optimize database tables
   */
  async optimizeTables(): Promise<void> {
    try {
      // Update table statistics for better query planning
      await this.prisma.$queryRaw`ANALYZE`;
      this.logger.log('Database statistics updated');
    } catch (error) {
      this.logger.error('Failed to optimize database:', error.message);
    }
  }

  private async checkIndexExists(
    tableName: string,
    columns: string[]
  ): Promise<boolean> {
    try {
      const result = (await this.prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM pg_indexes 
        WHERE tablename = ${tableName}
        AND indexdef LIKE ${'%' + columns.join('%') + '%'}
      `) as Array<{ count: bigint }>;

      return Number(result[0]?.count || 0) > 0;
    } catch (error) {
      this.logger.warn(
        `Failed to check index existence for ${tableName}:`,
        error.message
      );
      return false;
    }
  }

  private async createIndex(optimization: QueryOptimization): Promise<void> {
    const indexDefinition = `CREATE INDEX CONCURRENTLY ${optimization.indexName} 
                             ON ${optimization.tableName} (${optimization.columns.join(', ')})`;

    await this.prisma.$executeRawUnsafe(indexDefinition);
  }

  private groupSlowQueries(): Record<string, SlowQuery[]> {
    const patterns: Record<string, SlowQuery[]> = {};

    for (const query of this.slowQueries) {
      // Simple pattern extraction - remove specific IDs and parameters
      const pattern = query.query
        .replace(/\d+/g, '?')
        .replace(/'[^']*'/g, '?')
        .substring(0, 100);

      if (!patterns[pattern]) {
        patterns[pattern] = [];
      }
      patterns[pattern].push(query);
    }

    return patterns;
  }
}
