import {
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, Role } from '../common/decorators/roles.decorator';
import { PerformanceMonitoringService } from '../common/services/performance-monitoring.service';
import { DatabaseOptimizationService } from '../common/services/database-optimization.service';
import { EnhancedCacheService } from '../common/services/enhanced-cache.service';
import { PerformanceInterceptor } from '../common/interceptors/performance.interceptor';

@ApiTags('Performance')
@Controller('performance')
@UseGuards(RolesGuard)
@UseInterceptors(PerformanceInterceptor)
export class PerformanceController {
  constructor(
    private readonly performanceService: PerformanceMonitoringService,
    private readonly dbOptimizationService: DatabaseOptimizationService,
    private readonly cacheService: EnhancedCacheService
  ) {}

  @Get('metrics')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getMetrics() {
    const [appMetrics, cacheMetrics, dbMetrics] = await Promise.all([
      this.performanceService.getPerformanceMetrics(),
      this.performanceService.getCacheMetrics(),
      this.dbOptimizationService.getDatabaseMetrics(),
    ]);

    return {
      application: appMetrics,
      cache: cacheMetrics,
      database: dbMetrics,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check performance health' })
  @ApiResponse({ status: 200, description: 'Performance health status' })
  async getPerformanceHealth() {
    const healthCheck =
      await this.performanceService.checkPerformanceThresholds();

    return {
      status: healthCheck.isHealthy ? 'healthy' : 'degraded',
      issues: healthCheck.issues,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database/recommendations')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get database optimization recommendations' })
  @ApiResponse({
    status: 200,
    description: 'Database recommendations retrieved successfully',
  })
  async getDatabaseRecommendations() {
    const [recommendations, slowQueries] = await Promise.all([
      this.dbOptimizationService.getRecommendedIndexes(),
      this.dbOptimizationService.analyzeSlowQueries(),
    ]);

    return {
      indexes: recommendations,
      slowQueries: slowQueries.slowQueries,
      recommendations: slowQueries.recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('cache/stats')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({
    status: 200,
    description: 'Cache statistics retrieved successfully',
  })
  async getCacheStats() {
    const stats = await this.cacheService.getCacheStats();

    return {
      ...stats,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('database/optimize')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run database optimization' })
  @ApiResponse({ status: 200, description: 'Database optimization completed' })
  async optimizeDatabase() {
    await this.dbOptimizationService.optimizeTables();

    return {
      message: 'Database optimization completed',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('database/create-indexes')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create recommended database indexes' })
  @ApiResponse({ status: 200, description: 'Database indexes created' })
  async createRecommendedIndexes() {
    await this.dbOptimizationService.createRecommendedIndexes();

    return {
      message: 'Recommended indexes created',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('cache/clear')
  @Roles(Role.OrgAdmin)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear application cache' })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  async clearCache() {
    await this.performanceService.clearMetrics();

    return {
      message: 'Performance metrics cleared',
      timestamp: new Date().toISOString(),
    };
  }
}
